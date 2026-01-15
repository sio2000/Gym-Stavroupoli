import { supabase } from '@/config/supabase';

// Temporary solution for secretary to save program options
// This uses admin-level functions until RLS policies are fixed

export const saveSecretaryCashTransaction = async (
  userId: string,
  amount: number,
  transactionType: 'cash' | 'pos',
  programId?: string,
  createdBy: string = '',
  notes?: string
): Promise<boolean> => {
  try {
    console.log('[saveSecretaryCashTransaction] Saving transaction via admin function:', {
      userId, amount, transactionType, programId, createdBy, notes
    });

    // Use the admin function to bypass RLS
    const { data, error } = await supabase.rpc('admin_save_cash_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: transactionType,
      p_program_id: programId,
      p_created_by: createdBy,
      p_notes: notes
    });

    if (error) {
      console.error('[saveSecretaryCashTransaction] Error saving transaction via admin function:', error);
      
      // Fallback: try direct insert with service role
      console.log('[saveSecretaryCashTransaction] Trying direct insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('user_cash_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          transaction_type: transactionType,
          program_id: programId,
          created_by: createdBy,
          notes: notes
        });

      if (insertError) {
        console.error('[saveSecretaryCashTransaction] Direct insert also failed:', insertError);
        return false;
      }

      console.log('[saveSecretaryCashTransaction] Direct insert successful:', insertData);
      return true;
    }

    console.log('[saveSecretaryCashTransaction] Transaction saved via admin function:', data);
    return true;
  } catch (error) {
    console.error('[saveSecretaryCashTransaction] Exception saving transaction:', error);
    return false;
  }
};

export const saveSecretaryKettlebellPoints = async (
  userId: string,
  points: number,
  programId?: string,
  createdBy: string = ''
): Promise<boolean> => {
  try {
    // Ensure createdBy is not empty - get current user if not provided
    let validCreatedBy = createdBy;
    if (!validCreatedBy || validCreatedBy.trim() === '') {
      const { data: authUser } = await supabase.auth.getUser();
      validCreatedBy = authUser?.user?.id || '';
    }
    
    if (!validCreatedBy) {
      console.error('[saveSecretaryKettlebellPoints] No valid createdBy ID found');
      return false;
    }
    
    // Convert points to integer (database field is integer, not decimal)
    const integerPoints = Math.round(points);
    
    console.log('[saveSecretaryKettlebellPoints] Saving kettlebell points via admin function:', {
      userId, points: integerPoints, programId, createdBy: validCreatedBy
    });

    // Use the admin function to bypass RLS
    const { data, error } = await supabase.rpc('admin_save_kettlebell_points', {
      p_user_id: userId,
      p_points: integerPoints,
      p_program_id: programId,
      p_created_by: validCreatedBy
    });

    if (error) {
      console.error('[saveSecretaryKettlebellPoints] Error saving via admin function:', error);
      
      // Fallback: try direct insert
      console.log('[saveSecretaryKettlebellPoints] Trying direct insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('user_kettlebell_points')
        .insert({
          user_id: userId,
          points: integerPoints,
          program_id: programId,
          created_by: validCreatedBy
        });

      if (insertError) {
        console.error('[saveSecretaryKettlebellPoints] Direct insert also failed:', insertError);
        return false;
      }

      console.log('[saveSecretaryKettlebellPoints] Direct insert successful:', insertData);
      return true;
    }

    console.log('[saveSecretaryKettlebellPoints] Points saved via admin function:', data);
    return true;
  } catch (error) {
    console.error('[saveSecretaryKettlebellPoints] Exception saving points:', error);
    return false;
  }
};

export const saveSecretaryOldMembersUsage = async (
  userId: string,
  createdBy: string = ''
): Promise<boolean> => {
  try {
    console.log('[saveSecretaryOldMembersUsage] Marking old members as used via admin function:', {
      userId, createdBy
    });

    // Use the admin function to bypass RLS
    const { data, error } = await supabase.rpc('admin_mark_old_members_used', {
      p_user_id: userId,
      p_created_by: createdBy
    });

    if (error) {
      console.error('[saveSecretaryOldMembersUsage] Error marking via admin function:', error);
      
      // Fallback: try direct insert
      console.log('[saveSecretaryOldMembersUsage] Trying direct insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('old_members_usage')
        .insert({
          user_id: userId,
          used_by: createdBy,
          used_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[saveSecretaryOldMembersUsage] Direct insert also failed:', insertError);
        return false;
      }

      console.log('[saveSecretaryOldMembersUsage] Direct insert successful:', insertData);
      return true;
    }

    console.log('[saveSecretaryOldMembersUsage] Old members marked via admin function:', data);
    return true;
  } catch (error) {
    console.error('[saveSecretaryOldMembersUsage] Exception marking old members:', error);
    return false;
  }
};
