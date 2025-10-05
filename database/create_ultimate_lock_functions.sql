-- Create Ultimate-specific lock functions
-- These functions work with the ultimate_installment_locks table

-- Function to lock an Ultimate installment
CREATE OR REPLACE FUNCTION lock_ultimate_installment(
  p_request_id UUID,
  p_installment_number INTEGER,
  p_locked_by UUID
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

  -- Validate locked_by is not null
  IF p_locked_by IS NULL THEN
    RAISE EXCEPTION 'locked_by cannot be null';
  END IF;

  -- Insert or update the ultimate_installment_locks table
  INSERT INTO ultimate_installment_locks (
    membership_request_id,
    installment_number,
    locked_by,
    locked_at,
    deleted_at
  )
  VALUES (
    p_request_id,
    p_installment_number,
    p_locked_by,
    NOW(),
    NULL
  )
  ON CONFLICT (membership_request_id, installment_number) DO UPDATE SET
    locked_by = EXCLUDED.locked_by,
    locked_at = EXCLUDED.locked_at,
    deleted_at = NULL,
    updated_at = NOW();

  -- Also update the membership_requests table for backward compatibility
  CASE p_installment_number
    WHEN 1 THEN
      UPDATE membership_requests SET installment_1_locked = TRUE WHERE id = p_request_id;
    WHEN 2 THEN
      UPDATE membership_requests SET installment_2_locked = TRUE WHERE id = p_request_id;
    WHEN 3 THEN
      UPDATE membership_requests SET installment_3_locked = TRUE WHERE id = p_request_id;
  END CASE;

  RETURN TRUE;
END;
$$;

-- Function to unlock an Ultimate installment
CREATE OR REPLACE FUNCTION unlock_ultimate_installment(
  p_request_id UUID,
  p_installment_number INTEGER
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

  -- Update the ultimate_installment_locks table to mark as deleted
  UPDATE ultimate_installment_locks
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE membership_request_id = p_request_id 
    AND installment_number = p_installment_number
    AND deleted_at IS NULL;

  -- Also update the membership_requests table for backward compatibility
  CASE p_installment_number
    WHEN 1 THEN
      UPDATE membership_requests SET installment_1_locked = FALSE WHERE id = p_request_id;
    WHEN 2 THEN
      UPDATE membership_requests SET installment_2_locked = FALSE WHERE id = p_request_id;
    WHEN 3 THEN
      UPDATE membership_requests SET installment_3_locked = FALSE WHERE id = p_request_id;
  END CASE;

  RETURN FOUND;
END;
$$;

-- Function to permanently delete the third Ultimate installment
CREATE OR REPLACE FUNCTION delete_ultimate_third_installment(
  p_request_id UUID,
  p_deleted_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update membership_requests table
  UPDATE membership_requests 
  SET 
    installment_3_locked = TRUE,
    third_installment_deleted = TRUE,
    third_installment_deleted_at = NOW(),
    third_installment_deleted_by = p_deleted_by
  WHERE id = p_request_id;

  -- Update ultimate_installment_locks table to mark third installment as deleted
  INSERT INTO ultimate_installment_locks (
    membership_request_id,
    installment_number,
    locked_by,
    locked_at,
    deleted_at,
    deleted_by
  )
  VALUES (
    p_request_id,
    3,
    p_deleted_by,
    NOW(),
    NOW(),
    p_deleted_by
  )
  ON CONFLICT (membership_request_id, installment_number) DO UPDATE SET
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Function to check if an Ultimate installment is locked
CREATE OR REPLACE FUNCTION is_ultimate_installment_locked(
  p_request_id UUID,
  p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Validate installment number
  IF p_installment_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
  END IF;

  -- Check the ultimate_installment_locks table
  SELECT EXISTS(
    SELECT 1 FROM ultimate_installment_locks
    WHERE membership_request_id = p_request_id
      AND installment_number = p_installment_number
      AND deleted_at IS NULL
  ) INTO v_result;

  RETURN COALESCE(v_result, FALSE);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_ultimate_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_ultimate_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_ultimate_third_installment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_ultimate_installment_locked(UUID, INTEGER) TO authenticated;
