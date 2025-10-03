@echo off
echo Running comprehensive database test for installment functionality...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: psql command not found. Please ensure PostgreSQL is installed and in PATH.
    echo.
    echo You can run the test manually by:
    echo 1. Opening a PostgreSQL client (pgAdmin, DBeaver, etc.)
    echo 2. Connecting to your database
    echo 3. Running the COMPREHENSIVE_TEST.sql file
    echo.
    pause
    exit /b 1
)

echo Running comprehensive test...
psql -h localhost -U postgres -d getfitskg -f COMPREHENSIVE_TEST.sql

if %ERRORLEVEL% equ 0 (
    echo.
    echo Test completed successfully!
) else (
    echo.
    echo Test failed with error code %ERRORLEVEL%
)

echo.
pause
