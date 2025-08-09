#!/bin/bash

# SSL Configuration Script for CYPHER Dashboard
# This script configures Let's Encrypt SSL certificates using Certbot

set -euo pipefail

# Configuration
DOMAIN="rasdash.dev.com"
EMAIL="admin@rasdash.dev.com"
NGINX_CONF="/etc/nginx/conf.d/cypher-dashboard.conf"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install Certbot
install_certbot() {
    log_step "Installing Certbot..."
    
    # Install EPEL repository (required for Certbot on Amazon Linux)
    yum install -y epel-release || amazon-linux-extras install epel -y
    
    # Install Certbot and Nginx plugin
    yum install -y certbot python3-certbot-nginx
    
    log_info "Certbot installed successfully"
}

# Verify domain accessibility
verify_domain_access() {
    log_step "Verifying domain accessibility..."
    
    # Test if domain resolves to this server
    DOMAIN_IP=$(dig +short "$DOMAIN" @8.8.8.8)
    SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
        log_error "Domain $DOMAIN does not resolve to this server"
        log_error "Domain resolves to: $DOMAIN_IP"
        log_error "Server IP: $SERVER_IP"
        log_error "Please ensure DNS is properly configured before running SSL setup"
        exit 1
    fi
    
    log_info "Domain verification passed: $DOMAIN -> $SERVER_IP"
    
    # Test HTTP accessibility
    if curl -s --connect-timeout 10 "http://$DOMAIN/health" > /dev/null; then
        log_info "HTTP accessibility test passed"
    else
        log_warn "HTTP accessibility test failed - continuing anyway"
    fi
}

# Create temporary Nginx configuration for certificate validation
create_temp_nginx_config() {
    log_step "Creating temporary Nginx configuration..."
    
    # Backup existing configuration
    if [[ -f "$NGINX_CONF" ]]; then
        cp "$NGINX_CONF" "${NGINX_CONF}.backup"
        log_info "Backed up existing Nginx configuration"
    fi
    
    # Create temporary configuration for certificate validation
    cat > "$NGINX_CONF" << EOF
# Temporary configuration for SSL certificate validation
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Serve health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
    
    # Temporary redirect for other requests
    location / {
        return 200 'SSL certificate setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    
    log_info "Temporary Nginx configuration created"
}

# Obtain SSL certificate
obtain_ssl_certificate() {
    log_step "Obtaining SSL certificate from Let's Encrypt..."
    
    # Create webroot directory
    mkdir -p /var/www/html
    
    # Obtain certificate using webroot method
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN" \
        --non-interactive
    
    if [[ $? -eq 0 ]]; then
        log_info "✅ SSL certificate obtained successfully"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Create production Nginx configuration with SSL
create_ssl_nginx_config() {
    log_step "Creating production Nginx configuration with SSL..."
    
    cat > "$NGINX_CONF" << EOF
# CYPHER Dashboard Nginx Configuration with SSL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Serve static files
    location / {
        root /opt/cypher-dashboard/client/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
    
    # Let's Encrypt renewal
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
}
EOF
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    
    log_info "Production Nginx configuration with SSL created"
}

# Setup automatic certificate renewal
setup_auto_renewal() {
    log_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Automatic SSL certificate renewal for CYPHER Dashboard
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Check for renewal twice daily
0 */12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    # Test renewal process
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        log_info "✅ Automatic renewal setup successful"
    else
        log_warn "Automatic renewal test failed - manual intervention may be required"
    fi
}

# Test SSL configuration
test_ssl_configuration() {
    log_step "Testing SSL configuration..."
    
    # Test HTTPS connectivity
    if curl -s --connect-timeout 10 "https://$DOMAIN/health" > /dev/null; then
        log_info "✅ HTTPS connectivity test passed"
    else
        log_error "HTTPS connectivity test failed"
        return 1
    fi
    
    # Test SSL certificate
    SSL_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    if [[ -n "$SSL_EXPIRY" ]]; then
        log_info "✅ SSL certificate valid until: $SSL_EXPIRY"
    else
        log_warn "Could not verify SSL certificate expiry"
    fi
    
    # Test HTTP to HTTPS redirect
    REDIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/")
    if [[ "$REDIRECT_STATUS" == "301" ]]; then
        log_info "✅ HTTP to HTTPS redirect working"
    else
        log_warn "HTTP to HTTPS redirect may not be working (status: $REDIRECT_STATUS)"
    fi
}

# Display final information
display_final_info() {
    log_step "SSL Configuration Summary"
    
    echo ""
    echo "============================================"
    echo "     CYPHER Dashboard SSL Configuration"
    echo "============================================"
    echo "Domain: $DOMAIN"
    echo "SSL Certificate: Let's Encrypt"
    echo "Certificate Location: /etc/letsencrypt/live/$DOMAIN/"
    echo "Auto-renewal: Enabled (twice daily check)"
    echo ""
    echo "Access URLs:"
    echo "  HTTPS: https://$DOMAIN"
    echo "  HTTP: http://$DOMAIN (redirects to HTTPS)"
    echo ""
    echo "Certificate Management:"
    echo "  Check status: sudo certbot certificates"
    echo "  Manual renewal: sudo certbot renew"
    echo "  Test renewal: sudo certbot renew --dry-run"
    echo ""
    echo "Next Steps:"
    echo "1. Test the application:"
    echo "   curl https://$DOMAIN/health"
    echo "   curl https://$DOMAIN/api/health"
    echo ""
    echo "2. Access the dashboard:"
    echo "   https://$DOMAIN"
    echo ""
}

# Main function
main() {
    log_info "🔒 Starting SSL configuration for CYPHER Dashboard"
    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"
    
    check_root
    install_certbot
    verify_domain_access
    create_temp_nginx_config
    obtain_ssl_certificate
    create_ssl_nginx_config
    setup_auto_renewal
    test_ssl_configuration
    display_final_info
    
    log_info "✅ SSL configuration completed successfully!"
}

# Run main function
main "$@"
