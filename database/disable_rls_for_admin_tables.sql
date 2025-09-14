-- Disable RLS for admin tables to fix 406 errors
-- This allows admin service role to access these tables without authentication issues

-- Disable RLS for user_old_members_usage
ALTER TABLE user_old_members_usage DISABLE ROW LEVEL SECURITY;

-- Disable RLS for user_kettlebell_points  
ALTER TABLE user_kettlebell_points DISABLE ROW LEVEL SECURITY;

-- Disable RLS for program_approval_states
ALTER TABLE program_approval_states DISABLE ROW LEVEL SECURITY;
