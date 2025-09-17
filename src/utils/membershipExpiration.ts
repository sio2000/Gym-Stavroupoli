import { supabase } from '@/config/supabase';

/**
 * Utility functions for handling membership expiration
 */

/**
 * Manually expire memberships that have passed their end_date
 * This function should be called periodically (e.g., via cron job)
 */
export const expireMemberships = async (): Promise<{ success: boolean; expiredCount: number; error?: string }> => {
  try {
    console.log('[MembershipExpiration] Starting manual expiration process...');
    
    const { error } = await supabase.rpc('expire_memberships');
    
    if (error) {
      console.error('[MembershipExpiration] Error calling expire_memberships RPC:', error);
      return { success: false, expiredCount: 0, error: error.message };
    }
    
    console.log('[MembershipExpiration] Successfully expired memberships');
    return { success: true, expiredCount: 0 }; // RPC doesn't return count, but we know it succeeded
  } catch (error) {
    console.error('[MembershipExpiration] Unexpected error:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Check and expire memberships using the check_and_expire_memberships function
 * This is a more comprehensive function that includes logging
 */
export const checkAndExpireMemberships = async (): Promise<{ success: boolean; expiredCount: number; error?: string }> => {
  try {
    console.log('[MembershipExpiration] Starting check and expire process...');
    
    const { error } = await supabase.rpc('check_and_expire_memberships');
    
    if (error) {
      console.error('[MembershipExpiration] Error calling check_and_expire_memberships RPC:', error);
      return { success: false, expiredCount: 0, error: error.message };
    }
    
    console.log('[MembershipExpiration] Successfully checked and expired memberships');
    return { success: true, expiredCount: 0 }; // RPC doesn't return count, but we know it succeeded
  } catch (error) {
    console.error('[MembershipExpiration] Unexpected error:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Get count of expired memberships for a specific user
 */
export const getExpiredMembershipsCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', false);
    
    if (error) {
      console.error('[MembershipExpiration] Error getting expired memberships count:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('[MembershipExpiration] Unexpected error getting expired count:', error);
    return 0;
  }
};

/**
 * Get count of active memberships for a specific user
 */
export const getActiveMembershipsCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);
    
    if (error) {
      console.error('[MembershipExpiration] Error getting active memberships count:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('[MembershipExpiration] Unexpected error getting active count:', error);
    return 0;
  }
};

/**
 * Check if a user has any active memberships
 */
export const userHasActiveMemberships = async (userId: string): Promise<boolean> => {
  try {
    const activeCount = await getActiveMembershipsCount(userId);
    return activeCount > 0;
  } catch (error) {
    console.error('[MembershipExpiration] Error checking if user has active memberships:', error);
    return false;
  }
};

/**
 * Get membership status for a user (for debugging)
 */
export const getUserMembershipStatus = async (userId: string): Promise<{
  hasActive: boolean;
  activeCount: number;
  expiredCount: number;
  totalCount: number;
}> => {
  try {
    const [activeCount, expiredCount, totalCount] = await Promise.all([
      getActiveMembershipsCount(userId),
      getExpiredMembershipsCount(userId),
      supabase
        .from('memberships')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.error('[MembershipExpiration] Error getting total count:', error);
            return 0;
          }
          return data?.length || 0;
        })
    ]);
    
    return {
      hasActive: activeCount > 0,
      activeCount,
      expiredCount,
      totalCount
    };
  } catch (error) {
    console.error('[MembershipExpiration] Error getting membership status:', error);
    return {
      hasActive: false,
      activeCount: 0,
      expiredCount: 0,
      totalCount: 0
    };
  }
};