# Configure HTTPS for Windows Server - PowerShell Script
# Run this script via RDP to add HTTPS binding and SSL certificate

Write-Host "=== Configuring HTTPS for Windows Server ===" -ForegroundColor Green
Write-Host "Adding SSL certificate and HTTPS binding..." -ForegroundColor Yellow
Write-Host ""

# 1. Check if HTTPS binding already exists
Write-Host "1. Checking existing HTTPS bindings..." -ForegroundColor Cyan
try {
    Import-Module WebAdministration
    $bindings = Get-WebBinding -Name "Default Web Site"
    $httpsBinding = $bindings | Where-Object { $_.protocol -eq "https" }
    
    if ($httpsBinding) {
        Write-Host "   HTTPS binding already exists" -ForegroundColor Green
        Write-Host "   Binding: $($httpsBinding.bindingInformation)" -ForegroundColor White
    } else {
        Write-Host "   HTTPS binding not found - will create" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error checking bindings: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Create self-signed SSL certificate (for testing)
Write-Host "`n2. Creating SSL certificate..." -ForegroundColor Cyan
try {
    $certName = "rasdash.dev.com"
    $cert = Get-ChildItem Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*$certName*" }
    
    if (-not $cert) {
        Write-Host "   Creating self-signed certificate..." -ForegroundColor Yellow
        $cert = New-SelfSignedCertificate -DnsName $certName -CertStoreLocation "cert:\LocalMachine\My"
        Write-Host "   Certificate created successfully" -ForegroundColor Green
        Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
    } else {
        Write-Host "   Certificate already exists" -ForegroundColor Green
        Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
    }
} catch {
    Write-Host "   Error creating certificate: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Add HTTPS binding
Write-Host "`n3. Adding HTTPS binding..." -ForegroundColor Cyan
try {
    if (-not $httpsBinding) {
        New-WebBinding -Name "Default Web Site" -Protocol "https" -Port 443 -IPAddress "*" -SslFlags 1
        Write-Host "   HTTPS binding added successfully" -ForegroundColor Green
        
        # Assign certificate to binding
        $binding = Get-WebBinding -Name "Default Web Site" -Protocol "https"
        if ($binding) {
            $binding.AddSslCertificate($cert.Thumbprint, "my")
            Write-Host "   SSL certificate assigned to binding" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   Error adding HTTPS binding: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Configure SSL settings
Write-Host "`n4. Configuring SSL settings..." -ForegroundColor Cyan
try {
    # Enable SSL for the site
    Set-WebConfigurationProperty -Filter "/system.webServer/security/access" -Name "sslFlags" -Value "Ssl" -Location "Default Web Site"
    Write-Host "   SSL settings configured" -ForegroundColor Green
} catch {
    Write-Host "   Error configuring SSL settings: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test HTTPS connectivity
Write-Host "`n5. Testing HTTPS connectivity..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "https://localhost" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
    if ($response.StatusCode -eq 200) {
        Write-Host "   SUCCESS: HTTPS test passed - Status: $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: HTTPS test returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERROR: HTTPS test failed - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Configure HTTP to HTTPS redirect (optional)
Write-Host "`n6. Configuring HTTP to HTTPS redirect..." -ForegroundColor Cyan
try {
    # Check if redirect rule exists
    $redirectRule = Get-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']" -Name "name" -Location "Default Web Site" -ErrorAction SilentlyContinue
    
    if (-not $redirectRule) {
        # Add redirect rule
        Add-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules" -Name "." -Value @{
            name = "HTTP to HTTPS Redirect"
            stopProcessing = "true"
        } -Location "Default Web Site"
        
        Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']/match" -Name "url" -Value "(.*)" -Location "Default Web Site"
        
        Add-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']/conditions" -Name "." -Value @{
            input = "{HTTPS}"
            pattern = "off"
        } -Location "Default Web Site"
        
        Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']/action" -Name "type" -Value "Redirect" -Location "Default Web Site"
        Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']/action" -Name "url" -Value "https://{HTTP_HOST}/{R:1}" -Location "Default Web Site"
        Set-WebConfigurationProperty -Filter "/system.webServer/rewrite/rules/rule[@name='HTTP to HTTPS Redirect']/action" -Name "redirectType" -Value "Permanent" -Location "Default Web Site"
        
        Write-Host "   HTTP to HTTPS redirect configured" -ForegroundColor Green
    } else {
        Write-Host "   Redirect rule already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "   Error configuring redirect: $($_.Exception.Message)" -ForegroundColor Red
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

Write-Host "`n=== HTTPS Configuration Complete ===" -ForegroundColor Green
Write-Host "HTTPS is now configured. Test with: https://localhost" -ForegroundColor Yellow
Write-Host "For production, replace the self-signed certificate with a proper SSL certificate" -ForegroundColor Yellow
