import { supabase } from '@/config/supabase';

export interface CashTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'cash' | 'pos';
  program_id?: string;
  created_at: string;
  created_by: string;
  notes?: string;
}

export interface UserCashSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  cash_total: number;
  pos_total: number;
  cash_count: number;
  pos_count: number;
  last_cash_date?: string;
  last_pos_date?: string;
}

export interface CashRegisterTotals {
  total_cash: number;
  total_pos: number;
  total_transactions: number;
}

// Save cash transaction
export const saveCashTransaction = async (
  userId: string,
  amount: number,
  transactionType: 'cash' | 'pos',
  programId?: string,
  createdBy: string | null = null,
  notes?: string | null
): Promise<boolean> => {
  try {
    console.log('[saveCashTransaction] Saving transaction:', {
      userId, amount, transactionType, programId, createdBy, notes
    });

    const { data, error } = await supabase
      .from('user_cash_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: transactionType,
        program_id: programId || null,
        created_by: createdBy || null,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('[saveCashTransaction] Error saving transaction:', error);
      return false;
    }

    console.log('[saveCashTransaction] Transaction saved successfully:', data);
    return true;
  } catch (error) {
    console.error('[saveCashTransaction] Exception saving transaction:', error);
    return false;
  }
};

// Get total cash amounts
export const getCashRegisterTotals = async (
  fromDate?: string,
  toDate?: string
): Promise<CashRegisterTotals> => {
  try {
    console.log('[getCashRegisterTotals] Fetching totals...');

    let query = supabase
      .from('user_cash_transactions')
      .select('amount, transaction_type, created_at');

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      // Include entire day for toDate by appending end of day if only date provided
      const to = toDate.length === 10 ? `${toDate}T23:59:59.999Z` : toDate;
      query = query.lte('created_at', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getCashRegisterTotals] Error fetching totals:', error);
      return { total_cash: 0, total_pos: 0, total_transactions: 0 };
    }

    const totals = data?.reduce((acc, transaction) => {
      if (transaction.transaction_type === 'cash') {
        acc.total_cash += transaction.amount;
      } else if (transaction.transaction_type === 'pos') {
        acc.total_pos += transaction.amount;
      }
      acc.total_transactions += 1;
      return acc;
    }, { total_cash: 0, total_pos: 0, total_transactions: 0 }) || { total_cash: 0, total_pos: 0, total_transactions: 0 };

    console.log('[getCashRegisterTotals] Totals calculated:', totals);
    return totals;
  } catch (error) {
    console.error('[getCashRegisterTotals] Exception fetching totals:', error);
    return { total_cash: 0, total_pos: 0, total_transactions: 0 };
  }
};

// Get cash summary per user
export const getCashSummaryPerUser = async (
  fromDate?: string,
  toDate?: string
): Promise<UserCashSummary[]> => {
  try {
    console.log('[getCashSummaryPerUser] Fetching user summaries...');

    let query = supabase
      .from('user_cash_transactions')
      .select(`
        user_id,
        amount,
        transaction_type,
        created_at,
        user_profiles!user_cash_transactions_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      const to = toDate.length === 10 ? `${toDate}T23:59:59.999Z` : toDate;
      query = query.lte('created_at', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getCashSummaryPerUser] Error fetching user summaries:', error);
      return [];
    }

    console.log('[getCashSummaryPerUser] Raw data received:', data?.length || 0, 'records');

    if (!data || data.length === 0) {
      console.log('[getCashSummaryPerUser] No data found, returning empty array');
      return [];
    }

    // Group by user and calculate totals
    const userMap = new Map<string, UserCashSummary>();

    data.forEach(record => {
      const userId = record.user_id;
      const userProfile = record.user_profiles as any;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          user_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : `User ${userId.slice(0, 8)}`,
          user_email: userProfile?.email || 'No email',
          cash_total: 0,
          pos_total: 0,
          cash_count: 0,
          pos_count: 0
        });
      }

      const userSummary = userMap.get(userId)!;
      
      if (record.transaction_type === 'cash') {
        userSummary.cash_total += record.amount;
        userSummary.cash_count += 1;
        if (!userSummary.last_cash_date || new Date(record.created_at) > new Date(userSummary.last_cash_date)) {
          userSummary.last_cash_date = record.created_at;
        }
      } else if (record.transaction_type === 'pos') {
        userSummary.pos_total += record.amount;
        userSummary.pos_count += 1;
        if (!userSummary.last_pos_date || new Date(record.created_at) > new Date(userSummary.last_pos_date)) {
          userSummary.last_pos_date = record.created_at;
        }
      }
    });

    const result = Array.from(userMap.values()).sort((a, b) => 
      (b.cash_total + b.pos_total) - (a.cash_total + a.pos_total)
    );

    console.log('[getCashSummaryPerUser] Processed summaries:', result);
    return result;
  } catch (error) {
    console.error('[getCashSummaryPerUser] Exception fetching user summaries:', error);
    return [];
  }
};

// Get all cash transactions for a specific user
export const getUserCashTransactions = async (userId: string): Promise<CashTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('user_cash_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserCashTransactions] Error getting user cash transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getUserCashTransactions] Exception getting user cash transactions:', error);
    return [];
  }
};
