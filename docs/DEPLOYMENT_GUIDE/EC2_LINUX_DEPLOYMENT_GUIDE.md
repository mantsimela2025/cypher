# EC2 Linux Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the CYPHER application on AWS EC2 Linux, including optimal Linux distribution selection, Nginx configuration, PM2 process management, and external browser access.

## 📋 Table of Contents

1. [Linux Distribution Selection](#linux-distribution-selection)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [System Dependencies Installation](#system-dependencies-installation)
4. [Node.js & PM2 Installation](#nodejs--pm2-installation)
5. [Nginx Configuration](#nginx-configuration)
6. [GitLab Repository Setup](#gitlab-repository-setup)
7. [Application Deployment](#application-deployment)
8. [SSL/HTTPS Configuration](#sslhttps-configuration)
9. [Process Management & Monitoring](#process-management--monitoring)
10. [Security & Firewall Configuration](#security--firewall-configuration)
11. [Automated Deployment Scripts](#automated-deployment-scripts)
12. [Troubleshooting](#troubleshooting)

## 🐧 Linux Distribution Selection

### **Recommended: Ubuntu 22.04 LTS (Jammy Jellyfish)**

**Why Ubuntu 22.04 LTS:**
- **Long Term Support** - Supported until April 2027
- **Node.js v20.16.0 Compatibility** - Excellent support for latest Node.js
- **Package Management** - APT package manager with extensive repositories
- **Community Support** - Large community and documentation
- **AWS Optimization** - Pre-optimized AMIs available
- **Security Updates** - Regular security patches and updates

**Alternative Options:**
- **Amazon Linux 2023** - AWS-optimized, good for AWS-specific features
- **CentOS Stream 9** - Enterprise-focused, RPM-based
- **Debian 12 (Bookworm)** - Stable, minimal, similar to Ubuntu

### **System Requirements**
```bash
# Minimum Requirements:
- CPU: 2 vCPUs (t3.small or larger)
- RAM: 2GB minimum, 4GB recommended
- Storage: 20GB minimum, 50GB recommended
- Network: Enhanced networking enabled

# Recommended Instance Types:
- t3.medium (2 vCPU, 4GB RAM) - Development/Testing
- t3.large (2 vCPU, 8GB RAM) - Production
- c5.large (2 vCPU, 4GB RAM) - CPU-optimized for high traffic
```

## 🖥️ EC2 Instance Setup

### **1. Launch EC2 Instance**
```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=CYPHER-Linux}]' \
  --region us-east-1

# Or use AWS Console:
# 1. Choose Ubuntu Server 22.04 LTS AMI
# 2. Select t3.medium instance type
# 3. Configure security groups (HTTP, HTTPS, SSH)
# 4. Create or select key pair
# 5. Launch instance
```

### **2. Connect to Instance**
```bash
# Get public IP
aws ec2 describe-instances \
  --instance-ids i-xxxxxxxxxxxxxxxxx \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

### **3. Configure Elastic IP (Optional but Recommended)**
```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc --region us-east-1

# Associate with instance
aws ec2 associate-address \
  --instance-id i-xxxxxxxxxxxxxxxxx \
  --allocation-id eipalloc-xxxxxxxxx \
  --region us-east-1
```

## 📦 System Dependencies Installation

### **1. Essential System Packages**
```bash
# Update package index
sudo apt update

# Install essential packages
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  unzip \
  htop \
  nano \
  vim \
  ufw \
  fail2ban

# Install additional development tools
sudo apt install -y \
  python3 \
  python3-pip \
  gcc \
  g++ \
  make \
  libc6-dev \
  pkg-config
```

### **2. PostgreSQL Client (for database access)**
```bash
# Install PostgreSQL client
sudo apt install -y postgresql-client

# Verify installation
psql --version

# Test connection to RDS
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" -c "SELECT version();"
```

## 🟢 Node.js & PM2 Installation

### **1. Install Node.js v20.16.0 (Recommended Method)**
```bash
# Method 1: Using NodeSource Repository (Recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Method 2: Using Node Version Manager (NVM) - Alternative
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20.16.0
nvm use 20.16.0
nvm alias default 20.16.0
```

### **2. Install PM2 Process Manager**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version

# Configure PM2 startup script
pm2 startup
# Follow the instructions to run the generated command with sudo

# Install PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### **3. Configure PM2 for Production**
```bash
# Set PM2 to start on boot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create PM2 ecosystem file
cat > /home/ubuntu/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/server.js',
      cwd: '/var/www/cypher',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1'
      },
      error_file: '/var/log/cypher/api-error.log',
      out_file: '/var/log/cypher/api-out.log',
      log_file: '/var/log/cypher/api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};
EOF
```

## 🌐 Nginx Configuration

### **1. Install Nginx**
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx

# Test Nginx installation
curl http://localhost
```

### **2. Configure Nginx for CYPHER**
```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create CYPHER site configuration
sudo tee /etc/nginx/sites-available/cypher << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
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
    
    # Root directory for React build
    root /var/www/cypher/client/dist;
    index index.html;
    
    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: Hide Nginx version
    server_tokens off;
    
    # Logs
    access_log /var/log/nginx/cypher_access.log;
    error_log /var/log/nginx/cypher_error.log;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/cypher /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **3. Configure Nginx Security**
```bash
# Create additional security configuration
sudo tee /etc/nginx/conf.d/security.conf << 'EOF'
# Hide Nginx version
server_tokens off;

# Prevent clickjacking
add_header X-Frame-Options SAMEORIGIN;

# Prevent MIME type sniffing
add_header X-Content-Type-Options nosniff;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block";

# HSTS (uncomment when using HTTPS)
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
EOF

# Update main Nginx configuration
sudo tee -a /etc/nginx/nginx.conf << 'EOF'

# Rate limiting for API endpoints
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... other proxy settings
}

# Stricter rate limiting for login
location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    # ... other proxy settings
}
EOF

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## 📦 GitLab Repository Setup

### **1. Configure SSH Keys**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "deployment@cypher-linux" -f ~/.ssh/id_ed25519

# Display public key (add to GitLab)
cat ~/.ssh/id_ed25519.pub

# Test GitLab connection
ssh -T git@gitlab.com
```

### **2. Clone Repository**
```bash
# Create application directory
sudo mkdir -p /var/www/cypher
sudo chown ubuntu:ubuntu /var/www/cypher

# Clone repository
cd /var/www
git clone git@gitlab.com:your-organization/cypher.git cypher

# Set proper permissions
sudo chown -R ubuntu:ubuntu /var/www/cypher
chmod -R 755 /var/www/cypher
```

### **3. Install Dependencies**
```bash
# Navigate to project directory
cd /var/www/cypher

# Install root dependencies
npm install

# Install API dependencies
cd api
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd /var/www/cypher
```

## 🚀 Application Deployment

### **1. Environment Configuration**
```bash
# Create production environment file for API
cat > /var/www/cypher/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=24h

# CORS settings
CORS_ORIGIN=http://YOUR_STATIC_IP

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/cypher/api.log
EOF

# Create production environment file for client
cat > /var/www/cypher/client/.env.production << 'EOF'
VITE_API_BASE_URL=http://YOUR_STATIC_IP/api/v1
VITE_NODE_ENV=production
VITE_APP_NAME=CYPHER
EOF
```

### **2. Build Client Application**
```bash
# Build React client for production
cd /var/www/cypher/client
npm run build

# Verify build
ls -la dist/
# Should show: index.html, assets/, etc.

# Set proper permissions for Nginx
sudo chown -R www-data:www-data /var/www/cypher/client/dist
```

### **3. Create Log Directories**
```bash
# Create log directories
sudo mkdir -p /var/log/cypher
sudo chown ubuntu:ubuntu /var/log/cypher
sudo chmod 755 /var/log/cypher

# Create log rotation configuration
sudo tee /etc/logrotate.d/cypher << 'EOF'
/var/log/cypher/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### **4. Start Application with PM2**
```bash
# Start application using ecosystem file
cd /var/www/cypher
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs cypher-api

# Test API endpoint
curl http://localhost:3001/api/health
```

## 🔒 SSL/HTTPS Configuration

### **1. Install Certbot (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### **2. Update Nginx for HTTPS**
```bash
# Certbot automatically updates Nginx configuration
# Verify HTTPS configuration
sudo nginx -t

# Check SSL certificate
curl -I https://your-domain.com

# Update client environment for HTTPS
cat > /var/www/cypher/client/.env.production << 'EOF'
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_NODE_ENV=production
VITE_APP_NAME=CYPHER
EOF

# Rebuild client
cd /var/www/cypher/client
npm run build
```

## 📊 Process Management & Monitoring

### **1. System Monitoring Setup**
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install Node.js monitoring
sudo npm install -g clinic

# Create monitoring script
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
free -h
df -h
echo "=== PM2 Status ==="
pm2 status
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
echo "=== Recent Logs ==="
tail -n 10 /var/log/cypher/api-combined.log
EOF

chmod +x /home/ubuntu/monitor.sh
```

### **2. Health Check Script**
```bash
# Create comprehensive health check
cat > /home/ubuntu/health-check.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/cypher/health-check.log"
API_URL="http://localhost:3001/api/health"
CLIENT_URL="http://localhost"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check PM2 processes
if ! pm2 status | grep -q "online"; then
    log_message "ERROR: PM2 processes not running"
    pm2 restart all
    exit 1
fi

# Check API health
if ! curl -f -s "$API_URL" > /dev/null; then
    log_message "ERROR: API health check failed"
    pm2 restart cypher-api
    exit 1
fi

# Check Nginx
if ! sudo systemctl is-active --quiet nginx; then
    log_message "ERROR: Nginx is not running"
    sudo systemctl start nginx
    exit 1
fi

# Check client application
if ! curl -f -s "$CLIENT_URL" > /dev/null; then
    log_message "ERROR: Client application not accessible"
    sudo systemctl reload nginx
    exit 1
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log_message "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
fi

log_message "INFO: All health checks passed"
EOF

chmod +x /home/ubuntu/health-check.sh

# Set up cron job for health checks (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/health-check.sh") | crontab -
```

## 🔥 Security & Firewall Configuration

### **1. Configure UFW (Uncomplicated Firewall)**
```bash
# Reset UFW to defaults
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if changed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific IP ranges (optional - restrict SSH access)
# sudo ufw allow from YOUR_OFFICE_IP to any port 22

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### **2. Configure Fail2Ban**
```bash
# Install Fail2Ban (if not already installed)
sudo apt install -y fail2ban

# Create custom configuration
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/cypher_error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/cypher_error.log
maxretry = 10
EOF

# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### **3. System Security Hardening**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install security updates automatically
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable root login via SSH (if not already done)
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use key-based only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart ssh

# Set up automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

## 🔄 Automated Deployment Scripts

### **1. Complete Deployment Script**
```bash
# Create automated deployment script
cat > /home/ubuntu/deploy-cypher.sh << 'EOF'
#!/bin/bash

set -e  # Exit on any error

# Configuration
APP_DIR="/var/www/cypher"
BACKUP_DIR="/home/ubuntu/backups"
LOG_FILE="/var/log/cypher/deployment.log"
BRANCH="${1:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_message() {
    echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC} - $1" | tee -a "$LOG_FILE"
}

error_message() {
    echo -e "${RED}$(date '+%Y-%m-%d %H:%M:%S')${NC} - ERROR: $1" | tee -a "$LOG_FILE"
}

warning_message() {
    echo -e "${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC} - WARNING: $1" | tee -a "$LOG_FILE"
}

# Create backup
create_backup() {
    log_message "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="cypher-backup-$(date +%Y%m%d-%H%M%S)"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C /var/www cypher
    log_message "Backup created: $BACKUP_NAME.tar.gz"
}

# Rollback function
rollback() {
    error_message "Deployment failed. Rolling back..."
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/cypher-backup-*.tar.gz | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_message "Restoring from backup: $LATEST_BACKUP"
        rm -rf "$APP_DIR"
        tar -xzf "$LATEST_BACKUP" -C /var/www
        pm2 restart all
        sudo systemctl reload nginx
        log_message "Rollback completed"
    else
        error_message "No backup found for rollback"
    fi
    exit 1
}

# Set trap for errors
trap rollback ERR

log_message "Starting CYPHER deployment (Branch: $BRANCH)"

# Create backup before deployment
create_backup

# Pull latest changes
log_message "Pulling latest changes from GitLab..."
cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Install dependencies
log_message "Installing dependencies..."
npm install

cd api
npm install

cd ../client
npm install

# Build client application
log_message "Building client application..."
npm run build

# Set proper permissions
sudo chown -R www-data:www-data "$APP_DIR/client/dist"

# Restart PM2 processes
log_message "Restarting API server..."
cd "$APP_DIR"
pm2 restart cypher-api

# Wait for application to start
log_message "Waiting for application to start..."
sleep 10

# Health checks
log_message "Performing health checks..."

# Check PM2 status
if ! pm2 status | grep -q "online"; then
    error_message "PM2 processes not running properly"
    exit 1
fi

# Check API health
if ! curl -f -s "http://localhost:3001/api/health" > /dev/null; then
    error_message "API health check failed"
    exit 1
fi

# Check client application
if ! curl -f -s "http://localhost" > /dev/null; then
    error_message "Client application health check failed"
    exit 1
fi

# Reload Nginx (in case of configuration changes)
sudo systemctl reload nginx

log_message "Deployment completed successfully!"
log_message "Application available at: http://$(curl -s http://checkip.amazonaws.com)"

# Clean up old backups (keep last 10)
find "$BACKUP_DIR" -name "cypher-backup-*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f

log_message "Deployment script finished"
EOF

chmod +x /home/ubuntu/deploy-cypher.sh
```

### **2. Quick Update Script**
```bash
# Create quick update script for minor changes
cat > /home/ubuntu/quick-update.sh << 'EOF'
#!/bin/bash

cd /var/www/cypher

echo "Pulling latest changes..."
git pull origin main

echo "Restarting API..."
pm2 restart cypher-api

echo "Quick update completed!"
pm2 status
EOF

chmod +x /home/ubuntu/quick-update.sh
```

### **3. Database Migration Script**
```bash
# Create database migration script
cat > /home/ubuntu/migrate-db.sh << 'EOF'
#!/bin/bash

APP_DIR="/var/www/cypher"
LOG_FILE="/var/log/cypher/migration.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_message "Starting database migration..."

cd "$APP_DIR/api"

# Run database migrations (adjust command based on your setup)
if [ -f "package.json" ] && grep -q "migrate" package.json; then
    log_message "Running npm run migrate..."
    npm run migrate
elif [ -f "knexfile.js" ]; then
    log_message "Running knex migrations..."
    npx knex migrate:latest
elif [ -d "migrations" ]; then
    log_message "Custom migration directory found..."
    # Add your custom migration logic here
    echo "Please implement custom migration logic"
else
    log_message "No migration system detected"
fi

log_message "Database migration completed"
EOF

chmod +x /home/ubuntu/migrate-db.sh
```

## 📊 Performance Optimization

### **1. Nginx Performance Tuning**
```bash
# Update Nginx configuration for better performance
sudo tee /etc/nginx/conf.d/performance.conf << 'EOF'
# Worker processes
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;

    # Timeouts
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;

    # Open file cache
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
EOF

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### **2. PM2 Performance Configuration**
```bash
# Update PM2 ecosystem for better performance
cat > /var/www/cypher/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/server.js',
      cwd: '/var/www/cypher',
      instances: 'max',  // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1',
        UV_THREADPOOL_SIZE: 128  // Increase thread pool size
      },
      error_file: '/var/log/cypher/api-error.log',
      out_file: '/var/log/cypher/api-out.log',
      log_file: '/var/log/cypher/api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',  // Limit memory usage
      kill_timeout: 5000,
      listen_timeout: 8000,

      // Performance monitoring
      pmx: true,

      // Advanced PM2 features
      increment_var: 'PORT',
      merge_logs: true,

      // Health monitoring
      health_check_grace_period: 10000,
      health_check_fatal_exceptions: true
    }
  ]
};
EOF

# Restart PM2 with new configuration
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### **3. System Performance Tuning**
```bash
# Optimize system parameters
sudo tee -a /etc/sysctl.conf << 'EOF'

# Network performance
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr

# File system
fs.file-max = 65536
fs.inotify.max_user_watches = 524288

# Process limits
kernel.pid_max = 65536
EOF

# Apply changes
sudo sysctl -p

# Set user limits
sudo tee -a /etc/security/limits.conf << 'EOF'
ubuntu soft nofile 65536
ubuntu hard nofile 65536
ubuntu soft nproc 32768
ubuntu hard nproc 32768
EOF
```

## 🔄 Windows vs Linux Comparison

### **Feature Comparison Table**

| Feature | Windows Server 2019 | Ubuntu 22.04 LTS |
|---------|---------------------|-------------------|
| **Web Server** | IIS | Nginx |
| **Process Manager** | PM2 (Windows Service) | PM2 (systemd) |
| **Package Manager** | npm, Chocolatey | npm, APT |
| **SSL/TLS** | IIS SSL bindings | Let's Encrypt/Certbot |
| **Firewall** | Windows Firewall | UFW/iptables |
| **Security** | Windows Defender | Fail2Ban, UFW |
| **Performance** | Good | Excellent |
| **Resource Usage** | Higher | Lower |
| **Cost** | Higher (Windows license) | Lower (Free OS) |
| **Maintenance** | Windows Updates | APT updates |
| **Monitoring** | Event Viewer, Perfmon | journalctl, htop |
| **Scripting** | PowerShell | Bash |

### **Migration Considerations**

#### **Advantages of Linux:**
- **Lower Cost** - No Windows licensing fees
- **Better Performance** - Lower resource overhead
- **Superior Security** - Built-in security tools and practices
- **Easier Automation** - Better scripting and automation support
- **Container Support** - Native Docker support
- **Community Support** - Larger open-source community

#### **Migration Steps from Windows:**
1. **Backup Current Deployment** - Full system backup
2. **Test Linux Deployment** - Deploy to test environment
3. **Update DNS/Load Balancer** - Point traffic to new instance
4. **Monitor Performance** - Compare metrics
5. **Decommission Windows** - After successful migration

#### **Potential Challenges:**
- **Team Familiarity** - Learning Linux administration
- **Tooling Differences** - Different monitoring and management tools
- **Migration Downtime** - Brief service interruption during switch

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Node.js Installation Issues**
```bash
# If Node.js version is incorrect
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify version
node --version
npm --version

# If npm permissions issues
sudo chown -R $(whoami) ~/.npm
```

#### **2. PM2 Process Issues**
```bash
# Check PM2 status
pm2 status
pm2 logs cypher-api

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js

# Check PM2 startup script
pm2 startup
pm2 save
```

#### **3. Nginx Configuration Issues**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/cypher_error.log

# Restart Nginx
sudo systemctl restart nginx

# Check if Nginx is listening
sudo netstat -tlnp | grep :80
```

#### **4. Database Connection Issues**
```bash
# Test database connection
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" -c "SELECT version();"

# Check network connectivity
telnet rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com 5432

# Check environment variables
cd /var/www/cypher/api
cat .env
```

#### **5. SSL/HTTPS Issues**
```bash
# Check SSL certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
curl -I https://your-domain.com

# Check Nginx SSL configuration
sudo nginx -t
```

### **Emergency Recovery**
```bash
# Complete system recovery script
cat > /home/ubuntu/emergency-recovery.sh << 'EOF'
#!/bin/bash

echo "Starting emergency recovery..."

# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Restore from latest backup
LATEST_BACKUP=$(ls -t /home/ubuntu/backups/cypher-backup-*.tar.gz | head -n1)
if [ -n "$LATEST_BACKUP" ]; then
    echo "Restoring from: $LATEST_BACKUP"
    sudo rm -rf /var/www/cypher
    sudo tar -xzf "$LATEST_BACKUP" -C /var/www
    sudo chown -R ubuntu:ubuntu /var/www/cypher
    sudo chown -R www-data:www-data /var/www/cypher/client/dist
fi

# Restart services
sudo systemctl start nginx
pm2 start /var/www/cypher/ecosystem.config.js

# Check status
pm2 status
sudo systemctl status nginx

echo "Emergency recovery completed"
EOF

chmod +x /home/ubuntu/emergency-recovery.sh
```

## 📋 Final Deployment Checklist

### **Pre-Deployment Verification**
- [ ] Ubuntu 22.04 LTS instance launched and accessible
- [ ] Node.js v20.16.0 installed and verified
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (if using HTTPS)
- [ ] Firewall rules configured
- [ ] GitLab SSH access configured

### **Deployment Execution**
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Environment files configured
- [ ] Client application built successfully
- [ ] PM2 processes started and running
- [ ] Nginx serving static files correctly
- [ ] API proxy working through Nginx
- [ ] Database connectivity confirmed

### **Post-Deployment Testing**
- [ ] Application accessible via public IP/domain
- [ ] API endpoints responding correctly
- [ ] Authentication system working
- [ ] All application features functional
- [ ] Performance metrics acceptable
- [ ] Health monitoring active
- [ ] Backup procedures tested

### **Production Readiness**
- [ ] SSL/HTTPS configured (recommended)
- [ ] Monitoring and alerting set up
- [ ] Automated deployment script tested
- [ ] Emergency recovery procedures documented
- [ ] Team trained on Linux administration
- [ ] Documentation updated with new URLs

---

**Last Updated:** December 2024
**Status:** ✅ **Production Ready Linux Deployment**
**Recommended OS:** Ubuntu 22.04 LTS
**Node.js Version:** v20.16.0
**Web Server:** Nginx
**Process Manager:** PM2
**Application URL:** `http://YOUR_STATIC_IP` or `https://your-domain.com`
