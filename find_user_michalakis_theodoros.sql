-- FIND ALL DATA FOR USER: ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ
-- This script searches for all information related to this specific user

-- ========================================
-- PHASE 1: BASIC USER INFORMATION
-- ========================================

SELECT 'PHASE 1: Searching for user ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ...' as phase;

-- Search by first name and last name (various combinations)
SELECT 'User Profile Search Results:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    created_at,
    updated_at
FROM user_profiles 
WHERE 
    (UPPER(first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(first_name) LIKE '%THEODOR%')
    AND (UPPER(last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(last_name) LIKE '%MICHALAK%')
    OR (UPPER(first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(first_name) LIKE '%MICHALAK%')
    AND (UPPER(last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(last_name) LIKE '%THEODOR%')
    OR UPPER(first_name || ' ' || last_name) LIKE '%ΜΙΧΑΛΑΚΗΣ%ΘΕΩΔΩΡ%'
    OR UPPER(first_name || ' ' || last_name) LIKE '%ΘΕΩΔΩΡ%ΜΙΧΑΛΑΚ%'
    OR UPPER(first_name || ' ' || last_name) LIKE '%MICHALAKIS%THEODOR%'
    OR UPPER(first_name || ' ' || last_name) LIKE '%THEODOR%MICHALAK%';

-- ========================================
-- PHASE 2: MEMBERSHIP INFORMATION
-- ========================================

SELECT 'PHASE 2: Membership information...' as phase;

-- Get memberships for this user
SELECT 'User Memberships:' as info;
SELECT 
    m.id as membership_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    mp.package_type,
    m.status,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining,
    m.created_at as membership_created
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 3: PERSONAL TRAINING SCHEDULES
-- ========================================

SELECT 'PHASE 3: Personal Training schedules...' as phase;

-- Get personal training schedules
SELECT 'Personal Training Schedules:' as info;
SELECT 
    pts.id as schedule_id,
    up.first_name,
    up.last_name,
    up.email,
    pts.month,
    pts.year,
    pts.training_type,
    pts.user_type,
    pts.group_room_size,
    pts.weekly_frequency,
    pts.status,
    pts.trainer_name,
    pts.created_at as schedule_created,
    pts.accepted_at,
    pts.declined_at
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY pts.created_at DESC;

-- ========================================
-- PHASE 4: GROUP ASSIGNMENTS
-- ========================================

SELECT 'PHASE 4: Group assignments...' as phase;

-- Get group assignments
SELECT 'Group Assignments:' as info;
SELECT 
    ga.id as assignment_id,
    up.first_name,
    up.last_name,
    up.email,
    ga.group_type,
    ga.day_of_week,
    ga.start_time,
    ga.end_time,
    ga.trainer,
    ga.room,
    ga.assignment_date,
    ga.weekly_frequency,
    ga.is_active,
    ga.created_at as assignment_created,
    ga.notes
FROM group_assignments ga
JOIN user_profiles up ON ga.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY ga.created_at DESC;

-- ========================================
-- PHASE 5: LESSON DEPOSITS (PASPARTU)
-- ========================================

SELECT 'PHASE 5: Lesson deposits (Paspartu)...' as phase;

-- Get lesson deposits if user is Paspartu
SELECT 'Lesson Deposits:' as info;
SELECT 
    ld.id as deposit_id,
    up.first_name,
    up.last_name,
    up.email,
    ld.total_lessons,
    ld.used_lessons,
    ld.remaining_lessons,
    ld.expires_at,
    ld.last_reset_at,
    ld.created_at as deposit_created,
    CASE 
        WHEN ld.expires_at IS NULL THEN 'No Expiration Set'
        WHEN ld.expires_at < NOW() THEN 'EXPIRED'
        WHEN ld.expires_at < NOW() + INTERVAL '7 days' THEN 'EXPIRING SOON'
        ELSE 'ACTIVE'
    END as expiration_status
FROM lesson_deposits ld
JOIN user_profiles up ON ld.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%');

-- ========================================
-- PHASE 6: LESSON BOOKINGS
-- ========================================

SELECT 'PHASE 6: Lesson bookings...' as phase;

-- Get lesson bookings
SELECT 'Lesson Bookings:' as info;
SELECT 
    lb.id as booking_id,
    up.first_name,
    up.last_name,
    up.email,
    lb.booking_date,
    lb.booking_time,
    lb.trainer_name,
    lb.room,
    lb.status,
    lb.notes,
    lb.created_at as booking_created
FROM lesson_bookings lb
JOIN user_profiles up ON lb.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY lb.booking_date DESC, lb.booking_time DESC;

-- ========================================
-- PHASE 7: CASH TRANSACTIONS
-- ========================================

SELECT 'PHASE 7: Cash transactions...' as phase;

-- Get cash transactions
SELECT 'Cash Transactions:' as info;
SELECT 
    uct.id as transaction_id,
    up.first_name,
    up.last_name,
    up.email,
    uct.amount,
    uct.transaction_type,
    uct.description,
    uct.created_at as transaction_date
FROM user_cash_transactions uct
JOIN user_profiles up ON uct.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY uct.created_at DESC;

-- ========================================
-- PHASE 8: KETTLEBELL POINTS
-- ========================================

SELECT 'PHASE 8: Kettlebell points...' as phase;

-- Get kettlebell points
SELECT 'Kettlebell Points:' as info;
SELECT 
    ukp.id as points_id,
    up.first_name,
    up.last_name,
    up.email,
    ukp.points,
    ukp.program_id,
    ukp.created_at as points_created
FROM user_kettlebell_points ukp
JOIN user_profiles up ON ukp.user_id = up.user_id
WHERE 
    (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
    AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
    OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
    AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
ORDER BY ukp.created_at DESC;

-- ========================================
-- PHASE 9: COMPREHENSIVE SUMMARY
-- ========================================

SELECT 'PHASE 9: Comprehensive user summary...' as phase;

-- Get comprehensive user summary
SELECT 'COMPREHENSIVE USER SUMMARY:' as info;
WITH user_data AS (
    SELECT 
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        up.phone,
        up.role,
        up.created_at as user_created
    FROM user_profiles up
    WHERE 
        (UPPER(up.first_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.first_name) LIKE '%THEODOR%')
        AND (UPPER(up.last_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.last_name) LIKE '%MICHALAK%')
        OR (UPPER(up.first_name) LIKE '%ΜΙΧΑΛΑΚ%' OR UPPER(up.first_name) LIKE '%MICHALAK%')
        AND (UPPER(up.last_name) LIKE '%ΘΕΩΔΩΡ%' OR UPPER(up.last_name) LIKE '%THEODOR%')
)
SELECT 
    ud.user_id,
    ud.first_name,
    ud.last_name,
    ud.email,
    ud.phone,
    ud.role,
    ud.user_created,
    COUNT(DISTINCT m.id) as total_memberships,
    COUNT(DISTINCT pts.id) as total_schedules,
    COUNT(DISTINCT ga.id) as total_group_assignments,
    COUNT(DISTINCT lb.id) as total_lesson_bookings,
    COUNT(DISTINCT uct.id) as total_cash_transactions,
    SUM(ukp.points) as total_kettlebell_points
FROM user_data ud
LEFT JOIN memberships m ON ud.user_id = m.user_id
LEFT JOIN personal_training_schedules pts ON ud.user_id = pts.user_id
LEFT JOIN group_assignments ga ON ud.user_id = ga.user_id
LEFT JOIN lesson_bookings lb ON ud.user_id = lb.user_id
LEFT JOIN user_cash_transactions uct ON ud.user_id = uct.user_id
LEFT JOIN user_kettlebell_points ukp ON ud.user_id = ukp.user_id
GROUP BY 
    ud.user_id, ud.first_name, ud.last_name, ud.email, ud.phone, 
    ud.role, ud.user_created;

-- ========================================
-- PHASE 10: ALTERNATIVE SEARCH PATTERNS
-- ========================================

SELECT 'PHASE 10: Alternative search patterns...' as phase;

-- Search with more flexible patterns
SELECT 'Alternative Search Results:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    created_at
FROM user_profiles 
WHERE 
    UPPER(first_name) LIKE '%THEODOR%'
    OR UPPER(last_name) LIKE '%THEODOR%'
    OR UPPER(first_name) LIKE '%ΘΕΩΔΩΡ%'
    OR UPPER(last_name) LIKE '%ΘΕΩΔΩΡ%'
    OR UPPER(first_name) LIKE '%MICHALAK%'
    OR UPPER(last_name) LIKE '%MICHALAK%'
    OR UPPER(first_name) LIKE '%ΜΙΧΑΛΑΚ%'
    OR UPPER(last_name) LIKE '%ΜΙΧΑΛΑΚ%'
    OR email LIKE '%michalak%'
    OR email LIKE '%theodor%'
    OR email LIKE '%μιχαλακ%'
    OR email LIKE '%θεωδωρ%'
ORDER BY created_at DESC;

SELECT 'SEARCH FOR ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ COMPLETED!' as completion_status;
