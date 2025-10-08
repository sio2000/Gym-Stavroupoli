import { supabase } from '@/config/supabase';
import { WeeklyRefillStatus } from './weeklyRefillApi';

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

    // Calculate additional info for Ultimate users
    const activationDate = new Date(refillStatus.activation_date);
    const today = new Date();
    const nextRefillDate = new Date(refillStatus.next_refill_date);
    
    // Calculate total weeks in subscription (365 days / 7 days)
    const totalWeeksInSubscription = 52; // Exactly 52 weeks
    const weeksElapsed = Math.floor((today.getTime() - activationDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeksRemaining = Math.max(0, totalWeeksInSubscription - weeksElapsed);

    // Calculate next refill based on activation date + 7 days cycles
    const daysSinceActivation = Math.floor((today.getTime() - activationDate.getTime()) / (24 * 60 * 60 * 1000));
    const weeksSinceActivation = Math.floor(daysSinceActivation / 7);
    const nextRefillDays = (weeksSinceActivation + 1) * 7;
    
    // Update the existing nextRefillDate with new calculation
    nextRefillDate.setTime(activationDate.getTime() + (nextRefillDays * 24 * 60 * 60 * 1000));
    
    // Calculate when user can book from (next day after refill)
    const canBookFromDate = new Date(nextRefillDate);
    canBookFromDate.setDate(nextRefillDate.getDate() + 1); // Next day after refill

    // Determine weekly allocation based on package name
    const weeklyAllocation = refillStatus.target_deposit_amount > 0 
      ? refillStatus.target_deposit_amount 
      : (refillStatus.package_name === 'Ultimate' ? 3 : 1);

    return {
      current_deposit: currentDeposit,
      weekly_allocation: weeklyAllocation,
      next_refill_date: nextRefillDate.toISOString().split('T')[0], // Use activation-based calculation
      refill_week: refillStatus.next_refill_week,
      total_weeks_remaining: totalWeeksRemaining,
      can_book_from_date: canBookFromDate.toISOString().split('T')[0],
      current_week_start: refillStatus.current_week_start || '',
      current_week_end: refillStatus.current_week_end || '',
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
  if (!info.is_ultimate_user) {
    return `${info.current_deposit} μαθήματα απομένουν`;
  }

  // Calculate weeks until next refill
  const today = new Date();
  const nextRefillDate = new Date(info.next_refill_date);
  const daysUntilRefill = Math.ceil((nextRefillDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const weeksUntilRefill = Math.ceil(daysUntilRefill / 7);
  
  if (weeksUntilRefill === 1) {
    return `${info.current_deposit} μαθήματα απομένουν για την τρέχουσα εβδομάδα`;
  } else {
    return `${info.current_deposit} μαθήματα απομένουν για ${weeksUntilRefill} εβδομάδες`;
  }
};

/**
 * Get detailed weekly info for display
 */
export const getWeeklyInfoText = (info: UltimateWeeklyDepositInfo): string => {
  if (!info.is_ultimate_user) {
    return '';
  }

  const nextRefillDate = new Date(info.next_refill_date).toLocaleDateString('el-GR');
  const canBookFromDate = new Date(info.can_book_from_date).toLocaleDateString('el-GR');
  
  return `Επόμενη ανανέωση: ${nextRefillDate} | Κλείσιμο μαθημάτων από: ${canBookFromDate}`;
};
