import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface Session {
  id: string;
  scheduleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  trainer: string;
  room?: string;
  status: string;
  notes?: string;
}

interface MonthlyScheduleSpreadsheetViewProps {
  sessions: Session[];
  trainerName: string;
  currentMonth: number;
  currentYear: number;
  onMonthChange?: (month: number, year: number) => void;
}

const MonthlyScheduleSpreadsheetView: React.FC<MonthlyScheduleSpreadsheetViewProps> = ({
  sessions,
  trainerName,
  currentMonth,
  currentYear,
  onMonthChange
}) => {
  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(0);
  // Group sessions by date and trainer
  const groupedSessions = useMemo(() => {
    const grouped: { [date: string]: { [trainer: string]: Session[] } } = {};
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate.getMonth() + 1 === currentMonth && sessionDate.getFullYear() === currentYear) {
        const dateKey = session.date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = {};
        }
        if (!grouped[dateKey][session.trainer]) {
          grouped[dateKey][session.trainer] = [];
        }
        grouped[dateKey][session.trainer].push(session);
      }
    });
    
    return grouped;
  }, [sessions, currentMonth, currentYear]);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const dayName = date.toLocaleDateString('el-GR', { weekday: 'short' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push({
        day,
        date: dateString,
        dayName,
        isWeekend
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('el-GR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Get current week's days
  const getCurrentWeekDays = () => {
    const startOfWeek = new Date(currentYear, currentMonth - 1, 1);
    const startDay = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const firstMonday = startDay === 0 ? 1 : startDay === 1 ? 1 : 8 - startDay + 1;
    
    const weekStart = firstMonday + (currentWeek * 7);
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const dayNumber = weekStart + i;
      if (dayNumber <= days.length) {
        const date = new Date(currentYear, currentMonth - 1, dayNumber);
        const dateString = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const dayName = date.toLocaleDateString('el-GR', { weekday: 'short' });
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        weekDays.push({
          day: dayNumber,
          date: dateString,
          dayName,
          isWeekend,
          index: i // Add index for unique keys
        });
      }
    }
    
    return weekDays;
  };

  const currentWeekDays = getCurrentWeekDays();

  // Handle month changes and set appropriate week
  useEffect(() => {
    if (currentWeek === -1) {
      // Set to last week of current month (which is the previous month after onMonthChange)
      const maxWeeks = Math.ceil(days.length / 7);
      setCurrentWeek(Math.max(0, maxWeeks - 1));
    } else {
      // Ensure currentWeek is always valid for the current month
      const maxWeeks = Math.ceil(days.length / 7);
      if (currentWeek >= maxWeeks) {
        setCurrentWeek(0);
      } else if (currentWeek < 0) {
        setCurrentWeek(0);
      }
    }
  }, [currentMonth, currentYear, days.length]); // Removed currentWeek to prevent infinite loops

  // Navigation functions
  const goToPreviousMonth = () => {
    if (onMonthChange) {
      const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      onMonthChange(newMonth, newYear);
      // Reset to first week when changing months
      setCurrentWeek(0);
    }
  };

  const goToNextMonth = () => {
    if (onMonthChange) {
      const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      onMonthChange(newMonth, newYear);
      // Reset to first week when changing months
      setCurrentWeek(0);
    }
  };

  const goToCurrentMonth = () => {
    if (onMonthChange) {
      const now = new Date();
      onMonthChange(now.getMonth() + 1, now.getFullYear());
      setCurrentWeek(0); // Reset to first week
    }
  };

  // Week navigation functions
  const goToPreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    } else {
      // Go to previous month and set to last week
      if (onMonthChange) {
        const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        onMonthChange(newMonth, newYear);
        // Set to last week of previous month (will be calculated after month change)
        setCurrentWeek(-1); // Will be set to last week in useEffect
      }
    }
  };

  const goToNextWeek = () => {
    const maxWeeks = Math.ceil(days.length / 7);
    if (currentWeek < maxWeeks - 1) {
      setCurrentWeek(currentWeek + 1);
    } else {
      // Go to next month and reset to first week
      if (onMonthChange) {
        const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        onMonthChange(newMonth, newYear);
        setCurrentWeek(0); // Reset to first week of next month
      }
    }
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const weekNumber = Math.floor((currentDay - 1) / 7);
    setCurrentWeek(weekNumber);
  };

  // Get time slots (1-hour slots from 8:00 to 20:00)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push({ startTime, endTime, hour });
    }
    return slots;
  }, []);

  // Get sessions for a specific day and time slot
  const getSessionsForDayAndTime = (date: string, timeSlot: { startTime: string; endTime: string }) => {
    const daySessions = groupedSessions[date] || {};
    const daySessionsForTrainer = daySessions[trainerName] || [];
    
    return daySessionsForTrainer.filter(session => {
      const sessionStart = session.startTime;
      const sessionEnd = session.endTime;
      
      // Check if session overlaps with time slot
      return sessionStart < timeSlot.endTime && sessionEnd > timeSlot.startTime;
    });
  };

  // Check if there are any sessions for the current week
  const hasSessions = useMemo(() => {
    return currentWeekDays.some(({ date }) => {
      const daySessions = groupedSessions[date] || {};
      const daySessionsForTrainer = daySessions[trainerName] || [];
      return daySessionsForTrainer.length > 0;
    });
  }, [currentWeekDays, groupedSessions, trainerName]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {monthName} - Εβδομάδα {currentWeek + 1}
            </h2>
            <p className="text-blue-100 text-xs">Πρόγραμμα {trainerName}</p>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            {/* Month Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                title="Προηγούμενος μήνας"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              
              <button
                onClick={goToCurrentMonth}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                title="Τρέχοντας μήνας"
              >
                Σήμερα
              </button>
              
              <button
                onClick={goToNextMonth}
                className="p-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                title="Επόμενος μήνας"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center space-x-1 border-l border-white/30 pl-2">
              <button
                onClick={goToPreviousWeek}
                className="p-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                title="Προηγούμενη εβδομάδα"
                disabled={currentWeek === 0}
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              
              <button
                onClick={goToCurrentWeek}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                title="Τρέχουσα εβδομάδα"
              >
                Εβδομάδα
              </button>
              
              <button
                onClick={goToNextWeek}
                className="p-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                title="Επόμενη εβδομάδα"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Weekly View */}
      <div className="overflow-x-auto">
        {hasSessions ? (
          <div className="min-w-full">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-8 gap-0 min-w-[600px]">
                {/* Time column header */}
                <div className="col-span-1 p-2 text-xs font-semibold text-gray-700 bg-gray-100 border-r border-gray-200">
                  Ώρα
                </div>
                
                {/* Day headers - current week days */}
                {currentWeekDays.map(({ day, date, dayName, isWeekend, index }) => (
                  <div
                    key={`week-day-${currentMonth}-${currentYear}-${currentWeek}-${index}-${date}`}
                    className={`col-span-1 p-1 text-center text-xs font-semibold border-r border-gray-200 ${
                      isWeekend 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{day}</div>
                    <div className="text-xs opacity-75">{dayName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time slots and sessions */}
            <div className="divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot.startTime} className="grid grid-cols-8 gap-0 min-w-[600px]">
                  {/* Time slot header */}
                  <div className="col-span-1 p-1 text-xs font-medium text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                    {timeSlot.startTime}
                  </div>
                  
                  {/* Sessions for each day - current week days */}
                  {currentWeekDays.map(({ day, date, isWeekend, index }) => {
                    const sessionsForSlot = getSessionsForDayAndTime(date, timeSlot);
                    
                    return (
                      <div
                        key={`week-slot-${currentMonth}-${currentYear}-${currentWeek}-${timeSlot.startTime}-${index}-${date}`}
                        className={`col-span-1 p-1 border-r border-gray-200 min-h-[40px] ${
                          isWeekend ? 'bg-red-25' : 'bg-white'
                        }`}
                      >
                        {sessionsForSlot.map((session, sessionIndex) => (
                          <div
                            key={`session-${currentMonth}-${currentYear}-${currentWeek}-${timeSlot.startTime}-${index}-${date}-${session.id || `tmp-${session.scheduleId || 'unknown'}-${sessionIndex}-${session.userId || 'user'}`}`}
                            className={`p-1 rounded text-xs border-l-2 ${
                              session.type === 'personal' 
                                ? 'bg-blue-50 border-blue-400 text-blue-800'
                                : session.type === 'kickboxing'
                                ? 'bg-red-50 border-red-400 text-red-800'
                                : 'bg-green-50 border-green-400 text-green-800'
                            }`}
                          >
                            <div className="font-semibold truncate text-xs" title={session.userName}>
                              {session.userName}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {session.startTime}
                            </div>
                            <div className={`text-xs font-medium ${
                              session.status === 'accepted' 
                                ? 'text-green-700'
                                : session.status === 'declined'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                            }`}>
                              {session.status === 'accepted' ? '✓' :
                               session.status === 'declined' ? '✗' :
                               '?'}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Δεν υπάρχουν προγραμματισμένες σεσίας</h3>
            <p className="text-gray-500">Για τον μήνα {monthName}</p>
          </div>
        )}
      </div>

      {/* Compact Legend */}
      <div className="mt-2 p-2 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-50 border-l-2 border-blue-400 rounded"></div>
            <span>Personal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-50 border-l-2 border-red-400 rounded"></div>
            <span>Kick Boxing</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-50 border-l-2 border-green-400 rounded"></div>
            <span>Combo</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>✓ Αποδεκτό</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>? Εκκρεμεί</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>✗ Απορριφθέν</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyScheduleSpreadsheetView;
