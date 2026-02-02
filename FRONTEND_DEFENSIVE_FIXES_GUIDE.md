/**
 * FRONTEND DEFENSIVE FIXES - userInfoApi.ts
 * 
 * Updates the frontend to add DEFENSIVE layers against stale database flags.
 * Even if database is wrong, frontend will correct it at read time.
 * 
 * Apply these fixes in: src/utils/userInfoApi.ts
 */

// ============================================================================
// FIX 1: STRENGTHEN isActiveMembership() FUNCTION
// ============================================================================

/**
 * CRITICAL FIX: Enhanced membership validation
 * 
 * THREE-LAYER VALIDATION:
 * 1. Check DB flags (is_active, status)
 * 2. Check end_date hasn't passed
 * 3. Check start_date hasn't passed (protection against future dates)
 * 
 * OLD CODE:
 * const isActiveMembership = (m) => {
 *   if (!m.is_active || m.status !== 'active') return false;
 *   if (!m.end_date) return false;
 *   const today = new Date().toISOString().split('T')[0];
 *   return m.end_date >= today;
 * };
 * 
 * ISSUE: Only checks if end_date hasn't passed. Doesn't check start_date.
 */

export const isActiveMembership = (m?: {
  is_active?: boolean;
  status?: string;
  end_date?: string;
  start_date?: string;
}): boolean => {
  if (!m) return false;

  // Layer 1: Check database flags
  if (!m.is_active || m.status !== 'active') return false;

  // Layer 2: Check both dates exist
  if (!m.end_date || !m.start_date) return false;

  const today = new Date().toISOString().split('T')[0];

  // Layer 3a: Check subscription hasn't ended
  if (m.end_date < today) {
    console.warn(`[isActiveMembership] Membership has expired: end_date=${m.end_date} < today=${today}`);
    return false;
  }

  // Layer 3b: Check subscription has started
  if (m.start_date > today) {
    console.warn(`[isActiveMembership] Membership hasn't started yet: start_date=${m.start_date} > today=${today}`);
    return false;
  }

  return true;
};

// ============================================================================
// FIX 2: ADD HELPER FUNCTION FOR SAFE MEMBERSHIP QUERIES
// ============================================================================

/**
 * HELPER: Safe database query builder
 * 
 * Use this when querying memberships to ensure we filter by dates,
 * not just database flags.
 * 
 * BEFORE (VULNERABLE):
 *   const { data } = await supabase
 *     .from('memberships')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .eq('is_active', true);  // ← TRUSTS DB FLAG
 * 
 * AFTER (SAFE):
 *   const { data } = await supabase
 *     .from('memberships')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .eq('is_active', true)
 *     .gte('end_date', today)   // ← DATE FILTER
 *     .lte('start_date', today);// ← DATE FILTER
 */

export const getSafeMembershipQuery = (query: any, filterOptions?: {
  ignoreExpired?: boolean;
  ignoreNotStarted?: boolean;
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Add date filters by default
  if (!filterOptions?.ignoreExpired) {
    query = query.gte('end_date', today);
  }

  if (!filterOptions?.ignoreNotStarted) {
    query = query.lte('start_date', today);
  }

  return query;
};

// ============================================================================
// FIX 3: UPDATE getUserActiveMemberships() TO USE DATE FILTERS
// ============================================================================

/**
 * CRITICAL FIX: Fetch only truly active memberships
 * 
 * Include date filters at the database query level to ensure
 * we don't even return expired memberships from the API call.
 * 
 * BEFORE:
 * const { data: memberships, error } = await supabase
 *   .from('memberships')
 *   .select('id, package_id, ...')
 *   .eq('user_id', userId)
 *   .eq('is_active', true);
 * 
 * AFTER:
 * const { data: memberships, error } = await supabase
 *   .from('memberships')
 *   .select('id, package_id, ...')
 *   .eq('user_id', userId)
 *   .eq('is_active', true)
 *   .gte('end_date', today)    // ADD THIS
 *   .lte('start_date', today);  // ADD THIS
 */

export const getUserActiveMemberships = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      package_id,
      membership_packages (
        id,
        name,
        package_type,
        description
      ),
      status,
      is_active,
      start_date,
      end_date,
      created_at
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('end_date', today)      // ← CRITICAL FIX
    .lte('start_date', today)     // ← CRITICAL FIX
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching user active memberships:', error);
    return { data: [], error };
  }

  // Additional defensive filtering at application level
  const filtered = (data || []).filter(m => isActiveMembership(m));

  return { data: filtered, error: null };
};

// ============================================================================
// FIX 4: UPDATE QR CODE GENERATION TO VALIDATE BY DATES
// ============================================================================

/**
 * CRITICAL FIX: QR code generation must check end_date explicitly
 * 
 * File: src/utils/qrSystem.ts - generateQRCode() function
 * 
 * BEFORE (VULNERABLE):
 * const { data: memberships } = await supabase
 *   .from('memberships')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_active', true);   // ← TRUSTS DB FLAG
 * 
 * AFTER (SAFE):
 * const today = new Date().toISOString().split('T')[0];
 * const { data: memberships } = await supabase
 *   .from('memberships')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_active', true)
 *   .gte('end_date', today)   // ← CRITICAL FIX
 *   .lte('start_date', today);// ← CRITICAL FIX
 */

// In src/utils/qrSystem.ts, find the generateQRCode function and update:

/*
BEFORE:
const { data: memberships, error: membershipError } = await supabase
  .from('memberships')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
  .order('created_at', { ascending: false });

AFTER:
const today = new Date().toISOString().split('T')[0];
const { data: memberships, error: membershipError } = await supabase
  .from('memberships')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
  .gte('end_date', today)       // ← ADD THIS
  .lte('start_date', today)     // ← ADD THIS
  .order('created_at', { ascending: false });
*/

// ============================================================================
// FIX 5: UPDATE PILATES DEPOSIT CHECKING TO VALIDATE PARENT MEMBERSHIP
// ============================================================================

/**
 * HELPER: Check if a Pilates-only user has valid deposits
 * 
 * BEFORE:
 * const { data: deposit } = await supabase
 *   .from('pilates_deposits')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_active', true);
 * 
 * AFTER:
 * const { data: deposit } = await supabase
 *   .from('pilates_deposits')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .eq('is_active', true)
 *   .gt('deposit_remaining', 0)  // ← ADD THIS
 *   .gt('expires_at', now);      // ← ADD THIS
 */

export const checkPilatesDepositValidity = async (userId: string): Promise<{
  isValid: boolean;
  depositRemaining: number;
  expiresAt?: string;
  reason?: string;
}> => {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Fetch ONLY active, non-expired deposits with lessons remaining
    const { data: deposits, error } = await supabase
      .from('pilates_deposits')
      .select('id, deposit_remaining, expires_at, membership_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('deposit_remaining', 0)   // ← CRITICAL: Has lessons available
      .gte('expires_at', now)       // ← CRITICAL: Not expired
      .order('credited_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching Pilates deposit:', error);
      return {
        isValid: false,
        depositRemaining: 0,
        reason: 'Query error: ' + error.message,
      };
    }

    if (!deposits || deposits.length === 0) {
      return {
        isValid: false,
        depositRemaining: 0,
        reason: 'No active Pilates deposits with remaining lessons',
      };
    }

    const deposit = deposits[0];

    // Also verify the parent membership is still active
    if (deposit.membership_id) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('id, is_active, status, end_date, start_date')
        .eq('id', deposit.membership_id)
        .single();

      if (!membership || !isActiveMembership(membership)) {
        return {
          isValid: false,
          depositRemaining: 0,
          reason: 'Parent Pilates membership is expired or inactive',
        };
      }
    }

    return {
      isValid: true,
      depositRemaining: deposit.deposit_remaining,
      expiresAt: deposit.expires_at,
    };
  } catch (error: any) {
    console.error('Exception checking Pilates deposit:', error);
    return {
      isValid: false,
      depositRemaining: 0,
      reason: 'Exception: ' + error.message,
    };
  }
};

// ============================================================================
// FIX 6: UPDATE MEMBERSHIP PAGE DISPLAY TO SHOW REAL STATUS
// ============================================================================

/**
 * In the component that displays memberships (e.g., MembershipCard.tsx):
 * 
 * BEFORE:
 * <div>Status: {membership.status}</div>  // Shows DB value directly
 * 
 * AFTER:
 * <div>Status: {isActiveMembership(membership) ? 'Active' : 'Expired'}</div>
 */

export const getMembershipDisplayStatus = (membership: any): string => {
  // Override DB value with calculated value
  if (isActiveMembership(membership)) {
    return 'Active';
  }

  const today = new Date().toISOString().split('T')[0];
  if (membership.end_date && membership.end_date < today) {
    return 'Expired';
  }

  if (membership.start_date && membership.start_date > today) {
    return 'Not Yet Active';
  }

  // Fallback to DB value if dates are unclear
  return membership.status || 'Unknown';
};

// ============================================================================
// FIX 7: ADD VALIDATION TO BOOKING ENDPOINTS
// ============================================================================

/**
 * CRITICAL: Before allowing a user to book any lesson, verify membership is ACTUALLY active
 * 
 * File: src/api/lessonApi.ts or similar
 * 
 * BEFORE BOOKING:
 * 1. Fetch user's active memberships
 * 2. Filter by date (end_date >= today AND start_date <= today)
 * 3. If Pilates-only: Check deposit > 0
 * 4. Only then allow booking
 * 
 * PSEUDO CODE:
 * const canBook = async (userId, lessonType) => {
 *   const { data: memberships } = await supabase
 *     .from('memberships')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .eq('is_active', true)
 *     .gte('end_date', today)
 *     .lte('start_date', today);
 *   
 *   if (!memberships.length) return false;
 *   
 *   if (lessonType === 'pilates') {
 *     const deposit = await checkPilatesDepositValidity(userId);
 *     return deposit.isValid;
 *   }
 *   
 *   return true;
 * };
 */

// ============================================================================
// SUMMARY OF ALL FRONTEND FIXES
// ============================================================================

/*

FIX #1: Strengthen isActiveMembership() 
  - Add start_date check
  - Check both conditions explicitly

FIX #2: Add getSafeMembershipQuery() helper
  - Provides safe query builder with date filters

FIX #3: Update getUserActiveMemberships()
  - Add .gte('end_date', today) filter
  - Add .lte('start_date', today) filter
  - Filter results at app level again

FIX #4: Update QR code generation (qrSystem.ts)
  - Add date filters to membership query
  - Ensure expired memberships can't generate QR

FIX #5: Improve Pilates deposit validation
  - Check deposit > 0
  - Check expires_at hasn't passed
  - Verify parent membership is active

FIX #6: Update membership display status
  - Don't show raw DB status
  - Calculate based on dates
  - Show "Expired", "Active", "Not Yet Active"

FIX #7: Add booking validation
  - Before allowing any lesson booking
  - Check membership is truly active
  - For Pilates: verify deposit > 0

IMPACT:
✅ Even if database has stale flags, frontend catches it
✅ Users cannot book with expired memberships
✅ QR codes can't be generated for expired users
✅ Display shows accurate status regardless of DB state
✅ Defensive layer prevents most access issues

*/

// ============================================================================
// END OF FRONTEND FIXES
// ============================================================================
