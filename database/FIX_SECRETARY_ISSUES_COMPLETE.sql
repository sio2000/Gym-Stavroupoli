-- =============================================
-- COMPLETE FIX FOR SECRETARY ISSUES
-- =============================================
-- This script fixes both infinite recursion and missing column issues

BEGIN;

-- =============================================
-- STEP 1: CHECK CURRENT STATE
-- =============================================
SELECT 'Checking current state...' as step;

-- Check if personal_training_code column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'personal_training_code';

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
-- STEP 2: ADD MISSING COLUMN (IF NOT EXISTS)
-- =============================================
SELECT 'Adding missing column...' as step;

-- Add personal_training_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'personal_training_code'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN personal_training_code TEXT;
        
        RAISE NOTICE 'Added column: personal_training_code to user_profiles';
    ELSE
        RAISE NOTICE 'Column personal_training_code already exists in user_profiles';
    END IF;
END $$;

-- =============================================
-- STEP 3: CREATE ULTRA SAFE HELPER FUNCTION
-- =============================================
SELECT 'Creating ultra safe helper function...' as step;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_user_secretary();

-- Create a completely safe function that checks secretary role
CREATE OR REPLACE FUNCTION is_user_secretary()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get user email from auth.users (no recursion possible)
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if it's the known secretary email
    IF user_email = 'receptiongym2025@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Try to get role from user_meta_data (safe approach)
    BEGIN
        SELECT raw_user_meta_data->>'role' INTO user_role
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF user_role = 'secretary' OR user_role = 'admin' THEN
            RETURN TRUE;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- If anything goes wrong, return false
            NULL;
    END;
    
    -- Default to false for safety
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 4: DROP ALL PROBLEMATIC POLICIES
-- =============================================
SELECT 'Dropping problematic policies...' as step;

-- Drop ALL existing secretary policies that might cause recursion
DROP POLICY IF EXISTS "Secretary can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary safe access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary safe update access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary role access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary access to personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretary safe access to personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretary access to personal training codes" ON personal_training_codes;
DROP POLICY IF EXISTS "Secretary safe access to personal training codes" ON personal_training_codes;
DROP POLICY IF EXISTS "Secretary access to group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretary safe access to group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretary can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary safe access to memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary safe update access to memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary can view all packages" ON membership_packages;
DROP POLICY IF EXISTS "Secretary safe access to membership packages" ON membership_packages;
DROP POLICY IF EXISTS "Secretary can manage membership requests" ON membership_requests;
DROP POLICY IF EXISTS "Secretary safe access to membership requests" ON membership_requests;

-- =============================================
-- STEP 5: CREATE NEW ULTRA SAFE POLICIES
-- =============================================
SELECT 'Creating new ultra safe policies...' as step;

-- Policy for user_profiles - Secretary can view all profiles (NO RECURSION)
CREATE POLICY "Secretary ultra safe view user profiles" ON user_profiles
    FOR SELECT USING (is_user_secretary());

-- Policy for user_profiles - Secretary can update profiles (NO RECURSION)
CREATE POLICY "Secretary ultra safe update user profiles" ON user_profiles
    FOR UPDATE USING (is_user_secretary());

-- Policy for personal_training_schedules - Secretary access (NO RECURSION)
CREATE POLICY "Secretary ultra safe access personal training schedules" ON personal_training_schedules
    FOR ALL USING (is_user_secretary());

-- Policy for personal_training_codes - Secretary access (NO RECURSION)
CREATE POLICY "Secretary ultra safe access personal training codes" ON personal_training_codes
    FOR ALL USING (is_user_secretary());

-- Policy for group_sessions - Secretary access (NO RECURSION)
CREATE POLICY "Secretary ultra safe access group sessions" ON group_sessions
    FOR ALL USING (is_user_secretary());

-- Policy for memberships - Secretary can view all memberships (NO RECURSION)
CREATE POLICY "Secretary ultra safe view memberships" ON memberships
    FOR SELECT USING (is_user_secretary());

-- Policy for memberships - Secretary can update memberships (NO RECURSION)
CREATE POLICY "Secretary ultra safe update memberships" ON memberships
    FOR UPDATE USING (is_user_secretary());

-- Policy for membership_packages - Secretary can view all packages (NO RECURSION)
CREATE POLICY "Secretary ultra safe view membership packages" ON membership_packages
    FOR SELECT USING (is_user_secretary());

-- Policy for membership_requests - Secretary can manage all requests (NO RECURSION)
CREATE POLICY "Secretary ultra safe manage membership requests" ON membership_requests
    FOR ALL USING (is_user_secretary());

-- =============================================
-- STEP 6: VERIFY NEW POLICIES
-- =============================================
SELECT 'Verifying new policies...' as step;

-- List all new ultra safe policies
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
AND policyname LIKE '%Secretary ultra safe%'
ORDER BY tablename, policyname;

-- =============================================
-- STEP 7: TEST THE HELPER FUNCTION
-- =============================================
SELECT 'Testing helper function...' as step;

-- Test the function
SELECT 
    is_user_secretary() as is_current_user_secretary,
    auth.uid() as current_user_id;

-- =============================================
-- STEP 8: TEST QUERIES
-- =============================================
SELECT 'Testing queries...' as step;

-- Test if secretary can access user_profiles without recursion
SELECT COUNT(*) as user_count FROM user_profiles;

-- Test if secretary can access personal_training_schedules
SELECT COUNT(*) as schedule_count FROM personal_training_schedules;

-- =============================================
-- STEP 9: COUNT POLICIES PER TABLE
-- =============================================
SELECT 'Counting policies per table...' as step;

SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%Secretary ultra safe%' THEN 1 END) as new_ultra_safe_policies
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
-- STEP 10: SUCCESS MESSAGE
-- =============================================
SELECT 'All secretary issues fixed successfully!' as message;
SELECT 'Infinite recursion resolved and missing column added!' as message;

COMMIT;
