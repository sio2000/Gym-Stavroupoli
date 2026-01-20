import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toLocalDateKey } from '@/utils/date';
import { Users, Clock, MapPin, AlertCircle, X, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';

interface TrainerMonthlyCalendarProps {
  trainerName: string;
  featureEnabled?: boolean;
}

interface PersonalTrainingCalendarEvent {
  id: string;
  title: string;
  type: 'personal';
  start: string; // ISO string
  end: string; // ISO string
  room: string;
  trainer: string;
  userName: string;
  userEmail: string;
  notes?: string;
  status: string;
}

const TrainerMonthlyCalendar: React.FC<TrainerMonthlyCalendarProps> = ({ 
  trainerName,
  featureEnabled = true 
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<PersonalTrainingCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PersonalTrainingCalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get current month and year
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Load events for current month - filtered by trainer
  const loadEvents = useCallback(async () => {
    if (!featureEnabled) return;

    setLoading(true);
    try {
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endDate = toLocalDateKey(new Date(currentYear, currentMonth, 0));
      
      console.log('[TrainerMonthlyCalendar] Loading personal training events for trainer:', trainerName, { startDate, endDate });
      
      // Query all personal training schedules
      const { data: schedules, error } = await supabase
        .from('personal_training_schedules')
        .select(`
          id,
          user_id,
          schedule_data,
          trainer_name,
          status,
          users!personal_training_schedules_user_id_fkey(
            first_name,
            last_name,
            email
          )
        `);

      if (error) {
        console.error('[TrainerMonthlyCalendar] Error loading schedules:', error);
        throw new Error(`Failed to fetch personal training schedules: ${error.message}`);
      }

      console.log('[TrainerMonthlyCalendar] Raw schedules data:', schedules);

      // Filter schedules for this trainer (case insensitive)
      const trainerSchedules = schedules?.filter(schedule => {
        // Check both trainer_name column and schedule_data.sessions[].trainer
        if (schedule.trainer_name?.toLowerCase() === trainerName.toLowerCase()) {
          return true;
        }
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some((session: any) => session.trainer?.toLowerCase() === trainerName.toLowerCase());
      }) || [];

      console.log('[TrainerMonthlyCalendar] Filtered trainer schedules:', trainerSchedules.length);

      // Convert schedules to calendar events
      const calendarEvents: PersonalTrainingCalendarEvent[] = [];

      trainerSchedules.forEach((schedule: any) => {
        const sessions = schedule.schedule_data?.sessions || [];
        const userName = schedule.users ? 
          `${schedule.users.first_name} ${schedule.users.last_name}` : 
          'Άγνωστος Χρήστης';
        const userEmail = schedule.users?.email || '';

        sessions.forEach((session: any) => {
          if (session.trainer?.toLowerCase() === trainerName.toLowerCase()) {
            // Parse date and time - use startTime and endTime properties
            const sessionDate = session.date;
            const startTime = session.startTime;
            const endTime = session.endTime || startTime; // fallback if endTime doesn't exist
            
            // Validate times
            if (!startTime || !startTime.includes(':')) {
              console.warn('[TrainerMonthlyCalendar] Invalid startTime format:', startTime, 'for session:', session);
              return; // skip this session
            }
            
            // Create ISO strings
            const startDateTime = `${sessionDate}T${startTime}:00`;
            const endDateTime = `${sessionDate}T${endTime}:00`;

            // Validate date format
            const testDate = new Date(startDateTime);
            if (isNaN(testDate.getTime())) {
              console.error('[TrainerMonthlyCalendar] Invalid date format:', startDateTime);
              return; // skip this session
            }

            const event: PersonalTrainingCalendarEvent = {
              id: `${schedule.id}-${session.date}-${session.startTime}`,
              title: `${session.type} - ${userName}`,
              type: 'personal',
              start: startDateTime,
              end: endDateTime,
              room: session.room || 'N/A',
              trainer: session.trainer,
              userName: userName,
              userEmail: userEmail,
              notes: session.notes,
              status: schedule.status
            };

            calendarEvents.push(event);
          }
        });
      });

      // Don't filter by current month - show all trainer sessions
      const sortedEvents = calendarEvents.sort((a, b) => {
        const timeA = new Date(a.start).getTime();
        const timeB = new Date(b.start).getTime();
        return timeA - timeB;
      });

      setEvents(sortedEvents);
      
      console.log('[TrainerMonthlyCalendar] Loaded events for trainer:', sortedEvents.length);
    } catch (error) {
      console.error('[TrainerMonthlyCalendar] Error loading events:', error);
      toast.error('Αποτυχία φόρτωσης ημερολογίου');
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, featureEnabled, trainerName]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = toLocalDateKey(date);
    return events
      .filter(event => event.start.startsWith(dateStr))
      .sort((a, b) => {
        // Ταξινόμηση από νωρίτερο σε αργότερο βάσει ώρας
        const timeA = new Date(a.start).getTime();
        const timeB = new Date(b.start).getTime();
        return timeA - timeB;
      });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-32 bg-gray-50 rounded-lg"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayEvents = getEventsForDate(date);
      
      days.push(
        <div key={day} className="min-h-32 bg-white border border-gray-200 rounded-lg p-2 flex flex-col">
          <div className="flex justify-between items-center mb-1 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">{day}</span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1 flex-grow">
            {dayEvents.map((event, index) => {
              return (
                <div
                  key={index}
                  onClick={() => handleEventClick(event)}
                  className="rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 bg-blue-100 border border-blue-200 shadow-sm hover:shadow-md p-2"
                  title="Click to view session details"
                >
                  <div className="text-center">
                    <div className="font-bold text-sm text-gray-800 mb-1">
                      {event.start.split('T')[1].substring(0, 5)}
                    </div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span className="text-lg">👤</span>
                      <span className="text-xs font-bold text-gray-700">
                        {event.type === 'personal' ? 'Personal' : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {event.userName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  // Handle event click
  const handleEventClick = (event: PersonalTrainingCalendarEvent) => {
    try {
      setLoading(true);
      console.log('[TrainerMonthlyCalendar] Event clicked:', event);
      
      setSelectedEvent(event);
      setShowEventModal(true);
    } catch (error) {
      console.error('[TrainerMonthlyCalendar] Error loading event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
      toast.success('Ημερολόγιο ανανεώθηκε');
    } catch (error) {
      console.error('[TrainerMonthlyCalendar] Error refreshing:', error);
      toast.error('Αποτυχία ανανέωσης ημερολογίου');
    } finally {
      setRefreshing(false);
    }
  };

  if (!featureEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800">Το Ημερολόγιο Προπόνησης είναι απενεργοποιημένο</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span className="text-blue-600">📅</span>
              <span>Personal Training - Μηνιαίο Πρόγραμμα - Προπονητής {trainerName.toUpperCase()}</span>
            </h3>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="text-gray-600">Μηνιαία προβολή -</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Ελεύθερα</span>
              </div>
              <span className="text-gray-400">|</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Μισά</span>
              </div>
              <span className="text-gray-400">|</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Γεμάτα</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Σήμερα
            </button>
            
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Ανανέωση</span>
            </button>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Month/Year Display */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('el-GR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading calendar events...</span>
          </div>
        ) : (
          <>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'].map((day) => (
                <div key={day} className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-100 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 auto-rows-min">
              {generateCalendarDays()}
            </div>
          </>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Λεπτομέρειες Σεσίας</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Session Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {new Date(selectedEvent.start).toLocaleDateString('el-GR')} στις {selectedEvent.start.split('T')[1].substring(0, 5)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span>{selectedEvent.room}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span>Προπονητής: {selectedEvent.trainer}</span>
                  </div>
                </div>

                {/* Personal Training Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-lg">Personal Training Session</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">👤</span>
                      <span className="px-3 py-2 rounded-full text-lg font-bold bg-blue-200 text-blue-800">
                        Personal
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 mb-2">
                      Personal Training Session
                    </div>
                    <div className="text-sm text-gray-600">
                      1-on-1 Training
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Πελάτης</h4>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {selectedEvent.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{selectedEvent.userName}</div>
                      <div className="text-xs text-gray-600">{selectedEvent.userEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Σημειώσεις</h4>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm text-gray-700">{selectedEvent.notes}</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerMonthlyCalendar;
