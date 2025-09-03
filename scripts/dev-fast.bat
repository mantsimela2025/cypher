@echo off
echo 🚀 Starting CYPHER in Fast Development Mode...
echo ⚡ Heavy services will be deferred for faster startup

REM Set environment variables for fast startup
set DEFER_SERVICE_INIT=true
set STARTUP_TIMING=true
set VERBOSE_LOGGING=false

REM Run the development script
npm run dev

REM Clean up environment variables
set DEFER_SERVICE_INIT=
set STARTUP_TIMING=
set VERBOSE_LOGGING=
