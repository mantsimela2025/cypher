@echo off
REM CYPHER Deployment Batch Script for Windows Server
REM Run this as Administrator

echo.
echo ========================================
echo   CYPHER Deployment for Windows Server
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

REM Set PowerShell execution policy
echo Setting PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

REM Check if AWS CLI is installed
echo Checking AWS CLI...
aws --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: AWS CLI not found!
    echo Please install AWS CLI v2 from: https://awscli.amazonaws.com/AWSCLIV2.msi
    echo.
    echo Would you like to download it now? (Y/N)
    set /p download="Enter choice: "
    if /i "%download%"=="Y" (
        start https://awscli.amazonaws.com/AWSCLIV2.msi
        echo Please install AWS CLI and run this script again.
    )
    pause
    exit /b 1
)

REM Check AWS credentials
echo Checking AWS credentials...
aws sts get-caller-identity >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: AWS credentials not configured!
    echo Please run: aws configure
    echo.
    echo Would you like to configure AWS credentials now? (Y/N)
    set /p configure="Enter choice: "
    if /i "%configure%"=="Y" (
        aws configure
    ) else (
        echo Please configure AWS credentials and run this script again.
        pause
        exit /b 1
    )
)

echo.
echo Select deployment method:
echo 1. AWS Systems Manager (Recommended)
echo 2. SSH (requires .pem key file)
echo 3. Monitor existing deployment
echo.
set /p method="Enter choice (1-3): "

if "%method%"=="1" (
    echo.
    echo Deploying via AWS Systems Manager...
    powershell -ExecutionPolicy Bypass -File "Deploy-CYPHER-Windows.ps1" -UseSSM -Monitor
) else if "%method%"=="2" (
    echo.
    set /p keypath="Enter path to your EC2 key file (.pem): "
    if not exist "%keypath%" (
        echo ERROR: Key file not found: %keypath%
        pause
        exit /b 1
    )
    echo Deploying via SSH...
    powershell -ExecutionPolicy Bypass -File "Deploy-CYPHER-Windows.ps1" -UseSSH -KeyPath "%keypath%" -Monitor
) else if "%method%"=="3" (
    echo.
    echo Monitoring existing deployment...
    powershell -ExecutionPolicy Bypass -File "Deploy-CYPHER-Windows.ps1" -Monitor
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Deployment process completed.
echo Check the output above for results.
echo.
pause
