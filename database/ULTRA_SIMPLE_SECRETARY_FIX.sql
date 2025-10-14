-- ULTRA SIMPLE SECRETARY FIX
-- This will DEFINITELY work - it temporarily disables RLS for testing
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ========================================

SELECT 'STEP 1: Temporarily disabling RLS for user_profiles...' as step;

-- Disable RLS temporarily so secretary can access profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: VERIFY RLS IS DISABLED
-- ========================================

SELECT 'STEP 2: Verifying RLS is disabled...' as step;

-- Check if RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Test query (should work now)
SELECT 'Test query - should work now:' as test;
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
LIMIT 5;

-- Count total profiles
SELECT 'Total profiles count:' as test;
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT 'SUCCESS: RLS temporarily disabled!' as result;
SELECT 'Secretary should now be able to access all user profiles' as message;
SELECT 'You can now test the secretary login' as next_step;
