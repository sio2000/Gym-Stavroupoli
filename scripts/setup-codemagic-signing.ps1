# Codemagic setup steps 2 and 4 - run: .\scripts\setup-codemagic-signing.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$KeyFile = Join-Path $Root "ios_distribution_private_key"

$IssuerId = "48abdbcd-e5f5-477a-b7a5-d38d3871e636"
$KeyId = "73C3B2263N"
$IntegrationName = "Codemagic Integration"

Write-Host ""
Write-Host "=== CODEMAGIC SETUP (steps 2 and 4) ===" -ForegroundColor Cyan

if (-not (Test-Path $KeyFile)) {
    Write-Host "Generating CERTIFICATE_PRIVATE_KEY..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 2048 -m PEM -f $KeyFile -q -N '""'
}
Write-Host "[OK] Step 3: Private key at $KeyFile" -ForegroundColor Green

$step2 = @"
--- STEP 2: Codemagic Team integrations ---
URL: https://codemagic.io/teams
(Team settings -> Team integrations -> Developer Portal -> Connect/Edit)

Integration name (exact):
$IntegrationName

Issuer ID:
$IssuerId

Key ID:
$KeyId

API Key (.p8 file):
Upload AuthKey_${KeyId}.p8 from App Store Connect.
(If missing, create a NEW API key - .p8 downloads only once)
"@

Write-Host $step2
$step2 | Set-Clipboard
Write-Host "[OK] Step 2 values copied to clipboard!" -ForegroundColor Green

$keyContent = Get-Content $KeyFile -Raw
$keyContent | Set-Clipboard
Write-Host ""
Write-Host "--- STEP 4: Environment variables ---" -ForegroundColor White
Write-Host @"
URL: Codemagic -> Gym-Stavroupoli -> Environment variables

1. Add group: code-signing
2. Variable name: CERTIFICATE_PRIVATE_KEY
3. Value: paste from clipboard (Ctrl+V)
4. Secret: ON
5. Save
"@

Write-Host "[OK] Step 4: CERTIFICATE_PRIVATE_KEY copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "When done with steps 2 and 4, push and start ios-production build." -ForegroundColor Cyan
