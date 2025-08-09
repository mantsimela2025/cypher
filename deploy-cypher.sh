#!/bin/bash

# CYPHER Dashboard Deployment Script for EC2
# This script deploys the CYPHER application on the existing RAS DASH EC2 instance

set -e  # Exit on any error

# Configuration
S3_BUCKET="cypher-deployment-20250806"
APP_DIR="/opt/cypher-dashboard"
BACKUP_DIR="/opt/cypher-dashboard-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/cypher-deployment.log"
API_PORT=3001
CLIENT_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js version (should be >= 18)
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check if PM2 is installed globally
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 globally..."
        npm install -g pm2
    fi
    
    log "Prerequisites check completed successfully"
}

# Backup existing installation
backup_existing() {
    if [[ -d "$APP_DIR" ]]; then
        log "Backing up existing installation to $BACKUP_DIR..."
        cp -r "$APP_DIR" "$BACKUP_DIR"
        log "Backup completed"
    else
        info "No existing installation found, skipping backup"
    fi
}

# Download application from S3
download_application() {
    log "Downloading CYPHER Dashboard from S3..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Download the application files
    aws s3 sync "s3://$S3_BUCKET/cypher-dashboard/" . --delete
    
    if [[ $? -eq 0 ]]; then
        log "Application downloaded successfully"
    else
        error "Failed to download application from S3"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing application dependencies..."
    
    # Install API dependencies
    if [[ -f "$APP_DIR/api/package.json" ]]; then
        log "Installing API dependencies..."
        cd "$APP_DIR/api"
        npm install --production
        
        if [[ $? -eq 0 ]]; then
            log "API dependencies installed successfully"
        else
            error "Failed to install API dependencies"
            exit 1
        fi
    else
        error "API package.json not found"
        exit 1
    fi
    
    # Install Client dependencies
    if [[ -f "$APP_DIR/client/package.json" ]]; then
        log "Installing Client dependencies..."
        cd "$APP_DIR/client"
        npm install
        
        if [[ $? -eq 0 ]]; then
            log "Client dependencies installed successfully"
        else
            error "Failed to install Client dependencies"
            exit 1
        fi
    else
        error "Client package.json not found"
        exit 1
    fi
}

# Configure environment
configure_environment() {
    log "Configuring environment..."
    
    # Create API environment file
    cat > "$APP_DIR/api/.env" << EOF
NODE_ENV=production
PORT=$API_PORT
DB_HOST=rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=rasdashdevo1
DB_USER=rasdashadmin
DB_PASSWORD=RasDash2025\$
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://localhost:$CLIENT_PORT
LOG_LEVEL=info
EOF
    
    # Create client environment file
    cat > "$APP_DIR/client/.env" << EOF
VITE_API_URL=http://localhost:$API_PORT
VITE_APP_NAME=CYPHER Dashboard
NODE_ENV=production
EOF
    
    log "Environment configuration completed"
}

# Build client application
build_client() {
    log "Building client application..."
    
    cd "$APP_DIR/client"
    npm run build
    
    if [[ $? -eq 0 ]]; then
        log "Client build completed successfully"
    else
        error "Failed to build client application"
        exit 1
    fi
}

# Configure PM2
configure_pm2() {
    log "Configuring PM2..."
    
    # Create PM2 ecosystem file
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/src/app.js',
      cwd: '$APP_DIR',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: $API_PORT
      },
      error_file: '/var/log/cypher-api-error.log',
      out_file: '/var/log/cypher-api-out.log',
      log_file: '/var/log/cypher-api.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    },
    {
      name: 'cypher-client',
      script: 'npx',
      args: 'serve -s dist -l $CLIENT_PORT',
      cwd: '$APP_DIR/client',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/cypher-client-error.log',
      out_file: '/var/log/cypher-client-out.log',
      log_file: '/var/log/cypher-client.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M'
    }
  ]
};
EOF
    
    log "PM2 configuration completed"
}

# Start services
start_services() {
    log "Starting CYPHER Dashboard services..."
    
    cd "$APP_DIR"
    
    # Stop any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start the applications
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u root --hp /root
    
    if [[ $? -eq 0 ]]; then
        log "Services started successfully"
    else
        error "Failed to start services"
        exit 1
    fi
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Check if ufw is available
    if command -v ufw &> /dev/null; then
        ufw allow $API_PORT/tcp
        ufw allow $CLIENT_PORT/tcp
        log "Firewall rules added for ports $API_PORT and $CLIENT_PORT"
    else
        warning "UFW not available, please manually configure firewall to allow ports $API_PORT and $CLIENT_PORT"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    sleep 10  # Wait for services to start
    
    # Check API health
    if curl -f "http://localhost:$API_PORT/health" &> /dev/null; then
        log "API health check passed"
    else
        warning "API health check failed - service may still be starting"
    fi
    
    # Check client
    if curl -f "http://localhost:$CLIENT_PORT" &> /dev/null; then
        log "Client health check passed"
    else
        warning "Client health check failed - service may still be starting"
    fi
}

# Main deployment function
main() {
    log "Starting CYPHER Dashboard deployment..."
    
    check_root
    check_prerequisites
    backup_existing
    download_application
    install_dependencies
    configure_environment
    build_client
    configure_pm2
    start_services
    configure_firewall
    health_check
    
    log "CYPHER Dashboard deployment completed successfully!"
    info "API is running on port $API_PORT"
    info "Client is running on port $CLIENT_PORT"
    info "You can access the dashboard at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):$CLIENT_PORT"
    info "PM2 status: pm2 status"
    info "View logs: pm2 logs"
}

# Run main function
main "$@"
