# CYPHER Dashboard Docker Deployment Guide

## Overview
This guide walks you through deploying the CYPHER Dashboard using Docker on an Amazon Linux EC2 instance. This approach provides better reliability and easier management compared to Windows RDP deployment.

## Prerequisites
- AWS Account with EC2 access
- CYPHER application code in S3 bucket (`s3://cypher-deployment/`)
- Amazon Linux EC2 instance (RASDASH - i-04a41343a3f51559a)

## 🖥️ Step 1: Start Linux Instance via AWS Console

### Access EC2 Console:
1. **Open AWS Console**: Go to https://console.aws.amazon.com
2. **Navigate to EC2**: Services → EC2 → Instances
3. **Find Your Instance**: Look for `RASDASH` (i-04a41343a3f51559a)

### Start the Instance:
1. **Select Instance**: Click the checkbox next to `RASDASH`
2. **Start Instance**: Click "Instance state" → "Start instance"
3. **Wait for Running**: Status will change from "Stopped" → "Pending" → "Running"
4. **Note the Public IP**: Once running, copy the "Public IPv4 address"

## 🔐 Step 2: Connect to Linux Instance

### Option A: EC2 Instance Connect (Browser-based)
1. **Select Instance**: Click on the instance ID `i-04a41343a3f51559a`
2. **Connect Button**: Click "Connect" button at the top
3. **EC2 Instance Connect**: Select "EC2 Instance Connect" tab
4. **Connect**: Click "Connect" (opens terminal in browser)

### Option B: SSH (if you have the key pair)
```bash
ssh -i "your-keypair.pem" ec2-user@[PUBLIC-IP]
```

## 🚀 Step 3: Deploy Docker App on Linux

Once connected to the Linux instance, run these commands:

### Quick Deployment (Recommended):
```bash
# Download the deployment script
curl -O https://cypher-deployment.s3.amazonaws.com/deploy-to-amazon-linux.sh

# Make it executable
chmod +x deploy-to-amazon-linux.sh

# Run the deployment
./deploy-to-amazon-linux.sh
```

### Manual Deployment Steps (if script fails):
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /opt/cypher
sudo chown ec2-user:ec2-user /opt/cypher
cd /opt/cypher

# Download app and Docker files
aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip ./
aws s3 cp s3://cypher-deployment/Dockerfile ./
aws s3 cp s3://cypher-deployment/docker-compose.yml ./
aws s3 cp s3://cypher-deployment/nginx.conf ./

# Extract app
unzip -o cypher-deployment-latest.zip

# Create directories
mkdir -p data logs uploads backups

# Start Docker (need to logout/login for group changes)
newgrp docker
docker-compose up -d
```

## 🔍 Step 4: Verify Deployment

### Check Container Status:
```bash
docker-compose ps
docker-compose logs -f
```

### Test Services:
```bash
# Test API
curl http://localhost:3001/health

# Test Frontend
curl http://localhost:3000
```

## 🌐 Step 5: Access Your Application

Once deployed, access your app at:
- **Frontend**: `http://[PUBLIC-IP]:3000`
- **API**: `http://[PUBLIC-IP]:3001`
- **Health Check**: `http://[PUBLIC-IP]:3001/health`

## 🔧 Step 6: Update Security Group (if needed)

If you can't access the app externally, update the security group:

### In AWS Console:
1. **EC2 → Security Groups**
2. **Find your security group** (likely `EC2SecurityGrp`)
3. **Edit Inbound Rules**
4. **Add Rules:**
   - **Type**: Custom TCP, **Port**: 3000, **Source**: 0.0.0.0/0 (Frontend)
   - **Type**: Custom TCP, **Port**: 3001, **Source**: 0.0.0.0/0 (API)

## 📋 Quick Checklist

- [ ] Start RASDASH instance in EC2 console
- [ ] Connect via EC2 Instance Connect
- [ ] Run deployment script
- [ ] Check container status
- [ ] Update security group if needed
- [ ] Access app at `http://[PUBLIC-IP]:3000`

## 🔧 Management Commands

Once deployed, use these commands to manage your application:

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
./deploy-to-amazon-linux.sh

# Check service status
docker-compose ps

# Access container shell
docker-compose exec api bash
```

## 📁 Important Directories

- **Application**: `/opt/cypher`
- **Data**: `/opt/cypher/data`
- **Logs**: `/opt/cypher/logs`
- **Backups**: `/opt/cypher/backups`

## 🚨 Troubleshooting

### If containers won't start:
```bash
# Check Docker service
sudo systemctl status docker

# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### If can't access externally:
1. Check security group rules (ports 3000, 3001)
2. Verify instance public IP
3. Check if services are running: `docker-compose ps`

### If deployment script fails:
1. Check AWS CLI configuration: `aws configure list`
2. Verify S3 bucket access: `aws s3 ls s3://cypher-deployment/`
3. Run manual deployment steps

## 📞 Support

For issues or questions:
1. Check container logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test individual components: `curl http://localhost:3001/health`

---

**🎉 Once completed, your CYPHER Dashboard will be running in Docker containers with automatic restarts, log rotation, and daily database backups!**
