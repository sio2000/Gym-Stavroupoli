-- Create RPC function for manual lesson deposit update
-- This function bypasses RLS and allows manual updates

CREATE OR REPLACE FUNCTION update_lesson_deposit_manual(
  p_user_id UUID,
  p_used_lessons INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the lesson deposit for the user
  UPDATE lesson_deposits 
  SET 
    used_lessons = p_used_lessons,
    remaining_lessons = total_lessons - p_used_lessons,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the update
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    details,
    created_at
  ) VALUES (
    'lesson_deposits',
    'MANUAL_UPDATE',
    p_user_id::TEXT,
    p_user_id,
    json_build_object(
      'used_lessons', p_used_lessons,
      'reason', 'Trigger fallback'
    ),
    NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_lesson_deposit_manual(UUID, INTEGER) TO authenticated;
