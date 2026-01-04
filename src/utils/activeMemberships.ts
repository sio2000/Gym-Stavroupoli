// Active Memberships Utility
// Handles checking user's active memberships for QR code generation

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
 * Get user's active memberships for QR code generation
 */
export const getUserActiveMembershipsForQR = async (userId: string): Promise<ActiveMembership[]> => {
  try {
    console.log('[ActiveMemberships] Fetching active memberships for user:', userId);
    
    // Use is_active column (since status column doesn't exist in this database)
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        package_id,
        is_active,
        start_date,
        end_date,
        membership_packages(
          id,
          name,
          package_type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]) // Not expired
      .order('end_date', { ascending: false });

    if (error) {
      console.error('[ActiveMemberships] Error fetching memberships:', error);
      throw error;
    }

    const activeMemberships: ActiveMembership[] = (data || []).map(membership => {
      // Handle membership_packages as either array or single object
      const packages = Array.isArray(membership.membership_packages) 
        ? membership.membership_packages 
        : membership.membership_packages ? [membership.membership_packages] : [];
      
      // For now, just take the first package (most memberships have one package)
      const pkg = packages[0];
      
      return {
        id: membership.id,
        packageId: membership.package_id,
        packageName: pkg?.name || 'Unknown',
        packageType: pkg?.package_type || 'unknown',
        status: membership.is_active ? 'active' : 'expired' as 'active' | 'expired' | 'cancelled' | 'suspended',
        endDate: membership.end_date,
        startDate: membership.start_date
      };
    });

    console.log('[ActiveMemberships] Found active memberships:', activeMemberships);
    return activeMemberships;
  } catch (error) {
    console.error('[ActiveMemberships] Error fetching active memberships:', error);
    return [];
  }
};

/**
 * Get QR code categories available for user based on their active memberships
 */
export const getAvailableQRCategories = async (userId: string): Promise<QRCodeCategory[]> => {
  try {
    // Ενιαίο QR: αν υπάρχει οποιαδήποτε ενεργή συνδρομή ή accepted personal training, δίνουμε μόνο free_gym
    // BUT: Αν έχει Pilates membership (ή Ultimate/Ultimate Medium που περιλαμβάνουν Pilates), πρέπει να έχει deposit > 0
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

    // Check if user has Pilates membership OR Ultimate/Ultimate Medium (which include Pilates)
    const hasPilatesMembership = activeMemberships.some(m => {
      const pkgName = m.packageName?.toLowerCase() || '';
      return m.packageType === 'pilates' || 
             pkgName === 'pilates' || 
             pkgName.includes('ultimate');
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

    // If user has Pilates membership (or Ultimate/Ultimate Medium), MUST check deposit
    if (hasPilatesMembership) {
      const { data: pilatesDeposit, error: depositError } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('credited_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (depositError) {
        console.warn('[ActiveMemberships] Error fetching Pilates deposit:', depositError);
        // If error, don't show QR option to be safe
        return [];
      }

      // If Pilates membership but deposit = 0 or doesn't exist, no QR eligibility
      // UNLESS user also has non-Pilates membership (e.g., Free Gym)
      if (!pilatesDeposit || !pilatesDeposit.deposit_remaining || pilatesDeposit.deposit_remaining <= 0) {
        console.log(`[ActiveMemberships] User has Pilates/Ultimate membership but deposit is ${pilatesDeposit?.deposit_remaining || 0}`);
        
        // If ONLY Pilates membership (no Free Gym), no QR code
        if (!hasNonPilatesMembership) {
          console.log('[ActiveMemberships] Only Pilates membership with 0 deposit = no QR eligibility');
          return [];
        }
        
        // If has Pilates (with 0 deposit) BUT also has Free Gym membership
        // Allow QR code for Free Gym access only
        console.log('[ActiveMemberships] Has Pilates with 0 deposit BUT also has Free Gym - allowing QR for Free Gym');
        // Continue below to return Free Gym category
      }
    }

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

    // If has Pilates membership, we already checked deposit > 0 above (or has Free Gym fallback)
    // If has other memberships or personal training, eligible
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
