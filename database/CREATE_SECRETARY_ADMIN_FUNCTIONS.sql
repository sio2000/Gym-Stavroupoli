-- Create admin functions to bypass RLS for secretary operations
-- These functions allow secretaries to perform operations that require admin privileges

-- Function to save cash transactions as admin
CREATE OR REPLACE FUNCTION admin_save_cash_transaction(
    p_user_id UUID,
    p_amount DECIMAL,
    p_transaction_type VARCHAR,
    p_program_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner (admin)
AS $$
DECLARE
    transaction_id UUID;
BEGIN
    -- Insert the transaction
    INSERT INTO user_cash_transactions (
        user_id,
        amount,
        transaction_type,
        program_id,
        created_by,
        notes
    ) VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_program_id,
        COALESCE(p_created_by, auth.uid()),
        p_notes
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in admin_save_cash_transaction: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Function to save kettlebell points as admin
CREATE OR REPLACE FUNCTION admin_save_kettlebell_points(
    p_user_id UUID,
    p_points INTEGER,
    p_program_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner (admin)
AS $$
DECLARE
    points_id UUID;
BEGIN
    -- Check if user_kettlebell_points table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points') THEN
        -- Insert the points
        INSERT INTO user_kettlebell_points (
            user_id,
            points,
            program_id,
            created_by,
            created_at
        ) VALUES (
            p_user_id,
            p_points,
            p_program_id,
            COALESCE(p_created_by, auth.uid()),
            NOW()
        ) RETURNING id INTO points_id;
        
        RETURN points_id;
    ELSE
        RAISE NOTICE 'Table user_kettlebell_points does not exist';
        RETURN NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in admin_save_kettlebell_points: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Function to mark old members as used as admin
CREATE OR REPLACE FUNCTION admin_mark_old_members_used(
    p_user_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner (admin)
AS $$
DECLARE
    usage_id UUID;
BEGIN
    -- Check if old_members_usage table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'old_members_usage') THEN
        -- Insert the usage record
        INSERT INTO old_members_usage (
            user_id,
            used_by,
            used_at
        ) VALUES (
            p_user_id,
            COALESCE(p_created_by, auth.uid()),
            NOW()
        ) RETURNING id INTO usage_id;
        
        RETURN usage_id;
    ELSE
        RAISE NOTICE 'Table old_members_usage does not exist';
        RETURN NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in admin_mark_old_members_used: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Grant execute permissions to authenticated users (including secretaries)
GRANT EXECUTE ON FUNCTION admin_save_cash_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION admin_save_kettlebell_points TO authenticated;
GRANT EXECUTE ON FUNCTION admin_mark_old_members_used TO authenticated;

-- Verify functions were created
SELECT 'Admin functions created successfully for secretary operations' as status;
