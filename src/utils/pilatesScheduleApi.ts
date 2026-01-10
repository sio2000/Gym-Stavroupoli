import { supabase } from '@/config/supabase';
import { 
  PilatesScheduleSlot, 
  PilatesBooking, 
  PilatesAvailableSlot, 
  PilatesScheduleFormData,
  PilatesBookingFormData 
} from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

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

// Active pilates deposit for a user
export const getActivePilatesDeposit = async (
  userId: string
): Promise<{ deposit_remaining: number; is_active: boolean; expires_at?: string; package_id?: string; id?: string } | null> => {
  const { data, error } = await supabase
    .from('pilates_deposits')
    .select('id, deposit_remaining, is_active, expires_at, credited_at, package_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('deposit_remaining', 0)
    .order('credited_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[PilatesScheduleAPI] Error fetching active pilates deposit:', error);
    return null;
  }
  if (!data || data.length === 0) {
    // Fallback: log last 3 deposits to debug
    const { data: lastDeposits } = await supabase
      .from('pilates_deposits')
      .select('id, deposit_remaining, is_active, expires_at, credited_at, package_id')
      .eq('user_id', userId)
      .order('credited_at', { ascending: false })
      .limit(3);
    console.warn('[PilatesScheduleAPI] No active pilates deposit found for user:', userId, 'recent:', lastDeposits);
    return null;
  }
  console.log('[PilatesScheduleAPI] Active deposit for user', userId, data[0]);
  return data[0];
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
  // Use atomic RPC to decrement deposit and create booking
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('book_pilates_class', { p_user_id: userId, p_slot_id: bookingData.slotId });

  if (rpcError) {
    console.error('Error booking pilates via RPC:', rpcError);
    throw rpcError;
  }

  const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
  if (!bookingId) {
    throw new Error('Booking failed: missing booking id');
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
    console.warn('Could not fetch booking details (this is OK, booking was created):', error);
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

// Check if user has active pilates membership
export const hasActivePilatesMembership = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      is_active,
      end_date,
      membership_packages(package_type)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .single();

  if (error) {
    console.error('Error checking pilates membership:', error);
    return false;
  }

  return !!data;
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
