-- TEST USER MEMBERSHIP DURATION FOR THEODOROS MICHALAKIS
-- Check the actual membership duration in the database

-- ========================================
-- PHASE 1: CHECK USER'S CURRENT MEMBERSHIPS
-- ========================================

SELECT 'PHASE 1: Checking THEODOROS MICHALAKIS current memberships...' as phase;

-- Get user's memberships with detailed duration info
SELECT 'Current memberships for THEODOROS MICHALAKIS:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mp.package_type,
    mp.duration_days as package_duration_days,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as actual_duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.status,
    m.is_active,
    m.created_at as membership_created
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba' -- THEODOROS MICHALAKIS
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 2: CHECK PERSONAL TRAINING PACKAGE DURATION
-- ========================================

SELECT 'PHASE 2: Checking Personal Training package duration...' as phase;

-- Check the Personal Training package duration
SELECT 'Personal Training package info:' as info;
SELECT 
    id,
    name,
    package_type,
    duration_days,
    price,
    description,
    is_active
FROM membership_packages 
WHERE name = 'Personal Training';

-- Check Personal Training package durations
SELECT 'Personal Training package durations:' as info;
SELECT 
    mpd.id,
    mp.name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Personal Training'
ORDER BY mpd.duration_days;

-- ========================================
-- PHASE 3: DIAGNOSE THE PROBLEM
-- ========================================

SELECT 'PHASE 3: Diagnosing the 365-day issue...' as phase;

-- Check if user has a membership with 365-day duration
SELECT 'Memberships with 365+ day duration:' as diagnosis;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    CASE 
        WHEN (m.end_date - m.start_date) > 30 THEN '❌ TOO LONG (>30 days)'
        WHEN (m.end_date - m.start_date) = 30 THEN '✅ CORRECT (30 days)'
        ELSE '⚠️ UNUSUAL (<30 days)'
    END as duration_status
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 4: CHECK PERSONAL TRAINING SCHEDULES
-- ========================================

SELECT 'PHASE 4: Checking Personal Training schedules...' as phase;

-- Check user's personal training schedules
SELECT 'Personal Training schedules:' as info;
SELECT 
    pts.id,
    up.first_name,
    up.last_name,
    pts.training_type,
    pts.user_type,
    pts.status,
    pts.month,
    pts.year,
    pts.created_at,
    pts.accepted_at
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY pts.created_at DESC;

-- ========================================
-- PHASE 5: SOLUTION - UPDATE EXISTING MEMBERSHIP
-- ========================================

SELECT 'PHASE 5: Solution - Update existing membership to 30 days...' as phase;

-- Update any existing memberships to 30-day duration
UPDATE memberships 
SET 
    end_date = start_date + INTERVAL '30 days',
    updated_at = NOW()
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND status = 'active'
  AND (end_date - start_date) > 30; -- Only update if duration is more than 30 days

-- Log the update
SELECT 'Updated memberships:' as info;
SELECT 
    m.id,
    up.first_name,
    up.last_name,
    mp.name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as new_duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining_now
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.updated_at > NOW() - INTERVAL '1 minute' -- Recently updated
ORDER BY m.updated_at DESC;

-- ========================================
-- PHASE 6: VERIFICATION
-- ========================================

SELECT 'PHASE 6: Final verification...' as phase;

-- Final check - should now show 30 days or less
SELECT 'Final membership status:' as info;
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    (m.end_date - m.start_date) as duration_days,
    (m.end_date - CURRENT_DATE) as days_remaining,
    CASE 
        WHEN (m.end_date - CURRENT_DATE) <= 30 THEN '✅ CORRECT (≤30 days remaining)'
        ELSE '❌ STILL WRONG (>30 days remaining)'
    END as status_check
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
  AND m.status = 'active'
ORDER BY m.created_at DESC;

SELECT 'THEODOROS MICHALAKIS MEMBERSHIP DURATION FIX COMPLETED!' as completion_status;
