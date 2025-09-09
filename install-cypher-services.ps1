# 🚀 CYPHER NSSM Services Installation Script
# Run this script as Administrator on your Windows Server 2019 EC2 instance

Write-Host "🔧 CYPHER NSSM Services Installer" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Set deployment path
$deployPath = "C:\deployments\cypher"
$nssmPath = "C:\nssm\nssm.exe"
Write-Host "📁 Using deployment path: $deployPath" -ForegroundColor Cyan

# Check if deployment exists
if (-not (Test-Path $deployPath)) {
    Write-Host "❌ Deployment directory not found: $deployPath" -ForegroundColor Red
    Write-Host "Please ensure your CYPHER application is deployed first." -ForegroundColor Yellow
    pause
    exit 1
}

# Check if NSSM exists
if (-not (Test-Path $nssmPath)) {
    Write-Host "� NSSM not found. Downloading and installing..." -ForegroundColor Yellow

    # Create NSSM directory
    New-Item -ItemType Directory -Path "C:\nssm" -Force | Out-Null
    New-Item -ItemType Directory -Path "C:\temp" -Force | Out-Null

    try {
        # Download NSSM
        $url = "https://nssm.cc/release/nssm-2.24.zip"
        $output = "C:\temp\nssm.zip"
        Write-Host "Downloading NSSM from $url..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing

        # Extract NSSM
        Write-Host "Extracting NSSM..." -ForegroundColor Cyan
        Expand-Archive -Path $output -DestinationPath "C:\temp\nssm" -Force
        Copy-Item "C:\temp\nssm\nssm-2.24\win64\nssm.exe" -Destination "C:\nssm\nssm.exe"

        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*C:\nssm*") {
            [Environment]::SetEnvironmentVariable("PATH", $currentPath + ";C:\nssm", "Machine")
            $env:PATH += ";C:\nssm"
        }

        Write-Host "✅ NSSM installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download/install NSSM: $_" -ForegroundColor Red
        Write-Host "Please download NSSM manually from https://nssm.cc/download" -ForegroundColor Yellow
        pause
        exit 1
    }
} else {
    Write-Host "✅ NSSM found at $nssmPath" -ForegroundColor Green
}

# Remove any existing services first
Write-Host "🧹 Removing any existing CYPHER services..." -ForegroundColor Yellow
try {
    & $nssmPath stop "CYPHER API" 2>$null
    & $nssmPath remove "CYPHER API" confirm 2>$null
    & $nssmPath stop "CYPHER Client" 2>$null
    & $nssmPath remove "CYPHER Client" confirm 2>$null
    Write-Host "✅ Existing services removed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing services to remove" -ForegroundColor Gray
}

Write-Host "🔧 Creating NSSM services..." -ForegroundColor Yellow

# Check if API server file exists
$apiServerPath = "$deployPath\api\server.js"
if (-not (Test-Path $apiServerPath)) {
    Write-Host "❌ API server file not found: $apiServerPath" -ForegroundColor Red
    pause
    exit 1
}

# Install CYPHER API Service
Write-Host "🚀 Installing CYPHER API service..." -ForegroundColor Cyan
& $nssmPath install "CYPHER API" node "$apiServerPath"
& $nssmPath set "CYPHER API" DisplayName "CYPHER API Server"
& $nssmPath set "CYPHER API" Description "CYPHER API Server - Auto starts on boot"
& $nssmPath set "CYPHER API" Start SERVICE_AUTO_START
& $nssmPath set "CYPHER API" AppDirectory "$deployPath\api"
& $nssmPath set "CYPHER API" AppEnvironmentExtra "PORT=3001" "NODE_ENV=production"
& $nssmPath set "CYPHER API" AppStdout "$deployPath\logs\api-stdout.log"
& $nssmPath set "CYPHER API" AppStderr "$deployPath\logs\api-stderr.log"
& $nssmPath set "CYPHER API" AppRotateFiles 1
& $nssmPath set "CYPHER API" AppRotateOnline 1
& $nssmPath set "CYPHER API" AppRotateSeconds 86400
& $nssmPath set "CYPHER API" AppRotateBytes 1048576

Write-Host "✅ CYPHER API service configured" -ForegroundColor Green

# Create client server file if it doesn't exist
$clientServerPath = "$deployPath\client\serve-build.js"
if (-not (Test-Path $clientServerPath)) {
    Write-Host "📝 Creating client server file..." -ForegroundColor Yellow

    $clientServerScript = @"
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

console.log('Starting CYPHER Client server...');

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router (return index.html for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`CYPHER Client server running on port ${port}`);
});
"@

    $clientServerScript | Out-File -FilePath $clientServerPath -Encoding UTF8

    # Install express for client server
    Write-Host "📦 Installing express for client server..." -ForegroundColor Cyan
    Set-Location "$deployPath\client"
    npm install express --save
    Set-Location $deployPath

    Write-Host "✅ Client server file created" -ForegroundColor Green
}

# Install CYPHER Client Service
Write-Host "🌐 Installing CYPHER Client service..." -ForegroundColor Cyan
& $nssmPath install "CYPHER Client" node "$clientServerPath"
& $nssmPath set "CYPHER Client" DisplayName "CYPHER Client Server"
& $nssmPath set "CYPHER Client" Description "CYPHER Client Server - Auto starts on boot"
& $nssmPath set "CYPHER Client" Start SERVICE_AUTO_START
& $nssmPath set "CYPHER Client" AppDirectory "$deployPath\client"
& $nssmPath set "CYPHER Client" AppEnvironmentExtra "PORT=3000" "NODE_ENV=production"
& $nssmPath set "CYPHER Client" AppStdout "$deployPath\logs\client-stdout.log"
& $nssmPath set "CYPHER Client" AppStderr "$deployPath\logs\client-stderr.log"
& $nssmPath set "CYPHER Client" AppRotateFiles 1
& $nssmPath set "CYPHER Client" AppRotateOnline 1
& $nssmPath set "CYPHER Client" AppRotateSeconds 86400
& $nssmPath set "CYPHER Client" AppRotateBytes 1048576

Write-Host "✅ CYPHER Client service configured" -ForegroundColor Green

# Create logs directory
New-Item -ItemType Directory -Path "$deployPath\logs" -Force | Out-Null

# Start the services
Write-Host "🚀 Starting CYPHER services..." -ForegroundColor Yellow
& $nssmPath start "CYPHER API"
Start-Sleep -Seconds 3
& $nssmPath start "CYPHER Client"
Start-Sleep -Seconds 5

Write-Host "📋 Checking service status..." -ForegroundColor Yellow
Get-Service | Where-Object {$_.Name -like "*CYPHER*"} | Format-Table Name, Status, StartType -AutoSize

# Check if services are actually running
Write-Host "🔍 Verifying services are running..." -ForegroundColor Yellow
$apiRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*server.js*"}
$clientRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*serve-build.js*"}

if ($apiRunning) {
    Write-Host "✅ API service is running (PID: $($apiRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ API service may not be running" -ForegroundColor Red
}

if ($clientRunning) {
    Write-Host "✅ Client service is running (PID: $($clientRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Client service may not be running" -ForegroundColor Red
}

# Check ports
Write-Host "🌐 Checking ports..." -ForegroundColor Yellow
$port3001 = netstat -an | findstr ":3001" | findstr "LISTENING"
$port3000 = netstat -an | findstr ":3000" | findstr "LISTENING"

if ($port3001) {
    Write-Host "✅ Port 3001 (API) is listening" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3001 (API) is not listening" -ForegroundColor Red
}

if ($port3000) {
    Write-Host "✅ Port 3000 (Client) is listening" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3000 (Client) is not listening" -ForegroundColor Red
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 NSSM Installation Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "✅ CYPHER API Service: Configured with NSSM" -ForegroundColor Green
Write-Host "✅ CYPHER Client Service: Configured with NSSM" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🌐 Your applications should be available at:" -ForegroundColor Cyan
Write-Host "   Client: http://54.91.127.123:3000" -ForegroundColor White
Write-Host "   API:    http://54.91.127.123:3001/health" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔄 Services will automatically start when the EC2 instance boots" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📊 NSSM Service Management Commands:" -ForegroundColor Yellow
Write-Host "   Check status:    nssm status `"CYPHER API`"" -ForegroundColor Gray
Write-Host "   Stop service:    nssm stop `"CYPHER API`"" -ForegroundColor Gray
Write-Host "   Start service:   nssm start `"CYPHER API`"" -ForegroundColor Gray
Write-Host "   Restart service: nssm restart `"CYPHER API`"" -ForegroundColor Gray
Write-Host "   Remove service:  nssm remove `"CYPHER API`" confirm" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "📁 Service logs are located at:" -ForegroundColor Yellow
Write-Host "   API logs:    $deployPath\logs\api-stdout.log" -ForegroundColor Gray
Write-Host "   Client logs: $deployPath\logs\client-stdout.log" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
