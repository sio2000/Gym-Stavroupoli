-- Fix installment locking by adding missing columns to membership_requests table
-- This script adds the necessary columns for installment locking functionality

-- Add missing installment locking columns to membership_requests table
ALTER TABLE membership_requests 
ADD COLUMN IF NOT EXISTS installment_1_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_2_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_3_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS third_installment_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS third_installment_deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS third_installment_deleted_by UUID;

-- Add comments for documentation
COMMENT ON COLUMN membership_requests.installment_1_locked IS 'Indicates if the first installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.installment_2_locked IS 'Indicates if the second installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.installment_3_locked IS 'Indicates if the third installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.third_installment_deleted IS 'Indicates if the third installment has been permanently deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_at IS 'Timestamp when the third installment was deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_by IS 'User ID who deleted the third installment';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_1_locked ON membership_requests(installment_1_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_2_locked ON membership_requests(installment_2_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_3_locked ON membership_requests(installment_3_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_third_installment_deleted ON membership_requests(third_installment_deleted);

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

  -- Remove from locked_installments table
  DELETE FROM locked_installments 
  WHERE request_id = p_request_id AND installment_number = 3;

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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_installment_locked(UUID, INTEGER) TO authenticated;

-- Update existing data to ensure consistency
-- Set installment_1_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_1_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 1
);

-- Set installment_2_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_2_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 2
);

-- Set installment_3_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_3_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 3
);

-- Set third_installment_deleted = TRUE for existing deleted third installments
UPDATE membership_requests 
SET 
  third_installment_deleted = TRUE,
  installment_3_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 3 AND deleted_at IS NOT NULL
);
