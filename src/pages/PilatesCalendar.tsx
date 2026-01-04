import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  getPilatesAvailableSlots,
  getPilatesBookings,
  createPilatesBooking,
  getActivePilatesDeposit,
  subscribePilatesRealtime,
} from '@/utils/pilatesScheduleApi';
import { 
  getUltimateWeeklyDepositInfo, 
  formatUltimateDepositText, 
  getWeeklyInfoText,
  UltimateWeeklyDepositInfo 
} from '@/utils/ultimateWeeklyDepositApi';
import { debugWeeklyLogic } from '@/utils/debugWeeklyLogic';
import { PilatesAvailableSlot, PilatesBooking } from '@/types';
import { Calendar, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, Wallet, Sparkles, X } from 'lucide-react';
import { toLocalDateKey, addDaysLocal, parseDateKeyLocal } from '@/utils/date';

const PilatesCalendar: React.FC = () => {
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<PilatesAvailableSlot[]>([]);
  const [userBookings, setUserBookings] = useState<PilatesBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deposit, setDeposit] = useState<number>(0);
  const [weeklyDepositInfo, setWeeklyDepositInfo] = useState<UltimateWeeklyDepositInfo | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<PilatesAvailableSlot | null>(null);
  const [currentWeek, setCurrentWeek] = useState(() => new Date());


  // Generate dates από σήμερα + 15 ημέρες
  const getWeekDates = (): string[] => {
    const dates: string[] = [];
    const startDate = new Date(currentWeek);
    for (let i = 0; i < 16; i++) {
      const date = addDaysLocal(startDate, i);
      const key = toLocalDateKey(date);
      if (key >= toLocalDateKey(new Date())) {
        dates.push(key);
      }
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

  // Format date for display - now takes date string (YYYY-MM-DD)
  const formatDate = (dateStr: string): string => {
    const date = parseDateKeyLocal(dateStr); // Use parseDateKeyLocal to avoid timezone issues
    const dayNames = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
    const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    return `${dayName} ${day} ${month}`;
  };

  // Check if date is Sunday - now takes date string (YYYY-MM-DD)
  const isWeekend = (dateStr: string): boolean => {
    const date = parseDateKeyLocal(dateStr); // Use parseDateKeyLocal to avoid timezone issues
    const day = date.getDay();
    return day === 0; // Sunday = 0
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
      const weekDates = getWeekDates();
      const startStr = weekDates[0];
      const endStr = weekDates[13];

      const [slots, bookings, depositInfo, weeklyInfo] = await Promise.all([
        getPilatesAvailableSlots(startStr, endStr),
        getPilatesBookings(user.id),
        getActivePilatesDeposit(user.id),
        getUltimateWeeklyDepositInfo()
      ]);
      
      console.log('Fetched slots from DB:', slots.length);
      console.log('Fetched bookings from DB:', bookings.length);
      console.log('Weekly deposit info:', weeklyInfo);
      
      // Debug weekly logic
      if (weeklyInfo?.is_ultimate_user) {
        debugWeeklyLogic();
      }
      
      // Slots already include booked_count from occupancy view; just compute available_capacity
      const slotsWithCapacity = slots.map(slot => ({
        ...slot,
        available_capacity: Math.max(0, slot.max_capacity - (slot as any).booked_count)
      }));
      
      setAvailableSlots(slotsWithCapacity);
      setUserBookings(bookings);
      setDeposit(depositInfo?.deposit_remaining || 0);
      setWeeklyDepositInfo(weeklyInfo);
      
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
      newDate.setDate(newDate.getDate() - 16); // βήμα 15 ημερών προς τα πίσω
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        setCurrentWeek(today);
        return;
      }
    } else {
      newDate.setDate(newDate.getDate() + 16); // βήμα 15 ημερών προς τα εμπρός
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
      
      if (deposit <= 0) {
        toast.error('Τα μαθήματά σας τελείωσαν. Για ανανέωση, απευθυνθείτε στη ρεσεψιόν.');
        return;
      }

      // πλήρες;
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

  // Load data when component mounts
  useEffect(() => {
    // Force refresh to avoid caching issues
    console.log('User: useEffect triggered - currentWeek changed to:', currentWeek.toISOString());
    loadData();
    // realtime occupancy updates with cache buster
    const ch = subscribePilatesRealtime(() => {
      console.log('🔥🔥🔥 USER: Realtime update received - reloading data');
      loadData();
    });
    return () => {
      try { ch.unsubscribe(); } catch {}
    };
  }, [user?.id, currentWeek]);

  const weekDates = getWeekDates();
  const timeSlots = getTimeSlots();
  const todayKey = toLocalDateKey(new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const prevDisabled = currentWeek <= todayStart;
  

  const openConfirm = (slot: PilatesAvailableSlot) => {
    setPendingSlot(slot);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setPendingSlot(null);
  };

  const confirmBooking = async () => {
    if (!pendingSlot) return;
    await handleBookSlot(pendingSlot);
    closeConfirm();
  };

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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center flex-wrap">
                <Calendar className="mr-2 sm:mr-3 text-primary" size={28} />
                Ημερολόγιο Pilates
                <Sparkles className="ml-2 sm:ml-3 text-amber-500" size={20} />
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Κλείστε μαθήματα pilates για τις επόμενες 2 εβδομάδες
              </p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="hidden sm:grid grid-cols-[auto,1fr,auto] items-center gap-1.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 py-1 min-w-0">
              <button
                onClick={() => navigateWeek('prev')}
                disabled={prevDisabled}
                className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-[12px] sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  prevDisabled
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={16} className="mr-1.5" />
                Προηγούμενη
              </button>
            </div>
            
            <div className="text-center min-w-0">
              <h2 className="text-xs sm:text-xl font-semibold text-gray-800 truncate">
                2 εβδομάδες: {formatDate(weekDates[0])} - {formatDate(weekDates[13])}
              </h2>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-[12px] sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Επόμενη
              <ChevronRight size={16} className="ml-1.5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 md:mb-6">
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              <strong>Οδηγίες:</strong> Κάντε κλικ στα πράσινα μαθήματα για να κλείσετε κράτηση. 
              Τα κόκκινα μαθήματα είναι ακυρωμένα από τον admin. 
              Τα μπλε μαθήματα είναι ήδη κρατημένα από εσάς.
              Τα κλειδωμένα μαθήματα (🔒) είναι από παλιές ημερομηνίες και δεν μπορείτε να τα κλείσετε.
            </p>
          </div>
        {/* Deposit Info */}
        <div className="rounded-xl p-4 sm:p-5 mb-4 border bg-gradient-to-r from-pink-50 to-rose-50 border-rose-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="mr-3 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-rose-200 shadow-sm">
                <Wallet className="text-rose-500" size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-rose-700">Υπόλοιπο Pilates</p>
                <p className="text-lg sm:text-xl font-bold text-rose-800">
                  {weeklyDepositInfo ? formatUltimateDepositText(weeklyDepositInfo) : `${deposit} μαθήματα απομένουν`}
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full bg-white text-rose-700 border border-rose-200 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shadow-sm">
              <Sparkles className="mr-1" size={12} /> 
              {weeklyDepositInfo?.is_ultimate_user ? 'Ultimate' : 'Κράτα το ρυθμό!'}
            </span>
          </div>
          
          
          {deposit <= 0 && (
            <p className="text-red-600 mt-3 text-xs sm:text-sm">Τα μαθήματά σας τελείωσαν. Για ανανέωση, απευθυνθείτε στη ρεσεψιόν.</p>
          )}
        </div>
        </div>

        {/* Mobile Week Header + Controls (above calendar) */}
        <div className="sm:hidden mb-3">
          <div className="text-center mb-2">
            <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
              2 εβδομάδες: {formatDate(weekDates[0])} - {formatDate(weekDates[13])}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={prevDisabled}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg shadow-sm active:scale-[0.99] ${
                prevDisabled
                  ? 'text-gray-400 bg-gray-200 border-gray-200 cursor-not-allowed'
                  : 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
              }`}
              aria-label="Προηγούμενη εβδομάδα"
            >
              <ChevronLeft size={16} />
              Προηγούμενη
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-lg shadow-sm hover:bg-blue-700 active:scale-[0.99]"
              aria-label="Επόμενη εβδομάδα"
            >
              Επόμενη
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="sm:hidden text-xs text-gray-500 px-3 pt-3">Σύρετε οριζόντια για να δείτε όλες τις ημέρες</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b sticky top-0 z-20">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-700 w-16 sm:w-20 sticky left-0 bg-gray-50 z-30 border-r border-gray-200">
                    Ώρα
                  </th>
                  {weekDates.map((dateStr) => {
                    const isToday = dateStr === todayKey;
                    return (
                      <th
                        key={dateStr}
                        className={`px-3 sm:px-4 py-2 sm:py-3 text-center font-semibold min-w-[5.25rem] sm:min-w-32 relative ${
                          isToday 
                            ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white shadow-lg animate-pulse' 
                            : 'text-gray-700 bg-gray-50'
                        }`}
                        title={isToday ? 'Σήμερα' : undefined}
                      >
                        {isToday && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <span className="text-xs">🔥</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <span className={`${isToday ? 'text-white font-bold' : 'text-gray-700'}`}>
                            {formatDate(dateStr)}
                          </span>
                          {isToday && (
                            <div className="mt-1 flex items-center space-x-1">
                              <span className="text-xs">💪</span>
                              <span className="inline-block px-2 py-0.5 text-[9px] sm:text-[10px] rounded-full bg-white/20 text-white font-bold animate-pulse">
                                ΣΗΜΕΡΑ
                              </span>
                              <span className="text-xs">🏋️‍♀️</span>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-100">
                      {time}
                    </td>
                    {weekDates.map((dateStr) => {
                      const slots = getSlotsForDateTime(dateStr, time);
                      const isWeekendDay = isWeekend(dateStr);
                      const hasSlots = hasSlotsForDateTime(dateStr, time);
                      const isToday = dateStr === todayKey;
                      const isPastDate = dateStr < todayKey; // Έλεγχος αν η ημερομηνία είναι στο παρελθόν
                      const now = new Date();
                      const slotMinutes = parseInt(time.split(':')[0], 10) * 60 + parseInt(time.split(':')[1], 10);
                      const nowMinutes = now.getHours() * 60 + now.getMinutes();
                      const isPastTime = isToday && slotMinutes <= nowMinutes;
                      
                      return (
                        <td key={`${dateStr}-${time}`} className={`px-2.5 sm:px-4 py-1.5 sm:py-3 text-center align-middle relative ${
                          isToday ? 'bg-gradient-to-r from-orange-50/60 via-pink-50/60 to-purple-50/60 border-l-2 border-orange-400' : ''
                        } ${isPastDate || isPastTime ? 'bg-gray-100' : ''}`}>
                          {isPastDate || isPastTime ? (
                            // Κλειδωμένες ημερομηνίες παρελθόντος
                            <div className="bg-gray-200 text-gray-500 border-gray-300 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium cursor-not-allowed opacity-60">
                              <div className="flex items-center justify-center gap-1">
                                🔒
                                <span>Κλειδωμένο</span>
                              </div>
                            </div>
                          ) : isWeekendDay ? (
                            <div className="text-gray-400 text-[10px] sm:text-xs">
                              Κυριακή
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
                                  statusClass = 'bg-blue-100 text-blue-800 border-blue-200 cursor-default';
                                  statusIcon = <CheckCircle size={12} className="text-blue-600" />;
                                  capacityText = 'Κρατημένο';
                                } else if (isActive && !isFull) {
                                  statusClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 cursor-pointer';
                                  statusIcon = <CheckCircle size={12} className="text-green-600" />;
                                  capacityText = `${slot.booked_count}/${slot.max_capacity}`;
                                } else if (isActive && isFull) {
                                  statusClass = 'bg-rose-50 text-rose-700 border-rose-200 cursor-not-allowed';
                                  statusIcon = <XCircle size={12} className="text-rose-600" />;
                                  capacityText = 'Πλήρες';
                                } else {
                                  statusClass = 'bg-rose-50 text-rose-700 border-rose-200 cursor-not-allowed';
                                  statusIcon = <XCircle size={12} className="text-rose-600" />;
                                  capacityText = 'Ακυρωμένο';
                                }
                                
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    aria-label={isBooked ? 'Κρατημένο μάθημα (δεν ακυρώνεται μέσω εφαρμογής)' : (isActive && !isFull ? 'Κλείσιμο μαθήματος' : capacityText)}
                                    title={isBooked ? 'Η κράτησή σας έχει ολοκληρωθεί. Επικοινωνήστε με τη ρεσεψιόν για αλλαγές.' : (isActive && !isFull ? 'Κάντε κλικ για κράτηση' : capacityText)}
                                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-[10px] sm:text-xs font-medium transition-colors transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${statusClass} ${isActive && !isBooked && !isFull ? 'hover:scale-[1.02]' : ''}`}
                                    onClick={() => {
                                      if (isActive && !isBooked && !isFull) {
                                        openConfirm(slot);
                                      }
                                    }}
                                    disabled={isBooked}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {statusIcon}
                                      <span>{capacityText}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-red-100 text-red-800 border-red-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium cursor-not-allowed">
                              <div className="flex items-center justify-center gap-1">
                                <XCircle size={12} className="text-red-600" />
                                <span>Πλήρες/Μη διαθέσιμο</span>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-700">Διαθέσιμο για κράτηση</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-700">Κρατημένο από εσάς</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-rose-50 border border-rose-200 rounded"></div>
              <span className="text-sm text-gray-700">Πλήρες/Μη διαθέσιμο</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-neutral-100 border border-neutral-200 rounded"></div>
              <span className="text-sm text-gray-700">Πλήρες/Μη διαθέσιμο</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded opacity-60"></div>
              <span className="text-sm text-gray-700">🔒 Κλειδωμένο (παρελθόν)</span>
            </div>
          </div>
        </div>

        {/* Confirm Modal */}
        {isConfirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
          >
            <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
            <div className="relative bg-white w-full sm:w-[90%] max-w-md rounded-t-2xl sm:rounded-xl shadow-lg border p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in">
              <div className="flex items-start justify-between gap-3">
                <h4 id="confirm-title" className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                  <XCircle size={18} className="text-rose-600 mr-2" /> Επιβεβαίωση κράτησης
                </h4>
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full"
                  aria-label="Κλείσιμο"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p id="confirm-desc" className="text-sm text-gray-700 mt-2 sm:mt-3">
                Αν προχωρήσετε σε κράτηση, δεν θα μπορείτε να ακυρώσετε το μάθημα μετά.
              </p>
              {pendingSlot && (
                <div className="mt-3 sm:mt-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Ημερομηνία:</span> {pendingSlot.date}
                  <span className="mx-2">•</span>
                  <span className="font-medium text-gray-800">Ώρα:</span> {pendingSlot.start_time?.slice(0,5)}
                </div>
              )}
              <div className="mt-5 sm:mt-6 flex items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Ακύρωση
                </button>
                <button
                  type="button"
                  onClick={confirmBooking}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  Επιβεβαίωση
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PilatesCalendar;