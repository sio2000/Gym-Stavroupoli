import { supabase } from '@/config/supabase';
import { saveSecretaryKettlebellPoints } from '@/utils/secretaryProgramOptionsApi';
import { saveCashTransaction } from '@/utils/cashRegisterApi';

// Helper: format date YYYY-MM-DD (local timezone to avoid UTC conversion issues)
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface ExpiredPersonalUser {
  userId: string;
  userName: string;
  userEmail?: string | null;
  userPhone?: string | null;
  scheduleId: string;
  lastSessionDate: string;
  lastSessionTime?: string;
  totalSessions: number;
  trainingType: string;
}

/**
 * Fetch all personal training users whose last session date is before today
 */
export const fetchExpiredPersonalUsers = async (): Promise<ExpiredPersonalUser[]> => {
  try {
    const today = formatDateLocal(new Date());
    
    // Fetch all personal training schedules with user_type = 'personal'
    const { data: schedules, error: schedulesError } = await supabase
      .from('personal_training_schedules')
      .select(`
        id,
        user_id,
        schedule_data,
        training_type,
        user_type,
        status
      `)
      .eq('user_type', 'personal')
      .eq('status', 'accepted');

    if (schedulesError) {
      console.error('[ExpiredPersonalAPI] Error fetching personal training schedules:', schedulesError);
      return [];
    }

    if (!schedules || schedules.length === 0) {
      return [];
    }

    // Extract user IDs
    const userIds = [...new Set(schedules.map(s => s.user_id))];

    // Fetch user profiles
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, phone')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('[ExpiredPersonalAPI] Error fetching user profiles:', profilesError);
      return [];
    }

    // Create user profile map
    const userProfileMap = new Map();
    userProfiles?.forEach(profile => {
      userProfileMap.set(profile.user_id, profile);
    });

    const expiredUsers: ExpiredPersonalUser[] = [];

    // Process each schedule (use for..of so we can await inside the loop)
    for (const schedule of schedules) {
      if (!schedule.schedule_data) {
        continue;
      }

      const scheduleData = schedule.schedule_data;
      let sessions = [];

      // Handle both array format and object format with sessions property
      if (Array.isArray(scheduleData)) {
        sessions = scheduleData;
      } else if (scheduleData && typeof scheduleData === 'object' && scheduleData.sessions) {
        sessions = scheduleData.sessions;
      } else {
        continue;
      }

      if (!Array.isArray(sessions) || sessions.length === 0) {
        continue;
      }

      // Find last UNPAID session date
      let lastUnpaidSessionDate = '';
      let lastUnpaidSessionTime = '';
      let hasUnpaidSessions = false;
      
      sessions.forEach((session: any) => {
        // Only consider sessions that are NOT marked as paid
        if (session.date && !session.paid) {
          hasUnpaidSessions = true;
          if (!lastUnpaidSessionDate || session.date > lastUnpaidSessionDate) {
            lastUnpaidSessionDate = session.date;
            lastUnpaidSessionTime = session.startTime || '';
          }
        }
      });

      // Only show user if they have unpaid sessions and the last unpaid session is before today
      if (hasUnpaidSessions && lastUnpaidSessionDate && lastUnpaidSessionDate < today) {
        const userProfile = userProfileMap.get(schedule.user_id);
        const userName = userProfile 
          ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() 
          : 'Άγνωστος χρήστης';

        expiredUsers.push({
          userId: schedule.user_id,
          userName,
          userEmail: userProfile?.email,
          userPhone: userProfile?.phone,
          scheduleId: schedule.id,
          lastSessionDate: lastUnpaidSessionDate,
          lastSessionTime: lastUnpaidSessionTime,
          totalSessions: sessions.length,
          trainingType: schedule.training_type
        });
      }
    }

    return expiredUsers;
  } catch (err) {
    console.error('[ExpiredPersonalAPI] Error fetching expired personal users:', err);
    return [];
  }
};

export interface RecordPersonalRegistrationInput {
  userId: string;
  scheduleId: string;
  paymentMethod?: 'cash' | 'pos' | null;
  cashAmount?: number;
  posAmount?: number;
  kettlebellPoints?: number;
  note?: string;
}

/**
 * Record personal training registration/renewal payment
 * This marks that the user has paid for renewal and marks those sessions as paid
 */
export const recordPersonalRegistration = async (
  payload: RecordPersonalRegistrationInput
): Promise<{ success: boolean; message: string }> => {
  const { 
    userId, 
    scheduleId, 
    paymentMethod, 
    cashAmount, 
    posAmount, 
    kettlebellPoints, 
    note 
  } = payload;

  try {
    const totalAmount = (cashAmount || 0) + (posAmount || 0);
    const now = new Date().toISOString();

    console.log('[ExpiredPersonalAPI] Recording personal registration:', {
      userId,
      scheduleId,
      paymentMethod,
      cashAmount,
      posAmount,
      kettlebellPoints,
      note
    });

    // Step 0: Fetch the schedule to mark sessions as paid
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('personal_training_schedules')
      .select('schedule_data')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (scheduleError || !scheduleData) {
      console.error('[ExpiredPersonalAPI] Error fetching schedule data:', scheduleError);
      throw new Error('Δεν ήταν δυνατό να βρεθεί το πρόγραμμα');
    }

    // Step 1: Record cash/pos transaction using existing cash register
    if ((paymentMethod === 'cash' || paymentMethod === 'pos') && ((cashAmount && cashAmount > 0) || (posAmount && posAmount > 0))) {
      try {
        console.log('[ExpiredPersonalAPI] Recording payment via saveCashTransaction:', {
          userId,
          scheduleId,
          paymentMethod,
          cashAmount,
          posAmount
        });

        // If cash amount provided, save a cash transaction
        if (cashAmount && cashAmount > 0) {
          const ok = await saveCashTransaction(userId, cashAmount, 'cash', undefined, '', note || 'Personal training renewal');
          if (!ok) console.warn('[ExpiredPersonalAPI] saveCashTransaction returned false for cash');
        }

        // If pos amount provided, save a pos transaction
        if (posAmount && posAmount > 0) {
          const ok2 = await saveCashTransaction(userId, posAmount, 'pos', undefined, '', note || 'Personal training renewal (POS)');
          if (!ok2) console.warn('[ExpiredPersonalAPI] saveCashTransaction returned false for pos');
        }

        console.log('[ExpiredPersonalAPI] Payment transaction recorded (cashRegister)');
      } catch (err) {
        console.error('[ExpiredPersonalAPI] Exception recording payment via cash register:', err);
        // continue - do not block renewal
      }
    }

    // Step 2: Handle kettlebell points if provided (optional)
    if (kettlebellPoints && kettlebellPoints > 0) {
      try {
        console.log('[ExpiredPersonalAPI] Saving kettlebell points:', kettlebellPoints);
        const success = await saveSecretaryKettlebellPoints(
          userId,
          kettlebellPoints,
          undefined,
          ''
        );
        if (!success) {
          console.warn('[ExpiredPersonalAPI] Warning: kettlebell points save returned false, continuing anyway');
        } else {
          console.log('[ExpiredPersonalAPI] Kettlebell points saved successfully');
        }
      } catch (err) {
        console.error('[ExpiredPersonalAPI] Error saving kettlebell points:', err);
        // Don't throw - kettlebell points are optional
      }
    }

    // Step 3: Mark expired sessions as paid so they don't show up again
    try {
      console.log('[ExpiredPersonalAPI] Marking expired sessions as paid...');
      let updatedScheduleData = scheduleData.schedule_data;

      if (Array.isArray(updatedScheduleData)) {
        // If it's an array, mark all expired sessions as paid
        const today = formatDateLocal(new Date());
        updatedScheduleData = updatedScheduleData.map((session: any) => {
          // Mark sessions that are before today and not yet paid as paid
          if (session.date && session.date < today && !session.paid) {
            return { ...session, paid: true, paidAt: now };
          }
          return session;
        });
      } else if (updatedScheduleData && typeof updatedScheduleData === 'object' && Array.isArray(updatedScheduleData.sessions)) {
        // If it has a sessions property, mark all expired sessions as paid
        const today = formatDateLocal(new Date());
        updatedScheduleData.sessions = updatedScheduleData.sessions.map((session: any) => {
          // Mark sessions that are before today and not yet paid as paid
          if (session.date && session.date < today && !session.paid) {
            return { ...session, paid: true, paidAt: now };
          }
          return session;
        });
      }

      // Update the schedule with marked sessions
      const { error: updateError } = await supabase
        .from('personal_training_schedules')
        .update({ schedule_data: updatedScheduleData })
        .eq('id', scheduleId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[ExpiredPersonalAPI] Error updating schedule with paid sessions:', updateError);
        // Don't throw - this is not critical
      } else {
        console.log('[ExpiredPersonalAPI] Successfully marked expired sessions as paid');
      }
    } catch (err) {
      console.error('[ExpiredPersonalAPI] Exception while marking sessions as paid:', err);
      // Don't throw - this is not critical
    }

    // Step 4: Log the renewal to audit trail
    console.log('[ExpiredPersonalAPI] Personal training renewal recorded successfully:', {
      userId,
      scheduleId,
      amount: totalAmount,
      cashAmount,
      posAmount,
      kettlebellPoints,
      paymentMethod,
      note,
      timestamp: now
    });

    return {
      success: true,
      message: `Η ανανέωση του Personal Training καταχωρήθηκε με επιτυχία`
    };
  } catch (err) {
    console.error('[ExpiredPersonalAPI] Error recording personal registration:', err);
    const errorMessage = err instanceof Error ? err.message : 'Σφάλμα κατά την καταχώρηση';
    return {
      success: false,
      message: errorMessage
    };
  }
};
