import { supabase } from '@/config/supabase';

export interface GroupSession {
  id: string;
  program_id: string;
  user_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  trainer: string;
  room: string;
  group_type: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface MonthlyBookedGroupSlotSummary {
  session_date: string;
  start_time: string;
  end_time: string;
  trainer: string;
  room: string;
  group_type: number;
  bookings_count: number;
  users: Array<{
    first_name: string;
    last_name: string;
  }>;
}

// Δημιουργία του πίνακα group_sessions
export const createGroupSessionsTable = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[GroupSessionsAPI] Creating group_sessions table...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Δημιουργία πίνακα group_sessions για αποθήκευση των πραγματικών ημερομηνιών των group sessions
        CREATE TABLE IF NOT EXISTS group_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
            session_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            trainer VARCHAR(255) NOT NULL,
            room VARCHAR(255) NOT NULL,
            group_type INTEGER NOT NULL DEFAULT 3,
            notes TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES user_profiles(user_id),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Δημιουργία indexes για καλύτερη απόδοση
        CREATE INDEX IF NOT EXISTS idx_group_sessions_user_id ON group_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_group_sessions_program_id ON group_sessions(program_id);
        CREATE INDEX IF NOT EXISTS idx_group_sessions_date ON group_sessions(session_date);
        CREATE INDEX IF NOT EXISTS idx_group_sessions_user_program ON group_sessions(user_id, program_id);
        CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON group_sessions(is_active) WHERE is_active = true;

        -- Δημιουργία trigger για updated_at
        CREATE OR REPLACE FUNCTION update_group_sessions_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_group_sessions_updated_at
            BEFORE UPDATE ON group_sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_group_sessions_updated_at();

        -- Δημιουργία RLS policies
        ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;

        -- Policy για admins - μπορούν να δουν όλα
        CREATE POLICY "Admins can view all group sessions" ON group_sessions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );

        -- Policy για users - μπορούν να δουν μόνο τα δικά τους
        CREATE POLICY "Users can view their own group sessions" ON group_sessions
            FOR SELECT USING (user_id = auth.uid());

        -- Policy για admins - μπορούν να εισάγουν/ενημερώσουν/διαγράψουν
        CREATE POLICY "Admins can manage all group sessions" ON group_sessions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );

        -- Policy για users - μπορούν να ενημερώσουν μόνο τα δικά τους (για κρατήσεις)
        CREATE POLICY "Users can update their own group sessions" ON group_sessions
            FOR UPDATE USING (user_id = auth.uid());
      `
    });

    if (error) {
      console.error('[GroupSessionsAPI] Error creating table:', error);
      return { success: false, error: error.message };
    }

    console.log('[GroupSessionsAPI] Table created successfully');
    return { success: true };
  } catch (error) {
    console.error('[GroupSessionsAPI] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Φόρτωση κρατημένων group sessions ενός μήνα (συνοπτικά ανά slot)
export const getBookedGroupSessionsForMonth = async (
  year: number,
  month: number
): Promise<MonthlyBookedGroupSlotSummary[]> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const start = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;

    console.log('[GroupSessionsAPI] Fetching booked group sessions for month...', { year, month, start, end });

    // 1) Φέρνουμε όλα τα group_sessions του μήνα
    const { data: sessions, error: sessionsError } = await supabase
      .from('group_sessions')
      .select('id, session_date, start_time, end_time, trainer, room, group_type, is_active')
      .gte('session_date', start)
      .lte('session_date', end)
      .eq('is_active', true);

    if (sessionsError) {
      console.error('[GroupSessionsAPI] Error fetching month sessions:', sessionsError);
      return [];
    }

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id);

    // 2) Φέρνουμε κρατήσεις (booked) με πληροφορίες χρηστών για αυτά τα session_ids
    const { data: bookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select(`
        id, 
        session_id, 
        status,
        user_id,
        user_profiles!inner(first_name, last_name)
      `)
      .in('session_id', sessionIds)
      .eq('status', 'booked');

    if (bookingsError) {
      console.error('[GroupSessionsAPI] Error fetching bookings for month sessions:', bookingsError);
      return [];
    }

    // Ομαδοποίηση κρατήσεων ανά session_id με πληροφορίες χρηστών
    const sessionIdToBookings = new Map<string, Array<{first_name: string, last_name: string}>>();
    bookings?.forEach(b => {
      if (!sessionIdToBookings.has(b.session_id)) {
        sessionIdToBookings.set(b.session_id, []);
      }
      sessionIdToBookings.get(b.session_id)!.push({
        first_name: b.user_profiles.first_name,
        last_name: b.user_profiles.last_name
      });
    });

    // Φιλτράρουμε ΜΟΝΟ τα sessions που έχουν τουλάχιστον μία κράτηση
    const bookedSessions = sessions.filter(s => (sessionIdToBookings.get(s.id)?.length || 0) > 0);
    
    const summaries: MonthlyBookedGroupSlotSummary[] = bookedSessions.map(s => ({
      session_date: s.session_date as unknown as string,
      start_time: (s.start_time as unknown as string).substring(0,5),
      end_time: (s.end_time as unknown as string).substring(0,5),
      trainer: s.trainer as unknown as string,
      room: s.room as unknown as string,
      group_type: s.group_type as unknown as number,
      bookings_count: sessionIdToBookings.get(s.id)?.length || 0,
      users: sessionIdToBookings.get(s.id) || [],
    }));

    console.log('[GroupSessionsAPI] Month booked group summaries (only with bookings):', summaries.length);
    return summaries;
  } catch (error) {
    console.error('[GroupSessionsAPI] Unexpected error (getBookedGroupSessionsForMonth):', error);
    return [];
  }
};

// Λήψη group sessions για έναν χρήστη και πρόγραμμα
export const getUserGroupSessions = async (userId: string, programId: string): Promise<GroupSession[]> => {
  try {
    console.log('[GroupSessionsAPI] Fetching group sessions for user/program...', { userId, programId });
    
    // First, let's check if there are any group sessions for this user at all
    const { data: allUserSessions, error: allUserError } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    console.log('[GroupSessionsAPI] All user sessions:', allUserSessions);
    
    const { data, error } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .eq('is_active', true)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[GroupSessionsAPI] Error fetching group sessions:', error);
      return [];
    }

    console.log('[GroupSessionsAPI] Fetched group sessions for program:', data);
    console.log('[GroupSessionsAPI] Group sessions count:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('[GroupSessionsAPI] Unexpected error:', error);
    return [];
  }
};

// Δημιουργία group sessions για έναν χρήστη
export const createUserGroupSessions = async (
  userId: string,
  programId: string,
  sessions: Array<{
    session_date: string;
    start_time: string;
    end_time: string;
    trainer: string;
    room: string;
    group_type: number;
    notes?: string;
  }>,
  createdBy: string
): Promise<{ success: boolean; error?: string; createdCount?: number; blockedSessions?: string[] }> => {
  try {
    console.log('[GroupSessionsAPI] Creating group sessions for user...', { userId, programId, sessionsCount: sessions.length });
    
    // Import validation functions
    const { validateSessionCreation } = await import('./groupTrainingCalendarApi');
    
    const sessionsToInsert = [];
    const blockedSessions = [];
    
    // Smart Session Grouping: Check if existing sessions can accommodate new users
    for (const session of sessions) {
      console.log('[GroupSessionsAPI] Processing session with smart grouping:', session);
      
      // Step 1: Check if there's an existing session with same date/time/room/group_type that has space
      const { data: existingSessions, error: existingError } = await supabase
        .from('group_sessions')
        .select('id, user_id, group_type')
        .eq('session_date', session.session_date)
        .eq('start_time', session.start_time)
        .eq('end_time', session.end_time)
        .eq('trainer', session.trainer)
        .eq('room', session.room)
        .eq('group_type', session.group_type)
        .eq('is_active', true);

      if (existingError) {
        console.error('[GroupSessionsAPI] Error checking existing sessions:', existingError);
        blockedSessions.push(`${session.session_date} ${session.start_time} - Error checking existing sessions`);
        continue;
      }

      const currentOccupancy = existingSessions?.length || 0;
      const maxCapacity = session.group_type;
      
      console.log('[GroupSessionsAPI] Existing session check:', {
        date: session.session_date,
        time: session.start_time,
        room: session.room,
        groupType: session.group_type,
        currentOccupancy,
        maxCapacity,
        hasSpace: currentOccupancy < maxCapacity
      });

      if (currentOccupancy >= maxCapacity) {
        // Session is full - cannot add user
        console.warn('[GroupSessionsAPI] Session blocked - capacity full:', {
          currentOccupancy,
          maxCapacity
        });
        blockedSessions.push(`${session.session_date} ${session.start_time} - Session is full (${currentOccupancy}/${maxCapacity})`);
        continue;
      }

      // Step 2: There's space in existing session OR no existing session - create new entry
      console.log('[GroupSessionsAPI] Adding user to session (existing or new):', {
        currentOccupancy,
        maxCapacity,
        willBe: `${currentOccupancy + 1}/${maxCapacity}`
      });
      
      sessionsToInsert.push({
        program_id: programId,
        user_id: userId,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        trainer: session.trainer,
        room: session.room,
        group_type: session.group_type,
        notes: session.notes || `Group session created by admin`,
        is_active: true,
        created_by: createdBy
      });
    }

    if (sessionsToInsert.length === 0) {
      return { 
        success: false, 
        error: 'All sessions were blocked due to capacity limits', 
        blockedSessions 
      };
    }

    const { data, error } = await supabase
      .from('group_sessions')
      .insert(sessionsToInsert)
      .select();

    if (error) {
      console.error('[GroupSessionsAPI] Error creating group sessions:', error);
      return { success: false, error: error.message };
    }

    console.log('[GroupSessionsAPI] Created group sessions successfully:', data?.length);
    
    // Return success with info about blocked sessions
    const result = { 
      success: true, 
      createdCount: data?.length || 0,
      blockedSessions: blockedSessions.length > 0 ? blockedSessions : undefined
    };
    
    if (blockedSessions.length > 0) {
      console.log('[GroupSessionsAPI] Some sessions were blocked:', blockedSessions);
    }
    
    return result;
  } catch (error) {
    console.error('[GroupSessionsAPI] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// ================= User-level Existing Group Sessions (Presets)
// Implemented as special rows in personal_training_schedules with a JSON flag

export interface UserGroupSessionPresetItem {
  date: string;
  start_time: string;
  end_time: string;
  trainer: string;
  room: string;
  group_type: number;
  notes?: string;
}

export const getUserExistingGroupSessions = async (
  userId: string,
  weeklyFrequency: number
): Promise<UserGroupSessionPresetItem[]> => {
  const { data, error } = await supabase
    .from('user_group_weekly_presets')
    .select('sessions')
    .eq('user_id', userId)
    .eq('weekly_frequency', weeklyFrequency)
    .limit(1);
  if (error) {
    console.error('[GroupSessionsAPI] Error loading UGWP presets:', error);
    return [];
  }
  return (data && (data[0] as any)?.sessions) || [];
};

export const saveUserExistingGroupSessions = async (
  userId: string,
  weeklyFrequency: number,
  sessions: UserGroupSessionPresetItem[]
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_group_weekly_presets')
    .upsert({ user_id: userId, weekly_frequency: weeklyFrequency, sessions }, { onConflict: 'user_id,weekly_frequency' });
  if (error) {
    console.error('[GroupSessionsAPI] Error saving UGWP presets:', error);
    return false;
  }
  return true;
};

// Διαγραφή group sessions για έναν χρήστη και πρόγραμμα
export const deleteUserGroupSessions = async (userId: string, programId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[GroupSessionsAPI] Deleting group sessions for user/program...', { userId, programId });
    
    const { error } = await supabase
      .from('group_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('program_id', programId);

    if (error) {
      console.error('[GroupSessionsAPI] Error deleting group sessions:', error);
      return { success: false, error: error.message };
    }

    console.log('[GroupSessionsAPI] Deleted group sessions successfully');
    return { success: true };
  } catch (error) {
    console.error('[GroupSessionsAPI] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};
