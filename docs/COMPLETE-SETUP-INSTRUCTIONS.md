# 🚀 Complete CYPHER EC2 Setup Instructions

## 📋 **One-Command Complete Setup**

Your complete CYPHER environment setup script is ready! This single script includes **ALL** the sudo commands and configurations needed.

---

## 🎯 **Quick Setup (Recommended)**

### **Step 1: Connect to EC2 Instance**
1. **AWS Console** → **EC2** → **Instances**
2. **Select your instance** → **Connect** → **EC2 Instance Connect**

### **Step 2: Run Complete Setup Script**
```bash
# Download and run the complete setup script
curl -s https://cypher-deployment.s3.amazonaws.com/complete-cypher-setup.sh | bash
```

**OR download first, then run:**
```bash
# Download the script
wget https://cypher-deployment.s3.amazonaws.com/complete-cypher-setup.sh

# Make it executable
chmod +x complete-cypher-setup.sh

# Run the complete setup
./complete-cypher-setup.sh
```

---

## 🛠️ **What This Script Does**

### **System Setup:**
- ✅ Updates all system packages
- ✅ Installs Node.js v20.x + npm
- ✅ Installs development tools (git, curl, wget, etc.)
- ✅ Installs Python3 + pip
- ✅ Installs PostgreSQL client

### **Web Server & Process Management:**
- ✅ Installs and configures Nginx
- ✅ Installs PM2 process manager
- ✅ Creates Nginx configuration for CYPHER
- ✅ Sets up PM2 startup scripts

### **Security & Monitoring:**
- ✅ Installs and configures firewall
- ✅ Installs fail2ban (intrusion prevention)
- ✅ Installs SSL tools (Certbot)
- ✅ Installs AWS CloudWatch agent
- ✅ Configures log rotation

### **Application Environment:**
- ✅ Creates application directories (`/opt/cypher`)
- ✅ Sets proper permissions
- ✅ Creates log directories (`/var/log/cypher`)

### **Helper Scripts Created:**
- ✅ `~/system-status.sh` - Check system status
- ✅ `~/deploy-cypher.sh` - Deploy CYPHER application
- ✅ `~/setup-ssl.sh` - Set up SSL certificates

---

## 🎯 **After Setup Completion**

### **Step 1: Configure AWS Credentials**
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### **Step 2: Deploy CYPHER Application**
```bash
./deploy-cypher.sh
```

### **Step 3: Check System Status**
```bash
./system-status.sh
```

### **Step 4: Access Your Application**
- **Health Check**: `http://YOUR-EC2-IP/health`
- **Application**: `http://YOUR-EC2-IP/`
- **API**: `http://YOUR-EC2-IP/api/v1/`

---

## 🔧 **Manual Commands Reference**

If you need to run individual commands, here are the key ones:

### **Service Management:**
```bash
# Check service status
sudo systemctl status nginx
sudo systemctl status fail2ban
pm2 status

# Restart services
sudo systemctl restart nginx
pm2 restart cypher-api

# View logs
sudo journalctl -u nginx -f
pm2 logs cypher-api
```

### **Application Management:**
```bash
# Deploy application
./deploy-cypher.sh

# Check application health
curl http://localhost:3001/health

# View PM2 processes
pm2 list
pm2 monit
```

### **Security & Monitoring:**
```bash
# Check firewall rules
sudo firewall-cmd --list-all

# Check fail2ban status
sudo fail2ban-client status

# System monitoring
./system-status.sh
htop
```

---

## 🔒 **Optional: SSL Certificate Setup**

To set up HTTPS with a domain name:

```bash
# Replace 'your-domain.com' with your actual domain
./setup-ssl.sh your-domain.com
```

---

## 🚨 **Troubleshooting**

### **If setup script fails:**
```bash
# Check the error and re-run specific sections
# The script has error checking and will show which step failed

# Check system logs
sudo journalctl -f

# Check specific service
sudo systemctl status service-name
```

### **If deployment fails:**
```bash
# Check PM2 logs
pm2 logs cypher-api

# Check if Node.js is working
node --version
npm --version

# Check if directories exist
ls -la /opt/cypher/
```

### **If application not accessible:**
```bash
# Check if services are running
sudo systemctl status nginx
pm2 status

# Check firewall
sudo firewall-cmd --list-all

# Check if ports are open
sudo netstat -tlnp | grep -E ':80|:3001'
```

---

## 📊 **Complete Setup Summary**

**Total Installation Time:** ~10-15 minutes

**What You Get:**
- ✅ Production-ready Node.js environment
- ✅ Nginx web server with reverse proxy
- ✅ PM2 process manager
- ✅ Security hardening (firewall, fail2ban)
- ✅ SSL certificate support
- ✅ Monitoring and logging
- ✅ Automated deployment scripts

**Next Steps After Setup:**
1. Configure AWS credentials
2. Run deployment script
3. Access your CYPHER application
4. Set up SSL (optional)
5. Configure monitoring (optional)

---

## 🎉 **Ready to Deploy!**

Your EC2 instance will be completely configured and ready for your CYPHER application with just one command!

**Run this on your EC2 instance:**
```bash
curl -s https://cypher-deployment.s3.amazonaws.com/complete-cypher-setup.sh | bash
```

**Then deploy your app:**
```bash
aws configure
./deploy-cypher.sh
```

**That's it! Your CYPHER application will be live!** 🚀
