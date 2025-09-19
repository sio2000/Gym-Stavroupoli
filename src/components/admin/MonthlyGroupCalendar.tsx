import React from 'react';
import { GroupAssignment } from '@/types';

interface MonthlyGroupCalendarProps {
  assignments: GroupAssignment[];
  currentMonth: number;
  currentYear: number;
}

const MonthlyGroupCalendar: React.FC<MonthlyGroupCalendarProps> = ({
  assignments,
  currentMonth,
  currentYear
}) => {
  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  
  // Group assignments for detailed display
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const key = `${assignment.assignmentDate}-${assignment.startTime}-${assignment.endTime}-${assignment.trainer}-${assignment.room}`;
    if (!acc[key]) {
      acc[key] = {
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        trainer: assignment.trainer,
        room: assignment.room,
        groupType: assignment.groupType,
        assignmentDate: assignment.assignmentDate,
        assignments: []
      };
    }
    acc[key].assignments.push(assignment);
    return acc;
  }, {} as any);

  const sortedGroupedAssignments = Object.values(groupedAssignments);

  // Get color based on capacity
  const getSlotColor = (assignments: GroupAssignment[], maxCapacity: number) => {
    const occupancy = assignments.length;
    const percentage = (occupancy / maxCapacity) * 100;
    
    if (percentage === 0) return 'bg-white border-gray-200'; // Empty
    if (percentage <= 50) return 'bg-green-100 border-green-300 text-green-800'; // Available
    if (percentage < 100) return 'bg-yellow-100 border-yellow-300 text-yellow-800'; // Half full
    return 'bg-red-100 border-red-300 text-red-800'; // Full
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
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
            const dayAssignments = assignments.filter(a => a.assignmentDate === dateStr);
            
            calendarDays.push(
              <div key={day} className="h-32 border border-gray-200 rounded-lg p-2 bg-white hover:shadow-sm transition-shadow">
                {/* Day Number */}
                <div className="text-sm font-bold text-gray-800 mb-2">{day}</div>
                
                {/* Time Slots */}
                <div className="space-y-1">
                  {['09:00', '10:00', '18:00', '19:00'].map((time) => {
                    const slotAssignments = dayAssignments.filter(a => a.startTime.startsWith(time));
                    
                    if (slotAssignments.length === 0) return null;
                    
                    // Get capacity info
                    const maxCapacity = slotAssignments[0]?.groupType || 3;
                    const occupancy = slotAssignments.length;
                    const percentage = (occupancy / maxCapacity) * 100;
                    
                    // Color coding - ΠΟΛΥ ΑΠΛΟ
                    let bgColor = 'bg-green-200'; // Default: Ελεύθερα
                    let textColor = 'text-green-800';
                    
                    if (percentage > 50 && percentage < 100) {
                      bgColor = 'bg-yellow-200'; // Μισά
                      textColor = 'text-yellow-800';
                    } else if (percentage === 100) {
                      bgColor = 'bg-red-200'; // Γεμάτα
                      textColor = 'text-red-800';
                    }
                    
                    return (
                      <div
                        key={time}
                        className={`text-xs rounded px-1 py-0.5 ${bgColor} ${textColor} cursor-pointer hover:shadow-sm transition-all font-bold`}
                        title={`${time} - ${occupancy}/${maxCapacity} χρήστες - ${slotAssignments[0]?.trainer}`}
                      >
                        <div>{time}</div>
                        <div>{occupancy}/{maxCapacity}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          
          return calendarDays;
        })()}
      </div>

      {/* ΑΠΛΟ Υπόμνημα */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3">🎨 Χρώματα</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-200 rounded-lg"></div>
            <span className="text-sm font-bold">🟢 Ελεύθερα</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-200 rounded-lg"></div>
            <span className="text-sm font-bold">🟡 Μισά</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-200 rounded-lg"></div>
            <span className="text-sm font-bold">🔴 Γεμάτα</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-100 rounded-lg"></div>
            <span className="text-sm font-bold">⚪ Κενά</span>
          </div>
        </div>
      </div>

      {/* ΑΠΛΗ Λίστα Σεσίων */}
      {sortedGroupedAssignments.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-lg font-bold text-gray-800">📋 Λίστα Σεσίων</h4>
          {sortedGroupedAssignments.map((sessionGroup: any, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-gray-900">
                  📅 {new Date(sessionGroup.assignmentDate).toLocaleDateString('el-GR')} 
                  <span className="mx-2">•</span>
                  ⏰ {sessionGroup.startTime.substring(0, 5)} - {sessionGroup.endTime.substring(0, 5)}
                </div>
                
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                  sessionGroup.assignments.length === sessionGroup.groupType 
                    ? 'bg-red-200 text-red-800' 
                    : sessionGroup.assignments.length >= sessionGroup.groupType / 2
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-green-200 text-green-800'
                }`}>
                  {sessionGroup.assignments.length}/{sessionGroup.groupType} άτομα
                </div>
              </div>
              
              <div className="text-gray-700 mb-3">
                👤 <strong>{sessionGroup.trainer}</strong> • 🏠 <strong>{sessionGroup.room}</strong>
              </div>
              
              {/* Χρήστες */}
              <div className="flex flex-wrap gap-2">
                {sessionGroup.assignments.map((assignment: GroupAssignment) => (
                  <div key={assignment.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    👤 {assignment.userInfo?.first_name} {assignment.userInfo?.last_name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyGroupCalendar;
