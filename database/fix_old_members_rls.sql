-- Fix RLS policies for user_old_members_usage table
-- This allows admin queries to work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all old members usage" ON user_old_members_usage;
DROP POLICY IF EXISTS "Admins can insert old members usage" ON user_old_members_usage;

-- Create new policies that work with supabaseAdmin
CREATE POLICY "Allow admin service role access" ON user_old_members_usage
    FOR ALL USING (true)
    WITH CHECK (true);

-- Also fix the kettlebell points table
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;

CREATE POLICY "Allow admin service role access" ON user_kettlebell_points
    FOR ALL USING (true)
    WITH CHECK (true);

-- Fix program approval states table too
DROP POLICY IF EXISTS "Admins can view all program approval states" ON program_approval_states;
DROP POLICY IF EXISTS "Admins can insert program approval states" ON program_approval_states;

CREATE POLICY "Allow admin service role access" ON program_approval_states
    FOR ALL USING (true)
    WITH CHECK (true);
