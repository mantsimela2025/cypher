# 🚀 **CYPHER Dashboard AWS Deployment Guide**

## **Deployment Overview**

This guide provides step-by-step instructions for deploying the CYPHER Dashboard to your existing AWS infrastructure, specifically targeting your RAS DASH EC2 instance.

### **✅ Current Infrastructure Assessment**

Based on your AWS environment scan, you have excellent infrastructure already in place:

- **AWS Account**: 250467954113 (jharrison user)
- **VPC**: `vpc-de10a4b9` (ras_internal) - 10.100.0.0/16
- **Target Instance**: `i-04a41343a3f51559a` (RASDASH) - m5.large
- **Database**: `rasdash-dev-public` (PostgreSQL) - **Already configured!**
- **Domain**: `rasdash.dev.com` (Route53 hosted zone exists)
- **Security Groups**: Multiple existing groups for RDS and EC2 connectivity

---

## **🎯 Deployment Strategy**

We'll deploy CYPHER Dashboard using your existing infrastructure to minimize costs and complexity:

1. **Reuse existing RAS DASH instance** (i-04a41343a3f51559a)
2. **Leverage existing PostgreSQL database** (rasdash-dev-public)
3. **Use existing Route53 domain** (rasdash.dev.com)
4. **Configure security groups** for web traffic
5. **Set up SSL certificates** with Let's Encrypt

---

## **📋 Prerequisites**

### **Local Machine Requirements:**
- AWS CLI configured with your credentials
- SSH access to your EC2 instance
- Git (for cloning/updating code)

### **EC2 Instance Requirements:**
- Instance `i-04a41343a3f51559a` must be running
- SSH key pair access
- Security groups allowing HTTP/HTTPS traffic

---

## **🚀 Deployment Steps**

### **Step 1: Prepare Local Environment**

1. **Verify AWS CLI access:**
```bash
aws sts get-caller-identity
```

2. **Check instance status:**
```bash
aws ec2 describe-instances --instance-ids i-04a41343a3f51559a --query "Reservations[0].Instances[0].State.Name"
```

3. **Ensure instance is running:**
```bash
# If stopped, start the instance
aws ec2 start-instances --instance-ids i-04a41343a3f51559a
```

### **Step 2: Run Deployment Preparation Script**

```bash
# Make scripts executable (if on Linux/Mac)
chmod +x scripts/aws-deployment/*.sh

# Run the deployment preparation script
./scripts/aws-deployment/deploy-to-rasdash-instance.sh
```

This script will:
- ✅ Verify AWS credentials and permissions
- ✅ Check instance status
- ✅ Configure security groups for web traffic (ports 80, 443, 3000, 3001)
- ✅ Create deployment package with production configuration
- ✅ Generate next-step instructions

### **Step 3: Copy Files to EC2 Instance**

```bash
# Copy deployment package to instance (replace with actual path from script output)
scp -r /tmp/cypher-deploy-YYYYMMDD-HHMMSS ec2-user@34.230.172.229:/home/ec2-user/cypher-dashboard

# Or use rsync for better performance
rsync -avz --exclude='node_modules' --exclude='.git' \
  ./ ec2-user@34.230.172.229:/home/ec2-user/cypher-dashboard/
```

### **Step 4: SSH to Instance and Install**

```bash
# SSH to your RAS DASH instance
ssh ec2-user@34.230.172.229

# Switch to root for installation
sudo su -

# Navigate to deployment directory
cd /home/ec2-user/cypher-dashboard

# Run the installation script
./scripts/aws-deployment/install-on-instance.sh
```

The installation script will:
- ✅ Install Node.js 20.x, Docker, Nginx, PostgreSQL client
- ✅ Create application user and directories
- ✅ Install application dependencies
- ✅ Configure production environment
- ✅ Set up Nginx reverse proxy
- ✅ Create systemd service
- ✅ Test database connection
- ✅ Start all services

### **Step 5: Configure DNS**

```bash
# Run DNS configuration script (from your local machine)
./scripts/aws-deployment/configure-dns.sh
```

This script will:
- ✅ Create A record: `rasdash.dev.com` → `34.230.172.229`
- ✅ Create CNAME record: `www.rasdash.dev.com` → `rasdash.dev.com`
- ✅ Verify DNS propagation
- ✅ Test HTTP connectivity

### **Step 6: Configure SSL Certificate**

```bash
# SSH back to the instance
ssh ec2-user@34.230.172.229

# Run SSL configuration (as root)
sudo ./scripts/aws-deployment/configure-ssl.sh
```

This script will:
- ✅ Install Certbot (Let's Encrypt client)
- ✅ Verify domain accessibility
- ✅ Obtain SSL certificate for `rasdash.dev.com` and `www.rasdash.dev.com`
- ✅ Configure Nginx with SSL
- ✅ Set up automatic certificate renewal
- ✅ Test HTTPS connectivity

---

## **🔧 Configuration Details**

### **Environment Configuration**

The deployment uses a production environment file with:

```bash
# Database (using your existing RDS)
DATABASE_URL=postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01

# Domain
DOMAIN=rasdash.dev.com
FRONTEND_URL=https://rasdash.dev.com

# Security
NODE_ENV=production
JWT_SECRET=<your-existing-secret>
ENCRYPTION_KEY=<your-existing-key>

# API Keys (copied from your existing .env)
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
# ... other API keys
```

### **Service Architecture**

```
Internet → Route53 (rasdash.dev.com) → EC2 Instance (34.230.172.229)
                                           ↓
                                       Nginx (80/443)
                                           ↓
                                   CYPHER Dashboard
                                    ↙            ↘
                            API Server        Static Files
                            (Port 3001)       (React Build)
                                ↓
                        PostgreSQL RDS
                    (rasdash-dev-public)
```

### **Security Groups Configuration**

The deployment script automatically configures your security groups to allow:
- **Port 22**: SSH access
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic
- **Port 3000**: Development access (optional)
- **Port 3001**: API access (optional)

---

## **✅ Verification Steps**

### **1. Service Status Check**
```bash
# On the EC2 instance
sudo systemctl status cypher-dashboard
sudo systemctl status nginx
```

### **2. Health Check**
```bash
# Test API health
curl https://rasdash.dev.com/health
curl https://rasdash.dev.com/api/health

# Test from local machine
curl -I https://rasdash.dev.com
```

### **3. Database Connection**
```bash
# On the EC2 instance
cd /opt/cypher-dashboard/api
sudo -u cypher node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT NOW()', (err, res) => {
    console.log(err ? 'Error:' + err : 'Success:' + res.rows[0].now);
    process.exit(0);
  });
"
```

### **4. SSL Certificate Check**
```bash
# Check certificate details
sudo certbot certificates

# Test SSL
openssl s_client -servername rasdash.dev.com -connect rasdash.dev.com:443 -brief
```

---

## **🔄 Maintenance Commands**

### **Application Management**
```bash
# Restart application
sudo systemctl restart cypher-dashboard

# View logs
sudo journalctl -u cypher-dashboard -f

# Update application
cd /opt/cypher-dashboard
sudo -u cypher git pull
sudo -u cypher npm install --production
sudo systemctl restart cypher-dashboard
```

### **SSL Certificate Management**
```bash
# Check certificate status
sudo certbot certificates

# Manual renewal
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### **Nginx Management**
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## **🚨 Troubleshooting**

### **Common Issues and Solutions**

#### **1. Service Won't Start**
```bash
# Check logs
sudo journalctl -u cypher-dashboard -n 50

# Check environment file
sudo cat /opt/cypher-dashboard/api/.env

# Test database connection manually
cd /opt/cypher-dashboard/api && sudo -u cypher node -e "console.log(process.env.DATABASE_URL)"
```

#### **2. SSL Certificate Issues**
```bash
# Check domain resolution
dig rasdash.dev.com

# Test HTTP access first
curl -I http://rasdash.dev.com

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### **3. Database Connection Issues**
```bash
# Test from instance
psql "postgresql://rasdashadmin:RasDash2025\$@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdev01" -c "SELECT NOW();"

# Check security groups
aws ec2 describe-security-groups --group-ids <your-sg-id>
```

---

## **📊 Cost Optimization**

By using your existing infrastructure, you're saving approximately:
- **EC2 Instance**: $0/month (reusing existing)
- **RDS Database**: $0/month (reusing existing)
- **Route53 Hosted Zone**: $0/month (reusing existing)
- **VPC/Networking**: $0/month (reusing existing)

**Total Monthly Savings**: ~$50-80/month compared to new infrastructure!

---

## **🎉 Success!**

Once deployment is complete, your CYPHER Dashboard will be accessible at:
- **Primary URL**: https://rasdash.dev.com
- **Alternative**: https://www.rasdash.dev.com

The application will be running with:
- ✅ Production-grade security (HTTPS, security headers)
- ✅ Automatic SSL certificate renewal
- ✅ High availability (systemd service management)
- ✅ Optimized performance (Nginx reverse proxy, gzip compression)
- ✅ Comprehensive logging and monitoring
