-- Complete fix for installment locking functionality
-- This script will fix all issues with the installment locking system

-- Step 1: Add missing installment locking columns to membership_requests table
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

-- Step 2: Fix the locked_installments table structure
-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS locked_installments CASCADE;

-- Create the locked_installments table with the correct structure
CREATE TABLE locked_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES membership_requests(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number IN (1, 2, 3)),
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique constraint for request_id and installment_number
  UNIQUE(request_id, installment_number)
);

-- Add comments for documentation
COMMENT ON TABLE locked_installments IS 'Stores information about locked installments for membership requests';
COMMENT ON COLUMN locked_installments.request_id IS 'Reference to the membership request';
COMMENT ON COLUMN locked_installments.installment_number IS 'The installment number (1, 2, or 3)';
COMMENT ON COLUMN locked_installments.locked_by IS 'User who locked the installment';
COMMENT ON COLUMN locked_installments.locked_at IS 'When the installment was locked';
COMMENT ON COLUMN locked_installments.deleted_at IS 'When the installment was deleted (for 3rd installment)';
COMMENT ON COLUMN locked_installments.deleted_by IS 'User who deleted the installment (for 3rd installment)';

-- Create indexes for better performance
CREATE INDEX idx_locked_installments_request_id ON locked_installments(request_id);
CREATE INDEX idx_locked_installments_installment_number ON locked_installments(installment_number);
CREATE INDEX idx_locked_installments_locked_by ON locked_installments(locked_by);
CREATE INDEX idx_locked_installments_locked_at ON locked_installments(locked_at);

-- Enable Row Level Security (RLS)
ALTER TABLE locked_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view locked installments for their own requests" ON locked_installments
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM membership_requests 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all locked installments" ON locked_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Secretaries can view all locked installments" ON locked_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Admins can manage locked installments" ON locked_installments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  );

-- Grant necessary permissions
GRANT ALL ON locked_installments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 3: Drop existing functions first
DROP FUNCTION IF EXISTS lock_installment(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS unlock_installment(UUID, INTEGER);
DROP FUNCTION IF EXISTS delete_third_installment_permanently(UUID, UUID);
DROP FUNCTION IF EXISTS is_installment_locked(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_locked_installments_for_request(UUID);
DROP FUNCTION IF EXISTS is_third_installment_deleted(UUID);
DROP FUNCTION IF EXISTS get_deleted_third_installment_info(UUID);

-- Step 4: Create the lock_installment function
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

-- Step 5: Create the unlock_installment function
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

-- Step 6: Create the delete_third_installment_permanently function
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

-- Step 7: Create a function to check if an installment is locked
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

-- Step 8: Create a function to get locked installments for a request
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

-- Step 9: Create a function to check if third installment is deleted
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

-- Step 10: Create a function to get deleted third installment info
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

-- Step 11: Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_installment_locked(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_locked_installments_for_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_third_installment_deleted(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_third_installment_info(UUID) TO authenticated;

-- Step 12: Update existing data to ensure consistency
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
