#!/bin/bash

# CYPHER Dashboard Docker Deployment Script for Amazon Linux
# This script sets up Docker and deploys the CYPHER dashboard

set -e

echo "🚀 Starting CYPHER Dashboard Docker Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/cypher
sudo chown ec2-user:ec2-user /opt/cypher
cd /opt/cypher

# Download deployment package from S3
echo "📥 Downloading application from S3..."
aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./
unzip -o cypher-deployment-latest.zip
rm cypher-deployment-latest.zip

# Copy Docker configuration files
echo "🐳 Setting up Docker configuration..."
# Note: These files should be included in the S3 package or created here

# Create necessary directories
mkdir -p data logs uploads backups

# Set up environment configuration
echo "🔧 Setting up database configuration..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database Configuration (PostgreSQL on AWS RDS)
DB_HOST=rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=rasdashdev01
DB_USER=rasdashadmin
DB_PASSWORD=RasDash2025\$
DB_SSL=true
DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01

# Application Configuration
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://localhost:3000

# AWS Configuration
AWS_REGION=us-east-1
EOF
    echo "✅ Database configuration set for: rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com"
    echo "   Database: rasdashdev01"
    echo "   User: rasdashadmin"
fi

# Set permissions
sudo chown -R ec2-user:ec2-user /opt/cypher

# Build and start containers
echo "🏗️ Building and starting Docker containers..."
newgrp docker << EONG
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d
EONG

# Test database connection
echo "🔍 Testing database connection..."
if docker run --rm postgres:13-alpine psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed - check your network security groups"
    echo "   Make sure port 5432 is open from this EC2 instance to RDS"
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:3001/health; then
    echo "✅ API service is healthy"
else
    echo "❌ API service health check failed"
fi

if curl -f http://localhost:3000; then
    echo "✅ Client service is healthy"
else
    echo "❌ Client service health check failed"
fi

# Display status
echo "📊 Container status:"
docker-compose ps

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/cypher-docker << EOF
/opt/cypher/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Create systemd service for auto-start
echo "🔄 Creating systemd service..."
sudo tee /etc/systemd/system/cypher-dashboard.service << EOF
[Unit]
Description=CYPHER Dashboard
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cypher
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable cypher-dashboard.service

# Get current public IP
CURRENT_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Check if Route53 record needs updating
echo "🔍 Checking Route53 DNS record..."
ROUTE53_IP=$(dig +short rasdash.dev.com @8.8.8.8 | tail -n1)

if [ "$CURRENT_IP" != "$ROUTE53_IP" ]; then
    echo "⚠️  Route53 DNS record needs updating!"
    echo "   Current Route53 IP: $ROUTE53_IP"
    echo "   Current Instance IP: $CURRENT_IP"
    echo ""
    echo "🔧 To update Route53 record, run:"
    echo "   aws route53 change-resource-record-sets --hosted-zone-id Z07201002RI5R8QT9OIF7 --change-batch '{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"rasdash.dev.com\",\"Type\":\"A\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"'$CURRENT_IP'\"}]}}]}'"
else
    echo "✅ Route53 DNS record is up to date"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access Information:"
echo "   Domain:   http://rasdash.dev.com:3000"
echo "   Frontend: http://$CURRENT_IP:3000"
echo "   API:      http://$CURRENT_IP:3001"
echo "   Health:   http://$CURRENT_IP:3001/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Restart:      docker-compose restart"
echo "   Stop:         docker-compose down"
echo "   Update:       ./deploy-to-amazon-linux.sh"
echo ""
echo "📁 Important Directories:"
echo "   Application:  /opt/cypher"
echo "   Data:         /opt/cypher/data"
echo "   Logs:         /opt/cypher/logs"
echo "   Backups:      /opt/cypher/backups"
