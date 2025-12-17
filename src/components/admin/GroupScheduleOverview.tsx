import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, MapPin } from 'lucide-react';
import { getAvailableGroupSlots, getGroupSlotAssignments } from '@/utils/groupAssignmentApi';
import { GroupScheduleTemplate, GroupAssignment } from '@/types';
import toast from 'react-hot-toast';

const GroupScheduleOverview: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupSlots, setGroupSlots] = useState<GroupScheduleTemplate[]>([]);
  const [slotAssignments, setSlotAssignments] = useState<{[key: string]: GroupAssignment[]}>({});
  const [loading, setLoading] = useState(true);

  // Time slots for the schedule
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '17:00', '18:00', '19:00', '20:00'
  ];

  // Days of the week (Monday to Saturday)
  const weekDays = [
    { day: 1, name: 'Δευτέρα' },
    { day: 2, name: 'Τρίτη' },
    { day: 3, name: 'Τετάρτη' },
    { day: 4, name: 'Πέμπτη' },
    { day: 5, name: 'Παρασκευή' },
    { day: 6, name: 'Σάββατο' }
  ];

  useEffect(() => {
    loadGroupScheduleData();
  }, []);

  const loadGroupScheduleData = async () => {
    try {
      setLoading(true);
      
      // Load all group slots
      const slots = await getAvailableGroupSlots();
      setGroupSlots(slots);

      // Load assignments for each slot
      const assignments: {[key: string]: GroupAssignment[]} = {};
      
      for (const slot of slots) {
        try {
          const slotAssignments = await getGroupSlotAssignments(slot.groupIdentifier);
          assignments[slot.groupIdentifier] = slotAssignments;
        } catch (error) {
          console.error('Error loading assignments for slot:', slot.groupIdentifier, error);
          assignments[slot.groupIdentifier] = [];
        }
      }
      
      setSlotAssignments(assignments);
    } catch (error) {
      console.error('Error loading group schedule data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  const getSlotForTimeAndDay = (time: string, dayOfWeek: number, groupType: number) => {
    return groupSlots.find(slot => 
      slot.startTime === time + ':00' && 
      slot.dayOfWeek === dayOfWeek && 
      slot.groupType === groupType
    );
  };

  const getSlotColor = (slot: GroupScheduleTemplate | undefined) => {
    if (!slot) return 'bg-gray-100';
    
    const currentAssignments = slot.currentAssignments || 0;
    const maxCapacity = slot.maxCapacity || 0;
    
    if (currentAssignments === 0) return 'bg-gray-100';
    if (currentAssignments >= maxCapacity) return 'bg-red-100 border-red-300';
    if (currentAssignments >= maxCapacity * 0.8) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση προγράμματος...</p>
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
            <h2 className="text-xl font-bold text-gray-800">Επισκόπηση Ομαδικών Προγραμμάτων</h2>
          </div>
          <div className="flex items-center space-x-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{groupSlots.length}</div>
            <div className="text-sm text-blue-700">Συνολικές Θέσεις</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {groupSlots.reduce((sum, slot) => sum + (slot.currentAssignments || 0), 0)}
            </div>
            <div className="text-sm text-green-700">Κλεισμένες Θέσεις</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {groupSlots.reduce((sum, slot) => sum + (slot.availableSpots || 0), 0)}
            </div>
            <div className="text-sm text-orange-700">Διαθέσιμες Θέσεις</div>
          </div>
        </div>
      </div>

      {/* Group Schedule Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Εβδομαδιαίο Πρόγραμμα Ομάδων</h3>
          <p className="text-sm text-gray-600 mt-1">Κλεισμένες ώρες και μέλη κάθε ομάδας</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              <div className="p-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
                Ώρα
              </div>
              {weekDays.map(({ name }) => (
                <div key={name} className="p-3 text-sm font-semibold text-gray-700 text-center border-r border-gray-200 last:border-r-0">
                  {name}
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                {/* Time Column */}
                <div className="p-3 bg-gray-50 border-r border-gray-200 flex items-center">
                  <div className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    {time}
                  </div>
                </div>

                {/* Day Columns */}
                {weekDays.map(({ day }) => (
                  <div key={`${time}-${day}`} className="border-r border-gray-200 last:border-r-0 min-h-[120px]">
                    {/* Group Types for this time slot */}
                    <div className="p-2 space-y-1">
                      {[2, 3, 6].map((groupType) => {
                        const slot = getSlotForTimeAndDay(time, day, groupType);
                        const assignments = slot ? slotAssignments[slot.groupIdentifier] || [] : [];
                        
                        return (
                          <div
                            key={`${time}-${day}-${groupType}`}
                            className={`p-2 rounded border text-xs ${getSlotColor(slot)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700">
                                👥 {groupType}
                              </span>
                              {slot && (
                                <span className="text-xs text-gray-600">
                                  {slot.currentAssignments}/{slot.maxCapacity}
                                </span>
                              )}
                            </div>
                            
                            {slot && (
                              <div className="text-xs text-gray-600 mb-1">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {slot.trainer}
                                </div>
                              </div>
                            )}
                            
                            {assignments.length > 0 && (
                              <div className="space-y-1">
                                {assignments.map((assignment, idx) => (
                                  <div key={assignment.id || idx} className="text-xs bg-white bg-opacity-70 rounded px-1 py-0.5">
                                    <div className="font-medium text-gray-800 truncate">
                                      {assignment.userInfo?.first_name} {assignment.userInfo?.last_name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {slot && assignments.length === 0 && (
                              <div className="text-xs text-gray-500 italic">
                                Κενό
                              </div>
                            )}
                            
                            {!slot && (
                              <div className="text-xs text-gray-400 italic">
                                Πλήρες/Μη διαθέσιμο
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Υπόμνημα</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Κενό</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Διαθέσιμο</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Σχεδόν Γεμάτο</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">Πλήρες</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupScheduleOverview;
