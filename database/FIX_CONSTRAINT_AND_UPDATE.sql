-- FIX CONSTRAINT AND UPDATE - Διόρθωση constraint και ενημέρωση records
-- Εκτέλεση στο Supabase SQL Editor

-- Step 1: Διαγραφή constraint προσωρινά
SELECT 'Step 1: Temporarily dropping constraints...' as step;

ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

ALTER TABLE memberships 
DROP CONSTRAINT IF EXISTS memberships_duration_type_check;

-- Step 2: Ενημέρωση υπαρχόντων records
SELECT 'Step 2: Updating existing records...' as step;

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

-- Step 3: Επαναδημιουργία constraints με ελληνικά duration_type
SELECT 'Step 3: Recreating constraints with Greek duration types...' as step;

-- Constraint για membership_package_durations
ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- Greek version
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

-- Constraint για membership_requests
ALTER TABLE membership_requests 
ADD CONSTRAINT membership_requests_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- Greek version
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

-- Constraint για memberships
ALTER TABLE memberships 
ADD CONSTRAINT memberships_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- Greek version
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

-- Step 4: Επαλήθευση
SELECT 'Step 4: Verification...' as step;

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

-- Εμφάνιση ενημερωμένων Free Gym duration options
SELECT 'Updated Free Gym duration options:' as info;

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

SELECT 'Migration completed successfully! 🎉' as final_status;
