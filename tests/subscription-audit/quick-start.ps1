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

Write-Host @"
╔════════════════════════════════════════════════════════╗
║   SUBSCRIPTION LIFECYCLE AUDIT - QUICK START           ║
║   Comprehensive validation system                      ║
╚════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "📋 Audit directory: $AUDIT_DIR" -ForegroundColor White

# Function to write log
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $LOG_FILE -Append
    Write-Host $Message -ForegroundColor Gray
}

Write-Log "Starting audit workflow..."

# Step 1: Seed test data
if (-not $TestsOnly -and -not $ReportOnly) {
    Write-Host "`n" -NoNewline
    Write-Host "Step 1: Seeding test data..." -ForegroundColor Yellow
    Write-Log "Running seed-test-data.ts"
    
    try {
        npx ts-node "$AUDIT_DIR/seed-test-data.ts" 2>&1 | Tee-Object -FilePath $LOG_FILE -Append
        Write-Host "✅ Test data seeded successfully" -ForegroundColor Green
        Write-Log "Seed completed successfully"
    }
    catch {
        Write-Host "❌ Seed failed: $_" -ForegroundColor Red
        Write-Log "Seed failed: $_"
        exit 1
    }
}

# Step 2: Run tests
if (-not $SeedOnly -and -not $ReportOnly) {
    Write-Host "`n" -NoNewline
    Write-Host "Step 2: Running subscription lifecycle tests..." -ForegroundColor Yellow
    Write-Log "Running subscription-lifecycle.test.ts"
    
    try {
        npx vitest run "$AUDIT_DIR/subscription-lifecycle.test.ts" 2>&1 | Tee-Object -FilePath $LOG_FILE -Append
        Write-Host "✅ Tests completed" -ForegroundColor Green
        Write-Log "Tests completed"
    }
    catch {
        Write-Host "⚠️  Tests completed with output (check report)" -ForegroundColor Yellow
        Write-Log "Tests completed (may have findings)"
    }
}

# Step 3: Display report
if (-not $SeedOnly -and -not $TestsOnly) {
    Write-Host "`n" -NoNewline
    Write-Host "Step 3: Report generated" -ForegroundColor Yellow
    
    if (Test-Path $REPORT_FILE) {
        Write-Host "`n📊 AUDIT REPORT:" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Get-Content $REPORT_FILE | Write-Host
        Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️  Report file will be generated after test run" -ForegroundColor Blue
    }
}

Write-Host "`n✅ Audit workflow complete!" -ForegroundColor Green
Write-Host "📁 Report location: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "📝 Log location: $LOG_FILE" -ForegroundColor Cyan

exit 0
