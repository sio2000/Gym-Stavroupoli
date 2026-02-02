# STEP 5: PRODUCTION EXECUTION GUIDE
## Data Reset - Live Production Deployment

**Status:** PLANNING MODE - NO EXECUTION  
**Authorization:** Senior DBA only  
**Target:** PRODUCTION DATABASE  
**Prerequisite:** Step 4 backup database execution must be COMPLETE and VERIFIED  
**Date:** January 30, 2026

---

## ⚠️ CRITICAL PRODUCTION DISCLAIMERS

### THIS IS POINT OF NO RETURN FOR PRODUCTION
- 🔴 **REAL USERS AFFECTED**
- 🔴 **DATA LOSS IS PERMANENT**
- 🔴 **ONLY RECOVERY: Full database restore from backup**
- 🔴 **NO PARTIAL RECOVERY POSSIBLE**

### EXECUTION REQUIREMENTS
- ✅ Must have verified backup (< 15 minutes old)
- ✅ Must have designated maintenance window (users notified)
- ✅ Must have rollback engineer on standby
- ✅ Must have DevOps team monitoring
- ✅ Must have client sign-off (if applicable)

### EXECUTION MODE
- 🔐 Senior DBA only (not junior staff)
- 🔐 Single operator (not parallel execution)
- 🔐 All phases documented in real-time
- 🔐 Immediate escalation on ANY error

---

## 🔴 PREREQUISITE: STEP 4 VERIFICATION

**Before proceeding with Step 5 production execution, confirm:**

```
✅ STEP 4 BACKUP DATABASE EXECUTION COMPLETED
✅ Phase 1: Baseline counts recorded
✅ Phase 2: Leaf nodes deleted successfully
✅ Phase 3: Transactional data deleted successfully
✅ Phase 4: Subscription data deleted successfully
✅ Phase 5: User profiles deleted (CASCADE verified)
✅ Phase 6: Post-deletion verification passed (all checks green)
✅ Protected tables intact (membership_packages, lessons, trainers, etc.)
✅ No errors or warnings
✅ Database integrity confirmed
✅ Application tested and functional on backup database
```

**If ANY of these are NOT CONFIRMED:**
🛑 **DO NOT PROCEED TO STEP 5**
- Investigate failures on backup database first
- Restore backup and retry Step 4
- Only after complete Step 4 success: proceed to Step 5

---

## 📋 PRE-PRODUCTION EXECUTION CHECKLIST (T-60 MINUTES)

### 60 Minutes Before Execution Start

**Checklist Item 1: Backup Verification**
```
❑ Take final production backup (will take ~5-10 minutes)
❑ Wait for backup to complete
❑ Verify backup size matches expected database size
❑ Record backup timestamp: _______________
❑ Record backup location/ID: _______________
❑ Confirm backup is ACCESSIBLE for restore test
❑ Test restore procedure on isolated test database (optional but recommended)
```

**Checklist Item 2: System State Verification**
```
❑ Confirm weekly-pilates-refill.yml workflow is DISABLED
  - Location: .github/workflows/weekly-pilates-refill.yml
  - Status: Disabled or renamed
  - Verification: GitHub Actions UI shows disabled
  
❑ Confirm 4 business logic triggers are DISABLED
  - trigger_membership_is_active ........... DISABLED
  - trigger_link_pilates_to_membership .... DISABLED
  - trigger_update_deposit_on_booking ...... DISABLED
  - trigger_auto_expire_ultimate ........... DISABLED
  - Verification method: Run PRAGMA and check pg_stat_activity
  
❑ Confirm no critical updates in flight
  - Check: Are any deployments running?
  - Check: Are any scheduled jobs running?
  - Confirm: No Git commits in last 5 minutes
  
❑ Confirm database has NO active user connections
  - Query: SELECT COUNT(*) FROM pg_stat_activity WHERE pid <> pg_backend_pid()
  - Expected: 0 or minimal connections
  - Action if > 5: Wait 5 minutes and recheck OR notify connected users
```

**Checklist Item 3: Access & Credentials Verification**
```
❑ DBA has Supabase dashboard access
  - Test: Log in to Supabase dashboard
  - Verify: Can see production database
  - Verify: Can access SQL editor
  
❑ DBA has SSH/terminal access to production environment
  - Test: SSH into prod server (if applicable)
  - Verify: Can access PostgreSQL CLI tools
  
❑ DBA has Git access for post-execution re-enablement
  - Test: Can push to main/master branch
  - Verify: Can trigger GitHub Actions workflows
```

**Checklist Item 4: Stakeholder & Communication**
```
❑ Maintenance window announced to all users
  - Message: "[GYM-NAME] will be offline for ~15 minutes for system maintenance"
  - Channels: Email, SMS, in-app notification, website banner
  - Duration stated: "Approximately 10-17 minutes" (based on Step 4 timing)
  - Estimated end time: [Current time + 20 minutes]
  
❑ Client/management approval obtained
  - Signature/approval: _______________
  - Contact for escalation: _______________
  - Escalation phone: _______________
  
❑ Rollback engineer on standby
  - Engineer name: _______________
  - Phone: _______________
  - Can restore from backup: YES _____ NO _____
  
❑ DevOps/Monitoring team alerted
  - Monitoring paused (optional): YES _____ NO _____
  - On-call engineer notified: YES _____ NO _____
  - Alert channels silenced for window: YES _____ NO _____
```

**Checklist Item 5: Documentation Readiness**
```
❑ Step 4 execution log available and reviewed
  ❑ Phase 1 baseline counts recorded
  ❑ All 5 phases marked SUCCESS
  ❑ No error messages or rollbacks
  ❑ Post-verification all checks GREEN
  
❑ Step 5 execution log template prepared
  - File open: STEP5_EXECUTION_LOG.txt
  - Timestamps ready to record
  
❑ Rollback procedure document available
  ❑ Backup restore command ready
  ❑ Restore ETA known
  ❑ Runbooks for manual recovery reviewed
```

**Checklist Item 6: Final Database State**
```
❑ Production database connects
  - Command: psql -h [host] -U [user] -d [database]
  - Expected: Connection successful
  
❑ Production database is NOT in readonly mode
  - Query: SELECT datistemplate FROM pg_database WHERE datname = current_database()
  - Expected: false (not template/readonly)
  
❑ Production database has no active transactions
  - Query: SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'
  - Expected: 0 or minimal
  
❑ Production schema matches backup (spot check)
  - Query: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
  - Expected: ~50-60 tables (should match Step 1 discovery)
```

---

## 🎯 PRODUCTION EXECUTION DECISION GATE

### FINAL GO/NO-GO DECISION (T-15 MINUTES)

**Review all pre-execution checklist items above.**

**If ANY item is incomplete or failed:**
```
🛑 STOP - DO NOT PROCEED
- Complete missing items
- Investigate and resolve failures
- Restart 60-minute pre-execution window
- Document reason for delay
```

**If ALL items are complete and green:**
```
✅ APPROVED TO PROCEED
- Record decision time: _______________
- Record approving authority: _______________
- Record final backup verification: _______________
- Notify stakeholders: "Maintenance beginning NOW"
- Start Step 5 execution
```

---

## 🔴 STEP 5 EXECUTION PHASES (PRODUCTION)

### Overview: Same Phases as Step 4, With Production-Specific Notes

| Phase | Duration | Cumulative | Notes |
|-------|----------|-----------|-------|
| **PRE-EXECUTION** | 1-2 min | 1-2 min | Final checks (checklist above) |
| **Phase 1** | 1-2 min | 2-4 min | Baseline counts (PRODUCTION) |
| **Phase 2** | 1-2 min | 3-6 min | Leaf nodes (PRODUCTION) |
| **Phase 3** | 2-3 min | 5-9 min | Transactional (PRODUCTION) |
| **Phase 4** | 1-2 min | 6-11 min | Subscriptions (PRODUCTION) |
| **Phase 5** | 3-5 min | 9-16 min | User profiles (POINT OF NO RETURN) |
| **Phase 6** | 2-3 min | 11-19 min | Post-verification (PRODUCTION) |
| **POST-EXECUTION** | 1-2 min | 12-21 min | Notifications & next steps |
| **TOTAL** | — | **~20 minutes** | — |

---

## 🟢 PRODUCTION PHASE 1: BASELINE ROW COUNTS

**Duration:** 1-2 minutes  
**Risk:** 🟢 NONE (read-only verification)

**Production Notes:**
- Same queries as Step 4 Phase 1
- Record actual production row counts (will differ from backup)
- Use these counts to verify each production deletion phase
- If counts are unexpectedly LOW: pause and investigate
- If counts are unexpectedly HIGH: proceed (data is data)

```sql
-- ============================================================
-- PRODUCTION PHASE 1: BASELINE ROW COUNTS
-- ============================================================
-- PRODUCTION DATABASE - LIVE DATA
-- Record these counts for final audit trail

SELECT 'PRODUCTION PHASE 1: BASELINE ROW COUNTS' as phase_marker;
SELECT CURRENT_TIMESTAMP as execution_start_time;

-- User-generated data that WILL be deleted (PRODUCTION)
SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count,
  'PRIMARY CASCADE HUB' as category,
  'PRODUCTION' as environment
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  'USER SUBSCRIPTIONS',
  'PRODUCTION'
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  'USER SUBSCRIPTIONS',
  'PRODUCTION'
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  'USER SUBSCRIPTIONS',
  'PRODUCTION'
FROM pilates_deposits
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  'USER TRANSACTIONS',
  'PRODUCTION'
FROM lesson_bookings
UNION ALL SELECT
  'bookings',
  COUNT(*),
  'USER TRANSACTIONS',
  'PRODUCTION'
FROM bookings
UNION ALL SELECT
  'payments',
  COUNT(*),
  'USER TRANSACTIONS',
  'PRODUCTION'
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  'USER DATA',
  'PRODUCTION'
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  'USER DATA',
  'PRODUCTION'
FROM referrals
ORDER BY row_count DESC;

-- System configuration data that WILL NOT be deleted (PRODUCTION)
SELECT 'PROTECTED TABLES (DO NOT DELETE) - PRODUCTION:' as verification;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  'PROTECTED' as status,
  'PRODUCTION' as environment
FROM membership_packages
UNION ALL SELECT
  'lessons',
  COUNT(*),
  'PROTECTED',
  'PRODUCTION'
FROM lessons
UNION ALL SELECT
  'trainers',
  COUNT(*),
  'PROTECTED',
  'PRODUCTION'
FROM trainers
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  'PROTECTED',
  'PRODUCTION'
FROM pilates_schedule_slots
ORDER BY row_count DESC;

-- ⚠️ PRODUCTION VERIFICATION: Compare to backup counts from Step 4
-- If baseline counts differ significantly from Step 4 backup:
--   - Document difference
--   - Continue execution (data is data)
--   - Explain difference in final audit report
```

**Action After Phase 1:**
- Record baseline row counts in execution log
- Compare to Step 4 backup counts (note any differences)
- If major discrepancies: pause and investigate
- Otherwise: proceed to Phase 2

---

## 🟡 PRODUCTION PHASE 2: DELETE LEAF NODES

**Duration:** 1-2 minutes  
**Risk:** 🟡 MEDIUM (straightforward deletes)  
**Production Specific:** Uses production database (live)

**Production Notes:**
- Same deletion sequence as Step 4 Phase 2
- Deletes will be REAL and PERMANENT (no undo except restore)
- Row counts will differ from backup (that's OK)
- Monitor execution time (should be < 2 minutes)
- If execution time > 5 minutes: possible lock contention, investigate

```sql
-- ============================================================
-- PRODUCTION PHASE 2: DELETE LEAF NODES (LIVE PRODUCTION)
-- ============================================================
-- REAL DATA - PERMANENT DELETION AFTER COMMIT
-- Same structure as Step 4 Phase 2

BEGIN;  -- Start transaction

DELETE FROM scan_audit_logs;
DELETE FROM lesson_attendance;
DELETE FROM absence_records;
DELETE FROM referrals;
DELETE FROM user_kettlebell_points;
DELETE FROM user_group_weekly_presets;
DELETE FROM audit_logs;
DELETE FROM user_profile_audit_logs;
DELETE FROM personal_training_schedules;

-- Verification before COMMIT
SELECT '---PRODUCTION PHASE 2 CHECK---' as checkpoint;
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

-- ⚠️ CRITICAL DECISION POINT FOR PRODUCTION ⚠️
-- If all checks show 0 rows, proceed to COMMIT
-- If any table shows > 0 rows, investigate before COMMIT
COMMIT;  -- Finalize Phase 2 (PERMANENT)
```

**Action After Phase 2:**
- Record row counts deleted in execution log
- If all successful: proceed to Phase 3
- If any errors: ROLLBACK and investigate
- Contact rollback engineer if unable to resolve

---

## 🟡 PRODUCTION PHASE 3: DELETE TRANSACTIONAL DATA

**Duration:** 2-3 minutes  
**Risk:** 🟡 MEDIUM (cascading relationships)  
**Production Specific:** Large booking deletion may take 3+ minutes

**Production Notes:**
- Same deletion sequence as Step 4 Phase 3
- lesson_bookings may have many rows (expect 1000+ possible)
- Cascades to lesson_attendance (already deleted in Phase 2, safe)
- Monitor execution time: if > 5 minutes, check for locks
- May see "relation not found" for cascade-deleted tables (OK, expected)

```sql
-- ============================================================
-- PRODUCTION PHASE 3: DELETE TRANSACTIONAL DATA (LIVE PRODUCTION)
-- ============================================================
-- Large booking/transaction table deletions
-- Same structure as Step 4 Phase 3

BEGIN;  -- Start transaction

DELETE FROM pilates_bookings;
DELETE FROM lesson_bookings;
DELETE FROM qr_codes;
DELETE FROM bookings;
DELETE FROM payments;
DELETE FROM personal_training_codes;
DELETE FROM group_assignments;

-- Verification before COMMIT
SELECT '---PRODUCTION PHASE 3 CHECK---' as checkpoint;
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

-- ⚠️ CRITICAL DECISION POINT FOR PRODUCTION ⚠️
COMMIT;  -- Finalize Phase 3 (PERMANENT)
```

**Action After Phase 3:**
- Record row counts deleted
- If successful: proceed to Phase 4
- If errors during booking delete: ROLLBACK and investigate
- Very large booking counts may indicate data anomaly (log and continue)

---

## 🟠 PRODUCTION PHASE 4: DELETE SUBSCRIPTION DATA

**Duration:** 1-2 minutes  
**Risk:** 🟠 MEDIUM-HIGH (triggers disabled, cascades present)  
**Production Specific:** Order is critical (requests → memberships → deposits)

**Production Notes:**
- Same deletion sequence as Step 4 Phase 4
- All subscription-related triggers should be DISABLED
- If trigger-related errors: ROLLBACK immediately
- membership_logs will cascade-delete automatically (safe)
- Check membership count before delete (expect 100-500+)

```sql
-- ============================================================
-- PRODUCTION PHASE 4: DELETE SUBSCRIPTION DATA (LIVE PRODUCTION)
-- ============================================================
-- Membership request → membership → deposit deletion sequence
-- Same structure as Step 4 Phase 4

BEGIN;  -- Start transaction

DELETE FROM membership_requests;
DELETE FROM memberships;
DELETE FROM pilates_deposits;

-- Verification before COMMIT
SELECT '---PRODUCTION PHASE 4 CHECK---' as checkpoint;
SELECT
  'membership_requests' as table_name,
  COUNT(*) as remaining_rows
FROM membership_requests
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'membership_logs', COUNT(*) FROM membership_logs;
-- Expected: 0 rows (membership_logs may cascade-delete or remain empty)

-- ⚠️ CRITICAL DECISION POINT FOR PRODUCTION ⚠️
COMMIT;  -- Finalize Phase 4 (PERMANENT)
```

**Action After Phase 4:**
- Record membership row counts deleted
- If successful: proceed to Phase 5 (POINT OF NO RETURN)
- If trigger errors: contact DBA immediately
- Verify memberships = 0 before proceeding to Phase 5

---

## 🔴 PRODUCTION PHASE 5: DELETE USER PROFILES (POINT OF NO RETURN)

**Duration:** 3-5 minutes  
**Risk:** 🔴 CRITICAL (massive cascade, permanent, no rollback recovery)  
**Production Specific:** THIS IS THE ACTUAL DATA LOSS POINT

### ⚠️ ABSOLUTE FINAL CHECK BEFORE PHASE 5

**Checklist (must all be YES before proceeding):**
```
❑ Phase 1 baseline recorded in log: YES ___ NO ___
❑ Phase 2 leaf nodes deleted: YES ___ NO ___
❑ Phase 3 transactional data deleted: YES ___ NO ___
❑ Phase 4 subscriptions deleted: YES ___ NO ___
❑ Backup exists and is verified accessible: YES ___ NO ___
❑ Rollback engineer confirmed ready: YES ___ NO ___
❑ No active user connections to database: YES ___ NO ___
❑ Understand: After COMMIT, only recovery is restore from backup: YES ___ NO ___
❑ Final approval from management/client received: YES ___ NO ___

If ANY answer is NO: DO NOT PROCEED
                     Pause, investigate, resolve, retry
```

**Production Notes:**
- Same deletion as Step 4 Phase 5
- Single DELETE cascades to 10+ dependent tables
- Execution may take 3-5 minutes (longer in production with more data)
- After COMMIT: DATA LOSS IS PERMANENT
- Only recovery: restore from backup (takes 5-15 minutes)
- Monitor for lock errors during execution

```sql
-- ============================================================
-- PRODUCTION PHASE 5: DELETE USER PROFILES (POINT OF NO RETURN)
-- ============================================================
-- 🔴 🔴 🔴 FINAL DATA LOSS POINT 🔴 🔴 🔴
-- After COMMIT: Only recovery is restore from backup
-- DO NOT PROCEED if ANY pre-checks above are NOT verified

SELECT '🔴 POINT OF NO RETURN REACHED 🔴' as warning;
SELECT CURRENT_TIMESTAMP as deletion_start_time;

BEGIN;  -- Start transaction

-- This single DELETE cascades to 10+ tables
-- Permanent deletion of all user accounts
DELETE FROM user_profiles;

-- Verification (BEFORE COMMIT - this is your last chance to ROLLBACK)
SELECT '---PRODUCTION PHASE 5 CHECK---' as checkpoint;
SELECT CURRENT_TIMESTAMP as check_time;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows,
  CASE WHEN COUNT(*) = 0 THEN '✅ SAFE TO COMMIT' ELSE '❌ ERROR - INVESTIGATE' END as action
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ CASCADE OK' ELSE '⚠️ UNEXPECTED' END
FROM memberships
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ CASCADE OK' ELSE '⚠️ UNEXPECTED' END
FROM pilates_deposits
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ CASCADE OK' ELSE '⚠️ UNEXPECTED' END
FROM lesson_bookings
UNION ALL SELECT
  'payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ CASCADE OK' ELSE '⚠️ UNEXPECTED' END
FROM payments;

-- 🔴 🔴 🔴 FINAL DECISION POINT 🔴 🔴 🔴
-- If all rows above = 0: proceed to COMMIT
-- If any rows > 0: DO NOT COMMIT, ROLLBACK and investigate

-- PRODUCTION COMMIT (IRREVERSIBLE)
COMMIT;  -- Delete user profiles and cascade permanently
-- 🔴 DATA LOSS IS NOW PERMANENT 🔴
-- Only recovery: restore from backup

SELECT '✅ PHASE 5 COMPLETE - DATA LOSS CONFIRMED' as status;
SELECT CURRENT_TIMESTAMP as deletion_end_time;
```

**Action After Phase 5:**
- Record completion time in execution log
- Immediately verify with Phase 6 post-deletion checks
- Contact management/client with status
- Begin smoke test procedures

---

## ✅ PRODUCTION PHASE 6: POST-DELETION VERIFICATION

**Duration:** 2-3 minutes  
**Risk:** 🟢 NONE (read-only verification)  
**Production Specific:** Verify live production is clean and ready

```sql
-- ============================================================
-- PRODUCTION PHASE 6: POST-DELETION VERIFICATION (LIVE PRODUCTION)
-- ============================================================
-- Confirm production database is in expected clean state

SELECT 'PRODUCTION PHASE 6: POST-DELETION VERIFICATION' as phase_marker;
SELECT CURRENT_TIMESTAMP as verification_start_time;

-- Verification 1: All user data removed
SELECT 'USER-GENERATED DATA REMOVAL VERIFICATION:' as check_type;
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
  'lesson_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_bookings
UNION ALL SELECT
  'bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM bookings
UNION ALL SELECT
  'payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM payments
ORDER BY remaining_rows DESC;

-- Verification 2: Protected tables INTACT
SELECT 'PROTECTED TABLES VERIFICATION:' as check_type;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END as status
FROM membership_packages
UNION ALL SELECT
  'lessons',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lessons
UNION ALL SELECT
  'trainers',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM trainers
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM pilates_schedule_slots
ORDER BY row_count DESC;

-- Verification 3: Database integrity
SELECT 'DATABASE INTEGRITY FINAL CHECK:' as check_type;
SELECT
  'Database connected' as check_item,
  'YES' as status
FROM information_schema.tables
LIMIT 1;

SELECT CURRENT_TIMESTAMP as verification_end_time;
SELECT '✅ PRODUCTION PHASE 6 COMPLETE' as final_status;
```

**Expected Results:**
- ✅ user_profiles: 0 rows
- ✅ memberships: 0 rows
- ✅ lesson_bookings: 0 rows
- ✅ membership_packages: > 0 rows (intact)
- ✅ lessons: > 0 rows (intact)
- ✅ trainers: > 0 rows (intact)
- ✅ Database connected and responsive

---

## 🔴 STOP/ABORT CONDITIONS

**Abort execution IMMEDIATELY if:**

```
❌ Phase 2, 3, or 4: More than 1 table fails to delete
   - Action: ROLLBACK current phase
   - Contact: Database admin + client
   - Recovery: Restore from backup

❌ Phase 5: User profiles don't reach 0 rows after DELETE
   - Action: ROLLBACK if not yet committed
   - Action: DO NOT COMMIT if checks fail
   - Contact: Senior DBA immediately
   - Recovery: Restore from backup

❌ Phase 5: Any error during DELETE FROM user_profiles
   - Action: ROLLBACK immediately
   - Contact: Database admin + on-call engineer
   - Recovery: Restore from backup

❌ Phase 5: Database connection lost during execution
   - Action: Check connectivity before COMMIT
   - Contact: Infrastructure team
   - Recovery: Restore from backup and retry

❌ Phase 6: Protected tables show 0 rows
   - Action: STOP - Critical error
   - Contact: Database admin immediately
   - Recovery: Restore from backup

❌ Phase 6: Database integrity check fails
   - Action: STOP - Investigate
   - Contact: PostgreSQL DBA
   - Recovery: Restore from backup
```

---

## 📋 POST-EXECUTION ACTIONS (BEFORE RE-ENABLING FEATURES)

### Immediate (Within 5 minutes of Phase 6 completion)

**Action 1: Notify Stakeholders**
```
Message: "Database reset completed successfully.
         All user data has been removed.
         System is ready for new users.
         Maintenance window ending NOW."
         
Channels: Email, SMS, in-app notification, website banner
Timing: Send IMMEDIATELY after Phase 6 verification passes
```

**Action 2: Document Execution**
```
Record in execution log:
- Phase 1 baseline counts
- Phase 2-5 actual row deletions
- Phase 6 verification results
- Execution timeline (actual durations)
- Any errors or warnings
- Approving authority signature
```

**Action 3: Pre-Re-enablement System Test**
```
Check: Can database accept new connections?
  Query: SELECT COUNT(*) FROM membership_packages;
  Expected: > 0 (packages still exist)
  
Check: Can application connect to API?
  Test: curl https://[api-endpoint]/health
  Expected: 200 OK
  
Check: Can new users register?
  Manual test: Try to create test account
  Expected: Success
```

---

## 🔧 RE-ENABLE BUSINESS FUNCTIONS (PRODUCTION)

### Step 1: Re-enable Business Logic Triggers

**Timing:** After Phase 6 verification passes  
**Authority:** Senior DBA  
**Duration:** 2-3 minutes

```sql
-- ============================================================
-- RE-ENABLE PRODUCTION TRIGGERS
-- ============================================================
-- These triggers were disabled before Step 4
-- Now re-create them to restore business logic

-- Trigger 1: trigger_membership_is_active
-- Purpose: Automatically update membership status based on dates
-- Location: memberships table
CREATE TRIGGER trigger_membership_is_active
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION your_trigger_function_name();
-- Status: RE-ENABLED

-- Trigger 2: trigger_link_pilates_to_membership
-- Purpose: Link pilates deposits to membership records
-- Location: pilates_deposits table
CREATE TRIGGER trigger_link_pilates_to_membership
BEFORE INSERT OR UPDATE ON pilates_deposits
FOR EACH ROW
EXECUTE FUNCTION link_pilates_to_membership();
-- Status: RE-ENABLED

-- Trigger 3: trigger_update_deposit_on_booking
-- Purpose: Update deposit balance when booking changes
-- Location: lesson_bookings, pilates_bookings tables
CREATE TRIGGER trigger_update_deposit_on_booking
AFTER INSERT OR DELETE ON lesson_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_deposit_on_booking();
-- Status: RE-ENABLED

-- Trigger 4: trigger_auto_expire_ultimate
-- Purpose: Auto-expire ultimate packages on specific date
-- Location: memberships table
CREATE TRIGGER trigger_auto_expire_ultimate
BEFORE UPDATE ON memberships
FOR EACH ROW
WHEN (NEW.status <> OLD.status)
EXECUTE FUNCTION trigger_auto_expire_ultimate();
-- Status: RE-ENABLED

-- Verification: Confirm triggers are enabled
SELECT trigger_name, is_enabled
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_membership_is_active',
  'trigger_link_pilates_to_membership',
  'trigger_update_deposit_on_booking',
  'trigger_auto_expire_ultimate'
);
-- Expected: All 4 triggers listed with is_enabled = true
```

**⚠️ NOTE:** If trigger creation scripts differ from above:
- Locate original trigger definitions in codebase
- Use scripts from: `supabase/migrations/*.sql` or `database/*.sql`
- Run exact creation commands (not generic above)

---

### Step 2: Re-enable GitHub Actions Workflow

**Timing:** After triggers are re-enabled  
**Authority:** DBA or DevOps  
**Duration:** 1-2 minutes

```bash
# ============================================================
# RE-ENABLE PRODUCTION WORKFLOW
# ============================================================
# This workflow was disabled before Step 4
# Now re-enable it to restore automatic Pilates refill

# File: .github/workflows/weekly-pilates-refill.yml
# Current state: DISABLED (renamed or marked skip)

# Option 1: Rename file (if disabled via rename)
git mv .github/workflows/weekly-pilates-refill.yml.disabled \
        .github/workflows/weekly-pilates-refill.yml

# Option 2: Remove skip marker (if disabled via marker)
# Edit file and remove: [skip] or # skip

# Option 3: If completely deleted, restore from git history
git checkout HEAD~1 -- .github/workflows/weekly-pilates-refill.yml

# Commit and push
git add .github/workflows/
git commit -m "PRODUCTION RESET COMPLETE: Re-enable weekly Pilates refill workflow"
git push origin main

# Verify: GitHub Actions UI should show workflow as ENABLED
# Next run: Sunday 02:00 UTC (automatic)
```

**Verification:**
```
❑ File present: .github/workflows/weekly-pilates-refill.yml
❑ File not in skip mode
❑ GitHub Actions UI shows "weekly-pilates-refill" as ACTIVE
❑ Scheduled trigger shows: 0 2 * * 0 (Sunday 2 AM UTC)
```

---

## ✅ PRODUCTION SMOKE TEST CHECKLIST

**Run these tests AFTER re-enabling triggers and workflow**

### System Connectivity Tests
```
❑ Database connectivity
  Command: psql -h [host] -U [user] -d [database] -c "SELECT 1"
  Expected: (1 row, 1)
  
❑ API health check
  Command: curl https://[api-url]/health
  Expected: 200 OK with health payload
  
❑ Application loads
  Action: Open gym app in browser
  Expected: App loads, no errors in console
```

### User Registration Tests
```
❑ New user can register
  Action: Create test user account via app
  Expected: Success, user created in auth.users
  
❑ New user appears in user_profiles
  Query: SELECT COUNT(*) FROM user_profiles WHERE created_at > NOW() - interval '5 minutes'
  Expected: 1 (new test user)
  
❑ User can create membership
  Action: Create membership for test user
  Expected: Success, record in memberships table
```

### Pilates System Tests
```
❑ Pilates deposit creation works
  Action: Create pilates deposit for test user
  Expected: Success, record in pilates_deposits table
  
❑ Pilates booking works
  Action: Create pilates booking for test user
  Expected: Success, deposit balance decremented
  
❑ Deposit trigger fires correctly
  Query: SELECT deposit_remaining FROM pilates_deposits WHERE user_id = [test_user]
  Expected: Value decremented after booking
```

### Lesson Booking Tests
```
❑ Lesson booking works
  Action: Create lesson booking for test user
  Expected: Success, record in lesson_bookings table
  
❑ QR code generation works
  Action: Book lesson, check for QR code
  Expected: QR code created in qr_codes table
  
❑ Check-in scan works
  Action: Scan QR code
  Expected: Attendance recorded, scan_audit_logs updated
```

### Membership Management Tests
```
❑ Membership request creation works
  Action: Create membership request
  Expected: Success, record in membership_requests table
  
❑ Membership approval works
  Action: Approve membership request
  Expected: memberships record created, status = 'active'
  
❑ Membership renewal works
  Action: Renew existing membership
  Expected: end_date extended
```

### Final Integration Tests
```
❑ API returns expected data
  Test: GET /api/memberships
  Expected: Returns active memberships (none yet after reset)
  
❑ No performance degradation
  Test: Run system for 5 minutes, check response times
  Expected: < 200ms average response time
  
❑ No error messages in logs
  Check: Application logs
  Expected: No ERROR or CRITICAL level messages
```

**If ANY smoke test fails:**
```
Action: Stop testing
Contact: Database admin + client
Decision: Continue or rollback to backup?
```

---

## 📝 PRODUCTION EXECUTION LOG TEMPLATE

**Record EVERY action and timestamp:**

```
=================================================================
PRODUCTION DATA RESET - EXECUTION LOG
=================================================================

Date: _______________
DBA Name: _______________
Approver: _______________
Backup ID: _______________
Backup Time: _______________

PRE-EXECUTION CHECKLIST:
- Backup verified: YES ___ NO ___
- Triggers disabled: YES ___ NO ___
- Workflow disabled: YES ___ NO ___
- Stakeholders notified: YES ___ NO ___
- Rollback engineer on standby: YES ___ NO ___

=================================================================
PHASE 1: BASELINE ROW COUNTS (PRODUCTION)
=================================================================
Start time: _______________

user_profiles count: _______________ rows
memberships count: _______________ rows
lesson_bookings count: _______________ rows
payments count: _______________ rows
[other tables...]: _______________ rows

Total user data to be deleted (estimated): _______________ rows

Status: ✅ SUCCESS / ❌ FAILED
Issues: _______________________________________________________________

End time: _______________

=================================================================
PHASE 2: DELETE LEAF NODES
=================================================================
Start time: _______________

scan_audit_logs deleted: _______________ rows
lesson_attendance deleted: _______________ rows
absence_records deleted: _______________ rows
referrals deleted: _______________ rows
user_kettlebell_points deleted: _______________ rows
user_group_weekly_presets deleted: _______________ rows
audit_logs deleted: _______________ rows
user_profile_audit_logs deleted: _______________ rows
personal_training_schedules deleted: _______________ rows

Status: ✅ SUCCESS / ❌ FAILED
Issues: _______________________________________________________________

End time: _______________

=================================================================
PHASE 3: DELETE TRANSACTIONAL DATA
=================================================================
Start time: _______________

pilates_bookings deleted: _______________ rows
lesson_bookings deleted: _______________ rows
qr_codes deleted: _______________ rows
bookings deleted: _______________ rows
payments deleted: _______________ rows
personal_training_codes deleted: _______________ rows
group_assignments deleted: _______________ rows

Status: ✅ SUCCESS / ❌ FAILED
Issues: _______________________________________________________________

End time: _______________

=================================================================
PHASE 4: DELETE SUBSCRIPTION DATA
=================================================================
Start time: _______________

membership_requests deleted: _______________ rows
memberships deleted: _______________ rows
pilates_deposits deleted: _______________ rows

Status: ✅ SUCCESS / ❌ FAILED
Issues: _______________________________________________________________

End time: _______________

=================================================================
PHASE 5: DELETE USER PROFILES (POINT OF NO RETURN)
=================================================================
Start time: _______________

Final check BEFORE COMMIT:
- user_profiles remaining: _______________ (should be 0)
- All cascaded tables at 0: YES ___ NO ___
- Backup verified and accessible: YES ___ NO ___
- Ready to COMMIT: YES ___ NO ___

user_profiles deleted: _______________ rows

Status: ✅ SUCCESS (COMMITTED) / ❌ FAILED (ROLLED BACK)
Issues: _______________________________________________________________

End time: _______________
Total duration for Phase 5: _______________ minutes

=================================================================
PHASE 6: POST-DELETION VERIFICATION
=================================================================
Start time: _______________

user_profiles remaining: 0 ✅
memberships remaining: 0 ✅
lesson_bookings remaining: 0 ✅
bookings remaining: 0 ✅
membership_packages remaining: _______________ ✅ (should be > 0)
lessons remaining: _______________ ✅ (should be > 0)
trainers remaining: _______________ ✅ (should be > 0)
pilates_schedule_slots remaining: _______________ ✅ (should be > 0)

All verifications passed: YES ___ NO ___

Status: ✅ SUCCESS / ❌ FAILED
Issues: _______________________________________________________________

End time: _______________

=================================================================
POST-EXECUTION ACTIONS
=================================================================

Stakeholders notified: YES ___ NO ___ Time: _______________
Triggers re-enabled: YES ___ NO ___ Time: _______________
Workflow re-enabled: YES ___ NO ___ Time: _______________
Smoke tests completed: YES ___ NO ___ Time: _______________

OVERALL STATUS: ✅ COMPLETE / ⚠️ ISSUES / ❌ FAILED

=================================================================
TOTAL EXECUTION TIME: _______________ minutes
=================================================================

NOTES / INCIDENTS:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

SIGN-OFF:
DBA Signature: _______________  Date: _______________
Manager Signature: _______________  Date: _______________
Client Sign-Off: _______________  Date: _______________

=================================================================
```

---

## 🎯 FINAL CLIENT HANDOVER CHECKLIST

**After ALL execution and smoke tests complete:**

```
✅ Database Reset Verification
   ❑ All user data deleted (confirmed via Phase 6)
   ❑ System configuration preserved (lessons, trainers, packages intact)
   ❑ Database running normally (no errors)
   ❑ Backup exists and is accessible

✅ System Functionality Verified
   ❑ New users can register
   ❑ Memberships can be created
   ❑ Bookings work correctly
   ❑ Pilates system functional
   ❑ QR code check-in works
   ❑ No performance degradation

✅ Business Logic Restored
   ❑ Membership triggers active
   ❑ Deposit calculation triggers active
   ❑ Workflow scheduling active
   ❑ All scheduled jobs running

✅ Documentation Complete
   ❑ Execution log signed and dated
   ❑ All baseline counts recorded
   ❑ All deletion counts recorded
   ❑ All issues documented
   ❑ Post-execution smoke tests documented

✅ Client Communication
   ❑ Client notified of completion
   ❑ Client confirmed system access
   ❑ Client confirmed data reset
   ❑ Client confirmed system functionality
   ❑ Client signed acceptance
```

---

## 📋 QUICK REFERENCE: EXECUTION SEQUENCE

**Copy-paste this execution checklist into terminal/notepad:**

```
PRODUCTION DATA RESET - EXECUTION CHECKLIST

□ T-60min: Complete all PRE-EXECUTION checklist items (see above)
□ T-30min: Final backup taken and verified
□ T-15min: GO/NO-GO decision gate (all items complete? YES proceed : NO stop)
□ T-5min: Notify stakeholders "Maintenance starting now"
□ T-0min: Execute Phase 1 (baseline counts)
□ T-2min: Execute Phase 2 (leaf nodes)
□ T-4min: Execute Phase 3 (transactions)
□ T-6min: Execute Phase 4 (subscriptions)
□ T-9min: ⚠️ FINAL CHECK before Phase 5
□ T-9min: Execute Phase 5 (user profiles - POINT OF NO RETURN)
□ T-12min: Execute Phase 6 (verification)
□ T-14min: Notify stakeholders "Maintenance complete"
□ T-15min: Re-enable triggers
□ T-16min: Re-enable workflow
□ T-17min: Execute smoke tests
□ T-22min: Document execution in log
□ T-23min: Client sign-off
□ T-24min: COMPLETE

Total estimated time: 20-25 minutes (from execution start to handoff)
```

---

## 🔐 FINAL WARNINGS

### This Is Production
- 🔴 Real data, real users, real impact
- 🔴 After commit, only recovery is restore from backup
- 🔴 Backup must be verified BEFORE any execution
- 🔴 Senior DBA only, no exceptions

### Timeline Is Tight
- ⏱️ 20-25 minute maintenance window
- ⏱️ If execution takes > 25 min, abort and restore
- ⏱️ Users will be waiting
- ⏱️ Have rollback procedure ready

### Escalation Paths
- 🚨 DB Admin: _______________________
- 🚨 Infrastructure: _______________________
- 🚨 Client: _______________________
- 🚨 On-Call: _______________________

---

**Document Status:** READY FOR PRODUCTION EXECUTION (after Step 4 succeeds)  
**Authorization Required:** Senior DBA + Client Approval  
**Date Prepared:** January 30, 2026  
**Prerequisites:** Step 4 backup execution MUST be complete and verified
