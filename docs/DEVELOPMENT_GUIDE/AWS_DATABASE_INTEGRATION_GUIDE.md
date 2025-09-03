# AWS & Database Integration Guide

## 🎯 Overview

This guide covers the integration of AWS services and PostgreSQL database management for the CYPHER application, including production database access, EC2 deployment, and AWS resource management.

## 📋 Table of Contents

1. [AWS CLI Setup & Configuration](#aws-cli-setup--configuration)
2. [PostgreSQL Database Management](#postgresql-database-management)
3. [Production Database (AWS RDS)](#production-database-aws-rds)
4. [EC2 Instance Management](#ec2-instance-management)
5. [S3 Storage Operations](#s3-storage-operations)
6. [Route53 Domain Management](#route53-domain-management)
7. [Security & Access Management](#security--access-management)
8. [Backup & Recovery Procedures](#backup--recovery-procedures)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## 🔧 AWS CLI Setup & Configuration

### **Installation & Verification**
```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
# Should show: aws-cli/2.x.x

# Check installation path
which aws
```

### **Credential Configuration**
```bash
# Interactive configuration
aws configure

# Required information:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
aws configure list
```

### **Multiple Profile Setup**
```bash
# Configure development profile
aws configure --profile cypher-dev
# AWS Access Key ID: [Dev Access Key]
# AWS Secret Access Key: [Dev Secret Key]
# Default region name: us-east-1
# Default output format: json

# Configure production profile
aws configure --profile cypher-prod
# AWS Access Key ID: [Prod Access Key]
# AWS Secret Access Key: [Prod Secret Key]
# Default region name: us-east-1
# Default output format: json

# List profiles
aws configure list-profiles

# Use specific profile
export AWS_PROFILE=cypher-dev
aws s3 ls --profile cypher-prod
```

## 🗄️ PostgreSQL Database Management

### **Local Development Database**
```bash
# Install PostgreSQL
# macOS:
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql-14 postgresql-client-14

# Create development database
createdb cypher_dev -U postgres
createdb cypher_test -U postgres

# Create application user
psql -U postgres -c "CREATE USER cypher_user WITH PASSWORD 'secure_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cypher_dev TO cypher_user;"
```

### **Database Connection Management**
```bash
# Connect to local database
psql -h localhost -U postgres -d cypher_dev

# Connect using connection string
psql "postgresql://postgres:password@localhost:5432/cypher_dev"

# Test connection
pg_isready -h localhost -p 5432 -U postgres
```

### **Common Database Operations**
```bash
# List databases
psql -U postgres -c "\l"

# List tables in database
psql -U postgres -d cypher_dev -c "\dt"

# Describe table structure
psql -U postgres -d cypher_dev -c "\d users"

# Execute SQL file
psql -U postgres -d cypher_dev -f schema.sql

# Export database schema
pg_dump -U postgres -d cypher_dev --schema-only > schema.sql

# Export database data
pg_dump -U postgres -d cypher_dev --data-only > data.sql
```

## 🌐 Production Database (AWS RDS)

### **RDS Instance Information**
```bash
# CYPHER Production Database Details:
# Endpoint: rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
# Port: 5432
# Database: rasdashdevo1
# Username: rasdashadmin
# Password: RasDash2025$
# Region: us-east-1
```

### **Connecting to Production Database**
```bash
# Direct connection
psql -h rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com \
     -U rasdashadmin \
     -d rasdashdevo1 \
     -p 5432

# Using connection string (URL encoded password)
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1"

# Test connection
pg_isready -h rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com -p 5432 -U rasdashadmin
```

### **RDS Management via AWS CLI**
```bash
# Describe RDS instance
aws rds describe-db-instances \
  --db-instance-identifier rasdash-dev-public \
  --region us-east-1

# Get RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier rasdash-dev-public \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text \
  --region us-east-1

# List RDS snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier rasdash-dev-public \
  --region us-east-1

# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier rasdash-dev-public \
  --db-snapshot-identifier rasdash-dev-backup-$(date +%Y%m%d) \
  --region us-east-1
```

### **Database Backup & Restore**
```bash
# Create backup from production
pg_dump "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  > cypher_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore to local database
psql -U postgres -d cypher_dev < cypher_backup_20241201_143000.sql

# Create compressed backup
pg_dump "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  | gzip > cypher_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from compressed backup
gunzip -c cypher_backup_20241201_143000.sql.gz | psql -U postgres -d cypher_dev
```

## 🖥️ EC2 Instance Management

### **CYPHER EC2 Instance Details**
```bash
# Instance ID: i-04a41343a3f51559a
# OS: Windows Server 2019
# Region: us-east-1
# Purpose: CYPHER application deployment
```

### **EC2 Management Commands**
```bash
# Describe EC2 instance
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1

# Get instance status
aws ec2 describe-instance-status \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1

# Start EC2 instance
aws ec2 start-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1

# Stop EC2 instance
aws ec2 stop-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1

# Reboot EC2 instance
aws ec2 reboot-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1
```

### **Get Instance Information**
```bash
# Get public IP address
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text \
  --region us-east-1

# Get private IP address
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' \
  --output text \
  --region us-east-1

# Get instance state
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text \
  --region us-east-1
```

## 📦 S3 Storage Operations

### **S3 Bucket Management**
```bash
# List all S3 buckets
aws s3 ls

# List CYPHER-related buckets
aws s3 ls | grep -i cypher
aws s3 ls | grep -i rasdash

# Create S3 bucket (if needed)
aws s3 mb s3://cypher-app-storage --region us-east-1

# List bucket contents
aws s3 ls s3://your-cypher-bucket/
aws s3 ls s3://your-cypher-bucket/ --recursive
```

### **File Operations**
```bash
# Upload single file
aws s3 cp local-file.txt s3://your-cypher-bucket/

# Upload directory
aws s3 cp ./client/dist s3://your-cypher-bucket/frontend/ --recursive

# Download file
aws s3 cp s3://your-cypher-bucket/file.txt ./downloads/

# Sync directories
aws s3 sync ./client/dist s3://your-cypher-bucket/frontend/
aws s3 sync s3://your-cypher-bucket/backups/ ./backups/

# Delete file
aws s3 rm s3://your-cypher-bucket/old-file.txt

# Delete directory
aws s3 rm s3://your-cypher-bucket/old-folder/ --recursive
```

### **Bucket Policies & Permissions**
```bash
# Get bucket policy
aws s3api get-bucket-policy --bucket your-cypher-bucket

# Set bucket policy
aws s3api put-bucket-policy \
  --bucket your-cypher-bucket \
  --policy file://bucket-policy.json

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-cypher-bucket \
  --versioning-configuration Status=Enabled

# Set bucket encryption
aws s3api put-bucket-encryption \
  --bucket your-cypher-bucket \
  --server-side-encryption-configuration file://encryption.json
```

## 🌐 Route53 Domain Management

### **Domain & DNS Operations**
```bash
# List hosted zones
aws route53 list-hosted-zones

# List CYPHER-related domains
aws route53 list-hosted-zones \
  --query 'HostedZones[?contains(Name, `cypher`) || contains(Name, `rasdash`)]'

# Get domain records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --query 'ResourceRecordSets[?Type==`A`]'

# Create DNS record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-change.json
```

### **DNS Testing**
```bash
# Test domain resolution
nslookup your-domain.com
dig your-domain.com
dig @8.8.8.8 your-domain.com

# Test specific record types
dig your-domain.com A
dig your-domain.com CNAME
dig your-domain.com MX
```

## 🔐 Security & Access Management

### **IAM User & Role Management**
```bash
# Get current user information
aws sts get-caller-identity

# List IAM users
aws iam list-users

# List IAM roles
aws iam list-roles

# Get user policies
aws iam list-attached-user-policies --user-name your-username

# Create access key (if needed)
aws iam create-access-key --user-name your-username
```

### **Security Groups & Network**
```bash
# List security groups
aws ec2 describe-security-groups --region us-east-1

# Get security group for CYPHER instance
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].SecurityGroups' \
  --region us-east-1

# Describe specific security group
aws ec2 describe-security-groups \
  --group-ids sg-1234567890abcdef0 \
  --region us-east-1
```

## 💾 Backup & Recovery Procedures

### **Automated Backup Scripts**
```bash
#!/bin/bash
# backup-cypher.sh - Daily backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/cypher"
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
pg_dump "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  | gzip > "$BACKUP_DIR/cypher_db_$DATE.sql.gz"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/cypher_db_$DATE.sql.gz" \
  s3://your-cypher-backups/database/

# Clean old local backups (keep last 7 days)
find $BACKUP_DIR -name "cypher_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: cypher_db_$DATE.sql.gz"
```

### **Recovery Procedures**
```bash
# List available backups
aws s3 ls s3://your-cypher-backups/database/

# Download backup
aws s3 cp s3://your-cypher-backups/database/cypher_db_20241201_143000.sql.gz ./

# Restore database
gunzip -c cypher_db_20241201_143000.sql.gz | \
  psql -h localhost -U postgres -d cypher_dev_restored
```

## 📊 Monitoring & Troubleshooting

### **Database Monitoring**
```bash
# Check database connections
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  -c "SELECT pg_size_pretty(pg_database_size('rasdashdevo1'));"

# Check table sizes
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" \
  -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### **AWS Resource Monitoring**
```bash
# Check EC2 instance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-04a41343a3f51559a \
  --start-time 2024-12-01T00:00:00Z \
  --end-time 2024-12-01T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region us-east-1

# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=rasdash-dev-public \
  --start-time 2024-12-01T00:00:00Z \
  --end-time 2024-12-01T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region us-east-1
```

### **Common Troubleshooting**
```bash
# Test network connectivity
telnet rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com 5432
nc -zv rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com 5432

# Check AWS CLI configuration
aws configure list
aws sts get-caller-identity

# Test S3 access
aws s3 ls --debug

# Check EC2 instance logs
aws ec2 get-console-output \
  --instance-id i-04a41343a3f51559a \
  --region us-east-1
```

---

**Last Updated:** December 2024  
**Status:** ✅ **Complete AWS & Database Integration Guide**  
**Next Review:** After infrastructure changes
