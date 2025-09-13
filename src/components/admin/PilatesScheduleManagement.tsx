import React, { useState, useEffect } from 'react';
import { 
  Save, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  PilatesScheduleSlot
} from '@/types';
import { 
  getPilatesScheduleSlots
} from '@/utils/pilatesScheduleApi';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';

const PilatesScheduleManagement: React.FC = () => {
  const [slots, setSlots] = useState<PilatesScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleGrid, setScheduleGrid] = useState<{[key: string]: boolean}>({});
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Start with the same week as user panel - 13 Sep (Saturday)
    const adminWeek = new Date('2025-09-13T00:00:00.000Z');
    console.log('Admin: Using fixed week - 13 Sep:', adminWeek.toISOString());
    return adminWeek;
  });

  // Available time slots (Monday to Friday)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

  useEffect(() => {
    // Force refresh to avoid caching issues
    console.log('Admin: useEffect triggered - currentWeek changed to:', currentWeek.toISOString());
    loadSlots();
  }, [currentWeek]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      
      // Only load schedule slots, skip available slots for now
      const slotsData = await getPilatesScheduleSlots();
      setSlots(slotsData);
      // No need to set availableSlots anymore
      
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
    
    console.log('Admin: getWeekDates - currentWeek:', startDate);
    
    // Generate 10 days (2 weeks, Monday to Friday) starting from currentWeek
    // currentWeek is already Monday, so start from there
    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
      console.log(`Admin: Day ${i}: ${date.toISOString().split('T')[0]}`);
    }
    
    return dates;
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    return dayNames[date.getDay()];
  };

  const toggleSlot = (date: string, time: string) => {
    const key = `${date}-${time}`;
    setScheduleGrid(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSchedule = async () => {
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
      
      console.log('=== SAVE SCHEDULE COMPLETE ===');
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
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', { 
      day: 'numeric', 
      month: 'short' 
    });
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
          <h2 className="text-2xl font-bold text-gray-900">Πρόγραμμα Pilates</h2>
          <p className="text-gray-600">Κάντε κλικ στις ώρες που δεν θέλετε να είναι διαθέσιμες</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Force refresh current week calculation
              const today = new Date();
              const dayOfWeek = today.getDay();
              const monday = new Date(today);
              const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              monday.setDate(today.getDate() + daysToMonday);
              monday.setHours(0, 0, 0, 0);
              setCurrentWeek(monday);
              console.log('Admin: Force refreshed currentWeek to:', monday.toISOString());
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
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</span>
          </button>
        </div>
      </div>

      {/* Week Navigation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Εβδομάδα: {formatDate(weekDates[0])} - {formatDate(weekDates[9])}
        </h3>
        <p className="text-sm text-blue-700">
          Κάντε κλικ στις κόκκινες ώρες για να τις απενεργοποιήσετε (δεν θα εμφανίζονται στους χρήστες)
        </p>
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
                {weekDates.map((date, index) => (
                  <th key={date} className="px-4 py-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 min-w-[120px]">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{getDayName(date)}</span>
                      <span className="text-xs text-gray-400">{formatDate(date)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timeSlots.map((time) => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                    {time}
                  </td>
                  {weekDates.map((date, index) => {
                    const key = `${date}-${time}`;
                    const isActive = scheduleGrid[key];
                    const dayOfWeek = new Date(date).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
                    
                    return (
                      <td key={key} className="px-4 py-3 text-center border-r border-gray-200">
                        {isWeekend ? (
                          <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">Σαβ/Κυρ</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleSlot(date, time)}
                            className={`w-full h-8 rounded transition-all duration-200 flex items-center justify-center ${
                              isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300'
                                : 'bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300'
                            }`}
                          >
                            {isActive ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </button>
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Σημαντικές Πληροφορίες</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Κάθε ώρα έχει χωρητικότητα 4 χρήστες (4 κρεβάτια pilates)</li>
              <li>• Κάντε κλικ στις ώρες που δεν θέλετε να δουλεύετε</li>
              <li>• Το πρόγραμμα εμφανίζεται στους χρήστες με ενεργή pilates συνδρομή</li>
              <li>• Μην ξεχάσετε να αποθηκεύσετε τις αλλαγές!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilatesScheduleManagement;
