-- ROLLBACK FREE GYM 3-MONTHS PACKAGE
-- Safe rollback script to remove 3-month duration option from Free Gym package
-- Version: 1.0.0
-- Created: 2025-01-27
-- Use this script to rollback the 3-months package addition

-- =============================================
-- ROLLBACK: REMOVE 3-MONTHS DURATION FROM FREE GYM
-- =============================================

-- Start transaction for safety
BEGIN;

-- Step 1: Verify 3-months duration exists before deletion
SELECT 'Step 1: Checking if 3-months duration exists...' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3 Μήνες';

-- Step 2: Check for any active memberships using 3-months duration
SELECT 'Step 2: Checking for active memberships using 3-months duration...' as step;

SELECT 
    COUNT(*) as active_3months_memberships
FROM memberships m
JOIN membership_package_durations mpd ON m.package_id = mpd.package_id
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3 Μήνες'
AND m.is_active = true
AND m.end_date >= CURRENT_DATE;

-- Step 3: Check for pending requests using 3-months duration
SELECT 'Step 3: Checking for pending requests using 3-months duration...' as step;

SELECT 
    COUNT(*) as pending_3months_requests
FROM membership_requests mr
JOIN membership_package_durations mpd ON mr.package_id = mpd.package_id
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3 Μήνες'
AND mr.status = 'pending';

-- Step 4: Show warning if there are active memberships or pending requests
DO $$
DECLARE
    active_count INTEGER;
    pending_count INTEGER;
BEGIN
    -- Count active memberships
    SELECT COUNT(*) INTO active_count
    FROM memberships m
    JOIN membership_package_durations mpd ON m.package_id = mpd.package_id
    JOIN membership_packages mp ON mpd.package_id = mp.id
    WHERE mp.name = 'Free Gym' 
    AND mpd.duration_type = '3 Μήνες'
    AND m.is_active = true
    AND m.end_date >= CURRENT_DATE;
    
    -- Count pending requests
    SELECT COUNT(*) INTO pending_count
    FROM membership_requests mr
    JOIN membership_package_durations mpd ON mr.package_id = mpd.package_id
    JOIN membership_packages mp ON mpd.package_id = mp.id
    WHERE mp.name = 'Free Gym' 
    AND mpd.duration_type = '3 Μήνες'
    AND mr.status = 'pending';
    
    IF active_count > 0 OR pending_count > 0 THEN
        RAISE WARNING 'WARNING: Found % active memberships and % pending requests using 3-months duration. Consider handling these before rollback.', active_count, pending_count;
    ELSE
        RAISE NOTICE 'No active memberships or pending requests found. Safe to proceed with rollback.';
    END IF;
END $$;

-- Step 5: Remove 3-months duration option
SELECT 'Step 5: Removing 3-months duration option...' as step;

DELETE FROM membership_package_durations 
WHERE package_id IN (SELECT id FROM membership_packages WHERE name = 'Free Gym')
AND duration_type = '3 Μήνες';

-- Step 6: Verify removal
SELECT 'Step 6: Verifying 3-months duration was removed...' as step;

SELECT 
    COUNT(*) as remaining_3months_durations
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3 Μήνες';

-- Step 7: Show remaining Free Gym duration options
SELECT 'Step 7: Remaining Free Gym duration options:' as step;

SELECT 
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.is_active = true
ORDER BY mpd.duration_days;

-- Step 8: Success message
SELECT 'SUCCESS: 3-months duration removed from Free Gym package!' as result;
SELECT 'Free Gym package restored to original state.' as status;

-- Commit transaction
COMMIT;
