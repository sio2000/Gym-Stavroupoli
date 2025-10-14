-- EMERGENCY FIX FOR SECRETARY RLS ACCESS
-- This script fixes the RLS policies so secretary can access their own profile and all user profiles
-- Run this IMMEDIATELY in Supabase SQL Editor

-- ========================================
-- PHASE 1: DROP ALL EXISTING POLICIES
-- ========================================

SELECT 'PHASE 1: Dropping all existing user_profiles policies...' as phase;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger and service" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles;

-- ========================================
-- PHASE 2: CREATE NEW PERMISSIVE POLICIES
-- ========================================

SELECT 'PHASE 2: Creating new permissive policies...' as phase;

-- Policy 1: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 3: Allow secretary/admin to view ALL profiles
CREATE POLICY "Secretary can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        -- Allow if user is secretary (by email)
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.email = 'receptiongym2025@gmail.com'
        )
        OR
        -- Allow if user has admin/secretary role in metadata
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND (u.raw_user_meta_data->>'role') IN ('admin', 'secretary', 'staff')
        )
    );

-- Policy 4: Allow secretary/admin to update ALL profiles
CREATE POLICY "Secretary can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        -- Allow if user is secretary (by email)
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.email = 'receptiongym2025@gmail.com'
        )
        OR
        -- Allow if user has admin/secretary role in metadata
        EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND (u.raw_user_meta_data->>'role') IN ('admin', 'secretary', 'staff')
        )
    );

-- Policy 5: Allow insert for triggers and service role
CREATE POLICY "Allow insert for trigger and service" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- ========================================
-- PHASE 3: VERIFICATION
-- ========================================

SELECT 'PHASE 3: Verifying new policies...' as phase;

-- Check all policies
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

-- Test query (should work for secretary)
SELECT 'Test query - should work for secretary:' as test;
SELECT user_id, first_name, last_name, email 
FROM user_profiles 
LIMIT 5;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT 'SUCCESS: Emergency RLS fix applied!' as result;
SELECT 'Secretary should now be able to access all user profiles' as message;
