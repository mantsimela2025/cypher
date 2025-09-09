# 🚀 Windows Server 2019 Automation Setup Script
# Run this script on your Windows EC2 instance to enable automated deployment

Write-Host "🔧 Setting up Windows Server 2019 for automated deployment..." -ForegroundColor Green

# 1. Install Chocolatey (Windows Package Manager)
Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. Install Node.js
Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
choco install nodejs -y

# 3. Install Git
Write-Host "📦 Installing Git..." -ForegroundColor Yellow
choco install git -y

# 4. Install PM2
Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
npm install -g pm2
npm install -g pm2-windows-service

# 5. Install PM2 as Windows Service
Write-Host "🔧 Setting up PM2 as Windows Service..." -ForegroundColor Yellow
pm2-service-install -n PM2

# 6. Configure Windows Firewall
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "CYPHER API Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "CYPHER Client Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# 7. Ensure SSM Agent is running
Write-Host "🔧 Checking SSM Agent..." -ForegroundColor Yellow
$ssmService = Get-Service -Name "AmazonSSMAgent" -ErrorAction SilentlyContinue
if ($ssmService) {
    if ($ssmService.Status -ne "Running") {
        Start-Service -Name "AmazonSSMAgent"
        Write-Host "✅ SSM Agent started" -ForegroundColor Green
    } else {
        Write-Host "✅ SSM Agent already running" -ForegroundColor Green
    }
} else {
    Write-Host "❌ SSM Agent not found - please install it manually" -ForegroundColor Red
}

# 8. Create deployment directories
Write-Host "📁 Creating deployment directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "C:\deployments\cypher" -Force
New-Item -ItemType Directory -Path "C:\deployments\backups" -Force
New-Item -ItemType Directory -Path "C:\deployments\logs" -Force

# 9. Set up environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Machine")

Write-Host "✅ Windows Server setup completed!" -ForegroundColor Green
Write-Host "🎯 Your server is now ready for automated deployment via GitHub Actions" -ForegroundColor Cyan

# Display next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart your EC2 instance to ensure all services start properly" -ForegroundColor White
Write-Host "2. Update your GitHub Actions workflow with the correct S3 bucket name" -ForegroundColor White
Write-Host "3. Ensure your EC2 instance has the SSM role attached" -ForegroundColor White
Write-Host "4. Test the automated deployment by pushing code to GitHub" -ForegroundColor White

# Check if reboot is needed
$rebootRequired = $false
if (Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired" -ErrorAction SilentlyContinue) {
    $rebootRequired = $true
}

if ($rebootRequired) {
    Write-Host "`n⚠️  A reboot is required to complete the setup" -ForegroundColor Red
    Write-Host "Please restart your EC2 instance when convenient" -ForegroundColor Yellow
}
