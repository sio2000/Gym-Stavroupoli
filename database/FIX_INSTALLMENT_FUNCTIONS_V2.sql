-- Fix installment functions to work with the correct locked_installments table structure

-- Drop existing functions first
DROP FUNCTION IF EXISTS lock_installment(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS unlock_installment(UUID, INTEGER);
DROP FUNCTION IF EXISTS delete_third_installment_permanently(UUID, UUID);
DROP FUNCTION IF EXISTS is_installment_locked(UUID, INTEGER);

-- Create the lock_installment function
CREATE OR REPLACE FUNCTION lock_installment(
  p_request_id UUID,
  p_installment_number INTEGER,
  p_locked_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_field_name TEXT;
  v_sql TEXT;
BEGIN
  -- Validate installment number
  IF p_installment_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
  END IF;

  -- Set the field name
  v_field_name := 'installment_' || p_installment_number || '_locked';

  -- Update the membership_requests table
  v_sql := format('UPDATE membership_requests SET %I = TRUE WHERE id = $1', v_field_name);
  EXECUTE v_sql USING p_request_id;

  -- Also insert into locked_installments table for backward compatibility
  INSERT INTO locked_installments (request_id, installment_number, locked_by, locked_at)
  VALUES (p_request_id, p_installment_number, p_locked_by, NOW())
  ON CONFLICT (request_id, installment_number) DO UPDATE SET
    locked_by = EXCLUDED.locked_by,
    locked_at = EXCLUDED.locked_at;

  RETURN TRUE;
END;
$$;

-- Create the unlock_installment function
CREATE OR REPLACE FUNCTION unlock_installment(
  p_request_id UUID,
  p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_field_name TEXT;
  v_sql TEXT;
BEGIN
  -- Validate installment number
  IF p_installment_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
  END IF;

  -- Set the field name
  v_field_name := 'installment_' || p_installment_number || '_locked';

  -- Update the membership_requests table
  v_sql := format('UPDATE membership_requests SET %I = FALSE WHERE id = $1', v_field_name);
  EXECUTE v_sql USING p_request_id;

  -- Also remove from locked_installments table
  DELETE FROM locked_installments 
  WHERE request_id = p_request_id AND installment_number = p_installment_number;

  RETURN TRUE;
END;
$$;

-- Create the delete_third_installment_permanently function
CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
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

  -- Update the locked_installments table to mark as deleted
  UPDATE locked_installments 
  SET 
    deleted_at = NOW(),
    deleted_by = p_deleted_by
  WHERE request_id = p_request_id AND installment_number = 3;

  -- If no record exists, create one
  INSERT INTO locked_installments (request_id, installment_number, locked_by, locked_at, deleted_at, deleted_by)
  VALUES (p_request_id, 3, p_deleted_by, NOW(), NOW(), p_deleted_by)
  ON CONFLICT (request_id, installment_number) DO UPDATE SET
    deleted_at = NOW(),
    deleted_by = p_deleted_by;

  RETURN TRUE;
END;
$$;

-- Create a function to check if an installment is locked
CREATE OR REPLACE FUNCTION is_installment_locked(
  p_request_id UUID,
  p_installment_number INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_field_name TEXT;
  v_sql TEXT;
  v_result BOOLEAN;
BEGIN
  -- Validate installment number
  IF p_installment_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
  END IF;

  -- Set the field name
  v_field_name := 'installment_' || p_installment_number || '_locked';

  -- Check the membership_requests table
  v_sql := format('SELECT %I FROM membership_requests WHERE id = $1', v_field_name);
  EXECUTE v_sql INTO v_result USING p_request_id;

  RETURN COALESCE(v_result, FALSE);
END;
$$;

-- Create a function to get locked installments for a request
CREATE OR REPLACE FUNCTION get_locked_installments_for_request(
  p_request_id UUID
)
RETURNS TABLE (
  installment_number INTEGER,
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    li.installment_number,
    li.locked_by,
    li.locked_at,
    li.deleted_at,
    li.deleted_by
  FROM locked_installments li
  WHERE li.request_id = p_request_id
  ORDER BY li.installment_number;
END;
$$;

-- Create a function to check if third installment is deleted
CREATE OR REPLACE FUNCTION is_third_installment_deleted(
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Check the membership_requests table first
  SELECT third_installment_deleted INTO v_result
  FROM membership_requests 
  WHERE id = p_request_id;
  
  -- If not found in membership_requests, check locked_installments
  IF v_result IS NULL THEN
    SELECT (deleted_at IS NOT NULL) INTO v_result
    FROM locked_installments 
    WHERE request_id = p_request_id AND installment_number = 3;
  END IF;
  
  RETURN COALESCE(v_result, FALSE);
END;
$$;

-- Create a function to get deleted third installment info
CREATE OR REPLACE FUNCTION get_deleted_third_installment_info(
  p_request_id UUID
)
RETURNS TABLE (
  deleted_at TIMESTAMPTZ,
  deleted_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    li.deleted_at,
    up.first_name || ' ' || up.last_name as deleted_by_name
  FROM locked_installments li
  LEFT JOIN user_profiles up ON li.deleted_by = up.user_id
  WHERE li.request_id = p_request_id 
    AND li.installment_number = 3 
    AND li.deleted_at IS NOT NULL;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_installment_locked(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_locked_installments_for_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_third_installment_deleted(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_third_installment_info(UUID) TO authenticated;
