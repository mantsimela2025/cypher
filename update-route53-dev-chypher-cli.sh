cl#!/bin/bash
# Update Route 53 to use dev.chypher.com via AWS CLI
# Run these commands in VS Code terminal to update your DNS records

echo "=== Updating Route 53 to use dev.chypher.com ==="
echo "Running AWS CLI commands to update DNS records..."
echo ""

# Step 1: Find your hosted zone ID
echo "Step 1: Finding hosted zone ID for dev.chypher.com..."
ZONE_ID=$(aws route53 list-hosted-zones --query 'HostedZones[?Name==`dev.chypher.com.`].Id' --output text | cut -d'/' -f3)

if [ -z "$ZONE_ID" ]; then
    echo "❌ Hosted zone for dev.chypher.com not found!"
    echo "Please create a hosted zone for dev.chypher.com first:"
    echo "aws route53 create-hosted-zone --name dev.chypher.com --caller-reference $(date +%s)"
    exit 1
fi

echo "✅ Found hosted zone ID: $ZONE_ID"

# Step 2: Update A record for dev.chypher.com
echo ""
echo "Step 2: Updating A record for dev.chypher.com..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
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

# Step 3: Update CNAME record for www.dev.chypher.com
echo ""
echo "Step 3: Updating CNAME record for www.dev.chypher.com..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
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

# Step 4: Verify the changes
echo ""
echo "Step 4: Verifying DNS changes..."
echo "Current DNS records:"
aws route53 list-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --query 'ResourceRecordSets[?Type==`A` || Type==`CNAME`]' \
    --output table

# Step 5: Test DNS resolution
echo ""
echo "Step 5: Testing DNS resolution..."
echo "Testing dev.chypher.com..."
nslookup dev.chypher.com

echo ""
echo "Testing www.dev.chypher.com..."
nslookup www.dev.chypher.com

echo ""
echo "=== Route 53 Update Complete ==="
echo "DNS changes have been submitted. It may take 5-10 minutes to propagate."
echo "Test with: curl http://dev.chypher.com"
