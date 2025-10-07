import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { mockLessons, mockBookings } from '@/data/mockData';
import { Calendar, Users, StickyNote, BarChart2, CheckCircle, XCircle, UserCheck, UserX, Edit3, Save, Plus } from 'lucide-react';
import { PersonalTrainingSchedule, PersonalTrainingSession, TrainerName } from '@/types';
import toast from 'react-hot-toast';
import { getTrainerUsers, getUserAbsences, addAbsence, updateAbsence, deleteAbsence, TrainerUser, UserAbsence } from '@/utils/absenceApi';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sessionId: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  sessionRoom: string;
  absenceType: 'absent' | 'late' | 'excused';
  reason?: string;
  notes?: string;
  createdAt: string;
}

interface PerformanceNote {
  id: string;
  userId: string;
  userName: string;
  note: string;
  createdAt: string;
}

const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedule' | 'attendance' | 'notes'>('schedule');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [performanceNotes, setPerformanceNotes] = useState<PerformanceNote[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  
  // Real data from database
  const [realSchedules, setRealSchedules] = useState<PersonalTrainingSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [trainerName, setTrainerName] = useState<TrainerName | null>(null);
  
  // Auto-hide loading after 5 seconds
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoading(false);
        console.log('[TrainerDashboard] Loading timeout - auto-hiding loading state');
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  const [trainerUsers, setTrainerUsers] = useState<TrainerUser[]>([]);
  const [userAbsences, setUserAbsences] = useState<{ [userId: string]: UserAbsence[] }>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Date filter state
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [showAddAbsenceModal, setShowAddAbsenceModal] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    sessionId: '',
    sessionDate: '',
    sessionTime: '',
    absenceType: 'absent' as 'absent' | 'late' | 'excused',
    reason: '',
    notes: ''
  });

  // Determine trainer name based on user email
  useEffect(() => {
    console.log('[TrainerDashboard] User effect triggered - user:', user?.email, 'role:', user?.role);
    if (user?.email) {
      if (user.email.includes('mike')) {
        console.log('[TrainerDashboard] Setting trainer name to Mike (mike email)');
        setTrainerName('Mike');
      } else if (user.email.includes('jordan')) {
        console.log('[TrainerDashboard] Setting trainer name to Jordan (jordan email)');
        setTrainerName('Jordan');
      } else if (user.email.includes('trainer1')) {
        console.log('[TrainerDashboard] Setting trainer name to Mike (trainer1)');
        setTrainerName('Mike');
      } else if (user.email.includes('trainer2')) {
        console.log('[TrainerDashboard] Setting trainer name to Jordan (trainer2)');
        setTrainerName('Jordan');
      } else if (user.email.includes('trainer')) {
        console.log('[TrainerDashboard] Setting trainer name to Mike (trainer fallback)');
        setTrainerName('Mike');
      } else if (user?.role === 'trainer') {
        console.log('[TrainerDashboard] Setting trainer name to Mike (role-based)');
        setTrainerName('Mike');
      }
    }
  }, [user?.email, user?.role]);

  // Load real schedule data from database
  const loadRealScheduleData = async () => {
    if (!trainerName) return;
    
    try {
      setLoading(true);
      console.log('[TrainerDashboard] Loading schedule data for trainer:', trainerName);
      
      // Query all personal training schedules
      const { data: schedules, error } = await supabase
        .from('personal_training_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TrainerDashboard] Error loading schedules:', error);
        toast.error('Σφάλμα κατά τη φόρτωση των προγραμμάτων');
        return;
      }

      // Filter schedules for this trainer
      const trainerSchedules = schedules?.filter(schedule => {
        // Check both trainer_name column and schedule_data.sessions[].trainer
        if (schedule.trainer_name === trainerName) {
          return true;
        }
        const sessions = schedule.schedule_data?.sessions || [];
        return sessions.some((session: PersonalTrainingSession) => session.trainer === trainerName);
      }) || [];

      console.log('[TrainerDashboard] Found schedules for trainer:', trainerSchedules.length);
      console.log('[TrainerDashboard] All schedules:', schedules);
      console.log('[TrainerDashboard] All schedules length:', schedules?.length || 0);
      console.log('[TrainerDashboard] Filtered trainer schedules:', trainerSchedules);
      console.log('[TrainerDashboard] Trainer name for filtering:', trainerName);
      setRealSchedules(trainerSchedules);
      
    } catch (error) {
      console.error('[TrainerDashboard] Exception loading schedule data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };


  // Extract sessions for this trainer from all schedules
  const trainerSessions = useMemo(() => {
    if (!trainerName) return [];
    
    console.log('[TrainerDashboard] ===== TRAINER SESSIONS USEMEMO =====');
    console.log('[TrainerDashboard] trainerName:', trainerName);
    console.log('[TrainerDashboard] realSchedules:', realSchedules);
    console.log('[TrainerDashboard] trainerUsers:', trainerUsers);
    
    const allSessions: Array<PersonalTrainingSession & { 
      userId: string; 
      userName: string; 
      userEmail: string;
      scheduleId: string;
      status: string;
    }> = [];
    
    realSchedules.forEach((schedule: any, index) => {
      console.log(`[TrainerDashboard] Processing schedule ${index}:`, schedule);
      console.log(`[TrainerDashboard] Schedule data property:`, schedule.schedule_data);
      console.log(`[TrainerDashboard] Schedule data sessions:`, schedule.schedule_data?.sessions);
      
      const sessions = schedule.schedule_data?.sessions || [];
      console.log(`[TrainerDashboard] Sessions array length:`, sessions.length);
      
      sessions.forEach((session: PersonalTrainingSession, sessionIndex: number) => {
        console.log(`[TrainerDashboard] Processing session ${sessionIndex}:`, session);
        console.log(`[TrainerDashboard] Session trainer:`, session.trainer);
        console.log(`[TrainerDashboard] Looking for trainer:`, trainerName);
        console.log(`[TrainerDashboard] Match:`, session.trainer === trainerName);
        
        if (session.trainer === trainerName) {
          // Βρίσκουμε το όνομα του χρήστη από τη βάση
          console.log(`[TrainerDashboard] Schedule user_id:`, schedule.user_id);
          console.log(`[TrainerDashboard] Schedule properties:`, Object.keys(schedule));
          console.log(`[TrainerDashboard] Available trainerUsers:`, trainerUsers.map(u => ({ user_id: u.user_id, name: `${u.first_name} ${u.last_name}` })));
          const user = trainerUsers.find(u => u.user_id === schedule.user_id);
          console.log(`[TrainerDashboard] Found user for schedule:`, user);
          const userName = user ? `${user.first_name} ${user.last_name}` : 'Άγνωστος Χρήστης';
          const userEmail = user ? user.email : '';
          
          const sessionWithUser = {
            ...session,
            userId: schedule.user_id,
            userName: userName,
            userEmail: userEmail,
            scheduleId: schedule.id,
            status: schedule.status
          };
          
          console.log(`[TrainerDashboard] Adding session:`, sessionWithUser);
          allSessions.push(sessionWithUser);
        }
      });
    });
    
    // Ταξινόμηση από νωρίτερο σε αργότερο βάσει ημερομηνίας και ώρας
    const sortedSessions = allSessions.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log('[TrainerDashboard] Final allSessions (sorted):', sortedSessions);
    console.log('[TrainerDashboard] ===== TRAINER SESSIONS USEMEMO COMPLETE =====');
    return sortedSessions;
  }, [realSchedules, trainerName, trainerUsers]);

  // Filter sessions by date if selected
  const filteredSessions = useMemo(() => {
    if (!selectedDate) {
      return trainerSessions;
    }
    
    
    const filtered = trainerSessions.filter(session => {
      try {
        // Parse the session date more carefully
        const sessionDate = new Date(session.date);
        
        // Check if the date is valid
        if (isNaN(sessionDate.getTime())) {
          console.log('[TrainerDashboard] Invalid date:', session.date);
          return false;
        }
        
        // Get the date in YYYY-MM-DD format
        const sessionDateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth()+1).padStart(2,'0')}-${String(sessionDate.getDate()).padStart(2,'0')}`;
        
        // Also try to get the date in local format
        const localDateStr = sessionDate.getFullYear() + '-' + 
          String(sessionDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(sessionDate.getDate()).padStart(2, '0');
        
        const matches = sessionDateStr === selectedDate || localDateStr === selectedDate;
        
        
        return matches;
      } catch (error) {
        console.error('[TrainerDashboard] Error parsing session date:', session.date, error);
        return false;
      }
    });
    
    
    return filtered;
  }, [trainerSessions, selectedDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Reset to first page and clear filter when trainer changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedDate('');
  }, [trainerName]);

  // Lessons που ανήκουν στον συγκεκριμένο trainer
  const trainerLessons = useMemo(() => {
    return mockLessons.filter(l => l.trainerId === (user?.id || ''));
  }, [user?.id]);

  // Συμμετέχοντες ανά μάθημα (mock bookings)
  const participantsByLesson: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    mockBookings.forEach(b => {
      const lesson = mockLessons.find(l => l.id === b.lessonId);
      if (lesson && lesson.trainerId === (user?.id || '')) {
        map[lesson.id] = (map[lesson.id] || 0) + 1;
      }
    });
    return map;
  }, [user?.id]);

  // Στατιστικά trainer
  const stats = useMemo(() => {
    const totalLessons = filteredSessions.length;
    const totalParticipants = new Set(filteredSessions.map(s => s.userId)).size;
    return { totalLessons, totalParticipants };
  }, [filteredSessions]);

  // Fake attendance data
  const fakeAttendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      userId: '1',
      userName: 'Μαρία Παπαδάκη',
      userEmail: 'maria.p@email.com',
      sessionId: '1',
      sessionDate: '2024-01-22',
      sessionTime: '09:00',
      sessionType: 'Pilates',
      sessionRoom: 'Αίθουσα 1',
      absenceType: 'absent',
      reason: '',
      notes: '',
      createdAt: '2024-01-22T09:00:00Z'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Γιώργος Νικολάου',
      userEmail: 'giorgos.n@email.com',
      sessionId: '1',
      sessionDate: '2024-01-22',
      sessionTime: '09:00',
      sessionType: 'Pilates',
      sessionRoom: 'Αίθουσα 1',
      absenceType: 'absent',
      reason: '',
      notes: '',
      createdAt: '2024-01-22T09:00:00Z'
    },
    {
      id: '3',
      userId: '3',
      userName: 'Σοφία Μητσοτάκη',
      userEmail: 'sofia.m@email.com',
      sessionId: '2',
      sessionDate: '2024-01-23',
      sessionTime: '20:00',
      sessionType: 'Kick Boxing',
      sessionRoom: 'Αίθουσα 2',
      absenceType: 'absent',
      reason: '',
      notes: '',
      createdAt: '2024-01-23T20:00:00Z'
    }
  ];

  // Fake performance notes
  const fakePerformanceNotes: PerformanceNote[] = [
    {
      id: '1',
      userId: '1',
      userName: 'Μαρία Παπαδάκη',
      note: 'Χρειάζεται βελτίωση στο posture. Προτείνω περισσότερες ασκήσεις ενδυνάμωσης κορμού.',
      createdAt: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Γιώργος Νικολάου',
      note: 'Εξαιρετική πρόοδος! Έχει βελτιώσει σημαντικά την αντοχή του.',
      createdAt: '2024-01-18T14:30:00Z'
    }
  ];

  // Initialize fake data
  React.useEffect(() => {
    setAttendanceRecords(fakeAttendanceRecords);
    setPerformanceNotes(fakePerformanceNotes);
  }, []);

  const handleAttendanceToggle = (recordId: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, absenceType: record.absenceType === 'absent' ? 'absent' : 'absent' }
          : record
      )
    );
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: PerformanceNote = {
        id: Date.now().toString(),
        userId: '1', // Mock user ID
        userName: 'Νέος Χρήστης',
        note: newNote,
        createdAt: new Date().toISOString()
      };
      setPerformanceNotes(prev => [note, ...prev]);
      setNewNote('');
    }
  };

  const handleEditNote = (noteId: string, newText: string) => {
    setPerformanceNotes(prev => 
      prev.map(note => 
        note.id === noteId 
          ? { ...note, note: newText }
          : note
      )
    );
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    setPerformanceNotes(prev => prev.filter(note => note.id !== noteId));
  };

  // Load trainer users based on schedules
  const loadTrainerUsers = async () => {
    if (!trainerName) {
      console.log('[TrainerDashboard] No trainer name set, cannot load users');
      return;
    }
    
    try {
      console.log(`[TrainerDashboard] Loading users for trainer: ${trainerName}`);
      const users = await getTrainerUsers(trainerName);
      console.log(`[TrainerDashboard] Raw users data:`, users);
      setTrainerUsers(users);
      console.log(`[TrainerDashboard] Loaded ${users.length} users for ${trainerName}`);
    } catch (error) {
      console.error('[TrainerDashboard] Error loading trainer users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    }
  };

  // Load absences for a specific user
  const loadUserAbsences = async (userId: string) => {
    if (!trainerName) return;
    
    try {
      console.log(`[TrainerDashboard] Loading absences for user: ${userId}`);
      const absences = await getUserAbsences(userId, trainerName);
      setUserAbsences(prev => ({
        ...prev,
        [userId]: absences
      }));
      console.log(`[TrainerDashboard] Loaded ${absences.length} absences for user ${userId}`);
    } catch (error) {
      console.error('[TrainerDashboard] Error loading user absences:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των απουσιών');
    }
  };

  // Add new absence
  const handleAddAbsence = async () => {
    if (!selectedUser || !trainerName) return;
    
    try {
      console.log('[TrainerDashboard] Adding absence for user:', selectedUser);
      await addAbsence(
        selectedUser,
        trainerName,
        newAbsence.sessionId,
        newAbsence.sessionDate,
        newAbsence.sessionTime,
        newAbsence.absenceType,
        newAbsence.reason,
        newAbsence.notes
      );
      
      toast.success('Η απουσία καταχωρήθηκε επιτυχώς');
      setShowAddAbsenceModal(false);
      setNewAbsence({
        sessionId: '',
        sessionDate: '',
        sessionTime: '',
        absenceType: 'absent',
        reason: '',
        notes: ''
      });
      
      // Reload absences for the user
      await loadUserAbsences(selectedUser);
    } catch (error) {
      console.error('[TrainerDashboard] Error adding absence:', error);
      toast.error('Σφάλμα κατά την καταχώρηση της απουσίας');
    }
  };

  // Update absence
  const handleUpdateAbsence = async (absenceId: string, absenceType: 'absent' | 'late' | 'excused', reason?: string, notes?: string) => {
    try {
      console.log('[TrainerDashboard] Updating absence:', absenceId);
      await updateAbsence(absenceId, absenceType, reason, notes);
      toast.success('Η απουσία ενημερώθηκε επιτυχώς');
      
      // Reload absences for the user
      if (selectedUser) {
        await loadUserAbsences(selectedUser);
      }
    } catch (error) {
      console.error('[TrainerDashboard] Error updating absence:', error);
      toast.error('Σφάλμα κατά την ενημέρωση της απουσίας');
    }
  };

  // Delete absence
  const handleDeleteAbsence = async (absenceId: string) => {
    try {
      console.log('[TrainerDashboard] Deleting absence:', absenceId);
      await deleteAbsence(absenceId);
      toast.success('Η απουσία διαγράφηκε επιτυχώς');
      
      // Reload absences for the user
      if (selectedUser) {
        await loadUserAbsences(selectedUser);
      }
    } catch (error) {
      console.error('[TrainerDashboard] Error deleting absence:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της απουσίας');
    }
  };

  // Load data when trainer name changes
  useEffect(() => {
    console.log('[TrainerDashboard] Trainer name effect triggered - trainerName:', trainerName);
    if (trainerName) {
      console.log('[TrainerDashboard] Loading trainer users...');
      loadTrainerUsers();
      loadRealScheduleData();
    } else {
      console.log('[TrainerDashboard] No trainer name, skipping load');
    }
  }, [trainerName]);


  const tabs = [
    { id: 'schedule', name: 'Μηνιαίο Πρόγραμμα', icon: Calendar },
    { id: 'attendance', name: 'Σύστημα Απουσιών', icon: UserCheck },
    { id: 'notes', name: 'Performance Notes', icon: StickyNote }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
          <p className="text-gray-600">Συγκεντρωτική εικόνα για τα μαθήματά σου</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Στατιστικά */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg"><BarChart2 className="h-6 w-6 text-blue-600"/></div>
                <div>
                  <p className="text-sm text-gray-600">Σύνολο Μαθημάτων</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.totalLessons}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg"><Users className="h-6 w-6 text-green-600"/></div>
                <div>
                  <p className="text-sm text-gray-600">Συνολικοί Συμμετέχοντες</p>
                  <p className="text-xl font-semibold text-gray-900">{stats.totalParticipants}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg"><StickyNote className="h-6 w-6 text-yellow-600"/></div>
                <div>
                  <p className="text-sm text-gray-600">Σημείωση</p>
                  <p className="text-sm text-gray-800">Ενημέρωσε τον admin για αλλαγές προγράμματος.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Μηνιαίο Πρόγραμμα - {trainerName}
                </h2>
                <div className="flex items-center space-x-4">
                  {/* Date Filter */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
                      Φίλτρο Ημερομηνίας:
                    </label>
                    <input
                      id="dateFilter"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setCurrentPage(1); // Reset to first page when filtering
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {selectedDate && (
                      <button
                        onClick={() => {
                          setSelectedDate('');
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Καθαρισμός
                      </button>
                    )}
                  </div>
                  
                  
                  {loading && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Φόρτωση δεδομένων...
                    </div>
                  )}
                </div>
              </div>
              {paginatedSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 bg-gray-50">
                        <th className="py-3 px-4 font-medium">Ημερομηνία</th>
                        <th className="py-3 px-4 font-medium">Ώρα</th>
                        <th className="py-3 px-4 font-medium">Τύπος</th>
                        <th className="py-3 px-4 font-medium">Χρήστης</th>
                        <th className="py-3 px-4 font-medium">Email</th>
                        <th className="py-3 px-4 font-medium">Αίθουσα</th>
                        <th className="py-3 px-4 font-medium">Κατάσταση</th>
                        <th className="py-3 px-4 font-medium">Σημειώσεις</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSessions.map((session, index) => (
                        <tr key={`${session.scheduleId}-${session.id || Math.random()}`} className="border-t hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {new Date(session.date).toLocaleDateString('el-GR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {session.startTime}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.type === 'personal' ? 'bg-blue-100 text-blue-800' :
                              session.type === 'kickboxing' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {session.type === 'personal' ? 'Personal Training' :
                               session.type === 'kickboxing' ? 'Kick Boxing' :
                               'Combo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {session.userName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {session.userEmail}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {session.room || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              session.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {session.status === 'accepted' ? 'Αποδεκτό' :
                               session.status === 'declined' ? 'Απορριφθέν' :
                               'Εκκρεμεί'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {session.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Εμφάνιση {startIndex + 1}-{Math.min(endIndex, filteredSessions.length)} από {filteredSessions.length} καταχωρήσεις
                        {selectedDate && ` (φιλτραρισμένες για ${selectedDate})`}
                      </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Προηγούμενη
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Επόμενη
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !loading ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Δεν υπάρχουν προγραμματισμένες σεσίας για τον {trainerName}.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Ο admin θα δημιουργήσει το πρόγραμμά σας στο Personal Training section.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Σύστημα Απουσιών - {trainerName}</h2>
                <button
                  onClick={() => setShowAddAbsenceModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Προσθήκη Απουσίας</span>
                </button>
              </div>

              {/* Debug Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
                <p className="text-sm text-yellow-700">Trainer Name: {trainerName || 'Not set'}</p>
                <p className="text-sm text-yellow-700">Trainer Users Count: {trainerUsers.length}</p>
                <p className="text-sm text-yellow-700">User Role: {user?.role || 'Not set'}</p>
                <p className="text-sm text-yellow-700">User Email: {user?.email || 'Not set'}</p>
              </div>

              {/* Users List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainerUsers.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Δεν βρέθηκαν χρήστες για τον προπονητή {trainerName}</p>
                    <p className="text-sm mt-2">Ελέγξτε ότι υπάρχουν προγράμματα με τον προπονητή {trainerName}</p>
                  </div>
                ) : (
                  trainerUsers.map(user => (
                  <div
                    key={user.user_id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUser === user.user_id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedUser(user.user_id);
                      loadUserAbsences(user.user_id);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {user.total_sessions} συνολικές σεσίας
                        </p>
                      </div>
                    </div>
                    {user.next_session_date && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Επόμενη σέσια: {new Date(user.next_session_date).toLocaleDateString('el-GR')}</p>
                        <p>Ώρα: {user.next_session_time} - {user.next_session_type}</p>
                      </div>
                    )}
                  </div>
                  ))
                )}
              </div>

              {/* Selected User Absences */}
              {selectedUser && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ιστορικό Απουσιών - {trainerUsers.find(u => u.user_id === selectedUser)?.first_name} {trainerUsers.find(u => u.user_id === selectedUser)?.last_name}
                  </h3>
                  
                  {userAbsences[selectedUser] && userAbsences[selectedUser].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-2 pr-4">Ημερομηνία</th>
                            <th className="py-2 pr-4">Ώρα</th>
                            <th className="py-2 pr-4">Τύπος</th>
                            <th className="py-2 pr-4">Αιτία</th>
                            <th className="py-2 pr-4">Σημειώσεις</th>
                            <th className="py-2 pr-4">Ενέργειες</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userAbsences[selectedUser].map(absence => (
                            <tr key={absence.id} className="border-b">
                              <td className="py-2 pr-4">{new Date(absence.session_date).toLocaleDateString('el-GR')}</td>
                              <td className="py-2 pr-4">{absence.session_time}</td>
                              <td className="py-2 pr-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  absence.absence_type === 'absent' ? 'bg-red-100 text-red-800' :
                                  absence.absence_type === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {absence.absence_type === 'absent' ? 'Απών' :
                                   absence.absence_type === 'late' ? 'Καθυστέρηση' : 'Δικαιολογημένος'}
                                </span>
                              </td>
                              <td className="py-2 pr-4">{absence.reason || '-'}</td>
                              <td className="py-2 pr-4">{absence.notes || '-'}</td>
                              <td className="py-2 pr-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleDeleteAbsence(absence.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Διαγραφή"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>Δεν υπάρχουν καταχωρημένες απουσίες</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Absence Modal */}
              {showAddAbsenceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Προσθήκη Απουσίας</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Χρήστης</label>
                        <select
                          value={selectedUser || ''}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">Επιλέξτε χρήστη</option>
                          {trainerUsers.map(user => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.first_name} {user.last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ημερομηνία</label>
                        <input
                          type="date"
                          value={newAbsence.sessionDate}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, sessionDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ώρα</label>
                        <input
                          type="time"
                          value={newAbsence.sessionTime}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, sessionTime: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Τύπος Απουσίας</label>
                        <select
                          value={newAbsence.absenceType}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, absenceType: e.target.value as 'absent' | 'late' | 'excused' }))}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="absent">Απών</option>
                          <option value="late">Καθυστέρηση</option>
                          <option value="excused">Δικαιολογημένος</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Αιτία</label>
                        <input
                          type="text"
                          value={newAbsence.reason}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Προαιρετική αιτία"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
                        <textarea
                          value={newAbsence.notes}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          rows={3}
                          placeholder="Προαιρετικές σημειώσεις"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddAbsenceModal(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Ακύρωση
                      </button>
                      <button
                        onClick={handleAddAbsence}
                        disabled={!selectedUser || !newAbsence.sessionDate || !newAbsence.sessionTime}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Προσθήκη
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Performance Notes</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Νέα σημείωση..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  />
                  <button
                    onClick={handleAddNote}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Προσθήκη</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {performanceNotes.map(note => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{note.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString('el-GR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingNote(note.id)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Επεξεργασία"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Διαγραφή"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {editingNote === note.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          defaultValue={note.note}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditNote(note.id, e.currentTarget.value);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleEditNote(note.id, (document.querySelector(`input[defaultValue="${note.note}"]`) as HTMLInputElement)?.value || note.note)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{note.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Σημείωση προς Admin/Trainers/Users */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-blue-900 mb-2">Σημείωση</h3>
            <ul className="list-disc pl-5 text-sm text-blue-900 space-y-1">
              <li><b>Προς Admin:</b> Εγκρίνετε/ενημερώστε αλλαγές στο πρόγραμμα εφόσον χρειάζεται.</li>
              <li><b>Προς Trainers:</b> Επικαιροποιείτε τα ωράριά σας εβδομαδιαίως.</li>
              <li><b>Προς Users:</b> Κλείστε εγκαίρως θέσεις – οι δημοφιλείς ώρες γεμίζουν.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;


