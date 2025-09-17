-- FIX MEMBERSHIP EXPIRATION - Διόρθωση συστήματος λήξης συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- PHASE 1: UPDATE EXISTING FUNCTIONS
-- ========================================

SELECT 'PHASE 1: Updating expire_memberships function...' as phase;

-- Ενημέρωση expire_memberships function για να ενημερώνει και το is_active
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET 
        status = 'expired', 
        is_active = false,
        updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    -- Log the number of expired memberships
    RAISE NOTICE 'Expired % memberships', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Ενημέρωση check_and_expire_memberships function
CREATE OR REPLACE FUNCTION check_and_expire_memberships()
RETURNS void AS $$
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date < CURRENT_DATE;
    
    -- Log the number of expired memberships
    RAISE NOTICE 'Checked and expired % memberships', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 2: ADD MISSING COLUMNS IF NEEDED
-- ========================================

SELECT 'PHASE 2: Adding missing columns if needed...' as phase;

-- Προσθήκη is_active column αν δεν υπάρχει
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Προσθήκη expires_at column για μελλοντική χρήση
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ========================================
-- PHASE 3: BACKFILL DATA
-- ========================================

SELECT 'PHASE 3: Backfilling data...' as phase;

-- Ενημέρωση is_active για υπάρχουσες συνδρομές (μετά την προσθήκη του column)
UPDATE memberships 
SET is_active = (status = 'active' AND end_date >= CURRENT_DATE);

-- Ενημέρωση expires_at για υπάρχουσες συνδρομές
UPDATE memberships 
SET expires_at = end_date::timestamptz
WHERE expires_at IS NULL;

-- ========================================
-- PHASE 4: CREATE IMPROVED FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Creating improved functions...' as phase;

-- Function για έλεγχο ενεργών συνδρομών (deterministic)
CREATE OR REPLACE FUNCTION get_active_memberships(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    package_id UUID,
    status TEXT,
    is_active BOOLEAN,
    start_date DATE,
    end_date DATE,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.user_id,
        m.package_id,
        m.status,
        m.is_active,
        m.start_date,
        m.end_date,
        m.expires_at
    FROM memberships m
    WHERE m.user_id = user_uuid
    AND m.status = 'active'
    AND m.is_active = true
    AND m.end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function για έλεγχο αν ο χρήστης έχει ενεργές συνδρομές
CREATE OR REPLACE FUNCTION user_has_active_memberships(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM memberships
    WHERE user_id = user_uuid
    AND status = 'active'
    AND is_active = true
    AND end_date >= CURRENT_DATE;
    
    RETURN active_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 5: CREATE SCHEDULED JOB
-- ========================================

SELECT 'PHASE 5: Setting up scheduled job...' as phase;

-- Δημιουργία function για scheduled job
CREATE OR REPLACE FUNCTION scheduled_expire_memberships()
RETURNS void AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the result
    IF expired_count > 0 THEN
        RAISE NOTICE 'Scheduled job: Expired % memberships', expired_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 6: TEST FUNCTIONS
-- ========================================

SELECT 'PHASE 6: Testing functions...' as phase;

-- Test expire_memberships function
DO $$
BEGIN
    PERFORM expire_memberships();
    RAISE NOTICE 'expire_memberships function executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing expire_memberships: %', SQLERRM;
END $$;

-- Test check_and_expire_memberships function
DO $$
BEGIN
    PERFORM check_and_expire_memberships();
    RAISE NOTICE 'check_and_expire_memberships function executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing check_and_expire_memberships: %', SQLERRM;
END $$;

-- ========================================
-- PHASE 7: VERIFICATION
-- ========================================

SELECT 'PHASE 7: Verification...' as phase;

-- Έλεγχος αν οι functions υπάρχουν
SELECT 
    'expire_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_memberships') 
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

SELECT 
    'check_and_expire_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_expire_memberships') 
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

SELECT 
    'get_active_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_active_memberships') 
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

SELECT 
    'user_has_active_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_active_memberships') 
        THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Έλεγχος columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
AND column_name IN ('is_active', 'expires_at', 'status', 'end_date')
ORDER BY column_name;

-- Έλεγχος υπάρχουσες συνδρομές
SELECT 
    status,
    is_active,
    COUNT(*) as count
FROM memberships 
GROUP BY status, is_active
ORDER BY status, is_active;

SELECT 'Migration completed successfully!' as result;
