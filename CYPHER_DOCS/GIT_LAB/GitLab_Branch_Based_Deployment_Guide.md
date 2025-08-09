# Complete GitLab + AWS Deployment Guide
## From Zero to Production: Single Domain Branch-Based Deployment

---

## Overview

This comprehensive guide walks you through setting up a complete deployment pipeline from scratch, including GitLab repository setup, AWS infrastructure provisioning, and automated CI/CD deployment. The strategy uses GitLab branches to manage different environments while deploying to a single domain.

```
GitLab Repository Structure:
├── develop branch    → Development environment
├── staging branch    → Staging environment  
└── main branch       → Production environment

Single AWS Infrastructure:
└── https://ras-dash.yourcompany.com (All environments)
```

**Total Setup Time: 2-3 hours**
**Monthly Cost: $50-100**

---

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] AWS Account with billing setup
- [ ] GitLab account (free tier works)
- [ ] Domain name (from Route 53 or external registrar)
- [ ] SSH key pair for secure connections
- [ ] Basic command line familiarity

---

## Phase 1: AWS Account Setup and Initial Configuration

### 1.1 Create AWS Account
```bash
# 1. Go to https://aws.amazon.com/
# 2. Click "Create an AWS Account"
# 3. Fill out account details
# 4. Add payment method
# 5. Choose support plan (Basic is free)
# 6. Complete phone verification
```

### 1.2 Configure AWS CLI (Optional but Recommended)
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# AWS Access Key ID: [Your access key]
# AWS Secret Access Key: [Your secret key]  
# Default region name: us-east-1
# Default output format: json
```

### 1.3 Create IAM User for Deployment
```bash
# 1. Go to AWS Console > IAM > Users
# 2. Click "Add users"
# 3. Username: ras-dash-deployer
# 4. Select "Programmatic access"
# 5. Attach policies:
#    - AmazonEC2FullAccess
#    - AmazonRDSFullAccess
#    - AmazonRoute53FullAccess
#    - AmazonS3FullAccess
# 6. Download credentials CSV file
# 7. Save Access Key ID and Secret Access Key
```

---

## Phase 2: Domain Setup and DNS Configuration

### 2.1 Domain Registration (Choose One Option)

#### Option A: Register Domain with AWS Route 53
```bash
# 1. Go to AWS Console > Route 53 > Registered domains
# 2. Click "Register domain"
# 3. Search for your desired domain (e.g., ras-dash.com)
# 4. Add to cart and complete purchase
# 5. Domain will automatically create hosted zone
```

#### Option B: Use Existing Domain (External Registrar)
```bash
# 1. Go to AWS Console > Route 53 > Hosted zones
# 2. Click "Create hosted zone"
# 3. Domain name: your-domain.com
# 4. Type: Public hosted zone
# 5. Note the 4 nameservers provided
# 6. Update your domain registrar's nameservers to AWS ones
```

### 2.2 Create DNS Records
```bash
# 1. Go to Route 53 > Hosted zones > your-domain.com
# 2. We'll add the A record after EC2 setup (need Elastic IP)
# 3. For now, note your hosted zone ID for later use
```

---

## Phase 3: AWS RDS Database Setup

### 3.1 Create RDS Subnet Group
```bash
# 1. Go to AWS Console > RDS > Subnet groups
# 2. Click "Create DB subnet group"
# 3. Name: ras-dash-db-subnet-group
# 4. Description: RAS DASH database subnet group
# 5. VPC: Default VPC
# 6. Add all available subnets
# 7. Click "Create"
```

### 3.2 Create RDS Security Group
```bash
# 1. Go to AWS Console > EC2 > Security Groups
# 2. Click "Create security group"
# 3. Name: ras-dash-db-sg
# 4. Description: RAS DASH database security group
# 5. VPC: Default VPC
# 6. Inbound rules:
#    - Type: PostgreSQL
#    - Port: 5432  
#    - Source: Custom (we'll update after EC2 creation)
# 7. Click "Create security group"
```

### 3.3 Create RDS PostgreSQL Database
```bash
# 1. Go to AWS Console > RDS > Databases
# 2. Click "Create database"
# 3. Engine options:
#    - Engine type: PostgreSQL
#    - Version: PostgreSQL 15.4-R2 (or latest)
# 4. Templates: Free tier (or Production for live use)
# 5. Settings:
#    - DB instance identifier: ras-dash-db
#    - Master username: rasdash_admin
#    - Master password: [Generate secure password, save it!]
# 6. Instance configuration:
#    - DB instance class: db.t3.micro (free tier) or db.t3.small
# 7. Storage:
#    - Storage type: gp3
#    - Allocated storage: 20 GB
#    - Enable storage autoscaling: Yes
#    - Maximum storage threshold: 100 GB
# 8. Connectivity:
#    - VPC: Default VPC
#    - Subnet group: ras-dash-db-subnet-group
#    - Public access: No
#    - VPC security groups: ras-dash-db-sg
#    - Availability Zone: No preference
#    - Port: 5432
# 9. Additional configuration:
#    - Initial database name: rasdash
#    - Backup retention period: 7 days
#    - Backup window: No preference
#    - Maintenance window: No preference
#    - Enable deletion protection: Yes (for production)
# 10. Click "Create database"
# 11. Wait 10-15 minutes for database creation
# 12. Note the endpoint URL from database details
```

---

## Phase 4: EC2 Instance Setup

### 4.1 Create EC2 Security Group
```bash
# 1. Go to AWS Console > EC2 > Security Groups
# 2. Click "Create security group"
# 3. Name: ras-dash-sg
# 4. Description: RAS DASH application security group
# 5. VPC: Default VPC
# 6. Inbound rules:
#    - SSH (22): My IP
#    - HTTP (80): Anywhere-IPv4 (0.0.0.0/0)
#    - HTTPS (443): Anywhere-IPv4 (0.0.0.0/0)
#    - Custom TCP (3000): Anywhere-IPv4 (0.0.0.0/0)
# 7. Outbound rules: All traffic (default)
# 8. Click "Create security group"
```

### 4.2 Create Key Pair
```bash
# 1. Go to AWS Console > EC2 > Key Pairs
# 2. Click "Create key pair"
# 3. Name: ras-dash-key
# 4. Key pair type: RSA
# 5. Private key file format: .pem
# 6. Click "Create key pair"
# 7. Download and save the .pem file securely
# 8. Set permissions: chmod 400 ras-dash-key.pem
```

### 4.3 Launch EC2 Instance
```bash
# 1. Go to AWS Console > EC2 > Instances
# 2. Click "Launch instances"
# 3. Name: ras-dash-server
# 4. Application and OS Images:
#    - Amazon Machine Image (AMI): Ubuntu Server 22.04 LTS
#    - Architecture: 64-bit (x86)
# 5. Instance type: t3.medium (2 vCPU, 4 GiB Memory)
# 6. Key pair: ras-dash-key
# 7. Network settings:
#    - VPC: Default VPC
#    - Subnet: No preference
#    - Auto-assign public IP: Enable
#    - Firewall: Select existing security group (ras-dash-sg)
# 8. Configure storage:
#    - Storage type: gp3
#    - Size: 50 GiB
#    - Encryption: Yes
# 9. Advanced details:
#    - User data (paste the script below)
# 10. Click "Launch instance"
```

### 4.4 EC2 User Data Script
```bash
#!/bin/bash
# Paste this into the User Data field during EC2 launch

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install additional packages
apt-get install -y nginx postgresql-client git htop curl wget unzip

# Install PM2
npm install -g pm2

# Create application directory
mkdir -p /var/www/ras-dash
chown ubuntu:ubuntu /var/www/ras-dash

# Create logs directory
mkdir -p /var/www/ras-dash/logs
chown ubuntu:ubuntu /var/www/ras-dash/logs

# Configure Nginx (basic setup, we'll update later)
systemctl enable nginx
systemctl start nginx

# Set up PM2 startup
pm2 startup

echo "Server setup completed" > /tmp/setup-complete.log
```

### 4.5 Allocate Elastic IP
```bash
# 1. Go to AWS Console > EC2 > Elastic IPs
# 2. Click "Allocate Elastic IP address"
# 3. Network Border Group: us-east-1 (or your region)
# 4. Public IPv4 address pool: Amazon's pool
# 5. Click "Allocate"
# 6. Select the new Elastic IP
# 7. Click "Actions" > "Associate Elastic IP address"
# 8. Resource type: Instance
# 9. Instance: ras-dash-server
# 10. Click "Associate"
# 11. Note the Elastic IP address for DNS configuration
```

### 4.6 Update Database Security Group
```bash
# 1. Go to AWS Console > EC2 > Security Groups
# 2. Select ras-dash-db-sg
# 3. Click "Edit inbound rules"
# 4. Update the PostgreSQL rule:
#    - Source: Custom
#    - Enter the security group ID of ras-dash-sg
# 5. Click "Save rules"
```

---

## Phase 5: Complete DNS Configuration

### 5.1 Create A Record for Domain
```bash
# 1. Go to AWS Console > Route 53 > Hosted zones
# 2. Click on your domain
# 3. Click "Create record"
# 4. Record name: (leave blank for root domain)
# 5. Record type: A
# 6. Value: [Your Elastic IP address]
# 7. TTL: 300
# 8. Click "Create records"
```

### 5.2 Create WWW CNAME Record
```bash
# 1. Click "Create record" again
# 2. Record name: www
# 3. Record type: CNAME
# 4. Value: your-domain.com
# 5. TTL: 300
# 6. Click "Create records"
```

### 5.3 Test DNS Resolution
```bash
# Wait 5-10 minutes, then test:
nslookup your-domain.com
ping your-domain.com
```

---

## Phase 6: GitLab Repository Setup

### 6.1 Create GitLab Account and Project
```bash
# 1. Go to https://gitlab.com
# 2. Click "Sign up" or "Sign in"
# 3. Complete account creation
# 4. Click "New project"
# 5. Choose "Create blank project"
# 6. Project name: ras-dash-production
# 7. Project slug: ras-dash-production
# 8. Visibility: Private
# 9. Initialize repository with a README: Yes
# 10. Click "Create project"
```

### 6.2 Configure SSH Keys for GitLab
```bash
# Generate SSH key (on your local machine)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
# File: ~/.ssh/gitlab_rsa
# Passphrase: (optional)

# Add SSH key to GitLab
cat ~/.ssh/gitlab_rsa.pub
# 1. Go to GitLab > User Settings > SSH Keys
# 2. Paste the public key
# 3. Title: Your Computer Name
# 4. Click "Add key"

# Test SSH connection
ssh -T git@gitlab.com
```

### 6.3 Set Up Branch Structure
```bash
# Clone repository locally
git clone git@gitlab.com:yourusername/ras-dash-production.git
cd ras-dash-production

# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Create and push staging branch
git checkout -b staging
git push -u origin staging

# Go back to main
git checkout main
```

### 6.4 Configure Branch Protection Rules
```bash
# 1. Go to GitLab project > Settings > Repository
# 2. Expand "Push Rules"
# 3. Main branch protection:
#    - Branch: main
#    - Allowed to merge: Maintainers
#    - Allowed to push: No one
#    - Require approval: 2 approvals
#    - Remove source branch: Yes
# 4. Staging branch protection:
#    - Branch: staging  
#    - Allowed to merge: Developers + Maintainers
#    - Allowed to push: Maintainers
#    - Require approval: 1 approval
# 5. Click "Save changes"
```

---

## Phase 7: Server Configuration and Application Setup

### 7.1 Connect to EC2 Instance
```bash
# From your local machine
ssh -i "ras-dash-key.pem" ubuntu@your-elastic-ip

# First login - update and verify setup
sudo apt update
node --version  # Should show v20.x.x
npm --version
pm2 --version
nginx -v
```

### 7.2 Configure SSH Keys on Server
```bash
# On EC2 instance, generate SSH key for GitLab
ssh-keygen -t rsa -b 4096 -C "server@your-domain.com"
# File: /home/ubuntu/.ssh/id_rsa

# Add server's public key to GitLab
cat ~/.ssh/id_rsa.pub
# 1. Go to GitLab > User Settings > SSH Keys
# 2. Paste the public key
# 3. Title: RAS-DASH Production Server
# 4. Click "Add key"

# Test connection from server
ssh -T git@gitlab.com
```

### 7.3 Clone Repository and Initial Setup
```bash
# On EC2 instance
cd /var/www/ras-dash
git clone git@gitlab.com:yourusername/ras-dash-production.git .

# Set up git configuration
git config --global user.name "RAS-DASH Server"
git config --global user.email "server@your-domain.com"

# Create environment file
nano .env.production
# Add your environment variables (see Phase 8)
```

### 7.4 Install Application Dependencies
```bash
# Install your application (when you upload it)
npm ci --production
npm run build

# Test basic server functionality
npm start &
curl http://localhost:3000/health
```

---

## Phase 8: Environment Variables and Secrets Management

### 8.1 Create Environment File on Server
```bash
# On EC2 instance
nano /var/www/ras-dash/.env.production

# Add these variables (customize as needed):
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DOMAIN=your-domain.com

# Database connection
DATABASE_URL=postgresql://rasdash_admin:your-db-password@your-rds-endpoint:5432/rasdash

# AI Services
OPENAI_API_KEY=sk-your-openai-key

# External integrations
TENABLE_API_KEY=your-tenable-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Security
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key

# Features
DEBUG_MODE=false
LOG_LEVEL=warn
```

### 8.2 Secure Environment File
```bash
# Set proper permissions
chmod 600 /var/www/ras-dash/.env.production
chown ubuntu:ubuntu /var/www/ras-dash/.env.production
```

---

## Phase 9: GitLab CI/CD Configuration

### 9.1 Add CI/CD Variables to GitLab
```bash
# 1. Go to GitLab project > Settings > CI/CD
# 2. Expand "Variables"
# 3. Add these variables (click "Add variable" for each):

# Server connection
SERVER_HOST = your-elastic-ip
SERVER_USER = ubuntu
SERVER_PRIVATE_KEY = [Paste content of ras-dash-key.pem] (Type: File, Protected: Yes)

# Database
DATABASE_URL = postgresql://rasdash_admin:password@rds-endpoint:5432/rasdash

# API Keys
OPENAI_API_KEY = sk-your-openai-key (Protected: Yes, Masked: Yes)
TENABLE_API_KEY = your-tenable-key (Protected: Yes, Masked: Yes)

# AWS Credentials
AWS_ACCESS_KEY_ID = your-aws-access-key
AWS_SECRET_ACCESS_KEY = your-aws-secret-key (Protected: Yes, Masked: Yes)

# Security
JWT_SECRET = your-jwt-secret (Protected: Yes, Masked: Yes)
SESSION_SECRET = your-session-secret (Protected: Yes, Masked: Yes)
```

### 9.2 Create GitLab CI/CD Pipeline File
```bash
# Create .gitlab-ci.yml in your project root
# (Content from the original Phase 4 in the previous version)
```

---

## Phase 10: VS Code Setup and Development Workflow

### 10.1 Install Required VS Code Extensions
```bash
# Install these extensions for optimal development:
# 1. GitLens — Git supercharged
# 2. Git Graph
# 3. Remote - SSH
# 4. Remote - SSH: Editing Configuration Files
# 5. GitLab Workflow
# 6. Docker
# 7. AWS Toolkit
# 8. Node.js Extension Pack
# 9. PostgreSQL
# 10. Thunder Client (for API testing)
```

### 10.2 Configure VS Code for GitLab Integration
```bash
# 1. Install GitLab Workflow extension
# 2. Go to Command Palette (Ctrl+Shift+P)
# 3. Type "GitLab: Add Account"
# 4. Enter GitLab URL: https://gitlab.com
# 5. Generate Personal Access Token:
#    - Go to GitLab > User Settings > Access Tokens
#    - Name: VS Code Integration
#    - Scopes: api, read_user, read_repository, write_repository
#    - Click "Create personal access token"
# 6. Paste token in VS Code
```

### 10.3 Clone Repository in VS Code
```bash
# Method 1: Command Palette
# 1. Ctrl+Shift+P > "Git: Clone"
# 2. Enter: git@gitlab.com:yourusername/ras-dash-production.git
# 3. Select local folder
# 4. Open cloned repository

# Method 2: Terminal
git clone git@gitlab.com:yourusername/ras-dash-production.git
cd ras-dash-production
code .
```

### 10.4 Configure SSH for Remote Development
```bash
# VS Code SSH Configuration (~/.ssh/config)
Host ras-dash-server
    HostName your-elastic-ip
    User ubuntu
    IdentityFile ~/.ssh/ras-dash-key.pem
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Connect to server via VS Code
# 1. Install Remote - SSH extension
# 2. Ctrl+Shift+P > "Remote-SSH: Connect to Host"
# 3. Select "ras-dash-server"
# 4. VS Code opens new window connected to server
```

---

## Phase 11: AWS CLI Commands and Automation

### 11.1 Essential AWS CLI Setup
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure profiles for different environments
aws configure --profile ras-dash-prod
# Access Key ID: [Production IAM user key]
# Secret Access Key: [Production IAM user secret]
# Default region: us-east-1
# Default output format: json

# Test connection
aws sts get-caller-identity --profile ras-dash-prod
```

### 11.2 Infrastructure Deployment Commands
```bash
# Create complete infrastructure with AWS CLI
#!/bin/bash
# infrastructure-setup.sh

# Variables
DOMAIN_NAME="your-domain.com"
KEY_NAME="ras-dash-key"
INSTANCE_TYPE="t3.medium"
DB_PASSWORD="YourSecureDbPassword123!"

echo "Creating RAS-DASH infrastructure..."

# 1. Create security groups
echo "Creating security groups..."
EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name ras-dash-sg \
    --description "RAS DASH application security group" \
    --query 'GroupId' --output text)

DB_SG_ID=$(aws ec2 create-security-group \
    --group-name ras-dash-db-sg \
    --description "RAS DASH database security group" \
    --query 'GroupId' --output text)

# 2. Configure security group rules
echo "Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $EC2_SG_ID \
    --protocol tcp --port 3000 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $DB_SG_ID \
    --protocol tcp --port 5432 \
    --source-group $EC2_SG_ID

# 3. Create DB subnet group
echo "Creating DB subnet group..."
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=default-for-az,Values=true" \
    --query 'Subnets[].SubnetId' --output text)

aws rds create-db-subnet-group \
    --db-subnet-group-name ras-dash-db-subnet-group \
    --db-subnet-group-description "RAS DASH database subnet group" \
    --subnet-ids $SUBNET_IDS

# 4. Create RDS database
echo "Creating RDS database..."
aws rds create-db-instance \
    --db-instance-identifier ras-dash-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username rasdash_admin \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name rasdash \
    --vpc-security-group-ids $DB_SG_ID \
    --db-subnet-group-name ras-dash-db-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted \
    --deletion-protection

# 5. Launch EC2 instance
echo "Launching EC2 instance..."
USER_DATA=$(base64 -w 0 << 'EOF'
#!/bin/bash
apt-get update && apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs nginx postgresql-client git htop curl wget unzip
npm install -g pm2
mkdir -p /var/www/ras-dash/logs
chown ubuntu:ubuntu /var/www/ras-dash /var/www/ras-dash/logs
systemctl enable nginx && systemctl start nginx
echo "Server setup completed" > /tmp/setup-complete.log
EOF
)

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c7217cdde317cfec \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $EC2_SG_ID \
    --user-data $USER_DATA \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ras-dash-server}]' \
    --query 'Instances[0].InstanceId' --output text)

# 6. Allocate and associate Elastic IP
echo "Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --query 'AllocationId' --output text)

aws ec2 associate-address \
    --instance-id $INSTANCE_ID \
    --allocation-id $ALLOCATION_ID

ELASTIC_IP=$(aws ec2 describe-addresses \
    --allocation-ids $ALLOCATION_ID \
    --query 'Addresses[0].PublicIp' --output text)

echo "Infrastructure created successfully!"
echo "Instance ID: $INSTANCE_ID"
echo "Elastic IP: $ELASTIC_IP"
echo "Database endpoint will be available in 10-15 minutes"
echo "Update your DNS records to point to: $ELASTIC_IP"
```

### 11.3 Database Management Commands
```bash
# Get RDS endpoint
aws rds describe-db-instances \
    --db-instance-identifier ras-dash-db \
    --query 'DBInstances[0].Endpoint.Address' --output text

# Create database backup
aws rds create-db-snapshot \
    --db-instance-identifier ras-dash-db \
    --db-snapshot-identifier ras-dash-backup-$(date +%Y%m%d-%H%M%S)

# Monitor database status
aws rds describe-db-instances \
    --db-instance-identifier ras-dash-db \
    --query 'DBInstances[0].DBInstanceStatus' --output text

# Create read replica (for high availability)
aws rds create-db-instance-read-replica \
    --db-instance-identifier ras-dash-db-replica \
    --source-db-instance-identifier ras-dash-db \
    --db-instance-class db.t3.micro
```

### 11.4 EC2 Management Commands
```bash
# Get instance details
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=ras-dash-server" \
    --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,State.Name]' \
    --output table

# Start/stop instance (for cost savings during development)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0
aws ec2 start-instances --instance-ids i-1234567890abcdef0

# Create AMI backup
aws ec2 create-image \
    --instance-id i-1234567890abcdef0 \
    --name "ras-dash-backup-$(date +%Y%m%d)" \
    --description "RAS DASH server backup"

# Monitor instance health
aws ec2 describe-instance-status \
    --instance-ids i-1234567890abcdef0 \
    --query 'InstanceStatuses[0].[InstanceStatus.Status,SystemStatus.Status]' \
    --output table
```

### 11.5 Route 53 DNS Management
```bash
# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='your-domain.com.'].Id" \
    --output text | cut -d'/' -f3)

# Create/update A record
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "your-domain.com",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "YOUR-ELASTIC-IP"}]
            }
        }]
    }'

# Create www CNAME record
aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch '{
        "Changes": [{
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.your-domain.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "your-domain.com"}]
            }
        }]
    }'
```

---

## Phase 12: VS Code Development Workflow

### 12.1 Daily Development Workflow
```bash
# Morning routine in VS Code
# 1. Open VS Code with project
code /path/to/ras-dash-production

# 2. Pull latest changes
git pull origin develop

# 3. Create feature branch
git checkout -b feature/new-vulnerability-scanner

# 4. Start development server
npm run dev

# 5. Make changes, test locally
# 6. Stage and commit changes
git add .
git commit -m "feat: add vulnerability scanner with AI analysis"

# 7. Push to GitLab
git push origin feature/new-vulnerability-scanner

# 8. Create merge request via VS Code GitLab extension
# Ctrl+Shift+P > "GitLab: Create merge request"
```

### 12.2 Code Management Best Practices
```bash
# VS Code settings.json for project
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["./"],
  "typescript.preferences.importModuleSpecifier": "relative",
  "git.autofetch": true,
  "git.enableSmartCommit": true,
  "remote.SSH.remotePlatform": {
    "your-elastic-ip": "linux"
  },
  "remote.SSH.configFile": "~/.ssh/config"
}

# .vscode/tasks.json for automated tasks
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Deploy to Development",
      "type": "shell",
      "command": "git",
      "args": ["push", "origin", "develop"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Deploy to Staging",
      "type": "shell",
      "command": "git",
      "args": ["checkout", "staging", "&&", "git", "merge", "develop", "&&", "git", "push", "origin", "staging"],
      "group": "build"
    }
  ]
}
```

### 12.3 Remote Development on EC2
```bash
# Connect to server via VS Code
# 1. Ctrl+Shift+P > "Remote-SSH: Connect to Host"
# 2. Select "ras-dash-server"
# 3. VS Code opens new window connected to server

# Server-side development workflow
cd /var/www/ras-dash

# Pull latest changes
git pull origin develop

# Make quick fixes directly on server
nano server/routes/vulnerabilities.js

# Test changes
npm test
pm2 restart ras-dash

# Commit and push from server
git add .
git commit -m "hotfix: resolve vulnerability scanning timeout"
git push origin develop
```

### 12.4 VS Code GitLab Integration Features
```bash
# Available GitLab commands in VS Code:
# Ctrl+Shift+P then:

# "GitLab: Show Issues" - View project issues
# "GitLab: Show Merge Requests" - View open MRs
# "GitLab: Create Merge Request" - Create MR from current branch
# "GitLab: Create Issue" - Create new issue
# "GitLab: Show Project" - View project overview
# "GitLab: Compare Branches" - Compare different branches
# "GitLab: Show Pipeline" - View CI/CD pipeline status
```

---

## Phase 13: SSL Certificate Setup with Let's Encrypt

### 13.1 Install Certbot on EC2
```bash
# On EC2 instance
sudo apt update
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 13.2 Configure Nginx for SSL
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ras-dash

# Add configuration:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/ras-dash /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 13.3 Obtain SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose whether to share email with EFF
# 4. Select redirect option (recommended: 2)

# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add line: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Phase 14: Automated Deployment Scripts

### 14.1 Local Deployment Script
```bash
#!/bin/bash
# deploy.sh - Run from VS Code terminal

ENVIRONMENT=$1
BRANCH=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$BRANCH" ]; then
    echo "Usage: ./deploy.sh {dev|staging|prod} {branch-name}"
    exit 1
fi

echo "Deploying $BRANCH to $ENVIRONMENT environment..."

# Ensure we're on the correct branch
git checkout $BRANCH
git pull origin $BRANCH

case $ENVIRONMENT in
    "dev")
        echo "Pushing to develop branch for development deployment..."
        git checkout develop
        git merge $BRANCH
        git push origin develop
        ;;
    "staging")
        echo "Pushing to staging branch for staging deployment..."
        git checkout staging
        git merge develop
        git push origin staging
        ;;
    "prod")
        echo "Pushing to main branch for production deployment..."
        git checkout main
        git merge staging
        git push origin main
        echo "⚠️  Manual production deployment required in GitLab CI/CD"
        ;;
esac

echo "Deployment initiated successfully!"
```

### 14.2 Server Health Check Script
```bash
#!/bin/bash
# health-check.sh - Monitor server health

echo "=== RAS-DASH Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Server status
echo "🖥️  Server Status:"
uptime
echo ""

# Application status
echo "📱 Application Status:"
pm2 status ras-dash
echo ""

# Database connectivity
echo "🗄️  Database Status:"
pg_isready -h your-rds-endpoint -p 5432 -U rasdash_admin
echo ""

# Nginx status
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""

# SSL certificate status
echo "🔒 SSL Certificate Status:"
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
echo ""

# Disk usage
echo "💾 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# Memory usage
echo "🧠 Memory Usage:"
free -h
echo ""

echo "Health check completed!"
```

### 14.3 Quick Deployment Commands for VS Code Terminal
```bash
# Create aliases for quick deployment
# Add to ~/.bashrc or ~/.zshrc

alias deploy-dev="git checkout develop && git push origin develop"
alias deploy-staging="git checkout staging && git merge develop && git push origin staging"
alias deploy-prod="git checkout main && git merge staging && git push origin main"

# Quick server commands
alias server-logs="ssh -i ~/.ssh/ras-dash-key.pem ubuntu@your-elastic-ip 'pm2 logs ras-dash'"
alias server-status="ssh -i ~/.ssh/ras-dash-key.pem ubuntu@your-elastic-ip 'pm2 status'"
alias server-restart="ssh -i ~/.ssh/ras-dash-key.pem ubuntu@your-elastic-ip 'pm2 restart ras-dash'"

# AWS quick commands
alias aws-status="aws ec2 describe-instances --filters 'Name=tag:Name,Values=ras-dash-server' --query 'Reservations[0].Instances[0].State.Name' --output text"
alias aws-ip="aws ec2 describe-instances --filters 'Name=tag:Name,Values=ras-dash-server' --query 'Reservations[0].Instances[0].PublicIpAddress' --output text"
```

---

## Phase 1: GitLab Repository Branch Structure

### 1.1 Branch Strategy
```bash
# Branch Hierarchy
main (production)
├── staging (pre-production)
│   └── develop (active development)
│       └── feature/* (feature branches)
│       └── hotfix/* (emergency fixes)
```

### 1.2 Branch Protection Rules
```bash
# Main Branch (Production)
- Require merge request approval (2+ approvers)
- Require successful pipeline
- Prevent direct pushes
- Require up-to-date branches
- Manual deployment only

# Staging Branch
- Require merge request approval (1+ approver)
- Require successful pipeline
- Allow maintainer pushes
- Automatic deployment on merge

# Develop Branch
- Require successful pipeline
- Allow developer pushes
- Automatic deployment on push
```

---

## Phase 2: Single AWS Infrastructure Setup

### 2.1 Simplified EC2 Configuration
```bash
# Single Production Server
Instance Type: t3.medium
AMI: Ubuntu 22.04 LTS
Storage: 50GB GP3
Security Group: ras-dash-sg
Elastic IP: Required for stable DNS
Domain: ras-dash.yourcompany.com

# Cost Estimate: ~$50-100/month
```

### 2.2 Security Group
```bash
# ras-dash-sg
Inbound Rules:
SSH (22)      - Your IP only
HTTP (80)     - 0.0.0.0/0
HTTPS (443)   - 0.0.0.0/0
Custom (3000) - 0.0.0.0/0

Outbound Rules:
All Traffic - 0.0.0.0/0
```

### 2.3 Single RDS Database
```bash
# RDS Configuration
Instance: db.t3.small
Engine: PostgreSQL 15
Storage: 50GB GP3
Multi-AZ: Yes (for production stability)
Backup: 30 days retention
Security Group: ras-dash-db-sg

# Single database with environment schema separation
DB Name: rasdash
```

---

## Phase 3: Environment Management via Environment Variables

### 3.1 Application Configuration
```javascript
// server/config/index.js
const config = {
  development: {
    database: {
      url: process.env.DATABASE_URL,
      schema: 'development'
    },
    features: {
      enableDebugMode: true,
      enableNewFeatures: true,
      enableAnalytics: false
    },
    logging: { level: 'debug' }
  },
  
  staging: {
    database: {
      url: process.env.DATABASE_URL,
      schema: 'staging'
    },
    features: {
      enableDebugMode: false,
      enableNewFeatures: true,
      enableAnalytics: true
    },
    logging: { level: 'info' }
  },
  
  production: {
    database: {
      url: process.env.DATABASE_URL,
      schema: 'public'
    },
    features: {
      enableDebugMode: false,
      enableNewFeatures: false,
      enableAnalytics: true
    },
    logging: { level: 'warn' }
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
```

### 3.2 Database Schema Separation
```sql
-- Create schemas for different environments
CREATE SCHEMA IF NOT EXISTS development;
CREATE SCHEMA IF NOT EXISTS staging;
-- Production uses public schema

-- Set search_path based on environment
-- Development: SET search_path TO development, public;
-- Staging: SET search_path TO staging, public;
-- Production: SET search_path TO public;
```

---

## Phase 4: GitLab CI/CD Pipeline

### 4.1 Complete .gitlab-ci.yml
```yaml
stages:
  - test
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  SERVER_HOST: your-server-ip
  SERVER_USER: ubuntu

# Test Stage - Runs on all branches
test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run test
    - npm run lint
    - npm run type-check
  artifacts:
    reports:
      junit: test-results.xml
      coverage: coverage/cobertura-coverage.xml
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  only:
    - branches
    - merge_requests

# Deploy Development - Automatic on develop branch
deploy-development:
  stage: deploy
  image: alpine:latest
  environment:
    name: development
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Pull latest develop branch
        git checkout develop
        git pull origin develop
        
        # Install dependencies
        npm ci
        
        # Build with development environment
        NODE_ENV=development npm run build
        
        # Run database migrations for development schema
        NODE_ENV=development npm run migrate:development
        
        # Restart application in development mode
        NODE_ENV=development pm2 restart ras-dash || NODE_ENV=development pm2 start ecosystem.config.js --name ras-dash
        
        # Add development banner to indicate environment
        echo "DEVELOPMENT ENVIRONMENT ACTIVE" > /tmp/env-banner.txt
        
        echo "Development deployment completed"
      EOF
  only:
    - develop
  when: on_success

# Deploy Staging - Automatic on staging branch
deploy-staging:
  stage: deploy
  image: alpine:latest
  environment:
    name: staging
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Pull latest staging branch
        git checkout staging
        git pull origin staging
        
        # Install dependencies
        npm ci
        
        # Build with staging environment
        NODE_ENV=staging npm run build
        
        # Run database migrations for staging schema
        NODE_ENV=staging npm run migrate:staging
        
        # Restart application in staging mode
        NODE_ENV=staging pm2 restart ras-dash
        
        # Add staging banner
        echo "STAGING ENVIRONMENT ACTIVE" > /tmp/env-banner.txt
        
        # Run smoke tests
        sleep 10
        curl -f http://localhost:3000/health || exit 1
        
        echo "Staging deployment completed"
      EOF
  only:
    - staging
  when: on_success

# Deploy Production - Manual on main branch
deploy-production:
  stage: deploy
  image: alpine:latest
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Create backup before production deployment
        pm2 save
        tar -czf /tmp/ras-dash-backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/www/ras-dash
        
        # Pull latest main branch
        git checkout main
        git pull origin main
        
        # Install dependencies
        npm ci --production
        
        # Build with production environment
        NODE_ENV=production npm run build
        
        # Run database migrations for production
        NODE_ENV=production npm run migrate:production
        
        # Restart application in production mode with zero downtime
        NODE_ENV=production pm2 reload ras-dash
        
        # Remove environment banner for production
        rm -f /tmp/env-banner.txt
        
        # Verify deployment
        sleep 15
        curl -f http://localhost:3000/health || (pm2 restart ras-dash && exit 1)
        
        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        echo "Production deployment completed successfully"
      EOF
  only:
    - main
  when: manual
  allow_failure: false

# Rollback Production - Emergency manual trigger
rollback-production:
  stage: deploy
  image: alpine:latest
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Rollback to previous commit
        git reset --hard HEAD~1
        
        # Reinstall dependencies
        npm ci --production
        
        # Rebuild
        NODE_ENV=production npm run build
        
        # Restart application
        NODE_ENV=production pm2 restart ras-dash
        
        echo "Rollback completed"
      EOF
  only:
    - main
  when: manual
```

---

## Phase 5: Environment Indication System

### 5.1 Frontend Environment Banner
```javascript
// client/src/components/EnvironmentBanner.jsx
import React from 'react';

const EnvironmentBanner = () => {
  const environment = import.meta.env.VITE_NODE_ENV || 'development';
  
  if (environment === 'production') {
    return null; // No banner in production
  }
  
  const bannerConfig = {
    development: {
      text: 'DEVELOPMENT ENVIRONMENT',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-900'
    },
    staging: {
      text: 'STAGING ENVIRONMENT',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-900'
    }
  };
  
  const config = bannerConfig[environment];
  
  return (
    <div className={`${config.bgColor} ${config.textColor} text-center py-2 text-sm font-semibold`}>
      ⚠️ {config.text} - NOT FOR PRODUCTION USE ⚠️
    </div>
  );
};

export default EnvironmentBanner;
```

### 5.2 Backend Environment Headers
```javascript
// server/middleware/environmentHeaders.js
const environmentHeaders = (req, res, next) => {
  const environment = process.env.NODE_ENV || 'development';
  
  // Add environment header for identification
  res.setHeader('X-Environment', environment);
  
  // Add environment-specific headers
  if (environment !== 'production') {
    res.setHeader('X-Environment-Warning', 'Non-production environment');
  }
  
  next();
};

module.exports = environmentHeaders;
```

---

## Phase 6: Package.json Scripts for Environment Management

### 6.1 Enhanced Package.json Scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development npm run dev:server & npm run dev:client",
    "dev:server": "NODE_ENV=development nodemon server/index.js",
    "dev:client": "NODE_ENV=development vite",
    
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project server/tsconfig.json",
    
    "start:development": "NODE_ENV=development node server/index.js",
    "start:staging": "NODE_ENV=staging node server/index.js",
    "start:production": "NODE_ENV=production node server/index.js",
    
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit",
    
    "migrate:development": "NODE_ENV=development npx drizzle-kit push:pg --config=drizzle.development.config.ts",
    "migrate:staging": "NODE_ENV=staging npx drizzle-kit push:pg --config=drizzle.staging.config.ts", 
    "migrate:production": "NODE_ENV=production npx drizzle-kit push:pg --config=drizzle.production.config.ts",
    
    "db:reset:development": "NODE_ENV=development npm run db:drop && npm run migrate:development && npm run seed:development",
    "db:reset:staging": "NODE_ENV=staging npm run db:drop && npm run migrate:staging && npm run seed:staging",
    
    "seed:development": "NODE_ENV=development node server/seeds/index.js",
    "seed:staging": "NODE_ENV=staging node server/seeds/index.js"
  }
}
```

---

## Phase 7: Development Workflow

### 7.1 Feature Development Workflow
```bash
# 1. Start feature development
git checkout develop
git pull origin develop
git checkout -b feature/new-dashboard-widget

# 2. Develop locally
npm run dev
# Work on feature, test locally

# 3. Commit and push
git add .
git commit -m "feat: add new dashboard widget with real-time metrics"
git push origin feature/new-dashboard-widget

# 4. Create Merge Request to develop
# → Automatic tests run on feature branch
# → Code review process
# → Merge to develop when approved

# 5. Automatic development deployment
# → develop branch triggers deployment
# → Visit https://ras-dash.yourcompany.com (now running development environment)
# → Environment banner shows "DEVELOPMENT ENVIRONMENT"

# 6. Test and iterate
# Make changes, push to develop branch
# Automatic redeployment on each push
```

### 7.2 Staging Release Workflow
```bash
# 1. Create staging release
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Automatic staging deployment
# → staging branch triggers deployment
# → Visit https://ras-dash.yourcompany.com (now running staging environment)
# → Environment banner shows "STAGING ENVIRONMENT"

# 3. QA Testing
# → Full testing on staging environment
# → Performance testing
# → User acceptance testing
```

### 7.3 Production Release Workflow
```bash
# 1. Create production release
git checkout main
git pull origin main
git merge staging
git push origin main

# 2. Manual production deployment
# → Go to GitLab CI/CD > Pipelines
# → Click "Run manual job" for deploy-production
# → Monitor deployment progress

# 3. Production verification
# → Visit https://ras-dash.yourcompany.com (now running production)
# → No environment banner (clean production interface)
# → Monitor logs and metrics
```

---

## Phase 8: GitLab Environment Variables

### 8.1 GitLab CI/CD Variables Setup
```bash
# Required GitLab Variables (Settings > CI/CD > Variables)
SERVER_HOST=your-ec2-elastic-ip
SERVER_USER=ubuntu
SERVER_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# Environment-specific variables
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/rasdash
OPENAI_API_KEY=sk-your-openai-key
TENABLE_API_KEY=your-tenable-key

# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

---

## Phase 9: Environment-Specific Database Configuration

### 9.1 Drizzle Configuration for Multiple Schemas
```typescript
// drizzle.development.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle/development",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  },
  schemaFilter: ["development"]
};

// drizzle.staging.config.ts  
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle/staging",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  },
  schemaFilter: ["staging"]
};

// drizzle.production.config.ts
export default {
  schema: "./shared/schema.ts", 
  out: "./drizzle/production",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  },
  schemaFilter: ["public"]
};
```

---

## Phase 10: Monitoring and Logging

### 10.1 Environment-Aware Logging
```javascript
// server/utils/logger.js
const winston = require('winston');

const getLogLevel = () => {
  switch (process.env.NODE_ENV) {
    case 'production': return 'warn';
    case 'staging': return 'info';  
    case 'development': return 'debug';
    default: return 'debug';
  }
};

const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `[${timestamp}] [${process.env.NODE_ENV?.toUpperCase() || 'DEV'}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: `/var/www/ras-dash/logs/${process.env.NODE_ENV || 'development'}.log` 
    })
  ]
});

module.exports = logger;
```

---

## Benefits of Branch-Based Single Domain Approach

**💡 Simplicity**
- Single domain to manage and secure
- One SSL certificate
- Simplified DNS configuration
- One server to maintain

**💰 Cost Effective**
- Single EC2 instance (~$50-100/month)
- One RDS database
- Single Elastic IP
- Reduced AWS resource costs

**🔄 Clean Workflow**
- Clear branch progression: develop → staging → main
- Environment determined by active branch
- Visual environment indicators
- Easy rollbacks

**⚡ Fast Development**
- Quick environment switching
- Immediate feedback on changes
- Simplified CI/CD pipeline
- Reduced deployment complexity

**🔒 Production Safety**
- Manual approval for production deployments
- Automatic testing on all branches
- Environment separation through database schemas
- Clear visual indicators for non-production environments

This approach gives you proper environment management with branch-based deployments while keeping infrastructure simple and cost-effective.