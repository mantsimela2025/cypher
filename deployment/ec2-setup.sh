#!/bin/bash
# EC2 Server Setup Script for CYPHER Application
# Run this script on your EC2 instance to prepare it for deployments

set -e

echo "🚀 Setting up EC2 instance for CYPHER application deployment..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx for reverse proxy
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Install git
echo "📦 Installing Git..."
sudo yum install -y git

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /opt/cypher
sudo mkdir -p /opt/cypher-staging
sudo mkdir -p /opt/cypher-dev
sudo mkdir -p /var/log/cypher

# Set ownership
sudo chown -R ec2-user:ec2-user /opt/cypher*
sudo chown -R ec2-user:ec2-user /var/log/cypher

# Create systemd service files
echo "⚙️ Creating systemd service files..."

# Production API Service
sudo tee /etc/systemd/system/cypher-api.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER API Production
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-api

[Install]
WantedBy=multi-user.target
EOF

# Production Client Service (if serving static files)
sudo tee /etc/systemd/system/cypher-client.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER Client Production
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher/client
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-client

[Install]
WantedBy=multi-user.target
EOF

# Staging API Service
sudo tee /etc/systemd/system/cypher-staging-api.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER API Staging
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher-staging/api
Environment=NODE_ENV=staging
Environment=PORT=3002
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-staging-api

[Install]
WantedBy=multi-user.target
EOF

# Staging Client Service
sudo tee /etc/systemd/system/cypher-staging-client.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER Client Staging
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher-staging/client
Environment=PORT=3102
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-staging-client

[Install]
WantedBy=multi-user.target
EOF

# Dev API Service
sudo tee /etc/systemd/system/cypher-dev-api.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER API Development
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher-dev/api
Environment=NODE_ENV=development
Environment=PORT=3003
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-dev-api

[Install]
WantedBy=multi-user.target
EOF

# Dev Client Service
sudo tee /etc/systemd/system/cypher-dev-client.service > /dev/null << 'EOF'
[Unit]
Description=CYPHER Client Development
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cypher-dev/client
Environment=PORT=3103
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cypher-dev-client

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/conf.d/cypher.conf > /dev/null << 'EOF'
# Production
server {
    listen 80;
    server_name rasdash.dev.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rasdash.dev.com;
    
    # SSL configuration (you'll need to add your SSL certificates)
    # ssl_certificate /etc/ssl/certs/rasdash.dev.com.crt;
    # ssl_certificate_key /etc/ssl/private/rasdash.dev.com.key;
    
    # For now, we'll use HTTP only - you can add SSL later
    listen 80;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Client application
    location / {
        root /opt/cypher/client;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}

# Staging
server {
    listen 80;
    server_name staging.rasdash.dev.com;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Client application
    location / {
        root /opt/cypher-staging/client;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}

# Development
server {
    listen 80;
    server_name dev.rasdash.dev.com;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Client application
    location / {
        root /opt/cypher-dev/client;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
EOF

# Test nginx configuration
sudo nginx -t

# Enable and start nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall (if needed)
echo "🔥 Configuring firewall..."
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --reload

echo "✅ EC2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Add your SSL certificates to /etc/ssl/"
echo "2. Update the nginx configuration to enable SSL"
echo "3. Configure your GitLab CI/CD variables"
echo "4. Push to your GitLab repository to trigger deployment"
echo ""
echo "Services created:"
echo "- cypher-api (production)"
echo "- cypher-client (production)"
echo "- cypher-staging-api (staging)"
echo "- cypher-staging-client (staging)"
echo "- cypher-dev-api (development)"
echo "- cypher-dev-client (development)"
