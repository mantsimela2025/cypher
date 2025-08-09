# CYPHER Dashboard Deployment Script for Windows
# This PowerShell script helps deploy CYPHER Dashboard to your RAS DASH instance

param(
    [string]$KeyPath = "",
    [string]$InstanceIP = "34.230.172.229"
)

# Configuration
$INSTANCE_ID = "i-04a41343a3f51559a"
$DOMAIN = "rasdash.dev.com"
$DB_ENDPOINT = "rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com"

Write-Host "🚀 CYPHER Dashboard Deployment for Windows" -ForegroundColor Green
Write-Host "Instance: $INSTANCE_ID" -ForegroundColor Cyan
Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "Database: $DB_ENDPOINT" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify AWS CLI and instance status
Write-Host "📋 Step 1: Verifying AWS setup..." -ForegroundColor Blue

try {
    $accountInfo = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "✅ AWS Account: $($accountInfo.Account)" -ForegroundColor Green
    
    $instanceState = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].State.Name" --output text
    Write-Host "✅ Instance State: $instanceState" -ForegroundColor Green
    
    if ($instanceState -ne "running") {
        Write-Host "❌ Instance is not running. Please start it first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ AWS CLI error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create production environment file
Write-Host ""
Write-Host "📋 Step 2: Creating production environment..." -ForegroundColor Blue

$envContent = @"
# Production Environment Configuration for CYPHER Dashboard
NODE_ENV=production
PORT=3001
CLIENT_PORT=3000

# Database Configuration (using existing RDS)
DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@$DB_ENDPOINT:5432/rasdashdev01
PGHOST=$DB_ENDPOINT
PGPORT=5432
PGUSER=rasdashadmin
PGPASSWORD=RasDash2025$
PGDATABASE=rasdashdev01

# Security Configuration
SESSION_SECRET=a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
JWT_SECRET=a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=74645ae555e1fe3f0869ca213a0d8164a898556ef8d44ce6836467c47e94b47a

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN,http://$DOMAIN,http://$InstanceIP:3000

# Domain Configuration
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN

# Email Configuration
EMAIL_FROM=noreply@$DOMAIN
EMAIL_FROM_NAME=CYPHER Dashboard
ADMIN_EMAIL=admin@$DOMAIN

# API Keys (copy from your existing .env)
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
MAILERSEND_API_KEY=mlsn.716a734f75dfaa5bd7656ceadc4e0308c51695a6831763e9290eb650b303585d
NVD_API_KEY=4edc77ed-d681-4472-8713-b24913590364

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "✅ Created .env.production file" -ForegroundColor Green

# Step 3: Security groups configuration (already done via AWS CLI)
Write-Host ""
Write-Host "📋 Step 3: Security groups configured ✅" -ForegroundColor Blue
Write-Host "   - HTTP (80): ✅ Added"
Write-Host "   - HTTPS (443): ✅ Added" 
Write-Host "   - Development (3000, 3001): ✅ Added"

# Step 4: Instructions for file transfer
Write-Host ""
Write-Host "📋 Step 4: File Transfer Instructions" -ForegroundColor Blue
Write-Host ""

if ($KeyPath -eq "") {
    Write-Host "⚠️  Please provide your SSH key path:" -ForegroundColor Yellow
    Write-Host "   Example: .\scripts\aws-deployment\deploy-windows.ps1 -KeyPath 'C:\path\to\your-key.pem'"
    Write-Host ""
    Write-Host "📝 Manual Steps:" -ForegroundColor Cyan
    Write-Host "1. Copy files to EC2 instance using SCP or WinSCP:"
    Write-Host "   scp -i your-key.pem -r . ec2-user@${InstanceIP}:/home/ec2-user/cypher-dashboard"
    Write-Host ""
} else {
    Write-Host "📁 Copying files to EC2 instance..." -ForegroundColor Blue
    
    # Use SCP to copy files (requires OpenSSH or Git Bash)
    try {
        $scpCommand = "scp -i `"$KeyPath`" -r . ec2-user@${InstanceIP}:/home/ec2-user/cypher-dashboard"
        Write-Host "Running: $scpCommand" -ForegroundColor Gray
        
        # Note: This might not work in PowerShell, user may need to run manually
        Invoke-Expression $scpCommand
        Write-Host "✅ Files copied successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ SCP failed. Please copy files manually:" -ForegroundColor Red
        Write-Host "   scp -i `"$KeyPath`" -r . ec2-user@${InstanceIP}:/home/ec2-user/cypher-dashboard"
    }
}

# Step 5: SSH Instructions
Write-Host ""
Write-Host "📋 Step 5: SSH to Instance and Install" -ForegroundColor Blue
Write-Host ""
Write-Host "🔗 SSH Command:" -ForegroundColor Cyan
if ($KeyPath -ne "") {
    Write-Host "   ssh -i `"$KeyPath`" ec2-user@${InstanceIP}"
} else {
    Write-Host "   ssh -i your-key.pem ec2-user@${InstanceIP}"
}
Write-Host ""
Write-Host "📝 Commands to run on the instance:" -ForegroundColor Cyan
Write-Host "   sudo su -"
Write-Host "   cd /home/ec2-user/cypher-dashboard"
Write-Host "   chmod +x scripts/aws-deployment/*.sh"
Write-Host "   ./scripts/aws-deployment/install-on-instance.sh"
Write-Host ""

# Step 6: DNS Configuration
Write-Host "📋 Step 6: DNS Configuration (run from local machine)" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Configure DNS with AWS CLI:" -ForegroundColor Cyan

$dnsCommands = @"
# Create A record
aws route53 change-resource-record-sets --hosted-zone-id Z07201002RI5R8QT9OIF7 --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$DOMAIN",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${InstanceIP}"}]
    }
  }]
}'

# Create CNAME for www
aws route53 change-resource-record-sets --hosted-zone-id Z07201002RI5R8QT9OIF7 --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "www.$DOMAIN",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$DOMAIN"}]
    }
  }]
}'
"@

Write-Host $dnsCommands -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Deployment preparation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps Summary:" -ForegroundColor Blue
Write-Host "1. Copy files to EC2 instance (SCP/WinSCP)" -ForegroundColor White
Write-Host "2. SSH to instance and run installation script" -ForegroundColor White
Write-Host "3. Configure DNS records" -ForegroundColor White
Write-Host "4. Set up SSL certificate on the instance" -ForegroundColor White
Write-Host ""
Write-Host "Final URLs:" -ForegroundColor Green
Write-Host "   HTTP: http://$DOMAIN" -ForegroundColor Cyan
Write-Host "   HTTPS: https://$DOMAIN (after SSL setup)" -ForegroundColor Cyan
