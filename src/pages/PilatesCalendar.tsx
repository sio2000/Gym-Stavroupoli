import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getPilatesAvailableSlots,
  getPilatesBookings,
  createPilatesBooking,
  cancelPilatesBooking,
} from '@/utils/pilatesScheduleApi';
import { PilatesAvailableSlot, PilatesBooking } from '@/types';
import { Calendar, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PilatesCalendar: React.FC = () => {
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<PilatesAvailableSlot[]>([]);
  const [userBookings, setUserBookings] = useState<PilatesBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Start with the same week as admin panel - 13 Sep (Saturday)
    const adminWeek = new Date('2025-09-13T00:00:00.000Z');
    console.log('User: Using admin week - 13 Sep:', adminWeek.toISOString());
    return adminWeek;
  });


  // Generate week dates (10 days like admin panel)
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentWeek);
    
    console.log('User: getWeekDates - currentWeek:', startOfWeek);
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
      console.log(`User: Day ${i}: ${date.toISOString().split('T')[0]}`);
    }
    
    return dates;
  };

  // Generate time slots (8:00 to 21:00)
  const getTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const dayNames = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
    const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    return `${dayName} ${day} ${month}`;
  };

  // Check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  // Get slots for specific date and time
  const getSlotsForDateTime = (dateStr: string, timeStr: string): PilatesAvailableSlot[] => {
    return availableSlots.filter(slot => 
      slot.date === dateStr && slot.start_time === timeStr + ':00'
    );
  };

  // Check if there are any slots for a specific date and time (to show red if admin hasn't created any)
  const hasSlotsForDateTime = (dateStr: string, timeStr: string): boolean => {
    return availableSlots.some(slot => 
      slot.date === dateStr && slot.start_time === timeStr + ':00'
    );
  };

  // Check if user has booked a specific slot
  const isSlotBooked = (slotId: string): boolean => {
    return userBookings.some(booking => 
      booking.slot_id === slotId && booking.status === 'confirmed'
    );
  };


  // Load data from database
  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('=== LOADING PILATES CALENDAR DATA ===');
      
      const [slots, bookings] = await Promise.all([
        getPilatesAvailableSlots(),
        getPilatesBookings(user.id)
      ]);
      
      console.log('Fetched slots from DB:', slots.length);
      console.log('Fetched bookings from DB:', bookings.length);
      
      // Calculate available capacity for each slot
      const slotsWithCapacity = slots.map(slot => {
        const slotBookings = bookings.filter(booking => 
          booking.slot_id === slot.id && booking.status === 'confirmed'
        );
        const bookedCount = slotBookings.length;
        const availableCapacity = Math.max(0, slot.max_capacity - bookedCount);
        
        console.log(`Slot ${slot.id} (${slot.date} ${slot.start_time}): max=${slot.max_capacity}, booked=${bookedCount}, available=${availableCapacity}`);
        
        return {
          ...slot,
          available_capacity: availableCapacity,
          booked_count: bookedCount
        };
      });
      
      setAvailableSlots(slotsWithCapacity);
      setUserBookings(bookings);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeek(newDate);
    console.log('Navigated to week:', newDate);
  };

  // Handle slot booking
  const handleBookSlot = async (slot: PilatesAvailableSlot) => {
    if (!user?.id) return;
    
    if (!slot.is_active) {
      toast.error('Αυτό το μάθημα δεν είναι διαθέσιμο.');
      return;
    }
    
    if (isSlotBooked(slot.id)) {
      toast.error('Έχετε ήδη κλείσει αυτό το μάθημα.');
      return;
    }
    
    try {
      console.log('Booking slot:', slot);
      
      // Check if slot is available (simplified check)
      if (slot.booked_count >= slot.max_capacity) {
        toast.error('Το μάθημα είναι πλήρες.');
        return;
      }
      
      const booking = await createPilatesBooking({ slotId: slot.id, notes: '' }, user.id);
      console.log('Booking created:', booking);
      
      toast.success('Το μάθημα κλείστηκε επιτυχώς!');
      await loadData();
      
    } catch (error) {
      console.error('Error booking slot:', error);
      toast.error('Σφάλμα κατά την κράτηση του μαθήματος.');
    }
  };

  // Handle slot cancellation
  const handleCancelBooking = async (slotId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('Cancelling booking for slot:', slotId);
      await cancelPilatesBooking(slotId);
      toast.success('Η κράτηση ακυρώθηκε επιτυχώς!');
      await loadData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Σφάλμα κατά την ακύρωση της κράτησης.');
    }
  };

  // Load data when component mounts
  useEffect(() => {
    // Force refresh to avoid caching issues
    console.log('User: useEffect triggered - currentWeek changed to:', currentWeek.toISOString());
    loadData();
  }, [user?.id, currentWeek]);

  const weekDates = getWeekDates();
  const timeSlots = getTimeSlots();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
          <p className="text-lg text-gray-600">Φόρτωση προγράμματος...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-3 text-primary" size={32} />
                Ημερολόγιο Pilates
              </h1>
              <p className="text-gray-600 mt-2">
                Κλείστε μαθήματα pilates για τις επόμενες 2 εβδομάδες
              </p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="mr-2" />
                Προηγούμενη
              </button>
              <button
                onClick={() => {
                  // Force refresh current week calculation - MUST match admin exactly
                  const today = new Date();
                  const dayOfWeek = today.getDay();
                  const monday = new Date(today);
                  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  monday.setDate(today.getDate() + daysToMonday);
                  monday.setHours(0, 0, 0, 0);
                  setCurrentWeek(monday);
                  console.log('User: Force refreshed currentWeek to:', monday.toISOString());
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Εβδομάδα: {formatDate(weekDates[0])} - {formatDate(weekDates[9])}
              </h2>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Επόμενη
              <ChevronRight size={20} className="ml-2" />
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Οδηγίες:</strong> Κάντε κλικ στα πράσινα μαθήματα για να κλείσετε κράτηση. 
              Τα κόκκινα μαθήματα είναι ακυρωμένα από τον admin. 
              Τα μπλε μαθήματα είναι ήδη κρατημένα από εσάς.
            </p>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-20">
                    Ώρα
                  </th>
                  {weekDates.map((date) => (
                    <th key={date.toISOString()} className="px-4 py-3 text-center text-sm font-medium text-gray-700 min-w-32">
                      {formatDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {time}
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const slots = getSlotsForDateTime(dateStr, time);
                      const isWeekendDay = isWeekend(date);
                      const hasSlots = hasSlotsForDateTime(dateStr, time);
                      
                      return (
                        <td key={`${dateStr}-${time}`} className="px-4 py-3 text-center">
                          {isWeekendDay ? (
                            <div className="text-gray-400 text-xs">
                              Σαβ/Κυρ
                            </div>
                          ) : hasSlots ? (
                            <div className="space-y-1">
                              {slots.map((slot) => {
                                const isBooked = isSlotBooked(slot.id);
                                const isActive = slot.is_active;
                                const isFull = slot.booked_count >= slot.max_capacity;
                                
                                let statusClass = '';
                                let statusIcon = null;
                                let capacityText = '';
                                
                                if (isBooked) {
                                  statusClass = 'bg-blue-100 text-blue-800 border-blue-200';
                                  statusIcon = <CheckCircle size={16} className="text-blue-600" />;
                                  capacityText = 'Κρατημένο';
                                } else if (isActive && !isFull) {
                                  statusClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 cursor-pointer';
                                  statusIcon = <CheckCircle size={16} className="text-green-600" />;
                                  capacityText = `${slot.booked_count}/${slot.max_capacity}`;
                                } else if (isActive && isFull) {
                                  statusClass = 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed';
                                  statusIcon = <XCircle size={16} className="text-red-600" />;
                                  capacityText = 'Πλήρες';
                                } else {
                                  statusClass = 'bg-red-100 text-red-800 border-red-200 cursor-not-allowed';
                                  statusIcon = <XCircle size={16} className="text-red-600" />;
                                  capacityText = 'Ακυρωμένο';
                                }
                                
                                return (
                                  <div
                                    key={slot.id}
                                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${statusClass}`}
                                    onClick={() => {
                                      if (isActive && !isBooked && !isFull) {
                                        handleBookSlot(slot);
                                      } else if (isBooked) {
                                        handleCancelBooking(slot.id);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-center space-x-1">
                                      {statusIcon}
                                      <span>{capacityText}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-red-100 text-red-800 border-red-200 px-3 py-2 rounded-lg text-xs font-medium cursor-not-allowed">
                              <div className="flex items-center justify-center space-x-1">
                                <XCircle size={16} className="text-red-600" />
                                <span>Μη διαθέσιμο</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Εξήγηση χρωμάτων</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-700">Διαθέσιμο για κράτηση</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-700">Κρατημένο από εσάς</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-700">Πλήρες/Ακυρωμένο</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-700">Μη διαθέσιμο</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilatesCalendar;