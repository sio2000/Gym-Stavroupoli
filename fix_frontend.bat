@echo off
echo ==========================================
echo FIXING FRONTEND - INFINITE RECURSION
echo ==========================================

echo.
echo Step 1: Backing up current AuthContext...
if exist "src\contexts\AuthContext.tsx" (
    copy "src\contexts\AuthContext.tsx" "src\contexts\AuthContext.backup.tsx"
    echo ✓ Backup created: AuthContext.backup.tsx
) else (
    echo ✗ AuthContext.tsx not found!
    pause
    exit /b 1
)

echo.
echo Step 2: Replacing with fixed version...
if exist "src\contexts\AuthContextFixed.tsx" (
    copy "src\contexts\AuthContextFixed.tsx" "src\contexts\AuthContext.tsx"
    echo ✓ AuthContext.tsx updated with safe functions
) else (
    echo ✗ AuthContextFixed.tsx not found!
    pause
    exit /b 1
)

echo.
echo Step 3: Cleanup...
if exist "src\contexts\AuthContextFixed.tsx" (
    del "src\contexts\AuthContextFixed.tsx"
    echo ✓ Temporary files cleaned up
)

echo.
echo ==========================================
echo FRONTEND FIX COMPLETE!
echo ==========================================
echo.
echo The AuthContext now uses safe functions that avoid
echo the infinite recursion issue. Your signup/login
echo should work much faster now.
echo.
echo Next steps:
echo 1. Restart your development server
echo 2. Test signup/login in your app
echo 3. If you need to rollback, restore from AuthContext.backup.tsx
echo.
pause

