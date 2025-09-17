-- ADD INSTALLMENTS SUPPORT
-- This script adds installments support to membership_requests table

-- ========================================
-- PHASE 1: ADD INSTALLMENTS COLUMNS
-- ========================================

SELECT 'PHASE 1: Adding installments columns...' as phase;

-- Add installments columns to membership_requests table
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS has_installments BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_amount DECIMAL(10,2);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_amount DECIMAL(10,2);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_amount DECIMAL(10,2);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_payment_method VARCHAR(50);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_payment_method VARCHAR(50);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_payment_method VARCHAR(50);
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_paid BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_paid BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_paid BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_paid_at TIMESTAMPTZ;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_paid_at TIMESTAMPTZ;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_paid_at TIMESTAMPTZ;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS all_installments_paid BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installments_completed_at TIMESTAMPTZ;

-- ========================================
-- PHASE 2: CREATE INSTALLMENTS FUNCTIONS
-- ========================================

SELECT 'PHASE 2: Creating installments functions...' as phase;

-- Function to get users with installments
CREATE OR REPLACE FUNCTION get_users_with_installments()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    package_id UUID,
    duration_type TEXT,
    requested_price DECIMAL(10,2),
    has_installments BOOLEAN,
    installment_1_amount DECIMAL(10,2),
    installment_2_amount DECIMAL(10,2),
    installment_3_amount DECIMAL(10,2),
    installment_1_paid BOOLEAN,
    installment_2_paid BOOLEAN,
    installment_3_paid BOOLEAN,
    all_installments_paid BOOLEAN,
    status TEXT,
    created_at TIMESTAMPTZ,
    user_name TEXT,
    package_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        mr.user_id,
        mr.package_id,
        mr.duration_type,
        mr.requested_price,
        mr.has_installments,
        mr.installment_1_amount,
        mr.installment_2_amount,
        mr.installment_3_amount,
        mr.installment_1_paid,
        mr.installment_2_paid,
        mr.installment_3_paid,
        mr.all_installments_paid,
        mr.status,
        mr.created_at,
        CONCAT(up.first_name, ' ', up.last_name) as user_name,
        mp.name as package_name
    FROM membership_requests mr
    JOIN user_profiles up ON mr.user_id = up.user_id
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.has_installments = true
    ORDER BY mr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark installment as paid
CREATE OR REPLACE FUNCTION mark_installment_paid(
    request_id UUID,
    installment_number INTEGER,
    payment_method TEXT DEFAULT 'cash'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_time TIMESTAMPTZ := NOW();
    all_paid BOOLEAN := false;
BEGIN
    -- Update the specific installment
    IF installment_number = 1 THEN
        UPDATE membership_requests 
        SET 
            installment_1_paid = true,
            installment_1_paid_at = current_time,
            installment_1_payment_method = payment_method
        WHERE id = request_id;
    ELSIF installment_number = 2 THEN
        UPDATE membership_requests 
        SET 
            installment_2_paid = true,
            installment_2_paid_at = current_time,
            installment_2_payment_method = payment_method
        WHERE id = request_id;
    ELSIF installment_number = 3 THEN
        UPDATE membership_requests 
        SET 
            installment_3_paid = true,
            installment_3_paid_at = current_time,
            installment_3_payment_method = payment_method
        WHERE id = request_id;
    ELSE
        RETURN false;
    END IF;

    -- Check if all installments are paid
    SELECT 
        (installment_1_paid = true AND installment_2_paid = true AND installment_3_paid = true)
    INTO all_paid
    FROM membership_requests
    WHERE id = request_id;

    -- If all installments are paid, mark as completed
    IF all_paid THEN
        UPDATE membership_requests 
        SET 
            all_installments_paid = true,
            installments_completed_at = current_time,
            status = 'approved'
        WHERE id = request_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 3: VERIFY INSTALLATION
-- ========================================

SELECT 'PHASE 3: Verifying installation...' as phase;

-- Check new columns
SELECT 'New installments columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name LIKE 'installment%' 
ORDER BY column_name;

SELECT 'Installments support added successfully!' as result;
