-- Fix Kettlebell Points RLS policies to allow data insertion and reading

-- First, let's check current policies
SELECT 'Current Policies:' as info, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'user_kettlebell_points'
ORDER BY policyname;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;

-- Create more permissive policies for testing
-- Allow authenticated users to read all kettlebell points
CREATE POLICY "Allow authenticated users to read kettlebell points" ON user_kettlebell_points
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow authenticated users to insert kettlebell points
CREATE POLICY "Allow authenticated users to insert kettlebell points" ON user_kettlebell_points
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update kettlebell points
CREATE POLICY "Allow authenticated users to update kettlebell points" ON user_kettlebell_points
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete kettlebell points
CREATE POLICY "Allow authenticated users to delete kettlebell points" ON user_kettlebell_points
    FOR DELETE 
    TO authenticated
    USING (true);

-- Verify the new policies
SELECT 'New Policies:' as info, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'user_kettlebell_points'
ORDER BY policyname;
