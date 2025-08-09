@echo off
REM CYPHER IIS Deployment Batch Script for Windows Server 2019
REM Run this as Administrator

echo.
echo ========================================
echo   CYPHER IIS Deployment for Windows
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

echo Welcome to CYPHER Windows Server 2019 IIS Deployment!
echo.
echo This script will:
echo   1. Install IIS, Node.js, IISNode, Git, and AWS CLI
echo   2. Download your code from S3
echo   3. Configure IIS for your React + Node.js app
echo   4. Connect to your PostgreSQL RDS database
echo   5. Set up domain (optional)
echo.

set /p confirm="Do you want to continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Please provide the following information (defaults in brackets):
echo.

set /p s3bucket="S3 Bucket name [cypher-deployment]: "
if "%s3bucket%"=="" set s3bucket=cypher-deployment

set /p s3key="S3 Key [cypher-deployment-latest.zip]: "
if "%s3key%"=="" set s3key=cypher-deployment-latest.zip

set /p rdsendpoint="RDS Endpoint: "
set /p dbname="Database Name: "
set /p dbuser="Database Username: "
set /p dbpass="Database Password: "

set /p domain="Domain [rasdash.dev.com] (or press Enter to skip): "
if "%domain%"=="" set domain=rasdash.dev.com

echo.
echo Configuration Summary:
echo =====================
echo S3 Bucket: %s3bucket%
echo S3 Key: %s3key%
echo RDS Endpoint: %rdsendpoint%
echo Database: %dbname%
echo Username: %dbuser%
if not "%domain%"=="" echo Domain: %domain%
echo.

set /p final="Is this correct? (y/n): "
if /i not "%final%"=="y" (
    echo Please run the script again with correct information.
    pause
    exit /b 0
)

echo.
echo Starting deployment...
echo.

REM Build PowerShell command
set "psCommand=powershell -ExecutionPolicy Bypass -File "Deploy-CYPHER-IIS.ps1""
set "psCommand=%psCommand% -S3Bucket "%s3bucket%""
set "psCommand=%psCommand% -S3Key "%s3key%""
set "psCommand=%psCommand% -RDSEndpoint "%rdsendpoint%""
set "psCommand=%psCommand% -DBName "%dbname%""
set "psCommand=%psCommand% -DBUser "%dbuser%""
set "psCommand=%psCommand% -DBPassword "%dbpass%""
if not "%domain%"=="" set "psCommand=%psCommand% -Domain "%domain%""

REM Execute PowerShell script
%psCommand%

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo   DEPLOYMENT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Your CYPHER application is now running on IIS.
    echo.
    if not "%domain%"=="" (
        echo Application URL: http://%domain%
    ) else (
        echo Application URL: http://YOUR-EC2-PUBLIC-IP
    )
    echo.
    echo Useful commands:
    echo   - Restart IIS: iisreset
    echo   - Check status: C:\Scripts\Monitor-Cypher.ps1
    echo   - View logs: Event Viewer ^> Windows Logs ^> Application
    echo.
) else (
    echo.
    echo ========================================
    echo   DEPLOYMENT FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above and try again.
    echo.
)

pause
