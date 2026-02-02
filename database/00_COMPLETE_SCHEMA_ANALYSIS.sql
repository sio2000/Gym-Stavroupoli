-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE DATABASE SCHEMA ANALYSIS
-- Τρέξτε αυτό ΟΛΟΚΛΗΡΟ στο Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- PHASE 1: TABLE INVENTORY & STRUCTURE
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 1: SUBSCRIPTION-RELATED TABLES - STRUCTURE & SIZE' as phase_name;

SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN (
    'memberships', 'membership_packages', 'membership_requests',
    'pilates_deposits', 'pilates_bookings', 'ultimate_weekly_refills',
    'ultimate_dual_membership', 'membership_package_durations',
    'membership_logs', 'membership_expiration', 'membership_overview',
    'user_profiles'
  )
GROUP BY table_name
ORDER BY table_name;

-- Row counts
SELECT '─── ROW COUNTS ───' as separator;
SELECT 'memberships' as table_name, COUNT(*) as row_count FROM memberships UNION ALL
SELECT 'membership_packages', COUNT(*) FROM membership_packages UNION ALL
SELECT 'membership_requests', COUNT(*) FROM membership_requests UNION ALL
SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits UNION ALL
SELECT 'pilates_bookings', COUNT(*) FROM pilates_bookings UNION ALL
SELECT 'ultimate_weekly_refills', COUNT(*) FROM ultimate_weekly_refills UNION ALL
SELECT 'ultimate_dual_membership', COUNT(*) FROM ultimate_dual_membership UNION ALL
SELECT 'membership_package_durations', COUNT(*) FROM membership_package_durations UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
ORDER BY row_count DESC;

-- PHASE 2: MEMBERSHIPS TABLE - DETAILED ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 2: MEMBERSHIPS TABLE - DETAILED STRUCTURE' as phase_name;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'memberships' AND table_schema = 'public'
ORDER BY ordinal_position;

-- NULL value analysis
SELECT '─── NULL VALUES IN MEMBERSHIPS ───' as separator;
SELECT 
    'approved_by' as column_name, COUNT(*) FILTER (WHERE approved_by IS NULL) as null_count, COUNT(*) as total
FROM memberships
UNION ALL
SELECT 'expires_at', COUNT(*) FILTER (WHERE expires_at IS NULL), COUNT(*) FROM memberships
UNION ALL
SELECT 'source_request_id', COUNT(*) FILTER (WHERE source_request_id IS NULL), COUNT(*) FROM memberships
UNION ALL
SELECT 'deleted_at', COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FROM memberships
UNION ALL
SELECT 'cancelled_at', COUNT(*) FILTER (WHERE cancelled_at IS NULL), COUNT(*) FROM memberships
UNION ALL
SELECT 'renewal_package_id', COUNT(*) FILTER (WHERE renewal_package_id IS NULL), COUNT(*) FROM memberships;

-- PHASE 3: MEMBERSHIP STATUS ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 3: DATA QUALITY - STATUS & EXPIRATION' as phase_name;

SELECT 
    'Active memberships' as metric,
    COUNT(*) FILTER (WHERE is_active = true) as count
FROM memberships
UNION ALL
SELECT 'Inactive memberships', COUNT(*) FILTER (WHERE is_active = false) FROM memberships
UNION ALL
SELECT 'Expired (end_date < today)', COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) FROM memberships
UNION ALL
SELECT '⚠️ Expired BUT marked ACTIVE', COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND is_active = true) FROM memberships
UNION ALL
SELECT 'Status = active', COUNT(*) FILTER (WHERE status = 'active') FROM memberships
UNION ALL
SELECT 'Status != is_active (MISMATCH)', COUNT(*) FILTER (WHERE (status = 'active') != is_active) FROM memberships;

-- PHASE 4: PILATES SYSTEM ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 4: PILATES DEPOSITS & BOOKINGS' as phase_name;

SELECT 'Pilates deposits table' as item, COUNT(*) as count FROM pilates_deposits
UNION ALL
SELECT 'Active pilates deposits', COUNT(*) FILTER (WHERE is_active = true) FROM pilates_deposits
UNION ALL
SELECT 'Pilates deposits with 0 lessons', COUNT(*) FILTER (WHERE deposit_remaining = 0) FROM pilates_deposits
UNION ALL
SELECT '⚠️ Active with 0 lessons', COUNT(*) FILTER (WHERE is_active = true AND deposit_remaining = 0) FROM pilates_deposits
UNION ALL
SELECT 'Pilates bookings', COUNT(*) FROM pilates_bookings;

-- PHASE 5: FOREIGN KEY RELATIONSHIPS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 5: FOREIGN KEY INTEGRITY' as phase_name;

-- Memberships FK analysis
SELECT '─── MEMBERSHIPS FOREIGN KEYS ───' as separator;
SELECT 
    'memberships.user_id → user_profiles' as relationship,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as valid,
    COUNT(*) FILTER (WHERE user_id IS NULL) as orphaned
FROM memberships
UNION ALL
SELECT 'memberships.package_id → membership_packages',
    COUNT(*) FILTER (WHERE package_id IS NOT NULL),
    COUNT(*) FILTER (WHERE package_id IS NULL)
FROM memberships;

-- Pilates deposits FK analysis
SELECT '─── PILATES_DEPOSITS FOREIGN KEYS ───' as separator;
SELECT 
    'pilates_deposits.user_id → user_profiles' as relationship,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as valid,
    COUNT(*) FILTER (WHERE user_id IS NULL) as orphaned
FROM pilates_deposits;

-- PHASE 6: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 6: ROW-LEVEL SECURITY POLICIES' as phase_name;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('memberships', 'pilates_deposits', 'membership_requests', 'user_profiles')
ORDER BY tablename, policyname;

-- PHASE 7: TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 7: TRIGGERS & FUNCTIONS' as phase_name;

SELECT '─── TRIGGERS ON SUBSCRIPTION TABLES ───' as separator;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('memberships', 'pilates_deposits')
ORDER BY event_object_table, trigger_name;

SELECT '─── FUNCTIONS RELATED TO MEMBERSHIPS ───' as separator;
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%membership%' OR routine_name LIKE '%pilates%' OR routine_name LIKE '%deposit%')
ORDER BY routine_name;

-- PHASE 8: UNUSED/EMPTY TABLES
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 8: UNUSED OR EMPTY TABLES' as phase_name;

SELECT table_name, 0 as row_count FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ultimate_weekly_refills', 'ultimate_dual_membership', 'membership_logs', 'membership_expiration')
UNION ALL
SELECT 'ultimate_weekly_refills', COUNT(*) FROM ultimate_weekly_refills
UNION ALL
SELECT 'ultimate_dual_membership', COUNT(*) FROM ultimate_dual_membership
UNION ALL
SELECT 'membership_logs', COUNT(*) FROM membership_logs
UNION ALL
SELECT 'membership_expiration', COUNT(*) FROM membership_expiration;

-- PHASE 9: PACKAGE ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 9: MEMBERSHIP PACKAGES AVAILABLE' as phase_name;

SELECT 
    id,
    name,
    description,
    price,
    (SELECT COUNT(*) FROM memberships m WHERE m.package_id = mp.id) as member_count,
    (SELECT COUNT(*) FROM membership_requests mr WHERE mr.package_id = mp.id) as request_count
FROM membership_packages mp
ORDER BY member_count DESC;

-- PHASE 10: USER PROFILE ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 10: USER PROFILE & SUBSCRIPTION MAPPING' as phase_name;

SELECT 
    'Users with memberships' as metric,
    COUNT(DISTINCT m.user_id) as count
FROM memberships m
UNION ALL
SELECT 'Users with pilates deposits',
    COUNT(DISTINCT pd.user_id)
FROM pilates_deposits pd
UNION ALL
SELECT 'Users with pending requests',
    COUNT(DISTINCT mr.user_id)
FROM membership_requests mr
WHERE mr.status = 'pending'
UNION ALL
SELECT 'Total unique users',
    COUNT(DISTINCT user_id)
FROM user_profiles;

-- PHASE 11: CRITICAL ISSUES DETECTION
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 11: CRITICAL ISSUES & ANOMALIES' as phase_name;

-- Issue 1: Duplicate status fields
SELECT '⚠️ ISSUE 1: DUPLICATE STATUS FIELDS' as issue;
SELECT 
    'is_active vs status mismatch',
    COUNT(*) FILTER (WHERE is_active != (status = 'active')) as mismatch_count
FROM memberships;

-- Issue 2: Orphaned pilates deposits
SELECT '⚠️ ISSUE 2: ORPHANED PILATES DEPOSITS' as issue;
SELECT 
    'Pilates deposits without active memberships',
    COUNT(DISTINCT pd.user_id) as affected_users
FROM pilates_deposits pd
WHERE NOT EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = pd.user_id 
    AND m.package_id IN (SELECT id FROM membership_packages WHERE name = 'Pilates')
    AND m.is_active = true
)
AND pd.is_active = true;

-- Issue 3: Expired memberships not deactivated
SELECT '⚠️ ISSUE 3: EXPIRED MEMBERSHIPS NOT DEACTIVATED' as issue;
SELECT 
    COUNT(*) as count
FROM memberships
WHERE end_date < CURRENT_DATE
  AND is_active = true;

-- Issue 4: Missing cascade behavior
SELECT '⚠️ ISSUE 4: CASCADE MISSING?' as issue;
SELECT 
    'Active deposits for inactive memberships',
    COUNT(DISTINCT pd.user_id) as affected_users
FROM pilates_deposits pd
INNER JOIN memberships m ON pd.user_id = m.user_id
WHERE pd.is_active = true
  AND m.is_active = false;

-- PHASE 12: SUMMARY & RECOMMENDATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT '═══════════════════════════════════════════════════════════════════════════════' as phase;
SELECT 'PHASE 12: SUMMARY & RECOMMENDATIONS' as phase_name;

SELECT '✅ Analysis Complete' as status;
SELECT 'IMMEDIATE ACTIONS REQUIRED:' as action_group,
    1 as priority,
    'Fix RLS policies - currently blocking admin inserts' as action
UNION ALL
SELECT 'IMMEDIATE ACTIONS REQUIRED', 2, 'Create triggers to auto-deactivate expired memberships'
UNION ALL
SELECT 'HIGH PRIORITY', 3, 'Implement cascade deactivation for pilates deposits'
UNION ALL
SELECT 'HIGH PRIORITY', 4, 'Remove duplicate status columns - use only is_active'
UNION ALL
SELECT 'MEDIUM PRIORITY', 5, 'Populate or remove NULL columns in memberships'
UNION ALL
SELECT 'OPTIMIZATION', 6, 'Drop empty tables (logs, expiration) if no longer needed';
