# GitLab CI/CD to AWS Deployment Guide

## Overview
Complete setup guide for creating a GitLab repository, connecting VS Code, and establishing automated deployment pipeline to AWS for the RAS-DASH cybersecurity platform.

## Step 1: Create GitLab Repository

### 1.1 Create New Repository
1. Go to [GitLab.com](https://gitlab.com)
2. Click "New Project" → "Create blank project"
3. Configure repository:
   - **Project name**: `ras-dash-cybersecurity-platform`
   - **Project slug**: `ras-dash-cybersecurity-platform`
   - **Visibility**: Private (recommended for security platform)
   - **Initialize with README**: Uncheck (we'll push existing code)
4. Click "Create project"

### 1.2 Get Repository URL
After creation, copy the repository URL:
```
https://gitlab.com/yourusername/ras-dash-cybersecurity-platform.git
```

## Step 2: Initialize Local Git Repository

### 2.1 Initialize Git in Your Project
In your VS Code terminal (in project root directory):

```bash
# Initialize git repository
git init

# Add GitLab remote
git remote add origin https://gitlab.com/yourusername/ras-dash-cybersecurity-platform.git

# Create .gitignore if not exists
touch .gitignore
```

### 2.2 Create .gitignore File
```bash
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# AWS credentials
.aws/

# IDE files
.vscode/settings.json
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Temporary files
tmp/
temp/
```

### 2.3 Initial Commit and Push
```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: RAS-DASH Cybersecurity Platform"

# Push to GitLab
git push -u origin main
```

## Step 3: VS Code Git Integration Setup

### 3.1 Configure Git Credentials
```bash
# Set your Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Store credentials (optional, for convenience)
git config --global credential.helper store
```

### 3.2 VS Code Extensions (Recommended)
Install these VS Code extensions:
- GitLens — Git supercharged
- GitGraph
- Git History

### 3.3 VS Code Git Workflow
1. **Make changes** to your code
2. **Stage changes**: Click "+" next to files in Source Control panel
3. **Commit**: Enter commit message and click "✓"
4. **Push**: Click "..." → "Push" or use Ctrl+Shift+P → "Git: Push"

## Step 4: AWS Infrastructure Setup

### 4.1 AWS Services Required
- **EC2**: Application hosting
- **RDS**: PostgreSQL database
- **S3**: Static assets and backups
- **CloudFront**: CDN for fast content delivery
- **Route 53**: Domain management
- **IAM**: Access management
- **CodeDeploy**: Deployment automation

### 4.2 Create AWS Resources

#### EC2 Instance
```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Instance type: t3.medium or larger
# Security groups: Allow HTTP (80), HTTPS (443), SSH (22)
# Key pair: Create new key pair for SSH access
```

#### RDS PostgreSQL Database
```bash
# Create RDS PostgreSQL instance
# Engine: PostgreSQL 15.x
# Instance class: db.t3.micro (development) or db.t3.small (production)
# Storage: 20GB GP2 (can auto-scale)
# VPC: Same as EC2 instance
# Security group: Allow PostgreSQL (5432) from EC2 security group
```

#### S3 Bucket
```bash
# Create S3 bucket for static assets
# Bucket name: ras-dash-assets-[random-string]
# Region: Same as EC2
# Public access: Block all public access (use CloudFront)
```

### 4.3 IAM User for CI/CD
Create IAM user with these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*",
        "rds:*",
        "codedeploy:*",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 5: GitLab CI/CD Pipeline Configuration

### 5.1 Create .gitlab-ci.yml
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  AWS_DEFAULT_REGION: "us-east-1"

# Test stage
test:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - npm ci
  script:
    - npm run test
    - npm run lint
  only:
    - merge_requests
    - main

# Build stage
build:
  stage: build
  image: node:${NODE_VERSION}
  before_script:
    - npm ci
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
      - build/
    expire_in: 1 hour
  only:
    - main

# Deploy to staging
deploy_staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache aws-cli openssh-client rsync
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $STAGING_HOST >> ~/.ssh/known_hosts
  script:
    - aws s3 sync ./build s3://$S3_BUCKET_NAME/staging --delete
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$STAGING_HOST "cd /var/www/ras-dash && git pull origin main && npm install && npm run build && pm2 restart ras-dash"
  environment:
    name: staging
    url: https://staging.ras-dash.com
  only:
    - main

# Deploy to production
deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache aws-cli openssh-client rsync
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $PRODUCTION_HOST >> ~/.ssh/known_hosts
  script:
    - aws s3 sync ./build s3://$S3_BUCKET_NAME/production --delete
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$PRODUCTION_HOST "cd /var/www/ras-dash && git pull origin main && npm install && npm run build && pm2 restart ras-dash"
  environment:
    name: production
    url: https://ras-dash.com
  when: manual
  only:
    - main
```

### 5.2 GitLab CI/CD Variables
Go to GitLab Project → Settings → CI/CD → Variables and add:

```
# AWS Credentials
AWS_ACCESS_KEY_ID: [Your AWS Access Key]
AWS_SECRET_ACCESS_KEY: [Your AWS Secret Key]
AWS_DEFAULT_REGION: us-east-1

# S3 Configuration
S3_BUCKET_NAME: ras-dash-assets-production

# CloudFront
CLOUDFRONT_DISTRIBUTION_ID: [Your CloudFront Distribution ID]

# SSH Configuration
SSH_PRIVATE_KEY: [Your EC2 SSH Private Key]
SSH_USER: ubuntu
STAGING_HOST: [Your staging server IP]
PRODUCTION_HOST: [Your production server IP]

# Database
DATABASE_URL: postgresql://username:password@your-rds-endpoint:5432/ras_dash

# Application Secrets
OPENAI_API_KEY: [Your OpenAI API Key]
NODE_ENV: production
```

## Step 6: Server Configuration

### 6.1 EC2 Server Setup Script

Create `scripts/server-setup.sh`:
```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Create application directory
sudo mkdir -p /var/www/ras-dash
sudo chown $USER:$USER /var/www/ras-dash

# Clone repository
cd /var/www/ras-dash
git clone https://gitlab.com/yourusername/ras-dash-cybersecurity-platform.git .

# Install dependencies
npm install

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ras-dash',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Install and configure Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/ras-dash << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/ras-dash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate (Certbot)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.2 Database Migration Script

Create `scripts/deploy-database.sh`:
```bash
#!/bin/bash

# Run database migrations
npm run db:push

# Seed database (if needed)
npm run db:seed
```

## Step 7: Deployment Workflow

### 7.1 Development Workflow
```bash
# 1. Make changes in VS Code
# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Feature: Add new functionality"
git push origin main

# 4. Pipeline automatically runs:
#    - Tests
#    - Builds
#    - Deploys to staging
#    - Waits for manual approval for production
```

### 7.2 Production Deployment
1. **Automatic Staging**: Every push to `main` deploys to staging
2. **Manual Production**: Go to GitLab → CI/CD → Pipelines → Click "Deploy to Production"

## Step 8: Monitoring and Maintenance

### 8.1 Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs ras-dash

# Restart application
pm2 restart ras-dash
```

### 8.2 Database Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /var/backups/ras-dash-$DATE.sql
aws s3 cp /var/backups/ras-dash-$DATE.sql s3://ras-dash-backups/
```

## Step 9: Security Considerations

### 9.1 Environment Variables
- Never commit `.env` files
- Use GitLab CI/CD variables for secrets
- Rotate keys regularly

### 9.2 AWS Security
- Use IAM roles with minimal permissions
- Enable CloudTrail for audit logging
- Configure VPC security groups properly
- Enable RDS encryption

### 9.3 Application Security
- Keep dependencies updated
- Use HTTPS only
- Implement proper authentication
- Regular security audits

## Troubleshooting

### Common Issues
1. **Pipeline fails**: Check GitLab CI/CD variables
2. **SSH connection fails**: Verify SSH key and security groups
3. **Database connection fails**: Check RDS security groups and connection string
4. **Build fails**: Check Node.js version compatibility

### Debug Commands
```bash
# Check pipeline logs in GitLab
# SSH to server and check:
pm2 logs ras-dash
sudo nginx -t
sudo systemctl status nginx
```

## Next Steps

1. **Domain Setup**: Configure your domain with Route 53
2. **SSL Certificate**: Set up automatic SSL renewal
3. **Monitoring**: Add CloudWatch monitoring
4. **Backup Strategy**: Implement automated backups
5. **Load Balancing**: Add Application Load Balancer for high availability

This setup provides a complete CI/CD pipeline from VS Code to AWS with automated testing, building, and deployment for your RAS-DASH cybersecurity platform.