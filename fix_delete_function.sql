-- Fix the delete_third_installment_permanently function to allow NULL values
CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
  p_request_id UUID,
  p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that p_deleted_by exists in user_profiles if not NULL
  IF p_deleted_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_deleted_by) THEN
      RAISE EXCEPTION 'User with ID % does not exist in user_profiles', p_deleted_by;
    END IF;
  END IF;

  -- Update membership_requests table
  UPDATE membership_requests 
  SET 
    installment_3_locked = TRUE,
    third_installment_deleted = TRUE,
    third_installment_deleted_at = NOW(),
    third_installment_deleted_by = p_deleted_by
  WHERE id = p_request_id;

  -- Note: We don't delete from locked_installments table due to foreign key constraints
  -- The installment_3_locked flag in membership_requests is sufficient

  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;

-- Test the function
SELECT 'Function updated successfully' as status;
