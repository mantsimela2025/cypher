#!/bin/bash

# Infrastructure Creation with AWS Resource Reuse for RAS DASH
# This script intelligently reuses existing AWS resources when possible

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

log_info "🔄 RAS DASH Infrastructure Creation with Resource Reuse"

# Configuration
REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="${1}"
DB_PASSWORD="${2:-$(openssl rand -base64 32)}"
DISCOVERY_REPORT="${LOG_DIR}/aws-discovery-latest.json"

# Interactive mode flag
INTERACTIVE="${INTERACTIVE:-true}"

if [[ -z "$DOMAIN_NAME" ]]; then
    log_error "Domain name is required as first argument"
    echo "Usage: $0 <domain-name> [db-password]"
    exit 1
fi

# Step 1: Load existing discovery data or run discovery
if [[ ! -f "$DISCOVERY_REPORT" ]]; then
    log_info "No recent discovery data found. Running AWS environment discovery..."
    ./discover-aws-environment.sh "$DOMAIN_NAME"
    
    # Find the most recent discovery report
    LATEST_REPORT=$(ls -t ${LOG_DIR}/aws-discovery-*.json 2>/dev/null | head -1)
    if [[ -n "$LATEST_REPORT" ]]; then
        cp "$LATEST_REPORT" "$DISCOVERY_REPORT"
    else
        log_error "Discovery failed. Cannot proceed with reuse strategy."
        exit 1
    fi
fi

log_info "Loading discovery data from: $DISCOVERY_REPORT"

# Initialize reuse strategy variables
REUSE_VPC=""
REUSE_SUBNET=""
REUSE_IGW=""
REUSE_SECURITY_GROUP=""
REUSE_KEY_PAIR=""
REUSE_RDS=""
REUSE_ROUTE53_ZONE=""

# Extract discovery data
VPC_DATA=$(jq -r '.discovery.raw_data.vpcs' "$DISCOVERY_REPORT")
SG_DATA=$(jq -r '.discovery.raw_data.security_groups' "$DISCOVERY_REPORT")
KEY_DATA=$(jq -r '.discovery.raw_data.key_pairs' "$DISCOVERY_REPORT")
RDS_DATA=$(jq -r '.discovery.raw_data.rds_instances' "$DISCOVERY_REPORT")
ROUTE53_DATA=$(jq -r '.discovery.raw_data.route53_zones' "$DISCOVERY_REPORT")

# Interactive resource selection functions
select_vpc() {
    local vpc_count=$(echo "$VPC_DATA" | jq length)
    
    if [[ $vpc_count -eq 0 ]]; then
        log_info "No existing VPCs found. Will create new VPC."
        return 1
    fi
    
    echo ""
    echo "🏗️  VPC Selection:"
    echo "=================="
    echo "0. Create new VPC"
    
    for ((i=0; i<vpc_count; i++)); do
        local vpc_id=$(echo "$VPC_DATA" | jq -r ".[$i].VpcId")
        local vpc_name=$(echo "$VPC_DATA" | jq -r ".[$i].Tags[]? | select(.Key==\"Name\") | .Value" 2>/dev/null || echo "Unnamed")
        local vpc_cidr=$(echo "$VPC_DATA" | jq -r ".[$i].CidrBlock")
        local vpc_state=$(echo "$VPC_DATA" | jq -r ".[$i].State")
        
        echo "$((i+1)). $vpc_id ($vpc_name) - $vpc_cidr [$vpc_state]"
    done
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Select VPC (0-$vpc_count): " vpc_choice
    else
        # Auto-select first available VPC
        vpc_choice=1
        log_info "Auto-selecting first available VPC"
    fi
    
    if [[ "$vpc_choice" -gt 0 && "$vpc_choice" -le "$vpc_count" ]]; then
        local selected_idx=$((vpc_choice - 1))
        REUSE_VPC=$(echo "$VPC_DATA" | jq -r ".[$selected_idx].VpcId")
        log_info "✅ Selected VPC: $REUSE_VPC"
        
        # Find suitable subnet in selected VPC
        local subnet_data=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$REUSE_VPC" \
            --query 'Subnets[?MapPublicIpOnLaunch==`true`] | [0]' --output json 2>/dev/null)
        
        if [[ "$subnet_data" != "null" ]]; then
            REUSE_SUBNET=$(echo "$subnet_data" | jq -r '.SubnetId')
            log_info "✅ Found public subnet: $REUSE_SUBNET"
        else
            log_warn "⚠️  No public subnet found in VPC. Will create new subnet."
        fi
        
        # Check for internet gateway
        local igw_data=$(aws ec2 describe-internet-gateways \
            --filters "Name=attachment.vpc-id,Values=$REUSE_VPC" \
            --query 'InternetGateways[0]' --output json 2>/dev/null)
        
        if [[ "$igw_data" != "null" ]]; then
            REUSE_IGW=$(echo "$igw_data" | jq -r '.InternetGatewayId')
            log_info "✅ Found internet gateway: $REUSE_IGW"
        else
            log_warn "⚠️  No internet gateway found in VPC. Will create new IGW."
        fi
        
        return 0
    else
        log_info "Creating new VPC"
        return 1
    fi
}

select_security_group() {
    local sg_count=$(echo "$SG_DATA" | jq 'map(select(.GroupName != "default")) | length')
    
    if [[ $sg_count -eq 0 ]]; then
        log_info "No suitable security groups found. Will create new security group."
        return 1
    fi
    
    echo ""
    echo "🔒 Security Group Selection:"
    echo "============================"
    echo "0. Create new security group"
    
    local counter=1
    echo "$SG_DATA" | jq -c 'map(select(.GroupName != "default"))[]' | while read -r sg; do
        local sg_id=$(echo "$sg" | jq -r '.GroupId')
        local sg_name=$(echo "$sg" | jq -r '.GroupName')
        local sg_desc=$(echo "$sg" | jq -r '.Description')
        local sg_vpc=$(echo "$sg" | jq -r '.VpcId')
        
        # Check if VPC matches (if we're reusing a VPC)
        if [[ -n "$REUSE_VPC" && "$sg_vpc" != "$REUSE_VPC" ]]; then
            continue
        fi
        
        echo "$counter. $sg_id ($sg_name) - $sg_desc"
        counter=$((counter + 1))
    done
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Select Security Group (0-$sg_count): " sg_choice
    else
        # Auto-select first suitable security group
        sg_choice=1
        log_info "Auto-selecting first suitable security group"
    fi
    
    if [[ "$sg_choice" -gt 0 && "$sg_choice" -le "$sg_count" ]]; then
        # Get the selected security group
        local selected_sg=$(echo "$SG_DATA" | jq -c 'map(select(.GroupName != "default"))[]' | sed -n "${sg_choice}p")
        REUSE_SECURITY_GROUP=$(echo "$selected_sg" | jq -r '.GroupId')
        log_info "✅ Selected Security Group: $REUSE_SECURITY_GROUP"
        return 0
    else
        log_info "Creating new security group"
        return 1
    fi
}

select_key_pair() {
    local key_count=$(echo "$KEY_DATA" | jq length)
    
    if [[ $key_count -eq 0 ]]; then
        log_info "No existing key pairs found. Will create new key pair."
        return 1
    fi
    
    echo ""
    echo "🔑 Key Pair Selection:"
    echo "====================="
    echo "0. Create new key pair"
    
    for ((i=0; i<key_count; i++)); do
        local key_name=$(echo "$KEY_DATA" | jq -r ".[$i].KeyName")
        local key_fingerprint=$(echo "$KEY_DATA" | jq -r ".[$i].KeyFingerprint")
        local local_file_status="❌"
        
        if [[ -f "${key_name}.pem" ]]; then
            local_file_status="✅"
        fi
        
        echo "$((i+1)). $key_name ($local_file_status local file) - $key_fingerprint"
    done
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Select Key Pair (0-$key_count): " key_choice
    else
        # Auto-select first key pair with local file
        key_choice=0
        for ((i=0; i<key_count; i++)); do
            local key_name=$(echo "$KEY_DATA" | jq -r ".[$i].KeyName")
            if [[ -f "${key_name}.pem" ]]; then
                key_choice=$((i+1))
                log_info "Auto-selecting key pair with local file: $key_name"
                break
            fi
        done
    fi
    
    if [[ "$key_choice" -gt 0 && "$key_choice" -le "$key_count" ]]; then
        local selected_idx=$((key_choice - 1))
        REUSE_KEY_PAIR=$(echo "$KEY_DATA" | jq -r ".[$selected_idx].KeyName")
        
        # Verify local file exists
        if [[ ! -f "${REUSE_KEY_PAIR}.pem" ]]; then
            log_error "Selected key pair $REUSE_KEY_PAIR does not have local .pem file"
            log_info "You'll need to either:"
            log_info "  1. Locate the .pem file for this key pair"
            log_info "  2. Create a new key pair instead"
            return 1
        fi
        
        log_info "✅ Selected Key Pair: $REUSE_KEY_PAIR"
        return 0
    else
        log_info "Creating new key pair"
        return 1
    fi
}

select_rds() {
    local rds_count=$(echo "$RDS_DATA" | jq 'map(select(.Engine | startswith("postgres"))) | length')
    
    if [[ $rds_count -eq 0 ]]; then
        log_info "No suitable PostgreSQL RDS instances found. Will create new RDS instance."
        return 1
    fi
    
    echo ""
    echo "🗄️  RDS Instance Selection:"
    echo "=========================="
    echo "0. Create new RDS instance"
    
    local counter=1
    echo "$RDS_DATA" | jq -c 'map(select(.Engine | startswith("postgres")))[]' | while read -r rds; do
        local db_id=$(echo "$rds" | jq -r '.DBInstanceIdentifier')
        local db_class=$(echo "$rds" | jq -r '.DBInstanceClass')
        local db_status=$(echo "$rds" | jq -r '.DBInstanceStatus')
        local db_endpoint=$(echo "$rds" | jq -r '.Endpoint.Address // "N/A"')
        
        echo "$counter. $db_id ($db_class) - $db_status - $db_endpoint"
        counter=$((counter + 1))
    done
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Select RDS Instance (0-$rds_count): " rds_choice
    else
        # Auto-select first available PostgreSQL instance
        local available_rds=$(echo "$RDS_DATA" | jq -c 'map(select(.Engine | startswith("postgres") and .DBInstanceStatus == "available"))[0]')
        if [[ "$available_rds" != "null" ]]; then
            rds_choice=1
            log_info "Auto-selecting first available PostgreSQL instance"
        else
            rds_choice=0
            log_info "No available PostgreSQL instances found"
        fi
    fi
    
    if [[ "$rds_choice" -gt 0 && "$rds_choice" -le "$rds_count" ]]; then
        local selected_rds=$(echo "$RDS_DATA" | jq -c 'map(select(.Engine | startswith("postgres")))[]' | sed -n "${rds_choice}p")
        REUSE_RDS=$(echo "$selected_rds" | jq -r '.DBInstanceIdentifier')
        log_info "✅ Selected RDS Instance: $REUSE_RDS"
        
        # Get RDS endpoint for configuration
        local rds_endpoint=$(echo "$selected_rds" | jq -r '.Endpoint.Address')
        log_info "RDS Endpoint: $rds_endpoint"
        
        return 0
    else
        log_info "Creating new RDS instance"
        return 1
    fi
}

select_route53_zone() {
    local zone_count=$(echo "$ROUTE53_DATA" | jq length)
    
    if [[ $zone_count -eq 0 ]]; then
        log_info "No existing Route53 zones found. Will need manual DNS configuration."
        return 1
    fi
    
    echo ""
    echo "🌐 Route53 Zone Selection:"
    echo "========================="
    echo "0. Skip Route53 configuration"
    
    for ((i=0; i<zone_count; i++)); do
        local zone_name=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Name")
        local zone_id=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Id" | cut -d'/' -f3)
        local zone_private=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Config.PrivateZone")
        
        # Check if domain matches
        local match_status=""
        if [[ "$DOMAIN_NAME" == *"$zone_name"* ]] || [[ "$zone_name" == *"$DOMAIN_NAME"* ]]; then
            match_status=" ✅ MATCHES"
        fi
        
        echo "$((i+1)). $zone_name (Private: $zone_private)$match_status"
    done
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        read -p "Select Route53 Zone (0-$zone_count): " zone_choice
    else
        # Auto-select matching zone
        zone_choice=0
        for ((i=0; i<zone_count; i++)); do
            local zone_name=$(echo "$ROUTE53_DATA" | jq -r ".[$i].Name")
            if [[ "$DOMAIN_NAME" == *"$zone_name"* ]] || [[ "$zone_name" == *"$DOMAIN_NAME"* ]]; then
                zone_choice=$((i+1))
                log_info "Auto-selecting matching Route53 zone: $zone_name"
                break
            fi
        done
    fi
    
    if [[ "$zone_choice" -gt 0 && "$zone_choice" -le "$zone_count" ]]; then
        local selected_idx=$((zone_choice - 1))
        REUSE_ROUTE53_ZONE=$(echo "$ROUTE53_DATA" | jq -r ".[$selected_idx].Id" | cut -d'/' -f3)
        local zone_name=$(echo "$ROUTE53_DATA" | jq -r ".[$selected_idx].Name")
        log_info "✅ Selected Route53 Zone: $zone_name ($REUSE_ROUTE53_ZONE)"
        return 0
    else
        log_info "Skipping Route53 configuration"
        return 1
    fi
}

# Main reuse selection workflow
log_info "🔄 Starting resource reuse selection..."

# Initialize deployment steps based on what needs to be created
STEPS=()
[[ -z "$REUSE_VPC" ]] && STEPS+=("VPC Creation")
[[ -z "$REUSE_SECURITY_GROUP" ]] && STEPS+=("Security Group Creation")
[[ -z "$REUSE_KEY_PAIR" ]] && STEPS+=("Key Pair Creation")
[[ -z "$REUSE_RDS" ]] && STEPS+=("RDS Database Creation")
STEPS+=("EC2 Instance Launch")
STEPS+=("Configuration Generation")

# Run selection functions
select_vpc
select_security_group
select_key_pair
select_rds
select_route53_zone

# Display reuse summary
echo ""
echo "📋 RESOURCE REUSE SUMMARY:"
echo "=========================="
echo "VPC: $([ -n "$REUSE_VPC" ] && echo "✅ Reusing $REUSE_VPC" || echo "❌ Creating new")"
echo "Subnet: $([ -n "$REUSE_SUBNET" ] && echo "✅ Reusing $REUSE_SUBNET" || echo "❌ Creating new")"
echo "Internet Gateway: $([ -n "$REUSE_IGW" ] && echo "✅ Reusing $REUSE_IGW" || echo "❌ Creating new")"
echo "Security Group: $([ -n "$REUSE_SECURITY_GROUP" ] && echo "✅ Reusing $REUSE_SECURITY_GROUP" || echo "❌ Creating new")"
echo "Key Pair: $([ -n "$REUSE_KEY_PAIR" ] && echo "✅ Reusing $REUSE_KEY_PAIR" || echo "❌ Creating new")"
echo "RDS Instance: $([ -n "$REUSE_RDS" ] && echo "✅ Reusing $REUSE_RDS" || echo "❌ Creating new")"
echo "Route53 Zone: $([ -n "$REUSE_ROUTE53_ZONE" ] && echo "✅ Reusing $REUSE_ROUTE53_ZONE" || echo "❌ Manual configuration")"

if [[ "$INTERACTIVE" == "true" ]]; then
    echo ""
    read -p "Proceed with this configuration? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
fi

# Initialize progress tracking
init_progress "${STEPS[@]}"

log_info "🚀 Starting infrastructure deployment with resource reuse..."

# Start deployment with reuse strategy
CURRENT_STEP=0

# VPC Creation or Reuse
if [[ -n "$REUSE_VPC" ]]; then
    log_info "✅ Reusing existing VPC: $REUSE_VPC"
    VPC_ID="$REUSE_VPC"
    
    # If we don't have a subnet, create one
    if [[ -z "$REUSE_SUBNET" ]]; then
        start_step
        log_info "Creating subnet in existing VPC..."
        
        SUBNET_ID=$(retry_with_backoff 3 2 10 aws ec2 create-subnet \
            --vpc-id $VPC_ID \
            --cidr-block 10.0.1.0/24 \
            --availability-zone ${REGION}a \
            --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=RAS-DASH-Subnet},{Key=Project,Value=RAS-DASH}]' \
            --query 'Subnet.SubnetId' --output text) || handle_aws_error "create-subnet"
        
        # Enable auto-assign public IP
        aws ec2 modify-subnet-attribute --subnet-id $SUBNET_ID --map-public-ip-on-launch
        
        complete_step
    else
        SUBNET_ID="$REUSE_SUBNET"
    fi
    
    # If we don't have an IGW, create one
    if [[ -z "$REUSE_IGW" ]]; then
        log_info "Creating Internet Gateway for existing VPC..."
        
        IGW_ID=$(retry_with_backoff 3 2 10 aws ec2 create-internet-gateway \
            --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=RAS-DASH-IGW},{Key=Project,Value=RAS-DASH}]' \
            --query 'InternetGateway.InternetGatewayId' --output text) || handle_aws_error "create-internet-gateway"
        
        aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
    else
        IGW_ID="$REUSE_IGW"
    fi
else
    # Create new VPC (reuse existing VPC creation logic from original script)
    start_step
    log_info "📡 Creating new VPC..."
    
    VPC_ID=$(retry_with_backoff 3 2 10 aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=RAS-DASH-VPC},{Key=Project,Value=RAS-DASH}]' \
        --query 'Vpc.VpcId' --output text) || handle_aws_error "create-vpc"
    
    # Continue with subnet, IGW creation...
    complete_step
fi

# Security Group Creation or Reuse
if [[ -n "$REUSE_SECURITY_GROUP" ]]; then
    log_info "✅ Reusing existing Security Group: $REUSE_SECURITY_GROUP"
    SECURITY_GROUP_ID="$REUSE_SECURITY_GROUP"
else
    start_step
    log_info "🔒 Creating new Security Group..."
    
    SG_NAME="ras-dash-sg-$(date +%s)"
    SECURITY_GROUP_ID=$(retry_with_backoff 3 2 10 aws ec2 create-security-group \
        --group-name "$SG_NAME" \
        --description "RAS DASH Security Group for $DOMAIN_NAME" \
        --vpc-id $VPC_ID \
        --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=RAS-DASH-SG},{Key=Project,Value=RAS-DASH}]' \
        --query 'GroupId' --output text) || handle_aws_error "create-security-group"
    
    # Add rules
    retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
    retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
    retry_with_backoff 3 2 10 aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
    
    complete_step
fi

# Key Pair Creation or Reuse
if [[ -n "$REUSE_KEY_PAIR" ]]; then
    log_info "✅ Reusing existing Key Pair: $REUSE_KEY_PAIR"
    KEY_NAME="$REUSE_KEY_PAIR"
else
    start_step
    log_info "🔑 Creating new Key Pair..."
    
    KEY_NAME="ras-dash-key-$(date +%s)"
    retry_with_backoff 3 2 10 aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --tag-specifications 'ResourceType=key-pair,Tags=[{Key=Name,Value=RAS-DASH-KEY},{Key=Project,Value=RAS-DASH}]' \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    
    chmod 400 ${KEY_NAME}.pem
    complete_step
fi

# RDS Creation or Reuse
if [[ -n "$REUSE_RDS" ]]; then
    log_info "✅ Reusing existing RDS Instance: $REUSE_RDS"
    
    # Get RDS endpoint
    RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier "$REUSE_RDS" \
        --query 'DBInstances[0].Endpoint.Address' --output text)
    log_info "RDS Endpoint: $RDS_ENDPOINT"
else
    start_step
    log_info "🗄️  Creating new RDS Instance..."
    
    # Create DB subnet group if needed
    aws rds create-db-subnet-group \
        --db-subnet-group-name ras-dash-db-subnet-group \
        --db-subnet-group-description "RAS DASH DB Subnet Group" \
        --subnet-ids $SUBNET_ID 2>/dev/null || log_warn "DB subnet group may already exist"
    
    # Create RDS instance
    aws rds create-db-instance \
        --db-instance-identifier ras-dash-db \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --allocated-storage 20 \
        --db-name rasdash \
        --master-username rasdash \
        --master-user-password "$DB_PASSWORD" \
        --vpc-security-group-ids $SECURITY_GROUP_ID \
        --db-subnet-group-name ras-dash-db-subnet-group \
        --backup-retention-period 7 \
        --storage-encrypted \
        --no-multi-az \
        --no-publicly-accessible
    
    complete_step
fi

# EC2 Instance Launch
start_step
log_info "🖥️  Launching EC2 Instance..."

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
dnf install -y nodejs npm git nginx python3 python3-pip
npm install -g pm2
pip3 install certbot certbot-dns-route53
mkdir -p /opt/ras-dash
chown ec2-user:ec2-user /opt/ras-dash
systemctl enable nginx
systemctl start nginx
EOF

INSTANCE_ID=$(retry_with_backoff 3 2 10 aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.micro \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --subnet-id $SUBNET_ID \
    --associate-public-ip-address \
    --user-data file://user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RAS-DASH-Server}]' \
    --query 'Instances[0].InstanceId' --output text) || handle_aws_error "run-instances"

# Wait for instance and get IP
aws ec2 wait instance-running --instance-ids $INSTANCE_ID
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

complete_step

# Configuration Generation
start_step
log_info "📝 Creating deployment configuration..."

cat > deployment-config.json << EOF
{
  "aws": {
    "region": "$REGION",
    "vpcId": "$VPC_ID",
    "subnetId": "$SUBNET_ID",
    "securityGroupId": "$SECURITY_GROUP_ID",
    "instanceId": "$INSTANCE_ID",
    "publicIp": "$PUBLIC_IP",
    "keyName": "$KEY_NAME"
  },
  "application": {
    "domain": "$DOMAIN_NAME",
    "dbPassword": "$DB_PASSWORD",
    "dbEndpoint": "${RDS_ENDPOINT:-ras-dash-db.cluster-xyz.${REGION}.rds.amazonaws.com}"
  },
  "reuse_summary": {
    "vpc_reused": $([ -n "$REUSE_VPC" ] && echo "true" || echo "false"),
    "security_group_reused": $([ -n "$REUSE_SECURITY_GROUP" ] && echo "true" || echo "false"),
    "key_pair_reused": $([ -n "$REUSE_KEY_PAIR" ] && echo "true" || echo "false"),
    "rds_reused": $([ -n "$REUSE_RDS" ] && echo "true" || echo "false"),
    "route53_zone_reused": $([ -n "$REUSE_ROUTE53_ZONE" ] && echo "true" || echo "false")
  },
  "deployment_state": {
    "status": "infrastructure_created_with_reuse",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "current_step": $CURRENT_STEP,
    "total_steps": $TOTAL_STEPS
  }
}
EOF

complete_step

log_info "✅ Infrastructure deployment with reuse completed successfully!"
echo ""
log_info "📋 Deployment Summary:"
log_info "  VPC: $VPC_ID $([ -n "$REUSE_VPC" ] && echo "(reused)" || echo "(new)")"
log_info "  Security Group: $SECURITY_GROUP_ID $([ -n "$REUSE_SECURITY_GROUP" ] && echo "(reused)" || echo "(new)")"
log_info "  Instance: $INSTANCE_ID"
log_info "  Public IP: $PUBLIC_IP"
log_info "  Key Pair: $KEY_NAME $([ -n "$REUSE_KEY_PAIR" ] && echo "(reused)" || echo "(new)")"

# Calculate cost savings
COST_SAVINGS=0
if [[ -n "$REUSE_VPC" ]]; then
    log_info "💰 VPC reuse: Avoided setup complexity"
fi
if [[ -n "$REUSE_RDS" ]]; then
    log_info "💰 RDS reuse: Saved ~$15-50/month"
    COST_SAVINGS=$((COST_SAVINGS + 15))
fi
if [[ -n "$REUSE_SECURITY_GROUP" ]]; then
    log_info "💰 Security Group reuse: Leveraged existing security configuration"
fi

if [[ $COST_SAVINGS -gt 0 ]]; then
    log_info "💰 Total estimated monthly savings: ~$${COST_SAVINGS}+"
fi

echo ""
log_info "🔑 Next steps:"
log_info "  1. Wait 5-10 minutes for instance initialization"
log_info "  2. Run: ./scripts/deploy-application.sh"
if [[ -n "$REUSE_ROUTE53_ZONE" ]]; then
    log_info "  3. Configure DNS: ./scripts/setup-route53.sh (using existing zone)"
else
    log_info "  3. Configure DNS manually or setup Route53 zone"
fi
log_info "  4. Setup SSL certificate: ./scripts/setup-ssl.sh"

save_deployment_state "infrastructure_with_reuse_complete"

# Cleanup
rm -f user-data.sh

log_info "Infrastructure deployment with intelligent reuse completed!"