# RAS DASH VS Code + AWS CLI Deployment Guide

## Overview
This guide provides a complete workflow for deploying RAS DASH using VS Code's integrated AWS tools and CLI, following the EC2 + Route53 + SSL methodology. Everything is managed directly from VS Code with automated scripts and integrated terminal commands.

---

## Prerequisites Setup in VS Code

### Step 1: Install Required VS Code Extensions

```bash
# Open VS Code Extension panel (Ctrl+Shift+X) and install:
```

**Required Extensions:**
- **AWS Toolkit** - Official AWS extension for VS Code
- **Remote - SSH** - Connect to EC2 instances directly
- **Docker** - Container management (optional)
- **GitLens** - Enhanced Git capabilities
- **Thunder Client** - API testing
- **AWS CLI Configure** - AWS credential management

### Step 2: Configure AWS CLI in VS Code

Open VS Code integrated terminal (`Ctrl+`` `) and run:

```bash
# Install AWS CLI (Windows)
curl "https://awscli.amazonaws.com/AWSCLIV2.msi" -o "AWSCLIV2.msi"
msiexec /i AWSCLIV2.msi

# Install AWS CLI (macOS)
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version

# Configure AWS credentials
aws configure
```

**Configuration prompts:**
```
AWS Access Key ID: [Your Access Key]
AWS Secret Access Key: [Your Secret Key]  
Default region name: us-east-1
Default output format: json
```

### Step 3: VS Code Workspace Setup

Create a VS Code workspace configuration:

**.vscode/settings.json**
```json
{
  "aws.region": "us-east-1",
  "aws.profile": "default",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "args": ["-NoExit", "-Command", "& {Set-Location $env:USERPROFILE}"]
    }
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": false
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

**.vscode/tasks.json**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build RAS DASH",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build",
      "problemMatcher": "$tsc"
    },
    {
      "label": "Deploy to EC2",
      "type": "shell",
      "command": "${workspaceFolder}/scripts/deploy.sh",
      "group": "build",
      "dependsOn": "Build RAS DASH"
    },
    {
      "label": "Create AWS Infrastructure",
      "type": "shell",
      "command": "${workspaceFolder}/scripts/create-infrastructure.sh",
      "group": "build"
    },
    {
      "label": "Connect to EC2",
      "type": "shell",
      "command": "${workspaceFolder}/scripts/connect-ec2.sh",
      "group": "build"
    }
  ]
}
```

---

## Infrastructure Setup via VS Code

### Step 1: Create AWS Infrastructure Script

Create deployment scripts in VS Code:

**scripts/create-infrastructure.sh**
```bash
#!/bin/bash

# Source the error handling library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

# Initialize deployment steps
init_progress \
    "Prerequisites Validation" \
    "VPC and Networking Setup" \
    "Security Group Creation" \
    "Key Pair Generation" \
    "RDS Database Setup" \
    "EC2 Instance Launch" \
    "Configuration Generation"

log_info "🚀 Starting RAS DASH AWS Infrastructure Creation..."

# Configuration variables with validation
REGION="${AWS_REGION:-us-east-1}"
KEY_NAME="ras-dash-key-$(date +%s)"  # Unique key name
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
DOMAIN_NAME="${1}"
DB_PASSWORD="${2:-$(openssl rand -base64 32)}"

# Validate required parameters
if [[ -z "$DOMAIN_NAME" ]]; then
    log_error "Domain name is required as first argument"
    echo "Usage: $0 <domain-name> [db-password]"
    exit 1
fi

if [[ ! "$DOMAIN_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
    log_error "Invalid domain name format: $DOMAIN_NAME"
    exit 1
fi

log_info "Configuration:"
log_info "  Domain: $DOMAIN_NAME"
log_info "  Region: $REGION"
log_info "  Instance Type: $INSTANCE_TYPE"
log_info "  Key Name: $KEY_NAME"

# Step 1: Prerequisites validation
start_step
validate_prerequisites
check_connectivity
check_aws_resources
complete_step

# Step 2: Create VPC and Networking
start_step
log_info "📡 Creating VPC and networking..."

VPC_ID=$(retry_with_backoff 3 2 10 aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=RAS-DASH-VPC},{Key=Project,Value=RAS-DASH}]' \
  --query 'Vpc.VpcId' --output text) || handle_aws_error "create-vpc"

if [[ -z "$VPC_ID" || "$VPC_ID" == "null" ]]; then
    log_error "Failed to create VPC"
    exit 1
fi

log_info "VPC Created: $VPC_ID"

# Enable DNS hostnames
retry_with_backoff 3 2 10 aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames || {
    log_error "Failed to enable DNS hostnames for VPC: $VPC_ID"
    exit 1
}

# Create Internet Gateway
IGW_ID=$(retry_with_backoff 3 2 10 aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=RAS-DASH-IGW},{Key=Project,Value=RAS-DASH}]' \
  --query 'InternetGateway.InternetGatewayId' --output text) || handle_aws_error "create-internet-gateway"

if [[ -z "$IGW_ID" || "$IGW_ID" == "null" ]]; then
    log_error "Failed to create Internet Gateway"
    exit 1
fi

retry_with_backoff 3 2 10 aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID || {
    log_error "Failed to attach Internet Gateway: $IGW_ID to VPC: $VPC_ID"
    exit 1
}

log_info "Internet Gateway Created: $IGW_ID"

# Create Public Subnet
SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=RAS-DASH-Public-Subnet}]' \
  --query 'Subnet.SubnetId' --output text)

echo "Subnet Created: $SUBNET_ID"

# Create Route Table
ROUTE_TABLE_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=RAS-DASH-RT}]' \
  --query 'RouteTable.RouteTableId' --output text)

# Add route to Internet Gateway
aws ec2 create-route \
  --route-table-id $ROUTE_TABLE_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate route table with subnet
aws ec2 associate-route-table --subnet-id $SUBNET_ID --route-table-id $ROUTE_TABLE_ID

echo "Route Table Created: $ROUTE_TABLE_ID"

complete_step

# Step 3: Create Security Group
start_step
log_info "🔒 Creating Security Group..."

# Generate unique security group name
SG_NAME="ras-dash-sg-$(date +%s)"

SECURITY_GROUP_ID=$(retry_with_backoff 3 2 10 aws ec2 create-security-group \
  --group-name "$SG_NAME" \
  --description "RAS DASH Security Group for $DOMAIN_NAME" \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=RAS-DASH-SG},{Key=Project,Value=RAS-DASH}]' \
  --query 'GroupId' --output text) || handle_aws_error "create-security-group"

if [[ -z "$SECURITY_GROUP_ID" || "$SECURITY_GROUP_ID" == "null" ]]; then
    log_error "Failed to create Security Group"
    exit 1
fi

log_info "Security Group Created: $SECURITY_GROUP_ID"

# Add security group rules with error handling
log_info "Adding security group rules..."

# SSH access (port 22)
retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 || log_warn "Failed to add SSH rule (may already exist)"

# HTTP access (port 80)
retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 || log_warn "Failed to add HTTP rule (may already exist)"

# HTTPS access (port 443)
retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 || log_warn "Failed to add HTTPS rule (may already exist)"

# Application access (port 5000) - only from VPC
retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 5000 \
  --cidr 10.0.0.0/16 || log_warn "Failed to add application rule (may already exist)"

log_info "Security Group Rules Added"

complete_step

# Step 4: Create Key Pair
start_step
log_info "🔑 Creating Key Pair..."

# Check if key pair already exists and delete it
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" >/dev/null 2>&1; then
    log_warn "Key pair $KEY_NAME already exists, deleting..."
    retry_with_backoff 3 2 10 aws ec2 delete-key-pair --key-name "$KEY_NAME"
fi

# Create new key pair
retry_with_backoff 3 2 10 aws ec2 create-key-pair \
  --key-name $KEY_NAME \
  --tag-specifications 'ResourceType=key-pair,Tags=[{Key=Name,Value=RAS-DASH-KEY},{Key=Project,Value=RAS-DASH}]' \
  --query 'KeyMaterial' \
  --output text > ${KEY_NAME}.pem || {
    log_error "Failed to create key pair: $KEY_NAME"
    exit 1
}

# Secure the key file
chmod 400 ${KEY_NAME}.pem

if [[ ! -f "${KEY_NAME}.pem" || ! -s "${KEY_NAME}.pem" ]]; then
    log_error "Key pair file is empty or doesn't exist: ${KEY_NAME}.pem"
    exit 1
fi

log_info "Key Pair Created: ${KEY_NAME}.pem"

# Step 4: Create RDS Database
echo "🗄️ Creating RDS PostgreSQL Database..."

# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name ras-dash-db-subnet-group \
  --db-subnet-group-description "RAS DASH DB Subnet Group" \
  --subnet-ids $SUBNET_ID

# Create Database Security Group
DB_SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name ras-dash-db-sg \
  --description "RAS DASH Database Security Group" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $DB_SECURITY_GROUP_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $SECURITY_GROUP_ID

# Create RDS Instance
aws rds create-db-instance \
  --db-instance-identifier ras-dash-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name rasdash \
  --master-username rasdash \
  --master-user-password "$DB_PASSWORD" \
  --vpc-security-group-ids $DB_SECURITY_GROUP_ID \
  --db-subnet-group-name ras-dash-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --no-multi-az \
  --no-publicly-accessible

echo "RDS Database Creation Initiated"

# Step 5: Launch EC2 Instance
echo "🖥️ Launching EC2 Instance..."

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y

# Install Node.js 20
dnf install -y nodejs npm git

# Install PM2
npm install -g pm2

# Install nginx
dnf install -y nginx

# Install Python and pip for certbot
dnf install -y python3 python3-pip

# Install certbot
pip3 install certbot certbot-dns-route53

# Create application directory
mkdir -p /opt/ras-dash
chown ec2-user:ec2-user /opt/ras-dash

# Configure nginx
systemctl enable nginx
systemctl start nginx

# Configure PM2 to start on boot
pm2 startup systemd -u ec2-user --hp /home/ec2-user
EOF

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --subnet-id $SUBNET_ID \
  --associate-public-ip-address \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RAS-DASH-Server}]' \
  --query 'Instances[0].InstanceId' --output text)

echo "EC2 Instance Launched: $INSTANCE_ID"

# Wait for instance to be running
echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get instance public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance Public IP: $PUBLIC_IP"

complete_step

# Step 7: Create deployment configuration file
start_step
log_info "📝 Creating deployment configuration..."

# Create comprehensive configuration file
cat > deployment-config.json << EOF
{
  "aws": {
    "region": "$REGION",
    "vpcId": "$VPC_ID",
    "internetGatewayId": "$IGW_ID",
    "subnetId": "$SUBNET_ID",
    "routeTableId": "$ROUTE_TABLE_ID",
    "securityGroupId": "$SECURITY_GROUP_ID",
    "dbSecurityGroupId": "$DB_SECURITY_GROUP_ID",
    "instanceId": "$INSTANCE_ID",
    "publicIp": "$PUBLIC_IP",
    "keyName": "$KEY_NAME"
  },
  "application": {
    "domain": "$DOMAIN_NAME",
    "dbPassword": "$DB_PASSWORD",
    "dbEndpoint": "ras-dash-db.cluster-xyz.${REGION}.rds.amazonaws.com"
  },
  "deployment_state": {
    "status": "infrastructure_created",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "current_step": $CURRENT_STEP,
    "total_steps": $TOTAL_STEPS
  }
}
EOF

complete_step

log_info "✅ Infrastructure created successfully!"
echo ""
log_info "📋 Summary:"
log_info "  VPC ID: $VPC_ID"
log_info "  Subnet ID: $SUBNET_ID" 
log_info "  Security Group ID: $SECURITY_GROUP_ID"
log_info "  Instance ID: $INSTANCE_ID"
log_info "  Public IP: $PUBLIC_IP"
log_info "  Key File: ${KEY_NAME}.pem"
echo ""
log_info "🔑 Next steps:"
log_info "  1. Wait 5-10 minutes for instance initialization"
log_info "  2. Run: ./scripts/deploy-application.sh"
log_info "  3. Configure Route53 DNS: ./scripts/setup-route53.sh"
log_info "  4. Setup SSL certificate: ./scripts/setup-ssl.sh"

# Save final deployment state
save_deployment_state "infrastructure_complete"

# Cleanup temp files
rm -f user-data.sh

log_info "Infrastructure setup completed in $(date)"
```

### Step 2: Application Deployment Script

**scripts/deploy-application.sh**
```bash
#!/bin/bash
set -e

echo "📦 Deploying RAS DASH Application..."

# Load configuration
if [ ! -f "deployment-config.json" ]; then
  echo "❌ deployment-config.json not found. Run create-infrastructure.sh first."
  exit 1
fi

PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
KEY_NAME=$(jq -r '.aws.keyName' deployment-config.json)
DOMAIN=$(jq -r '.application.domain' deployment-config.json)
DB_PASSWORD=$(jq -r '.application.dbPassword' deployment-config.json)

echo "Deploying to: $PUBLIC_IP"
echo "Domain: $DOMAIN"

# Step 1: Package application
echo "📦 Packaging application..."

# Create deployment package
npm install
npm run build

# Create tarball excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.vscode' \
    --exclude='deployment-config.json' \
    --exclude='*.pem' \
    -czf ras-dash-deploy.tar.gz .

echo "Application packaged: ras-dash-deploy.tar.gz"

# Step 2: Wait for EC2 to be ready
echo "⏳ Waiting for EC2 instance to be ready..."
timeout 300 bash -c 'until ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@${PUBLIC_IP} "echo ready"; do sleep 10; done'

# Step 3: Upload and deploy application
echo "🚀 Uploading application to EC2..."

# Upload application package
scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ras-dash-deploy.tar.gz ec2-user@${PUBLIC_IP}:/tmp/

# Deploy application on EC2
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@${PUBLIC_IP} << EOF
set -e

echo "📦 Extracting application..."
cd /opt/ras-dash
sudo tar -xzf /tmp/ras-dash-deploy.tar.gz --strip-components=0
sudo chown -R ec2-user:ec2-user /opt/ras-dash

echo "📦 Installing dependencies..."
npm ci --only=production

echo "🔧 Setting up environment..."
cat > .env << 'EOL'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://rasdash:${DB_PASSWORD}@ras-dash-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/rasdash
DOMAIN=${DOMAIN}
# Add your API keys here
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
EOL

echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/conf.d/ras-dash.conf > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

echo "🔧 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "🚀 Starting application with PM2..."
pm2 start server/index.js --name ras-dash
pm2 save

echo "✅ Application deployed successfully!"
echo "🌐 Application accessible at: http://${PUBLIC_IP}"
EOF

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure Route53 DNS: ./scripts/setup-route53.sh"
echo "  2. Setup SSL certificate: ./scripts/setup-ssl.sh"
echo "  3. Test application: http://${PUBLIC_IP}"

# Cleanup
rm ras-dash-deploy.tar.gz
```

### Step 3: Route53 DNS Setup Script

**scripts/setup-route53.sh**
```bash
#!/bin/bash
set -e

echo "🌐 Setting up Route53 DNS..."

# Load configuration
PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
DOMAIN=$(jq -r '.application.domain' deployment-config.json)

echo "Configuring DNS for: $DOMAIN"
echo "Pointing to IP: $PUBLIC_IP"

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
  --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
  echo "❌ Hosted zone for $DOMAIN not found."
  echo "Please create a hosted zone for your domain first:"
  echo "aws route53 create-hosted-zone --name $DOMAIN --caller-reference $(date +%s)"
  exit 1
fi

echo "Found hosted zone: $HOSTED_ZONE_ID"

# Create Route53 records
cat > route53-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$PUBLIC_IP"
          }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$PUBLIC_IP"
          }
        ]
      }
    }
  ]
}
EOF

# Apply DNS changes
CHANGE_ID=$(aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-changes.json \
  --query 'ChangeInfo.Id' --output text)

echo "DNS change initiated: $CHANGE_ID"

# Wait for changes to propagate
echo "⏳ Waiting for DNS changes to propagate..."
aws route53 wait resource-record-sets-changed --id $CHANGE_ID

echo "✅ DNS configuration completed!"
echo "🌐 Your domain $DOMAIN now points to $PUBLIC_IP"

# Cleanup
rm route53-changes.json
```

### Step 4: SSL Certificate Setup Script

**scripts/setup-ssl.sh**
```bash
#!/bin/bash
set -e

echo "🔒 Setting up SSL Certificate..."

# Load configuration
PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
KEY_NAME=$(jq -r '.aws.keyName' deployment-config.json)
DOMAIN=$(jq -r '.application.domain' deployment-config.json)

echo "Setting up SSL for: $DOMAIN"

# Setup SSL on EC2 instance
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@${PUBLIC_IP} << EOF
set -e

echo "🔧 Configuring AWS credentials for certbot..."
# Configure AWS credentials for Route53 access
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set default.region us-east-1

echo "🔒 Requesting SSL certificate..."
sudo certbot certonly \
  --dns-route53 \
  --email admin@${DOMAIN} \
  --agree-tos \
  --non-interactive \
  -d ${DOMAIN} \
  -d www.${DOMAIN}

echo "🔧 Updating Nginx configuration for SSL..."
sudo tee /etc/nginx/conf.d/ras-dash.conf > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

echo "🔧 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "⏰ Setting up automatic SSL renewal..."
echo "0 12 * * * /usr/local/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -

echo "✅ SSL certificate configured successfully!"
EOF

echo "✅ SSL setup completed!"
echo "🔒 Your site is now accessible at: https://$DOMAIN"
```

---

## VS Code Deployment Workflow

### Step 1: Prepare Project in VS Code

1. **Open RAS DASH project** in VS Code
2. **Create comprehensive deployment scripts** folder structure:
   ```
   ras-dash/
   ├── scripts/
   │   ├── deployment-error-handler.sh          # Core error handling library
   │   ├── check-system-dependencies.sh         # System validation
   │   ├── discover-aws-environment.sh          # AWS resource discovery
   │   ├── install-dependencies.sh              # Dependency installation
   │   ├── resolve-conflicts.sh                 # Conflict resolution
   │   ├── create-infrastructure.sh             # Standard infrastructure
   │   ├── create-infrastructure-with-reuse.sh  # Infrastructure with reuse
   │   ├── deploy-application.sh                # Application deployment
   │   ├── setup-route53.sh                     # DNS configuration
   │   ├── setup-ssl.sh                         # SSL certificate setup
   │   ├── resume-deployment.sh                 # Deployment recovery
   │   ├── validate-deployment.sh               # Post-deployment validation
   │   └── connect-ec2.sh                       # SSH connection
   ├── .vscode/
   │   ├── settings.json
   │   └── tasks.json
   ├── logs/
   │   └── deployment/                          # Deployment logs
   └── package.json
   ```

3. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   ```

4. **Run initial system check**:
   ```bash
   ./scripts/check-system-dependencies.sh
   ```

### Step 2: VS Code Tasks Integration

Access tasks via `Ctrl+Shift+P` → "Tasks: Run Task":

**Available Tasks:**
1. **Create AWS Infrastructure** - Sets up VPC, EC2, RDS, Security Groups
2. **Deploy to EC2** - Packages and deploys application
3. **Build RAS DASH** - Builds the application locally
4. **Connect to EC2** - Opens SSH connection to EC2 instance

### Step 3: One-Click Deployment Process

**Option A: Comprehensive Workflow (Recommended)**
```bash
# 1. System validation and dependency check
./scripts/check-system-dependencies.sh

# 2. Install any missing dependencies
./scripts/install-dependencies.sh

# 3. Discover existing AWS resources for potential reuse
./scripts/discover-aws-environment.sh your-domain.com

# 4. Resolve any detected conflicts
./scripts/resolve-conflicts.sh

# 5. Create infrastructure (choose one approach):
# Standard creation:
./scripts/create-infrastructure.sh your-domain.com
# OR with intelligent reuse:
./scripts/create-infrastructure-with-reuse.sh your-domain.com

# 6. Deploy application
./scripts/deploy-application.sh

# 7. Configure DNS and SSL
./scripts/setup-route53.sh
./scripts/setup-ssl.sh

# 8. Validate deployment
./scripts/validate-deployment.sh
```

**Option B: VS Code Tasks Integration**
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select from available tasks:
   - "Check System Dependencies"
   - "Discover AWS Environment"
   - "Create AWS Infrastructure"
   - "Deploy to EC2"
   - "Validate Deployment"

**Option C: Recovery Workflow**
```bash
# If deployment fails at any point:
./scripts/resume-deployment.sh

# For debugging with verbose output:
DEBUG=true ./scripts/create-infrastructure.sh your-domain.com
```

### Step 4: VS Code Remote SSH Connection

**scripts/connect-ec2.sh**
```bash
#!/bin/bash

# Load configuration
PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
KEY_NAME=$(jq -r '.aws.keyName' deployment-config.json)

echo "Connecting to EC2 instance: $PUBLIC_IP"

# Connect via SSH
ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}
```

**Configure VS Code Remote SSH:**
1. Install "Remote - SSH" extension
2. Press `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
3. Add new SSH target: `ec2-user@your-instance-ip`
4. Select SSH config file location
5. VS Code will open new window connected to EC2

---

## VS Code Development Workflow

### Live Development with Remote SSH

1. **Connect to EC2** via Remote SSH
2. **Open project folder** `/opt/ras-dash` in remote VS Code
3. **Edit files directly** on the server
4. **Use integrated terminal** for server commands:
   ```bash
   # View application logs
   pm2 logs ras-dash
   
   # Restart application
   pm2 restart ras-dash
   
   # Check status
   pm2 status
   
   # View nginx logs
   sudo tail -f /var/log/nginx/access.log
   ```

### Local Development with Sync

**scripts/sync-to-ec2.sh**
```bash
#!/bin/bash
set -e

echo "🔄 Syncing local changes to EC2..."

PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
KEY_NAME=$(jq -r '.aws.keyName' deployment-config.json)

# Build application locally
npm run build

# Sync changes (excluding node_modules)
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '*.pem' \
  --exclude 'deployment-config.json' \
  -e "ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no" \
  ./ ec2-user@${PUBLIC_IP}:/opt/ras-dash/

# Restart application
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ec2-user@${PUBLIC_IP} << 'EOF'
cd /opt/ras-dash
npm ci --only=production
pm2 restart ras-dash
EOF

echo "✅ Sync completed!"
```

### Monitoring and Debugging in VS Code

**scripts/monitor-app.sh**
```bash
#!/bin/bash

PUBLIC_IP=$(jq -r '.aws.publicIp' deployment-config.json)
KEY_NAME=$(jq -r '.aws.keyName' deployment-config.json)

echo "📊 Monitoring RAS DASH application..."

ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP} << 'EOF'
echo "=== Application Status ==="
pm2 status

echo -e "\n=== Recent Application Logs ==="
pm2 logs ras-dash --lines 20

echo -e "\n=== System Resources ==="
free -h
df -h

echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx

echo -e "\n=== Recent Nginx Access Logs ==="
sudo tail -10 /var/log/nginx/access.log
EOF
```

---

## VS Code Extensions for AWS Development

### Recommended Extension Setup

**AWS Toolkit Configuration:**
1. Open AWS Toolkit in VS Code sidebar
2. Configure AWS credentials
3. Select region (us-east-1)
4. View EC2 instances, RDS databases, etc.

**Thunder Client for API Testing:**
1. Create new collection: "RAS DASH API"
2. Add environment variables:
   ```json
   {
     "base_url": "https://your-domain.com",
     "api_key": "your-api-key"
   }
   ```
3. Test endpoints:
   - GET `{{base_url}}/api/health`
   - GET `{{base_url}}/api/user`
   - POST `{{base_url}}/api/auth/login`

### GitLens Integration

**Enhanced Git workflow:**
1. View commit history inline
2. Compare changes before deployment
3. Track deployment commits
4. Blame view for debugging

---

## Automated Deployment Pipeline

### GitHub Actions Integration (Optional)

**.github/workflows/deploy.yml**
```yaml
name: Deploy to AWS EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to EC2
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        EC2_HOST: ${{ secrets.EC2_HOST }}
        EC2_KEY: ${{ secrets.EC2_PRIVATE_KEY }}
      run: |
        echo "$EC2_KEY" > ec2-key.pem
        chmod 400 ec2-key.pem
        
        # Package application
        tar --exclude='node_modules' -czf deploy.tar.gz .
        
        # Upload and deploy
        scp -i ec2-key.pem -o StrictHostKeyChecking=no deploy.tar.gz ec2-user@$EC2_HOST:/tmp/
        
        ssh -i ec2-key.pem -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << 'EOF'
          cd /opt/ras-dash
          tar -xzf /tmp/deploy.tar.gz
          npm ci --only=production
          pm2 restart ras-dash
        EOF
```

---

## Enhanced Error Handling Features

### Comprehensive Error Handling System

The deployment scripts now include a robust error handling library that provides:

**🔍 Error Detection & Logging**
- Automatic error trapping with line-by-line tracking
- Comprehensive logging to `logs/deployment/` directory
- Colored output for easy identification of issues
- Debug mode for detailed troubleshooting

**🔄 Recovery & Retry Mechanisms**
- Exponential backoff retry for transient failures
- AWS-specific error handling with tailored suggestions
- Deployment state tracking and resume functionality
- Automatic rollback capabilities

**📊 Validation & Monitoring**
- Pre-deployment prerequisite validation
- Post-deployment comprehensive validation
- Performance baseline testing
- Security configuration checks

**🛠️ Enhanced Deployment Commands**

```bash
# System dependency and environment check
./scripts/check-system-dependencies.sh

# Discover existing AWS resources for reuse
./scripts/discover-aws-environment.sh your-domain.com

# Install missing dependencies automatically
./scripts/install-dependencies.sh

# Resolve data and process conflicts
./scripts/resolve-conflicts.sh

# Create infrastructure with enhanced error handling
./scripts/create-infrastructure.sh your-domain.com

# Create infrastructure with intelligent resource reuse
./scripts/create-infrastructure-with-reuse.sh your-domain.com

# Resume failed deployment from last successful step
./scripts/resume-deployment.sh

# Comprehensive post-deployment validation
./scripts/validate-deployment.sh

# Debug mode (verbose logging)
DEBUG=true ./scripts/create-infrastructure.sh your-domain.com
```

### Error Handling Features

**1. Automatic Recovery Suggestions**
```bash
# When AWS CLI fails
🔧 Recovery Suggestions:
  • Check AWS credentials: aws configure list
  • Verify IAM permissions for the operation
  • Check AWS service limits and quotas

# When SSH fails
🔧 Recovery Suggestions:
  • Verify SSH key permissions: chmod 400 *.pem
  • Check security group rules for SSH access
  • Verify instance is running
```

**2. Deployment State Tracking**
```json
{
  "deployment_state": {
    "status": "infrastructure_created",
    "timestamp": "2025-08-06T17:30:00Z",
    "current_step": 5,
    "total_steps": 7,
    "exit_code": 0
  }
}
```

**3. Comprehensive Logging**
```bash
# View deployment logs
tail -f logs/deployment/deployment.log

# View error logs only
tail -f logs/deployment/deployment-errors.log

# View validation reports
cat logs/deployment/validation-report-*.json
```

### Troubleshooting and Maintenance

**Enhanced Troubleshooting Commands**

```bash
# Check deployment status and get recovery options
./scripts/resume-deployment.sh

# Run comprehensive validation
./scripts/validate-deployment.sh

# Check AWS resource status
aws ec2 describe-instances --instance-ids $(jq -r '.aws.instanceId' deployment-config.json)

# Test connectivity and performance
curl -w "@scripts/curl-format.txt" -o /dev/null -s "http://$(jq -r '.aws.publicIp' deployment-config.json)"
```

**Common Issues & Enhanced Solutions**

**Issue 1: Permission Denied (Enhanced)**
```bash
# Automated permission fix
./scripts/fix-permissions.sh

# Manual fixes
chmod +x scripts/*.sh
chmod 400 ras-dash-key-*.pem
```

**Issue 2: AWS CLI Errors (Enhanced)**
```bash
# Detailed AWS troubleshooting
./scripts/diagnose-aws.sh

# Check AWS configuration
aws configure list
aws sts get-caller-identity

# Test AWS permissions
aws ec2 describe-regions --output table
```

**Issue 3: Deployment Failures (Enhanced)**
```bash
# Resume from last successful step
./scripts/resume-deployment.sh

# Rollback and start fresh
./scripts/resume-deployment.sh  # Choose option 3

# Debug mode deployment
DEBUG=true ./scripts/create-infrastructure.sh your-domain.com
```

**Issue 4: Application Not Responding (Enhanced)**
```bash
# Comprehensive health check
./scripts/validate-deployment.sh

# SSH troubleshooting
ssh -i "$(jq -r '.aws.keyName' deployment-config.json).pem" \
    ec2-user@"$(jq -r '.aws.publicIp' deployment-config.json)" \
    'pm2 logs ras-dash --lines 50'

# Check system resources
ssh -i "$(jq -r '.aws.keyName' deployment-config.json).pem" \
    ec2-user@"$(jq -r '.aws.publicIp' deployment-config.json)" \
    'top -bn1 | head -20'
```

### Maintenance Commands

**View deployment logs:**
```bash
# Application logs
ssh -i ras-dash-key.pem ec2-user@your-ip "pm2 logs ras-dash --lines 50"

# System logs
ssh -i ras-dash-key.pem ec2-user@your-ip "sudo journalctl -u nginx -f"
```

**Update application:**
```bash
./scripts/sync-to-ec2.sh
```

**Backup database:**
```bash
ssh -i ras-dash-key.pem ec2-user@your-ip << 'EOF'
pg_dump -h your-rds-endpoint -U rasdash rasdash > backup.sql
EOF
```

---

## Cost Optimization Tips

### VS Code Efficiency Features

1. **Use VS Code Tasks** instead of manual commands
2. **Remote SSH development** reduces local resource usage
3. **Automated deployment** prevents configuration drift
4. **Integrated monitoring** catches issues early

### AWS Cost Management

**Monitor costs via VS Code:**
```bash
# Check AWS costs via CLI
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

**Estimated Monthly Costs:**
- **EC2 t3.micro**: ~$8.50/month
- **RDS db.t3.micro**: ~$15/month  
- **Route53 Hosted Zone**: $0.50/month
- **Data Transfer**: ~$1-5/month
- **Total**: ~$25-30/month

---

## Summary

This VS Code + AWS CLI methodology provides:

✅ **Integrated Development Environment** - Everything in VS Code  
✅ **One-Click Deployment** - Automated scripts and tasks  
✅ **Remote Development** - Direct editing on EC2 via SSH  
✅ **Infrastructure as Code** - Scripted AWS resource creation  
✅ **Automated SSL** - Let's Encrypt with Route53 DNS challenge  
✅ **Monitoring Integration** - Built-in monitoring and logging  
✅ **Cost Effective** - ~$25-30/month for production deployment  

The complete workflow allows you to develop, deploy, and maintain RAS DASH entirely within VS Code while leveraging AWS CLI for infrastructure management and deployment automation.