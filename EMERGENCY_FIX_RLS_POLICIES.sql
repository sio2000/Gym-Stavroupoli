-- ===== EMERGENCY FIX: REMOVE ALL PROBLEMATIC RLS POLICIES =====
-- This script removes all the policies that cause infinite recursion

-- ===== REMOVE ALL SECRETARY POLICIES =====

-- Remove all policies that reference user_profiles in their conditions
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

-- ===== RESTORE BASIC USER_PROFILES POLICIES =====

-- Basic policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Basic policy for users to update their own profile  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Basic policy for admin to view all profiles (using direct user ID)
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
CREATE POLICY "Admin can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001'
    );

-- Basic policy for admin to update all profiles
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
CREATE POLICY "Admin can update all profiles" ON user_profiles
    FOR UPDATE USING (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001'
    );

-- ===== SUCCESS MESSAGE =====
SELECT 'Emergency fix applied: All problematic RLS policies removed!' as message;
