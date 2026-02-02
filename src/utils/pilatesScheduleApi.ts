import { supabase } from '@/config/supabase';
import { 
  PilatesScheduleSlot, 
  PilatesBooking, 
  PilatesAvailableSlot, 
  PilatesScheduleFormData,
  PilatesBookingFormData 
} from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// =====================================================
// PILATES SUBSCRIPTION LOGGING AND VALIDATION
// =====================================================
// CRITICAL: All logs prefixed with [PILATES-FIX] for easy filtering
// These logs help identify which code paths are executed and verify
// that subscription state is correctly synchronized

interface PilatesSubscriptionStatus {
  has_active_membership: boolean;
  membership_end_date: string | null;
  membership_days_remaining: number | null;
  has_active_deposit: boolean;
  deposit_remaining: number | null;
  deposit_expires_at: string | null;
  can_book_pilates_class: boolean;
  can_access_gym_via_pilates: boolean;
  status_message: string;
}

// Get comprehensive Pilates subscription status using deterministic DB function
export const getPilatesSubscriptionStatus = async (userId: string): Promise<PilatesSubscriptionStatus | null> => {
  console.log('[PILATES-FIX] getPilatesSubscriptionStatus called for user:', userId);
  
  try {
    const { data, error } = await supabase.rpc('get_pilates_subscription_status', { p_user_id: userId });
    
    if (error) {
      console.error('[PILATES-FIX] Error getting subscription status:', error);
      // Fallback to manual check if RPC doesn't exist
      return await getPilatesSubscriptionStatusFallback(userId);
    }
    
    const status = data?.[0];
    console.log('[PILATES-FIX] Subscription status:', {
      userId,
      has_active_membership: status?.has_active_membership,
      membership_end_date: status?.membership_end_date,
      membership_days_remaining: status?.membership_days_remaining,
      has_active_deposit: status?.has_active_deposit,
      deposit_remaining: status?.deposit_remaining,
      can_book: status?.can_book_pilates_class,
      can_access: status?.can_access_gym_via_pilates,
      message: status?.status_message
    });
    
    return status || null;
  } catch (err) {
    console.error('[PILATES-FIX] Exception in getPilatesSubscriptionStatus:', err);
    return await getPilatesSubscriptionStatusFallback(userId);
  }
};

// Fallback function if RPC doesn't exist
const getPilatesSubscriptionStatusFallback = async (userId: string): Promise<PilatesSubscriptionStatus | null> => {
  console.log('[PILATES-FIX] Using fallback subscription status check for user:', userId);
  
  // Using local timezone to avoid UTC conversion issues
  const today = formatDateLocal(new Date());
  
  // Check membership with DETERMINISTIC date validation
  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select(`
      id,
      status,
      end_date,
      membership_packages!inner(name, package_type)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', today)  // CRITICAL: Deterministic date check
    .or('membership_packages.name.ilike.%pilates%,membership_packages.name.ilike.%ultimate%');
  
  if (membershipError) {
    console.error('[PILATES-FIX] Error in fallback membership check:', membershipError);
    return null;
  }
  
  const membership = memberships?.[0];
  const hasActiveMembership = !!membership;
  const membershipEndDate = membership?.end_date;
  const membershipDaysRemaining = membershipEndDate 
    ? Math.ceil((new Date(membershipEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Check deposit with DETERMINISTIC expiry validation
  const now = new Date().toISOString();
  const { data: deposits, error: depositError } = await supabase
    .from('pilates_deposits')
    .select('id, deposit_remaining, expires_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .or(`expires_at.is.null,expires_at.gt.${now}`)  // CRITICAL: Deterministic expiry check
    .order('credited_at', { ascending: false })
    .limit(1);
  
  if (depositError) {
    console.error('[PILATES-FIX] Error in fallback deposit check:', depositError);
  }
  
  const deposit = deposits?.[0];
  const hasActiveDeposit = !!deposit && deposit.deposit_remaining > 0;
  
  const canBook = hasActiveMembership && hasActiveDeposit;
  const canAccess = hasActiveMembership && hasActiveDeposit;
  
  let statusMessage = '';
  if (!hasActiveMembership) {
    statusMessage = 'Δεν υπάρχει ενεργή συνδρομή Pilates';
  } else if (!hasActiveDeposit) {
    statusMessage = 'Δεν υπάρχουν διαθέσιμα μαθήματα Pilates';
  } else if (membershipDaysRemaining && membershipDaysRemaining <= 7) {
    statusMessage = `Η συνδρομή λήγει σε ${membershipDaysRemaining} ημέρες - ${deposit?.deposit_remaining} μαθήματα απομένουν`;
  } else {
    statusMessage = `Ενεργή συνδρομή - ${deposit?.deposit_remaining} μαθήματα απομένουν`;
  }
  
  const result: PilatesSubscriptionStatus = {
    has_active_membership: hasActiveMembership,
    membership_end_date: membershipEndDate,
    membership_days_remaining: membershipDaysRemaining,
    has_active_deposit: hasActiveDeposit,
    deposit_remaining: deposit?.deposit_remaining || null,
    deposit_expires_at: deposit?.expires_at || null,
    can_book_pilates_class: canBook,
    can_access_gym_via_pilates: canAccess,
    status_message: statusMessage
  };
  
  console.log('[PILATES-FIX] Fallback subscription status:', result);
  return result;
};

// Validate if user can book a Pilates class (deterministic check)
export const canUserBookPilatesClass = async (userId: string): Promise<{ canBook: boolean; reason: string }> => {
  console.log('[PILATES-FIX] canUserBookPilatesClass called for user:', userId);
  
  const status = await getPilatesSubscriptionStatus(userId);
  
  if (!status) {
    console.log('[PILATES-FIX] No subscription status found - booking NOT allowed');
    return { canBook: false, reason: 'Σφάλμα κατά τον έλεγχο της συνδρομής' };
  }
  
  if (!status.has_active_membership) {
    console.log('[PILATES-FIX] No active membership - booking NOT allowed');
    return { canBook: false, reason: 'Δεν υπάρχει ενεργή συνδρομή Pilates' };
  }
  
  if (!status.has_active_deposit) {
    console.log('[PILATES-FIX] No active deposit - booking NOT allowed');
    return { canBook: false, reason: 'Δεν υπάρχουν διαθέσιμα μαθήματα' };
  }
  
  if ((status.deposit_remaining || 0) <= 0) {
    console.log('[PILATES-FIX] Zero deposit remaining - booking NOT allowed');
    return { canBook: false, reason: 'Τα μαθήματά σας τελείωσαν' };
  }
  
  console.log('[PILATES-FIX] Booking ALLOWED - deposit_remaining:', status.deposit_remaining);
  return { canBook: true, reason: status.status_message };
};

// Run expiration check (call this periodically or on app load)
export const runPilatesExpirationCheck = async (): Promise<{ expired_memberships: number; expired_deposits: number } | null> => {
  console.log('[PILATES-FIX] Running expiration check...');
  
  try {
    const { data, error } = await supabase.rpc('expire_pilates_subscriptions');
    
    if (error) {
      console.error('[PILATES-FIX] Error running expiration check:', error);
      return null;
    }
    
    const result = data?.[0];
    console.log('[PILATES-FIX] Expiration check complete:', {
      expired_memberships: result?.expired_memberships,
      expired_deposits: result?.expired_deposits,
      total_processed: result?.total_processed
    });
    
    return result || null;
  } catch (err) {
    console.error('[PILATES-FIX] Exception in runPilatesExpirationCheck:', err);
    return null;
  }
};

// Pilates Schedule Slots API
export const getPilatesScheduleSlots = async (startDate?: string, endDate?: string): Promise<PilatesScheduleSlot[]> => {
  let query = supabase
    .from('pilates_schedule_slots')
    .select('*');

  // Filter by date range if provided for better performance
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching pilates schedule slots:', error);
    throw error;
  }

  return data || [];
};

// Get only active pilates schedule slots
export const getActivePilatesScheduleSlots = async (): Promise<PilatesScheduleSlot[]> => {
  const { data, error } = await supabase
    .from('pilates_schedule_slots')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching active pilates schedule slots:', error);
    throw error;
  }

  return data || [];
};

export const getPilatesAvailableSlots = async (startDate?: string, endDate?: string): Promise<PilatesAvailableSlot[]> => {
  try {
    console.log('Fetching available pilates slots...');
    const todayStr = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    const start = startDate || todayStr;
    // default end = start + 13 days (2 εβδομάδες Δευ-Παρ ~ 10 εργάσιμες)
    const end = endDate || (() => {
      const base = new Date(start + 'T12:00:00');
      base.setDate(base.getDate() + 13);
      const y = base.getFullYear();
      const m = String(base.getMonth() + 1).padStart(2, '0');
      const day = String(base.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    // Use occupancy view for fast counts
    const { data, error } = await supabase
      .from('pilates_slots_with_occupancy')
      .select('*')
      .eq('is_active', true)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching available pilates slots:', error);
      throw error;
    }

    console.log('Fetched slots from DB:', data?.length || 0);
    console.log('Sample slots from DB:', data?.slice(0, 5));

    // Transform the data to match PilatesAvailableSlot interface
    // DON'T filter weekend slots - show exactly what admin created
    const availableSlots: PilatesAvailableSlot[] = (data || [])
      .map((slot: any) => ({
        id: slot.slot_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: slot.max_capacity,
        available_capacity: Math.max(0, (slot.max_capacity || 0) - (slot.booked_count || 0)),
        status: 'available' as const,
        is_active: slot.is_active,
        booked_count: slot.booked_count || 0
      }));

    console.log('Transformed slots:', availableSlots.length);
    console.log('Sample transformed slots:', availableSlots.slice(0, 5));
    return availableSlots;
  } catch (error) {
    console.error('Error fetching available pilates slots:', error);
    throw error;
  }
};

// PILATES-FIX: Get active pilates deposit with DETERMINISTIC expiry validation
export const getActivePilatesDeposit = async (
  userId: string
): Promise<{ deposit_remaining: number; is_active: boolean; expires_at?: string; package_id?: string; id?: string } | null> => {
  console.log('[PILATES-FIX] getActivePilatesDeposit called for user:', userId);
  
  const now = new Date().toISOString();
  
  // PILATES-FIX: Query with DETERMINISTIC expiry check
  // A deposit is only valid if:
  // 1. is_active = true
  // 2. deposit_remaining > 0
  // 3. expires_at is NULL OR expires_at > NOW
  const { data, error } = await supabase
    .from('pilates_deposits')
    .select('id, deposit_remaining, is_active, expires_at, credited_at, package_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .or(`expires_at.is.null,expires_at.gt.${now}`)  // CRITICAL: Deterministic expiry check
    .order('credited_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[PILATES-FIX] Error fetching active pilates deposit:', error);
    return null;
  }
  
  if (!data || data.length === 0) {
    // Debug: Log why no active deposit found
    console.log('[PILATES-FIX] No valid active pilates deposit for user:', userId);
    
    // Fallback: log last 3 deposits to understand the state
    const { data: lastDeposits } = await supabase
      .from('pilates_deposits')
      .select('id, deposit_remaining, is_active, expires_at, credited_at, package_id')
      .eq('user_id', userId)
      .order('credited_at', { ascending: false })
      .limit(3);
    
    if (lastDeposits && lastDeposits.length > 0) {
      console.log('[PILATES-FIX] User recent deposits (for debug):', lastDeposits.map(d => ({
        id: d.id,
        deposit_remaining: d.deposit_remaining,
        is_active: d.is_active,
        expires_at: d.expires_at,
        isExpired: d.expires_at ? new Date(d.expires_at) < new Date() : false,
        credited_at: d.credited_at
      })));
    } else {
      console.log('[PILATES-FIX] User has NO deposit records at all');
    }
    
    return null;
  }
  
  const deposit = data[0];
  console.log('[PILATES-FIX] Active deposit found:', {
    userId,
    depositId: deposit.id,
    deposit_remaining: deposit.deposit_remaining,
    is_active: deposit.is_active,
    expires_at: deposit.expires_at,
    credited_at: deposit.credited_at,
    package_id: deposit.package_id,
    isExpiringSoon: deposit.expires_at ? (new Date(deposit.expires_at).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 : false
  });
  
  return deposit;
};

// Realtime subscriptions helpers
export const subscribePilatesRealtime = (
  onChange: () => void
): RealtimeChannel => {
  const channel = supabase
    .channel('realtime:pila')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pilates_bookings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pilates_schedule_slots' }, onChange)
    .subscribe();
  return channel;
};

export const createPilatesScheduleSlot = async (slotData: PilatesScheduleFormData): Promise<PilatesScheduleSlot> => {
  const { data, error } = await supabase
    .from('pilates_schedule_slots')
    .insert({
      date: slotData.date,
      start_time: slotData.startTime,
      end_time: slotData.endTime,
      max_capacity: slotData.maxCapacity,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating pilates schedule slot:', error);
    throw error;
  }

  return data;
};

export const updatePilatesScheduleSlot = async (id: string, slotData: Partial<PilatesScheduleFormData>): Promise<PilatesScheduleSlot> => {
  const updateData: any = {};
  
  if (slotData.date) updateData.date = slotData.date;
  if (slotData.startTime) updateData.start_time = slotData.startTime;
  if (slotData.endTime) updateData.end_time = slotData.endTime;
  if (slotData.maxCapacity !== undefined) updateData.max_capacity = slotData.maxCapacity;

  const { data, error } = await supabase
    .from('pilates_schedule_slots')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating pilates schedule slot:', error);
    throw error;
  }

  return data;
};

export const deletePilatesScheduleSlot = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pilates_schedule_slots')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting pilates schedule slot:', error);
    throw error;
  }
};

// Pilates Bookings API
export const getPilatesBookings = async (userId?: string): Promise<PilatesBooking[]> => {
  let query = supabase
    .from('pilates_bookings')
    .select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `)
    .order('booking_date', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pilates bookings:', error);
    throw error;
  }

  return data || [];
};

export const createPilatesBooking = async (bookingData: PilatesBookingFormData, userId: string): Promise<PilatesBooking> => {
  // PILATES-FIX: Comprehensive booking flow with deterministic validation
  console.log('[PILATES-FIX] createPilatesBooking called:', {
    userId,
    slotId: bookingData.slotId,
    timestamp: new Date().toISOString()
  });
  
  // STEP 1: Pre-validate user can book (deterministic check)
  const bookingEligibility = await canUserBookPilatesClass(userId);
  console.log('[PILATES-FIX] Booking eligibility check:', bookingEligibility);
  
  if (!bookingEligibility.canBook) {
    console.error('[PILATES-FIX] Booking DENIED - user cannot book:', bookingEligibility.reason);
    throw new Error(bookingEligibility.reason);
  }
  
  console.log('[PILATES-FIX] Booking ALLOWED - proceeding with RPC');
  
  // STEP 2: Use atomic RPC to decrement deposit and create booking
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('book_pilates_class', { p_user_id: userId, p_slot_id: bookingData.slotId });

  // ADDED (STEP 6 – Rule 8): Distinguish error types for better UX
  if (rpcError) {
    console.error('[PilatesScheduleAPI] Error booking pilates via RPC:', rpcError);
    
    // Parse error message to provide user-friendly feedback
    const errorMessage = rpcError.message?.toLowerCase() || '';
    
    if (errorMessage.includes('no active deposit') || errorMessage.includes('deposit_remaining')) {
      throw new Error('You have no available classes. Please purchase a package to book this class.');
    } else if (errorMessage.includes('slot full') || errorMessage.includes('capacity') || errorMessage.includes('booked')) {
      throw new Error('This class is fully booked. Please choose another time slot.');
    } else if (errorMessage.includes('already booked') || errorMessage.includes('duplicate')) {
      throw new Error('You are already booked for this class.');
    } else if (errorMessage.includes('not available') || errorMessage.includes('past') || errorMessage.includes('expired')) {
      throw new Error('This class slot is no longer available.');
    } else if (errorMessage.includes('no active membership') || errorMessage.includes('membership')) {
      throw new Error('You must have an active membership to book classes. Please purchase a membership.');
    } else {
      throw new Error(`Booking failed: ${rpcError.message || 'Unknown error'}`);
    }
  }

  const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
  if (!bookingId) {
    throw new Error('Booking failed: unable to create booking (no booking ID returned)');
  }

  // Try to fetch booking details, but don't fail if we can't (RLS might block it)
  // The booking was already created by the RPC, so we just need to construct minimal data
  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.warn('[PilatesScheduleAPI] Could not fetch booking details (this is OK, booking was created):', error);
    // ADDED (STEP 6 – Rule 8): Log successful booking even if fetch fails
    console.log(`[PilatesScheduleAPI] Booked class ${bookingData.slotId} for user ${userId}`);
    
    // If we can't fetch the booking (due to RLS), construct minimal response
    // The booking exists in DB, we just can't query it immediately
    // Return minimal data so the UI can continue
    return {
      id: bookingId,
      user_id: userId,
      slot_id: bookingData.slotId,
      booking_date: new Date().toISOString(),
      status: 'confirmed',
      notes: bookingData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as PilatesBooking;
  }

  // ADDED (STEP 6 – Rule 8): Log successful booking with deposit info
  console.log(`[PilatesScheduleAPI] Successfully booked class ${bookingData.slotId} for user ${userId}`);
  return data as PilatesBooking;
};

export const cancelPilatesBooking = async (bookingId: string, userId?: string): Promise<PilatesBooking> => {
  // Use RPC to cancel and restore deposit if needed
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id as string;
  }

  const { error: rpcError } = await supabase.rpc('cancel_pilates_booking', {
    p_booking_id: bookingId,
    p_user_id: userId
  });
  if (rpcError) {
    console.error('Error cancelling pilates via RPC:', rpcError);
    throw rpcError;
  }

  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching cancelled booking:', error);
    throw error;
  }

  return data as PilatesBooking;
};

// PILATES-FIX: Check membership status properly using deterministic validation
// Check if user has active pilates membership using canonical status check
export const hasActivePilatesMembership = async (userId: string): Promise<boolean> => {
  console.log('[PILATES-FIX] hasActivePilatesMembership called for user:', userId);
  
  // Using local timezone to avoid UTC conversion issues
  const today = formatDateLocal(new Date());
  console.log('[PILATES-FIX] Today for date comparison:', today);
  
  // PILATES-FIX: Use status='active' AND end_date check for DETERMINISTIC validation
  // NEVER trust is_active alone - it may be stale
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      status,
      is_active,
      deleted_at,
      start_date,
      end_date,
      membership_packages!inner(name, package_type)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')           // Primary check: status MUST be 'active'
    .is('deleted_at', null)           // Exclude soft-deleted records
    .gte('end_date', today)           // DETERMINISTIC: end_date must be >= today
    .or('membership_packages.name.ilike.%pilates%,membership_packages.name.ilike.%ultimate%');  // Only Pilates/Ultimate packages

  if (error) {
    console.error('[PILATES-FIX] Error checking pilates membership:', error);
    return false;
  }

  const hasActive = !!data && data.length > 0;
  
  // Log detailed membership info for debugging
  if (data && data.length > 0) {
    console.log('[PILATES-FIX] Active Pilates membership found:', {
      userId,
      membershipId: data[0].id,
      status: data[0].status,
      is_active_flag: data[0].is_active,
      start_date: data[0].start_date,
      end_date: data[0].end_date,
      package_name: (data[0].membership_packages as any)?.name,
      package_type: (data[0].membership_packages as any)?.package_type,
      daysRemaining: Math.ceil((new Date(data[0].end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    });
  } else {
    // Log why no active membership was found
    console.log('[PILATES-FIX] No active Pilates membership for user:', userId);
    
    // Query to debug - check if there are ANY memberships
    const { data: allMemberships } = await supabase
      .from('memberships')
      .select(`
        id, status, is_active, start_date, end_date, deleted_at,
        membership_packages(name, package_type)
      `)
      .eq('user_id', userId)
      .order('end_date', { ascending: false })
      .limit(5);
    
    if (allMemberships && allMemberships.length > 0) {
      console.log('[PILATES-FIX] User recent memberships (for debug):', allMemberships.map(m => ({
        id: m.id,
        status: m.status,
        is_active: m.is_active,
        end_date: m.end_date,
        deleted_at: m.deleted_at,
        package: (m.membership_packages as any)?.name,
        isExpired: new Date(m.end_date) < new Date(),
        isDeleted: !!m.deleted_at
      })));
    }
  }

  return hasActive;
};

// Get pilates slots for a specific date range
export const getPilatesSlotsForDateRange = async (startDate: string, endDate: string): Promise<PilatesAvailableSlot[]> => {
  const { data, error } = await supabase
    .from('pilates_available_slots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching pilates slots for date range:', error);
    throw error;
  }

  return data || [];
};

// Get user's pilates bookings for a specific date range
export const getUserPilatesBookingsForDateRange = async (userId: string, startDate: string, endDate: string): Promise<PilatesBooking[]> => {
  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      *,
      slot:pilates_schedule_slots(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('slot.date', startDate)
    .lte('slot.date', endDate)
    .order('slot.date', { ascending: true })
    .order('slot.start_time', { ascending: true });

  if (error) {
    console.error('Error fetching user pilates bookings for date range:', error);
    throw error;
  }

  return data || [];
};

// Get bookings for a specific slot
export const getPilatesSlotBookings = async (slotId: string): Promise<PilatesBooking[]> => {
  console.log('getPilatesSlotBookings called with slotId:', slotId);
  
  const { data, error } = await supabase
    .from('pilates_bookings')
    .select(`
      *,
      user:user_profiles(*)
    `)
    .eq('slot_id', slotId)
    .eq('status', 'confirmed')
    .order('booking_date', { ascending: true });

  if (error) {
    console.error('Error fetching pilates slot bookings:', error);
    throw error;
  }

  console.log('getPilatesSlotBookings result:', { count: data?.length || 0, data });
  return data || [];
};
