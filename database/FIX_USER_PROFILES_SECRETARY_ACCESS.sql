-- FIX USER PROFILES SECRETARY ACCESS
-- This script adds proper RLS policies to allow secretary to view all user profiles
-- Run this in Supabase SQL Editor

-- ========================================
-- PHASE 1: CHECK CURRENT RLS POLICIES
-- ========================================

SELECT 'PHASE 1: Checking current RLS policies for user_profiles...' as phase;

-- Check existing policies
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
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- ========================================
-- PHASE 2: CREATE SECRETARY ACCESS POLICY
-- ========================================

SELECT 'PHASE 2: Creating secretary access policy...' as phase;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Secretary can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;

-- Create policy for secretary/admin to view all profiles
CREATE POLICY "Secretary can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.email = 'receptiongym2025@gmail.com' OR
                u.email = 'admin@getfit.gr' OR
                (u.raw_user_meta_data->>'role') IN ('admin', 'secretary', 'staff')
            )
        ))
    );

-- ========================================
-- PHASE 3: CREATE SECRETARY UPDATE POLICY
-- ========================================

SELECT 'PHASE 3: Creating secretary update policy...' as phase;

-- Drop existing update policies
DROP POLICY IF EXISTS "Secretary can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles;

-- Create policy for secretary/admin to update profiles
CREATE POLICY "Secretary can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND (
                u.email = 'receptiongym2025@gmail.com' OR
                u.email = 'admin@getfit.gr' OR
                (u.raw_user_meta_data->>'role') IN ('admin', 'secretary', 'staff')
            )
        ))
    );

-- ========================================
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verifying new policies...' as phase;

-- Check new policies
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
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- Test query (this will work if secretary is logged in)
SELECT 'Test query - should work for secretary:' as test;
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
LIMIT 5;

-- Check total profiles count
SELECT 'Total profiles count:' as test;
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT 'SUCCESS: Secretary access policies have been created!' as result;
SELECT 'Secretary can now view and update all user profiles' as message;
