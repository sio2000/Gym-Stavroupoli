import { supabase } from '@/config/supabase';

export interface GroupTrainingCalendarEvent {
  id: string;
  title: string;
  type: 'group';
  start: string; // ISO string
  end: string; // ISO string
  room: string;
  capacity: number;
  participants_count: number;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>;
  status: 'scheduled' | 'cancelled' | 'completed';
  trainer: string;
  group_type: number;
  notes?: string;
}

export interface GroupTrainingCalendarResponse {
  events: GroupTrainingCalendarEvent[];
  total_count: number;
}

/**
 * Fetch individual personal training sessions from personal_training_schedules
 * These are the sessions created directly by admin for personal users
 */
const getIndividualPersonalTrainingSessions = async (
  startDate: string,
  endDate: string
): Promise<GroupTrainingCalendarEvent[]> => {
  try {
    console.log('[GroupTrainingCalendarAPI] Fetching individual personal training sessions...', { startDate, endDate });

    // First, let's try a simpler query to see what we have
    const { data: allSchedules, error: allError } = await supabase
      .from('personal_training_schedules')
      .select('id, user_id, training_type, user_type, status')
      .eq('status', 'accepted');

    console.log('[GroupTrainingCalendarAPI] All accepted schedules:', allSchedules);

    if (allError) {
      console.error('[GroupTrainingCalendarAPI] Error fetching all schedules:', allError);
      return [];
    }

    // Filter for individual personal training
    const schedules = allSchedules?.filter(schedule => 
      schedule.training_type === 'individual' && 
      schedule.user_type === 'personal'
    );

    console.log('[GroupTrainingCalendarAPI] Filtered individual personal schedules:', schedules);

    // Now fetch the full data for these schedules
    if (schedules && schedules.length > 0) {
      const scheduleIds = schedules.map(s => s.id);
      const { data: fullSchedules, error } = await supabase
        .from('personal_training_schedules')
        .select(`
          id,
          user_id,
          schedule_data,
          training_type,
          user_type
        `)
        .in('id', scheduleIds);

      if (error) {
        console.error('[GroupTrainingCalendarAPI] Error fetching individual schedules:', error);
        return [];
      }

      console.log('[GroupTrainingCalendarAPI] Found individual schedules:', fullSchedules?.length || 0);
      console.log('[GroupTrainingCalendarAPI] Individual schedules data:', fullSchedules);

      if (!fullSchedules || fullSchedules.length === 0) {
        console.log('[GroupTrainingCalendarAPI] No individual schedules found');
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(fullSchedules.map(schedule => schedule.user_id))];
      console.log('[GroupTrainingCalendarAPI] Fetching user profiles for IDs:', userIds);

      // Fetch user profiles separately
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('[GroupTrainingCalendarAPI] Error fetching user profiles:', profilesError);
        return [];
      }

      console.log('[GroupTrainingCalendarAPI] Found user profiles:', userProfiles?.length || 0);

      // Create a map for quick lookup
      const userProfileMap = new Map();
      userProfiles?.forEach(profile => {
        userProfileMap.set(profile.user_id, profile);
      });

      const events: GroupTrainingCalendarEvent[] = [];

      fullSchedules?.forEach(schedule => {
      console.log('[GroupTrainingCalendarAPI] Processing schedule:', schedule.id, 'for user:', schedule.user_id);
      console.log('[GroupTrainingCalendarAPI] Schedule data:', schedule.schedule_data);
      
      if (!schedule.schedule_data) {
        console.log('[GroupTrainingCalendarAPI] No schedule_data for schedule:', schedule.id);
        return;
      }

      const scheduleData = schedule.schedule_data;
      
      // Handle both array format and object format with sessions property
      let sessions;
      if (Array.isArray(scheduleData)) {
        sessions = scheduleData;
      } else if (scheduleData && typeof scheduleData === 'object' && scheduleData.sessions) {
        sessions = scheduleData.sessions;
      } else {
        console.log('[GroupTrainingCalendarAPI] Schedule data is not in expected format for schedule:', schedule.id, scheduleData);
        return;
      }

      if (!Array.isArray(sessions)) {
        console.log('[GroupTrainingCalendarAPI] Sessions is not an array for schedule:', schedule.id);
        return;
      }

      const userProfile = userProfileMap.get(schedule.user_id);

      sessions.forEach((session: any) => {
        const sessionDate = session.date;
        
        // Check if session date is within the requested range
        if (sessionDate >= startDate && sessionDate <= endDate) {
          const startDateTime = `${sessionDate}T${session.startTime}:00`;
          // Calculate end_time by adding 1 hour to start_time
          const [hours, minutes] = session.startTime.split(':').map(Number);
          const endHours = (hours + 1) % 24;
          const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          const endDateTime = `${sessionDate}T${endTime}:00`;
          
          events.push({
            id: `individual-${schedule.id}-${session.date}-${session.startTime}`,
            title: `Personal Training - ${userProfile?.first_name || 'Unknown'} ${userProfile?.last_name || 'User'}`,
            type: 'group', // Using 'group' type for consistency with calendar
            start: startDateTime,
            end: endDateTime,
            room: session.room || 'Personal Training Room',
            capacity: 1,
            participants_count: 1,
            participants: [{
              id: schedule.user_id,
              name: `${userProfile?.first_name || 'Unknown'} ${userProfile?.last_name || 'User'}`,
              email: userProfile?.email || '',
              avatar_url: undefined
            }],
            status: 'scheduled',
            trainer: session.trainer || 'Personal Trainer',
            group_type: 1,
            notes: session.notes || ''
          });
        }
      });
    });

      console.log('[GroupTrainingCalendarAPI] Found individual personal training sessions:', events.length);
      return events;
    } else {
      console.log('[GroupTrainingCalendarAPI] No individual personal schedules found');
      return [];
    }

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error fetching individual personal training sessions:', error);
    return [];
  }
};

/**
 * Fetch group training sessions for calendar display
 * Includes both regular group sessions and Group/Paspartu sessions with bookings
 * Admin-only access with proper date filtering
 */
export const getGroupTrainingCalendarEvents = async (
  startDate: string,
  endDate: string
): Promise<GroupTrainingCalendarResponse> => {
  try {
    console.log('[GroupTrainingCalendarAPI] Fetching calendar events...', { startDate, endDate });

    // Step 1: Fetch regular group sessions with participant details
    const { data: sessions, error } = await supabase
      .from('group_sessions')
      .select(`
        id,
        session_date,
        start_time,
        end_time,
        trainer,
        room,
        group_type,
        notes,
        is_active,
        created_at,
        program_id,
        user_profiles!group_sessions_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        personal_training_schedules!group_sessions_program_id_fkey(
          training_type,
          user_type,
          group_room_size
        )
      `)
      .eq('is_active', true)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[GroupTrainingCalendarAPI] Error fetching sessions:', error);
      throw new Error(`Failed to fetch group sessions: ${error.message}`);
    }

    console.log('[GroupTrainingCalendarAPI] Raw sessions data:', sessions);

    // Step 1.5: Fetch Individual/Paspartu sessions from lesson_bookings
    const { data: individualPaspartuBookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select(`
        id,
        session_id,
        booking_date,
        booking_time,
        trainer_name,
        room,
        status,
        user_id,
        schedule_id,
        user_profiles!lesson_bookings_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        personal_training_schedules!lesson_bookings_schedule_id_fkey(
          training_type,
          user_type,
          group_room_size
        )
      `)
      .eq('status', 'booked')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (bookingsError) {
      console.error('[GroupTrainingCalendarAPI] Error fetching Individual/Paspartu bookings:', bookingsError);
      // Continue without Individual/Paspartu sessions if error occurs
    }

    console.log('[GroupTrainingCalendarAPI] Individual/Paspartu bookings:', individualPaspartuBookings);

    // Step 2: Get bookings for Group/Paspartu sessions (only for group_sessions)
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: bookings, error: groupBookingsError } = await supabase
      .from('lesson_bookings')
      .select(`
        id,
        session_id,
        status,
        user_id,
        user_profiles!lesson_bookings_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .in('session_id', sessionIds)
      .eq('status', 'booked');

    if (groupBookingsError) {
      console.error('[GroupTrainingCalendarAPI] Error fetching bookings:', groupBookingsError);
      // Continue without bookings if error occurs
    }

    // Step 3: Group bookings by session_id
    const sessionBookings = new Map<string, any[]>();
    bookings?.forEach(booking => {
      if (!sessionBookings.has(booking.session_id)) {
        sessionBookings.set(booking.session_id, []);
      }
      sessionBookings.get(booking.session_id)!.push(booking);
    });

    // Step 3.5: Group Individual/Paspartu bookings by date/time/room/trainer
    const individualPaspartuBookingsMap = new Map<string, any[]>();
    individualPaspartuBookings?.forEach(booking => {
      // Include Individual sessions (training_type === 'individual') 
      // AND Group/Paspartu sessions (training_type === 'group' AND user_type === 'paspartu')
      // AND Combination sessions (training_type === 'combination')
      const isIndividual = booking.personal_training_schedules?.training_type === 'individual';
      const isGroupPaspartu = booking.personal_training_schedules?.training_type === 'group' && 
                             booking.personal_training_schedules?.user_type === 'paspartu';
      const isCombination = booking.personal_training_schedules?.training_type === 'combination';
      
      if (isIndividual || isGroupPaspartu || isCombination) {
        const key = `${booking.booking_date}-${booking.booking_time}-${booking.trainer_name}-${booking.room}`;
        if (!individualPaspartuBookingsMap.has(key)) {
          individualPaspartuBookingsMap.set(key, []);
        }
        individualPaspartuBookingsMap.get(key)!.push(booking);
      }
    });

    // Step 4: Group sessions by date, time, trainer, and room to create calendar events
    // This ensures that multiple sessions for the same time/room are merged into one event
    const eventMap = new Map<string, GroupTrainingCalendarEvent>();

    // Process regular group sessions - but only show Group/Paspartu sessions that have bookings
    sessions?.forEach((session, index) => {
      console.log(`[GroupTrainingCalendarAPI] Processing session ${index + 1}:`, {
        id: session.id,
        date: session.session_date,
        time: `${session.start_time}-${session.end_time}`,
        trainer: session.trainer,
        room: session.room,
        group_type: session.group_type,
        user: session.user_profiles?.first_name,
        training_type: session.personal_training_schedules?.training_type,
        user_type: session.personal_training_schedules?.user_type
      });

      // Check if this is a Group/Paspartu session that needs booking validation
      const isGroupPaspartu = session.personal_training_schedules?.training_type === 'group' && 
                             session.personal_training_schedules?.user_type === 'paspartu';
      const isCombination = session.personal_training_schedules?.training_type === 'combination';
      
      // For combination sessions with null group_type, these are individual sessions
      const isCombinationIndividual = isCombination && session.group_type === null;

      // For Group/Paspartu sessions ONLY, only process if they have bookings
      // Combination sessions should ALWAYS be displayed (like regular Group/Personal)
      const sessionBookingList = sessionBookings.get(session.id) || [];
      const hasBookings = sessionBookingList.length > 0;

      // CRITICAL FIX: Individual combination sessions should ALWAYS be processed
      // regardless of bookings status
      if (isGroupPaspartu && !hasBookings && !isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] Skipping Group/Paspartu session ${session.id} - no bookings`);
        return; // Skip this session as it has no bookings
      }
      
      // For Combination sessions, always process (both group sessions and individual sessions)
      // This ensures both "φορές/εβδομάδα" and individual sessions are displayed
      
      // Combination sessions are always processed (like regular Group/Personal sessions)
      if (isCombination) {
        console.log(`[GroupTrainingCalendarAPI] Processing Combination session ${session.id} - always displayed`, {
          group_type: session.group_type,
          isIndividual: isCombinationIndividual,
          user: session.user_profiles?.first_name
        });
      }
      
      // Special handling for individual sessions in combination programs
      if (isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] Processing Individual session in Combination ${session.id}`, {
          group_type: session.group_type,
          user: session.user_profiles?.first_name
        });
      }
      
      // CRITICAL: Ensure individual combination sessions are ALWAYS processed
      // This is the key fix for the issue
      if (isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] FORCING Individual Combination session ${session.id} to be processed`, {
          group_type: session.group_type,
          user: session.user_profiles?.first_name,
          willCreateEvent: true
        });
      }

      const sessionDate = session.session_date;
      const startTime = session.start_time;
      const endTime = session.end_time;
      const trainer = session.trainer;
      const room = session.room;

      // Create unique key for grouping (same time/room/group_type = same event)
      // For Combination sessions, use a different key format to include individual sessions
      const eventKey = isCombination 
        ? `${sessionDate}-${startTime}-${endTime}-${trainer}-${room}-${isCombinationIndividual ? 'individual' : 'combination'}-${isCombinationIndividual ? '1' : (session.group_type || '1')}`
        : `${sessionDate}-${startTime}-${endTime}-${trainer}-${room}-${session.group_type}`;
      
      console.log(`[GroupTrainingCalendarAPI] Event key: ${eventKey}`, {
        isGroupPaspartu,
        isCombination,
        hasBookings,
        group_type: session.group_type,
        willProcess: !isGroupPaspartu || hasBookings
      });
      
      // CRITICAL: Log individual combination sessions for debugging
      if (isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] INDIVIDUAL COMBINATION SESSION DETECTED: ${session.id}`, {
          eventKey,
          group_type: session.group_type,
          trainer,
          room,
          date: sessionDate,
          startTime,
          endTime,
          willCreateEvent: true
        });
      }

      if (!eventMap.has(eventKey)) {
        // Get capacity from group_type (2, 3, or 6)
        // For Combination individual sessions (group_type = null), capacity should be 1
        let capacity: number;
        if (isCombinationIndividual) {
          capacity = 1; // Individual sessions in Combination programs have capacity of 1
        } else {
          capacity = session.group_type || 3;
        }
        
        // Create ISO datetime strings
        const startDateTime = `${sessionDate}T${startTime}:00`;
        const endDateTime = `${sessionDate}T${endTime}:00`;

        const event: GroupTrainingCalendarEvent = {
          id: `group-${eventKey}`, // Use eventKey instead of session.id for proper grouping
          title: isCombinationIndividual ? `Ατομική Σεσία - ${trainer}` : `Group Training - ${trainer}`,
          type: 'group',
          start: startDateTime,
          end: endDateTime,
          room: room,
          capacity: capacity,
          participants_count: 0,
          participants: [],
          status: session.is_active ? 'scheduled' : 'cancelled',
          trainer: trainer,
          group_type: isCombinationIndividual ? 1 : session.group_type, // Individual sessions have group_type = 1
          notes: session.notes
        };

        eventMap.set(eventKey, event);
        
        // CRITICAL: Log event creation for individual combination sessions
        if (isCombinationIndividual) {
          console.log(`[GroupTrainingCalendarAPI] CREATED EVENT for Individual Combination session: ${session.id}`, {
            eventKey,
            title: event.title,
            capacity: event.capacity,
            start: event.start,
            end: event.end,
            trainer: event.trainer,
            group_type: event.group_type
          });
        }
      }

      // Get the existing event (or newly created one)
      const event = eventMap.get(eventKey)!;
      
      // Add direct user from session (for regular group sessions and combination sessions)
      // Skip only for Group/Paspartu sessions (they get users from bookings only)
      if (session.user_profiles && !isGroupPaspartu) {
        // Check if participant already exists to avoid duplicates
        const existingParticipant = event.participants.find(p => p.id === session.user_profiles.user_id);
        if (!existingParticipant) {
          event.participants.push({
            id: session.user_profiles.user_id,
            name: `${session.user_profiles.first_name} ${session.user_profiles.last_name}`,
            email: session.user_profiles.email,
            avatar_url: session.user_profiles.avatar_url
          });
        }
      }
      
      // CRITICAL: For individual combination sessions, ensure they are always displayed
      // This is the key fix for the issue
      if (isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] Individual Combination session ${session.id} processed successfully`, {
          eventKey,
          capacity: event.capacity,
          participants: event.participants.length,
          willBeDisplayed: true,
          title: event.title,
          start: event.start,
          end: event.end
        });
      }
      
      // Update participants count
      event.participants_count = event.participants.length;

      // Add participants from bookings (for Group/Paspartu sessions with bookings)
      sessionBookingList.forEach(booking => {
        if (booking.user_profiles) {
          // Check if participant already exists to avoid duplicates
          const existingParticipant = event.participants.find(p => p.id === booking.user_profiles.user_id);
          if (!existingParticipant) {
            event.participants.push({
              id: booking.user_profiles.user_id,
              name: `${booking.user_profiles.first_name} ${booking.user_profiles.last_name}`,
              email: booking.user_profiles.email,
              avatar_url: booking.user_profiles.avatar_url
            });
          }
        }
      });
      
      // CRITICAL: Final check for individual combination sessions
      // This ensures they are always displayed in the calendar
      if (isCombinationIndividual) {
        console.log(`[GroupTrainingCalendarAPI] FINAL CHECK: Individual Combination session ${session.id} will be displayed`, {
          eventKey,
          capacity: event.capacity,
          participants: event.participants.length,
          status: event.status,
          title: event.title,
          start: event.start,
          end: event.end,
          trainer: event.trainer,
          room: event.room
        });
      }
      
      // Update participants count after adding from bookings
      event.participants_count = event.participants.length;
    });


    // Process Individual/Paspartu sessions from lesson_bookings
    individualPaspartuBookingsMap.forEach((bookings, key) => {
      console.log(`[GroupTrainingCalendarAPI] Processing Individual/Paspartu bookings for key: ${key}`, {
        bookingsCount: bookings.length,
        firstBooking: bookings[0]
      });

      const firstBooking = bookings[0];
      const sessionDate = firstBooking.booking_date;
      const startTime = firstBooking.booking_time;
      const endTime = firstBooking.booking_time; // Individual sessions typically have same start/end time
      const trainer = firstBooking.trainer_name;
      const room = firstBooking.room;

      // Determine session type and capacity
      const isIndividual = firstBooking.personal_training_schedules?.training_type === 'individual';
      const isGroupPaspartu = firstBooking.personal_training_schedules?.training_type === 'group' && 
                             firstBooking.personal_training_schedules?.user_type === 'paspartu';
      const isCombination = firstBooking.personal_training_schedules?.training_type === 'combination';
      
      let capacity, groupType, title, eventKey;
      
      if (isIndividual) {
        capacity = 1;
        groupType = 1;
        title = `Individual Training - ${trainer}`;
        eventKey = `${sessionDate}-${startTime}-${endTime}-${trainer}-${room}-individual`;
      } else if (isGroupPaspartu || isCombination) {
        // For Group/Paspartu sessions, we need to find the actual capacity from the group_sessions table
        // Look for a corresponding group_session to get the correct group_type/capacity
        let actualCapacity = 3; // Default fallback
        
        // Try to find the group_session that corresponds to this booking
        const correspondingSession = sessions?.find(session => 
          session.session_date === sessionDate &&
          session.start_time === startTime &&
          session.trainer === trainer &&
          session.room === room &&
          ((session.personal_training_schedules?.training_type === 'group' &&
            session.personal_training_schedules?.user_type === 'paspartu') ||
           session.personal_training_schedules?.training_type === 'combination')
        );
        
        if (correspondingSession) {
          actualCapacity = correspondingSession.group_type || 3;
          console.log(`[GroupTrainingCalendarAPI] Found corresponding session for booking, using capacity: ${actualCapacity}`);
        } else {
          // If no corresponding session found, use group_room_size as fallback
          actualCapacity = firstBooking.personal_training_schedules?.group_room_size || 3;
          console.log(`[GroupTrainingCalendarAPI] No corresponding session found, using group_room_size: ${actualCapacity}`);
        }
        
        capacity = actualCapacity;
        groupType = capacity;
        title = isCombination ? `Ατομική Σεσία - ${trainer}` : `Group Training - ${trainer}`;
        eventKey = `${sessionDate}-${startTime}-${endTime}-${trainer}-${room}-${isCombination ? 'individual' : 'group-paspartu'}-${groupType}`;
      } else {
        // Skip unknown session types
        return;
      }
      
      console.log(`[GroupTrainingCalendarAPI] Individual/Paspartu event key: ${eventKey}`, {
        isIndividual,
        isGroupPaspartu,
        capacity,
        groupType
      });

      if (!eventMap.has(eventKey)) {
        // Create ISO datetime strings
        const startDateTime = `${sessionDate}T${startTime}:00`;
        const endDateTime = `${sessionDate}T${endTime}:00`;

        const event: GroupTrainingCalendarEvent = {
          id: `booking-${eventKey}`,
          title: title,
          type: 'group',
          start: startDateTime,
          end: endDateTime,
          room: room,
          capacity: capacity,
          participants_count: 0,
          participants: [],
          status: 'scheduled',
          trainer: trainer,
          group_type: groupType,
          notes: `${isIndividual ? 'Individual' : isCombination ? 'Combination' : 'Group/Paspartu'} session - ${bookings.length} booking(s)`
        };

        eventMap.set(eventKey, event);
      }

      // Get the existing event (or newly created one)
      const event = eventMap.get(eventKey)!;
      
      // Add participants from Individual/Paspartu bookings
      bookings.forEach(booking => {
        if (booking.user_profiles) {
          // Check if participant already exists to avoid duplicates
          const existingParticipant = event.participants.find(p => p.id === booking.user_profiles.user_id);
          if (!existingParticipant) {
            event.participants.push({
              id: booking.user_profiles.user_id,
              name: `${booking.user_profiles.first_name} ${booking.user_profiles.last_name}`,
              email: booking.user_profiles.email,
              avatar_url: booking.user_profiles.avatar_url
            });
          }
        }
      });
    });

    // Update participant counts for all events after processing all sessions
    eventMap.forEach((event) => {
      event.participants_count = event.participants.length;
    });

    const events = Array.from(eventMap.values());

    console.log('[GroupTrainingCalendarAPI] Final events summary:');
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.id,
        date: event.start.split('T')[0],
        time: `${event.start.split('T')[1].substring(0, 5)}-${event.end.split('T')[1].substring(0, 5)}`,
        trainer: event.trainer,
        room: event.room,
        capacity: `${event.participants_count}/${event.capacity}`,
        group_type: event.group_type
      });
    });

    console.log('[GroupTrainingCalendarAPI] Processed events:', events.length);

    // Step 3: Fetch individual personal training sessions
    console.log('[GroupTrainingCalendarAPI] Fetching individual personal training sessions...');
    const individualSessions = await getIndividualPersonalTrainingSessions(startDate, endDate);
    
    // Add individual sessions to events
    events.push(...individualSessions);
    
    console.log('[GroupTrainingCalendarAPI] Total events including individual sessions:', events.length);

    return {
      events,
      total_count: events.length
    };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Unexpected error:', error);
    throw new Error('Failed to fetch group training calendar events');
  }
};

/**
 * Get session details for modal display
 */
export const getGroupTrainingSessionDetails = async (sessionId: string): Promise<GroupTrainingCalendarEvent | null> => {
  try {
    const { data, error } = await supabase
      .from('group_sessions')
      .select(`
        id,
        session_date,
        start_time,
        end_time,
        trainer,
        room,
        group_type,
        notes,
        is_active,
        program_id,
        user_profiles!group_sessions_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        personal_training_schedules!group_sessions_program_id_fkey(
          training_type,
          group_room_size
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      console.error('[GroupTrainingCalendarAPI] Error fetching session details:', error);
      return null;
    }

    const capacity = data.personal_training_schedules?.group_room_size || 6;
    const startDateTime = `${data.session_date}T${data.start_time}:00`;
    const endDateTime = `${data.session_date}T${data.end_time}:00`;

    return {
      id: `group-${data.id}`,
      title: `Group Training - ${data.trainer}`,
      type: 'group',
      start: startDateTime,
      end: endDateTime,
      room: data.room,
      capacity: capacity,
      participants_count: data.user_profiles ? 1 : 0,
      participants: data.user_profiles ? [{
        id: data.user_profiles.user_id,
        name: `${data.user_profiles.first_name} ${data.user_profiles.last_name}`,
        email: data.user_profiles.email,
        avatar_url: data.user_profiles.avatar_url
      }] : [],
      status: data.is_active ? 'scheduled' : 'cancelled',
      trainer: data.trainer,
      group_type: data.group_type,
      notes: data.notes
    };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error fetching session details:', error);
    return null;
  }
};

/**
 * Cancel a group training session
 */
export const cancelGroupTrainingSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('group_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('[GroupTrainingCalendarAPI] Error cancelling session:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error cancelling session:', error);
    return { success: false, error: 'Failed to cancel session' };
  }
};

/**
 * Check if a session slot is at full capacity
 */
export const checkSessionCapacity = async (
  sessionDate: string,
  startTime: string,
  endTime: string,
  trainer: string,
  room: string,
  groupType?: number // Προσθήκη groupType parameter
): Promise<{ isFull: boolean; currentCount: number; capacity: number; error?: string }> => {
  try {
    console.log('[GroupTrainingCalendarAPI] Checking session capacity...', { sessionDate, startTime, endTime, trainer, room, groupType });

    // Get all sessions for this time/room WITH SAME GROUP TYPE
    let sessionsQuery = supabase
      .from('group_sessions')
      .select(`
        id,
        group_type,
        personal_training_schedules!group_sessions_program_id_fkey(
          group_room_size
        )
      `)
      .eq('session_date', sessionDate)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .eq('trainer', trainer)
      .eq('room', room)
      .eq('is_active', true);

    // ΕΛΕΓΧΟΣ ΜΟΝΟ ΓΙΑ ΤΗΝ ΙΔΙΑ ΧΩΡΗΤΙΚΟΤΗΤΑ αν δοθεί groupType
    if (groupType) {
      sessionsQuery = sessionsQuery.eq('group_type', groupType);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('[GroupTrainingCalendarAPI] Error checking capacity:', sessionsError);
      return { isFull: false, currentCount: 0, capacity: 0, error: sessionsError.message };
    }

    if (!sessions || sessions.length === 0) {
      return { isFull: false, currentCount: 0, capacity: 6 }; // Default capacity
    }

    // Get capacity from first session (all should have same capacity for same time/room)
    const capacity = sessions[0].personal_training_schedules?.group_room_size || 6;
    
    // Count current participants
    const sessionIds = sessions.map(s => s.id);
    const { data: bookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select('id')
      .in('session_id', sessionIds)
      .eq('status', 'booked');

    if (bookingsError) {
      console.error('[GroupTrainingCalendarAPI] Error checking bookings:', bookingsError);
      return { isFull: false, currentCount: 0, capacity, error: bookingsError.message };
    }

    // Count actual participants
    // Each session represents one direct user, plus any bookings
    const directUsersCount = sessions.length; // Each session has one direct user
    const bookingsCount = bookings?.length || 0;
    const currentCount = directUsersCount + bookingsCount;
    const isFull = currentCount >= capacity;
    
    console.log('[GroupTrainingCalendarAPI] Detailed capacity check (SAME GROUP TYPE ONLY):', {
      groupType,
      sessions: sessions.length,
      directUsers: directUsersCount,
      bookings: bookingsCount,
      total: currentCount,
      capacity,
      isFull
    });

    console.log('[GroupTrainingCalendarAPI] Capacity check result:', { currentCount, capacity, isFull });

    return { isFull, currentCount, capacity };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error checking capacity:', error);
    return { isFull: false, currentCount: 0, capacity: 0, error: 'Failed to check capacity' };
  }
};

/**
 * Validate if a new session can be created (capacity check)
 */
export const validateSessionCreation = async (
  sessionDate: string,
  startTime: string,
  endTime: string,
  trainer: string,
  room: string,
  groupType?: number // Προσθήκη groupType parameter
): Promise<{ canCreate: boolean; error?: string; currentCount?: number; capacity?: number }> => {
  try {
    const capacityCheck = await checkSessionCapacity(sessionDate, startTime, endTime, trainer, room, groupType);
    
    if (capacityCheck.error) {
      return { canCreate: false, error: capacityCheck.error };
    }

    if (capacityCheck.isFull) {
      return { 
        canCreate: false, 
        error: `Session is at full capacity (${capacityCheck.currentCount}/${capacityCheck.capacity}). Cannot create new session.`,
        currentCount: capacityCheck.currentCount,
        capacity: capacityCheck.capacity
      };
    }

    return { canCreate: true };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error validating session creation:', error);
    return { canCreate: false, error: 'Failed to validate session creation' };
  }
};

/**
 * Validate if a user can make a booking (capacity check)
 */
export const validateUserBooking = async (
  sessionId: string
): Promise<{ canBook: boolean; error?: string; currentCount?: number; capacity?: number }> => {
  try {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('group_sessions')
      .select(`
        id,
        session_date,
        start_time,
        end_time,
        trainer,
        room,
        personal_training_schedules!group_sessions_program_id_fkey(
          group_room_size
        )
      `)
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return { canBook: false, error: 'Session not found' };
    }

            const capacityCheck = await checkSessionCapacity(
              session.session_date,
              session.start_time,
              session.end_time,
              session.trainer,
              session.room,
              session.group_type // ΠΕΡΑΣΜΑ group_type
            );

    if (capacityCheck.error) {
      return { canBook: false, error: capacityCheck.error };
    }

    if (capacityCheck.isFull) {
      return { 
        canBook: false, 
        error: `Session is at full capacity (${capacityCheck.currentCount}/${capacityCheck.capacity}). Cannot make booking.`,
        currentCount: capacityCheck.currentCount,
        capacity: capacityCheck.capacity
      };
    }

    return { canBook: true };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error validating user booking:', error);
    return { canBook: false, error: 'Failed to validate booking' };
  }
};

/**
 * Validate Individual/Paspartu booking capacity
 * Individual sessions have capacity of 1, Group/Paspartu sessions use group_room_size
 */
export const validateIndividualPaspartuBooking = async (
  sessionDate: string,
  startTime: string,
  trainer: string,
  room: string,
  userId: string,
  scheduleId?: string
): Promise<{ canBook: boolean; error?: string; currentCount?: number; capacity?: number }> => {
  try {
    console.log('[GroupTrainingCalendarAPI] Validating Individual/Paspartu booking...', {
      sessionDate,
      startTime,
      trainer,
      room,
      userId,
      scheduleId
    });

    // Check if there's already a booking for this exact time slot
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select(`
        id,
        user_id,
        schedule_id,
        personal_training_schedules!lesson_bookings_schedule_id_fkey(
          training_type,
          user_type,
          group_room_size
        )
      `)
      .eq('booking_date', sessionDate)
      .eq('booking_time', startTime)
      .eq('trainer_name', trainer)
      .eq('room', room)
      .eq('status', 'booked');

    if (bookingsError) {
      console.error('[GroupTrainingCalendarAPI] Error checking existing Individual/Paspartu bookings:', bookingsError);
      return { canBook: false, error: 'Failed to check existing bookings' };
    }

    // Filter for Individual, Paspartu, and Combination sessions
    const individualPaspartuBookings = existingBookings?.filter(booking => 
      booking.personal_training_schedules?.training_type === 'individual' || 
      booking.personal_training_schedules?.user_type === 'paspartu' ||
      booking.personal_training_schedules?.training_type === 'combination'
    ) || [];

    // Determine capacity based on session type
    let capacity = 1; // Default for Individual sessions
    
    if (individualPaspartuBookings.length > 0) {
      const firstBooking = individualPaspartuBookings[0];
      const isIndividual = firstBooking.personal_training_schedules?.training_type === 'individual';
      const isGroupPaspartu = firstBooking.personal_training_schedules?.training_type === 'group' && 
                             firstBooking.personal_training_schedules?.user_type === 'paspartu';
      const isCombination = firstBooking.personal_training_schedules?.training_type === 'combination';
      
      if (isIndividual) {
        capacity = 1;
      } else if (isGroupPaspartu || isCombination) {
        capacity = firstBooking.personal_training_schedules?.group_room_size || 3;
      }
    } else if (scheduleId) {
      // If no existing bookings, get capacity from the schedule being booked
      const { data: schedule, error: scheduleError } = await supabase
        .from('personal_training_schedules')
        .select('training_type, user_type, group_room_size')
        .eq('id', scheduleId)
        .single();
      
      if (!scheduleError && schedule) {
        if (schedule.training_type === 'individual') {
          capacity = 1;
        } else if ((schedule.training_type === 'group' && schedule.user_type === 'paspartu') ||
                   schedule.training_type === 'combination') {
          capacity = schedule.group_room_size || 3;
        }
      }
    }

    const currentCount = individualPaspartuBookings.length;
    const isFull = currentCount >= capacity;

    console.log('[GroupTrainingCalendarAPI] Individual/Paspartu capacity check:', {
      currentCount,
      capacity,
      isFull,
      existingBookings: individualPaspartuBookings.length,
      scheduleId
    });

    if (isFull) {
      return { 
        canBook: false, 
        error: 'This session is already full. Please choose another available time slot.',
        currentCount,
        capacity
      };
    }

    return { canBook: true, currentCount, capacity };

  } catch (error) {
    console.error('[GroupTrainingCalendarAPI] Error validating Individual/Paspartu booking:', error);
    return { canBook: false, error: 'Failed to validate Individual/Paspartu booking' };
  }
};
