# PowerShell script to run Ultimate locking fix
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4NzAsImV4cCI6MjA1MDU1MDg3MH0.2BwL3d7Qj8LfYz3B"
$baseUrl = "https://nolqodpfaqdnprixaqlo.supabase.co"

# Read the SQL file
$sqlContent = Get-Content -Path "ULTIMATE_LOCKING_FIX.sql" -Raw

# Escape the SQL content for JSON
$sqlEscaped = $sqlContent -replace '"', '\"' -replace "`n", '\n' -replace "`r", ''

# Create the request body
$body = @{
    sql = $sqlEscaped
} | ConvertTo-Json

# Set headers
$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "Running Ultimate locking fix..."
Write-Host "SQL Content length: $($sqlContent.Length) characters"

try {
    # Execute the SQL
    $response = Invoke-RestMethod -Uri "$baseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
    
    Write-Host "Success! Response:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
