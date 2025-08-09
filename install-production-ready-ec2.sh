#!/bin/bash
# Production-Ready CYPHER Installation Script for Amazon Linux EC2

echo "🚀 Installing Production-Ready CYPHER Environment..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 20.x from NodeSource
echo "📥 Installing Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install essential development tools
echo "🔧 Installing development tools..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y git curl wget unzip vim nano htop

# Install Python3 and pip (required for some npm packages)
echo "🐍 Installing Python3..."
sudo yum install -y python3 python3-pip

# Install PM2 process manager
echo "⚙️ Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx web server
echo "🌐 Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install PostgreSQL client (for database operations)
echo "🗄️ Installing PostgreSQL client..."
sudo yum install -y postgresql

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "☁️ Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Install CloudWatch Agent for monitoring
echo "📊 Installing CloudWatch Agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
rm amazon-cloudwatch-agent.rpm

# Install Certbot for SSL certificates
echo "🔒 Installing Certbot for SSL..."
sudo yum install -y certbot python3-certbot-nginx

# Install security tools
echo "🛡️ Installing security tools..."
sudo yum install -y fail2ban

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
echo "📁 Creating application directories..."
sudo mkdir -p /opt/cypher
sudo mkdir -p /var/log/cypher
sudo mkdir -p /etc/cypher
sudo chown ec2-user:ec2-user /opt/cypher
sudo chown ec2-user:ec2-user /var/log/cypher

# Configure log rotation
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

# Configure basic firewall rules
echo "🔥 Configuring firewall..."
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Set up PM2 startup script
echo "🚀 Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Create system monitoring script
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
echo ""
echo "=== Resources ==="
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo ""
echo "=== Network ==="
echo "Listening ports: $(sudo netstat -tlnp | grep -E ':80|:443|:3001|:22')"
echo ""
echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not configured yet"
EOF
chmod +x /home/ec2-user/system-status.sh

# Create deployment helper script
echo "🚀 Creating deployment helper..."
cat > /home/ec2-user/deploy-cypher.sh << 'EOF'
#!/bin/bash
echo "🚀 CYPHER Deployment Helper"
echo "=========================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

# Download latest deployment package
echo "📥 Downloading latest deployment package..."
cd /tmp
aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./

if [ $? -ne 0 ]; then
    echo "❌ Failed to download deployment package"
    exit 1
fi

# Extract and deploy
echo "📦 Extracting deployment package..."
unzip -o cypher-deployment-latest.zip

# Copy to application directory
echo "📁 Copying to application directory..."
cp -r * /opt/cypher/

# Set permissions
sudo chown -R ec2-user:ec2-user /opt/cypher

# Install dependencies
echo "📦 Installing API dependencies..."
cd /opt/cypher/api
npm ci --production

echo "🏗️ Building client..."
cd /opt/cypher/client
npm ci
npm run build

# Configure environment
echo "⚙️ Configuring environment..."
cd /opt/cypher
cp .env.production api/.env

# Deploy with the deployment script
echo "🚀 Running deployment script..."
chmod +x deploy.sh
./deploy.sh

echo "✅ Deployment completed!"
echo "🌐 Check your application at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF
chmod +x /home/ec2-user/deploy-cypher.sh

# Verify installations
echo "✅ Verifying installations..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Git: $(git --version)"
echo "AWS CLI: $(aws --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "PostgreSQL client: $(psql --version)"
echo "Python3: $(python3 --version)"

# Create comprehensive status file
cat > /home/ec2-user/installation-complete.txt << EOF
🎉 CYPHER Production Environment Installation Complete!
=====================================================
Date: $(date)
Hostname: $(hostname)
Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

Installed Software:
- Node.js: $(node --version)
- npm: $(npm --version)
- PM2: $(pm2 --version)
- Git: $(git --version)
- AWS CLI: $(aws --version)
- Nginx: $(nginx -v 2>&1)
- PostgreSQL client: $(psql --version)
- Python3: $(python3 --version)
- Certbot: $(certbot --version)

Services Status:
- Nginx: $(sudo systemctl is-active nginx)
- Fail2ban: $(sudo systemctl is-active fail2ban)
- Firewalld: $(sudo systemctl is-active firewalld)

Directories Created:
- Application: /opt/cypher
- Logs: /var/log/cypher
- Config: /etc/cypher

Helper Scripts:
- System Status: ~/system-status.sh
- Deploy CYPHER: ~/deploy-cypher.sh

Next Steps:
1. Configure AWS credentials: aws configure
2. Deploy CYPHER: ./deploy-cypher.sh
3. Check system status: ./system-status.sh
4. Set up SSL: sudo certbot --nginx -d your-domain.com

Security Features:
- Firewall configured (HTTP, HTTPS, SSH only)
- Fail2ban installed and running
- Log rotation configured
- CloudWatch agent installed

For SSL setup:
sudo certbot --nginx -d your-domain.com

For monitoring:
./system-status.sh
EOF

echo ""
echo "🎉 Production-ready CYPHER environment installation completed!"
echo "📄 Check ~/installation-complete.txt for details"
echo "🚀 Run ~/deploy-cypher.sh to deploy your application"
echo "📊 Run ~/system-status.sh to check system status"
