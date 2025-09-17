import { supabase } from '@/config/supabase';
import { 
  MembershipPackage, 
  MembershipPackageDuration, 
  MembershipRequest, 
  Membership 
} from '@/types';
import toast from 'react-hot-toast';

// ===== MEMBERSHIP PACKAGES API =====

export const getMembershipPackages = async (): Promise<MembershipPackage[]> => {
  try {
    console.log('[MembershipAPI] ===== FETCHING MEMBERSHIP PACKAGES =====');
    const { data, error } = await supabase
      .from('membership_packages')
      .select('*')
      .eq('is_active', true)
      .order('name');

    console.log('[MembershipAPI] Query result - data:', data, 'error:', error);
    
    if (error) throw error;
    
    console.log('[MembershipAPI] Returning packages:', data || []);
    return data || [];
  } catch (error) {
    console.error('[MembershipAPI] ===== ERROR FETCHING MEMBERSHIP PACKAGES =====');
    console.error('Error fetching membership packages:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των πακέτων συνδρομής');
    return [];
  }
};

export const getMembershipPackageDurations = async (packageId: string): Promise<MembershipPackageDuration[]> => {
  try {
    // Validate that packageId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(packageId)) {
      console.error('Invalid package ID format:', packageId);
      return [];
    }

    const { data, error } = await supabase
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', packageId)
      .eq('is_active', true)
      .order('duration_days');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching package durations:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των επιλογών διάρκειας');
    return [];
  }
};

// ===== MEMBERSHIP REQUESTS API =====

export const createMembershipRequest = async (
  packageId: string, 
  durationType: string, 
  requestedPrice: number
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('membership_requests')
      .insert({
        user_id: user.id,
        package_id: packageId,
        duration_type: durationType,
        requested_price: requestedPrice,
        status: 'pending'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating membership request:', error);
    toast.error('Σφάλμα κατά τη δημιουργία του αιτήματος');
    return false;
  }
};

export const getMembershipRequests = async (): Promise<MembershipRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('membership_requests')
      .select(`
        *,
        user:user_profiles!membership_requests_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          profile_photo
        ),
        package:membership_packages!membership_requests_package_id_fkey(
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching membership requests:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων');
    return [];
  }
};

export const getUserMembershipRequests = async (userId: string): Promise<MembershipRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('membership_requests')
      .select(`
        *,
        package:membership_packages!membership_requests_package_id_fkey(
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user membership requests:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων');
    return [];
  }
};

export const approveMembershipRequest = async (requestId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from('membership_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) throw new Error('Request not found');

    // Get package duration details
    const { data: duration, error: durationError } = await supabase
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', request.package_id)
      .eq('duration_type', request.duration_type)
      .single();

    if (durationError || !duration) throw new Error('Duration not found');

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration.duration_days);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Start transaction
    const { error: updateError } = await supabase
      .from('membership_requests')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Create membership record
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: request.user_id,
        package_id: request.package_id,
        start_date: startDate,
        end_date: endDateStr,
        is_active: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        duration_type: request.duration_type
      });

    if (membershipError) throw membershipError;

    // If this is a Pilates request with classes_count, create a lesson deposit
    if (request.classes_count && request.classes_count > 0) {
      const { error: lessonDepositError } = await supabase
        .from('lesson_deposits')
        .insert({
          user_id: request.user_id,
          package_id: request.package_id,
          total_classes: request.classes_count,
          remaining_classes: request.classes_count
        });

      if (lessonDepositError) {
        console.error('Error creating lesson deposit:', lessonDepositError);
        // Don't throw error here, just log it as the membership was already created
      } else {
        console.log(`[MembershipAPI] Lesson deposit created: ${request.classes_count} classes for user ${request.user_id}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error approving membership request:', error);
    toast.error('Σφάλμα κατά την έγκριση του αιτήματος');
    return false;
  }
};

export const rejectMembershipRequest = async (requestId: string, rejectedReason: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('membership_requests')
      .update({
        status: 'rejected',
        rejected_reason: rejectedReason
      })
      .eq('id', requestId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting membership request:', error);
    toast.error('Σφάλμα κατά την απόρριψη του αιτήματος');
    return false;
  }
};

// ===== MEMBERSHIPS API =====

export const getUserActiveMemberships = async (userId: string): Promise<Membership[]> => {
  try {
    console.log('[MembershipAPI] ===== FETCHING USER ACTIVE MEMBERSHIPS =====');
    console.log('[MembershipAPI] User ID:', userId);
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        package:membership_packages(
          id,
          name,
          description,
          package_type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]) // Not expired
      .order('end_date', { ascending: false });

    console.log('[MembershipAPI] Query result - data:', data, 'error:', error);
    
    if (error) throw error;
    
    // Transform data to match Membership interface
    const transformedData = (data || []).map(membership => ({
      ...membership,
      status: membership.status || 'active',
      duration_type: membership.duration_type || 'month', // Default fallback
      approved_by: membership.approved_by || null,
      approved_at: membership.approved_at || membership.created_at
    }));
    
    console.log('[MembershipAPI] Returning active memberships:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('[MembershipAPI] ===== ERROR FETCHING USER ACTIVE MEMBERSHIPS =====');
    console.error('Error fetching user memberships:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των συνδρομών');
    return [];
  }
};

export const checkUserHasActiveMembership = async (userId: string, packageId: string): Promise<boolean> => {
  try {
    // Validate that packageId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(packageId)) {
      console.error('Invalid package ID format:', packageId);
      return false;
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]) // Not expired
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking active membership:', error);
    return false;
  }
};

export const expireMemberships = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('expire_memberships');
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error expiring memberships:', error);
    return false;
  }
};

// ===== UTILITY FUNCTIONS =====

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

export const getDurationLabel = (durationType: string): string => {
  const labels = {
    'year': 'Έτος',
    'semester': 'Εξάμηνο',
    'month': 'Μήνας',
    'lesson': 'Μάθημα',
    'pilates_trial': '1 Μάθημα (Trial)',
    'pilates_1month': '4 Μαθήματα (1 μήνας)',
    'pilates_2months': '8 Μαθήματα (2 μήνες)',
    'pilates_3months': '16 Μαθημάτων (3 μήνες)',
    'pilates_6months': '25 Μαθημάτων (6 μήνες)',
    'pilates_1year': '50 Μαθημάτων (1 έτος)',
    'ultimate_1year': '1 Έτος Ultimate'
  };
  return labels[durationType as keyof typeof labels] || durationType;
};

export const getDurationDays = (durationType: string): number => {
  const days = {
    'year': 365,
    'semester': 180,
    'month': 30,
    'lesson': 1,
    'pilates_trial': 1,
    'pilates_1month': 30,
    'pilates_2months': 60,
    'pilates_3months': 90,
    'pilates_6months': 180,
    'pilates_1year': 365
  };
  return days[durationType as keyof typeof days] || 1;
};

export const calculateEndDate = (startDate: string, durationDays: number): string => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return end.toISOString().split('T')[0];
};

export const updateMembershipPackageDuration = async (
  durationId: string, 
  price: number
): Promise<boolean> => {
  try {
    console.log('[MembershipAPI] ===== UPDATING PACKAGE DURATION =====');
    console.log('[MembershipAPI] Duration ID:', durationId, 'New Price:', price);
    
    const { error } = await supabase
      .from('membership_package_durations')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', durationId);

    if (error) {
      console.error('[MembershipAPI] Error updating duration:', error);
      throw error;
    }

    console.log('[MembershipAPI] Duration updated successfully');
    return true;
  } catch (error) {
    console.error('[MembershipAPI] ===== ERROR UPDATING DURATION =====');
    console.error('Error updating package duration:', error);
    toast.error('Σφάλμα κατά την ενημέρωση της τιμής');
    return false;
  }
};

// ===== PILATES-SPECIFIC FUNCTIONS =====

export const getPilatesPackageDurations = async (): Promise<MembershipPackageDuration[]> => {
  try {
    console.log('[MembershipAPI] Loading Pilates package durations from database');
    
    // First, get the Pilates package ID
    const { data: pilatesPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', 'Pilates')
      .eq('is_active', true)
      .single();

    if (packageError || !pilatesPackage) {
      console.error('Error finding Pilates package:', packageError);
      throw new Error('Pilates package not found');
    }

    // Then get the durations for that package
    const { data, error } = await supabase
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', pilatesPackage.id)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error loading Pilates durations:', error);
      throw error;
    }

    console.log('[MembershipAPI] Loaded Pilates durations:', data);
    return data || [];
  } catch (error) {
    console.error('Error loading Pilates package durations:', error);
    toast.error('Σφάλμα κατά τη φόρτωση των επιλογών Pilates');
    return [];
  }
};

export const createPilatesMembershipRequest = async (
  packageId: string,
  durationType: string,
  classesCount: number,
  requestedPrice: number,
  userId?: string
): Promise<boolean> => {
  try {
    let actualUserId = userId;
    if (!actualUserId) {
      console.log('[MembershipAPI] Getting user from auth...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[MembershipAPI] Auth result:', { user, authError });
      if (!user) throw new Error('User not authenticated');
      actualUserId = user.id;
    } else {
      console.log('[MembershipAPI] Using provided userId:', actualUserId);
    }

    console.log('[MembershipAPI] Creating Pilates membership request:', {
      packageId,
      durationType,
      classesCount,
      requestedPrice,
      userId: actualUserId
    });

    // Since we already have the user ID, we can proceed directly
    // The RLS policies will handle the authentication check
    console.log('[MembershipAPI] Proceeding with user ID:', actualUserId);
    
    // Check Supabase client configuration
    console.log('[MembershipAPI] Supabase client info:', {
      hasClient: !!supabase,
      hasAuth: !!supabase?.auth
    });

    // If packageId is not a UUID (it's the package name), find the actual package ID
    let actualPackageId = packageId;
    if (packageId === 'Pilates' || packageId === 'pilates-package') {
      const { data: pilatesPackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('id')
        .eq('name', 'Pilates')
        .eq('is_active', true)
        .single();

      if (packageError || !pilatesPackage) {
        console.error('Error finding Pilates package:', packageError);
        throw new Error('Pilates package not found');
      }
      actualPackageId = pilatesPackage.id;
    }

    // Create the membership request with classes_count
    const insertData = {
      user_id: actualUserId,
      package_id: actualPackageId,
      duration_type: durationType,
      requested_price: requestedPrice,
      classes_count: classesCount,
      status: 'pending'
    };
    
    console.log('[MembershipAPI] Inserting membership request with data:', insertData);
    
    // Test if we can access the table at all
    console.log('[MembershipAPI] Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('membership_requests')
      .select('id')
      .limit(1);
    console.log('[MembershipAPI] Test access result:', { testData, testError });
    
    const { data, error } = await supabase
      .from('membership_requests')
      .insert(insertData)
      .select()
      .single();
      
    console.log('[MembershipAPI] Insert result:', { data, error });

    if (error) {
      console.error('[MembershipAPI] Insert error details:', error);
      
      // Handle rate limiting specifically
      if (error.message && error.message.includes('Too Many Requests')) {
        console.error('[MembershipAPI] Rate limit exceeded, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry once
        const { data: retryData, error: retryError } = await supabase
          .from('membership_requests')
          .insert(insertData)
          .select()
          .single();
          
        if (retryError) {
          console.error('[MembershipAPI] Retry also failed:', retryError);
          throw retryError;
        }
        
        console.log('[MembershipAPI] Retry successful:', retryData);
        toast.success(`Αίτημα Pilates δημιουργήθηκε: ${classesCount} μαθήματα για ${formatPrice(requestedPrice)}`);
        return true;
      }
      
      throw error;
    }

    console.log('[MembershipAPI] Pilates request created successfully:', data);
    toast.success(`Αίτημα Pilates δημιουργήθηκε: ${classesCount} μαθήματα για ${formatPrice(requestedPrice)}`);
    
    return true;
  } catch (error) {
    console.error('Error creating Pilates membership request:', error);
    toast.error('Σφάλμα κατά τη δημιουργία του αιτήματος Pilates');
    return false;
  }
};

export const updatePilatesPackagePricing = async (
  durationType: string,
  newPrice: number
): Promise<boolean> => {
  try {
    console.log(`[MembershipAPI] Updating Pilates pricing: ${durationType} = ${formatPrice(newPrice)}`);
    
    // First, get the Pilates package ID
    const { data: pilatesPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', 'Pilates')
      .eq('is_active', true)
      .single();

    if (packageError || !pilatesPackage) {
      console.error('Error finding Pilates package:', packageError);
      throw new Error('Pilates package not found');
    }

    const { error } = await supabase
      .from('membership_package_durations')
      .update({ 
        price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('package_id', pilatesPackage.id)
      .eq('duration_type', durationType);

    if (error) {
      console.error('Error updating Pilates pricing:', error);
      throw error;
    }

    console.log(`[MembershipAPI] Pilates pricing updated successfully: ${durationType} = ${formatPrice(newPrice)}`);
    toast.success(`Η τιμή για ${getDurationLabel(durationType)} ενημερώθηκε σε ${formatPrice(newPrice)}`);
    
    return true;
  } catch (error) {
    console.error('Error updating Pilates pricing:', error);
    toast.error('Σφάλμα κατά την ενημέρωση της τιμής Pilates');
    return false;
  }
};

// ===== INSTALLMENTS API =====

export const createUltimateMembershipRequest = async (
  packageId: string,
  durationType: string,
  requestedPrice: number,
  hasInstallments: boolean = false,
  userId?: string
): Promise<boolean> => {
  try {
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      actualUserId = user.id;
    }

    console.log('[MembershipAPI] Creating Ultimate membership request:', {
      packageId,
      durationType,
      requestedPrice,
      hasInstallments,
      userId: actualUserId
    });

    // If packageId is not a UUID, find the actual package ID
    let actualPackageId = packageId;
    if (packageId === 'Ultimate' || packageId === 'ultimate-package') {
      const { data: ultimatePackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('id')
        .eq('name', 'Ultimate')
        .eq('is_active', true)
        .single();

      if (packageError || !ultimatePackage) {
        console.error('Error finding Ultimate package:', packageError);
        throw new Error('Ultimate package not found');
      }
      actualPackageId = ultimatePackage.id;
    }

    // Prepare the insert data
    const insertData: any = {
      user_id: actualUserId,
      package_id: actualPackageId,
      duration_type: durationType,
      requested_price: requestedPrice,
      has_installments: hasInstallments,
      status: 'pending'
    };

    // For installments, we don't set amounts - admin will set them later
    if (hasInstallments) {
      insertData.installment_1_amount = 0;
      insertData.installment_2_amount = 0;
      insertData.installment_3_amount = 0;
      insertData.installment_1_payment_method = 'cash';
      insertData.installment_2_payment_method = 'cash';
      insertData.installment_3_payment_method = 'cash';
    }

    const { data, error } = await supabase
      .from('membership_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[MembershipAPI] Insert error:', error);
      throw error;
    }

    console.log('[MembershipAPI] Ultimate request created successfully:', data);
    
    if (hasInstallments) {
      toast.success(`Αίτημα Ultimate δημιουργήθηκε με επιλογή δόσεων. Ο διαχειριστής θα καθορίσει τα ποσά.`);
    } else {
      toast.success(`Αίτημα Ultimate δημιουργήθηκε: ${formatPrice(requestedPrice)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating Ultimate membership request:', error);
    toast.error('Σφάλμα κατά τη δημιουργία του αιτήματος Ultimate');
    return false;
  }
};

export const getUsersWithInstallments = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_users_with_installments');
    
    if (error) {
      console.error('Error fetching users with installments:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching users with installments:', error);
    return [];
  }
};

export const markInstallmentPaid = async (
  requestId: string,
  installmentNumber: number,
  paymentMethod: string = 'cash'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('mark_installment_paid', {
      request_id: requestId,
      installment_number: installmentNumber,
      payment_method: paymentMethod
    });
    
    if (error) {
      console.error('Error marking installment as paid:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error marking installment as paid:', error);
    toast.error('Σφάλμα κατά την ενημέρωση της δόσης');
    return false;
  }
};

export const getUltimatePackageDurations = async (): Promise<MembershipPackageDuration[]> => {
  try {
    const { data, error } = await supabase
      .from('membership_package_durations')
      .select(`
        id,
        package_id,
        duration_type,
        duration_days,
        price,
        classes_count,
        is_active,
        created_at,
        updated_at,
        membership_packages!inner(
          id,
          name,
          package_type
        )
      `)
      .eq('membership_packages.name', 'Ultimate')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching Ultimate package durations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching Ultimate package durations:', error);
    return [];
  }
};

// Ultimate Package Dual Activation
export const approveUltimateMembershipRequest = async (requestId: string): Promise<boolean> => {
  try {
    console.log('[MembershipAPI] Approving Ultimate membership request with dual activation:', requestId);

    // Get the request details first
    const { data: requestData, error: requestError } = await supabase
      .from('membership_requests')
      .select(`
        *,
        user_profiles!membership_requests_user_id_fkey(user_id, first_name, last_name, email),
        membership_packages!membership_requests_package_id_fkey(id, name, package_type)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      console.error('[MembershipAPI] Error fetching request data:', requestError);
      throw requestError;
    }

    // Verify this is an Ultimate package
    if (requestData.membership_packages?.name !== 'Ultimate') {
      throw new Error('This function is only for Ultimate package requests');
    }

    // Update the request status to approved first
    const { error: updateError } = await supabase
      .from('membership_requests')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[MembershipAPI] Error updating request status:', updateError);
      throw updateError;
    }

    // Call the database function to create dual memberships
    const { data: dualResult, error: dualError } = await supabase
      .rpc('create_ultimate_dual_memberships', {
        p_user_id: requestData.user_id,
        p_ultimate_request_id: requestId,
        p_duration_days: 365, // 1 year
        p_start_date: new Date().toISOString().split('T')[0] // Today's date
      });

    if (dualError) {
      console.error('[MembershipAPI] Error creating dual memberships:', dualError);
      
      // Rollback the request status update
      await supabase
        .from('membership_requests')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      throw dualError;
    }

    // Check if the dual activation was successful
    if (!dualResult || !dualResult.success) {
      console.error('[MembershipAPI] Dual activation failed:', dualResult);
      
      // Rollback the request status update
      await supabase
        .from('membership_requests')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      throw new Error(dualResult?.error || 'Failed to create dual memberships');
    }

    console.log('[MembershipAPI] Ultimate dual activation successful:', {
      requestId,
      userId: requestData.user_id,
      pilatesMembershipId: dualResult.pilates_membership_id,
      freeGymMembershipId: dualResult.free_gym_membership_id,
      startDate: dualResult.start_date,
      endDate: dualResult.end_date
    });

    return true;

  } catch (error) {
    console.error('[MembershipAPI] Error approving Ultimate membership request:', error);
    toast.error('Σφάλμα κατά την έγκριση του Ultimate αιτήματος');
    return false;
  }
};