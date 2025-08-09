# Update Route 53 to use dev.chypher.com - PowerShell Script
# Run this script to update your Route 53 DNS records via AWS CLI

Write-Host "=== Updating Route 53 to use dev.chypher.com ===" -ForegroundColor Green
Write-Host "Updating DNS records from rasdash.dev.com to dev.chypher.com..." -ForegroundColor Yellow
Write-Host ""

# 1. Create DNS change JSON files for new domain
Write-Host "1. Creating DNS change JSON files..." -ForegroundColor Cyan

# Create A record JSON for dev.chypher.com
$dnsChangeJson = @"
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dev.chypher.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "34.230.172.229"
          }
        ]
      }
    }
  ]
}
"@

# Create CNAME record JSON for www.dev.chypher.com
$dnsCnameJson = @"
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.dev.chypher.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "dev.chypher.com"
          }
        ]
      }
    }
  ]
}
"@

# Save the JSON files
$dnsChangeJson | Out-File -FilePath "dns-change-dev-chypher.json" -Encoding UTF8
$dnsCnameJson | Out-File -FilePath "dns-cname-dev-chypher.json" -Encoding UTF8

Write-Host "   Created dns-change-dev-chypher.json" -ForegroundColor Green
Write-Host "   Created dns-cname-dev-chypher.json" -ForegroundColor Green

# 2. AWS CLI commands to update Route 53
Write-Host "`n2. AWS CLI commands to update Route 53:" -ForegroundColor Cyan

# Get hosted zone ID for dev.chypher.com
Write-Host "   # First, find your hosted zone ID:" -ForegroundColor White
Write-Host "   aws route53 list-hosted-zones --query 'HostedZones[?Name==`"dev.chypher.com.`"].Id' --output text" -ForegroundColor White

# Update A record
Write-Host "`n   # Update A record for dev.chypher.com:" -ForegroundColor White
Write-Host "   aws route53 change-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --change-batch file://dns-change-dev-chypher.json" -ForegroundColor White

# Update CNAME record
Write-Host "`n   # Update CNAME record for www.dev.chypher.com:" -ForegroundColor White
Write-Host "   aws route53 change-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --change-batch file://dns-cname-dev-chypher.json" -ForegroundColor White

# 3. Complete AWS CLI commands ready to run
Write-Host "`n3. Complete AWS CLI commands ready to run:" -ForegroundColor Cyan

# Create the actual commands
$updateARecord = @"
aws route53 change-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dev.chypher.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "34.230.172.229"
          }
        ]
      }
    }
  ]
}'
"@

$updateCnameRecord = @"
aws route53 change-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.dev.chypher.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "dev.chypher.com"
          }
        ]
      }
    }
  ]
}'
"@

Write-Host "   # Update A record:" -ForegroundColor Green
Write-Host $updateARecord -ForegroundColor White

Write-Host "`n   # Update CNAME record:" -ForegroundColor Green
Write-Host $updateCnameRecord -ForegroundColor White

# 4. Verification commands
Write-Host "`n4. Verification commands:" -ForegroundColor Cyan
Write-Host "   # Check current records:" -ForegroundColor White
Write-Host "   aws route53 list-resource-record-sets --hosted-zone-id <YOUR_ZONE_ID> --query 'ResourceRecordSets[?Type==`"A`" || Type==`"CNAME`"]'" -ForegroundColor White

Write-Host "`n   # Test DNS resolution:" -ForegroundColor White
Write-Host "   nslookup dev.chypher.com" -ForegroundColor White
Write-Host "   nslookup www.dev.chypher.com" -ForegroundColor White

# 5. Manual steps checklist
Write-Host "`n5. Manual steps checklist:" -ForegroundColor Yellow
Write-Host "   ✓ Ensure you own dev.chypher.com domain" -ForegroundColor Green
Write-Host "   ✓ Ensure hosted zone exists for dev.chypher.com" -ForegroundColor Green
Write-Host "   ✓ Replace <YOUR_ZONE_ID> with actual hosted zone ID" -ForegroundColor Yellow
Write-Host "   ✓ Run the AWS CLI commands above" -ForegroundColor Yellow
Write-Host "   ✓ Wait for DNS propagation (5-10 minutes)" -ForegroundColor Yellow
Write-Host "   ✓ Test with: curl http://dev.chypher.com" -ForegroundColor Yellow

Write-Host "`n=== Route 53 Update Complete ===" -ForegroundColor Green
Write-Host "Run the AWS CLI commands above to update your DNS records" -ForegroundColor Yellow
