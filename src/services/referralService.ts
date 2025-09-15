import { supabase } from '@/config/supabase';

export interface ReferralPoints {
  id: string;
  user_id: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralTransaction {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  points_awarded: number;
  transaction_type: string;
  created_at: string;
  referred_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ReferralStats {
  total_points: number;
  total_referrals: number;
  recent_transactions: ReferralTransaction[];
}

/**
 * Get user's referral code (create if doesn't exist)
 */
export const getUserReferralCode = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('get_user_referral_code', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error getting referral code:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserReferralCode:', error);
    throw error;
  }
};

/**
 * Get user's total referral points
 */
export const getUserReferralPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_user_referral_points', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error getting referral points:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getUserReferralPoints:', error);
    return 0;
  }
};

/**
 * Process referral signup and award points
 */
export const processReferralSignup = async (
  referredUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; points_awarded: number }> => {
  try {
    const { data, error } = await supabase.rpc('process_referral_signup', {
      p_referred_user_id: referredUserId,
      p_referral_code: referralCode
    });

    if (error) {
      console.error('Error processing referral signup:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from referral processing');
    }

    const result = data[0];
    return {
      success: result.success,
      message: result.message,
      points_awarded: result.points_awarded
    };
  } catch (error) {
    console.error('Error in processReferralSignup:', error);
    throw error;
  }
};

/**
 * Get user's referral statistics
 */
export const getUserReferralStats = async (userId: string): Promise<ReferralStats> => {
  try {
    // Get total points
    const totalPoints = await getUserReferralPoints(userId);

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('referral_transactions')
      .select(`
        *,
        referred_user:user_profiles!referral_transactions_referred_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error getting referral transactions:', transactionsError);
      throw transactionsError;
    }

    return {
      total_points: totalPoints,
      total_referrals: transactions?.length || 0,
      recent_transactions: transactions || []
    };
  } catch (error) {
    console.error('Error in getUserReferralStats:', error);
    throw error;
  }
};

/**
 * Get all referral transactions for a user
 */
export const getUserReferralTransactions = async (userId: string): Promise<ReferralTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('referral_transactions')
      .select(`
        *,
        referred_user:user_profiles!referral_transactions_referred_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting referral transactions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserReferralTransactions:', error);
    return [];
  }
};

/**
 * Validate referral code
 */
export const validateReferralCode = async (referralCode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('referral_code', referralCode)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return false;
  }
};