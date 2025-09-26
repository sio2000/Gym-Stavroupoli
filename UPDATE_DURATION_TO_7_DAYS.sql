-- Update Free Gym and Pilates first options duration from 1 day to 7 days
-- This script updates only the specific entries mentioned in the request

-- Update Free Gym lesson option (duration_type = 'lesson', price = 6.00)
UPDATE membership_package_durations 
SET duration_days = 7,
    updated_at = NOW()
WHERE package_id = (
    SELECT id FROM membership_packages WHERE name = 'Free Gym'
) 
AND duration_type = 'lesson' 
AND price = 6.00
AND duration_days = 1;

-- Update Pilates trial option (duration_type = 'pilates_trial', price = 6.00)
UPDATE membership_package_durations 
SET duration_days = 7,
    updated_at = NOW()
WHERE package_id = (
    SELECT id FROM membership_packages WHERE name = 'Pilates'
) 
AND duration_type = 'pilates_trial' 
AND price = 6.00
AND duration_days = 1;

-- Verify the changes
SELECT 'FREE GYM - Lesson Option After Update:' as info;
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

SELECT 'PILATES - Trial Option After Update:' as info;
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
