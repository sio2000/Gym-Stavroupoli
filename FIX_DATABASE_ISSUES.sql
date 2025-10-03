-- Fix database issues for installment functionality
-- This script will ensure all required functions and columns exist

-- Step 1: Create missing columns if they don't exist
DO $$
BEGIN
    -- Add installment lock columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'installment_1_locked') THEN
        ALTER TABLE membership_requests ADD COLUMN installment_1_locked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added installment_1_locked column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'installment_2_locked') THEN
        ALTER TABLE membership_requests ADD COLUMN installment_2_locked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added installment_2_locked column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'installment_3_locked') THEN
        ALTER TABLE membership_requests ADD COLUMN installment_3_locked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added installment_3_locked column';
    END IF;
    
    -- Add third installment deletion columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'third_installment_deleted') THEN
        ALTER TABLE membership_requests ADD COLUMN third_installment_deleted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added third_installment_deleted column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'third_installment_deleted_at') THEN
        ALTER TABLE membership_requests ADD COLUMN third_installment_deleted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added third_installment_deleted_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_requests' AND column_name = 'third_installment_deleted_by') THEN
        ALTER TABLE membership_requests ADD COLUMN third_installment_deleted_by UUID;
        RAISE NOTICE 'Added third_installment_deleted_by column';
    END IF;
END $$;

-- Step 2: Create the lock_installment function
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

-- Step 3: Create the unlock_installment function
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

-- Step 4: Create the delete_third_installment_permanently function
CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
  p_request_id UUID,
  p_deleted_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate deleted_by is not null
  IF p_deleted_by IS NULL THEN
    RAISE EXCEPTION 'deleted_by cannot be null';
  END IF;

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

-- Step 5: Create the is_installment_locked function
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

-- Step 6: Create the update_lock_installment function
CREATE OR REPLACE FUNCTION update_lock_installment(
    request_id UUID,
    installment_num INTEGER,
    locked_by_user_id UUID DEFAULT NULL,
    lock_status BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate locked_by_user_id is not null when locking
    IF lock_status AND locked_by_user_id IS NULL THEN
        RAISE EXCEPTION 'locked_by_user_id cannot be null when locking an installment';
    END IF;

    IF lock_status THEN
        -- Lock the installment
        RETURN lock_installment(request_id, installment_num, locked_by_user_id);
    ELSE
        -- Unlock the installment
        RETURN unlock_installment(request_id, installment_num);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION lock_installment(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_installment(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_installment_locked(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_lock_installment(UUID, INTEGER, UUID, BOOLEAN) TO authenticated;

-- Step 8: Verify the functions were created
SELECT 'Database fix completed successfully' as status;
SELECT 'Functions created:' as info, proname as function_name FROM pg_proc WHERE proname IN (
    'lock_installment',
    'unlock_installment', 
    'delete_third_installment_permanently',
    'is_installment_locked',
    'update_lock_installment'
) ORDER BY proname;
