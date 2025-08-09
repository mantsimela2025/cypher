#!/bin/bash

# CYPHER Dashboard Installation Script for EC2 Instance
# This script installs and configures the CYPHER Dashboard on the RAS DASH instance

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
APP_DIR="/opt/cypher-dashboard"
SERVICE_USER="cypher"
NGINX_CONF="/etc/nginx/conf.d/cypher-dashboard.conf"

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install system dependencies
install_dependencies() {
    log_step "Installing system dependencies..."
    
    # Update system packages
    yum update -y
    
    # Install Node.js 20.x
    log_info "Installing Node.js 20.x..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
    
    # Install Docker
    log_info "Installing Docker..."
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    
    # Install Docker Compose
    log_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Install Nginx
    log_info "Installing Nginx..."
    yum install -y nginx
    systemctl enable nginx
    
    # Install PostgreSQL client
    log_info "Installing PostgreSQL client..."
    yum install -y postgresql15
    
    # Install other utilities
    yum install -y git htop curl wget unzip
    
    log_info "System dependencies installed successfully"
}

# Create application user
create_app_user() {
    log_step "Creating application user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$APP_DIR" "$SERVICE_USER"
        log_info "Created user: $SERVICE_USER"
    else
        log_info "User $SERVICE_USER already exists"
    fi
    
    # Add service user to docker group
    usermod -aG docker "$SERVICE_USER"
}

# Setup application directory
setup_app_directory() {
    log_step "Setting up application directory..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    
    # Copy application files
    if [[ -d "/home/ec2-user/cypher-dashboard" ]]; then
        log_info "Copying application files..."
        cp -r /home/ec2-user/cypher-dashboard/* "$APP_DIR/"
        
        # Set ownership
        chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
        
        # Set permissions
        chmod +x "$APP_DIR/scripts/aws-deployment/"*.sh
        
        log_info "Application files copied to $APP_DIR"
    else
        log_error "Application files not found at /home/ec2-user/cypher-dashboard"
        log_info "Please ensure you've copied the deployment package to the instance"
        exit 1
    fi
}

# Install Node.js dependencies
install_node_dependencies() {
    log_step "Installing Node.js dependencies..."
    
    cd "$APP_DIR"
    
    # Install API dependencies
    log_info "Installing API dependencies..."
    cd "$APP_DIR/api"
    sudo -u "$SERVICE_USER" npm ci --production
    
    # Install client dependencies and build
    log_info "Installing client dependencies and building..."
    cd "$APP_DIR/client"
    sudo -u "$SERVICE_USER" npm ci
    sudo -u "$SERVICE_USER" npm run build
    
    log_info "Node.js dependencies installed successfully"
}

# Configure environment
configure_environment() {
    log_step "Configuring environment..."
    
    # Copy production environment file
    if [[ -f "$APP_DIR/.env.production" ]]; then
        cp "$APP_DIR/.env.production" "$APP_DIR/api/.env"
        chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/api/.env"
        chmod 600 "$APP_DIR/api/.env"
        log_info "Environment configuration copied"
    else
        log_error "Production environment file not found"
        exit 1
    fi
}

# Configure Nginx
configure_nginx() {
    log_step "Configuring Nginx..."
    
    cat > "$NGINX_CONF" << 'EOF'
# CYPHER Dashboard Nginx Configuration
server {
    listen 80;
    server_name rasdash.dev.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rasdash.dev.com;
    
    # SSL Configuration (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/rasdash.dev.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/rasdash.dev.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Serve static files
    location / {
        root /opt/cypher-dashboard/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF
    
    # Test Nginx configuration
    nginx -t
    
    log_info "Nginx configuration created"
}

# Create systemd service
create_systemd_service() {
    log_step "Creating systemd service..."
    
    cat > /etc/systemd/system/cypher-dashboard.service << EOF
[Unit]
Description=CYPHER Dashboard API Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-dashboard

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable cypher-dashboard
    
    log_info "Systemd service created and enabled"
}

# Test database connection
test_database_connection() {
    log_step "Testing database connection..."
    
    cd "$APP_DIR/api"
    
    # Test connection using the environment variables
    if sudo -u "$SERVICE_USER" node -e "
        require('dotenv').config();
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            } else {
                console.log('Database connection successful:', res.rows[0].now);
                process.exit(0);
            }
        });
    "; then
        log_info "Database connection test passed"
    else
        log_error "Database connection test failed"
        log_info "Please check your database configuration in .env file"
        exit 1
    fi
}

# Start services
start_services() {
    log_step "Starting services..."
    
    # Start the application service
    systemctl start cypher-dashboard
    
    # Start Nginx
    systemctl start nginx
    
    # Check service status
    if systemctl is-active --quiet cypher-dashboard; then
        log_info "CYPHER Dashboard service started successfully"
    else
        log_error "Failed to start CYPHER Dashboard service"
        systemctl status cypher-dashboard
        exit 1
    fi
    
    if systemctl is-active --quiet nginx; then
        log_info "Nginx started successfully"
    else
        log_error "Failed to start Nginx"
        systemctl status nginx
        exit 1
    fi
}

# Main installation function
main() {
    log_info "🚀 Starting CYPHER Dashboard installation on RAS DASH instance"
    
    check_root
    install_dependencies
    create_app_user
    setup_app_directory
    install_node_dependencies
    configure_environment
    configure_nginx
    create_systemd_service
    test_database_connection
    start_services
    
    log_info "✅ CYPHER Dashboard installation completed successfully!"
    log_info ""
    log_info "Services Status:"
    log_info "- CYPHER Dashboard API: $(systemctl is-active cypher-dashboard)"
    log_info "- Nginx: $(systemctl is-active nginx)"
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure SSL certificate:"
    log_info "   sudo ./scripts/aws-deployment/configure-ssl.sh"
    log_info ""
    log_info "2. Update DNS to point to this instance:"
    log_info "   ./scripts/aws-deployment/configure-dns.sh"
    log_info ""
    log_info "3. Test the application:"
    log_info "   curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/health"
}

# Run main function
main "$@"
