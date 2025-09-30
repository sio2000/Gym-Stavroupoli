-- =============================================
-- CHECK CURRENT POLICIES AND FIND THE PROBLEM
-- =============================================
-- This script will help us understand what's causing the infinite recursion

-- =============================================
-- STEP 1: LIST ALL POLICIES FOR USER_PROFILES
-- =============================================
SELECT 'Current user_profiles policies:' as info;

SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =============================================
-- STEP 2: CHECK FOR RECURSIVE PATTERNS
-- =============================================
SELECT 'Checking for recursive patterns...' as info;

-- Look for policies that might reference user_profiles
SELECT 
    'Policies that might cause recursion:' as info,
    policyname,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
AND (
    qual LIKE '%user_profiles%' OR
    qual LIKE '%user_id%' OR
    qual LIKE '%role%' OR
    qual LIKE '%secretary%' OR
    qual LIKE '%admin%'
);

-- =============================================
-- STEP 3: CHECK AUTH.USERS ACCESS
-- =============================================
SELECT 'Checking auth.users access...' as info;

-- Test if we can access auth.users
SELECT 
    'auth.users accessible:' as info,
    COUNT(*) as user_count
FROM auth.users;

-- =============================================
-- STEP 4: TEST SIMPLE QUERY
-- =============================================
SELECT 'Testing simple user_profiles query...' as info;

-- Try a very simple query
SELECT 
    'Simple query result:' as info,
    COUNT(*) as count
FROM user_profiles;

-- =============================================
-- STEP 5: CHECK RLS STATUS
-- =============================================
SELECT 'Checking RLS status...' as info;

-- Check if RLS is enabled on user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- =============================================
-- STEP 6: LIST ALL TABLES WITH RLS
-- =============================================
SELECT 'All tables with RLS enabled:' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY tablename;
