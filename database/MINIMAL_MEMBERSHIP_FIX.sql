-- MINIMAL MEMBERSHIP FIX - Ελάχιστο migration
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
-- PHASE 2: ADD ONLY ESSENTIAL COLUMNS
-- ========================================

SELECT 'PHASE 2: Adding essential columns...' as phase;

-- Προσθήκη is_active column αν δεν υπάρχει
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ========================================
-- PHASE 3: BACKFILL DATA
-- ========================================

SELECT 'PHASE 3: Backfilling data...' as phase;

-- Ενημέρωση is_active για υπάρχουσες συνδρομές (μόνο με end_date)
UPDATE memberships 
SET is_active = (end_date >= CURRENT_DATE);

-- ========================================
-- PHASE 4: CREATE SIMPLE FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Creating simple functions...' as phase;

-- Απλή function για λήξη συνδρομών (μόνο με end_date)
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
    AND end_date < CURRENT_DATE;
    
    -- Log the number of expired memberships
    RAISE NOTICE 'Expired % memberships', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Απλή function για έλεγχο και λήξη
CREATE OR REPLACE FUNCTION check_and_expire_memberships()
RETURNS void AS $$
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE 
        is_active = true 
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

-- Έλεγχος columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
AND column_name IN ('is_active', 'end_date')
ORDER BY column_name;

-- Έλεγχος υπάρχουσες συνδρομές
SELECT 
    is_active,
    COUNT(*) as count
FROM memberships 
GROUP BY is_active
ORDER BY is_active;

SELECT 'Minimal migration completed successfully!' as result;
