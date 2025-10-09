import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { 
  PilatesScheduleSlot
} from '@/types';
import { 
  getPilatesScheduleSlots,
  getPilatesAvailableSlots,
  subscribePilatesRealtime,
  getPilatesSlotBookings
} from '@/utils/pilatesScheduleApi';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';
import { toLocalDateKey, addDaysLocal, getGreekMondayOfCurrentWeek, parseDateKeyLocal } from '@/utils/date';

interface PilatesScheduleDisplayProps {
  readOnly?: boolean;
  trainerName?: string;
  showAdminControls?: boolean;
  title?: string;
  subtitle?: string;
}

const PilatesScheduleDisplay: React.FC<PilatesScheduleDisplayProps> = ({
  readOnly = false,
  trainerName,
  showAdminControls = true,
  title = "Πρόγραμμα Pilates",
  subtitle = "Κάντε κλικ στις ώρες που δεν θέλετε να είναι διαθέσιμες"
}) => {
  const [slots, setSlots] = useState<PilatesScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleGrid, setScheduleGrid] = useState<{[key: string]: boolean}>({});
  const [occupancy, setOccupancy] = useState<{ [key: string]: { booked: number, cap: number } }>({});
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Use Greek timezone Monday of current week for synchronization - FORCE REFRESH
    const greekMonday = getGreekMondayOfCurrentWeek();
    console.log('🔥🔥🔥 PILATES SCHEDULE: Using Greek Monday function - Monday:', greekMonday.toISOString(), 'TIMESTAMP:', Date.now());
    return greekMonday;
  });
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<{
    slotId: string;
    date: string;
    time: string;
    bookings: any[];
  } | null>(null);
  const [loadingSlotInfo, setLoadingSlotInfo] = useState(false);

  // Available time slots (Monday to Friday)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];


  useEffect(() => {
    console.log('PilatesScheduleDisplay: useEffect triggered - currentWeek changed to:', currentWeek.toISOString());
    loadSlots();
    const ch = subscribePilatesRealtime(() => {
      loadSlots();
    });
    return () => {
      try { ch.unsubscribe(); } catch {}
    };
  }, [currentWeek]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedSlotInfo) {
        setSelectedSlotInfo(null);
      }
    };

    if (selectedSlotInfo) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedSlotInfo]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      
      // Only load schedule slots, skip available slots for now
      const slotsData = await getPilatesScheduleSlots();
      
      // If trainerName is specified, filter slots for that trainer
      // For now, we'll show all slots since Pilates doesn't have trainer-specific filtering in the current schema
      // This can be enhanced later if needed
      setSlots(slotsData);
      
      // Initialize grid with all slots as available (true) by default
      const grid: {[key: string]: boolean} = {};
      const weekDates = getWeekDates();
      
      console.log('Loading slots for week:', weekDates);
      console.log('Existing slots from DB:', slotsData.length);
      
      weekDates.forEach(date => {
        timeSlots.forEach(time => {
          const key = `${date}-${time}`;
          // Check if this slot exists in the database and is active
          // Note: start_time in DB is "08:00:00" but we search for "08:00"
          const existingSlot = slotsData.find(slot => 
            slot.date === date && slot.start_time === `${time}:00`
          );
          // If slot exists in DB, use its is_active status, otherwise default to true (available)
          grid[key] = existingSlot ? existingSlot.is_active : true;
          
          // Debug log for first few slots
          if (Object.keys(grid).length <= 5) {
            console.log(`Grid key: ${key}, existingSlot: ${!!existingSlot}, is_active: ${existingSlot?.is_active}, final: ${grid[key]}`);
          }
        });
      });
      
      // Debug: Show all existing slots for this week
      console.log('All existing slots for this week:');
      slotsData.forEach(slot => {
        console.log(`  - ${slot.date} ${slot.start_time} (active: ${slot.is_active})`);
      });
      
      console.log('Initialized grid with slots:', Object.keys(grid).length);
      console.log('Grid state sample:', Object.entries(grid).slice(0, 5));
      
      // Count active vs inactive slots
      const activeCount = Object.values(grid).filter(Boolean).length;
      const inactiveCount = Object.values(grid).filter(v => !v).length;
      console.log(`Grid summary: ${activeCount} active, ${inactiveCount} inactive`);
      
      setScheduleGrid(grid);

      // Load occupancy from view in range
      const start = weekDates[0];
      const end = weekDates[weekDates.length - 1];
      const slotsWithOcc = await getPilatesAvailableSlots(start, end);
      const occ: { [key: string]: { booked: number, cap: number } } = {};
      slotsWithOcc.forEach(s => {
        const key = `${s.date}-${s.start_time.slice(0,5)}`;
        occ[key] = { booked: (s as any).booked_count || 0, cap: s.max_capacity };
      });
      setOccupancy(occ);
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Σφάλμα φόρτωσης προγράμματος pilates');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (): string[] => {
    const dates: string[] = [];
    const startDate = new Date(currentWeek);
    
    console.log('PilatesScheduleDisplay: getWeekDates - currentWeek:', startDate);
    
    // Generate 14 days (2 εβδομάδες)
    for (let i = 0; i < 14; i++) {
      const date = addDaysLocal(startDate, i);
      const key = toLocalDateKey(date);
      dates.push(key);
      console.log(`PilatesScheduleDisplay: Day ${i}: ${key}`);
    }
    
    return dates;
  };

  const getDayName = (dateStr: string): string => {
    // Use parseDateKeyLocal to match user panel and avoid timezone issues
    const date = parseDateKeyLocal(dateStr);
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return dayNames[date.getDay()];
  };

  const toggleSlot = (date: string, time: string) => {
    if (readOnly) return; // Don't allow toggling in read-only mode
    
    const key = `${date}-${time}`;
    setScheduleGrid(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSchedule = async () => {
    if (readOnly) return; // Don't allow saving in read-only mode
    
    try {
      setSaving(true);
      
      // Get ALL slots (both active and inactive)
      const allSlots: {date: string, time: string, is_active: boolean}[] = [];
      const weekDates = getWeekDates();
      
      weekDates.forEach(date => {
        timeSlots.forEach(time => {
          const key = `${date}-${time}`;
          allSlots.push({ 
            date, 
            time, 
            is_active: scheduleGrid[key] || false 
          });
        });
      });
      
      console.log('=== SAVE SCHEDULE START ===');
      console.log('Saving schedule with all slots:', allSlots.length);
      console.log('Week dates:', weekDates);
      console.log('Current grid state sample:', Object.entries(scheduleGrid).slice(0, 10));
      
      // First, get all existing slots for this week
      const { data: existingSlots, error: fetchError } = await supabase
        .from('pilates_schedule_slots')
        .select('*')
        .in('date', weekDates);
      
      if (fetchError) {
        console.error('Error fetching existing slots:', fetchError);
        throw fetchError;
      }
      
      console.log('Found existing slots:', existingSlots?.length || 0);
      if (existingSlots && existingSlots.length > 0) {
        console.log('Sample existing slots:', existingSlots.slice(0, 3));
      }
      
      // Delete all existing slots for this week
      if (existingSlots && existingSlots.length > 0) {
        const { error: deleteError } = await supabase
          .from('pilates_schedule_slots')
          .delete()
          .in('date', weekDates);
        
        if (deleteError) {
          console.error('Error deleting existing slots:', deleteError);
          throw deleteError;
        }
        
        console.log('✅ Deleted existing slots for week');
      } else {
        console.log('ℹ️ No existing slots to delete');
      }
      
      // Create ALL slots (both active and inactive)
      const slotsToCreate = allSlots.map(slot => ({
        date: slot.date,
        start_time: slot.time,
        end_time: getEndTime(slot.time),
        max_capacity: 4,
        is_active: slot.is_active
      }));
      
      console.log('Creating all slots:', slotsToCreate.slice(0, 3));
      console.log('Active slots count:', slotsToCreate.filter(s => s.is_active).length);
      console.log('Inactive slots count:', slotsToCreate.filter(s => !s.is_active).length);
      
      const { error: createError } = await supabase
        .from('pilates_schedule_slots')
        .insert(slotsToCreate);
      
      if (createError) {
        console.error('Error creating new slots:', createError);
        throw createError;
      }
      
      console.log('✅ Created all slots:', slotsToCreate.length);
      
      console.log('🔥🔥🔥 === SAVE SCHEDULE COMPLETE - REALTIME SYNC TRIGGERED ===');
      toast.success('Πρόγραμμα αποθηκεύθηκε επιτυχώς!');
      await loadSlots();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος');
    } finally {
      setSaving(false);
    }
  };

  const getEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours + 1, minutes);
    return endTime.toTimeString().slice(0, 5);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 14); // βήμα 2 εβδομάδων προς τα πίσω
    } else {
      newWeek.setDate(newWeek.getDate() + 14); // βήμα 2 εβδομάδων προς τα εμπρός
    }
    setCurrentWeek(newWeek);
  };

  const formatDate = (dateStr: string): string => {
    // Use parseDateKeyLocal to match user panel and avoid timezone issues
    const date = parseDateKeyLocal(dateStr);
    const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    return `${day} ${month}`;
  };

  const handleInfoClick = async (slotId: string, date: string, time: string) => {
    try {
      setLoadingSlotInfo(true);
      const bookings = await getPilatesSlotBookings(slotId);
      setSelectedSlotInfo({
        slotId,
        date,
        time,
        bookings
      });
    } catch (error) {
      console.error('Error loading slot info:', error);
      toast.error('Σφάλμα φόρτωσης πληροφοριών slot');
    } finally {
      setLoadingSlotInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-lg shadow-lg">{title}</h2>
          {!readOnly && <p className="text-gray-600 mt-2">{subtitle}</p>}
          {readOnly && trainerName && <p className="text-white bg-gray-700 px-3 py-1 rounded-full inline-block mt-2">Πρόγραμμα για {trainerName}</p>}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Force refresh current week calculation using Greek timezone
              const greekMonday = getGreekMondayOfCurrentWeek();
              setCurrentWeek(greekMonday);
              console.log('🔥🔥🔥 PILATES SCHEDULE: Force refreshed currentWeek to Greek Monday:', greekMonday.toISOString());
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Προηγούμενη
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Επόμενη →
          </button>
          {showAdminControls && !readOnly && (
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          2 εβδομάδες: {formatDate(weekDates[0])} - {formatDate(weekDates[13])}
        </h3>
        {!readOnly ? (
          <p className="text-sm text-blue-700">
            Κάντε κλικ στις κόκκινες ώρες για να τις απενεργοποιήσετε (δεν θα εμφανίζονται στους χρήστες)
          </p>
        ) : (
          <p className="text-sm text-blue-700">
            Προβολή προγράμματος Pilates - Δεν μπορείτε να κάνετε αλλαγές
          </p>
        )}
      </div>

      {/* Excel-like Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-r border-gray-200 min-w-[100px]">
                  Ώρα
                </th>
                {weekDates.map((date) => {
                  const isToday = date === toLocalDateKey(new Date());
                  return (
                    <th key={date} className={`px-4 py-3 text-center text-sm font-medium border-r border-gray-200 min-w-[120px] relative ${
                      isToday 
                        ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white shadow-lg animate-pulse' 
                        : 'text-gray-500 bg-gray-50'
                    }`}>
                      {isToday && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <span className="text-xs">🔥</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>{getDayName(date)}</span>
                        <span className={`text-xs ${isToday ? 'text-white/90' : 'text-gray-400'}`}>{formatDate(date)}</span>
                        {isToday && (
                          <div className="mt-1 flex items-center space-x-1">
                            <span className="text-xs">💪</span>
                            <span className="inline-block px-1 py-0.5 text-[9px] rounded-full bg-white/20 text-white font-bold animate-pulse">
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
            <tbody className="divide-y divide-gray-200">
              {timeSlots.map((time) => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                    {time}
                  </td>
                  {weekDates.map((date) => {
                    const key = `${date}-${time}`;
                    const isActive = scheduleGrid[key];
                    // Use parseDateKeyLocal to match user panel and avoid timezone issues
                    const dayOfWeek = parseDateKeyLocal(date).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
                    
                    const occVal = occupancy[key];
                    const booked = occVal?.booked ?? 0;
                    const cap = occVal?.cap ?? 4;
                    return (
                      <td key={key} className={`px-4 py-3 text-center border-r border-gray-200 relative ${
                        date === toLocalDateKey(new Date()) ? 'bg-gradient-to-r from-orange-50/60 via-pink-50/60 to-purple-50/60 border-l-2 border-orange-400' : ''
                      }`}>
                        {isWeekend ? (
                          <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">Σαβ/Κυρ</span>
                          </div>
                        ) : (
                          <div className="relative w-full h-8">
                            <button
                              onClick={() => {
                                if (readOnly && isActive) {
                                  // In read-only mode, clicking on active slots shows info
                                  const slot = slots.find(s => 
                                    s.date === date && s.start_time === `${time}:00`
                                  );
                                  if (slot) {
                                    handleInfoClick(slot.id, date, time);
                                  }
                                } else {
                                  // In admin mode, toggle slot
                                  toggleSlot(date, time);
                                }
                              }}
                              className={`w-full h-8 rounded transition-all duration-200 flex items-center justify-center ${
                                isActive
                                  ? (booked >= cap 
                                      ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                                      : 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300 hover:shadow-md hover:scale-105')
                                  : 'bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300'
                              } ${readOnly && isActive ? 'cursor-pointer hover:shadow-lg hover:scale-105' : readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                              title={readOnly && isActive && booked > 0 ? `Κάντε κλικ για λεπτομέρειες (${booked}/${cap})` : readOnly && isActive ? `Διαθέσιμο slot (${booked}/${cap})` : undefined}
                            >
                              {isActive ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-semibold">{booked}/{cap}</span>
                                  {readOnly && booked > 0 && (
                                    <span className="text-xs text-gray-500">👆</span>
                                  )}
                                </div>
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </button>
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Εξήγηση</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-800" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Διαθέσιμο</p>
              <p className="text-sm text-gray-600">Οι χρήστες μπορούν να κλείσουν μαθήματα</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-800" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Απενεργοποιημένο</p>
              <p className="text-sm text-gray-600">Δεν εμφανίζεται στους χρήστες</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">Σαβ/Κυρ</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Σαββατοκύριακο</p>
              <p className="text-sm text-gray-600">Δεν υπάρχουν μαθήματα</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {selectedSlotInfo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 mobile-safe-top mobile-safe-bottom"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSlotInfo(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Κρατήσεις για {formatDate(selectedSlotInfo.date)} στις {selectedSlotInfo.time}
                </h3>
                <button
                  onClick={() => setSelectedSlotInfo(null)}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {loadingSlotInfo ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  <span className="ml-3 text-gray-600">Φόρτωση...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSlotInfo.bookings.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
                        <p className="text-sm font-semibold text-gray-700 text-center">
                          📋 {selectedSlotInfo.bookings.length} κρατήσεις
                        </p>
                      </div>
                      {selectedSlotInfo.bookings.map((booking, index) => (
                        <div key={booking.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-lg">
                                {booking.user?.first_name} {booking.user?.last_name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{booking.user?.email}</p>
                              <div className="mt-2 text-xs text-gray-500 bg-white rounded-full px-3 py-1 inline-block">
                                📅 Κράτηση: {new Date(booking.booking_date).toLocaleDateString('el-GR')}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {booking.user?.first_name?.[0]}{booking.user?.last_name?.[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📅</span>
                      </div>
                      <p className="text-gray-500 text-lg">Δεν υπάρχουν κρατήσεις για αυτό το slot</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <button
                onClick={() => setSelectedSlotInfo(null)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-semibold"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Σημαντικές Πληροφορίες</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Κάθε ώρα έχει χωρητικότητα 4 χρήστες (4 κρεβάτια pilates)</li>
              {!readOnly && <li>• Κάντε κλικ στις ώρες που δεν θέλετε να δουλεύετε</li>}
              <li>• Το πρόγραμμα εμφανίζεται στους χρήστες με ενεργή pilates συνδρομή</li>
              {!readOnly && <li>• Μην ξεχάσετε να αποθηκεύσετε τις αλλαγές!</li>}
              {readOnly && <li>• Κάντε κλικ σε μαθήματα με κρατήσεις (με 👆) για να δείτε τις λεπτομέρειες</li>}
              {!readOnly && <li>• Κάντε κλικ στο μπλε κουμπί "i" για να δείτε τις κρατήσεις ενός slot</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilatesScheduleDisplay;
