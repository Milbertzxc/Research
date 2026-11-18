# Municipality of Buenavista — Building Permit Processing System
# Complete Full-Stack System Launcher

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Municipality of Buenavista — Building Permit System     " -ForegroundColor Cyan
Write-Host "  Unified Full-Stack System Launcher                      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check and Start MySQL if needed
$mysqlPort = Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue
if (-not $mysqlPort) {
    Write-Host "[*] Starting MariaDB/MySQL service..." -ForegroundColor Yellow
    $xamppMysql = "C:\xampp\mysql\bin\mysqld.exe"
    $xamppIni = "C:\xampp\mysql\bin\my.ini"
    if (Test-Path $xamppMysql) {
        Start-Process -FilePath $xamppMysql -ArgumentList "--defaults-file=$xamppIni --standalone" -WorkingDirectory "C:\xampp\mysql" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "[✓] MySQL database service is running on port 3306." -ForegroundColor Green
}

# 2. Check and Start Express Backend API on port 3000
$backendPort = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "[*] Starting MPDO Express Backend API on port 3000..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
    Start-Sleep -Seconds 2
} else {
    Write-Host "[✓] Express Backend API is running on http://localhost:3000." -ForegroundColor Green
}

# 3. Check frontend node_modules
if (-not (Test-Path "$PSScriptRoot\buenavista\node_modules")) {
    Write-Host "[*] Installing frontend dependencies in buenavista..." -ForegroundColor Yellow
    npm.cmd install --prefix buenavista
    Write-Host ""
}

# 4. Open default browser to the Buenavista application
Write-Host "[*] Launching system in browser at http://localhost:5174..." -ForegroundColor Cyan
Start-Process "http://localhost:5174"

# 5. Start Vite React Frontend
$frontendPort = Get-NetTCPConnection -State Listen -LocalPort 5174 -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "[✓] Vite Frontend is already actively running on http://localhost:5174." -ForegroundColor Green
    Write-Host "System is fully operational!" -ForegroundColor Green
} else {
    Write-Host "[*] Starting Vite React server on http://localhost:5174..." -ForegroundColor Green
    npm.cmd run dev --prefix buenavista
}
