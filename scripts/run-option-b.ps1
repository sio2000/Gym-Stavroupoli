# Option B: trigger Codemagic ios-production with all signing secrets
param(
    [Parameter(Mandatory = $false)]
    [string]$Token,
    [string]$Workflow = "ios-production",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not $Token) {
    $envPath = Join-Path $Root ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match '^\s*CODEMAGIC_API_TOKEN\s*=\s*(.+)$') {
                $Token = $matches[1].Trim().Trim('"').Trim("'")
            }
        }
    }
}

if (-not $Token) {
    Write-Host ""
    Write-Host "Codemagic API token required." -ForegroundColor Yellow
    Write-Host "Get it: https://codemagic.io -> User settings -> Integrations -> API token"
    Write-Host ""
    $Token = Read-Host "Paste CODEMAGIC_API_TOKEN"
    if (-not $Token) { exit 1 }

    $envLine = "CODEMAGIC_API_TOKEN=$Token"
    $envPath = Join-Path $Root ".env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath -Raw
        if ($content -match 'CODEMAGIC_API_TOKEN') {
            $content = $content -replace 'CODEMAGIC_API_TOKEN=.*', $envLine
        } else {
            $content = $content.TrimEnd() + "`n" + $envLine + "`n"
        }
        Set-Content -Path $envPath -Value $content -NoNewline
    } else {
        Set-Content -Path $envPath -Value $envLine
    }
    Write-Host "[OK] Saved to .env" -ForegroundColor Green
}

$env:CODEMAGIC_API_TOKEN = $Token
$p8 = Get-Content "$Root\secrets\AuthKey_73C3B2263N.p8" -Raw
$cert = Get-Content "$Root\ios_distribution_private_key" -Raw
$appId = "6a1a2f74cb8a2764eefe6e22"
$body = @{
  appId = $appId
  workflowId = $Workflow
  branch = $Branch
  environment = @{
    variables = @{
      APP_STORE_CONNECT_ISSUER_ID = "48abdbcd-e5f5-477a-b7a5-d38d3871e636"
      APP_STORE_CONNECT_KEY_IDENTIFIER = "73C3B2263N"
      APP_STORE_CONNECT_PRIVATE_KEY = $p8.Trim()
      CERTIFICATE_PRIVATE_KEY = $cert.Trim()
    }
  }
} | ConvertTo-Json -Depth 5
$headers = @{ 'x-auth-token' = $Token; 'Content-Type' = 'application/json' }
$r = Invoke-RestMethod -Uri 'https://api.codemagic.io/builds' -Headers $headers -Method Post -Body $body
Write-Host "Build started: $($r.buildId)"
Write-Host "https://codemagic.io/app/$appId/build/$($r.buildId)"
