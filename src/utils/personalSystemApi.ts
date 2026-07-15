// ============================================================================
// NEW PERSONAL SYSTEM API (PERSONAL ΑΤΟΜΙΚΟ + ΟΜΑΔΙΚΟ WOD)
// ============================================================================
// Αντικαθιστά πλήρως το legacy Personal (personal_training_schedules).
// Μοντέλο: Pilates (slots + atomic booking RPC + deposits + weekly refill).
//
// Tables: personal_subscriptions, personal_class_slots, personal_bookings,
//         personal_deposits, personal_weekly_refills
// RPCs:   book_personal_class, cancel_personal_booking,
//         process_personal_weekly_refills, get_personal_refill_status,
//         get_active_personal_subscription
// ============================================================================

import { supabase } from '@/config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
export const formatDateLocalYMD = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// ============================================================================
// Types
// ============================================================================

export type PersonalKind = 'personal' | 'wod';
export type PersonalBookingMode = 'self' | 'staff';

export interface PersonalSubscription {
  id: string;
  user_id: string;
  membership_id: string;
  kind: PersonalKind;
  booking_mode: PersonalBookingMode;
  weekly_frequency: number | null;
  total_lessons: number;
  duration_weeks: number | null;
  is_freestyle: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalClassSlot {
  id: string;
  kind: PersonalKind;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  trainer_name: string;
  room: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalSlotWithOccupancy {
  slot_id: string;
  kind: PersonalKind;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  trainer_name: string;
  room: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  booked_count: number;
}

export interface PersonalBooking {
  id: string;
  slot_id: string;
  user_id: string;
  subscription_id: string | null;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  booking_source: 'user' | 'staff';
  booked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  slot?: PersonalClassSlot;
  user?: { first_name: string | null; last_name: string | null; email: string | null };
}

export interface PersonalDeposit {
  id: string;
  user_id: string;
  subscription_id: string;
  deposit_remaining: number;
  weekly_target: number | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface PersonalRefillStatus {
  subscription_id: string;
  next_refill_date: string;
  next_refill_week: number;
  current_deposit_amount: number;
  target_deposit_amount: number;
}

export interface QRWindowStatus {
  hasBookingWindow: boolean;
  windowStart?: string; // ISO
  windowEnd?: string;   // ISO
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Ισότιμοι trainers νέου Personal (canonical id αποθηκεύεται στη DB)
export const PERSONAL_TRAINERS: { id: string; label: string }[] = [
  { id: 'Mike', label: 'Maik' },
  { id: 'Jordan', label: 'Jordan' },
  { id: 'Lefteris', label: 'Λευτέρης' },
];

export const DEFAULT_SLOT_CAPACITY: Record<PersonalKind, number> = {
  personal: 1,
  wod: 10,
};

// QR ενεργό από 30' πριν την έναρξη μέχρι τη λήξη μαθήματος
export const QR_WINDOW_BEFORE_MINUTES = 30;

export interface FixedPersonalPackage {
  key: string;
  label: string;
  weeklyFrequency: number | null; // null = 1 μεμονωμένο μάθημα
  totalLessons: number;
  durationWeeks: number; // 0 = μεμονωμένο μάθημα (ισχύς 30 ημέρες)
}

// Σταθερά πακέτα (τιμή/points πληκτρολογούνται από γραμματεία σε κάθε αγορά)
export const FIXED_PERSONAL_PACKAGES: FixedPersonalPackage[] = [
  { key: 'single', label: '1 Μάθημα', weeklyFrequency: null, totalLessons: 1, durationWeeks: 0 },
  { key: '1w', label: '1 φορά/εβδομάδα · 1 μήνας · 4 μαθήματα', weeklyFrequency: 1, totalLessons: 4, durationWeeks: 4 },
  { key: '2w', label: '2 φορές/εβδομάδα · 1 μήνας · 8 μαθήματα', weeklyFrequency: 2, totalLessons: 8, durationWeeks: 4 },
  { key: '3w', label: '3 φορές/εβδομάδα · 1 μήνας · 12 μαθήματα', weeklyFrequency: 3, totalLessons: 12, durationWeeks: 4 },
  { key: '4w', label: '4 φορές/εβδομάδα · 1 μήνας · 16 μαθήματα', weeklyFrequency: 4, totalLessons: 16, durationWeeks: 4 },
  { key: '5w', label: '5 φορές/εβδομάδα · 1 μήνας · 20 μαθήματα', weeklyFrequency: 5, totalLessons: 20, durationWeeks: 4 },
];

export const PERSONAL_PACKAGE_NAMES: Record<PersonalKind, string> = {
  personal: 'Personal Ατομικό',
  wod: 'Ομαδικό WOD',
};

export const getPersonalTrainerLabel = (id: string): string =>
  PERSONAL_TRAINERS.find(t => t.id === id)?.label || id;

// ============================================================================
// Purchase (Reception): membership + subscription + deposit + payment records
// ============================================================================

export interface CreatePersonalSubscriptionInput {
  userId: string;
  kind: PersonalKind;
  bookingMode: PersonalBookingMode; // 'personal' kind: πάντα 'staff'
  weeklyFrequency: number | null;
  totalLessons: number;
  durationWeeks: number; // 0 = μεμονωμένο μάθημα (30 ημέρες ισχύς)
  isFreestyle: boolean;
  cashAmount: number; // 0 αν πληρωμή μόνο με points
  paymentMethod: 'cash' | 'pos';
  kettlebellPoints: number; // 0 αν δεν δόθηκαν
  createdBy: string;
}

export const createPersonalSubscription = async (
  input: CreatePersonalSubscriptionInput
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
  try {
    const packageName = PERSONAL_PACKAGE_NAMES[input.kind];

    // 1) Πακέτο
    const { data: pkg, error: pkgError } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', packageName)
      .single();
    if (pkgError || !pkg) {
      console.error('[PersonalSystem] Package not found:', packageName, pkgError);
      return { success: false, error: `Δεν βρέθηκε το πακέτο "${packageName}". Εκτελέστε το NEW_PERSONAL_SYSTEM_UP.sql.` };
    }

    // 2) Απενεργοποίηση προηγούμενης ενεργής συνδρομής ίδιου είδους (αντικατάσταση)
    const { data: oldSubs } = await supabase
      .from('personal_subscriptions')
      .select('id, membership_id')
      .eq('user_id', input.userId)
      .eq('kind', input.kind)
      .eq('is_active', true);

    for (const oldSub of oldSubs || []) {
      await supabase
        .from('personal_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', oldSub.id);
      await supabase
        .from('memberships')
        .update({ status: 'expired', is_active: false, updated_at: new Date().toISOString() })
        .eq('id', oldSub.membership_id);
      await supabase
        .from('personal_deposits')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('subscription_id', oldSub.id);
    }

    // 3) Membership
    const startDate = new Date();
    const endDate = new Date(startDate);
    const durationDays = input.durationWeeks > 0 ? input.durationWeeks * 7 : 30;
    endDate.setDate(endDate.getDate() + durationDays);

    const durationType = input.isFreestyle
      ? 'personal_freestyle'
      : input.durationWeeks === 0
      ? 'lesson'
      : 'month';

    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: input.userId,
        package_id: pkg.id,
        start_date: formatDateLocalYMD(startDate),
        end_date: formatDateLocalYMD(endDate),
        is_active: true,
        status: 'active',
        duration_type: durationType,
        source_package_name: packageName,
        approved_by: input.createdBy,
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (membershipError || !membership) {
      console.error('[PersonalSystem] Membership insert error:', membershipError);
      return { success: false, error: 'Σφάλμα δημιουργίας συνδρομής' };
    }

    // 4) personal_subscriptions
    const { data: sub, error: subError } = await supabase
      .from('personal_subscriptions')
      .insert({
        user_id: input.userId,
        membership_id: membership.id,
        kind: input.kind,
        booking_mode: input.kind === 'personal' ? 'staff' : input.bookingMode,
        weekly_frequency: input.weeklyFrequency,
        total_lessons: input.totalLessons,
        duration_weeks: input.durationWeeks > 0 ? input.durationWeeks : null,
        is_freestyle: input.isFreestyle,
        start_date: formatDateLocalYMD(startDate),
        end_date: formatDateLocalYMD(endDate),
        is_active: true,
        created_by: input.createdBy,
      })
      .select('id')
      .single();
    if (subError || !sub) {
      console.error('[PersonalSystem] Subscription insert error:', subError);
      // rollback membership ώστε να μη μείνει ορφανή ενεργή συνδρομή
      await supabase.from('memberships').delete().eq('id', membership.id);
      return { success: false, error: 'Σφάλμα δημιουργίας personal συνδρομής' };
    }

    // 5) Deposit
    // staff mode: όλα τα μαθήματα upfront
    // self mode (WOD): weekly top-up στο weekly_frequency (week 1 πιστώνεται τώρα)
    const isSelf = input.kind === 'wod' && input.bookingMode === 'self';
    const initialDeposit = isSelf && input.weeklyFrequency
      ? Math.min(input.weeklyFrequency, input.totalLessons)
      : input.totalLessons;
    const weeklyTarget = isSelf && input.weeklyFrequency ? input.weeklyFrequency : null;

    const depositExpires = new Date(endDate);
    depositExpires.setHours(23, 59, 59, 999);

    const { error: depositError } = await supabase
      .from('personal_deposits')
      .insert({
        user_id: input.userId,
        subscription_id: sub.id,
        deposit_remaining: initialDeposit,
        weekly_target: weeklyTarget,
        expires_at: depositExpires.toISOString(),
        is_active: true,
        created_by: input.createdBy,
      });
    if (depositError) {
      console.error('[PersonalSystem] Deposit insert error:', depositError);
      return { success: false, error: 'Σφάλμα δημιουργίας πίστωσης μαθημάτων' };
    }

    // 6) Ταμείο (user_cash_transactions) - ενημερώνει το Cash Register module
    if (input.cashAmount > 0) {
      const { error: cashError } = await supabase.from('user_cash_transactions').insert({
        user_id: input.userId,
        amount: input.cashAmount.toFixed(2),
        transaction_type: input.paymentMethod,
        program_id: null,
        notes: `${packageName} - ${input.totalLessons} μαθήματα`,
        created_by: input.createdBy,
      });
      if (cashError) {
        console.error('[PersonalSystem] Cash transaction error:', cashError);
        return { success: false, error: 'Η συνδρομή δημιουργήθηκε αλλά απέτυχε η καταχώρηση στο Ταμείο' };
      }
    }

    // 7) Kettlebell Points (καταγραφή όπως το υπάρχον σύστημα - μόνο προσθήκη)
    if (input.kettlebellPoints > 0) {
      const { error: kbError } = await supabase.from('user_kettlebell_points').insert({
        user_id: input.userId,
        points: Math.round(input.kettlebellPoints),
        program_id: null,
        created_by: input.createdBy,
      });
      if (kbError) {
        console.error('[PersonalSystem] Kettlebell points error:', kbError);
        return { success: false, error: 'Η συνδρομή δημιουργήθηκε αλλά απέτυχε η καταχώρηση Kettlebell Points' };
      }
    }

    return { success: true, subscriptionId: sub.id };
  } catch (error) {
    console.error('[PersonalSystem] createPersonalSubscription exception:', error);
    return { success: false, error: 'Απρόσμενο σφάλμα' };
  }
};

// ============================================================================
// Subscriptions / Deposits
// ============================================================================

export const getActivePersonalSubscription = async (
  userId: string,
  kind?: PersonalKind
): Promise<PersonalSubscription | null> => {
  const { data, error } = await supabase.rpc('get_active_personal_subscription', {
    p_user_id: userId,
    p_kind: kind || null,
  });
  if (error) {
    console.error('[PersonalSystem] getActivePersonalSubscription error:', error);
    return null;
  }
  return (data && data[0]) || null;
};

export const getAllActivePersonalSubscriptions = async (
  userId: string
): Promise<PersonalSubscription[]> => {
  const { data, error } = await supabase.rpc('get_active_personal_subscription', {
    p_user_id: userId,
    p_kind: null,
  });
  if (error) {
    console.error('[PersonalSystem] getAllActivePersonalSubscriptions error:', error);
    return [];
  }
  return data || [];
};

export const getPersonalDeposit = async (subscriptionId: string): Promise<PersonalDeposit | null> => {
  const { data, error } = await supabase
    .from('personal_deposits')
    .select('id, user_id, subscription_id, deposit_remaining, weekly_target, expires_at, is_active')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();
  if (error) {
    console.error('[PersonalSystem] getPersonalDeposit error:', error);
    return null;
  }
  return data;
};

// ============================================================================
// Slots (Trainer/Reception)
// ============================================================================

export const getPersonalSlotsWithOccupancy = async (
  startDate: string,
  endDate: string,
  kind?: PersonalKind
): Promise<PersonalSlotWithOccupancy[]> => {
  let query = supabase
    .from('personal_slots_with_occupancy')
    .select('*')
    .eq('is_active', true)
    .gte('date', startDate)
    .lte('date', endDate);
  if (kind) query = query.eq('kind', kind);

  const { data, error } = await query
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) {
    console.error('[PersonalSystem] getPersonalSlotsWithOccupancy error:', error);
    throw error;
  }
  return data || [];
};

export interface CreatePersonalSlotInput {
  kind: PersonalKind;
  date: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  maxCapacity: number;
  trainerName: string;
  room?: string;
  notes?: string;
  createdBy: string;
}

export const createPersonalSlot = async (input: CreatePersonalSlotInput): Promise<PersonalClassSlot> => {
  const { data, error } = await supabase
    .from('personal_class_slots')
    .insert({
      kind: input.kind,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      max_capacity: input.maxCapacity,
      trainer_name: input.trainerName,
      room: input.room || null,
      notes: input.notes || null,
      is_active: true,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) {
    console.error('[PersonalSystem] createPersonalSlot error:', error);
    throw error;
  }
  return data;
};

export const updatePersonalSlot = async (
  slotId: string,
  updates: Partial<Pick<CreatePersonalSlotInput, 'date' | 'startTime' | 'endTime' | 'maxCapacity' | 'trainerName' | 'room' | 'notes'>>
): Promise<PersonalClassSlot> => {
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.date) payload.date = updates.date;
  if (updates.startTime) payload.start_time = updates.startTime;
  if (updates.endTime) payload.end_time = updates.endTime;
  if (updates.maxCapacity !== undefined) payload.max_capacity = updates.maxCapacity;
  if (updates.trainerName) payload.trainer_name = updates.trainerName;
  if (updates.room !== undefined) payload.room = updates.room || null;
  if (updates.notes !== undefined) payload.notes = updates.notes || null;

  const { data, error } = await supabase
    .from('personal_class_slots')
    .update(payload)
    .eq('id', slotId)
    .select()
    .single();
  if (error) {
    console.error('[PersonalSystem] updatePersonalSlot error:', error);
    throw error;
  }
  return data;
};

export const deactivatePersonalSlot = async (slotId: string): Promise<void> => {
  const { error } = await supabase
    .from('personal_class_slots')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', slotId);
  if (error) {
    console.error('[PersonalSystem] deactivatePersonalSlot error:', error);
    throw error;
  }
};

// ============================================================================
// Bookings
// ============================================================================

export const bookPersonalClass = async (
  userId: string,
  slotId: string,
  source: 'user' | 'staff',
  bookedBy?: string
): Promise<{ bookingId: string; depositRemaining: number }> => {
  const { data, error } = await supabase.rpc('book_personal_class', {
    p_user_id: userId,
    p_slot_id: slotId,
    p_booked_by: bookedBy || null,
    p_source: source,
  });
  if (error) {
    console.error('[PersonalSystem] bookPersonalClass error:', error);
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('slot full')) throw new Error('Το μάθημα είναι πλήρες. Επιλέξτε άλλη ώρα.');
    if (msg.includes('no active deposit') || msg.includes('deposit')) throw new Error('Δεν υπάρχουν διαθέσιμα μαθήματα.');
    if (msg.includes('no active membership')) throw new Error('Δεν υπάρχει ενεργή συνδρομή.');
    if (msg.includes('staff booking only')) throw new Error('Οι κρατήσεις γίνονται από τη γραμματεία.');
    if (msg.includes('outside subscription')) throw new Error('Το μάθημα είναι εκτός περιόδου συνδρομής.');
    if (msg.includes('slot not available')) throw new Error('Το μάθημα δεν είναι διαθέσιμο.');
    throw new Error(`Σφάλμα κράτησης: ${error.message}`);
  }
  const row = data?.[0];
  if (!row?.booking_id) throw new Error('Η κράτηση απέτυχε.');
  return { bookingId: row.booking_id, depositRemaining: row.deposit_remaining };
};

export const cancelPersonalBooking = async (bookingId: string, userId: string): Promise<void> => {
  const { error } = await supabase.rpc('cancel_personal_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
  });
  if (error) {
    console.error('[PersonalSystem] cancelPersonalBooking error:', error);
    throw new Error('Σφάλμα ακύρωσης κράτησης');
  }
};

export const getUserPersonalBookings = async (
  userId: string,
  fromDate?: string,
  toDate?: string
): Promise<PersonalBooking[]> => {
  let query = supabase
    .from('personal_bookings')
    .select('*, slot:personal_class_slots(*)')
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('[PersonalSystem] getUserPersonalBookings error:', error);
    return [];
  }
  let rows: PersonalBooking[] = data || [];
  if (fromDate) rows = rows.filter(b => b.slot && b.slot.date >= fromDate);
  if (toDate) rows = rows.filter(b => b.slot && b.slot.date <= toDate);
  rows.sort((a, b) => {
    const ka = `${a.slot?.date || ''}T${a.slot?.start_time || ''}`;
    const kb = `${b.slot?.date || ''}T${b.slot?.start_time || ''}`;
    return ka.localeCompare(kb);
  });
  return rows;
};

export const getSlotBookings = async (slotId: string): Promise<PersonalBooking[]> => {
  const { data, error } = await supabase
    .from('personal_bookings')
    .select('*, user:user_profiles(first_name, last_name, email)')
    .eq('slot_id', slotId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[PersonalSystem] getSlotBookings error:', error);
    return [];
  }
  return data || [];
};

// ============================================================================
// Weekly refill (WOD self-booking)
// ============================================================================

export const processPersonalWeeklyRefills = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('process_personal_weekly_refills');
  if (error) {
    console.error('[PersonalSystem] processPersonalWeeklyRefills error:', error);
    return 0;
  }
  return data?.[0]?.processed_count ?? 0;
};

export const getPersonalRefillStatus = async (userId: string): Promise<PersonalRefillStatus | null> => {
  const { data, error } = await supabase.rpc('get_personal_refill_status', { p_user_id: userId });
  if (error) {
    console.error('[PersonalSystem] getPersonalRefillStatus error:', error);
    return null;
  }
  return (data && data[0]) || null;
};

// ============================================================================
// QR window: QR ενεργό μόνο [έναρξη-30', λήξη] πραγματικής κράτησης σήμερα
// ============================================================================

const computeWindow = (
  date: string,
  startTime: string,
  endTime: string
): { start: Date; end: Date } => {
  const start = new Date(`${date}T${startTime.length === 5 ? startTime + ':00' : startTime}`);
  const end = new Date(`${date}T${endTime.length === 5 ? endTime + ':00' : endTime}`);
  start.setMinutes(start.getMinutes() - QR_WINDOW_BEFORE_MINUTES);
  return { start, end };
};

const windowFromRows = (
  rows: { date: string; start_time: string; end_time: string }[]
): QRWindowStatus => {
  const now = new Date();
  for (const row of rows) {
    const { start, end } = computeWindow(row.date, row.start_time, row.end_time);
    if (now >= start && now <= end) {
      return {
        hasBookingWindow: true,
        windowStart: start.toISOString(),
        windowEnd: end.toISOString(),
        slotDate: row.date,
        slotStartTime: row.start_time,
        slotEndTime: row.end_time,
      };
    }
  }
  return { hasBookingWindow: false };
};

// Personal (νέο σύστημα): επιβεβαιωμένη κράτηση σε personal_class_slots σήμερα
export const getPersonalQRWindowStatus = async (userId: string): Promise<QRWindowStatus> => {
  try {
    const today = formatDateLocalYMD(new Date());
    const { data, error } = await supabase
      .from('personal_bookings')
      .select('status, slot:personal_class_slots!inner(date, start_time, end_time, is_active)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('slot.date', today)
      .eq('slot.is_active', true);
    if (error) {
      console.error('[PersonalSystem] getPersonalQRWindowStatus error:', error);
      return { hasBookingWindow: false };
    }
    const rows = (data || [])
      .map((b: any) => (Array.isArray(b.slot) ? b.slot[0] : b.slot))
      .filter(Boolean);
    return windowFromRows(rows);
  } catch (e) {
    console.error('[PersonalSystem] getPersonalQRWindowStatus exception:', e);
    return { hasBookingWindow: false };
  }
};

// Pilates: επιβεβαιωμένη κράτηση σε pilates_schedule_slots σήμερα
export const getPilatesQRWindowStatus = async (userId: string): Promise<QRWindowStatus> => {
  try {
    const today = formatDateLocalYMD(new Date());
    const { data, error } = await supabase
      .from('pilates_bookings')
      .select('status, slot:pilates_schedule_slots!inner(date, start_time, end_time, is_active)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('slot.date', today)
      .eq('slot.is_active', true);
    if (error) {
      console.error('[PersonalSystem] getPilatesQRWindowStatus error:', error);
      return { hasBookingWindow: false };
    }
    const rows = (data || [])
      .map((b: any) => (Array.isArray(b.slot) ? b.slot[0] : b.slot))
      .filter(Boolean);
    return windowFromRows(rows);
  } catch (e) {
    console.error('[PersonalSystem] getPilatesQRWindowStatus exception:', e);
    return { hasBookingWindow: false };
  }
};

// ============================================================================
// Credits row (Reception): Ταμείο + Kettlebell Points ανά χρήστη
// ============================================================================

export interface UserCreditsSummary {
  cashTotal: number;
  posTotal: number;
  kettlebellPoints: number;
  depositRemaining: number | null;
  weeklyTarget: number | null;
  subscription: PersonalSubscription | null;
}

export const getUserCreditsSummary = async (
  userId: string,
  kind: PersonalKind
): Promise<UserCreditsSummary> => {
  const summary: UserCreditsSummary = {
    cashTotal: 0,
    posTotal: 0,
    kettlebellPoints: 0,
    depositRemaining: null,
    weeklyTarget: null,
    subscription: null,
  };
  try {
    const [cashRes, kbRes, sub] = await Promise.all([
      supabase.from('user_cash_transactions').select('amount, transaction_type').eq('user_id', userId),
      supabase.from('user_kettlebell_points').select('points').eq('user_id', userId),
      getActivePersonalSubscription(userId, kind),
    ]);

    (cashRes.data || []).forEach((t: any) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.transaction_type === 'cash') summary.cashTotal += amt;
      else if (t.transaction_type === 'pos') summary.posTotal += amt;
    });
    (kbRes.data || []).forEach((p: any) => {
      summary.kettlebellPoints += p.points || 0;
    });

    summary.subscription = sub;
    if (sub) {
      const deposit = await getPersonalDeposit(sub.id);
      summary.depositRemaining = deposit?.deposit_remaining ?? null;
      summary.weeklyTarget = deposit?.weekly_target ?? null;
    }
  } catch (e) {
    console.error('[PersonalSystem] getUserCreditsSummary error:', e);
  }
  return summary;
};

// ============================================================================
// Realtime
// ============================================================================

export const subscribePersonalRealtime = (onChange: () => void): RealtimeChannel => {
  const channel = supabase
    .channel('realtime:personal-system')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_bookings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_class_slots' }, onChange)
    .subscribe();
  return channel;
};

// ============================================================================
// Helpers
// ============================================================================

export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate + 'T23:59:59');
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
};

export const formatTimeHM = (t: string): string => (t || '').substring(0, 5);
