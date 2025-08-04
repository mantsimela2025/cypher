#!/bin/bash
# SSL Setup Script for CYPHER Application
# This script sets up Let's Encrypt SSL certificates for your domains

set -e

echo "🔒 Setting up SSL certificates for CYPHER application..."

# Install certbot
echo "📦 Installing Certbot..."
sudo yum install -y epel-release
sudo yum install -y certbot python3-certbot-nginx

# Stop nginx temporarily
echo "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Obtain SSL certificates
echo "🔐 Obtaining SSL certificates..."

# Production domain
sudo certbot certonly --standalone -d rasdash.dev.com --email admin@rasdash.dev.com --agree-tos --non-interactive

# Staging domain
sudo certbot certonly --standalone -d staging.rasdash.dev.com --email admin@rasdash.dev.com --agree-tos --non-interactive

# Development domain
sudo certbot certonly --standalone -d dev.rasdash.dev.com --email admin@rasdash.dev.com --agree-tos --non-interactive

# Update Nginx configuration with SSL
echo "🌐 Updating Nginx configuration with SSL..."
sudo tee /etc/nginx/conf.d/cypher-ssl.conf > /dev/null << 'EOF'
# Production - HTTP to HTTPS redirect
server {
    listen 80;
    server_name rasdash.dev.com;
    return 301 https://$server_name$request_uri;
}

# Production - HTTPS
server {
    listen 443 ssl http2;
    server_name rasdash.dev.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/rasdash.dev.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rasdash.dev.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://rasdash.dev.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # Client application
    location / {
        root /opt/cypher/client;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Staging - HTTP to HTTPS redirect
server {
    listen 80;
    server_name staging.rasdash.dev.com;
    return 301 https://$server_name$request_uri;
}

# Staging - HTTPS
server {
    listen 443 ssl http2;
    server_name staging.rasdash.dev.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.rasdash.dev.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.rasdash.dev.com/privkey.pem;
    
    # SSL Security Settings (same as production)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Client application
    location / {
        root /opt/cypher-staging/client;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}

# Development - HTTP to HTTPS redirect
server {
    listen 80;
    server_name dev.rasdash.dev.com;
    return 301 https://$server_name$request_uri;
}

# Development - HTTPS
server {
    listen 443 ssl http2;
    server_name dev.rasdash.dev.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dev.rasdash.dev.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.rasdash.dev.com/privkey.pem;
    
    # SSL Security Settings (same as production)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Client application
    location / {
        root /opt/cypher-dev/client;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
EOF

# Remove the old HTTP-only configuration
sudo rm -f /etc/nginx/conf.d/cypher.conf

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx"; } | sudo crontab -

echo "✅ SSL setup completed!"
echo ""
echo "🔒 Your domains are now secured with SSL:"
echo "- https://rasdash.dev.com"
echo "- https://staging.rasdash.dev.com"
echo "- https://dev.rasdash.dev.com"
echo ""
echo "📋 Certificate renewal is set up automatically."
echo "🔍 You can check certificate status with: sudo certbot certificates"
