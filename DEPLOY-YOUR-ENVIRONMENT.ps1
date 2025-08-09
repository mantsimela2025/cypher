# CYPHER Deployment Script - Customized for Your Environment
# Run as Administrator on Windows Server 2019

param(
    [string]$S3Bucket = "cypher-deployment",
    [string]$S3Key = "cypher-deployment-latest.zip",
    [string]$RDSEndpoint = "rasdash-database.cexgrlslydeh.us-east-1.rds.amazonaws.com",
    [string]$DBName = "",
    [string]$DBUser = "",
    [string]$DBPassword = "",
    [string]$Domain = "rasdash.dev.com",
    [switch]$SkipSoftware = $false,
    [switch]$AutoShutdown = $false,
    [int]$ShutdownDelayMinutes = 5
)

# Color functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator!"
    exit 1
}

Write-Info "🚀 CYPHER Deployment - Your Environment Configuration"
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "S3 Bucket: $S3Bucket" -ForegroundColor Yellow
Write-Host "S3 Package: $S3Key" -ForegroundColor Yellow
Write-Host "RDS Endpoint: $RDSEndpoint" -ForegroundColor Yellow
Write-Host "Domain: $Domain" -ForegroundColor Yellow
Write-Host "Node.js Version: v20.16.0" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan

# Configuration
$AppDir = "C:\inetpub\wwwroot\cypher"
$ScriptsDir = "C:\Scripts"

try {
    # Get missing database parameters
    if (-not $DBName) {
        Write-Info "Database connection details needed..."
        $DBName = Read-Host "Enter database name"
    }
    if (-not $DBUser) {
        $DBUser = Read-Host "Enter database username"
    }
    if (-not $DBPassword) {
        $DBPassword = Read-Host "Enter database password" -AsSecureString
        $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword))
    }

    # Phase 1: Software Installation (if not skipped)
    if (-not $SkipSoftware) {
        Write-Info "📦 Installing required software..."
        
        # Install IIS Features
        Write-Info "Installing IIS features..."
        $features = @(
            "IIS-WebServerRole", "IIS-WebServer", "IIS-CommonHttpFeatures",
            "IIS-HttpErrors", "IIS-HttpLogging", "IIS-RequestFiltering",
            "IIS-StaticContent", "IIS-DefaultDocument", "IIS-DirectoryBrowsing", "IIS-ASPNET45"
        )
        
        foreach ($feature in $features) {
            Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart
        }
        Write-Success "IIS features installed"

        # Install Node.js v20.16.0 (matching your environment)
        Write-Info "Installing Node.js v20.16.0..."
        $nodeUrl = "https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi"
        $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
        
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        Start-Process -FilePath $nodeInstaller -ArgumentList "/quiet" -Wait
        
        # Update PATH
        $env:PATH += ";C:\Program Files\nodejs"
        [Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)
        Write-Success "Node.js v20.16.0 installed"

        # Install IISNode
        Write-Info "Installing IISNode..."
        $iisnodeUrl = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
        $iisnodeInstaller = "$env:TEMP\iisnode-installer.msi"
        
        Invoke-WebRequest -Uri $iisnodeUrl -OutFile $iisnodeInstaller
        Start-Process -FilePath $iisnodeInstaller -ArgumentList "/quiet" -Wait
        Write-Success "IISNode installed"

        Write-Success "All software installed successfully!"
    }

    # Phase 2: Application Setup
    Write-Info "📁 Setting up application directory..."
    New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
    New-Item -ItemType Directory -Force -Path $ScriptsDir | Out-Null

    # Phase 3: Download and Extract Code from Your S3 Bucket
    Write-Info "📦 Downloading code from S3 bucket: $S3Bucket..."
    $downloadPath = "$env:TEMP\cypher-code.zip"
    
    # Check AWS CLI configuration
    try {
        aws sts get-caller-identity | Out-Null
        Write-Success "AWS CLI is configured"
    } catch {
        Write-Warning "AWS CLI not configured. Please run 'aws configure' first."
        aws configure
    }
    
    aws s3 cp "s3://$S3Bucket/$S3Key" $downloadPath
    if (-not (Test-Path $downloadPath)) {
        throw "Failed to download code from S3"
    }
    
    Expand-Archive -Path $downloadPath -DestinationPath $AppDir -Force
    Write-Success "Code downloaded and extracted from your S3 bucket"

    # Phase 4: Environment Configuration
    Write-Info "⚙️ Creating environment configuration..."
    $envContent = @"
NODE_ENV=production
PORT=3001

# Database Configuration - Your RDS PostgreSQL
DATABASE_URL=postgresql://$DBUser`:$DBPassword@$RDSEndpoint`:5432/$DBName
DB_HOST=$RDSEndpoint
DB_PORT=5432
DB_NAME=$DBName
DB_USER=$DBUser
DB_PASSWORD=$DBPassword

# JWT Configuration
JWT_SECRET=$(New-Guid)
JWT_EXPIRES_IN=24h

# CORS Configuration - Your Domain
CORS_ORIGIN=http://$Domain

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@
    
    $envContent | Out-File -FilePath "$AppDir\api\.env" -Encoding UTF8
    Write-Success "Environment configured for your RDS and domain"

    # Phase 5: Install Dependencies
    Write-Info "📦 Installing dependencies..."
    
    # API dependencies
    Push-Location "$AppDir\api"
    npm install --production
    Pop-Location
    
    # Client build
    Push-Location "$AppDir\client"
    npm install
    npm run build
    Pop-Location
    
    Write-Success "Dependencies installed and client built"

    # Phase 6: IIS Configuration
    Write-Info "🌐 Configuring IIS for your domain: $Domain..."
    Import-Module WebAdministration

    # Remove default website
    Remove-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

    # Create application pool
    New-WebAppPool -Name "CypherAppPool" -Force
    Set-ItemProperty -Path "IIS:\AppPools\CypherAppPool" -Name processModel.identityType -Value ApplicationPoolIdentity
    Set-ItemProperty -Path "IIS:\AppPools\CypherAppPool" -Name recycling.periodicRestart.time -Value "00:00:00"

    # Create website for client
    New-Website -Name "CypherClient" -Port 80 -PhysicalPath "$AppDir\client\dist" -ApplicationPool "CypherAppPool"

    # Create application for API
    New-WebApplication -Site "CypherClient" -Name "api" -PhysicalPath "$AppDir\api" -ApplicationPool "CypherAppPool"

    # Configure domain binding
    Remove-WebBinding -Site "CypherClient" -Port 80 -Protocol http -ErrorAction SilentlyContinue
    New-WebBinding -Site "CypherClient" -Name $Domain -Port 80 -Protocol http

    Write-Success "IIS configured for $Domain"

    # Phase 7: IISNode Configuration
    Write-Info "🔧 Configuring IISNode..."
    $webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
"@
    
    $webConfigContent | Out-File -FilePath "$AppDir\api\web.config" -Encoding UTF8
    Write-Success "IISNode configured"

    # Phase 8: Start Services
    Write-Info "🚀 Starting services..."
    iisreset
    Start-Sleep -Seconds 10

    # Phase 9: Health Check
    Write-Info "🏥 Performing health checks..."
    $healthPassed = $true
    
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://$Domain/api/health" -TimeoutSec 30
        if ($apiResponse.StatusCode -eq 200) {
            Write-Success "API health check passed at http://$Domain/api/health"
        } else {
            Write-Warning "API returned status code: $($apiResponse.StatusCode)"
            $healthPassed = $false
        }
    } catch {
        Write-Warning "API health check failed: $($_.Exception.Message)"
        $healthPassed = $false
    }
    
    try {
        $clientResponse = Invoke-WebRequest -Uri "http://$Domain" -TimeoutSec 30
        if ($clientResponse.StatusCode -eq 200) {
            Write-Success "Client health check passed at http://$Domain"
        } else {
            Write-Warning "Client returned status code: $($clientResponse.StatusCode)"
            $healthPassed = $false
        }
    } catch {
        Write-Warning "Client health check failed: $($_.Exception.Message)"
        $healthPassed = $false
    }

    # Phase 10: Create Monitoring Script
    Write-Info "📊 Creating monitoring script..."
    $monitorScript = @"
# CYPHER Application Monitor - Your Environment
Write-Host "🔍 CYPHER Application Status - $Domain" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check IIS status
`$iisStatus = Get-Service -Name W3SVC
Write-Host "IIS Status: `$(`$iisStatus.Status)" -ForegroundColor Yellow

# Check application pool
`$appPoolStatus = Get-WebAppPoolState -Name "CypherAppPool"
Write-Host "App Pool Status: `$(`$appPoolStatus.Value)" -ForegroundColor Yellow

# Test your domain endpoints
try {
    `$apiResponse = Invoke-WebRequest -Uri "http://$Domain/api/health" -TimeoutSec 10
    Write-Host "✅ API Health: OK (`$(`$apiResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ API Health: Failed" -ForegroundColor Red
}

try {
    `$clientResponse = Invoke-WebRequest -Uri "http://$Domain" -TimeoutSec 10
    Write-Host "✅ Client: OK (`$(`$clientResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Client: Failed" -ForegroundColor Red
}

# Database connectivity test
try {
    Test-NetConnection -ComputerName "$RDSEndpoint" -Port 5432 -InformationLevel Quiet
    Write-Host "✅ Database: Reachable" -ForegroundColor Green
} catch {
    Write-Host "❌ Database: Connection failed" -ForegroundColor Red
}
"@
    
    $monitorScript | Out-File -FilePath "$ScriptsDir\Monitor-Cypher.ps1" -Encoding UTF8
    Write-Success "Monitoring script created"

    # Final Summary
    Write-Info "🎉 Deployment Summary"
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "Application Directory: $AppDir" -ForegroundColor Yellow
    Write-Host "Monitoring Script: $ScriptsDir\Monitor-Cypher.ps1" -ForegroundColor Yellow
    Write-Host "Domain: http://$Domain" -ForegroundColor Green
    Write-Host "API Health: http://$Domain/api/health" -ForegroundColor Green
    Write-Host "RDS Endpoint: $RDSEndpoint" -ForegroundColor Yellow
    
    if ($healthPassed) {
        Write-Success "🎉 Deployment completed successfully!"
        Write-Host ""
        Write-Host "🌐 Your CYPHER application is now running at:" -ForegroundColor Green
        Write-Host "   Main App: http://$Domain" -ForegroundColor Cyan
        Write-Host "   API: http://$Domain/api" -ForegroundColor Cyan
        Write-Host "   Health Check: http://$Domain/api/health" -ForegroundColor Cyan
    } else {
        Write-Warning "⚠️ Deployment completed with warnings. Check the logs and run the monitoring script."
    }

} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
