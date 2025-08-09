#!/bin/bash

# DNS Configuration Script for CYPHER Dashboard
# This script configures Route53 DNS records for the CYPHER Dashboard

set -euo pipefail

# Configuration
DOMAIN="rasdash.dev.com"
HOSTED_ZONE_ID="Z07201002RI5R8QT9OIF7"
INSTANCE_ID="i-04a41343a3f51559a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    # Check Route53 permissions
    if ! aws route53 list-hosted-zones &> /dev/null; then
        log_error "No Route53 permissions. Please check your AWS permissions."
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Get current public IP of the instance
get_instance_ip() {
    log_step "Getting instance public IP..."
    
    PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
        --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
    
    if [[ "$PUBLIC_IP" == "None" || -z "$PUBLIC_IP" ]]; then
        log_error "Instance $INSTANCE_ID does not have a public IP address"
        exit 1
    fi
    
    log_info "Instance public IP: $PUBLIC_IP"
    echo "$PUBLIC_IP"
}

# Check current DNS records
check_current_dns() {
    log_step "Checking current DNS records..."
    
    # Get current A record for the domain
    CURRENT_RECORD=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --query "ResourceRecordSets[?Name=='${DOMAIN}.']" \
        --output json)
    
    if [[ "$CURRENT_RECORD" != "[]" ]]; then
        log_info "Current DNS records for $DOMAIN:"
        echo "$CURRENT_RECORD" | jq -r '.[] | "  Type: \(.Type), TTL: \(.TTL), Value: \(.ResourceRecords[0].Value // "N/A")"'
    else
        log_info "No existing DNS records found for $DOMAIN"
    fi
}

# Create or update A record
update_a_record() {
    local public_ip="$1"
    log_step "Creating/updating A record for $DOMAIN..."
    
    # Create change batch JSON
    CHANGE_BATCH=$(cat << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$public_ip"
                    }
                ]
            }
        }
    ]
}
EOF
)
    
    # Submit the change
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "$CHANGE_BATCH" \
        --query "ChangeInfo.Id" --output text)
    
    log_info "DNS change submitted with ID: $CHANGE_ID"
    
    # Wait for change to propagate
    log_info "Waiting for DNS change to propagate..."
    aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
    
    log_info "✅ A record updated successfully: $DOMAIN -> $public_ip"
}

# Create CNAME record for www subdomain
create_www_cname() {
    log_step "Creating CNAME record for www.$DOMAIN..."
    
    # Create change batch JSON for www CNAME
    CHANGE_BATCH=$(cat << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.$DOMAIN",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$DOMAIN"
                    }
                ]
            }
        }
    ]
}
EOF
)
    
    # Submit the change
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "$CHANGE_BATCH" \
        --query "ChangeInfo.Id" --output text)
    
    log_info "CNAME change submitted with ID: $CHANGE_ID"
    
    # Wait for change to propagate
    aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
    
    log_info "✅ CNAME record created successfully: www.$DOMAIN -> $DOMAIN"
}

# Verify DNS resolution
verify_dns_resolution() {
    log_step "Verifying DNS resolution..."
    
    log_info "Testing DNS resolution (this may take a few minutes)..."
    
    # Test A record resolution
    for i in {1..5}; do
        if RESOLVED_IP=$(dig +short "$DOMAIN" @8.8.8.8); then
            if [[ "$RESOLVED_IP" == "$PUBLIC_IP" ]]; then
                log_info "✅ DNS resolution successful: $DOMAIN resolves to $RESOLVED_IP"
                break
            else
                log_warn "DNS resolution mismatch: $DOMAIN resolves to $RESOLVED_IP, expected $PUBLIC_IP"
            fi
        else
            log_warn "DNS resolution failed for $DOMAIN (attempt $i/5)"
        fi
        
        if [[ $i -lt 5 ]]; then
            log_info "Waiting 30 seconds before retry..."
            sleep 30
        fi
    done
    
    # Test www CNAME resolution
    if RESOLVED_CNAME=$(dig +short "www.$DOMAIN" @8.8.8.8); then
        log_info "✅ CNAME resolution successful: www.$DOMAIN resolves to $RESOLVED_CNAME"
    else
        log_warn "CNAME resolution failed for www.$DOMAIN"
    fi
}

# Test HTTP connectivity
test_http_connectivity() {
    log_step "Testing HTTP connectivity..."
    
    log_info "Testing HTTP connectivity to $DOMAIN..."
    
    # Test direct IP access first
    if curl -s --connect-timeout 10 "http://$PUBLIC_IP/health" > /dev/null; then
        log_info "✅ Direct IP access successful: http://$PUBLIC_IP/health"
    else
        log_warn "Direct IP access failed: http://$PUBLIC_IP/health"
    fi
    
    # Test domain access
    for i in {1..3}; do
        if curl -s --connect-timeout 10 "http://$DOMAIN/health" > /dev/null; then
            log_info "✅ Domain access successful: http://$DOMAIN/health"
            break
        else
            log_warn "Domain access failed: http://$DOMAIN/health (attempt $i/3)"
            if [[ $i -lt 3 ]]; then
                sleep 10
            fi
        fi
    done
}

# Display final information
display_final_info() {
    log_step "Deployment Summary"
    
    echo ""
    echo "============================================"
    echo "     CYPHER Dashboard DNS Configuration"
    echo "============================================"
    echo "Domain: $DOMAIN"
    echo "Instance: $INSTANCE_ID"
    echo "Public IP: $PUBLIC_IP"
    echo "Hosted Zone: $HOSTED_ZONE_ID"
    echo ""
    echo "DNS Records Created:"
    echo "  A Record: $DOMAIN -> $PUBLIC_IP"
    echo "  CNAME Record: www.$DOMAIN -> $DOMAIN"
    echo ""
    echo "Access URLs:"
    echo "  HTTP: http://$DOMAIN"
    echo "  Direct IP: http://$PUBLIC_IP"
    echo ""
    echo "Next Steps:"
    echo "1. Configure SSL certificate:"
    echo "   sudo ./scripts/aws-deployment/configure-ssl.sh"
    echo ""
    echo "2. Test the application:"
    echo "   curl http://$DOMAIN/health"
    echo "   curl http://$DOMAIN/api/health"
    echo ""
    echo "3. Access the dashboard:"
    echo "   http://$DOMAIN (will redirect to HTTPS after SSL setup)"
    echo ""
}

# Main function
main() {
    log_info "🌐 Starting DNS configuration for CYPHER Dashboard"
    log_info "Domain: $DOMAIN"
    log_info "Instance: $INSTANCE_ID"
    
    check_prerequisites
    PUBLIC_IP=$(get_instance_ip)
    check_current_dns
    update_a_record "$PUBLIC_IP"
    create_www_cname
    verify_dns_resolution
    test_http_connectivity
    display_final_info
    
    log_info "✅ DNS configuration completed successfully!"
}

# Run main function
main "$@"
