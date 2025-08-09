@echo off
REM Setup script for Tenable local testing environment (Windows)

echo 🚀 Setting up Tenable Local Testing Environment

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3 is required but not installed
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed
    exit /b 1
)

REM Create virtual environment for Python
echo 🐍 Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Install Node.js dependencies (if needed)
echo 📦 Installing Node.js dependencies...
cd ..\..\
npm install axios tsx

echo ✅ Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Activate Python environment: testing\tenable\venv\Scripts\activate.bat
echo 2. Start mock server: python testing\tenable\mock_tenable_server.py
echo 3. Run Python tests: python testing\tenable\test_pytenable_local.py
echo 4. Run Node.js tests: npx tsx testing\tenable\test_tenable_nodejs.ts
echo 5. Run integration tests: node testing\tenable\test_integration.js
