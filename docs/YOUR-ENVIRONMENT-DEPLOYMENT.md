# 🎯 CYPHER Deployment Guide - Your Specific Environment

## 📊 **Your Current AWS Environment**

### **✅ Discovered Configuration:**
- **AWS Region**: `us-east-1`
- **Domain**: `rasdash.dev.com` (Route53 hosted zone configured)
- **S3 Deployment Bucket**: `cypher-deployment`
- **Deployment Package**: `cypher-deployment-latest.zip` (8.2 MB)
- **Node.js Version**: `v20.16.0` (will be installed)
- **Current EC2**: `i-04a41343a3f51559a` (m5.large, running, IP: 34.230.172.229)

### **📁 Available S3 Buckets:**
- `cypher-deployment` ← **Your deployment bucket**
- `rasdash-deployments` 
- `rasdash-document-repo`
- `ras-dashboard-daily-backup`

---

## 🚀 **Quick Deployment (Customized for Your Environment)**

### **Option 1: Super Quick Automated Deployment**
```batch
# Download the deployment files to your Windows Server desktop
# Right-click deploy-cypher-iis.bat → "Run as administrator"
# Press Enter for defaults or provide your specific values:

S3 Bucket: cypher-deployment (default)
S3 Key: cypher-deployment-latest.zip (default)
Domain: rasdash.dev.com (default)
RDS Endpoint: [Your RDS endpoint]
Database Name: [Your database name]
Database Username: [Your username]
Database Password: [Your password]
```

### **Option 2: PowerShell with Your Defaults**
```powershell
# Run as Administrator
.\Deploy-CYPHER-IIS.ps1 `
  -S3Bucket "cypher-deployment" `
  -S3Key "cypher-deployment-latest.zip" `
  -Domain "rasdash.dev.com" `
  -RDSEndpoint "YOUR-RDS-ENDPOINT" `
  -DBName "YOUR-DB-NAME" `
  -DBUser "YOUR-DB-USER" `
  -DBPassword "YOUR-DB-PASSWORD"
```

---

## 🏗️ **What Will Be Installed/Configured**

### **Software Stack:**
- **IIS** with all required features
- **Node.js v20.16.0** (matching your environment)
- **IISNode** for Node.js integration with IIS
- **Git** for version control
- **AWS CLI** (already configured in your environment)

### **Application Architecture:**
```
Internet → IIS (Port 80) → React Client (Static Files)
                        ↓
                        → /api → IISNode → Node.js API (Port 3001)
                                         ↓
                                         → PostgreSQL RDS
```

### **Domain Configuration:**
- **Primary Domain**: `http://rasdash.dev.com`
- **API Endpoint**: `http://rasdash.dev.com/api`
- **Health Check**: `http://rasdash.dev.com/api/health`

---

## 🔧 **Your Environment-Specific Configuration**

### **Environment Variables (.env)**
```env
NODE_ENV=production
PORT=3001

# Database Configuration (you'll provide these)
DATABASE_URL=postgresql://[USER]:[PASS]@[RDS-ENDPOINT]:5432/[DB-NAME]
DB_HOST=[YOUR-RDS-ENDPOINT]
DB_PORT=5432
DB_NAME=[YOUR-DATABASE-NAME]
DB_USER=[YOUR-USERNAME]
DB_PASSWORD=[YOUR-PASSWORD]

# JWT Configuration
JWT_SECRET=[AUTO-GENERATED-UUID]
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://rasdash.dev.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **IIS Site Configuration:**
- **Site Name**: `CypherClient`
- **App Pool**: `CypherAppPool`
- **Client Path**: `C:\inetpub\wwwroot\cypher\client\dist`
- **API Path**: `C:\inetpub\wwwroot\cypher\api`
- **Domain Binding**: `rasdash.dev.com:80`

---

## 📋 **Pre-Deployment Checklist**

### **Before You Start:**
- [ ] **Windows Server 2019** EC2 instance launched (t3.large recommended)
- [ ] **RDP access** configured (port 3389 open to your IP)
- [ ] **Security groups** configured:
  - Port 80 (HTTP): 0.0.0.0/0
  - Port 443 (HTTPS): 0.0.0.0/0 (for future SSL)
  - Port 3389 (RDP): Your IP only
- [ ] **RDS PostgreSQL** database created and accessible
- [ ] **RDS Security Group** allows access from EC2 (port 5432)
- [ ] **Route53** DNS pointing `rasdash.dev.com` to your EC2 public IP

### **Information You'll Need:**
- [ ] **RDS Endpoint**: `your-rds-instance.xxxxxxxxx.us-east-1.rds.amazonaws.com`
- [ ] **Database Name**: Your PostgreSQL database name
- [ ] **Database Username**: Your PostgreSQL username
- [ ] **Database Password**: Your PostgreSQL password

---

## 🎯 **Step-by-Step Deployment**

### **Step 1: Launch Windows Server 2019**
```powershell
# In AWS Console:
# 1. EC2 → Launch Instance
# 2. AMI: Windows Server 2019 Base
# 3. Instance Type: t3.large (2 vCPU, 8 GB RAM)
# 4. Security Group: HTTP (80), HTTPS (443), RDP (3389)
# 5. Storage: 30 GB GP3
```

### **Step 2: Connect via RDP**
```powershell
# Get Windows password using your key pair
# Connect: Administrator@[EC2-PUBLIC-IP]
```

### **Step 3: Download Deployment Files**
```powershell
# Download these files to the desktop:
# - deploy-cypher-iis.bat
# - Deploy-CYPHER-IIS.ps1
# - WINDOWS-SERVER-DEPLOYMENT-GUIDE.md
# - YOUR-ENVIRONMENT-DEPLOYMENT.md (this file)
```

### **Step 4: Run Deployment**
```batch
# Right-click deploy-cypher-iis.bat
# Select "Run as administrator"
# Follow the prompts (defaults are pre-filled)
```

### **Step 5: Verify Deployment**
```powershell
# Check health endpoints:
# http://rasdash.dev.com/api/health
# http://rasdash.dev.com
```

---

## 🔍 **Post-Deployment Verification**

### **Health Checks:**
```powershell
# API Health Check
Invoke-WebRequest -Uri "http://rasdash.dev.com/api/health"

# Client Check  
Invoke-WebRequest -Uri "http://rasdash.dev.com"

# Database Connection Test
# (Check application logs for database connectivity)
```

### **Service Status:**
```powershell
# IIS Status
Get-Service W3SVC

# Application Pool Status
Get-WebAppPoolState -Name "CypherAppPool"

# Check IIS Sites
Get-Website
```

---

## 🚨 **Troubleshooting Your Environment**

### **Common Issues:**

#### **Domain Not Resolving**
```powershell
# Check DNS resolution
nslookup rasdash.dev.com

# Update Route53 if needed
aws route53 change-resource-record-sets --hosted-zone-id Z07201002RI5R8QT9OIF7 --change-batch file://dns-change.json
```

#### **S3 Access Issues**
```powershell
# Test S3 access
aws s3 ls s3://cypher-deployment/

# Download deployment package manually
aws s3 cp s3://cypher-deployment/cypher-deployment-latest.zip C:\temp\
```

#### **RDS Connection Issues**
```powershell
# Test RDS connectivity
Test-NetConnection -ComputerName [YOUR-RDS-ENDPOINT] -Port 5432

# Check security groups allow EC2 → RDS access
```

---

## 📊 **Monitoring Commands**

```powershell
# Application Status
C:\Scripts\Monitor-Cypher.ps1

# IIS Logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-Object -Last 20

# Application Logs
Get-EventLog -LogName Application -Source "*IIS*" -Newest 10

# Restart Services
iisreset
Restart-WebAppPool -Name "CypherAppPool"
```

---

## 🎉 **Success Indicators**

✅ **IIS Running**: `Get-Service W3SVC` shows "Running"  
✅ **App Pool Active**: `Get-WebAppPoolState -Name "CypherAppPool"` shows "Started"  
✅ **Domain Resolves**: `nslookup rasdash.dev.com` returns your EC2 IP  
✅ **API Healthy**: `http://rasdash.dev.com/api/health` returns 200  
✅ **Client Loading**: `http://rasdash.dev.com` shows your React app  
✅ **Database Connected**: No database errors in Event Viewer  

---

## 🔗 **Your Application URLs**

- **Main Application**: `http://rasdash.dev.com`
- **API Health Check**: `http://rasdash.dev.com/api/health`
- **API Base URL**: `http://rasdash.dev.com/api`

---

**🎯 This deployment guide is customized specifically for your AWS environment with pre-configured defaults for quick deployment!**
