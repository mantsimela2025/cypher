# RAS DASH - AWS Windows Server 2016 Deployment Guide

## Overview
This guide covers deploying the RAS DASH cybersecurity platform on Windows Server 2016 with IIS, connecting to AWS RDS PostgreSQL database.

## Prerequisites
- AWS EC2 Windows Server 2016 instance
- AWS RDS PostgreSQL database
- Security groups configured for web traffic and database access

## 1. Windows Server Initial Setup

### Enable Required Windows Features
```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-IIS6ManagementCompatibility
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Metabase
```

### Install IISNode for Node.js Support
```powershell
# Download and install IISNode
$iisNodeUrl = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
$iisNodePath = "$env:TEMP\iisnode.msi"
Invoke-WebRequest -Uri $iisNodeUrl -OutFile $iisNodePath
Start-Process msiexec.exe -Wait -ArgumentList "/i $iisNodePath /quiet"
```

## 2. Node.js Installation

### Install Node.js LTS
```powershell
# Install Chocolatey package manager
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js LTS (v20)
choco install nodejs.install -y

# Verify installation
node --version
npm --version
```

### Install Global Dependencies
```powershell
# Install PM2 for process management
npm install -g pm2
npm install -g pm2-windows-service

# Install build tools for native modules
npm install -g windows-build-tools
```

## 3. Application Deployment

### Create Application Directory
```powershell
# Create application directory
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\rasdash" -Force
cd "C:\inetpub\wwwroot\rasdash"
```

### Deploy Application Files
```powershell
# Clone or copy your application files to C:\inetpub\wwwroot\rasdash
# Alternative: Use FTP, SCP, or AWS CodeDeploy

# Install application dependencies
npm install --production

# Build the application
npm run build
```

### Environment Configuration
Create `.env` file in application root:
```env
NODE_ENV=production
PORT=3000

# AWS RDS PostgreSQL Connection
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/rasdash
PGHOST=your-rds-endpoint.region.rds.amazonaws.com
PGPORT=5432
PGDATABASE=rasdash
PGUSER=your_username
PGPASSWORD=your_password

# OpenAI API Key (if using AI features)
OPENAI_API_KEY=your_openai_api_key

# Application Settings
ENCRYPTION_KEY=your_32_character_encryption_key_here
SESSION_SECRET=your_session_secret_here
```

## 4. IIS Configuration

### Create IIS Application
```powershell
# Import IIS module
Import-Module WebAdministration

# Create new application pool
New-WebAppPool -Name "RasDashPool" -Force
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "processModel.identityType" -Value "ApplicationPoolIdentity"
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "processModel.idleTimeout" -Value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "recycling.periodicRestart.time" -Value "00:00:00"

# Create IIS application
New-WebApplication -Site "Default Web Site" -Name "rasdash" -PhysicalPath "C:\inetpub\wwwroot\rasdash" -ApplicationPool "RasDashPool"
```

### Configure web.config
Create `web.config` in application root:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Handle Socket.IO requests -->
        <rule name="SocketIO" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="socket.io.*" />
          <action type="Rewrite" url="server/index.js" />
        </rule>
        
        <!-- Handle API requests -->
        <rule name="API" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^api/.*" />
          <action type="Rewrite" url="server/index.js" />
        </rule>
        
        <!-- Handle client-side routing -->
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/client/dist/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      </customHeaders>
    </httpProtocol>
    
    <!-- IISNode configuration -->
    <iisnode
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="3"
      namedPipeConnectionRetryDelay="2000"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectoryNameSuffix="logs"
      debuggingEnabled="false"
      devErrorsEnabled="false"
    />
    
    <!-- Static file caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
    
    <!-- Request size limits -->
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

## 5. Database Setup

### Install PostgreSQL Client Tools
```powershell
# Install PostgreSQL client tools
choco install postgresql -y --params '/Password:your_local_password'

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
```

### Database Connection Test
```powershell
# Test database connection
psql -h your-rds-endpoint.region.rds.amazonaws.com -U your_username -d rasdash -p 5432

# Run database migrations (if needed)
cd "C:\inetpub\wwwroot\rasdash"
npm run db:migrate
npm run db:seed
```

## 6. SSL/TLS Configuration

### Install SSL Certificate
```powershell
# Import certificate to Local Machine store
Import-Certificate -FilePath "path\to\certificate.crt" -CertStoreLocation Cert:\LocalMachine\My

# Bind certificate to IIS
New-WebBinding -Name "Default Web Site" -Protocol https -Port 443 -SslFlags 0
```

### Configure HTTPS Redirect
Add to web.config inside `<system.webServer>`:
```xml
<rewrite>
  <rules>
    <rule name="Redirect to HTTPS" stopProcessing="true">
      <match url=".*" />
      <conditions>
        <add input="{HTTPS}" pattern="off" ignoreCase="true" />
      </conditions>
      <action type="Redirect" url="https://{HTTP_HOST}/{R:0}" redirectType="Permanent" />
    </rule>
  </rules>
</rewrite>
```

## 7. Security Configuration

### Windows Security Settings
```powershell
# Configure Windows Defender (if applicable)
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -DisableBehaviorMonitoring $false
Set-MpPreference -DisableScriptScanning $false

# Configure Windows Updates
Install-Module PSWindowsUpdate -Force
Get-WUInstall -AcceptAll -AutoReboot
```

### IIS Security Headers
Add to web.config:
```xml
<httpProtocol>
  <customHeaders>
    <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" />
    <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
    <add name="Permissions-Policy" value="geolocation=(), camera=(), microphone=()" />
  </customHeaders>
</httpProtocol>
```

## 8. Monitoring and Logging

### Configure Application Logging
```powershell
# Create logs directory
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\rasdash\logs" -Force

# Set permissions for IIS to write logs
icacls "C:\inetpub\wwwroot\rasdash\logs" /grant "IIS_IUSRS:F"
```

### Install Performance Monitoring
```powershell
# Install New Relic or similar monitoring (optional)
# choco install newrelic-dotnet -y
```

## 9. Startup Configuration

### Create PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'rasdash',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Setup Windows Service
```powershell
# Install PM2 as Windows service
pm2-service-install -n "RasDashService"
pm2 start ecosystem.config.js
pm2 save
```

## 10. Backup and Recovery

### Automated Backup Script
Create `backup.ps1`:
```powershell
# Database backup
$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "C:\Backups\rasdash_$date.sql"

pg_dump -h your-rds-endpoint.region.rds.amazonaws.com -U your_username -d rasdash > $backupPath

# Application files backup
Compress-Archive -Path "C:\inetpub\wwwroot\rasdash" -DestinationPath "C:\Backups\rasdash_files_$date.zip"

# Upload to S3 (optional)
aws s3 cp $backupPath s3://your-backup-bucket/database/
aws s3 cp "C:\Backups\rasdash_files_$date.zip" s3://your-backup-bucket/files/
```

## 11. Performance Optimization

### IIS Application Pool Settings
```powershell
# Optimize application pool
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "processModel.maxProcesses" -Value 1
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "processModel.pingingEnabled" -Value $false
Set-ItemProperty -Path "IIS:\AppPools\RasDashPool" -Name "recycling.logEventOnRecycle" -Value "Time,Memory,IsapiUnhealthy,OnDemand,ConfigChange,PrivateMemory"
```

### Enable Compression
```powershell
# Enable static and dynamic compression
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionDynamic
```

## 12. Health Checks and Monitoring

### Application Health Check Endpoint
The RAS DASH application should include a health check endpoint at `/api/health` that verifies:
- Database connectivity
- Essential services status
- System resources

### IIS Health Monitoring
```xml
<!-- Add to web.config -->
<system.webServer>
  <modules>
    <add name="ApplicationInitializationModule" lockItem="true" />
  </modules>
  <applicationInitialization>
    <add initializationPage="/api/health" />
  </applicationInitialization>
</system.webServer>
```

## 13. Troubleshooting

### Common Issues
1. **IISNode not working**: Ensure IISNode is properly installed and web.config is correct
2. **Database connection issues**: Check security groups and RDS settings
3. **Static files not serving**: Verify IIS static content settings
4. **Performance issues**: Check application pool settings and server resources

### Log Locations
- IIS Logs: `C:\inetpub\logs\LogFiles`
- Application Logs: `C:\inetpub\wwwroot\rasdash\logs`
- Windows Event Logs: Event Viewer → Windows Logs → Application

## 14. Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] Security headers configured in web.config
- [ ] Windows firewall configured
- [ ] Database connection encrypted
- [ ] Application secrets properly secured
- [ ] Regular security updates enabled
- [ ] Access logging enabled
- [ ] File permissions properly set

## Conclusion

This deployment setup provides a production-ready environment for RAS DASH on Windows Server 2016 with IIS, connecting securely to AWS RDS PostgreSQL. Regular monitoring, backups, and security updates are essential for maintaining the system.