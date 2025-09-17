-- Fix Functions - Διορθώνει τα ROW_COUNT errors
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- PHASE 1: FIX EXPIRE_MEMBERSHIPS FUNCTION
-- ========================================

SELECT 'PHASE 1: Fixing expire_memberships function...' as phase;

CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
    AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the number of expired memberships
    RAISE NOTICE 'Expired % memberships', expired_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 2: FIX CHECK_AND_EXPIRE_MEMBERSHIPS FUNCTION
-- ========================================

SELECT 'PHASE 2: Fixing check_and_expire_memberships function...' as phase;

CREATE OR REPLACE FUNCTION check_and_expire_memberships()
RETURNS void AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE 
        is_active = true 
        AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the number of expired memberships
    RAISE NOTICE 'Checked and expired % memberships', expired_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 3: TEST FUNCTIONS
-- ========================================

SELECT 'PHASE 3: Testing fixed functions...' as phase;

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
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verification...' as phase;

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

-- Έλεγχος υπάρχουσες συνδρομές
SELECT 
    is_active,
    COUNT(*) as count
FROM memberships 
GROUP BY is_active
ORDER BY is_active;

SELECT 'Functions fixed successfully!' as result;
