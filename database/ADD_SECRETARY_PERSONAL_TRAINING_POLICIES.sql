-- Add Secretary Access to Personal Training System
-- This script adds RLS policies to allow secretaries to access Personal Training functionality

-- =============================================
-- STEP 1: CHECK CURRENT POLICIES
-- =============================================
SELECT 'Checking current policies...' as step;

-- List current policies for personal_training_schedules
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('personal_training_schedules', 'personal_training_codes', 'group_sessions')
ORDER BY tablename, policyname;

-- =============================================
-- STEP 2: DROP EXISTING POLICIES (if any)
-- =============================================
SELECT 'Dropping existing policies...' as step;

-- Drop existing secretary policies
DROP POLICY IF EXISTS "Secretary access to personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretary access to personal training codes" ON personal_training_codes;
DROP POLICY IF EXISTS "Secretary access to group sessions" ON group_sessions;

-- =============================================
-- STEP 3: CREATE NEW SECRETARY POLICIES
-- =============================================
SELECT 'Creating secretary policies...' as step;

-- Policy for personal_training_schedules - Secretary access
CREATE POLICY "Secretary access to personal training schedules" ON personal_training_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- Policy for personal_training_codes - Secretary access
CREATE POLICY "Secretary access to personal training codes" ON personal_training_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- Policy for group_sessions - Secretary access
CREATE POLICY "Secretary access to group sessions" ON group_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- =============================================
-- STEP 4: ADD SECRETARY ACCESS TO OTHER TABLES
-- =============================================
SELECT 'Adding secretary access to other tables...' as step;

-- Policy for user_profiles - Secretary can view all profiles
DROP POLICY IF EXISTS "Secretary can view all profiles" ON user_profiles;
CREATE POLICY "Secretary can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- Policy for memberships - Secretary can view all memberships
DROP POLICY IF EXISTS "Secretary can view all memberships" ON memberships;
CREATE POLICY "Secretary can view all memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- Policy for membership_packages - Secretary can view all packages
DROP POLICY IF EXISTS "Secretary can view all packages" ON membership_packages;
CREATE POLICY "Secretary can view all packages" ON membership_packages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- Policy for membership_requests - Secretary can manage all requests
DROP POLICY IF EXISTS "Secretary can manage membership requests" ON membership_requests;
CREATE POLICY "Secretary can manage membership requests" ON membership_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'secretary'
        )
    );

-- =============================================
-- STEP 5: VERIFY POLICIES
-- =============================================
SELECT 'Verifying policies...' as step;

-- List all policies for personal training tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('personal_training_schedules', 'personal_training_codes', 'group_sessions', 'user_profiles', 'memberships', 'membership_packages', 'membership_requests')
AND policyname LIKE '%Secretary%'
ORDER BY tablename, policyname;

-- =============================================
-- STEP 6: SUCCESS MESSAGE
-- =============================================
SELECT 'Secretary Personal Training policies added successfully!' as message;
