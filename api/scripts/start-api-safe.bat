@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Starting RAS Dashboard API Server...
echo 📁 API Directory: %~dp0..
echo 🔌 Target Port: 3001
echo.

REM Change to API directory
cd /d "%~dp0.."

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in current directory
    echo    Make sure you're running this from the API directory.
    pause
    exit /b 1
)

echo 🔍 Checking for processes using port 3001...

REM Find processes using port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 2^>nul') do (
    set "pid=%%a"
    if defined pid (
        echo ❌ Found process using port 3001: PID !pid!
        
        REM Ask user for confirmation
        set /p "confirm=Kill process !pid!? (y/N): "
        if /i "!confirm!"=="y" (
            taskkill /PID !pid! /F >nul 2>&1
            if !errorlevel! equ 0 (
                echo ✅ Process !pid! terminated successfully.
            ) else (
                echo ⚠️  Failed to terminate process !pid!
            )
        ) else (
            echo ⏭️  Skipping process termination.
            echo ❌ Cannot start API server - port 3001 is in use.
            pause
            exit /b 1
        )
    )
)

REM Wait a moment for port to be released
timeout /t 2 /nobreak >nul

echo.
echo ✅ Port 3001 should now be available.
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo 🚀 Launching API server with nodemon...
echo    Press Ctrl+C to stop the server
echo.

REM Start the server
npm run dev

if !errorlevel! neq 0 (
    echo.
    echo ❌ Failed to start API server
    pause
    exit /b 1
)

pause
