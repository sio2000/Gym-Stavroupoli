-- Fix RLS policies for membership_requests table
-- Allow users to insert their own membership requests

-- First, let's check the current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'membership_requests';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own membership requests" ON membership_requests;
DROP POLICY IF EXISTS "Users can insert own membership requests" ON membership_requests;
DROP POLICY IF EXISTS "Admins can manage all membership requests" ON membership_requests;
DROP POLICY IF EXISTS "Secretaries can view membership requests" ON membership_requests;

-- Create new, more permissive policies
-- Allow users to insert their own membership requests
CREATE POLICY "Users can insert own membership requests" ON membership_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own membership requests
CREATE POLICY "Users can view own membership requests" ON membership_requests
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to update their own membership requests (for status changes)
CREATE POLICY "Users can update own membership requests" ON membership_requests
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all membership requests
CREATE POLICY "Admins can manage all membership requests" ON membership_requests
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Allow secretaries to view and update membership requests
CREATE POLICY "Secretaries can manage membership requests" ON membership_requests
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'secretary'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'secretary'
        )
    );

-- Verify the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'membership_requests'
ORDER BY policyname;
