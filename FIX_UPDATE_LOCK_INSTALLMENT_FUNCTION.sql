-- Fix the update_lock_installment function to only lock the specific installment
-- This function should work the same as lock_installment but with different parameter names

CREATE OR REPLACE FUNCTION update_lock_installment(
  request_id UUID,
  installment_num INTEGER,
  locked_by_user_id UUID DEFAULT NULL,
  lock_status BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate installment number
  IF installment_num NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', installment_num;
  END IF;

  -- Update only the specific installment in the membership_requests table
  IF installment_num = 1 THEN
    UPDATE membership_requests 
    SET installment_1_locked = lock_status
    WHERE id = request_id;
  ELSIF installment_num = 2 THEN
    UPDATE membership_requests 
    SET installment_2_locked = lock_status
    WHERE id = request_id;
  ELSIF installment_num = 3 THEN
    UPDATE membership_requests 
    SET installment_3_locked = lock_status
    WHERE id = request_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_lock_installment(UUID, INTEGER, UUID, BOOLEAN) TO authenticated;

-- Test the function
SELECT 'update_lock_installment function updated successfully' as status;
