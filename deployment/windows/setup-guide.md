# RAS Dashboard - Windows Server 2019 IIS Setup Guide

This guide walks you through setting up the RAS Dashboard on Windows Server 2019 using IIS with a reverse proxy configuration for the Node.js backend.

## 📋 Prerequisites

### System Requirements
- **Windows Server 2019** (or Windows 10/11 with IIS enabled)
- **Administrator privileges** required
- **Internet connection** for downloading components

### Software Requirements
1. **Node.js** (LTS version 18.x or higher)
2. **IIS** with required features
3. **IISNode** module
4. **URL Rewrite** module

---

## 🚀 Quick Setup (Automated)

If you want to automate the entire setup process, you can use our PowerShell deployment script:

```powershell
# Download and run the automated deployment script
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
.\deployment\windows\deploy.ps1
```

This will automatically:
- ✅ Install IIS features
- ✅ Verify Node.js installation
- ✅ Check IISNode and URL Rewrite modules
- ✅ Build and deploy the application
- ✅ Configure IIS websites and application pools
- ✅ Start services and run health checks

---

## 🔧 Manual Setup (Step-by-Step)

If you prefer to set up manually or need to understand each step:

### Step 1: Install Node.js

1. **Download Node.js LTS** from [https://nodejs.org/](https://nodejs.org/)
2. **Run the installer** with default settings
3. **Verify installation** in PowerShell:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Enable IIS Features

Open **PowerShell as Administrator** and run:

```powershell
# Enable IIS and required features
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-WebServerRole" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-WebServer" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-CommonHttpFeatures" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-HttpRedirect" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-NetFxExtensibility45" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-HealthAndDiagnostics" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-HttpLogging" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-Security" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-RequestFiltering" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-Performance" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-WebServerManagementTools" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-ManagementConsole" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-HttpCompressionStatic" -All
Enable-WindowsOptionalFeature -Online -FeatureName "IIS-HttpCompressionDynamic" -All
```

### Step 3: Install IISNode

1. **Download IISNode** from [GitHub Releases](https://github.com/Azure/iisnode/releases)
2. **Choose the x64 version** for Windows Server 2019
3. **Run the installer** with administrator privileges
4. **Verify installation**:
   ```powershell
   Test-Path "C:\Program Files\iisnode"
   ```

### Step 4: Install URL Rewrite Module

1. **Download URL Rewrite** from [IIS.net](https://www.iis.net/downloads/microsoft/url-rewrite)
2. **Run the installer** with administrator privileges
3. **Verify installation** by checking IIS Manager modules

### Step 5: Prepare Application Files

1. **Clone/download** your RAS Dashboard repository
2. **Build the application**:
   ```powershell
   npm install
   npm run install:all
   npm run build:all
   ```

### Step 6: Create Deployment Directories

```powershell
# Create directories for the application
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\ras-dashboard" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\ras-dashboard-api" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\ras-dashboard\logs" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\ras-dashboard-api\logs" -Force
```

### Step 7: Copy Application Files

```powershell
# Copy React client (built files)
Copy-Item -Path ".\client\dist\*" -Destination "C:\inetpub\wwwroot\ras-dashboard" -Recurse -Force

# Copy API server
Copy-Item -Path ".\api\*" -Destination "C:\inetpub\wwwroot\ras-dashboard-api" -Recurse -Force -Exclude "node_modules"

# Copy configuration files
Copy-Item -Path ".\deployment\windows\web.config" -Destination "C:\inetpub\wwwroot\ras-dashboard" -Force
Copy-Item -Path ".\deployment\windows\api-web.config" -Destination "C:\inetpub\wwwroot\ras-dashboard-api\web.config" -Force
```

### Step 8: Install API Dependencies

```powershell
# Install production dependencies for the API
Set-Location "C:\inetpub\wwwroot\ras-dashboard-api"
npm install --production
```

### Step 9: Configure IIS

#### Using IIS Manager (GUI):

1. **Open IIS Manager** (Start → Run → `inetmgr`)

2. **Create the main website**:
   - Right-click **Sites** → **Add Website**
   - **Site name**: `RAS-Dashboard`
   - **Physical path**: `C:\inetpub\wwwroot\ras-dashboard`
   - **Port**: `80` (or your preferred port)
   - Click **OK**

3. **Create API application**:
   - Right-click the `RAS-Dashboard` site → **Add Application**
   - **Alias**: `api`
   - **Physical path**: `C:\inetpub\wwwroot\ras-dashboard-api`
   - Click **OK**

4. **Configure API Application Pool**:
   - Go to **Application Pools**
   - Right-click **DefaultAppPool** → **Add Application Pool**
   - **Name**: `RAS-Dashboard-API`
   - **.NET CLR version**: **No Managed Code**
   - **Managed pipeline mode**: **Integrated**
   - Click **OK**
   - Right-click the `api` application → **Manage Application** → **Advanced Settings**
   - Set **Application Pool**: `RAS-Dashboard-API`

#### Using PowerShell:

```powershell
Import-Module WebAdministration

# Remove existing site if it exists
if (Get-Website -Name "RAS-Dashboard" -ErrorAction SilentlyContinue) {
    Remove-Website -Name "RAS-Dashboard"
}

# Create new website
New-Website -Name "RAS-Dashboard" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\ras-dashboard"

# Create API application
New-WebApplication -Site "RAS-Dashboard" -Name "api" -PhysicalPath "C:\inetpub\wwwroot\ras-dashboard-api"

# Create and configure API application pool
New-WebAppPool -Name "RAS-Dashboard-API"
Set-ItemProperty -Path "IIS:\AppPools\RAS-Dashboard-API" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\RAS-Dashboard-API" -Name managedRuntimeVersion -Value ""
Set-WebApplication -Site "RAS-Dashboard" -Name "api" -ApplicationPool "RAS-Dashboard-API"
```

### Step 10: Start Services

```powershell
# Start the website and application pool
Start-Website -Name "RAS-Dashboard"
Start-WebAppPool -Name "RAS-Dashboard-API"
```

### Step 11: Configure Environment Variables

Create a `.env` file in the API directory:

```powershell
# Create environment file for the API
@"
NODE_ENV=production
PORT=8080
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
"@ | Out-File -FilePath "C:\inetpub\wwwroot\ras-dashboard-api\.env" -Encoding UTF8
```

---

## 🧪 Testing Your Deployment

### 1. Test Frontend
Open your browser and navigate to:
- **Main site**: `http://localhost` (or your server IP)
- **Should show**: React application login page

### 2. Test API
Test API endpoints:
- **Health check**: `http://localhost/api/health`
- **API docs**: `http://localhost/api-docs`

### 3. Test Reverse Proxy
The reverse proxy should automatically route:
- `http://localhost/` → React frontend
- `http://localhost/api/*` → Node.js backend
- `http://localhost/api-docs` → API documentation

---

## 🔧 Configuration Details

### How the Reverse Proxy Works

The `web.config` file configures IIS to:

1. **Serve React frontend** directly from static files
2. **Proxy API calls** to the Node.js backend running on port 8080
3. **Handle React Router** client-side routing
4. **Add security headers** and CORS support
5. **Enable compression** for better performance

### Key Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `web.config` | Main IIS configuration | Frontend directory |
| `api-web.config` | Node.js API configuration | API directory |
| `.env` | Environment variables | API directory |

### URL Routing

| Request Path | Destination | Purpose |
|--------------|-------------|---------|
| `/` | Static files | React frontend |
| `/api/*` | `localhost:8080` | API proxy |
| `/health` | `localhost:8080/health` | Health check |
| `/api-docs` | `localhost:8080/api-docs` | API documentation |
| `/*` (fallback) | `/index.html` | React Router |

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. "HTTP Error 500.0 - Internal Server Error"
- **Cause**: IISNode not installed or Node.js not found
- **Solution**: Verify IISNode installation and Node.js path

#### 2. API calls return 404
- **Cause**: URL Rewrite module not installed
- **Solution**: Install URL Rewrite module from IIS.net

#### 3. "Cannot find module" errors
- **Cause**: Missing dependencies in API directory
- **Solution**: Run `npm install --production` in API directory

#### 4. Database connection errors
- **Cause**: Missing or incorrect environment variables
- **Solution**: Check `.env` file in API directory

### Viewing Logs

#### IIS Logs
- **Location**: `C:\inetpub\logs\LogFiles\`
- **View recent errors**: Check latest log files

#### IISNode Logs
- **Location**: `C:\inetpub\wwwroot\ras-dashboard-api\logs\`
- **Contains**: Node.js application errors and output

#### Event Viewer
- **Open**: Start → Event Viewer
- **Check**: Windows Logs → Application
- **Filter**: Show only IIS-related events

### Performance Optimization

#### 1. Enable Output Caching
Add to `web.config`:
```xml
<caching>
  <outputCacheSettings>
    <outputCacheProfiles>
      <add name="StaticContent" duration="3600" varyByParam="none" />
    </outputCacheProfiles>
  </outputCacheSettings>
</caching>
```

#### 2. Configure Compression
Already included in the provided `web.config`, but ensure IIS compression is enabled.

#### 3. Application Pool Settings
- **Idle Timeout**: Set to 0 for always-on applications
- **Process Model**: Configure based on your server resources

---

## 🔐 Security Considerations

### 1. SSL/TLS Configuration
For production, configure HTTPS:
1. **Obtain SSL certificate** (Let's Encrypt, commercial CA)
2. **Install certificate** in IIS
3. **Update web.config** to redirect HTTP to HTTPS
4. **Update application** to use HTTPS URLs

### 2. Firewall Configuration
Configure Windows Firewall:
- **Allow HTTP (80)** and **HTTPS (443)** inbound
- **Block direct access** to Node.js port (8080)

### 3. Application Security
- **Environment variables**: Store secrets in `.env` files, not in code
- **File permissions**: Restrict access to application directories
- **IIS security**: Configure request filtering and other security features

---

## 📚 Additional Resources

### Documentation
- [IIS Configuration Reference](https://docs.microsoft.com/en-us/iis/configuration/)
- [IISNode Documentation](https://github.com/Azure/iisnode)
- [URL Rewrite Module](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/)

### Support
- **Application logs**: Check IISNode logs for Node.js errors
- **IIS logs**: Check IIS logs for request routing issues
- **Event Viewer**: Check Windows Event Viewer for system errors

---

## ✅ Success Checklist

After completing setup, verify:

- [ ] **IIS features** installed and enabled
- [ ] **Node.js** installed and accessible
- [ ] **IISNode** module installed
- [ ] **URL Rewrite** module installed
- [ ] **Application files** copied to correct directories
- [ ] **Dependencies** installed in API directory
- [ ] **Website and application** created in IIS
- [ ] **Application pools** configured correctly
- [ ] **Environment variables** configured
- [ ] **Frontend accessible** at main URL
- [ ] **API accessible** at `/api/*` endpoints
- [ ] **Health check** returning 200 status
- [ ] **API documentation** accessible at `/api-docs`
- [ ] **React Router** working for client-side navigation

Your RAS Dashboard should now be successfully deployed on Windows Server 2019 with IIS! 🎉