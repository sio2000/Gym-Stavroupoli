import { supabase } from '@/config/supabase';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * PILATES-FIX: Utility functions for handling membership expiration
 * 
 * All logs prefixed with [PILATES-FIX] for easy filtering
 * 
 * 🎯 PURPOSE: Deterministic expiration management for Pilates subscriptions
 * - Call expire functions periodically or on app load
 * - Use deterministic checks for all access control decisions
 * - Never trust is_active or status alone - always verify end_date
 */

export interface ExpirationResult {
  success: boolean;
  expiredCount: number;
  expiredDeposits?: number;
  message: string;
  error?: string;
}

/**
 * PILATES-FIX: Manually expire memberships that have passed their end_date
 * 🔧 USAGE: Call this from admin panel, secretary dashboard, or on app load
 */
export const expireOverdueMemberships = async (): Promise<ExpirationResult> => {
  try {
    console.log('[PILATES-FIX] Starting manual expiration process...');
    console.log('[PILATES-FIX] Current timestamp:', new Date().toISOString());
    
    // Call the database function to expire overdue memberships
    const { data, error } = await supabase.rpc('manual_expire_overdue_memberships');
    
    if (error) {
      console.error('[PILATES-FIX] Error calling manual_expire_overdue_memberships:', error);
      return { 
        success: false, 
        expiredCount: 0, 
        message: 'Σφάλμα κατά τη λήξη συνδρομών',
        error: error.message 
      };
    }
    
    const result = data?.[0];
    console.log('[PILATES-FIX] Expiration result:', {
      success: result?.success,
      expired_count: result?.expired_count,
      message: result?.message
    });
    
    return {
      success: result?.success || false,
      expiredCount: result?.expired_count || 0,
      message: result?.message || 'Ολοκληρώθηκε η διαδικασία λήξης συνδρομών'
    };
  } catch (error) {
    console.error('[PILATES-FIX] Unexpected error in expireOverdueMemberships:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      message: 'Απρόσμενο σφάλμα',
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * PILATES-FIX: Expire Pilates subscriptions specifically
 * Handles both memberships and deposits expiration
 */
export const expirePilatesSubscriptions = async (): Promise<ExpirationResult> => {
  try {
    console.log('[PILATES-FIX] Starting Pilates-specific expiration...');
    console.log('[PILATES-FIX] Current timestamp:', new Date().toISOString());
    
    // Try the dedicated Pilates expiration RPC
    const { data, error } = await supabase.rpc('expire_pilates_subscriptions');
    
    if (error) {
      console.error('[PILATES-FIX] Error in expire_pilates_subscriptions RPC:', error);
      
      // Fallback to general expiration
      console.log('[PILATES-FIX] Falling back to general expiration...');
      return await expireOverdueMemberships();
    }
    
    const result = data?.[0];
    console.log('[PILATES-FIX] Pilates expiration result:', {
      expired_memberships: result?.expired_memberships,
      expired_deposits: result?.expired_deposits,
      total_processed: result?.total_processed
    });
    
    return {
      success: true,
      expiredCount: result?.expired_memberships || 0,
      expiredDeposits: result?.expired_deposits || 0,
      message: `Λήξαν ${result?.expired_memberships || 0} συνδρομές και ${result?.expired_deposits || 0} deposits`
    };
  } catch (error) {
    console.error('[PILATES-FIX] Unexpected error in expirePilatesSubscriptions:', error);
    return { 
      success: false, 
      expiredCount: 0, 
      message: 'Απρόσμενο σφάλμα',
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * PILATES-FIX: Get user's active memberships using DETERMINISTIC logic
 * 
 * CRITICAL: This function checks BOTH status='active' AND end_date >= today
 * NEVER trust status alone - the database may have stale data
 * 
 * 🔧 USAGE: Use this instead of basic membership queries
 */
export const getUserActiveMembershipsDeterministic = async (userId: string) => {
  try {
    console.log('[PILATES-FIX] Getting deterministic active memberships for:', userId);
    console.log('[PILATES-FIX] Current date:', formatDateLocal(new Date()));
    
    // First try the dedicated RPC
    const { data, error } = await supabase.rpc('get_user_active_memberships_deterministic', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('[PILATES-FIX] Error calling RPC, falling back to direct query:', error);
      
      // Fallback: Direct query with deterministic logic
      // Using local timezone to avoid UTC conversion issues
      const today = formatDateLocal(new Date());
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          package_id,
          status,
          is_active,
          start_date,
          end_date,
          deleted_at,
          membership_packages(id, name, package_type)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .gte('end_date', today);
      
      if (fallbackError) {
        console.error('[PILATES-FIX] Fallback query also failed:', fallbackError);
        return [];
      }
      
      console.log('[PILATES-FIX] Fallback deterministic memberships:', {
        count: fallbackData?.length || 0,
        memberships: fallbackData?.map(m => ({
          id: m.id,
          status: m.status,
          is_active: m.is_active,
          end_date: m.end_date,
          package_name: (m.membership_packages as any)?.name
        }))
      });
      
      return fallbackData || [];
    }
    
    console.log('[PILATES-FIX] Deterministic active memberships:', {
      count: data?.length || 0,
      memberships: data?.map((m: any) => ({
        id: m.membership_id,
        package_name: m.package_name,
        package_type: m.package_type,
        end_date: m.end_date,
        days_remaining: m.days_remaining
      }))
    });
    
    return data || [];
  } catch (error) {
    console.error('[PILATES-FIX] Exception in getUserActiveMembershipsDeterministic:', error);
    return [];
  }
};

/**
 * PILATES-FIX: Check if user has QR access using DETERMINISTIC logic
 * 
 * CRITICAL: This checks status='active' AND end_date >= today
 * 
 * 🔧 USAGE: Use this for QR code visibility decisions
 */
export const userHasQRAccess = async (userId: string): Promise<boolean> => {
  try {
    console.log('[PILATES-FIX] Checking deterministic QR access for:', userId);
    
    // First try the dedicated RPC
    const { data, error } = await supabase.rpc('user_has_qr_access', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('[PILATES-FIX] Error calling user_has_qr_access RPC, falling back:', error);
      
      // Fallback: Direct deterministic check
      // Using local timezone to avoid UTC conversion issues
      const today = formatDateLocal(new Date());
      const { data: memberships, error: queryError } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .gte('end_date', today)
        .limit(1);
      
      if (queryError) {
        console.error('[PILATES-FIX] Fallback QR access check failed:', queryError);
        return false;
      }
      
      const hasAccess = !!(memberships && memberships.length > 0);
      console.log('[PILATES-FIX] Fallback QR access result:', hasAccess);
      return hasAccess;
    }
    
    const hasAccess = data === true;
    console.log('[PILATES-FIX] User QR access:', { userId, hasAccess });
    return hasAccess;
  } catch (error) {
    console.error('[PILATES-FIX] Exception in userHasQRAccess:', error);
    return false;
  }
};

/**
 * PILATES-FIX: Get system-wide membership status summary
 * 🔧 USAGE: For admin dashboard monitoring
 */
export const getMembershipStatusSummary = async () => {
  try {
    console.log('[PILATES-FIX] Getting membership status summary...');
    
    const { data, error } = await supabase.rpc('get_membership_status_summary');
    
    if (error) {
      console.error('[PILATES-FIX] Error calling RPC, falling back to direct query:', error);
      
      // Fallback: Direct summary query
      // Using local timezone to avoid UTC conversion issues
      const today = formatDateLocal(new Date());
      
      const { data: activeCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null)
        .gte('end_date', today);
      
      const { data: expiredWithActiveStatus } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('end_date', today);
      
      const fallbackSummary = {
        active_memberships: activeCount,
        anomalies_found: expiredWithActiveStatus,
        generated_at: new Date().toISOString()
      };
      
      console.log('[PILATES-FIX] Fallback status summary:', fallbackSummary);
      return fallbackSummary;
    }
    
    const summary = data?.[0];
    console.log('[PILATES-FIX] Status summary:', {
      active: summary?.active_count,
      expired: summary?.expired_count,
      expiring_soon: summary?.expiring_soon_count,
      pilates_active: summary?.pilates_active_count,
      anomalies: summary?.anomalies_found
    });
    return summary;
  } catch (error) {
    console.error('[PILATES-FIX] Exception in getMembershipStatusSummary:', error);
    return null;
  }
};

/**
 * PILATES-FIX: Force refresh user's membership status
 * 
 * CRITICAL: Call this after membership changes to ensure:
 * 1. Expired memberships are marked as such
 * 2. UI shows correct access status
 * 
 * 🔧 USAGE: Call after membership creation/modification
 */
export const refreshUserMembershipStatus = async (userId: string) => {
  try {
    console.log('[PILATES-FIX] Refreshing membership status for user:', userId);
    
    // First expire any overdue memberships (including Pilates)
    const expirationResult = await expirePilatesSubscriptions();
    console.log('[PILATES-FIX] Expiration result:', expirationResult);
    
    // Then get fresh deterministic data
    const activeMemberships = await getUserActiveMembershipsDeterministic(userId);
    const hasQRAccess = await userHasQRAccess(userId);
    
    const result = {
      activeMemberships,
      hasQRAccess,
      expiredCount: expirationResult.expiredCount,
      expiredDeposits: expirationResult.expiredDeposits,
      refreshedAt: new Date().toISOString()
    };
    
    console.log('[PILATES-FIX] Membership status refreshed:', {
      userId,
      activeMembershipCount: activeMemberships.length,
      hasQRAccess,
      expiredCount: expirationResult.expiredCount
    });
    
    return result;
  } catch (error) {
    console.error('[PILATES-FIX] Exception in refreshUserMembershipStatus:', error);
    return null;
  }
};

/**
 * PILATES-FIX: Get Pilates-specific subscription details for a user
 * 
 * Returns comprehensive info about Pilates membership and deposits
 */
export const getPilatesSubscriptionDetails = async (userId: string) => {
  try {
    console.log('[PILATES-FIX] Getting Pilates subscription details for:', userId);
    
    // Using local timezone to avoid UTC conversion issues
    const today = formatDateLocal(new Date());
    const now = new Date().toISOString();
    
    // Get Pilates memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        id,
        status,
        is_active,
        start_date,
        end_date,
        deleted_at,
        membership_packages!inner(id, name, package_type)
      `)
      .eq('user_id', userId)
      .or('membership_packages.name.ilike.%pilates%,membership_packages.name.ilike.%ultimate%')
      .order('end_date', { ascending: false });
    
    if (membershipError) {
      console.error('[PILATES-FIX] Error fetching Pilates memberships:', membershipError);
    }
    
    // Get Pilates deposits
    const { data: deposits, error: depositError } = await supabase
      .from('pilates_deposits')
      .select('id, deposit_remaining, is_active, expires_at, credited_at, package_id')
      .eq('user_id', userId)
      .order('credited_at', { ascending: false });
    
    if (depositError) {
      console.error('[PILATES-FIX] Error fetching Pilates deposits:', depositError);
    }
    
    // Analyze memberships
    const activeMemberships = (memberships || []).filter(m => 
      m.status === 'active' && 
      !m.deleted_at && 
      m.end_date >= today
    );
    
    const expiredMembershipsWithActiveStatus = (memberships || []).filter(m =>
      m.status === 'active' &&
      m.end_date < today
    );
    
    // Analyze deposits
    const activeDeposits = (deposits || []).filter(d =>
      d.is_active &&
      d.deposit_remaining > 0 &&
      (!d.expires_at || d.expires_at > now)
    );
    
    const expiredDepositsWithActiveFlag = (deposits || []).filter(d =>
      d.is_active &&
      d.expires_at &&
      d.expires_at <= now
    );
    
    const result = {
      userId,
      memberships: {
        total: memberships?.length || 0,
        active: activeMemberships.length,
        anomalies: expiredMembershipsWithActiveStatus.length,
        details: activeMemberships.map(m => ({
          id: m.id,
          package_name: (m.membership_packages as any)?.name,
          status: m.status,
          end_date: m.end_date,
          daysRemaining: Math.ceil((new Date(m.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }))
      },
      deposits: {
        total: deposits?.length || 0,
        active: activeDeposits.length,
        anomalies: expiredDepositsWithActiveFlag.length,
        totalRemaining: activeDeposits.reduce((sum, d) => sum + d.deposit_remaining, 0),
        details: activeDeposits.map(d => ({
          id: d.id,
          remaining: d.deposit_remaining,
          expires_at: d.expires_at
        }))
      },
      hasAnomalies: expiredMembershipsWithActiveStatus.length > 0 || expiredDepositsWithActiveFlag.length > 0,
      canBookPilates: activeMemberships.length > 0 && activeDeposits.length > 0 && activeDeposits[0].deposit_remaining > 0,
      canAccessGym: activeMemberships.length > 0,
      checkedAt: new Date().toISOString()
    };
    
    console.log('[PILATES-FIX] Pilates subscription details:', result);
    return result;
  } catch (error) {
    console.error('[PILATES-FIX] Exception in getPilatesSubscriptionDetails:', error);
    return null;
  }
};