# 🪟 CYPHER Windows Server 2019 Deployment Guide

## 🎯 Overview
This guide will help you manually deploy the CYPHER application to your Windows Server 2019 EC2 instance.

## 📋 Prerequisites
- Windows Server 2019 EC2 instance (i-0403b69b66141f5aa)
- RDP access to the server
- Administrator privileges

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Your Windows Server
1. **Open Remote Desktop Connection** on your local machine
2. **Connect to**: `54.91.127.123`
3. **Username**: `Administrator`
4. **Password**: [Your EC2 instance password]

### Step 2: Install Required Software
Once connected to the Windows server:

#### Install Node.js
1. **Download Node.js 20.x** from: https://nodejs.org/
2. **Run the installer** and follow the setup wizard
3. **Verify installation**: Open PowerShell and run:
   ```powershell
   node --version
   npm --version
   ```

#### Install Git
1. **Download Git** from: https://git-scm.com/download/win
2. **Install with default settings**
3. **Verify**: `git --version`

#### Install PM2 (Process Manager)
```powershell
npm install -g pm2
npm install -g pm2-windows-service
pm2-service-install
```

### Step 3: Clone and Setup the Application
```powershell
# Create deployment directory
New-Item -ItemType Directory -Path "C:\deployments\cypher" -Force
Set-Location "C:\deployments\cypher"

# Clone the repository
git clone https://github.com/mantsimela2025/cypher.git .

# Install API dependencies
Set-Location "api"
npm install

# Install Client dependencies
Set-Location "..\client"
npm install

# Build the client
npm run build
```

### Step 4: Configure Environment Variables
Create a `.env` file in the API directory:
```powershell
Set-Location "C:\deployments\cypher\api"
New-Item -ItemType File -Name ".env"
```

Add your environment variables to the `.env` file:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1
```

### Step 5: Start the Services
```powershell
# Navigate to project root
Set-Location "C:\deployments\cypher"

# Start API service
pm2 start api/server.js --name "cypher-api" --env production

# Start Client service (if using serve)
pm2 start "npm run start" --name "cypher-client" --cwd "client"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Configure Windows Firewall
```powershell
# Allow inbound traffic on ports 3000 and 3001
New-NetFirewallRule -DisplayName "CYPHER API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "CYPHER Client" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Step 7: Verify Deployment
1. **Check PM2 status**: `pm2 status`
2. **Check API**: Open browser to `http://localhost:3001/health`
3. **Check Client**: Open browser to `http://localhost:3000`
4. **External access**: `http://54.91.127.123:3000`

## 🔧 Troubleshooting

### If Services Don't Start:
```powershell
# Check PM2 logs
pm2 logs

# Restart services
pm2 restart all

# Check Windows Event Viewer for errors
```

### If External Access Doesn't Work:
1. **Check AWS Security Groups** - ensure ports 3000 and 3001 are open
2. **Check Windows Firewall** - verify rules are active
3. **Check EC2 instance** - ensure it's running

## 🎯 Next Steps
Once deployed manually, you can:
1. **Test the application** thoroughly
2. **Set up automated deployment** using AWS CodeDeploy for Windows
3. **Configure IIS** as a reverse proxy (optional)
4. **Set up monitoring** and logging

## 📞 Support
If you encounter issues, check:
- PM2 logs: `pm2 logs`
- Windows Event Viewer
- Application logs in the deployment directory
