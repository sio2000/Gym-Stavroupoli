import { supabase } from '@/config/supabase';
import { 
  PilatesScheduleSlot, 
  PilatesBooking, 
  PilatesAvailableSlot, 
  PilatesScheduleFormData,
  PilatesBookingFormData 
} from '@/types';

// Pilates Schedule Slots API
export const getPilatesScheduleSlots = async (): Promise<PilatesScheduleSlot[]> => {
  const { data, error } = await supabase
    .from('pilates_schedule_slots')
    .select('*')
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

export const getPilatesAvailableSlots = async (): Promise<PilatesAvailableSlot[]> => {
  try {
    console.log('Fetching available pilates slots...');
    
    // Get active slots directly from the table (avoiding the problematic view)
    const { data, error } = await supabase
      .from('pilates_schedule_slots')
      .select('*')
      .eq('is_active', true)
      .gte('date', new Date().toISOString().split('T')[0])
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
      .map(slot => {
        const slotDate = new Date(slot.date + 'T00:00:00'); // Force local time
        const dayOfWeek = slotDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        console.log(`Slot ${slot.date} (day ${dayOfWeek}) - isWeekend: ${isWeekend} - KEPT (admin created it)`);
        
        return slot; // Keep ALL slots that admin created
      })
      .map(slot => ({
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: slot.max_capacity,
        available_capacity: slot.max_capacity, // For now, assume all slots are available
        status: 'available' as const,
        is_active: slot.is_active // Include the is_active status
      }));

    console.log('Transformed slots:', availableSlots.length);
    console.log('Sample transformed slots:', availableSlots.slice(0, 5));
    return availableSlots;
  } catch (error) {
    console.error('Error fetching available pilates slots:', error);
    throw error;
  }
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
  const { data, error } = await supabase
    .from('pilates_bookings')
    .insert({
      user_id: userId,
      slot_id: bookingData.slotId,
      notes: bookingData.notes,
      status: 'confirmed'
    })
    .select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `)
    .single();

  if (error) {
    console.error('Error creating pilates booking:', error);
    throw error;
  }

  return data;
};

export const cancelPilatesBooking = async (bookingId: string): Promise<PilatesBooking> => {
  const { data, error } = await supabase
    .from('pilates_bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select(`
      *,
      slot:pilates_schedule_slots(*),
      user:user_profiles(*)
    `)
    .single();

  if (error) {
    console.error('Error cancelling pilates booking:', error);
    throw error;
  }

  return data;
};

// Check if user has active pilates membership
export const hasActivePilatesMembership = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      is_active,
      end_date,
      membership_packages!inner(package_type)
    `)
    .eq('user_id', userId)
    .eq('membership_packages.package_type', 'pilates')
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
