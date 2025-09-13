-- TEST QR MEMBERSHIP INTEGRATION
-- Run this to test the QR code membership integration

-- Step 1: Check if we have any active memberships
-- First check what columns exist
SELECT 
    'Memberships table structure:' as test_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Check memberships with both possible column names
SELECT 
    'Active Memberships Check (using is_active)' as test_name,
    COUNT(*) as total_memberships,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_memberships,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_memberships
FROM memberships;

-- Also try with status column if it exists
SELECT 
    'Active Memberships Check (using status)' as test_name,
    COUNT(*) as total_memberships,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_memberships,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_memberships
FROM memberships;

-- Step 2: Check specific user memberships (replace with actual user ID)
-- Try with is_active column first
SELECT 
    'User Memberships Check (using is_active)' as test_name,
    m.id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
  AND m.end_date >= CURRENT_DATE
ORDER BY m.end_date DESC
LIMIT 10;

-- Also try with status column if it exists
SELECT 
    'User Memberships Check (using status)' as test_name,
    m.id,
    m.user_id,
    m.status,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.status = 'active'
  AND m.end_date >= CURRENT_DATE
ORDER BY m.end_date DESC
LIMIT 10;

-- Step 3: Check package types available
SELECT 
    'Package Types Available' as test_name,
    package_type,
    COUNT(*) as count
FROM membership_packages
WHERE is_active = true
GROUP BY package_type;

-- Step 4: Test the query that will be used by the QR system
-- This simulates what getUserActiveMembershipsForQR will do
-- Try with is_active column first
SELECT 
    'QR Integration Test (using is_active)' as test_name,
    m.id,
    m.package_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
  AND m.end_date >= CURRENT_DATE
  AND mp.package_type IN ('free_gym', 'pilates', 'personal_training')
ORDER BY m.end_date DESC;

-- Also try with status column if it exists
SELECT 
    'QR Integration Test (using status)' as test_name,
    m.id,
    m.package_id,
    m.status,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.status = 'active'
  AND m.end_date >= CURRENT_DATE
  AND mp.package_type IN ('free_gym', 'pilates', 'personal_training')
ORDER BY m.end_date DESC;

-- Step 5: Check if we have any QR codes already
SELECT 
    'Existing QR Codes' as test_name,
    category,
    status,
    COUNT(*) as count
FROM qr_codes
GROUP BY category, status
ORDER BY category, status;
