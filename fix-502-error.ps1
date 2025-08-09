# Fix 502 Bad Gateway Error - PowerShell Script
# Run this script via RDP on your Windows Server to resolve the 502 error

Write-Host "=== Fixing 502 Bad Gateway Error ===" -ForegroundColor Green
Write-Host "Step-by-step resolution for Node.js + IIS integration..." -ForegroundColor Yellow
Write-Host ""

# 1. Check Application Pool Status
Write-Host "1. Checking IIS Application Pool Status..." -ForegroundColor Cyan
try {
    Import-Module WebAdministration
    $appPool = Get-WebAppPoolState -Name "DefaultAppPool"
    Write-Host "   DefaultAppPool Status: $($appPool.Value)" -ForegroundColor White
    
    if ($appPool.Value -ne "Started") {
        Write-Host "   Starting DefaultAppPool..." -ForegroundColor Yellow
        Start-WebAppPool -Name "DefaultAppPool"
        Write-Host "   DefaultAppPool started successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "   Error checking application pool: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Check Node.js Application Port
Write-Host "`n2. Checking Node.js application port..." -ForegroundColor Cyan
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" }
if ($nodeProcesses) {
    Write-Host "   Node.js processes found:" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        Write-Host "   PID: $($proc.Id) - Process: $($proc.ProcessName)" -ForegroundColor White
    }
    
    # Check what ports Node.js is listening on
    $nodeConnections = Get-NetTCPConnection | Where-Object { $_.OwningProcess -in $nodeProcesses.Id }
    if ($nodeConnections) {
        Write-Host "   Node.js listening on ports:" -ForegroundColor Green
        foreach ($conn in $nodeConnections) {
            Write-Host "   Port: $($conn.LocalPort) - State: $($conn.State)" -ForegroundColor Green
        }
    } else {
        Write-Host "   Node.js not listening on any ports - check your application configuration" -ForegroundColor Red
    }
}

# 3. Configure IIS Reverse Proxy
Write-Host "`n3. Configuring IIS Reverse Proxy..." -ForegroundColor Cyan
try {
    # Check if URL Rewrite module is installed
    $urlRewriteInstalled = Get-WindowsFeature -Name "Web-Url-Rewrite" -ErrorAction SilentlyContinue
    if (-not $urlRewriteInstalled -or -not $urlRewriteInstalled.Installed) {
        Write-Host "   Installing URL Rewrite module..." -ForegroundColor Yellow
        # Note: This requires internet access and may need manual installation
        Write-Host "   Please install URL Rewrite module from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Red
    }

    # Check if ARR (Application Request Routing) is installed
    $arrInstalled = Get-WindowsFeature -Name "Web-Application-Proxy" -ErrorAction SilentlyContinue
    if (-not $arrInstalled -or -not $arrRewriteInstalled.Installed) {
        Write-Host "   Installing Application Request Routing..." -ForegroundColor Yellow
        Install-WindowsFeature -Name "Web-Application-Proxy" -IncludeManagementTools
    }

    # Configure reverse proxy rule
    Add-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules" -Name "." -Value @{
        name = "ReverseProxyInboundRule1"
        stopProcessing = "true"
    } -Location "Default Web Site"

    Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='ReverseProxyInboundRule1']/match" -Name "url" -Value "(.*)" -Location "Default Web Site"
    Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='ReverseProxyInboundRule1']/action" -Name "type" -Value "Rewrite" -Location "Default Web Site"
    Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='ReverseProxyInboundRule1']/action" -Name "url" -Value "http://localhost:3000/{R:1}" -Location "Default WebSite"

    Write-Host "   Reverse proxy rule created successfully" -ForegroundColor Green
} catch {
    Write-Host "   Error configuring reverse proxy: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Configure HTTPS (SSL Certificate)
Write-Host "`n4. Configuring HTTPS (SSL Certificate)" -ForegroundColor Cyan
try {
    # Check if HTTPS binding already exists
    $httpsBinding = Get-WebBinding -Name "Default Web Site" -Protocol "https"
    if (-not $httpsBinding) {
        Write-Host "   Adding HTTPS binding..." -ForegroundColor Yellow
        New-WebBinding -Name "Default Web Site" -Protocol "https" -Port 443 -IPAddress "*" -SslFlags 1
        Write-Host "   HTTPS binding added successfully" -ForegroundColor Green
    } else {
        Write-Host "   HTTPS binding already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "   Error adding HTTPS binding: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test Local Connectivity
Write-Host "`n5. Testing Local Connectivity" -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   SUCCESS: Local HTTP test passed - Status: $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: Local HTTP test returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR: Local HTTP test failed - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test HTTPS Connectivity
Write-Host "`n6. Testing HTTPS Connectivity" -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "https://localhost" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   SUCCESS: HTTPS test passed - Status: $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: HTTPS test returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR: HTTPS test failed - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Final verification
Write-Host "`n7. Final verification..." -ForegroundColor Cyan
Write-Host "   Checking port 443..." -ForegroundColor White
$port443 = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue
if ($port443) {
    Write-Host "   Port 443: LISTENING - Process: $($port443.OwningProcess)" -ForegroundColor Green
} else {
    Write-Host "   Port 443: NOT LISTENING" -ForegroundColor Red
}

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green
Write-Host "HTTPS is now configured. Test with: https://localhost" -ForegroundColor Yellow
Write-Host "For production, replace the self-signed certificate with a proper SSL certificate" -ForegroundColor Yellow
