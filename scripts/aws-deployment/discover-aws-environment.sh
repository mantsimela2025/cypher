#!/bin/bash

# AWS Environment Discovery Script for RAS DASH
# This script scans existing AWS resources and suggests reuse opportunities

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

log_info "🔍 AWS Environment Discovery for RAS DASH"

# Initialize discovery steps
init_progress \
    "AWS Authentication Check" \
    "VPC Discovery" \
    "Security Group Analysis" \
    "Key Pair Inventory" \
    "RDS Instance Review" \
    "Route53 Zone Analysis" \
    "EC2 Instance Assessment" \
    "Cost Analysis & Recommendations"

DISCOVERY_RESULTS=()
REUSE_RECOMMENDATIONS=()

# Configuration
REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="${1}"

if [[ -n "$DOMAIN_NAME" ]]; then
    log_info "Analyzing environment for domain: $DOMAIN_NAME"
fi

# Step 1: AWS Authentication Check
start_step

log_info "Validating AWS credentials and permissions..."

# Check AWS credentials
if ! AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null); then
    log_error "AWS credentials not configured or invalid"
    exit 1
fi

AWS_USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
log_info "✅ Connected to AWS Account: $AWS_ACCOUNT_ID"
log_info "✅ User/Role: $AWS_USER_ARN"
log_info "✅ Region: $REGION"

# Check essential permissions
log_info "Checking AWS permissions..."
PERMISSIONS_OK=true

if ! aws ec2 describe-vpcs --max-items 1 >/dev/null 2>&1; then
    log_warn "⚠️  Limited EC2 permissions detected"
    PERMISSIONS_OK=false
fi

if ! aws route53 list-hosted-zones --max-items 1 >/dev/null 2>&1; then
    log_warn "⚠️  Limited Route53 permissions detected"
fi

if ! aws rds describe-db-instances --max-items 1 >/dev/null 2>&1; then
    log_warn "⚠️  Limited RDS permissions detected"
fi

complete_step

# Step 2: VPC Discovery
start_step

log_info "Discovering existing VPCs..."

VPC_DATA=$(aws ec2 describe-vpcs \
    --query 'Vpcs[*].{VpcId:VpcId,CidrBlock:CidrBlock,State:State,IsDefault:IsDefault,Tags:Tags}' \
    --output json 2>/dev/null || echo "[]")

VPC_COUNT=$(echo "$VPC_DATA" | jq length)
log_info "Found $VPC_COUNT VPCs in region $REGION"

if [[ $VPC_COUNT -gt 0 ]]; then
    echo ""
    echo "📋 Existing VPCs:"
    echo "=================="
    
    for ((i=0; i<VPC_COUNT; i++)); do
        VPC_ID=$(echo "$VPC_DATA" | jq -r ".[$i].VpcId")
        VPC_CIDR=$(echo "$VPC_DATA" | jq -r ".[$i].CidrBlock")
        VPC_STATE=$(echo "$VPC_DATA" | jq -r ".[$i].State")
        VPC_DEFAULT=$(echo "$VPC_DATA" | jq -r ".[$i].IsDefault")
        VPC_NAME=$(echo "$VPC_DATA" | jq -r ".[$i].Tags[]? | select(.Key==\"Name\") | .Value" 2>/dev/null || echo "Unnamed")
        
        echo "VPC $((i+1)): $VPC_ID"
        echo "  Name: $VPC_NAME"
        echo "  CIDR: $VPC_CIDR"
        echo "  State: $VPC_STATE"
        echo "  Default: $VPC_DEFAULT"
        
        # Check subnet availability
        SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
            --query 'Subnets | length' --output text 2>/dev/null || echo "0")
        echo "  Subnets: $SUBNET_COUNT"
        
        # Check internet gateway
        IGW_COUNT=$(aws ec2 describe-internet-gateways \
            --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
            --query 'InternetGateways | length' --output text 2>/dev/null || echo "0")
        echo "  Internet Gateways: $IGW_COUNT"
        
        # Reuse recommendation for suitable VPCs
        if [[ "$VPC_STATE" == "available" && $SUBNET_COUNT -gt 0 && $IGW_COUNT -gt 0 ]]; then
            REUSE_RECOMMENDATIONS+=("VPC: $VPC_ID ($VPC_NAME) - Ready for use with $SUBNET_COUNT subnets")
            log_info "✅ VPC $VPC_ID is suitable for reuse"
        elif [[ "$VPC_STATE" == "available" ]]; then
            REUSE_RECOMMENDATIONS+=("VPC: $VPC_ID ($VPC_NAME) - Needs additional configuration (subnets/IGW)")
            log_warn "⚠️  VPC $VPC_ID needs additional setup"
        fi
        
        echo ""
    done
    
    DISCOVERY_RESULTS+=("VPCs: $VPC_COUNT found")
else
    log_info "No existing VPCs found - will need to create new VPC"
    DISCOVERY_RESULTS+=("VPCs: None found")
fi

complete_step

# Step 3: Security Group Analysis
start_step

log_info "Analyzing existing security groups..."

SG_DATA=$(aws ec2 describe-security-groups \
    --query 'SecurityGroups[*].{GroupId:GroupId,GroupName:GroupName,Description:Description,VpcId:VpcId,Tags:Tags}' \
    --output json 2>/dev/null || echo "[]")

SG_COUNT=$(echo "$SG_DATA" | jq length)
log_info "Found $SG_COUNT security groups"

if [[ $SG_COUNT -gt 0 ]]; then
    echo ""
    echo "🔒 Security Group Analysis:"
    echo "==========================="
    
    # Look for potentially reusable security groups
    for ((i=0; i<SG_COUNT; i++)); do
        SG_ID=$(echo "$SG_DATA" | jq -r ".[$i].GroupId")
        SG_NAME=$(echo "$SG_DATA" | jq -r ".[$i].GroupName")
        SG_DESC=$(echo "$SG_DATA" | jq -r ".[$i].Description")
        SG_VPC=$(echo "$SG_DATA" | jq -r ".[$i].VpcId")
        
        # Skip default security groups
        if [[ "$SG_NAME" == "default" ]]; then
            continue
        fi
        
        # Get security group rules
        SG_RULES=$(aws ec2 describe-security-groups --group-ids "$SG_ID" \
            --query 'SecurityGroups[0].IpPermissions[].FromPort' --output text 2>/dev/null || echo "")
        
        # Check if it has web-relevant ports (22, 80, 443)
        if [[ "$SG_RULES" == *"22"* || "$SG_RULES" == *"80"* || "$SG_RULES" == *"443"* ]]; then
            echo "SG: $SG_ID ($SG_NAME)"
            echo "  Description: $SG_DESC"
            echo "  VPC: $SG_VPC"
            echo "  Ports: $SG_RULES"
            
            # Check if it matches our needs
            if [[ "$SG_RULES" == *"22"* && "$SG_RULES" == *"80"* && "$SG_RULES" == *"443"* ]]; then
                REUSE_RECOMMENDATIONS+=("Security Group: $SG_ID ($SG_NAME) - Has required ports (22,80,443)")
                log_info "✅ Security Group $SG_ID suitable for web application"
            else
                REUSE_RECOMMENDATIONS+=("Security Group: $SG_ID ($SG_NAME) - Partial match, may need modification")
                log_warn "⚠️  Security Group $SG_ID needs additional ports"
            fi
            echo ""
        fi
    done
    
    DISCOVERY_RESULTS+=("Security Groups: $SG_COUNT found")
else
    log_info "No existing security groups found"
    DISCOVERY_RESULTS+=("Security Groups: None found")
fi

complete_step

# Step 4: Key Pair Inventory
start_step

log_info "Inventorying existing key pairs..."

KEY_DATA=$(aws ec2 describe-key-pairs \
    --query 'KeyPairs[*].{KeyName:KeyName,KeyFingerprint:KeyFingerprint,Tags:Tags}' \
    --output json 2>/dev/null || echo "[]")

KEY_COUNT=$(echo "$KEY_DATA" | jq length)
log_info "Found $KEY_COUNT key pairs"

if [[ $KEY_COUNT -gt 0 ]]; then
    echo ""
    echo "🔑 Available Key Pairs:"
    echo "======================"
    
    for ((i=0; i<KEY_COUNT; i++)); do
        KEY_NAME=$(echo "$KEY_DATA" | jq -r ".[$i].KeyName")
        KEY_FINGERPRINT=$(echo "$KEY_DATA" | jq -r ".[$i].KeyFingerprint")
        
        echo "Key: $KEY_NAME"
        echo "  Fingerprint: $KEY_FINGERPRINT"
        
        # Check if local .pem file exists
        if [[ -f "${KEY_NAME}.pem" ]]; then
            echo "  Local file: ✅ Found ${KEY_NAME}.pem"
            REUSE_RECOMMENDATIONS+=("Key Pair: $KEY_NAME - Local file available for immediate use")
        else
            echo "  Local file: ❌ ${KEY_NAME}.pem not found"
            REUSE_RECOMMENDATIONS+=("Key Pair: $KEY_NAME - Exists in AWS but no local file")
        fi
        echo ""
    done
    
    DISCOVERY_RESULTS+=("Key Pairs: $KEY_COUNT found")
else
    log_info "No existing key pairs found"
    DISCOVERY_RESULTS+=("Key Pairs: None found")
fi

complete_step

# Step 5: RDS Instance Review
start_step

log_info "Reviewing existing RDS instances..."

RDS_DATA=$(aws rds describe-db-instances \
    --query 'DBInstances[*].{DBInstanceIdentifier:DBInstanceIdentifier,DBInstanceClass:DBInstanceClass,Engine:Engine,DBInstanceStatus:DBInstanceStatus,Endpoint:Endpoint,VpcId:DbSubnetGroup.VpcId}' \
    --output json 2>/dev/null || echo "[]")

RDS_COUNT=$(echo "$RDS_DATA" | jq length)
log_info "Found $RDS_COUNT RDS instances"

if [[ $RDS_COUNT -gt 0 ]]; then
    echo ""
    echo "🗄️  Existing RDS Instances:"
    echo "=========================="
    
    for ((i=0; i<RDS_COUNT; i++)); do
        DB_ID=$(echo "$RDS_DATA" | jq -r ".[$i].DBInstanceIdentifier")
        DB_CLASS=$(echo "$RDS_DATA" | jq -r ".[$i].DBInstanceClass")
        DB_ENGINE=$(echo "$RDS_DATA" | jq -r ".[$i].Engine")
        DB_STATUS=$(echo "$RDS_DATA" | jq -r ".[$i].DBInstanceStatus")
        DB_ENDPOINT=$(echo "$RDS_DATA" | jq -r ".[$i].Endpoint.Address // \"N/A\"")
        DB_VPC=$(echo "$RDS_DATA" | jq -r ".[$i].VpcId // \"N/A\"")
        
        echo "RDS: $DB_ID"
        echo "  Engine: $DB_ENGINE"
        echo "  Class: $DB_CLASS"
        echo "  Status: $DB_STATUS"
        echo "  Endpoint: $DB_ENDPOINT"
        echo "  VPC: $DB_VPC"
        
        # Check if PostgreSQL and available
        if [[ "$DB_ENGINE" == "postgres"* && "$DB_STATUS" == "available" ]]; then
            REUSE_RECOMMENDATIONS+=("RDS: $DB_ID - PostgreSQL instance ready for use")
            log_info "✅ RDS $DB_ID suitable for RAS DASH (PostgreSQL)"
        elif [[ "$DB_STATUS" == "available" ]]; then
            REUSE_RECOMMENDATIONS+=("RDS: $DB_ID - Available but different engine ($DB_ENGINE)")
            log_warn "⚠️  RDS $DB_ID uses $DB_ENGINE instead of PostgreSQL"
        else
            log_warn "⚠️  RDS $DB_ID not available (status: $DB_STATUS)"
        fi
        echo ""
    done
    
    DISCOVERY_RESULTS+=("RDS Instances: $RDS_COUNT found")
else
    log_info "No existing RDS instances found"
    DISCOVERY_RESULTS+=("RDS Instances: None found")
fi

complete_step

# Step 6: Route53 Zone Analysis
start_step

log_info "Analyzing Route53 hosted zones..."

ROUTE53_DATA=$(aws route53 list-hosted-zones \
    --query 'HostedZones[*].{Id:Id,Name:Name,Config:Config}' \
    --output json 2>/dev/null || echo "[]")

ZONE_COUNT=$(echo "$ROUTE53_DATA" | jq length)
log_info "Found $ZONE_COUNT hosted zones"

if [[ $ZONE_COUNT -gt 0 ]]; then
    echo ""
    echo "🌐 Route53 Hosted Zones:"
    echo "======================="
    
    for ((i=0; i<ZONE_COUNT; i++)); do
        ZONE_ID=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Id" | cut -d'/' -f3)
        ZONE_NAME=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Name")
        ZONE_PRIVATE=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Config.PrivateZone")
        
        echo "Zone: $ZONE_NAME"
        echo "  ID: $ZONE_ID"
        echo "  Private: $ZONE_PRIVATE"
        
        # Check if domain matches or is a parent domain
        if [[ -n "$DOMAIN_NAME" ]]; then
            if [[ "$DOMAIN_NAME" == *"$ZONE_NAME"* ]] || [[ "$ZONE_NAME" == *"$DOMAIN_NAME"* ]]; then
                REUSE_RECOMMENDATIONS+=("Route53: $ZONE_NAME - Perfect match for domain $DOMAIN_NAME")
                log_info "✅ Route53 zone $ZONE_NAME matches domain $DOMAIN_NAME"
            fi
        fi
        
        # Get record count
        RECORD_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id "$ZONE_ID" \
            --query 'ResourceRecordSets | length' --output text 2>/dev/null || echo "0")
        echo "  Records: $RECORD_COUNT"
        echo ""
    done
    
    DISCOVERY_RESULTS+=("Route53 Zones: $ZONE_COUNT found")
else
    log_info "No hosted zones found"
    DISCOVERY_RESULTS+=("Route53 Zones: None found")
fi

complete_step

# Step 7: EC2 Instance Assessment
start_step

log_info "Assessing existing EC2 instances..."

EC2_DATA=$(aws ec2 describe-instances \
    --query 'Reservations[*].Instances[*].{InstanceId:InstanceId,InstanceType:InstanceType,State:State.Name,PublicIpAddress:PublicIpAddress,PrivateIpAddress:PrivateIpAddress,VpcId:VpcId,SubnetId:SubnetId,Tags:Tags}' \
    --output json 2>/dev/null || echo "[]")

EC2_INSTANCES=$(echo "$EC2_DATA" | jq 'flatten')
EC2_COUNT=$(echo "$EC2_INSTANCES" | jq length)
log_info "Found $EC2_COUNT EC2 instances"

if [[ $EC2_COUNT -gt 0 ]]; then
    echo ""
    echo "🖥️  Existing EC2 Instances:"
    echo "========================="
    
    RUNNING_COUNT=0
    STOPPED_COUNT=0
    
    for ((i=0; i<EC2_COUNT; i++)); do
        INSTANCE_ID=$(echo "$EC2_INSTANCES" | jq -r ".[$i].InstanceId")
        INSTANCE_TYPE=$(echo "$EC2_INSTANCES" | jq -r ".[$i].InstanceType")
        INSTANCE_STATE=$(echo "$EC2_INSTANCES" | jq -r ".[$i].State")
        PUBLIC_IP=$(echo "$EC2_INSTANCES" | jq -r ".[$i].PublicIpAddress // \"N/A\"")
        PRIVATE_IP=$(echo "$EC2_INSTANCES" | jq -r ".[$i].PrivateIpAddress // \"N/A\"")
        VPC_ID=$(echo "$EC2_INSTANCES" | jq -r ".[$i].VpcId // \"N/A\"")
        INSTANCE_NAME=$(echo "$EC2_INSTANCES" | jq -r ".[$i].Tags[]? | select(.Key==\"Name\") | .Value" 2>/dev/null || echo "Unnamed")
        
        echo "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
        echo "  Type: $INSTANCE_TYPE"
        echo "  State: $INSTANCE_STATE"
        echo "  Public IP: $PUBLIC_IP"
        echo "  Private IP: $PRIVATE_IP"
        echo "  VPC: $VPC_ID"
        
        if [[ "$INSTANCE_STATE" == "running" ]]; then
            RUNNING_COUNT=$((RUNNING_COUNT + 1))
            # Check if it could be repurposed (has public IP and suitable size)
            if [[ "$PUBLIC_IP" != "N/A" && ("$INSTANCE_TYPE" == "t3."* || "$INSTANCE_TYPE" == "t2."*) ]]; then
                REUSE_RECOMMENDATIONS+=("EC2: $INSTANCE_ID ($INSTANCE_NAME) - Running $INSTANCE_TYPE with public IP")
                log_info "✅ Instance $INSTANCE_ID could potentially be repurposed"
            fi
        elif [[ "$INSTANCE_STATE" == "stopped" ]]; then
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
            REUSE_RECOMMENDATIONS+=("EC2: $INSTANCE_ID ($INSTANCE_NAME) - Stopped $INSTANCE_TYPE, could be restarted")
        fi
        echo ""
    done
    
    log_info "Running instances: $RUNNING_COUNT"
    log_info "Stopped instances: $STOPPED_COUNT"
    DISCOVERY_RESULTS+=("EC2 Instances: $EC2_COUNT total ($RUNNING_COUNT running, $STOPPED_COUNT stopped)")
else
    log_info "No EC2 instances found"
    DISCOVERY_RESULTS+=("EC2 Instances: None found")
fi

complete_step

# Step 8: Cost Analysis & Recommendations
start_step

log_info "Performing cost analysis and generating recommendations..."

# Calculate potential cost savings
POTENTIAL_SAVINGS=0
MONTHLY_COST_ESTIMATE=0

# Estimate costs for new vs reuse scenarios
if [[ $VPC_COUNT -gt 0 ]]; then
    log_info "✅ VPC reuse could save ~$0/month (VPCs are free, but avoid management overhead)"
fi

if [[ $RDS_COUNT -gt 0 ]]; then
    log_info "✅ RDS reuse could save ~$15-50/month (depending on instance size)"
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 15))
fi

if [[ $EC2_COUNT -gt 0 ]]; then
    log_info "✅ EC2 reuse could save ~$8-50/month (depending on instance type)"
    POTENTIAL_SAVINGS=$((POTENTIAL_SAVINGS + 8))
fi

complete_step

# Generate Discovery Report
echo ""
echo "============================================"
echo "     AWS ENVIRONMENT DISCOVERY REPORT"
echo "============================================"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $REGION"
echo "Analysis Date: $(date)"
if [[ -n "$DOMAIN_NAME" ]]; then
    echo "Target Domain: $DOMAIN_NAME"
fi
echo ""

echo "DISCOVERY SUMMARY:"
echo "=================="
for result in "${DISCOVERY_RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo "REUSE RECOMMENDATIONS:"
echo "====================="
if [[ ${#REUSE_RECOMMENDATIONS[@]} -gt 0 ]]; then
    for recommendation in "${REUSE_RECOMMENDATIONS[@]}"; do
        echo "  ✅ $recommendation"
    done
else
    echo "  ❌ No existing resources suitable for reuse"
    echo "  📝 Recommendation: Proceed with new resource creation"
fi

echo ""
echo "COST ANALYSIS:"
echo "=============="
if [[ $POTENTIAL_SAVINGS -gt 0 ]]; then
    echo "  💰 Potential monthly savings: ~$${POTENTIAL_SAVINGS}+"
    echo "  📊 Resource reuse recommended to optimize costs"
else
    echo "  💰 Estimated new deployment cost: ~$25-30/month"
    echo "  📊 No significant cost savings from reuse"
fi

echo ""
echo "NEXT STEPS:"
echo "==========="
echo "  1. Review reuse recommendations above"
echo "  2. Choose resources to reuse vs create new"
echo "  3. Run deployment with reuse options:"
echo "     ./scripts/create-infrastructure-with-reuse.sh $DOMAIN_NAME"
echo "  4. Or proceed with new resource creation:"
echo "     ./scripts/create-infrastructure.sh $DOMAIN_NAME"

# Save discovery report
REPORT_FILE="${LOG_DIR}/aws-discovery-$(date +%Y%m%d-%H%M%S).json"
mkdir -p "$LOG_DIR"

cat > "$REPORT_FILE" << EOF
{
  "discovery": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "account_id": "$AWS_ACCOUNT_ID",
    "region": "$REGION",
    "domain": "$DOMAIN_NAME",
    "results": $(printf '%s\n' "${DISCOVERY_RESULTS[@]}" | jq -R . | jq -s .),
    "recommendations": $(printf '%s\n' "${REUSE_RECOMMENDATIONS[@]}" | jq -R . | jq -s .),
    "cost_analysis": {
      "potential_savings": $POTENTIAL_SAVINGS,
      "reuse_recommended": $([ ${#REUSE_RECOMMENDATIONS[@]} -gt 0 ] && echo "true" || echo "false")
    },
    "raw_data": {
      "vpcs": $VPC_DATA,
      "security_groups": $SG_DATA,
      "key_pairs": $KEY_DATA,
      "rds_instances": $RDS_DATA,
      "route53_zones": $ROUTE53_DATA,
      "ec2_instances": $EC2_INSTANCES
    }
  }
}
EOF

echo ""
echo "📊 Detailed discovery data saved to: $REPORT_FILE"

# Return appropriate exit code based on findings
if [[ ${#REUSE_RECOMMENDATIONS[@]} -gt 0 ]]; then
    log_info "Discovery completed successfully with reuse opportunities found"
    exit 0
else
    log_info "Discovery completed - no existing resources suitable for reuse"
    exit 1
fi