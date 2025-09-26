# Performance Test Script for Admin Panel
Write-Host "🚀 Testing Admin Panel Performance..." -ForegroundColor Green

$url = "http://localhost:5173/admin/users"
$maxTime = 2000 # 2 seconds

Write-Host "📊 Testing URL: $url" -ForegroundColor Cyan

try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
    
    $stopwatch.Stop()
    $loadTime = $stopwatch.ElapsedMilliseconds
    
    Write-Host "✅ Request completed!" -ForegroundColor Green
    Write-Host "📈 Load Time: $loadTime ms" -ForegroundColor Yellow
    Write-Host "📊 Status Code: $($response.StatusCode)" -ForegroundColor Yellow
    Write-Host "📦 Content Length: $($response.Content.Length) bytes" -ForegroundColor Yellow
    
    if ($loadTime -le $maxTime) {
        Write-Host "🎉 PERFORMANCE TEST PASSED!" -ForegroundColor Green
        Write-Host "   Load time ($loadTime ms) is within acceptable limits (≤$maxTime ms)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PERFORMANCE TEST FAILED!" -ForegroundColor Red
        Write-Host "   Load time ($loadTime ms) exceeds acceptable limits (≤$maxTime ms)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the development server is running (npm run dev)" -ForegroundColor Yellow
}

Write-Host "`n💡 Performance Recommendations:" -ForegroundColor Cyan
Write-Host "   • Use data caching for tabs" -ForegroundColor White
Write-Host "   • Implement lazy loading" -ForegroundColor White
Write-Host "   • Optimize database queries" -ForegroundColor White
Write-Host "   • Reduce bundle size" -ForegroundColor White
