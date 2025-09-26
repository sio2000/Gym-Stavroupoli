import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { checkRoomCapacity } from '@/utils/groupAssignmentApi';
import toast from 'react-hot-toast';

interface GroupAssignmentInterfaceProps {
  selectedGroupRoom: '2' | '3' | '6';
  weeklyFrequency: 1 | 2 | 3 | 4 | 5;
  monthlyTotal: number;
  selectedUserIds: string[];
  onSlotsChange?: (slots: {[userId: string]: GroupSession[]}) => void;
}

interface GroupSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  trainer: string;
  room: string;
  groupType: number;
  notes: string;
}

const GroupAssignmentInterface: React.FC<GroupAssignmentInterfaceProps> = ({
  selectedGroupRoom,
  weeklyFrequency,
  monthlyTotal,
  selectedUserIds,
  onSlotsChange
}) => {
  const [userSessions, setUserSessions] = useState<{[userId: string]: GroupSession[]}>({});

  // Calculate monthly sessions (weekly frequency × 4 weeks)
  const monthlySessions = weeklyFrequency * 4;

  // Initialize sessions for each user - with ref to prevent infinite loops
  const initializationRef = useRef<string>('');
  
  useEffect(() => {
    // Create a unique key for this configuration
    const configKey = `${JSON.stringify(selectedUserIds)}-${weeklyFrequency}-${selectedGroupRoom}`;
    
    // Only initialize if configuration actually changed
    if (initializationRef.current === configKey) {
      console.log('[GroupAssignmentInterface] Configuration unchanged, skipping initialization');
      return;
    }
    
    console.log('[GroupAssignmentInterface] Initializing sessions...', { selectedUserIds, weeklyFrequency, selectedGroupRoom, monthlySessions });
    
    const initialSessions: {[userId: string]: GroupSession[]} = {};
    selectedUserIds.forEach(userId => {
      initialSessions[userId] = Array.from({ length: monthlySessions }, (_, index) => ({
        id: `session-${userId}-${index}`,
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '19:00',
        trainer: 'Mike',
        room: 'Αίθουσα Mike',
        groupType: parseInt(selectedGroupRoom), // Default, αλλά επεξεργάσιμο ανά σεσία
        notes: ''
      }));
    });
    
    setUserSessions(initialSessions);
    initializationRef.current = configKey;
    
    // Notify parent immediately after initialization
    if (onSlotsChange) {
      setTimeout(() => {
        console.log('[GroupAssignmentInterface] Notifying parent after initialization...');
        onSlotsChange(initialSessions);
      }, 100);
    }
  }, [selectedUserIds, weeklyFrequency, selectedGroupRoom, monthlySessions, onSlotsChange]);

  // Update session for a user with validation
  const updateUserSession = async (userId: string, sessionId: string, field: keyof GroupSession, value: any) => {
    console.log('[GroupAssignmentInterface] Updating session:', { userId, sessionId, field, value });
    
    // Get the current session to check what's changing
    const currentSession = userSessions[userId]?.find(s => s.id === sessionId);
    if (!currentSession) {
      console.error('[GroupAssignmentInterface] Current session not found:', { userId, sessionId });
      return;
    }

    // Create the updated session
    const updatedSession = { ...currentSession, [field]: value };

    // If changing date, time, room, or group type, check capacity
    if (field === 'date' || field === 'startTime' || field === 'endTime' || field === 'room' || field === 'groupType') {
      try {
        const capacityCheck = await checkRoomCapacity(
          updatedSession.date,
          updatedSession.startTime,
          updatedSession.endTime,
          updatedSession.room,
          updatedSession.groupType, // Χρησιμοποιούμε το group type της σεσίας
          userId // Exclude current user from capacity count
        );

        if (!capacityCheck.isAvailable) {
          toast.error(`❌ Η αίθουσα ${updatedSession.room} είναι γεμάτη για ${updatedSession.date} ${updatedSession.startTime}-${updatedSession.endTime}. Χωρητικότητα: ${capacityCheck.currentOccupancy + 1}/${capacityCheck.maxCapacity}. Παρακαλώ επιλέξτε διαφορετική ώρα, ημερομηνία ή αίθουσα.`);
          return; // Δεν επιτρέπουμε την αλλαγή αν θα δημιουργήσει υπέρβαση
        }
      } catch (error) {
        console.error('Error checking room capacity:', error);
        console.warn('[GroupAssignmentInterface] Capacity check failed, but allowing change to proceed');
        // Don't block the change - just log the error
      }
    }

    setUserSessions(prev => {
      const updatedSessions = {
        ...prev,
        [userId]: prev[userId].map(session => 
          session.id === sessionId 
            ? updatedSession
            : session
        )
      };
      
      console.log('[GroupAssignmentInterface] Session updated successfully:', { userId, sessionId, field, value });
      
      // Notify parent of the update immediately
      if (onSlotsChange) {
        setTimeout(() => {
          console.log('[GroupAssignmentInterface] Notifying parent of session update...');
          onSlotsChange(updatedSessions);
        }, 50);
      }
      
      return updatedSessions;
    });
  };

  // Add new session for a user
  const addUserSession = async (userId: string) => {
    const currentSessions = userSessions[userId] || [];
    if (currentSessions.length >= monthlySessions) {
      toast.error(`Ο χρήστης μπορεί να έχει μέγιστο ${monthlySessions} σεσίες τον μήνα (${weeklyFrequency} φορές/εβδομάδα × 4 εβδομάδες)`);
      return;
    }

    const newSession: GroupSession = {
      id: `session-${userId}-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:00',
      trainer: 'Mike',
      room: 'Αίθουσα Mike',
      groupType: parseInt(selectedGroupRoom), // Default από τις επιλογές, αλλά μπορεί να αλλάξει
      notes: ''
    };

    // Check capacity for the default session
    try {
      const capacityCheck = await checkRoomCapacity(
        newSession.date,
        newSession.startTime,
        newSession.endTime,
        newSession.room,
        newSession.groupType // Χρησιμοποιούμε το group type της νέας σεσίας
      );

      if (!capacityCheck.isAvailable) {
        toast.error(`❌ Η αίθουσα ${newSession.room} είναι γεμάτη για ${newSession.date} ${newSession.startTime}-${newSession.endTime}. Χωρητικότητα: ${capacityCheck.currentOccupancy}/${capacityCheck.maxCapacity}. Παρακαλώ επιλέξτε διαφορετική ώρα ή ημερομηνία.`);
        return; // Δεν προσθέτουμε τη σεσία αν το δωμάτιο είναι γεμάτο
      }
    } catch (error) {
      console.error('Error checking room capacity for new session:', error);
    }

    setUserSessions(prev => {
      const updatedSessions = {
        ...prev,
        [userId]: [...(prev[userId] || []), newSession]
      };
      
      // Notify parent of the addition
      if (onSlotsChange) {
        setTimeout(() => {
          console.log('[GroupAssignmentInterface] Notifying parent of session addition...');
          onSlotsChange(updatedSessions);
        }, 50);
      }
      
      return updatedSessions;
    });
  };

  // Remove session for a user
  const removeUserSession = (userId: string, sessionId: string) => {
    setUserSessions(prev => {
      const updatedSessions = {
        ...prev,
        [userId]: prev[userId].filter(session => session.id !== sessionId)
      };
      
      // Notify parent of the removal
      if (onSlotsChange) {
        setTimeout(() => {
          console.log('[GroupAssignmentInterface] Notifying parent of session removal...');
          onSlotsChange(updatedSessions);
        }, 50);
      }
      
      return updatedSessions;
    });
  };

  // Helper functions
  const getUserSessionCount = (userId: string) => {
    return userSessions[userId]?.length || 0;
  };

  const isUserComplete = (userId: string) => {
    return getUserSessionCount(userId) === monthlySessions;
  };

  // Available trainers
  const availableTrainers = ['Mike', 'Jordan'];

  // Available rooms
  const availableRooms = [
    'Αίθουσα Mike', 
    'Αίθουσα Jordan'
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold text-blue-800 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Διαχείριση Ομαδικών Αναθέσεων
          </h4>
          <p className="text-sm text-blue-600 mt-1">
            Προσθέστε σεσίες για κάθε χρήστη ({monthlySessions} σεσίες/μήνα = {weeklyFrequency} φορές/εβδομάδα × 4 εβδομάδες)
            <br />
            <span className="text-purple-600 font-medium">💡 Μπορείτε να επιλέξετε διαφορετικό Group Size για κάθε σεσία (2, 3, ή 6 άτομα)</span>
          </p>
        </div>
      </div>

      {/* User Sessions */}
      <div className="space-y-6">
        {selectedUserIds.map(userId => {
          const sessions = userSessions[userId] || [];
          const isComplete = isUserComplete(userId);
          
          return (
            <div key={userId} className="bg-white rounded-xl p-6 border border-blue-200">
              {/* User Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <Users className={`h-4 w-4 ${isComplete ? 'text-green-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800">Χρήστης {userId.slice(-8)}</h5>
                    <p className="text-sm text-gray-600">
                      {sessions.length}/{monthlySessions} σεσίες προγραμματισμένες
                    </p>
                  </div>
                </div>
                
              </div>

              {/* Table-style Sessions */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-7 gap-0 text-sm font-semibold text-gray-700">
                    <div className="p-3 border-r border-gray-200">📅 Ημερομηνία</div>
                    <div className="p-3 border-r border-gray-200">🕐 Έναρξη</div>
                    <div className="p-3 border-r border-gray-200">🕕 Λήξη</div>
                    <div className="p-3 border-r border-gray-200">👤 Προπονητής</div>
                    <div className="p-3 border-r border-gray-200">🏠 Αίθουσα</div>
                    <div className="p-3 border-r border-gray-200">👥 Group Size</div>
                    <div className="p-3">🗑️</div>
                  </div>
                </div>
                
                {/* Table Rows */}
                <div className="divide-y divide-gray-200">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="grid grid-cols-7 gap-0 hover:bg-gray-50 transition-colors">
                      {/* Date */}
                      <div className="p-2 border-r border-gray-200">
                        <input
                          type="date"
                          value={session.date}
                          onChange={(e) => updateUserSession(userId, session.id, 'date', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Start Time */}
                      <div className="p-2 border-r border-gray-200">
                        <input
                          type="time"
                          value={session.startTime}
                          onChange={(e) => updateUserSession(userId, session.id, 'startTime', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* End Time */}
                      <div className="p-2 border-r border-gray-200">
                        <input
                          type="time"
                          value={session.endTime}
                          onChange={(e) => updateUserSession(userId, session.id, 'endTime', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Trainer */}
                      <div className="p-2 border-r border-gray-200">
                        <select
                          value={session.trainer}
                          onChange={(e) => updateUserSession(userId, session.id, 'trainer', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        >
                          {availableTrainers.map(trainer => (
                            <option key={trainer} value={trainer}>{trainer}</option>
                          ))}
                        </select>
                      </div>

                      {/* Room */}
                      <div className="p-2 border-r border-gray-200">
                        <select
                          value={session.room}
                          onChange={(e) => updateUserSession(userId, session.id, 'room', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        >
                          {availableRooms.map(room => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>

                      {/* Group Size */}
                      <div className="p-2 border-r border-gray-200">
                        <select
                          value={session.groupType}
                          onChange={(e) => updateUserSession(userId, session.id, 'groupType', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={2}>2 άτομα</option>
                          <option value={3}>3 άτομα</option>
                          <option value={6}>6 άτομα</option>
                        </select>
                      </div>

                      {/* Delete */}
                      <div className="p-2 flex items-center justify-center">
                        <button
                          onClick={() => removeUserSession(userId, session.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Διαγραφή σεσίας"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Session Row */}
                {sessions.length < monthlySessions && (
                  <div className="border-t border-gray-200 bg-blue-50">
                    <div className="p-3 text-center">
                      <button
                        onClick={() => addUserSession(userId)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Προσθήκη Σεσίας</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-semibold text-green-800">Περίληψη Προγραμματισμού</h5>
            <p className="text-sm text-green-600">
              {selectedUserIds.filter(id => isUserComplete(id)).length}/{selectedUserIds.length} χρήστες έχουν {monthlySessions} σεσίες/μήνα
            </p>
          </div>
          <div className="text-2xl">
            {selectedUserIds.every(id => isUserComplete(id)) ? '✅' : '⏳'}
          </div>
        </div>
        
        {!selectedUserIds.every(id => isUserComplete(id)) && (
          <div className="mt-2 text-sm text-orange-600">
            ⚠️ Προσθέστε {monthlySessions} σεσίες για κάθε χρήστη ({weeklyFrequency} φορές/εβδομάδα × 4 εβδομάδες)
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupAssignmentInterface;
