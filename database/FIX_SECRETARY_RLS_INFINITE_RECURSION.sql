-- =============================================
-- FIX INFINITE RECURSION IN SECRETARY RLS POLICIES
-- =============================================
-- This script fixes the infinite recursion issue in user_profiles policies
-- by using a different approach that doesn't cause recursion.

-- =============================================
-- STEP 1: CHECK CURRENT POLICIES
-- =============================================
SELECT 'Checking current policies...' as step;

-- List current policies for user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =============================================
-- STEP 2: DROP PROBLEMATIC SECRETARY POLICIES
-- =============================================
SELECT 'Dropping problematic secretary policies...' as step;

-- Drop the problematic secretary policy that causes infinite recursion
DROP POLICY IF EXISTS "Secretary can view all profiles" ON user_profiles;

-- =============================================
-- STEP 3: CREATE FIXED SECRETARY POLICIES
-- =============================================
SELECT 'Creating fixed secretary policies...' as step;

-- Create a simple secretary policy that doesn't cause recursion
-- We'll use a direct role check instead of subquery
CREATE POLICY "Secretary can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Alternative approach: Create a policy that checks if user exists in a separate table
-- This avoids the recursion issue
CREATE POLICY "Secretary role access to user profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'receptiongym2025@gmail.com'
        )
    );

-- =============================================
-- STEP 4: FIX OTHER TABLES WITH SIMILAR ISSUES
-- =============================================
SELECT 'Fixing other tables...' as step;

-- Fix personal_training_schedules policy
DROP POLICY IF EXISTS "Secretary access to personal training schedules" ON personal_training_schedules;
CREATE POLICY "Secretary access to personal training schedules" ON personal_training_schedules
    FOR ALL USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Fix personal_training_codes policy
DROP POLICY IF EXISTS "Secretary access to personal training codes" ON personal_training_codes;
CREATE POLICY "Secretary access to personal training codes" ON personal_training_codes
    FOR ALL USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Fix group_sessions policy
DROP POLICY IF EXISTS "Secretary access to group sessions" ON group_sessions;
CREATE POLICY "Secretary access to group sessions" ON group_sessions
    FOR ALL USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Fix memberships policy
DROP POLICY IF EXISTS "Secretary can view all memberships" ON memberships;
CREATE POLICY "Secretary can view all memberships" ON memberships
    FOR SELECT USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Fix membership_packages policy
DROP POLICY IF EXISTS "Secretary can view all packages" ON membership_packages;
CREATE POLICY "Secretary can view all packages" ON membership_packages
    FOR SELECT USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- Fix membership_requests policy
DROP POLICY IF EXISTS "Secretary can manage membership requests" ON membership_requests;
CREATE POLICY "Secretary can manage membership requests" ON membership_requests
    FOR ALL USING (
        auth.uid()::text = 'b4200e5c-0332-445b-8326-79175b2e670e' -- secretary user ID
    );

-- =============================================
-- STEP 5: VERIFY FIXED POLICIES
-- =============================================
SELECT 'Verifying fixed policies...' as step;

-- List all secretary policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'user_profiles',
    'memberships',
    'membership_packages',
    'membership_requests'
)
AND policyname LIKE '%Secretary%'
ORDER BY tablename, policyname;

-- =============================================
-- STEP 6: TEST QUERY (OPTIONAL)
-- =============================================
SELECT 'Testing secretary access...' as step;

-- Test if secretary can access user_profiles
SELECT COUNT(*) as user_count FROM user_profiles;

-- =============================================
-- STEP 7: SUCCESS MESSAGE
-- =============================================
SELECT 'Secretary RLS policies fixed - infinite recursion resolved!' as message;
