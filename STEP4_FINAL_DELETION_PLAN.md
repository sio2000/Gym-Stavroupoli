# STEP 4: FINAL HUMAN-EXECUTED DELETION PLAN
## Production Data Reset - SQL Execution Guide

**Status:** PLANNING MODE - NO EXECUTION  
**Authorization:** Manual human execution required  
**Target:** Test/Backup Database (first execution)  
**Date:** January 30, 2026

---

## ⚠️ CRITICAL DISCLAIMERS

### EXECUTION MODE: HUMAN-ONLY
- ✋ **DO NOT RUN THESE QUERIES AUTOMATICALLY**
- ✋ **NO AUTO-EXECUTION - MANUAL ONLY**
- ✋ **EACH PHASE REQUIRES HUMAN VERIFICATION BETWEEN STEPS**
- ✋ **COPY-PASTE EACH QUERY MANUALLY INTO SUPABASE SQL EDITOR**

### IRREVERSIBLE OPERATIONS
🔴 **ALL DELETE STATEMENTS ARE PERMANENT**
- No undo after COMMIT
- Only recovery: restore from backup
- **Confirm backup is accessible BEFORE proceeding**

### TRANSACTION CONTROL
- Begin with `BEGIN;` (creates transaction)
- Execute DELETE statements
- Review row counts in messages
- Run POST-CHECK queries to verify
- **ONLY THEN:** Execute `COMMIT;` to finalize
- If error: `ROLLBACK;` to abort and restore

---

## 📋 PRE-EXECUTION VERIFICATION

### CHECKLIST: Confirm These BEFORE Starting

```sql
-- PRE-CHECK 1: Verify Backup Exists (ask DevOps)
-- Status: ✅ REQUIRED BEFORE PROCEEDING
-- Action: Take screenshot of Supabase backup dashboard showing recent backup
-- Evidence needed: Backup timestamp < 30 minutes before execution start

-- PRE-CHECK 2: Verify Workflow Disabled
SELECT 'Verify: .github/workflows/weekly-pilates-refill.yml is disabled' AS check;
-- Status: ✅ COMPLETED (from Step 3 checklist)

-- PRE-CHECK 3: Verify Triggers Disabled
SELECT 'Verify: 4 business logic triggers are disabled' AS check;
-- Status: ✅ COMPLETED (from Step 3 checklist)

-- PRE-CHECK 4: Verify Database Connectivity
SELECT version() AS postgres_version;
SELECT current_database() AS active_database;
SELECT current_user AS logged_in_as;
-- Expected: postgres 14/15, correct database, authenticated user

-- PRE-CHECK 5: Verify No Active Connections
SELECT
  pid,
  usename,
  application_name,
  query_start,
  state
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
LIMIT 10;
-- Expected: Few/no active connections (avoid conflicts with other users)
```

---

## 🟢 PHASE 1: PRE-EXECUTION ROW COUNTS

**Purpose:** Document baseline before any deletion  
**Duration:** 1-2 minutes  
**Risk:** READ-ONLY (no changes)

```sql
-- ============================================================
-- PHASE 1: BASELINE ROW COUNTS (BEFORE DELETION)
-- ============================================================
-- Purpose: Verify data exists and document deletion targets
-- Status: READ-ONLY - Safe to run anytime

-- Run this entire block (all SELECT queries together)
-- Expected: 150-300 users, 200-500 memberships, ~3000+ bookings

SELECT 'PHASE 1: BASELINE ROW COUNTS' as phase_marker;

-- User-generated data that WILL be deleted
SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count,
  'PRIMARY CASCADE HUB' as category
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM pilates_deposits
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM pilates_bookings
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_bookings
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_attendance
UNION ALL SELECT
  'bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM bookings
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  'USER TRANSACTIONS'
FROM qr_codes
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  'USER TRANSACTIONS'
FROM scan_audit_logs
UNION ALL SELECT
  'payments',
  COUNT(*),
  'USER TRANSACTIONS'
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  'USER DATA'
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  'USER DATA'
FROM referrals
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  'USER DATA'
FROM user_kettlebell_points
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  'USER DATA'
FROM user_group_weekly_presets
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  'USER DATA'
FROM audit_logs
UNION ALL SELECT
  'user_profile_audit_logs',
  COUNT(*),
  'USER DATA'
FROM user_profile_audit_logs
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  'USER DATA'
FROM personal_training_codes
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  'USER DATA'
FROM personal_training_schedules
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  'USER DATA'
FROM group_assignments
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  'USER DATA'
FROM membership_logs
ORDER BY row_count DESC;

-- System configuration data that WILL NOT be deleted
SELECT 'PROTECTED TABLES (DO NOT DELETE):' as verification;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  'PROTECTED' as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  'PROTECTED'
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  'PROTECTED'
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  'PROTECTED'
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  'PROTECTED'
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  'PROTECTED'
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  'PROTECTED'
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  'PROTECTED'
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  'PROTECTED'
FROM pilates_schedule_slots
ORDER BY row_count DESC;
```

**Next Step:** Record the row counts from output above. Use these numbers to verify each deletion phase.

---

## 🟡 PHASE 2: DELETE LEAF NODES (No Cascade Dependencies)

**Duration:** 1-2 minutes  
**Risk:** 🟡 MEDIUM (straightforward deletes, no cascades)  
**Rollback:** Simple (ROLLBACK transaction)  
**Irreversible:** YES (after COMMIT)

```sql
-- ============================================================
-- PHASE 2: DELETE LEAF NODES (Independent tables)
-- ============================================================
-- These tables have no dependent child tables
-- Safe to delete in any order
-- Total impact: ~5,000-10,000 rows

BEGIN;  -- Start transaction

-- Delete 1: scan_audit_logs (leaf node)
-- No other tables depend on this
DELETE FROM scan_audit_logs;
-- Expected output: DELETE X rows

-- Delete 2: lesson_attendance (leaf node)
-- No dependent children
DELETE FROM lesson_attendance;
-- Expected output: DELETE X rows

-- Delete 3: absence_records (leaf node)
-- No dependent children
DELETE FROM absence_records;
-- Expected output: DELETE X rows

-- Delete 4: referrals (leaf node - even though it references users)
-- No other tables have FK to referrals
DELETE FROM referrals;
-- Expected output: DELETE X rows

-- Delete 5: user_kettlebell_points (leaf node)
-- No dependent children
DELETE FROM user_kettlebell_points;
-- Expected output: DELETE X rows

-- Delete 6: user_group_weekly_presets (leaf node)
-- No dependent children
DELETE FROM user_group_weekly_presets;
-- Expected output: DELETE X rows

-- Delete 7: audit_logs (leaf node)
-- No dependent children
DELETE FROM audit_logs;
-- Expected output: DELETE X rows

-- Delete 8: user_profile_audit_logs (leaf node)
-- No dependent children
DELETE FROM user_profile_audit_logs;
-- Expected output: DELETE X rows

-- Delete 9: personal_training_schedules (leaf node)
-- No dependent children
DELETE FROM personal_training_schedules;
-- Expected output: DELETE X rows

-- Subtotal check (optional - run before COMMIT)
SELECT '---PHASE 2 CHECK---' as checkpoint;
SELECT
  'scan_audit_logs' as table_name,
  COUNT(*) as remaining_rows
FROM scan_audit_logs
UNION ALL SELECT 'lesson_attendance', COUNT(*) FROM lesson_attendance
UNION ALL SELECT 'absence_records', COUNT(*) FROM absence_records
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'user_kettlebell_points', COUNT(*) FROM user_kettlebell_points
UNION ALL SELECT 'user_group_weekly_presets', COUNT(*) FROM user_group_weekly_presets
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'user_profile_audit_logs', COUNT(*) FROM user_profile_audit_logs
UNION ALL SELECT 'personal_training_schedules', COUNT(*) FROM personal_training_schedules;
-- Expected: 0 rows in each table

-- 🔴 CRITICAL DECISION POINT 🔴
-- Verify all deletions succeeded, then:
COMMIT;  -- Finalize Phase 2 deletions

-- If error detected during execution:
-- ROLLBACK;  -- Undo all Phase 2 deletions and investigate
```

**After PHASE 2:**
- If successful: Continue to Phase 3
- If error: ROLLBACK and check error message

---

## 🟡 PHASE 3: DELETE TRANSACTIONAL DATA

**Duration:** 2-3 minutes  
**Risk:** 🟡 MEDIUM (some cascading relationships)  
**Rollback:** ROLLBACK reverses all Phase 3 changes  
**Irreversible:** YES (after COMMIT)

```sql
-- ============================================================
-- PHASE 3: DELETE TRANSACTIONAL DATA
-- ============================================================
-- These tables contain booking/transaction records
-- Some have CASCADE relationships (e.g., bookings → qr_codes)
-- Total impact: ~3,000-8,000 rows

BEGIN;  -- Start transaction

-- Delete 1: pilates_bookings
-- May have cascade to related tables
DELETE FROM pilates_bookings;
-- Expected output: DELETE X rows

-- Delete 2: lesson_bookings
-- Has trigger: trigger_update_deposit_on_booking (SHOULD BE DISABLED)
-- May cascade to lesson_attendance (already deleted in Phase 2)
DELETE FROM lesson_bookings;
-- Expected output: DELETE X rows

-- Delete 3: qr_codes
-- Has FK constraint from scan_audit_logs (already deleted in Phase 2)
DELETE FROM qr_codes;
-- Expected output: DELETE X rows

-- Delete 4: bookings
-- May have CASCADE to other tables
DELETE FROM bookings;
-- Expected output: DELETE X rows

-- Delete 5: payments
-- May reference memberships (not deleted yet)
DELETE FROM payments;
-- Expected output: DELETE X rows

-- Delete 6: personal_training_codes
-- References user_profiles.created_by, user_profiles.used_by
-- These FK set to SET NULL, so safe to delete
DELETE FROM personal_training_codes;
-- Expected output: DELETE X rows

-- Delete 7: group_assignments
-- References user_profiles and group_schedule_templates
-- user_profiles FK will CASCADE
DELETE FROM group_assignments;
-- Expected output: DELETE X rows

-- Subtotal check (optional - run before COMMIT)
SELECT '---PHASE 3 CHECK---' as checkpoint;
SELECT
  'pilates_bookings' as table_name,
  COUNT(*) as remaining_rows
FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'qr_codes', COUNT(*) FROM qr_codes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'personal_training_codes', COUNT(*) FROM personal_training_codes
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments;
-- Expected: 0 rows in each table

-- 🔴 CRITICAL DECISION POINT 🔴
-- Verify all deletions succeeded, then:
COMMIT;  -- Finalize Phase 3 deletions

-- If error detected during execution:
-- ROLLBACK;  -- Undo all Phase 3 deletions and investigate
```

**After PHASE 3:**
- If successful: Continue to Phase 4
- If error: ROLLBACK and check error message

---

## 🟠 PHASE 4: DELETE SUBSCRIPTION DATA

**Duration:** 1-2 minutes  
**Risk:** 🟠 MEDIUM-HIGH (cascades to user data)  
**Rollback:** ROLLBACK reverses all Phase 4 changes  
**Irreversible:** YES (after COMMIT)

```sql
-- ============================================================
-- PHASE 4: DELETE SUBSCRIPTION DATA
-- ============================================================
-- These tables contain membership and deposit records
-- Has cascades and triggers (SHOULD BE DISABLED)
-- Order matters: requests → memberships → deposits
-- Total impact: ~1,000-3,000 rows

BEGIN;  -- Start transaction

-- Delete 1: membership_requests (no cascade to user_profiles yet)
-- This deletes approval workflow records
DELETE FROM membership_requests;
-- Expected output: DELETE X rows

-- Delete 2: memberships
-- Has multiple triggers (DISABLED):
--   - trigger_membership_is_active
--   - trigger_link_pilates_to_membership
--   - trigger_auto_expire_ultimate
-- May cascade to membership_logs (will be cascade-deleted)
DELETE FROM memberships;
-- Expected output: DELETE X rows

-- Delete 3: pilates_deposits
-- Has trigger: trigger_link_pilates_to_membership (DISABLED)
-- Foreign key: membership_id (ON DELETE SET NULL - safe)
-- Foreign key: user_id (ON DELETE CASCADE - will cascade to children)
-- Foreign key: created_by (ON DELETE SET NULL - safe)
DELETE FROM pilates_deposits;
-- Expected output: DELETE X rows

-- Subtotal check (optional - run before COMMIT)
SELECT '---PHASE 4 CHECK---' as checkpoint;
SELECT
  'membership_requests' as table_name,
  COUNT(*) as remaining_rows
FROM membership_requests
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'membership_logs', COUNT(*) FROM membership_logs;
-- Expected: 0 rows (membership_logs may be 0 or more depending on cascade)

-- 🔴 CRITICAL DECISION POINT 🔴
-- Verify all deletions succeeded, then:
COMMIT;  -- Finalize Phase 4 deletions

-- If error detected during execution:
-- ROLLBACK;  -- Undo all Phase 4 deletions and investigate
```

**After PHASE 4:**
- If successful: Continue to Phase 5 (FINAL LARGE CASCADE)
- If error: ROLLBACK and check error message

---

## 🔴 PHASE 5: DELETE USER PROFILES (MASSIVE CASCADE)

**Duration:** 3-5 minutes  
**Risk:** 🔴 CRITICAL (cascades to 10+ dependent tables)  
**Rollback:** ROLLBACK reverses Phase 5 changes (but takes longer)  
**Irreversible:** YES (after COMMIT) - **POINT OF NO RETURN**

```sql
-- ============================================================
-- PHASE 5: DELETE USER PROFILES (MASSIVE CASCADE)
-- ============================================================
-- 🔴 WARNING: POINT OF NO RETURN
-- Single DELETE will cascade to 10+ dependent tables
-- Total impact: ~150-300 rows in user_profiles
-- Cascading impact: ~5,000+ rows in dependent tables
-- 
-- Dependent tables that will CASCADE-DELETE:
--   1. memberships (FK user_id ON DELETE CASCADE)
--   2. membership_requests (FK user_id ON DELETE CASCADE)
--   3. pilates_deposits (FK user_id ON DELETE CASCADE)
--   4. pilates_bookings (FK user_id ON DELETE CASCADE)
--   5. lesson_bookings (FK user_id ON DELETE CASCADE)
--   6. lesson_attendance (FK user_id ON DELETE CASCADE)
--   7. payments (FK user_id ON DELETE CASCADE)
--   8. bookings (FK user_id ON DELETE CASCADE)
--   9. group_assignments (FK user_id ON DELETE CASCADE)
--   10. personal_training_codes (FK created_by/used_by ON DELETE CASCADE)
--   11. And more...

BEGIN;  -- Start transaction

-- ⚠️ FINAL WARNING: This deletes all user accounts
-- After COMMIT, there is NO UNDO except restore from backup

DELETE FROM user_profiles;
-- Expected output: DELETE X rows
-- CRITICAL: This will cascade to delete 10+ dependent tables automatically

-- Verification (run BEFORE COMMIT to review impact)
SELECT '---PHASE 5 CHECK---' as checkpoint;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows
FROM user_profiles
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'membership_requests', COUNT(*) FROM membership_requests
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'pilates_bookings', COUNT(*) FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments;
-- Expected: 0 rows in ALL user-related tables

-- 🔴 POINT OF NO RETURN 🔴
-- If all checks pass and counts are 0:
COMMIT;  -- Finalize Phase 5 deletions
-- CANNOT BE UNDONE - Only recovery is restore from backup

-- If anything looks wrong:
-- ROLLBACK;  -- Undo Phase 5 and investigate
```

**After PHASE 5:**
- If COMMIT successful: All user data is permanently deleted
- If error: ROLLBACK and investigate (database will be intact)
- Next: Proceed to Phase 6 (POST-DELETION VERIFICATION)

---

## ✅ PHASE 6: POST-DELETION VERIFICATION

**Duration:** 2-3 minutes  
**Risk:** 🟢 NONE (read-only verification)  
**Irreversible:** No (informational only)

```sql
-- ============================================================
-- PHASE 6: POST-DELETION VERIFICATION
-- ============================================================
-- Confirm all deletions were successful
-- Confirm protected tables are intact
-- Confirm database is in expected state

SELECT 'PHASE 6: POST-DELETION VERIFICATION' as phase_marker;

-- Verification 1: All user-generated data removed
SELECT 'USER-GENERATED DATA VERIFICATION:' as check_type;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_deposits
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_bookings
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_bookings
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_attendance
UNION ALL SELECT
  'bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM bookings
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM qr_codes
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM scan_audit_logs
UNION ALL SELECT
  'payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM referrals
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_kettlebell_points
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_group_weekly_presets
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM audit_logs
UNION ALL SELECT
  'user_profile_audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_profile_audit_logs
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_codes
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_schedules
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM group_assignments
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_logs
ORDER BY remaining_rows DESC;

-- Verification 2: Protected tables are INTACT
SELECT 'PROTECTED TABLES VERIFICATION:' as check_type;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM pilates_schedule_slots
ORDER BY row_count DESC;

-- Verification 3: Check for orphaned records (acceptable after CASCADE deletes)
SELECT 'ORPHANED RECORDS CHECK:' as check_type;
SELECT
  'pilates_deposits.membership_id' as potential_orphan,
  COUNT(*) as orphaned_count
FROM pilates_deposits
WHERE membership_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.id = pilates_deposits.membership_id
  )
UNION ALL SELECT
  'personal_training_codes.used_by',
  COUNT(*)
FROM personal_training_codes
WHERE used_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = personal_training_codes.used_by
  )
UNION ALL SELECT
  'personal_training_codes.created_by',
  COUNT(*)
FROM personal_training_codes
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = personal_training_codes.created_by
  );
-- Expected: Small numbers or 0 (SET NULL cleaned these up)

-- Verification 4: Database is ready for new users
SELECT 'DATABASE READINESS CHECK:' as check_type;
SELECT
  'User accounts deleted' as check_item,
  COUNT(*) as user_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ READY' ELSE '⚠️ WARNING' END as status
FROM user_profiles
UNION ALL SELECT
  'Memberships cleared',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ READY' ELSE '⚠️ WARNING' END
FROM memberships
UNION ALL SELECT
  'Bookings cleared',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ READY' ELSE '⚠️ WARNING' END
FROM lesson_bookings
UNION ALL SELECT
  'System config preserved',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ READY' ELSE '❌ ERROR' END
FROM membership_packages;

-- Verification 5: Database integrity check
SELECT 'DATABASE INTEGRITY CHECK:' as check_type;
SELECT
  'auth.users count' as check_item,
  COUNT(*) as auth_users,
  'Verify: Supabase auth users still exist (not deleted by CASCADE)' as note
FROM auth.users;
-- Expected: Auth users should still exist (only user_profiles deleted, not auth.users)
```

**Expected Results:**
- ✅ All user-generated tables: 0 rows
- ✅ All protected tables: intact with original row counts
- ✅ No constraint violations
- ✅ Database ready for new users

---

## 📊 ROLLBACK PROCEDURES

### If Error Occurs During Phase 2-5

```sql
-- IMMEDIATE ACTION: ROLLBACK current transaction
ROLLBACK;

-- This will undo ALL changes since the last BEGIN in that phase
-- Database returns to state BEFORE that phase started
-- No data is lost, all previous phases remain committed
```

### If Phase 1-2 Succeeded But Phase 3 Failed

```sql
-- Phase 2 already committed (leaf nodes deleted)
-- Phase 3 failed (transactional data not deleted)
-- Option 1: ROLLBACK Phase 3, restore from backup, retry
-- Option 2: ROLLBACK Phase 3, investigate error, fix, retry Phase 3

ROLLBACK;  -- Undo Phase 3 only
-- Phase 2 deletions remain committed

-- After investigating:
BEGIN;  -- Restart Phase 3
-- [Run Phase 3 DELETE statements again]
COMMIT;  -- If successful
```

### If Phase 5 Failed (User Profiles)

```sql
-- CRITICAL: User profiles may be partially deleted
-- Cascade to dependent tables may be incomplete

ROLLBACK;  -- Undo Phase 5 immediately

-- Check current state:
SELECT COUNT(*) FROM user_profiles;
-- If > 0: Some profiles survived, check error message
-- If = 0: All deleted but cascade incomplete, restore from backup

-- If < 10 profiles remain:
-- DELETE FROM user_profiles WHERE [condition];  -- Finish deletion manually
COMMIT;
```

### Full Restoration from Backup

```sql
-- If ANY phase fails and you cannot recover:
-- 1. ROLLBACK current transaction
ROLLBACK;

-- 2. Contact DevOps/Database Admin
-- 3. Restore from backup taken before Step 4 execution
-- 4. Retry from Step 4 Phase 1 after restore
```

---

## ⏱️ EXECUTION TIMELINE

| Phase | Duration | Cumulative | Risk | Action |
|-------|----------|-----------|------|--------|
| 1. Baseline Counts | 1-2 min | 1-2 min | 🟢 NONE | Record row counts |
| 2. Leaf Nodes | 1-2 min | 2-4 min | 🟡 MED | DELETE (simple) |
| 3. Transactional Data | 2-3 min | 4-7 min | 🟡 MED | DELETE (cascades) |
| 4. Subscription Data | 1-2 min | 5-9 min | 🟠 MED-HIGH | DELETE (triggers) |
| 5. User Profiles | 3-5 min | 8-14 min | 🔴 CRIT | DELETE (massive cascade) |
| 6. Post-Verification | 2-3 min | 10-17 min | 🟢 NONE | Verify success |
| **TOTAL** | — | **10-17 min** | — | — |

---

## 🎯 GO/NO-GO FINAL CHECKLIST

Before executing ANY SQL, confirm:

```
✅ Backup taken and verified (< 30 min old)
✅ weekly-pilates-refill.yml DISABLED
✅ 4 business logic triggers DISABLED
✅ Stakeholders notified
✅ Read-only database is target (not production)
✅ User has DBA access to Supabase
✅ This document is open for reference
✅ ROLLBACK procedure is understood
✅ POINT OF NO RETURN (Phase 5) is understood
```

---

## 🔐 NEXT STEPS

### Step 4 Execution (You Are Here)
1. ✅ Review this entire document
2. ⏳ Execute Phase 1 (baseline counts)
3. ⏳ Execute Phase 2-5 (deletions) with verification between each
4. ⏳ Execute Phase 6 (post-verification)
5. ⏳ Document results and final row counts

### Step 5: Production Execution
- Only after Step 4 succeeds on backup database
- Use same SQL scripts (no changes needed)
- Execute on production database with verified backup
- Monitor execution and verify results

### Step 6: Verification & Signoff
- Confirm system functionality after reset
- Verify API connectivity
- Test user registration
- Re-enable weekly-pilates-refill.yml workflow
- Re-enable business logic triggers
- Notify stakeholders of completion

---

## 📝 EXECUTION LOG TEMPLATE

Use this to document your execution:

```
EXECUTION START TIME: _______________
EXECUTOR NAME: _______________
TARGET DATABASE: _______________

PHASE 1 BASELINE:
- user_profiles count: _____
- memberships count: _____
- lesson_bookings count: _____
- Total rows to delete (estimated): _____

PHASE 2: LEAF NODES
- Start time: _____
- scan_audit_logs deleted: _____ rows
- lesson_attendance deleted: _____ rows
- [etc for all 9 tables]
- Status: ✅ SUCCESS / ❌ FAILED

PHASE 3: TRANSACTIONAL DATA
- Start time: _____
- Status: ✅ SUCCESS / ❌ FAILED

PHASE 4: SUBSCRIPTION DATA
- Start time: _____
- Status: ✅ SUCCESS / ❌ FAILED

PHASE 5: USER PROFILES (POINT OF NO RETURN)
- Start time: _____
- user_profiles deleted: _____ rows
- Status: ✅ SUCCESS / ❌ FAILED

PHASE 6: POST-VERIFICATION
- user_profiles remaining: 0 ✅
- membership_packages remaining: _____ ✅
- Database ready: ✅ YES
- Final status: ✅ COMPLETE

EXECUTION END TIME: _______________
TOTAL DURATION: _______________
ISSUES ENCOUNTERED: _______________
```

---

**Document Status:** READY FOR MANUAL HUMAN EXECUTION  
**Authority:** Database engineer with DBA access  
**Date:** January 30, 2026  
**No automatic execution. Manual copy-paste to Supabase SQL Editor required.**
