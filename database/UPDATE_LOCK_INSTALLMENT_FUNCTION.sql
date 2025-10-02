-- Update the lock_installment function to also update membership_requests table
-- This ensures that installment_1_locked, installment_2_locked, installment_3_locked fields are updated

CREATE OR REPLACE FUNCTION lock_installment(
    request_id UUID,
    installment_num INTEGER,
    locked_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if installment is already locked
    IF EXISTS (
        SELECT 1 FROM locked_installments 
        WHERE membership_request_id = request_id 
        AND installment_number = installment_num
    ) THEN
        RETURN FALSE; -- Already locked
    END IF;
    
    -- Insert the lock record in locked_installments table
    INSERT INTO locked_installments (
        membership_request_id,
        installment_number,
        locked_by
    ) VALUES (
        request_id,
        installment_num,
        locked_by_user_id
    );
    
    -- Update the membership_requests table to set the appropriate locked field
    UPDATE membership_requests 
    SET 
        installment_1_locked = CASE WHEN installment_num = 1 THEN true ELSE installment_1_locked END,
        installment_2_locked = CASE WHEN installment_num = 2 THEN true ELSE installment_2_locked END,
        installment_3_locked = CASE WHEN installment_num = 3 THEN true ELSE installment_3_locked END
    WHERE id = request_id;
    
    RETURN TRUE; -- Successfully locked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the unlock_installment function to also update membership_requests table
CREATE OR REPLACE FUNCTION unlock_installment(
    request_id UUID,
    installment_num INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete from locked_installments table
    DELETE FROM locked_installments 
    WHERE membership_request_id = request_id 
    AND installment_number = installment_num;
    
    -- Update the membership_requests table to unset the appropriate locked field
    UPDATE membership_requests 
    SET 
        installment_1_locked = CASE WHEN installment_num = 1 THEN false ELSE installment_1_locked END,
        installment_2_locked = CASE WHEN installment_num = 2 THEN false ELSE installment_2_locked END,
        installment_3_locked = CASE WHEN installment_num = 3 THEN false ELSE installment_3_locked END
    WHERE id = request_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete third installment permanently
CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
    request_id UUID,
    deleted_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the membership_requests table to mark third installment as deleted
    UPDATE membership_requests 
    SET 
        third_installment_deleted = true,
        third_installment_deleted_at = NOW(),
        third_installment_deleted_by = deleted_by_user_id,
        installment_3_amount = 0,
        installment_3_payment_method = 'cash',
        installment_3_due_date = NULL
    WHERE id = request_id;
    
    -- Also remove from locked_installments if it was locked
    DELETE FROM locked_installments 
    WHERE membership_request_id = request_id 
    AND installment_number = 3;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
