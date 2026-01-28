-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 6: APPLICATION LAYER SAFETY ADJUSTMENTS
-- ══════════════════════════════════════════════════════════════════════════════
--
-- This document describes APPLICATION-SIDE changes needed to work safely with
-- the new canonical subscription system.
--
-- Changes to: src/utils/activeMemberships.ts and related API endpoints
--
-- ══════════════════════════════════════════════════════════════════════════════

✓ RULE 1: Use CANONICAL user_id ONLY
═══════════════════════════════════════════════════════════════════════════════

OLD CODE:
  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId);

NEW CODE:
  // userId MUST be the canonical user_id (= auth.users.id)
  // Never use user_profiles.id
  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId);  // ← Ensure this is auth.uid(), not profile.id

VERIFY:
  When fetching current user, ALWAYS use:
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user.id;  // ← This is canonical user_id
  
  NOT:
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId);
  // Don't pass profile.id around — it's legacy!

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 2: Read FROM canonical tables, use CORRECT status checks
═══════════════════════════════════════════════════════════════════════════════

OLD CODE (from src/utils/activeMemberships.ts):
  const { data: activeMemberships } = await supabase
    .from('memberships')
    .select('id, status, is_active, end_date, package:membership_packages(name, package_type)')
    .eq('user_id', userId)
    .eq('is_active', true)  // ← Wrong: is_active is DERIVED
    .gte('end_date', today);

PROBLEM:
  - is_active might be stale (not updated if status changed)
  - Redundant check (status='active' should be enough)

NEW CODE:
  const { data: activeMemberships } = await supabase
    .from('memberships')
    .select(`
      id,
      status,
      is_active,
      end_date,
      expires_at,
      package:membership_packages(id, name, package_type)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')  // ← Primary check: status must be 'active'
    .is('deleted_at', null)  // ← Ensure not soft-deleted
    .gt('end_date', today);  // ← Ensure not expired (safety)

EXPLANATION:
  - status='active' is the SINGLE SOURCE OF TRUTH
  - is_active is computed trigger-side (for consistency)
  - end_date is a guard (matches expires_at)
  - deleted_at check prevents visibility of soft-deleted records

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 3: Pilates deposit MUST be synchronized with membership
═══════════════════════════════════════════════════════════════════════════════

OLD CODE:
  // Check pilates deposit SEPARATELY from membership status
  const { data: pilatesDeposit } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining, is_active')
    .eq('user_id', userId)
    .single();
  
  // Independently decide if membership is active based on deposit
  if (pilatesDeposit.deposit_remaining <= 0) {
    // Membership is "inactive" due to empty deposit
    // BUT this is not reflected in memberships.status
  }

PROBLEM:
  - Application logic decides membership status (race condition)
  - Database doesn't enforce consistency
  - User sees "active" in API but can't book (confusing)

NEW CODE:
  // Method 1: Let database handle it (PREFERRED)
  // The subscription_expire_worker() function will automatically expire
  // memberships when pilates_deposits.deposit_remaining <= 0
  
  const { data: activeMemberships } = await supabase
    .from('memberships')
    .select(`
      id,
      user_id,
      status,
      package:membership_packages(package_type)
    `)
    .eq('user_id', userId)
    .eq('status', 'active');
  
  // Trust the database: if membership.status='active', it's valid
  // The server-side trigger ensures this is kept in sync with pilates_deposits
  
  // Method 2: If you NEED to check pilates deposit manually
  // only use it for UI display or logging, NOT for access control:
  
  const { data: pilatesDeposit } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining, is_active')
    .eq('user_id', userId)
    .eq('linked_to_membership', true);
  
  // Use this ONLY for display:
  // "Your subscription has X classes remaining"
  
  // For ACCESS CONTROL, ALWAYS use membership.status:
  if (activeMemberships.some(m => m.package.package_type === 'pilates')) {
    // User can book pilates
  }

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 4: Lesson Booking MUST check membership before creating
═══════════════════════════════════════════════════════════════════════════════

OLD CODE:
  async function bookLesson(userId, lessonId, date) {
    // Just create booking, no membership check
    const { data } = await supabase
      .from('lesson_bookings')
      .insert({ user_id: userId, lesson_id: lessonId, booking_date: date });
    return data;
  }

PROBLEM:
  - User can book lessons without active membership
  - Booking exists but user is not allowed
  - Later when membership expires, booking is orphaned

NEW CODE:
  async function bookLesson(userId, lessonId, date) {
    // Step 1: Check user has active membership
    const { data: activeMemberships } = await supabase
      .from('memberships')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null);
    
    if (!activeMemberships || activeMemberships.length === 0) {
      throw new Error('No active membership. Please purchase a membership to book lessons.');
    }
    
    // Step 2: Check booking doesn't already exist
    const { data: existing } = await supabase
      .from('lesson_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('booking_date', date)
      .eq('status', 'confirmed')
      .maybeSingle();
    
    if (existing) {
      throw new Error('You are already booked for this lesson.');
    }
    
    // Step 3: Check lesson capacity
    const { data: bookingCount } = await supabase
      .from('lesson_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('lesson_id', lessonId)
      .eq('booking_date', date)
      .eq('status', 'confirmed');
    
    const { data: lesson } = await supabase
      .from('lessons')
      .select('capacity')
      .eq('id', lessonId)
      .single();
    
    if (bookingCount.count >= lesson.capacity) {
      throw new Error('This lesson is fully booked.');
    }
    
    // Step 4: Create booking (with DB-level trigger as additional safety)
    const { data: booking } = await supabase
      .from('lesson_bookings')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        booking_date: date,
        status: 'confirmed'
      })
      .select();
    
    return booking;
  }

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 5: ON CANCEL/CANCELLATION, log reason in membership_history
═══════════════════════════════════════════════════════════════════════════════

OLD CODE:
  // Admin cancels a membership
  async function cancelMembership(membershipId) {
    await supabase
      .from('memberships')
      .update({ status: 'cancelled' })
      .eq('id', membershipId);
  }

PROBLEM:
  - No reason recorded
  - Cannot debug why memberships were cancelled
  - No audit trail for compliance

NEW CODE:
  // Admin cancels a membership (with reason)
  async function cancelMembership(membershipId, reason, adminUserId) {
    const now = new Date();
    
    // Update membership
    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,  // 'user_request', 'payment_failed', 'admin_cancel', etc.
        cancelled_at: now.toISOString(),
        cancelled_by: adminUserId,
        updated_at: now.toISOString()
      })
      .eq('id', membershipId);
    
    if (error) throw error;
    
    // Log to history (server-side will also do this via trigger, but redundant logging is safe)
    const { error: historyError } = await supabase
      .from('migration_audit.membership_history')
      .insert({
        membership_id: membershipId,
        old_status: 'active',  // Assuming we're cancelling an active one
        new_status: 'cancelled',
        reason: reason,
        performed_by: adminUserId,
        triggered_by: 'api_call'
      });
    
    if (historyError) console.warn('Failed to log history:', historyError);
    
    return { success: !error };
  }

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 6: DO NOT manually set is_active, expires_at, or DERIVED columns
═══════════════════════════════════════════════════════════════════════════════

FORBIDDEN:
  // DO NOT DO THIS!
  await supabase
    .from('memberships')
    .update({ is_active: false })  // ← Forbidden: is_active is computed
    .eq('id', membershipId);

  await supabase
    .from('memberships')
    .update({ expires_at: futureDate })  // ← Forbidden: derives from end_date
    .eq('id', membershipId);

ALLOWED:
  // Set ONLY business values
  await supabase
    .from('memberships')
    .update({
      status: 'expired',  // ← OK: state change
      end_date: endDate,  // ← OK: business logic
      cancellation_reason: reason,  // ← OK: metadata
      auto_renew: false  // ← OK: configuration
    })
    .eq('id', membershipId);

WHY:
  Triggers will automatically recompute is_active, expires_at, and other derived fields.
  If you set them directly, they'll become stale and cause data inconsistency.

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 7: HANDLE SOFT-DELETES (deleted_at) CORRECTLY
═══════════════════════════════════════════════════════════════════════════════

When "deleting" a membership (should be rare):

  await supabase
    .from('memberships')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'cancelled'  // ← Mark as cancelled too
    })
    .eq('id', membershipId);

When READING memberships, ALWAYS exclude soft-deletes:

  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);  // ← Always add this

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 8: USE PROPER ERROR HANDLING FOR PILATES BOOKINGS
═══════════════════════════════════════════════════════════════════════════════

OLD CODE (src/utils/activeMemberships.ts):
  const { data, error } = await supabase.rpc('book_pilates_class', {
    p_user_id: userId,
    p_slot_id: slotId
  });
  
  if (error) {
    console.error('Booking failed:', error);
  }

IMPROVED CODE:
  const { data, error } = await supabase.rpc('book_pilates_class', {
    p_user_id: userId,
    p_slot_id: slotId
  });
  
  if (error) {
    // Handle specific error cases
    if (error.message.includes('No active deposit')) {
      throw new Error('You have no available classes. Please purchase a package.');
    } else if (error.message.includes('Slot full')) {
      throw new Error('This class is fully booked.');
    } else if (error.message.includes('not available')) {
      throw new Error('This class slot is no longer available.');
    } else {
      throw new Error(`Booking failed: ${error.message}`);
    }
  }
  
  // Log successful booking
  if (data && data.booking_id) {
    console.log(`Booked class ${slotId} for user ${userId}. Remaining: ${data.deposit_remaining}`);
  }
  
  return data;

═══════════════════════════════════════════════════════════════════════════════

✓ RULE 9: MONITOR MEMBERSHIP EXPIRY PROACTIVELY
═══════════════════════════════════════════════════════════════════════════════

NEW: Add dashboard endpoint to show users their membership status:

  async function getUserMembershipStatus(userId) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select(`
        id,
        status,
        end_date,
        package:membership_packages(id, name, package_type),
        days_until_expiry: EXTRACT(DAY FROM (end_date::timestamp - NOW()))
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('end_date', { ascending: true });
    
    return memberships.map(m => ({
      ...m,
      expiryStatus: 
        m.days_until_expiry <= 0 ? 'EXPIRED' :
        m.days_until_expiry <= 7 ? 'EXPIRING_SOON' :
        m.days_until_expiry <= 30 ? 'EXPIRING_THIS_MONTH' :
        'ACTIVE',
      expiryWarning: m.days_until_expiry <= 7 ? 'Your membership expires soon!' : null
    }));
  }

═══════════════════════════════════════════════════════════════════════════════

TESTING CHECKLIST (for developers):
═══════════════════════════════════════════════════════════════════════════════

□ Test 1: User with active membership can book lesson
  - Verify lesson appears in UI
  - Verify booking created successfully
  - Verify user sees booking in calendar

□ Test 2: User WITHOUT active membership cannot book lesson
  - Verify error message shown: "No active membership"
  - Verify booking NOT created
  - Verify user directed to purchase membership

□ Test 3: Membership expires, booking stays but marked as "inactive"
  - Set end_date to yesterday
  - Run subscription_expire_worker()
  - Verify membership.status = 'expired'
  - Verify old bookings still exist (historical record)
  - Verify user cannot book new lessons

□ Test 4: Pilates deposit drops to zero, membership should auto-expire
  - Book pilates class until deposit_remaining = 0
  - Verify pilates_deposits.is_active = false
  - Run subscription_expire_worker()
  - Verify membership linked to pilates should expire

□ Test 5: User sees correct "classes remaining" count
  - User has pilates membership + active deposit
  - Verify UI shows correct deposit_remaining count
  - After booking, verify count decrements
  - When empty, verify UI shows "No classes remaining"

□ Test 6: Cancellation creates audit trail
  - Admin cancels a membership
  - Verify migration_audit.membership_history entry created
  - Verify cancellation_reason recorded
  - Verify cancelled_by recorded

□ Test 7: Duplicate user consolidation works
  - Create duplicate profile for same auth.users.id
  - Run merge logic
  - Verify is_merged = true on duplicate
  - Verify merged_into_user_id points to canonical
  - Verify all FK records re-linked to canonical
  - Verify NO data loss

═══════════════════════════════════════════════════════════════════════════════
END OF STEP 6
═══════════════════════════════════════════════════════════════════════════════
