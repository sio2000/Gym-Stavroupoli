-- Verify QR System Works
-- This script verifies that the QR system is working correctly

-- ========================================
-- STEP 1: CHECK FEATURE FLAG
-- ========================================

SELECT 'STEP 1: Checking feature flag...' as step;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- ========================================
-- STEP 2: CHECK USER'S PILATES MEMBERSHIP
-- ========================================

SELECT 'STEP 2: Checking user Pilates membership...' as step;

-- Check the test user's Pilates membership
SELECT 
    m.id as membership_id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.id as package_id,
    mp.name as package_name,
    mp.package_type,
    CASE 
        WHEN m.is_active = true AND m.end_date >= CURRENT_DATE THEN 'ACTIVE'
        ELSE 'INACTIVE'
    END as membership_status
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '9adf938d-6b00-4264-b8f8-11b7d140b6f7'
AND (mp.package_type = 'pilates' OR mp.name ILIKE '%pilates%')
ORDER BY m.end_date DESC;

-- ========================================
-- STEP 3: CHECK QR SYSTEM TABLES
-- ========================================

SELECT 'STEP 3: Checking QR system tables...' as step;

-- Check if qr_codes table exists and has proper structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'qr_codes'
ORDER BY ordinal_position;

-- ========================================
-- STEP 4: CHECK RLS POLICIES
-- ========================================

SELECT 'STEP 4: Checking RLS policies...' as step;

SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('feature_flags', 'qr_codes')
ORDER BY tablename, policyname;

-- ========================================
-- STEP 5: SUCCESS MESSAGE
-- ========================================

SELECT 'STEP 5: QR System verification completed!' as result;
