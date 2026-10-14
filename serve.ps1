# Municipality of Buenavista — Building Permit Processing System
# Main Application Launcher (Vite React Portal on port 5174)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Municipality of Buenavista — Building Permit System     " -ForegroundColor Cyan
Write-Host "  Main Application: Vite React Portal (Port 5174)         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check node_modules in buenavista
if (-not (Test-Path "buenavista\node_modules")) {
    Write-Host "[*] Installing frontend dependencies in buenavista..." -ForegroundColor Yellow
    npm.cmd install --prefix buenavista
    Write-Host ""
}

Write-Host "[*] Starting Buenavista application on http://localhost:5174..." -ForegroundColor Green
npm.cmd run dev --prefix buenavista
