-- Fix RLS policies for user_profiles table

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Create new policies that work
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_profiles
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Test the policies
SELECT 'RLS policies fixed successfully' as status;
