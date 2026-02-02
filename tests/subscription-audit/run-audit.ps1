# SUBSCRIPTION AUDIT - QUICK START SCRIPT (PowerShell)
# =====================================================
# This script automates the complete audit workflow on Windows

param(
    [switch]$SeedOnly,
    [switch]$TestsOnly,
    [switch]$ReportOnly
)

$ErrorActionPreference = "Stop"

$AUDIT_DIR = "tests/subscription-audit"
$LOG_FILE = "$AUDIT_DIR/audit.log"
$REPORT_FILE = "$AUDIT_DIR/AUDIT_REPORT.md"

# Create log directory
if (-not (Test-Path $AUDIT_DIR)) {
    New-Item -ItemType Directory -Path $AUDIT_DIR -Force | Out-Null
}

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SUBSCRIPTION LIFECYCLE AUDIT - QUICK START           ║" -ForegroundColor Cyan
Write-Host "║   Comprehensive validation system                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Audit directory: $AUDIT_DIR" -ForegroundColor White

# Step 1: Seed test data
if (-not $TestsOnly -and -not $ReportOnly) {
    Write-Host ""
    Write-Host "Step 1: Seeding test data..." -ForegroundColor Yellow
    
    try {
        npx ts-node "$AUDIT_DIR/seed-test-data.ts" 2>&1 | Tee-Object -FilePath $LOG_FILE -Append
        Write-Host "✅ Test data seeded successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Seed failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Run tests
if (-not $SeedOnly -and -not $ReportOnly) {
    Write-Host ""
    Write-Host "Step 2: Running subscription lifecycle tests..." -ForegroundColor Yellow
    
    try {
        npx vitest run "$AUDIT_DIR/subscription-lifecycle.test.ts" 2>&1 | Tee-Object -FilePath $LOG_FILE -Append
        Write-Host "✅ Tests completed" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Tests completed with findings (check report)" -ForegroundColor Yellow
    }
}

# Step 3: Display report
if (-not $SeedOnly -and -not $TestsOnly) {
    Write-Host ""
    Write-Host "Step 3: Report generated" -ForegroundColor Yellow
    
    if (Test-Path $REPORT_FILE) {
        Write-Host ""
        Write-Host "📊 AUDIT REPORT:" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Get-Content $REPORT_FILE | Write-Host
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️  Report file will be generated after test run" -ForegroundColor Blue
    }
}

Write-Host ""
Write-Host "✅ Audit workflow complete!" -ForegroundColor Green
Write-Host "📁 Report location: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "📝 Log location: $LOG_FILE" -ForegroundColor Cyan

exit 0
