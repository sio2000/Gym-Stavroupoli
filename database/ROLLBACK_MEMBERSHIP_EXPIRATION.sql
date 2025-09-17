-- ROLLBACK MEMBERSHIP EXPIRATION - Rollback συστήματος λήξης συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- PHASE 1: RESTORE ORIGINAL FUNCTIONS
-- ========================================

SELECT 'PHASE 1: Restoring original functions...' as phase;

-- Επαναφορά αρχικών functions
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_and_expire_memberships()
RETURNS void AS $$
BEGIN
    -- Ενημέρωση συνδρομών που έχουν λήξει
    UPDATE memberships 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active' 
        AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 2: REMOVE NEW FUNCTIONS
-- ========================================

SELECT 'PHASE 2: Removing new functions...' as phase;

-- Διαγραφή νέων functions
DROP FUNCTION IF EXISTS get_active_memberships(UUID);
DROP FUNCTION IF EXISTS user_has_active_memberships(UUID);
DROP FUNCTION IF EXISTS scheduled_expire_memberships();

-- ========================================
-- PHASE 3: REMOVE NEW COLUMNS (OPTIONAL)
-- ========================================

SELECT 'PHASE 3: Removing new columns (optional)...' as phase;

-- Προσοχή: Αυτό θα διαγράψει τα data! Μόνο αν θέλετε να επιστρέψετε στην αρχική κατάσταση
-- ALTER TABLE memberships DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE memberships DROP COLUMN IF EXISTS expires_at;

-- Εναλλακτικά, μπορείτε να αφήσετε τα columns αλλά να επαναφέρετε τις τιμές
-- UPDATE memberships SET is_active = true WHERE is_active IS NOT NULL;

-- ========================================
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verification...' as phase;

-- Έλεγχος αν οι αρχικές functions υπάρχουν
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

-- Έλεγχος ότι οι νέες functions δεν υπάρχουν
SELECT 
    'get_active_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_active_memberships') 
        THEN '✗ STILL EXISTS'
        ELSE '✓ REMOVED'
    END as status;

SELECT 
    'user_has_active_memberships' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_has_active_memberships') 
        THEN '✗ STILL EXISTS'
        ELSE '✓ REMOVED'
    END as status;

SELECT 'Rollback completed successfully!' as result;
