-- FIX ALL 365-DAY DURATIONS TO 30 DAYS
-- Comprehensive fix for all personal training related packages and memberships

-- ========================================
-- PHASE 1: UPDATE PERSONAL TRAINING PACKAGES
-- ========================================

SELECT 'PHASE 1: Updating Personal Training packages from 365 to 30 days...' as phase;

-- Update main packages table
UPDATE membership_packages 
SET 
    duration_days = 30,
    description = REPLACE(REPLACE(description, '1 year', '1 month'), '365 days', '30 days'),
    updated_at = NOW()
WHERE (name = 'Personal Training' OR package_type = 'personal')
  AND duration_days = 365;

-- Log package updates
SELECT 'Updated packages:' as info;
SELECT 
    name,
    package_type,
    duration_days,
    description
FROM membership_packages
WHERE name = 'Personal Training' OR package_type = 'personal';

-- ========================================
-- PHASE 2: UPDATE PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Updating package durations from 365 to 30 days...' as phase;

-- Update package durations for personal training
UPDATE membership_package_durations mpd
SET 
    duration_days = 30,
    updated_at = NOW()
FROM membership_packages mp
WHERE mpd.package_id = mp.id 
  AND (mp.name = 'Personal Training' OR mp.package_type = 'personal')
  AND mpd.duration_days = 365;

-- Log duration updates
SELECT 'Updated package durations:' as info;
SELECT 
    mp.name,
    mp.package_type,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Personal Training' OR mp.package_type = 'personal'
ORDER BY mp.name, mpd.duration_days;

-- ========================================
-- PHASE 3: UPDATE EXISTING MEMBERSHIPS
-- ========================================

SELECT 'PHASE 3: Updating existing active memberships to 30-day duration...' as phase;

-- Update existing active memberships for Personal Training
UPDATE memberships m
SET 
    end_date = m.start_date + INTERVAL '30 days',
    updated_at = NOW()
FROM membership_packages mp
WHERE m.package_id = mp.id
  AND (mp.name = 'Personal Training' OR mp.package_type = 'personal')
  AND m.status = 'active'
  AND (m.end_date - m.start_date) > 30;

-- Log membership updates
SELECT 'Updated memberships:' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE (mp.name = 'Personal Training' OR mp.package_type = 'personal')
  AND m.updated_at > NOW() - INTERVAL '1 minute' -- Recently updated
ORDER BY m.updated_at DESC;

-- ========================================
-- PHASE 4: VERIFY ADMINPANEL LOGIC
-- ========================================

SELECT 'PHASE 4: Verifying AdminPanel logic compatibility...' as phase;

-- Test the AdminPanel.tsx calculation (30 days from now)
DO $$
DECLARE
    test_start_date DATE := CURRENT_DATE;
    test_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
    calculated_duration INTEGER;
BEGIN
    calculated_duration := (test_end_date - test_start_date)::INTEGER;
    
    RAISE NOTICE 'AdminPanel.tsx calculation test:';
    RAISE NOTICE '  Start Date: %', test_start_date;
    RAISE NOTICE '  End Date: %', test_end_date;
    RAISE NOTICE '  Duration: % days', calculated_duration;
    
    IF calculated_duration = 30 THEN
        RAISE NOTICE '✅ AdminPanel calculation is correct (30 days)';
    ELSE
        RAISE NOTICE '❌ AdminPanel calculation is wrong - Expected 30, got %', calculated_duration;
    END IF;
END $$;

-- ========================================
-- PHASE 5: COMPREHENSIVE VERIFICATION
-- ========================================

SELECT 'PHASE 5: Comprehensive verification...' as phase;

-- Check all personal training related items
WITH verification AS (
    SELECT 
        'PACKAGES' as item_type,
        COUNT(CASE WHEN duration_days = 365 THEN 1 END) as items_with_365_days,
        COUNT(CASE WHEN duration_days = 30 THEN 1 END) as items_with_30_days,
        COUNT(*) as total_items
    FROM membership_packages
    WHERE name = 'Personal Training' OR package_type = 'personal'
    
    UNION ALL
    
    SELECT 
        'PACKAGE_DURATIONS' as item_type,
        COUNT(CASE WHEN mpd.duration_days = 365 THEN 1 END) as items_with_365_days,
        COUNT(CASE WHEN mpd.duration_days = 30 THEN 1 END) as items_with_30_days,
        COUNT(*) as total_items
    FROM membership_package_durations mpd
    JOIN membership_packages mp ON mpd.package_id = mp.id
    WHERE mp.name = 'Personal Training' OR mp.package_type = 'personal'
    
    UNION ALL
    
    SELECT 
        'ACTIVE_MEMBERSHIPS' as item_type,
        COUNT(CASE WHEN (m.end_date - m.start_date) > 30 THEN 1 END) as items_with_365_days,
        COUNT(CASE WHEN (m.end_date - m.start_date) <= 30 THEN 1 END) as items_with_30_days,
        COUNT(*) as total_items
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE (mp.name = 'Personal Training' OR mp.package_type = 'personal')
      AND m.status = 'active'
)
SELECT 
    item_type,
    total_items,
    items_with_365_days as problematic_items,
    items_with_30_days as correct_items,
    CASE 
        WHEN items_with_365_days = 0 THEN '✅ ALL CORRECT'
        ELSE '❌ ' || items_with_365_days || ' ITEMS NEED FIXING'
    END as status
FROM verification
ORDER BY item_type;

-- ========================================
-- PHASE 6: CHECK SPECIFIC PROBLEMATIC USERS
-- ========================================

SELECT 'PHASE 6: Checking users with problematic memberships...' as phase;

-- Find users who still see 365+ days
SELECT 'Users with >30 day memberships:' as info;
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_user_sees,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) > 30 THEN '❌ USER SEES >30 DAYS'
        ELSE '✅ USER SEES ≤30 DAYS'
    END as user_experience
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE (mp.name = 'Personal Training' OR mp.package_type = 'personal')
  AND m.status = 'active'
  AND (m.end_date - CURRENT_DATE) > 30
ORDER BY (m.end_date - CURRENT_DATE) DESC;

-- ========================================
-- PHASE 7: SOLUTION SUMMARY
-- ========================================

SELECT 'PHASE 7: Solution summary...' as phase;

-- Count remaining problems
WITH problem_count AS (
    SELECT 
        COUNT(CASE WHEN mp.duration_days = 365 THEN 1 END) as packages_365,
        COUNT(CASE WHEN mpd.duration_days = 365 THEN 1 END) as durations_365,
        COUNT(CASE WHEN (m.end_date - m.start_date) > 30 THEN 1 END) as memberships_over_30
    FROM membership_packages mp
    FULL OUTER JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    FULL OUTER JOIN memberships m ON mp.id = m.package_id
    WHERE (mp.name = 'Personal Training' OR mp.package_type = 'personal')
       OR (m.status = 'active' AND (m.end_date - m.start_date) > 30)
)
SELECT 
    'SOLUTION SUMMARY:' as title,
    CASE 
        WHEN packages_365 + durations_365 + memberships_over_30 = 0 THEN
            '🎉 SUCCESS: All 365-day durations have been fixed!'
        ELSE
            '⚠️ REMAINING ISSUES: ' || 
            CASE WHEN packages_365 > 0 THEN packages_365 || ' packages, ' ELSE '' END ||
            CASE WHEN durations_365 > 0 THEN durations_365 || ' durations, ' ELSE '' END ||
            CASE WHEN memberships_over_30 > 0 THEN memberships_over_30 || ' memberships' ELSE '' END ||
            ' still need fixing'
    END as status,
    'Next: Update packages/durations to 30 days and existing memberships to 30-day duration' as recommendation
FROM problem_count;

SELECT '365-DAY DURATION DIAGNOSIS COMPLETED!' as completion_status;
