# PowerShell script to update AuthContext
Write-Host "==========================================" -ForegroundColor Green
Write-Host "UPDATING AUTH CONTEXT TO FIX INFINITE RECURSION" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Step 1: Backing up current AuthContext..." -ForegroundColor Yellow
if (Test-Path "src\contexts\AuthContext.tsx") {
    Copy-Item "src\contexts\AuthContext.tsx" "src\contexts\AuthContext.backup.tsx"
    Write-Host "✓ Backup created: AuthContext.backup.tsx" -ForegroundColor Green
} else {
    Write-Host "✗ AuthContext.tsx not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Replacing with fixed version..." -ForegroundColor Yellow
if (Test-Path "src\contexts\AuthContextFixed.tsx") {
    Copy-Item "src\contexts\AuthContextFixed.tsx" "src\contexts\AuthContext.tsx"
    Write-Host "✓ AuthContext.tsx updated with safe functions" -ForegroundColor Green
} else {
    Write-Host "✗ AuthContextFixed.tsx not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Cleanup..." -ForegroundColor Yellow
if (Test-Path "src\contexts\AuthContextFixed.tsx") {
    Remove-Item "src\contexts\AuthContextFixed.tsx"
    Write-Host "✓ Temporary files cleaned up" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "AUTH CONTEXT UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The AuthContext now uses safe functions that avoid" -ForegroundColor Cyan
Write-Host "the infinite recursion issue. Your signup/login" -ForegroundColor Cyan
Write-Host "should work much faster now." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run the SQL fix: apply_fix_now.sql" -ForegroundColor White
Write-Host "2. Test signup/login in your app" -ForegroundColor White
Write-Host "3. If you need to rollback, restore from AuthContext.backup.tsx" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"

