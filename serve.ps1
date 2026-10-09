# MPDO XAMPP Server Launcher
# Starts the Node.js Express server with XAMPP MySQL backend

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MPDO Building Permit System (XAMPP)" -ForegroundColor Cyan
Write-Host "  Backend: Node.js Express + XAMPP MySQL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# XAMPP Instructions
Write-Host "[XAMPP CHECKLIST]" -ForegroundColor Yellow
Write-Host "  1. Open XAMPP Control Panel" -ForegroundColor White
Write-Host "  2. Start 'MySQL' module (and 'Apache' if using phpMyAdmin)" -ForegroundColor White
Write-Host "  3. phpMyAdmin Access: http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "  4. Database created automatically: 'mpdo_db'" -ForegroundColor White
Write-Host ""

# Start the server
Write-Host "[*] Starting Express server on port 3000..." -ForegroundColor Green
Write-Host ""
node server.js
