# RAS Dashboard Windows Deployment Script
# This script automates the deployment process on Windows Server 2019 with IIS

param(
    [Parameter(Mandatory=$false)]
    [string]$SiteName = "RAS-Dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "80",
    
    [Parameter(Mandatory=$false)]
    [string]$DeploymentPath = "C:\inetpub\wwwroot\ras-dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiPath = "C:\inetpub\wwwroot\ras-dashboard-api",
    
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipIISConfig
)

# Script configuration
$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   RAS Dashboard Windows Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install IIS features
function Install-IISFeatures {
    Write-Host "📦 Installing IIS features..." -ForegroundColor Yellow
    
    $features = @(
        "IIS-WebServerRole",
        "IIS-WebServer",
        "IIS-CommonHttpFeatures",
        "IIS-HttpRedirect",
        "IIS-NetFxExtensibility45",
        "IIS-HealthAndDiagnostics",
        "IIS-HttpLogging",
        "IIS-Security",
        "IIS-RequestFiltering",
        "IIS-Performance",
        "IIS-WebServerManagementTools",
        "IIS-ManagementConsole",
        "IIS-IIS6ManagementCompatibility",
        "IIS-Metabase",
        "IIS-ASPNET45",
        "IIS-NetFxExtensibility",
        "IIS-ISAPIExtensions",
        "IIS-ISAPIFilter",
        "IIS-HttpCompressionStatic",
        "IIS-HttpCompressionDynamic"
    )
    
    foreach ($feature in $features) {
        try {
            Enable-WindowsOptionalFeature -Online -FeatureName $feature -NoRestart -All
            Write-Host "  ✅ $feature" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  $feature (may already be installed)" -ForegroundColor Yellow
        }
    }
}

# Function to install Node.js
function Install-NodeJS {
    Write-Host "🟢 Checking Node.js installation..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "  ✅ Node.js found: $nodeVersion" -ForegroundColor Green
        
        $npmVersion = npm --version
        Write-Host "  ✅ npm found: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Node.js not found!" -ForegroundColor Red
        Write-Host "  Please download and install Node.js from: https://nodejs.org/" -ForegroundColor Red
        Write-Host "  Recommended version: LTS (18.x or higher)" -ForegroundColor Red
        exit 1
    }
}

# Function to install IISNode
function Install-IISNode {
    Write-Host "🔗 Checking IISNode installation..." -ForegroundColor Yellow
    
    $iisNodePath = "C:\Program Files\iisnode"
    if (Test-Path $iisNodePath) {
        Write-Host "  ✅ IISNode found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ IISNode not found!" -ForegroundColor Red
        Write-Host "  Please download and install IISNode from:" -ForegroundColor Red
        Write-Host "  https://github.com/Azure/iisnode/releases" -ForegroundColor Red
        Write-Host "  Choose the x64 version for Windows Server 2019" -ForegroundColor Red
        exit 1
    }
}

# Function to install URL Rewrite module with reliable detection
function Install-URLRewrite {
    Write-Host "🔄 Checking URL Rewrite module..." -ForegroundColor Yellow
    
    $found = $false
    
    # Method 1: Check registry for URL Rewrite installation
    try {
        $registryPaths = @(
            "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\IIS Extensions\URL Rewrite"
        )
        
        foreach ($regPath in $registryPaths) {
            if (Test-Path $regPath) {
                $version = Get-ItemProperty $regPath -Name "Version" -ErrorAction SilentlyContinue
                if ($version) {
                    Write-Host "  ✅ URL Rewrite module found (Version: $($version.Version))" -ForegroundColor Green
                    $found = $true
                    break
                }
            }
        }
    } catch {
        # Continue with other methods
    }
    
    # Method 2: Check for URL Rewrite DLL files
    if (-not $found) {
        try {
            $dllPaths = @(
                "$env:SystemRoot\System32\inetsrv\rewrite.dll",
                "$env:SystemRoot\SysWOW64\inetsrv\rewrite.dll"
            )
            
            foreach ($dllPath in $dllPaths) {
                if (Test-Path $dllPath) {
                    Write-Host "  ✅ URL Rewrite module found (DLL: $dllPath)" -ForegroundColor Green
                    $found = $true
                    break
                }
            }
        } catch {
            # Continue with final check
        }
    }
    
    # Method 3: Check IIS modules configuration
    if (-not $found) {
        try {
            Import-Module WebAdministration -ErrorAction SilentlyContinue
            $modules = Get-WebGlobalModule -ErrorAction SilentlyContinue
            $rewriteModule = $modules | Where-Object { $_.Name -like "*rewrite*" -or $_.Name -like "*URL*" }
            
            if ($rewriteModule) {
                Write-Host "  ✅ URL Rewrite module found in IIS modules" -ForegroundColor Green
                $found = $true
            }
        } catch {
            # Final fallback
        }
    }
    
    if (-not $found) {
        Write-Host "  ❌ URL Rewrite module not found!" -ForegroundColor Red
        Write-Host "  Please download and install from:" -ForegroundColor Red
        Write-Host "  https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Red
        Write-Host "  Choose the x64 version for Windows Server 2019" -ForegroundColor Red
        exit 1
    }
}

# Helper function to check if file needs update
function Test-FileNeedsUpdate {
    param(
        [string]$SourceFile,
        [string]$TargetFile
    )
    
    if (-not (Test-Path $TargetFile)) {
        return $true
    }
    
    $sourceTime = (Get-Item $SourceFile).LastWriteTime
    $targetTime = (Get-Item $TargetFile).LastWriteTime
    
    return $sourceTime -gt $targetTime
}

# Helper function to check if npm install is needed with reliable detection
function Test-NpmInstallNeeded {
    param(
        [string]$PackageJsonPath,
        [string]$NodeModulesPath
    )
    
    # If node_modules doesn't exist, definitely need to install
    if (-not (Test-Path $NodeModulesPath)) {
        return $true
    }
    
    # If package.json doesn't exist, no need to install
    if (-not (Test-Path $PackageJsonPath)) {
        return $false
    }
    
    try {
        # Get package.json timestamp
        $packageJsonTime = (Get-Item $PackageJsonPath).LastWriteTime
        
        # Use package-lock.json timestamp if it exists and is newer than package.json
        $packageLockPath = Join-Path (Split-Path $PackageJsonPath -Parent) "package-lock.json"
        $relevantTime = $packageJsonTime
        
        if (Test-Path $packageLockPath) {
            $packageLockTime = (Get-Item $packageLockPath).LastWriteTime
            if ($packageLockTime -gt $packageJsonTime) {
                $relevantTime = $packageLockTime
            }
        }
        
        # Use a reliable marker file instead of directory timestamp
        $markerFile = Join-Path $NodeModulesPath ".npm-install-marker"
        
        if (Test-Path $markerFile) {
            $markerTime = (Get-Item $markerFile).LastWriteTime
            return $relevantTime -gt $markerTime
        } else {
            # No marker file exists, assume install is needed
            return $true
        }
    } catch {
        # If we can't read timestamps, assume install is needed
        return $true
    }
}

# Function to build the application with intelligent optimizations
function Build-Application {
    if ($SkipBuild) {
        Write-Host "⏭️  Skipping build (--SkipBuild specified)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🏗️  Building application (with optimizations)..." -ForegroundColor Yellow
    
    Push-Location $SourcePath
    
    try {
        # Check root dependencies
        Write-Host "  📦 Checking root dependencies..." -ForegroundColor Cyan
        if (Test-NpmInstallNeeded "package.json" "node_modules") {
            Write-Host "    🔄 Installing root dependencies..." -ForegroundColor Yellow
            npm install
            # Create marker file for reliable optimization
            New-Item -Path "node_modules\.npm-install-marker" -ItemType File -Force | Out-Null
        } else {
            Write-Host "    ✅ Root dependencies up to date" -ForegroundColor Green
        }
        
        # Check API dependencies
        Write-Host "  📦 Checking API dependencies..." -ForegroundColor Cyan
        Push-Location "api"
        if (Test-NpmInstallNeeded "package.json" "node_modules") {
            Write-Host "    🔄 Installing API dependencies..." -ForegroundColor Yellow
            npm install
            # Create marker file for reliable optimization
            New-Item -Path "node_modules\.npm-install-marker" -ItemType File -Force | Out-Null
        } else {
            Write-Host "    ✅ API dependencies up to date" -ForegroundColor Green
        }
        Pop-Location
        
        # Check client dependencies
        Write-Host "  📦 Checking client dependencies..." -ForegroundColor Cyan
        Push-Location "client"
        if (Test-NpmInstallNeeded "package.json" "node_modules") {
            Write-Host "    🔄 Installing client dependencies..." -ForegroundColor Yellow
            npm install
            # Create marker file for reliable optimization
            New-Item -Path "node_modules\.npm-install-marker" -ItemType File -Force | Out-Null
        } else {
            Write-Host "    ✅ Client dependencies up to date" -ForegroundColor Green
        }
        
        # Check if client build is needed using reliable method
        $buildNeeded = $false
        $distPath = "dist"
        
        # Check if dist folder exists
        if (-not (Test-Path $distPath)) {
            $buildNeeded = $true
            Write-Host "    📁 Dist folder not found, build needed" -ForegroundColor Cyan
        } else {
            # Get dist directory timestamp
            $distTime = (Get-Item $distPath).LastWriteTime
            
            # Check source files that would trigger a rebuild
            $sourcePatterns = @("src", "public", "package.json", "vite.config.js", "index.html", "package-lock.json")
            
            foreach ($srcPattern in $sourcePatterns) {
                if (Test-Path $srcPattern) {
                    if (Test-Path $srcPattern -PathType Container) {
                        # For directories, check the most recent file
                        $newestFile = Get-ChildItem $srcPattern -Recurse -File -ErrorAction SilentlyContinue | 
                            Sort-Object LastWriteTime -Descending | 
                            Select-Object -First 1
                        if ($newestFile -and $newestFile.LastWriteTime -gt $distTime) {
                            $buildNeeded = $true
                            Write-Host "    🔄 Source changes detected in $srcPattern, build needed" -ForegroundColor Cyan
                            break
                        }
                    } else {
                        # For individual files, check timestamp directly
                        $srcFile = Get-Item $srcPattern
                        if ($srcFile.LastWriteTime -gt $distTime) {
                            $buildNeeded = $true
                            Write-Host "    🔄 $srcPattern modified, build needed" -ForegroundColor Cyan
                            break
                        }
                    }
                }
            }
        }
        
        if ($buildNeeded) {
            Write-Host "    🔨 Building React client..." -ForegroundColor Yellow
            npm run build
        } else {
            Write-Host "    ✅ Client build up to date" -ForegroundColor Green
        }
        
        Pop-Location
        
        Write-Host "  ✅ Build optimization completed" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Build failed: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

# Function to create directories
function Create-Directories {
    Write-Host "📁 Creating deployment directories..." -ForegroundColor Yellow
    
    $directories = @($DeploymentPath, $ApiPath, "$DeploymentPath\logs", "$ApiPath\logs")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  ✅ Created: $dir" -ForegroundColor Green
        } else {
            Write-Host "  ✅ Exists: $dir" -ForegroundColor Green
        }
    }
}

# Helper function to copy files only if different
function Copy-FileIfDifferent {
    param(
        [string]$SourcePath,
        [string]$DestinationPath,
        [string]$Description = ""
    )
    
    $copied = $false
    
    if (Test-Path $SourcePath -PathType Container) {
        # Directory copy with optimization
        $sourceFiles = Get-ChildItem $SourcePath -Recurse -File
        foreach ($sourceFile in $sourceFiles) {
            $relativePath = $sourceFile.FullName.Substring($SourcePath.Length).TrimStart('\')
            $destFile = Join-Path $DestinationPath $relativePath
            $destDir = Split-Path $destFile -Parent
            
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            if (Test-FileNeedsUpdate $sourceFile.FullName $destFile) {
                Copy-Item $sourceFile.FullName $destFile -Force
                $copied = $true
            }
        }
    } else {
        # Single file copy
        $destDir = Split-Path $DestinationPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        if (Test-FileNeedsUpdate $SourcePath $DestinationPath) {
            Copy-Item $SourcePath $DestinationPath -Force
            $copied = $true
        }
    }
    
    return $copied
}

# Function to copy files with intelligent optimization
function Copy-Files {
    Write-Host "📋 Copying application files (with optimizations)..." -ForegroundColor Yellow
    
    # Copy built React client
    Write-Host "  📂 Checking React client files..." -ForegroundColor Cyan
    $clientBuildPath = Join-Path $SourcePath "client\dist"
    if (Test-Path $clientBuildPath) {
        $clientCopied = Copy-FileIfDifferent $clientBuildPath $DeploymentPath "React client"
        if ($clientCopied) {
            Write-Host "    🔄 React client files updated" -ForegroundColor Yellow
        } else {
            Write-Host "    ✅ React client files up to date" -ForegroundColor Green
        }
    } else {
        Write-Host "    ❌ Client build not found at: $clientBuildPath" -ForegroundColor Red
        exit 1
    }
    
    # Copy API files with optimization
    Write-Host "  📂 Checking API server files..." -ForegroundColor Cyan
    $apiSourcePath = Join-Path $SourcePath "api"
    $apiFilesCopied = $false
    
    # Copy API files excluding node_modules
    $apiFiles = @("*.js", "*.json", "src", "middleware", "routes", "services", "utils", "config")
    foreach ($pattern in $apiFiles) {
        $sourcePaths = Get-ChildItem (Join-Path $apiSourcePath $pattern) -ErrorAction SilentlyContinue
        foreach ($sourcePath in $sourcePaths) {
            $relativeName = $sourcePath.Name
            $destPath = Join-Path $ApiPath $relativeName
            
            if (Copy-FileIfDifferent $sourcePath.FullName $destPath) {
                $apiFilesCopied = $true
            }
        }
    }
    
    if ($apiFilesCopied) {
        Write-Host "    🔄 API server files updated" -ForegroundColor Yellow
    } else {
        Write-Host "    ✅ API server files up to date" -ForegroundColor Green
    }
    
    # Copy web.config files
    Write-Host "  📂 Checking configuration files..." -ForegroundColor Cyan
    $configCopied = $false
    
    $webConfigSource = "$SourcePath\deployment\windows\web.config"
    $webConfigDest = "$DeploymentPath\web.config"
    if (Copy-FileIfDifferent $webConfigSource $webConfigDest) {
        $configCopied = $true
    }
    
    $apiConfigSource = "$SourcePath\deployment\windows\api-web.config"
    $apiConfigDest = "$ApiPath\web.config"
    if (Copy-FileIfDifferent $apiConfigSource $apiConfigDest) {
        $configCopied = $true
    }
    
    if ($configCopied) {
        Write-Host "    🔄 Configuration files updated" -ForegroundColor Yellow
    } else {
        Write-Host "    ✅ Configuration files up to date" -ForegroundColor Green
    }
}

# Helper function to check if IIS configuration needs update
function Test-IISConfigurationNeeded {
    param(
        [string]$SiteName,
        [string]$Port,
        [string]$DeploymentPath,
        [string]$ApiPath
    )
    
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    
    # Check if website exists with correct configuration
    $website = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    if (-not $website) {
        return $true
    }
    
    # Check port and path
    $binding = $website.bindings.Collection[0]
    if ($binding.bindingInformation -notlike "*:$Port:*" -or $website.physicalPath -ne $DeploymentPath) {
        return $true
    }
    
    # Check API application
    $apiApp = Get-WebApplication -Site $SiteName -Name "api" -ErrorAction SilentlyContinue
    if (-not $apiApp -or $apiApp.physicalPath -ne $ApiPath) {
        return $true
    }
    
    # Check application pool using reliable method
    $apiAppPool = "$SiteName-API"
    try {
        $appPool = Get-Item "IIS:\AppPools\$apiAppPool" -ErrorAction Stop
        $runtimeVersion = Get-ItemProperty "IIS:\AppPools\$apiAppPool" -Name managedRuntimeVersion -ErrorAction Stop
        if ($runtimeVersion.managedRuntimeVersion -ne "") {
            return $true
        }
    } catch {
        # Application pool doesn't exist or can't be accessed
        return $true
    }
    
    return $false
}

# Function to configure IIS with intelligent optimizations
function Configure-IIS {
    if ($SkipIISConfig) {
        Write-Host "⏭️  Skipping IIS configuration (--SkipIISConfig specified)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🌐 Configuring IIS (with optimizations)..." -ForegroundColor Yellow
    
    Import-Module WebAdministration
    
    # Check if IIS configuration needs update
    if (-not (Test-IISConfigurationNeeded $SiteName $Port $DeploymentPath $ApiPath)) {
        Write-Host "  ✅ IIS configuration up to date" -ForegroundColor Green
        
        # Still check and update firewall rules
        Write-Host "  🔥 Verifying Windows Firewall..." -ForegroundColor Cyan
        try {
            # Check if rules exist
            $httpRule = Get-NetFirewallRule -DisplayName "RAS Dashboard HTTP" -ErrorAction SilentlyContinue
            $httpsRule = Get-NetFirewallRule -DisplayName "RAS Dashboard HTTPS" -ErrorAction SilentlyContinue
            
            if (-not $httpRule) {
                New-NetFirewallRule -DisplayName "RAS Dashboard HTTP" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
                Write-Host "    🔄 Added HTTP firewall rule" -ForegroundColor Yellow
            }
            
            if (-not $httpsRule) {
                New-NetFirewallRule -DisplayName "RAS Dashboard HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow | Out-Null
                Write-Host "    🔄 Added HTTPS firewall rule" -ForegroundColor Yellow
            }
            
            if ($httpRule -and $httpsRule) {
                Write-Host "    ✅ Firewall rules up to date" -ForegroundColor Green
            }
        } catch {
            Write-Host "    ⚠️  Firewall configuration may need manual setup" -ForegroundColor Yellow
        }
        
        return
    }
    
    Write-Host "  🔄 Updating IIS configuration..." -ForegroundColor Yellow
    
    # Remove existing site if it exists and needs update
    if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
        Write-Host "  🗑️  Removing existing site: $SiteName" -ForegroundColor Yellow
        Remove-Website -Name $SiteName
    }
    
    # Create new website (bind to all IP addresses for external access)
    Write-Host "  🌐 Creating website: $SiteName" -ForegroundColor Cyan
    New-Website -Name $SiteName -Port $Port -PhysicalPath $DeploymentPath -IPAddress "*"
    
    # Create API application
    Write-Host "  🔗 Creating API application..." -ForegroundColor Cyan
    if (Get-WebApplication -Site $SiteName -Name "api" -ErrorAction SilentlyContinue) {
        Remove-WebApplication -Site $SiteName -Name "api"
    }
    New-WebApplication -Site $SiteName -Name "api" -PhysicalPath $ApiPath
    
    # Set application pool for API (Node.js)
    Write-Host "  ⚙️  Configuring application pools..." -ForegroundColor Cyan
    $apiAppPool = "$SiteName-API"
    
    # Remove existing app pool using reliable method
    try {
        $existingPool = Get-Item "IIS:\AppPools\$apiAppPool" -ErrorAction Stop
        Remove-WebAppPool -Name $apiAppPool
        Write-Host "  🗑️  Removed existing app pool: $apiAppPool" -ForegroundColor Yellow
    } catch {
        # App pool doesn't exist, which is fine
    }
    
    New-WebAppPool -Name $apiAppPool
    Set-ItemProperty -Path "IIS:\AppPools\$apiAppPool" -Name processModel.identityType -Value ApplicationPoolIdentity
    Set-ItemProperty -Path "IIS:\AppPools\$apiAppPool" -Name managedRuntimeVersion -Value ""
    Set-WebApplication -Site $SiteName -Name "api" -ApplicationPool $apiAppPool
    
    # Configure Windows Firewall for external access
    Write-Host "  🔥 Configuring Windows Firewall..." -ForegroundColor Cyan
    try {
        # Allow HTTP traffic
        New-NetFirewallRule -DisplayName "RAS Dashboard HTTP" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -ErrorAction SilentlyContinue
        
        # Allow HTTPS traffic (for future SSL setup)
        New-NetFirewallRule -DisplayName "RAS Dashboard HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
        
        Write-Host "    ✅ Firewall rules added for external access" -ForegroundColor Green
    } catch {
        Write-Host "    ⚠️  Firewall configuration may need manual setup" -ForegroundColor Yellow
    }
    
    Write-Host "  ✅ IIS configuration completed" -ForegroundColor Green
}

# Function to install API dependencies on server with optimization
function Install-APIDependencies {
    Write-Host "📦 Checking API dependencies on server..." -ForegroundColor Yellow
    
    Push-Location $ApiPath
    try {
        # Check if npm install is needed on the server
        if (Test-NpmInstallNeeded "package.json" "node_modules") {
            Write-Host "  🔄 Installing production dependencies..." -ForegroundColor Yellow
            npm install --production
            # Create marker file for reliable optimization
            New-Item -Path "node_modules\.npm-install-marker" -ItemType File -Force | Out-Null
            Write-Host "  ✅ API dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  ✅ API dependencies up to date" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ Failed to install API dependencies: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

# Function to start services
function Start-Services {
    Write-Host "🚀 Starting services..." -ForegroundColor Yellow
    
    # Start website
    Start-Website -Name $SiteName
    
    # Start application pool
    $apiAppPool = "$SiteName-API"
    Start-WebAppPool -Name $apiAppPool
    
    Write-Host "  ✅ Services started" -ForegroundColor Green
}

# Function to test deployment
function Test-Deployment {
    Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
    
    $testUrls = @(
        "http://localhost:$Port",
        "http://localhost:$Port/api/health"
    )
    
    foreach ($url in $testUrls) {
        try {
            Write-Host "  🔍 Testing: $url" -ForegroundColor Cyan
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "    ✅ Success ($($response.StatusCode))" -ForegroundColor Green
            } else {
                Write-Host "    ⚠️  Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "    ❌ Failed: $_" -ForegroundColor Red
        }
    }
}

# Main execution
try {
    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Running as Administrator" -ForegroundColor Green
    Write-Host ""
    
    # Display configuration
    Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
    Write-Host "  Site Name: $SiteName" -ForegroundColor White
    Write-Host "  Port: $Port" -ForegroundColor White
    Write-Host "  Frontend Path: $DeploymentPath" -ForegroundColor White
    Write-Host "  API Path: $ApiPath" -ForegroundColor White
    Write-Host "  Source Path: $SourcePath" -ForegroundColor White
    Write-Host ""
    
    # Execute deployment steps
    Install-IISFeatures
    Install-NodeJS
    Install-IISNode
    Install-URLRewrite
    Build-Application
    Create-Directories
    Copy-Files
    Install-APIDependencies
    Configure-IIS
    Start-Services
    Test-Deployment
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "   🎉 Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Access your application:" -ForegroundColor Cyan
    Write-Host "  🌐 Frontend: http://localhost:$Port" -ForegroundColor White
    Write-Host "  🔧 API: http://localhost:$Port/api" -ForegroundColor White
    Write-Host "  🏥 Health Check: http://localhost:$Port/api/health" -ForegroundColor White
    Write-Host "  📚 API Docs: http://localhost:$Port/api-docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 External access (if AWS Security Group configured):" -ForegroundColor Cyan
    Write-Host "  Replace 'localhost' with your server's public IP address" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host "Check the error details above and try again." -ForegroundColor Red
    exit 1
}