# Build GetFit iOS .ipa (Windows → Codemagic cloud)
# Usage:
#   .\scripts\build-ipa.ps1                    # prepare only
#   .\scripts\build-ipa.ps1 -Workflow ios-production
#   .\scripts\build-ipa.ps1 -Workflow ios-unsigned
#   $env:CODEMAGIC_API_TOKEN="..."; .\scripts\build-ipa.ps1 -Trigger

param(
    [ValidateSet("ios-production", "ios-development", "ios-unsigned")]
    [string]$Workflow = "ios-production",
    [switch]$Trigger,
    [string]$Branch = "main",
    [switch]$SkipPrepare
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$appVersion = $pkg.version

if (-not $SkipPrepare) {
    Write-Step "Building web assets (v$appVersion)"
    npm run build:mobile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Step "Syncing Capacitor iOS"
    npx cap sync ios
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`nProject prepared for iOS build." -ForegroundColor Green
Write-Host "  Bundle ID : com.siozostheoharis.getfit"
Write-Host "  Version   : $appVersion"
Write-Host "  Workflow  : $Workflow"

if (-not $Trigger) {
    Write-Host @"

Next step (Windows cannot build .ipa locally — needs macOS/Xcode):

  1. Push changes to GitHub:
       git add dist ios/App/App/public
       git commit -m "Prepare iOS build"
       git push origin $Branch

  2. Codemagic (https://codemagic.io/apps):
       - Open Gym-Stavroupoli
       - Start build → Use codemagic.yaml → workflow: $Workflow
       - Download .ipa from Artifacts when finished (~15-25 min)

  Or trigger from CLI:
       `$env:CODEMAGIC_API_TOKEN = "<token from Codemagic User Settings>"
       .\scripts\build-ipa.ps1 -Workflow $Workflow -Trigger -SkipPrepare

"@ -ForegroundColor Yellow
    exit 0
}

$token = $env:CODEMAGIC_API_TOKEN
if (-not $token) {
    Write-Host "ERROR: Set CODEMAGIC_API_TOKEN (Codemagic → User settings → Integrations → API token)" -ForegroundColor Red
    exit 1
}

Write-Step "Starting Codemagic build ($Workflow)"
python "$Root\codemagic_automation.py" $token $Workflow $Branch
