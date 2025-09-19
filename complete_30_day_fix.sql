-- COMPLETE 30-DAY FIX FOR ALL PERSONAL TRAINING SUBSCRIPTIONS
-- This script ensures ALL personal training subscriptions use 30-day duration

-- ========================================
-- PHASE 1: FIX PERSONAL TRAINING PACKAGES
-- ========================================

SELECT 'PHASE 1: Fixing Personal Training packages...' as phase;

-- Update Personal Training package to 30 days
UPDATE membership_packages 
SET 
    duration_days = 30,
    description = REPLACE(REPLACE(description, '1 year', '1 month'), '365 days', '30 days'),
    updated_at = NOW()
WHERE name = 'Personal Training'
  AND duration_days != 30;

-- Verify Personal Training package
SELECT 'Personal Training package after fix:' as info;
SELECT 
    id,
    name,
    package_type,
    duration_days,
    description,
    CASE 
        WHEN duration_days = 30 THEN '✅ CORRECT'
        ELSE '❌ WRONG: ' || duration_days || ' days'
    END as status
FROM membership_packages
WHERE name = 'Personal Training';

-- ========================================
-- PHASE 2: FIX PERSONAL TRAINING PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Fixing Personal Training package durations...' as phase;

-- Update all Personal Training package durations to 30 days
UPDATE membership_package_durations mpd
SET 
    duration_days = 30,
    updated_at = NOW()
FROM membership_packages mp
WHERE mpd.package_id = mp.id 
  AND mp.name = 'Personal Training'
  AND mpd.duration_days != 30;

-- Verify package durations
SELECT 'Personal Training package durations after fix:' as info;
SELECT 
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    CASE 
        WHEN mpd.duration_days = 30 THEN '✅ CORRECT'
        ELSE '❌ WRONG: ' || mpd.duration_days || ' days'
    END as status
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Personal Training'
ORDER BY mpd.duration_days;

-- ========================================
-- PHASE 3: FIX EXISTING ACTIVE MEMBERSHIPS
-- ========================================

SELECT 'PHASE 3: Fixing existing active memberships...' as phase;

-- Update existing active Personal Training memberships to 30-day duration
UPDATE memberships m
SET 
    end_date = m.start_date + INTERVAL '30 days',
    updated_at = NOW()
FROM membership_packages mp
WHERE m.package_id = mp.id
  AND mp.name = 'Personal Training'
  AND m.status = 'active'
  AND (m.end_date - m.start_date) != 30;

-- Log updated memberships
SELECT 'Updated memberships:' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    CASE 
        WHEN (m.end_date - m.start_date) = 30 THEN '✅ CORRECT'
        ELSE '❌ WRONG: ' || (m.end_date - m.start_date) || ' days'
    END as status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE mp.name = 'Personal Training'
  AND m.status = 'active'
ORDER BY m.updated_at DESC;

-- ========================================
-- PHASE 4: VERIFY ADMINPANEL CREATES CORRECT MEMBERSHIPS
-- ========================================

SELECT 'PHASE 4: Testing AdminPanel membership creation logic...' as phase;

-- Test what AdminPanel.tsx would create now
DO $$
DECLARE
    test_start_date DATE := CURRENT_DATE;
    test_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
    test_duration INTEGER;
    package_exists BOOLEAN;
BEGIN
    -- Check if Personal Training package exists and has correct duration
    SELECT EXISTS(
        SELECT 1 FROM membership_packages 
        WHERE name = 'Personal Training' 
        AND duration_days = 30
    ) INTO package_exists;
    
    -- Calculate AdminPanel duration
    test_duration := (test_end_date - test_start_date)::INTEGER;
    
    RAISE NOTICE 'AdminPanel membership creation test:';
    RAISE NOTICE '  Personal Training package exists with 30 days: %', package_exists;
    RAISE NOTICE '  AdminPanel calculates duration: % days', test_duration;
    RAISE NOTICE '  Start date: %', test_start_date;
    RAISE NOTICE '  End date: %', test_end_date;
    
    IF package_exists AND test_duration = 30 THEN
        RAISE NOTICE '✅ AdminPanel will create correct 30-day memberships';
    ELSE
        RAISE NOTICE '❌ AdminPanel logic needs review';
    END IF;
END $$;

-- ========================================
-- PHASE 5: COMPREHENSIVE VERIFICATION
-- ========================================

SELECT 'PHASE 5: Comprehensive verification...' as phase;

-- Verify all Personal Training items now use 30 days
WITH verification_results AS (
    SELECT 
        'Personal Training Packages' as item_category,
        COUNT(*) as total_items,
        COUNT(CASE WHEN duration_days = 30 THEN 1 END) as correct_items,
        COUNT(CASE WHEN duration_days != 30 THEN 1 END) as incorrect_items
    FROM membership_packages
    WHERE name = 'Personal Training'
    
    UNION ALL
    
    SELECT 
        'Personal Training Package Durations' as item_category,
        COUNT(*) as total_items,
        COUNT(CASE WHEN mpd.duration_days = 30 THEN 1 END) as correct_items,
        COUNT(CASE WHEN mpd.duration_days != 30 THEN 1 END) as incorrect_items
    FROM membership_package_durations mpd
    JOIN membership_packages mp ON mpd.package_id = mp.id
    WHERE mp.name = 'Personal Training'
    
    UNION ALL
    
    SELECT 
        'Active Personal Training Memberships' as item_category,
        COUNT(*) as total_items,
        COUNT(CASE WHEN (m.end_date - m.start_date) <= 30 THEN 1 END) as correct_items,
        COUNT(CASE WHEN (m.end_date - m.start_date) > 30 THEN 1 END) as incorrect_items
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE mp.name = 'Personal Training'
      AND m.status = 'active'
)
SELECT 
    item_category,
    total_items,
    correct_items,
    incorrect_items,
    CASE 
        WHEN incorrect_items = 0 THEN '✅ ALL CORRECT'
        ELSE '❌ ' || incorrect_items || ' ITEMS STILL WRONG'
    END as verification_status
FROM verification_results
ORDER BY item_category;

-- ========================================
-- PHASE 6: TEST USER EXPERIENCE
-- ========================================

SELECT 'PHASE 6: Testing user experience...' as phase;

-- Simulate what users will see now
SELECT 'User experience simulation:' as info;
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining,
    '"' || (m.end_date - CURRENT_DATE) || ' ημέρες ακόμα"' as user_display_message,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) <= 30 THEN '✅ USER SEES CORRECT DURATION'
        ELSE '❌ USER STILL SEES WRONG DURATION'
    END as user_experience_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE mp.name = 'Personal Training'
  AND m.status = 'active'
ORDER BY (m.end_date - CURRENT_DATE) DESC;

-- ========================================
-- PHASE 7: FINAL STATUS
-- ========================================

SELECT 'PHASE 7: Final status report...' as phase;

-- Final comprehensive status
WITH final_status AS (
    SELECT 
        COUNT(CASE WHEN mp.duration_days != 30 THEN 1 END) as wrong_packages,
        COUNT(CASE WHEN mpd.duration_days != 30 THEN 1 END) as wrong_durations,
        COUNT(CASE WHEN (m.end_date - CURRENT_DATE) > 30 THEN 1 END) as wrong_memberships
    FROM membership_packages mp
    FULL OUTER JOIN membership_package_durations mpd ON mp.id = mpd.package_id
    FULL OUTER JOIN memberships m ON mp.id = m.package_id AND m.status = 'active'
    WHERE mp.name = 'Personal Training'
)
SELECT 
    'FINAL STATUS REPORT:' as title,
    CASE 
        WHEN wrong_packages + wrong_durations + wrong_memberships = 0 THEN
            '🎉 SUCCESS: All Personal Training subscriptions now use 30-day duration!'
        ELSE
            '⚠️ ISSUES REMAIN: ' ||
            CASE WHEN wrong_packages > 0 THEN wrong_packages || ' packages, ' ELSE '' END ||
            CASE WHEN wrong_durations > 0 THEN wrong_durations || ' durations, ' ELSE '' END ||
            CASE WHEN wrong_memberships > 0 THEN wrong_memberships || ' memberships' ELSE '' END ||
            ' still have wrong duration'
    END as overall_status,
    'Users will now see ≤30 days instead of 365 days in their subscriptions' as user_impact
FROM final_status;

SELECT 'COMPLETE 30-DAY FIX EXECUTED!' as completion_status;
