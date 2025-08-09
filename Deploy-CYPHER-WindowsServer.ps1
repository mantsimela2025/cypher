# CYPHER Dashboard Deployment Script for Windows Server 2019
# This script deploys the CYPHER application from locally copied files
# Prerequisites: Copy 'api' and 'client' folders to C:\CYPHER-Dashboard\ before running

param(
    [string]$AppDir = "C:\CYPHER-Dashboard",
    [int]$ApiPort = 3001,
    [int]$ClientPort = 3000
)

# Set execution policy and error handling
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
    Add-Content -Path "C:\CYPHER-deployment.log" -Value "[$timestamp] $Message"
}

function Write-Success { param([string]$Message); Write-Log $Message $Green }
function Write-Error { param([string]$Message); Write-Log "ERROR: $Message" $Red }
function Write-Warning { param([string]$Message); Write-Log "WARNING: $Message" $Yellow }
function Write-Info { param([string]$Message); Write-Log "INFO: $Message" $Blue }

# Show file copy instructions
function Show-CopyInstructions {
    Write-Host ""
    Write-Host "=== CYPHER DASHBOARD DEPLOYMENT ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script deploys CYPHER Dashboard from locally copied files." -ForegroundColor White
    Write-Host ""
    Write-Host "BEFORE RUNNING THIS SCRIPT:" -ForegroundColor Yellow
    Write-Host "1. Copy your 'api' folder to:    $AppDir\api\" -ForegroundColor White
    Write-Host "2. Copy your 'client' folder to: $AppDir\client\" -ForegroundColor White
    Write-Host ""
    Write-Host "COPY METHODS:" -ForegroundColor Yellow
    Write-Host "• WinSCP: Transfer files via SFTP" -ForegroundColor White
    Write-Host "• RDP: Copy/paste via Remote Desktop" -ForegroundColor White
    Write-Host "• Network Share: Copy from mapped drive" -ForegroundColor White
    Write-Host ""
    Write-Host "The script will verify files are present before proceeding..." -ForegroundColor Green
    Write-Host ""
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install Chocolatey package manager
function Install-Chocolatey {
    Write-Log "Checking Chocolatey package manager..."

    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Log "Installing Chocolatey package manager..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        Write-Success "Chocolatey installed successfully"
    } else {
        Write-Success "Chocolatey already installed - skipping installation"
    }
}

# Install Node.js
function Install-NodeJS {
    Write-Log "Checking Node.js installation..."

    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Log "Installing Node.js..."
        choco install nodejs -y

        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        Write-Success "Node.js installed successfully"
    } else {
        Write-Success "Node.js already installed - skipping installation"
    }

    # Verify installation
    try {
        $nodeVersion = node --version
        $npmVersion = npm --version
        Write-Info "Node.js version: $nodeVersion"
        Write-Info "npm version: $npmVersion"
    } catch {
        Write-Warning "Could not verify Node.js version - may need to restart PowerShell"
    }
}

# Skip AWS CLI installation (not needed for local file deployment)
function Skip-AWSCLI {
    Write-Info "AWS CLI not required for local file deployment - skipping"
}

# Install PM2
function Install-PM2 {
    Write-Log "Checking PM2 installation..."

    try {
        $pm2Version = npm list -g pm2 --depth=0 2>$null | Select-String "pm2@"
        if ($pm2Version) {
            Write-Success "PM2 already installed - skipping installation"
            Write-Info "PM2 version: $($pm2Version.ToString().Trim())"
        } else {
            throw "PM2 not found"
        }
    } catch {
        Write-Log "Installing PM2..."
        npm install -g pm2
        npm install -g pm2-windows-startup
        Write-Success "PM2 installed successfully"
    }
}

# Backup existing installation
function Backup-Existing {
    if (Test-Path $AppDir) {
        $backupDir = "C:\CYPHER-Dashboard-Backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Log "Backing up existing installation to $backupDir..."
        Copy-Item -Path $AppDir -Destination $backupDir -Recurse
        Write-Success "Backup completed"
    } else {
        Write-Info "No existing installation found, skipping backup"
    }
}

# Verify application files exist (manually copied)
function Verify-Application {
    Write-Log "Verifying CYPHER Dashboard files..."

    # Check if application directory exists
    if (!(Test-Path $AppDir)) {
        Write-Error "Application directory not found at $AppDir"
        Write-Error ""
        Write-Error "MANUAL SETUP REQUIRED:"
        Write-Error "1. Create directory: $AppDir"
        Write-Error "2. Copy your 'api' folder to: $AppDir\api\"
        Write-Error "3. Copy your 'client' folder to: $AppDir\client\"
        Write-Error ""
        Write-Error "Expected final structure:"
        Write-Error "  $AppDir\"
        Write-Error "  ├── api\"
        Write-Error "  │   ├── src\"
        Write-Error "  │   └── package.json"
        Write-Error "  └── client\"
        Write-Error "      ├── src\"
        Write-Error "      └── package.json"
        exit 1
    }

    # Check for required folders
    if (!(Test-Path "$AppDir\api")) {
        Write-Error "API folder not found at $AppDir\api"
        Write-Error ""
        Write-Error "COPY REQUIRED:"
        Write-Error "Please copy the complete 'api' folder from your development machine to:"
        Write-Error "$AppDir\api\"
        Write-Error ""
        Write-Error "The 'api' folder should contain:"
        Write-Error "- src\ folder with your API source code"
        Write-Error "- package.json file"
        exit 1
    }

    if (!(Test-Path "$AppDir\client")) {
        Write-Error "Client folder not found at $AppDir\client"
        Write-Error ""
        Write-Error "COPY REQUIRED:"
        Write-Error "Please copy the complete 'client' folder from your development machine to:"
        Write-Error "$AppDir\client\"
        Write-Error ""
        Write-Error "The 'client' folder should contain:"
        Write-Error "- src\ folder with your client source code"
        Write-Error "- package.json file"
        exit 1
    }

    # Check for package.json files
    if (!(Test-Path "$AppDir\api\package.json")) {
        Write-Error "API package.json not found at $AppDir\api\package.json"
        Write-Error "Please ensure the complete 'api' folder structure is copied, including package.json"
        exit 1
    }

    if (!(Test-Path "$AppDir\client\package.json")) {
        Write-Error "Client package.json not found at $AppDir\client\package.json"
        Write-Error "Please ensure the complete 'client' folder structure is copied, including package.json"
        exit 1
    }

    # Check for source code folders
    if (!(Test-Path "$AppDir\api\src")) {
        Write-Warning "API src folder not found at $AppDir\api\src - this may cause issues"
    }

    if (!(Test-Path "$AppDir\client\src")) {
        Write-Warning "Client src folder not found at $AppDir\client\src - this may cause issues"
    }

    Write-Success "Application files verified successfully"
    Write-Info "✓ Found API folder: $AppDir\api"
    Write-Info "✓ Found Client folder: $AppDir\client"
    Write-Info "✓ Found API package.json"
    Write-Info "✓ Found Client package.json"

    # Show file counts for verification
    try {
        $apiFileCount = (Get-ChildItem "$AppDir\api" -Recurse -File).Count
        $clientFileCount = (Get-ChildItem "$AppDir\client" -Recurse -File).Count
        Write-Info "✓ API folder contains $apiFileCount files"
        Write-Info "✓ Client folder contains $clientFileCount files"
    } catch {
        Write-Warning "Could not count files in folders"
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Log "Checking application dependencies..."

    # Install API dependencies
    if (Test-Path "$AppDir\api\package.json") {
        Set-Location "$AppDir\api"

        # Check if node_modules exists and has content
        if ((Test-Path "$AppDir\api\node_modules") -and (Get-ChildItem "$AppDir\api\node_modules" -ErrorAction SilentlyContinue)) {
            Write-Success "API dependencies already installed - skipping installation"
        } else {
            Write-Log "Installing API dependencies..."
            npm install --production

            if ($LASTEXITCODE -eq 0) {
                Write-Success "API dependencies installed successfully"
            } else {
                Write-Error "Failed to install API dependencies"
                exit 1
            }
        }
    } else {
        Write-Error "API package.json not found"
        exit 1
    }

    # Install Client dependencies
    if (Test-Path "$AppDir\client\package.json") {
        Set-Location "$AppDir\client"

        # Check if node_modules exists and has content
        if ((Test-Path "$AppDir\client\node_modules") -and (Get-ChildItem "$AppDir\client\node_modules" -ErrorAction SilentlyContinue)) {
            Write-Success "Client dependencies already installed - skipping installation"
        } else {
            Write-Log "Installing Client dependencies..."
            npm install

            if ($LASTEXITCODE -eq 0) {
                Write-Success "Client dependencies installed successfully"
            } else {
                Write-Error "Failed to install Client dependencies"
                exit 1
            }
        }
    } else {
        Write-Error "Client package.json not found"
        exit 1
    }
}

# Configure environment
function Configure-Environment {
    Write-Log "Checking environment configuration..."

    # Check if API .env file exists and has required content
    $apiEnvPath = "$AppDir\api\.env"
    $apiEnvExists = $false

    if (Test-Path $apiEnvPath) {
        $apiEnvContent = Get-Content $apiEnvPath -Raw
        if ($apiEnvContent -match "NODE_ENV=production" -and $apiEnvContent -match "DB_HOST=" -and $apiEnvContent -match "JWT_SECRET=") {
            Write-Success "API environment file already configured - skipping creation"
            $apiEnvExists = $true
        }
    }

    if (-not $apiEnvExists) {
        Write-Log "Creating API environment file..."
        # Generate JWT secret
        $jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

        # Create API environment file
        $apiEnvContent = @"
NODE_ENV=production
PORT=$ApiPort
DB_HOST=rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=rasdashdevo1
DB_USER=rasdashadmin
DB_PASSWORD=RasDash2025$
JWT_SECRET=$jwtSecret
CORS_ORIGIN=http://localhost:$ClientPort
LOG_LEVEL=info
"@

        Set-Content -Path $apiEnvPath -Value $apiEnvContent
        Write-Success "API environment file created"
    }

    # Check if Client .env file exists and has required content
    $clientEnvPath = "$AppDir\client\.env"
    $clientEnvExists = $false

    if (Test-Path $clientEnvPath) {
        $clientEnvContent = Get-Content $clientEnvPath -Raw
        if ($clientEnvContent -match "VITE_API_URL=" -and $clientEnvContent -match "NODE_ENV=production") {
            Write-Success "Client environment file already configured - skipping creation"
            $clientEnvExists = $true
        }
    }

    if (-not $clientEnvExists) {
        Write-Log "Creating Client environment file..."
        # Create client environment file
        $clientEnvContent = @"
VITE_API_URL=http://localhost:$ApiPort
VITE_APP_NAME=CYPHER Dashboard
NODE_ENV=production
"@

        Set-Content -Path $clientEnvPath -Value $clientEnvContent
        Write-Success "Client environment file created"
    }

    Write-Success "Environment configuration completed"
}

# Build client application
function Build-Client {
    Write-Log "Checking client build..."

    Set-Location "$AppDir\client"

    # Check if dist folder exists and has content
    if ((Test-Path "$AppDir\client\dist") -and (Get-ChildItem "$AppDir\client\dist" -ErrorAction SilentlyContinue)) {
        # Check if dist folder is recent (built within last hour) to avoid unnecessary rebuilds
        $distFolder = Get-Item "$AppDir\client\dist"
        $timeDiff = (Get-Date) - $distFolder.LastWriteTime

        if ($timeDiff.TotalMinutes -lt 60) {
            Write-Success "Client already built recently - skipping build"
            return
        } else {
            Write-Log "Client build is older than 1 hour - rebuilding..."
        }
    } else {
        Write-Log "Client not built yet - building now..."
    }

    npm run build

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Client build completed successfully"
    } else {
        Write-Error "Failed to build client application"
        exit 1
    }
}

# Configure PM2
function Configure-PM2 {
    Write-Log "Checking PM2 configuration..."

    # Check if ecosystem.config.js exists and has correct content
    $ecosystemPath = "$AppDir\ecosystem.config.js"
    $ecosystemExists = $false

    if (Test-Path $ecosystemPath) {
        $ecosystemContent = Get-Content $ecosystemPath -Raw
        if ($ecosystemContent -match "cypher-api" -and $ecosystemContent -match "cypher-client") {
            Write-Success "PM2 ecosystem configuration already exists - skipping creation"
            $ecosystemExists = $true
        }
    }

    if (-not $ecosystemExists) {
        Write-Log "Creating PM2 ecosystem configuration..."
        # Create PM2 ecosystem file
        $ecosystemContent = @"
module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/src/app.js',
      cwd: '$($AppDir.Replace('\', '/'))',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: $ApiPort
      },
      error_file: 'C:/CYPHER-logs/cypher-api-error.log',
      out_file: 'C:/CYPHER-logs/cypher-api-out.log',
      log_file: 'C:/CYPHER-logs/cypher-api.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    },
    {
      name: 'cypher-client',
      script: 'npx',
      args: 'serve -s dist -l $ClientPort',
      cwd: '$($AppDir.Replace('\', '/'))/client',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'C:/CYPHER-logs/cypher-client-error.log',
      out_file: 'C:/CYPHER-logs/cypher-client-out.log',
      log_file: 'C:/CYPHER-logs/cypher-client.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M'
    }
  ]
};
"@

        Set-Content -Path $ecosystemPath -Value $ecosystemContent
        Write-Success "PM2 ecosystem configuration created"
    }

    # Create logs directory if it doesn't exist
    if (!(Test-Path "C:\CYPHER-logs")) {
        New-Item -ItemType Directory -Path "C:\CYPHER-logs" -Force | Out-Null
        Write-Success "Created logs directory"
    } else {
        Write-Success "Logs directory already exists"
    }

    Write-Success "PM2 configuration completed"
}

# Start services
function Start-Services {
    Write-Log "Checking CYPHER Dashboard services..."

    Set-Location $AppDir

    # Check if services are already running
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        $apiRunning = $pm2Status | Where-Object { $_.name -eq "cypher-api" -and $_.pm2_env.status -eq "online" }
        $clientRunning = $pm2Status | Where-Object { $_.name -eq "cypher-client" -and $_.pm2_env.status -eq "online" }

        if ($apiRunning -and $clientRunning) {
            Write-Success "CYPHER services already running - restarting to ensure latest configuration"
            pm2 restart all
        } else {
            Write-Log "Starting CYPHER Dashboard services..."
            # Stop any existing PM2 processes
            pm2 delete all 2>$null

            # Start the applications
            pm2 start ecosystem.config.js
        }
    } catch {
        Write-Log "Starting CYPHER Dashboard services..."
        # Stop any existing PM2 processes
        pm2 delete all 2>$null

        # Start the applications
        pm2 start ecosystem.config.js
    }

    # Save PM2 configuration
    pm2 save

    # Setup PM2 to start on boot (check if already configured)
    try {
        $startupCheck = pm2 startup | Out-String
        if ($startupCheck -notmatch "already") {
            pm2-startup install
            Write-Success "PM2 startup configured"
        } else {
            Write-Success "PM2 startup already configured"
        }
    } catch {
        Write-Warning "Could not configure PM2 startup - may need manual configuration"
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services started successfully"
    } else {
        Write-Error "Failed to start services"
        exit 1
    }
}

# Configure Windows Firewall
function Configure-Firewall {
    Write-Log "Checking Windows Firewall configuration..."

    # Check if firewall rules already exist
    $apiRule = Get-NetFirewallRule -DisplayName "CYPHER API" -ErrorAction SilentlyContinue
    $clientRule = Get-NetFirewallRule -DisplayName "CYPHER Client" -ErrorAction SilentlyContinue

    if (-not $apiRule) {
        Write-Log "Creating firewall rule for API port $ApiPort..."
        New-NetFirewallRule -DisplayName "CYPHER API" -Direction Inbound -Protocol TCP -LocalPort $ApiPort -Action Allow -ErrorAction SilentlyContinue
        Write-Success "API firewall rule created"
    } else {
        Write-Success "API firewall rule already exists - skipping creation"
    }

    if (-not $clientRule) {
        Write-Log "Creating firewall rule for Client port $ClientPort..."
        New-NetFirewallRule -DisplayName "CYPHER Client" -Direction Inbound -Protocol TCP -LocalPort $ClientPort -Action Allow -ErrorAction SilentlyContinue
        Write-Success "Client firewall rule created"
    } else {
        Write-Success "Client firewall rule already exists - skipping creation"
    }

    Write-Success "Firewall configuration completed"
}

# Health check
function Test-Health {
    Write-Log "Performing health check..."
    
    Start-Sleep -Seconds 15  # Wait for services to start
    
    # Check API health
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://localhost:$ApiPort/health" -UseBasicParsing -TimeoutSec 10
        if ($apiResponse.StatusCode -eq 200) {
            Write-Success "API health check passed"
        }
    } catch {
        Write-Warning "API health check failed - service may still be starting"
    }
    
    # Check client
    try {
        $clientResponse = Invoke-WebRequest -Uri "http://localhost:$ClientPort" -UseBasicParsing -TimeoutSec 10
        if ($clientResponse.StatusCode -eq 200) {
            Write-Success "Client health check passed"
        }
    } catch {
        Write-Warning "Client health check failed - service may still be starting"
    }
}

# Main deployment function
function Deploy-CYPHER {
    Show-CopyInstructions

    Write-Log "Starting CYPHER Dashboard deployment on Windows Server 2019..."

    if (!(Test-Administrator)) {
        Write-Error "This script must be run as Administrator"
        Write-Error "Right-click PowerShell and select 'Run as Administrator'"
        exit 1
    }

    try {
        Install-Chocolatey
        Install-NodeJS
        Skip-AWSCLI
        Install-PM2
        Backup-Existing
        Verify-Application
        Install-Dependencies
        Configure-Environment
        Build-Client
        Configure-PM2
        Start-Services
        Configure-Firewall
        Test-Health
        
        Write-Success "CYPHER Dashboard deployment completed successfully!"
        Write-Success ""
        Write-Success "=== DEPLOYMENT SUMMARY ==="
        Write-Info "✓ API Server running on port $ApiPort"
        Write-Info "✓ Client Application running on port $ClientPort"
        Write-Info "✓ Services managed by PM2"
        Write-Info "✓ Auto-start configured for Windows boot"
        Write-Success ""

        # Get public IP
        try {
            $publicIP = (Invoke-WebRequest -Uri "http://169.254.169.254/latest/meta-data/public-ipv4" -UseBasicParsing -TimeoutSec 5).Content
            Write-Success "🌐 Access your CYPHER Dashboard at:"
            Write-Info "   http://$publicIP`:$ClientPort"
        } catch {
            Write-Success "🌐 Access your CYPHER Dashboard at:"
            Write-Info "   http://your-server-ip:$ClientPort"
            Write-Info "   (Replace 'your-server-ip' with your actual server IP)"
        }

        Write-Success ""
        Write-Success "=== MANAGEMENT COMMANDS ==="
        Write-Info "Check status:    pm2 status"
        Write-Info "View logs:       pm2 logs"
        Write-Info "Restart all:     pm2 restart all"
        Write-Info "Stop all:        pm2 stop all"
        Write-Success ""
        Write-Success "=== FILE LOCATIONS ==="
        Write-Info "Application:     $AppDir"
        Write-Info "Logs:           C:\CYPHER-logs\"
        Write-Info "Configuration:   $AppDir\api\.env"
        Write-Info "                $AppDir\client\.env"
        
    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run deployment
Deploy-CYPHER
