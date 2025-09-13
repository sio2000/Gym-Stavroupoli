-- Fix RLS policy for personal_training_schedules to allow trainers to read schedules
-- This script should be run in Supabase SQL Editor with admin privileges

-- First, let's check current RLS policies
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
WHERE tablename = 'personal_training_schedules';

-- Drop existing policies that might be blocking trainers
DROP POLICY IF EXISTS "Users can view their own schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Trainers can view schedules" ON personal_training_schedules;

-- Create new policies that allow trainers to read schedules
-- Policy 1: Users can view their own schedules
CREATE POLICY "Users can view their own schedules" ON personal_training_schedules
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Admins can view all schedules
CREATE POLICY "Admins can view all schedules" ON personal_training_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Trainers can view schedules where they are the trainer
CREATE POLICY "Trainers can view their schedules" ON personal_training_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
        AND (
            schedule_data->'sessions' @> '[{"trainer": "Mike"}]'::jsonb
            OR schedule_data->'sessions' @> '[{"trainer": "Jordan"}]'::jsonb
        )
    );

-- Policy 4: Allow admins to insert schedules
CREATE POLICY "Admins can insert schedules" ON personal_training_schedules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 5: Allow admins to update schedules
CREATE POLICY "Admins can update schedules" ON personal_training_schedules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 6: Allow users to update their own schedules (for accept/decline)
CREATE POLICY "Users can update their own schedules" ON personal_training_schedules
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify the new policies
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
WHERE tablename = 'personal_training_schedules'
ORDER BY policyname;

-- Test the policies by checking if we can query schedules
-- This should work for both trainers and admins
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
LIMIT 5;
