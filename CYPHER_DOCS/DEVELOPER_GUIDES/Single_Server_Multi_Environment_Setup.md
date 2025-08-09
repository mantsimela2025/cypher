# Single Server Multi-Environment Setup Guide
## Development, Staging, and Production on One EC2 Instance

---

## Overview

This setup runs all three environments on a single AWS EC2 instance using different ports and subdomains, significantly reducing costs while maintaining environment separation.

```
Single EC2 Instance (t3.medium)
├── Development (Port 3001) → dev.ras-dash.yourcompany.com
├── Staging (Port 3002) → staging.ras-dash.yourcompany.com
└── Production (Port 3000) → ras-dash.yourcompany.com
```

**Monthly Cost**: ~$25-50 (vs $400-1000 for separate servers)

---

## Phase 1: Single EC2 Instance Setup

### 1.1 EC2 Instance Configuration
```bash
# Single Instance Specifications
Instance Type: t3.medium (2 vCPU, 4GB RAM)
AMI: Ubuntu 22.04 LTS
Storage: 50GB GP3 SSD
Security Group: ras-dash-multi-env-sg
Key Pair: ras-dash-main-key
Elastic IP: Required for stable DNS

# Tags
Name: ras-dash-multi-environment
Environment: multi
Project: ras-dash
Purpose: dev-staging-production
```

### 1.2 Security Group Configuration
```bash
# ras-dash-multi-env-sg
Inbound Rules:
SSH (22)      - Your IP only
HTTP (80)     - 0.0.0.0/0
HTTPS (443)   - 0.0.0.0/0
Custom (3000) - 0.0.0.0/0  # Production
Custom (3001) - 0.0.0.0/0  # Development
Custom (3002) - 0.0.0.0/0  # Staging
Custom (5432) - localhost  # PostgreSQL

Outbound Rules:
All Traffic - 0.0.0.0/0
```

### 1.3 Single Database Setup
```bash
# Option A: Local PostgreSQL on EC2
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create separate databases
sudo -u postgres psql
CREATE DATABASE rasdash_dev;
CREATE DATABASE rasdash_staging;  
CREATE DATABASE rasdash_prod;

CREATE USER rasdash_dev WITH PASSWORD 'dev_password';
CREATE USER rasdash_staging WITH PASSWORD 'staging_password';
CREATE USER rasdash_prod WITH PASSWORD 'prod_password';

GRANT ALL PRIVILEGES ON DATABASE rasdash_dev TO rasdash_dev;
GRANT ALL PRIVILEGES ON DATABASE rasdash_staging TO rasdash_staging;
GRANT ALL PRIVILEGES ON DATABASE rasdash_prod TO rasdash_prod;

# Option B: Single RDS Instance (More Expensive but Managed)
# Create one RDS instance with three databases
```

---

## Phase 2: Server Directory Structure

### 2.1 Application Directory Layout
```bash
/var/www/
├── ras-dash-dev/          # Development environment
│   ├── server/
│   ├── client/
│   ├── shared/
│   ├── .env.development
│   ├── package.json
│   └── ecosystem.dev.config.js
├── ras-dash-staging/      # Staging environment
│   ├── server/
│   ├── client/
│   ├── shared/
│   ├── .env.staging
│   ├── package.json
│   └── ecosystem.staging.config.js
├── ras-dash-prod/         # Production environment
│   ├── server/
│   ├── client/
│   ├── shared/
│   ├── .env.production
│   ├── package.json
│   └── ecosystem.prod.config.js
└── deployment-scripts/    # Shared deployment scripts
    ├── deploy-dev.sh
    ├── deploy-staging.sh
    └── deploy-prod.sh
```

### 2.2 Initial Setup Script
```bash
#!/bin/bash
# setup-environments.sh

# Create directory structure
sudo mkdir -p /var/www/{ras-dash-dev,ras-dash-staging,ras-dash-prod,deployment-scripts}
sudo chown -R ubuntu:ubuntu /var/www/

# Clone repository to each environment
cd /var/www/ras-dash-dev
git clone -b develop git@gitlab.com:yourusername/ras-dash-production.git .

cd /var/www/ras-dash-staging  
git clone -b develop git@gitlab.com:yourusername/ras-dash-production.git .

cd /var/www/ras-dash-prod
git clone -b main git@gitlab.com:yourusername/ras-dash-production.git .

# Install dependencies for each environment
for env in dev staging prod; do
    cd /var/www/ras-dash-$env
    npm ci --production
done
```

---

## Phase 3: Environment-Specific Configurations

### 3.1 Development Environment (.env.development)
```bash
# /var/www/ras-dash-dev/.env.development
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DOMAIN=dev.ras-dash.yourcompany.com

# Database
DATABASE_URL=postgresql://rasdash_dev:dev_password@localhost:5432/rasdash_dev

# AI Services
OPENAI_API_KEY=sk-your-dev-key

# Debug Features
DEBUG_MODE=true
ENABLE_HOT_RELOAD=true
LOG_LEVEL=debug

# External Services (Dev/Test keys)
TENABLE_API_KEY=dev-tenable-key
AWS_ACCESS_KEY_ID=dev-aws-key
```

### 3.2 Staging Environment (.env.staging)
```bash
# /var/www/ras-dash-staging/.env.staging
NODE_ENV=staging
PORT=3002
HOST=0.0.0.0
DOMAIN=staging.ras-dash.yourcompany.com

# Database
DATABASE_URL=postgresql://rasdash_staging:staging_password@localhost:5432/rasdash_staging

# AI Services
OPENAI_API_KEY=sk-your-staging-key

# Staging Features
DEBUG_MODE=false
ENABLE_HOT_RELOAD=false
LOG_LEVEL=info

# External Services (Staging keys)
TENABLE_API_KEY=staging-tenable-key
AWS_ACCESS_KEY_ID=staging-aws-key
```

### 3.3 Production Environment (.env.production)
```bash
# /var/www/ras-dash-prod/.env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DOMAIN=ras-dash.yourcompany.com

# Database
DATABASE_URL=postgresql://rasdash_prod:prod_password@localhost:5432/rasdash_prod

# AI Services  
OPENAI_API_KEY=sk-your-production-key

# Production Features
DEBUG_MODE=false
ENABLE_HOT_RELOAD=false
LOG_LEVEL=warn

# External Services (Production keys)
TENABLE_API_KEY=prod-tenable-key
AWS_ACCESS_KEY_ID=prod-aws-key
```

---

## Phase 4: PM2 Multi-Environment Configuration

### 4.1 Development PM2 Config
```javascript
// /var/www/ras-dash-dev/ecosystem.dev.config.js
module.exports = {
  apps: [{
    name: 'ras-dash-dev',
    script: 'server/index.js',
    cwd: '/var/www/ras-dash-dev',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env.development',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    error_file: '/var/www/ras-dash-dev/logs/err.log',
    out_file: '/var/www/ras-dash-dev/logs/out.log',
    log_file: '/var/www/ras-dash-dev/logs/combined.log',
    time: true,
    watch: true,
    ignore_watch: ['node_modules', 'logs', '.git'],
    max_memory_restart: '300M'
  }]
};
```

### 4.2 Staging PM2 Config
```javascript
// /var/www/ras-dash-staging/ecosystem.staging.config.js
module.exports = {
  apps: [{
    name: 'ras-dash-staging',
    script: 'server/index.js',
    cwd: '/var/www/ras-dash-staging',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env.staging',
    env: {
      NODE_ENV: 'staging',
      PORT: 3002
    },
    error_file: '/var/www/ras-dash-staging/logs/err.log',
    out_file: '/var/www/ras-dash-staging/logs/out.log',
    log_file: '/var/www/ras-dash-staging/logs/combined.log',
    time: true,
    max_memory_restart: '400M'
  }]
};
```

### 4.3 Production PM2 Config
```javascript
// /var/www/ras-dash-prod/ecosystem.prod.config.js
module.exports = {
  apps: [{
    name: 'ras-dash-prod',
    script: 'server/index.js',
    cwd: '/var/www/ras-dash-prod',
    instances: 2,
    exec_mode: 'cluster',
    env_file: '.env.production',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/ras-dash-prod/logs/err.log',
    out_file: '/var/www/ras-dash-prod/logs/out.log',
    log_file: '/var/www/ras-dash-prod/logs/combined.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
```

---

## Phase 5: Nginx Multi-Environment Configuration

### 5.1 Complete Nginx Configuration
```nginx
# /etc/nginx/sites-available/ras-dash-multi-env

# Development Environment
server {
    listen 80;
    server_name dev.ras-dash.yourcompany.com;
    
    location / {
        proxy_pass http://localhost:3001;
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
    
    # Development-specific headers
    add_header X-Environment "development" always;
    add_header X-Debug-Mode "enabled" always;
}

# Staging Environment
server {
    listen 80;
    server_name staging.ras-dash.yourcompany.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Staging-specific headers
    add_header X-Environment "staging" always;
}

# Production Environment
server {
    listen 80;
    server_name ras-dash.yourcompany.com www.ras-dash.yourcompany.com;
    
    # Security headers for production
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
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
    }
    
    # Production-specific headers
    add_header X-Environment "production" always;
}

# Enable the configuration
# sudo ln -s /etc/nginx/sites-available/ras-dash-multi-env /etc/nginx/sites-enabled/
# sudo nginx -t && sudo systemctl restart nginx
```

---

## Phase 6: GitLab CI/CD Single Server Pipeline

### 6.1 Enhanced GitLab CI/CD for Single Server
```yaml
# .gitlab-ci.yml for single server deployment
stages:
  - test
  - deploy-dev
  - deploy-staging
  - deploy-production

variables:
  SERVER_HOST: your-single-server-ip
  SERVER_USER: ubuntu

# Test stage (same as before)
test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run test
    - npm run lint
  only:
    - branches
    - merge_requests

# Deploy to Development Environment
deploy-dev:
  stage: deploy-dev
  image: alpine:latest
  environment:
    name: development
    url: https://dev.ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash-dev
        
        # Pull latest feature branch or develop
        git pull origin $CI_COMMIT_REF_NAME || git pull origin develop
        
        # Install dependencies
        npm ci
        
        # Build application
        npm run build
        
        # Run migrations
        npm run migrate:dev
        
        # Restart development environment
        pm2 restart ras-dash-dev || pm2 start ecosystem.dev.config.js
        
        echo "Development deployment completed"
      EOF
  only:
    - feature/*
    - develop
  when: manual

# Deploy to Staging Environment  
deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  environment:
    name: staging
    url: https://staging.ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash-staging
        
        # Pull latest develop branch
        git checkout develop
        git pull origin develop
        
        # Install dependencies
        npm ci
        
        # Build application
        npm run build
        
        # Run migrations
        npm run migrate:staging
        
        # Restart staging environment
        pm2 restart ras-dash-staging || pm2 start ecosystem.staging.config.js
        
        # Run smoke tests
        sleep 10
        curl -f http://localhost:3002/health || exit 1
        
        echo "Staging deployment completed"
      EOF
  only:
    - develop
  when: on_success

# Deploy to Production Environment
deploy-production:
  stage: deploy-production
  image: alpine:latest
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash-prod
        
        # Create backup
        pm2 save
        tar -czf /tmp/ras-dash-backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/ras-dash-prod
        
        # Pull latest main branch
        git checkout main
        git pull origin main
        
        # Install dependencies
        npm ci --production
        
        # Build application
        npm run build
        
        # Run migrations
        npm run migrate:production
        
        # Restart production environment with zero downtime
        pm2 reload ras-dash-prod
        
        # Verify deployment
        sleep 15
        curl -f http://localhost:3000/health || (pm2 restart ras-dash-prod && exit 1)
        
        echo "Production deployment completed successfully"
      EOF
  only:
    - main
  when: manual
  allow_failure: false
```

---

## Phase 7: Environment Management Scripts

### 7.1 Environment Control Script
```bash
#!/bin/bash
# /var/www/deployment-scripts/env-control.sh

ENVIRONMENT=$1
ACTION=$2

case $ENVIRONMENT in
  "dev"|"development")
    ENV_NAME="ras-dash-dev"
    ENV_DIR="/var/www/ras-dash-dev"
    ENV_CONFIG="ecosystem.dev.config.js"
    ;;
  "staging")
    ENV_NAME="ras-dash-staging"
    ENV_DIR="/var/www/ras-dash-staging"
    ENV_CONFIG="ecosystem.staging.config.js"
    ;;
  "prod"|"production")
    ENV_NAME="ras-dash-prod"
    ENV_DIR="/var/www/ras-dash-prod"
    ENV_CONFIG="ecosystem.prod.config.js"
    ;;
  *)
    echo "Usage: $0 {dev|staging|prod} {start|stop|restart|status|logs}"
    exit 1
    ;;
esac

case $ACTION in
  "start")
    cd $ENV_DIR
    pm2 start $ENV_CONFIG
    ;;
  "stop")
    pm2 stop $ENV_NAME
    ;;
  "restart")
    pm2 restart $ENV_NAME
    ;;
  "status")
    pm2 show $ENV_NAME
    ;;
  "logs")
    pm2 logs $ENV_NAME
    ;;
  *)
    echo "Usage: $0 $ENVIRONMENT {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
```

### 7.2 Database Management Script
```bash
#!/bin/bash
# /var/www/deployment-scripts/db-control.sh

ENVIRONMENT=$1
ACTION=$2

case $ENVIRONMENT in
  "dev")
    DB_NAME="rasdash_dev"
    DB_USER="rasdash_dev"
    ;;
  "staging")
    DB_NAME="rasdash_staging"
    DB_USER="rasdash_staging"
    ;;
  "prod")
    DB_NAME="rasdash_prod"
    DB_USER="rasdash_prod"
    ;;
esac

case $ACTION in
  "backup")
    pg_dump -U $DB_USER $DB_NAME > /tmp/${DB_NAME}_backup_$(date +%Y%m%d_%H%M%S).sql
    ;;
  "restore")
    BACKUP_FILE=$3
    psql -U $DB_USER $DB_NAME < $BACKUP_FILE
    ;;
  "migrate")
    cd /var/www/ras-dash-$ENVIRONMENT
    npm run migrate:$ENVIRONMENT
    ;;
esac
```

---

## Phase 8: SSL Certificate Setup

### 8.1 Multi-Domain SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates for all domains
sudo certbot --nginx -d dev.ras-dash.yourcompany.com -d staging.ras-dash.yourcompany.com -d ras-dash.yourcompany.com -d www.ras-dash.yourcompany.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Phase 9: Monitoring and Resource Management

### 9.1 Resource Monitoring Script
```bash
#!/bin/bash
# /var/www/deployment-scripts/monitor-resources.sh

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

echo "Memory Usage:"
free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}'

echo "Disk Usage:"
df -h | awk '$NF=="/"{printf "%s", $5}'

echo ""
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Port Status ==="
netstat -tlnp | grep -E ":(3000|3001|3002)"

echo ""
echo "=== Database Connections ==="
sudo -u postgres psql -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### 9.2 Log Rotation Setup
```bash
# /etc/logrotate.d/ras-dash-multi-env
/var/www/ras-dash-*/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Phase 10: Backup Strategy

### 10.1 Automated Backup Script
```bash
#!/bin/bash
# /var/www/deployment-scripts/backup-all.sh

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database backups
for env in dev staging prod; do
    case $env in
        "dev") DB_NAME="rasdash_dev"; DB_USER="rasdash_dev" ;;
        "staging") DB_NAME="rasdash_staging"; DB_USER="rasdash_staging" ;;
        "prod") DB_NAME="rasdash_prod"; DB_USER="rasdash_prod" ;;
    esac
    
    pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/${DB_NAME}.sql
done

# Application backups
tar -czf $BACKUP_DIR/applications.tar.gz /var/www/ras-dash-*

# Environment files backup
tar -czf $BACKUP_DIR/configs.tar.gz /var/www/ras-dash-*/.env.* /etc/nginx/sites-available/ras-dash-multi-env

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR s3://your-backup-bucket/$(date +%Y%m%d)/ --recursive

# Schedule in crontab
# 0 2 * * * /var/www/deployment-scripts/backup-all.sh
```

---

## Benefits of Single Server Setup

**💰 Cost Effective**
- Single EC2 instance (~$25-50/month vs $400-1000 for multiple servers)
- One Elastic IP instead of three
- Shared database reduces RDS costs

**🔧 Simple Management**
- All environments on one server for easy maintenance
- Shared monitoring and logging
- Single SSH access point

**🚀 Quick Setup**
- Faster deployment and configuration
- Less AWS resources to manage
- Simpler DNS configuration

**⚡ Resource Efficiency**
- Shared server resources during low usage
- Development and staging can use fewer resources
- Production gets priority during peak times

---

## Potential Limitations

**🔒 Environment Isolation**
- Less isolation between environments
- Shared server resources can cause conflicts
- Production affected if other environments crash

**📊 Resource Contention**
- All environments compete for CPU/memory
- Heavy development work can impact production
- Database contention during peak usage

**🔄 Deployment Complexity**
- Multiple applications on one server
- More complex port management
- Careful resource allocation needed

---

## When to Scale to Multiple Servers

Consider separate servers when:
- Production traffic exceeds single server capacity
- Team size grows beyond 5-10 developers
- Compliance requires strict environment isolation
- Budget allows for dedicated infrastructure
- High availability becomes critical

This single-server setup is perfect for getting started and can easily scale to multiple servers later when needed.