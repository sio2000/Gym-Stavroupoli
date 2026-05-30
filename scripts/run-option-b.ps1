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
python "$Root\scripts\codemagic_trigger_build.py" $Token $Workflow $Branch
