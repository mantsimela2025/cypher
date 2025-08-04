# RAS Dashboard Daily Automated S3 Backup Script
# This script runs daily to backup the entire project to S3

param(
    [string]$BucketName = "ras-dashboard-daily-backup",
    [string]$ProjectPath = "C:\RAS_DASH_CSaaS",
    [int]$RetentionDays = 30,
    [string]$LogPath = "C:\RAS_DASH_CSaaS\logs\backup.log"
)

# Ensure log directory exists
$logDir = Split-Path $LogPath -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Function to write log with timestamp
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogPath -Value $logMessage
}

# Function to check if AWS CLI is available
function Test-AwsCli {
    try {
        aws --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to create S3 bucket if it doesn't exist
function Ensure-S3Bucket {
    param([string]$Bucket)
    
    try {
        $bucketExists = aws s3 ls "s3://$Bucket" 2>$null
        if (-not $bucketExists) {
            Write-Log "Creating S3 bucket: $Bucket"
            aws s3 mb "s3://$Bucket"
            if ($LASTEXITCODE -eq 0) {
                Write-Log "S3 bucket created successfully: $Bucket"
            } else {
                throw "Failed to create S3 bucket"
            }
        } else {
            Write-Log "S3 bucket already exists: $Bucket"
        }
    } catch {
        Write-Log "Error with S3 bucket: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Function to clean up old backups
function Remove-OldBackups {
    param([string]$Bucket, [int]$Days)
    
    try {
        Write-Log "Cleaning up backups older than $Days days..."
        $cutoffDate = (Get-Date).AddDays(-$Days)
        
        # List all backup folders
        $backups = aws s3 ls "s3://$Bucket/" | Where-Object { $_ -match "daily-backup-(\d{4}-\d{2}-\d{2})" }
        
        foreach ($backup in $backups) {
            if ($backup -match "daily-backup-(\d{4}-\d{2}-\d{2})") {
                $backupDate = [DateTime]::ParseExact($matches[1], "yyyy-MM-dd", $null)
                if ($backupDate -lt $cutoffDate) {
                    $backupFolder = $matches[0]
                    Write-Log "Removing old backup: $backupFolder"
                    aws s3 rm "s3://$Bucket/$backupFolder/" --recursive
                }
            }
        }
    } catch {
        Write-Log "Error cleaning up old backups: $($_.Exception.Message)" "WARNING"
    }
}

# Main backup function
function Start-Backup {
    try {
        Write-Log "=== Starting Daily Backup Process ==="
        Write-Log "Project Path: $ProjectPath"
        Write-Log "S3 Bucket: $BucketName"
        
        # Check prerequisites
        if (-not (Test-AwsCli)) {
            throw "AWS CLI is not installed or not in PATH"
        }
        
        if (-not (Test-Path $ProjectPath)) {
            throw "Project path does not exist: $ProjectPath"
        }
        
        # Ensure S3 bucket exists
        Ensure-S3Bucket -Bucket $BucketName
        
        # Create backup folder with date
        $backupDate = Get-Date -Format "yyyy-MM-dd"
        $backupPath = "daily-backup-$backupDate"
        
        Write-Log "Creating backup: $backupPath"
        
        # Define exclusions
        $excludeParams = @(
            "--exclude", "node_modules/*",
            "--exclude", "*/node_modules/*",
            "--exclude", ".git/*",
            "--exclude", "*.log",
            "--exclude", "*.tmp",
            "--exclude", ".env",
            "--exclude", ".env.local",
            "--exclude", ".env.production",
            "--exclude", "dist/*",
            "--exclude", "build/*",
            "--exclude", "coverage/*",
            "--exclude", ".nyc_output/*",
            "--exclude", "logs/*"
        )
        
        # Perform the sync
        Write-Log "Syncing files to S3..."
        $syncArgs = @(
            "s3", "sync",
            $ProjectPath,
            "s3://$BucketName/$backupPath/"
        ) + $excludeParams
        
        & aws @syncArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Backup completed successfully!"
            
            # Create backup manifest
            $manifest = @{
                timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                backupDate = $backupDate
                source = $ProjectPath
                destination = "s3://$BucketName/$backupPath/"
                excludedPatterns = $excludeParams | Where-Object { $_ -ne "--exclude" }
                fileCount = (Get-ChildItem -Path $ProjectPath -Recurse -File | Measure-Object).Count
                totalSize = [math]::Round((Get-ChildItem -Path $ProjectPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            }
            
            $manifestJson = $manifest | ConvertTo-Json -Depth 3
            $manifestFile = "backup-manifest-$backupDate.json"
            $manifestJson | Out-File -FilePath $manifestFile -Encoding UTF8
            
            # Upload manifest
            aws s3 cp $manifestFile "s3://$BucketName/$backupPath/backup-manifest.json"
            Remove-Item $manifestFile -Force
            
            Write-Log "📋 Backup manifest created"
            Write-Log "📊 Files backed up: $($manifest.fileCount)"
            Write-Log "📊 Total size: $($manifest.totalSize) MB"
            
            # Clean up old backups
            Remove-OldBackups -Bucket $BucketName -Days $RetentionDays
            
            Write-Log "=== Backup Process Completed Successfully ==="
            
        } else {
            throw "AWS S3 sync failed with exit code $LASTEXITCODE"
        }
        
    } catch {
        Write-Log "❌ Backup failed: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Execute backup
try {
    Start-Backup
    exit 0
} catch {
    Write-Log "❌ Fatal error during backup: $($_.Exception.Message)" "ERROR"
    exit 1
}
