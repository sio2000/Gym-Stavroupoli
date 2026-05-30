# Writes Codemagic env values to clipboard (one at a time) for UI paste
# Or triggers build with all secrets if CODEMAGIC_API_TOKEN is set
param(
    [switch]$TriggerBuild,
    [string]$Workflow = "ios-production",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SecretsDir = Join-Path $Root "secrets"
$P8File = Join-Path $SecretsDir "AuthKey_73C3B2263N.p8"
$CertKeyFile = Join-Path $Root "ios_distribution_private_key"

$IssuerId = "48abdbcd-e5f5-477a-b7a5-d38d3871e636"
$KeyId = "73C3B2263N"

if (-not (Test-Path $P8File)) {
    Write-Host "Missing $P8File - run setup first." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $CertKeyFile)) {
    Write-Host "Generating RSA CERTIFICATE_PRIVATE_KEY..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 2048 -m PEM -f $CertKeyFile -q -N '""'
}

$p8 = Get-Content $P8File -Raw
$certKey = Get-Content $CertKeyFile -Raw

$vars = [ordered]@{
    "APP_STORE_CONNECT_ISSUER_ID"       = $IssuerId
    "APP_STORE_CONNECT_KEY_IDENTIFIER"  = $KeyId
    "APP_STORE_CONNECT_PRIVATE_KEY"     = $p8.Trim()
    "CERTIFICATE_PRIVATE_KEY"           = $certKey.Trim()
}

Write-Host "`n=== Codemagic group: code-signing ===" -ForegroundColor Cyan
Write-Host "Add these 4 variables in Codemagic UI (all Secret=ON):`n"

$i = 1
foreach ($kv in $vars.GetEnumerator()) {
    Write-Host "[$i/4] $($kv.Key)" -ForegroundColor Yellow
    $kv.Value | Set-Clipboard
    Write-Host "  -> Copied to clipboard. Paste in Codemagic, then press Enter for next..."
    if ($i -lt 4) { Read-Host "  Press Enter when saved" }
    $i++
}

Write-Host "`n[OK] All 4 variables ready for Codemagic UI." -ForegroundColor Green

if ($TriggerBuild) {
    $token = $env:CODEMAGIC_API_TOKEN
    if (-not $token) {
        $envFile = Join-Path $Root ".env"
        if (Test-Path $envFile) {
            Get-Content $envFile | ForEach-Object {
                if ($_ -match '^\s*CODEMAGIC_API_TOKEN\s*=\s*(.+)$') {
                    $token = $matches[1].Trim().Trim('"').Trim("'")
                }
            }
        }
    }
    if (-not $token) {
        Write-Host "Set CODEMAGIC_API_TOKEN in .env to auto-trigger builds." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "Starting Codemagic build: $Workflow ..." -ForegroundColor Cyan
    $envObj = @{ variables = @{} }
    foreach ($kv in $vars.GetEnumerator()) { $envObj.variables[$kv.Key] = $kv.Value }

    $body = @{
        appId = $null
        workflowId = $Workflow
        branch = $Branch
        environment = @{
            variables = $envObj.variables
            groups = @("code-signing")
        }
    } | ConvertTo-Json -Depth 5

    python "$Root\codemagic_automation.py" $token $Workflow $Branch
}
