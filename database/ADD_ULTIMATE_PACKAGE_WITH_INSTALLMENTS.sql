-- ADD ULTIMATE PACKAGE WITH INSTALLMENTS SUPPORT
-- This script adds the Ultimate Package and installments functionality

-- ========================================
-- PHASE 1: ADD ULTIMATE PACKAGE
-- ========================================

SELECT 'PHASE 1: Adding Ultimate Package...' as phase;

-- Create Ultimate Package (3x/week Pilates + Free Gym for 1 year)
INSERT INTO membership_packages (
    id, 
    name, 
    description, 
    duration_days, 
    price, 
    package_type, 
    is_active, 
    features, 
    created_at, 
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Ultimate',
    '3x/week Pilates + Free Gym for 1 year with Installments Option',
    365,
    1200.00, -- Total price for installments
    'ultimate',
    true,
    '{"3x/week Pilates", "Free Gym Access", "Installments Available", "1 Year Duration"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Ultimate');

-- Get the Ultimate package ID
SELECT 'Ultimate package created/found:' as info;
SELECT id, name, package_type FROM membership_packages WHERE name = 'Ultimate';

-- ========================================
-- PHASE 2: ADD ULTIMATE PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Adding Ultimate package durations...' as phase;

-- Create Ultimate package duration (1 year with installments)
WITH ultimate_package AS (
    SELECT id FROM membership_packages WHERE name = 'Ultimate' LIMIT 1
)
INSERT INTO membership_package_durations (
    id,
    package_id,
    duration_type,
    duration_days,
    price,
    classes_count,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    up.id,
    'ultimate_1year',
    365,
    1200.00,
    156, -- 3 classes per week * 52 weeks
    true,
    NOW(),
    NOW()
FROM ultimate_package up
WHERE EXISTS (SELECT 1 FROM ultimate_package);

-- ========================================
-- PHASE 3: ADD INSTALLMENTS SUPPORT TO MEMBERSHIP_REQUESTS
-- ========================================

SELECT 'PHASE 3: Adding installments support to membership_requests...' as phase;

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
-- PHASE 4: UPDATE PACKAGE TYPE CONSTRAINTS
-- ========================================

SELECT 'PHASE 4: Updating package type constraints...' as phase;

-- Update package_type constraint to include 'ultimate'
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

ALTER TABLE membership_packages 
ADD CONSTRAINT membership_packages_package_type_check 
CHECK (package_type IN ('standard', 'free_gym', 'pilates', 'ultimate'));

-- Update duration_type constraint to include 'ultimate_1year'
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- ========================================
-- PHASE 5: CREATE INSTALLMENTS TRACKING FUNCTIONS
-- ========================================

SELECT 'PHASE 5: Creating installments tracking functions...' as phase;

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
-- PHASE 6: VERIFY INSTALLATION
-- ========================================

SELECT 'PHASE 6: Verifying installation...' as phase;

-- Check Ultimate package
SELECT 'Ultimate package:' as info;
SELECT id, name, package_type, price FROM membership_packages WHERE name = 'Ultimate';

-- Check Ultimate duration
SELECT 'Ultimate duration:' as info;
SELECT id, duration_type, price, classes_count FROM membership_package_durations WHERE duration_type = 'ultimate_1year';

-- Check new columns
SELECT 'New installments columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name LIKE 'installment%' 
ORDER BY column_name;

SELECT 'Ultimate Package with Installments support added successfully!' as result;
