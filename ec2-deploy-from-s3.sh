#!/bin/bash
# EC2 Deployment Script - Downloads and deploys CYPHER from S3

echo "🚀 CYPHER S3 Deployment Script"
echo "================================"

# Configuration
S3_BUCKET="cypher-deployment"
S3_KEY="cypher-deployment-latest.zip"
TEMP_DIR="/tmp/cypher-deploy"
APP_DIR="/opt/cypher"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Installing..."
    sudo yum update -y
    sudo yum install -y awscli
fi

# Check if unzip is installed
if ! command -v unzip &> /dev/null; then
    echo "📦 Installing unzip..."
    sudo yum install -y unzip
fi

# Create temporary directory
echo "📁 Creating temporary directory..."
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR
cd $TEMP_DIR

# Download deployment package from S3
echo "⬇️ Downloading deployment package from S3..."
aws s3 cp s3://$S3_BUCKET/$S3_KEY ./cypher-deployment.zip

if [ $? -ne 0 ]; then
    echo "❌ Failed to download deployment package from S3"
    echo "💡 Make sure:"
    echo "   - AWS credentials are configured (aws configure)"
    echo "   - EC2 instance has S3 access permissions"
    echo "   - S3 bucket '$S3_BUCKET' exists and contains '$S3_KEY'"
    exit 1
fi

# Extract deployment package
echo "📦 Extracting deployment package..."
unzip -q cypher-deployment.zip

# Make deployment script executable
chmod +x deploy.sh

# Run deployment script
echo "🚀 Running deployment script..."
./deploy.sh

# Cleanup
echo "🧹 Cleaning up temporary files..."
cd /
rm -rf $TEMP_DIR

echo "✅ Deployment completed!"
echo ""
echo "🔗 Quick Links:"
echo "   Health Check: http://localhost:3001/health"
echo "   Application:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-EC2-IP')"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "📝 View Logs:"
echo "   pm2 logs cypher-api"
echo "   sudo journalctl -u nginx -f"
