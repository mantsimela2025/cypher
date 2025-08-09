#!/bin/bash
# Node.js Installation Script for Amazon Linux EC2

echo "🚀 Installing Node.js on Amazon Linux EC2..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 20.x from NodeSource
echo "📥 Adding NodeSource repository..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

echo "📦 Installing Node.js..."
sudo yum install -y nodejs

# Install additional development tools
echo "🔧 Installing development tools..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y git curl wget unzip

# Install PM2 process manager
echo "⚙️ Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx web server
echo "🌐 Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/cypher
sudo chown ec2-user:ec2-user /opt/cypher

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    echo "☁️ Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Verify installations
echo "✅ Verifying installations..."
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"
echo "Git version: $(git --version)"
echo "AWS CLI version: $(aws --version)"
echo "Nginx status: $(sudo systemctl is-active nginx)"

# Create status file
echo "📝 Creating installation status file..."
cat > /home/ec2-user/nodejs-install-status.txt << EOF
Node.js Installation Completed Successfully!
============================================
Date: $(date)
Node.js: $(node --version)
npm: $(npm --version)
PM2: $(pm2 --version)
Git: $(git --version)
AWS CLI: $(aws --version)
Nginx: $(sudo systemctl is-active nginx)

Next Steps:
1. Configure AWS credentials: aws configure
2. Download your application: aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./
3. Deploy your CYPHER application

Application directory: /opt/cypher
EOF

echo "🎉 Node.js installation completed successfully!"
echo "📄 Check /home/ec2-user/nodejs-install-status.txt for details"
echo ""
echo "🔗 Next steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Download CYPHER app: aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./"
echo "3. Extract and deploy: unzip cypher-deployment-latest.zip && cd cypher && ./deploy.sh"
