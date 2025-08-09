#!/bin/bash
# EC2 Deployment Script for CYPHER Application

echo "🚀 Starting CYPHER deployment..."

# Set variables
APP_DIR="/opt/cypher"
BACKUP_DIR="/opt/cypher-backup-$(date +%Y%m%d-%H%M%S)"

# Create backup if app exists
if [ -d "$APP_DIR" ]; then
    echo "📦 Creating backup..."
    sudo cp -r $APP_DIR $BACKUP_DIR
fi

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown ec2-user:ec2-user $APP_DIR

# Copy files
echo "📁 Copying application files..."
cp -r * $APP_DIR/

# Set permissions
sudo chown -R ec2-user:ec2-user $APP_DIR

# Install dependencies
echo "📦 Installing API dependencies..."
cd $APP_DIR/api
npm ci --production

echo "📦 Building client..."
cd $APP_DIR/client
npm ci
npm run build

# Copy environment file
echo "🔧 Setting up environment..."
cd $APP_DIR
cp .env.production api/.env

# Install PM2 if not exists
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Create PM2 ecosystem file
echo "📝 Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cypher-api',
    script: './api/server.js',
    cwd: '/opt/cypher',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/cypher/api-error.log',
    out_file: '/var/log/cypher/api-out.log',
    log_file: '/var/log/cypher/api-combined.log'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/cypher
sudo chown ec2-user:ec2-user /var/log/cypher

# Start/restart application
echo "🚀 Starting application..."
pm2 delete cypher-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup nginx if not configured
if [ ! -f /etc/nginx/sites-available/cypher ]; then
    echo "🌐 Configuring Nginx..."
    sudo tee /etc/nginx/sites-available/cypher > /dev/null << 'EOF'
server {
    listen 80;
    server_name rasdash.dev.com;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static files
    location / {
        root /opt/cypher/client/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/cypher /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

# Health check
echo "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:3001/health; then
    echo "✅ Deployment successful!"
    echo "🌐 Application available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
else
    echo "❌ Health check failed!"
    exit 1
fi
