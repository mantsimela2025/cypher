#!/bin/bash

# CYPHER Dashboard Deployment Script for Existing RAS DASH Instance
# This script deploys the CYPHER Dashboard to your existing AWS infrastructure

set -euo pipefail

# Configuration based on your existing AWS environment
INSTANCE_ID="i-04a41343a3f51559a"
INSTANCE_NAME="RASDASH"
PUBLIC_IP="34.230.172.229"
PRIVATE_IP="10.100.1.144"
VPC_ID="vpc-de10a4b9"
DOMAIN="rasdash.dev.com"
HOSTED_ZONE_ID="Z07201002RI5R8QT9OIF7"
DB_ENDPOINT="rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com"

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
    
    # Check if we can access the instance
    if ! aws ec2 describe-instances --instance-ids "$INSTANCE_ID" &> /dev/null; then
        log_error "Cannot access instance $INSTANCE_ID. Check permissions."
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Verify instance is running
verify_instance() {
    log_step "Verifying RAS DASH instance status..."
    
    INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
        --query "Reservations[0].Instances[0].State.Name" --output text)
    
    if [ "$INSTANCE_STATE" != "running" ]; then
        log_error "Instance $INSTANCE_ID is not running (state: $INSTANCE_STATE)"
        log_info "Please start the instance and try again"
        exit 1
    fi
    
    log_info "Instance $INSTANCE_ID is running"
    log_info "Public IP: $PUBLIC_IP"
    log_info "Private IP: $PRIVATE_IP"
}

# Create security group rules for web traffic
configure_security_groups() {
    log_step "Configuring security groups for web traffic..."
    
    # Get the security groups attached to the instance
    SECURITY_GROUPS=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
        --query "Reservations[0].Instances[0].SecurityGroups[*].GroupId" --output text)
    
    log_info "Instance security groups: $SECURITY_GROUPS"
    
    # For each security group, ensure web ports are open
    for SG_ID in $SECURITY_GROUPS; do
        log_info "Configuring security group: $SG_ID"
        
        # Add HTTP (80) rule if not exists
        if ! aws ec2 describe-security-groups --group-ids "$SG_ID" \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`80\`]" --output text | grep -q "80"; then
            log_info "Adding HTTP (80) rule to $SG_ID"
            aws ec2 authorize-security-group-ingress \
                --group-id "$SG_ID" \
                --protocol tcp \
                --port 80 \
                --cidr 0.0.0.0/0 || log_warn "HTTP rule may already exist"
        fi
        
        # Add HTTPS (443) rule if not exists
        if ! aws ec2 describe-security-groups --group-ids "$SG_ID" \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`443\`]" --output text | grep -q "443"; then
            log_info "Adding HTTPS (443) rule to $SG_ID"
            aws ec2 authorize-security-group-ingress \
                --group-id "$SG_ID" \
                --protocol tcp \
                --port 443 \
                --cidr 0.0.0.0/0 || log_warn "HTTPS rule may already exist"
        fi
        
        # Add custom app ports (3000, 3001) for development
        for PORT in 3000 3001; do
            if ! aws ec2 describe-security-groups --group-ids "$SG_ID" \
                --query "SecurityGroups[0].IpPermissions[?FromPort==\`$PORT\`]" --output text | grep -q "$PORT"; then
                log_info "Adding port $PORT rule to $SG_ID"
                aws ec2 authorize-security-group-ingress \
                    --group-id "$SG_ID" \
                    --protocol tcp \
                    --port "$PORT" \
                    --cidr 0.0.0.0/0 || log_warn "Port $PORT rule may already exist"
            fi
        done
    done
    
    log_info "Security group configuration completed"
}

# Create deployment package
create_deployment_package() {
    log_step "Creating deployment package..."
    
    # Create temporary deployment directory
    DEPLOY_DIR="/tmp/cypher-deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DEPLOY_DIR"
    
    log_info "Deployment directory: $DEPLOY_DIR"
    
    # Copy application files (excluding node_modules and other large directories)
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' \
        --exclude='build' --exclude='logs' --exclude='*.log' \
        ./ "$DEPLOY_DIR/"
    
    # Create production environment file
    cat > "$DEPLOY_DIR/.env.production" << EOF
# Production Environment Configuration for CYPHER Dashboard
NODE_ENV=production
PORT=3001
CLIENT_PORT=3000

# Database Configuration (using existing RDS)
DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@${DB_ENDPOINT}:5432/rasdashdev01
PGHOST=${DB_ENDPOINT}
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
CORS_ORIGIN=https://${DOMAIN},http://${DOMAIN},http://${PUBLIC_IP}:3000

# Domain Configuration
DOMAIN=${DOMAIN}
FRONTEND_URL=https://${DOMAIN}

# Email Configuration
EMAIL_FROM=noreply@${DOMAIN}
EMAIL_FROM_NAME=CYPHER Dashboard
ADMIN_EMAIL=admin@${DOMAIN}

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
EOF

    log_info "Deployment package created at: $DEPLOY_DIR"
    echo "$DEPLOY_DIR"
}

# Main deployment function
main() {
    log_info "🚀 Starting CYPHER Dashboard deployment to RAS DASH instance"
    log_info "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
    log_info "Domain: $DOMAIN"
    log_info "Database: $DB_ENDPOINT"
    
    check_prerequisites
    verify_instance
    configure_security_groups
    
    DEPLOY_DIR=$(create_deployment_package)
    
    log_info "✅ Deployment preparation completed!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Copy deployment package to instance:"
    log_info "   scp -r $DEPLOY_DIR ec2-user@$PUBLIC_IP:/home/ec2-user/cypher-dashboard"
    log_info ""
    log_info "2. SSH to instance and run deployment:"
    log_info "   ssh ec2-user@$PUBLIC_IP"
    log_info "   cd /home/ec2-user/cypher-dashboard"
    log_info "   ./scripts/aws-deployment/install-on-instance.sh"
    log_info ""
    log_info "3. Configure DNS:"
    log_info "   ./scripts/aws-deployment/configure-dns.sh"
}

# Run main function
main "$@"
