# RAS Dashboard S3 Backup Script
# Usage: .\backup-to-s3.ps1 -BucketName "your-bucket-name"

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [string]$ProjectPath = "C:\RAS_DASH_CSaaS",
    [string]$BackupPrefix = "ras-dash-backup",
    [switch]$IncludeNodeModules = $false
)

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

# Create timestamp for backup
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupPath = "$BackupPrefix-$timestamp"

Write-Host "🚀 Starting backup to S3..." -ForegroundColor Green
Write-Host "📁 Source: $ProjectPath" -ForegroundColor Cyan
Write-Host "🪣 Bucket: s3://$BucketName/$backupPath/" -ForegroundColor Cyan

# Create exclusion list
$excludeParams = @()
if (-not $IncludeNodeModules) {
    $excludeParams += "--exclude", "node_modules/*"
    $excludeParams += "--exclude", "*/node_modules/*"
}

$excludeParams += "--exclude", ".git/*"
$excludeParams += "--exclude", "*.log"
$excludeParams += "--exclude", "*.tmp"
$excludeParams += "--exclude", ".env"
$excludeParams += "--exclude", ".env.local"
$excludeParams += "--exclude", "dist/*"
$excludeParams += "--exclude", "build/*"

# Perform the sync
try {
    Write-Host "📤 Uploading files..." -ForegroundColor Yellow
    
    $syncArgs = @(
        "s3", "sync", 
        $ProjectPath, 
        "s3://$BucketName/$backupPath/"
    ) + $excludeParams
    
    & aws @syncArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        Write-Host "🔗 S3 Location: s3://$BucketName/$backupPath/" -ForegroundColor Green
        
        # Create a backup manifest
        $manifest = @{
            timestamp = $timestamp
            source = $ProjectPath
            destination = "s3://$BucketName/$backupPath/"
            excludedNodeModules = (-not $IncludeNodeModules)
        } | ConvertTo-Json -Depth 2
        
        $manifest | Out-File -FilePath "backup-manifest-$timestamp.json" -Encoding UTF8
        aws s3 cp "backup-manifest-$timestamp.json" "s3://$BucketName/$backupPath/backup-manifest.json"
        Remove-Item "backup-manifest-$timestamp.json"
        
        Write-Host "📋 Backup manifest created" -ForegroundColor Green
    } else {
        Write-Error "❌ Backup failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "❌ Error during backup: $($_.Exception.Message)"
}

Write-Host "🏁 Backup process completed" -ForegroundColor Blue
