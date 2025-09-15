-- Enable account deletion functionality
-- This script ensures that users can delete their accounts through the app

-- First, we need to create a function that can delete a user and all their related data
-- This function will be called by the admin API

CREATE OR REPLACE FUNCTION delete_user_account(user_id_to_delete UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Start transaction
  BEGIN
    -- Delete from user_profiles first (this has foreign key constraints)
    DELETE FROM user_profiles WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_profiles');
    END IF;

    -- Delete from user_metrics
    DELETE FROM user_metrics WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_metrics');
    END IF;

    -- Delete from user_goals
    DELETE FROM user_goals WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_goals');
    END IF;

    -- Delete from user_achievements
    DELETE FROM user_achievements WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_achievements');
    END IF;

    -- Delete from user_challenges
    DELETE FROM user_challenges WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_challenges');
    END IF;

    -- Delete from user_old_members_usage
    DELETE FROM user_old_members_usage WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_old_members_usage');
    END IF;

    -- Delete from user_kettlebell_points
    DELETE FROM user_kettlebell_points WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'user_kettlebell_points');
    END IF;

    -- Delete from program_approval_states
    DELETE FROM program_approval_states WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'program_approval_states');
    END IF;

    -- Delete from memberships
    DELETE FROM memberships WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'memberships');
    END IF;

    -- Delete from bookings
    DELETE FROM bookings WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'bookings');
    END IF;

    -- Delete from attendance
    DELETE FROM attendance WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'attendance');
    END IF;

    -- Delete from qr_codes
    DELETE FROM qr_codes WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'qr_codes');
    END IF;

    -- Delete from pilates_bookings
    DELETE FROM pilates_bookings WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'pilates_bookings');
    END IF;

    -- Delete from lesson_bookings
    DELETE FROM lesson_bookings WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'lesson_bookings');
    END IF;

    -- Delete from lesson_attendance
    DELETE FROM lesson_attendance WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'lesson_attendance');
    END IF;

    -- Delete from lesson_deposits
    DELETE FROM lesson_deposits WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'lesson_deposits');
    END IF;

    -- Delete from app_visits
    DELETE FROM app_visits WHERE user_id = user_id_to_delete;
    IF FOUND THEN
      deleted_tables := array_append(deleted_tables, 'app_visits');
    END IF;

    -- Return success result
    result := json_build_object(
      'success', true,
      'message', 'User account and all related data deleted successfully',
      'deleted_tables', deleted_tables,
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Create a policy to allow users to call this function
-- Note: This function should be called through the admin API, not directly by users
-- But we'll create a policy just in case

-- Test the function (commented out for safety)
-- SELECT delete_user_account('some-uuid-here');

SELECT 'Account deletion functionality is ready!' as status;
