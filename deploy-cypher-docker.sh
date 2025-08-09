#!/bin/bash

# CYPHER Dashboard Docker Deployment Script for Amazon Linux 2
# This script deploys the CYPHER application using Docker to avoid GLIBC issues

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
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker service."
        exit 1
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

# Create Docker files
create_docker_files() {
    log "Creating Docker configuration files..."
    
    # Create API Dockerfile
    cat > "$APP_DIR/api/Dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "src/app.js"]
EOF

    # Create Client Dockerfile
    cat > "$APP_DIR/client/Dockerfile" << 'EOF'
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create nginx configuration for client
    cat > "$APP_DIR/client/nginx.conf" << 'EOF'
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://cypher-api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Create docker-compose.yml
    cat > "$APP_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  cypher-api:
    build: ./api
    container_name: cypher-api
    ports:
      - "$API_PORT:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_NAME=rasdashdevo1
      - DB_USER=rasdashadmin
      - DB_PASSWORD=RasDash2025\$
      - JWT_SECRET=\$(openssl rand -base64 32)
      - CORS_ORIGIN=http://localhost:$CLIENT_PORT
      - LOG_LEVEL=info
    restart: unless-stopped
    networks:
      - cypher-network

  cypher-client:
    build: ./client
    container_name: cypher-client
    ports:
      - "$CLIENT_PORT:3000"
    depends_on:
      - cypher-api
    restart: unless-stopped
    networks:
      - cypher-network

networks:
  cypher-network:
    driver: bridge
EOF

    log "Docker configuration files created"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Verify installation
    docker-compose --version
    
    log "Docker Compose installed successfully"
}

# Build and start containers
start_containers() {
    log "Building and starting Docker containers..."
    
    cd "$APP_DIR"
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start containers
    docker-compose up -d --build
    
    if [[ $? -eq 0 ]]; then
        log "Containers started successfully"
    else
        error "Failed to start containers"
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
    
    sleep 30  # Wait for containers to start
    
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

# Setup auto-start
setup_autostart() {
    log "Setting up auto-start on boot..."
    
    # Create systemd service for docker-compose
    cat > /etc/systemd/system/cypher-dashboard.service << EOF
[Unit]
Description=CYPHER Dashboard
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # Enable the service
    systemctl enable cypher-dashboard.service
    
    log "Auto-start configured"
}

# Main deployment function
main() {
    log "Starting CYPHER Dashboard Docker deployment..."
    
    check_root
    check_prerequisites
    backup_existing
    download_application
    create_docker_files
    install_docker_compose
    start_containers
    configure_firewall
    setup_autostart
    health_check
    
    log "CYPHER Dashboard Docker deployment completed successfully!"
    info "API is running on port $API_PORT"
    info "Client is running on port $CLIENT_PORT"
    info "You can access the dashboard at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):$CLIENT_PORT"
    info "Container status: docker-compose ps"
    info "View logs: docker-compose logs"
}

# Run main function
main "$@"
