# PowerShell script to safely start the API server
# Automatically kills any process using port 3001 and starts the API

param(
    [switch]$Force = $false
)

$PORT = 3001
$API_DIR = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "🚀 Starting RAS Dashboard API Server..." -ForegroundColor Cyan
Write-Host "📁 API Directory: $API_DIR" -ForegroundColor Gray
Write-Host "🔌 Target Port: $PORT" -ForegroundColor Gray
Write-Host ""

# Function to kill processes using the port
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "🔍 Checking for processes using port $Port..." -ForegroundColor Yellow
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($processes) {
            foreach ($process in $processes) {
                $pid = $process.OwningProcess
                $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
                $processName = if ($processInfo) { $processInfo.ProcessName } else { "Unknown" }
                
                Write-Host "❌ Found process using port $Port: PID $pid ($processName)" -ForegroundColor Red
                
                if ($Force -or (Read-Host "Kill process $pid ($processName)? (y/N)") -match '^[Yy]') {
                    try {
                        Stop-Process -Id $pid -Force
                        Write-Host "✅ Process $pid terminated successfully." -ForegroundColor Green
                        Start-Sleep -Seconds 1
                    }
                    catch {
                        Write-Host "⚠️  Failed to terminate process $pid: $($_.Exception.Message)" -ForegroundColor Red
                        return $false
                    }
                } else {
                    Write-Host "⏭️  Skipping process termination." -ForegroundColor Yellow
                    return $false
                }
            }
        } else {
            Write-Host "✅ Port $Port is available." -ForegroundColor Green
        }
        return $true
    }
    catch {
        Write-Host "⚠️  Error checking port $Port`: $($_.Exception.Message)" -ForegroundColor Red
        return $true # Continue anyway
    }
}

# Function to start the API server
function Start-ApiServer {
    Write-Host ""
    Write-Host "🔄 Starting API server..." -ForegroundColor Cyan
    
    # Change to API directory
    Set-Location $API_DIR
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ package.json not found in $API_DIR" -ForegroundColor Red
        Write-Host "   Make sure you're running this from the correct directory." -ForegroundColor Red
        exit 1
    }
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Start the server
    Write-Host "🚀 Launching API server with nodemon..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    try {
        npm run dev
    }
    catch {
        Write-Host "❌ Failed to start API server: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Main execution
try {
    # Kill processes on port if needed
    $portCleared = Kill-ProcessOnPort -Port $PORT
    
    if ($portCleared) {
        # Wait a moment for port to be fully released
        Start-Sleep -Seconds 2
        
        # Start the API server
        Start-ApiServer
    } else {
        Write-Host "❌ Could not clear port $PORT. Exiting." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Return to original directory
    Pop-Location -ErrorAction SilentlyContinue
}
