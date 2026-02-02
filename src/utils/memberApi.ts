import { supabaseAdmin } from '@/config/supabaseAdmin';
import { User, MembershipPackage, MembershipPackageDuration } from '@/types';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface MemberFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  language: 'el' | 'en';
  role: 'user' | 'trainer' | 'admin' | 'secretary';
}

export interface RegistrationRequest {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: string;
  requested_price: number;
  classes_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  rejected_reason?: string;
  user?: User;
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}

export interface MemberStatistics {
  totalMembers: number;
  activeMembers: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalPackages: number;
  activePackages: number;
}

// Get all members
export const getMembers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

// Get member by ID
export const getMemberById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching member:', error);
    throw error;
  }
};

// Update member
export const updateMember = async (id: string, memberData: Partial<MemberFormData>): Promise<User> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(memberData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Delete member
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Get all registration requests
export const getRegistrationRequests = async (): Promise<RegistrationRequest[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_requests')
      .select(`
        *,
        user_profiles(first_name, last_name, email, profile_photo),
        membership_packages(name),
        membership_package_durations(duration_type, price, classes_count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    throw error;
  }
};

// Get registration request by ID
export const getRegistrationRequestById = async (id: string): Promise<RegistrationRequest | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_requests')
      .select(`
        *,
        user_profiles(first_name, last_name, email, profile_photo),
        membership_packages(name),
        membership_package_durations(duration_type, price, classes_count)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching registration request:', error);
    throw error;
  }
};

// Approve registration request
export const approveRegistrationRequest = async (requestId: string, adminId: string): Promise<void> => {
  try {
    // Get the request details
    const request = await getRegistrationRequestById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('membership_requests')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Create membership - using local timezone to avoid UTC conversion issues
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (request.duration?.duration_days || 30));
    
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert([{
        user_id: request.user_id,
        package_id: request.package_id,
        duration_type: request.duration_type,
        start_date: formatDateLocal(startDate),
        end_date: formatDateLocal(endDate),
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: adminId
      }]);

    if (membershipError) throw membershipError;
  } catch (error) {
    console.error('Error approving registration request:', error);
    throw error;
  }
};

// Reject registration request
export const rejectRegistrationRequest = async (requestId: string, reason: string, adminId: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('membership_requests')
      .update({ 
        status: 'rejected',
        rejected_reason: reason,
        rejected_by: adminId,
        rejected_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting registration request:', error);
    throw error;
  }
};

// Get all membership packages
export const getMembershipPackages = async (): Promise<MembershipPackage[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_packages')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching membership packages:', error);
    throw error;
  }
};

// Get membership package by ID
export const getMembershipPackageById = async (id: string): Promise<MembershipPackage | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching membership package:', error);
    throw error;
  }
};

// Get membership package durations
export const getMembershipPackageDurations = async (packageId: string): Promise<MembershipPackageDuration[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', packageId)
      .eq('is_active', true)
      .order('duration_days');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching membership package durations:', error);
    throw error;
  }
};

// Create membership package
export const createMembershipPackage = async (packageData: Omit<MembershipPackage, 'id' | 'created_at' | 'updated_at'>): Promise<MembershipPackage> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_packages')
      .insert([packageData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating membership package:', error);
    throw error;
  }
};

// Update membership package
export const updateMembershipPackage = async (id: string, packageData: Partial<MembershipPackage>): Promise<MembershipPackage> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_packages')
      .update(packageData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating membership package:', error);
    throw error;
  }
};

// Delete membership package
export const deleteMembershipPackage = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('membership_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting membership package:', error);
    throw error;
  }
};

// Create membership package duration
export const createMembershipPackageDuration = async (durationData: Omit<MembershipPackageDuration, 'id' | 'created_at' | 'updated_at'>): Promise<MembershipPackageDuration> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_package_durations')
      .insert([durationData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating membership package duration:', error);
    throw error;
  }
};

// Update membership package duration
export const updateMembershipPackageDuration = async (id: string, durationData: Partial<MembershipPackageDuration>): Promise<MembershipPackageDuration> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_package_durations')
      .update(durationData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating membership package duration:', error);
    throw error;
  }
};

// Delete membership package duration
export const deleteMembershipPackageDuration = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseAdmin
      .from('membership_package_durations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting membership package duration:', error);
    throw error;
  }
};

// Search members
export const searchMembers = async (searchTerm: string, filters?: {
  role?: string;
  isActive?: boolean;
}): Promise<User[]> => {
  try {
    let query = supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching members:', error);
    throw error;
  }
};

// Get member statistics
export const getMemberStatistics = async (): Promise<MemberStatistics> => {
  try {
    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: pendingRequests },
      { count: approvedRequests },
      { count: rejectedRequests },
      { count: totalPackages },
      { count: activePackages }
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('membership_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('membership_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseAdmin.from('membership_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabaseAdmin.from('membership_packages').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('membership_packages').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      pendingRequests: pendingRequests || 0,
      approvedRequests: approvedRequests || 0,
      rejectedRequests: rejectedRequests || 0,
      totalPackages: totalPackages || 0,
      activePackages: activePackages || 0
    };
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    throw error;
  }
};

// Get members by role
export const getMembersByRole = async (role: string): Promise<User[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching members by role:', error);
    throw error;
  }
};

// Get recent members
export const getRecentMembers = async (limit: number = 10): Promise<User[]> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent members:', error);
    throw error;
  }
};

// Get member activity
export const getMemberActivity = async (memberId: string): Promise<{
  totalBookings: number;
  totalPayments: number;
  lastActivity: string;
  membershipStatus: string;
}> => {
  try {
    const [
      { count: totalBookings },
      { count: totalPayments },
      { data: lastActivity },
      { data: membershipStatus }
    ] = await Promise.all([
      supabaseAdmin.from('lesson_bookings').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
      supabaseAdmin.from('payments').select('*', { count: 'exact', head: true }).eq('user_id', memberId),
      supabaseAdmin.from('lesson_bookings').select('created_at').eq('user_id', memberId).order('created_at', { ascending: false }).limit(1),
      supabaseAdmin.from('memberships').select('status').eq('user_id', memberId).order('created_at', { ascending: false }).limit(1)
    ]);

    return {
      totalBookings: totalBookings || 0,
      totalPayments: totalPayments || 0,
      lastActivity: lastActivity?.[0]?.created_at || 'Never',
      membershipStatus: membershipStatus?.[0]?.status || 'No membership'
    };
  } catch (error) {
    console.error('Error fetching member activity:', error);
    throw error;
  }
};
