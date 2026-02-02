# SUBSCRIPTION AUDIT SYSTEM - COMPREHENSIVE GUIDE

**Version:** 1.0  
**Date:** 2026-01-31  
**Scope:** Full subscription lifecycle validation with time-travel testing

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Test Data](#test-data)
4. [Time Travel Mechanism](#time-travel-mechanism)
5. [Validation Logic](#validation-logic)
6. [Execution Plan](#execution-plan)
7. [Report Interpretation](#report-interpretation)
8. [Bug Detection Criteria](#bug-detection-criteria)

---

## OVERVIEW

This audit system comprehensively validates the gym booking application's subscription system by:

1. **Creating deterministic test data** with 20 users across 4 subscription types
2. **Simulating time progression** from T0 (today) to T5 (+90 days)
3. **Validating status transitions** at each checkpoint
4. **Detecting anomalies** where subscriptions remain active after expiration
5. **Generating detailed audit reports** with root cause analysis

### Key Problem Being Solved

**The Issue:** Expired memberships were displaying as "active" in the UI because:
- Database stored `is_active: true` even after expiration
- `formatDate()` had timezone bugs
- Status was not recalculated based on current date
- No automatic expiration mechanism

**The Solution:** 
- Dynamic status derivation using application logic
- Proper timezone-aware date parsing
- Comprehensive time-travel testing to validate fixes

---

## ARCHITECTURE

### Component Hierarchy

```
┌─────────────────────────────────────────┐
│  run-audit.ts                           │
│  (Orchestrator - sets up & runs tests)  │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ↓                ↓
┌──────────────────┐  ┌──────────────────────────┐
│ seed-test-data   │  │ subscription-lifecycle   │
│ .ts              │  │ .test.ts                 │
│                  │  │                          │
│ Creates 20 test  │  │ Runs time-travel tests   │
│ users with:      │  │ at 5 checkpoints        │
│                  │  │                          │
│ - 5 Pilates      │  │ Validates:              │
│ - 5 FreeGym      │  │ • Status transitions    │
│ - 5 Ultimate     │  │ • Deposit refills       │
│ - 5 Ult Medium   │  │ • QR access             │
│                  │  │ • Booking permissions   │
└──────────────────┘  └──────────────────────────┘
                              │
                              ↓
                      ┌──────────────────┐
                      │ AUDIT_REPORT.md  │
                      │                  │
                      │ • Executive      │
                      │   Summary        │
                      │ • Per-User       │
                      │   Results        │
                      │ • Bug Analysis   │
                      │ • Root Causes    │
                      │ • Fix Recs       │
                      └──────────────────┘
```

### Data Flow

```
Supabase Database
│
├─ user_profiles (20 test users)
│
├─ memberships (40+ total subscriptions)
│  ├─ Active subscriptions
│  ├─ Expired subscriptions
│  └─ Historical subscriptions
│
├─ membership_packages (Pilates, FreeGym, Ultimate, Ult Medium)
│
├─ pilates_deposits (Refill tracking)
│
└─ bookings (Optional: validate booking permissions)
     │
     └─ Only for active subscriptions
```

---

## TEST DATA

### 20 Test Users Breakdown

#### Group 1: Pilates Users (5 users)

| User ID | Email | Scenario | Start Date | End Date | Status |
|---------|-------|----------|-----------|----------|--------|
| test-pilates-001 | pilates-active-tomorrow | Expires in 1 day | -30 days | +1 day | ✅ ACTIVE |
| test-pilates-002 | pilates-expires-today | Expires today | -30 days | 0 days | ✅ ACTIVE (T0) / ❌ EXPIRED (T1+) |
| test-pilates-003 | pilates-expired-yesterday | Expired yesterday | -31 days | -1 day | ❌ EXPIRED |
| test-pilates-004 | pilates-renewer | Renewal cycle | Current: -15/+15 | Historical: -45/-15 | ✅ ACTIVE (current) |
| test-pilates-005 | pilates-long-term | 60-day subscription | -5 days | +60 days | ✅ ACTIVE |

**Focus:** Refill mechanics, 30-day cycle tracking

#### Group 2: FreeGym Users (5 users)

| User ID | Email | Scenario | End Date | Note |
|---------|-------|----------|----------|------|
| test-freegym-001 | freegym-active | 45 days remaining | +45 days | ✅ Safe |
| test-freegym-002 | freegym-expired | Expired 5 days ago | -5 days | ❌ Should be EXPIRED |
| test-freegym-003 | freegym-today | Expires today | 0 days | Edge case |
| test-freegym-004 | freegym-chained | Back-to-back subs | Current: 0/+30, Historical: -30/0 | Edge case |
| test-freegym-005 | freegym-tomorrow | Expires tomorrow | +1 day | Edge case |

**Focus:** Status boundaries, back-to-back transitions

#### Group 3: Ultimate Users (5 users)

| User ID | Scenario | Duration | Note |
|---------|----------|----------|------|
| test-ultimate-001 | Active, 50 days left | -10/+50 | ✅ Safe |
| test-ultimate-002 | Expired 30+ days ago | -90/-30 | ❌ Should be EXPIRED |
| test-ultimate-003 | Expires in 2 days | -28/+2 | Edge case |
| test-ultimate-004 | Refill boundary | -30/+30 | Refill at T2 |
| test-ultimate-005 | Long-term, 60-120 days | -60/+60 | ✅ Safe |

**Focus:** 30-day refill cycles, deposit management

#### Group 4: Ultimate Medium Users (5 users)

| User ID | Scenario | Duration | Credits |
|---------|----------|----------|---------|
| test-ultimate-medium-001 | Active, 53 days | -7/+53 | 1 credit/cycle |
| test-ultimate-medium-002 | Expired long ago | -75/-25 | ❌ Expired |
| test-ultimate-medium-003 | Expires in 3 days | -27/+3 | Edge |
| test-ultimate-medium-004 | Renewal cycle | -5/+55 & -35/-5 | History |
| test-ultimate-medium-005 | Long-term | -55/+5 | ✅ Safe |

**Focus:** Single-credit refill scenarios

### Edge Cases Covered

1. ✅ **Expires Today** (test-freegym-003, test-pilates-002)
   - Should be ACTIVE on T0 (end_date >= today)
   - Should be EXPIRED on T1+ (end_date < today)

2. ✅ **Expires Tomorrow** (test-freegym-005, test-pilates-001)
   - Should remain ACTIVE through T0-T1
   - Becomes EXPIRED on T2

3. ✅ **Already Expired** (test-pilates-003, test-ultimate-002)
   - Should always show EXPIRED
   - Should never appear in "Active Subscriptions"

4. ✅ **Back-to-Back Subscriptions** (test-freegym-004)
   - At transition point: old = EXPIRED, new = ACTIVE
   - No gap, no overlap in history

5. ✅ **Long-Term Subscriptions** (test-pilates-005, test-ultimate-005)
   - Track multi-refill cycles
   - Validate refills at 30/60/90 day marks

---

## TIME TRAVEL MECHANISM

### How Time Travel Works

```typescript
// Central time controller
const timeController = new TimeTravelController(new Date('2026-01-31'));

// At each checkpoint, we:
// 1. Jump time forward
// 2. Query database
// 3. Derive status based on CURRENT DATE
// 4. Compare with stored status
// 5. Log results

timeController.jumpDays(15, 'T1: Mid-subscription');
// currentDate becomes 2026-02-15
// Database query runs with this date
// Status is derived: is_active = (end_date >= 2026-02-15)
```

### Time Checkpoint Timeline

```
2026-01-31 ← T0 (Start)
    ↓ (+15 days)
2026-02-15 ← T1 (Mid-subscription)
    ↓ (+15 days)
2026-02-28 ← T2 (Refill boundary, +30 total)
    ↓ (+1 day)
2026-03-01 ← T3 (Expiration boundary, +31 total)
    ↓ (+29 days)
2026-03-31 ← T4 (Long-term, +60 total)
    ↓ (+30 days)
2026-04-30 ← T5 (Final, +90 total)
```

### What Gets Validated at Each Checkpoint

| Checkpoint | Focus | Validation |
|-----------|-------|-----------|
| **T0** | Initial state | All test users exist, memberships created |
| **T1** | Early subscriptions | No unexpected expirations yet |
| **T2** | Refill boundary | Pilates/Ultimate credits refill at 30-day mark |
| **T3** | Expiration boundary | Subscriptions that end today become EXPIRED tomorrow |
| **T4** | Long-term | Multi-refill cycles validate correctly |
| **T5** | Final state | All expected expirations have occurred |

---

## VALIDATION LOGIC

### Status Derivation Algorithm

```typescript
function deriveStatus(membership, currentDate) {
  // Parse end_date safely (avoid timezone issues)
  const [year, month, day] = membership.end_date.split('-').map(Number);
  const endDate = new Date(year, month - 1, day);
  
  // Get today at midnight in local timezone
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  // Status is ACTIVE only if ALL conditions are true:
  // 1. is_active flag is true (set manually)
  // 2. status field is 'active' (set manually)
  // 3. end_date >= today (calculated)
  const isTrulyActive = 
    membership.is_active === true &&
    membership.status === 'active' &&
    endDate >= today;
  
  return {
    is_active: isTrulyActive,
    status: isTrulyActive ? 'active' : 'expired'
  };
}
```

### Bug Detection Triggers

#### 🔴 CRITICAL: Expired but Shows Active

```
BUG DETECTED if:
  - Database: is_active=true, status='active'
  - Calculated: end_date < today
  - Result: ❌ MISMATCH

This is the PRIMARY bug we're looking for.
```

#### 🟡 MEDIUM: Delayed Expiration

```
BUG DETECTED if:
  - Yesterday: status was 'active'
  - Today: end_date < today
  - Still: status='active' (not updated yet)
  
Expected: Should transition immediately.
```

#### 🔵 LOW: Refill Not Applied

```
BUG DETECTED if:
  - For Pilates/Ultimate subscriptions
  - At 30/60/90 day marks
  - Deposit balance unchanged
  
Expected: Credits should refill on schedule.
```

---

## EXECUTION PLAN

### Step 1: Seed Test Data

```bash
# Run this FIRST to create all test users and subscriptions
npx ts-node tests/subscription-audit/seed-test-data.ts

# What it does:
# ✅ Creates 20 user_profiles with test emails
# ✅ Creates 40+ memberships across various scenarios  
# ✅ Sets initial is_active and status values
# ✅ Logs each creation for verification
```

**Expected Output:**
```
🌱 Starting test data seeding...

📝 Creating user profiles...
✅ Created user: test-pilates-001
✅ Created user: test-pilates-002
... (18 more)

📦 Fetching package IDs...
Package map: {
  'pilates' => 'pkg_uuid_123',
  'free_gym' => 'pkg_uuid_456',
  ...
}

📅 Creating memberships...
✅ Created membership: test-pilates-001 - pilates
✅ Created membership: test-pilates-002 - pilates
... (38 more)

✨ Test data seeding complete!
```

### Step 2: Run Time-Travel Tests

```bash
# Run this to validate across time jumps
npx vitest tests/subscription-audit/subscription-lifecycle.test.ts

# What it does:
# ✅ Jumps time from T0 to T5 (+90 days)
# ✅ At each checkpoint, validates all subscriptions
# ✅ Compares DB status vs derived status
# ✅ Detects bugs and logs issues
# ✅ Collects results for final report
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║    SUBSCRIPTION LIFECYCLE AUDIT TEST SUITE             ║
║    Starting: 2026-01-31 (T0)                          ║
╚════════════════════════════════════════════════════════╝

✅ T0: Validate all test users exist
   Found 20 test users

🔍 [T0] Checking initial subscription status...
   ✅ Active: 15
   ❌ Expired: 5
   🐛 Buggy: 0

⏰ [T1: Mid-subscription] Time jumped to: 2026-02-15
🔍 [T1] Checking subscriptions at +15 days...
   ✅ No issues detected

⏰ [T2: Refill boundary] Time jumped to: 2026-02-28
🔍 [T2] Checking at +30 days (refill boundary)...
   Found 5 Pilates subscriptions
   ⚠️  Note: Refill validation requires deposit table integration

... (T3, T4, T5)

╔════════════════════════════════════════════════════════╗
║              AUDIT COMPLETE - GENERATING REPORT         ║
╚════════════════════════════════════════════════════════╝
```

### Step 3: Review Audit Report

```bash
# The report is auto-generated after tests complete
cat tests/subscription-audit/AUDIT_REPORT.md

# Contains:
# 📊 Executive summary (total issues found)
# 📋 Per-user results (each user's status at each checkpoint)
# 🐛 Bug analysis (what went wrong)
# 💡 Recommendations (how to fix)
```

---

## REPORT INTERPRETATION

### Executive Summary Section

```markdown
## 1️⃣ EXECUTIVE SUMMARY

- **Total Test Users:** 20
- **Users with Issues:** 2 (10%)
- **Total Issues Found:** 3
- **Critical Issues:** 1
```

**What This Means:**
- 20 users were tested ✅
- 2 users had problems (10% failure rate) ⚠️
- 3 individual issues detected 🐛
- 1 CRITICAL bug found 🔴

### Per-User Results Section

```markdown
### test-pilates-002 (Pilates)
- **QR Access:** ❌ (expired)
- **Can Book:** ❌ (expired)
- **Issues:** T1: Expired (end_date=2026-01-31) but still marked active in DB
```

**Interpretation:**
- User's subscription expired on 2026-01-31
- System correctly blocks QR access ✅
- System correctly blocks booking ✅
- But database still shows `is_active=true` ❌ BUG

### Bug Analysis Section

```markdown
## 3️⃣ BUG ANALYSIS

### 🐛 Expired but marked active in database
- **Affected Users:** test-pilates-002, test-freegym-003, test-ultimate-002
- **Severity:** CRITICAL

root cause: is_active flag not updated when end_date passes
```

**Red Flags:**
- Multiple users affected = systemic issue
- CRITICAL severity = user-facing bug
- Root cause likely in: database triggers or status update logic

### Recommendations Section

```markdown
## 4️⃣ RECOMMENDATIONS

### 🔴 IMMEDIATE ACTIONS REQUIRED

1. **Fix Status Derivation:** Ensure is_active is computed as...
2. **Database Trigger:** Add PostgreSQL trigger to auto-update...
3. **Frontend Validation:** Always derive status client-side...
```

**Action Items:**
- Priority 1: Database-level trigger to auto-expire
- Priority 2: Frontend always derives status
- Priority 3: Add automated daily job as backup

---

## BUG DETECTION CRITERIA

### CRITICAL Bugs (Immediate Fix Required)

#### C1: Expired Membership Shows as Active

**Detection:**
```
- Database end_date < today
- Database is_active = true OR status = 'active'
- User can access QR/booking (should be blocked)
```

**Severity:** CRITICAL - User confusion, lost revenue

**Example:**
```
User: test-pilates-002
End date: 2026-01-31 (yesterday)
Current date: 2026-02-15
Database: is_active=true, status='active'
Reality: ❌ EXPIRED

Issue: User sees "Active" in app but can't use services
```

### HIGH Bugs (Fix Within Sprint)

#### H1: Missing Deposit Refill

**Detection:**
```
- Pilates subscription at 30-day mark
- Expected: credits = 8
- Actual: credits = 0 (or unchanged)
```

**Severity:** HIGH - Impacts billing/revenue

#### H2: Status Transition Delay

**Detection:**
```
- T3: end_date = yesterday, status should be 'expired'
- Still showing: status = 'active'
- T4: status THEN changes to 'expired'
```

**Severity:** HIGH - Delay in enforcement

### MEDIUM Bugs (Fix Next Sprint)

#### M1: Deposit Calculation Error

**Detection:**
```
- Expected refills at T2, T4
- Actual: only at T2
- Missing: second refill at T4
```

**Severity:** MEDIUM - Occasional revenue loss

### LOW Bugs (Document for Future)

#### L1: Date Display Formatting

**Detection:**
```
- End date shown as: "31 January 2026"
- Expected format: "January 31, 2026"
- No functional impact
```

**Severity:** LOW - UI/UX only

---

## EXPECTED RESULTS (Healthy System)

If the system is working correctly, the audit report should show:

```
✅ EXPECTED OUTPUT:

- **Total Issues Found:** 0
- **Critical Issues:** 0
- **Users with Problems:** 0

Per-user results:
✅ test-pilates-001: ACTIVE at T0 → EXPIRED at T2+
✅ test-pilates-002: ACTIVE at T0 → EXPIRED at T1
✅ test-freegym-003: ACTIVE at T0 → EXPIRED at T1
✅ test-ultimate-005: ACTIVE at T0-T4 → EXPIRED at T5
... (all 20 users pass validation)

AUDIT STATUS: ✅ PASS - All subscriptions correctly managed
```

---

## TROUBLESHOOTING

### Test Data Won't Seed

**Problem:** "Package not found for pilates"

**Solution:**
1. Check package names in `membership_packages` table
2. Verify they're named: "Pilates", "Free Gym", "Ultimate", "Ultimate Medium"
3. Update seed-test-data.ts package matching logic

### Time-Travel Tests Fail

**Problem:** "Cannot connect to Supabase"

**Solution:**
1. Verify `VITE_SUPABASE_URL` env variable
2. Verify `SUPABASE_SERVICE_ROLE_KEY` env variable
3. Check Supabase project status
4. Ensure RLS policies allow queries

### Report Not Generated

**Problem:** "AUDIT_REPORT.md not created"

**Solution:**
1. Check write permissions on `tests/subscription-audit/` directory
2. Ensure test completes without crashing
3. Check vitest output for errors
4. Manually run report generation:
   ```bash
   npx ts-node tests/subscription-audit/generate-report.ts
   ```

---

## NEXT STEPS

After audit completion:

1. **Review Report**  
   - Focus on CRITICAL issues first
   - Understand root causes

2. **Implement Fixes**  
   - Database triggers for auto-expiration
   - Frontend status derivation logic
   - Daily scheduled job as backup

3. **Re-Run Audit**  
   - Seed fresh test data
   - Run time-travel tests again
   - Verify all issues resolved

4. **Add to CI/CD**  
   - Run audit on every deployment
   - Block deployment if CRITICAL issues found
   - Archive reports for audit trail

