import { supabase } from '@/config/supabase';
import { WeeklyRefillStatus } from './weeklyRefillApi';
import { addDaysLocal, toLocalDateKey } from '@/utils/date';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface UltimateWeeklyDepositInfo {
  current_deposit: number;
  weekly_allocation: number;
  next_refill_date: string;
  refill_week: number;
  total_weeks_remaining: number;
  can_book_from_date: string;
  current_week_start: string;
  current_week_end: string;
  is_ultimate_user: boolean;
  package_name?: string;
}

/**
 * Get weekly deposit information for Ultimate users
 * Returns enhanced deposit info with weekly refill details
 */
export const getUltimateWeeklyDepositInfo = async (): Promise<UltimateWeeklyDepositInfo | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get weekly refill status
    const { data: refillData, error: refillError } = await supabase
      .rpc('get_user_weekly_refill_status', {
        p_user_id: user.id
      });

    if (refillError) {
      console.error('[UltimateWeeklyDepositAPI] Error fetching refill status:', refillError);
      throw refillError;
    }

    const refillStatus: WeeklyRefillStatus | null = refillData?.[0] || null;

    // Get current Pilates deposit
    const { data: depositData, error: depositError } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('credited_at', { ascending: false })
      .limit(1);

    if (depositError) {
      console.error('[UltimateWeeklyDepositAPI] Error fetching deposit:', depositError);
      throw depositError;
    }

    const currentDeposit = depositData?.[0]?.deposit_remaining || 0;

    // If user is not Ultimate, return basic info
    if (!refillStatus) {
      return {
        current_deposit: currentDeposit,
        weekly_allocation: 0,
        next_refill_date: '',
        refill_week: 0,
        total_weeks_remaining: 0,
        can_book_from_date: '',
        is_ultimate_user: false
      };
    }

    // Calculate weekly cycle: Δευτέρα έως Σάββατο, rollover μετά το Σάββατο
    const today = new Date();
    const day = today.getDay(); // 0 Κυριακή, 1 Δευτέρα, ... 6 Σάββατο
    let weekStart: Date;
    if (day === 0) {
      // Κυριακή -> επόμενη Δευτέρα
      weekStart = addDaysLocal(today, 1);
    } else {
      const daysToMonday = 1 - day;
      weekStart = addDaysLocal(today, daysToMonday);
    }
    weekStart.setHours(0, 0, 0, 0);
    let weekEnd = addDaysLocal(weekStart, 5); // Σάββατο
    weekEnd.setHours(23, 59, 59, 999);

    // Αν σήμερα είναι μετά το Σάββατο (θεωρητικά μόνο Κυριακή), μετακινούμε στην επόμενη εβδομάδα
    if (today > weekEnd) {
      weekStart = addDaysLocal(weekStart, 7);
      weekEnd = addDaysLocal(weekStart, 5);
      weekEnd.setHours(23, 59, 59, 999);
    }

    const nextRefillDate = weekEnd;
    const canBookFromDate = addDaysLocal(nextRefillDate, 1); // Κυριακή -> νέα εβδομάδα

    // Calculate total weeks remaining (διατηρούμε 52 εβδομάδες συνολικά από activation)
    const activationDate = new Date(refillStatus.activation_date);
    const totalWeeksInSubscription = 52;
    const weeksElapsed = Math.floor((today.getTime() - activationDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeksRemaining = Math.max(0, totalWeeksInSubscription - weeksElapsed);

    // Determine weekly allocation based on package name
    const weeklyAllocation = refillStatus.target_deposit_amount > 0 
      ? refillStatus.target_deposit_amount 
      : (refillStatus.package_name === 'Ultimate' ? 3 : 1);

    return {
      current_deposit: currentDeposit,
      weekly_allocation: weeklyAllocation,
      next_refill_date: formatDateLocal(nextRefillDate),
      refill_week: refillStatus.next_refill_week,
      total_weeks_remaining: totalWeeksRemaining,
      can_book_from_date: formatDateLocal(canBookFromDate),
      current_week_start: toLocalDateKey(weekStart),
      current_week_end: toLocalDateKey(weekEnd),
      is_ultimate_user: true,
      package_name: refillStatus.package_name
    };

  } catch (error) {
    console.error('[UltimateWeeklyDepositAPI] Error in getUltimateWeeklyDepositInfo:', error);
    return null;
  }
};

/**
 * Format the deposit display text for Ultimate users
 */
export const formatUltimateDepositText = (info: UltimateWeeklyDepositInfo): string => {
    return `${info.current_deposit} μαθήματα απομένουν`;
};

/**
 * Get detailed weekly info for display
 */
export const getWeeklyInfoText = (info: UltimateWeeklyDepositInfo): string => {
  if (!info.is_ultimate_user) {
    return '';
  }

  const nextRefillDate = new Date(info.next_refill_date).toLocaleDateString('el-GR');
  
  return `Επόμενη ανανέωση: ${nextRefillDate}`;
};
