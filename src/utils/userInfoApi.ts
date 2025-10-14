import { supabase } from '@/config/supabase';

export interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  language?: string;
  avatar_url?: string;
  referral_code?: string;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: string;
  package_id: string;
  package_name: string;
  status: string;
  credits_remaining: number; // Not available in actual DB, set to 0
  credits_total: number; // Not available in actual DB, set to 0
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  membership_id?: string;
  notes?: string;
}

export interface UserKettlebellPoints {
  total_points: number;
  points_history: Array<{
    id: string;
    points: number;
    program_id?: string;
    created_at: string;
  }>;
}

export interface UserMembershipRequest {
  id: string;
  package_id: string;
  package_name: string;
  duration_type: string;
  requested_price: number;
  status: 'pending' | 'approved' | 'rejected';
  classes_count?: number;
  created_at: string;
  updated_at: string;
  has_installments?: boolean;
  installment_1_amount?: number;
  installment_2_amount?: number;
  installment_3_amount?: number;
  installment_1_payment_method?: string;
  installment_2_payment_method?: string;
  installment_3_payment_method?: string;
  installment_1_due_date?: string;
  installment_2_due_date?: string;
  installment_3_due_date?: string;
}

export interface UserDetailedInfo {
  user_info: UserInfo;
  active_memberships: UserMembership[];
  all_memberships: UserMembership[];
  payment_history: UserPayment[];
  kettlebell_points: UserKettlebellPoints;
  total_paid: number;
  pending_requests: UserMembershipRequest[];
}

/**
 * Search users by name, email, or ID
 */
export const searchUsers = async (searchTerm: string): Promise<UserInfo[]> => {
  try {
    console.log('[UserInfoAPI] Searching users with term:', searchTerm);
    
    if (!searchTerm.trim()) {
      return [];
    }

    // First try to search text fields only
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[UserInfoAPI] Error searching users:', error);
      throw error;
    }

    // If we have results, return them
    if (data && data.length > 0) {
      console.log('[UserInfoAPI] Found users in text fields:', data.length);
      return data;
    }

    // If no results in text fields, try searching by UUID if the search term looks like a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(searchTerm)) {
      console.log('[UserInfoAPI] Search term looks like UUID, searching by exact match');
      const { data: uuidData, error: uuidError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', searchTerm)
        .order('created_at', { ascending: false })
        .limit(50);

      if (uuidError) {
        console.error('[UserInfoAPI] Error searching by UUID:', uuidError);
        // Don't throw error, just return empty results
        return [];
      }

      console.log('[UserInfoAPI] Found users by UUID:', uuidData?.length || 0);
      return uuidData || [];
    }

    console.log('[UserInfoAPI] No users found for search term:', searchTerm);
    return [];
  } catch (error) {
    console.error('[UserInfoAPI] Unexpected error searching users:', error);
    throw error;
  }
};

/**
 * Get random users for pagination
 */
export const getRandomUsers = async (page: number = 1, limit: number = 10): Promise<UserInfo[]> => {
  try {
    const offset = (page - 1) * limit;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[UserInfoAPI] Error getting random users:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[UserInfoAPI] Unexpected error getting random users:', error);
    throw error;
  }
};

/**
 * Get total user count for pagination
 */
export const getUserCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[UserInfoAPI] Error getting user count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('[UserInfoAPI] Unexpected error getting user count:', error);
    throw error;
  }
};

/**
 * Get detailed user information including memberships, payments, and kettlebell points
 */
export const getUserDetailedInfo = async (userId: string): Promise<UserDetailedInfo> => {
  try {
    console.log('[UserInfoAPI] Getting detailed info for user:', userId);
    
    // Get user basic info
    const { data: userInfo, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('[UserInfoAPI] Error getting user info:', userError);
      throw userError;
    }

    if (!userInfo) {
      throw new Error('User not found');
    }

    // Get all memberships with package details
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        status,
        is_active,
        start_date,
        end_date,
        created_at,
        membership_packages!memberships_package_id_fkey(
          name,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('[UserInfoAPI] Error getting memberships:', membershipsError);
      throw membershipsError;
    }

    // Process memberships
    const processedMemberships: UserMembership[] = (memberships || []).map(membership => ({
      id: membership.id,
      package_id: membership.package_id,
      package_name: (membership.membership_packages as any)?.name || 'Unknown Package',
      status: membership.status,
      credits_remaining: 0, // Not available in this database schema
      credits_total: 0, // Not available in this database schema
      start_date: membership.start_date,
      end_date: membership.end_date,
      is_active: membership.is_active && new Date(membership.end_date) >= new Date(),
      created_at: membership.created_at
    }));

    // Get active memberships
    const activeMemberships = processedMemberships.filter(m => m.is_active);

    // Get cash transactions (cash register payments)
    const { data: cashTransactions, error: cashError } = await supabase
      .from('user_cash_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cashError) {
      console.error('[UserInfoAPI] Error getting cash transactions:', cashError);
      throw cashError;
    }

    // Get regular payments (if any exist)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('[UserInfoAPI] Error getting payments:', paymentsError);
      // Don't throw error, just log it
    }

    // Process cash transactions
    const processedCashTransactions: UserPayment[] = (cashTransactions || []).map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      currency: 'EUR',
      status: 'approved', // Cash transactions are always approved
      payment_method: transaction.transaction_type === 'cash' ? 'Μετρητά' : 'POS',
      transaction_id: transaction.id,
      created_at: transaction.created_at,
      membership_id: transaction.program_id,
      notes: transaction.notes
    }));

    // Process regular payments
    const processedPayments: UserPayment[] = (payments || []).map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id,
      created_at: payment.created_at,
      membership_id: payment.membership_id
    }));

    // Combine all payments
    const allPayments = [...processedCashTransactions, ...processedPayments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate total paid
    const totalPaid = allPayments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    // Get kettlebell points
    const { data: kettlebellData, error: kettlebellError } = await supabase
      .from('user_kettlebell_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (kettlebellError) {
      console.error('[UserInfoAPI] Error getting kettlebell points:', kettlebellError);
      // Don't throw error, just log it
    }

    const totalKettlebellPoints = (kettlebellData || []).reduce((sum, point) => sum + (point.points || 0), 0);
    const kettlebellPointsHistory = (kettlebellData || []).map(point => ({
      id: point.id,
      points: point.points || 0,
      program_id: point.program_id,
      created_at: point.created_at
    }));

    // Get pending membership requests
    const { data: membershipRequests, error: requestsError } = await supabase
      .from('membership_requests')
      .select(`
        id,
        package_id,
        duration_type,
        requested_price,
        status,
        classes_count,
        created_at,
        updated_at,
        has_installments,
        installment_1_amount,
        installment_2_amount,
        installment_3_amount,
        installment_1_payment_method,
        installment_2_payment_method,
        installment_3_payment_method,
        installment_1_due_date,
        installment_2_due_date,
        installment_3_due_date,
        membership_packages!membership_requests_package_id_fkey(
          name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('[UserInfoAPI] Error getting membership requests:', requestsError);
      // Don't throw error, just log it
    }

    const processedRequests: UserMembershipRequest[] = (membershipRequests || []).map(request => ({
      id: request.id,
      package_id: request.package_id,
      package_name: (request.membership_packages as any)?.name || 'Unknown Package',
      duration_type: request.duration_type,
      requested_price: request.requested_price,
      status: request.status,
      classes_count: request.classes_count,
      created_at: request.created_at,
      updated_at: request.updated_at,
      has_installments: request.has_installments,
      installment_1_amount: request.installment_1_amount,
      installment_2_amount: request.installment_2_amount,
      installment_3_amount: request.installment_3_amount,
      installment_1_payment_method: request.installment_1_payment_method,
      installment_2_payment_method: request.installment_2_payment_method,
      installment_3_payment_method: request.installment_3_payment_method,
      installment_1_due_date: request.installment_1_due_date,
      installment_2_due_date: request.installment_2_due_date,
      installment_3_due_date: request.installment_3_due_date
    }));

    const result: UserDetailedInfo = {
      user_info: userInfo,
      active_memberships: activeMemberships,
      all_memberships: processedMemberships,
      payment_history: allPayments,
      kettlebell_points: {
        total_points: totalKettlebellPoints,
        points_history: kettlebellPointsHistory
      },
      total_paid: totalPaid,
      pending_requests: processedRequests
    };

    console.log('[UserInfoAPI] Retrieved detailed info for user:', userId);
    return result;
  } catch (error) {
    console.error('[UserInfoAPI] Unexpected error getting detailed user info:', error);
    throw error;
  }
};
