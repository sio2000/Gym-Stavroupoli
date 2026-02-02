# IMPLEMENTATION CHECKLIST - SUBSCRIPTION BUG FIXES

**Status:** Ready for Deployment  
**Total Bugs Fixed:** 32  
**Deployment Phases:** 4  
**Estimated Time:** 1-2 hours  

---

## PHASE 1: DATABASE DEPLOYMENT (30 minutes)

### Step 1.1: Deploy Auto-Expiration Components
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 1A and PHASE 1B sections
- [ ] **What it does:**
  - Creates `membership_auto_expire_trigger()` function
  - Creates `membership_auto_expire_trigger_trg` trigger
  - Prevents ANY expired membership from being marked active
- [ ] **Verification:**
  ```sql
  SELECT trigger_name FROM information_schema.triggers 
  WHERE trigger_name = 'membership_auto_expire_trigger_trg';
  ```
  Expected: 1 row returned

### Step 1.2: Fix All Existing Expired Memberships
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 2 section
- [ ] **What it does:**
  - Creates temporary log table
  - Updates all expired memberships (is_active=false, status='expired')
  - Expected: ~27 rows affected (from AUDIT_REPORT)
- [ ] **Verification:**
  ```sql
  SELECT COUNT(*) as remaining_stale
  FROM memberships
  WHERE (is_active = true OR status = 'active')
    AND end_date < CURRENT_DATE;
  ```
  Expected: 0

### Step 1.3: Deploy Daily Batch Job Function
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 3 section
- [ ] **What it does:**
  - Creates `daily_expire_memberships()` function
  - Catches any memberships that slip through daily
- [ ] **Schedule:** Run daily at 00:00 UTC (via Supabase cron or GitHub Action)
- [ ] **Verification:**
  ```sql
  SELECT * FROM public.daily_expire_memberships();
  ```
  Expected: 0 rows affected (all already fixed)

### Step 1.4: Deploy Validation Functions
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 4 section
- [ ] **What it does:**
  - Creates `get_user_active_memberships_validated()` function
  - Safe version that includes multiple date guards
  - Recommended for API/RPC queries

### Step 1.5: Update RPC Function
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 5 section
- [ ] **What it does:**
  - Updates `process_weekly_pilates_refills()` function
  - Now explicitly checks dates (not just flags)
- [ ] **Verification:**
  - Wait for next Sunday
  - Check: `SELECT * FROM ultimate_weekly_refills WHERE refill_date = '2026-02-02'`
  - Expected: Records for all Ultimate/Medium users

### Step 1.6: Add Audit Table
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute PHASE 6 section
- [ ] **What it does:**
  - Creates `membership_expiration_audit` table
  - Logs all membership changes for monitoring
  - Helps debug future issues

### Step 1.7: Run Verification Queries
- [ ] **File:** `DATABASE_PERMANENT_FIX_SCRIPT.sql`
- [ ] **Action:** Execute all queries in PHASE 7 section
- [ ] **Expected Results:**
  1. Trigger exists: 1 row
  2. No stale flags: 0 rows
  3. Truly active memberships: ~11 rows (38 total - 27 expired)
  4. Ultimate ready for refill: ~15 rows (8 Ultimate + 7 Medium)

---

## PHASE 2: FRONTEND DEFENSIVE FIXES (30 minutes)

### Step 2.1: Update isActiveMembership() Function
- [ ] **File:** `src/utils/userInfoApi.ts`
- [ ] **Lines:** Find and replace `isActiveMembership` function
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #1
- [ ] **Changes:**
  - Add start_date check (prevent future-dated memberships)
  - Add defensive logging
  - Check both start AND end dates
- [ ] **Test:** Call with expired membership → should return false

### Step 2.2: Add Safe Query Helper
- [ ] **File:** `src/utils/userInfoApi.ts`
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #2
- [ ] **Add:** `getSafeMembershipQuery()` helper function
- [ ] **Purpose:** Provides reusable date-filtering logic

### Step 2.3: Update getUserActiveMemberships()
- [ ] **File:** `src/utils/userInfoApi.ts`
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #3
- [ ] **Changes:**
  - Add `.gte('end_date', today)` filter
  - Add `.lte('start_date', today)` filter
  - Add application-level filtering too
- [ ] **Test:** Query should not return any expired memberships

### Step 2.4: Update QR Code Generation
- [ ] **File:** `src/utils/qrSystem.ts`
- [ ] **Function:** `generateQRCode()`
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #4
- [ ] **Changes:**
  - Add date filters to membership query
  - Prevent expired memberships from generating QR
- [ ] **Test:** Try to generate QR for expired user → should fail

### Step 2.5: Improve Pilates Deposit Checking
- [ ] **File:** `src/utils/userInfoApi.ts` or `src/api/lessonApi.ts`
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #5
- [ ] **Add:** `checkPilatesDepositValidity()` function
- [ ] **Changes:**
  - Check `deposit_remaining > 0`
  - Check `expires_at` hasn't passed
  - Verify parent membership is active
- [ ] **Test:** Query with expired deposit → should return invalid

### Step 2.6: Update Membership Display Status
- [ ] **File:** `src/components/MembershipCard.tsx` or similar
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #6
- [ ] **Add:** `getMembershipDisplayStatus()` function
- [ ] **Changes:**
  - Calculate status from dates, not DB flags
  - Show "Active", "Expired", "Not Yet Active"
- [ ] **Test:** Expired membership displays as "Expired" not "Active"

### Step 2.7: Add Booking Validation
- [ ] **File:** `src/api/lessonApi.ts` or `src/api/bookingApi.ts`
- [ ] **Reference:** `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` - Fix #7
- [ ] **Add:** Validation before allowing bookings
- [ ] **Logic:**
  1. Check membership is active by date
  2. For Pilates: Check deposit > 0
  3. Only then allow booking
- [ ] **Test:** Try to book with expired membership → should fail

---

## PHASE 3: TESTING & VERIFICATION (45 minutes)

### Step 3.1: Run Unit Tests
- [ ] **Command:** `npm run test` or `vitest`
- [ ] **Test File:** `tests/subscriptions/subscription-lifecycle.test.ts`
- [ ] **Expected:** All 14 tests PASS
  - ✅ Active memberships show as active
  - ✅ Expired memberships show as expired
  - ✅ No expired memberships can generate QR
  - ✅ No expired users can book lessons
  - ✅ Ultimate refills work after database fixes

### Step 3.2: Run Audit Suite
- [ ] **Command:** `npm run test -- --config vitest.audit.config.ts`
- [ ] **Expected Results:**
  - 0 users with stale DB flags
  - 27 users previously affected now fixed
  - All 32 bugs resolved

### Step 3.3: Manual Testing - Database
- [ ] **Query 1:** Check no stale flags
  ```sql
  SELECT COUNT(*) FROM memberships 
  WHERE is_active=true AND end_date < CURRENT_DATE;
  ```
  Expected: 0

- [ ] **Query 2:** Check trigger works
  ```sql
  INSERT INTO memberships (user_id, package_id, end_date, is_active, status)
  VALUES ('test-uuid', 'pkg-uuid', CURRENT_DATE - 1, true, 'active');
  SELECT is_active FROM memberships WHERE end_date = CURRENT_DATE - 1;
  ```
  Expected: false (trigger auto-corrected)

### Step 3.4: Manual Testing - Frontend
- [ ] **Test 1:** Generate QR for expired user
  - Action: Try to create QR code
  - Expected: Error message "Subscription has expired"
  - Actual: ___________

- [ ] **Test 2:** Book lesson with expired membership
  - Action: Try to book Pilates lesson
  - Expected: Error message "Active membership required"
  - Actual: ___________

- [ ] **Test 3:** Display membership status
  - Action: View membership details page
  - Expected: Shows "Expired" for end_date < today
  - Actual: ___________

- [ ] **Test 4:** Ultimate refill on Sunday
  - Action: Wait for Sunday 02:00 UTC
  - Expected: User with Ultimate gets 3 lessons refilled
  - Check: `SELECT * FROM ultimate_weekly_refills WHERE refill_date = TODAY()`
  - Actual: ___________

### Step 3.5: Regression Testing
- [ ] Check other features still work:
  - [ ] Admin can create memberships
  - [ ] Users can see active memberships
  - [ ] Personal training still books
  - [ ] Kettlebell points still track
  - [ ] Payment history still shows

---

## PHASE 4: MONITORING & DOCUMENTATION (15 minutes)

### Step 4.1: Enable Monitoring
- [ ] Add monitoring to `membership_expiration_audit` table
- [ ] Set up alerts for:
  - [ ] More than 5 memberships expired in one day
  - [ ] Trigger errors detected
  - [ ] Batch job execution failures

### Step 4.2: Update Documentation
- [ ] [ ] Create DEPLOYMENT_NOTES.md
  - [ ] What was deployed
  - [ ] When (date/time)
  - [ ] Who deployed it
  - [ ] Verification results
  
- [ ] Update: `src/utils/userInfoApi.ts` comments
  - [ ] Document date-checking behavior
  - [ ] Note defensive-layer approach

- [ ] Update: Database README
  - [ ] Document auto-expiration trigger
  - [ ] Document daily batch job
  - [ ] Document refill system

### Step 4.3: Create Maintenance Checklist
- [ ] Weekly:
  - [ ] Check `daily_expire_memberships()` ran successfully
  - [ ] Check for errors in logs

- [ ] Monthly:
  - [ ] Review `membership_expiration_audit` for patterns
  - [ ] Check no stale flags re-appear
  - [ ] Verify Ultimate refills still working

- [ ] Quarterly:
  - [ ] Re-run full audit test suite
  - [ ] Check RPC function performance
  - [ ] Review edge cases

### Step 4.4: Create Rollback Plan
- [ ] If something goes wrong:
  1. RESTORE backup from before deployment
  2. OR manually run: `DROP TRIGGER membership_auto_expire_trigger_trg`
  3. Revert to previous RPC function version
  4. Revert frontend changes to Git

---

## DEPLOYMENT CHECKLIST SUMMARY

### Pre-Deployment
- [ ] All tests pass locally
- [ ] All code reviewed
- [ ] Backup database (via Supabase dashboard)
- [ ] Notify team of maintenance window

### Deployment Order
1. **FIRST:** Database changes (Phase 1)
   - Triggers won't affect anything until enabled
2. **THEN:** Frontend changes (Phase 2)
   - Can deploy separately after database
3. **THEN:** Testing (Phase 3)
4. **FINALLY:** Documentation (Phase 4)

### Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Check logs for errors
- [ ] Verify audit counts match expectations
- [ ] Run tests again to confirm
- [ ] Update team on status

---

## SUCCESS CRITERIA

### Database Layer
- ✅ No memberships with `is_active=true` and `end_date < today`
- ✅ Auto-expiration trigger prevents new stale data
- ✅ Daily batch job handles edge cases
- ✅ Ultimate refills working (3 lessons Sunday)

### Frontend Layer
- ✅ QR code generation blocked for expired memberships
- ✅ Lesson booking blocked for expired memberships
- ✅ Membership display shows accurate status
- ✅ Pilates deposit validation checks dates

### Test Results
- ✅ All 14 subscription lifecycle tests PASS
- ✅ All 32 bugs in AUDIT_REPORT fixed
- ✅ Zero false positives or negatives
- ✅ No regressions in other features

---

## SUPPORT & TROUBLESHOOTING

### If Database Deployment Fails
1. Check Supabase PostgreSQL logs
2. Verify SQL syntax in deployment script
3. Check for permission issues (need superuser role)
4. Rollback: Drop trigger and functions manually

### If Frontend Tests Fail
1. Check console for date parsing errors
2. Verify date format is ISO (YYYY-MM-DD)
3. Check timezone handling (should use UTC)
4. Compare with previous working code

### If Refill System Doesn't Work
1. Check `feature_flags` table - is `weekly_pilates_refill_enabled = true`?
2. Check GitHub Action execution logs
3. Check Supabase RPC function logs
4. Manually trigger: `SELECT * FROM process_weekly_pilates_refills()`

### If Stale Data Reappears
1. Check if trigger is still active
2. Check for INSERT/UPDATE operations bypassing trigger
3. Check if any code sets `is_active=true` without date validation
4. Run `SELECT daily_expire_memberships()` to fix

---

## FILES TO DEPLOY

| File | Phase | Purpose |
|------|-------|---------|
| `DATABASE_PERMANENT_FIX_SCRIPT.sql` | 1 | DB auto-expiration & batch job |
| `FRONTEND_DEFENSIVE_FIXES_GUIDE.md` | 2 | Frontend layer improvements |
| `ROOT_CAUSE_ANALYSIS_COMPREHENSIVE.md` | Ref | Root cause documentation |
| `IMPLEMENTATION_CHECKLIST.md` | Ref | This file |
| Various frontend source files | 2 | Actual code changes |

---

## ESTIMATED TIMELINE

- **Hour 0:** Deploy database (Phase 1)
- **Hour 1:** Deploy frontend (Phase 2)
- **Hour 1-1.5:** Run tests and verify (Phase 3)
- **Hour 1.5-2:** Documentation and monitoring (Phase 4)

**Total:** 1.5 - 2 hours

---

**Last Updated:** 2026-01-31  
**Status:** READY FOR DEPLOYMENT  
**Next Step:** Execute Phase 1 database deployment
