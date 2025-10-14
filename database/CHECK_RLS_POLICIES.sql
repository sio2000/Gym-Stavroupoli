-- Check RLS policies for user_profiles table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on user_profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 2. List all RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Check current user and roles
SELECT current_user, session_user;

-- 4. Test query as current user
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
LIMIT 5;

-- 5. Check if there are any user_profiles at all
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 6. Check if secretary role has special permissions
SELECT 
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin
FROM pg_roles r 
WHERE r.rolname IN ('secretary', 'authenticated', 'anon');

