#!/bin/bash
# DNS Setup Script for CYPHER Application
# This script configures Route 53 DNS records for your domains

set -e

# Configuration
HOSTED_ZONE_ID="Z07201002RI5R8QT9OIF7"
DOMAIN="rasdash.dev.com"
EC2_IP="34.230.172.229"

echo "🌐 Setting up DNS records for CYPHER application..."
echo "Domain: $DOMAIN"
echo "EC2 IP: $EC2_IP"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"

# Function to create/update A record
create_a_record() {
    local subdomain=$1
    local ip=$2
    
    echo "📝 Creating A record for $subdomain..."
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch "{
            \"Changes\": [{
                \"Action\": \"UPSERT\",
                \"ResourceRecordSet\": {
                    \"Name\": \"$subdomain\",
                    \"Type\": \"A\",
                    \"TTL\": 300,
                    \"ResourceRecords\": [{\"Value\": \"$ip\"}]
                }
            }]
        }" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully created A record for $subdomain"
    else
        echo "❌ Failed to create A record for $subdomain"
        exit 1
    fi
}

# Create A records for all environments
echo ""
echo "Creating DNS records..."

# Production
create_a_record "$DOMAIN" "$EC2_IP"

# Staging
create_a_record "staging.$DOMAIN" "$EC2_IP"

# Development
create_a_record "dev.$DOMAIN" "$EC2_IP"

# API subdomain (optional)
create_a_record "api.$DOMAIN" "$EC2_IP"

echo ""
echo "✅ DNS setup completed!"
echo ""
echo "🔍 Verifying DNS records..."

# Verify the records
echo "Checking DNS propagation (this may take a few minutes)..."
sleep 5

for subdomain in "$DOMAIN" "staging.$DOMAIN" "dev.$DOMAIN" "api.$DOMAIN"; do
    echo -n "Checking $subdomain... "
    result=$(dig +short $subdomain)
    if [ "$result" = "$EC2_IP" ]; then
        echo "✅ OK ($result)"
    else
        echo "⏳ Propagating... (current: $result)"
    fi
done

echo ""
echo "📋 DNS Records Summary:"
echo "Production:  https://$DOMAIN"
echo "Staging:     https://staging.$DOMAIN"
echo "Development: https://dev.$DOMAIN"
echo "API:         https://api.$DOMAIN"
echo ""
echo "Note: DNS propagation can take up to 48 hours, but usually completes within 5-10 minutes."
echo ""
echo "🔧 Next steps:"
echo "1. Run the EC2 setup script: ./deployment/ec2-setup.sh"
echo "2. Configure GitLab CI/CD variables"
echo "3. Push to your repository to trigger deployment"
