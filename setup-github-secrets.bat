@echo off
echo.
echo 🔐 GitHub Secrets Setup for CYPHER CI/CD Pipeline
echo =================================================
echo.

set REPO_OWNER=mantsimela2025
set REPO_NAME=cypher
set REPO_FULL=%REPO_OWNER%/%REPO_NAME%

echo 📋 Repository: %REPO_FULL%
echo.

REM Check if GitHub CLI is available
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ GitHub CLI is available
    set GH_AVAILABLE=true
) else (
    echo ❌ GitHub CLI is not installed
    set GH_AVAILABLE=false
)

echo.
echo 🔐 Required GitHub Secrets:
echo 1. AWS_ACCESS_KEY_ID - Your AWS access key
echo 2. AWS_SECRET_ACCESS_KEY - Your AWS secret key  
echo 3. EC2_SSH_PRIVATE_KEY - Contents of jaharrison-keypair.pem
echo.

echo 🔍 Checking current AWS configuration...

REM Try to get AWS credentials
for /f "tokens=*" %%i in ('aws configure get aws_access_key_id 2^>nul') do set AWS_ACCESS_KEY=%%i
for /f "tokens=*" %%i in ('aws configure get aws_secret_access_key 2^>nul') do set AWS_SECRET_KEY=%%i

if defined AWS_ACCESS_KEY (
    echo ✅ Found AWS Access Key: %AWS_ACCESS_KEY:~0,8%...
) else (
    echo ❌ AWS Access Key not found
)

if defined AWS_SECRET_KEY (
    echo ✅ Found AWS Secret Key: %AWS_SECRET_KEY:~0,8%...
) else (
    echo ❌ AWS Secret Key not found
)

REM Check for SSH key
if exist "jaharrison-keypair.pem" (
    echo ✅ Found SSH key file: jaharrison-keypair.pem
    set SSH_KEY_FOUND=true
) else (
    echo ❌ SSH key file not found: jaharrison-keypair.pem
    set SSH_KEY_FOUND=false
)

echo.

if "%GH_AVAILABLE%"=="true" (
    echo 🚀 GitHub CLI Commands to Set Secrets:
    echo =====================================
    echo.
    
    if defined AWS_ACCESS_KEY (
        echo # Set AWS Access Key ID:
        echo echo %AWS_ACCESS_KEY% ^| gh secret set AWS_ACCESS_KEY_ID --repo %REPO_FULL%
        echo.
    )
    
    if defined AWS_SECRET_KEY (
        echo # Set AWS Secret Access Key:
        echo echo %AWS_SECRET_KEY% ^| gh secret set AWS_SECRET_ACCESS_KEY --repo %REPO_FULL%
        echo.
    )
    
    if "%SSH_KEY_FOUND%"=="true" (
        echo # Set SSH Private Key:
        echo type jaharrison-keypair.pem ^| gh secret set EC2_SSH_PRIVATE_KEY --repo %REPO_FULL%
        echo.
    )
    
    echo 💡 Copy and paste these commands to set up your secrets.
    echo.
    echo Would you like to run these commands now? (y/n)
    set /p CONFIRM=
    
    if /i "%CONFIRM%"=="y" (
        echo.
        echo 🔄 Setting up secrets...
        
        if defined AWS_ACCESS_KEY (
            echo Setting AWS_ACCESS_KEY_ID...
            echo %AWS_ACCESS_KEY% | gh secret set AWS_ACCESS_KEY_ID --repo %REPO_FULL%
        )
        
        if defined AWS_SECRET_KEY (
            echo Setting AWS_SECRET_ACCESS_KEY...
            echo %AWS_SECRET_KEY% | gh secret set AWS_SECRET_ACCESS_KEY --repo %REPO_FULL%
        )
        
        if "%SSH_KEY_FOUND%"=="true" (
            echo Setting EC2_SSH_PRIVATE_KEY...
            type jaharrison-keypair.pem | gh secret set EC2_SSH_PRIVATE_KEY --repo %REPO_FULL%
        )
        
        echo.
        echo ✅ Secrets setup completed!
    )
) else (
    echo 📋 Manual Setup Instructions:
    echo ============================
    echo.
    echo 1. Install GitHub CLI: https://cli.github.com/
    echo 2. Authenticate: gh auth login
    echo 3. Run this script again
    echo.
    echo OR set up manually at:
    echo https://github.com/%REPO_FULL%/settings/secrets/actions
)

echo.
echo ✅ After setting up secrets, you can:
echo    1. Push code to trigger automatic deployment
echo    2. Go to Actions tab to monitor deployment
echo    3. Access your app at: http://54.91.127.123:3000

pause
