-- Create RPC function for manual lesson deposit update
-- This function will be called from the frontend

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_lesson_deposit_manual(UUID, INTEGER);

CREATE OR REPLACE FUNCTION update_lesson_deposit_manual(
  p_user_id UUID,
  p_used_lessons INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update the lesson deposit for the user
  UPDATE lesson_deposits 
  SET 
    used_lessons = p_used_lessons,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Get the updated record
  SELECT to_json(ld.*) INTO result
  FROM lesson_deposits ld
  WHERE ld.user_id = p_user_id;
  
  -- Return the updated record
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_lesson_deposit_manual(UUID, INTEGER) TO authenticated;
