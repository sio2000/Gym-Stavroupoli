-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 2: DATA INTEGRITY VERIFICATION QUERIES (READ-ONLY)
-- ══════════════════════════════════════════════════════════════════════════════
-- These queries diagnose the actual state of user and subscription data.
-- They are SAFE to run - no modifications, no deletes.
-- 
-- Run each section and capture results to understand:
-- - Duplicate users
-- - Orphan subscriptions/bookings
-- - FK mismatches
-- - Active vs. expired inconsistencies
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION A: USER IDENTITY ANALYSIS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ A1: User Profiles - Overall Count ═══' as diagnostic;
SELECT 
    COUNT(*) as total_user_profiles,
    COUNT(DISTINCT user_id) as distinct_user_ids,
    COUNT(DISTINCT id) as distinct_profile_ids,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as user_id_nulls,
    COUNT(CASE WHEN id IS NULL THEN 1 END) as id_nulls
FROM user_profiles;

SELECT '═══ A2: Duplicate User IDs (same user_id, multiple rows) ═══' as diagnostic;
SELECT 
    user_id,
    COUNT(*) as profile_count,
    STRING_AGG(DISTINCT id::text, ', ') as profile_ids,
    STRING_AGG(DISTINCT email, ', ') as emails
FROM user_profiles
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

SELECT '═══ A3: Profiles with both id and user_id (should always match auth.users.id) ═══' as diagnostic;
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    created_at,
    CASE WHEN id = user_id THEN 'MATCH' ELSE 'MISMATCH' END as id_user_id_comparison
FROM user_profiles
WHERE id IS NOT NULL AND user_id IS NOT NULL
LIMIT 20;

SELECT '═══ A4: Profiles with NULL user_id (orphan or legacy) ═══' as diagnostic;
SELECT 
    COUNT(*) as orphan_profiles,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM user_profiles
WHERE user_id IS NULL;

-- Sample orphan profiles
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION B: MEMBERSHIP & SUBSCRIPTION HEALTH
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ B1: Active Memberships Summary ═══' as diagnostic;
SELECT 
    COUNT(*) as total_memberships,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_count,
    COUNT(*) FILTER (WHERE is_active = true) as is_active_true_count,
    COUNT(*) FILTER (WHERE is_active = false) as is_active_false_count
FROM memberships;

SELECT '═══ B2: Status vs. is_active Mismatch ═══' as diagnostic;
SELECT 
    status,
    is_active,
    COUNT(*) as count
FROM memberships
GROUP BY status, is_active
ORDER BY status, is_active;

SELECT '═══ B3: Active Memberships That Should Be Expired (end_date < TODAY) ═══' as diagnostic;
SELECT 
    id,
    user_id,
    package_id,
    start_date,
    end_date,
    status,
    is_active,
    CURRENT_DATE - end_date as days_expired,
    expires_at
FROM memberships
WHERE status = 'active' 
  AND end_date < CURRENT_DATE
ORDER BY end_date DESC
LIMIT 50;

SELECT '═══ B4: Expired Memberships With Future end_date (data inconsistency) ═══' as diagnostic;
SELECT 
    id,
    user_id,
    start_date,
    end_date,
    status,
    is_active,
    end_date - CURRENT_DATE as days_until_expiry
FROM memberships
WHERE status = 'expired' 
  AND end_date >= CURRENT_DATE
ORDER BY end_date DESC
LIMIT 50;

SELECT '═══ B5: Memberships With NULL or Invalid Dates ═══' as diagnostic;
SELECT 
    COUNT(*) as invalid_date_count,
    COUNT(*) FILTER (WHERE start_date IS NULL) as start_date_nulls,
    COUNT(*) FILTER (WHERE end_date IS NULL) as end_date_nulls,
    COUNT(*) FILTER (WHERE start_date > end_date) as start_after_end
FROM memberships;

SELECT '═══ B6: Multiple Active Memberships Per User (should validate) ═══' as diagnostic;
SELECT 
    user_id,
    COUNT(*) as active_membership_count,
    MIN(start_date) as earliest_start,
    MAX(end_date) as latest_end,
    STRING_AGG(id::text, ', ') as membership_ids
FROM memberships
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY active_membership_count DESC
LIMIT 20;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION C: ORPHAN & BROKEN FK DETECTION
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ C1: Memberships with Orphan user_id (no matching user_profiles) ═══' as diagnostic;
SELECT 
    m.user_id,
    COUNT(*) as membership_count,
    STRING_AGG(m.id::text, ', ') as membership_ids
FROM memberships m
LEFT JOIN user_profiles up ON up.user_id = m.user_id
WHERE up.user_id IS NULL
GROUP BY m.user_id
ORDER BY COUNT(*) DESC;

SELECT '═══ C2: Bookings with Orphan user_id ═══' as diagnostic;
SELECT 
    lb.user_id,
    COUNT(*) as booking_count
FROM lesson_bookings lb
LEFT JOIN user_profiles up ON up.user_id = lb.user_id
WHERE up.user_id IS NULL
GROUP BY lb.user_id
ORDER BY COUNT(*) DESC;

SELECT '═══ C3: Lessons with Orphan room_id or trainer_id ═══' as diagnostic;
SELECT 
    COUNT(*) FILTER (WHERE room_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM rooms r WHERE r.id = room_id)) as orphan_room_count,
    COUNT(*) FILTER (WHERE trainer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM trainers t WHERE t.id = trainer_id)) as orphan_trainer_count
FROM lessons;

SELECT '═══ C4: Bookings with Orphan lesson_id ═══' as diagnostic;
SELECT 
    COUNT(*) as orphan_booking_count
FROM lesson_bookings lb
LEFT JOIN lessons l ON l.id = lb.lesson_id
WHERE l.id IS NULL;

SELECT '═══ C5: Membership_requests with Orphan Approvers ═══' as diagnostic;
SELECT 
    COUNT(*) as requests_with_missing_approver
FROM membership_requests mr
WHERE mr.approved_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = mr.approved_by);

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION D: PILATES SYSTEM CONSISTENCY
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ D1: Pilates Deposits Overview ═══' as diagnostic;
SELECT 
    COUNT(*) as total_deposits,
    COUNT(*) FILTER (WHERE is_active = true) as active_deposits,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_deposits,
    COUNT(*) FILTER (WHERE deposit_remaining <= 0) as exhausted_deposits,
    COUNT(*) FILTER (WHERE deposit_remaining > 0) as remaining_deposits
FROM pilates_deposits;

SELECT '═══ D2: Users with Active Pilates Deposit vs. Active Memberships ═══' as diagnostic;
SELECT 
    COALESCE(pd.user_id, m.user_id) as user_id,
    COUNT(DISTINCT pd.id) as active_pilates_deposits,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') as active_memberships,
    MAX(pd.deposit_remaining) as max_deposit_remaining,
    MAX(m.end_date) as latest_membership_end
FROM pilates_deposits pd
FULL OUTER JOIN memberships m ON m.user_id = pd.user_id AND m.status = 'active'
WHERE (pd.is_active = true OR m.status = 'active')
GROUP BY COALESCE(pd.user_id, m.user_id)
HAVING COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') > 0
  AND (COUNT(DISTINCT pd.id) = 0 OR MAX(pd.deposit_remaining) <= 0)
LIMIT 20;

SELECT '═══ D3: Pilates Bookings with Exhausted Deposits (but still confirmed) ═══' as diagnostic;
SELECT 
    pb.user_id,
    COUNT(*) as confirmed_bookings,
    MAX(pd.deposit_remaining) as current_deposit_remaining
FROM pilates_bookings pb
LEFT JOIN pilates_deposits pd ON pd.user_id = pb.user_id AND pd.is_active = true
WHERE pb.status = 'confirmed'
GROUP BY pb.user_id
HAVING MAX(pd.deposit_remaining) <= 0
LIMIT 20;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION E: EXPIRATION TIMING ANALYSIS
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ E1: Memberships Expiring Today/Tomorrow/This Week ═══' as diagnostic;
SELECT 
    CASE 
        WHEN end_date = CURRENT_DATE THEN 'EXPIRES_TODAY'
        WHEN end_date = CURRENT_DATE + 1 THEN 'EXPIRES_TOMORROW'
        WHEN end_date BETWEEN CURRENT_DATE + 2 AND CURRENT_DATE + 7 THEN 'EXPIRES_THIS_WEEK'
        ELSE 'LATER'
    END as expiration_window,
    COUNT(*) as count,
    MIN(end_date) as earliest_expiry_in_window
FROM memberships
WHERE status = 'active'
  AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
GROUP BY expiration_window
ORDER BY MIN(end_date);

SELECT '═══ E2: Recent Expirations (past 7 days, still marked active - ANOMALY) ═══' as diagnostic;
SELECT 
    id,
    user_id,
    end_date,
    CURRENT_DATE - end_date as days_past_expiry,
    status,
    is_active
FROM memberships
WHERE end_date BETWEEN CURRENT_DATE - 7 AND CURRENT_DATE - 1
  AND status = 'active'
ORDER BY end_date DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION F: FOREIGN KEY & SCHEMA CONSISTENCY
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ F1: Current Foreign Key Constraints (from information_schema) ═══' as diagnostic;
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('memberships', 'lesson_bookings', 'trainers', 'pilates_bookings', 
                        'membership_requests', 'group_assignments', 'personal_training_schedules')
ORDER BY tc.table_name, tc.constraint_name;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION G: POLICY & ACCESS CONTROL
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ G1: RLS Enabled Tables ═══' as diagnostic;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'memberships', 'lesson_bookings', 'pilates_bookings', 
                    'membership_requests', 'lessons')
ORDER BY tablename;

SELECT '═══ G2: User Roles Distribution ═══' as diagnostic;
SELECT 
    role,
    COUNT(*) as user_count
FROM user_profiles
GROUP BY role
ORDER BY user_count DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION H: SUMMARY STATISTICS & HEALTH
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '═══ H1: Overall Health Summary ═══' as diagnostic;
SELECT 
    (SELECT COUNT(*) FROM user_profiles) as total_users,
    (SELECT COUNT(*) FROM memberships WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM memberships WHERE status = 'expired' AND end_date < CURRENT_DATE) as correctly_expired,
    (SELECT COUNT(*) FROM memberships WHERE status = 'active' AND end_date < CURRENT_DATE) as incorrectly_active,
    (SELECT COUNT(*) FROM lesson_bookings WHERE status = 'confirmed') as active_lesson_bookings,
    (SELECT COUNT(*) FROM pilates_bookings WHERE status = 'confirmed') as active_pilates_bookings,
    (SELECT COUNT(*) FROM pilates_deposits WHERE is_active = true AND deposit_remaining > 0) as users_with_pilates_credit;

SELECT '═══ H2: Data Integrity Summary ═══' as diagnostic;
SELECT 
    'OK' as status,
    'All queries completed successfully. Review results above.' as note;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF READ-ONLY VERIFICATION QUERIES
-- ══════════════════════════════════════════════════════════════════════════════
-- Instruction: Export all results to a text/CSV file for team review
-- Next Step: Based on findings, proceed to STEP 3 (Canonical Identity Design)
-- ══════════════════════════════════════════════════════════════════════════════
