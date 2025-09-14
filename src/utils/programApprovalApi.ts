import { supabase } from '@/config/supabase';

export interface ProgramApprovalState {
  id: string;
  user_id: string;
  program_id?: string;
  approval_status: 'approved' | 'rejected' | 'pending';
  old_members_used: boolean;
  kettlebell_points: number;
  cash_amount: number;
  pos_amount: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  notes?: string;
}

export interface ProgramApprovalSummary {
  user_id: string;
  approval_status: 'approved' | 'rejected' | 'pending';
  total_approvals: number;
  old_members_count: number;
  total_kettlebell_points: number;
  total_cash_amount: number;
  total_pos_amount: number;
  last_approval_date: string;
}

// Save program approval state
export const saveProgramApprovalState = async (
  userId: string,
  approvalStatus: 'approved' | 'rejected' | 'pending',
  options: {
    oldMembersUsed?: boolean;
    kettlebellPoints?: number;
    cashAmount?: number;
    posAmount?: number;
    programId?: string;
    createdBy: string;
    notes?: string;
    // Group room information
    groupRoomSize?: number | null;
    weeklyFrequency?: number | null;
    monthlyTotal?: number | null;
  }
): Promise<boolean> => {
  try {
    console.log('[saveProgramApprovalState] Saving approval state:', {
      userId, approvalStatus, options
    });

    const { data, error } = await supabase
      .from('program_approval_states')
      .insert({
        user_id: userId,
        program_id: options.programId,
        approval_status: approvalStatus,
        old_members_used: options.oldMembersUsed || false,
        kettlebell_points: options.kettlebellPoints || 0,
        cash_amount: options.cashAmount || 0,
        pos_amount: options.posAmount || 0,
        created_by: options.createdBy,
        notes: options.notes,
        // Group room information
        group_room_size: options.groupRoomSize,
        weekly_frequency: options.weeklyFrequency,
        monthly_total: options.monthlyTotal
      })
      .select()
      .single();

    if (error) {
      console.error('[saveProgramApprovalState] Error saving approval state:', error);
      return false;
    }

    console.log('[saveProgramApprovalState] Approval state saved successfully:', data);
    return true;
  } catch (error) {
    console.error('[saveProgramApprovalState] Exception saving approval state:', error);
    return false;
  }
};

// Get program approval states for a user
export const getUserProgramApprovalStates = async (userId: string): Promise<ProgramApprovalState[]> => {
  try {
    const { data, error } = await supabase
      .from('program_approval_states')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserProgramApprovalStates] Error getting approval states:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getUserProgramApprovalStates] Exception getting approval states:', error);
    return [];
  }
};

// Get program approval summary
export const getProgramApprovalSummary = async (): Promise<ProgramApprovalSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('program_approval_summary')
      .select('*')
      .order('last_approval_date', { ascending: false });

    if (error) {
      console.error('[getProgramApprovalSummary] Error getting approval summary:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getProgramApprovalSummary] Exception getting approval summary:', error);
    return [];
  }
};

// Update program approval state
export const updateProgramApprovalState = async (
  approvalId: string,
  updates: {
    approval_status?: 'approved' | 'rejected' | 'pending';
    old_members_used?: boolean;
    kettlebell_points?: number;
    cash_amount?: number;
    pos_amount?: number;
    notes?: string;
  }
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('program_approval_states')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('[updateProgramApprovalState] Error updating approval state:', error);
      return false;
    }

    console.log('[updateProgramApprovalState] Approval state updated successfully:', data);
    return true;
  } catch (error) {
    console.error('[updateProgramApprovalState] Exception updating approval state:', error);
    return false;
  }
};

// Delete program approval state
export const deleteProgramApprovalState = async (approvalId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('program_approval_states')
      .delete()
      .eq('id', approvalId);

    if (error) {
      console.error('[deleteProgramApprovalState] Error deleting approval state:', error);
      return false;
    }

    console.log('[deleteProgramApprovalState] Approval state deleted successfully');
    return true;
  } catch (error) {
    console.error('[deleteProgramApprovalState] Exception deleting approval state:', error);
    return false;
  }
};
