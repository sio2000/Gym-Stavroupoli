import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Dumbbell,
  Zap,
  Target,
  MessageSquare,
  Users,
  MapPin,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PersonalTrainingSchedule,
  GroupAssignment
} from '@/types';
import { getUserGroupAssignments, getDayName, formatTime } from '@/utils/groupAssignmentApi';
import { getUserGroupSessions } from '@/utils/groupSessionsApi';
import { getUserBookingsWithRoomData, UserBookingWithRoomData } from '@/utils/userBookingDisplayApi';

const PersonalTrainingSchedulePage: React.FC = () => {
  console.log('[PersonalTrainingSchedule] Component rendering');
  const { user } = useAuth();
  console.log('[PersonalTrainingSchedule] User from useAuth:', user?.email, 'ID:', user?.id);
  const [schedule, setSchedule] = useState<PersonalTrainingSchedule | null>(null);
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Protection against multiple calls
  const hasLoadedRef = useRef(false); // Prevent multiple loads for same user
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  // Paspartu state
  const [lessonDeposit, setLessonDeposit] = useState<{ total_lessons: number; used_lessons: number; remaining_lessons: number } | null>(null);
  const [existingBookings, setExistingBookings] = useState<Record<string, any>>({}); // key: sessionId
  
  // Room and occupancy data for user bookings
  const [userBookingsWithRoom, setUserBookingsWithRoom] = useState<UserBookingWithRoomData[]>([]);
  const [showRoomAndCapacity, setShowRoomAndCapacity] = useState(true); // Feature flag

  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];


  useEffect(() => {
    console.log('[PersonalTrainingSchedule] ===== USEEFFECT TRIGGERED =====');
    console.log('[PersonalTrainingSchedule] User:', user?.email, 'ID:', user?.id);
    console.log('[PersonalTrainingSchedule] User object:', user);
    console.log('[PersonalTrainingSchedule] hasLoadedRef.current:', hasLoadedRef.current);
    console.log('[PersonalTrainingSchedule] isLoading:', isLoading);
    console.log('[PersonalTrainingSchedule] loading state:', loading);
    
    // Clear any existing timeout
    if (loadTimeout) {
      console.log('[PersonalTrainingSchedule] Clearing existing timeout');
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
    
    // Περιμένουμε να υπάρχει user πριν τη φόρτωση
    if (!user) {
      console.log('[PersonalTrainingSchedule] No user, resetting hasLoadedRef and stopping loading');
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }
    
    // Prevent multiple loads for the same user
    if (hasLoadedRef.current) {
      console.log('[PersonalTrainingSchedule] Already loaded for this user, skipping');
      return;
    }
    
    console.log('[PersonalTrainingSchedule] Starting load for user:', user.email);
    hasLoadedRef.current = true;
    loadPersonalTrainingSchedule();
    
    // Set a timeout to prevent infinite loading
    console.log('[PersonalTrainingSchedule] Setting 10 second timeout');
    const timeout = setTimeout(() => {
      console.warn('[PersonalTrainingSchedule] Load timeout reached, stopping loading');
      setLoading(false);
      setIsLoading(false);
    }, 10000); // 10 seconds timeout
    
    setLoadTimeout(timeout);
    
    return () => {
      console.log('[PersonalTrainingSchedule] useEffect cleanup');
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [user]);

  const loadPersonalTrainingSchedule = async () => {
    console.log('[PersonalTrainingSchedule] ===== LOADING STARTED =====');
    console.log('[PersonalTrainingSchedule] User ID:', user?.id);
    console.log('[PersonalTrainingSchedule] User email:', user?.email);
    
    // Protection against multiple concurrent calls
    if (isLoading) {
      console.log('[PersonalTrainingSchedule] Already loading, skipping...');
      return;
    }

    setIsLoading(true);
    
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('[PersonalTrainingSchedule] No user ID found');
        toast.error('Δεν βρέθηκε χρήστης. Κάντε επανασύνδεση.');
        setSchedule(null);
        return;
      }

      console.log('[PersonalTrainingSchedule] Querying personal_training_schedules...');
      
      // Optimized query - only select necessary fields including group information
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('id,user_id,month,year,schedule_data,status,created_by,created_at,updated_at,trainer_name,accepted_at,declined_at,training_type,group_room_size,weekly_frequency,user_type,is_flexible')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[PersonalTrainingSchedule] Query result - data:', data, 'error:', error);

      if (error) {
        console.error('[PersonalTrainingSchedule] Query error:', error);
        toast.error(`Σφάλμα βάσης δεδομένων: ${error.message}`);
        setSchedule(null);
        return;
      }

      if (data && data.length > 0) {
        console.log('[PersonalTrainingSchedule] Found schedule data:', data[0]);
        const row = data[0];
        
        const loaded: PersonalTrainingSchedule = {
          id: row.id,
          userId: row.user_id,
          month: row.month,
          year: row.year,
          scheduleData: row.schedule_data,
          status: row.status,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          acceptedAt: row.accepted_at,
          declinedAt: row.declined_at,
          trainingType: row.training_type,
          groupRoomSize: row.group_room_size,
          weeklyFrequency: row.weekly_frequency,
          userType: row.user_type,
          isFlexible: row.is_flexible
        };
        
        console.log('[PersonalTrainingSchedule] Loaded schedule:', loaded);
        console.log('[PersonalTrainingSchedule] Schedule details for combination check:', {
          trainingType: loaded.trainingType,
          userType: loaded.userType,
          id: loaded.id,
          status: loaded.status,
          fullObject: loaded
        });
        
        // Load group assignments if this is a group training
        if (loaded.trainingType === 'group') {
          try {
            const assignments = await getUserGroupAssignments(user.id, loaded.id);
            setGroupAssignments(assignments);
            console.log('[PersonalTrainingSchedule] Loaded group assignments:', assignments);
          } catch (error) {
            console.error('[PersonalTrainingSchedule] Error loading group assignments:', error);
            // Don't show error to user as this is optional data
          }
        }
        
        // Load group sessions for both combination and pure group programs
        console.log('[PersonalTrainingSchedule] Checking group sessions condition...', { 
          trainingType: loaded.trainingType, 
          userType: loaded.userType,
          isGroup: loaded.trainingType === 'group',
          isCombination: loaded.trainingType === 'combination',
          isPersonal: loaded.userType === 'personal',
          isCombinationProgram: loaded.trainingType === 'combination' && loaded.userType === 'personal',
          isPureGroupProgram: loaded.trainingType === 'group'
        });
        
        // Load group sessions for both combination programs AND pure group programs
        if ((loaded.trainingType === 'combination' && loaded.userType === 'personal') || 
            (loaded.trainingType === 'group')) {
          try {
            console.log('[PersonalTrainingSchedule] Loading group sessions...', { 
              userId: user.id, 
              programId: loaded.id,
              programType: loaded.trainingType,
              userType: loaded.userType
            });
            const sessions = await getUserGroupSessions(user.id, loaded.id);
            setGroupSessions(sessions);
            console.log('[PersonalTrainingSchedule] Loaded group sessions:', sessions);
            console.log('[PersonalTrainingSchedule] Group sessions count:', sessions.length);
          } catch (error) {
            console.error('[PersonalTrainingSchedule] Error loading group sessions:', error);
            // Don't show error to user as this is optional data
          }
        } else {
          console.log('[PersonalTrainingSchedule] Not a group or combination program, skipping group sessions load');
        }
        
        // Auto-accept any pending schedule for this user
        if (loaded.status === 'pending') {
          try {
            const nowIso = new Date().toISOString();
            const { error: acceptError } = await supabase
              .from('personal_training_schedules')
              .update({ status: 'accepted', accepted_at: nowIso, updated_at: nowIso })
              .eq('id', loaded.id);
            if (acceptError) {
              console.error('[PersonalTrainingSchedule] Auto-accept update error:', acceptError);
            } else {
              loaded.status = 'accepted';
              loaded.acceptedAt = nowIso;
              loaded.updatedAt = nowIso;
            }
          } catch (e) {
            console.error('[PersonalTrainingSchedule] Auto-accept exception:', e);
          }
        }
        setSchedule(loaded);
        // Αν είναι Paspartu, φόρτωσε καταθέσεις/κρατήσεις
        if (loaded.userType === 'paspartu') {
          await loadPaspartuBookingContext(user.id, loaded.id);
        }
        
        // Load room and occupancy data for user's bookings (Group→Personal and Group→Paspartu)
        if (showRoomAndCapacity && (loaded.trainingType === 'group' || 
            (loaded.trainingType === 'combination' && loaded.userType === 'paspartu'))) {
          await loadUserBookingsWithRoomData(user.id, loaded.id);
        }
      } else {
        console.log('[PersonalTrainingSchedule] No schedule found for user');
        setSchedule(null);
      }
    } catch (error) {
      console.error('[PersonalTrainingSchedule] Exception while loading schedule:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
      setSchedule(null);
    } finally {
      console.log('[PersonalTrainingSchedule] ===== LOADING COMPLETED =====');
      setLoading(false);
      setIsLoading(false);
      
      // Clear timeout since loading completed
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
    }
  };

  const loadUserBookingsWithRoomData = async (userId: string, scheduleId: string) => {
    try {
      console.log('[PersonalTrainingSchedule] Loading user bookings with room data...');
      const bookingsWithRoom = await getUserBookingsWithRoomData(userId, scheduleId);
      setUserBookingsWithRoom(bookingsWithRoom);
      console.log('[PersonalTrainingSchedule] Loaded bookings with room data:', bookingsWithRoom.length);
    } catch (error) {
      console.error('[PersonalTrainingSchedule] Error loading bookings with room data:', error);
      // Don't show error to user as this is optional display data
    }
  };

  const loadPaspartuBookingContext = async (userId: string, scheduleId: string) => {
    try {
      // Φόρτωση υπολοίπου μαθημάτων
      let { data: depositData, error: depositError } = await supabase
        .from('lesson_deposits')
        .select('total_lessons, used_lessons, remaining_lessons')
        .eq('user_id', userId)
        .single();
      if (depositError || !depositData) {
        // Αν δεν υπάρχει deposit, αρχικοποίησέ το σε 5 όπως παλιά
        try {
          await supabase.rpc('reset_lesson_deposit_for_new_program', { p_user_id: userId, p_total_lessons: 5, p_created_by: userId });
        } catch (e) {
          console.warn('[PersonalTrainingSchedule] RPC reset_lesson_deposit_for_new_program failed or not available', e);
        }
        const retry = await supabase
          .from('lesson_deposits')
          .select('total_lessons, used_lessons, remaining_lessons')
          .eq('user_id', userId)
          .single();
        depositData = retry.data as any;
      }
      if (depositData) setLessonDeposit(depositData as any);

      // Φόρτωση υπαρχουσών κρατήσεων για αυτό το πρόγραμμα
      const { data: bookings, error: bookingsError } = await supabase
        .from('lesson_bookings')
        .select('id, session_id, status')
        .eq('user_id', userId)
        .eq('schedule_id', scheduleId)
        .in('status', ['booked', 'completed']);
      if (!bookingsError && bookings) {
        const map: Record<string, any> = {};
        bookings.forEach((b: any) => { map[b.session_id] = b; });
        setExistingBookings(map);
      }
    } catch (e) {
      console.error('[PersonalTrainingSchedule] Paspartu context load error:', e);
    }
  };

  const fetchDepositDirect = async (userId: string) => {
    const { data } = await supabase
      .from('lesson_deposits')
      .select('total_lessons, used_lessons, remaining_lessons')
      .eq('user_id', userId)
      .single();
    return data as any | null;
  };

  const canBookMorePaspartu = () => {
    if (!lessonDeposit) return false;
    return (lessonDeposit.remaining_lessons || 0) > 0;
  };

  // Helper function to get room and occupancy info for a session
  const getSessionRoomInfo = (session: any) => {
    if (!showRoomAndCapacity) return null;
    
    // Find the corresponding booking with room data
    const bookingWithRoom = userBookingsWithRoom.find(booking => 
      booking.session_id === session.id ||
      (booking.booking_date === session.date && 
       booking.booking_time === session.startTime + ':00' &&
       booking.trainer_name === session.trainer)
    );
    
    return bookingWithRoom;
  };

  const handleBookPaspartuSession = async (session: any) => {
    if (!user?.id || !schedule) return;
    if (!canBookMorePaspartu()) {
      toast.error('Δεν έχετε διαθέσιμα μαθήματα (Paspartu).');
      return;
    }
    if (existingBookings[session.id]) {
      toast('Έχει ήδη γίνει κράτηση για αυτή τη σεσία.');
      return;
    }
    try {
      setIsLoading(true);
      
      // Import capacity validation function
      const { validateIndividualPaspartuBooking } = await import('@/utils/groupTrainingCalendarApi');
      
      // Validate capacity before booking
      const capacityCheck = await validateIndividualPaspartuBooking(
        session.date,
        session.startTime + ':00',
        session.trainer,
        session.room || 'Αίθουσα Mike',
        user.id,
        schedule.id
      );
      
      if (!capacityCheck.canBook) {
        toast.error(capacityCheck.error || 'This session is already full. Please choose another available time slot.');
        return;
      }
      
      const beforeDeposit = await fetchDepositDirect(user.id);
      const beforeRemaining = beforeDeposit?.remaining_lessons ?? null;
      const { error } = await supabase
        .from('lesson_bookings')
        .insert({
          user_id: user.id,
          schedule_id: schedule.id,
          session_id: session.id,
          booking_date: session.date, // YYYY-MM-DD
          booking_time: session.startTime + ':00', // HH:mm:ss
          trainer_name: session.trainer,
          room: session.room || null,
          status: 'booked'
        });
      if (error) throw error;
      // Έλεγχος ενημέρωσης από trigger
      const afterDeposit = await fetchDepositDirect(user.id);
      const afterRemaining = afterDeposit?.remaining_lessons ?? null;
      if (beforeRemaining !== null && afterRemaining !== null && beforeRemaining === afterRemaining) {
        // Fallback μέσω RPC (SECURITY DEFINER), όπως στο παλιό σύστημα
        const nextUsed = (beforeDeposit?.used_lessons || 0) + 1;
        const { error: rpcErr } = await supabase.rpc('update_lesson_deposit_manual', {
          p_user_id: user.id,
          p_used_lessons: nextUsed
        });
        if (rpcErr) {
          console.warn('[PersonalTrainingSchedule] RPC manual deposit update failed:', rpcErr);
        }
      }
      // Τελική ανανέωση context
      await loadPaspartuBookingContext(user.id, schedule.id);
      
      // Reload room and occupancy data after booking
      if (showRoomAndCapacity) {
        await loadUserBookingsWithRoomData(user.id, schedule.id);
      }
      
      toast.success('Η κράτηση καταχωρήθηκε!');
    } catch (e) {
      console.error('[PersonalTrainingSchedule] Book paspartu error:', e);
      toast.error('Σφάλμα κατά την κράτηση.');
    } finally {
      setIsLoading(false);
    }
  };

  // Δεν υποστηρίζεται ακύρωση για Paspartu πλέον

  const handleAcceptSchedule = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      console.log('[PTS] Accepting schedule:', schedule.id);
      
      const acceptedAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('personal_training_schedules')
        .update({ 
          status: 'accepted', 
          accepted_at: acceptedAt, 
          updated_at: updatedAt 
        })
        .eq('id', schedule.id);
        
      if (error) {
        console.error('[PTS] Accept error:', error);
        throw error;
      }
      
      console.log('[PTS] Schedule accepted successfully');
      await loadPersonalTrainingSchedule();
      toast.success('Το πρόγραμμα έγινε αποδεκτό!');
    } catch (error) {
      console.error('[PTS] Accept error:', error);
      toast.error('Σφάλμα κατά την αποδοχή του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineSchedule = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      console.log('[PTS] Declining schedule:', schedule.id);
      
      const declinedAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('personal_training_schedules')
        .update({ 
          status: 'declined', 
          declined_at: declinedAt, 
          updated_at: updatedAt 
        })
        .eq('id', schedule.id);
        
      if (error) {
        console.error('[PTS] Decline error:', error);
        throw error;
      }
      
      console.log('[PTS] Schedule declined successfully');
      await loadPersonalTrainingSchedule();
      setShowDeclineMessage(true);
      toast.success('Το πρόγραμμα απορρίφθηκε. Θα επικοινωνήσουμε μαζί σας για να βρούμε τις κατάλληλες ώρες.');
    } catch (error) {
      console.error('[PTS] Decline error:', error);
      toast.error('Σφάλμα κατά την απόρριψη του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <Dumbbell className="h-5 w-5 text-blue-600" />;
      case 'kickboxing':
        return <Zap className="h-5 w-5 text-red-600" />;
      case 'combo':
        return <Target className="h-5 w-5 text-green-600" />;
      default:
        return <Dumbbell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSessionTypeName = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal Training';
      case 'kickboxing':
        return 'Kick Boxing';
      case 'combo':
        return 'Combo Training';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Εκκρεμεί Απόφαση';
      case 'accepted':
        return 'Αποδεκτό';
      case 'declined':
        return 'Απορρίφθηκε';
      default:
        return status;
    }
  };

  // Ασφαλής μορφοποίηση ημερομηνιών ώστε να αποφεύγεται η απόκλιση -1 ημέρας λόγω timezones
  const parseDateAsLocal = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    // Αν είναι καθαρό YYYY-MM-DD, φτιάξε τοπική ημερομηνία (με ώρα 12:00 για αποφυγή DST edge cases)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    // Αν είναι ISO με ώρα ή ζώνη, πάρε μόνο το ημερολογιακό μέρος
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const [y, m, d] = match[1].split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    // Fallback
    return new Date(dateStr);
  };

  const formatDateEl = (dateStr: string) => {
    const d = parseDateAsLocal(dateStr);
    return d.toLocaleDateString('el-GR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  console.log('[PersonalTrainingSchedule] Rendering - loading:', loading, 'user:', user?.email, 'schedule:', !!schedule);

  if (loading) {
    console.log('[PersonalTrainingSchedule] Rendering loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση προγράμματος...</p>
          <p className="text-sm text-gray-500 mt-2">User: {user?.email || 'No user'}</p>
          <p className="text-xs text-gray-400 mt-1">Loading state: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Δεν βρέθηκε πρόγραμμα</h2>
          <p className="text-gray-600">Δεν υπάρχει διαθέσιμο πρόγραμμα Personal Training για εσάς.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Πρόγραμμα Personal Training
                {schedule.trainingType === 'group' && schedule.userType === 'paspartu' && (
                  <span className="ml-2 text-lg text-blue-600">
                    (Ομαδικό - {schedule.groupRoomSize} άτομα)
                  </span>
                )}
                {schedule.trainingType === 'combination' && schedule.userType === 'personal' && (
                  <span className="ml-2 text-lg text-blue-600">
                    (Ομαδικό)
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {days[schedule.month - 1]} {schedule.year}
                {schedule.trainingType === 'group' && schedule.weeklyFrequency && (
                  <span className="ml-2 text-blue-600">
                    • {schedule.weeklyFrequency} φορές/εβδομάδα
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {schedule.trainingType === 'group' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  👥 Group Training
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status)}`}>
                {getStatusText(schedule.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Group Assignments - For pure Group Training */}
        {schedule.trainingType === 'group' &&
         groupAssignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Οι Ομαδικές σας Θέσεις
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-blue-900">
                        {getDayName(assignment.dayOfWeek)}
                      </h3>
                      <p className="text-sm text-blue-700">
                        {formatTime(assignment.startTime)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      👥 {assignment.groupType} άτομα
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Προπονητής: {assignment.trainer}
                    </div>
                    {assignment.room && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {assignment.room}
                      </div>
                    )}
                  </div>
                  
                  {assignment.notes && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded p-2">
                      💬 {assignment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Sessions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {schedule.trainingType === 'combination' && schedule.userType === 'personal' 
              ? '📅 Προγραμματισμένες Σεσίες' 
              : 'Προγραμματισμένες Σεσίες'
            }
          </h2>
          
          {/* Για combination/personal (Συνδυασμός): εμφάνιση και group και individual sessions */}
          {schedule.trainingType === 'combination' && schedule.userType === 'personal' ? (
            <>
              {/* Ομαδικές Σεσίες */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  Ομαδικές Σεσίες ({groupSessions.length})
                </h3>
                {groupSessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Δεν υπάρχουν ομαδικές σεσίες για αυτό το πρόγραμμα.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupSessions.map((session) => (
                      <div key={session.id} className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                Ομαδική Σεσίες
                              </h4>
                              <span className="text-sm text-gray-500">
                                {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateEl(session.session_date)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{session.trainer}</span>
                              </div>
                              {session.room && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>📍</span>
                                  <span>{session.room}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <BookOpen className="h-4 w-4" />
                                <span>Προγραμματισμένη</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ατομικές Σεσίες */}
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <Dumbbell className="h-4 w-4 mr-2 text-green-600" />
                  Ατομικές Σεσίες
                </h3>
                {schedule.scheduleData.sessions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Δεν υπάρχουν ατομικές σεσίες για αυτό το πρόγραμμα.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedule.scheduleData.sessions.map((session) => (
                      <div key={session.id} className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {getSessionIcon(session.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                {getSessionTypeName(session.type)}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {session.startTime}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateEl(session.date)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{session.trainer}</span>
                              </div>
                              {session.room && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>📍</span>
                                  <span>{session.room}</span>
                                </div>
                              )}
                              {session.notes && (
                                <div className="flex items-start space-x-2 text-sm text-gray-600 mt-2">
                                  <MessageSquare className="h-4 w-4 mt-0.5" />
                                  <span>{session.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : schedule.userType === 'paspartu' ? (
            // Paspartu: οι σεσίες είναι προτάσεις για κράτηση (μέχρι 5 μαθήματα)
            schedule.scheduleData.sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Δεν υπάρχουν προτάσεις σεσιών από τον προπονητή.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonDeposit && (
                  <div className="mb-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    Υπόλοιπο Paspartu: <strong>{lessonDeposit.remaining_lessons}</strong> από {lessonDeposit.total_lessons}
                  </div>
                )}
                {schedule.scheduleData.sessions.map((session) => {
                  const booked = !!existingBookings[session.id];
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getSessionIcon(session.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">
                              {getSessionTypeName(session.type)}
                              <span className="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Πρόταση για κράτηση</span>
                            </h3>
                            <span className="text-sm text-gray-500">
                              {session.startTime}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDateEl(session.date)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{session.trainer}</span>
                            </div>
                            {session.room && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>📍</span>
                                <span>{session.room}</span>
                              </div>
                            )}
                            {/* Show group capacity for all Group sessions (Personal and Paspartu) */}
                            {showRoomAndCapacity && (schedule.trainingType === 'group') && (
                              <div className="flex items-center space-x-2 text-sm text-purple-600">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">
                                  Ομαδικό μάθημα: {schedule.groupRoomSize || 3} άτομα
                                </span>
                              </div>
                            )}
                            {booked && showRoomAndCapacity && (() => {
                              const roomInfo = getSessionRoomInfo(session);
                              if (roomInfo) {
                                return (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                                      <MapPin className="h-4 w-4" />
                                      <span className="font-medium">
                                        Room: {roomInfo.room_name || 'Not assigned yet'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-green-600">
                                      <Users className="h-4 w-4" />
                                      <span className="font-medium">
                                        Participants: {roomInfo.participants_count}/{roomInfo.capacity}
                                      </span>
                                      {roomInfo.participants_count >= roomInfo.capacity && (
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                          Full
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end space-x-2">
                        {!booked ? (
                          <button
                            disabled={!canBookMorePaspartu() || isLoading}
                            onClick={() => handleBookPaspartuSession(session)}
                            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${canBookMorePaspartu() && !isLoading ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}
                          >
                            Κράτηση
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded-lg text-sm font-bold bg-green-100 text-green-800">Κλείστηκε</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : schedule.scheduleData.sessions.length === 0 && groupSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Δεν υπάρχουν προγραμματισμένες σεσίες</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group Sessions for pure Group programs */}
              {schedule.trainingType === 'group' && groupSessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Ομαδικές Σεσίες ({groupSessions.length})
                  </h3>
                  <div className="space-y-3">
                    {groupSessions.map((session) => (
                      <div key={session.id} className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                Ομαδική Σεσίες
                              </h4>
                              <span className="text-sm text-gray-500">
                                {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateEl(session.session_date)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{session.trainer}</span>
                              </div>
                              {session.room && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>📍</span>
                                  <span>{session.room}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <BookOpen className="h-4 w-4" />
                                <span>Προγραμματισμένη</span>
                              </div>
                              {/* Show group capacity for all Group sessions */}
                              {showRoomAndCapacity && (
                                <div className="flex items-center space-x-2 text-sm text-purple-600">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">
                                    Ομαδικό μάθημα: {session.group_type || schedule.groupRoomSize || 3} άτομα
                                  </span>
                                </div>
                              )}
                              {showRoomAndCapacity && (() => {
                                // For group sessions, find room info based on session data
                                const roomInfo = userBookingsWithRoom.find(booking => 
                                  booking.booking_date === session.session_date && 
                                  booking.booking_time === session.start_time &&
                                  booking.trainer_name === session.trainer &&
                                  booking.room === session.room
                                );
                                
                                if (roomInfo) {
                                  return (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center space-x-2 text-sm text-blue-600">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium">
                                          Room: {roomInfo.room_name || 'Not assigned yet'}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm text-green-600">
                                        <Users className="h-4 w-4" />
                                        <span className="font-medium">
                                          Participants: {roomInfo.participants_count}/{roomInfo.capacity}
                                        </span>
                                        {roomInfo.participants_count >= roomInfo.capacity && (
                                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                            Full
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Individual Sessions */}
              {schedule.scheduleData.sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getSessionIcon(session.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {getSessionTypeName(session.type)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {session.startTime}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateEl(session.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{session.trainer}</span>
                        </div>
                        {session.room && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📍</span>
                            <span>{session.room}</span>
                          </div>
                        )}
                        {/* Show group capacity for all Group sessions (Personal and Paspartu) */}
                        {showRoomAndCapacity && (schedule.trainingType === 'group') && (
                          <div className="flex items-center space-x-2 text-sm text-purple-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">
                              Ομαδικό μάθημα: {schedule.groupRoomSize || 3} άτομα
                            </span>
                          </div>
                        )}
                        {session.notes && (
                          <div className="flex items-start space-x-2 text-sm text-gray-600 mt-2">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>{session.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Information */}
        {(schedule.scheduleData.notes || schedule.scheduleData.specialInstructions) && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Πληροφορίες Προγράμματος</h2>
            <div className="space-y-4">
              {schedule.scheduleData.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Σημειώσεις</h3>
                  <p className="text-gray-600">{schedule.scheduleData.notes}</p>
                </div>
              )}
              {schedule.scheduleData.specialInstructions && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ειδικές Οδηγίες</h3>
                  <p className="text-gray-600">{schedule.scheduleData.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons removed: auto-accepted */}

        {/* Status Messages */}
        {schedule.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Πρόγραμμα Αποδεκτό</h3>
                <p className="text-green-700 mt-1">
                  Το πρόγραμμα έχει γίνει αποδεκτό! Θα λάβετε ειδοποιήσεις για τις προπονήσεις σας.
                </p>
              </div>
            </div>
          </div>
        )}

        {schedule.status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Πρόγραμμα Απορριφθέν</h3>
                <p className="text-red-700 mt-1">
                  Παρακαλώ περάστε από το γυμναστήριο για να συζητήσουμε τις ώρες που σας βολεύουν.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decline Message Modal */}
        {showDeclineMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Πρόγραμμα Απορρίφθηκε</h3>
                <p className="text-gray-600 mb-6">
                  Παρακαλώ περάστε από το γυμναστήριο για να συζητήσουμε τις ώρες που σας βολεύουν.
                </p>
                <button
                  onClick={() => setShowDeclineMessage(false)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Κατάλαβα
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalTrainingSchedulePage;
