# 🚀 CYPHER Windows Server 2019 Quick Deployment Reference

## 📋 **Prerequisites Checklist**
- [ ] Windows Server 2019 EC2 instance (t3.large) launched
- [ ] Connected via RDP as Administrator
- [ ] Your zipped code uploaded to S3 bucket
- [ ] RDS PostgreSQL database created and accessible
- [ ] Security groups configured (ports 80, 443, 3389, 3001)

---

## ⚡ **Super Quick Deployment (5 Minutes)**

### **Option 1: Automated Batch Script**
1. **Download files** to your Windows Server desktop
2. **Right-click** `deploy-cypher-iis.bat` → **"Run as administrator"**
3. **Follow prompts** to enter your S3 and database details
4. **Wait 10-15 minutes** for automatic installation and configuration
5. **Done!** Your app will be running on IIS

### **Option 2: PowerShell Script**
```powershell
# Run as Administrator
.\Deploy-CYPHER-IIS.ps1 -S3Bucket "your-bucket" -S3Key "your-code.zip" -RDSEndpoint "your-rds-endpoint" -DBName "your-db" -DBUser "your-user" -DBPassword "your-password"
```

---

## 🔧 **Manual Step-by-Step (If Needed)**

### **1. Install Software**
```powershell
# Install IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole,IIS-WebServer,IIS-CommonHttpFeatures,IIS-HttpErrors,IIS-HttpLogging,IIS-RequestFiltering,IIS-StaticContent,IIS-DefaultDocument,IIS-DirectoryBrowsing,IIS-ASPNET45

# Install Node.js (download from nodejs.org)
# Install IISNode (download from GitHub)
# Install Git and AWS CLI
```

### **2. Download Code**
```powershell
aws s3 cp s3://your-bucket/your-code.zip C:\temp\code.zip
Expand-Archive C:\temp\code.zip C:\inetpub\wwwroot\cypher
```

### **3. Configure Environment**
Create `C:\inetpub\wwwroot\cypher\api\.env`:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://your-domain.com
```

### **4. Install Dependencies**
```powershell
cd C:\inetpub\wwwroot\cypher\api
npm install --production

cd C:\inetpub\wwwroot\cypher\client
npm install
npm run build
```

### **5. Configure IIS**
```powershell
Import-Module WebAdministration
Remove-Website -Name "Default Web Site"
New-WebAppPool -Name "CypherAppPool"
New-Website -Name "CypherClient" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\cypher\client\dist" -ApplicationPool "CypherAppPool"
New-WebApplication -Site "CypherClient" -Name "api" -PhysicalPath "C:\inetpub\wwwroot\cypher\api" -ApplicationPool "CypherAppPool"
```

### **6. Create web.config for API**
Create `C:\inetpub\wwwroot\cypher\api\web.config` with IISNode configuration.

### **7. Start Services**
```powershell
iisreset
```

---

## 🏥 **Health Checks**

### **Test API**
```powershell
Invoke-WebRequest -Uri "http://localhost/api/health"
```

### **Test Client**
```powershell
Invoke-WebRequest -Uri "http://localhost"
```

---

## 📊 **Monitoring Commands**

```powershell
# Check IIS status
Get-Service W3SVC

# Check application pool
Get-WebAppPoolState -Name "CypherAppPool"

# Restart IIS
iisreset

# Restart application pool
Restart-WebAppPool -Name "CypherAppPool"

# View logs
Get-EventLog -LogName Application -Source "IIS*" -Newest 10
```

---

## 🔗 **Important File Locations**

| Component | Location |
|-----------|----------|
| **Application Root** | `C:\inetpub\wwwroot\cypher` |
| **API Code** | `C:\inetpub\wwwroot\cypher\api` |
| **Client Build** | `C:\inetpub\wwwroot\cypher\client\dist` |
| **Environment Config** | `C:\inetpub\wwwroot\cypher\api\.env` |
| **IIS Logs** | `C:\inetpub\logs\LogFiles\W3SVC1\` |
| **Monitoring Script** | `C:\Scripts\Monitor-Cypher.ps1` |

---

## 🚨 **Troubleshooting**

### **API Not Responding**
1. Check if `server.js` exists in API directory
2. Verify `web.config` is properly configured
3. Check Windows Event Viewer for errors
4. Restart application pool: `Restart-WebAppPool -Name "CypherAppPool"`

### **Database Connection Issues**
1. Verify RDS security group allows EC2 access (port 5432)
2. Test connection: `Test-NetConnection -ComputerName your-rds-endpoint -Port 5432`
3. Check `.env` file for correct credentials

### **Client Not Loading**
1. Ensure `npm run build` completed successfully
2. Check if `dist` folder exists in client directory
3. Verify IIS site points to correct path

### **Port Conflicts**
1. Check if port 80 is available: `netstat -an | findstr :80`
2. Stop conflicting services if needed

---

## 🎯 **Success Indicators**

✅ **IIS Service Running**: `Get-Service W3SVC` shows "Running"  
✅ **App Pool Active**: `Get-WebAppPoolState -Name "CypherAppPool"` shows "Started"  
✅ **API Health Check**: `http://localhost/api/health` returns 200  
✅ **Client Loading**: `http://localhost` shows your React app  
✅ **Database Connected**: No database errors in logs  

---

## 📞 **Quick Commands Reference**

```powershell
# Full deployment (automated)
.\deploy-cypher-iis.bat

# Manual PowerShell deployment
.\Deploy-CYPHER-IIS.ps1

# Check application status
C:\Scripts\Monitor-Cypher.ps1

# Restart everything
iisreset

# View recent logs
Get-EventLog -LogName Application -Newest 20 | Where-Object {$_.Source -like "*IIS*"}
```

---

**🎉 That's it! Your CYPHER application should now be running on Windows Server 2019 with IIS, connected to your PostgreSQL RDS database!**
