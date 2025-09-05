# CYPHER Windows Server 2019 Setup Script
# Run this script as Administrator on your EC2 instance

param(
    [switch]$SkipSoftwareInstall = $false,
    [switch]$SkipIISSetup = $false,
    [switch]$SkipDirectorySetup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting CYPHER Windows Server 2019 setup..." -ForegroundColor Green

# Function to check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error "❌ This script must be run as Administrator!"
    exit 1
}

# 1. Software Installation
if (-not $SkipSoftwareInstall) {
    Write-Host "📦 Installing required software..." -ForegroundColor Yellow
    
    # Enable PowerShell execution
    Write-Host "🔓 Setting PowerShell execution policy..." -ForegroundColor Cyan
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force
    
    # Install Chocolatey
    Write-Host "🍫 Installing Chocolatey package manager..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    try {
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ Chocolatey installation failed: $($_.Exception.Message)"
    }
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Install Node.js
    Write-Host "🟢 Installing Node.js 18..." -ForegroundColor Cyan
    try {
        choco install nodejs --version=18.17.0 -y
        Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ Node.js installation failed: $($_.Exception.Message)"
    }
    
    # Install Git
    Write-Host "📚 Installing Git..." -ForegroundColor Cyan
    try {
        choco install git -y
        Write-Host "✅ Git installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ Git installation failed: $($_.Exception.Message)"
    }
    
    # Install AWS CLI
    Write-Host "☁️ Installing AWS CLI..." -ForegroundColor Cyan
    try {
        choco install awscli -y
        Write-Host "✅ AWS CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ AWS CLI installation failed: $($_.Exception.Message)"
    }
    
    # Install OpenSSH
    Write-Host "🔐 Installing OpenSSH..." -ForegroundColor Cyan
    try {
        choco install openssh -y
        Write-Host "✅ OpenSSH installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ OpenSSH installation failed: $($_.Exception.Message)"
    }
    
    # Refresh PATH again
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Install PM2
    Write-Host "⚡ Installing PM2..." -ForegroundColor Cyan
    try {
        npm install -g pm2
        npm install -g pm2-windows-service
        Write-Host "✅ PM2 installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ PM2 installation failed: $($_.Exception.Message)"
    }
    
    # Install PM2 as Windows service
    Write-Host "🔧 Installing PM2 as Windows service..." -ForegroundColor Cyan
    try {
        pm2-service-install -n PM2
        Write-Host "✅ PM2 service installed successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ PM2 service installation failed: $($_.Exception.Message)"
    }
}

# 2. Directory Setup
if (-not $SkipDirectorySetup) {
    Write-Host "📁 Creating deployment directories..." -ForegroundColor Yellow
    
    $directories = @(
        "C:\deployments\logs",
        "C:\deployments\backups",
        "C:\deployments\temp",
        "C:\inetpub\wwwroot\cypher",
        "C:\Users\Administrator\.ssh"
    )
    
    foreach ($dir in $directories) {
        try {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Host "✅ Created directory: $dir" -ForegroundColor Green
        } catch {
            Write-Warning "⚠️ Failed to create directory $dir: $($_.Exception.Message)"
        }
    }
}

# 3. IIS Setup
if (-not $SkipIISSetup) {
    Write-Host "🌐 Setting up IIS..." -ForegroundColor Yellow
    
    # Enable IIS features
    Write-Host "🔧 Enabling IIS features..." -ForegroundColor Cyan
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing -All
        Write-Host "✅ IIS features enabled successfully" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ IIS feature installation failed: $($_.Exception.Message)"
    }
    
    # Import WebAdministration module
    try {
        Import-Module WebAdministration
        
        # Remove default website if it exists
        if (Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue) {
            Remove-Website -Name "Default Web Site"
            Write-Host "✅ Removed default website" -ForegroundColor Green
        }
        
        # Create CYPHER website
        New-Website -Name "CYPHER" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\cypher\client"
        Write-Host "✅ Created CYPHER website" -ForegroundColor Green
        
        # Create web.config for React routing
        $webConfigPath = "C:\inetpub\wwwroot\cypher\client\web.config"
        $webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
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
"@
        
        New-Item -ItemType Directory -Force -Path (Split-Path $webConfigPath) | Out-Null
        $webConfig | Out-File -FilePath $webConfigPath -Encoding UTF8
        Write-Host "✅ Created web.config for React routing" -ForegroundColor Green
        
    } catch {
        Write-Warning "⚠️ IIS website setup failed: $($_.Exception.Message)"
    }
}

# 4. SSH Service Setup
Write-Host "🔐 Setting up SSH service..." -ForegroundColor Yellow
try {
    Start-Service sshd -ErrorAction SilentlyContinue
    Set-Service -Name sshd -StartupType 'Automatic'
    Write-Host "✅ SSH service configured" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ SSH service setup failed: $($_.Exception.Message)"
}

# 5. Firewall Configuration
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Yellow
try {
    # Allow HTTP
    New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    
    # Allow HTTPS
    New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    
    # Allow API port
    New-NetFirewallRule -DisplayName "Allow CYPHER API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction SilentlyContinue
    
    Write-Host "✅ Firewall rules configured" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ Firewall configuration failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "🎉 CYPHER Windows Server setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure your GitLab CI/CD variables" -ForegroundColor White
Write-Host "2. Add your SSH public key to C:\Users\Administrator\.ssh\authorized_keys" -ForegroundColor White
Write-Host "3. Test the deployment pipeline" -ForegroundColor White
Write-Host "4. Install URL Rewrite module for IIS (if needed)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your server is ready for CYPHER deployment!" -ForegroundColor Cyan
