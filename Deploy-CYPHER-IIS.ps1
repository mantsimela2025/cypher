# CYPHER Windows Server 2019 IIS Deployment Script
# Run as Administrator

param(
    [string]$S3Bucket = "",
    [string]$S3Key = "",
    [string]$RDSEndpoint = "",
    [string]$DBName = "",
    [string]$DBUser = "",
    [string]$DBPassword = "",
    [string]$Domain = "",
    [switch]$SkipSoftware = $false
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

Write-Info "🚀 Starting CYPHER Windows Server IIS Deployment..."

# Configuration
$AppDir = "C:\inetpub\wwwroot\cypher"
$ScriptsDir = "C:\Scripts"

try {
    # Phase 1: Software Installation (if not skipped)
    if (-not $SkipSoftware) {
        Write-Info "📦 Installing required software..."
        
        # Install IIS Features
        Write-Info "Installing IIS features..."
        $features = @(
            "IIS-WebServerRole",
            "IIS-WebServer", 
            "IIS-CommonHttpFeatures",
            "IIS-HttpErrors",
            "IIS-HttpLogging",
            "IIS-RequestFiltering",
            "IIS-StaticContent",
            "IIS-DefaultDocument",
            "IIS-DirectoryBrowsing",
            "IIS-ASPNET45"
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
        Write-Success "Node.js installed"

        # Install IISNode
        Write-Info "Installing IISNode..."
        $iisnodeUrl = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
        $iisnodeInstaller = "$env:TEMP\iisnode-installer.msi"
        
        Invoke-WebRequest -Uri $iisnodeUrl -OutFile $iisnodeInstaller
        Start-Process -FilePath $iisnodeInstaller -ArgumentList "/quiet" -Wait
        Write-Success "IISNode installed"

        # Install Git
        Write-Info "Installing Git..."
        $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
        $gitInstaller = "$env:TEMP\git-installer.exe"
        
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
        Start-Process -FilePath $gitInstaller -ArgumentList "/SILENT" -Wait
        Write-Success "Git installed"

        # Install AWS CLI
        Write-Info "Installing AWS CLI..."
        $awsUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
        $awsInstaller = "$env:TEMP\aws-cli-installer.msi"
        
        Invoke-WebRequest -Uri $awsUrl -OutFile $awsInstaller
        Start-Process -FilePath $awsInstaller -ArgumentList "/quiet" -Wait
        Write-Success "AWS CLI installed"
    }

    # Phase 2: Application Setup
    Write-Info "📁 Setting up application directory..."
    New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
    New-Item -ItemType Directory -Force -Path $ScriptsDir | Out-Null

    # Get parameters if not provided (with your environment defaults)
    if (-not $S3Bucket) {
        $S3Bucket = Read-Host "Enter S3 bucket name [cypher-deployment]"
        if ([string]::IsNullOrWhiteSpace($S3Bucket)) { $S3Bucket = "cypher-deployment" }
    }
    if (-not $S3Key) {
        $S3Key = Read-Host "Enter S3 key (zip file name) [cypher-deployment-latest.zip]"
        if ([string]::IsNullOrWhiteSpace($S3Key)) { $S3Key = "cypher-deployment-latest.zip" }
    }
    if (-not $RDSEndpoint) {
        $RDSEndpoint = Read-Host "Enter RDS endpoint"
    }
    if (-not $DBName) {
        $DBName = Read-Host "Enter database name"
    }
    if (-not $DBUser) {
        $DBUser = Read-Host "Enter database username"
    }
    if (-not $DBPassword) {
        $DBPassword = Read-Host "Enter database password" -AsSecureString
        $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword))
    }
    if (-not $Domain) {
        $Domain = Read-Host "Enter domain name [rasdash.dev.com] (or press Enter to skip)"
        if ([string]::IsNullOrWhiteSpace($Domain)) { $Domain = "rasdash.dev.com" }
    }

    # Phase 3: Download and Extract Code
    Write-Info "📦 Downloading code from S3..."
    $downloadPath = "$env:TEMP\cypher-code.zip"
    
    # Check AWS CLI configuration
    try {
        aws sts get-caller-identity | Out-Null
    } catch {
        Write-Warning "AWS CLI not configured. Please run 'aws configure' first."
        aws configure
    }
    
    aws s3 cp "s3://$S3Bucket/$S3Key" $downloadPath
    if (-not (Test-Path $downloadPath)) {
        throw "Failed to download code from S3"
    }
    
    Expand-Archive -Path $downloadPath -DestinationPath $AppDir -Force
    Write-Success "Code downloaded and extracted"

    # Phase 4: Environment Configuration
    Write-Info "⚙️ Creating environment configuration..."
    $envContent = @"
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://$DBUser`:$DBPassword@$RDSEndpoint`:5432/$DBName
DB_HOST=$RDSEndpoint
DB_PORT=5432
DB_NAME=$DBName
DB_USER=$DBUser
DB_PASSWORD=$DBPassword

# JWT Configuration
JWT_SECRET=$(New-Guid)
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://$Domain

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@
    
    $envContent | Out-File -FilePath "$AppDir\api\.env" -Encoding UTF8
    Write-Success "Environment configuration created"

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
    Write-Info "🌐 Configuring IIS..."
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

    # Configure domain binding if provided
    if ($Domain) {
        Remove-WebBinding -Site "CypherClient" -Port 80 -Protocol http
        New-WebBinding -Site "CypherClient" -Name $Domain -Port 80 -Protocol http
    }

    Write-Success "IIS configured"

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
        $apiResponse = Invoke-WebRequest -Uri "http://localhost/api/health" -TimeoutSec 30
        if ($apiResponse.StatusCode -eq 200) {
            Write-Success "API health check passed"
        } else {
            Write-Warning "API returned status code: $($apiResponse.StatusCode)"
            $healthPassed = $false
        }
    } catch {
        Write-Warning "API health check failed: $($_.Exception.Message)"
        $healthPassed = $false
    }
    
    try {
        $clientResponse = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 30
        if ($clientResponse.StatusCode -eq 200) {
            Write-Success "Client health check passed"
        } else {
            Write-Warning "Client returned status code: $($clientResponse.StatusCode)"
            $healthPassed = $false
        }
    } catch {
        Write-Warning "Client health check failed: $($_.Exception.Message)"
        $healthPassed = $false
    }

    # Final Summary
    Write-Info "🎉 Deployment Summary"
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "Application Directory: $AppDir" -ForegroundColor Yellow
    
    if ($Domain) {
        Write-Host "Application URL: http://$Domain" -ForegroundColor Green
    } else {
        try {
            $publicIP = (Invoke-WebRequest -Uri "http://169.254.169.254/latest/meta-data/public-ipv4" -TimeoutSec 5).Content
            Write-Host "Application URL: http://$publicIP" -ForegroundColor Green
        } catch {
            Write-Host "Application URL: http://YOUR-EC2-PUBLIC-IP" -ForegroundColor Green
        }
    }
    
    if ($healthPassed) {
        Write-Success "🎉 Deployment completed successfully!"
    } else {
        Write-Warning "⚠️ Deployment completed with warnings. Check the logs."
    }

} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
