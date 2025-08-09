#!/bin/bash
# Complete CYPHER EC2 Setup Script - All sudo commands included
# Run this script on Amazon Linux EC2 instance

echo "🚀 Starting Complete CYPHER Environment Setup..."
echo "================================================"

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# =============================================================================
# SYSTEM UPDATES & PACKAGE INSTALLATION
# =============================================================================

echo "📦 Updating system packages..."
sudo yum update -y
check_status "System update"

echo "📥 Adding Node.js repository..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
check_status "Node.js repository setup"

echo "📦 Installing Node.js..."
sudo yum install -y nodejs
check_status "Node.js installation"

echo "🔧 Installing development tools..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y git curl wget unzip vim nano htop
check_status "Development tools installation"

echo "🐍 Installing Python3..."
sudo yum install -y python3 python3-pip
check_status "Python3 installation"

echo "🗄️ Installing PostgreSQL client..."
sudo yum install -y postgresql
check_status "PostgreSQL client installation"

echo "🔒 Installing SSL tools..."
sudo yum install -y certbot python3-certbot-nginx
check_status "SSL tools installation"

echo "🛡️ Installing security tools..."
sudo yum install -y fail2ban
check_status "Security tools installation"

# =============================================================================
# NGINX WEB SERVER SETUP
# =============================================================================

echo "🌐 Installing and configuring Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
check_status "Nginx installation and startup"

# =============================================================================
# PM2 PROCESS MANAGER
# =============================================================================

echo "⚙️ Installing PM2 process manager..."
sudo npm install -g pm2
check_status "PM2 installation"

# =============================================================================
# DIRECTORY CREATION & PERMISSIONS
# =============================================================================

echo "📁 Creating application directories..."
sudo mkdir -p /opt/cypher
sudo mkdir -p /var/log/cypher
sudo mkdir -p /etc/cypher
check_status "Directory creation"

echo "🔐 Setting directory permissions..."
sudo chown ec2-user:ec2-user /opt/cypher
sudo chown ec2-user:ec2-user /var/log/cypher
sudo chmod 755 /opt/cypher
check_status "Directory permissions"

# =============================================================================
# FIREWALL CONFIGURATION
# =============================================================================

echo "🔥 Configuring firewall..."
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
check_status "Firewall configuration"

# =============================================================================
# SECURITY SERVICES
# =============================================================================

echo "🛡️ Configuring security services..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
check_status "Fail2ban configuration"

# =============================================================================
# AWS CLI INSTALLATION
# =============================================================================

if ! command -v aws &> /dev/null; then
    echo "☁️ Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    check_status "AWS CLI installation"
else
    echo "✅ AWS CLI already installed"
fi

# =============================================================================
# CLOUDWATCH AGENT INSTALLATION
# =============================================================================

echo "📊 Installing CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
rm amazon-cloudwatch-agent.rpm
check_status "CloudWatch Agent installation"

# =============================================================================
# LOG ROTATION CONFIGURATION
# =============================================================================

echo "📝 Configuring log rotation..."
sudo tee /etc/logrotate.d/cypher > /dev/null << 'EOF'
/var/log/cypher/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
check_status "Log rotation configuration"

# =============================================================================
# PM2 STARTUP CONFIGURATION
# =============================================================================

echo "🚀 Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
check_status "PM2 startup configuration"

# =============================================================================
# NGINX CONFIGURATION FOR CYPHER
# =============================================================================

echo "🌐 Creating Nginx configuration for CYPHER..."
sudo tee /etc/nginx/conf.d/cypher.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

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
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static files
    location / {
        root /opt/cypher/client/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
check_status "Nginx configuration"

# =============================================================================
# HELPER SCRIPTS CREATION
# =============================================================================

echo "📊 Creating system monitoring script..."
cat > /home/ec2-user/system-status.sh << 'EOF'
#!/bin/bash
echo "=== CYPHER System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""
echo "=== Services ==="
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "PM2: $(pm2 ping 2>/dev/null || echo 'Not running')"
echo "Fail2ban: $(sudo systemctl is-active fail2ban)"
echo "Firewall: $(sudo systemctl is-active firewalld)"
echo ""
echo "=== Resources ==="
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo ""
echo "=== Network ==="
echo "Listening ports:"
sudo netstat -tlnp | grep -E ':80|:443|:3001|:22'
echo ""
echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not configured yet"
echo ""
echo "=== Firewall Rules ==="
sudo firewall-cmd --list-all
EOF
chmod +x /home/ec2-user/system-status.sh
check_status "System monitoring script creation"

echo "🚀 Creating CYPHER deployment script..."
cat > /home/ec2-user/deploy-cypher.sh << 'EOF'
#!/bin/bash
echo "🚀 CYPHER Deployment Script"
echo "=========================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

# Stop current application if running
echo "⏹️ Stopping current application..."
pm2 stop cypher-api 2>/dev/null || true

# Create backup
if [ -d "/opt/cypher" ]; then
    echo "📦 Creating backup..."
    sudo cp -r /opt/cypher /opt/cypher-backup-$(date +%Y%m%d-%H%M%S)
fi

# Download latest deployment package
echo "📥 Downloading latest deployment package..."
cd /tmp
aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./

if [ $? -ne 0 ]; then
    echo "❌ Failed to download deployment package"
    exit 1
fi

# Extract deployment package
echo "📦 Extracting deployment package..."
unzip -o cypher-deployment-latest.zip

# Copy to application directory
echo "📁 Copying to application directory..."
sudo cp -r * /opt/cypher/
sudo chown -R ec2-user:ec2-user /opt/cypher

# Install API dependencies
echo "📦 Installing API dependencies..."
cd /opt/cypher/api
npm ci --production

# Build client
echo "🏗️ Building client..."
cd /opt/cypher/client
npm ci
npm run build

# Configure environment
echo "⚙️ Configuring environment..."
cd /opt/cypher
cp .env.production api/.env

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'cypher-api',
    script: './api/server.js',
    cwd: '/opt/cypher',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/cypher/api-error.log',
    out_file: '/var/log/cypher/api-out.log',
    log_file: '/var/log/cypher/api-combined.log'
  }]
};
EOFPM2

# Start application
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Health check
echo "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:3001/health; then
    echo "✅ Deployment successful!"
    echo "🌐 Application available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
else
    echo "❌ Health check failed!"
    pm2 logs cypher-api --lines 20
fi

# Cleanup
rm -f /tmp/cypher-deployment-latest.zip
rm -rf /tmp/api /tmp/client /tmp/deploy.sh /tmp/.env.production

echo "🎉 Deployment process completed!"
EOF
chmod +x /home/ec2-user/deploy-cypher.sh
check_status "Deployment script creation"

# =============================================================================
# SSL CERTIFICATE HELPER SCRIPT
# =============================================================================

echo "🔒 Creating SSL certificate setup script..."
cat > /home/ec2-user/setup-ssl.sh << 'EOF'
#!/bin/bash
echo "🔒 SSL Certificate Setup for CYPHER"
echo "==================================="

if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com"
    exit 1
fi

DOMAIN=$1

echo "Setting up SSL certificate for: $DOMAIN"

# Install SSL certificate
sudo certbot --nginx -d $DOMAIN

# Test SSL renewal
sudo certbot renew --dry-run

echo "✅ SSL certificate setup completed!"
echo "🔄 SSL certificates will auto-renew"
EOF
chmod +x /home/ec2-user/setup-ssl.sh
check_status "SSL setup script creation"

# =============================================================================
# FINAL VERIFICATION & STATUS REPORT
# =============================================================================

echo "✅ Verifying all installations..."
echo ""
echo "=== Software Versions ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Git: $(git --version)"
echo "AWS CLI: $(aws --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "PostgreSQL client: $(psql --version)"
echo "Python3: $(python3 --version)"
echo "Certbot: $(certbot --version)"
echo ""

echo "=== Service Status ==="
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "Fail2ban: $(sudo systemctl is-active fail2ban)"
echo "Firewall: $(sudo systemctl is-active firewalld)"
echo ""

echo "=== Directory Structure ==="
ls -la /opt/cypher 2>/dev/null || echo "/opt/cypher: Ready for deployment"
ls -la /var/log/cypher
echo ""

# Create final status report
cat > /home/ec2-user/installation-complete.txt << EOF
🎉 CYPHER Production Environment Setup Complete!
===============================================
Date: $(date)
Hostname: $(hostname)
Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "Not available")

✅ Installed Software:
- Node.js: $(node --version)
- npm: $(npm --version)
- PM2: $(pm2 --version)
- Git: $(git --version)
- AWS CLI: $(aws --version)
- Nginx: $(nginx -v 2>&1)
- PostgreSQL client: $(psql --version)
- Python3: $(python3 --version)
- Certbot: $(certbot --version)

✅ Services Status:
- Nginx: $(sudo systemctl is-active nginx)
- Fail2ban: $(sudo systemctl is-active fail2ban)
- Firewall: $(sudo systemctl is-active firewalld)

✅ Security Features:
- Firewall configured (HTTP, HTTPS, SSH, API port 3001)
- Fail2ban installed and running
- Log rotation configured
- CloudWatch agent installed

✅ Directories Created:
- Application: /opt/cypher (ready for deployment)
- Logs: /var/log/cypher
- Config: /etc/cypher

✅ Helper Scripts Created:
- System Status: ~/system-status.sh
- Deploy CYPHER: ~/deploy-cypher.sh
- SSL Setup: ~/setup-ssl.sh

🚀 Next Steps:
1. Configure AWS credentials: aws configure
2. Deploy CYPHER application: ./deploy-cypher.sh
3. Check system status: ./system-status.sh
4. Set up SSL (optional): ./setup-ssl.sh your-domain.com

🔗 Useful Commands:
- Check system status: ./system-status.sh
- Deploy application: ./deploy-cypher.sh
- View PM2 logs: pm2 logs
- Restart Nginx: sudo systemctl restart nginx
- Check firewall: sudo firewall-cmd --list-all
- View system logs: sudo journalctl -f

🌐 Once deployed, your application will be available at:
http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR-EC2-IP")
EOF

echo ""
echo "🎉 COMPLETE CYPHER ENVIRONMENT SETUP FINISHED!"
echo "=============================================="
echo ""
echo "📄 Installation summary saved to: ~/installation-complete.txt"
echo "📊 System status script: ~/system-status.sh"
echo "🚀 Deployment script: ~/deploy-cypher.sh"
echo "🔒 SSL setup script: ~/setup-ssl.sh"
echo ""
echo "🔗 Next Steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Deploy your application: ./deploy-cypher.sh"
echo "3. Check system status: ./system-status.sh"
echo ""
echo "✅ Your EC2 instance is now ready for CYPHER deployment!"
