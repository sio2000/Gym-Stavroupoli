@echo off
echo 🚀 Testing Admin Panel Performance...
echo.

set URL=http://localhost:5173/admin/users
set MAX_TIME=2000

echo 📊 Testing URL: %URL%
echo.

echo ⏱️  Measuring load time...
powershell -Command "Measure-Command { Invoke-WebRequest -Uri '%URL%' -TimeoutSec 10 -UseBasicParsing | Out-Null } | Select-Object -ExpandProperty TotalMilliseconds"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Performance test completed successfully!
    echo 🎉 Admin Panel is responding normally.
) else (
    echo ❌ Performance test failed!
    echo 💡 Make sure the development server is running: npm run dev
)

echo.
echo 💡 Performance Recommendations:
echo    • Use data caching for tabs
echo    • Implement lazy loading
echo    • Optimize database queries
echo    • Reduce bundle size
echo.
pause
