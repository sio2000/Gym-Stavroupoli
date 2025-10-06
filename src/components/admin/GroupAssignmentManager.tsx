import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, MapPin, Plus, Trash2, Check, AlertTriangle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  GroupScheduleTemplate, 
  GroupAssignment, 
  UserWithPersonalTraining,
  UserWeeklyAssignment,
  PersonalTrainingSession 
} from '@/types';
import { 
  getAvailableGroupSlots,
  createGroupAssignment,
  getUserGroupAssignments,
  getGroupSlotAssignments,
  removeGroupAssignment,
  getUserWeeklyAssignments,
  validateGroupAssignment,
  getDayName,
  formatTime,
  getGroupTypeDisplayName,
  sendGroupProgramNotification
} from '@/utils/groupAssignmentApi';
import { supabase } from '@/config/supabase';

interface GroupAssignmentManagerProps {
  selectedUser: UserWithPersonalTraining;
  programId: string;
  weeklyFrequency: number;
  onAssignmentComplete?: () => void;
}

const GroupAssignmentManager: React.FC<GroupAssignmentManagerProps> = ({
  selectedUser,
  programId,
  weeklyFrequency,
  onAssignmentComplete
}) => {
  const [availableSlots, setAvailableSlots] = useState<GroupScheduleTemplate[]>([]);
  const [userAssignments, setUserAssignments] = useState<GroupAssignment[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<GroupScheduleTemplate | null>(null);
  const [slotAssignments, setSlotAssignments] = useState<GroupAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [weeklyAssignmentSummary, setWeeklyAssignmentSummary] = useState<UserWeeklyAssignment[]>([]);
  // Sessions filter (Νέες/Υπάρχουσες) like personal individual
  const [sessionFilter, setSessionFilter] = useState<'new' | 'existing'>('new');
  const [existingSessions, setExistingSessions] = useState<PersonalTrainingSession[]>([]);
  const [loadingExistingSessions, setLoadingExistingSessions] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [selectedUser.id, programId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAvailableSlots(),
        loadUserAssignments(),
        loadWeeklyAssignmentSummary()
      ]);
    } catch (error) {
      console.error('Failed to load group assignment data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  // Load existing personal sessions for the selected user (for banner and reuse like individual)
  const loadExistingSessions = async (userId: string) => {
    if (!userId) return;
    setLoadingExistingSessions(true);
    try {
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('schedule_data, sessions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[GroupAssignmentManager] Error loading existing sessions:', error);
        toast.error('Σφάλμα κατά τη φόρτωση των υπαρχόντων σεσιών');
        setExistingSessions([]);
        return;
      }

      if (data && data.length > 0) {
        // Support both schemas: schedule_data.sessions or flat sessions
        const scheduleData: any = data[0];
        const sessions: PersonalTrainingSession[] =
          scheduleData?.schedule_data?.sessions || scheduleData?.sessions || [];
        setExistingSessions(sessions);
        if (sessions.length > 0) {
          toast.success(`Φορτώθηκαν ${sessions.length} υπάρχουσες σεσίες`);
        }
      } else {
        setExistingSessions([]);
      }
    } catch (e) {
      console.error('[GroupAssignmentManager] Exception loading existing sessions:', e);
      setExistingSessions([]);
    } finally {
      setLoadingExistingSessions(false);
    }
  };

  // Auto-load when switching to Υπάρχουσες and user changes
  useEffect(() => {
    if (sessionFilter === 'existing' && selectedUser?.id) {
      loadExistingSessions(selectedUser.id);
    }
  }, [sessionFilter, selectedUser?.id]);

  const loadAvailableSlots = async () => {
    try {
      const slots = await getAvailableGroupSlots(selectedDayFilter || undefined);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      throw error;
    }
  };

  const loadUserAssignments = async () => {
    try {
      const assignments = await getUserGroupAssignments(selectedUser.id, programId);
      setUserAssignments(assignments);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
      throw error;
    }
  };

  const loadWeeklyAssignmentSummary = async () => {
    try {
      const summary = await getUserWeeklyAssignments(selectedUser.id, programId);
      setWeeklyAssignmentSummary(summary);
    } catch (error) {
      console.error('Failed to load weekly assignment summary:', error);
      throw error;
    }
  };

  const loadSlotAssignments = async (groupIdentifier: string) => {
    try {
      const assignments = await getGroupSlotAssignments(groupIdentifier);
      setSlotAssignments(assignments);
    } catch (error) {
      console.error('Failed to load slot assignments:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αναθέσεων');
    }
  };

  const handleSlotSelect = async (slot: GroupScheduleTemplate) => {
    setSelectedSlot(slot);
    await loadSlotAssignments(slot.groupIdentifier);
  };

  const handleAssignUser = async () => {
    if (!selectedSlot) {
      toast.error('Παρακαλώ επιλέξτε μια ομαδική θέση');
      return;
    }

    try {
      setLoading(true);

      // Validate assignment first
      const validation = await validateGroupAssignment(
        selectedUser.id,
        programId,
        selectedSlot.groupIdentifier,
        selectedSlot.dayOfWeek,
        selectedSlot.startTime,
        selectedSlot.endTime,
        weeklyFrequency
      );

      if (!validation.isValid) {
        toast.error(`Δεν είναι δυνατή η ανάθεση: ${validation.errorMessage}`);
        return;
      }

      // Create the assignment
      const result = await createGroupAssignment(
        programId,
        selectedUser.id,
        selectedSlot.groupIdentifier,
        weeklyFrequency,
        assignmentNotes
      );

      if (result.success) {
        toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς!');
        setAssignmentNotes('');
        
        // Reload data
        await loadData();
        await loadSlotAssignments(selectedSlot.groupIdentifier);
        
        // Check if user has completed their required weekly frequency
        const updatedAssignments = await getUserGroupAssignments(selectedUser.id, programId);
        const currentWeeklyAssignments = updatedAssignments.length;
        
        // If user has reached their weekly frequency, send program notification
        if (currentWeeklyAssignments >= weeklyFrequency) {
          const notificationSent = await sendGroupProgramNotification(
            selectedUser.id,
            programId,
            updatedAssignments
          );
          
          if (notificationSent) {
            toast.success(`🎉 Το πρόγραμμα ολοκληρώθηκε! Ο χρήστης ${selectedUser.firstName} ${selectedUser.lastName} θα λάβει ενημέρωση.`);
          }
        }
        
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      } else {
        toast.error(`Σφάλμα: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to assign user:', error);
      toast.error('Σφάλμα κατά τη δημιουργία της ανάθεσης');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή την ανάθεση;')) {
      return;
    }

    try {
      setLoading(true);
      const success = await removeGroupAssignment(assignmentId);
      
      if (success) {
        toast.success('Η ανάθεση αφαιρέθηκε επιτυχώς');
        await loadData();
        if (selectedSlot) {
          await loadSlotAssignments(selectedSlot.groupIdentifier);
        }
      } else {
        toast.error('Σφάλμα κατά την αφαίρεση της ανάθεσης');
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      toast.error('Σφάλμα κατά την αφαίρεση της ανάθεσης');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeeklyAssignments = () => {
    return userAssignments.length;
  };

  const getRemainingAssignments = () => {
    return Math.max(0, weeklyFrequency - getCurrentWeeklyAssignments());
  };

  const isAssignmentComplete = () => {
    return getCurrentWeeklyAssignments() >= weeklyFrequency;
  };
  
  // Helper function to get completion status message
  const getCompletionStatusMessage = () => {
    const current = getCurrentWeeklyAssignments();
    const required = weeklyFrequency;
    
    if (current === 0) {
      return `Δεν έχουν γίνει αναθέσεις ακόμα. Απαιτούνται ${required} αναθέσεις.`;
    } else if (current < required) {
      return `Έχουν γίνει ${current} από ${required} απαιτούμενες αναθέσεις. Απομένουν ${required - current}.`;
    } else {
      return `✅ Ολοκληρώθηκαν όλες οι αναθέσεις! Ο χρήστης θα λάβει ενημέρωση για το πρόγραμμά του.`;
    }
  };

  const getDayFilterOptions = () => {
    return [
      { value: null, label: 'Όλες οι ημέρες' },
      { value: 1, label: 'Δευτέρα' },
      { value: 2, label: 'Τρίτη' },
      { value: 3, label: 'Τετάρτη' },
      { value: 4, label: 'Πέμπτη' },
      { value: 5, label: 'Παρασκευή' },
      { value: 6, label: 'Σάββατο' }
    ];
  };

  const getSlotStatusColor = (slot: GroupScheduleTemplate) => {
    if (slot.isFull) return 'bg-red-100 border-red-300 text-red-700';
    if (slot.availableSpots <= 1) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    return 'bg-green-100 border-green-300 text-green-700';
  };

  const isUserAssignedToSlot = (slot: GroupScheduleTemplate) => {
    return userAssignments.some(assignment => 
      assignment.groupIdentifier === slot.groupIdentifier
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with User Info and Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-800">
              Ανάθεση Ομαδικών Θέσεων - {selectedUser.firstName} {selectedUser.lastName}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {isAssignmentComplete() ? (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Ολοκληρώθηκε</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1 rounded-full">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Σε εξέλιξη</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Στόχος Εβδομάδας</div>
            <div className="text-2xl font-bold text-blue-600">{weeklyFrequency}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Τρέχουσες Αναθέσεις</div>
            <div className="text-2xl font-bold text-green-600">{getCurrentWeeklyAssignments()}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Υπολείπονται</div>
            <div className="text-2xl font-bold text-orange-600">{getRemainingAssignments()}</div>
          </div>
        </div>
        
        {/* Completion Status Message */}
        <div className={`mt-4 p-4 rounded-lg ${isAssignmentComplete() ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm font-medium ${isAssignmentComplete() ? 'text-green-700' : 'text-blue-700'}`}>
            {getCompletionStatusMessage()}
          </p>
        </div>
      </div>

      {/* Session Filter Toggle Buttons (Νέες/Υπάρχουσες) */}
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Φίλτρο Σεσιών:</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSessionFilter('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sessionFilter === 'new' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🆕 Νέες Σεσίες
            </button>
            <button
              onClick={() => {
                setSessionFilter('existing');
                if (selectedUser?.id) {
                  loadExistingSessions(selectedUser.id);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sessionFilter === 'existing' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📚 Υπάρχουσες Σεσίες{loadingExistingSessions && <span className="ml-2">⏳</span>}
            </button>
          </div>
          {sessionFilter === 'existing' && existingSessions.length > 0 && (
            <div className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-lg">
              ✅ {existingSessions.length} υπάρχουσες σεσίες φορτώθηκαν
            </div>
          )}
          {sessionFilter === 'existing' && existingSessions.length === 0 && !loadingExistingSessions && (
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              ℹ️ Δεν βρέθηκαν υπάρχουσες σεσίες
            </div>
          )}
        </div>
      </div>

      {/* Current User Assignments */}
      {userAssignments.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Τρέχουσες Αναθέσεις
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-blue-800">
                      {getDayName(assignment.dayOfWeek)} - {getGroupTypeDisplayName(assignment.groupType)}
                    </div>
                    <div className="text-sm text-blue-600">
                      {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
                    </div>
                    <div className="text-sm text-blue-600">
                      Προπονητής: {assignment.trainer}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Αφαίρεση ανάθεσης"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {assignment.notes && (
                  <div className="text-xs text-gray-600 mt-2">
                    Σημειώσεις: {assignment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Slots */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Διαθέσιμες Ομαδικές Θέσεις
          </h4>
          
          {/* Day Filter */}
          <select
            value={selectedDayFilter || ''}
            onChange={(e) => {
              const day = e.target.value ? parseInt(e.target.value) : null;
              setSelectedDayFilter(day);
              loadAvailableSlots();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {getDayFilterOptions().map((option) => (
              <option key={option.value || 'all'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSlots.map((slot) => {
            const isAssigned = isUserAssignedToSlot(slot);
            const canAssign = !isAssigned && !slot.isFull && !isAssignmentComplete();
            
            return (
              <div
                key={slot.id}
                className={`rounded-lg p-4 border-2 cursor-pointer transition-all ${
                  selectedSlot?.id === slot.id
                    ? 'border-blue-500 bg-blue-50'
                    : `border-gray-200 hover:border-gray-300 ${getSlotStatusColor(slot)}`
                } ${!canAssign ? 'opacity-60' : ''}`}
                onClick={() => canAssign && handleSlotSelect(slot)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {getDayName(slot.dayOfWeek)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {slot.trainer} - {slot.room}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">
                      {getGroupTypeDisplayName(slot.groupType)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {slot.currentAssignments}/{slot.maxCapacity}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slot.isFull 
                        ? 'bg-red-100 text-red-800' 
                        : slot.availableSpots <= 1 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {slot.isFull ? 'Πλήρες' : `${slot.availableSpots} διαθέσιμες`}
                    </span>
                  </div>
                  
                  {isAssigned && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Ανατεθειμένο
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignment Form */}
      {selectedSlot && !isAssignmentComplete() && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-green-600" />
            Ανάθεση στη θέση: {getDayName(selectedSlot.dayOfWeek)} - {formatTime(selectedSlot.startTime)}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Σημειώσεις (προαιρετικό)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Προσθέστε σημειώσεις για αυτή την ανάθεση..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Current Slot Members */}
            {slotAssignments.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Τρέχοντα μέλη αυτής της ομάδας:
                </h5>
                <div className="bg-gray-50 rounded-lg p-3">
                  {slotAssignments.map((assignment) => (
                    <div key={assignment.id} className="text-sm text-gray-600 mb-1">
                      • {assignment.userInfo?.first_name} {assignment.userInfo?.last_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleAssignUser}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Δημιουργία...' : 'Δημιουργία Ανάθεσης'}
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ακύρωση
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignmentComplete() && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-green-800">
                Οι αναθέσεις ολοκληρώθηκαν!
              </h4>
              <p className="text-green-600">
                Ο χρήστης έχει ανατεθεί σε {getCurrentWeeklyAssignments()} ομαδικές θέσεις αυτή την εβδομάδα.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAssignmentManager;
