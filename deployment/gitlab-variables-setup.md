# GitLab CI/CD Variables Setup Guide

This guide explains how to configure the required variables in GitLab for your CI/CD pipeline.

## 🔧 Setting Up GitLab Variables

Go to your GitLab project: **Settings > CI/CD > Variables**

### Required Variables

#### 🔐 SSH Access
```
EC2_PRIVATE_KEY
Type: File
Protected: Yes
Masked: No
Description: Contents of your jaharrison-keypair.pem file
```

#### 🗄️ Database URLs
```
DATABASE_URL_PRODUCTION
Type: Variable
Protected: Yes
Masked: Yes
Value: postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01

DATABASE_URL_STAGING
Type: Variable
Protected: Yes
Masked: Yes
Value: postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01

DATABASE_URL_DEV
Type: Variable
Protected: Yes
Masked: Yes
Value: postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01
```

**Note**: All environments use the same existing AWS RDS database. You can create separate databases for staging/dev if needed, but for now they all point to your current database.

#### 🔑 JWT & Security
```
JWT_SECRET
Type: Variable
Protected: Yes
Masked: Yes
Value: a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
```

#### 📧 Email Configuration
```
EMAIL_FROM
Type: Variable
Protected: No
Masked: No
Value: noreply@rasdash.com

MAILERSEND_API_KEY
Type: Variable
Protected: Yes
Masked: Yes
Value: mlsn.716a734f75dfaa5bd7656ceadc4e0308c51695a6831763e9290eb650b303585d
```

#### 🤖 AI API Keys
```
OPENAI_API_KEY
Type: Variable
Protected: Yes
Masked: Yes
Value: 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

ANTHROPIC_API_KEY
Type: Variable
Protected: Yes
Masked: Yes
Value: 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

NVD_API_KEY
Type: Variable
Protected: Yes
Masked: Yes
Value: 4edc77ed-d681-4472-8713-b24913590364
```

## 📋 Step-by-Step Setup Instructions

### 1. Add EC2 Private Key
1. Go to **Settings > CI/CD > Variables**
2. Click **Add Variable**
3. Key: `EC2_PRIVATE_KEY`
4. Type: **File**
5. Protected: ✅ **Yes**
6. Masked: ❌ **No** (files cannot be masked)
7. Upload your `jaharrison-keypair.pem` file

### 2. Add Database URLs
Create three separate variables for each environment:

**Production Database:**
- Key: `DATABASE_URL_PRODUCTION`
- Value: `postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01`
- Protected: ✅ **Yes**
- Masked: ✅ **Yes**

**Staging Database:**
- Key: `DATABASE_URL_STAGING`
- Value: `postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashstaging`
- Protected: ✅ **Yes**
- Masked: ✅ **Yes**

**Development Database:**
- Key: `DATABASE_URL_DEV`
- Value: `postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01`
- Protected: ✅ **Yes**
- Masked: ✅ **Yes**

### 3. Add All Other Variables
Follow the same pattern for each variable listed above.

## 🌐 DNS Configuration

You'll need to configure your Route 53 DNS records to point to your EC2 instance:

### A Records to Create:
```
rasdash.dev.com          → 34.230.172.229
staging.rasdash.dev.com  → 34.230.172.229
dev.rasdash.dev.com      → 34.230.172.229
```

### Route 53 Setup Commands:
```bash
# Get your hosted zone ID
aws route53 list-hosted-zones --query "HostedZones[?Name=='rasdash.dev.com.'].Id" --output text

# Create A records (replace ZONE_ID with your actual zone ID)
ZONE_ID="Z07201002RI5R8QT9OIF7"

# Production
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "rasdash.dev.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "34.230.172.229"}]
    }
  }]
}'

# Staging
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "staging.rasdash.dev.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "34.230.172.229"}]
    }
  }]
}'

# Development
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "dev.rasdash.dev.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "34.230.172.229"}]
    }
  }]
}'
```

## 🚀 Deployment Workflow

### Branch Strategy:
- **`dev`** → Auto-deploys to `dev.rasdash.dev.com`
- **`staging`** → Auto-deploys to `staging.rasdash.dev.com`
- **`main`** → Manual deploy to `rasdash.dev.com` (production)

### Deployment Process:
1. **Development**: Push to `dev` branch → Auto-deploy to dev environment
2. **Staging**: Merge `dev` to `staging` → Auto-deploy to staging environment
3. **Production**: Merge `staging` to `main` → Manual deploy to production

## 🔍 Monitoring & Logs

### Service Status:
```bash
# Check service status on EC2
sudo systemctl status cypher-api
sudo systemctl status cypher-staging-api
sudo systemctl status cypher-dev-api
```

### View Logs:
```bash
# Production logs
sudo journalctl -u cypher-api -f

# Staging logs
sudo journalctl -u cypher-staging-api -f

# Development logs
sudo journalctl -u cypher-dev-api -f
```

## 🔒 Security Notes

1. **Never commit sensitive variables to your repository**
2. **Use GitLab's protected variables for production secrets**
3. **Regularly rotate API keys and passwords**
4. **Enable SSL certificates for production domains**
5. **Consider using AWS Secrets Manager for enhanced security**

## ✅ Verification Checklist

- [ ] All GitLab variables configured
- [ ] EC2 instance prepared with setup script
- [ ] DNS records pointing to EC2 instance
- [ ] SSH access working from GitLab to EC2
- [ ] Database connectivity tested
- [ ] First deployment successful
- [ ] All environments accessible via their URLs
