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
  'standard': { // Map 'standard' package type to Free Gym QR category
    key: 'free_gym',
    label: 'Ελεύθερο Gym',
    icon: '🏋️',
    packageType: 'standard'
  },
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
        membership_packages!inner(
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

    const activeMemberships: ActiveMembership[] = (data || []).map(membership => ({
      id: membership.id,
      packageId: membership.package_id,
      packageName: membership.membership_packages.name,
      packageType: membership.membership_packages.package_type,
      status: membership.is_active ? 'active' : 'expired' as 'active' | 'expired' | 'cancelled' | 'suspended',
      endDate: membership.end_date,
      startDate: membership.start_date
    }));

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
    const activeMemberships = await getUserActiveMembershipsForQR(userId);
    
    // Get unique package types from active memberships
    const availablePackageTypes = [...new Set(activeMemberships.map(m => m.packageType))];
    
    // Map to QR code categories for Free Gym & Pilates (μέσω ενεργών συνδρομών)
    const availableCategories: QRCodeCategory[] = availablePackageTypes
      .map(packageType => PACKAGE_TYPE_TO_QR_CATEGORY[packageType])
      .filter(Boolean) as QRCodeCategory[]; // Remove undefined entries

    // Επιπλέον: Προσθήκη Personal Training αν υπάρχει εγκεκριμένο πρόγραμμα
    try {
      const { data: personalSchedule, error: personalErr } = await supabase
        .from('personal_training_schedules')
        .select('id,status')
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1);
      if (!personalErr && personalSchedule && personalSchedule.length > 0) {
        const personalCategory = PACKAGE_TYPE_TO_QR_CATEGORY['personal_training'];
        if (personalCategory && !availableCategories.find(c => c.key === 'personal')) {
          availableCategories.push(personalCategory);
        }
      }
    } catch (e) {
      console.warn('[ActiveMemberships] Could not check personal schedule acceptance:', e);
    }
    
    console.log('[ActiveMemberships] Available QR categories:', availableCategories);
    return availableCategories;
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
