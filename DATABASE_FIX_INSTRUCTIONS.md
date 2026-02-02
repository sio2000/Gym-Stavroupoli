📋 DATABASE FIXES - STEP-BY-STEP INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

🎯 GOAL: Fix critical database issues that prevent system from working correctly

⏱️  ESTIMATED TIME: 5-10 minutes

═══════════════════════════════════════════════════════════════════════════════
STEP 1: REVIEW THE DIAGNOSTIC REPORT
═══════════════════════════════════════════════════════════════════════════════

Open this file to understand the issues:
📄 DATABASE_DIAGNOSTIC_REPORT.md

Read sections:
✓ Issue #1 - RLS Policies
✓ Issue #2 - Duplicate Status Columns
✓ Issue #3 - Expired Memberships Not Auto-Deactivating
✓ Issue #4 - Orphaned Pilates Deposits

═══════════════════════════════════════════════════════════════════════════════
STEP 2: APPLY PHASE 1 FIXES (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

GO TO: Supabase Dashboard → SQL Editor

COPY ENTIRE CONTENT FROM:
📄 database/01_CRITICAL_FIXES_PHASE1.sql

PASTE into Supabase SQL Editor

CLICK: ▶️ Run / Execute

WAIT for completion (should see ✅ messages)

SCREENSHOT the results for documentation

═══════════════════════════════════════════════════════════════════════════════
STEP 3: VERIFY FIXES APPLIED
═══════════════════════════════════════════════════════════════════════════════

Run the verification queries (they're at the bottom of the SQL file)

Expected Results:

✅ Q1: Triggers created successfully?
   Should show:
   - expire_membership_before_trigger
   - cascade_deactivate_deposits_trigger

✅ Q2: Expired memberships correctly marked?
   Should show:
   - Some count of "Expired and INACTIVE (correct)"
   - Count of 0 for "Expired but STILL ACTIVE (ERROR)"

✅ Q3: Orphaned deposits correctly handled?
   Should show:
   - Count of 0 (no orphaned deposits)

✅ Q4: Data integrity check
   Should show totals for all membership/deposit counts

═══════════════════════════════════════════════════════════════════════════════
STEP 4: RUN FULL SYSTEM TEST
═══════════════════════════════════════════════════════════════════════════════

In terminal:
npm run test:diagnostics

Expected output:
✅ System should show:
   - No "Expired but still ACTIVE" errors
   - No "Orphaned deposits" errors
   - Triggers functioning

═══════════════════════════════════════════════════════════════════════════════
STEP 5: TEST APPLICATION FUNCTIONALITY
═══════════════════════════════════════════════════════════════════════════════

Start the app:
npm run dev

TEST SCENARIOS:

1️⃣  Create New Membership
   ├─ Go to: Secretary Dashboard → New Subscription
   ├─ Create a membership for a test user
   ├─ ✅ Should succeed (RLS fix allows this)
   └─ Check database: membership should be created

2️⃣  Check Membership Expiration
   ├─ Create a membership expiring TODAY
   ├─ Run: npm run test:diagnostics
   ├─ ✅ Should show is_active = false (auto-expire trigger works)
   └─ Verify in database

3️⃣  Check Pilates Cascade
   ├─ Find a pilates membership that expires TODAY
   ├─ Check its associated pilates_deposits
   ├─ Run: npm run test:diagnostics
   ├─ ✅ pilates_deposits should be is_active = false (cascade works)
   └─ Verify in database

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

❌ Error: "Trigger already exists"
   Solution: The DROP IF EXISTS in the SQL should handle this
   Try running again

❌ Error: "Permission denied" or "RLS violation"
   Solution: You need to run as admin or use service key
   Make sure you're using the Supabase SQL Editor (not client-side)

❌ Triggers not showing in verification
   Solution: Refresh the browser/terminal
   Run the verification query again

❌ Some memberships still marked ACTIVE but expired
   Solution: This means the trigger didn't apply to existing data
   The UPDATE in Step 3 of the SQL should have fixed this
   Run the query again or check the WHERE clause

═══════════════════════════════════════════════════════════════════════════════
NEXT PHASES (After Phase 1 is confirmed working)
═══════════════════════════════════════════════════════════════════════════════

📋 PHASE 2: SCHEMA CLEANUP (Optional but recommended)
   File: database/02_SCHEMA_CLEANUP_PHASE2.sql
   Tasks:
   ├─ Remove 9 unused NULL columns
   ├─ Remove "status" field (keep only is_active)
   └─ Drop empty tables

📋 PHASE 3: COMPREHENSIVE TESTING
   File: tests/database-fixes-validation.test.ts
   Tasks:
   ├─ Test expiration trigger
   ├─ Test cascade deactivation
   └─ Test RLS policies

═══════════════════════════════════════════════════════════════════════════════
MONITORING
═══════════════════════════════════════════════════════════════════════════════

After fixes are applied, monitor:

✅ Check daily:
  • No expired memberships marked ACTIVE
  • No orphaned pilates deposits
  • Admin can create memberships without RLS errors
  • Refill system only credits ACTIVE memberships

✅ Run weekly:
  • npm run test:diagnostics
  • Check database integrity

═══════════════════════════════════════════════════════════════════════════════
DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════

Keep records of:
📝 DATABASE_DIAGNOSTIC_REPORT.md     - Issue analysis
📝 database/01_CRITICAL_FIXES_PHASE1.sql  - Applied fixes
📝 This file                           - Implementation guide

═══════════════════════════════════════════════════════════════════════════════
SUPPORT
═══════════════════════════════════════════════════════════════════════════════

If issues occur:
1. Check the Supabase logs for trigger errors
2. Verify triggers exist: SELECT * FROM pg_triggers WHERE tablename IN ('memberships', 'pilates_deposits')
3. Test each trigger independently
4. Check RLS policies in Supabase dashboard

═══════════════════════════════════════════════════════════════════════════════
