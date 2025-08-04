#!/bin/bash
# Setup script for Tenable local testing environment

echo "🚀 Setting up Tenable Local Testing Environment"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Create virtual environment for Python
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies (if needed)
echo "📦 Installing Node.js dependencies..."
cd ../../
npm install axios tsx

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Activate Python environment: source testing/tenable/venv/bin/activate"
echo "2. Start mock server: python testing/tenable/mock_tenable_server.py"
echo "3. Run Python tests: python testing/tenable/test_pytenable_local.py"
echo "4. Run Node.js tests: npx tsx testing/tenable/test_tenable_nodejs.ts"
echo "5. Run integration tests: node testing/tenable/test_integration.js"
