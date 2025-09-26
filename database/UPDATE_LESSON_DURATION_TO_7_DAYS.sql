-- Migration: Update Free Gym and Pilates first options duration from 1 day to 7 days
-- Date: 2025-09-22
-- Description: Changes the duration of the first option (Lesson 1 day 6.00€) for both Free Gym and Pilates packages from 1 day to 7 days

-- =============================================
-- 1. BACKUP CURRENT STATE
-- =============================================
-- Create backup of current durations before making changes
CREATE TEMP TABLE IF NOT EXISTS duration_backup AS
SELECT 
    mp.name as package_name,
    mpd.id,
    mpd.duration_type,
    mpd.duration_days as old_duration_days,
    mpd.price,
    mpd.updated_at as old_updated_at
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE (mp.name = 'Free Gym' AND mpd.duration_type = 'lesson' AND mpd.price = 6.00)
   OR (mp.name = 'Pilates' AND mpd.duration_type = 'pilates_trial' AND mpd.price = 6.00);

-- =============================================
-- 2. UPDATE FREE GYM LESSON OPTION
-- =============================================
UPDATE membership_package_durations 
SET 
    duration_days = 7,
    updated_at = NOW()
WHERE package_id = (
    SELECT id FROM membership_packages WHERE name = 'Free Gym'
) 
AND duration_type = 'lesson' 
AND price = 6.00
AND duration_days = 1;

-- =============================================
-- 3. UPDATE PILATES TRIAL OPTION
-- =============================================
UPDATE membership_package_durations 
SET 
    duration_days = 7,
    updated_at = NOW()
WHERE package_id = (
    SELECT id FROM membership_packages WHERE name = 'Pilates'
) 
AND duration_type = 'pilates_trial' 
AND price = 6.00
AND duration_days = 1;

-- =============================================
-- 4. VERIFY CHANGES
-- =============================================
SELECT 'VERIFICATION - Free Gym Lesson Option:' as info;
SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.updated_at
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = 'lesson'
AND mpd.price = 6.00;

SELECT 'VERIFICATION - Pilates Trial Option:' as info;
SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.updated_at
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates' 
AND mpd.duration_type = 'pilates_trial'
AND mpd.price = 6.00;

-- =============================================
-- 5. SHOW BACKUP FOR ROLLBACK REFERENCE
-- =============================================
SELECT 'BACKUP DATA (for rollback):' as info;
SELECT * FROM duration_backup;

-- =============================================
-- 6. ROLLBACK SCRIPT (COMMENTED OUT)
-- =============================================
/*
-- To rollback, execute this script:
UPDATE membership_package_durations 
SET 
    duration_days = 1,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM duration_backup WHERE package_name = 'Free Gym'
);

UPDATE membership_package_durations 
SET 
    duration_days = 1,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM duration_backup WHERE package_name = 'Pilates'
);
*/
