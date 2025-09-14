-- Create RLS policy that allows admin users to access the tables
-- This should fix the 406 errors

-- First, drop any existing policies
DROP POLICY IF EXISTS "Admins can view all old members usage" ON user_old_members_usage;
DROP POLICY IF EXISTS "Admins can insert old members usage" ON user_old_members_usage;
DROP POLICY IF EXISTS "Allow admin service role access" ON user_old_members_usage;

-- Create a policy that allows authenticated admin users to access the table
CREATE POLICY "Admin access to old members usage" ON user_old_members_usage
    FOR ALL USING (
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

-- Do the same for kettlebell points
DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;
DROP POLICY IF EXISTS "Allow admin service role access" ON user_kettlebell_points;

CREATE POLICY "Admin access to kettlebell points" ON user_kettlebell_points
    FOR ALL USING (
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

-- Do the same for program approval states
DROP POLICY IF EXISTS "Admins can view all program approval states" ON program_approval_states;
DROP POLICY IF EXISTS "Admins can insert program approval states" ON program_approval_states;
DROP POLICY IF EXISTS "Allow admin service role access" ON program_approval_states;

CREATE POLICY "Admin access to program approval states" ON program_approval_states
    FOR ALL USING (
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
