@echo off
echo ==========================================
echo RUNNING INFINITE RECURSION FIX
echo ==========================================

echo.
echo Step 1: Running PowerShell script to update AuthContext...
powershell -ExecutionPolicy Bypass -File "update_auth_context.ps1"

echo.
echo Step 2: Fix complete!
echo.
echo Next steps:
echo 1. Run the SQL fix: apply_fix_now.sql in Supabase
echo 2. Test signup/login in your app
echo.
pause

