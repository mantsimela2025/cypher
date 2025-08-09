#!/bin/bash
# User Data Script to install Node.js on EC2 launch

# Update system
yum update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install additional tools
yum install -y git nginx

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/cypher
chown ec2-user:ec2-user /opt/cypher

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Create a simple status file
echo "Node.js $(node --version) installed successfully at $(date)" > /home/ec2-user/install-status.txt
chown ec2-user:ec2-user /home/ec2-user/install-status.txt

# Log versions
echo "Node.js version: $(node --version)" >> /var/log/user-data.log
echo "npm version: $(npm --version)" >> /var/log/user-data.log
echo "Installation completed at: $(date)" >> /var/log/user-data.log
