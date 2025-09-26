import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getAllGroupAssignmentsForMonth, getAllGroupProgramsForMonth } from '@/utils/groupAssignmentApi';
import { getBookedGroupSessionsForMonth, MonthlyBookedGroupSlotSummary } from '@/utils/groupSessionsApi';
import { GroupAssignment } from '@/types';
import toast from 'react-hot-toast';

interface GroupProgramsOverviewProps {
  onManageAssignments?: (programId: string, userId: string) => void;
}

const GroupProgramsOverview: React.FC<GroupProgramsOverviewProps> = React.memo(() => {
  const [currentDate, setCurrentDate] = useState(() => {
    // Use actual current date
    return new Date();
  });
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const [groupPrograms, setGroupPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedSummaries, setBookedSummaries] = useState<MonthlyBookedGroupSlotSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState<{[key: string]: boolean}>({});

  // Get current month and year
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const cacheKey = `${currentYear}-${currentMonth}`;

  useEffect(() => {
    if (!dataLoaded[cacheKey]) {
      loadData();
    }
  }, [currentMonth, currentYear, cacheKey]); // Removed dataLoaded from dependencies

  // Μετατροπή των booked summaries σε pseudo-assignments για ενιαία απεικόνιση
  const bookedAsAssignments: GroupAssignment[] = useMemo(() => {
    const assignments: GroupAssignment[] = [];
    
    bookedSummaries.forEach((s, sessionIdx) => {
      const day = new Date(s.session_date).getDay();
      
      // Δημιουργούμε ένα assignment για κάθε χρήστη που έχει κάνει κράτηση
      s.users.forEach((user, userIdx) => {
        assignments.push({
          id: `booked-${s.session_date}-${s.start_time}-${sessionIdx}-${userIdx}`,
          programId: '',
          userId: '',
          groupType: s.group_type,
          dayOfWeek: day,
          startTime: `${s.start_time}:00`,
          endTime: `${s.end_time}:00`,
          trainer: s.trainer,
          room: s.room,
          groupIdentifier: 'booked',
          weeklyFrequency: 0,
          assignmentDate: s.session_date,
          isActive: true,
          createdBy: '',
          createdAt: '',
          updatedAt: '',
          // Πραγματικές πληροφορίες χρήστη
          userInfo: {
            first_name: user.first_name,
            last_name: user.last_name
          }
        } as GroupAssignment);
      });
    });
    
    return assignments;
  }, [bookedSummaries]);

  const combinedAssignments: GroupAssignment[] = useMemo(() => {
    return [...groupAssignments, ...bookedAsAssignments];
  }, [groupAssignments, bookedAsAssignments]);

  // Memoize the grouped assignments to prevent unnecessary re-calculations
  const groupedAssignments = useMemo(() => {
    return combinedAssignments.reduce((acc: Record<string, any>, assignment: GroupAssignment) => {
      const key = `${assignment.assignmentDate}-${assignment.dayOfWeek}-${assignment.startTime}-${assignment.endTime}-${assignment.trainer}-${assignment.room}`;
      if (!acc[key]) {
        acc[key] = {
          dayOfWeek: assignment.dayOfWeek,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          trainer: assignment.trainer,
          room: assignment.room,
          groupType: assignment.groupType,
          groupIdentifier: assignment.groupIdentifier,
          assignmentDate: assignment.assignmentDate,
          assignments: []
        };
      }
      acc[key].assignments.push(assignment);
      return acc;
    }, {} as {[key: string]: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      trainer: string;
      room: string;
      groupType: number;
      groupIdentifier: string;
      assignmentDate: string;
      assignments: GroupAssignment[];
    }});
  }, [combinedAssignments]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[GroupProgramsOverview] ===== LOADING DATA =====');
      console.log('[GroupProgramsOverview] Current date object:', currentDate);
      console.log('[GroupProgramsOverview] Loading data for month:', currentMonth, 'year:', currentYear);
      console.log('[GroupProgramsOverview] Expected: December 2024 (month: 12, year: 2024)');
      
      const [assignments, programs, booked] = await Promise.all([
        getAllGroupAssignmentsForMonth(currentYear, currentMonth),
        getAllGroupProgramsForMonth(currentYear, currentMonth),
        getBookedGroupSessionsForMonth(currentYear, currentMonth)
      ]);
      setGroupAssignments(assignments);
      setGroupPrograms(programs);
      setBookedSummaries(booked);
      setDataLoaded(prev => ({ ...prev, [cacheKey]: true }));
      
      console.log('[GroupProgramsOverview] ===== RESULTS =====');
      console.log('[GroupProgramsOverview] Loaded assignments:', assignments.length);
      console.log('[GroupProgramsOverview] Loaded programs:', programs.length);
      console.log('[GroupProgramsOverview] Loaded booked summaries:', booked.length);
      
      if (assignments.length > 0) {
        console.log('[GroupProgramsOverview] Sample assignment:', assignments[0]);
      }
      if (programs.length > 0) {
        console.log('[GroupProgramsOverview] Sample program:', programs[0]);
      }
      
      // Διατηρώ μόνο logs για αναφορές
      console.log('[GroupProgramsOverview] Grouped assignments:', assignments.length, 'assignments');
    } catch (error) {
      console.error('Error loading group data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των ομαδικών προγραμμάτων');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrentMonth = () => {
    return currentDate.toLocaleDateString('el-GR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Handle session click - CLICKABLE SESSIONS (υποστηρίζει και booked sessions)
  const handleSessionClick = (dateStr: string, time: string) => {
    const dayAssignments = combinedAssignments.filter(a => a.assignmentDate === dateStr);
    const slotAssignments = dayAssignments.filter(a => a.startTime.startsWith(time));
    
    if (slotAssignments.length === 0) return;
    
    // Create session object for display
    const sessionData = {
      assignmentDate: dateStr,
      startTime: slotAssignments[0].startTime,
      endTime: slotAssignments[0].endTime,
      trainer: slotAssignments[0].trainer,
      room: slotAssignments[0].room,
      groupType: slotAssignments[0].groupType,
      groupIdentifier: slotAssignments[0].groupIdentifier || 'booked', // Fallback για booked sessions
      assignments: slotAssignments
    };
    
    setSelectedSession(sessionData);
  };

  // Memoized console logs to prevent excessive logging
  useEffect(() => {
    console.log('[GroupProgramsOverview] Grouped assignments keys:', Object.keys(groupedAssignments));
    console.log('[GroupProgramsOverview] Total grouped sessions:', Object.keys(groupedAssignments).length);
  }, [groupedAssignments]);

  // Sort grouped assignments by day and time
  const sortedGroupedAssignments = Object.values(groupedAssignments).sort((a: any, b: any) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση ομαδικών προγραμμάτων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Προγραμμα για τους <span className="text-black font-black">Group</span></h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadData}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              🔄 Ανανέωση
            </button>
            <button
              onClick={() => {
                console.log('[GroupProgramsOverview] ===== MANUAL TEST =====');
                console.log('Current date:', currentDate);
                console.log('Current month:', currentMonth);
                console.log('Current year:', currentYear);
                console.log('Assignments:', groupAssignments.length);
                console.log('Programs:', groupPrograms.length);
                toast(`Test: Month ${currentMonth}/${currentYear} - ${groupAssignments.length} assignments, ${groupPrograms.length} programs`);
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              🧪 Test
            </button>
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-semibold text-gray-800 min-w-[150px] text-center">
                {formatCurrentMonth()}
              </span>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>


      {/* ΑΠΛΟ ΜΗΝΙΑΙΟ CALENDAR */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">📅 Κλεισμένες Ομαδικές Σεσίες</h3>
          <p className="text-sm text-gray-600 mt-1">Μηνιαία προβολή - 🟢 Ελεύθερα | 🟡 Μισά | 🔴 Γεμάτα</p>
        </div>

        <div className="p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'].map((day) => (
              <div key={day} className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-100 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
              const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
              const calendarDays = [];
              
              // Empty cells before first day
              for (let i = 0; i < firstDayOfMonth; i++) {
                calendarDays.push(
                  <div key={`empty-${i}`} className="h-32 bg-gray-50 rounded-lg"></div>
                );
              }
              
              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                
                // Get assignments for this day
                const dayAssignments = combinedAssignments.filter(a => a.assignmentDate === dateStr);
                const uniqueTimes = [...new Set(dayAssignments.map(a => a.startTime.substring(0, 5)))];
                const timeSlotCount = uniqueTimes.length;
                
                calendarDays.push(
                  <div key={day} className={`min-h-32 ${timeSlotCount > 3 ? 'h-auto pb-2' : timeSlotCount > 2 ? 'h-40' : 'h-32'} border border-gray-200 rounded-lg p-2 bg-white hover:shadow-md transition-shadow`}>
                    {/* Day Number */}
                    <div className="text-sm font-bold text-gray-800 mb-2">{day}</div>
                    
                    {/* Time Slots */}
                    <div className="space-y-1">
                      {(() => {
                        // Get all unique times for this day and sort them
                        const uniqueTimes = [...new Set(dayAssignments.map(a => a.startTime.substring(0, 5)))].sort();
                        
                        return uniqueTimes.map((time) => {
                          const slotAssignments = dayAssignments.filter(a => a.startTime.startsWith(time));
                          
                          if (slotAssignments.length === 0) return null;
                        
                        // Get capacity info
                        const maxCapacity = slotAssignments[0]?.groupType || 3;
                        const occupancy = slotAssignments.length;
                        const percentage = (occupancy / maxCapacity) * 100;
                        
                        // Color coding - ΔΙΟΡΘΩΜΕΝΟ για υπερβάσεις
                        let bgColor = 'bg-green-200'; // Default: Ελεύθερα
                        let textColor = 'text-green-800';
                        let emoji = '🟢';
                        
                        if (occupancy >= maxCapacity) {
                          // Γεμάτα ή υπερβάσεις (π.χ. 3/2 = 150%)
                          bgColor = 'bg-red-200'; 
                          textColor = 'text-red-800';
                          emoji = '🔴';
                        } else if (percentage > 50) {
                          // Μισά (π.χ. 2/3 = 67%)
                          bgColor = 'bg-yellow-200';
                          textColor = 'text-yellow-800';
                          emoji = '🟡';
                        }
                        
                        return (
                          <div
                            key={time}
                            className={`text-xs rounded-lg px-2 py-1 ${bgColor} ${textColor} cursor-pointer hover:shadow-lg hover:scale-105 transition-all font-bold border-l-4 border-current transform`}
                            title={`Κλικ για λεπτομέρειες: ${time} - ${occupancy}/${maxCapacity} χρήστες - ${slotAssignments[0]?.trainer} - ${slotAssignments[0]?.room}`}
                            onClick={() => handleSessionClick(dateStr, time)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{time}</span>
                              <span className="text-xs">{emoji}</span>
                            </div>
                            <div className="text-center font-bold">{occupancy}/{maxCapacity}</div>
                          </div>
                        );
                        });
                      })()}
                    </div>
                  </div>
                );
              }
              
              return calendarDays;
            })()}
          </div>

          {/* ΑΠΛΟ Υπόμνημα */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3">🎨 Υπόμνημα Χρωμάτων</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-200 rounded-lg border-l-4 border-green-800"></div>
                <span className="text-sm font-bold">🟢 Ελεύθερα (≤50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-200 rounded-lg border-l-4 border-yellow-800"></div>
                <span className="text-sm font-bold">🟡 Μισά (51-99%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-200 rounded-lg border-l-4 border-red-800"></div>
                <span className="text-sm font-bold">🔴 Γεμάτα (100%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-100 rounded-lg"></div>
                <span className="text-sm font-bold">⚪ Κενά</span>
              </div>
            </div>
          </div>

          {/* CLICKABLE Λεπτομέρειες Σεσίων */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-800">📋 Λεπτομέρειες Σεσίων</h4>
              {selectedSession && (
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕ Κλείσιμο
                </button>
              )}
            </div>
            
            {!selectedSession ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <div className="text-4xl mb-3">👆</div>
                <h3 className="text-lg font-bold text-gray-600 mb-2">Κλικ σε ένα μάθημα</h3>
                <p className="text-gray-500">Επίλεξε ένα μάθημα από το calendar παραπάνω για να δεις τις λεπτομέρειες</p>
                <p className="text-sm text-gray-400 mt-2">Μπορείς να κάνεις κλικ σε οποιοδήποτε χρωματιστό κελί (🟢🟡🔴)</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    📅 {new Date(selectedSession.assignmentDate).toLocaleDateString('el-GR')} 
                    <span className="mx-2 text-gray-400">•</span>
                    ⏰ {selectedSession.startTime.substring(0, 5)} - {selectedSession.endTime.substring(0, 5)}
                  </div>
                  
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    selectedSession.assignments.length === selectedSession.groupType 
                      ? 'bg-red-200 text-red-800' 
                      : selectedSession.assignments.length >= selectedSession.groupType / 2
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {selectedSession.assignments.length}/{selectedSession.groupType} άτομα
                  </div>
                </div>
                
                <div className="text-gray-700 mb-3 font-medium">
                  👤 <strong>{selectedSession.trainer}</strong> 
                  <span className="mx-3">•</span>
                  🏠 <strong>{selectedSession.room}</strong>
                </div>
                
                {/* Χρήστες - ΑΠΛΑ */}
                <div>
                  <h5 className="text-sm font-bold text-gray-700 mb-2">👥 Μέλη στο Μάθημα:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.assignments.map((assignment: any) => (
                      <div key={assignment.id} className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        assignment.groupIdentifier === 'booked' 
                          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                      }`}>
                        {assignment.groupIdentifier === 'booked' ? '📅' : '👤'} {assignment.userInfo?.first_name} {assignment.userInfo?.last_name}
                      </div>
                    ))}
                  </div>
                  
                  {selectedSession.assignments.length === 0 && (
                    <p className="text-gray-500 italic text-sm">Δεν υπάρχουν εγγεγραμμένα μέλη</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Empty State - ΑΠΛΟ */}
          {sortedGroupedAssignments.length === 0 && (
            <div className="mt-6 text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Δεν υπάρχουν κλεισμένες σεσίες</h3>
              <p className="text-gray-500">για τον μήνα {formatCurrentMonth()}</p>
              <p className="text-sm text-gray-400 mt-2">Δημιούργησε νέα group προγράμματα για να δεις εδώ τις σεσίες!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GroupProgramsOverview;
