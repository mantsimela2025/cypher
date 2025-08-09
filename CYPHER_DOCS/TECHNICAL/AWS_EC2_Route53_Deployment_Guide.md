# RAS DASH AWS EC2 Deployment with Route53 Guide

## Overview
This guide provides multiple deployment strategies for RAS DASH on AWS EC2 with Route53 domain management and SSL/HTTPS setup. Choose the approach that best fits your requirements and technical comfort level.

---

## Deployment Options Comparison

| Option | Complexity | Cost | SSL Management | Best For |
|--------|------------|------|----------------|----------|
| **Option 1: Simple EC2 + Certbot** | Low | $ | Manual renewal | Quick setup, development |
| **Option 2: EC2 + ALB + ACM** | Medium | $$ | Automatic | Production, scalability |
| **Option 3: Automated Terraform** | High | $$ | Automatic | Enterprise, IaC |
| **Option 4: Docker + Traefik** | Medium | $$ | Automatic | Container-based |

---

## Option 1: Simple EC2 Setup with Let's Encrypt (Fastest)

### Prerequisites
- AWS Account with appropriate permissions
- Domain name registered (can be on any registrar)
- Route53 hosted zone for your domain

### Step 1: Launch EC2 Instance

```bash
# Launch EC2 instance via AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \  # Amazon Linux 2023
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RAS-DASH-Server}]'
```

### Step 2: Configure Security Group
```bash
# Create security group
aws ec2 create-security-group \
  --group-name ras-dash-sg \
  --description "RAS DASH Security Group"

# Allow HTTP, HTTPS, SSH
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

### Step 3: Connect and Setup Server
```bash
# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system and install Node.js
sudo dnf update -y
sudo dnf install -y nodejs npm git

# Verify Node.js version (should be 18+)
node --version
npm --version

# Install PM2 for process management
sudo npm install -g pm2

# Clone your RAS DASH repository
git clone https://github.com/your-repo/ras-dash.git
cd ras-dash

# Install dependencies
npm install

# Build the application
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with your production values
nano .env
```

### Step 4: Setup PostgreSQL Database
```bash
# Install PostgreSQL (or use RDS)
sudo dnf install -y postgresql15-server postgresql15

# Initialize and start PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb rasdash
sudo -u postgres createuser rasdash
sudo -u postgres psql -c "ALTER USER rasdash WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rasdash TO rasdash;"
```

### Step 5: Configure Nginx Reverse Proxy
```bash
# Install Nginx
sudo dnf install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/rasdash.conf
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;  # Your app port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Setup Route53 DNS
```bash
# Create Route53 A record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "your-domain.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "your-ec2-public-ip"}]
      }
    }]
  }'
```

### Step 7: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo dnf install -y python3-pip
pip3 install certbot certbot-nginx certbot-dns-route53

# Create IAM user for Route53 access (minimal permissions)
aws iam create-user --user-name certbot-route53

# Attach Route53 policy to user
aws iam attach-user-policy \
  --user-name certbot-route53 \
  --policy-arn arn:aws:iam::aws:policy/Route53FullAccess

# Create access keys (store securely)
aws iam create-access-key --user-name certbot-route53

# Configure AWS credentials for certbot
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set default.region us-east-1

# Request SSL certificate
sudo certbot certonly \
  --dns-route53 \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive \
  -d your-domain.com \
  -d www.your-domain.com

# Update Nginx configuration for SSL
sudo nano /etc/nginx/conf.d/rasdash.conf
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 8: Start Your Application
```bash
# Start the application with PM2
pm2 start server/index.js --name ras-dash

# Save PM2 configuration
pm2 save
pm2 startup

# Setup automatic SSL renewal
echo "0 12 * * * /usr/local/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -

# Test configuration
sudo nginx -t
sudo systemctl reload nginx
```

---

## Option 2: Production Setup with Application Load Balancer (Recommended)

This approach uses AWS Certificate Manager (ACM) for automatic SSL management and an Application Load Balancer for high availability.

### Step 1: Infrastructure Setup with AWS CLI

```bash
# Create VPC (if needed)
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=RAS-DASH-VPC}]'

# Create subnets in different AZs
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=RAS-DASH-IGW}]'
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxxx --internet-gateway-id igw-xxxxxx

# Create Target Group
aws elbv2 create-target-group \
  --name ras-dash-targets \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxxx \
  --health-check-path /api/health

# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name ras-dash-alb \
  --subnets subnet-xxxxxx subnet-yyyyyy \
  --security-groups sg-xxxxxx
```

### Step 2: Request SSL Certificate
```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN for validation
aws acm list-certificates

# Validate certificate (creates Route53 records automatically)
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:xxxx:certificate/xxxxx
```

### Step 3: Configure Load Balancer Listeners
```bash
# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxxx:loadbalancer/app/ras-dash-alb/xxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:xxxx:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxxx:targetgroup/ras-dash-targets/xxxxx

# Create HTTP to HTTPS redirect
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxxx:loadbalancer/app/ras-dash-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

### Step 4: Update Route53 to Point to ALB
```bash
# Create alias record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "your-domain.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "your-alb-dns-name.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }]
  }'
```

---

## Option 3: Fully Automated Terraform Deployment

### Step 1: Create Terraform Configuration

Create a new directory and add these files:

**main.tf**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "domain" {
  name         = var.domain_name
  private_zone = false
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ras-dash-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ras-dash-igw"
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "ras-dash-public-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "ras-dash-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "ras-dash-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
  }

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ras-dash-web-sg"
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "ras-dash-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ras-dash-alb-sg"
  }
}

# SSL Certificate
resource "aws_acm_certificate" "ssl_cert" {
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "ras-dash-ssl-cert"
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ssl_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.domain.zone_id
}

resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.ssl_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "5m"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ras-dash-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "ras-dash-alb"
  }
}

resource "aws_lb_target_group" "web" {
  name     = "ras-dash-targets"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "ras-dash-targets"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.cert_validation.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }

  tags = {
    Name = "ras-dash-https-listener"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "ras-dash-http-listener"
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id             = aws_subnet.public[0].id

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    domain_name = var.domain_name
    db_host     = aws_db_instance.postgres.endpoint
    db_name     = aws_db_instance.postgres.db_name
    db_user     = aws_db_instance.postgres.username
    db_password = random_password.db_password.result
  }))

  tags = {
    Name = "ras-dash-web"
  }
}

resource "aws_lb_target_group_attachment" "web" {
  target_group_arn = aws_lb_target_group.web.arn
  target_id        = aws_instance.web.id
  port             = 5000
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "postgres" {
  name       = "ras-dash-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "ras-dash-db-subnet-group"
  }
}

resource "aws_security_group" "db" {
  name_prefix = "ras-dash-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "ras-dash-db-sg"
  }
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_db_instance" "postgres" {
  identifier     = "ras-dash-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "rasdash"
  username = "rasdash"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "ras-dash-db"
  }
}

# Route53 Record
resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

**variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "key_pair_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
```

**outputs.tf**
```hcl
output "website_url" {
  description = "URL of the deployed website"
  value       = "https://${var.domain_name}"
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.web.id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}
```

**user_data.sh**
```bash
#!/bin/bash
yum update -y

# Install Node.js
dnf install -y nodejs npm git

# Install PM2
npm install -g pm2

# Create application user
useradd -r -s /bin/false nodejs-app
mkdir -p /opt/ras-dash
chown nodejs-app:nodejs-app /opt/ras-dash

# Clone and setup application
cd /opt/ras-dash
git clone https://github.com/your-repo/ras-dash.git .
npm install
npm run build

# Setup environment
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://${db_user}:${db_password}@${db_host}:5432/${db_name}
OPENAI_API_KEY=your-openai-key-here
PORT=5000
DOMAIN=${domain_name}
EOF

# Change ownership
chown -R nodejs-app:nodejs-app /opt/ras-dash

# Start application with PM2
sudo -u nodejs-app pm2 start server/index.js --name ras-dash
sudo -u nodejs-app pm2 save
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u nodejs-app --hp /home/nodejs-app
```

### Step 2: Deploy with Terraform
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="domain_name=your-domain.com" -var="key_pair_name=your-key-pair"

# Deploy
terraform apply -var="domain_name=your-domain.com" -var="key_pair_name=your-key-pair"
```

---

## Option 4: Docker Deployment with Traefik

This approach uses Docker containers with automatic SSL certificate management.

### Step 1: Create Docker Compose Setup

**docker-compose.yml**
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=route53"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    environment:
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./acme.json:/acme.json
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN_NAME}`)"
      - "traefik.http.routers.dashboard.tls=true"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.service=api@internal"

  postgres:
    image: postgres:15
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rasdash
      POSTGRES_USER: rasdash
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  ras-dash:
    build: .
    container_name: ras-dash
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://rasdash:${DB_PASSWORD}@postgres:5432/rasdash
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=5000
    depends_on:
      - postgres
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ras-dash.rule=Host(`${DOMAIN_NAME}`)"
      - "traefik.http.routers.ras-dash.tls=true"
      - "traefik.http.routers.ras-dash.tls.certresolver=letsencrypt"
      - "traefik.http.services.ras-dash.loadbalancer.server.port=5000"

volumes:
  postgres_data:
```

### Step 2: Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

### Step 3: Environment Setup
```bash
# Create .env file
cat > .env << EOF
DOMAIN_NAME=your-domain.com
DB_PASSWORD=your-secure-db-password
OPENAI_API_KEY=your-openai-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
EOF

# Create acme.json for SSL certificates
touch acme.json
chmod 600 acme.json

# Deploy
docker-compose up -d
```

---

## Cost Comparison

| Component | Option 1 | Option 2 | Option 3 | Option 4 |
|-----------|----------|----------|----------|----------|
| **EC2 Instance** | t3.micro ($8/month) | t3.micro ($8/month) | t3.micro ($8/month) | t3.micro ($8/month) |
| **Load Balancer** | - | $16/month | $16/month | - |
| **Route53** | $0.50/month | $0.50/month | $0.50/month | $0.50/month |
| **RDS Database** | - | $15/month (t3.micro) | $15/month (t3.micro) | - |
| **SSL Certificate** | Free (Let's Encrypt) | Free (ACM) | Free (ACM) | Free (Let's Encrypt) |
| **Total Estimate** | **~$9/month** | **~$40/month** | **~$40/month** | **~$9/month** |

---

## Recommendations

### For Development/Testing: Choose Option 1
- Quickest setup (1-2 hours)
- Lowest cost (~$9/month)
- Manual SSL renewal (every 90 days)
- Single instance (no high availability)

### For Production: Choose Option 2 or 3
- High availability with load balancer
- Automatic SSL certificate management
- Managed database with backups
- Scalable architecture
- Higher cost but better reliability

### For Container Enthusiasts: Choose Option 4
- Modern container-based deployment
- Automatic SSL with Traefik
- Easy to scale and manage
- Good middle ground between simplicity and features

---

## Next Steps

1. **Choose your deployment option** based on your requirements and budget
2. **Set up your domain** in Route53 (if not already done)
3. **Follow the step-by-step guide** for your chosen option
4. **Configure monitoring** (CloudWatch, ELK stack, or similar)
5. **Set up backups** for your database and application data
6. **Configure CI/CD pipeline** for automatic deployments

Would you like me to help you implement any of these options or create additional automation scripts?