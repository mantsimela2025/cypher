# Windows Server Configuration Check Script
# Run this script via RDP on your Windows Server to diagnose Route 53 connectivity issues

Write-Host "=== Windows Server Route 53 Connectivity Check ===" -ForegroundColor Green
Write-Host "Checking all configurations for external access..." -ForegroundColor Yellow
Write-Host ""

# 1. Check Windows Firewall Status
Write-Host "1. Windows Firewall Configuration:" -ForegroundColor Cyan
$firewallProfiles = Get-NetFirewallProfile
foreach ($profile in $firewallProfiles) {
    Write-Host "   Profile: $($profile.Name) - State: $($profile.Enabled)" -ForegroundColor White
}

# 2. Check Firewall Rules for HTTP/HTTPS
Write-Host "`n2. HTTP/HTTPS Firewall Rules:" -ForegroundColor Cyan
$httpRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*HTTP*" -or $_.DisplayName -like "*HTTPS*" -or $_.DisplayName -like "*80*" -or $_.DisplayName -like "*443*" }
if ($httpRules) {
    foreach ($rule in $httpRules) {
        Write-Host "   Rule: $($rule.DisplayName) - Enabled: $($rule.Enabled) - Direction: $($rule.Direction)" -ForegroundColor White
    }
} else {
    Write-Host "   No HTTP/HTTPS firewall rules found!" -ForegroundColor Red
}

# 3. Check IIS Sites and Bindings
Write-Host "`n3. IIS Configuration:" -ForegroundColor Cyan
try {
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    $sites = Get-IISSite
    foreach ($site in $sites) {
        Write-Host "   Site: $($site.Name) - State: $($site.State)" -ForegroundColor White
        $bindings = Get-WebBinding -Name $site.Name
        foreach ($binding in $bindings) {
            Write-Host "   Binding: $($binding.protocol)://$($binding.bindingInformation)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   IIS not installed or WebAdministration module not available" -ForegroundColor Yellow
}

# 4. Check Port Bindings
Write-Host "`n4. Port Binding Check:" -ForegroundColor Cyan
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
$port443 = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue

if ($port80) {
    Write-Host "   Port 80: LISTENING - Process: $($port80.OwningProcess)" -ForegroundColor Green
} else {
    Write-Host "   Port 80: NOT LISTENING" -ForegroundColor Red
}

if ($port443) {
    Write-Host "   Port 443: LISTENING - Process: $($port443.OwningProcess)" -ForegroundColor Green
} else {
    Write-Host "   Port 443: NOT LISTENING" -ForegroundColor Red
}

# 5. Check Network Configuration
Write-Host "`n5. Network Configuration:" -ForegroundColor Cyan
$ipConfig = Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.IPAddress -ne "127.0.0.1" }
foreach ($ip in $ipConfig) {
    Write-Host "   IP Address: $($ip.IPAddress) - Interface: $($ip.InterfaceAlias)" -ForegroundColor White
}

# 6. Check Windows Defender Firewall Service
Write-Host "`n6. Windows Defender Firewall Service:" -ForegroundColor Cyan
$firewallService = Get-Service -Name "MpsSvc"
Write-Host "   Service: $($firewallService.Name) - Status: $($firewallService.Status) - StartType: $($firewallService.StartType)" -ForegroundColor White

# 7. Check for Application Binding
Write-Host "`n7. Application Binding Check:" -ForegroundColor Cyan
$processes = Get-Process | Where-Object { $_.ProcessName -like "*iis*" -or $_.ProcessName -like "*w3wp*" -or $_.ProcessName -like "*node*" -or $_.ProcessName -like "*nginx*" }
if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "   Process: $($proc.ProcessName) - PID: $($proc.Id) - Status: $($proc.Responding)" -ForegroundColor Green
    }
} else {
    Write-Host "   No web server processes found running" -ForegroundColor Yellow
}

# 8. Quick Connectivity Test
Write-Host "`n8. Local Connectivity Test:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Local HTTP: SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Local HTTP: FAILED - Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "https://localhost" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Local HTTPS: SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Local HTTPS: FAILED - Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Fix Commands (if needed)
Write-Host "`n9. Quick Fix Commands:" -ForegroundColor Cyan
Write-Host "   To add Windows Firewall rules, run these commands as Administrator:" -ForegroundColor Yellow
Write-Host "   New-NetFirewallRule -DisplayName 'Allow HTTP' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow" -ForegroundColor White
Write-Host "   New-NetFirewallRule -DisplayName 'Allow HTTPS' -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow" -ForegroundColor White

Write-Host "`n=== Check Complete ===" -ForegroundColor Green
Write-Host "Review the results above to identify any configuration issues." -ForegroundColor Yellow
