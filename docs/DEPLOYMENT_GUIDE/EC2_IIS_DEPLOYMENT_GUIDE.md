# EC2 IIS Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the CYPHER application on AWS EC2 Windows Server 2019 with IIS, including GitLab repository cloning, static IP configuration, PM2 process management, and external browser access.

## 📋 Table of Contents

1. [Prerequisites & EC2 Setup](#prerequisites--ec2-setup)
2. [GitLab Repository Setup](#gitlab-repository-setup)
3. [Node.js & PM2 Installation](#nodejs--pm2-installation)
4. [IIS Configuration](#iis-configuration)
5. [Application Deployment](#application-deployment)
6. [Static IP & Network Configuration](#static-ip--network-configuration)
7. [PM2 Process Management](#pm2-process-management)
8. [External Access Configuration](#external-access-configuration)
9. [SSL/HTTPS Setup (Optional)](#sslhttps-setup-optional)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

## 🖥️ Prerequisites & EC2 Setup

### **EC2 Instance Details**
```
Instance ID: i-04a41343a3f51559a
OS: Windows Server 2019
Region: us-east-1
Instance Type: (as configured)
```

### **Required Software Installation**

#### **1. Connect to EC2 Instance**
```powershell
# Using RDP (Remote Desktop Protocol)
# Get public IP from AWS Console or CLI:
aws ec2 describe-instances --instance-ids i-04a41343a3f51559a --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Connect via RDP to: {PUBLIC_IP}:3389
# Username: Administrator
# Password: (from EC2 key pair or set during launch)
```

#### **2. Install Git for Windows**
```powershell
# Download and install Git for Windows
# URL: https://git-scm.com/download/win

# Verify installation
git --version

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"
```

#### **3. Install Node.js**
```powershell
# Download Node.js v20.16.0 LTS
# URL: https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi

# Install using the MSI installer
# Verify installation
node --version  # Should show v20.16.0
npm --version   # Should show 10.0.0+
```

#### **4. Enable IIS and Required Features**
```powershell
# Open PowerShell as Administrator
# Enable IIS with required features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-HttpCompressionStatic, IIS-HttpCompressionDynamic, IIS-IISCertificateMappingAuthentication, IIS-ClientCertificateMappingAuthentication, IIS-DigestAuthentication, IIS-WindowsAuthentication, IIS-BasicAuthentication, IIS-URLAuthorization, IIS-RequestFiltering, IIS-IPSecurity, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-IIS6ManagementCompatibility, IIS-Metabase

# Alternative: Use Server Manager
# Server Manager → Add Roles and Features → Web Server (IIS)
```

## 📦 GitLab Repository Setup

### **1. SSH Key Configuration**
```powershell
# Generate SSH key (if not already done)
ssh-keygen -t ed25519 -C "your.email@company.com"

# Copy public key
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# Add to GitLab: Profile → SSH Keys → Add Key
```

### **2. Clone Repository**
```powershell
# Navigate to deployment directory
cd C:\inetpub\wwwroot

# Create application directory
mkdir cypher-app
cd cypher-app

# Clone the repository
git clone git@gitlab.com:your-organization/cypher.git .

# Verify clone
dir
# Should show: api/, client/, docs/, package.json, etc.
```

### **3. Install Dependencies**
```powershell
# Install root dependencies
npm install

# Install API dependencies
cd api
npm install

# Install Client dependencies
cd ..\client
npm install

# Return to root
cd ..
```

## 🔧 Node.js & PM2 Installation

### **1. Install PM2 Globally**
```powershell
# Install PM2 process manager
npm install -g pm2

# Install PM2 Windows service
npm install -g pm2-windows-service

# Verify PM2 installation
pm2 --version
```

### **2. Configure PM2 as Windows Service**
```powershell
# Install PM2 as Windows service
pm2-service-install

# Configure service
# Service Name: PM2
# User: (leave blank for Local System)
# Password: (leave blank)
```

### **3. Create PM2 Ecosystem File**
```powershell
# Create ecosystem.config.js in project root
@"
module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/server.js',
      cwd: 'C:\\inetpub\\wwwroot\\cypher-app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1'
      },
      error_file: 'C:\\inetpub\\wwwroot\\cypher-app\\logs\\api-error.log',
      out_file: 'C:\\inetpub\\wwwroot\\cypher-app\\logs\\api-out.log',
      log_file: 'C:\\inetpub\\wwwroot\\cypher-app\\logs\\api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
"@ | Out-File -FilePath ecosystem.config.js -Encoding UTF8
```

## 🌐 IIS Configuration

### **1. Build Client Application**
```powershell
# Build React client for production
cd client
npm run build

# Verify build
dir dist
# Should show: index.html, assets/, etc.
```

### **2. Configure IIS Site**
```powershell
# Open IIS Manager
# Start → Administrative Tools → Internet Information Services (IIS) Manager

# Or via PowerShell:
Import-Module WebAdministration

# Remove default website
Remove-Website -Name "Default Web Site"

# Create new website for CYPHER
New-Website -Name "CYPHER" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\cypher-app\client\dist"

# Create API application under CYPHER site
New-WebApplication -Site "CYPHER" -Name "api" -PhysicalPath "C:\inetpub\wwwroot\cypher-app\api"
```

### **3. Configure URL Rewrite (for React Router)**
```powershell
# Install URL Rewrite Module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite

# Create web.config in client/dist directory
@"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Router" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
    </staticContent>
  </system.webServer>
</configuration>
"@ | Out-File -FilePath "C:\inetpub\wwwroot\cypher-app\client\dist\web.config" -Encoding UTF8
```

### **4. Configure Reverse Proxy for API**
```powershell
# Install Application Request Routing (ARR)
# Download from: https://www.iis.net/downloads/microsoft/application-request-routing

# Create web.config for API reverse proxy
@"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@ | Out-File -FilePath "C:\inetpub\wwwroot\cypher-app\web.config" -Encoding UTF8
```

## 🌍 Static IP & Network Configuration

### **1. Configure Elastic IP (AWS)**
```powershell
# Allocate Elastic IP (if not already done)
aws ec2 allocate-address --domain vpc --region us-east-1

# Associate Elastic IP with instance
aws ec2 associate-address --instance-id i-04a41343a3f51559a --allocation-id eipalloc-xxxxxxxxx --region us-east-1

# Get current public IP
aws ec2 describe-instances --instance-ids i-04a41343a3f51559a --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

### **2. Configure Security Groups**
```powershell
# Allow HTTP traffic (port 80)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1

# Allow HTTPS traffic (port 443) - optional
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0 --region us-east-1

# Allow RDP access (port 3389) - restrict to your IP
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 3389 --cidr YOUR_IP/32 --region us-east-1
```

### **3. Windows Firewall Configuration**
```powershell
# Allow HTTP traffic through Windows Firewall
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS traffic (optional)
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow Node.js API port
New-NetFirewallRule -DisplayName "Allow Node.js API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

## 🚀 PM2 Process Management

### **1. Start Application with PM2**
```powershell
# Navigate to project root
cd C:\inetpub\wwwroot\cypher-app

# Create logs directory
mkdir logs

# Start application using ecosystem file
pm2 start ecosystem.config.js

# Verify application is running
pm2 list
pm2 status
```

### **2. PM2 Management Commands**
```powershell
# View application logs
pm2 logs cypher-api

# Monitor application
pm2 monit

# Restart application
pm2 restart cypher-api

# Stop application
pm2 stop cypher-api

# Delete application from PM2
pm2 delete cypher-api

# Save PM2 configuration
pm2 save

# Resurrect saved processes (after reboot)
pm2 resurrect
```

### **3. Configure PM2 Startup**
```powershell
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Test startup (reboot and check)
pm2 list
```

## 🌐 External Access Configuration

### **1. Update Environment Variables**
```powershell
# Create production environment file
@"
# API Configuration
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1

# Client Configuration
VITE_API_BASE_URL=http://YOUR_STATIC_IP/api/v1
VITE_NODE_ENV=production
"@ | Out-File -FilePath "C:\inetpub\wwwroot\cypher-app\.env.production" -Encoding UTF8
```

### **2. Update Client Configuration**
```powershell
# Update client environment for production
cd C:\inetpub\wwwroot\cypher-app\client

# Create production environment file
@"
VITE_API_BASE_URL=http://YOUR_STATIC_IP/api/v1
VITE_NODE_ENV=production
VITE_APP_NAME=CYPHER
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

# Rebuild client with production settings
npm run build
```

### **3. Test External Access**
```powershell
# Test from local machine browser:
# http://YOUR_STATIC_IP
# http://YOUR_STATIC_IP/api/health
# http://YOUR_STATIC_IP/api/v1/systems

# Test API endpoint
curl http://YOUR_STATIC_IP/api/health

# Test client application
# Open browser and navigate to: http://YOUR_STATIC_IP
```

## 🔒 SSL/HTTPS Setup (Optional)

### **1. Obtain SSL Certificate**
```powershell
# Option 1: Let's Encrypt (free)
# Install win-acme
# Download from: https://www.win-acme.com/

# Option 2: Commercial certificate
# Purchase from certificate authority

# Option 3: Self-signed certificate (development only)
New-SelfSignedCertificate -DnsName "YOUR_DOMAIN" -CertStoreLocation "cert:\LocalMachine\My"
```

### **2. Configure HTTPS in IIS**
```powershell
# Bind SSL certificate to website
# IIS Manager → CYPHER site → Bindings → Add
# Type: https
# Port: 443
# SSL Certificate: (select your certificate)

# Or via PowerShell:
New-WebBinding -Name "CYPHER" -Protocol https -Port 443 -SslFlags 0
```

### **3. Update Application for HTTPS**
```powershell
# Update client environment for HTTPS
@"
VITE_API_BASE_URL=https://YOUR_DOMAIN/api/v1
VITE_NODE_ENV=production
"@ | Out-File -FilePath "C:\inetpub\wwwroot\cypher-app\client\.env.production" -Encoding UTF8

# Rebuild client
cd C:\inetpub\wwwroot\cypher-app\client
npm run build

# Restart PM2 processes
pm2 restart all
```

## 📊 Monitoring & Maintenance

### **1. Application Monitoring**
```powershell
# Check PM2 status
pm2 status
pm2 monit

# Check IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# Check application logs
Get-Content "C:\inetpub\wwwroot\cypher-app\logs\api-combined.log" -Tail 50

# Check Windows Event Logs
Get-EventLog -LogName Application -Source "PM2" -Newest 10
```

### **2. Performance Monitoring**
```powershell
# Monitor system resources
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\Available MBytes"

# Monitor network connections
netstat -an | findstr :80
netstat -an | findstr :3001
```

### **3. Automated Deployment Script**
```powershell
# Create deployment script: deploy.ps1
@"
# CYPHER Deployment Script
Write-Host "Starting CYPHER deployment..." -ForegroundColor Green

# Navigate to application directory
cd C:\inetpub\wwwroot\cypher-app

# Pull latest changes
Write-Host "Pulling latest changes from GitLab..." -ForegroundColor Yellow
git pull origin main

# Install/update dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
cd api && npm install
cd ..\client && npm install

# Build client
Write-Host "Building client application..." -ForegroundColor Yellow
npm run build

# Restart PM2 processes
Write-Host "Restarting API server..." -ForegroundColor Yellow
cd ..
pm2 restart cypher-api

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Application available at: http://YOUR_STATIC_IP" -ForegroundColor Cyan
"@ | Out-File -FilePath "C:\inetpub\wwwroot\cypher-app\deploy.ps1" -Encoding UTF8
```

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Application Not Starting**
```powershell
# Check PM2 logs
pm2 logs cypher-api

# Check Node.js installation
node --version
npm --version

# Check port availability
netstat -an | findstr :3001

# Restart PM2 service
Restart-Service PM2
```

#### **2. IIS Configuration Issues**
```powershell
# Check IIS status
Get-Service W3SVC

# Restart IIS
iisreset

# Check website bindings
Get-WebBinding -Name "CYPHER"

# Check application pool
Get-IISAppPool
```

#### **3. Network Access Issues**
```powershell
# Check Windows Firewall
Get-NetFirewallRule -DisplayName "*HTTP*"

# Test local connectivity
curl http://localhost
curl http://localhost:3001/api/health

# Check security group settings
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
```

#### **4. Database Connection Issues**
```powershell
# Test database connectivity
node -e "const { Client } = require('pg'); const client = new Client('postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1'); client.connect().then(() => console.log('Connected')).catch(err => console.error(err));"
```

### **Emergency Recovery**
```powershell
# Stop all processes
pm2 stop all

# Reset IIS
iisreset

# Restart services
Start-Service W3SVC
Restart-Service PM2

# Start applications
pm2 start ecosystem.config.js
```

---

**Deployment Checklist:**
- [ ] EC2 instance accessible via RDP
- [ ] Git, Node.js, and IIS installed
- [ ] Repository cloned successfully
- [ ] Dependencies installed
- [ ] PM2 configured and running
- [ ] IIS website configured
- [ ] Static IP and security groups configured
- [ ] Application accessible externally
- [ ] SSL certificate installed (optional)
- [ ] Monitoring and logging configured

## 📝 Step-by-Step Deployment Checklist

### **Phase 1: Initial Setup**
```powershell
# 1. Connect to EC2 instance via RDP
# 2. Install required software
# 3. Configure Git credentials
# 4. Enable IIS features
```

### **Phase 2: Repository Setup**
```powershell
# 1. Generate SSH keys
ssh-keygen -t ed25519 -C "deployment@cypher.com"

# 2. Add public key to GitLab
Get-Content ~/.ssh/id_ed25519.pub

# 3. Clone repository
cd C:\inetpub\wwwroot
git clone git@gitlab.com:your-organization/cypher.git cypher-app

# 4. Install dependencies
cd cypher-app
npm install
cd api && npm install
cd ..\client && npm install && cd ..
```

### **Phase 3: Application Configuration**
```powershell
# 1. Create production environment files
# API environment
@"
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://rasdashadmin:RasDash2025$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1
JWT_SECRET=your-production-jwt-secret-here
"@ | Out-File -FilePath "api\.env" -Encoding UTF8

# Client environment (replace YOUR_STATIC_IP with actual IP)
@"
VITE_API_BASE_URL=http://YOUR_STATIC_IP/api/v1
VITE_NODE_ENV=production
VITE_APP_NAME=CYPHER
"@ | Out-File -FilePath "client\.env" -Encoding UTF8

# 2. Build client application
cd client
npm run build
cd ..
```

### **Phase 4: IIS Configuration**
```powershell
# 1. Remove default website
Remove-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

# 2. Create CYPHER website
New-Website -Name "CYPHER" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\cypher-app\client\dist"

# 3. Configure application pool
Set-ItemProperty -Path "IIS:\AppPools\CYPHER" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\CYPHER" -Name recycling.periodicRestart.time -Value "00:00:00"
```

### **Phase 5: PM2 Setup**
```powershell
# 1. Install PM2 globally
npm install -g pm2
npm install -g pm2-windows-service

# 2. Install PM2 as Windows service
pm2-service-install

# 3. Create and start ecosystem
pm2 start ecosystem.config.js
pm2 save
```

### **Phase 6: Network Configuration**
```powershell
# 1. Configure Windows Firewall
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# 2. Configure AWS Security Group (via AWS CLI or Console)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0

# 3. Test connectivity
curl http://localhost
curl http://YOUR_STATIC_IP
```

## 🔄 Continuous Deployment Script

### **Automated Deployment PowerShell Script**
```powershell
# Save as: C:\Scripts\deploy-cypher.ps1
param(
    [string]$Branch = "main",
    [switch]$SkipBuild = $false,
    [switch]$RestartOnly = $false
)

$AppPath = "C:\inetpub\wwwroot\cypher-app"
$LogFile = "C:\Scripts\deployment.log"

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp - $Message" | Tee-Object -FilePath $LogFile -Append
}

try {
    Write-Log "Starting CYPHER deployment (Branch: $Branch)"

    if (-not $RestartOnly) {
        # Pull latest changes
        Write-Log "Pulling latest changes from GitLab..."
        cd $AppPath
        git fetch origin
        git checkout $Branch
        git pull origin $Branch

        # Install dependencies
        Write-Log "Installing dependencies..."
        npm install
        cd api
        npm install
        cd ..\client
        npm install

        if (-not $SkipBuild) {
            # Build client
            Write-Log "Building client application..."
            npm run build
        }

        cd $AppPath
    }

    # Restart PM2 processes
    Write-Log "Restarting API server..."
    pm2 restart cypher-api

    # Wait for application to start
    Start-Sleep -Seconds 10

    # Test application
    Write-Log "Testing application..."
    $Response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 30
    if ($Response.StatusCode -eq 200) {
        Write-Log "API health check passed"
    } else {
        throw "API health check failed"
    }

    $Response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 30
    if ($Response.StatusCode -eq 200) {
        Write-Log "Client application check passed"
    } else {
        throw "Client application check failed"
    }

    Write-Log "Deployment completed successfully!"
    Write-Log "Application available at: http://YOUR_STATIC_IP"

} catch {
    Write-Log "Deployment failed: $($_.Exception.Message)"
    Write-Log "Rolling back..."

    # Rollback logic
    pm2 restart cypher-api

    throw
}
```

### **Scheduled Deployment Task**
```powershell
# Create scheduled task for automated deployments
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\deploy-cypher.ps1"
$Trigger = New-ScheduledTaskTrigger -Daily -At "2:00 AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "CYPHER-AutoDeploy" -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automated CYPHER application deployment"
```

## 🔍 Health Monitoring & Alerts

### **Health Check Script**
```powershell
# Save as: C:\Scripts\health-check.ps1
$AppPath = "C:\inetpub\wwwroot\cypher-app"
$LogFile = "C:\Scripts\health-check.log"
$AlertEmail = "admin@yourcompany.com"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp [$Level] - $Message" | Tee-Object -FilePath $LogFile -Append
}

function Send-Alert {
    param([string]$Subject, [string]$Body)
    # Configure SMTP settings as needed
    # Send-MailMessage -To $AlertEmail -Subject $Subject -Body $Body -SmtpServer "smtp.yourcompany.com"
    Write-Log "ALERT: $Subject - $Body" -Level "ALERT"
}

try {
    Write-Log "Starting health check..."

    # Check PM2 processes
    $PM2Status = pm2 jlist | ConvertFrom-Json
    $CypherAPI = $PM2Status | Where-Object { $_.name -eq "cypher-api" }

    if (-not $CypherAPI -or $CypherAPI.pm2_env.status -ne "online") {
        Send-Alert "CYPHER API Down" "The CYPHER API process is not running or unhealthy"
        pm2 restart cypher-api
    } else {
        Write-Log "PM2 process check passed"
    }

    # Check API endpoint
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 10
        if ($Response.StatusCode -eq 200) {
            Write-Log "API health endpoint check passed"
        } else {
            throw "API returned status code: $($Response.StatusCode)"
        }
    } catch {
        Send-Alert "CYPHER API Health Check Failed" "API health endpoint is not responding: $($_.Exception.Message)"
    }

    # Check client application
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 10
        if ($Response.StatusCode -eq 200) {
            Write-Log "Client application check passed"
        } else {
            throw "Client returned status code: $($Response.StatusCode)"
        }
    } catch {
        Send-Alert "CYPHER Client Check Failed" "Client application is not responding: $($_.Exception.Message)"
    }

    # Check disk space
    $DiskSpace = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object @{Name="FreeSpaceGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
    if ($DiskSpace.FreeSpaceGB -lt 5) {
        Send-Alert "Low Disk Space" "C: drive has only $($DiskSpace.FreeSpaceGB)GB free space remaining"
    }

    # Check memory usage
    $Memory = Get-WmiObject -Class Win32_OperatingSystem
    $FreeMemoryGB = [math]::Round($Memory.FreePhysicalMemory/1MB,2)
    if ($FreeMemoryGB -lt 1) {
        Send-Alert "Low Memory" "Server has only $($FreeMemoryGB)GB free memory remaining"
    }

    Write-Log "Health check completed successfully"

} catch {
    Write-Log "Health check failed: $($_.Exception.Message)" -Level "ERROR"
    Send-Alert "Health Check Script Failed" "The health check script encountered an error: $($_.Exception.Message)"
}
```

### **Create Health Check Scheduled Task**
```powershell
# Create scheduled task for health monitoring (every 5 minutes)
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\health-check.ps1"
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount

Register-ScheduledTask -TaskName "CYPHER-HealthCheck" -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "CYPHER application health monitoring"
```

## 📋 Final Deployment Verification

### **Complete Testing Checklist**
```powershell
# 1. Internal connectivity tests
curl http://localhost                    # Should return React app
curl http://localhost:3001/api/health   # Should return API health status
curl http://localhost/api/health        # Should proxy to API

# 2. External connectivity tests (replace YOUR_STATIC_IP)
curl http://YOUR_STATIC_IP              # Should return React app
curl http://YOUR_STATIC_IP/api/health   # Should return API health status

# 3. Application functionality tests
# - Navigate to http://YOUR_STATIC_IP in browser
# - Test login functionality
# - Test navigation between pages
# - Test API endpoints through the UI
# - Verify lazy loading works correctly

# 4. Performance tests
# - Check page load times
# - Monitor PM2 process memory usage
# - Check IIS performance counters

# 5. Security tests
# - Verify HTTPS redirect (if configured)
# - Test authentication flows
# - Check for exposed sensitive information
```

---

**Last Updated:** December 2024
**Status:** ✅ **Complete EC2 IIS Deployment Guide with Automation**
**Application URL:** `http://YOUR_STATIC_IP`
**Deployment Script:** `C:\Scripts\deploy-cypher.ps1`
**Health Monitoring:** `C:\Scripts\health-check.ps1`
