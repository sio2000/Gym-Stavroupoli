-- DIAGNOSE 365-DAY PROBLEM IN PERSONAL TRAINING SYSTEM
-- Find all locations where 365-day durations still exist

-- ========================================
-- PHASE 1: CHECK MEMBERSHIP PACKAGES
-- ========================================

SELECT 'PHASE 1: Checking membership packages for 365-day durations...' as phase;

-- Find packages with 365-day duration
SELECT 'Packages with 365-day duration:' as info;
SELECT 
    id,
    name,
    package_type,
    duration_days,
    price,
    description,
    is_active,
    CASE 
        WHEN duration_days = 365 THEN '❌ NEEDS UPDATE TO 30 DAYS'
        WHEN duration_days = 30 THEN '✅ CORRECT'
        ELSE '⚠️ OTHER DURATION: ' || duration_days || ' days'
    END as status
FROM membership_packages
WHERE name IN ('Personal Training', 'Free Gym', 'Ultimate')
   OR package_type IN ('personal', 'personal_training', 'free_gym', 'ultimate')
ORDER BY name;

-- ========================================
-- PHASE 2: CHECK MEMBERSHIP PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Checking membership package durations...' as phase;

-- Find package durations with 365 days
SELECT 'Package durations with 365 days:' as info;
SELECT 
    mpd.id,
    mp.name as package_name,
    mp.package_type,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active,
    CASE 
        WHEN mpd.duration_days = 365 THEN '❌ NEEDS UPDATE TO 30 DAYS'
        WHEN mpd.duration_days = 30 THEN '✅ CORRECT'
        ELSE '⚠️ OTHER DURATION: ' || mpd.duration_days || ' days'
    END as status
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name IN ('Personal Training', 'Free Gym', 'Ultimate')
   OR mp.package_type IN ('personal', 'personal_training', 'free_gym', 'ultimate')
   OR mpd.duration_days = 365
ORDER BY mp.name, mpd.duration_days;

-- ========================================
-- PHASE 3: CHECK EXISTING USER MEMBERSHIPS
-- ========================================

SELECT 'PHASE 3: Checking existing user memberships with long durations...' as phase;

-- Find memberships with >30 day duration
SELECT 'Memberships with >30 day duration:' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mp.package_type,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.status,
    CASE 
        WHEN (m.end_date - m.start_date) > 30 THEN '❌ TOO LONG (>30 days)'
        WHEN (m.end_date - m.start_date) = 30 THEN '✅ CORRECT (30 days)'
        ELSE '⚠️ UNUSUAL (<30 days)'
    END as duration_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE mp.name IN ('Personal Training', 'Free Gym', 'Ultimate')
   OR mp.package_type IN ('personal', 'personal_training', 'free_gym', 'ultimate')
   OR (m.end_date - m.start_date) > 30
ORDER BY (m.end_date - m.start_date) DESC;

-- ========================================
-- PHASE 4: CHECK SPECIFIC USER (THEODOROS)
-- ========================================

SELECT 'PHASE 4: Checking THEODOROS MICHALAKIS specifically...' as phase;

-- Check THEODOROS's current status
SELECT 'THEODOROS current status:' as info;
SELECT 
    'MEMBERSHIPS' as data_type,
    m.id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'

UNION ALL

SELECT 
    'REQUESTS' as data_type,
    mr.id,
    mp.name as package_name,
    mr.created_at::date as start_date,
    NULL as end_date,
    NULL as duration_days,
    NULL as days_remaining,
    mr.status
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY data_type, start_date DESC;

-- ========================================
-- PHASE 5: ROOT CAUSE ANALYSIS
-- ========================================

SELECT 'PHASE 5: Root cause analysis...' as phase;

-- Count problematic items
WITH problem_analysis AS (
    SELECT 
        COUNT(CASE WHEN mp.duration_days = 365 THEN 1 END) as packages_with_365_days,
        COUNT(CASE WHEN mpd.duration_days = 365 THEN 1 END) as package_durations_with_365_days,
        COUNT(CASE WHEN (m.end_date - m.start_date) > 30 THEN 1 END) as memberships_over_30_days
    FROM membership_packages mp
    FULL OUTER JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    FULL OUTER JOIN memberships m ON mp.id = m.package_id
    WHERE mp.name IN ('Personal Training', 'Free Gym', 'Ultimate')
       OR mp.package_type IN ('personal', 'personal_training', 'free_gym', 'ultimate')
)
SELECT 
    'ROOT CAUSE ANALYSIS:' as analysis_title,
    CASE 
        WHEN packages_with_365_days > 0 THEN 
            '❌ FOUND: ' || packages_with_365_days || ' packages with 365-day duration'
        ELSE 
            '✅ GOOD: No packages with 365-day duration'
    END as packages_status,
    CASE 
        WHEN package_durations_with_365_days > 0 THEN 
            '❌ FOUND: ' || package_durations_with_365_days || ' package durations with 365 days'
        ELSE 
            '✅ GOOD: No package durations with 365 days'
    END as durations_status,
    CASE 
        WHEN memberships_over_30_days > 0 THEN 
            '❌ FOUND: ' || memberships_over_30_days || ' active memberships with >30 days'
        ELSE 
            '✅ GOOD: No active memberships with >30 days'
    END as memberships_status
FROM problem_analysis;

SELECT 'DIAGNOSIS COMPLETED - Check results above to identify the root cause!' as completion_status;
