#!/bin/bash

# Update Route53 DNS record for rasdash.dev.com
# This script updates the A record to point to the current EC2 instance IP

set -e

echo "🔄 Updating Route53 DNS record for rasdash.dev.com..."

# Get current public IP
CURRENT_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Current Instance IP: $CURRENT_IP"

# Get current Route53 IP
ROUTE53_IP=$(dig +short rasdash.dev.com @8.8.8.8 | tail -n1)
echo "Current Route53 IP: $ROUTE53_IP"

if [ "$CURRENT_IP" = "$ROUTE53_IP" ]; then
    echo "✅ DNS record is already up to date"
    exit 0
fi

# Update Route53 record
echo "🔧 Updating Route53 A record..."

CHANGE_BATCH=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "rasdash.dev.com",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$CURRENT_IP"
                    }
                ]
            }
        }
    ]
}
EOF
)

# Execute the change
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id Z07201002RI5R8QT9OIF7 \
    --change-batch "$CHANGE_BATCH" \
    --query 'ChangeInfo.Id' \
    --output text)

echo "✅ Route53 change submitted: $CHANGE_ID"

# Wait for change to propagate
echo "⏳ Waiting for DNS change to propagate..."
aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"

echo "🎉 DNS update completed successfully!"
echo "   Domain: http://rasdash.dev.com:3000"
echo "   API:    http://rasdash.dev.com:3001"
echo ""
echo "⏰ Note: DNS propagation may take a few minutes globally"
