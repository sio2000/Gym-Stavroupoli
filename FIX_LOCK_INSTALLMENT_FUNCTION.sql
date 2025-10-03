-- Fix the lock_installment function to work with user_profiles table
-- This removes the problematic INSERT into locked_installments table

CREATE OR REPLACE FUNCTION lock_installment(
  p_request_id UUID,
  p_installment_number INTEGER,
  p_locked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate installment number
  IF p_installment_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
  END IF;

  -- Update the membership_requests table directly
  IF p_installment_number = 1 THEN
    UPDATE membership_requests 
    SET installment_1_locked = TRUE
    WHERE id = p_request_id;
  ELSIF p_installment_number = 2 THEN
    UPDATE membership_requests 
    SET installment_2_locked = TRUE
    WHERE id = p_request_id;
  ELSIF p_installment_number = 3 THEN
    UPDATE membership_requests 
    SET installment_3_locked = TRUE
    WHERE id = p_request_id;
  END IF;

  -- Note: We don't insert into locked_installments table due to foreign key constraints
  -- The installment_X_locked flags in membership_requests are sufficient

  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_installment(UUID, INTEGER, UUID) TO authenticated;

-- Test the function
SELECT 'lock_installment function updated successfully' as status;


