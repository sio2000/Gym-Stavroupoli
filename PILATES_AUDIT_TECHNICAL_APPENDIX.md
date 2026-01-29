# TECHNICAL APPENDIX: PILATES AUDIT - SQL DIAGNOSTIC QUERIES

## 🔧 DIAGNOSTIC QUERIES FOR ISSUE VERIFICATION

### Query 1: Find All Users Missing Weekly Refills

```sql
-- Identify users whose deposits are below target but haven't been refilled yet
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    m.id as membership_id,
    mp.name as package_name,
    m.start_date as activation_date,
    m.end_date as subscription_end,
    EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) as days_since_activation,
    (EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) / 7)::integer as completed_weeks,
    (EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) % 7) as days_into_current_week,
    COALESCE(pd.deposit_remaining, 0) as current_deposit,
    CASE 
        WHEN mp.name = 'Ultimate' THEN 3
        WHEN mp.name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as target_deposit,
    COALESCE(pd.deposit_remaining, 0) < CASE 
        WHEN mp.name = 'Ultimate' THEN 3
        WHEN mp.name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as needs_refill,
    COUNT(uwr.id) as refill_count
FROM public.memberships m
JOIN public.membership_packages mp ON m.package_id = mp.id
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
LEFT JOIN public.ultimate_weekly_refills uwr ON m.user_id = uwr.user_id
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.end_date >= CURRENT_DATE
GROUP BY up.first_name, up.last_name, up.email, m.id, m.start_date, m.end_date, 
         mp.name, pd.deposit_remaining, m.user_id
HAVING COALESCE(pd.deposit_remaining, 0) < CASE 
    WHEN mp.name = 'Ultimate' THEN 3
    WHEN mp.name = 'Ultimate Medium' THEN 1
    ELSE 0
END
ORDER BY m.start_date ASC;
```

**What to look for:**
- **days_into_current_week = 0-6:** Today IS a refill day (should have been processed if % 7 = 0)
- **needs_refill = true AND refill_count = 0:** User never had refill
- **needs_refill = true AND refill_count > 0:** Refill happened but deposit is low (double booking issue)

---

### Query 2: Check for Expired Pilates Memberships Still Marked Active

```sql
-- Find Pilates memberships that should be expired but are still is_active = true
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    m.id as membership_id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.status,
    CURRENT_DATE - m.end_date as days_past_expiration,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN m.is_active = true THEN 'INCORRECTLY MARKED ACTIVE'
        ELSE 'CORRECT'
    END as state
FROM public.memberships m
JOIN public.membership_packages mp ON m.package_id = mp.id
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE m.source_package_name = 'Pilates'
AND m.end_date < CURRENT_DATE
AND m.is_active = true
ORDER BY m.end_date DESC;
```

**What to look for:**
- **Any results:** Database has expired-but-active memberships (BUG CONFIRMED)
- **Count > 0:** Expiration job never ran or is broken

---

### Query 3: Find Deposits Without Valid Active Memberships

```sql
-- Orphan deposits: exist but have no matching active Pilates membership
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    pd.id as deposit_id,
    pd.deposit_remaining,
    pd.is_active,
    pd.expires_at,
    COUNT(m.id) as active_pilates_memberships
FROM public.pilates_deposits pd
JOIN public.user_profiles up ON pd.user_id = up.user_id
LEFT JOIN public.memberships m ON pd.user_id = m.user_id 
    AND m.source_package_name = 'Pilates' 
    AND m.is_active = true 
    AND m.end_date >= CURRENT_DATE
WHERE pd.is_active = true
GROUP BY pd.id, up.first_name, up.last_name, up.email, pd.user_id, 
         pd.deposit_remaining, pd.is_active, pd.expires_at
HAVING COUNT(m.id) = 0
ORDER BY pd.created_at DESC;
```

**What to look for:**
- **Any results:** Deposits exist without valid memberships (state mismatch)
- **Count of results × average deposit:** Total credits allocated to orphan deposits

---

### Query 4: Refill Job Date Alignment Issues

```sql
-- Show which users' activation dates align with Sunday cron schedule
SELECT 
    up.first_name,
    up.last_name,
    m.id as membership_id,
    m.start_date as activation_date,
    (m.start_date + INTERVAL '7 days')::date as day_7_refill_due,
    (m.start_date + INTERVAL '14 days')::date as day_14_refill_due,
    -- What day of week is the activation date?
    TO_CHAR(m.start_date, 'Day') as activation_day_of_week,
    -- What day of week is refill due?
    TO_CHAR((m.start_date + INTERVAL '7 days')::date, 'Day') as day_7_refill_dow,
    -- Is it Sunday?
    EXTRACT(DOW FROM (m.start_date + INTERVAL '7 days')::date) = 0 as is_refill_on_sunday,
    -- Cron runs every Sunday; will it catch this user?
    CASE
        WHEN EXTRACT(DOW FROM (m.start_date + INTERVAL '7 days')::date) = 0 THEN 'ALIGNED: Cron runs Sunday, refill due Sunday'
        ELSE 'MISALIGNED: Refill due ' || TO_CHAR((m.start_date + INTERVAL '7 days')::date, 'Day') || ' but cron runs Sunday'
    END as alignment_status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY activation_date DESC
LIMIT 20;
```

**What to look for:**
- **is_refill_on_sunday = false for most users:** BUG CONFIRMED (cron-to-user misalignment)
- **alignment_status = MISALIGNED:** Most users have misaligned refill days

---

### Query 5: Find Users Who Lost Deposits Between Bookings

```sql
-- Users whose deposits decreased unexpectedly (not from bookings)
SELECT 
    up.first_name,
    up.last_name,
    up.email,
    m.user_id,
    m.id as pilates_membership_id,
    (SELECT COUNT(*) FROM public.pilates_bookings pb 
     WHERE pb.user_id = m.user_id 
     AND pb.status = 'confirmed' 
     AND pb.created_at >= CURRENT_DATE - INTERVAL '7 days') as bookings_last_week,
    (SELECT COALESCE(SUM(credits_used), 0) FROM public.pilates_bookings pb 
     WHERE pb.user_id = m.user_id 
     AND pb.status = 'completed' 
     AND pb.created_at >= CURRENT_DATE - INTERVAL '7 days') as credits_used_last_week,
    (SELECT deposit_remaining FROM public.pilates_deposits 
     WHERE user_id = m.user_id AND is_active = true 
     ORDER BY credited_at DESC LIMIT 1) as current_deposit,
    (SELECT COUNT(*) FROM public.ultimate_weekly_refills 
     WHERE user_id = m.user_id 
     AND refill_date >= CURRENT_DATE - INTERVAL '7 days') as refills_last_week
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY m.user_id;
```

**What to look for:**
- **credits_used_last_week > 0 AND refills_last_week = 0:** User booked classes but no refill → **MISSING REFILL BUG**
- **current_deposit < 0:** Impossible (check constraint should prevent); if exists → **DATA CORRUPTION**

---

### Query 6: Weekly Refill Execution Timeline

```sql
-- Show what refills have been processed and when
SELECT 
    uwr.refill_date,
    uwr.package_name,
    COUNT(*) as users_refilled,
    SUM(uwr.new_deposit_amount) as total_lessons_credited,
    AVG(uwr.new_deposit_amount) as avg_deposit,
    MAX(uwr.refill_week_number) as latest_refill_week,
    COUNT(DISTINCT DATE_TRUNC('week', uwr.created_at)) as weeks_with_refills
FROM public.ultimate_weekly_refills uwr
GROUP BY uwr.refill_date, uwr.package_name
ORDER BY uwr.refill_date DESC
LIMIT 20;
```

**What to look for:**
- **gaps in refill_date:** Missing dates indicate failed/skipped refills
- **same refill_date, different users:** Check if all users from same week were processed
- **users_refilled count varies:** Inconsistent execution

---

## 🔧 REPAIR QUERIES (READ-ONLY REPORT - DO NOT EXECUTE)

These queries SHOULD NOT be executed without explicit approval. Listed here for documentation only.

### Repair 1: Fix Expired Pilates Memberships

```sql
-- ⚠️ DO NOT EXECUTE - READ-ONLY AUDIT ONLY
-- This would be needed to fix expired-but-active memberships
UPDATE memberships 
SET 
    is_active = false,
    status = 'expired',
    updated_at = NOW()
WHERE 
    source_package_name = 'Pilates'
    AND end_date < CURRENT_DATE
    AND is_active = true;

-- Verify:
SELECT COUNT(*) as fixed_count FROM memberships 
WHERE source_package_name = 'Pilates' AND is_active = false;
```

---

### Repair 2: Orphan Deposit Cleanup

```sql
-- ⚠️ DO NOT EXECUTE - READ-ONLY AUDIT ONLY
-- Mark deposits as inactive if no matching active membership
UPDATE pilates_deposits pd
SET 
    is_active = false,
    updated_at = NOW()
WHERE 
    pd.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = pd.user_id
        AND m.source_package_name = 'Pilates'
        AND m.is_active = true
        AND m.end_date >= CURRENT_DATE
    );

-- Verify:
SELECT COUNT(*) as orphaned_count FROM pilates_deposits WHERE is_active = false;
```

---

## 📊 DASHBOARD MONITORING QUERIES

### Real-Time Pilates Health Check

```sql
SELECT 
    'Overall System Health' as metric,
    (SELECT COUNT(*) FROM memberships 
     WHERE source_package_name IN ('Ultimate', 'Ultimate Medium') AND is_active = true) as active_ultimate_users,
    (SELECT COUNT(*) FROM pilates_deposits WHERE is_active = true) as active_deposits,
    (SELECT COUNT(*) FROM memberships 
     WHERE source_package_name = 'Pilates' AND is_active = true AND end_date >= CURRENT_DATE) as valid_pilates_memberships,
    (SELECT COUNT(*) FROM memberships 
     WHERE source_package_name = 'Pilates' AND is_active = true AND end_date < CURRENT_DATE) as expired_pilates_still_active,
    (SELECT COUNT(*) FROM pilates_deposits pd 
     WHERE is_active = true 
     AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = pd.user_id AND m.source_package_name = 'Pilates' AND m.is_active = true)) as orphan_deposits
UNION ALL
SELECT 
    'Last Week Refills' as metric,
    (SELECT COUNT(DISTINCT user_id) FROM ultimate_weekly_refills WHERE refill_date >= CURRENT_DATE - INTERVAL '7 days') as users_refilled,
    (SELECT COUNT(*) FROM ultimate_weekly_refills WHERE refill_date >= CURRENT_DATE - INTERVAL '7 days') as total_refill_records,
    (SELECT SUM(new_deposit_amount) FROM ultimate_weekly_refills WHERE refill_date >= CURRENT_DATE - INTERVAL '7 days') as total_deposits_credited,
    (SELECT COUNT(*) FROM ultimate_weekly_refills WHERE refill_date >= CURRENT_DATE - INTERVAL '7 days' AND previous_deposit_amount < target_deposit_amount) as topups_applied,
    (SELECT COUNT(*) FROM ultimate_weekly_refills WHERE refill_date >= CURRENT_DATE - INTERVAL '7 days' AND previous_deposit_amount >= target_deposit_amount) as no_change_records;
```

---

## 🧪 INTEGRATION TEST TEMPLATES

### Test: Verify Refill Day Calculation

```typescript
// Test file: verify-refill-day-calculation.test.ts
import { describe, it, expect } from 'vitest';

describe('Refill Day Calculation', () => {
  it('should correctly identify refill-due dates', () => {
    // User activated Monday Jan 20, 2025
    const activationDate = new Date('2025-01-20');
    
    // Refill due Monday Jan 27 (day 7)
    const refillDueDate = new Date('2025-01-27');
    
    // Cron runs Sunday Jan 26
    const cronExecutionDate = new Date('2025-01-26');
    
    const daysSinceActivation = (refillDueDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24);
    const modulo = daysSinceActivation % 7;
    
    // PROBLEM: modulo will be 0 on day 7, but cron runs day 6
    // So cron will see daysSinceActivation = 6, modulo = 6, skip refill
    expect(daysSinceActivation).toBe(7);
    expect(modulo).toBe(0);
    
    // Actual cron execution day:
    const daysOnCronDay = (cronExecutionDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24);
    const moduloOnCronDay = daysOnCronDay % 7;
    
    // FAILS: modulo is 6, not 0, so refill is SKIPPED
    expect(moduloOnCronDay).toBe(0); // ← This will FAIL
  });
});
```

---

### Test: Verify Expiration Enforcement

```typescript
// Test file: verify-expiration-enforcement.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '@/config/supabase';

describe('Expiration Enforcement', () => {
  it('should mark memberships as inactive when end_date passes', async () => {
    // Create test membership with past end_date
    const { data: membership, error: createError } = await supabase
      .from('memberships')
      .insert({
        user_id: 'test-user-id',
        package_id: 'pilates-package-id',
        start_date: '2024-01-01',
        end_date: '2025-01-15', // Yesterday
        is_active: true,
        status: 'active'
      })
      .select()
      .single();
    
    expect(createError).toBeNull();
    
    // Manually expire (no auto job exists!)
    await supabase.rpc('expire_memberships');
    
    // Check if is_active was updated
    const { data: expired } = await supabase
      .from('memberships')
      .select('is_active, status')
      .eq('id', membership.id)
      .single();
    
    expect(expired.is_active).toBe(false); // ← FAILS: still true
    expect(expired.status).toBe('expired'); // ← FAILS: still 'active'
  });
});
```

---

## 📋 AUDIT CHECKLIST FOR FIXING

- [ ] **Code Review Required:** Review proposed fix for process_weekly_pilates_refills()
- [ ] **Testing Required:** Run test suite with date logic fix
- [ ] **Staging Deploy:** Deploy to staging, monitor 2 weeks
- [ ] **Production Planning:** Schedule off-peak deployment window
- [ ] **Data Cleanup:** Identify and fix any corrupted data from existing bugs
- [ ] **Monitoring:** Set up alerts for:
  - [ ] Refill failures (error_count > 0)
  - [ ] Expired memberships with is_active = true
  - [ ] Orphan deposits (no matching membership)
  - [ ] Zero deposits (user can't book)
- [ ] **Post-Deploy Validation:** Run diagnostic queries above to verify fixes

---

**END OF TECHNICAL APPENDIX**

