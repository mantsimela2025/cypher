# PowerShell script to kill processes using port 3001
Write-Host "Checking for processes using port 3001..." -ForegroundColor Yellow

$processes = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($processes) {
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
        
        Write-Host "Found process using port 3001: PID $pid ($processName)" -ForegroundColor Red
        
        try {
            Stop-Process -Id $pid -Force
            Write-Host "Process $pid terminated successfully." -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to terminate process $pid: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found using port 3001." -ForegroundColor Green
}

Write-Host "Port 3001 should now be available." -ForegroundColor Cyan
