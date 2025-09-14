-- TEST ALL QR CATEGORIES
-- This script tests QR code generation for all categories (Free Gym, Pilates, Personal Training)

-- Step 1: Check current database structure
SELECT 
    'Database Structure Check' as test_name,
    'memberships' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Step 2: Check available package types
SELECT 
    'Available Package Types' as test_name,
    package_type,
    name,
    is_active,
    COUNT(*) as count
FROM membership_packages
GROUP BY package_type, name, is_active
ORDER BY package_type;

-- Step 3: Check current memberships
SELECT 
    'Current Memberships' as test_name,
    m.id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY m.end_date DESC;

-- Step 4: Test QR category mapping logic
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
    WHERE m.user_id IS NOT NULL
      AND m.is_active = true
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
    FROM user_memberships
    WHERE package_type IN ('free_gym', 'pilates', 'personal_training', 'personal')
)
SELECT 
    'QR Category Mapping Test' as test_name,
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
    'Existing QR Codes' as test_name,
    category,
    status,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM qr_codes
GROUP BY category, status
ORDER BY category, status;

-- Step 6: Test specific user scenario (replace with actual user ID)
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your database
DO $$
DECLARE
    test_user_id UUID;
    free_gym_count INTEGER;
    pilates_count INTEGER;
    personal_count INTEGER;
BEGIN
    -- Get a test user ID (first user with memberships)
    SELECT user_id INTO test_user_id 
    FROM memberships 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users with memberships found. Please create some test data first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing QR categories for user: %', test_user_id;
    
    -- Check Free Gym membership
    SELECT COUNT(*) INTO free_gym_count
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = test_user_id
      AND mp.package_type = 'free_gym'
      AND m.is_active = true
      AND m.end_date >= CURRENT_DATE;
    
    -- Check Pilates membership
    SELECT COUNT(*) INTO pilates_count
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = test_user_id
      AND mp.package_type = 'pilates'
      AND m.is_active = true
      AND m.end_date >= CURRENT_DATE;
    
    -- Check Personal Training membership
    SELECT COUNT(*) INTO personal_count
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = test_user_id
      AND mp.package_type IN ('personal_training', 'personal')
      AND m.is_active = true
      AND m.end_date >= CURRENT_DATE;
    
    RAISE NOTICE 'User % should see QR options for:', test_user_id;
    IF free_gym_count > 0 THEN
        RAISE NOTICE '  ✅ Free Gym (count: %)', free_gym_count;
    ELSE
        RAISE NOTICE '  ❌ Free Gym (no active membership)';
    END IF;
    
    IF pilates_count > 0 THEN
        RAISE NOTICE '  ✅ Pilates (count: %)', pilates_count;
    ELSE
        RAISE NOTICE '  ❌ Pilates (no active membership)';
    END IF;
    
    IF personal_count > 0 THEN
        RAISE NOTICE '  ✅ Personal Training (count: %)', personal_count;
    ELSE
        RAISE NOTICE '  ❌ Personal Training (no active membership)';
    END IF;
    
END $$;
