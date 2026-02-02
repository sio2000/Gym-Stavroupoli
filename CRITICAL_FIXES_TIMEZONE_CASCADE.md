# CRITICAL FIXES - TIMEZONE + MIDNIGHT + CASCADING LOGIC

## FIX 1: TIMEZONE-AWARE DATE UTILITIES

Create new file: `src/utils/dateUtils.ts`

```typescript
/**
 * CRITICAL: Always use UTC for date comparisons in membership logic
 * The gym operates on Greece time (UTC+2/+3)
 * Database uses UTC (CURRENT_DATE in UTC)
 * Frontend must NOT use browser local time
 */

export const getCurrentDateUTC = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Always returns YYYY-MM-DD in UTC
};

export const getDateStringUTC = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Convert any date to UTC string
};

export const isMembershipExpired = (endDate: string): boolean => {
  // Comparison: if end_date is 2026-01-31, membership is active through end of 2026-01-31
  // Expires at 2026-02-01 00:00:00 UTC
  const currentDateUTC = getCurrentDateUTC(); // e.g., "2026-02-01"
  return endDate < currentDateUTC; // "2026-01-31" < "2026-02-01" = true = EXPIRED
};

export const isMembershipActive = (startDate: string, endDate: string): boolean => {
  const currentDateUTC = getCurrentDateUTC();
  return startDate <= currentDateUTC && currentDateUTC <= endDate;
};

export const getRemainingDays = (endDate: string): number => {
  const currentDateUTC = getCurrentDateUTC();
  const current = new Date(currentDateUTC + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const diffMs = end.getTime() - current.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * CRITICAL FOR API QUERIES:
 * When building Supabase queries, always use UTC dates
 */
export const getDateRangeFilters = (checkMembership = true) => {
  const currentDateUTC = getCurrentDateUTC();
  
  return {
    currentDate: currentDateUTC,
    // Use for: .gte('end_date', currentDateUTC) - membership not yet expired
    // Use for: .lte('start_date', currentDateUTC) - membership has started
  };
};
```

---

## FIX 2: UPDATE membershipApi.ts - REMOVE ALL TIMEZONE-DEPENDENT CODE

**File:** `src/utils/membershipApi.ts`

Replace the `getUserActiveMemberships()` function:

```typescript
import { getCurrentDateUTC, isMembershipExpired } from './dateUtils';

export const getUserActiveMemberships = async (userId: string) => {
  const currentDateUTC = getCurrentDateUTC(); // ✅ Always UTC, not browser time!
  
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('status', 'active')
    .lte('start_date', currentDateUTC)      // ✅ Has started
    .gte('end_date', currentDateUTC)        // ✅ Has not expired
    .is('deleted_at', null)                  // ✅ Not soft-deleted
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active memberships:', error);
    return [];
  }

  // Additional safety: filter out any stragglers that somehow got through
  return (memberships || []).filter(m => !isMembershipExpired(m.end_date));
};

export const getMembershipStatus = async (userId: string, membershipType: string) => {
  const currentDateUTC = getCurrentDateUTC();
  
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('membership_type', membershipType)
    .eq('is_active', true)
    .eq('status', 'active')
    .lte('start_date', currentDateUTC)
    .gte('end_date', currentDateUTC)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching membership status:', error);
    return null;
  }

  return membership || null;
};
```

---

## FIX 3: UPDATE activeMemberships.ts - MIDNIGHT BOUNDARY FIX

**File:** `src/utils/activeMemberships.ts`

Replace the `checkMembershipActive()` function:

```typescript
import { getCurrentDateUTC, isMembershipActive } from './dateUtils';

export const checkMembershipActive = (
  startDate: string,
  endDate: string
): boolean => {
  // ✅ Use UTC dates, handles midnight correctly
  return isMembershipActive(startDate, endDate);
};

export const formatMembershipDates = (startDate: string, endDate: string) => {
  const currentDateUTC = getCurrentDateUTC();
  const isActive = isMembershipActive(startDate, endDate);
  
  return {
    startDate: new Date(startDate + 'T00:00:00Z').toLocaleDateString('el-GR'),
    endDate: new Date(endDate + 'T00:00:00Z').toLocaleDateString('el-GR'),
    isActive,
    daysRemaining: calculateRemainingDays(endDate),
  };
};

const calculateRemainingDays = (endDate: string): number => {
  const currentDateUTC = getCurrentDateUTC();
  const current = new Date(currentDateUTC + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  const diffMs = end.getTime() - current.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};
```

---

## FIX 4: DATABASE TRANSACTION SAFETY + CASCADE DEACTIVATION

**File:** Create `DATABASE_CASCADING_FIXES.sql`

```sql
-- ============================================================================
-- CRITICAL FIX: Add transaction safety and cascading logic
-- ============================================================================

-- 1. IMPROVE REFILL FUNCTION WITH EXPLICIT TRANSACTION HANDLING
CREATE OR REPLACE FUNCTION process_weekly_pilates_refills()
RETURNS TABLE (
  refill_count INT,
  error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_refill_count INT := 0;
  v_refill_date DATE;
  v_error_msg TEXT := NULL;
BEGIN
  -- Get current date in UTC
  v_refill_date := CURRENT_DATE;
  
  -- Check if feature is enabled
  IF NOT EXISTS (
    SELECT 1 FROM public.feature_flags 
    WHERE name = 'weekly_pilates_refill_enabled' 
    AND is_enabled = true
  ) THEN
    RETURN QUERY SELECT 0, 'Feature flag disabled'::TEXT;
    RETURN;
  END IF;

  -- Start explicit transaction block with error handling
  BEGIN
    -- For each Ultimate/Medium member with no refill TODAY
    FOR m IN (
      SELECT 
        m.id,
        m.user_id,
        m.membership_type,
        CASE 
          WHEN m.membership_type = 'Ultimate' THEN 3
          WHEN m.membership_type = 'Ultimate Medium' THEN 1
          ELSE 0
        END as refill_amount
      FROM public.memberships m
      WHERE m.membership_type IN ('Ultimate', 'Ultimate Medium')
        AND m.status = 'active'
        AND m.is_active = true
        AND m.start_date <= v_refill_date
        AND m.end_date >= v_refill_date  -- ✅ CRITICAL: Not expired
        AND m.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM public.ultimate_weekly_refills uwr
          WHERE uwr.user_id = m.user_id 
          AND uwr.refill_date = v_refill_date
        )
    ) LOOP
      -- Create record ONLY AFTER successful update
      BEGIN
        -- First update the deposit
        UPDATE public.pilates_deposits
        SET 
          deposit_remaining = CASE 
            WHEN m.membership_type = 'Ultimate' THEN 3
            WHEN m.membership_type = 'Ultimate Medium' THEN 1
            ELSE deposit_remaining
          END,
          updated_at = NOW()
        WHERE user_id = m.user_id 
          AND is_active = true
          AND exists_type = m.membership_type;

        -- ONLY if update succeeded, record the refill event
        INSERT INTO public.ultimate_weekly_refills (
          user_id,
          refill_date,
          refill_amount,
          created_at
        ) VALUES (
          m.user_id,
          v_refill_date,
          m.refill_amount,
          NOW()
        );

        v_refill_count := v_refill_count + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Log but don't fail entire batch - continue with next user
        v_error_msg := COALESCE(v_error_msg || ', ', '') || 
                       'User ' || m.user_id || ': ' || SQLERRM;
        CONTINUE;
      END;
    END LOOP;

    RETURN QUERY SELECT v_refill_count, v_error_msg;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback happened automatically
    RETURN QUERY SELECT 0, 'Transaction failed: ' || SQLERRM;
  END;
END;
$$;

-- ============================================================================
-- 2. ADD CASCADE: When membership expires, deactivate pilates_deposits
-- ============================================================================

CREATE OR REPLACE FUNCTION deactivate_user_pilates_on_membership_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When membership becomes inactive (expires or manually deactivated)
  IF NEW.is_active = false AND OLD.is_active = true THEN
    -- Deactivate ALL pilates deposits for this user
    UPDATE public.pilates_deposits
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS memberships_expire_cascade_deposits ON public.memberships;

-- Create trigger
CREATE TRIGGER memberships_expire_cascade_deposits
AFTER UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION deactivate_user_pilates_on_membership_expiry();

-- ============================================================================
-- 3. IMPROVE AUTO-EXPIRATION TRIGGER: Add end_date comparison safety
-- ============================================================================

CREATE OR REPLACE FUNCTION membership_auto_expire_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Expire membership if end_date has passed
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
    NEW.status := 'expired';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS membership_auto_expire_trigger_trg ON public.memberships;

CREATE TRIGGER membership_auto_expire_trigger_trg
BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION membership_auto_expire_trigger();

-- ============================================================================
-- 4. ENSURE FEATURE FLAG EXISTS
-- ============================================================================

INSERT INTO public.feature_flags (
  name, 
  is_enabled, 
  created_at
) VALUES (
  'weekly_pilates_refill_enabled',
  true,
  NOW()
) ON CONFLICT (name) DO UPDATE 
SET is_enabled = true
WHERE feature_flags.name = 'weekly_pilates_refill_enabled';

-- ============================================================================
-- 5. ENSURE ALL DELETED_AT FILTERS ARE IN PLACE
-- ============================================================================
-- (Update queries in application code - see Fix #2 above)

-- ============================================================================
-- 6. ADD RLS POLICIES FOR MEMBERSHIP ACCESS CONTROL
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can only view their own memberships
CREATE POLICY "Users view own memberships"
ON public.memberships FOR SELECT
USING (user_id = auth.uid());

-- Service role can insert but not bypass dates
CREATE POLICY "Only admins can modify memberships"
ON public.memberships FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT user_id FROM public.user_profiles 
  WHERE role = 'admin'
));

CREATE POLICY "Admins can update memberships"
ON public.memberships FOR UPDATE
USING (auth.role() = 'authenticated' AND auth.uid() IN (
  SELECT user_id FROM public.user_profiles 
  WHERE role = 'admin'
))
WITH CHECK (
  -- Don't allow setting future start dates for bypassing validation
  start_date <= CURRENT_DATE OR start_date IS NULL
);

-- ============================================================================
-- 7. AUDIT: Verify all queries against memberships include deleted_at check
-- ============================================================================

-- This is documented in the application code review (Fix #2)
```

---

## FIX 5: UPDATE ALL QR/BOOKING ENDPOINTS

**Files affected:**
- `src/utils/qrSystem.ts`
- `src/pages/QRPage.tsx`
- `src/pages/BookingPage.tsx`

```typescript
// PATTERN TO APPLY EVERYWHERE:

const checkUserAccess = async (userId: string, type: 'gym' | 'pilates') => {
  const currentDateUTC = getCurrentDateUTC(); // ✅ FIX 1: Always UTC
  
  if (type === 'gym') {
    // Gym access requires Free Gym OR (Ultimate + valid date)
    const { data: gyms } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .in('membership_type', ['Free Gym', 'Ultimate', 'Ultimate Medium'])
      .eq('is_active', true)
      .eq('status', 'active')
      .lte('start_date', currentDateUTC)      // ✅ FIX 1: UTC
      .gte('end_date', currentDateUTC)        // ✅ FIX 1: UTC
      .is('deleted_at', null)                 // ✅ FIX 5: deleted_at check
      .order('end_date', { ascending: false })
      .limit(1);

    return (gyms?.length || 0) > 0;
  }
  
  if (type === 'pilates') {
    // Pilates requires deposit > 0 AND membership valid
    const { data: deposits } = await supabase
      .from('pilates_deposits')
      .select('pd.*, m.end_date, m.start_date')
      .innerJoin('memberships as m', 'pd.user_id', 'm.user_id')
      .eq('pd.user_id', userId)
      .eq('pd.is_active', true)
      .gt('pd.deposit_remaining', 0)
      .eq('m.is_active', true)
      .eq('m.status', 'active')
      .lte('m.start_date', currentDateUTC)    // ✅ FIX 1: UTC
      .gte('m.end_date', currentDateUTC)      // ✅ FIX 1: UTC
      .is('m.deleted_at', null)               // ✅ FIX 5: deleted_at
      .is('pd.deleted_at', null)              // ✅ FIX 5: deleted_at
      .limit(1);

    return (deposits?.length || 0) > 0;
  }
};
```

---

## DEPLOYMENT SEQUENCE

1. ✅ Apply all 7 fixes in order
2. ✅ Run migration script: `DATABASE_CASCADING_FIXES.sql`
3. ✅ Update all frontend files (membershipApi.ts, activeMemberships.ts, etc.)
4. ✅ Verify feature flag is TRUE in production
5. ✅ Test timezone boundaries (noon UTC = 2pm Greece)
6. ✅ Test midnight UTC boundary (00:00, 00:00:01, 23:59:59)
7. ✅ Test Sunday refill by mocking date

---

## VERIFICATION CHECKLIST

- [ ] All `const today = new Date()` replaced with `getCurrentDateUTC()`
- [ ] All `.gte('end_date', today)` uses dateUtils function
- [ ] All queries include `.is('deleted_at', null)`
- [ ] All queries include `.gte('end_date', currentDateUTC)`
- [ ] All queries include `.lte('start_date', currentDateUTC)`
- [ ] Pilates deactivation trigger created
- [ ] Feature flag verified TRUE
- [ ] RLS policies deployed
- [ ] GitHub Action verified running Sundays

