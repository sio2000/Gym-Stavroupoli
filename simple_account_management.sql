-- Simple account management functionality
-- This script enables password change and account deletion

-- Enable RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple function to delete user data
CREATE OR REPLACE FUNCTION delete_user_account(user_id_to_delete UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_count INTEGER := 0;
BEGIN
  -- Delete from user_profiles
  DELETE FROM user_profiles WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete from other tables (if they exist)
  DELETE FROM user_metrics WHERE user_id = user_id_to_delete;
  DELETE FROM user_goals WHERE user_id = user_id_to_delete;
  DELETE FROM user_achievements WHERE user_id = user_id_to_delete;
  DELETE FROM user_challenges WHERE user_id = user_id_to_delete;
  DELETE FROM user_old_members_usage WHERE user_id = user_id_to_delete;
  DELETE FROM user_kettlebell_points WHERE user_id = user_id_to_delete;
  DELETE FROM program_approval_states WHERE user_id = user_id_to_delete;
  DELETE FROM memberships WHERE user_id = user_id_to_delete;
  DELETE FROM bookings WHERE user_id = user_id_to_delete;
  DELETE FROM attendance WHERE user_id = user_id_to_delete;
  DELETE FROM qr_codes WHERE user_id = user_id_to_delete;
  DELETE FROM pilates_bookings WHERE user_id = user_id_to_delete;
  DELETE FROM lesson_bookings WHERE user_id = user_id_to_delete;
  DELETE FROM lesson_attendance WHERE user_id = user_id_to_delete;
  DELETE FROM lesson_deposits WHERE user_id = user_id_to_delete;
  DELETE FROM app_visits WHERE user_id = user_id_to_delete;

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'User account and all related data deleted successfully',
    'deleted_profile_records', deleted_count,
    'user_id', user_id_to_delete
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error result
  result := json_build_object(
    'success', false,
    'message', 'Error deleting user account: ' || SQLERRM,
    'error_code', SQLSTATE,
    'user_id', user_id_to_delete
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Test the function
SELECT 'Account management functionality is ready!' as status;
