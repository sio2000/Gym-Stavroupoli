-- Test QR System Access
-- This script tests if the QR system is accessible to users

-- ========================================
-- STEP 1: CHECK FEATURE FLAG STATUS
-- ========================================

SELECT 'Checking feature flag status...' as step;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- ========================================
-- STEP 2: CHECK RLS POLICIES
-- ========================================

SELECT 'Checking RLS policies...' as step;

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'feature_flags'
ORDER BY policyname;

-- ========================================
-- STEP 3: CHECK QR SYSTEM TABLES
-- ========================================

SELECT 'Checking QR system tables...' as step;

-- Check if qr_codes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'qr_codes'
) as qr_codes_exists;

-- Check if scan_audit_logs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'scan_audit_logs'
) as scan_audit_logs_exists;

-- ========================================
-- STEP 4: CHECK USER MEMBERSHIP DATA
-- ========================================

SELECT 'Checking user membership data...' as step;

-- Check the test user's memberships
SELECT 
    m.id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '9adf938d-6b00-4264-b8f8-11b7d140b6f7'
AND m.is_active = true
ORDER BY m.end_date DESC;

-- ========================================
-- STEP 5: SUCCESS MESSAGE
-- ========================================

SELECT 'QR System test completed!' as result;
