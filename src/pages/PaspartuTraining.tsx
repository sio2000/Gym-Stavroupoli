import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { 
  Calendar,
  Clock,
  User,
  Dumbbell,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  BookOpen,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PersonalTrainingSchedule,
  LessonDeposit,
  LessonBooking,
  AvailableSlot
} from '@/types';

const PaspartuTrainingPage: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<PersonalTrainingSchedule | null>(null);
  const [deposit, setDeposit] = useState<LessonDeposit | null>(null);
  const [bookings, setBookings] = useState<LessonBooking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

  useEffect(() => {
    if (user?.id) {
      loadPaspartuData();
    }
  }, [user?.id]);

  const loadPaspartuData = async () => {
    try {
      console.log('[PaspartuTraining] ===== LOADING PASPARTU DATA =====');
      console.log('[PaspartuTraining] User ID:', user?.id);
      setLoading(true);
      
      // Load schedule - try different approaches to find the schedule
      console.log('[PaspartuTraining] Querying personal_training_schedules...');
      
      // First, let's check if there are ANY schedules for this user
      const { data: allSchedules, error: allSchedulesError } = await supabase
        .from('personal_training_schedules')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('[PaspartuTraining] All schedules for user:', allSchedules);
      console.log('[PaspartuTraining] All schedules error:', allSchedulesError);

      if (allSchedules && allSchedules.length > 0) {
        console.log('[PaspartuTraining] Found schedules, checking for Paspartu...');
        
        // Look for Paspartu schedule specifically
        const paspartuSchedule = allSchedules.find(s => 
          s.user_type === 'paspartu' && s.is_flexible === true
        );
        
        if (paspartuSchedule) {
          console.log('[PaspartuTraining] Found Paspartu schedule:', paspartuSchedule);
          const schedule: PersonalTrainingSchedule = {
            id: paspartuSchedule.id,
            userId: paspartuSchedule.user_id,
            month: paspartuSchedule.month,
            year: paspartuSchedule.year,
            scheduleData: paspartuSchedule.schedule_data,
            status: paspartuSchedule.status,
            createdBy: paspartuSchedule.created_by,
            createdAt: paspartuSchedule.created_at,
            updatedAt: paspartuSchedule.updated_at,
            acceptedAt: paspartuSchedule.accepted_at,
            declinedAt: paspartuSchedule.declined_at,
            userType: paspartuSchedule.user_type,
            isFlexible: paspartuSchedule.is_flexible
          };
          setSchedule(schedule);
        } else {
          console.log('[PaspartuTraining] No Paspartu schedule found in user schedules');
          // Check if any schedule has the right fields
          allSchedules.forEach((s, index) => {
            console.log(`[PaspartuTraining] Schedule ${index}:`, {
              id: s.id,
              user_type: s.user_type,
              is_flexible: s.is_flexible,
              status: s.status
            });
          });
        }
      } else {
        console.log('[PaspartuTraining] No schedules found for user');
      }

      // Load lesson deposit
      console.log('[PaspartuTraining] Querying lesson_deposits...');
      const { data: depositData, error: depositError } = await supabase
        .from('lesson_deposits')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('[PaspartuTraining] Deposit data:', depositData);
      console.log('[PaspartuTraining] Deposit error:', depositError);

      if (depositError) {
        console.error('Error loading lesson deposit:', depositError);
      } else if (depositData) {
        const deposit: LessonDeposit = {
          id: depositData.id,
          userId: depositData.user_id,
          totalLessons: depositData.total_lessons,
          usedLessons: depositData.used_lessons,
          remainingLessons: depositData.remaining_lessons,
          createdAt: depositData.created_at,
          updatedAt: depositData.updated_at,
          createdBy: depositData.created_by
        };
        console.log('[PaspartuTraining] Setting deposit:', deposit);
        setDeposit(deposit);
      }

      // Load existing bookings
      console.log('[PaspartuTraining] Querying lesson_bookings...');
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('lesson_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: true });

      console.log('[PaspartuTraining] Bookings data:', bookingsData);
      console.log('[PaspartuTraining] Bookings error:', bookingsError);

      if (bookingsError) {
        console.error('Error loading lesson bookings:', bookingsError);
      } else if (bookingsData) {
        const bookings: LessonBooking[] = bookingsData.map(booking => ({
          id: booking.id,
          userId: booking.user_id,
          scheduleId: booking.schedule_id,
          sessionId: booking.session_id,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          trainerName: booking.trainer_name,
          room: booking.room,
          notes: booking.notes,
          status: booking.status,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        }));
        console.log('[PaspartuTraining] Setting bookings:', bookings);
        setBookings(bookings);
      }

    } catch (error) {
      console.error('Error loading Paspartu data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = (schedule: PersonalTrainingSchedule) => {
    if (!schedule?.scheduleData?.sessions) return [];

    const slots: AvailableSlot[] = [];
    const bookedSessionIds = new Set(bookings.map(b => b.sessionId));

    schedule.scheduleData.sessions.forEach(session => {
      const isBooked = bookedSessionIds.has(session.id);
      const booking = bookings.find(b => b.sessionId === session.id);

      slots.push({
        sessionId: session.id,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        type: session.type,
        trainer: session.trainer,
        room: session.room,
        isBooked: isBooked,
        bookingId: booking?.id
      });
    });

    return slots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    if (schedule) {
      const slots = generateAvailableSlots(schedule);
      setAvailableSlots(slots);
    }
  }, [schedule, bookings]);


  const handleBookLesson = async (slot: AvailableSlot) => {
    console.log('[PaspartuTraining] ===== HANDLING BOOK LESSON =====');
    console.log('[PaspartuTraining] Slot:', slot);
    console.log('[PaspartuTraining] Deposit:', deposit);
    console.log('[PaspartuTraining] Schedule:', schedule);
    
    if (!deposit || deposit.remainingLessons <= 0) {
      console.log('[PaspartuTraining] No deposit or no remaining lessons');
      toast.error('Δεν έχετε διαθέσιμα μαθήματα!');
      return;
    }

    if (!schedule) {
      console.log('[PaspartuTraining] No schedule found');
      toast.error('Δεν βρέθηκε πρόγραμμα!');
      return;
    }

    try {
      setBookingLoading(slot.sessionId);

      const bookingPayload = {
        user_id: user?.id,
        schedule_id: schedule.id,
        session_id: slot.sessionId,
        booking_date: slot.date,
        booking_time: slot.startTime,
        trainer_name: slot.trainer,
        room: slot.room,
        status: 'booked'
      };

      console.log('[PaspartuTraining] Creating booking with payload:', bookingPayload);

      // Create lesson booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('lesson_bookings')
        .insert(bookingPayload)
        .select()
        .single();

      console.log('[PaspartuTraining] Booking result - data:', bookingData, 'error:', bookingError);

      if (bookingError) {
        console.error('Error booking lesson:', bookingError);
        toast.error('Σφάλμα κατά την κράτηση του μαθήματος');
        return;
      }

      // Wait a moment for trigger to execute, then check if it worked
      console.log('[PaspartuTraining] Booking created successfully - checking if trigger updated deposit...');
      
      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if deposit was updated by trigger
      const { data: updatedDeposit, error: depositCheckError } = await supabase
        .from('lesson_deposits')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (depositCheckError) {
        console.error('[PaspartuTraining] Error checking deposit after booking:', depositCheckError);
      } else {
        console.log('[PaspartuTraining] Deposit check after booking:', {
          total: updatedDeposit.total_lessons,
          used: updatedDeposit.used_lessons,
          remaining: updatedDeposit.remaining_lessons
        });
        
        // Check if trigger worked
        if (updatedDeposit.used_lessons === deposit.usedLessons) {
          console.warn('[PaspartuTraining] ⚠️ TRIGGER NOT WORKING! Applying manual update...');
          
          // Manual update as fallback using RPC function
          const { data: updatedData, error: manualUpdateError } = await supabase
            .rpc('update_lesson_deposit_manual', {
              p_user_id: user?.id,
              p_used_lessons: deposit.usedLessons + 1
            });

          if (manualUpdateError) {
            console.error('[PaspartuTraining] Manual update failed:', manualUpdateError);
            toast.error('Σφάλμα ενημέρωσης deposit. Επικοινωνήστε με τον διαχειριστή.');
          } else {
            console.log('[PaspartuTraining] ✅ Manual update applied successfully');
          }
        } else {
          console.log('[PaspartuTraining] ✅ TRIGGER WORKING! Deposit updated automatically');
        }
      }

      console.log('[PaspartuTraining] Booking created successfully, reloading data...');
      toast.success(`Κρατήσατε επιτυχώς το μάθημα στις ${new Date(slot.date).toLocaleDateString('el-GR')} στις ${slot.startTime}! Το μάθημα αφαιρέθηκε από το deposit σας.`);
      
      // Reload data to update the UI
      await loadPaspartuData();

    } catch (error) {
      console.error('Error booking lesson:', error);
      toast.error('Σφάλμα κατά την κράτηση του μαθήματος');
    } finally {
      setBookingLoading(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση προγράμματος Paspartu...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Δεν βρέθηκε πρόγραμμα Paspartu</h2>
          <p className="text-gray-600">Δεν υπάρχει διαθέσιμο πρόγραμμα Paspartu Training για εσάς.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">🎯 Paspartu Training</h1>
              <p className="text-gray-600 mt-1">
                {days[schedule.month - 1]} {schedule.year}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium text-green-800">Ενεργό Πρόγραμμα</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Deposit Status */}
        {deposit && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Υπόλοιπο Μαθημάτων</h3>
                  <p className="text-blue-700">Διαθέσιμα μαθήματα για κράτηση</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-900">
                  {deposit.remainingLessons}
                </div>
                <div className="text-sm text-blue-600">
                  από {deposit.totalLessons} συνολικά
                </div>
              </div>
            </div>
            {deposit.remainingLessons === 0 && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Δεν έχετε διαθέσιμα μαθήματα. Επικοινωνήστε με τον διαχειριστή για επαναφόρτωση.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Available Slots */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Διαθέσιμες Ώρες</h2>
          
          {availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Δεν υπάρχουν διαθέσιμες ώρες</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSlots.map((slot) => (
                <div
                  key={slot.sessionId}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    slot.isBooked
                      ? 'border-green-200 bg-green-50'
                      : deposit && deposit.remainingLessons > 0
                      ? 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!slot.isBooked && deposit && deposit.remainingLessons > 0) {
                      handleBookLesson(slot);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSessionIcon(slot.type)}
                        <h4 className="font-medium text-gray-900">
                          {getSessionTypeName(slot.type)}
                        </h4>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(slot.date).toLocaleDateString('el-GR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{slot.trainer}</span>
                        </div>
                        
                        {slot.room && (
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span>{slot.room}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                     <div className="ml-4">
                       {slot.isBooked ? (
                         <div className="flex items-center space-x-2">
                           <CheckCircle className="h-5 w-5 text-green-600" />
                           <span className="text-sm font-medium text-green-800">Κρατημένο</span>
                         </div>
                       ) : deposit && deposit.remainingLessons > 0 ? (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleBookLesson(slot);
                           }}
                           disabled={bookingLoading === slot.sessionId}
                           className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                         >
                           {bookingLoading === slot.sessionId ? 'Κράτηση...' : 'Κράτηση'}
                         </button>
                       ) : (
                         <span className="text-sm text-gray-500">Μη διαθέσιμο</span>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Bookings */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Οι Κρατήσεις μου</h2>
            
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900">
                          {new Date(booking.bookingDate).toLocaleDateString('el-GR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{booking.bookingTime}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{booking.trainerName}</span>
                        </div>
                        
                        {booking.room && (
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span>{booking.room}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaspartuTrainingPage;
