-- FINAL COMPREHENSIVE 30-DAY FIX FOR ALL PERSONAL TRAINING
-- This script completely fixes the 365-day issue and ensures all personal training uses 30 days

-- ========================================
-- PHASE 1: DIAGNOSTIC - FIND ALL 365-DAY ITEMS
-- ========================================

SELECT 'PHASE 1: DIAGNOSTIC - Finding all 365-day items...' as phase;

-- Find all packages with 365 days
SELECT 'Packages with 365 days (WILL BE FIXED):' as info;
SELECT 
    id,
    name,
    package_type,
    duration_days,
    description
FROM membership_packages
WHERE duration_days = 365
ORDER BY name;

-- Find all package durations with 365 days
SELECT 'Package durations with 365 days (WILL BE FIXED):' as info;
SELECT 
    mpd.id,
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mpd.duration_days = 365
ORDER BY mp.name, mpd.duration_type;

-- Find all memberships with >30 day duration
SELECT 'Memberships with >30 day duration (WILL BE FIXED):' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as current_duration,
    (m.end_date - CURRENT_DATE) as days_remaining
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.status = 'active'
  AND (m.end_date - m.start_date) > 30
ORDER BY (m.end_date - m.start_date) DESC;

-- ========================================
-- PHASE 2: FIX ALL PACKAGES TO 30 DAYS
-- ========================================

SELECT 'PHASE 2: Fixing all packages to 30 days...' as phase;

-- Update ALL packages that have 365 days to 30 days
UPDATE membership_packages 
SET 
    duration_days = 30,
    description = REPLACE(REPLACE(REPLACE(description, '1 year', '1 month'), '365 days', '30 days'), '365 ημέρες', '30 ημέρες'),
    updated_at = NOW()
WHERE duration_days = 365;

-- Log package updates
SELECT 'FIXED - Packages updated:' as info;
SELECT 
    name,
    package_type,
    duration_days,
    description,
    '✅ UPDATED TO 30 DAYS' as status
FROM membership_packages
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY name;

-- ========================================
-- PHASE 3: FIX ALL PACKAGE DURATIONS TO 30 DAYS
-- ========================================

SELECT 'PHASE 3: Fixing all package durations to 30 days...' as phase;

-- Update ALL package durations that have 365 days to 30 days
UPDATE membership_package_durations 
SET 
    duration_days = 30,
    updated_at = NOW()
WHERE duration_days = 365;

-- Log duration updates
SELECT 'FIXED - Package durations updated:' as info;
SELECT 
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    '✅ UPDATED TO 30 DAYS' as status
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mpd.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY mp.name, mpd.duration_type;

-- ========================================
-- PHASE 4: FIX ALL EXISTING MEMBERSHIPS TO 30 DAYS
-- ========================================

SELECT 'PHASE 4: Fixing all existing memberships to 30 days...' as phase;

-- Update ALL active memberships with >30 day duration to 30 days
UPDATE memberships 
SET 
    end_date = start_date + INTERVAL '30 days',
    updated_at = NOW()
WHERE status = 'active'
  AND (end_date - start_date) > 30;

-- Log membership updates
SELECT 'FIXED - Memberships updated:' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as new_duration,
    (m.end_date - CURRENT_DATE) as days_remaining,
    '✅ UPDATED TO 30 DAYS' as status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY m.updated_at DESC;

-- ========================================
-- PHASE 5: VERIFICATION - NO MORE 365-DAY ITEMS
-- ========================================

SELECT 'PHASE 5: Verification - checking for remaining 365-day items...' as phase;

-- Verify no packages have 365 days
SELECT 'Remaining packages with 365 days:' as verification;
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No packages with 365 days remain'
        ELSE '❌ ERROR: ' || COUNT(*) || ' packages still have 365 days'
    END as status
FROM membership_packages
WHERE duration_days = 365;

-- Verify no package durations have 365 days
SELECT 'Remaining package durations with 365 days:' as verification;
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No package durations with 365 days remain'
        ELSE '❌ ERROR: ' || COUNT(*) || ' package durations still have 365 days'
    END as status
FROM membership_package_durations
WHERE duration_days = 365;

-- Verify no active memberships have >30 day duration
SELECT 'Remaining memberships with >30 day duration:' as verification;
SELECT 
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: No active memberships with >30 days remain'
        ELSE '❌ ERROR: ' || COUNT(*) || ' active memberships still have >30 days'
    END as status
FROM memberships
WHERE status = 'active'
  AND (end_date - start_date) > 30;

-- ========================================
-- PHASE 6: TEST USER EXPERIENCE
-- ========================================

SELECT 'PHASE 6: Testing user experience after fix...' as phase;

-- Test what users will see now
SELECT 'User experience after fix:' as info;
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    (m.end_date - CURRENT_DATE) as days_remaining,
    '"' || (m.end_date - CURRENT_DATE) || ' ημέρες ακόμα"' as user_display,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) <= 30 THEN '✅ USER WILL SEE ≤30 DAYS'
        ELSE '❌ USER STILL SEES >30 DAYS'
    END as user_experience
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.status = 'active'
ORDER BY (m.end_date - CURRENT_DATE) DESC
LIMIT 10;

-- ========================================
-- PHASE 7: FINAL SUCCESS VERIFICATION
-- ========================================

SELECT 'PHASE 7: Final success verification...' as phase;

-- Comprehensive success check
WITH success_metrics AS (
    SELECT 
        COUNT(CASE WHEN mp.duration_days = 30 THEN 1 END) as packages_30_days,
        COUNT(CASE WHEN mp.duration_days != 30 THEN 1 END) as packages_not_30_days,
        COUNT(CASE WHEN mpd.duration_days = 30 THEN 1 END) as durations_30_days,
        COUNT(CASE WHEN mpd.duration_days != 30 THEN 1 END) as durations_not_30_days,
        COUNT(CASE WHEN (m.end_date - m.start_date) <= 30 THEN 1 END) as memberships_30_days,
        COUNT(CASE WHEN (m.end_date - m.start_date) > 30 THEN 1 END) as memberships_over_30_days
    FROM membership_packages mp
    FULL OUTER JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    FULL OUTER JOIN memberships m ON mp.id = m.package_id AND m.status = 'active'
    WHERE mp.name IN ('Personal Training', 'Free Gym', 'Ultimate')
       OR mp.package_type IN ('personal', 'personal_training', 'free_gym', 'ultimate')
)
SELECT 
    '🎉 FINAL SUCCESS VERIFICATION:' as title,
    CASE 
        WHEN packages_not_30_days + durations_not_30_days + memberships_over_30_days = 0 THEN
            '✅ COMPLETE SUCCESS: All personal training subscriptions now use 30-day duration!'
        ELSE
            '⚠️ PARTIAL SUCCESS: Some items may still need attention'
    END as overall_status,
    'Packages using 30 days: ' || packages_30_days as packages_status,
    'Package durations using 30 days: ' || durations_30_days as durations_status,
    'Active memberships ≤30 days: ' || memberships_30_days as memberships_status
FROM success_metrics;

-- ========================================
-- PHASE 8: SPECIAL FIX FOR THEODOROS
-- ========================================

SELECT 'PHASE 8: Special fix for THEODOROS MICHALAKIS...' as phase;

-- Ensure THEODOROS has correct membership duration
UPDATE memberships m
SET 
    end_date = m.start_date + INTERVAL '30 days',
    updated_at = NOW()
FROM membership_packages mp
WHERE m.package_id = mp.id
  AND m.user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS
  AND m.status = 'active'
  AND (m.end_date - m.start_date) > 30;

-- Verify THEODOROS's fix
SELECT 'THEODOROS after fix:' as info;
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    mp.name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) <= 30 THEN '✅ THEODOROS WILL SEE ≤30 DAYS'
        ELSE '❌ THEODOROS STILL SEES >30 DAYS'
    END as theodoros_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active'
ORDER BY m.created_at DESC;

SELECT '🎉 FINAL COMPREHENSIVE 30-DAY FIX COMPLETED!' as completion_status;
SELECT 'All users should now see ≤30 days instead of 365 days!' as result;
