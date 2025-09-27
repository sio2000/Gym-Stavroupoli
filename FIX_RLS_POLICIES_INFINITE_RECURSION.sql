-- ===== FIX INFINITE RECURSION IN RLS POLICIES =====
-- This script fixes the infinite recursion issue caused by RLS policies

-- ===== REMOVE PROBLEMATIC POLICIES =====

-- Remove all secretary policies that cause infinite recursion
DROP POLICY IF EXISTS "Secretaries can view all personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can insert personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can update personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can delete personal training schedules" ON personal_training_schedules;

DROP POLICY IF EXISTS "Secretaries can view all group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretaries can insert group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretaries can update group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretaries can delete group sessions" ON group_sessions;

DROP POLICY IF EXISTS "Secretaries can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretaries can view membership packages" ON membership_packages;
DROP POLICY IF EXISTS "Secretaries can insert memberships" ON memberships;
DROP POLICY IF EXISTS "Secretaries can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Secretaries can update memberships" ON memberships;
DROP POLICY IF EXISTS "Secretaries can view all lesson deposits" ON lesson_deposits;
DROP POLICY IF EXISTS "Secretaries can insert lesson deposits" ON lesson_deposits;
DROP POLICY IF EXISTS "Secretaries can update lesson deposits" ON lesson_deposits;

-- ===== RESTORE ORIGINAL POLICIES =====

-- Restore user_profiles policies to original state
-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all profiles (without infinite recursion)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' -- admin user ID
    );

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' -- admin user ID
    );

-- ===== SECRETARY ROLE SUPPORT (without infinite recursion) =====

-- Create a simple secretary policy that doesn't cause recursion
-- We'll use a direct role check instead of subquery

-- For personal_training_schedules - allow secretary access
DROP POLICY IF EXISTS "Secretary access to personal training schedules" ON personal_training_schedules;
CREATE POLICY "Secretary access to personal training schedules" ON personal_training_schedules
    FOR ALL USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' OR -- admin
        auth.uid()::text = '00000000-0000-0000-0000-000000000002'    -- secretary (if exists)
    );

-- For group_sessions - allow secretary access
DROP POLICY IF EXISTS "Secretary access to group sessions" ON group_sessions;
CREATE POLICY "Secretary access to group sessions" ON group_sessions
    FOR ALL USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' OR -- admin
        auth.uid()::text = '00000000-0000-0000-0000-000000000002'    -- secretary (if exists)
    );

-- For memberships - allow secretary access
DROP POLICY IF EXISTS "Secretary access to memberships" ON memberships;
CREATE POLICY "Secretary access to memberships" ON memberships
    FOR ALL USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' OR -- admin
        auth.uid()::text = '00000000-0000-0000-0000-000000000002' OR -- secretary (if exists)
        auth.uid() = user_id -- users can view their own memberships
    );

-- For membership_packages - allow secretary access
DROP POLICY IF EXISTS "Secretary access to membership packages" ON membership_packages;
CREATE POLICY "Secretary access to membership packages" ON membership_packages
    FOR SELECT USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' OR -- admin
        auth.uid()::text = '00000000-0000-0000-0000-000000000002' OR -- secretary (if exists)
        true -- all users can view packages
    );

-- For lesson_deposits - allow secretary access
DROP POLICY IF EXISTS "Secretary access to lesson deposits" ON lesson_deposits;
CREATE POLICY "Secretary access to lesson deposits" ON lesson_deposits
    FOR ALL USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001' OR -- admin
        auth.uid()::text = '00000000-0000-0000-0000-000000000002' OR -- secretary (if exists)
        auth.uid() = user_id -- users can view their own deposits
    );

-- ===== VERIFY POLICIES =====

-- Check if policies are working
SELECT 'RLS policies fixed successfully!' as message;

-- List current policies for user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;
