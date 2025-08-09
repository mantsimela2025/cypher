# Simple CYPHER Dashboard Deployment Script
param(
    [string]$InstanceIP = "34.230.172.229"
)

$DOMAIN = "rasdash.dev.com"
$DB_ENDPOINT = "rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com"

Write-Host "CYPHER Dashboard Deployment" -ForegroundColor Green
Write-Host "Instance IP: $InstanceIP" -ForegroundColor Cyan
Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan

# Create production environment file
$envContent = @"
NODE_ENV=production
PORT=3001
CLIENT_PORT=3000

DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@$DB_ENDPOINT:5432/rasdashdev01
PGHOST=$DB_ENDPOINT
PGPORT=5432
PGUSER=rasdashadmin
PGPASSWORD=RasDash2025$
PGDATABASE=rasdashdev01

SESSION_SECRET=a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
JWT_SECRET=a0uH1XXjscv4BI5IVknxnzP1JBCdkSnB+q6rmehABk6xCveaYa8wvnggCJj058lm9bBGRLlEkAftghoDPBDjrg==
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=74645ae555e1fe3f0869ca213a0d8164a898556ef8d44ce6836467c47e94b47a

CORS_ORIGIN=https://$DOMAIN,http://$DOMAIN,http://$InstanceIP:3000
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN

EMAIL_FROM=noreply@$DOMAIN
EMAIL_FROM_NAME=CYPHER Dashboard
ADMIN_EMAIL=admin@$DOMAIN

OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
MAILERSEND_API_KEY=mlsn.716a734f75dfaa5bd7656ceadc4e0308c51695a6831763e9290eb650b303585d
NVD_API_KEY=4edc77ed-d681-4472-8713-b24913590364

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "Created .env.production file" -ForegroundColor Green

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "1. Copy files to EC2: scp -r . ec2-user@${InstanceIP}:/home/ec2-user/cypher-dashboard"
Write-Host "2. SSH to instance: ssh ec2-user@$InstanceIP"
Write-Host "3. Run installation: sudo /home/ec2-user/cypher-dashboard/scripts/aws-deployment/install-on-instance.sh"
Write-Host ""
Write-Host "URLs after deployment:"
Write-Host "  HTTP: http://$DOMAIN"
Write-Host "  HTTPS: https://$DOMAIN"
