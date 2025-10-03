@echo off
echo Running database fix for installment functionality...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: psql command not found. Please ensure PostgreSQL is installed and in PATH.
    echo.
    echo You can run the fix manually by:
    echo 1. Opening a PostgreSQL client (pgAdmin, DBeaver, etc.)
    echo 2. Connecting to your database
    echo 3. Running the FIX_DATABASE_ISSUES.sql file
    echo.
    pause
    exit /b 1
)

echo Running database fix...
psql -h localhost -U postgres -d getfitskg -f FIX_DATABASE_ISSUES.sql

if %ERRORLEVEL% equ 0 (
    echo.
    echo Database fix completed successfully!
    echo.
    echo Now running comprehensive test...
    psql -h localhost -U postgres -d getfitskg -f COMPREHENSIVE_TEST.sql
) else (
    echo.
    echo Database fix failed with error code %ERRORLEVEL%
)

echo.
pause
