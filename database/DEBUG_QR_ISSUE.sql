-- Debug QR System Issue
-- This script helps identify the exact problem

-- =============================================
-- STEP 1: CHECK TABLES EXIST
-- =============================================
SELECT 'Checking tables exist:' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('qr_codes', 'feature_flags', 'user_profiles')
ORDER BY table_name;

-- =============================================
-- STEP 2: CHECK QR_CODES TABLE STRUCTURE
-- =============================================
SELECT 'QR codes table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- STEP 3: CHECK RLS STATUS
-- =============================================
SELECT 'RLS status:' as status;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- =============================================
-- STEP 4: CHECK POLICIES
-- =============================================
SELECT 'RLS policies:' as status;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- =============================================
-- STEP 5: CHECK USER PROFILE
-- =============================================
SELECT 'User profile check:' as status;
SELECT id, user_id, first_name, last_name, role, email
FROM user_profiles 
WHERE user_id = '2bf5fc31-2b64-4778-aecf-06d90abfd80d';

-- =============================================
-- STEP 6: CHECK FEATURE FLAG
-- =============================================
SELECT 'Feature flag status:' as status;
SELECT name, is_enabled, description
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- =============================================
-- STEP 7: TEST INSERT PERMISSION
-- =============================================
-- Test if we can insert a QR code
SELECT 'Testing insert permission...' as status;

-- Try to insert a test QR code
INSERT INTO qr_codes (user_id, category, status, qr_token)
VALUES (
    '2bf5fc31-2b64-4778-aecf-06d90abfd80d',
    'free_gym',
    'active',
    'test_token_123'
)
RETURNING id, user_id, category, status;

-- =============================================
-- STEP 8: CLEANUP TEST DATA
-- =============================================
-- Remove test data
DELETE FROM qr_codes 
WHERE qr_token = 'test_token_123';

SELECT 'Debug completed!' as result;
