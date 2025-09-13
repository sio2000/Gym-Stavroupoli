import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface MonthlyScheduleViewProps {
  sessions: Session[];
  trainerName: string;
  currentMonth: number;
  currentYear: number;
  onMonthChange?: (month: number, year: number) => void;
}

const MonthlyScheduleView: React.FC<MonthlyScheduleViewProps> = ({
  sessions,
  trainerName,
  currentMonth,
  currentYear,
  onMonthChange
}) => {
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
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('el-GR', { weekday: 'long' });
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

  // Navigation functions
  const goToPreviousMonth = () => {
    if (onMonthChange) {
      const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      onMonthChange(newMonth, newYear);
    }
  };

  const goToNextMonth = () => {
    if (onMonthChange) {
      const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      onMonthChange(newMonth, newYear);
    }
  };

  const goToCurrentMonth = () => {
    if (onMonthChange) {
      const now = new Date();
      onMonthChange(now.getMonth() + 1, now.getFullYear());
    }
  };

  // Get all trainers from sessions
  const trainers = useMemo(() => {
    const trainerSet = new Set<string>();
    sessions.forEach(session => trainerSet.add(session.trainer));
    return Array.from(trainerSet).sort();
  }, [sessions]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {monthName}
            </h2>
            <p className="text-blue-100 text-sm">Πρόγραμμα {trainerName}</p>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Προηγούμενος μήνας"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={goToCurrentMonth}
              className="px-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs font-medium"
              title="Τρέχων μήνας"
            >
              Σήμερα
            </button>
            
            <button
              onClick={goToNextMonth}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Επόμενος μήνας"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-First Calendar */}
      <div className="p-3">
        {/* Simple List View for Mobile */}
        <div className="space-y-3">
          {days.map(({ day, date, dayName, isWeekend }) => {
            const daySessions = groupedSessions[date] || {};
            const daySessionsForTrainer = daySessions[trainerName] || [];
            
            if (daySessionsForTrainer.length === 0) return null;
            
            return (
              <div key={date} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                {/* Day Header */}
                <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                  isWeekend ? 'border-red-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isWeekend 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {day}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{dayName}</div>
                      <div className="text-xs text-gray-500">{date}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {daySessionsForTrainer.length} σεσίας
                  </div>
                </div>

                {/* Sessions for this day */}
                <div className="space-y-2">
                  {daySessionsForTrainer.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        session.type === 'personal' 
                          ? 'bg-blue-50 border-blue-400'
                          : session.type === 'kickboxing'
                          ? 'bg-red-50 border-red-400'
                          : 'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {session.userName}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                            {session.room && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{session.room}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'accepted' 
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status === 'accepted' ? 'Αποδεκτό' :
                           session.status === 'declined' ? 'Απορριφθέν' :
                           'Εκκρεμεί'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show message if no sessions */}
        {days.every(({ date }) => {
          const daySessions = groupedSessions[date] || {};
          const daySessionsForTrainer = daySessions[trainerName] || [];
          return daySessionsForTrainer.length === 0;
        }) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Δεν υπάρχουν προγραμματισμένες σεσίας</h3>
            <p className="text-gray-500">Για τον μήνα {monthName}</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Υπόμνημα</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded flex-shrink-0"></div>
              <span>Personal Training</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex-shrink-0"></div>
              <span>Kick Boxing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
              <span>Combo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 rounded flex-shrink-0"></div>
              <span>Αποδεκτό</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 rounded flex-shrink-0"></div>
              <span>Εκκρεμεί</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 rounded flex-shrink-0"></div>
              <span>Απορριφθέν</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyScheduleView;