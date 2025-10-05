import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { 
  Calendar, 
  Users, 
  StickyNote, 
  BarChart2, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  Edit3, 
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Activity,
  Target,
  Award,
  Star,
  AlertCircle,
  CheckCircle2,
  UserMinus
} from 'lucide-react';
import { PersonalTrainingSchedule, PersonalTrainingSession, TrainerName } from '@/types';
import toast from 'react-hot-toast';
import { getTrainerUsers, getUserAbsences, addAbsence, deleteAbsence, getAllUsers, TrainerUser, UserAbsence, AllUser } from '@/utils/absenceApi';
import TrainerMonthlyCalendar from '@/components/TrainerMonthlyCalendar';

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


interface TrainerSpecificDashboardProps {
  trainerName: TrainerName;
}

const TrainerSpecificDashboard: React.FC<TrainerSpecificDashboardProps> = ({ trainerName }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'attendance'>('schedule');
  
  // Real data from database
  const [realSchedules, setRealSchedules] = useState<PersonalTrainingSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [trainerUsers, setTrainerUsers] = useState<TrainerUser[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [userAbsences, setUserAbsences] = useState<{ [userId: string]: UserAbsence[] }>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserSearch, setSelectedUserSearch] = useState<string>('');
  const [loadedUsers, setLoadedUsers] = useState<Set<string>>(new Set());
  
  // Pagination state (kept for potential future use)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Absence system pagination and search state
  const [absenceCurrentPage, setAbsenceCurrentPage] = useState(1);
  const absenceItemsPerPage = 9;
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  
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

  // Load real schedule data from database
  const loadRealScheduleData = async () => {
    try {
      setLoading(true);
      console.log('[TrainerSpecificDashboard] Loading schedule data for trainer:', trainerName);
      
      // Query all personal training schedules
      const { data: schedules, error } = await supabase
        .from('personal_training_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TrainerSpecificDashboard] Error loading schedules:', error);
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

      console.log('[TrainerSpecificDashboard] Found schedules for trainer:', trainerSchedules.length);
      console.log('[TrainerSpecificDashboard] All schedules:', schedules);
      console.log('[TrainerSpecificDashboard] All schedules length:', schedules?.length || 0);
      console.log('[TrainerSpecificDashboard] Filtered trainer schedules:', trainerSchedules);
      console.log('[TrainerSpecificDashboard] Trainer name for filtering:', trainerName);
      
      // Debug: Check what properties each schedule has
      if (trainerSchedules.length > 0) {
        console.log('[TrainerSpecificDashboard] First schedule properties:', Object.keys(trainerSchedules[0]));
        console.log('[TrainerSpecificDashboard] First schedule user_id:', trainerSchedules[0].user_id);
        console.log('[TrainerSpecificDashboard] First schedule user_id type:', typeof trainerSchedules[0].user_id);
      }
      
      setRealSchedules(trainerSchedules);
      
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Exception loading schedule data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadRealScheduleData();
  }, [trainerName]);

  // Extract sessions for this trainer from all schedules
  const trainerSessions = useMemo(() => {
    console.log('[TrainerSpecificDashboard] ===== TRAINER SESSIONS USEMEMO =====');
    console.log('[TrainerSpecificDashboard] trainerName:', trainerName);
    console.log('[TrainerSpecificDashboard] realSchedules:', realSchedules);
    console.log('[TrainerSpecificDashboard] trainerUsers:', trainerUsers);
    
    const allSessions: Array<PersonalTrainingSession & { 
      userId: string; 
      userName: string; 
      userEmail: string;
      scheduleId: string;
      status: string;
    }> = [];
    
    realSchedules.forEach((schedule: any, index) => {
      console.log(`[TrainerSpecificDashboard] Processing schedule ${index}:`, schedule);
      console.log(`[TrainerSpecificDashboard] Schedule data property:`, schedule.schedule_data);
      console.log(`[TrainerSpecificDashboard] Schedule data sessions:`, schedule.schedule_data?.sessions);
      
      const sessions = schedule.schedule_data?.sessions || [];
      console.log(`[TrainerSpecificDashboard] Sessions array length:`, sessions.length);
      
      sessions.forEach((session: PersonalTrainingSession, sessionIndex: number) => {
        console.log(`[TrainerSpecificDashboard] Processing session ${sessionIndex}:`, session);
        console.log(`[TrainerSpecificDashboard] Session trainer:`, session.trainer);
        console.log(`[TrainerSpecificDashboard] Looking for trainer:`, trainerName);
        console.log(`[TrainerSpecificDashboard] Match:`, session.trainer === trainerName);
        
        if (session.trainer === trainerName) {
          // Βρίσκουμε το όνομα του χρήστη από τη βάση
          console.log(`[TrainerSpecificDashboard] Schedule user_id:`, schedule.user_id);
          console.log(`[TrainerSpecificDashboard] Schedule properties:`, Object.keys(schedule));
          console.log(`[TrainerSpecificDashboard] Available trainerUsers:`, trainerUsers.map(u => ({ user_id: u.user_id, name: `${u.first_name} ${u.last_name}` })));
          const user = trainerUsers.find(u => u.user_id === schedule.user_id);
          console.log(`[TrainerSpecificDashboard] Found user for schedule:`, user);
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
          
          console.log(`[TrainerSpecificDashboard] Adding session:`, sessionWithUser);
          allSessions.push(sessionWithUser);
        }
      });
    });
    
    // Keep original order (no sorting)
    
    console.log('[TrainerSpecificDashboard] Final allSessions:', allSessions);
    console.log('[TrainerSpecificDashboard] ===== TRAINER SESSIONS USEMEMO COMPLETE =====');
    return allSessions;
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
          console.log('[TrainerSpecificDashboard] Invalid date:', session.date);
          return false;
        }
        
        // Get the date in YYYY-MM-DD format
        const sessionDateStr = sessionDate.toISOString().split('T')[0];
        
        // Also try to get the date in local format
        const localDateStr = sessionDate.getFullYear() + '-' + 
          String(sessionDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(sessionDate.getDate()).padStart(2, '0');
        
        const matches = sessionDateStr === selectedDate || localDateStr === selectedDate;
        
        
        return matches;
      } catch (error) {
        console.error('[TrainerSpecificDashboard] Error parsing session date:', session.date, error);
        return false;
      }
    });
    
    
    return filtered;
  }, [trainerSessions, selectedDate]);

  // Pagination logic (kept for potential future use)
  // const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const endIndex = startIndex + itemsPerPage;
  // const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Reset to first page and clear filter when trainer changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedDate('');
    setAbsenceCurrentPage(1);
    setSearchTerm('');
  }, [trainerName]);


  // Filter and pagination logic for absence system users
  const filteredTrainerUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return trainerUsers;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return trainerUsers.filter(user => 
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
    );
  }, [trainerUsers, searchTerm]);

  // Pagination logic for absence system users
  const totalAbsencePages = Math.ceil(filteredTrainerUsers.length / absenceItemsPerPage);
  const absenceStartIndex = (absenceCurrentPage - 1) * absenceItemsPerPage;
  const absenceEndIndex = absenceStartIndex + absenceItemsPerPage;
  const paginatedTrainerUsers = filteredTrainerUsers.slice(absenceStartIndex, absenceEndIndex);

  // Στατιστικά trainer
  const stats = useMemo(() => {
    const totalLessons = filteredSessions.length;
    const totalParticipants = new Set(filteredSessions.map(s => s.userId)).size;
    return { totalLessons, totalParticipants };
  }, [filteredSessions]);

  // Fake attendance data (commented out - not used)
  // const fakeAttendanceRecords: AttendanceRecord[] = [
  //   {
  //     id: '1',
  //     userId: '1',
  //     userName: 'Μαρία Παπαδάκη',
  //     userEmail: 'maria.p@email.com',
  //     sessionId: '1',
  //     sessionDate: '2024-01-22T09:00:00Z',
  //     sessionTime: '09:00',
  //     sessionType: 'Pilates',
  //     sessionRoom: 'Room 1',
  //     absenceType: 'absent' as const,
  //     reason: 'Test absence',
  //     notes: 'Test notes',
  //     createdAt: '2024-01-22T09:00:00Z'
  //   },
  //   {
  //     id: '2',
  //     userId: '2',
  //     userName: 'Γιώργος Νικολάου',
  //     userEmail: 'giorgos.n@email.com',
  //     sessionId: '1',
  //     sessionDate: '2024-01-22T09:00:00Z',
  //     sessionTime: '09:00',
  //     sessionType: 'Pilates',
  //     sessionRoom: 'Room 1',
  //     absenceType: 'late' as const,
  //     reason: 'Test late',
  //     notes: 'Test notes',
  //     createdAt: '2024-01-22T09:00:00Z'
  //   },
  //   {
  //     id: '3',
  //     userId: '3',
  //     userName: 'Σοφία Μητσοτάκη',
  //     userEmail: 'sofia.m@email.com',
  //     sessionId: '2',
  //     sessionDate: '2024-01-23T20:00:00Z',
  //     sessionTime: '20:00',
  //     sessionType: 'Kick Boxing',
  //     sessionRoom: 'Room 2',
  //     absenceType: 'excused' as const,
  //     reason: 'Test excused',
  //     notes: 'Test notes',
  //     createdAt: '2024-01-23T20:00:00Z'
  //   }
  // ];





  // Load all users for search modal
  const loadAllUsers = async () => {
    try {
      console.log('[TrainerSpecificDashboard] Loading all users for search');
      const users = await getAllUsers();
      setAllUsers(users);
      console.log(`[TrainerSpecificDashboard] Loaded ${users.length} total users for search`);
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Error loading all users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    }
  };

  // Load trainer users based on schedules
  const loadTrainerUsers = async () => {
    if (!trainerName) return;
    
    try {
      console.log(`[TrainerSpecificDashboard] Loading users for trainer: ${trainerName}`);
      const users = await getTrainerUsers(trainerName);
      setTrainerUsers(users);
      console.log(`[TrainerSpecificDashboard] Loaded ${users.length} users for ${trainerName}`);
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Error loading trainer users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    }
  };

  // Load absences for a specific user
  const loadUserAbsences = async (userId: string) => {
    if (!trainerName) return;
    
    try {
      const absences = await getUserAbsences(userId, trainerName);
      setUserAbsences(prev => ({
        ...prev,
        [userId]: absences
      }));
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Error loading user absences:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των απουσιών');
    }
  };

  // Add new absence
  const handleAddAbsence = async () => {
    if (!selectedUser || !trainerName) return;
    
    try {
      console.log('[TrainerSpecificDashboard] Adding absence for user:', selectedUser);
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
      setSelectedUser(null);
      setSelectedUserSearch('');
      setNewAbsence({
        sessionId: '',
        sessionDate: '',
        sessionTime: '',
        absenceType: 'absent',
        reason: '',
        notes: ''
      });
      
      // Reload absences for the user with a small delay
      setTimeout(async () => {
        await loadUserAbsences(selectedUser);
      }, 500);
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Error adding absence:', error);
      toast.error('Σφάλμα κατά την καταχώρηση της απουσίας');
    }
  };


  // Delete absence
  const handleDeleteAbsence = async (absenceId: string) => {
    try {
      console.log('[TrainerSpecificDashboard] Deleting absence:', absenceId);
      await deleteAbsence(absenceId);
      toast.success('Η απουσία διαγράφηκε επιτυχώς');
      
      // Reload absences for the user
      if (selectedUser) {
        await loadUserAbsences(selectedUser);
      }
    } catch (error) {
      console.error('[TrainerSpecificDashboard] Error deleting absence:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της απουσίας');
    }
  };

  // Load data when trainer name changes
  useEffect(() => {
    if (trainerName) {
      loadTrainerUsers();
      loadAllUsers(); // Load all users for search modal
      // Reset cache when trainer changes
      setLoadedUsers(new Set());
      setUserAbsences({});
    }
  }, [trainerName]);

  // Load absences for users on current page when page or search changes
  useEffect(() => {
    if (paginatedTrainerUsers.length > 0 && !loadingAbsences) {
      // Only load absences for users that haven't been loaded yet
      const usersToLoad = paginatedTrainerUsers.filter(user => 
        !loadedUsers.has(user.user_id)
      );
      
      if (usersToLoad.length > 0) {
        setLoadingAbsences(true);
        
        // Load absences for users that haven't been loaded yet
        const loadAbsencesForPage = async () => {
          const promises = usersToLoad.map(user => 
            loadUserAbsences(user.user_id)
          );
          
          await Promise.all(promises);
          
          // Mark users as loaded
          setLoadedUsers(prev => {
            const newSet = new Set(prev);
            usersToLoad.forEach(user => newSet.add(user.user_id));
            return newSet;
          });
          
          setLoadingAbsences(false);
        };
        
        loadAbsencesForPage();
      }
    }
  }, [paginatedTrainerUsers, trainerName]);


  const tabs = [
    { id: 'schedule', name: 'Μηνιαίο Πρόγραμμα', icon: Calendar },
    { id: 'attendance', name: 'Σύστημα Απουσιών', icon: UserCheck }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Πίνακας Ελέγχου
                </h1>
                <p className="text-sm text-gray-600 font-medium">{trainerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Σύνολο Μαθημάτων</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
                <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% από προηγούμενο μήνα
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Συνολικοί Συμμετέχοντες</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</p>
                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Ενεργοί χρήστες
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Απόδοση</p>
                <p className="text-3xl font-bold text-gray-900">94%</p>
                <p className="text-xs text-purple-600 font-medium mt-1 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Εξαιρετική
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-8 overflow-hidden">
          <div className="border-b border-gray-200/50">
            <nav className="flex space-x-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>


          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Personal Training - Μηνιαίο Πρόγραμμα
                  </h2>
                  <p className="text-sm text-gray-600">Προβολή ωρολογίου προπονητών για όλο τον μήνα</p>
                </div>
                {loading && (
                  <div className="flex items-center text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg mt-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.
                  </div>
                )}
              </div>
              
              <TrainerMonthlyCalendar
                trainerName={trainerName}
                featureEnabled={true}
              />
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Σύστημα Απουσιών Personal Training
                  </h2>
                  <p className="text-sm text-gray-600">Διαχείριση απουσιών και παρουσίας</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  {loadingAbsences && (
                    <div className="flex items-center text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Φόρτωση απουσιών...
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddAbsenceModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Προσθήκη Απουσίας</span>
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 w-full">
                    <label htmlFor="searchUsers" className="block text-sm font-medium text-gray-700 mb-2">
                      Αναζήτηση Χρηστών
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="searchUsers"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setAbsenceCurrentPage(1);
                        }}
                        placeholder="Αναζήτηση με όνομα ή email..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setAbsenceCurrentPage(1);
                      }}
                      className="px-4 py-3 text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
                    >
                      Καθαρισμός
                    </button>
                  )}
                </div>
              </div>

              {/* Users List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedTrainerUsers.map(user => (
                  <div
                    key={user.user_id}
                    className={`bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      selectedUser === user.user_id 
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-200' 
                        : 'border-white/20 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedUser(user.user_id);
                      loadUserAbsences(user.user_id);
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                        {user.profile_photo ? (
                          <img
                            src={user.profile_photo}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                  <span class="text-white font-semibold text-lg">${user.first_name.charAt(0)}${user.last_name.charAt(0)}</span>
                                </div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate mb-1">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate mb-3">{user.email}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-600">Ενεργός</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <UserCheck className="h-3 w-3" />
                            <span>{userAbsences[user.user_id] ? userAbsences[user.user_id].length : 0} απουσίες</span>
                          </div>
                        </div>
                        
                        {user.next_session_date && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                              <Calendar className="h-3 w-3" />
                              <span className="font-medium">Επόμενη σέσια</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(user.next_session_date).toLocaleDateString('el-GR')}
                            </p>
                            <p className="text-xs text-gray-600">
                              {user.next_session_time} - {user.next_session_type}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls for Users */}
              {totalAbsencePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                  <div className="flex items-center text-sm text-gray-700 mb-4 sm:mb-0">
                    <span className="font-medium">
                      Εμφάνιση {absenceStartIndex + 1}-{Math.min(absenceEndIndex, filteredTrainerUsers.length)} από {filteredTrainerUsers.length} χρήστες
                      {searchTerm && ` (φιλτραρισμένοι για "${searchTerm}")`}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setAbsenceCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={absenceCurrentPage === 1}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white/80 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Προηγούμενη</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalAbsencePages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setAbsenceCurrentPage(page)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                              absenceCurrentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'text-gray-700 bg-white/80 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setAbsenceCurrentPage(prev => Math.min(prev + 1, totalAbsencePages))}
                      disabled={absenceCurrentPage === totalAbsencePages}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white/80 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <span>Επόμενη</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Selected User Absences */}
              {selectedUser && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <UserMinus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Ιστορικό Απουσιών
                        </h3>
                        <p className="text-sm text-gray-600">
                          {trainerUsers.find(u => u.user_id === selectedUser)?.first_name} {trainerUsers.find(u => u.user_id === selectedUser)?.last_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {userAbsences[selectedUser] && userAbsences[selectedUser].length > 0 ? (
                    <div className="space-y-4">
                      {userAbsences[selectedUser].map(absence => (
                        <div key={absence.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-3 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {new Date(absence.session_date).toLocaleDateString('el-GR')}
                                  </span>
                                  <span className="text-sm text-gray-600">{absence.session_time}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{absence.reason || 'Χωρίς αιτία'}</span>
                                  {absence.notes && (
                                    <span className="text-gray-500">• {absence.notes}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-xl ${
                                absence.absence_type === 'absent' ? 'bg-red-100 text-red-800 border border-red-200' :
                                absence.absence_type === 'late' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {absence.absence_type === 'absent' ? 'Απών' :
                                 absence.absence_type === 'late' ? 'Καθυστέρηση' : 'Δικαιολογημένος'}
                              </span>
                              <button
                                onClick={() => handleDeleteAbsence(absence.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Διαγραφή"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Δεν υπάρχουν απουσίες</h3>
                      <p className="text-gray-600">Ο χρήστης δεν έχει καταχωρημένες απουσίες</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Absence Modal */}
              {showAddAbsenceModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <UserMinus className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Προσθήκη Απουσίας</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Χρήστης</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Αναζήτηση χρήστη..."
                            value={selectedUserSearch || ''}
                            onChange={(e) => {
                              setSelectedUserSearch(e.target.value);
                              setSelectedUser('');
                            }}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {selectedUserSearch && (
                          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                            {allUsers
                              .filter(user => 
                                `${user.first_name} ${user.last_name}`.toLowerCase().includes(selectedUserSearch.toLowerCase()) ||
                                user.email.toLowerCase().includes(selectedUserSearch.toLowerCase())
                              )
                              .map(user => (
                                <div
                                  key={user.user_id}
                                  onClick={() => {
                                    setSelectedUser(user.user_id);
                                    setSelectedUserSearch(`${user.first_name} ${user.last_name}`);
                                  }}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία</label>
                          <input
                            type="date"
                            value={newAbsence.sessionDate}
                            onChange={(e) => setNewAbsence(prev => ({ ...prev, sessionDate: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ώρα</label>
                          <input
                            type="time"
                            value={newAbsence.sessionTime}
                            onChange={(e) => setNewAbsence(prev => ({ ...prev, sessionTime: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Τύπος Απουσίας</label>
                        <select
                          value={newAbsence.absenceType}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, absenceType: e.target.value as 'absent' | 'late' | 'excused' }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="absent">Απών</option>
                          <option value="late">Καθυστέρηση</option>
                          <option value="excused">Δικαιολογημένος</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Αιτία</label>
                        <input
                          type="text"
                          value={newAbsence.reason}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Προαιρετική αιτία"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Σημειώσεις</label>
                        <textarea
                          value={newAbsence.notes}
                          onChange={(e) => setNewAbsence(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Προαιρετικές σημειώσεις"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 mt-8">
                      <button
                        onClick={() => setShowAddAbsenceModal(false)}
                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      >
                        Ακύρωση
                      </button>
                      <button
                        onClick={handleAddAbsence}
                        disabled={!selectedUser || !newAbsence.sessionDate || !newAbsence.sessionTime}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                      >
                        Προσθήκη Απουσίας
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* General Notes */}
        </div>
      </div>
    </div>
  );
};

export default TrainerSpecificDashboard;
