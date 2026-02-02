// Active Memberships Utility
// Handles checking user's active memberships for QR code generation
// 
// PILATES-FIX IMPLEMENTATION:
// All logs prefixed with [PILATES-FIX] for easy filtering
// - Uses ONLY canonical user_id (auth.users.id)
// - Checks status='active' (not is_active), deleted_at IS NULL
// - DETERMINISTIC end_date check - NEVER trust status/is_active alone
// - Pilates deposits ONLY for display, NOT access control
// - Soft-deletes excluded in all READ queries
// - Proactive monitoring of expiry

import { supabase } from '@/config/supabase';
import { Membership, MembershipPackage } from '@/types';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

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
 * PILATES-FIX IMPLEMENTATION:
 * - Uses canonical user_id (auth.users.id)
 * - DETERMINISTIC checks: status='active' AND end_date >= today
 * - Soft-deletes excluded (deleted_at IS NULL)
 * - Pilates deposits used ONLY for UI display, NOT access control
 * - Calculates daysUntilExpiry for proactive warnings
 */
export const getUserActiveMembershipsForQR = async (userId: string): Promise<ActiveMembership[]> => {
  try {
    console.log('[PILATES-FIX] getUserActiveMembershipsForQR called for user:', userId);

    // PILATES-FIX: DETERMINISTIC membership check
    // A membership is ONLY valid if ALL of these are true:
    // 1. status = 'active'
    // 2. deleted_at IS NULL
    // 3. end_date >= today (CRITICAL: never trust status alone!)
    // Using local timezone to avoid UTC conversion issues
    const today = formatDateLocal(new Date());
    console.log('[PILATES-FIX] Today for date comparison:', today);
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        status,
        is_active,
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
      .eq('status', 'active')           // Primary check: status MUST be 'active'
      .is('deleted_at', null)           // Exclude soft-deleted records
      .gte('end_date', today)           // DETERMINISTIC: end_date MUST be >= today
      .order('end_date', { ascending: false });

    if (error) {
      console.error('[PILATES-FIX] Error fetching memberships:', error);
      throw error;
    }

    console.log('[PILATES-FIX] Raw membership data from DB:', {
      count: data?.length || 0,
      memberships: data?.map(m => ({
        id: m.id,
        status: m.status,
        is_active: m.is_active,
        end_date: m.end_date,
        deleted_at: m.deleted_at,
        package_name: (m.membership_packages as any)?.name
      }))
    });

    const activeMemberships: ActiveMembership[] = [];
    const now = new Date();
    
    for (const membership of (data || [])) {
      // Handle membership_packages as either array or single object
      const packages = Array.isArray(membership.membership_packages)
        ? membership.membership_packages
        : membership.membership_packages ? [membership.membership_packages] : [];

      // For now, just take the first package (most memberships have one package)
      const pkg = packages[0];

      const packageName = pkg?.name?.toLowerCase() || '';
      const packageType = pkg?.package_type?.toLowerCase() || '';
      const isPilatesMembership = packageType === 'pilates' || packageName === 'pilates';
      const isUltimateMembership = packageName.includes('ultimate');

      // PILATES-FIX: Calculate days until expiry for proactive warnings
      const endDate = new Date(membership.end_date + 'T23:59:59');
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let expiryWarning: string | undefined;
      if (daysUntilExpiry <= 0) {
        // CRITICAL FIX: Membership has expired - DO NOT include in active memberships
        console.warn('[PILATES-FIX] SKIPPING EXPIRED MEMBERSHIP: end_date is in past!', {
          membershipId: membership.id,
          end_date: membership.end_date,
          status: membership.status,
          daysUntilExpiry
        });
        // Skip this membership - it's expired
        continue;
      } else if (daysUntilExpiry <= 3) {
        expiryWarning = `Λήγει σε ${daysUntilExpiry} ημέρες!`;
      } else if (daysUntilExpiry <= 7) {
        expiryWarning = `Λήγει σε ${daysUntilExpiry} ημέρες`;
      }

      activeMemberships.push({
        id: membership.id,
        packageId: membership.package_id,
        packageName: pkg?.name || 'Unknown',
        packageType: pkg?.package_type || 'unknown',
        status: 'active' as const,
        endDate: membership.end_date,
        startDate: membership.start_date,
        daysUntilExpiry,
        expiryWarning
      });

      // PILATES-FIX: Log each membership processed
      console.log('[PILATES-FIX] Processed membership:', {
        id: membership.id,
        packageName: pkg?.name,
        packageType: pkg?.package_type,
        isPilates: isPilatesMembership,
        isUltimate: isUltimateMembership,
        daysUntilExpiry,
        expiryWarning
      });
    }

    console.log('[PILATES-FIX] Final active memberships:', {
      count: activeMemberships.length,
      memberships: activeMemberships.map(m => ({
        id: m.id,
        packageName: m.packageName,
        packageType: m.packageType,
        daysUntilExpiry: m.daysUntilExpiry,
        expiryWarning: m.expiryWarning
      }))
    });
    
    return activeMemberships;
  } catch (error) {
    console.error('[PILATES-FIX] Error fetching active memberships:', error);
    return [];
  }
};

/**
 * Get QR code categories available for user based on their active memberships
 * 
 * PILATES-FIX IMPLEMENTATION:
 * - Trust DETERMINISTIC database checks (status='active' AND end_date >= today)
 * - No app-side deposit checks for access control
 * - All access logic based on database truth
 */
export const getAvailableQRCategories = async (userId: string): Promise<QRCodeCategory[]> => {
  try {
    console.log('[PILATES-FIX] getAvailableQRCategories called for user:', userId);
    
    const activeMemberships = await getUserActiveMembershipsForQR(userId);

    if (!activeMemberships || activeMemberships.length === 0) {
      console.log('[PILATES-FIX] No active memberships found, checking personal training...');
      
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
        console.log('[PILATES-FIX] Personal training check:', { hasPersonalTraining });
      } catch (e) {
        console.warn('[PILATES-FIX] Could not check personal schedule acceptance:', e);
      }

      if (hasPersonalTraining) {
        const freeGymCategory = PACKAGE_TYPE_TO_QR_CATEGORY['free_gym'];
        console.log('[PILATES-FIX] Granting QR access via personal training');
        return freeGymCategory ? [freeGymCategory] : [];
      }

      console.log('[PILATES-FIX] No QR access - no active memberships or personal training');
      return [];
    }

    // Analyze membership types
    const hasOnlyPilatesMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      const pkgType = m.packageType?.toLowerCase() || '';
      return (pkgType === 'pilates' || pkgName === 'pilates') && 
             !pkgName.includes('ultimate');
    });

    const hasUltimateMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      return pkgName.includes('ultimate');
    });

    const hasNonPilatesMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      const pkgType = m.packageType?.toLowerCase() || '';
      return pkgType !== 'pilates' && 
             pkgName !== 'pilates' && 
             !pkgName.includes('ultimate') &&
             (pkgType === 'free_gym' || pkgName.includes('free gym') || pkgName.includes('free'));
    });

    console.log('[PILATES-FIX] Membership analysis:', {
      hasOnlyPilatesMembership,
      hasUltimateMembership,
      hasNonPilatesMembership,
      totalActiveMemberships: activeMemberships.length
    });

    // PILATES-FIX: Trust DETERMINISTIC database checks
    // If getUserActiveMembershipsForQR returned any memberships, they are VALID
    // (status='active' AND end_date >= today AND deleted_at IS NULL)
    // No additional app-side validation needed

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
      console.warn('[PILATES-FIX] Could not check personal schedule acceptance:', e);
    }

    // If has active membership or personal training, eligible for QR
    if ((activeMemberships && activeMemberships.length > 0) || hasPersonalTraining) {
      const freeGymCategory = PACKAGE_TYPE_TO_QR_CATEGORY['free_gym'];
      console.log('[PILATES-FIX] QR access GRANTED:', {
        reason: activeMemberships.length > 0 ? 'active_membership' : 'personal_training',
        memberships: activeMemberships.map(m => ({
          id: m.id,
          packageName: m.packageName,
          daysUntilExpiry: m.daysUntilExpiry
        }))
      });
      return freeGymCategory ? [freeGymCategory] : [];
    }

    console.log('[PILATES-FIX] QR access DENIED - no valid access criteria met');
    return [];
  } catch (error) {
    console.error('[PILATES-FIX] Error getting available QR categories:', error);
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
