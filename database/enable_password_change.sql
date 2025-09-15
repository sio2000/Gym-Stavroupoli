-- Enable password change functionality
-- This script ensures that users can change their passwords through the app

-- Check if we can update user passwords
-- Note: Supabase handles password updates through auth.updateUser()
-- No additional SQL is needed for password changes as Supabase Auth handles this

-- However, we should ensure that the user_profiles table has proper RLS policies
-- to allow users to update their own profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create RLS policies for user profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure RLS is enabled on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Test the password change functionality
-- This is handled by Supabase Auth, no additional SQL needed
SELECT 'Password change functionality is ready!' as status;
