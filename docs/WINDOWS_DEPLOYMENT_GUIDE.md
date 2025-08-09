# CYPHER Dashboard Windows Server 2019 Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the CYPHER Dashboard application on your Windows Server 2019 EC2 instance.

## Prerequisites
- Windows Server 2019 EC2 instance
- Administrator access to the server
- AWS CLI configured (or will be installed by script)
- Internet connectivity
- Security groups configured for ports 3000 and 3001

## Quick Deployment Steps

### Step 1: Connect to Your Windows Server
Use **Remote Desktop Protocol (RDP)** to connect to your Windows Server 2019 EC2 instance:

1. **Get RDP credentials** from AWS EC2 Console
2. **Connect via RDP** using Windows Remote Desktop Connection
3. **Log in as Administrator**

### Step 2: Open PowerShell as Administrator
1. **Right-click** on Start button
2. Select **"Windows PowerShell (Admin)"**
3. Click **"Yes"** when prompted by UAC

### Step 3: Download and Run Deployment Script
```powershell
# Download the deployment script from S3
aws s3 cp s3://cypher-deployment-20250806/Deploy-CYPHER-WindowsServer.ps1 C:\Deploy-CYPHER-WindowsServer.ps1

# Run the deployment script
.\C:\Deploy-CYPHER-WindowsServer.ps1
```

## What the Deployment Script Does

### 1. **Installs Prerequisites**
- **Chocolatey** - Windows package manager
- **Node.js** - JavaScript runtime (latest LTS version)
- **AWS CLI** - For S3 access
- **PM2** - Process manager for Node.js applications

### 2. **Downloads Application**
- Downloads CYPHER source code from S3
- Extracts to `C:\CYPHER-Dashboard\`
- Creates backup of existing installation (if any)

### 3. **Configures Application**
- Installs npm dependencies for API and Client
- Creates environment configuration files
- Builds client application for production
- Configures database connection to your PostgreSQL

### 4. **Sets Up Services**
- Configures PM2 process manager
- Starts API server on port 3001
- Starts client server on port 3000
- Sets up auto-start on Windows boot

### 5. **Configures Security**
- Opens Windows Firewall ports 3000 and 3001
- Sets up proper file permissions

## Application Structure on Windows

### Main Directory:
```
C:\CYPHER-Dashboard\
├── api\
│   ├── src\                    # API source code
│   ├── package.json           # API dependencies
│   └── .env                   # API configuration
├── client\
│   ├── src\                   # Client source code
│   ├── dist\                  # Built client files
│   ├── package.json           # Client dependencies
│   └── .env                   # Client configuration
└── ecosystem.config.js        # PM2 configuration
```

### Log Files:
```
C:\CYPHER-logs\
├── cypher-api.log            # API application logs
├── cypher-api-error.log      # API error logs
├── cypher-client.log         # Client application logs
└── cypher-client-error.log   # Client error logs

C:\CYPHER-deployment.log      # Deployment script log
```

## Post-Deployment Verification

### Step 1: Check PM2 Status
```powershell
# Check if services are running
pm2 status

# View logs
pm2 logs

# Monitor services
pm2 monit
```

### Step 2: Test API
```powershell
# Test API health endpoint
Invoke-WebRequest -Uri "http://localhost:3001/health"

# Or open in browser
Start-Process "http://localhost:3001/health"
```

### Step 3: Test Client Application
```powershell
# Test client application
Invoke-WebRequest -Uri "http://localhost:3000"

# Or open in browser
Start-Process "http://localhost:3000"
```

## Accessing Your CYPHER Dashboard

Once deployed successfully:
- **CYPHER Dashboard**: `http://your-windows-server-ip:3000`
- **API Endpoints**: `http://your-windows-server-ip:3001`
- **Health Check**: `http://your-windows-server-ip:3001/health`

## Service Management Commands

### PM2 Commands (in PowerShell):
```powershell
# Check service status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Start services
pm2 start ecosystem.config.js

# Delete all services
pm2 delete all

# Save PM2 configuration
pm2 save

# Monitor services in real-time
pm2 monit
```

### Windows Service Management:
```powershell
# Check if PM2 Windows service is running
Get-Service -Name "PM2*"

# Start PM2 Windows service
Start-Service -Name "PM2 cypher-api"
```

## Security Groups Configuration

Ensure your EC2 security group allows:
- **Port 3000** (Client) - Inbound TCP from 0.0.0.0/0
- **Port 3001** (API) - Inbound TCP from 0.0.0.0/0
- **Port 3389** (RDP) - For remote desktop access
- **Port 80/443** (HTTP/HTTPS) - If using reverse proxy

## Troubleshooting

### Common Issues:

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
   ```

2. **Node.js Installation Issues**
   ```powershell
   # Manually install Node.js
   choco install nodejs -y
   
   # Refresh environment variables
   refreshenv
   ```

3. **Port Already in Use**
   ```powershell
   # Check what's using the port
   netstat -ano | findstr :3001
   netstat -ano | findstr :3000
   
   # Kill process if needed
   taskkill /PID <PID> /F
   ```

4. **Database Connection Issues**
   - Check if EC2 security group allows outbound connections
   - Verify database credentials in `.env` files
   - Test database connectivity from Windows

5. **PM2 Service Issues**
   ```powershell
   # Reinstall PM2 Windows startup
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

### Log Locations:
- **Deployment Log**: `C:\CYPHER-deployment.log`
- **Application Logs**: `C:\CYPHER-logs\`
- **PM2 Logs**: `%USERPROFILE%\.pm2\logs\`

## Updates and Maintenance

### To Update the Application:
1. Upload new files to S3 bucket
2. Re-run the deployment script
3. The script will automatically backup existing installation

### Regular Maintenance:
- Monitor PM2 processes: `pm2 status`
- Check logs regularly: `pm2 logs`
- Monitor Windows Event Logs
- Keep Node.js and npm updated
- Monitor disk space and memory usage

## Backup Strategy

The deployment script automatically creates backups:
- **Location**: `C:\CYPHER-Dashboard-Backup-YYYYMMDD-HHMMSS\`
- **Restore**: Copy backup folder back to `C:\CYPHER-Dashboard\`

## Optional: IIS Reverse Proxy

For production use, consider setting up IIS as a reverse proxy:

1. **Install IIS** with Application Request Routing
2. **Configure reverse proxy** rules
3. **Setup SSL certificates**
4. **Configure domain routing**

---

**Deployment Package**: cypher-deployment-20250806
**Target Platform**: Windows Server 2019 EC2
**Ports**: 3000 (Client), 3001 (API)

Your CYPHER Dashboard is ready for Windows deployment! 🚀
