# Setup Windows Task Scheduler for Daily S3 Backup
# Run this script as Administrator to create the scheduled task

param(
    [string]$TaskName = "RAS Dashboard Daily S3 Backup",
    [string]$BackupTime = "02:00",  # 2:00 AM daily
    [string]$BucketName = "ras-dashboard-daily-backup"
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Please run PowerShell as Administrator and try again."
    exit 1
}

Write-Host "Setting up daily backup task..." -ForegroundColor Green

try {
    # Create S3 bucket first
    Write-Host "📦 Creating S3 bucket: $BucketName" -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ S3 bucket created successfully" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  S3 bucket may already exist (this is okay)" -ForegroundColor Cyan
    }

    # Create logs directory
    $logsDir = "C:\RAS_DASH_CSaaS\logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
        Write-Host "📁 Created logs directory: $logsDir" -ForegroundColor Green
    }

    # Remove existing task if it exists
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "🗑️  Removing existing task: $TaskName" -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    # Create the scheduled task
    Write-Host "⏰ Creating scheduled task: $TaskName" -ForegroundColor Yellow
    
    # Task action
    $action = New-ScheduledTaskAction -Execute "C:\RAS_DASH_CSaaS\scripts\run-daily-backup.bat"
    
    # Task trigger (daily at specified time)
    $trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime
    
    # Task settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    
    # Task principal (run as SYSTEM)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Daily automated backup of RAS Dashboard code to S3"
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "📅 Task will run daily at $BackupTime" -ForegroundColor Cyan
    Write-Host "🪣 Backups will be stored in: s3://$BucketName" -ForegroundColor Cyan
    Write-Host "📝 Logs will be stored in: C:\RAS_DASH_CSaaS\logs\" -ForegroundColor Cyan
    
    # Test the backup immediately (optional)
    $testNow = Read-Host "Would you like to test the backup now? (y/n)"
    if ($testNow -eq 'y' -or $testNow -eq 'Y') {
        Write-Host "🧪 Running test backup..." -ForegroundColor Yellow
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "✅ Test backup started. Check logs for results." -ForegroundColor Green
    }
    
    Write-Host "`n📋 Task Management Commands:" -ForegroundColor Cyan
    Write-Host "   View task: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Run now:   Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Disable:   Disable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Remove:    Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    
} catch {
    Write-Error "❌ Failed to setup scheduled task: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n🎉 Daily backup setup completed!" -ForegroundColor Green
