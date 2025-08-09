# AWS Multi-Environment Setup Guide
## Development, Staging, and Production Environments

---

## Environment Overview

| Environment | URL | Purpose | Resources |
|-------------|-----|---------|-----------|
| **Development** | `https://dev.ras-dash.yourcompany.com` | Feature development & testing | Minimal resources, shared database |
| **Staging** | `https://staging.ras-dash.yourcompany.com` | Pre-production testing | Production-like setup, isolated data |
| **Production** | `https://ras-dash.yourcompany.com` | Live customer environment | Full resources, high availability |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Route 53 DNS                           │
│  dev.ras-dash.com → Dev ALB                                │
│  staging.ras-dash.com → Staging ALB                        │
│  ras-dash.com → Production ALB                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│   Development   │     Staging     │       Production        │
│                 │                 │                         │
│ EC2: t3.micro   │ EC2: t3.small   │ EC2: t3.medium (2x)     │
│ RDS: db.t3.micro│ RDS: db.t3.small│ RDS: db.t3.medium       │
│ Single AZ       │ Single AZ       │ Multi-AZ                │
│ Basic monitoring│ Enhanced logs   │ Full monitoring         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Phase 1: AWS Account Structure

### Option A: Single AWS Account with Environment Separation
```bash
# Resource naming convention
ras-dash-dev-*
ras-dash-staging-*  
ras-dash-prod-*

# Tags for cost allocation
Environment: development|staging|production
Project: ras-dash
Owner: security-team
```

### Option B: Multi-Account Setup (Recommended for Enterprise)
```bash
# AWS Organizations structure
Root Account (Billing)
├── Development Account (111111111111)
├── Staging Account (222222222222)  
└── Production Account (333333333333)
```

---

## Phase 2: Development Environment Setup

### 2.1 Development EC2 Configuration
```bash
# Launch Development Instance
Instance Type: t3.micro
AMI: Ubuntu 22.04 LTS
Storage: 10GB GP3
Security Group: ras-dash-dev-sg
Key Pair: ras-dash-dev-key
Subnet: dev-public-subnet-1a

# Tags
Name: ras-dash-dev-server
Environment: development
Project: ras-dash
```

### 2.2 Development Security Group
```bash
# ras-dash-dev-sg
Inbound Rules:
SSH (22)      - Your IP only
HTTP (80)     - 0.0.0.0/0  
HTTPS (443)   - 0.0.0.0/0
Custom (3000) - 0.0.0.0/0
Custom (5432) - dev-db-sg only

Outbound Rules:
All Traffic - 0.0.0.0/0
```

### 2.3 Development RDS Setup
```bash
# RDS Configuration
Instance: db.t3.micro
Engine: PostgreSQL 15
Storage: 20GB GP3
Multi-AZ: No
Backup: 1 day retention
Security Group: ras-dash-dev-db-sg
Subnet Group: ras-dash-dev-db-subnet-group

# Database Details
DB Name: rasdash_dev
Username: rasdash_dev_user
Password: [Auto-generated]
```

### 2.4 Development Elastic IP
```bash
# Allocate and associate Elastic IP
aws ec2 allocate-address --domain vpc --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=ras-dash-dev-eip},{Key=Environment,Value=development}]'
```

---

## Phase 3: Staging Environment Setup

### 3.1 Staging EC2 Configuration
```bash
# Launch Staging Instance
Instance Type: t3.small
AMI: Ubuntu 22.04 LTS
Storage: 20GB GP3
Security Group: ras-dash-staging-sg
Key Pair: ras-dash-staging-key
Subnet: staging-public-subnet-1a

# Tags
Name: ras-dash-staging-server
Environment: staging
Project: ras-dash
```

### 3.2 Staging RDS Setup
```bash
# RDS Configuration
Instance: db.t3.small
Engine: PostgreSQL 15
Storage: 50GB GP3
Multi-AZ: No
Backup: 7 days retention
Security Group: ras-dash-staging-db-sg
Subnet Group: ras-dash-staging-db-subnet-group

# Database Details
DB Name: rasdash_staging
Username: rasdash_staging_user
Password: [Auto-generated]
```

---

## Phase 4: Production Environment Setup

### 4.1 Production EC2 Configuration (Auto Scaling)
```bash
# Launch Template
Instance Type: t3.medium
AMI: Ubuntu 22.04 LTS (with pre-built application AMI)
Storage: 50GB GP3
Security Group: ras-dash-prod-sg
Key Pair: ras-dash-prod-key
User Data: [Application startup script]

# Auto Scaling Group
Min: 2 instances
Max: 6 instances
Desired: 2 instances
Subnets: prod-private-subnet-1a, prod-private-subnet-1b
Health Check: ELB + EC2
```

### 4.2 Production RDS Setup (Multi-AZ)
```bash
# RDS Configuration
Instance: db.t3.medium
Engine: PostgreSQL 15
Storage: 100GB GP3
Multi-AZ: Yes
Backup: 30 days retention
Encryption: Yes
Performance Insights: Enabled
Security Group: ras-dash-prod-db-sg
Subnet Group: ras-dash-prod-db-subnet-group

# Database Details
DB Name: rasdash_prod
Username: rasdash_prod_user
Password: [Auto-generated, stored in Secrets Manager]
```

### 4.3 Production Load Balancer
```bash
# Application Load Balancer
Name: ras-dash-prod-alb
Scheme: Internet-facing
IP Address Type: IPv4
Subnets: prod-public-subnet-1a, prod-public-subnet-1b
Security Group: ras-dash-prod-alb-sg

# Target Group
Name: ras-dash-prod-targets
Protocol: HTTP
Port: 3000
Health Check: /health
```

---

## Phase 5: Route 53 DNS Configuration

### 5.1 Hosted Zone Setup
```bash
# Create hosted zone (if not exists)
Domain: yourcompany.com
Type: Public hosted zone

# Record Sets for each environment
```

### 5.2 DNS Records Configuration
```bash
# Development Environment
Record Name: dev.ras-dash.yourcompany.com
Type: A
Value: [Development Elastic IP]
TTL: 300

# Staging Environment  
Record Name: staging.ras-dash.yourcompany.com
Type: A
Value: [Staging Elastic IP]
TTL: 300

# Production Environment
Record Name: ras-dash.yourcompany.com
Type: A
Alias: Yes
Target: [Production ALB DNS name]
TTL: 300

# Production WWW redirect
Record Name: www.ras-dash.yourcompany.com
Type: CNAME
Value: ras-dash.yourcompany.com
TTL: 300
```

---

## Phase 6: SSL Certificate Management

### 6.1 AWS Certificate Manager (ACM)
```bash
# Request certificates for each environment
# Development Certificate
Domain: dev.ras-dash.yourcompany.com
Validation: DNS validation

# Staging Certificate
Domain: staging.ras-dash.yourcompany.com
Validation: DNS validation

# Production Certificate (Wildcard)
Domain: *.ras-dash.yourcompany.com
Additional Names: ras-dash.yourcompany.com
Validation: DNS validation
```

### 6.2 Certificate Deployment
```bash
# Development: Direct EC2 with Let's Encrypt
sudo certbot --nginx -d dev.ras-dash.yourcompany.com

# Staging: Direct EC2 with Let's Encrypt
sudo certbot --nginx -d staging.ras-dash.yourcompany.com

# Production: ALB with ACM certificate
# Configure in ALB listener settings
```

---

## Phase 7: Environment-Specific Infrastructure as Code

### 7.1 Terraform Configuration Structure
```bash
terraform/
├── environments/
│   ├── development/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── modules/
    ├── compute/
    ├── database/
    ├── networking/
    └── security/
```

### 7.2 Development Terraform Variables
```hcl
# terraform/environments/development/terraform.tfvars
environment = "development"
instance_type = "t3.micro"
min_size = 1
max_size = 1
desired_capacity = 1
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
multi_az = false
backup_retention_period = 1
domain_name = "dev.ras-dash.yourcompany.com"
```

### 7.3 Staging Terraform Variables
```hcl
# terraform/environments/staging/terraform.tfvars
environment = "staging"
instance_type = "t3.small"
min_size = 1
max_size = 2
desired_capacity = 1
db_instance_class = "db.t3.small"
db_allocated_storage = 50
multi_az = false
backup_retention_period = 7
domain_name = "staging.ras-dash.yourcompany.com"
```

### 7.4 Production Terraform Variables
```hcl
# terraform/environments/production/terraform.tfvars
environment = "production"
instance_type = "t3.medium"
min_size = 2
max_size = 6
desired_capacity = 2
db_instance_class = "db.t3.medium"
db_allocated_storage = 100
multi_az = true
backup_retention_period = 30
domain_name = "ras-dash.yourcompany.com"
enable_deletion_protection = true
enable_encryption = true
```

---

## Phase 8: GitLab CI/CD Multi-Environment Pipeline

### 8.1 Enhanced GitLab CI/CD Variables
```bash
# Development Environment
DEV_EC2_HOST=dev.ras-dash.yourcompany.com
DEV_EC2_USER=ubuntu
DEV_EC2_PRIVATE_KEY=[SSH Key]
DEV_DATABASE_URL=postgresql://user:pass@dev-db:5432/rasdash_dev

# Staging Environment
STAGING_EC2_HOST=staging.ras-dash.yourcompany.com
STAGING_EC2_USER=ubuntu
STAGING_EC2_PRIVATE_KEY=[SSH Key]
STAGING_DATABASE_URL=postgresql://user:pass@staging-db:5432/rasdash_staging

# Production Environment
PROD_ALB_TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:...
PROD_DATABASE_URL=[From Secrets Manager]
PROD_AWS_ACCESS_KEY_ID=[Production IAM User]
PROD_AWS_SECRET_ACCESS_KEY=[Production IAM User Secret]
```

### 8.2 Multi-Environment Deployment Script
```yaml
# Enhanced .gitlab-ci.yml
deploy-dev:
  stage: deploy-dev
  environment:
    name: development
    url: https://dev.ras-dash.yourcompany.com
  script:
    - deploy-to-environment.sh development
  only:
    - feature/*
  when: manual

deploy-staging:
  stage: deploy-staging  
  environment:
    name: staging
    url: https://staging.ras-dash.yourcompany.com
  script:
    - deploy-to-environment.sh staging
  only:
    - develop
  when: on_success

deploy-production:
  stage: deploy-production
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  script:
    - deploy-to-production.sh
  only:
    - main
  when: manual
  allow_failure: false
```

---

## Phase 9: Environment-Specific Application Configuration

### 9.1 Development Configuration
```javascript
// config/development.js
module.exports = {
  app: {
    port: 3000,
    host: '0.0.0.0',
    domain: 'dev.ras-dash.yourcompany.com'
  },
  database: {
    url: process.env.DEV_DATABASE_URL,
    ssl: false,
    pool: { min: 1, max: 5 }
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  logging: {
    level: 'debug',
    format: 'dev'
  },
  features: {
    enableDebugMode: true,
    enableNewFeatures: true,
    enableAnalytics: false
  }
};
```

### 9.2 Staging Configuration
```javascript
// config/staging.js
module.exports = {
  app: {
    port: 3000,
    host: '0.0.0.0',
    domain: 'staging.ras-dash.yourcompany.com'
  },
  database: {
    url: process.env.STAGING_DATABASE_URL,
    ssl: true,
    pool: { min: 2, max: 10 }
  },
  redis: {
    host: process.env.REDIS_STAGING_HOST,
    port: 6379
  },
  logging: {
    level: 'info',
    format: 'combined'
  },
  features: {
    enableDebugMode: false,
    enableNewFeatures: true,
    enableAnalytics: true
  }
};
```

### 9.3 Production Configuration
```javascript
// config/production.js
module.exports = {
  app: {
    port: 3000,
    host: '0.0.0.0',
    domain: 'ras-dash.yourcompany.com'
  },
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    pool: { min: 5, max: 20 }
  },
  redis: {
    cluster: process.env.REDIS_CLUSTER_ENDPOINTS.split(','),
    port: 6379
  },
  logging: {
    level: 'warn',
    format: 'json'
  },
  features: {
    enableDebugMode: false,
    enableNewFeatures: false,
    enableAnalytics: true
  }
};
```

---

## Phase 10: Monitoring and Alerting Per Environment

### 10.1 CloudWatch Dashboards
```bash
# Development Dashboard
- Basic metrics only
- Cost monitoring
- Error tracking

# Staging Dashboard  
- Application performance
- Database metrics
- User simulation results

# Production Dashboard
- Full monitoring suite
- Real-time alerts
- Business metrics
- SLA monitoring
```

### 10.2 CloudWatch Alarms
```bash
# Development (Basic monitoring)
- High CPU > 80%
- Disk space > 80%
- Application down

# Staging (Enhanced monitoring)
- Response time > 2s
- Error rate > 5%
- Database connections > 80%

# Production (Comprehensive monitoring)
- Response time > 500ms
- Error rate > 1%
- Database CPU > 70%
- SSL certificate expiry
- Auto Scaling events
- Load balancer health
```

---

## Phase 11: Cost Optimization by Environment

### 11.1 Development Cost Optimization
```bash
# Strategies
- Use t3.micro instances
- Shared RDS instance
- No Multi-AZ
- Minimal backup retention
- Auto-stop instances after hours
- Shared development database

# Estimated Monthly Cost: $25-50
```

### 11.2 Staging Cost Optimization
```bash
# Strategies  
- Use t3.small instances
- Dedicated RDS but smaller
- Standard backups
- Performance testing only during business hours

# Estimated Monthly Cost: $75-150
```

### 11.3 Production Cost Management
```bash
# Strategies
- Right-sized instances with Auto Scaling
- Reserved Instances for predictable workloads
- Spot Instances for non-critical workloads
- CloudWatch cost anomaly detection
- Regular cost reviews

# Estimated Monthly Cost: $300-800 (depending on usage)
```

---

## Phase 12: Backup and Disaster Recovery

### 12.1 Environment-Specific Backup Strategies
```bash
# Development
- Daily automated snapshots
- 7-day retention
- Basic backup testing

# Staging
- Daily automated snapshots  
- 14-day retention
- Weekly backup restore testing
- Cross-region backup copy

# Production
- Continuous backup (Point-in-time recovery)
- 30-day retention
- Cross-region replication
- Monthly disaster recovery testing
- Automated failover procedures
```

---

## Phase 13: Security Considerations

### 13.1 Environment Isolation
```bash
# Network Isolation
- Separate VPCs per environment
- Private subnets for databases
- NAT Gateways for outbound traffic
- VPC Flow Logs enabled

# Access Control
- Environment-specific IAM roles
- MFA required for production access
- Bastion hosts for SSH access
- AWS Systems Manager Session Manager
```

### 13.2 Secrets Management
```bash
# Development
- Environment variables in GitLab CI/CD
- Local .env files for development

# Staging
- AWS Systems Manager Parameter Store
- Encrypted parameters

# Production  
- AWS Secrets Manager
- Automatic rotation enabled
- Cross-region replication
```

---

## Deployment Workflow Summary

### Development Flow
```bash
1. Feature branch → Auto-deploy to dev.ras-dash.yourcompany.com
2. Manual testing on development environment
3. Merge to develop branch when ready
```

### Staging Flow
```bash
1. Develop branch → Auto-deploy to staging.ras-dash.yourcompany.com
2. Automated testing + manual QA
3. Merge to main when staging tests pass
```

### Production Flow
```bash
1. Main branch → Manual deployment to ras-dash.yourcompany.com
2. Blue-green deployment with ALB
3. Automated rollback if health checks fail
```

---

## Benefits of Multi-Environment Setup

✅ **Isolated Testing** - Each environment serves specific testing purposes
✅ **Risk Mitigation** - Issues caught before reaching production
✅ **Parallel Development** - Multiple features can be developed simultaneously
✅ **Realistic Testing** - Staging mirrors production environment
✅ **Cost Control** - Right-sized resources for each environment need
✅ **Compliance** - Separate environments meet regulatory requirements
✅ **Performance Testing** - Load testing in staging without affecting production
✅ **Customer Confidence** - Stable production environment with minimal downtime

This multi-environment setup provides enterprise-grade deployment pipeline with proper separation of concerns and risk mitigation at each stage.