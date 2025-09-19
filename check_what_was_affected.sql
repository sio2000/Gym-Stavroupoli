-- CHECK WHAT WAS AFFECTED BY THE 30-DAY FIX
-- Verify which packages were changed and which remained untouched

-- ========================================
-- PHASE 1: CHECK ALL PACKAGES CURRENT STATUS
-- ========================================

SELECT 'PHASE 1: Checking all packages current status...' as phase;

-- Check ALL membership packages
SELECT 'ALL PACKAGES - Current status:' as info;
SELECT 
    name,
    package_type,
    duration_days,
    price,
    CASE 
        WHEN duration_days = 30 THEN '🔄 CHANGED TO 30 DAYS'
        WHEN duration_days = 365 THEN '⚠️ STILL 365 DAYS'
        ELSE '📝 OTHER: ' || duration_days || ' days'
    END as change_status,
    is_active
FROM membership_packages
ORDER BY 
    CASE 
        WHEN name = 'Personal Training' THEN 1
        WHEN name ILIKE '%Free Gym%' THEN 2
        WHEN name = 'Pilates' THEN 3
        WHEN name = 'Ultimate' THEN 4
        ELSE 5
    END,
    name;

-- ========================================
-- PHASE 2: CHECK PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Checking package durations...' as phase;

-- Check ALL package durations
SELECT 'ALL PACKAGE DURATIONS - Current status:' as info;
SELECT 
    mp.name as package_name,
    mp.package_type,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    CASE 
        WHEN mpd.duration_days = 30 THEN '🔄 CHANGED TO 30 DAYS'
        WHEN mpd.duration_days = 365 THEN '⚠️ STILL 365 DAYS'
        ELSE '📝 OTHER: ' || mpd.duration_days || ' days'
    END as change_status,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
ORDER BY 
    CASE 
        WHEN mp.name = 'Personal Training' THEN 1
        WHEN mp.name ILIKE '%Free Gym%' THEN 2
        WHEN mp.name = 'Pilates' THEN 3
        WHEN mp.name = 'Ultimate' THEN 4
        ELSE 5
    END,
    mp.name,
    mpd.duration_days;

-- ========================================
-- PHASE 3: ANALYZE WHAT SHOULD/SHOULDN'T CHANGE
-- ========================================

SELECT 'PHASE 3: Analyzing what should and shouldn''t change...' as phase;

-- Categorize packages by what should happen to them
SELECT 'PACKAGE CHANGE ANALYSIS:' as analysis;
SELECT 
    mp.name,
    mp.package_type,
    mp.duration_days,
    CASE 
        WHEN mp.name = 'Personal Training' THEN '✅ SHOULD BE 30 DAYS (Personal Training)'
        WHEN mp.name ILIKE '%Free Gym%' THEN '⚠️ SHOULD STAY 365 DAYS (Gym Access)'
        WHEN mp.name = 'Pilates' THEN '⚠️ SHOULD STAY 365 DAYS (Pilates Classes)'
        WHEN mp.name = 'Ultimate' THEN '⚠️ SHOULD STAY 365 DAYS (Ultimate Package)'
        ELSE '📝 OTHER PACKAGE'
    END as should_be_status,
    CASE 
        WHEN mp.name = 'Personal Training' AND mp.duration_days = 30 THEN '✅ CORRECT'
        WHEN mp.name = 'Personal Training' AND mp.duration_days != 30 THEN '❌ WRONG'
        WHEN mp.name != 'Personal Training' AND mp.duration_days = 365 THEN '✅ CORRECT'
        WHEN mp.name != 'Personal Training' AND mp.duration_days = 30 THEN '❌ ACCIDENTALLY CHANGED'
        ELSE '📝 REVIEW NEEDED'
    END as actual_status
FROM membership_packages mp
ORDER BY mp.name;

-- ========================================
-- PHASE 4: CHECK FOR ACCIDENTAL CHANGES
-- ========================================

SELECT 'PHASE 4: Checking for accidental changes...' as phase;

-- Check if Free Gym or Pilates were accidentally changed
SELECT 'ACCIDENTAL CHANGES CHECK:' as check_title;
SELECT 
    mp.name,
    mp.package_type,
    mp.duration_days,
    CASE 
        WHEN mp.name ILIKE '%Free Gym%' AND mp.duration_days = 30 THEN 
            '❌ ACCIDENTALLY CHANGED: Free Gym should be 365 days (1 year gym access)'
        WHEN mp.name = 'Pilates' AND mp.duration_days = 30 THEN 
            '❌ ACCIDENTALLY CHANGED: Pilates should be 365 days (yearly classes)'
        WHEN mp.name = 'Ultimate' AND mp.duration_days = 30 THEN 
            '❌ ACCIDENTALLY CHANGED: Ultimate should be 365 days (yearly package)'
        WHEN mp.name = 'Personal Training' AND mp.duration_days = 30 THEN
            '✅ CORRECTLY CHANGED: Personal Training should be 30 days'
        WHEN mp.name = 'Personal Training' AND mp.duration_days != 30 THEN
            '❌ NOT CHANGED: Personal Training should be 30 days'
        ELSE
            '✅ UNCHANGED: ' || mp.name || ' correctly kept at ' || mp.duration_days || ' days'
    END as change_analysis
FROM membership_packages mp
WHERE mp.name IN ('Personal Training', 'Free Gym', 'Pilates', 'Ultimate')
   OR mp.name ILIKE '%Free Gym%'
   OR mp.name ILIKE '%Pilates%'
ORDER BY mp.name;

-- ========================================
-- PHASE 5: ROLLBACK ACCIDENTAL CHANGES
-- ========================================

SELECT 'PHASE 5: Rolling back any accidental changes...' as phase;

-- Rollback Free Gym to 365 days if accidentally changed
UPDATE membership_packages 
SET 
    duration_days = 365,
    description = REPLACE(REPLACE(description, '1 month', '1 year'), '30 days', '365 days'),
    updated_at = NOW()
WHERE (name ILIKE '%Free Gym%' OR package_type = 'gym' OR package_type = 'free_gym')
  AND duration_days = 30;

-- Rollback Pilates to 365 days if accidentally changed  
UPDATE membership_packages 
SET 
    duration_days = 365,
    description = REPLACE(REPLACE(description, '1 month', '1 year'), '30 days', '365 days'),
    updated_at = NOW()
WHERE (name = 'Pilates' OR package_type = 'pilates')
  AND duration_days = 30;

-- Rollback Ultimate to 365 days if accidentally changed
UPDATE membership_packages 
SET 
    duration_days = 365,
    description = REPLACE(REPLACE(description, '1 month', '1 year'), '30 days', '365 days'),
    updated_at = NOW()
WHERE (name = 'Ultimate' OR package_type = 'ultimate')
  AND duration_days = 30;

-- Log rollback actions
SELECT 'ROLLBACK ACTIONS:' as info;
SELECT 
    name,
    package_type,
    duration_days,
    'Rolled back to 365 days' as action
FROM membership_packages
WHERE updated_at > NOW() - INTERVAL '1 minute'
  AND duration_days = 365
  AND name != 'Personal Training';

-- ========================================
-- PHASE 6: ROLLBACK PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 6: Rolling back package durations...' as phase;

-- Rollback package durations for non-Personal Training packages
UPDATE membership_package_durations mpd
SET 
    duration_days = 365,
    updated_at = NOW()
FROM membership_packages mp
WHERE mpd.package_id = mp.id
  AND mp.name != 'Personal Training'
  AND mp.package_type != 'personal'
  AND mpd.duration_days = 30;

-- Log package duration rollbacks
SELECT 'PACKAGE DURATION ROLLBACKS:' as info;
SELECT 
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    'Rolled back to 365 days' as action
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mpd.updated_at > NOW() - INTERVAL '1 minute'
  AND mpd.duration_days = 365
  AND mp.name != 'Personal Training';

-- ========================================
-- PHASE 7: FINAL VERIFICATION
-- ========================================

SELECT 'PHASE 7: Final verification of correct state...' as phase;

-- Verify final state is correct
SELECT 'FINAL STATE VERIFICATION:' as verification;
SELECT 
    mp.name,
    mp.package_type,
    mp.duration_days,
    CASE 
        WHEN mp.name = 'Personal Training' AND mp.duration_days = 30 THEN 
            '✅ CORRECT: Personal Training = 30 days'
        WHEN mp.name != 'Personal Training' AND mp.duration_days = 365 THEN 
            '✅ CORRECT: ' || mp.name || ' = 365 days (unchanged)'
        WHEN mp.name = 'Personal Training' AND mp.duration_days != 30 THEN 
            '❌ ERROR: Personal Training should be 30 days'
        WHEN mp.name != 'Personal Training' AND mp.duration_days = 30 THEN 
            '❌ ERROR: ' || mp.name || ' should be 365 days'
        ELSE 
            '📝 REVIEW: ' || mp.name || ' = ' || mp.duration_days || ' days'
    END as final_status
FROM membership_packages mp
ORDER BY 
    CASE 
        WHEN mp.name = 'Personal Training' THEN 1
        WHEN mp.name ILIKE '%Free Gym%' THEN 2
        WHEN mp.name = 'Pilates' THEN 3
        WHEN mp.name = 'Ultimate' THEN 4
        ELSE 5
    END;

SELECT 'IMPACT ANALYSIS COMPLETED!' as completion_status;
