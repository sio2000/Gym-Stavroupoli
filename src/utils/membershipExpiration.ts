import { supabase } from '@/config/supabase';

// ===== MEMBERSHIP EXPIRATION UTILITIES =====

/**
 * Check and expire memberships that have passed their end date
 * This should be called periodically (e.g., on app startup, user login)
 */
export const checkAndExpireMemberships = async (): Promise<boolean> => {
  try {
    console.log('[MembershipExpiration] Checking for expired memberships...');
    
    const { error } = await supabase.rpc('check_and_expire_memberships');
    
    if (error) {
      console.error('[MembershipExpiration] Error expiring memberships:', error);
      return false;
    }
    
    console.log('[MembershipExpiration] Membership expiration check completed');
    return true;
  } catch (error) {
    console.error('[MembershipExpiration] Exception during expiration check:', error);
    return false;
  }
};

/**
 * Get membership statistics for admin dashboard
 */
export const getMembershipStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_membership_stats');
    
    if (error) throw error;
    
    return data?.[0] || {
      total_memberships: 0,
      active_memberships: 0,
      expired_memberships: 0,
      expiring_this_week: 0,
      total_revenue: 0
    };
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    return {
      total_memberships: 0,
      active_memberships: 0,
      expired_memberships: 0,
      expiring_this_week: 0,
      total_revenue: 0
    };
  }
};

/**
 * Get membership overview for admin dashboard
 */
export const getMembershipOverview = async () => {
  try {
    const { data, error } = await supabase
      .from('membership_overview')
      .select('*')
      .order('end_date', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching membership overview:', error);
    return [];
  }
};

/**
 * Get user's membership status
 */
export const getUserMembershipStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_user_membership_status', {
      user_uuid: userId
    });
    
    if (error) throw error;
    
    return data?.[0] || {
      has_active_membership: false,
      active_memberships_count: 0,
      next_expiration_date: null
    };
  } catch (error) {
    console.error('Error fetching user membership status:', error);
    return {
      has_active_membership: false,
      active_memberships_count: 0,
      next_expiration_date: null
    };
  }
};

/**
 * Check if a specific package is locked for a user
 */
export const isPackageLockedForUser = async (userId: string, packageId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('status', 'active')
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking package lock status:', error);
    return false;
  }
};

/**
 * Get all locked packages for a user
 */
export const getLockedPackagesForUser = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('package_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    
    return data?.map(m => m.package_id) || [];
  } catch (error) {
    console.error('Error fetching locked packages:', error);
    return [];
  }
};

/**
 * Format expiration date for display
 */
export const formatExpirationDate = (endDate: string): string => {
  const date = new Date(endDate);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Λήγει εδώ και ${Math.abs(diffDays)} ημέρες`;
  } else if (diffDays === 0) {
    return 'Λήγει σήμερα';
  } else if (diffDays === 1) {
    return 'Λήγει αύριο';
  } else if (diffDays <= 7) {
    return `Λήγει σε ${diffDays} ημέρες`;
  } else {
    return date.toLocaleDateString('el-GR');
  }
};

/**
 * Get expiration status for a membership
 */
export const getExpirationStatus = (endDate: string): 'expired' | 'expiring_soon' | 'active' => {
  const date = new Date(endDate);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 7) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
};

/**
 * Initialize membership expiration checking
 * Call this on app startup
 */
export const initializeMembershipExpiration = async (): Promise<void> => {
  try {
    console.log('[MembershipExpiration] Initializing membership expiration check...');
    
    // Check and expire memberships
    await checkAndExpireMemberships();
    
    // Set up periodic checking (every 5 minutes)
    setInterval(async () => {
      await checkAndExpireMemberships();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('[MembershipExpiration] Membership expiration checking initialized');
  } catch (error) {
    console.error('[MembershipExpiration] Failed to initialize expiration checking:', error);
  }
};
