import React, { useState, useEffect, useCallback } from 'react';
import { toLocalDateKey } from '@/utils/date';
import { ChevronLeft, ChevronRight, Users, Clock, MapPin, AlertCircle, X, RefreshCw } from 'lucide-react';
import { getGroupTrainingCalendarEvents, GroupTrainingCalendarEvent } from '@/utils/groupTrainingCalendarApi';
import toast from 'react-hot-toast';

interface TrainerMonthlyCalendarProps {
  trainerName: string;
  featureEnabled?: boolean;
}

const TrainerMonthlyCalendar: React.FC<TrainerMonthlyCalendarProps> = ({ 
  trainerName,
  featureEnabled = true 
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<GroupTrainingCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GroupTrainingCalendarEvent | null>(null);
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
      
      console.log('[TrainerMonthlyCalendar] Loading events for trainer:', trainerName, { startDate, endDate });
      
      const response = await getGroupTrainingCalendarEvents(startDate, endDate);
      
      // Filter events by trainer (robust to whitespace/case differences)
      const filteredEvents = response.events.filter(event =>
        (event.trainer || '').trim().toLowerCase() === (trainerName || '').trim().toLowerCase()
      );
      
      // Επιπλέον ταξινόμηση για να βεβαιωθούμε ότι τα events είναι ταξινομημένα
      const sortedFilteredEvents = filteredEvents.sort((a, b) => {
        const timeA = new Date(a.start).getTime();
        const timeB = new Date(b.start).getTime();
        return timeA - timeB;
      });
      
      setEvents(sortedFilteredEvents);
      
      console.log('[TrainerMonthlyCalendar] Loaded events for trainer:', filteredEvents.length);
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

  // Get capacity status color
  const getCapacityColor = (participantsCount: number, capacity: number) => {
    const percentage = (participantsCount / capacity) * 100;
    if (percentage === 0) return 'text-gray-600';
    if (percentage <= 50) return 'text-green-700';
    if (percentage < 100) return 'text-yellow-700';
    return 'text-red-700';
  };

  // Get capacity status background
  const getCapacityBgColor = (participantsCount: number, capacity: number) => {
    const percentage = (participantsCount / capacity) * 100;
    if (percentage === 0) return 'bg-gray-100';
    if (percentage <= 50) return 'bg-green-200';
    if (percentage < 100) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  // Get capacity status for full sessions
  const isSessionFull = (participantsCount: number, capacity: number) => {
    return participantsCount >= capacity;
  };

  // Handle event click
  const handleEventClick = async (event: GroupTrainingCalendarEvent) => {
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
              const isFull = isSessionFull(event.participants_count, event.capacity);
              return (
                <div
                  key={index}
                  onClick={() => handleEventClick(event)}
                  className={`rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 ${getCapacityBgColor(event.participants_count, event.capacity)} border border-opacity-20 shadow-sm hover:shadow-md p-2`}
                  title="Click to view session details"
                >
                  <div className="text-center">
                    <div className="font-bold text-sm text-gray-800 mb-1">
                      {event.start.split('T')[1].substring(0, 5)}
                    </div>
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span className="text-lg">
                        {event.capacity === 1 ? '👤' : 
                         event.capacity === 2 ? '👥👥' : 
                         event.capacity === 3 ? '👥👥👥' : 
                         event.capacity === 6 ? '👥👥👥👥👥👥' : 
                         event.capacity === 10 ? '👥👥👥👥👥👥👥👥👥👥' : '👥'}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {event.participants_count}/{event.capacity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {event.capacity === 1 ? '1 άτομο (Individual)' : 
                       event.capacity === 2 ? '2 άτομα' : 
                       event.capacity === 3 ? '3 άτομα' : 
                       event.capacity === 6 ? '6 άτομα' : 
                       event.capacity === 10 ? '10 άτομα' : `${event.capacity} άτομα`}
                    </div>
                    {isFull && (
                      <div className="text-xs text-red-600 font-bold mt-1">
                        🔒 ΓΕΜΑΤΟ
                      </div>
                    )}
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
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
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

                {/* Capacity Status */}
                <div className={`rounded-lg p-4 ${isSessionFull(selectedEvent.participants_count, selectedEvent.capacity) ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-lg">Χωρητικότητα Μαθήματος</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {selectedEvent.capacity === 1 ? '👤' : 
                         selectedEvent.capacity === 2 ? '👥👥' : 
                         selectedEvent.capacity === 3 ? '👥👥👥' : 
                         selectedEvent.capacity === 6 ? '👥👥👥👥👥👥' : 
                         selectedEvent.capacity === 10 ? '👥👥👥👥👥👥👥👥👥👥' : '👥'}
                      </span>
                      <span className={`px-3 py-2 rounded-full text-lg font-bold ${getCapacityBgColor(selectedEvent.participants_count, selectedEvent.capacity)} ${getCapacityColor(selectedEvent.participants_count, selectedEvent.capacity)}`}>
                        {selectedEvent.participants_count}/{selectedEvent.capacity}
                      </span>
                      {isSessionFull(selectedEvent.participants_count, selectedEvent.capacity) && (
                        <span className="text-sm text-red-600 font-bold bg-red-100 px-3 py-2 rounded-lg">
                          🔒 ΓΕΜΑΤΟ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 mb-2">
                      {selectedEvent.capacity === 1 ? 'Individual Training - 1 άτομο' : 
                       selectedEvent.capacity === 2 ? 'Μάθημα για 2 άτομα' : 
                       selectedEvent.capacity === 3 ? 'Μάθημα για 3 άτομα' : 
                       selectedEvent.capacity === 6 ? 'Μάθημα για 6 άτομα' : 
                       selectedEvent.capacity === 10 ? 'Μάθημα για 10 άτομα' : `Μάθημα για ${selectedEvent.capacity} άτομα`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedEvent.participants_count === 0 ? 'Κανένας συμμετέχων' :
                       selectedEvent.participants_count === 1 ? '1 συμμετέχων' :
                       `${selectedEvent.participants_count} συμμετέχοντες`}
                    </div>
                  </div>
                  {isSessionFull(selectedEvent.participants_count, selectedEvent.capacity) && (
                    <div className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded-lg">
                      ⚠️ Αυτό το μάθημα είναι γεμάτο. Δεν επιτρέπονται νέες κρατήσεις.
                    </div>
                  )}
                </div>

                {/* Participants */}
                {selectedEvent.participants.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Συμμετέχοντες</h4>
                    <div className="space-y-2">
                      {selectedEvent.participants.map((participant, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{participant.name}</div>
                            <div className="text-xs text-gray-600">{participant.email}</div>
                          </div>
                        </div>
                      ))}
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
