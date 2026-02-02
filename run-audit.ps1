# PowerShell script to run subscription audit tests
# Usage: powershell -ExecutionPolicy Bypass -File run-audit.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      SUBSCRIPTION LIFECYCLE AUDIT - FULL TEST RUN      ║" -ForegroundColor Cyan
Write-Host "║              Running all business logic tests          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow
if (-not $env:VITE_SUPABASE_URL) {
    Write-Host "❌ VITE_SUPABASE_URL not set" -ForegroundColor Red
    exit 1
}
if (-not $env:VITE_SUPABASE_ANON_KEY) {
    Write-Host "❌ VITE_SUPABASE_ANON_KEY not set" -ForegroundColor Red
    exit 1
}
if (-not $env:VITE_SUPABASE_SERVICE_KEY) {
    Write-Host "❌ VITE_SUPABASE_SERVICE_KEY not set" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""

# Set environment variable for service role key (used by seed and tests)
$env:SUPABASE_SERVICE_ROLE_KEY = $env:VITE_SUPABASE_SERVICE_KEY

Write-Host "📌 STEP 1: Seed test data" -ForegroundColor Cyan
Write-Host "─────────────────────────" -ForegroundColor Cyan
npx ts-node tests/subscription-audit/seed-test-data.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed test data" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "📌 STEP 2: Run lifecycle tests" -ForegroundColor Cyan
Write-Host "───────────────────────────────" -ForegroundColor Cyan
npx vitest run tests/subscription-audit/subscription-lifecycle.test.ts --reporter=verbose
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Tests completed (check output above for details)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📌 STEP 3: Display audit report" -ForegroundColor Cyan
Write-Host "────────────────────────────────" -ForegroundColor Cyan
if (Test-Path "tests/subscription-audit/AUDIT_REPORT.md") {
    Write-Host ""
    Get-Content "tests/subscription-audit/AUDIT_REPORT.md"
} else {
    Write-Host "⚠️  AUDIT_REPORT.md not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Audit complete!" -ForegroundColor Green
