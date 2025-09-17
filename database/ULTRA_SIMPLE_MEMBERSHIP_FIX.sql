-- ULTRA SIMPLE MEMBERSHIP FIX - Απλούστερο migration
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- PHASE 1: CHECK EXISTING SCHEMA
-- ========================================

SELECT 'PHASE 1: Checking existing schema...' as phase;

-- Έλεγχος υπάρχοντος schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY column_name;

-- ========================================
-- PHASE 2: ADD MISSING COLUMNS
-- ========================================

SELECT 'PHASE 2: Adding missing columns...' as phase;

-- Προσθήκη is_active column αν δεν υπάρχει
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Προσθήκη status column αν δεν υπάρχει
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended'));

-- Προσθήκη expires_at column αν δεν υπάρχει
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ========================================
-- PHASE 3: BACKFILL DATA
-- ========================================

SELECT 'PHASE 3: Backfilling data...' as phase;

-- Ενημέρωση is_active για υπάρχουσες συνδρομές
UPDATE memberships 
SET is_active = (end_date >= CURRENT_DATE);

-- Ενημέρωση status για υπάρχουσες συνδρομές
UPDATE memberships 
SET status = CASE 
    WHEN end_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
END
WHERE status IS NULL;

-- Ενημέρωση expires_at για υπάρχουσες συνδρομές
UPDATE memberships 
SET expires_at = end_date::timestamptz
WHERE expires_at IS NULL;

-- ========================================
-- PHASE 4: CREATE/UPDATE FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Creating/updating functions...' as phase;

-- Δημιουργία ή ενημέρωση expire_memberships function
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

-- Δημιουργία ή ενημέρωση check_and_expire_memberships function
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
-- PHASE 5: TEST FUNCTIONS
-- ========================================

SELECT 'PHASE 5: Testing functions...' as phase;

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
-- PHASE 6: VERIFICATION
-- ========================================

SELECT 'PHASE 6: Verification...' as phase;

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

SELECT 'Ultra simple migration completed successfully!' as result;
