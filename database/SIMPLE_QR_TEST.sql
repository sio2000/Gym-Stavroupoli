-- SIMPLE QR MEMBERSHIP TEST
-- This script will work regardless of the table structure

-- Step 1: Check what columns exist in memberships table
SELECT 
    'Memberships table columns:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Step 2: Check if table has any data
SELECT 
    'Total rows in memberships:' as info,
    COUNT(*) as count
FROM memberships;

-- Step 3: Check if membership_packages table exists and has data
SELECT 
    'Package types available:' as info,
    package_type,
    COUNT(*) as count
FROM membership_packages
WHERE is_active = true
GROUP BY package_type;

-- Step 4: Try to get some sample data (this will work with any structure)
SELECT 
    'Sample memberships data:' as info,
    m.id,
    m.user_id,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY m.end_date DESC
LIMIT 5;

-- Step 5: Check QR codes table
SELECT 
    'QR codes table info:' as info,
    category,
    status,
    COUNT(*) as count
FROM qr_codes
GROUP BY category, status
ORDER BY category, status;
