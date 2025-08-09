# Complete CI/CD Pipeline: VS Code → GitLab → AWS EC2 Deployment Guide

## Overview
This guide provides step-by-step instructions for setting up a complete deployment pipeline for the RAS-DASH application, from local development in VS Code to production deployment on AWS EC2 with custom domain access.

---

## Pipeline Architecture

```
Local Development (VS Code) 
    ↓ (git push)
GitLab Repository
    ↓ (GitLab CI/CD)
AWS EC2 Instance
    ↓ (Route 53 + CloudFront)
Public Domain (customers.yoursite.com)
```

---

## Phase 1: Local Development Setup (VS Code)

### 1.1 Install Required VS Code Extensions
```bash
# Install GitLab Workflow extension
# Install AWS Toolkit for VS Code
# Install Docker extension (if using containers)
```

### 1.2 Configure Git in VS Code
```bash
# Configure git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Generate SSH key for GitLab
ssh-keygen -t ed25519 -C "your.email@company.com"
cat ~/.ssh/id_ed25519.pub
# Copy this public key to GitLab SSH Keys
```

### 1.3 Project Structure Preparation
```
ras-dash/
├── .gitlab-ci.yml           # CI/CD pipeline configuration
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Local development
├── deploy/                  # Deployment scripts
│   ├── aws-deploy.sh       # AWS deployment script
│   ├── nginx.conf          # Nginx configuration
│   └── ecosystem.config.js # PM2 configuration
├── package.json
├── server/
├── client/
└── shared/
```

---

## Phase 2: GitLab Repository Setup

### 2.1 Create GitLab Project
1. **Go to GitLab.com** and create new project
2. **Project name**: `ras-dash-production`
3. **Visibility**: Private (recommended for production)
4. **Initialize with README**: Yes

### 2.2 Configure GitLab Repository
```bash
# In your local project directory
git remote add origin git@gitlab.com:yourusername/ras-dash-production.git
git branch -M main
git push -u origin main
```

### 2.3 Set GitLab Environment Variables
Navigate to **Project Settings > CI/CD > Variables** and add:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1

# EC2 Instance Details
EC2_HOST=your-ec2-public-ip
EC2_USER=ubuntu
EC2_KEY_NAME=your-key-pair-name

# Application Environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/rasdash_prod
OPENAI_API_KEY=sk-...

# Domain Configuration
DOMAIN_NAME=ras-dash.yourcompany.com
SSL_EMAIL=admin@yourcompany.com
```

---

## Phase 3: GitLab CI/CD Pipeline Configuration

### 3.1 Create .gitlab-ci.yml
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  NODE_VERSION: "20"

# Cache dependencies
cache:
  paths:
    - node_modules/
    - client/node_modules/

# Test Stage
test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run test
    - npm run lint
  only:
    - merge_requests
    - main

# Build Stage
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main

# Deploy to AWS EC2
deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$EC2_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $EC2_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $EC2_USER@$EC2_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Pull latest code
        git pull origin main
        
        # Install/update dependencies
        npm ci --production
        
        # Build client
        npm run build
        
        # Restart application
        pm2 restart ecosystem.config.js
        
        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx
      EOF
  only:
    - main
  when: manual  # Require manual trigger for production deployments
```

### 3.2 Create Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Build client
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

---

## Phase 4: AWS Infrastructure Setup

### 4.1 Launch EC2 Instance

#### Instance Configuration:
```bash
# Instance Type: t3.medium (recommended for production)
# OS: Ubuntu 22.04 LTS
# Storage: 20GB GP3 SSD (minimum)
# Security Group: Custom (see below)
```

#### Security Group Rules:
```bash
# Inbound Rules
SSH (22)     - Your IP only
HTTP (80)    - 0.0.0.0/0
HTTPS (443)  - 0.0.0.0/0
Custom (3000) - 0.0.0.0/0 (for direct app access)

# Outbound Rules
All Traffic - 0.0.0.0/0
```

### 4.2 Create Key Pair
```bash
# Download the .pem file and store securely
chmod 400 your-key-pair.pem

# Test SSH connection
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

### 4.3 Configure Elastic IP (Recommended)
1. **Allocate Elastic IP** in AWS Console
2. **Associate with EC2 instance**
3. **Update DNS records** to point to Elastic IP

---

## Phase 5: EC2 Server Configuration

### 5.1 Initial Server Setup
```bash
# Connect to EC2 instance
ssh -i your-key-pair.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install additional tools
sudo apt install -y nginx git curl htop certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 5.2 Setup Application Directory
```bash
# Create application directory
sudo mkdir -p /var/www/ras-dash
sudo chown ubuntu:ubuntu /var/www/ras-dash
cd /var/www/ras-dash

# Clone repository (initial setup)
git clone git@gitlab.com:yourusername/ras-dash-production.git .

# Install dependencies
npm ci --production
```

### 5.3 Create PM2 Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ras-dash',
    script: 'server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/ras-dash/logs/err.log',
    out_file: '/var/www/ras-dash/logs/out.log',
    log_file: '/var/www/ras-dash/logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 5.4 Configure Nginx
```nginx
# /etc/nginx/sites-available/ras-dash
server {
    listen 80;
    server_name ras-dash.yourcompany.com;
    
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
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files (if served separately)
    location /static/ {
        alias /var/www/ras-dash/client/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ras-dash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Phase 6: Domain and SSL Configuration

### 6.1 Domain DNS Configuration
Update your domain's DNS records:

```bash
# A Record
ras-dash.yourcompany.com -> Your-Elastic-IP

# CNAME Record (optional, for www)
www.ras-dash.yourcompany.com -> ras-dash.yourcompany.com
```

### 6.2 SSL Certificate Setup (Let's Encrypt)
```bash
# Obtain SSL certificate
sudo certbot --nginx -d ras-dash.yourcompany.com -d www.ras-dash.yourcompany.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Phase 7: Database Setup (PostgreSQL on RDS)

### 7.1 Create RDS Instance
```bash
# RDS Configuration
Engine: PostgreSQL 15
Instance Class: db.t3.micro (for development) or db.t3.medium (production)
Storage: 20GB GP3
Multi-AZ: Yes (for production)
Backup Retention: 7 days
```

### 7.2 Security Group for RDS
```bash
# Inbound Rules
PostgreSQL (5432) - EC2 Security Group only
```

### 7.3 Database Setup
```bash
# Connect to RDS from EC2
psql -h your-rds-endpoint -U postgres -d rasdash_prod

# Run database migrations
npm run migrate:prod
```

---

## Phase 8: Monitoring and Logging

### 8.1 Setup CloudWatch Logs
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 8.2 Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# System monitoring
sudo apt install htop iotop nethogs
```

---

## Phase 9: Deployment Workflow

### 9.1 Development Workflow
```bash
# 1. Local development in VS Code
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create merge request in GitLab
# 3. Code review and approval
# 4. Merge to main branch
# 5. Manual deployment trigger in GitLab CI/CD
```

### 9.2 Deployment Commands
```bash
# Manual deployment from local machine
ssh -i your-key-pair.pem ubuntu@your-ec2-ip
cd /var/www/ras-dash
git pull origin main
npm ci --production
npm run build
pm2 restart ecosystem.config.js
```

### 9.3 Rollback Procedure
```bash
# Quick rollback
pm2 stop ras-dash
git reset --hard HEAD~1  # or specific commit
npm ci --production
npm run build
pm2 start ecosystem.config.js
```

---

## Phase 10: Security Best Practices

### 10.1 Server Security
```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 10.2 Application Security
```bash
# Environment variables
sudo nano /etc/environment
# Add production environment variables

# Secure file permissions
sudo chown -R ubuntu:ubuntu /var/www/ras-dash
chmod -R 755 /var/www/ras-dash
chmod 600 /var/www/ras-dash/.env
```

---

## Phase 11: Performance Optimization

### 11.1 Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable HTTP/2
listen 443 ssl http2;

# Enable browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 11.2 Node.js Optimization
```javascript
// In your app
// Enable compression
const compression = require('compression');
app.use(compression());

// Connection pooling for database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Phase 12: Backup and Disaster Recovery

### 12.1 Automated Backups
```bash
# Database backup script
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/rasdash_$DATE.sql
aws s3 cp /backups/rasdash_$DATE.sql s3://your-backup-bucket/

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /home/ubuntu/scripts/backup-db.sh
```

### 12.2 Application Backup
```bash
# Code backup (already in GitLab)
# Environment backup
tar -czf /backups/app-config_$(date +%Y%m%d).tar.gz /var/www/ras-dash/.env /etc/nginx/sites-available/ras-dash
```

---

## Troubleshooting Common Issues

### Issue 1: GitLab CI/CD Pipeline Fails
```bash
# Check GitLab CI/CD logs
# Verify environment variables
# Test SSH connection to EC2
```

### Issue 2: Application Won't Start
```bash
# Check PM2 logs
pm2 logs ras-dash

# Check system resources
htop
df -h
```

### Issue 3: SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal
```

### Issue 4: Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL

# Check security groups
# Verify RDS endpoint
```

---

## Success Verification Checklist

- [ ] VS Code can push to GitLab
- [ ] GitLab CI/CD pipeline runs successfully
- [ ] Application deploys to EC2 without errors
- [ ] Domain resolves to EC2 instance
- [ ] SSL certificate is valid and working
- [ ] Application loads at https://your-domain.com
- [ ] Database connections work
- [ ] All features function correctly
- [ ] Monitoring and logging are active
- [ ] Backups are running

---

## Cost Optimization Tips

1. **Use AWS Reserved Instances** for long-term savings
2. **Implement CloudFront CDN** for better performance and reduced bandwidth costs
3. **Use AWS Application Load Balancer** for high availability
4. **Set up CloudWatch alarms** for cost monitoring
5. **Use AWS Budgets** to track spending

---

## Next Steps for Production

1. **Implement Auto Scaling** for high traffic
2. **Set up Multiple Availability Zones** for redundancy
3. **Add Application Performance Monitoring** (APM)
4. **Implement Blue-Green Deployments** for zero-downtime updates
5. **Add Comprehensive Testing** in CI/CD pipeline

---

*Last Updated: August 4, 2025*
*Pipeline Version: 1.0*
*Next Review: September 4, 2025*