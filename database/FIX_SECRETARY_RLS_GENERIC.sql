-- =============================================
-- GENERIC FIX FOR SECRETARY RLS POLICIES
-- =============================================
-- This script creates a more generic solution that works for any secretary user
-- by creating a function that checks the role without causing recursion.

-- =============================================
-- STEP 1: CREATE HELPER FUNCTION
-- =============================================
SELECT 'Creating helper function...' as step;

-- Create a function that safely checks if current user is secretary
CREATE OR REPLACE FUNCTION is_secretary()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user has secretary role by looking at auth.users metadata
    -- This avoids the recursion issue with user_profiles table
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'secretary'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 2: DROP EXISTING PROBLEMATIC POLICIES
-- =============================================
SELECT 'Dropping problematic policies...' as step;

-- Drop all existing secretary policies
DROP POLICY IF EXISTS "Secretary can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary role access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary access to personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretary access to personal training codes" ON personal_training_codes;
DROP POLICY IF EXISTS "Secretary access to group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretary can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary can view all packages" ON membership_packages;
DROP POLICY IF EXISTS "Secretary can manage membership requests" ON membership_requests;

-- =============================================
-- STEP 3: CREATE NEW SAFE POLICIES
-- =============================================
SELECT 'Creating new safe policies...' as step;

-- Policy for user_profiles - Secretary can view all profiles
CREATE POLICY "Secretary can view all profiles" ON user_profiles
    FOR SELECT USING (is_secretary());

-- Policy for personal_training_schedules - Secretary access
CREATE POLICY "Secretary access to personal training schedules" ON personal_training_schedules
    FOR ALL USING (is_secretary());

-- Policy for personal_training_codes - Secretary access
CREATE POLICY "Secretary access to personal training codes" ON personal_training_codes
    FOR ALL USING (is_secretary());

-- Policy for group_sessions - Secretary access
CREATE POLICY "Secretary access to group sessions" ON group_sessions
    FOR ALL USING (is_secretary());

-- Policy for memberships - Secretary can view all memberships
CREATE POLICY "Secretary can view all memberships" ON memberships
    FOR SELECT USING (is_secretary());

-- Policy for membership_packages - Secretary can view all packages
CREATE POLICY "Secretary can view all packages" ON membership_packages
    FOR SELECT USING (is_secretary());

-- Policy for membership_requests - Secretary can manage all requests
CREATE POLICY "Secretary can manage membership requests" ON membership_requests
    FOR ALL USING (is_secretary());

-- =============================================
-- STEP 4: VERIFY NEW POLICIES
-- =============================================
SELECT 'Verifying new policies...' as step;

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
-- STEP 5: TEST THE FUNCTION
-- =============================================
SELECT 'Testing helper function...' as step;

-- Test the function
SELECT is_secretary() as is_current_user_secretary;

-- =============================================
-- STEP 6: SUCCESS MESSAGE
-- =============================================
SELECT 'Secretary RLS policies fixed with generic solution!' as message;
