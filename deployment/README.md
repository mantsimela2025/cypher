# CYPHER Application CI/CD Deployment Guide

This guide will help you set up a complete CI/CD pipeline from GitLab to your AWS EC2 instance.

## 🏗️ Infrastructure Overview

### Current AWS Setup:
- **EC2 Instance**: `i-04a41343a3f51559a` (m5.large)
- **Public IP**: `34.230.172.229`
- **Domain**: `rasdash.dev.com`
- **Database**: AWS RDS PostgreSQL
- **Region**: `us-east-1`

### Deployment Environments:
- **Production**: `https://rasdash.dev.com` (Port 3001)
- **Staging**: `https://staging.rasdash.dev.com` (Port 3002)
- **Development**: `https://dev.rasdash.dev.com` (Port 3003)

## 🚀 Quick Start Deployment

### Step 1: Setup DNS Records
```bash
# Make the script executable
chmod +x deployment/setup-dns.sh

# Run DNS setup
./deployment/setup-dns.sh
```

### Step 2: Prepare EC2 Instance
```bash
# Copy the setup script to your EC2 instance
scp -i jaharrison-keypair.pem deployment/ec2-setup.sh ec2-user@34.230.172.229:~/

# SSH into your EC2 instance
ssh -i jaharrison-keypair.pem ec2-user@34.230.172.229

# Run the setup script
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### Step 3: Configure GitLab Variables
Follow the detailed guide in `deployment/gitlab-variables-setup.md` to configure all required variables in GitLab.

### Step 4: Deploy
```bash
# Commit and push the CI/CD configuration
git add .gitlab-ci.yml deployment/
git commit -m "Add CI/CD pipeline configuration"
git push origin main

# Create and push to dev branch for first deployment
git checkout -b dev
git push origin dev
```

## 📁 File Structure

```
deployment/
├── README.md                    # This file
├── gitlab-variables-setup.md    # GitLab CI/CD variables guide
├── ec2-setup.sh                # EC2 server preparation script
├── setup-dns.sh               # DNS configuration script
└── nginx-ssl-setup.sh          # SSL certificate setup (optional)
```

## 🔄 CI/CD Pipeline Workflow

### Branch Strategy:
```
dev → staging → main
 ↓       ↓        ↓
Auto   Auto   Manual
```

### Pipeline Stages:
1. **Test**: Run unit tests and linting
2. **Build**: Create production builds
3. **Deploy**: Deploy to respective environments

### Deployment Triggers:
- **`dev` branch**: Auto-deploy to development environment
- **`staging` branch**: Auto-deploy to staging environment  
- **`main` branch**: Manual deploy to production environment

## 🌐 Environment URLs

After successful deployment, your application will be available at:

- **Development**: http://dev.rasdash.dev.com
- **Staging**: http://staging.rasdash.dev.com
- **Production**: http://rasdash.dev.com

## 🔧 Service Management

### Check Service Status:
```bash
# Production
sudo systemctl status cypher-api
sudo systemctl status cypher-client

# Staging
sudo systemctl status cypher-staging-api
sudo systemctl status cypher-staging-client

# Development
sudo systemctl status cypher-dev-api
sudo systemctl status cypher-dev-client
```

### View Logs:
```bash
# Production logs
sudo journalctl -u cypher-api -f

# Staging logs
sudo journalctl -u cypher-staging-api -f

# Development logs
sudo journalctl -u cypher-dev-api -f
```

### Restart Services:
```bash
# Production
sudo systemctl restart cypher-api
sudo systemctl restart cypher-client

# Staging
sudo systemctl restart cypher-staging-api
sudo systemctl restart cypher-staging-client

# Development
sudo systemctl restart cypher-dev-api
sudo systemctl restart cypher-dev-client
```

## 🔍 Health Checks

### API Health Endpoints:
- Production: http://rasdash.dev.com/health
- Staging: http://staging.rasdash.dev.com/health
- Development: http://dev.rasdash.dev.com/health

### Manual Health Check:
```bash
# Check from EC2 instance
curl http://localhost:3001/health  # Production
curl http://localhost:3002/health  # Staging
curl http://localhost:3003/health  # Development
```

## 🔒 Security Considerations

### SSL Certificates (Recommended)
To enable HTTPS, you'll need to:
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update Nginx configuration
3. Update CORS origins in environment variables

### Firewall Configuration
The setup script configures firewall rules for:
- HTTP (port 80)
- HTTPS (port 443)
- API ports (3001, 3002, 3003)

## 🐛 Troubleshooting

### Common Issues:

#### 1. Deployment Fails
```bash
# Check GitLab CI/CD logs
# Verify all variables are set correctly
# Check EC2 instance connectivity
```

#### 2. Service Won't Start
```bash
# Check service logs
sudo journalctl -u cypher-api -n 50

# Check if port is in use
sudo netstat -tlnp | grep :3001

# Check environment file
cat /opt/cypher/api/.env
```

#### 3. Database Connection Issues
```bash
# Test database connectivity from EC2
cd /opt/cypher/api
node -e "
const { testConnection } = require('./src/db');
testConnection().then(() => console.log('DB OK')).catch(console.error);
"
```

#### 4. DNS Not Resolving
```bash
# Check DNS propagation
dig rasdash.dev.com
dig staging.rasdash.dev.com
dig dev.rasdash.dev.com

# Verify Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id Z07201002RI5R8QT9OIF7
```

## 📊 Monitoring

### Application Logs:
```bash
# View all application logs
sudo journalctl -u cypher-* -f

# View specific service logs
sudo journalctl -u cypher-api -f --since "1 hour ago"
```

### System Resources:
```bash
# Check system resources
htop
df -h
free -h

# Check application processes
ps aux | grep node
```

## 🔄 Updates and Maintenance

### Updating the Application:
1. Make changes in your local repository
2. Push to the appropriate branch (`dev`, `staging`, or `main`)
3. GitLab CI/CD will automatically deploy

### Database Migrations:
Database migrations run automatically during production deployments.

### Backup Strategy:
- Database: AWS RDS automated backups
- Application: S3 backup scripts (already configured)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitLab CI/CD logs
3. Check EC2 instance logs
4. Verify all configuration variables

## ✅ Deployment Checklist

- [ ] DNS records configured
- [ ] EC2 instance prepared
- [ ] GitLab variables configured
- [ ] SSH access working
- [ ] Database connectivity verified
- [ ] First deployment successful
- [ ] All environments accessible
- [ ] Health checks passing
- [ ] SSL certificates installed (optional)
- [ ] Monitoring configured
