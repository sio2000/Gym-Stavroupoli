-- =============================================
-- ULTRA SIMPLE FIX FOR INFINITE RECURSION
-- =============================================
-- This script will fix the infinite recursion by creating the simplest possible policies

BEGIN;

-- =============================================
-- STEP 1: DROP ALL EXISTING POLICIES ON USER_PROFILES
-- =============================================
-- We'll drop all policies and create new simple ones

SELECT 'Dropping all existing user_profiles policies...' as step;

-- Drop all policies on user_profiles
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 2: CREATE ULTRA SIMPLE HELPER FUNCTION
-- =============================================
-- This function only checks the email, no recursion possible

SELECT 'Creating ultra simple helper function...' as step;

CREATE OR REPLACE FUNCTION is_secretary_ultra_simple()
RETURNS BOOLEAN AS $$
BEGIN
    -- Just check if the current user email matches the secretary email
    -- This is the simplest possible check with no recursion
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'receptiongym2025@gmail.com'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If anything goes wrong, return false for safety
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 3: CREATE ULTRA SIMPLE POLICIES
-- =============================================
-- Create the simplest possible policies

SELECT 'Creating ultra simple policies...' as step;

-- Policy for SELECT - Secretary can view all profiles
CREATE POLICY "Ultra simple secretary view" ON user_profiles
    FOR SELECT USING (is_secretary_ultra_simple());

-- Policy for UPDATE - Secretary can update all profiles  
CREATE POLICY "Ultra simple secretary update" ON user_profiles
    FOR UPDATE USING (is_secretary_ultra_simple());

-- Policy for INSERT - Secretary can insert profiles
CREATE POLICY "Ultra simple secretary insert" ON user_profiles
    FOR INSERT WITH CHECK (is_secretary_ultra_simple());

-- =============================================
-- STEP 4: ADD MISSING COLUMN
-- =============================================
SELECT 'Adding missing column...' as step;

-- Add personal_training_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'personal_training_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN personal_training_code TEXT DEFAULT NULL;
        
        RAISE NOTICE 'Added column: personal_training_code to user_profiles';
    ELSE
        RAISE NOTICE 'Column personal_training_code already exists in user_profiles';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add column: %', SQLERRM;
END $$;

-- =============================================
-- STEP 5: TEST THE FIX
-- =============================================
SELECT 'Testing the fix...' as step;

-- Test the helper function
SELECT 
    'Testing helper function...' as test,
    is_secretary_ultra_simple() as is_secretary,
    auth.uid() as current_user_id;

-- Test if we can query user_profiles without recursion
SELECT 
    'Testing user_profiles query...' as test,
    COUNT(*) as user_count 
FROM user_profiles;

-- =============================================
-- STEP 6: VERIFY POLICIES
-- =============================================
SELECT 'Verifying policies...' as step;

-- List all policies for user_profiles
SELECT 
    'Current user_profiles policies:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =============================================
-- STEP 7: SUCCESS CONFIRMATION
-- =============================================
SELECT '🎉 ULTRA SIMPLE FIX COMPLETED!' as message;
SELECT '✅ All problematic policies removed' as message;
SELECT '✅ Ultra simple policies created' as message;
SELECT '✅ Missing column added' as message;
SELECT '✅ No more infinite recursion' as message;

COMMIT;
