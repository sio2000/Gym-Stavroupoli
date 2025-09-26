-- FINAL MEMBERSHIP FIELD SYNCHRONIZATION
-- Date: 2025-09-22
-- 
-- OBJECTIVE: Synchronize status and is_active fields to ensure consistency
-- ROOT CAUSE: 18 memberships have expired by date but still show is_active=true and status='active'
-- SOLUTION: Fix expired memberships and synchronize all fields

-- =============================================
-- 1. ANALYSIS - SHOW CURRENT STATE
-- =============================================

SELECT 'ANALYSIS - Current membership field inconsistencies:' as info;

-- Show problematic records
SELECT 
    'Problematic records (expired by date but active status):' as description,
    COUNT(*) as count
FROM memberships
WHERE (status = 'active' AND end_date < CURRENT_DATE)
   OR (is_active = true AND end_date < CURRENT_DATE);

-- Show sample problematic records
SELECT 'SAMPLE PROBLEMATIC RECORDS:' as info;
SELECT 
    id,
    status,
    is_active,
    end_date,
    CASE 
        WHEN end_date < CURRENT_DATE THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as actual_expiration_status
FROM memberships
WHERE (status = 'active' AND end_date < CURRENT_DATE)
   OR (is_active = true AND end_date < CURRENT_DATE)
ORDER BY end_date
LIMIT 10;

-- =============================================
-- 2. BACKUP PROBLEMATIC RECORDS
-- =============================================

-- Create backup table with problematic records
CREATE TEMP TABLE IF NOT EXISTS problematic_memberships_backup AS
SELECT 
    m.*,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        ELSE 'ACTIVE'
    END as actual_status
FROM memberships m
WHERE (m.status = 'active' AND m.end_date < CURRENT_DATE)
   OR (m.is_active = true AND m.end_date < CURRENT_DATE);

SELECT 'BACKUP CREATED - Problematic records:' as info;
SELECT COUNT(*) as backup_count FROM problematic_memberships_backup;

-- =============================================
-- 3. MAIN SYNCHRONIZATION
-- =============================================

BEGIN;

-- Step 1: Fix all expired memberships
SELECT 'STEP 1: Fixing expired memberships...' as info;

UPDATE memberships 
SET 
    is_active = false,
    status = 'expired',
    updated_at = NOW()
WHERE end_date < CURRENT_DATE 
AND (is_active = true OR status = 'active');

-- Step 2: Ensure all active memberships have consistent status
SELECT 'STEP 2: Ensuring consistent active memberships...' as info;

UPDATE memberships 
SET 
    status = 'active',
    updated_at = NOW()
WHERE end_date >= CURRENT_DATE 
AND is_active = true 
AND status != 'active';

-- Step 3: Ensure all expired memberships have consistent status
SELECT 'STEP 3: Ensuring consistent expired memberships...' as info;

UPDATE memberships 
SET 
    status = 'expired',
    is_active = false,
    updated_at = NOW()
WHERE end_date < CURRENT_DATE 
AND (status != 'expired' OR is_active = true);

-- =============================================
-- 4. VERIFICATION
-- =============================================

-- Verify the fix
SELECT 'VERIFICATION - After synchronization:' as info;

-- Count scenarios after fix
SELECT 
    'Total memberships' as scenario,
    COUNT(*) as count
FROM memberships
UNION ALL
SELECT 
    'status=active AND is_active=true' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'active' AND is_active = true
UNION ALL
SELECT 
    'status=expired AND is_active=false' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'expired' AND is_active = false
UNION ALL
SELECT 
    'Expired by date but status=active' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'active' AND end_date < CURRENT_DATE
UNION ALL
SELECT 
    'Expired by date but is_active=true' as scenario,
    COUNT(*) as count
FROM memberships
WHERE is_active = true AND end_date < CURRENT_DATE
UNION ALL
SELECT 
    'Active by date but status=expired' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'expired' AND end_date >= CURRENT_DATE
UNION ALL
SELECT 
    'Active by date but is_active=false' as scenario,
    COUNT(*) as count
FROM memberships
WHERE is_active = false AND end_date >= CURRENT_DATE;

-- Check for remaining inconsistencies
SELECT 'REMAINING INCONSISTENCIES (should be 0):' as info;
SELECT COUNT(*) as remaining_inconsistencies
FROM memberships
WHERE (status = 'active' AND end_date < CURRENT_DATE)
   OR (is_active = true AND end_date < CURRENT_DATE)
   OR (status = 'expired' AND end_date >= CURRENT_DATE)
   OR (is_active = false AND end_date >= CURRENT_DATE);

-- =============================================
-- 5. CREATE AUTOMATIC CLEANUP FUNCTION
-- =============================================

-- Create function to automatically synchronize fields
CREATE OR REPLACE FUNCTION synchronize_membership_fields()
RETURNS INTEGER AS $$
DECLARE
    total_updated INTEGER := 0;
    expired_count INTEGER;
BEGIN
    -- Fix expired memberships
    UPDATE memberships 
    SET 
        is_active = false,
        status = 'expired',
        updated_at = NOW()
    WHERE end_date < CURRENT_DATE 
    AND (is_active = true OR status = 'active');
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    total_updated := total_updated + expired_count;
    
    -- Fix active memberships
    UPDATE memberships 
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE end_date >= CURRENT_DATE 
    AND is_active = true 
    AND status != 'active';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    total_updated := total_updated + expired_count;
    
    RETURN total_updated;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'TESTING CLEANUP FUNCTION:' as info;
SELECT synchronize_membership_fields() as total_updated;

-- =============================================
-- 6. CREATE SYSTEM_LOGS TABLE IF NOT EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. FINAL VERIFICATION
-- =============================================

-- Final check - all fields should now be consistent
SELECT 'FINAL VERIFICATION - Consistency check:' as info;

SELECT 
    CASE 
        WHEN status = 'active' AND is_active = true AND end_date >= CURRENT_DATE THEN 'CONSISTENT_ACTIVE'
        WHEN status = 'expired' AND is_active = false THEN 'CONSISTENT_EXPIRED'
        WHEN status = 'active' AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_STATUS_EXPIRED_DATE'
        WHEN is_active = true AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_FLAG_EXPIRED_DATE'
        WHEN status = 'expired' AND end_date >= CURRENT_DATE THEN 'INCONSISTENT_EXPIRED_STATUS_ACTIVE_DATE'
        WHEN is_active = false AND end_date >= CURRENT_DATE THEN 'INCONSISTENT_INACTIVE_FLAG_ACTIVE_DATE'
        ELSE 'OTHER'
    END as consistency_status,
    COUNT(*) as count
FROM memberships
GROUP BY 
    CASE 
        WHEN status = 'active' AND is_active = true AND end_date >= CURRENT_DATE THEN 'CONSISTENT_ACTIVE'
        WHEN status = 'expired' AND is_active = false THEN 'CONSISTENT_EXPIRED'
        WHEN status = 'active' AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_STATUS_EXPIRED_DATE'
        WHEN is_active = true AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_FLAG_EXPIRED_DATE'
        WHEN status = 'expired' AND end_date >= CURRENT_DATE THEN 'INCONSISTENT_EXPIRED_STATUS_ACTIVE_DATE'
        WHEN is_active = false AND end_date >= CURRENT_DATE THEN 'INCONSISTENT_INACTIVE_FLAG_ACTIVE_DATE'
        ELSE 'OTHER'
    END
ORDER BY count DESC;

-- COMMIT; -- Uncomment to commit the changes
-- ROLLBACK; -- Uncomment to rollback the changes

-- =============================================
-- 8. ROLLBACK SCRIPT (COMMENTED OUT)
-- =============================================

/*
-- To rollback the changes, execute:

-- Restore problematic memberships from backup
UPDATE memberships 
SET 
    status = p.status,
    is_active = p.is_active,
    updated_at = NOW()
FROM problematic_memberships_backup p
WHERE memberships.id = p.id;

-- Drop the cleanup function
DROP FUNCTION IF EXISTS synchronize_membership_fields();
*/
