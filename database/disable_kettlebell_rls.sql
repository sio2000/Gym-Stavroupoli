-- Disable RLS for user_kettlebell_points table to allow data access

-- First, check current RLS status
SELECT 'Current RLS Status:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'user_kettlebell_points';

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow authenticated users to read kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow authenticated users to insert kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow authenticated users to update kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow authenticated users to delete kettlebell points" ON user_kettlebell_points;

-- Disable RLS completely for this table
ALTER TABLE user_kettlebell_points DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS Status After Disable:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'user_kettlebell_points';

-- Check that no policies exist
SELECT 'Remaining Policies:' as info, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'user_kettlebell_points'
ORDER BY policyname;
