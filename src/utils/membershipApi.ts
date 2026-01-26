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

// Helper: format date YYYY-MM-DD (local)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

type InstallmentInput = {
  installment1Amount?: number;
  installment1DueDate?: string;
  installment1PaymentMethod?: 'cash' | 'pos';
  installment2Amount?: number;
  installment2DueDate?: string;
  installment2PaymentMethod?: 'cash' | 'pos';
  installment3Amount?: number;
  installment3DueDate?: string;
  installment3PaymentMethod?: 'cash' | 'pos';
};

const buildInstallmentPayload = (installments?: InstallmentInput) => {
  const today = new Date().toISOString().split('T')[0];

  // Defaults when installments ζητούνται αλλά δεν ήρθαν τιμές
  if (!installments) {
    return {
      has_installments: true,
      installment_1_amount: 0,
      installment_2_amount: 0,
      installment_3_amount: 0,
      installment_1_payment_method: 'cash',
      installment_2_payment_method: 'cash',
      installment_3_payment_method: 'cash',
      installment_1_due_date: today,
      installment_2_due_date: today,
      installment_3_due_date: today,
      installment_1_locked: false,
      installment_2_locked: false,
      installment_3_locked: false,
      third_installment_deleted: false,
      all_installments_paid: false
    };
  }

  const a1 = installments.installment1Amount ?? 0;
  const a2 = installments.installment2Amount ?? 0;
  const a3 = installments.installment3Amount ?? 0;

  return {
    has_installments: true,
    installment_1_amount: a1 || 0,
    installment_2_amount: a2 || 0,
    installment_3_amount: a3 || 0,
    installment_1_payment_method: installments.installment1PaymentMethod || 'cash',
    installment_2_payment_method: installments.installment2PaymentMethod || 'cash',
    installment_3_payment_method: installments.installment3PaymentMethod || 'cash',
    installment_1_due_date: installments.installment1DueDate || today,
    installment_2_due_date: installments.installment2DueDate || today,
    installment_3_due_date: installments.installment3DueDate || today,
    installment_1_locked: a1 > 0,
    installment_2_locked: a2 > 0,
    installment_3_locked: a3 > 0,
    third_installment_deleted: false,
    all_installments_paid: false
  };
};

// Helper: create active membership immediately
const ensureActiveMembership = async ({
  userId,
  packageId,
  durationType,
  customDurationDays
}: {
  userId: string;
  packageId: string;
  durationType: string;
  customDurationDays?: number;
}): Promise<{ startDate: string; endDate: string }> => {
  try {
    // Normalize duration to satisfy DB constraint (Ultimate Medium -> ultimate_1year)
    const normalizedDurationType =
      durationType === 'ultimate_medium_1year' ? 'ultimate_1year' : durationType;

    // Get package name to detect Ultimate / Medium
    const { data: pkgRow } = await supabase
      .from('membership_packages')
      .select('name')
      .eq('id', packageId)
      .single();
    const pkgName = (pkgRow?.name || '').toLowerCase();
    const isUltimate = pkgName.includes('ultimate');

    const { data: durationRow, error: durationError } = await supabase
      .from('membership_package_durations')
      .select('duration_days')
      .eq('package_id', packageId)
      .eq('duration_type', normalizedDurationType)
      .single();

    if (durationError) {
      console.warn('[MembershipAPI] Duration row not found for immediate membership insert:', durationError);
    }

    // Use custom duration if provided, otherwise fallback to default logic
    // Fallback: Ultimate/Medium => 365 days, else 30 if missing
    const durationDays = customDurationDays || durationRow?.duration_days || (isUltimate ? 365 : 30);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    // Check for existing active membership for same user and package that is still valid
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('start_date, end_date')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gte('end_date', currentDate) // Only consider memberships that haven't expired
      .single();

    if (existingMembership) {
      console.log('[MembershipAPI] Found existing active and valid membership, returning existing dates');
      return { startDate: existingMembership.start_date, endDate: existingMembership.end_date };
    }

    const { data: authUser } = await supabase.auth.getUser();
    const insertMembership: any = {
      user_id: userId,
      package_id: packageId,
      start_date: formatDateLocal(start),
      end_date: formatDateLocal(end),
      is_active: true,
      status: 'active',
      duration_type: normalizedDurationType,
      approved_by: authUser?.user?.id || null,
      approved_at: new Date().toISOString()
    };

    const { error: membershipError } = await supabase.from('memberships').insert(insertMembership);
    if (membershipError) {
      console.error('[MembershipAPI] Error inserting active membership:', membershipError);
      throw membershipError;
    }
    return { startDate: formatDateLocal(start), endDate: formatDateLocal(end) };
  } catch (err) {
    console.error('[MembershipAPI] ensureActiveMembership failed:', err);
    throw err;
  }
};

// Helper: add cash/pos transaction
const addCashTransaction = async ({
  userId,
  amount,
  transactionType,
  notes
}: {
  userId: string;
  amount: number;
  transactionType: 'cash' | 'pos';
  notes?: string;
}): Promise<void> => {
  if (!amount || Number.isNaN(amount)) return;
  const formatted = amount.toFixed(2);
  try {
    const { data: authUser } = await supabase.auth.getUser();
    const createdBy = authUser?.user?.id || '00000000-0000-0000-0000-000000000001';
    const { error } = await supabase.from('user_cash_transactions').insert({
      user_id: userId,
      amount: formatted,
      transaction_type: transactionType,
      program_id: null,
      notes: notes || 'Cash/POS transaction from secretary subscription',
      created_by: createdBy
    });
    if (error) {
      console.error('[MembershipAPI] Error inserting cash transaction:', error);
      throw error;
    }
  } catch (err) {
    console.error('[MembershipAPI] addCashTransaction failed:', err);
    throw err;
  }
};

// Helper: add kettlebell points
const addKettlebellPoints = async ({
  userId,
  points
}: {
  userId: string;
  points: number;
}): Promise<void> => {
  if (!points || Number.isNaN(points) || points === 0) return;
  try {
    const { data: authUser } = await supabase.auth.getUser();
    const createdBy = authUser?.user?.id || null;
    const { error } = await supabase.from('user_kettlebell_points').insert({
      user_id: userId,
      points,
      program_id: null,
      created_by: createdBy
    });
    if (error) {
      console.error('[MembershipAPI] Error inserting kettlebell points:', error);
      throw error;
    }
  } catch (err) {
    console.error('[MembershipAPI] addKettlebellPoints failed:', err);
    throw err;
  }
};

// Helper: compute Pilates deposit count
const computePilatesDepositCount = async ({
  packageId,
  durationType,
  classesCountOverride
}: {
  packageId: string;
  durationType: string;
  classesCountOverride?: number;
}): Promise<number> => {
  const pilatesDurationToDeposit: Record<string, number> = {
    pilates_trial: 1,
    pilates_1month: 4,
    pilates_2months: 8,
    pilates_3months: 16,
    pilates_6months: 25,
    pilates_1year: 50,
    ultimate_1year: 3, // Ultimate weekly cap: 3 per εβδομάδα, αρχικό deposit 3
    ultimate_medium_1year: 1
  };

  if (typeof classesCountOverride === 'number' && classesCountOverride > 0) {
    return classesCountOverride;
  }

  try {
    const { data: durRow } = await supabase
      .from('membership_package_durations')
      .select('classes_count, price, duration_type')
      .eq('package_id', packageId)
      .eq('duration_type', durationType)
      .single();

    if (durRow?.classes_count) return durRow.classes_count as number;

    const mapped = pilatesDurationToDeposit[(durRow?.duration_type || durationType) as keyof typeof pilatesDurationToDeposit];
    if (mapped) return mapped;

    if (typeof durRow?.price === 'number') {
      const price = Math.round(durRow.price);
      const priceMap: Record<number, number> = { 0: 1, 44: 4, 80: 8, 144: 16, 190: 25, 350: 50 };
      const fromPrice = priceMap[price];
      if (fromPrice) return fromPrice;
    }
  } catch (e) {
    console.warn('[MembershipAPI] computePilatesDepositCount fallback:', e);
  }

  return pilatesDurationToDeposit[durationType as keyof typeof pilatesDurationToDeposit] || 0;
};

// Helper: credit Pilates deposit via RPC
const addPilatesDeposit = async ({
  userId,
  packageId,
  durationType,
  classesCount,
  endDateStr
}: {
  userId: string;
  packageId: string;
  durationType: string;
  classesCount?: number;
  endDateStr: string;
}): Promise<void> => {
  const depositCount = await computePilatesDepositCount({
    packageId,
    durationType,
    classesCountOverride: classesCount
  });

  if (!depositCount) return;

  const expiresAt = new Date(endDateStr + 'T23:59:59Z').toISOString();
  const { data: authUser } = await supabase.auth.getUser();
  const createdBy = authUser?.user?.id || '00000000-0000-0000-0000-000000000001';

  // Deactivate all previous deposits for this user to ensure clean state
  await supabase
    .from('pilates_deposits')
    .update({ is_active: false })
    .eq('user_id', userId);

  const { error: rpcError } = await supabase.rpc('credit_pilates_deposit', {
    p_created_by: createdBy,
    p_user_id: userId,
    p_package_id: packageId,
    p_deposit_remaining: depositCount,
    p_expires_at: expiresAt
  });
  if (rpcError) {
    console.error('[MembershipAPI] Error creating pilates deposit via RPC:', rpcError);
    throw rpcError;
  }
};

// ===== MEMBERSHIP REQUESTS API =====

export const createMembershipRequest = async (
  packageId: string,
  durationType: string,
  requestedPrice: number,
  hasInstallments: boolean = false,
  userIdOverride?: string,
  paymentMethod: 'cash' | 'pos' = 'cash',
  kettlebellPoints?: number,
  installments?: InstallmentInput,
  customDurationDays?: number
): Promise<boolean> => {
  try {
    let targetUserId = userIdOverride;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      targetUserId = user.id;
    }

    const insertData: any = {
      user_id: targetUserId,
      package_id: packageId,
      duration_type: durationType,
      requested_price: requestedPrice,
      status: 'approved'
    };

    if (hasInstallments) {
      Object.assign(insertData, buildInstallmentPayload(installments));
    }

    const { error } = await supabase
      .from('membership_requests')
      .insert(insertData);

    if (error) throw error;

    // *** FIX: Calculate correct dates and create new membership instead of using ensureActiveMembership ***
    // ensureActiveMembership returns existing dates if membership exists, but for new requests we need new dates
    
    // Get duration details
    const { data: duration, error: durationError } = await supabase
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', packageId)
      .eq('duration_type', durationType)
      .single();

    if (durationError || !duration) {
      console.error('[MembershipAPI] Duration not found for membership request:', durationError);
      throw new Error('Duration not found');
    }

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration.duration_days);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Deactivate existing active memberships for this user and package
    const { error: deactivateError } = await supabase
      .from('memberships')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetUserId)
      .eq('package_id', packageId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('[MembershipAPI] Error deactivating existing memberships:', deactivateError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active memberships for user ${targetUserId} and package ${packageId}`);
    }

    // Create new membership
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: targetUserId,
        package_id: packageId,
        start_date: startDate,
        end_date: endDateStr,
        is_active: true,
        duration_type: durationType,
        approved_by: null, // Secretary created
        approved_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (membershipError) {
      console.error('[MembershipAPI] Error creating new membership:', membershipError);
      throw membershipError;
    }

    if (requestedPrice && !Number.isNaN(requestedPrice)) {
      await addCashTransaction({
        userId: targetUserId,
        amount: requestedPrice,
        transactionType: paymentMethod,
        notes: 'Payment from secretary subscription (auto-approved)'
      });
    }

    if (kettlebellPoints && !Number.isNaN(kettlebellPoints)) {
      await addKettlebellPoints({
        userId: targetUserId,
        points: kettlebellPoints
      });
    }
    return true;
  } catch (error) {
    console.error('Error creating membership request:', error);
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
      .not('package.name', 'eq', 'Ultimate') // ΕΞΑΙΡΕΣΗ Ultimate requests - αυτά χρησιμοποιούν ξεχωριστό σύστημα
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Ensure the locked installment fields are properly set (with fallback)
    const requestsWithLockedFields = (data || []).map((request) => {
      // Check if new fields exist
      const hasNewFields = request.installment_1_locked !== undefined || 
                          request.installment_2_locked !== undefined || 
                          request.installment_3_locked !== undefined;
      
      if (hasNewFields) {
        return {
          ...request,
          installment_1_locked: request.installment_1_locked || false,
          installment_2_locked: request.installment_2_locked || false,
          installment_3_locked: request.installment_3_locked || false,
          third_installment_deleted: request.third_installment_deleted || false,
          third_installment_deleted_at: request.third_installment_deleted_at,
          third_installment_deleted_by: request.third_installment_deleted_by,
        };
      }
      
      // Fallback to default values if fields don't exist
      return {
        ...request,
        installment_1_locked: false,
        installment_2_locked: false,
        installment_3_locked: false,
        third_installment_deleted: false,
        third_installment_deleted_at: undefined,
        third_installment_deleted_by: undefined,
      };
    });
    
    return requestsWithLockedFields;
  } catch (error) {
    console.error('Error fetching membership requests:', error);
    return [];
  }
};

// New function to get membership requests with locked installments data
export const getMembershipRequestsWithLockedInstallments = async (): Promise<MembershipRequest[]> => {
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
      .not('package.name', 'eq', 'Ultimate') // ΕΞΑΙΡΕΣΗ Ultimate requests - αυτά χρησιμοποιούν ξεχωριστό σύστημα
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Load locked installments for each request (fallback to old system if new fields don't exist)
    const requestsWithLockedInstallments = await Promise.all(
      (data || []).map(async (request) => {
        try {
          // First check if the new fields exist
          const hasNewFields = request.installment_1_locked !== undefined || 
                              request.installment_2_locked !== undefined || 
                              request.installment_3_locked !== undefined;
          
          if (hasNewFields) {
            return {
              ...request,
              installment_1_locked: request.installment_1_locked || false,
              installment_2_locked: request.installment_2_locked || false,
              installment_3_locked: request.installment_3_locked || false,
              third_installment_deleted: request.third_installment_deleted || false,
              third_installment_deleted_at: request.third_installment_deleted_at,
              third_installment_deleted_by: request.third_installment_deleted_by,
            };
          }
          
          // Fallback to old system
          
          const { data: lockedData, error: lockedError } = await supabase
            .rpc('get_locked_installments_for_request', { request_id: request.id });
          
          if (lockedError) {
            console.error('Error loading locked installments for request:', request.id, lockedError);
            return request;
          }

          // Add locked installment information to the request
          const lockedInstallments = lockedData || [];
          
          // Check if third installment is deleted
          const { data: deletedData, error: deletedError } = await supabase
            .rpc('is_third_installment_deleted', { request_id: request.id });
          
          let thirdInstallmentDeleted = false;
          let thirdInstallmentDeletedAt = undefined;
          let thirdInstallmentDeletedBy = undefined;
          
          if (!deletedError && deletedData) {
            thirdInstallmentDeleted = deletedData;
            
            if (deletedData) {
              // Get deletion info
              const { data: deletionInfo, error: infoError } = await supabase
                .rpc('get_deleted_third_installment_info', { request_id: request.id });
              
              if (!infoError && deletionInfo && deletionInfo.length > 0) {
                thirdInstallmentDeletedAt = deletionInfo[0].deleted_at;
                thirdInstallmentDeletedBy = deletionInfo[0].deleted_by_name;
              }
            }
          }
          
          return {
            ...request,
            locked_installments: lockedInstallments,
            installment_1_locked: lockedInstallments.some((li: any) => li.installment_number === 1),
            installment_2_locked: lockedInstallments.some((li: any) => li.installment_number === 2),
            installment_3_locked: lockedInstallments.some((li: any) => li.installment_number === 3),
            third_installment_deleted: thirdInstallmentDeleted,
            third_installment_deleted_at: thirdInstallmentDeletedAt,
            third_installment_deleted_by: thirdInstallmentDeletedBy,
          };
        } catch (error) {
          console.error('Error processing locked installments for request:', request.id, error);
          return request;
        }
      })
    );

    return requestsWithLockedInstallments;
  } catch (error) {
    console.error('Error fetching membership requests with locked installments:', error);
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
      .not('package.name', 'eq', 'Ultimate') // ΕΞΑΙΡΕΣΗ Ultimate requests - αυτά χρησιμοποιούν ξεχωριστό σύστημα
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user membership requests:', error);
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
    const startDate = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration.duration_days);
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;

    // Start transaction-like sequence (Supabase JS doesn't support multi-statement tx)
    const { error: updateError } = await supabase
      .from('membership_requests')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // *** FIX: Deactivate existing active memberships of the same package type ***
    // This ensures that when a user upgrades their membership, old memberships are properly deactivated
    const { error: deactivateError } = await supabase
      .from('memberships')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', request.user_id)
      .eq('package_id', request.package_id)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('[MembershipAPI] Error deactivating existing memberships:', deactivateError);
      // Don't fail the approval for this, but log the issue
    } else {
      console.log(`[MembershipAPI] Deactivated existing active memberships for user ${request.user_id} and package ${request.package_id}`);
    }

    // For Pilates packages, also deactivate existing Pilates deposits to prevent conflicts
    if (isPilatesPackage) {
      const { error: deactivateDepositError } = await supabase
        .from('pilates_deposits')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.user_id)
        .eq('is_active', true);

      if (deactivateDepositError) {
        console.error('[MembershipAPI] Error deactivating existing Pilates deposits:', deactivateDepositError);
      } else {
        console.log(`[MembershipAPI] Deactivated existing active Pilates deposits for user ${request.user_id}`);
      }
    }

    // Create membership record
    const { data: membershipData, error: membershipError } = await supabase
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
      })
      .select('id')
      .single();

    if (membershipError) throw membershipError;

    const membershipId = membershipData?.id;
    if (!membershipId) throw new Error('Failed to get membership ID');

    // Validate membership completeness (legacy prevention)
    const completenessValidation = await validateMembershipCompleteness(request.user_id, membershipId);
    if (!completenessValidation.isComplete) {
      console.error('[MembershipAPI] Membership validation failed:', completenessValidation);
      // Don't fail the approval, but log the issue
      console.warn('[MembershipAPI] Membership created but incomplete. Missing:', completenessValidation.missingComponents);
    }

    // Pilates deposit crediting (robust mapping)
    const pilatesDurationToDeposit: Record<string, number> = {
      pilates_trial: 1,
      pilates_1month: 4,
      pilates_2months: 8,
      pilates_3months: 16,
      pilates_6months: 25,
      pilates_1year: 50
    };

    let isPilatesPackage = false;
    try {
      const { data: pkg } = await supabase
        .from('membership_packages')
        .select('name')
        .eq('id', request.package_id)
        .single();
      isPilatesPackage = pkg?.name === 'Pilates';
    } catch (e) {
      console.warn('[MembershipAPI] Could not verify package name for pilates deposit logic. Skipping deposit credit.');
    }

    if (isPilatesPackage) {
      let depositCount = 0;
      if (typeof request.classes_count === 'number' && request.classes_count > 0) {
        depositCount = request.classes_count;
      }
      try {
        const { data: durRow } = await supabase
          .from('membership_package_durations')
          .select('classes_count, price, duration_days, duration_type')
          .eq('package_id', request.package_id)
          .eq('duration_type', request.duration_type)
          .single();
        if (!depositCount && durRow?.classes_count) {
          depositCount = durRow.classes_count as number;
        }
        if (!depositCount) {
          depositCount = pilatesDurationToDeposit[(durRow?.duration_type || request.duration_type) as keyof typeof pilatesDurationToDeposit] || 0;
        }
        if (!depositCount && typeof durRow?.price === 'number') {
          const price = Math.round(durRow.price);
          const priceMap: Record<number, number> = { 0: 1, 44: 4, 80: 8, 144: 16, 190: 25, 350: 50 };
          depositCount = priceMap[price] || 0;
        }
      } catch (e) {
        console.warn('[MembershipAPI] Could not read duration row for pilates deposit mapping:', e);
      }
      if (!depositCount) {
        depositCount = pilatesDurationToDeposit[request.duration_type as keyof typeof pilatesDurationToDeposit] || 0;
      }

      if (depositCount > 0) {
        const expiresAt = new Date(endDateStr + 'T23:59:59Z').toISOString();
        // Use SECURITY DEFINER RPC to bypass RLS safely
        const { error: rpcError } = await supabase.rpc('credit_pilates_deposit', {
          p_created_by: user.id,
          p_user_id: request.user_id,
          p_package_id: request.package_id,
          p_deposit_remaining: depositCount,
          p_expires_at: expiresAt
        });
        if (rpcError) {
          console.error('[MembershipAPI] Error creating pilates deposit via RPC:', rpcError);
        } else {
          console.log(`[MembershipAPI] Pilates deposit credited via RPC: ${depositCount} lessons for user ${request.user_id}`);
        }
      } else {
        console.warn('[MembershipAPI] Pilates deposit mapping resulted in 0 credits. Check configuration.');
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

/**
 * Update Pilates memberships status based on deposit availability
 * Sets is_active = false for Pilates memberships when deposit_remaining <= 0
 */
const updatePilatesMembershipStatus = async (userId: string): Promise<void> => {
  try {
    // Get user's Pilates memberships that are currently active
    const { data: activePilatesMemberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        id,
        package:membership_packages(name, package_type)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (membershipError) {
      console.warn('[MembershipAPI] Error fetching active Pilates memberships for status update:', membershipError);
      return;
    }

    if (!activePilatesMemberships || activePilatesMemberships.length === 0) {
      return; // No active memberships to check
    }

    // Check current deposit
    const { data: pilatesDeposit, error: depositError } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('credited_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (depositError) {
      console.warn('[MembershipAPI] Error fetching Pilates deposit for status update:', depositError);
      return;
    }

    const hasValidDeposit = pilatesDeposit && pilatesDeposit.deposit_remaining && pilatesDeposit.deposit_remaining > 0;

    // Find Pilates memberships that need to be deactivated
    const pilatesMembershipsToDeactivate = activePilatesMemberships.filter(membership => {
      const packageName = membership.package?.name?.toLowerCase() || '';
      const packageType = membership.package?.package_type?.toLowerCase() || '';
      const isPilatesMembership = packageType === 'pilates' || packageName === 'pilates';

      // Only deactivate if it's a pure Pilates membership (not Ultimate) AND no valid deposit
      return isPilatesMembership && !hasValidDeposit;
    });

    if (pilatesMembershipsToDeactivate.length > 0) {
      const membershipIds = pilatesMembershipsToDeactivate.map(m => m.id);

      console.log('[MembershipAPI] Deactivating Pilates memberships due to zero deposit:', membershipIds);

      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          is_active: false,
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', membershipIds);

      if (updateError) {
        console.error('[MembershipAPI] Error deactivating Pilates memberships:', updateError);
      } else {
        console.log('[MembershipAPI] Successfully deactivated Pilates memberships:', membershipIds);
      }
    }
  } catch (error) {
    console.error('[MembershipAPI] Exception in updatePilatesMembershipStatus:', error);
  }
};

export const getUserActiveMemberships = async (userId: string): Promise<Membership[]> => {
  try {
    console.log('[MembershipAPI] ===== FETCHING USER ACTIVE MEMBERSHIPS =====');
    console.log('[MembershipAPI] User ID:', userId);

    // Update Pilates membership status based on deposit availability
    await updatePilatesMembershipStatus(userId);
    
    // Get current date in YYYY-MM-DD format for comparison
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('[MembershipAPI] Current date for filtering:', currentDate);
    
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
      .gte('end_date', currentDate) // Only non-expired memberships
      .order('end_date', { ascending: false });

    console.log('[MembershipAPI] Query result - data:', data, 'error:', error);
    
    if (error) throw error;
    
    // Additional client-side filtering to ensure no expired memberships slip through
    // AND check Pilates deposits for Pilates memberships
    const filteredData = [];
    for (const membership of (data || [])) {
      const membershipEndDate = new Date(membership.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      const isNotExpired = membershipEndDate >= today;

      if (!isNotExpired) {
        console.log('[MembershipAPI] Filtering out expired membership:', {
          id: membership.id,
          end_date: membership.end_date,
          package_name: membership.package?.name
        });
        continue;
      }

      // Special check for Pilates memberships: must have deposit_remaining > 0
      const packageName = membership.package?.name?.toLowerCase() || '';
      const packageType = membership.package?.package_type?.toLowerCase() || '';

      const isPilatesMembership = packageType === 'pilates' || packageName === 'pilates';

      if (isPilatesMembership) {
        try {
          const { data: pilatesDeposit, error: depositError } = await supabase
            .from('pilates_deposits')
            .select('deposit_remaining, is_active')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('credited_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (depositError) {
            console.warn('[MembershipAPI] Error fetching Pilates deposit for membership check:', depositError);
            // If error, don't include this membership to be safe
            continue;
          }

          // If Pilates membership but deposit = 0 or doesn't exist, exclude from active memberships
          if (!pilatesDeposit || !pilatesDeposit.deposit_remaining || pilatesDeposit.deposit_remaining <= 0) {
            console.log('[MembershipAPI] Filtering out Pilates membership with zero deposit:', {
              id: membership.id,
              package_name: membership.package?.name,
              deposit_remaining: pilatesDeposit?.deposit_remaining || 0
            });
            continue;
          }
        } catch (depositCheckError) {
          console.warn('[MembershipAPI] Exception checking Pilates deposit:', depositCheckError);
          // If exception, don't include this membership to be safe
          continue;
        }
      }

      filteredData.push(membership);
    }
    
    // Transform data to match Membership interface
    const transformedData = filteredData.map(membership => ({
      ...membership,
      status: membership.status || 'active',
      duration_type: membership.duration_type || 'month', // Default fallback
      approved_by: membership.approved_by || null,
      approved_at: membership.approved_at || membership.created_at
    }));
    
    console.log('[MembershipAPI] Returning active memberships (after filtering):', transformedData);
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

    const currentDate = new Date().toISOString().split('T')[0];
    console.log('[MembershipAPI] Checking active membership for user:', userId, 'package:', packageId, 'current date:', currentDate);

    const { data, error } = await supabase
      .from('memberships')
      .select('id, end_date')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gte('end_date', currentDate) // Not expired
      .limit(1);

    if (error) throw error;
    
    const hasActiveMembership = data && data.length > 0;
    console.log('[MembershipAPI] Has active membership result:', hasActiveMembership, 'data:', data);
    
    return hasActiveMembership;
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
    'ultimate_1year': '1 Έτος Ultimate (3/εβδ)',
    'ultimate_medium_1year': '1 Έτος Ultimate Medium (1/εβδ)'
  };
  return labels[durationType as keyof typeof labels] || durationType;
};

export const getDurationDays = (durationType: string): number => {
  const days = {
    'year': 365,
    'semester': 180,
    '3 Μήνες': 90, // New 3-month option for Free Gym (Greek)
    'month': 30,
    'lesson': 7, // Changed from 1 to 7 days for Free Gym lesson option
    'pilates_trial': 7, // Changed from 1 to 7 days for Pilates trial option
    'pilates_1month': 30,
    'pilates_2months': 60,
    'pilates_3months': 90,
    'pilates_6months': 180,
    'pilates_1year': 365,
    'ultimate_1year': 365,
    'ultimate_medium_1year': 365
  };
  return days[durationType as keyof typeof days] || 1;
};

export const calculateEndDate = (startDate: string, durationDays: number): string => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return end.toISOString().split('T')[0];
};

export const getDurationDisplayText = (durationType: string, durationDays: number): string => {
  // Special cases for the updated duration types
  if (durationType === 'lesson' && durationDays === 7) {
    return '1 εβδομάδα';
  }
  if (durationType === 'pilates_trial' && durationDays === 7) {
    return '1 εβδομάδα';
  }
  if (durationType === '3 Μήνες' && durationDays === 90) {
    return 'Τρίμηνο';
  }
  
  // Default display for other cases
  if (durationDays === 1) {
    return '1 ημέρα';
  } else if (durationDays === 7) {
    return '1 εβδομάδα';
  } else if (durationDays === 30) {
    return '1 μήνας';
  } else if (durationDays === 90) {
    return '3 μήνες';
  } else if (durationDays === 180) {
    return '6 μήνες';
  } else if (durationDays === 365) {
    return '1 έτος';
  } else {
    return `${durationDays} ημέρες`;
  }
};

// Get smart duration label that shows actual days if custom, otherwise default label
export const getSmartDurationLabel = (durationType: string, startDate?: string, endDate?: string): string => {
  // If we don't have dates, return the default label
  if (!startDate || !endDate) {
    return getDurationLabel(durationType);
  }

  // Calculate actual duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const actualDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Get the expected default duration for this duration type
  const defaultDays = getDurationDays(durationType);

  // If actual days differ significantly from default (more than 3 days difference), show actual days
  if (Math.abs(actualDays - defaultDays) > 3) {
    // It's a custom duration - show the actual days
    return `${actualDays} ημέρες`;
  }

  // Otherwise return the standard label
  return getDurationLabel(durationType);
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
  userId?: string,
  hasInstallments: boolean = false,
  paymentMethod: 'cash' | 'pos' = 'cash',
  kettlebellPoints?: number,
  installments?: InstallmentInput,
  customDurationDays?: number
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
    const insertData: any = {
      user_id: actualUserId,
      package_id: actualPackageId,
      duration_type: durationType,
      requested_price: requestedPrice,
      classes_count: classesCount,
      status: 'approved'
    };

    if (hasInstallments) {
    Object.assign(insertData, buildInstallmentPayload(installments));
    }
    
    console.log('[MembershipAPI] Inserting membership request with data:', insertData);
    
    // Test if we can access the table at all
    console.log('[MembershipAPI] Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('membership_requests')
      .select('id')
      .limit(1);
    console.log('[MembershipAPI] Test access result:', { testData, testError });
    
    let insertResult: any = null;
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
        insertResult = retryData;
      } else {
        throw error;
      }
    } else {
      insertResult = data;
    }

    console.log('[MembershipAPI] Pilates request created successfully:', insertResult);

    // *** FIX: Calculate correct dates and create new membership instead of using ensureActiveMembership ***
    // ensureActiveMembership returns existing dates if membership exists, but for new requests we need new dates
    
    // Get duration details
    const { data: duration, error: durationError } = await supabase
      .from('membership_package_durations')
      .select('*')
      .eq('package_id', actualPackageId)
      .eq('duration_type', durationType)
      .single();

    if (durationError || !duration) {
      console.error('[MembershipAPI] Duration not found for Pilates request:', durationError);
      throw new Error('Duration not found');
    }

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration.duration_days);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Deactivate existing active Pilates memberships for this user
    const { error: deactivateError } = await supabase
      .from('memberships')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', actualUserId)
      .eq('package_id', actualPackageId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates memberships:', deactivateError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates memberships for user ${actualUserId}`);
    }

    // Deactivate existing Pilates deposits
    const { error: deactivateDepositError } = await supabase
      .from('pilates_deposits')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', actualUserId)
      .eq('is_active', true);

    if (deactivateDepositError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates deposits:', deactivateDepositError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates deposits for user ${actualUserId}`);
    }

    // Create new membership
    const { data: membershipData, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: actualUserId,
        package_id: actualPackageId,
        start_date: startDate,
        end_date: endDateStr,
        is_active: true,
        duration_type: durationType,
        approved_by: null, // Secretary created
        approved_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (membershipError) {
      console.error('[MembershipAPI] Error creating new Pilates membership:', membershipError);
      throw membershipError;
    }

    const membershipDates = { startDate, endDate: endDateStr };

    await addPilatesDeposit({
      userId: actualUserId,
      packageId: actualPackageId,
      durationType,
      classesCount,
      endDateStr: membershipDates.endDate
    });

    if (requestedPrice && !Number.isNaN(requestedPrice)) {
      await addCashTransaction({
        userId: actualUserId,
        amount: requestedPrice,
        transactionType: paymentMethod,
        notes: 'Pilates payment from secretary subscription (auto-approved)'
      });
    }

    if (kettlebellPoints && !Number.isNaN(kettlebellPoints)) {
      await addKettlebellPoints({
        userId: actualUserId,
        points: kettlebellPoints
      });
    }

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

// Function to get Ultimate membership requests with separate locking system
export const getUltimateMembershipRequests = async (): Promise<MembershipRequest[]> => {
  try {
    console.log('[MembershipAPI] Fetching Ultimate membership requests with separate locking...');
    
    // Get Ultimate and Ultimate Medium requests from the membership_requests table
    // First, get both Ultimate package IDs
    const { data: ultimatePackages, error: packageError } = await supabase
      .from('membership_packages')
      .select('id, name')
      .in('name', ['Ultimate', 'Ultimate Medium']);

    if (packageError || !ultimatePackages || ultimatePackages.length === 0) {
      console.log('[MembershipAPI] No Ultimate packages found or error:', packageError);
      return [];
    }

    const packageIds = ultimatePackages.map(pkg => pkg.id);
    console.log('[MembershipAPI] Found Ultimate package IDs:', packageIds);

    // Now get requests with these package IDs
    const { data: ultimateRequests, error: ultimateError } = await supabase
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
      .in('package_id', packageIds)
      .order('created_at', { ascending: false });

    if (ultimateError) {
      console.error('[MembershipAPI] Error fetching Ultimate requests:', ultimateError);
      throw ultimateError;
    }
    
    console.log('[MembershipAPI] Found Ultimate requests:', ultimateRequests?.length || 0);
    
    if (!ultimateRequests || ultimateRequests.length === 0) {
      return [];
    }

    // Map the data with locking information from membership_requests table
    const requestsWithLocks = ultimateRequests.map((request) => {
      return {
        ...request,
        // Ensure locked fields are properly set from the database
        installment_1_locked: request.installment_1_locked || false,
        installment_2_locked: request.installment_2_locked || false,
        installment_3_locked: request.installment_3_locked || false,
        third_installment_deleted: request.third_installment_deleted || false,
        third_installment_deleted_at: request.third_installment_deleted_at,
        third_installment_deleted_by: request.third_installment_deleted_by,
      };
    });
    
    console.log('[MembershipAPI] Returning Ultimate requests with locks:', requestsWithLocks.length);
    return requestsWithLocks;
  } catch (error) {
    console.error('[MembershipAPI] Error fetching Ultimate membership requests:', error);
    return [];
  }
};

export const createUltimateMembershipRequest = async (
  packageId: string,
  durationType: string,
  requestedPrice: number,
  hasInstallments: boolean = false,
  userId?: string,
  paymentMethod: 'cash' | 'pos' = 'cash',
  kettlebellPoints?: number,
  installments?: InstallmentInput
): Promise<boolean> => {
  try {
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser();
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

    // If packageId is not a UUID, find the actual package ID and name
    let actualPackageId = packageId;
    let actualPackageName = '';
    if (packageId === 'Ultimate' || packageId === 'ultimate-package') {
      const { data: ultimatePackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('id, name')
        .eq('name', 'Ultimate')
        .eq('is_active', true)
        .single();

      if (packageError || !ultimatePackage) {
        console.error('Error finding Ultimate package:', packageError);
        throw new Error('Ultimate package not found');
      }
      actualPackageId = ultimatePackage.id;
      actualPackageName = ultimatePackage.name || 'Ultimate';
    } else if (packageId === 'Ultimate Medium' || packageId === 'ultimate-medium-package') {
      const { data: ultimateMediumPackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('id, name')
        .eq('name', 'Ultimate Medium')
        .eq('is_active', true)
        .single();

      if (packageError || !ultimateMediumPackage) {
        console.error('Error finding Ultimate Medium package:', packageError);
        throw new Error('Ultimate Medium package not found');
      }
      actualPackageId = ultimateMediumPackage.id;
      actualPackageName = ultimateMediumPackage.name || 'Ultimate Medium';
    } else {
      const { data: pkgRow } = await supabase
        .from('membership_packages')
        .select('name')
        .eq('id', packageId)
        .single();
      actualPackageName = pkgRow?.name || '';
    }

    // Normalize duration type for Ultimate packages
    // Σημείωση: λόγω constraint στον πίνακα memberships, αποθηκεύουμε ultimate_medium ως ultimate_1year
    const normalizedDurationType =
      packageId === 'Ultimate' || packageId === 'ultimate-package'
        ? 'ultimate_1year'
        : packageId === 'Ultimate Medium' || packageId === 'ultimate-medium-package'
        ? 'ultimate_1year'
        : durationType;
    const isUltimateMedium = actualPackageName.toLowerCase().includes('ultimate medium');

    // Prepare the insert data
    const insertData: any = {
      user_id: actualUserId,
      package_id: actualPackageId,
      duration_type: normalizedDurationType,
      requested_price: requestedPrice,
      has_installments: hasInstallments,
      status: 'approved'
    };

    if (hasInstallments) {
    Object.assign(insertData, buildInstallmentPayload(installments));
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
    
    // *** FIX: Use RPC to create dual memberships instead of ensureActiveMembership ***
    // This ensures proper deactivation of old memberships and creation of new ones
    
    // Deactivate existing active memberships for Pilates and Free Gym packages
    const { error: deactivatePilatesError } = await supabase
      .from('memberships')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', actualUserId)
      .eq('is_active', true)
      .in('package_id', (
        await supabase
          .from('membership_packages')
          .select('id')
          .in('name', ['Pilates', 'Free Gym'])
      ).data?.map(p => p.id) || []);

    if (deactivatePilatesError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates/Free Gym memberships:', deactivatePilatesError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates/Free Gym memberships for user ${actualUserId}`);
    }

    // Deactivate existing Pilates deposits
    const { error: deactivateDepositError } = await supabase
      .from('pilates_deposits')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', actualUserId)
      .eq('is_active', true);

    if (deactivateDepositError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates deposits:', deactivateDepositError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates deposits for user ${actualUserId}`);
    }

    // Call the database function to create dual memberships
    const { data: dualResult, error: dualError } = await supabase
      .rpc('create_ultimate_dual_memberships', {
        p_user_id: actualUserId,
        p_ultimate_request_id: data.id,
        p_duration_days: 365, // 1 year
        p_start_date: new Date().toISOString().split('T')[0] // Today's date
      });

    if (dualError) {
      console.error('[MembershipAPI] Error creating dual memberships:', dualError);
      throw dualError;
    }

    // Check if the dual activation was successful
    if (!dualResult || !dualResult.success) {
      console.error('[MembershipAPI] Dual activation failed:', dualResult);
      throw new Error(dualResult?.error || 'Failed to create dual memberships');
    }

    console.log('[MembershipAPI] Ultimate dual activation successful:', {
      requestId: data.id,
      userId: actualUserId,
      pilatesMembershipId: dualResult.pilates_membership_id,
      freeGymMembershipId: dualResult.free_gym_membership_id,
      startDate: dualResult.start_date,
      endDate: dualResult.end_date
    });

    // Update memberships to reflect Ultimate duration
    const startDate = dualResult.start_date || new Date().toISOString().split('T')[0];
    const endDate = dualResult.end_date || calculateEndDate(startDate, 365);
    const durationTypeForPackage = 'ultimate_1year';

    if (dualResult.pilates_membership_id) {
      await supabase
        .from('memberships')
        .update({
          start_date: startDate,
          end_date: endDate,
          duration_type: durationTypeForPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dualResult.pilates_membership_id);
    }

    if (dualResult.free_gym_membership_id) {
      await supabase
        .from('memberships')
        .update({
          start_date: startDate,
          end_date: endDate,
          duration_type: durationTypeForPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dualResult.free_gym_membership_id);
    }

    const membershipDates = { startDate, endDate };

    if (requestedPrice && !Number.isNaN(requestedPrice)) {
      await addCashTransaction({
        userId: actualUserId,
        amount: requestedPrice,
        transactionType: paymentMethod,
        notes: 'Ultimate payment from secretary subscription (auto-approved)'
      });
    }

    if (kettlebellPoints && !Number.isNaN(kettlebellPoints)) {
      await addKettlebellPoints({
        userId: actualUserId,
        points: kettlebellPoints
      });
    }

    // ==== Ensure Pilates deposit is credited (3 for Ultimate, 1 for Ultimate Medium) ====
    try {
      // Find Pilates package id
      const { data: pilatesPkg, error: pilatesPkgErr } = await supabase
        .from('membership_packages')
        .select('id')
        .eq('name', 'Pilates')
        .eq('is_active', true)
        .single();

      if (pilatesPkgErr || !pilatesPkg) {
        console.error('[Ultimate] Pilates package not found for deposit in createUltimateMembershipRequest:', pilatesPkgErr);
      } else {
        const initialDeposit = isUltimateMedium ? 1 : 3;

        // Deactivate all previous deposits for this user
        await supabase
          .from('pilates_deposits')
          .update({ is_active: false })
          .eq('user_id', actualUserId);

        // Compute expires_at
        const endDate = membershipDates?.endDate || calculateEndDate(new Date().toISOString().split('T')[0], getDurationDays(normalizedDurationType));
        const expiresIso = new Date(endDate + 'T23:59:59Z').toISOString();

        const { data: authUser } = await supabase.auth.getUser();
        const createdBy = authUser?.user?.id || '00000000-0000-0000-0000-000000000001';

        const { error: rpcError } = await supabase.rpc('credit_pilates_deposit', {
          p_created_by: createdBy,
          p_user_id: actualUserId,
          p_package_id: pilatesPkg.id,
          p_deposit_remaining: initialDeposit,
          p_expires_at: expiresIso
        });

        if (rpcError) {
          console.error('[Ultimate] RPC credit_pilates_deposit failed (createUltimateMembershipRequest):', rpcError);
        }
      }
    } catch (depErr) {
      console.error('[Ultimate] Error handling Pilates deposit (createUltimateMembershipRequest):', depErr);
    }
    
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
      .in('membership_packages.name', ['Ultimate', 'Ultimate Medium'])
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

    // Verify this is an Ultimate or Ultimate Medium package
    if (!['Ultimate', 'Ultimate Medium'].includes(requestData.membership_packages?.name)) {
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

    // *** FIX: Deactivate existing active memberships for Pilates and Free Gym packages ***
    // This ensures that when a user gets Ultimate membership, old Pilates/Free Gym memberships are deactivated
    const { error: deactivatePilatesError } = await supabase
      .from('memberships')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', requestData.user_id)
      .eq('is_active', true)
      .in('package_id', (
        await supabase
          .from('membership_packages')
          .select('id')
          .in('name', ['Pilates', 'Free Gym'])
      ).data?.map(p => p.id) || []);

    if (deactivatePilatesError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates/Free Gym memberships:', deactivatePilatesError);
      // Don't fail the approval for this, but log the issue
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates/Free Gym memberships for user ${requestData.user_id}`);
    }

    // Also deactivate existing Pilates deposits
    const { error: deactivateDepositError } = await supabase
      .from('pilates_deposits')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', requestData.user_id)
      .eq('is_active', true);

    if (deactivateDepositError) {
      console.error('[MembershipAPI] Error deactivating existing Pilates deposits:', deactivateDepositError);
    } else {
      console.log(`[MembershipAPI] Deactivated existing active Pilates deposits for user ${requestData.user_id}`);
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

    // Validate membership completeness (legacy prevention)
    if (dualResult.pilates_membership_id) {
      const pilatesValidation = await validateMembershipCompleteness(requestData.user_id, dualResult.pilates_membership_id);
      if (!pilatesValidation.isComplete) {
        console.error('[MembershipAPI] Pilates membership validation failed:', pilatesValidation);
        console.warn('[MembershipAPI] Pilates membership created but incomplete. Missing:', pilatesValidation.missingComponents);
      }
    }

    if (dualResult.free_gym_membership_id) {
      const freeGymValidation = await validateMembershipCompleteness(requestData.user_id, dualResult.free_gym_membership_id);
      if (!freeGymValidation.isComplete) {
        console.error('[MembershipAPI] Free Gym membership validation failed:', freeGymValidation);
        console.warn('[MembershipAPI] Free Gym membership created but incomplete. Missing:', freeGymValidation.missingComponents);
      }
    }

    // --- Normalize memberships to 1-year Ultimate duration & weekly refill preset ---
    const startDate = dualResult.start_date || new Date().toISOString().split('T')[0];
    const endDate = dualResult.end_date || calculateEndDate(startDate, 365);

    // Update Pilates membership to reflect Ultimate 1-year duration
    // Για αποφυγή constraint στο memberships, αποθηκεύουμε και για Medium το ultimate_1year
    const durationTypeForPackage = 'ultimate_1year';

    // Update Pilates membership to reflect Ultimate duration
    if (dualResult.pilates_membership_id) {
      await supabase
        .from('memberships')
        .update({
          start_date: startDate,
          end_date: endDate,
          duration_type: durationTypeForPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dualResult.pilates_membership_id);
    }

    // Update Free Gym membership to reflect Ultimate duration
    if (dualResult.free_gym_membership_id) {
      await supabase
        .from('memberships')
        .update({
          start_date: startDate,
          end_date: endDate,
          duration_type: durationTypeForPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', dualResult.free_gym_membership_id);
    }

    // Helper to compute the current weekly window (Δευτέρα–Σάββατο)
    const computeWeekWindow = () => {
      const today = new Date();
      const day = today.getDay(); // 0 Κυριακή, 1 Δευτέρα, ... 6 Σάββατο
      let weekStart: Date;
      if (day === 0) {
        weekStart = new Date(today);
        weekStart.setDate(today.getDate() + 1); // επόμενη Δευτέρα
      } else {
        weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (day - 1));
      }
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5); // Σάββατο
      weekEnd.setHours(23, 59, 59, 999);
      return { weekStart, weekEnd };
    };

    // Reset weekly refill preset for Ultimate users (target 3 lessons/week, max 3)
    const { weekEnd } = computeWeekWindow();
    const nextRefillDate = weekEnd.toISOString().split('T')[0];

    // Clean existing refill presets for this user
    await supabase.from('ultimate_weekly_refills').delete().eq('user_id', requestData.user_id);

    const initialDeposit = requestData.membership_packages?.name === 'Ultimate Medium' ? 1 : 3;

    // Always credit deposit under Pilates package so calendar reads correctly
    const { data: pilatesPkg, error: pilatesPkgErr } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', 'Pilates')
      .eq('is_active', true)
      .single();
    if (pilatesPkgErr || !pilatesPkg) {
      console.error('[Ultimate] Pilates package not found for deposit:', pilatesPkgErr);
      throw pilatesPkgErr || new Error('Pilates package missing');
    }

    // Manual upsert to ensure active Pilates deposit (bypass RPC uncertainty)
    const expiresIso = new Date(endDate + 'T23:59:59Z').toISOString();

    // Deactivate ALL previous deposits for this user (any package) to avoid stale Ultimate package deposits
    await supabase
      .from('pilates_deposits')
      .update({ is_active: false })
      .eq('user_id', requestData.user_id);

    const { data: depositCreated, error: depositErr } = await supabase
      .from('pilates_deposits')
      .insert({
        user_id: requestData.user_id,
        package_id: pilatesPkg.id,
        deposit_remaining: initialDeposit,
        expires_at: expiresIso,
        is_active: true,
        created_by: null
      })
      .select('id')
      .single();

    if (depositErr) {
      console.error('[Ultimate] manual insert pilates_deposits failed:', depositErr);
      throw depositErr;
    }

    const pilatesDepositId = depositCreated?.id || null;

    await supabase.from('ultimate_weekly_refills').insert({
      user_id: requestData.user_id,
      membership_id: dualResult.pilates_membership_id || dualResult.free_gym_membership_id,
      source_request_id: requestId,
      package_name: requestData.membership_packages?.name || 'Ultimate',
      activation_date: startDate,
      refill_date: nextRefillDate,
      refill_week_number: 1,
      target_deposit_amount: initialDeposit,
      previous_deposit_amount: 0,
      new_deposit_amount: initialDeposit,
      pilates_deposit_id: pilatesDepositId
    });

    return true;

  } catch (error) {
    console.error('[MembershipAPI] Error approving Ultimate membership request:', error);
    toast.error('Σφάλμα κατά την έγκριση του Ultimate αιτήματος');
    return false;
  }
};

// ===== LEGACY PREVENTION GUARDS =====

/**
 * Validates that a newly created membership has all required components
 * This prevents legacy-style incomplete memberships
 */
export const validateMembershipCompleteness = async (userId: string, membershipId: string): Promise<{
  isComplete: boolean;
  missingComponents: string[];
  recommendations: string[];
}> => {
  const result = {
    isComplete: true,
    missingComponents: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // Get membership details
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        package_id,
        membership_packages!inner(name)
      `)
      .eq('id', membershipId)
      .single();

    if (membershipError) throw membershipError;

    const packageName = membership.membership_packages?.name;

    // Check for membership_request
    const { data: requests, error: requestError } = await supabase
      .from('membership_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', membership.package_id)
      .limit(1);

    if (requestError || !requests || requests.length === 0) {
      result.isComplete = false;
      result.missingComponents.push('membership_request');
      result.recommendations.push('Create a membership_request record for audit trail');
    }

    // Check for deposits if Pilates/Ultimate
    if (packageName?.toLowerCase().includes('pilates') ||
        packageName?.toLowerCase().includes('ultimate')) {

      const { data: deposits, error: depositError } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (depositError || !deposits || deposits.length === 0) {
        result.isComplete = false;
        result.missingComponents.push('pilates_deposit');
        result.recommendations.push('Initialize pilates_deposits for this membership');
      }
    }

  } catch (error) {
    console.error('[MembershipAPI] Error validating membership completeness:', error);
    result.isComplete = false;
    result.missingComponents.push('validation_error');
    result.recommendations.push('Manual review required due to validation error');
  }

  return result;
};

export const createPersonalTrainingSubscription = async ({
  userId,
  price,
  classes,
  kettlebellPoints,
  paymentMethod
}: {
  userId: string;
  price: number;
  classes: number;
  kettlebellPoints?: number;
  paymentMethod: 'cash' | 'pos';
}): Promise<boolean> => {
  try {
    console.log('[MembershipAPI] Creating Personal Training subscription:', {
      userId,
      price,
      classes,
      kettlebellPoints,
      paymentMethod
    });

    // 1. Add cash/pos transaction for payment
    if (price && !Number.isNaN(price) && price > 0) {
      const { data: authUser } = await supabase.auth.getUser();
      const createdBy = authUser?.user?.id || '00000000-0000-0000-0000-000000000001';
      
      const { error: cashError } = await supabase.from('user_cash_transactions').insert({
        user_id: userId,
        amount: price.toFixed(2),
        transaction_type: paymentMethod,
        program_id: null,
        notes: `Personal Training - ${classes} μαθήματα`,
        created_by: createdBy
      });
      
      if (cashError) {
        console.error('[MembershipAPI] Error inserting PT cash transaction:', cashError);
        throw cashError;
      }
    }

    // 2. Add kettlebell points if provided
    if (kettlebellPoints && !Number.isNaN(kettlebellPoints) && kettlebellPoints > 0) {
      const { data: authUser } = await supabase.auth.getUser();
      const createdBy = authUser?.user?.id || null;
      
      const { error: kbError } = await supabase.from('user_kettlebell_points').insert({
        user_id: userId,
        points: kettlebellPoints,
        program_id: null,
        created_by: createdBy
      });
      
      if (kbError) {
        console.error('[MembershipAPI] Error inserting kettlebell points for PT:', kbError);
        throw kbError;
      }
    }

    toast.success(`Personal Training καταχωρήθηκε: ${classes} μαθήματα για €${price.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('[MembershipAPI] Error creating Personal Training subscription:', error);
    toast.error('Σφάλμα κατά την καταχώρηση Personal Training');
    return false;
  }
};