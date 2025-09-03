# CYPHER Deployment Guide

## 🎯 Overview

This directory contains comprehensive deployment guides for the CYPHER application across different environments and platforms.

## 📚 Available Deployment Guides

### **[EC2 IIS Deployment Guide](./EC2_IIS_DEPLOYMENT_GUIDE.md)** ⭐ **CURRENT**
Complete production deployment guide for AWS EC2 Windows Server 2019.

### **[EC2 Linux Deployment Guide](./EC2_LINUX_DEPLOYMENT_GUIDE.md)** ⭐ **RECOMMENDED**
Complete production deployment guide for AWS EC2 Ubuntu 22.04 LTS with Nginx.

**What's Covered:**
- **GitLab Repository Setup** - SSH keys, cloning, dependency installation
- **IIS Configuration** - Website setup, reverse proxy, URL rewrite
- **PM2 Process Management** - Node.js service management, Windows service integration
- **Static IP Configuration** - Elastic IP, security groups, firewall rules
- **External Access** - Browser access via `http://YOUR_STATIC_IP`
- **Automated Deployment** - PowerShell scripts for continuous deployment
- **Health Monitoring** - Automated health checks and alerting
- **SSL/HTTPS Setup** - Optional secure connection configuration

**Target Environment:**
- **Platform**: AWS EC2 Windows Server 2019
- **Instance ID**: `i-04a41343a3f51559a`
- **Web Server**: IIS with reverse proxy
- **Process Manager**: PM2
- **Database**: AWS RDS PostgreSQL
- **Access**: External via static IP

**What's Covered:**
- **Ubuntu 22.04 LTS Setup** - Optimal Linux distribution for Node.js v20.16.0
- **Nginx Configuration** - High-performance web server with reverse proxy
- **PM2 Cluster Mode** - Multi-core process management for better performance
- **SSL/HTTPS Setup** - Let's Encrypt certificate automation
- **Security Hardening** - UFW firewall, Fail2Ban, system optimization
- **Automated Deployment** - Bash scripts for continuous deployment
- **Performance Optimization** - System tuning and monitoring
- **Windows vs Linux Comparison** - Migration considerations and benefits

**Target Environment:**
- **Platform**: AWS EC2 Ubuntu 22.04 LTS
- **Web Server**: Nginx with reverse proxy
- **Process Manager**: PM2 (cluster mode)
- **Database**: AWS RDS PostgreSQL
- **SSL**: Let's Encrypt (Certbot)
- **Access**: External via static IP or domain

## 🚀 Quick Deployment Summary

### **Prerequisites**
- AWS EC2 Windows Server 2019 instance running
- GitLab repository access with SSH keys
- Static IP address configured
- Security groups allowing HTTP/HTTPS traffic

### **Deployment Steps**
1. **Connect to EC2** via RDP
2. **Install Software** - Git, Node.js, IIS features
3. **Clone Repository** from GitLab
4. **Configure Environment** - Production settings
5. **Setup IIS** - Website and reverse proxy
6. **Configure PM2** - Process management
7. **Test Access** - Internal and external connectivity

### **Key Commands**
```powershell
# Clone repository
git clone git@gitlab.com:your-organization/cypher.git

# Install dependencies
npm install && cd api && npm install && cd ../client && npm install

# Build client
cd client && npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Configure IIS
New-Website -Name "CYPHER" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\cypher-app\client\dist"
```

## 🌐 Access URLs

### **Production URLs**
- **Main Application**: `http://YOUR_STATIC_IP`
- **API Health Check**: `http://YOUR_STATIC_IP/api/health`
- **API Base URL**: `http://YOUR_STATIC_IP/api/v1`

### **Local Testing URLs** (on EC2 instance)
- **Client**: `http://localhost`
- **API Direct**: `http://localhost:3001`
- **API via Proxy**: `http://localhost/api`

## 🔧 Architecture Overview

```
Internet → AWS Security Group → EC2 Windows Server 2019
                                      ↓
                               IIS (Port 80)
                                      ↓
                            ┌─────────┴─────────┐
                            │                   │
                     Static Files         Reverse Proxy
                    (React Client)           (API calls)
                            │                   │
                            │                   ↓
                            │            PM2 → Node.js API
                            │                   │
                            │                   ↓
                            │            AWS RDS PostgreSQL
                            │
                            ↓
                      User Browser
```

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] EC2 instance is running and accessible
- [ ] GitLab SSH keys are configured
- [ ] Static IP is allocated and associated
- [ ] Security groups allow HTTP traffic (port 80)
- [ ] Database connection string is available

### **During Deployment**
- [ ] Software installed (Git, Node.js, IIS)
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Environment files configured
- [ ] Client application built successfully
- [ ] IIS website created and configured
- [ ] PM2 processes started and running
- [ ] Reverse proxy working correctly

### **Post-Deployment**
- [ ] Application accessible via static IP
- [ ] API endpoints responding correctly
- [ ] Authentication system working
- [ ] Database connectivity confirmed
- [ ] Health monitoring configured
- [ ] Automated deployment script tested

## 🔍 Troubleshooting Quick Reference

### **Common Issues**
1. **Application Not Loading**
   - Check PM2 process status: `pm2 status`
   - Check IIS website status in IIS Manager
   - Verify firewall rules and security groups

2. **API Not Responding**
   - Check Node.js process: `pm2 logs cypher-api`
   - Test direct API access: `curl http://localhost:3001/api/health`
   - Verify database connection

3. **External Access Issues**
   - Confirm static IP is associated with instance
   - Check AWS security group rules
   - Verify Windows Firewall settings

### **Emergency Commands**
```powershell
# Restart everything
pm2 restart all
iisreset

# Check status
pm2 status
Get-Service W3SVC

# View logs
pm2 logs
Get-EventLog -LogName Application -Newest 10
```

## 📊 Monitoring & Maintenance

### **Health Monitoring**
- **Automated Health Checks** - Every 5 minutes via scheduled task
- **PM2 Process Monitoring** - Automatic restart on failure
- **IIS Application Pool** - Configured for high availability
- **Database Connection** - Monitored and logged

### **Maintenance Tasks**
- **Daily**: Check application logs and performance
- **Weekly**: Review security updates and patches
- **Monthly**: Database backup verification and cleanup
- **Quarterly**: Security audit and dependency updates

### **Backup Strategy**
- **Database**: Automated daily backups to S3
- **Application Code**: Version controlled in GitLab
- **Configuration**: Documented in deployment scripts
- **Logs**: Rotated and archived automatically

## 🔐 Security Considerations

### **Network Security**
- **Security Groups**: Restrict access to necessary ports only
- **Windows Firewall**: Additional layer of protection
- **Static IP**: Predictable access point for monitoring

### **Application Security**
- **Environment Variables**: Sensitive data not in code
- **Database Access**: Encrypted connections to RDS
- **Authentication**: JWT tokens with secure secrets
- **HTTPS**: Optional SSL/TLS encryption

### **Access Control**
- **RDP Access**: Restricted to administrator IPs
- **GitLab Access**: SSH key authentication only
- **Database Access**: Application-specific credentials
- **Monitoring**: Automated alerts for security events

## 📞 Support & Resources

### **Documentation Links**
- **[Developer Setup Guide](../DEVELOPMENT_GUIDE/DEVELOPER_SETUP_GUIDE.md)** - Development environment
- **[AWS & Database Integration](../DEVELOPMENT_GUIDE/AWS_DATABASE_INTEGRATION_GUIDE.md)** - AWS services
- **[Authentication System](../DEVELOPMENT_GUIDE/AUTHENTICATION_SYSTEM_GUIDE.md)** - Auth configuration
- **[API Development Guide](../API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md)** - API patterns

### **Emergency Contacts**
- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Development Team Lead**: [Contact Information]
- **AWS Support**: [Support Plan Details]

### **Useful Resources**
- **AWS EC2 Console**: https://console.aws.amazon.com/ec2/
- **GitLab Repository**: [Your GitLab URL]
- **Monitoring Dashboard**: [If applicable]
- **Documentation Portal**: [Internal docs if available]

---

**Last Updated:** December 2024  
**Status:** ✅ **Production Ready**  
**Primary Guide:** [EC2 IIS Deployment Guide](./EC2_IIS_DEPLOYMENT_GUIDE.md)  
**Application URL:** `http://YOUR_STATIC_IP`
