// Group Assignment API utilities
import { supabase } from '@/config/supabase';

export interface GroupScheduleTemplate {
  id: string;
  groupType: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  trainer: string;
  room: string;
  groupIdentifier: string;
  maxCapacity: number;
  currentAssignments: number;
  availableSpots: number;
  isFull: boolean;
}

export interface GroupAssignment {
  id: string;
  programId: string;
  userId: string;
  groupType: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  trainer: string;
  room: string;
  groupIdentifier: string;
  weeklyFrequency: number;
  assignmentDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  userInfo?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserWeeklyAssignment {
  id: string;
  userId: string;
  programId: string;
  targetWeeklyFrequency: number;
  currentAssignmentsCount: number;
  weekStartDate: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
  errorType: string;
}

export interface AssignmentResult {
  success: boolean;
  assignmentId: string | null;
  message: string;
}

// Get all available group slots
export const getAvailableGroupSlots = async (dayOfWeek?: number): Promise<GroupScheduleTemplate[]> => {
  try {
    console.log('[GroupAssignmentAPI] Fetching available group slots...');
    
    const { data, error } = await supabase
      .rpc('get_available_group_slots', {
        p_day_of_week: dayOfWeek || null
      });

    if (error) {
      console.error('[GroupAssignmentAPI] Error fetching group slots:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Fetched group slots:', data);

    return data.map((slot: any) => ({
      id: slot.template_id,
      groupType: slot.group_type,
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      trainer: slot.trainer,
      room: slot.room,
      groupIdentifier: slot.group_identifier,
      maxCapacity: slot.max_capacity,
      currentAssignments: slot.current_assignments,
      availableSpots: slot.available_spots,
      isFull: slot.is_full
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch available group slots:', error);
    throw error;
  }
};

// Validate a group assignment before creating it
export const validateGroupAssignment = async (
  userId: string,
  programId: string,
  groupIdentifier: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  targetWeeklyFrequency: number
): Promise<ValidationResult> => {
  try {
    console.log('[GroupAssignmentAPI] Validating group assignment...', {
      userId,
      programId,
      groupIdentifier,
      dayOfWeek,
      startTime,
      endTime,
      targetWeeklyFrequency
    });

    const { data, error } = await supabase
      .rpc('validate_group_assignment', {
        p_user_id: userId,
        p_program_id: programId,
        p_group_identifier: groupIdentifier,
        p_day_of_week: dayOfWeek,
        p_start_time: startTime,
        p_end_time: endTime,
        p_target_weekly_frequency: targetWeeklyFrequency
      });

    if (error) {
      console.error('[GroupAssignmentAPI] Error validating assignment:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Validation result:', data[0]);

    return {
      isValid: data[0].is_valid,
      errorMessage: data[0].error_message,
      errorType: data[0].error_type
    };
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to validate group assignment:', error);
    throw error;
  }
};

// Create a new group assignment
export const createGroupAssignment = async (
  programId: string,
  userId: string,
  groupIdentifier: string,
  weeklyFrequency: number,
  notes?: string
): Promise<AssignmentResult> => {
  try {
    console.log('[GroupAssignmentAPI] Creating group assignment...', {
      programId,
      userId,
      groupIdentifier,
      weeklyFrequency,
      notes
    });

    const { data, error } = await supabase
      .rpc('create_group_assignment', {
        p_program_id: programId,
        p_user_id: userId,
        p_group_identifier: groupIdentifier,
        p_weekly_frequency: weeklyFrequency,
        p_notes: notes || null
      });

    if (error) {
      console.error('[GroupAssignmentAPI] Error creating assignment:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Assignment creation result:', data[0]);

    return {
      success: data[0].success,
      assignmentId: data[0].assignment_id,
      message: data[0].message
    };
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to create group assignment:', error);
    throw error;
  }
};

// Get user's group assignments for a specific program
export const getUserGroupAssignments = async (userId: string, programId?: string): Promise<GroupAssignment[]> => {
  try {
    console.log('[GroupAssignmentAPI] Fetching user group assignments...', { userId, programId });

    let query = supabase
      .from('group_assignments')
      .select(`
        id,
        program_id,
        user_id,
        group_type,
        day_of_week,
        start_time,
        end_time,
        trainer,
        room,
        group_identifier,
        weekly_frequency,
        assignment_date,
        is_active,
        created_by,
        created_at,
        updated_at,
        notes
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GroupAssignmentAPI] Error fetching user assignments:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Fetched user assignments:', data);

    return data.map((assignment: any) => ({
      id: assignment.id,
      programId: assignment.program_id,
      userId: assignment.user_id,
      groupType: assignment.group_type,
      dayOfWeek: assignment.day_of_week,
      startTime: assignment.start_time,
      endTime: assignment.end_time,
      trainer: assignment.trainer,
      room: assignment.room,
      groupIdentifier: assignment.group_identifier,
      weeklyFrequency: assignment.weekly_frequency,
      assignmentDate: assignment.assignment_date,
      isActive: assignment.is_active,
      createdBy: assignment.created_by,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      notes: assignment.notes
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch user group assignments:', error);
    throw error;
  }
};

// Get all group assignments for a specific group slot
export const getGroupSlotAssignments = async (groupIdentifier: string): Promise<GroupAssignment[]> => {
  try {
    console.log('[GroupAssignmentAPI] Fetching group slot assignments...', { groupIdentifier });

    const { data, error } = await supabase
      .from('group_assignments')
      .select(`
        id,
        program_id,
        user_id,
        group_type,
        day_of_week,
        start_time,
        end_time,
        trainer,
        room,
        group_identifier,
        weekly_frequency,
        assignment_date,
        is_active,
        created_by,
        created_at,
        updated_at,
        notes,
        user_profiles!group_assignments_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('group_identifier', groupIdentifier)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GroupAssignmentAPI] Error fetching group slot assignments:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Fetched group slot assignments:', data);

    return data.map((assignment: any) => ({
      id: assignment.id,
      programId: assignment.program_id,
      userId: assignment.user_id,
      groupType: assignment.group_type,
      dayOfWeek: assignment.day_of_week,
      startTime: assignment.start_time,
      endTime: assignment.end_time,
      trainer: assignment.trainer,
      room: assignment.room,
      groupIdentifier: assignment.group_identifier,
      weeklyFrequency: assignment.weekly_frequency,
      assignmentDate: assignment.assignment_date,
      isActive: assignment.is_active,
      createdBy: assignment.created_by,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      notes: assignment.notes,
      userInfo: assignment.user_profiles
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch group slot assignments:', error);
    throw error;
  }
};

// Remove a group assignment
export const removeGroupAssignment = async (assignmentId: string): Promise<boolean> => {
  try {
    console.log('[GroupAssignmentAPI] Removing group assignment...', { assignmentId });

    const { error } = await supabase
      .from('group_assignments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (error) {
      console.error('[GroupAssignmentAPI] Error removing assignment:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Assignment removed successfully');
    return true;
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to remove group assignment:', error);
    throw error;
  }
};

// Get user's weekly assignment summary
export const getUserWeeklyAssignments = async (userId: string, programId: string): Promise<UserWeeklyAssignment[]> => {
  try {
    console.log('[GroupAssignmentAPI] Fetching user weekly assignments...', { userId, programId });

    const { data, error } = await supabase
      .from('user_weekly_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .order('week_start_date', { ascending: false });

    if (error) {
      console.error('[GroupAssignmentAPI] Error fetching weekly assignments:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Fetched weekly assignments:', data);

    return data.map((assignment: any) => ({
      id: assignment.id,
      userId: assignment.user_id,
      programId: assignment.program_id,
      targetWeeklyFrequency: assignment.target_weekly_frequency,
      currentAssignmentsCount: assignment.current_assignments_count,
      weekStartDate: assignment.week_start_date,
      isComplete: assignment.is_complete,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch user weekly assignments:', error);
    throw error;
  }
};

// Helper function to get day name from day of week number
export const getDayName = (dayOfWeek: number): string => {
  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
  return days[dayOfWeek] || 'Άγνωστη';
};

// Helper function to format time
export const formatTime = (time: string): string => {
  return time.substring(0, 5); // Remove seconds if present
};

// Helper function to get group type display name
export const getGroupTypeDisplayName = (groupType: number): string => {
  return `${groupType} άτομα`;
};

// Check room capacity for a specific date/time/room combination
export const checkRoomCapacity = async (
  date: string,
  startTime: string,
  endTime: string,
  room: string,
  groupType: number,
  excludeUserId?: string // Exclude current user from count when updating
): Promise<{ isAvailable: boolean; currentOccupancy: number; maxCapacity: number }> => {
  try {
    console.log('[GroupAssignmentAPI] Checking room capacity...', { date, startTime, endTime, room, groupType, excludeUserId });

    // Get all assignments for this date/time/room
    let query = supabase
      .from('group_assignments')
      .select('id, user_id, group_type')
      .eq('assignment_date', date)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .eq('room', room)
      .eq('is_active', true);

    // Exclude current user if updating existing session
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data: existingAssignments, error } = await query;

    if (error) {
      console.error('[GroupAssignmentAPI] Error checking room capacity:', error);
      throw error;
    }

    const currentOccupancy = existingAssignments?.length || 0;
    const maxCapacity = groupType; // The room capacity is determined by group type
    const isAvailable = currentOccupancy < maxCapacity;

    console.log('[GroupAssignmentAPI] Room capacity check result:', {
      currentOccupancy,
      maxCapacity,
      isAvailable,
      excludedUser: excludeUserId
    });

    return {
      isAvailable,
      currentOccupancy,
      maxCapacity
    };
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to check room capacity:', error);
    throw error;
  }
};

// Send program notification to user after group assignments are complete
export const sendGroupProgramNotification = async (
  userId: string,
  programId: string,
  groupAssignments: GroupAssignment[]
): Promise<boolean> => {
  try {
    console.log('[GroupAssignmentAPI] Sending program notification to user:', { userId, programId });

    // Get user info
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('[GroupAssignmentAPI] Error fetching user profile:', userError);
      return false;
    }

    // Get program info
    const { data: program, error: programError } = await supabase
      .from('personal_training_schedules')
      .select('group_room_size, weekly_frequency, status')
      .eq('id', programId)
      .single();

    if (programError) {
      console.error('[GroupAssignmentAPI] Error fetching program info:', programError);
      return false;
    }

    // Update program status to 'accepted' since assignments are now complete
    const { error: updateError } = await supabase
      .from('personal_training_schedules')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (updateError) {
      console.error('[GroupAssignmentAPI] Error updating program status:', updateError);
      return false;
    }

    console.log('[GroupAssignmentAPI] Program notification sent successfully');
    console.log('[GroupAssignmentAPI] User will see their program as accepted with group assignments');
    
    return true;
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to send program notification:', error);
    return false;
  }
};

// Get all group assignments for overview (monthly view)
export const getAllGroupAssignmentsForMonth = async (year: number, month: number): Promise<GroupAssignment[]> => {
  try {
    console.log('[GroupAssignmentAPI] Fetching all group assignments for month...', { year, month });

    const { data, error } = await supabase
      .from('group_assignments')
      .select(`
        id,
        program_id,
        user_id,
        group_type,
        day_of_week,
        start_time,
        end_time,
        trainer,
        room,
        group_identifier,
        weekly_frequency,
        assignment_date,
        is_active,
        created_by,
        created_at,
        updated_at,
        notes,
        user_profiles!group_assignments_user_id_fkey (
          first_name,
          last_name,
          email
        ),
        personal_training_schedules!group_assignments_program_id_fkey (
          month,
          year,
          status
        )
      `)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[GroupAssignmentAPI] Error fetching monthly assignments:', error);
      throw error;
    }

    console.log('[GroupAssignmentAPI] Fetched monthly assignments:', data);

    // Filter by the requested month/year
    const filteredData = data.filter((assignment: any) => {
      const schedule = assignment.personal_training_schedules;
      return schedule && schedule.year === year && schedule.month === month;
    });

    return filteredData.map((assignment: any) => ({
      id: assignment.id,
      programId: assignment.program_id,
      userId: assignment.user_id,
      groupType: assignment.group_type,
      dayOfWeek: assignment.day_of_week,
      startTime: assignment.start_time,
      endTime: assignment.end_time,
      trainer: assignment.trainer,
      room: assignment.room,
      groupIdentifier: assignment.group_identifier,
      weeklyFrequency: assignment.weekly_frequency,
      assignmentDate: assignment.assignment_date,
      isActive: assignment.is_active,
      createdBy: assignment.created_by,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      notes: assignment.notes,
      userInfo: assignment.user_profiles
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch monthly group assignments:', error);
    throw error;
  }
};

// Get all group programs (schedules) for a month, including those without assignments yet
export const getAllGroupProgramsForMonth = async (year: number, month: number) => {
  try {
    console.log('[GroupAssignmentAPI] Fetching all group programs for month...', { year, month });

    // Try with the standard user_profiles join first
    let { data: programs, error: programsError } = await supabase
      .from('personal_training_schedules')
      .select(`
        id,
        user_id,
        month,
        year,
        training_type,
        group_room_size,
        weekly_frequency,
        monthly_total,
        status,
        created_at,
        updated_at,
        user_profiles (
          first_name,
          last_name,
          email
        )
      `)
      .eq('training_type', 'group')
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false });

    // If the join fails, fall back to separate queries
    if (programsError) {
      console.warn('[GroupAssignmentAPI] Join failed, trying separate queries:', programsError);
      
      // First get the group programs without join
      const { data: programsOnly, error: programsOnlyError } = await supabase
        .from('personal_training_schedules')
        .select(`
          id,
          user_id,
          month,
          year,
          training_type,
          group_room_size,
          weekly_frequency,
          monthly_total,
          status,
          created_at,
          updated_at
        `)
        .eq('training_type', 'group')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });

      if (programsOnlyError) {
        console.error('[GroupAssignmentAPI] Error fetching group programs:', programsOnlyError);
        throw programsOnlyError;
      }

      if (!programsOnly || programsOnly.length === 0) {
        console.log('[GroupAssignmentAPI] No group programs found for month');
        return [];
      }

      // Get user IDs from the programs
      const userIds = programsOnly.map(p => p.user_id);

      // Fetch user profiles separately
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (usersError) {
        console.error('[GroupAssignmentAPI] Error fetching user profiles:', usersError);
        throw usersError;
      }

      console.log('[GroupAssignmentAPI] Fetched group programs (fallback):', programsOnly);
      console.log('[GroupAssignmentAPI] Fetched user profiles (fallback):', userProfiles);

      // Combine programs with user info
      return programsOnly.map((program: any) => {
        const userInfo = userProfiles?.find(u => u.user_id === program.user_id);
        return {
          id: program.id,
          userId: program.user_id,
          month: program.month,
          year: program.year,
          trainingType: program.training_type,
          groupRoomSize: program.group_room_size,
          weeklyFrequency: program.weekly_frequency,
          monthlyTotal: program.monthly_total,
          status: program.status,
          createdAt: program.created_at,
          updatedAt: program.updated_at,
          userInfo: userInfo ? {
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            email: userInfo.email
          } : null
        };
      });
    }

    console.log('[GroupAssignmentAPI] Fetched group programs (with join):', programs);

    // If join succeeded, process the results
    return programs.map((program: any) => ({
      id: program.id,
      userId: program.user_id,
      month: program.month,
      year: program.year,
      trainingType: program.training_type,
      groupRoomSize: program.group_room_size,
      weeklyFrequency: program.weekly_frequency,
      monthlyTotal: program.monthly_total,
      status: program.status,
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      userInfo: program.user_profiles ? {
        first_name: program.user_profiles.first_name,
        last_name: program.user_profiles.last_name,
        email: program.user_profiles.email
      } : null
    }));
  } catch (error) {
    console.error('[GroupAssignmentAPI] Failed to fetch monthly group programs:', error);
    throw error;
  }
};
