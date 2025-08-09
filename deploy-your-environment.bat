@echo off
REM CYPHER Deployment - Your Specific Environment
REM Run this as Administrator on Windows Server 2019

echo.
echo ========================================
echo   CYPHER Deployment - Your Environment
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Your Environment Configuration:
echo ==============================
echo AWS Region: us-east-1
echo Domain: rasdash.dev.com
echo S3 Bucket: cypher-deployment
echo S3 Package: cypher-deployment-latest.zip
echo RDS Endpoint: rasdash-database.cexgrlslydeh.us-east-1.rds.amazonaws.com
echo Node.js Version: v20.16.0
echo ==============================
echo.

echo This deployment will:
echo   1. Install IIS, Node.js v20.16.0, IISNode
echo   2. Download your code from S3 (cypher-deployment bucket)
echo   3. Configure IIS for rasdash.dev.com
echo   4. Connect to your PostgreSQL RDS database
echo   5. Set up monitoring and health checks
echo.

set /p confirm="Continue with deployment? (y/n): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Database connection details needed:
echo.

set /p dbname="Database Name: "
set /p dbuser="Database Username: "
set /p dbpass="Database Password: "

echo.
echo Final Configuration:
echo ===================
echo Domain: rasdash.dev.com
echo Database: %dbname%
echo Username: %dbuser%
echo RDS: rasdash-database.cexgrlslydeh.us-east-1.rds.amazonaws.com
echo.

set /p final="Start deployment? (y/n): "
if /i not "%final%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo 🚀 Starting deployment...
echo.

REM Execute PowerShell script with your environment settings
powershell -ExecutionPolicy Bypass -File "DEPLOY-YOUR-ENVIRONMENT.ps1" -DBName "%dbname%" -DBUser "%dbuser%" -DBPassword "%dbpass%"

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo   DEPLOYMENT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo 🎉 Your CYPHER application is now running!
    echo.
    echo 🌐 Application URLs:
    echo    Main App: http://rasdash.dev.com
    echo    API: http://rasdash.dev.com/api
    echo    Health Check: http://rasdash.dev.com/api/health
    echo.
    echo 📊 Monitoring:
    echo    Run: C:\Scripts\Monitor-Cypher.ps1
    echo.
    echo 🔧 Management:
    echo    Restart IIS: iisreset
    echo    Restart App Pool: Restart-WebAppPool -Name "CypherAppPool"
    echo.
) else (
    echo.
    echo ========================================
    echo   DEPLOYMENT FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common solutions:
    echo   1. Ensure you're running as Administrator
    echo   2. Check AWS CLI is configured: aws configure
    echo   3. Verify RDS security group allows EC2 access
    echo   4. Confirm database credentials are correct
    echo.
)

pause
