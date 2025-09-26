/**
 * User Booking Display API
 * Provides room and occupancy information for user's Personal Training bookings
 * Safe read-only operations for display purposes only
 */

import { supabase } from '@/config/supabase';

export interface UserBookingWithRoomData {
  id: string;
  session_id: string;
  booking_date: string;
  booking_time: string;
  trainer_name: string;
  room: string | null;
  status: string;
  
  // Room and occupancy data
  room_name: string | null;
  participants_count: number;
  capacity: number;
  session_type: 'individual' | 'group-paspartu' | 'group-personal';
  
  // User info
  user_name: string;
  user_email: string;
}

/**
 * Fetch user's bookings with room and occupancy information
 * Only shows bookings the user has made - no admin or other user data
 */
export const getUserBookingsWithRoomData = async (
  userId: string,
  scheduleId?: string
): Promise<UserBookingWithRoomData[]> => {
  try {
    console.log('[UserBookingDisplayAPI] Fetching user bookings with room data...', { userId, scheduleId });

    // Build query for user's bookings
    let query = supabase
      .from('lesson_bookings')
      .select(`
        id,
        session_id,
        booking_date,
        booking_time,
        trainer_name,
        room,
        status,
        schedule_id,
        user_profiles!lesson_bookings_user_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        personal_training_schedules!lesson_bookings_schedule_id_fkey(
          training_type,
          user_type,
          group_room_size
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'booked')
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    // Filter by schedule if provided
    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }

    const { data: userBookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('[UserBookingDisplayAPI] Error fetching user bookings:', bookingsError);
      return [];
    }

    if (!userBookings || userBookings.length === 0) {
      console.log('[UserBookingDisplayAPI] No bookings found for user');
      return [];
    }

    console.log('[UserBookingDisplayAPI] Found user bookings:', userBookings.length);

    // Process each booking to get room and occupancy data
    const bookingsWithRoomData: UserBookingWithRoomData[] = [];

    for (const booking of userBookings) {
      try {
        // Determine session type
        const isIndividual = booking.personal_training_schedules?.training_type === 'individual';
        const isGroupPaspartu = booking.personal_training_schedules?.training_type === 'group' && 
                               booking.personal_training_schedules?.user_type === 'paspartu';
        const isGroupPersonal = booking.personal_training_schedules?.training_type === 'group' && 
                               booking.personal_training_schedules?.user_type === 'personal';

        let sessionType: 'individual' | 'group-paspartu' | 'group-personal';
        let capacity: number;

        if (isIndividual) {
          sessionType = 'individual';
          capacity = 1;
        } else if (isGroupPaspartu) {
          sessionType = 'group-paspartu';
          capacity = booking.personal_training_schedules?.group_room_size || 3;
        } else if (isGroupPersonal) {
          sessionType = 'group-personal';
          capacity = booking.personal_training_schedules?.group_room_size || 3;
        } else {
          // Skip unknown session types
          continue;
        }

        // For Group sessions, we need to get the actual capacity from group_sessions table
        if (sessionType === 'group-paspartu' || sessionType === 'group-personal') {
          try {
            // Find corresponding group_session to get actual capacity
            const { data: correspondingSession, error: sessionError } = await supabase
              .from('group_sessions')
              .select('group_type')
              .eq('session_date', booking.booking_date)
              .eq('start_time', booking.booking_time)
              .eq('trainer', booking.trainer_name)
              .eq('room', booking.room)
              .eq('is_active', true)
              .limit(1)
              .single();

            if (!sessionError && correspondingSession) {
              capacity = correspondingSession.group_type || capacity;
              console.log('[UserBookingDisplayAPI] Found corresponding session, using capacity:', capacity);
            }
          } catch (sessionError) {
            console.log('[UserBookingDisplayAPI] No corresponding session found, using fallback capacity:', capacity);
          }
        }

        // Count total participants for this time slot
        const { data: allBookings, error: countError } = await supabase
          .from('lesson_bookings')
          .select('id')
          .eq('booking_date', booking.booking_date)
          .eq('booking_time', booking.booking_time)
          .eq('trainer_name', booking.trainer_name)
          .eq('room', booking.room)
          .eq('status', 'booked');

        let participantsCount = 1; // At least this user
        if (!countError && allBookings) {
          participantsCount = allBookings.length;
        }

        // For group sessions, also count direct participants from group_sessions
        if (sessionType === 'group-paspartu' || sessionType === 'group-personal') {
          const { data: groupSessionParticipants, error: groupError } = await supabase
            .from('group_sessions')
            .select('id')
            .eq('session_date', booking.booking_date)
            .eq('start_time', booking.booking_time)
            .eq('trainer', booking.trainer_name)
            .eq('room', booking.room)
            .eq('is_active', true);

          if (!groupError && groupSessionParticipants) {
            participantsCount += groupSessionParticipants.length;
          }
        }

        const bookingWithRoomData: UserBookingWithRoomData = {
          id: booking.id,
          session_id: booking.session_id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          trainer_name: booking.trainer_name,
          room: booking.room,
          status: booking.status,
          
          // Room and occupancy data
          room_name: booking.room || null,
          participants_count: participantsCount,
          capacity: capacity,
          session_type: sessionType,
          
          // User info
          user_name: `${booking.user_profiles?.first_name || ''} ${booking.user_profiles?.last_name || ''}`.trim(),
          user_email: booking.user_profiles?.email || ''
        };

        bookingsWithRoomData.push(bookingWithRoomData);

        console.log('[UserBookingDisplayAPI] Processed booking:', {
          id: booking.id,
          date: booking.booking_date,
          time: booking.booking_time,
          room: booking.room,
          sessionType,
          capacity,
          participantsCount
        });

      } catch (error) {
        console.error('[UserBookingDisplayAPI] Error processing booking:', booking.id, error);
        // Continue with other bookings
      }
    }

    console.log('[UserBookingDisplayAPI] Processed bookings with room data:', bookingsWithRoomData.length);
    return bookingsWithRoomData;

  } catch (error) {
    console.error('[UserBookingDisplayAPI] Error fetching user bookings with room data:', error);
    return [];
  }
};

/**
 * Get occupancy information for a specific session
 * Safe read-only function for display purposes
 */
export const getSessionOccupancyInfo = async (
  sessionDate: string,
  sessionTime: string,
  trainer: string,
  room: string
): Promise<{ participants_count: number; capacity: number; room_name: string | null }> => {
  try {
    // Count bookings for this session
    const { data: bookings, error: bookingsError } = await supabase
      .from('lesson_bookings')
      .select('id')
      .eq('booking_date', sessionDate)
      .eq('booking_time', sessionTime)
      .eq('trainer_name', trainer)
      .eq('room', room)
      .eq('status', 'booked');

    // Count group session participants
    const { data: groupSessions, error: groupError } = await supabase
      .from('group_sessions')
      .select('id, group_type')
      .eq('session_date', sessionDate)
      .eq('start_time', sessionTime)
      .eq('trainer', trainer)
      .eq('room', room)
      .eq('is_active', true);

    let participantsCount = (bookings?.length || 0) + (groupSessions?.length || 0);
    let capacity = 3; // Default capacity
    
    // Get actual capacity from group_sessions if available
    if (groupSessions && groupSessions.length > 0) {
      capacity = groupSessions[0].group_type || 3;
    }

    return {
      participants_count: participantsCount,
      capacity: capacity,
      room_name: room
    };

  } catch (error) {
    console.error('[UserBookingDisplayAPI] Error getting session occupancy:', error);
    return {
      participants_count: 0,
      capacity: 0,
      room_name: room
    };
  }
};
