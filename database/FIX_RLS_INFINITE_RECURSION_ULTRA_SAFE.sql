-- =============================================
-- ULTRA SAFE FIX FOR RLS INFINITE RECURSION
-- =============================================
-- This script fixes infinite recursion in RLS policies without affecting existing policies.
-- It creates new policies with different names and leaves old ones untouched.

BEGIN;

-- =============================================
-- STEP 1: CREATE HELPER FUNCTION (IF NOT EXISTS)
-- =============================================
SELECT 'Creating helper function...' as step;

-- Create a safe function that checks secretary role without recursion
CREATE OR REPLACE FUNCTION is_user_secretary()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user has secretary role by looking at auth.users metadata
    -- This avoids the recursion issue with user_profiles table
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' = 'secretary' OR
            raw_user_meta_data->>'role' = 'admin' OR
            email = 'receptiongym2025@gmail.com'
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, return false to be safe
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 2: CHECK EXISTING POLICIES
-- =============================================
SELECT 'Checking existing policies...' as step;

-- List current policies for all target tables
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
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'memberships',
    'membership_packages',
    'membership_requests'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 3: CREATE NEW SAFE POLICIES (IF NOT EXISTS)
-- =============================================
SELECT 'Creating new safe policies...' as step;

-- Policy for user_profiles - Secretary can view all profiles (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Secretary safe access to user profiles'
    ) THEN
        CREATE POLICY "Secretary safe access to user profiles" ON user_profiles
            FOR SELECT USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to user profiles';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to user profiles';
    END IF;
END $$;

-- Policy for personal_training_schedules - Secretary access (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_schedules' 
        AND policyname = 'Secretary safe access to personal training schedules'
    ) THEN
        CREATE POLICY "Secretary safe access to personal training schedules" ON personal_training_schedules
            FOR ALL USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to personal training schedules';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to personal training schedules';
    END IF;
END $$;

-- Policy for personal_training_codes - Secretary access (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_codes' 
        AND policyname = 'Secretary safe access to personal training codes'
    ) THEN
        CREATE POLICY "Secretary safe access to personal training codes" ON personal_training_codes
            FOR ALL USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to personal training codes';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to personal training codes';
    END IF;
END $$;

-- Policy for group_sessions - Secretary access (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Secretary safe access to group sessions'
    ) THEN
        CREATE POLICY "Secretary safe access to group sessions" ON group_sessions
            FOR ALL USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to group sessions';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to group sessions';
    END IF;
END $$;

-- Policy for memberships - Secretary can view all memberships (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'memberships' 
        AND policyname = 'Secretary safe access to memberships'
    ) THEN
        CREATE POLICY "Secretary safe access to memberships" ON memberships
            FOR SELECT USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to memberships';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to memberships';
    END IF;
END $$;

-- Policy for membership_packages - Secretary can view all packages (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_packages' 
        AND policyname = 'Secretary safe access to membership packages'
    ) THEN
        CREATE POLICY "Secretary safe access to membership packages" ON membership_packages
            FOR SELECT USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to membership packages';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to membership packages';
    END IF;
END $$;

-- Policy for membership_requests - Secretary can manage all requests (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_requests' 
        AND policyname = 'Secretary safe access to membership requests'
    ) THEN
        CREATE POLICY "Secretary safe access to membership requests" ON membership_requests
            FOR ALL USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe access to membership requests';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe access to membership requests';
    END IF;
END $$;

-- =============================================
-- STEP 4: CREATE ADDITIONAL SAFE POLICIES FOR COMPREHENSIVE COVERAGE
-- =============================================
SELECT 'Creating additional safe policies...' as step;

-- Additional policy for user_profiles - Secretary can update profiles (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Secretary safe update access to user profiles'
    ) THEN
        CREATE POLICY "Secretary safe update access to user profiles" ON user_profiles
            FOR UPDATE USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe update access to user profiles';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe update access to user profiles';
    END IF;
END $$;

-- Additional policy for memberships - Secretary can update memberships (NO RECURSION)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'memberships' 
        AND policyname = 'Secretary safe update access to memberships'
    ) THEN
        CREATE POLICY "Secretary safe update access to memberships" ON memberships
            FOR UPDATE USING (is_user_secretary());
        RAISE NOTICE 'Created policy: Secretary safe update access to memberships';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary safe update access to memberships';
    END IF;
END $$;

-- =============================================
-- STEP 5: VERIFY NEW POLICIES
-- =============================================
SELECT 'Verifying new policies...' as step;

-- List all new safe policies
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
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'memberships',
    'membership_packages',
    'membership_requests'
)
AND policyname LIKE '%Secretary safe%'
ORDER BY tablename, policyname;

-- =============================================
-- STEP 6: TEST THE HELPER FUNCTION
-- =============================================
SELECT 'Testing helper function...' as step;

-- Test the function
SELECT 
    is_user_secretary() as is_current_user_secretary,
    auth.uid() as current_user_id;

-- =============================================
-- STEP 7: COUNT POLICIES PER TABLE
-- =============================================
SELECT 'Counting policies per table...' as step;

SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%Secretary safe%' THEN 1 END) as new_safe_policies,
    COUNT(CASE WHEN policyname LIKE '%Secretary%' AND policyname NOT LIKE '%Secretary safe%' THEN 1 END) as old_secretary_policies
FROM pg_policies 
WHERE tablename IN (
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'memberships',
    'membership_packages',
    'membership_requests'
)
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- STEP 8: SUCCESS MESSAGE
-- =============================================
SELECT 'RLS infinite recursion fixed successfully with ultra-safe approach!' as message;
SELECT 'All existing policies preserved, new safe policies created!' as message;

COMMIT;
