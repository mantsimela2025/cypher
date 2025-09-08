# GitHub Actions CI/CD Setup Guide for CYPHER

This guide explains how to set up GitHub Actions for automated deployment of your CYPHER application to EC2.

## 🔐 Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to your GitHub repository: `https://github.com/mantsimela2025/cypher`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Add Required Secrets

#### AWS Credentials
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: Your AWS access key ID
- **Description**: AWS credentials for EC2 management

- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: Your AWS secret access key
- **Description**: AWS credentials for EC2 management

#### EC2 SSH Access
- **Name**: `EC2_SSH_PRIVATE_KEY`
- **Value**: Contents of your private key file (`jaharrison-keypair.pem`)
- **Description**: SSH private key for EC2 access

To get the private key content:
```bash
cat jaharrison-keypair.pem
```
Copy the entire content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

## 🚀 Deployment Workflow

### Automatic Deployment
The CI/CD pipeline automatically triggers when:
- Code is pushed to the `main` branch
- Pull requests are created/updated

### Manual Deployment
You can also trigger deployment manually:
1. Go to **Actions** tab in your repository
2. Click **Deploy CYPHER to EC2**
3. Click **Run workflow**
4. Select environment and click **Run workflow**

## 📋 Pipeline Stages

### 1. Test and Build
- ✅ Checkout code
- ✅ Setup Node.js 20.x
- ✅ Install dependencies (API & Client)
- ✅ Run tests (if configured)
- ✅ Run linting (if configured)
- ✅ Build client for production
- ✅ Upload build artifacts

### 2. Security Scan
- ✅ Run npm audit on API dependencies
- ✅ Run npm audit on Client dependencies
- ✅ Check for high-severity vulnerabilities

### 3. Deploy to EC2
- ✅ Download build artifacts
- ✅ Configure AWS credentials
- ✅ Verify EC2 instance is running
- ✅ Setup SSH connection
- ✅ Deploy application to EC2
- ✅ Restart services with PM2
- ✅ Perform health checks

### 4. Health Checks
- ✅ API health check (http://54.91.127.123:3001/health)
- ✅ Client health check (http://54.91.127.123:3000)
- ✅ Generate deployment summary

## 🔧 EC2 Prerequisites

### 1. Install Required Software on EC2
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 2. Configure SSH Access
Ensure your EC2 instance:
- ✅ Has SSH access enabled (port 22)
- ✅ Security group allows inbound traffic on ports 3000, 3001
- ✅ Has the correct SSH key pair configured

### 3. Create Deployment Directories
```bash
sudo mkdir -p /c/deployments/cypher
sudo mkdir -p /c/deployments/backups
sudo mkdir -p /c/deployments/logs
sudo chown -R $USER:$USER /c/deployments
```

## 🌍 Environment Configuration

### Production Environment Variables
The deployment uses AWS Secrets Manager for production configuration:
- ✅ `NODE_ENV=production`
- ✅ `USE_SECRETS_MANAGER=true`
- ✅ All secrets loaded from AWS Secrets Manager

### IAM Role for EC2
Your EC2 instance should have an IAM role with permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:cypher/*"
    }
  ]
}
```

## 📊 Monitoring and Logs

### PM2 Process Management
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart ecosystem.config.js

# Monitor in real-time
pm2 monit
```

### Application Logs
- **API Logs**: `/c/deployments/logs/api-*.log`
- **PM2 Logs**: `~/.pm2/logs/`
- **Deployment Logs**: Available in GitHub Actions

## 🔄 Rollback Procedure

If deployment fails, you can rollback:

### 1. Automatic Backup
Each deployment creates a backup in `/c/deployments/backups/YYYYMMDD_HHMMSS`

### 2. Manual Rollback
```bash
# Stop current services
pm2 stop ecosystem.config.js

# Restore from backup
BACKUP_DIR="/c/deployments/backups/20241208_143000"  # Use actual backup timestamp
cp -r "$BACKUP_DIR"/* /c/deployments/cypher/

# Restart services
cd /c/deployments/cypher
pm2 start ecosystem.config.js --env production
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
- Check EC2 security group allows SSH (port 22)
- Verify SSH key is correct in GitHub secrets
- Ensure EC2 instance is running

#### 2. Health Check Failed
- Check if ports 3000/3001 are open in security group
- Verify services started correctly: `pm2 status`
- Check application logs: `pm2 logs`

#### 3. AWS Secrets Manager Access Denied
- Verify IAM role attached to EC2 instance
- Check IAM permissions for SecretsManager
- Ensure secrets exist in correct AWS region

#### 4. Build Failed
- Check Node.js version compatibility
- Verify all dependencies are properly listed
- Review build logs in GitHub Actions

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. SSH into EC2 and check PM2 status
3. Review application logs
4. Verify AWS Secrets Manager configuration

## 🎯 Next Steps

After setup:
1. ✅ Configure GitHub secrets
2. ✅ Test manual deployment
3. ✅ Push code to trigger automatic deployment
4. ✅ Monitor deployment in GitHub Actions
5. ✅ Verify application is running on EC2
