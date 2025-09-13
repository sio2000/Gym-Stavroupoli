import { supabase } from '@/config/supabase';

export interface TrainerUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo?: string;
  next_session_date: string;
  next_session_time: string;
  next_session_type: string;
  next_session_room: string;
  total_sessions: number;
}

export interface UserAbsence {
  id: string;
  user_id: string;
  trainer_name: string;
  session_id: string;
  session_date: string;
  session_time: string;
  absence_type: 'absent' | 'late' | 'excused';
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Get users assigned to a specific trainer
export const getTrainerUsers = async (trainerName: string): Promise<TrainerUser[]> => {
  try {
    console.log(`[AbsenceAPI] Getting users for trainer: ${trainerName}`);
    
    const { data, error } = await supabase.rpc('get_trainer_users', {
      trainer_name_param: trainerName
    });
    
    if (error) {
      console.error('[AbsenceAPI] Error getting trainer users:', error);
      throw error;
    }
    
    console.log(`[AbsenceAPI] Found ${data?.length || 0} users for trainer ${trainerName}`);
    return data || [];
  } catch (error) {
    console.error('[AbsenceAPI] Exception getting trainer users:', error);
    throw error;
  }
};

// Get absences for a specific user
export const getUserAbsences = async (userId: string, trainerName: string): Promise<UserAbsence[]> => {
  try {
    console.log(`[AbsenceAPI] Getting absences for user: ${userId}, trainer: ${trainerName}`);
    
    const { data, error } = await supabase.rpc('get_user_absences', {
      user_id_param: userId,
      trainer_name_param: trainerName
    });
    
    if (error) {
      console.error('[AbsenceAPI] Error getting user absences:', error);
      throw error;
    }
    
    console.log(`[AbsenceAPI] Found ${data?.length || 0} absences for user ${userId}`);
    return data || [];
  } catch (error) {
    console.error('[AbsenceAPI] Exception getting user absences:', error);
    throw error;
  }
};

// Add new absence
export const addAbsence = async (
  userId: string,
  trainerName: string,
  sessionId: string,
  sessionDate: string,
  sessionTime: string,
  absenceType: 'absent' | 'late' | 'excused',
  reason?: string,
  notes?: string
): Promise<void> => {
  try {
    console.log(`[AbsenceAPI] Adding absence for user: ${userId}, trainer: ${trainerName}`);
    
    const { error } = await supabase.rpc('add_absence', {
      user_id_param: userId,
      trainer_name_param: trainerName,
      session_id_param: sessionId,
      session_date_param: sessionDate,
      session_time_param: sessionTime,
      absence_type_param: absenceType,
      reason_param: reason || null,
      notes_param: notes || null
    });
    
    if (error) {
      console.error('[AbsenceAPI] Error adding absence:', error);
      throw error;
    }
    
    console.log('[AbsenceAPI] Absence added successfully');
  } catch (error) {
    console.error('[AbsenceAPI] Exception adding absence:', error);
    throw error;
  }
};

// Update existing absence
export const updateAbsence = async (
  absenceId: string,
  absenceType: 'absent' | 'late' | 'excused',
  reason?: string,
  notes?: string
): Promise<void> => {
  try {
    console.log(`[AbsenceAPI] Updating absence: ${absenceId}`);
    
    const { error } = await supabase.rpc('update_absence', {
      absence_id_param: absenceId,
      absence_type_param: absenceType,
      reason_param: reason || null,
      notes_param: notes || null
    });
    
    if (error) {
      console.error('[AbsenceAPI] Error updating absence:', error);
      throw error;
    }
    
    console.log('[AbsenceAPI] Absence updated successfully');
  } catch (error) {
    console.error('[AbsenceAPI] Exception updating absence:', error);
    throw error;
  }
};

// Delete absence
export const deleteAbsence = async (absenceId: string): Promise<void> => {
  try {
    console.log(`[AbsenceAPI] Deleting absence: ${absenceId}`);
    
    const { error } = await supabase.rpc('delete_absence', {
      absence_id_param: absenceId
    });
    
    if (error) {
      console.error('[AbsenceAPI] Error deleting absence:', error);
      throw error;
    }
    
    console.log('[AbsenceAPI] Absence deleted successfully');
  } catch (error) {
    console.error('[AbsenceAPI] Exception deleting absence:', error);
    throw error;
  }
};