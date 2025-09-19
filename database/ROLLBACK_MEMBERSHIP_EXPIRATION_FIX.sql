-- =====================================================
-- ROLLBACK SCRIPT - MEMBERSHIP EXPIRATION FIX
-- =====================================================
-- 🎯 PURPOSE: Rollback the membership expiration fix if needed
-- ⚠️  WARNING: Use with caution - this will restore expired memberships to active
-- =====================================================

-- ========================================
-- PHASE 1: BACKUP CURRENT STATE
-- ========================================

SELECT 'PHASE 1: Creating backup of current state...' as phase;

-- Create backup table
CREATE TABLE IF NOT EXISTS memberships_backup_before_rollback AS
SELECT * FROM memberships;

SELECT 
    'BACKUP CREATED' as backup_status,
    COUNT(*) as backed_up_rows
FROM memberships_backup_before_rollback;

-- ========================================
-- PHASE 2: ROLLBACK MEMBERSHIP STATUSES
-- ========================================

SELECT 'PHASE 2: Rolling back membership statuses...' as phase;

-- WARNING: This will reactivate memberships that were expired by the fix
-- Only do this if you're sure the original expiration was incorrect

DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Restore memberships that were expired by our fix
    -- (Only those updated in the last 24 hours to be safe)
    UPDATE memberships 
    SET 
        status = 'active',
        is_active = true,
        updated_at = NOW()
    WHERE status = 'expired'
    AND is_active = false
    AND updated_at >= NOW() - INTERVAL '24 hours'
    AND end_date >= CURRENT_DATE - INTERVAL '30 days'; -- Don't restore very old ones
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'ROLLBACK: Restored % memberships to active status', affected_rows;
END $$;

-- ========================================
-- PHASE 3: DROP NEW FUNCTIONS
-- ========================================

SELECT 'PHASE 3: Removing new functions...' as phase;

-- Drop the new functions we created
DROP FUNCTION IF EXISTS get_user_active_memberships_deterministic(UUID);
DROP FUNCTION IF EXISTS user_has_qr_access(UUID);
DROP FUNCTION IF EXISTS get_membership_status_summary();
DROP FUNCTION IF EXISTS manual_expire_overdue_memberships();

-- ========================================
-- PHASE 4: DROP NEW INDEXES
-- ========================================

SELECT 'PHASE 4: Removing new indexes...' as phase;

-- Drop the performance indexes we created
DROP INDEX IF EXISTS idx_memberships_active_deterministic;
DROP INDEX IF EXISTS idx_memberships_expiration;
DROP INDEX IF EXISTS idx_memberships_user_status;
DROP INDEX IF EXISTS idx_memberships_end_date_only;

-- ========================================
-- PHASE 5: VERIFICATION
-- ========================================

SELECT 'PHASE 5: Verifying rollback...' as phase;

-- Show current membership status after rollback
SELECT 
    'POST-ROLLBACK STATUS' as status_type,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as expired_by_date,
    COUNT(CASE WHEN is_active = true THEN 1 END) as marked_active
FROM memberships
GROUP BY status
ORDER BY status;

-- Show functions that were removed
SELECT 
    'REMOVED FUNCTIONS CHECK' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_active_memberships_deterministic')
        THEN 'get_user_active_memberships_deterministic STILL EXISTS'
        ELSE 'get_user_active_memberships_deterministic REMOVED'
    END as function_1,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'user_has_qr_access')
        THEN 'user_has_qr_access STILL EXISTS'
        ELSE 'user_has_qr_access REMOVED'
    END as function_2,
    CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'manual_expire_overdue_memberships')
        THEN 'manual_expire_overdue_memberships STILL EXISTS'
        ELSE 'manual_expire_overdue_memberships REMOVED'
    END as function_3;

-- ========================================
-- FINAL ROLLBACK MESSAGE
-- ========================================

SELECT 
    '⚠️  ROLLBACK COMPLETED ⚠️' as final_message,
    'Membership expiration fix has been rolled back' as result,
    'System restored to previous state' as status,
    'You may need to manually manage expiration again' as warning;
