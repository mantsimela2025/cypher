# Manual Backup Script - Run this anytime to backup immediately
# Usage: .\backup-now.ps1 [-BucketName "your-bucket-name"]

param(
    [string]$BucketName = "ras-dashboard-manual-backup"
)

Write-Host "🚀 Starting immediate backup to S3..." -ForegroundColor Green
Write-Host "🪣 Bucket: $BucketName" -ForegroundColor Cyan

# Create bucket if it doesn't exist
aws s3 mb "s3://$BucketName" 2>$null

# Create timestamp for this backup
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupPath = "manual-backup-$timestamp"

Write-Host "📁 Backup path: $backupPath" -ForegroundColor Cyan
Write-Host "📤 Uploading files..." -ForegroundColor Yellow

# Sync the files
aws s3 sync . "s3://$BucketName/$backupPath/" `
    --exclude "node_modules/*" `
    --exclude "*/node_modules/*" `
    --exclude ".git/*" `
    --exclude "*.log" `
    --exclude ".env*" `
    --exclude "dist/*" `
    --exclude "build/*" `
    --exclude "logs/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Manual backup completed successfully!" -ForegroundColor Green
    Write-Host "🔗 S3 Location: s3://$BucketName/$backupPath/" -ForegroundColor Green
    
    # Show backup info
    Write-Host "`n📊 Backup Information:" -ForegroundColor Cyan
    aws s3 ls "s3://$BucketName/$backupPath/" --recursive --human-readable --summarize
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
}
