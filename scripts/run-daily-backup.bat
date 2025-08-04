@echo off
REM RAS Dashboard Daily Backup Runner
REM This batch file is used by Windows Task Scheduler

cd /d "C:\RAS_DASH_CSaaS"

REM Run the PowerShell backup script
powershell.exe -ExecutionPolicy Bypass -File "C:\RAS_DASH_CSaaS\scripts\daily-backup-to-s3.ps1" -BucketName "ras-dashboard-daily-backup"

REM Log the exit code
echo Backup completed with exit code: %ERRORLEVEL% >> "C:\RAS_DASH_CSaaS\logs\backup-runner.log"
