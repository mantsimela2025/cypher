# 🚀 CYPHER S3 Deployment Instructions

## ✅ **Deployment Package Created Successfully!**

Your CYPHER application has been packaged and uploaded to S3. Here's how to deploy it:

---

## 📦 **What's Been Created:**

- ✅ **Deployment Package**: `cypher-deployment.zip` (7.8 MB)
- ✅ **S3 Bucket**: `cypher-deployment`
- ✅ **Uploaded Files**:
  - `s3://cypher-deployment/cypher-deployment-latest.zip`
  - `s3://cypher-deployment/ec2-deploy-from-s3.sh`

---

## 🖥️ **Deploy to EC2 Instance**

### **Option 1: One-Line Deployment (Recommended)**

SSH into your EC2 instance and run this single command:

```bash
curl -s https://cypher-deployment.s3.amazonaws.com/ec2-deploy-from-s3.sh | bash
```

### **Option 2: Manual Download and Execute**

```bash
# SSH into your EC2 instance
ssh -i jaharrison-keypair.pem ec2-user@18.207.177.239

# Download and run deployment script
wget https://cypher-deployment.s3.amazonaws.com/ec2-deploy-from-s3.sh
chmod +x ec2-deploy-from-s3.sh
./ec2-deploy-from-s3.sh
```

### **Option 3: Using AWS CLI**

```bash
# SSH into your EC2 instance
ssh -i jaharrison-keypair.pem ec2-user@18.207.177.239

# Download using AWS CLI
aws s3 cp s3://cypher-deployment/ec2-deploy-from-s3.sh ./
chmod +x ec2-deploy-from-s3.sh
./ec2-deploy-from-s3.sh
```

---

## 🔧 **Prerequisites**

Make sure your EC2 instance has:

1. **AWS CLI configured** or **IAM role with S3 access**
2. **Node.js 18+** installed
3. **Nginx** installed
4. **Basic development tools** (git, curl, unzip)

---

## 🎯 **What the Deployment Does:**

1. ⬇️ Downloads the latest deployment package from S3
2. 📦 Extracts the application files
3. 🔧 Installs API dependencies (`npm ci --production`)
4. 🏗️ Builds the client application (`npm run build`)
5. ⚙️ Configures environment variables
6. 🚀 Starts the application with PM2
7. 🌐 Configures Nginx reverse proxy
8. 🏥 Performs health checks

---

## 📊 **After Deployment:**

### **Check Application Status:**
```bash
# Health check
curl http://localhost:3001/health

# PM2 status
pm2 status

# View logs
pm2 logs cypher-api
```

### **Access Your Application:**
- **Health Check**: `http://18.207.177.239/health`
- **API**: `http://18.207.177.239/api/v1/`
- **Frontend**: `http://18.207.177.239/`

---

## 🔄 **Future Deployments:**

To deploy updates:

1. **Update your code locally**
2. **Run the deployment package script again**:
   ```bash
   # Recreate deployment package
   .\create-deployment-package.ps1
   
   # Upload to S3
   aws s3 cp cypher-deployment.zip s3://cypher-deployment/cypher-deployment-latest.zip
   ```
3. **Deploy on EC2**:
   ```bash
   curl -s https://cypher-deployment.s3.amazonaws.com/ec2-deploy-from-s3.sh | bash
   ```

---

## 🐛 **Troubleshooting:**

### **If deployment fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 access
aws s3 ls s3://cypher-deployment/

# Check logs
sudo journalctl -u nginx -f
pm2 logs cypher-api
```

### **Common Issues:**
- **AWS credentials not configured**: Run `aws configure`
- **S3 access denied**: Check IAM permissions
- **Port conflicts**: Check if ports 3001/80 are available
- **Node.js not installed**: Install Node.js 18+

---

## 🎉 **Ready to Deploy!**

Your deployment package is ready! Run the one-liner command on your EC2 instance to get your application up and running.

**Need help?** Check the troubleshooting section or review the deployment logs.
