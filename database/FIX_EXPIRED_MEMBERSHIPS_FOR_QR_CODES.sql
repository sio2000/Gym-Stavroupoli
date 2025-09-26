-- FIX EXPIRED MEMBERSHIPS FOR QR CODES
-- This script fixes the issue where memberships have is_active=true but expired end_date
-- Date: 2025-09-22
-- 
-- Problem: 18 memberships were found with is_active=true but end_date < current_date
-- This causes QR code generation to show options for expired subscriptions

-- =============================================
-- 1. ANALYSIS - SHOW CURRENT STATE
-- =============================================

SELECT 'ANALYSIS - Current problematic memberships:' as info;

SELECT 
    m.id,
    m.user_id,
    m.is_active,
    m.end_date,
    m.start_date,
    mp.name as package_name,
    mp.package_type,
    up.email,
    up.first_name,
    up.last_name
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN user_profiles up ON m.user_id = up.user_id
WHERE m.is_active = true 
  AND m.end_date < CURRENT_DATE
ORDER BY m.end_date DESC, up.email;

-- =============================================
-- 2. BACKUP EXPIRED MEMBERSHIPS
-- =============================================

-- Create backup table with expired memberships
CREATE TEMP TABLE IF NOT EXISTS expired_memberships_backup AS
SELECT 
    m.*,
    mp.name as package_name,
    mp.package_type,
    up.email,
    up.first_name,
    up.last_name
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN user_profiles up ON m.user_id = up.user_id
WHERE m.is_active = true 
  AND m.end_date < CURRENT_DATE;

SELECT 'BACKUP CREATED - Expired memberships to be fixed:' as info;
SELECT COUNT(*) as backup_count FROM expired_memberships_backup;

-- Show backup details
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    package_name,
    package_type,
    is_active,
    end_date
FROM expired_memberships_backup
ORDER BY end_date DESC, email;

-- =============================================
-- 3. FIX EXPIRED MEMBERSHIPS
-- =============================================

BEGIN;

-- Update expired memberships to set is_active = false
UPDATE memberships 
SET 
    is_active = false,
    updated_at = NOW()
WHERE is_active = true 
  AND end_date < CURRENT_DATE;

-- Verify the fix
SELECT 'VERIFICATION - Memberships after fix:' as info;

SELECT 
    COUNT(*) as total_memberships,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_memberships,
    SUM(CASE WHEN is_active = false AND end_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired_inactive_memberships,
    SUM(CASE WHEN is_active = true AND end_date < CURRENT_DATE THEN 1 ELSE 0 END) as problematic_memberships
FROM memberships;

-- Show remaining problematic memberships (should be 0)
SELECT 'REMAINING PROBLEMATIC MEMBERSHIPS (should be 0):' as info;
SELECT COUNT(*) as remaining_problematic 
FROM memberships 
WHERE is_active = true AND end_date < CURRENT_DATE;

-- =============================================
-- 4. CREATE AUTOMATIC CLEANUP FUNCTION
-- =============================================

-- Create a function to automatically deactivate expired memberships
CREATE OR REPLACE FUNCTION deactivate_expired_memberships()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
      AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO system_logs (
        action,
        details,
        created_at
    ) VALUES (
        'deactivate_expired_memberships',
        'Deactivated ' || updated_count || ' expired memberships',
        NOW()
    );
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. CREATE SYSTEM_LOGS TABLE IF NOT EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. TEST THE CLEANUP FUNCTION
-- =============================================

-- Test the function (should return 0 since we already fixed the issue)
SELECT 'TESTING CLEANUP FUNCTION:' as info;
SELECT deactivate_expired_memberships() as deactivated_count;

-- =============================================
-- 7. CREATE SCHEDULED CLEANUP (OPTIONAL)
-- =============================================

-- Note: For production, you might want to set up a cron job or scheduled task
-- to run this function daily. For Supabase, you can use pg_cron extension
-- or create a scheduled function.

-- Example of how to set up a daily cleanup (requires pg_cron extension):
-- SELECT cron.schedule('deactivate-expired-memberships', '0 2 * * *', 'SELECT deactivate_expired_memberships();');

-- =============================================
-- 8. VERIFICATION QUERIES
-- =============================================

-- Check that QR code logic will now work correctly
SELECT 'QR CODE LOGIC VERIFICATION:' as info;

-- This query should now return only truly active memberships
SELECT 
    COUNT(*) as truly_active_memberships
FROM memberships 
WHERE is_active = true 
  AND end_date >= CURRENT_DATE;

-- Show sample of active memberships for QR codes
SELECT 
    m.id,
    up.email,
    mp.name as package_name,
    mp.package_type,
    m.end_date
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN user_profiles up ON m.user_id = up.user_id
WHERE m.is_active = true 
  AND m.end_date >= CURRENT_DATE
ORDER BY m.end_date ASC
LIMIT 10;

-- COMMIT; -- Uncomment to commit the changes
-- ROLLBACK; -- Uncomment to rollback the changes

-- =============================================
-- 9. ROLLBACK SCRIPT (COMMENTED OUT)
-- =============================================

/*
-- To rollback the changes, execute:

UPDATE memberships 
SET 
    is_active = true,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM expired_memberships_backup
);

-- And drop the cleanup function:
DROP FUNCTION IF EXISTS deactivate_expired_memberships();
*/
