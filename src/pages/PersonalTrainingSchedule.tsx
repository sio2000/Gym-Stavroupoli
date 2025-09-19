import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { supabaseAdmin } from '@/config/supabaseAdmin';
import { 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Dumbbell,
  Zap,
  Target,
  MessageSquare,
  Users,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PersonalTrainingSchedule,
  GroupAssignment
} from '@/types';
import { getUserGroupAssignments, getDayName, formatTime } from '@/utils/groupAssignmentApi';

const PersonalTrainingSchedulePage: React.FC = () => {
  console.log('[PersonalTrainingSchedule] Component rendering');
  const { user } = useAuth();
  console.log('[PersonalTrainingSchedule] User from useAuth:', user?.email, 'ID:', user?.id);
  const [schedule, setSchedule] = useState<PersonalTrainingSchedule | null>(null);
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Protection against multiple calls
  const hasLoadedRef = useRef(false); // Prevent multiple loads for same user
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];


  useEffect(() => {
    console.log('[PersonalTrainingSchedule] ===== USEEFFECT TRIGGERED =====');
    console.log('[PersonalTrainingSchedule] User:', user?.email, 'ID:', user?.id);
    console.log('[PersonalTrainingSchedule] User object:', user);
    console.log('[PersonalTrainingSchedule] hasLoadedRef.current:', hasLoadedRef.current);
    console.log('[PersonalTrainingSchedule] isLoading:', isLoading);
    console.log('[PersonalTrainingSchedule] loading state:', loading);
    
    // Clear any existing timeout
    if (loadTimeout) {
      console.log('[PersonalTrainingSchedule] Clearing existing timeout');
      clearTimeout(loadTimeout);
      setLoadTimeout(null);
    }
    
    // Περιμένουμε να υπάρχει user πριν τη φόρτωση
    if (!user) {
      console.log('[PersonalTrainingSchedule] No user, resetting hasLoadedRef and stopping loading');
      hasLoadedRef.current = false;
      setLoading(false);
      return;
    }
    
    // Prevent multiple loads for the same user
    if (hasLoadedRef.current) {
      console.log('[PersonalTrainingSchedule] Already loaded for this user, skipping');
      return;
    }
    
    console.log('[PersonalTrainingSchedule] Starting load for user:', user.email);
    hasLoadedRef.current = true;
    loadPersonalTrainingSchedule();
    
    // Set a timeout to prevent infinite loading
    console.log('[PersonalTrainingSchedule] Setting 10 second timeout');
    const timeout = setTimeout(() => {
      console.warn('[PersonalTrainingSchedule] Load timeout reached, stopping loading');
      setLoading(false);
      setIsLoading(false);
    }, 10000); // 10 seconds timeout
    
    setLoadTimeout(timeout);
    
    return () => {
      console.log('[PersonalTrainingSchedule] useEffect cleanup');
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [user]);

  const loadPersonalTrainingSchedule = async () => {
    console.log('[PersonalTrainingSchedule] ===== LOADING STARTED =====');
    console.log('[PersonalTrainingSchedule] User ID:', user?.id);
    console.log('[PersonalTrainingSchedule] User email:', user?.email);
    
    // Protection against multiple concurrent calls
    if (isLoading) {
      console.log('[PersonalTrainingSchedule] Already loading, skipping...');
      return;
    }

    setIsLoading(true);
    
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error('[PersonalTrainingSchedule] No user ID found');
        toast.error('Δεν βρέθηκε χρήστης. Κάντε επανασύνδεση.');
        setSchedule(null);
        return;
      }

      console.log('[PersonalTrainingSchedule] Querying personal_training_schedules...');
      
      // Optimized query - only select necessary fields including group information
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('id,user_id,month,year,schedule_data,status,created_by,created_at,updated_at,trainer_name,accepted_at,declined_at,training_type,group_room_size,weekly_frequency')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('[PersonalTrainingSchedule] Query result - data:', data, 'error:', error);

      if (error) {
        console.error('[PersonalTrainingSchedule] Query error:', error);
        toast.error(`Σφάλμα βάσης δεδομένων: ${error.message}`);
        setSchedule(null);
        return;
      }

      if (data && data.length > 0) {
        console.log('[PersonalTrainingSchedule] Found schedule data:', data[0]);
        const row = data[0];
        
        const loaded: PersonalTrainingSchedule = {
          id: row.id,
          userId: row.user_id,
          month: row.month,
          year: row.year,
          scheduleData: row.schedule_data,
          status: row.status,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          acceptedAt: row.accepted_at,
          declinedAt: row.declined_at,
          trainingType: row.training_type,
          groupRoomSize: row.group_room_size,
          weeklyFrequency: row.weekly_frequency
        } as any;
        
        console.log('[PersonalTrainingSchedule] Loaded schedule:', loaded);
        
        // Load group assignments if this is a group training
        if (loaded.trainingType === 'group') {
          try {
            const assignments = await getUserGroupAssignments(user.id, loaded.id);
            setGroupAssignments(assignments);
            console.log('[PersonalTrainingSchedule] Loaded group assignments:', assignments);
          } catch (error) {
            console.error('[PersonalTrainingSchedule] Error loading group assignments:', error);
            // Don't show error to user as this is optional data
          }
        }
        
        // Auto-accept any pending schedule for this user
        if (loaded.status === 'pending') {
          try {
            const nowIso = new Date().toISOString();
            const { error: acceptError } = await supabase
              .from('personal_training_schedules')
              .update({ status: 'accepted', accepted_at: nowIso, updated_at: nowIso })
              .eq('id', loaded.id);
            if (acceptError) {
              console.error('[PersonalTrainingSchedule] Auto-accept update error:', acceptError);
            } else {
              loaded.status = 'accepted';
              loaded.acceptedAt = nowIso;
              loaded.updatedAt = nowIso;
            }
          } catch (e) {
            console.error('[PersonalTrainingSchedule] Auto-accept exception:', e);
          }
        }
        setSchedule(loaded);
      } else {
        console.log('[PersonalTrainingSchedule] No schedule found for user');
        setSchedule(null);
      }
    } catch (error) {
      console.error('[PersonalTrainingSchedule] Exception while loading schedule:', error);
      toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
      setSchedule(null);
    } finally {
      console.log('[PersonalTrainingSchedule] ===== LOADING COMPLETED =====');
      setLoading(false);
      setIsLoading(false);
      
      // Clear timeout since loading completed
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        setLoadTimeout(null);
      }
    }
  };

  const handleAcceptSchedule = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      console.log('[PTS] Accepting schedule:', schedule.id);
      
      const acceptedAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('personal_training_schedules')
        .update({ 
          status: 'accepted', 
          accepted_at: acceptedAt, 
          updated_at: updatedAt 
        })
        .eq('id', schedule.id);
        
      if (error) {
        console.error('[PTS] Accept error:', error);
        throw error;
      }
      
      console.log('[PTS] Schedule accepted successfully');
      await loadPersonalTrainingSchedule();
      toast.success('Το πρόγραμμα έγινε αποδεκτό!');
    } catch (error) {
      console.error('[PTS] Accept error:', error);
      toast.error('Σφάλμα κατά την αποδοχή του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineSchedule = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      console.log('[PTS] Declining schedule:', schedule.id);
      
      const declinedAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('personal_training_schedules')
        .update({ 
          status: 'declined', 
          declined_at: declinedAt, 
          updated_at: updatedAt 
        })
        .eq('id', schedule.id);
        
      if (error) {
        console.error('[PTS] Decline error:', error);
        throw error;
      }
      
      console.log('[PTS] Schedule declined successfully');
      await loadPersonalTrainingSchedule();
      setShowDeclineMessage(true);
      toast.success('Το πρόγραμμα απορρίφθηκε. Θα επικοινωνήσουμε μαζί σας για να βρούμε τις κατάλληλες ώρες.');
    } catch (error) {
      console.error('[PTS] Decline error:', error);
      toast.error('Σφάλμα κατά την απόρριψη του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <Dumbbell className="h-5 w-5 text-blue-600" />;
      case 'kickboxing':
        return <Zap className="h-5 w-5 text-red-600" />;
      case 'combo':
        return <Target className="h-5 w-5 text-green-600" />;
      default:
        return <Dumbbell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSessionTypeName = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal Training';
      case 'kickboxing':
        return 'Kick Boxing';
      case 'combo':
        return 'Combo Training';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Εκκρεμεί Απόφαση';
      case 'accepted':
        return 'Αποδεκτό';
      case 'declined':
        return 'Απορρίφθηκε';
      default:
        return status;
    }
  };

  console.log('[PersonalTrainingSchedule] Rendering - loading:', loading, 'user:', user?.email, 'schedule:', !!schedule);

  if (loading) {
    console.log('[PersonalTrainingSchedule] Rendering loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση προγράμματος...</p>
          <p className="text-sm text-gray-500 mt-2">User: {user?.email || 'No user'}</p>
          <p className="text-xs text-gray-400 mt-1">Loading state: {loading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Δεν βρέθηκε πρόγραμμα</h2>
          <p className="text-gray-600">Δεν υπάρχει διαθέσιμο πρόγραμμα Personal Training για εσάς.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Πρόγραμμα Personal Training
                {schedule.trainingType === 'group' && (
                  <span className="ml-2 text-lg text-blue-600">
                    (Ομαδικό - {schedule.groupRoomSize} άτομα)
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {days[schedule.month - 1]} {schedule.year}
                {schedule.trainingType === 'group' && schedule.weeklyFrequency && (
                  <span className="ml-2 text-blue-600">
                    • {schedule.weeklyFrequency} φορές/εβδομάδα
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {schedule.trainingType === 'group' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  👥 Group Training
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status)}`}>
                {getStatusText(schedule.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Group Assignments - Only for Group Training */}
        {schedule.trainingType === 'group' && groupAssignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Οι Ομαδικές σας Θέσεις
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-blue-900">
                        {getDayName(assignment.dayOfWeek)}
                      </h3>
                      <p className="text-sm text-blue-700">
                        {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      👥 {assignment.groupType} άτομα
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Προπονητής: {assignment.trainer}
                    </div>
                    {assignment.room && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {assignment.room}
                      </div>
                    )}
                  </div>
                  
                  {assignment.notes && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded p-2">
                      💬 {assignment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Sessions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Προγραμματισμένες Σεσίες</h2>
          
          {schedule.scheduleData.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Δεν υπάρχουν προγραμματισμένες σεσίες</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.scheduleData.sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getSessionIcon(session.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {getSessionTypeName(session.type)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(session.date).toLocaleDateString('el-GR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{session.trainer}</span>
                        </div>
                        {session.room && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📍</span>
                            <span>{session.room}</span>
                          </div>
                        )}
                        {session.notes && (
                          <div className="flex items-start space-x-2 text-sm text-gray-600 mt-2">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>{session.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Information */}
        {(schedule.scheduleData.notes || schedule.scheduleData.specialInstructions) && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Πληροφορίες Προγράμματος</h2>
            <div className="space-y-4">
              {schedule.scheduleData.notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Σημειώσεις</h3>
                  <p className="text-gray-600">{schedule.scheduleData.notes}</p>
                </div>
              )}
              {schedule.scheduleData.specialInstructions && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ειδικές Οδηγίες</h3>
                  <p className="text-gray-600">{schedule.scheduleData.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons removed: auto-accepted */}

        {/* Status Messages */}
        {schedule.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Πρόγραμμα Αποδεκτό</h3>
                <p className="text-green-700 mt-1">
                  Το πρόγραμμα έχει γίνει αποδεκτό! Θα λάβετε ειδοποιήσεις για τις προπονήσεις σας.
                </p>
              </div>
            </div>
          </div>
        )}

        {schedule.status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Πρόγραμμα Απορριφθέν</h3>
                <p className="text-red-700 mt-1">
                  Παρακαλώ περάστε από το γυμναστήριο για να συζητήσουμε τις ώρες που σας βολεύουν.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decline Message Modal */}
        {showDeclineMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Πρόγραμμα Απορρίφθηκε</h3>
                <p className="text-gray-600 mb-6">
                  Παρακαλώ περάστε από το γυμναστήριο για να συζητήσουμε τις ώρες που σας βολεύουν.
                </p>
                <button
                  onClick={() => setShowDeclineMessage(false)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Κατάλαβα
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalTrainingSchedulePage;
