@echo off
echo Checking for processes using port 3001...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Found process using port 3001: %%a
    taskkill /PID %%a /F
    echo Process %%a terminated.
)

echo Port 3001 should now be available.
pause
