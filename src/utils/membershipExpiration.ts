import { supabase } from '@/config/supabase';

/**
 * Utility functions for handling membership expiration
 * 🎯 PURPOSE: Manual expiration management since no scheduled jobs exist
 */

export interface ExpirationResult {
  success: boolean;
  expiredCount: number;
  message: string;
  error?: string;
}

/**
 * Manually expire memberships that have passed their end_date
 * 🔧 USAGE: Call this from admin panel or secretary dashboard
 */
export const expireOverdueMemberships = async (): Promise<ExpirationResult> => {
  try {
    console.log('[MembershipExpiration] Starting manual expiration process...');
    
    // Call the database function to expire overdue memberships
    const { data, error } = await supabase.rpc('manual_expire_overdue_memberships');
    
    if (error) {
      console.error('[MembershipExpiration] Error calling manual_expire_overdue_memberships:', error);
      return { 
        success: false, 
        expiredCount: 0, 
        message: 'Σφάλμα κατά τη λήξη συνδρομών',
        error: error.message 
      };
    }
    
    const result = data?.[0];
    console.log('[MembershipExpiration] Expiration result:', result);
    
    return {
      success: result?.success || false,
      expiredCount: result?.expired_count || 0,
      message: result?.message || 'Ολοκληρώθηκε η διαδικασία λήξης συνδρομών'
    };
  } catch (error) {
    console.error('[MembershipExpiration] Unexpected error:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      message: 'Απρόσμενο σφάλμα',
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Get user's active memberships using deterministic logic
 * 🔧 USAGE: Use this instead of basic membership queries
 */
export const getUserActiveMembershipsDeterministic = async (userId: string) => {
  try {
    console.log('[MembershipExpiration] Getting deterministic active memberships for:', userId);
    
    const { data, error } = await supabase.rpc('get_user_active_memberships_deterministic', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('[MembershipExpiration] Error getting deterministic memberships:', error);
      return [];
    }
    
    console.log('[MembershipExpiration] Deterministic active memberships:', data);
    return data || [];
  } catch (error) {
    console.error('[MembershipExpiration] Error in getUserActiveMembershipsDeterministic:', error);
    return [];
  }
};

/**
 * Check if user has QR access using deterministic logic
 * 🔧 USAGE: Use this for QR code visibility decisions
 */
export const userHasQRAccess = async (userId: string): Promise<boolean> => {
  try {
    console.log('[MembershipExpiration] Checking deterministic QR access for:', userId);
    
    const { data, error } = await supabase.rpc('user_has_qr_access', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('[MembershipExpiration] Error checking QR access:', error);
      return false;
    }
    
    const hasAccess = data === true;
    console.log('[MembershipExpiration] User QR access:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('[MembershipExpiration] Error in userHasQRAccess:', error);
    return false;
  }
};

/**
 * Get system-wide membership status summary
 * 🔧 USAGE: For admin dashboard monitoring
 */
export const getMembershipStatusSummary = async () => {
  try {
    console.log('[MembershipExpiration] Getting membership status summary...');
    
    const { data, error } = await supabase.rpc('get_membership_status_summary');
    
    if (error) {
      console.error('[MembershipExpiration] Error getting status summary:', error);
      return null;
    }
    
    const summary = data?.[0];
    console.log('[MembershipExpiration] Status summary:', summary);
    return summary;
  } catch (error) {
    console.error('[MembershipExpiration] Error in getMembershipStatusSummary:', error);
    return null;
  }
};

/**
 * Force refresh user's membership status
 * 🔧 USAGE: Call after membership changes to ensure UI updates
 */
export const refreshUserMembershipStatus = async (userId: string) => {
  try {
    // First expire any overdue memberships
    await expireOverdueMemberships();
    
    // Then get fresh deterministic data
    const activeMemberships = await getUserActiveMembershipsDeterministic(userId);
    const hasQRAccess = await userHasQRAccess(userId);
    
    return {
      activeMemberships,
      hasQRAccess,
      refreshedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[MembershipExpiration] Error refreshing membership status:', error);
    return null;
  }
};