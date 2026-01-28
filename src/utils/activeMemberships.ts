// Active Memberships Utility
// Handles checking user's active memberships for QR code generation
// 
// STEP 6 IMPLEMENTATION NOTES:
// - RULE 1: Uses ONLY canonical user_id (auth.users.id)
// - RULE 2: Checks status='active' (not is_active), deleted_at IS NULL
// - RULE 3: Pilates deposits ONLY for display, NOT access control
// - RULE 7: Soft-deletes excluded in all READ queries
// - RULE 9: Proactive monitoring of expiry

import { supabase } from '@/config/supabase';
import { Membership, MembershipPackage } from '@/types';

export interface ActiveMembership {
  id: string;
  packageId: string;
  packageName: string;
  packageType: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  endDate: string;
  startDate: string;
  daysUntilExpiry?: number;  // ADDED (STEP 6 – Rule 9): For expiry warnings
  expiryWarning?: string;     // ADDED (STEP 6 – Rule 9): Proactive warning
}

export interface QRCodeCategory {
  key: 'free_gym' | 'pilates' | 'personal';
  label: string;
  icon: string;
  packageType: string;
}

// Map package types to QR code categories
const PACKAGE_TYPE_TO_QR_CATEGORY: Record<string, QRCodeCategory> = {
  'free_gym': {
    key: 'free_gym',
    label: 'Ελεύθερο Gym',
    icon: '🏋️',
    packageType: 'free_gym'
  },
  // Note: 'standard' package type can be used for both Free Gym and Personal Training
  // We need to check the package name to determine the correct QR category
  'pilates': {
    key: 'pilates',
    label: 'Pilates',
    icon: '🧘',
    packageType: 'pilates'
  },
  'personal_training': {
    key: 'personal',
    label: 'Personal Training',
    icon: '🥊',
    packageType: 'personal_training'
  },
  // Map 'standard' package type to Free Gym (based on package name)
  'standard': {
    key: 'free_gym',
    label: 'Ελεύθερο Gym',
    icon: '🏋️',
    packageType: 'standard'
  },
  // Add support for 'personal' package type as well (if it exists in some databases)
  'personal': {
    key: 'personal',
    label: 'Personal Training',
    icon: '🥊',
    packageType: 'personal'
  }
};

/**
 * CHANGED (STEP 6 – Rule 3): Removed app-side expiration logic
 * 
 * REASON: The database now handles pilates deposit deactivation atomically
 * via subscription_expire_worker() function. The app should NEVER manually
 * update membership status based on pilates deposits.
 * 
 * Instead: Trust database-side triggers to keep is_active & status in sync.
 * Deposits should be used ONLY for UI display ("X classes remaining").
 * 
 * This function is DEPRECATED and kept only for reference.
 * DO NOT USE in production code.
 */
const updatePilatesMembershipStatus_DEPRECATED = async (userId: string): Promise<void> => {
  console.warn('[ActiveMemberships] updatePilatesMembershipStatus is DEPRECATED. Database handles this atomically now.');
  // See subscription_expire_worker() in database for canonical implementation
};

/**
 * Get user's active memberships for QR code generation
 * 
 * STEP 6 IMPLEMENTATION:
 * - RULE 1: Uses canonical user_id (auth.users.id)
 * - RULE 2: Checks status='active' (not is_active), deleted_at IS NULL, end_date guard
 * - RULE 3: Pilates deposits used ONLY for UI display, NOT access control
 * - RULE 7: Soft-deletes excluded (is('deleted_at', null))
 * - RULE 9: Calculates daysUntilExpiry for proactive warnings
 */
export const getUserActiveMembershipsForQR = async (userId: string): Promise<ActiveMembership[]> => {
  try {
    console.log('[ActiveMemberships] Fetching active memberships for user:', userId);

    // CHANGED (STEP 6 – Rule 2): Query by status='active' instead of is_active
    // CHANGED (STEP 6 – Rule 7): Exclude soft-deleted records (deleted_at IS NULL)
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        status,
        deleted_at,
        start_date,
        end_date,
        expires_at,
        membership_packages(
          id,
          name,
          package_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')           // CHANGED (STEP 6 – Rule 2): Primary check
      .is('deleted_at', null)           // CHANGED (STEP 6 – Rule 7): Exclude soft-deletes
      .gt('end_date', today)            // CHANGED (STEP 6 – Rule 2): Safety guard check
      .order('end_date', { ascending: false });

    if (error) {
      console.error('[ActiveMemberships] Error fetching memberships:', error);
      throw error;
    }

    const activeMemberships: ActiveMembership[] = [];
    const now = new Date();
    
    for (const membership of (data || [])) {
      // Handle membership_packages as either array or single object
      const packages = Array.isArray(membership.membership_packages)
        ? membership.membership_packages
        : membership.membership_packages ? [membership.membership_packages] : [];

      // For now, just take the first package (most memberships have one package)
      const pkg = packages[0];

      // CHANGED (STEP 6 – Rule 3): Pilates deposits used ONLY for DISPLAY, NOT access control
      // The database-side trigger already keeps membership status in sync with deposits
      // We trust the status='active' check above — if DB says active, it's valid
      
      const packageName = pkg?.name?.toLowerCase() || '';
      const packageType = pkg?.package_type?.toLowerCase() || '';
      const isPilatesMembership = packageType === 'pilates' || packageName === 'pilates';

      // ADDED (STEP 6 – Rule 9): Calculate days until expiry for proactive warnings
      const endDate = new Date(membership.end_date + 'T23:59:59');
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let expiryWarning: string | undefined;
      if (daysUntilExpiry <= 0) {
        expiryWarning = 'Membership expired';
      } else if (daysUntilExpiry <= 7) {
        expiryWarning = `Expires in ${daysUntilExpiry} days`;
      } else if (daysUntilExpiry <= 30) {
        expiryWarning = `Expires in ${daysUntilExpiry} days`;
      }

      activeMemberships.push({
        id: membership.id,
        packageId: membership.package_id,
        packageName: pkg?.name || 'Unknown',
        packageType: pkg?.package_type || 'unknown',
        status: 'active' as const,
        endDate: membership.end_date,
        startDate: membership.start_date,
        daysUntilExpiry,           // ADDED (STEP 6 – Rule 9)
        expiryWarning              // ADDED (STEP 6 – Rule 9)
      });
    }

    console.log('[ActiveMemberships] Found active memberships:', activeMemberships);
    return activeMemberships;
  } catch (error) {
    console.error('[ActiveMemberships] Error fetching active memberships:', error);
    return [];
  }
};

/**
 * Get QR code categories available for user based on their active memberships
 * 
 * STEP 6 IMPLEMENTATION:
 * - RULE 3: Trust database status='active' check (pilates handled automatically)
 * - No app-side deposit checks for access control
 */
export const getAvailableQRCategories = async (userId: string): Promise<QRCodeCategory[]> => {
  try {
    const activeMemberships = await getUserActiveMembershipsForQR(userId);

    if (!activeMemberships || activeMemberships.length === 0) {
      // Check for personal training
      let hasPersonalTraining = false;
      try {
        const { data: personalSchedule } = await supabase
          .from('personal_training_schedules')
          .select('id,status')
          .eq('user_id', userId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);
        hasPersonalTraining = !!(personalSchedule && personalSchedule.length > 0);
      } catch (e) {
        console.warn('[ActiveMemberships] Could not check personal schedule acceptance:', e);
      }

      if (hasPersonalTraining) {
        const freeGymCategory = PACKAGE_TYPE_TO_QR_CATEGORY['free_gym'];
        return freeGymCategory ? [freeGymCategory] : [];
      }

      return [];
    }

    // Check if user has ONLY Pilates membership (NOT Ultimate/Ultimate Medium)
    const hasOnlyPilatesMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      const pkgType = m.packageType?.toLowerCase() || '';
      // Pilates membership but NOT Ultimate/Ultimate Medium
      return (pkgType === 'pilates' || pkgName === 'pilates') && 
             !pkgName.includes('ultimate');
    });

    // Check if user has Ultimate/Ultimate Medium (exclude from deposit check)
    const hasUltimateMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      return pkgName.includes('ultimate');
    });

    // Check for non-Pilates memberships (Free Gym, etc.)
    const hasNonPilatesMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      const pkgType = m.packageType?.toLowerCase() || '';
      return pkgType !== 'pilates' && 
             pkgName !== 'pilates' && 
             !pkgName.includes('ultimate') &&
             (pkgType === 'free_gym' || pkgName.includes('free gym') || pkgName.includes('free'));
    });

    // CHANGED (STEP 6 – Rule 3): Removed app-side pilates deposit check for access control
    // Database status='active' check already ensures user has valid membership
    // If database says membership.status='active', we trust it — subscription_expire_worker()
    // already handles deactivation when deposits are exhausted
    
    // If we get here, user has at least one active membership (from DB check above)
    // User is eligible for QR code access

    let hasPersonalTraining = false;
    try {
      const { data: personalSchedule } = await supabase
        .from('personal_training_schedules')
        .select('id,status')
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1);
      hasPersonalTraining = !!(personalSchedule && personalSchedule.length > 0);
    } catch (e) {
      console.warn('[ActiveMemberships] Could not check personal schedule acceptance:', e);
    }

    // If has active membership or personal training, eligible for QR
    if ((activeMemberships && activeMemberships.length > 0) || hasPersonalTraining) {
      const freeGymCategory = PACKAGE_TYPE_TO_QR_CATEGORY['free_gym'];
      return freeGymCategory ? [freeGymCategory] : [];
    }

    return [];
  } catch (error) {
    console.error('[ActiveMemberships] Error getting available QR categories:', error);
    return [];
  }
};

/**
 * Check if user has active membership for a specific package type
 */
export const hasActiveMembershipForPackage = async (userId: string, packageType: string): Promise<boolean> => {
  try {
    const activeMemberships = await getUserActiveMembershipsForQR(userId);
    return activeMemberships.some(membership => membership.packageType === packageType);
  } catch (error) {
    console.error('[ActiveMemberships] Error checking active membership:', error);
    return false;
  }
};

/**
 * Get membership details for a specific package type
 */
export const getMembershipForPackage = async (userId: string, packageType: string): Promise<ActiveMembership | null> => {
  try {
    const activeMemberships = await getUserActiveMembershipsForQR(userId);
    return activeMemberships.find(membership => membership.packageType === packageType) || null;
  } catch (error) {
    console.error('[ActiveMemberships] Error getting membership for package:', error);
    return null;
  }
};
