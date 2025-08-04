# Simple Setup Script for Daily S3 Backup
# Run as Administrator

param(
    [string]$BucketName = "ras-dashboard-daily-backup",
    [string]$BackupTime = "02:00"
)

Write-Host "Setting up daily backup task..." -ForegroundColor Green

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator."
    exit 1
}

# Create S3 bucket
Write-Host "Creating S3 bucket: $BucketName" -ForegroundColor Yellow
aws s3 mb "s3://$BucketName"
Write-Host "S3 bucket ready" -ForegroundColor Green

# Create logs directory
$logsDir = "C:\RAS_DASH_CSaaS\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    Write-Host "Created logs directory" -ForegroundColor Green
}

# Remove existing task if it exists
$taskName = "RAS Dashboard Daily S3 Backup"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task" -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task
Write-Host "Creating scheduled task" -ForegroundColor Yellow

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"C:\RAS_DASH_CSaaS\scripts\daily-backup-to-s3.ps1`" -BucketName `"$BucketName`""

$trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Daily automated backup of RAS Dashboard code to S3"

Write-Host "Scheduled task created successfully!" -ForegroundColor Green
Write-Host "Task will run daily at $BackupTime" -ForegroundColor Cyan
Write-Host "Backups will be stored in: s3://$BucketName" -ForegroundColor Cyan

# Test backup option
$testNow = Read-Host "Would you like to test the backup now? (y/n)"
if ($testNow -eq 'y' -or $testNow -eq 'Y') {
    Write-Host "Running test backup..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName
    Write-Host "Test backup started. Check logs for results." -ForegroundColor Green
}

Write-Host "Daily backup setup completed!" -ForegroundColor Green
