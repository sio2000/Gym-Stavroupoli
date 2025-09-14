-- TEST FREE GYM QR CODE GENERATION
-- This script tests the Free Gym QR code functionality

-- Step 1: Check current memberships with 'standard' package type
SELECT 
    'Current Standard Package Memberships' as info,
    m.id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE mp.package_type = 'standard'
  AND m.is_active = true
  AND m.end_date >= CURRENT_DATE
ORDER BY m.end_date DESC;

-- Step 2: Check if these memberships should map to Free Gym QR category
WITH standard_memberships AS (
    SELECT 
        m.user_id,
        m.id as membership_id,
        m.is_active,
        m.end_date,
        mp.package_type,
        mp.name as package_name
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE mp.package_type = 'standard'
      AND m.is_active = true
      AND m.end_date >= CURRENT_DATE
)
SELECT 
    'QR Category Mapping Test' as info,
    user_id,
    membership_id,
    package_name,
    package_type,
    CASE 
        WHEN package_type = 'standard' THEN 'free_gym'
        ELSE 'unknown'
    END as mapped_qr_category
FROM standard_memberships
ORDER BY user_id;

-- Step 3: Check existing QR codes for free_gym category
SELECT 
    'Existing Free Gym QR Codes' as info,
    category,
    status,
    COUNT(*) as count
FROM qr_codes
WHERE category = 'free_gym'
GROUP BY category, status;

-- Step 4: Test the complete flow
-- This simulates what the frontend will do
WITH user_memberships AS (
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
            WHEN package_type = 'standard' THEN 'free_gym'
            WHEN package_type = 'pilates' THEN 'pilates'
            WHEN package_type = 'personal_training' THEN 'personal'
            WHEN package_type = 'personal' THEN 'personal'
            ELSE NULL
        END as qr_category,
        package_name,
        package_type,
        membership_id
    FROM user_memberships
    WHERE package_type IN ('standard', 'pilates', 'personal_training', 'personal')
)
SELECT 
    'Final QR Category Test' as info,
    user_id,
    qr_category,
    package_name,
    package_type,
    membership_id
FROM qr_categories
WHERE qr_category IS NOT NULL
ORDER BY user_id, qr_category;
