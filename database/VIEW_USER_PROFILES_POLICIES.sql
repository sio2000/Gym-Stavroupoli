-- =============================================
-- VIEW USER_PROFILES POLICIES
-- =============================================
-- This script will show us exactly what policies exist for user_profiles

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

-- Look for policies that might reference user_profiles or cause recursion
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
    qual LIKE '%admin%' OR
    qual LIKE '%auth.users%'
);

-- =============================================
-- STEP 3: TEST AUTH.USERS ACCESS
-- =============================================
SELECT 'Testing auth.users access...' as info;

-- Test if we can access auth.users
SELECT 
    'auth.users accessible:' as info,
    COUNT(*) as user_count
FROM auth.users;

-- =============================================
-- STEP 4: TEST SIMPLE USER_PROFILES QUERY
-- =============================================
SELECT 'Testing simple user_profiles query...' as info;

-- Try a very simple query
SELECT 
    'Simple query result:' as info,
    COUNT(*) as count
FROM user_profiles;

-- =============================================
-- STEP 5: CHECK CURRENT USER
-- =============================================
SELECT 'Checking current user...' as info;

-- Check current user info
SELECT 
    'Current user:' as info,
    auth.uid() as user_id,
    auth.email() as email;
