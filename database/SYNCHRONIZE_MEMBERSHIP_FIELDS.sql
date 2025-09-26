-- SYNCHRONIZE MEMBERSHIP FIELDS - Τελική συγχρονισμός status και is_active
-- Date: 2025-09-22
-- 
-- OBJECTIVE: Synchronize status and is_active fields to ensure consistency
-- ROOT CAUSE: 18 memberships have expired by date but still show is_active=true and status='active'
-- SOLUTION: Fix expired memberships and synchronize all fields

-- =============================================
-- 1. ANALYSIS - SHOW CURRENT STATE
-- =============================================

SELECT 'ANALYSIS - Current membership field inconsistencies:' as info;

-- Count different scenarios
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
    'status=active but is_active=false' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'active' AND is_active = false
UNION ALL
SELECT 
    'status!=active but is_active=true' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status != 'active' AND is_active = true
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
WHERE is_active = true AND end_date < CURRENT_DATE;

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
    END as expiration_status
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
    END as actual_status,
    CASE 
        WHEN m.status = 'active' AND m.is_active = true THEN 'CONSISTENT_ACTIVE'
        WHEN m.status = 'active' AND m.is_active = false THEN 'INCONSISTENT_STATUS_TRUE_FLAG_FALSE'
        WHEN m.status != 'active' AND m.is_active = true THEN 'INCONSISTENT_STATUS_FALSE_FLAG_TRUE'
        WHEN m.status != 'active' AND m.is_active = false THEN 'CONSISTENT_INACTIVE'
        ELSE 'UNKNOWN'
    END as consistency_status
FROM memberships m
WHERE (m.status = 'active' AND m.end_date < CURRENT_DATE)
   OR (m.is_active = true AND m.end_date < CURRENT_DATE)
   OR (m.status = 'active' AND m.is_active = false)
   OR (m.status != 'active' AND m.is_active = true);

SELECT 'BACKUP CREATED - Problematic records:' as info;
SELECT COUNT(*) as backup_count FROM problematic_memberships_backup;

-- Show backup summary
SELECT 
    actual_status,
    consistency_status,
    COUNT(*) as count
FROM problematic_memberships_backup
GROUP BY actual_status, consistency_status
ORDER BY actual_status, consistency_status;

-- =============================================
-- 3. FIX EXPIRED MEMBERSHIPS
-- =============================================

BEGIN;

-- Step 1: Fix memberships that are expired by date
SELECT 'STEP 1: Fixing expired memberships...' as info;

UPDATE memberships 
SET 
    is_active = false,
    status = 'expired',
    updated_at = NOW()
WHERE end_date < CURRENT_DATE 
AND (is_active = true OR status = 'active');

-- Get count of fixed records
SELECT 'Expired memberships fixed - checking count...' as info;

-- =============================================
-- 4. SYNCHRONIZE ALL FIELDS
-- =============================================

-- Step 2: Synchronize status field with is_active field
SELECT 'STEP 2: Synchronizing status field with is_active...' as info;

UPDATE memberships 
SET 
    status = CASE 
        WHEN is_active = true AND end_date >= CURRENT_DATE THEN 'active'
        WHEN is_active = false OR end_date < CURRENT_DATE THEN 'expired'
        ELSE status
    END,
    updated_at = NOW()
WHERE status != CASE 
    WHEN is_active = true AND end_date >= CURRENT_DATE THEN 'active'
    WHEN is_active = false OR end_date < CURRENT_DATE THEN 'expired'
    ELSE status
END;

-- Get count of synchronized records
SELECT 'Records synchronized - checking count...' as info;

-- Step 3: Synchronize is_active field with status field (for any remaining inconsistencies)
SELECT 'STEP 3: Synchronizing is_active field with status...' as info;

UPDATE memberships 
SET 
    is_active = CASE 
        WHEN status = 'active' AND end_date >= CURRENT_DATE THEN true
        WHEN status = 'expired' OR end_date < CURRENT_DATE THEN false
        ELSE is_active
    END,
    updated_at = NOW()
WHERE is_active != CASE 
    WHEN status = 'active' AND end_date >= CURRENT_DATE THEN true
    WHEN status = 'expired' OR end_date < CURRENT_DATE THEN false
    ELSE is_active
END;

-- Get count of final synchronized records
SELECT 'Final synchronized records - checking count...' as info;

-- =============================================
-- 5. VERIFICATION
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
    'status=active but is_active=false' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status = 'active' AND is_active = false
UNION ALL
SELECT 
    'status!=active but is_active=true' as scenario,
    COUNT(*) as count
FROM memberships
WHERE status != 'active' AND is_active = true
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
WHERE is_active = true AND end_date < CURRENT_DATE;

-- Check for remaining inconsistencies
SELECT 'REMAINING INCONSISTENCIES (should be 0):' as info;
SELECT COUNT(*) as remaining_inconsistencies
FROM memberships
WHERE (status = 'active' AND is_active = false)
   OR (status != 'active' AND is_active = true)
   OR (status = 'active' AND end_date < CURRENT_DATE)
   OR (is_active = true AND end_date < CURRENT_DATE);

-- =============================================
-- 6. CREATE AUTOMATIC CLEANUP FUNCTION
-- =============================================

-- Create function to automatically synchronize fields
CREATE OR REPLACE FUNCTION synchronize_membership_fields()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
    synchronized_count INTEGER;
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
    
    -- Synchronize remaining inconsistencies
    UPDATE memberships 
    SET 
        status = CASE 
            WHEN is_active = true AND end_date >= CURRENT_DATE THEN 'active'
            WHEN is_active = false OR end_date < CURRENT_DATE THEN 'expired'
            ELSE status
        END,
        is_active = CASE 
            WHEN status = 'active' AND end_date >= CURRENT_DATE THEN true
            WHEN status = 'expired' OR end_date < CURRENT_DATE THEN false
            ELSE is_active
        END,
        updated_at = NOW()
    WHERE (status = 'active' AND is_active = false)
       OR (status != 'active' AND is_active = true);
    
    GET DIAGNOSTICS synchronized_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO system_logs (
        action,
        details,
        created_at
    ) VALUES (
        'synchronize_membership_fields',
        'Expired ' || expired_count || ' memberships, synchronized ' || synchronized_count || ' records',
        NOW()
    );
    
    RETURN expired_count + synchronized_count;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'TESTING CLEANUP FUNCTION:' as info;
SELECT synchronize_membership_fields() as total_updated;

-- =============================================
-- 7. CREATE SYSTEM_LOGS TABLE IF NOT EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. FINAL VERIFICATION
-- =============================================

-- Final check - all fields should now be consistent
SELECT 'FINAL VERIFICATION - All scenarios:' as info;

SELECT 
    CASE 
        WHEN status = 'active' AND is_active = true AND end_date >= CURRENT_DATE THEN 'CONSISTENT_ACTIVE'
        WHEN status = 'expired' AND is_active = false THEN 'CONSISTENT_EXPIRED'
        WHEN status = 'active' AND is_active = false THEN 'INCONSISTENT_ACTIVE_STATUS_FALSE_FLAG'
        WHEN status != 'active' AND is_active = true THEN 'INCONSISTENT_INACTIVE_STATUS_TRUE_FLAG'
        WHEN status = 'active' AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_STATUS_EXPIRED_DATE'
        WHEN is_active = true AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_FLAG_EXPIRED_DATE'
        ELSE 'OTHER'
    END as consistency_status,
    COUNT(*) as count
FROM memberships
GROUP BY 
    CASE 
        WHEN status = 'active' AND is_active = true AND end_date >= CURRENT_DATE THEN 'CONSISTENT_ACTIVE'
        WHEN status = 'expired' AND is_active = false THEN 'CONSISTENT_EXPIRED'
        WHEN status = 'active' AND is_active = false THEN 'INCONSISTENT_ACTIVE_STATUS_FALSE_FLAG'
        WHEN status != 'active' AND is_active = true THEN 'INCONSISTENT_INACTIVE_STATUS_TRUE_FLAG'
        WHEN status = 'active' AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_STATUS_EXPIRED_DATE'
        WHEN is_active = true AND end_date < CURRENT_DATE THEN 'INCONSISTENT_ACTIVE_FLAG_EXPIRED_DATE'
        ELSE 'OTHER'
    END
ORDER BY count DESC;

-- COMMIT; -- Uncomment to commit the changes
-- ROLLBACK; -- Uncomment to rollback the changes

-- =============================================
-- 9. ROLLBACK SCRIPT (COMMENTED OUT)
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
