-- Clean and fix RLS policies for user_old_members_usage table
-- First drop all existing policies, then create new ones

-- Drop ALL existing policies for user_old_members_usage
DROP POLICY IF EXISTS "Admins can view all old members usage" ON user_old_members_usage;
DROP POLICY IF EXISTS "Admins can insert old members usage" ON user_old_members_usage;
DROP POLICY IF EXISTS "Allow admin service role access" ON user_old_members_usage;

-- Create new policy that allows admin service role access
CREATE POLICY "Allow admin service role access" ON user_old_members_usage
    FOR ALL USING (true)
    WITH CHECK (true);

-- Drop ALL existing policies for user_kettlebell_points
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow admin service role access" ON user_kettlebell_points;

-- Create new policy for kettlebell points
CREATE POLICY "Allow admin service role access" ON user_kettlebell_points
    FOR ALL USING (true)
    WITH CHECK (true);

-- Drop ALL existing policies for program_approval_states
DROP POLICY IF EXISTS "Admins can view all program approval states" ON program_approval_states;
DROP POLICY IF EXISTS "Admins can insert program approval states" ON program_approval_states;
DROP POLICY IF EXISTS "Allow admin service role access" ON program_approval_states;

-- Create new policy for program approval states
CREATE POLICY "Allow admin service role access" ON program_approval_states
    FOR ALL USING (true)
    WITH CHECK (true);
