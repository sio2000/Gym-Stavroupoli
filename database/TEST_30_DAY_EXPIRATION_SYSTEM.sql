-- TEST 30-DAY EXPIRATION SYSTEM
-- This script tests the complete 30-day expiration system for personal training
-- Execute in Supabase SQL Editor after running the migration scripts

-- ========================================
-- PHASE 1: TEST PERSONAL TRAINING PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 1: Testing Personal Training package durations...' as phase;

-- Check that all personal training packages now have 30 days duration
SELECT 'Personal Training packages (should all be 30 days):' as test;
SELECT 
    name,
    package_type,
    duration_days,
    CASE 
        WHEN duration_days = 30 THEN '✅ CORRECT' 
        ELSE '❌ WRONG - Expected 30, got ' || duration_days 
    END as validation
FROM membership_packages 
WHERE package_type = 'personal';

-- Check personal training package durations
SELECT 'Personal Training package durations (should all be 30 days):' as test;
SELECT 
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    CASE 
        WHEN mpd.duration_days = 30 THEN '✅ CORRECT' 
        ELSE '❌ WRONG - Expected 30, got ' || mpd.duration_days 
    END as validation
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.package_type = 'personal';

-- ========================================
-- PHASE 2: TEST MEMBERSHIP CREATION WITH 30-DAY DURATION
-- ========================================

SELECT 'PHASE 2: Testing membership creation with 30-day duration...' as phase;

-- Simulate what happens when AdminPanel creates a membership
DO $$
DECLARE
    test_package_id UUID;
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Use a test UUID
    test_start_date DATE := CURRENT_DATE;
    test_end_date DATE := CURRENT_DATE + INTERVAL '30 days';
    days_diff INTEGER;
BEGIN
    -- Get a personal training package
    SELECT id INTO test_package_id 
    FROM membership_packages 
    WHERE package_type = 'personal' 
    LIMIT 1;
    
    IF test_package_id IS NOT NULL THEN
        -- Calculate the difference
        days_diff := (test_end_date - test_start_date)::INTEGER;
        
        RAISE NOTICE 'Test membership duration calculation:';
        RAISE NOTICE '  Start Date: %', test_start_date;
        RAISE NOTICE '  End Date: %', test_end_date;
        RAISE NOTICE '  Duration: % days', days_diff;
        
        IF days_diff = 30 THEN
            RAISE NOTICE '✅ MEMBERSHIP DURATION CALCULATION IS CORRECT';
        ELSE
            RAISE NOTICE '❌ MEMBERSHIP DURATION CALCULATION IS WRONG - Expected 30, got %', days_diff;
        END IF;
    ELSE
        RAISE NOTICE '❌ NO PERSONAL TRAINING PACKAGE FOUND FOR TESTING';
    END IF;
END $$;

-- ========================================
-- PHASE 3: TEST PASPARTU LESSON EXPIRATION SYSTEM
-- ========================================

SELECT 'PHASE 3: Testing Paspartu lesson expiration system...' as phase;

-- Check if expiration columns were added
SELECT 'Lesson deposits table structure:' as test;
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('expires_at', 'last_reset_at') THEN '✅ ADDED'
        ELSE '📝 EXISTING'
    END as status
FROM information_schema.columns 
WHERE table_name = 'lesson_deposits'
ORDER BY 
    CASE WHEN column_name IN ('expires_at', 'last_reset_at') THEN 1 ELSE 2 END,
    column_name;

-- Check if expiration functions were created
SELECT 'Lesson expiration functions:' as test;
SELECT 
    routine_name,
    routine_type,
    '✅ CREATED' as status
FROM information_schema.routines 
WHERE routine_name IN (
    'expire_paspartu_lessons',
    'set_lesson_expiration', 
    'check_and_expire_paspartu_lessons'
)
ORDER BY routine_name;

-- Test the set_lesson_expiration function
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000002';
    test_result RECORD;
BEGIN
    -- Test setting lesson expiration
    PERFORM set_lesson_expiration(test_user_id, 5, NULL);
    
    -- Check the result
    SELECT * INTO test_result
    FROM lesson_deposits 
    WHERE user_id = test_user_id;
    
    IF FOUND THEN
        RAISE NOTICE 'Test lesson expiration setting:';
        RAISE NOTICE '  User ID: %', test_result.user_id;
        RAISE NOTICE '  Total Lessons: %', test_result.total_lessons;
        RAISE NOTICE '  Used Lessons: %', test_result.used_lessons;
        RAISE NOTICE '  Expires At: %', test_result.expires_at;
        
        IF test_result.expires_at IS NOT NULL AND test_result.expires_at > NOW() THEN
            RAISE NOTICE '✅ LESSON EXPIRATION SETTING WORKS CORRECTLY';
        ELSE
            RAISE NOTICE '❌ LESSON EXPIRATION SETTING FAILED';
        END IF;
    ELSE
        RAISE NOTICE '❌ LESSON DEPOSIT NOT CREATED';
    END IF;
    
    -- Clean up test data
    DELETE FROM lesson_deposits WHERE user_id = test_user_id;
END $$;

-- ========================================
-- PHASE 4: TEST EXPIRATION VIEW
-- ========================================

SELECT 'PHASE 4: Testing expiration monitoring view...' as phase;

-- Test the expiration status view
SELECT 'Paspartu lesson expiration status view:' as test;
SELECT COUNT(*) as total_records
FROM paspartu_lesson_expiration_status;

-- Show sample data from the view (if any exists)
SELECT 'Sample expiration status data:' as test;
SELECT 
    user_id,
    first_name,
    last_name,
    total_lessons,
    remaining_lessons,
    expiration_status,
    days_until_expiration
FROM paspartu_lesson_expiration_status
LIMIT 5;

-- ========================================
-- PHASE 5: TEST COMPLETE WORKFLOW SIMULATION
-- ========================================

SELECT 'PHASE 5: Testing complete workflow simulation...' as phase;

-- Simulate complete workflow: Admin creates program -> User gets lessons with expiration
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000003';
    admin_user_id UUID := '00000000-0000-0000-0000-000000000004';
    lesson_record RECORD;
    days_until_expiration INTEGER;
BEGIN
    -- Simulate admin creating paspartu program (calls reset_lesson_deposit_for_new_program)
    PERFORM reset_lesson_deposit_for_new_program(test_user_id, 5, admin_user_id);
    
    -- Check the created deposit
    SELECT * INTO lesson_record
    FROM lesson_deposits 
    WHERE user_id = test_user_id;
    
    IF FOUND THEN
        days_until_expiration := EXTRACT(DAYS FROM (lesson_record.expires_at - NOW()))::INTEGER;
        
        RAISE NOTICE 'Complete workflow test:';
        RAISE NOTICE '  User ID: %', lesson_record.user_id;
        RAISE NOTICE '  Total Lessons: %', lesson_record.total_lessons;
        RAISE NOTICE '  Expires At: %', lesson_record.expires_at;
        RAISE NOTICE '  Days Until Expiration: %', days_until_expiration;
        
        IF lesson_record.total_lessons = 5 AND days_until_expiration BETWEEN 29 AND 30 THEN
            RAISE NOTICE '✅ COMPLETE WORKFLOW TEST PASSED';
        ELSE
            RAISE NOTICE '❌ COMPLETE WORKFLOW TEST FAILED';
        END IF;
    ELSE
        RAISE NOTICE '❌ COMPLETE WORKFLOW TEST FAILED - NO DEPOSIT CREATED';
    END IF;
    
    -- Clean up test data
    DELETE FROM lesson_deposits WHERE user_id = test_user_id;
END $$;

-- ========================================
-- PHASE 6: SUMMARY AND RECOMMENDATIONS
-- ========================================

SELECT 'PHASE 6: Summary and recommendations...' as phase;

-- Count any remaining 365-day durations
WITH remaining_365_day_items AS (
    SELECT 'Personal Training Packages' as item_type, COUNT(*) as count
    FROM membership_packages 
    WHERE package_type = 'personal' AND duration_days = 365
    
    UNION ALL
    
    SELECT 'Personal Training Package Durations' as item_type, COUNT(*) as count
    FROM membership_package_durations mpd
    JOIN membership_packages mp ON mpd.package_id = mp.id
    WHERE mp.package_type = 'personal' AND mpd.duration_days = 365
    
    UNION ALL
    
    SELECT 'Active Personal Training Memberships > 30 days' as item_type, COUNT(*) as count
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE mp.package_type = 'personal' 
    AND m.status = 'active'
    AND (m.end_date - m.start_date) > 30
)
SELECT 
    item_type,
    count,
    CASE 
        WHEN count = 0 THEN '✅ GOOD - No remaining 365-day items'
        ELSE '⚠️  WARNING - ' || count || ' items still have >30 day duration'
    END as status
FROM remaining_365_day_items;

-- Final summary
SELECT '🎉 30-DAY EXPIRATION SYSTEM TEST COMPLETED!' as final_status;

SELECT 'RECOMMENDATIONS:' as recommendations;
SELECT '1. Run CHANGE_PERSONAL_TRAINING_TO_30_DAYS.sql if you haven''t already' as rec1;
SELECT '2. Run IMPLEMENT_PASPARTU_LESSON_EXPIRATION.sql if you haven''t already' as rec2;
SELECT '3. Set up a scheduled job to call check_and_expire_paspartu_lessons() daily' as rec3;
SELECT '4. Monitor the paspartu_lesson_expiration_status view regularly' as rec4;
