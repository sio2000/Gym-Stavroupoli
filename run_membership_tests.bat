@echo off
echo ========================================
echo MEMBERSHIP FILTERING TESTS
echo ========================================
echo.

echo Step 1: Testing expired memberships detection...
echo.

echo Checking for expired memberships in database...
echo SELECT user_id, package_id, start_date, end_date, is_active, status FROM memberships WHERE is_active = true AND end_date ^< CURRENT_DATE ORDER BY end_date DESC LIMIT 10;
echo.

echo Step 2: Testing active memberships filtering...
echo.
echo Checking active memberships (should not include expired ones)...
echo SELECT user_id, package_id, start_date, end_date, is_active, status FROM memberships WHERE is_active = true AND end_date ^>= CURRENT_DATE ORDER BY end_date DESC LIMIT 10;
echo.

echo Step 3: Testing membership scenarios...
echo.
echo Running test scenarios...
node test_membership_api.js
echo.

echo Step 4: Manual database verification...
echo.
echo Please run the following SQL queries manually in your database:
echo.
echo 1. Check all memberships for a specific user:
echo SELECT m.user_id, mp.name as package_name, m.start_date, m.end_date, m.is_active, m.status FROM memberships m JOIN membership_packages mp ON m.package_id = mp.id WHERE m.user_id = 'USER_ID_HERE' ORDER BY m.end_date DESC;
echo.
echo 2. Check only active (non-expired) memberships:
echo SELECT m.user_id, mp.name as package_name, m.start_date, m.end_date, m.is_active, m.status FROM memberships m JOIN membership_packages mp ON m.package_id = mp.id WHERE m.user_id = 'USER_ID_HERE' AND m.is_active = true AND m.end_date ^>= CURRENT_DATE ORDER BY m.end_date DESC;
echo.
echo 3. Check expired memberships that should be filtered out:
echo SELECT m.user_id, mp.name as package_name, m.start_date, m.end_date, m.is_active, m.status FROM memberships m JOIN membership_packages mp ON m.package_id = mp.id WHERE m.user_id = 'USER_ID_HERE' AND m.is_active = true AND m.end_date ^< CURRENT_DATE ORDER BY m.end_date DESC;
echo.

echo ========================================
echo TESTS COMPLETED
echo ========================================
pause
