-- SIMPLE QR CATEGORIES TEST
-- This script works with the actual database structure (is_active column)

-- Step 1: Check database structure
SELECT 
    'Database Structure' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Step 2: Check available packages
SELECT 
    'Available Packages' as info,
    package_type,
    name,
    is_active
FROM membership_packages
WHERE is_active = true
ORDER BY package_type;

-- Step 3: Check current memberships
SELECT 
    'Current Memberships' as info,
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
ORDER BY mp.package_type;

-- Step 4: Test QR category mapping
WITH active_memberships AS (
    SELECT 
        m.user_id,
        m.id as membership_id,
        m.is_active,
        m.end_date,
        mp.package_type,
        mp.name as package_name
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.is_active = true
      AND m.end_date >= CURRENT_DATE
),
qr_categories AS (
    SELECT 
        user_id,
        CASE 
            WHEN package_type = 'free_gym' THEN 'free_gym'
            WHEN package_type = 'pilates' THEN 'pilates'
            WHEN package_type = 'personal_training' THEN 'personal'
            WHEN package_type = 'personal' THEN 'personal'
            ELSE NULL
        END as qr_category,
        package_name,
        package_type,
        membership_id
    FROM active_memberships
    WHERE package_type IN ('free_gym', 'pilates', 'personal_training', 'personal')
)
SELECT 
    'QR Category Mapping' as info,
    user_id,
    qr_category,
    package_name,
    package_type,
    membership_id
FROM qr_categories
WHERE qr_category IS NOT NULL
ORDER BY user_id, qr_category;

-- Step 5: Check existing QR codes
SELECT 
    'Existing QR Codes' as info,
    category,
    status,
    COUNT(*) as count
FROM qr_codes
GROUP BY category, status
ORDER BY category, status;
