-- Quick fix for delete 3rd installment functionality
-- Run this script in your PostgreSQL client (pgAdmin, DBeaver, etc.)

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

-- Step 2: Create the delete_third_installment_permanently function
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

  -- Remove from locked_installments table if it exists
  DELETE FROM locked_installments 
  WHERE request_id = p_request_id AND installment_number = 3;

  RETURN TRUE;
END;
$$;

-- Step 3: Create the is_installment_locked function
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

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_third_installment_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_installment_locked(UUID, INTEGER) TO authenticated;

-- Step 5: Test the functions
SELECT 'Database fix completed successfully' as status;

-- Test the is_installment_locked function
SELECT 
    'Testing is_installment_locked function:' as info,
    id,
    is_installment_locked(id, 1) as installment_1,
    is_installment_locked(id, 2) as installment_2,
    is_installment_locked(id, 3) as installment_3
FROM membership_requests 
WHERE has_installments = true 
LIMIT 5;

-- Show current data
SELECT 
    'Current membership requests with installments:' as info,
    id,
    has_installments,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    created_at
FROM membership_requests 
WHERE has_installments = true 
LIMIT 5;
