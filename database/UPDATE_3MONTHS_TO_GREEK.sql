-- UPDATE 3MONTHS TO GREEK - Ενημέρωση duration_type από '3months' σε '3 Μήνες'
-- Εκτέλεση στο Supabase SQL Editor

-- Step 1: Ενημέρωση υπαρχόντων records ΠΡΙΝ από το constraint
SELECT 'Step 1: Updating existing records...' as step;

-- Ενημέρωση membership_package_durations
UPDATE membership_package_durations 
SET duration_type = '3 Μήνες'
WHERE duration_type = '3months';

-- Ενημέρωση membership_requests
UPDATE membership_requests 
SET duration_type = '3 Μήνες'
WHERE duration_type = '3months';

-- Ενημέρωση memberships
UPDATE memberships 
SET duration_type = '3 Μήνες'
WHERE duration_type = '3months';

-- Step 2: Ενημέρωση constraints μετά την ενημέρωση των records
SELECT 'Step 2: Updating constraints to support Greek duration types...' as step;

-- Διαγραφή και επαναδημιουργία constraints
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- UPDATED: Greek version
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Ενημέρωση constraints για membership_requests
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

ALTER TABLE membership_requests 
ADD CONSTRAINT membership_requests_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- UPDATED: Greek version
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Ενημέρωση constraints για memberships
ALTER TABLE memberships 
DROP CONSTRAINT IF EXISTS memberships_duration_type_check;

ALTER TABLE memberships 
ADD CONSTRAINT memberships_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- UPDATED: Greek version
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Step 3: Επαλήθευση ενημερώσεων
SELECT 'Step 3: Verifying updates...' as step;

-- Έλεγχος membership_package_durations
SELECT 
    'Updated membership_package_durations:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration_type = '3 Μήνες' THEN 1 END) as greek_records,
    COUNT(CASE WHEN duration_type = '3months' THEN 1 END) as old_records
FROM membership_package_durations;

-- Έλεγχος membership_requests
SELECT 
    'Updated membership_requests:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration_type = '3 Μήνες' THEN 1 END) as greek_records,
    COUNT(CASE WHEN duration_type = '3months' THEN 1 END) as old_records
FROM membership_requests;

-- Έλεγχος memberships
SELECT 
    'Updated memberships:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration_type = '3 Μήνες' THEN 1 END) as greek_records,
    COUNT(CASE WHEN duration_type = '3months' THEN 1 END) as old_records
FROM memberships;

-- Step 4: Εμφάνιση ενημερωμένων Free Gym duration options
SELECT 'Step 4: Updated Free Gym duration options:' as step;

SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active,
    CASE 
        WHEN mpd.duration_type = 'lesson' THEN 1
        WHEN mpd.duration_type = 'month' THEN 2
        WHEN mpd.duration_type = '3 Μήνες' THEN 3
        WHEN mpd.duration_type = 'semester' THEN 4
        WHEN mpd.duration_type = 'year' THEN 5
        ELSE 999
    END as sort_order
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
ORDER BY sort_order;

-- Step 5: Επαλήθευση ότι όλα λειτουργούν σωστά
SELECT 'Step 5: Final verification...' as step;

-- Έλεγχος ότι δεν υπάρχουν πλέον '3months' records
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No more 3months records found'
        ELSE '❌ ERROR: Still found 3months records'
    END as status
FROM (
    SELECT duration_type FROM membership_package_durations WHERE duration_type = '3months'
    UNION ALL
    SELECT duration_type FROM membership_requests WHERE duration_type = '3months'
    UNION ALL
    SELECT duration_type FROM memberships WHERE duration_type = '3months'
) as all_records;

-- Έλεγχος ότι υπάρχουν '3 Μήνες' records
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS: Found 3 Μήνες records'
        ELSE '❌ ERROR: No 3 Μήνες records found'
    END as status
FROM (
    SELECT duration_type FROM membership_package_durations WHERE duration_type = '3 Μήνες'
    UNION ALL
    SELECT duration_type FROM membership_requests WHERE duration_type = '3 Μήνες'
    UNION ALL
    SELECT duration_type FROM memberships WHERE duration_type = '3 Μήνες'
) as all_records;

SELECT 'Migration completed successfully! 🎉' as final_status;
