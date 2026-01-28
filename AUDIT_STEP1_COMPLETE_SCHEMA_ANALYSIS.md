# STEP 1: COMPLETE DATABASE SCHEMA AUDIT REPORT
**Status**: READ-ONLY (No data modifications)  
**Date**: January 28, 2026  
**System**: Gym-Stavroupoli Production (LIVE)

---

## EXECUTIVE SUMMARY

The database exhibits severe **architectural fragmentation** with **dual subscription systems**, **identity confusion**, and **orphaned/inconsistent records**. The core problems:

1. **TWO independent subscription/membership systems** that do not communicate
2. **Multiple user identity columns** with inconsistent references  
3. **Conflicting expiration logic** across different functions and tables
4. **Pilates-specific subscriptions** partially managed outside main memberships table
5. **Broken or missing foreign key consistency** in several migrations
6. **RLS policies masking records** due to schema mismatch assumptions

---

## DETAILED FINDINGS

### 1. USER IDENTITY FRAGMENTATION

#### 1.1 User Profile Table Structure
**Table: `user_profiles`**
- **Primary Key**: `id` (UUID, generated)
- **Alternate Key**: `user_id` (UUID, UNIQUE, references `auth.users(id)`)
- **Status**: DUAL KEYS CREATE CONFUSION

**Finding**: Different migration scripts and FKs reference these inconsistently:
- `lesson_management_schema.sql` uses `REFERENCES user_profiles(user_id)`
- `QR_SYSTEM_MIGRATIONS_FIXED.sql` uses `REFERENCES user_profiles(id)`
- `RUN_INSTALLMENT_FIXES.sql` has mixed references

**Consequence**: Foreign key mismatches, orphan records, and lookups that return no results despite data existing.

---

### 2. DUAL SUBSCRIPTION/MEMBERSHIP SYSTEMS

#### 2.1 System A: `membership_requests` + `memberships` (Active/Inactive Model)
**Files**: 
- `CREATE_MEMBERSHIP_SYSTEM_FIXED.sql`
- `COMPLETE_MEMBERSHIP_SETUP.sql`
- `FIX_MEMBERSHIP_EXPIRATION.sql`

**Tables**:
1. `membership_requests` (Request approval workflow)
   - `id`, `user_id` (FK to `user_profiles.user_id`), `package_id`, `duration_type` ✓ 
   - `status` enum: `pending`, `approved`, `rejected`
   - Installment fields: `installment_1_amount`, `installment_1_paid`, `installment_1_due_date`, etc.
   - **Represents**: Subscription REQUEST/INTENT

2. `memberships` (Active subscription records)
   - `id`, `user_id` (FK to `user_profiles.user_id`), `package_id`
   - `start_date`, `end_date`, `duration_type`
   - `status` enum: `active`, `expired`, `cancelled`, `suspended`
   - **Additional columns (from FIX_MEMBERSHIP_EXPIRATION.sql)**: `is_active`, `expires_at`
   - **Represents**: ACTIVE subscription with dates

3. `membership_package_durations` 
   - Pricing tiers for different durations (year/semester/month/lesson)

#### 2.2 System B: Pilates-Specific (`pilates_deposits` + `pilates_bookings`)
**Files**: 
- `COMPLETE_PILATES_FIX_ALL_IN_ONE.sql`
- Multiple pilates-related FIX scripts

**Tables**:
1. `pilates_deposits`
   - `id`, `user_id`, `deposit_amount`, `deposit_remaining`, `is_active`
   - **Represents**: Class pack "balance" for pilates

2. `pilates_bookings`
   - `id`, `user_id`, `slot_id`, `status` (`confirmed`, `cancelled`, `completed`, `no_show`)
   - Tracks individual class bookings against deposit

3. `pilates_schedule_slots`
   - Available time slots for pilates classes

**Problem**: Pilates subscriptions are **NOT linked to** `membership_requests` or `memberships` tables. They operate independently:
- A user can have `memberships.status = 'active'` but `pilates_deposits.is_active = false` → confusion on which is "true" status
- No automatic deactivation of pilates membership when deposit runs out (manual intervention required)
- No audit trail connecting pilates bookings to active memberships

#### 2.3 Lesson/Booking Systems
**Tables**:
- `lessons` (lesson definitions, trained by `trainers`, in `rooms`)
- `lesson_bookings` (user bookings to lessons) - FK uses `user_profiles.user_id` ✓
- `lesson_attendance` (check-in/check-out tracking)
- `lesson_schedules` (recurring lesson schedules)
- `personal_training_schedules` (user-specific training programs)

**Problem**: 
- Lessons are **NOT** linked to active memberships for access control
- Booking appears allowed regardless of membership status (no guard)
- No automatic cancellation of bookings when membership expires

---

### 3. EXPIRATION LOGIC FRAGMENTATION

#### 3.1 Multiple Expiration Functions
**Function 1**: `expire_memberships()` (in `COMPLETE_MEMBERSHIP_SETUP.sql`)
```sql
UPDATE memberships 
SET status = 'expired', updated_at = NOW()
WHERE status = 'active' AND end_date < CURRENT_DATE;
```

**Function 2**: `check_and_expire_memberships()` (in `COMPLETE_MEMBERSHIP_SETUP.sql`)
```sql
UPDATE memberships 
SET status = 'expired', updated_at = NOW()
WHERE status = 'active' AND end_date < CURRENT_DATE;
```
— **Identical logic** but separate function (redundant)

**Function 3**: `scheduled_expire_memberships()` (in `FIX_MEMBERSHIP_EXPIRATION.sql`)
```sql
UPDATE memberships 
SET status = 'expired', is_active = false, updated_at = NOW()
WHERE status = 'active' AND end_date < CURRENT_DATE;
```
— **DIFFERENT**: also sets `is_active = false`

**Function 4**: Application-level expiration (src/utils/activeMemberships.ts)
```typescript
// Updates Pilates membership status based on deposit availability
const updatePilatesMembershipStatus = async (userId: string): Promise<void> => {
  // Checks pilates_deposits.deposit_remaining and sets memberships.is_active = false
}
```
— **Different trigger, different table scope** (pilates only)

**Problem**: 
- Competing implementations with **non-deterministic outcomes**
- No single "source of truth" for when a membership expires
- Race conditions if multiple functions run concurrently
- Some affect `is_active`, others don't
- Pilates expiration logic is completely separate from regular membership expiration

**Scheduled Job Status**: Unclear if `pg_cron` or other scheduler is configured. Multiple "scheduled" functions exist but no evidence of actual scheduling.

---

### 4. COLUMN INCONSISTENCIES & MISSING CONSTRAINTS

#### 4.1 Membership Table Evolution Issues
**Table: `memberships` column versions**

From `COMPLETE_MEMBERSHIP_SETUP.sql`:
```sql
id, user_id, package_id, duration_type, start_date, end_date, status, 
approved_by, approved_at, created_at, updated_at
```

From `FIX_MEMBERSHIP_EXPIRATION.sql` (ADDS):
```sql
is_active BOOLEAN DEFAULT true
expires_at TIMESTAMPTZ
```

**Problem**: 
- `is_active` and `status` are **partially redundant** (should `is_active` derive from `status` + date check?)
- `expires_at` populated from `end_date::timestamptz` — **timezone-unsafe** (might cause off-by-one errors)
- No single "canonical" column for checking if membership is active right now

#### 4.2 FK Reference Inconsistencies

**Table: trainers**
- References `user_profiles(user_id)` ✓ (correct)

**Table: lesson_bookings** 
- References `user_profiles(user_id)` ✓ (correct)

**Table: QR code-related tables**
- Some reference `user_profiles(id)` ✗ (wrong, orphans result)
- Some reference `user_profiles(user_id)` ✓ (correct)

**Consequence**: Queries like:
```sql
SELECT * FROM memberships m 
LEFT JOIN user_profiles up ON up.id = m.user_id
```
Will return NULL for `up.*` even if user exists (FK targets different column)

---

### 5. RLS POLICIES & VISIBILITY ISSUES

#### 5.1 RLS Policy Examples
**Problem: Policies assume consistent schema**

From `COMPLETE_MEMBERSHIP_SETUP.sql`:
```sql
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);
```

From `COMPLETE_PILATES_FIX_ALL_IN_ONE.sql`:
```sql
CREATE POLICY "pilates_deposits_select_policy" ON public.pilates_deposits
    FOR SELECT USING (
        auth.uid() = user_id  -- assumes user_id column exists
        OR EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN (...))
    );
```

**Finding**: Policies reference different columns/assumptions but are applied to tables with FK mismatches → some records invisible to queries.

#### 5.2 Admin/Secretary Access
Multiple script versions with slightly different role checks:
- Some check `role IN ('admin', 'secretary')`
- Some check `role = 'admin'` only
- Some have conflicting policy names causing undefined behavior

---

### 6. TRIGGERS & SIDE-EFFECTS

#### 6.1 Updated_at Triggers
**Status**: ✓ Correctly implemented across all tables

#### 6.2 Expiration Trigger (Broken)
From `COMPLETE_MEMBERSHIP_SETUP.sql`:
```sql
CREATE OR REPLACE FUNCTION update_qr_access_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'expired' AND OLD.status = 'active' THEN
        -- Εδώ μπορούμε να προσθέσουμε λογική για αφαίρεση πρόσβασης
        NULL;  -- NO-OP!
    END IF;
    RETURN NEW;
END;
```

**Problem**: 
- Trigger exists but contains no-op (NULL statement)
- Does NOT actually remove QR code access or notify user
- Creates false impression of automatic "cleanup" when membership expires

---

### 7. MISSING AUDIT TRAIL & HISTORY

**Status**: ✗ NOT IMPLEMENTED

There is **NO `membership_history`** or similar audit table. This means:
- Cannot trace **WHEN** a membership expired
- Cannot trace **HOW** (automatic vs. manual cancellation)
- Cannot detect race conditions or double-expiration
- Cannot properly rollback or investigate data issues

---

### 8. DATA RELATIONSHIP MAP

```
auth.users (Supabase Auth)
    ↓ (id)
user_profiles  
    ├─id (legacy, unused or misused)
    └─user_id (CORRECT FK target)
        ↓
        ├→ membership_requests  (FK: user_profiles.user_id) ✓
        ├→ memberships          (FK: user_profiles.user_id) ✓
        ├→ trainers             (FK: user_profiles.user_id) ✓
        ├→ lesson_bookings      (FK: user_profiles.user_id) ✓
        ├→ pilates_bookings     (FK: user_profiles.user_id) ✓
        ├→ pilates_deposits     (FK: user_profiles.user_id) ✓
        ├→ group_assignments    (FK: user_profiles.user_id) ✓
        └→ personal_training_schedules  (FK: user_profiles.user_id) ✓

    BUT SOME tables also reference:
        ├→ QR code tables use (FK: user_profiles.id) ✗ BROKEN
        └→ Some older migrations reference (id) directly ✗ BROKEN
```

---

### 9. APPLICATION LAYER INTERACTIONS

**File: `src/utils/activeMemberships.ts`**

**Finding**: Application explicitly handles Pilates expiration:
```typescript
// Update Pilates memberships status based on deposit availability
const updatePilatesMembershipStatus = async (userId: string): Promise<void> => {
  // Fetches pilates_deposits
  // If deposit_remaining <= 0, sets memberships.is_active = false
  // This is APPLICATION-SIDE logic, NOT database-enforced
}
```

**Problem**:
- Application **POLLS** deposit status (not event-driven)
- **Race condition**: Between polling and actual booking, deposit might be exhausted
- **Silent failure**: User sees "active" membership in UI but booking fails due to no deposit
- **Inconsistent state**: Regular memberships expire via DB cron, pilates via app polling

---

### 10. IDENTIFIED ROOT CAUSES

| Root Cause | Impact | Severity |
|-----------|--------|----------|
| Multiple user identity columns (id vs. user_id) | FK mismatches, orphan records, invisible queries | **CRITICAL** |
| Dual subscription systems (memberships vs. pilates) | Inconsistent state, no cross-system validation | **CRITICAL** |
| Multiple expiration functions (3+ versions) | Non-deterministic expiration, race conditions | **HIGH** |
| Redundant is_active + status columns | Logic confusion, partial updates | **HIGH** |
| Timezone-unsafe expires_at (end_date::timestamptz) | Off-by-one expiration errors | **HIGH** |
| No-op trigger (update_qr_access) | False sense of automatic cleanup | **MEDIUM** |
| Missing audit trail (no _history table) | Cannot diagnose issues, no rollback path | **MEDIUM** |
| Application-side pilates expiration | Race conditions, out-of-sync state | **MEDIUM** |
| RLS policies with mismatched assumptions | Records invisible despite existing | **MEDIUM** |
| Unknown scheduler configuration | Unknown if expiration runs, double-runs, or fails silently | **MEDIUM** |

---

## NEXT STEPS (STEP 2)

**STEP 2: Data Integrity Verification** will run READ-ONLY SQL queries to:
1. Detect duplicate user profiles for same real user
2. Find orphan subscriptions/bookings/lessons
3. Identify active subscriptions appearing expired (or vice versa)
4. Map which identities (id vs. user_id) are being used
5. List subscriptions scheduled to expire today/this week
6. Verify pilates deposit vs. membership status consistency
7. Check for FK violations in all tables

**These queries will be safe and non-destructive. Output will guide design of canonical model.**

---

## PRODUCTION SAFETY NOTES

✓ No writes performed in this step  
✓ No schema modifications  
✓ No data deleted  
✓ Safe to review this report with team  
✓ Ready to proceed to STEP 2 data integrity audit

---

**Report End**
