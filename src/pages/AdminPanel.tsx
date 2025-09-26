import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { 
  User,
  Users,
  Plus,
  Save,
  Edit3,
  Calendar,
  Trash2,
  Search,
  X,
  Settings,
  Clock,
  Award,
  DollarSign,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  PersonalTrainingSchedule, 
  PersonalTrainingSession,
  UserWithPersonalTraining,
  TrainerName,
  MembershipPackage,
  MembershipPackageDuration,
  MembershipRequest
} from '@/types';
import { createUserGroupSessions, deleteUserGroupSessions } from '@/utils/groupSessionsApi';
import PilatesScheduleManagement from '@/components/admin/PilatesScheduleManagement';
import CashRegister from '@/components/admin/CashRegister';
import GroupAssignmentManager from '@/components/admin/GroupAssignmentManager';
import GroupAssignmentInterface from '@/components/admin/GroupAssignmentInterface';
import GroupTrainingCalendar from '@/components/admin/GroupTrainingCalendar';
import AdminUltimateInstallmentsTab from '@/components/admin/AdminUltimateInstallmentsTab';
import ErrorBoundary from '@/components/ErrorBoundary';

import { 
  getMembershipPackages, 
  getMembershipPackageDurations, 
  updateMembershipPackageDuration,
  getMembershipRequests,
  approveMembershipRequest,
  approveUltimateMembershipRequest,
  rejectMembershipRequest,
  formatPrice,
  getDurationLabel,
  getPilatesPackageDurations,
  updatePilatesPackagePricing,
} from '@/utils/membershipApi';
import { 
  markOldMembersUsed, 
  saveKettlebellPoints,
  getTotalKettlebellPoints,
  getKettlebellPointsSummary,
  getUserKettlebellPoints,
  UserKettlebellSummary
} from '@/utils/programOptionsApi';
import { 
  saveCashTransaction
} from '@/utils/cashRegisterApi';
import { 
  saveProgramApprovalState
} from '@/utils/programApprovalApi';



// Available trainers for dropdown selection
const AVAILABLE_TRAINERS: TrainerName[] = ['Mike', 'Jordan'];

// Large dataset handling constants
const LARGE_DATASET_THRESHOLD = 100;
const ITEMS_PER_PAGE = 50;

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal-training' | 'membership-packages' | 'ultimate-subscriptions' | 'pilates-schedule' | 'kettlebell-points' | 'cash-register'>('personal-training');
  const [allUsers, setAllUsers] = useState<UserWithPersonalTraining[]>([]);
  const [programStatuses, setProgramStatuses] = useState<Array<{
    user: UserWithPersonalTraining;
    schedule: PersonalTrainingSchedule;
    status: 'pending' | 'accepted' | 'declined';
  }>>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Data caching state - track which tabs have loaded data
  const [dataLoaded, setDataLoaded] = useState({
    'personal-training': false,
    'membership-packages': false,
    'ultimate-subscriptions': false,
    'pilates-schedule': false,
    'kettlebell-points': false,
    'cash-register': false
  });
  
  // Memoized pagination logic
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return allUsers.slice(startIndex, endIndex);
  }, [allUsers, currentPage, usersPerPage]);
  
  const totalPages = Math.ceil(allUsers.length / usersPerPage);
  const [selectedUser] = useState<UserWithPersonalTraining | null>(null);
  const [personalTrainingSchedule, setPersonalTrainingSchedule] = useState<PersonalTrainingSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
    const [newCode, setNewCode] = useState({
    code: '',
    selectedUserId: '' 
  });
  const [trainingType, setTrainingType] = useState<'individual' | 'group' | 'combination'>('individual');
  const [userType, setUserType] = useState<'personal' | 'paspartu'>('personal'); // New state for user type selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Group Room Options state
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<'2' | '3' | '6' | null>(null);
  const [weeklyFrequency, setWeeklyFrequency] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  
  // Combination training state
  const [combinationPersonalSessions, setCombinationPersonalSessions] = useState(1);
  const [combinationGroupSessions, setCombinationGroupSessions] = useState(2);
  
  // Group Assignment Manager state
  const [showGroupAssignmentManager, setShowGroupAssignmentManager] = useState(false);
  const [groupAssignmentUser, setGroupAssignmentUser] = useState<UserWithPersonalTraining | null>(null);
  const [groupAssignmentProgramId, setGroupAssignmentProgramId] = useState<string | null>(null);
  const [selectedGroupSlots, setSelectedGroupSlots] = useState<{[userId: string]: any[]}>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchMode, setUserSearchMode] = useState<'dropdown' | 'search'>('dropdown');
  const [programStatusSearchTerm] = useState('');
  const [statusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  
  // Feature flags
  const [groupCalendarEnabled] = useState(true); // Feature flag for Group Training Calendar
  
  // New panel state variables
  const [usedOldMembers, setUsedOldMembers] = useState<Set<string>>(new Set());
  const [kettlebellPoints, setKettlebellPoints] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<{
    [userId: string]: {
      oldMembers: boolean;
      kettlebellPoints: string;
      cash: boolean;
      pos: boolean;
      approval: boolean;
      rejection: boolean;
      pending: boolean;
      cashAmount?: number;
      posAmount?: number;
      // Group room information
      groupRoomSize?: number | null;
      weeklyFrequency?: number | null;
      monthlyTotal?: number | null;
      // Installment properties
      installment1Amount?: number;
      installment2Amount?: number;
      installment3Amount?: number;
      installment1PaymentMethod?: string;
      installment2PaymentMethod?: string;
      installment3PaymentMethod?: string;
      installment1DueDate?: string;
      installment2DueDate?: string;
      installment3DueDate?: string;
    }
  }>({});
  
  // Kettlebell Points page state
  const [kettlebellSummary, setKettlebellSummary] = useState<UserKettlebellSummary[]>([]);
  const [totalKettlebellPoints, setTotalKettlebellPoints] = useState<number>(0);
  const [kettlebellSearchTerm, setKettlebellSearchTerm] = useState<string>('');
  const [kettlebellSearchResults, setKettlebellSearchResults] = useState<UserKettlebellSummary[]>([]);

  // Cash Register state
  const [cashAmount, setCashAmount] = useState<string>('');
  const [posAmount, setPosAmount] = useState<string>('');
  const [showCashInput, setShowCashInput] = useState<boolean>(false);
  const [showPosInput, setShowPosInput] = useState<boolean>(false);

  // Program Approval state
  const [programApprovalStatus, setProgramApprovalStatus] = useState<'none' | 'approved' | 'rejected' | 'pending'>('none');
  
  // Ultimate Subscriptions state
  const [ultimateRequests, setUltimateRequests] = useState<MembershipRequest[]>([]);
  const [ultimateLoading, setUltimateLoading] = useState(false);
  const [ultimateSearchTerm, setUltimateSearchTerm] = useState('');
  
  // Large dataset handling state
  const [isLoadingLargeDataset, setIsLoadingLargeDataset] = useState(false);
  const [largeDatasetPage, setLargeDatasetPage] = useState(1);
  
  // Pending state for UI
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set());
  const [frozenOptions, setFrozenOptions] = useState<{[userId: string]: {
    oldMembers: boolean;
    kettlebellPoints: string;
    cash: boolean;
    pos: boolean;
    cashAmount?: number;
    posAmount?: number;
    // Group room information
    groupRoomSize?: number | null;
    weeklyFrequency?: number | null;
    monthlyTotal?: number | null;
  }}>({});



  // Helper function to check if user is pending
  const isUserPending = (userId: string) => {
    return pendingUsers.has(userId);
  };

  // Helper function to get frozen options for user
  const getFrozenOptions = (userId: string) => {
    return frozenOptions[userId] || null;
  };

  // Helper functions for membership request pending users
  const isRequestPending = (requestId: string) => {
    return requestPendingUsers.has(requestId);
  };

  const getRequestFrozenOptions = (requestId: string) => {
    return requestFrozenOptions[requestId] || null;
  };

  // Calculate monthly total when weekly frequency changes
  useEffect(() => {
    if (weeklyFrequency) {
      setMonthlyTotal(weeklyFrequency * 4);
    } else {
      setMonthlyTotal(0);
    }
  }, [weeklyFrequency]);

  // Reset group room options when training type changes
  useEffect(() => {
    if (trainingType === 'individual') {
      setSelectedGroupRoom(null);
      setWeeklyFrequency(null);
      setMonthlyTotal(0);
    }
    // For combination, we keep group room options so user can configure group part
    
    // Force personal user type for combination training
    if (trainingType === 'combination') {
      setUserType('personal');
    }
  }, [trainingType]);
  
  // Auto-set default group room for group and combination training (since admin will choose per session)
  useEffect(() => {
    if ((trainingType === 'group' && selectedUserIds.length > 0) || (trainingType === 'combination' && newCode.selectedUserId)) {
      if (!selectedGroupRoom) {
        console.log('[AdminPanel] Auto-setting default group room to 3 for', trainingType);
        setSelectedGroupRoom('3'); // Default value since admin will customize per session
      }
    }
  }, [trainingType, selectedUserIds.length, newCode.selectedUserId]);

  // Load frozen options when user is selected
  useEffect(() => {
    if ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) {
      const frozen = getFrozenOptions(newCode.selectedUserId);
      if (frozen) {
        setKettlebellPoints(frozen.kettlebellPoints || '');
        setCashAmount(frozen.cashAmount?.toString() || '');
        setPosAmount(frozen.posAmount?.toString() || '');
      }
    }
  }, [newCode.selectedUserId, trainingType]);
  const itemsPerPage = 10;
  // Προσωποποιημένο πρόγραμμα που θα σταλεί μαζί με τον κωδικό
  const [programSessions, setProgramSessions] = useState<PersonalTrainingSession[]>([
    { id: 'tmp-1', date: new Date().toISOString().split('T')[0], startTime: '18:00', endTime: '19:00', type: 'personal', trainer: 'Mike', room: 'Αίθουσα Mike', group: '2ΑτομαGroup', notes: '' }
  ]);

  // Membership Packages state
  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations, setPackageDurations] = useState<MembershipPackageDuration[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [editingDuration, setEditingDuration] = useState<MembershipPackageDuration | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  
  // Pagination and search state for membership requests
  const [membershipRequestsPage, setMembershipRequestsPage] = useState(1);
  const [membershipRequestsSearchTerm, setMembershipRequestsSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 6;
  
  // Program Options state for membership requests
  const [selectedRequestOptions, setSelectedRequestOptions] = useState<{[requestId: string]: {
    oldMembers?: boolean;
    kettlebellPoints?: string;
    cash?: boolean;
    pos?: boolean;
    cashAmount?: number;
    posAmount?: number;
    installment1Amount?: number;
    installment2Amount?: number;
    installment3Amount?: number;
    installment1PaymentMethod?: string;
    installment2PaymentMethod?: string;
    installment3PaymentMethod?: string;
    installment1DueDate?: string;
    installment2DueDate?: string;
    installment3DueDate?: string;
  }}>({});
  const [requestProgramApprovalStatus, setRequestProgramApprovalStatus] = useState<{[requestId: string]: 'none' | 'approved' | 'rejected' | 'pending'}>({});
  const [requestPendingUsers, setRequestPendingUsers] = useState<Set<string>>(new Set());
  const [requestFrozenOptions, setRequestFrozenOptions] = useState<{[requestId: string]: any}>({});
  
  // Pilates package state
  const [pilatesDurations, setPilatesDurations] = useState<MembershipPackageDuration[]>([]);
  

  const tabs = [
    { id: 'personal-training', name: 'Personal Training Πρόγραμμα', icon: Calendar },
    { id: 'membership-packages', name: 'Πακέτα Συνδρομών', icon: Settings },
    { id: 'ultimate-subscriptions', name: '👑 Ultimate Συνδρομές', icon: User },
    { id: 'pilates-schedule', name: 'Πρόγραμμα Pilates', icon: Clock },
    { id: 'kettlebell-points', name: 'Kettlebell Points', icon: Award },
    { id: 'cash-register', name: 'Ταμείο', icon: DollarSign }
  ];

  const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];



  // Helper: block hardcoded test users (UI guard)
  const isBlockedTestUser = (u: { email?: string | null; personalTrainingCode?: string | null; firstName?: string; lastName?: string }): boolean => {
    const blockedEmails = ['user1@freegym.gr', 'user2@freegym.gr'];
    const blockedCodes = ['PERSONAL2024', 'KICKBOX2024'];
    const byEmail = !!u.email && blockedEmails.includes(u.email);
    const byCode = !!u.personalTrainingCode && blockedCodes.includes(u.personalTrainingCode);
    return byEmail || byCode;
  };

  // Filtered users based on search term
  const filteredUsers = allUsers.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  // Filtered program statuses based on search term and status filter
  const filteredProgramStatuses = programStatuses.filter(programStatus => {
    // Apply search filter
    const matchesSearch = !programStatusSearchTerm || (() => {
      const searchLower = programStatusSearchTerm.toLowerCase();
      return (
        programStatus.user.firstName.toLowerCase().includes(searchLower) ||
        programStatus.user.lastName.toLowerCase().includes(searchLower) ||
        programStatus.user.email.toLowerCase().includes(searchLower) ||
        `${programStatus.user.firstName} ${programStatus.user.lastName}`.toLowerCase().includes(searchLower)
      );
    })();
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || programStatus.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [programStatusSearchTerm, statusFilter]);
  
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // Function to check admin role in database
  const checkAdminRoleInDatabase = async () => {
    try {
      console.log('[AdminPanel] Checking admin role in database...');
      
      const { data: adminProfile, error } = await supabase
        .from('user_profiles')
        .select('user_id, role, first_name, last_name, email')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        console.error('[AdminPanel] Error checking admin profile:', error);
        return false;
      }
      
      console.log('[AdminPanel] Admin profile in database:', adminProfile);
      console.log('[AdminPanel] Admin role in database:', adminProfile?.role);
      
      return adminProfile?.role === 'admin';
    } catch (error) {
      console.error('[AdminPanel] Exception checking admin role:', error);
      return false;
    }
  };

  // Function to check if we can create data (test RLS permissions)
  const checkIfCanCreateData = async () => {
    try {
      console.log('[AdminPanel] Testing if we can create data...');
      
      // Try to insert a test record and immediately delete it
      const testData = {
        user_id: user?.id,
        month: 1,
        year: 2000,
        schedule_data: { sessions: [] },
        status: 'pending',
        created_by: user?.id
      };
      
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .insert(testData)
        .select();
      
      if (error) {
        console.log('[AdminPanel] Cannot create data - RLS blocking:', error.message);
        return false;
      }
      
      // If successful, delete the test record
      if (data && data.length > 0) {
        await supabase
          .from('personal_training_schedules')
          .delete()
          .eq('id', data[0].id);
        console.log('[AdminPanel] Can create data - RLS working correctly');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AdminPanel] Exception testing data creation:', error);
      return false;
    }
  };

  // Function to create test schedule data
  const createTestScheduleData = async (testUser: UserWithPersonalTraining, adminId?: string) => {
    if (!adminId) {
      console.log('[AdminPanel] No admin ID available for test data creation');
      return;
    }

    try {
      console.log('[AdminPanel] Creating test schedule for user:', testUser.email);
      
      const testSchedule = {
        user_id: testUser.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        schedule_data: {
          sessions: [
            {
              id: 'test-1',
              date: new Date().toISOString().split('T')[0],
              startTime: '18:00',
              endTime: '19:00',
              type: 'personal',
              trainer: 'Mike',
              room: 'Αίθουσα Mike',
              notes: 'Test session created by admin'
            }
          ],
          notes: 'Test program created by admin',
          specialInstructions: 'This is test data'
        },
        status: 'pending',
        created_by: adminId
      };

      const { data, error } = await supabase
        .from('personal_training_schedules')
        .insert(testSchedule)
        .select();

      if (error) {
        console.error('[AdminPanel] Error creating test schedule:', error);
      } else {
        console.log('[AdminPanel] Test schedule created successfully:', data);
        // Reload data after creating test schedule
        setTimeout(() => {
          loadAllUsers();
        }, 1000);
      }
    } catch (error) {
      console.error('[AdminPanel] Exception creating test schedule:', error);
    }
  };

  // Load all users and their personal training schedules from the database
  const loadAllUsers = useCallback(async () => {
    console.log('[AdminPanel] ===== DATA LOADING STARTED =====');
    console.log('[AdminPanel] Current user:', user?.email, 'Role:', user?.role);
    
    try {
      setLoading(true);
      
      // Fetch all users from user_profiles table
      console.log('[AdminPanel] Querying user_profiles table...');
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[AdminPanel] User profiles query result - rows:', userProfiles?.length, 'error:', profilesError);

      if (profilesError) {
        console.error('[AdminPanel] User profiles error:', profilesError);
        throw profilesError;
      }

      // Fetch all personal training schedules
      console.log('[AdminPanel] Querying personal_training_schedules table...');
      console.log('[AdminPanel] Current auth user ID:', user?.id);
      console.log('[AdminPanel] Current auth user role:', user?.role);
      
      // First, let's check if we can access the table at all
      // Try different approaches to access the data
      console.log('[AdminPanel] Attempting to query personal_training_schedules...');
      
      let schedules: any[] = [];
      let schedulesError: any = null;
      
      // Try 1: Direct query
      const { data: directData, error: directError } = await supabase
        .from('personal_training_schedules')
        .select('id,user_id,month,year,schedule_data,status,created_by,created_at,updated_at,trainer_name,accepted_at,declined_at')
        .order('created_at', { ascending: false });
      
      if (directError) {
        console.log('[AdminPanel] Direct query failed:', directError);
        
        // Try 2: Query with specific fields
        const { data: limitedData, error: limitedError } = await supabase
          .from('personal_training_schedules')
          .select('id, user_id, status')
          .limit(10);
        
        if (limitedError) {
          console.log('[AdminPanel] Limited query also failed:', limitedError);
          
          // Try 3: Check if we can at least count rows
          const { count, error: countError } = await supabase
            .from('personal_training_schedules')
            .select('*', { count: 'exact', head: true });
          
          console.log('[AdminPanel] Count query result:', count, 'error:', countError);
        } else {
          console.log('[AdminPanel] Limited query succeeded:', limitedData);
          schedules = limitedData || [];
        }
      } else {
        console.log('[AdminPanel] Direct query succeeded:', directData);
        schedules = directData || [];
      }
      
      schedulesError = directError;

      console.log('[AdminPanel] Schedules query result - rows:', schedules?.length, 'error:', schedulesError);
      
      // Additional debugging for RLS issues
      if (schedules?.length === 0 && !schedulesError) {
        console.log('[AdminPanel] Query succeeded but returned 0 rows - checking RLS policies...');
        
        // Check admin role in database
        const isAdminInDB = await checkAdminRoleInDatabase();
        console.log('[AdminPanel] Is admin in database:', isAdminInDB);
        
        // Check if we can at least count the total rows (bypassing RLS)
        const { count, error: countError } = await supabase
          .from('personal_training_schedules')
          .select('*', { count: 'exact', head: true });
        
        console.log('[AdminPanel] Total rows in table (bypassing RLS):', count, 'error:', countError);
        
        if (count && count > 0) {
          console.warn('[AdminPanel] RLS is blocking access to existing data! Table has', count, 'rows but query returns 0.');
          console.warn('[AdminPanel] Admin role might not be properly configured in RLS policies.');
          console.warn('[AdminPanel] Please run the SQL script: database/fix_admin_rls_policies.sql');
        }
      }
      
      // If we get an error, let's try a different approach
      if (schedulesError) {
        console.error('[AdminPanel] Schedules query failed with error:', schedulesError);
        console.log('[AdminPanel] Error code:', schedulesError.code);
        console.log('[AdminPanel] Error message:', schedulesError.message);
        console.log('[AdminPanel] Error details:', schedulesError.details);
        console.log('[AdminPanel] Error hint:', schedulesError.hint);
        
        // Try to check if the table exists and has any data at all
        console.log('[AdminPanel] Attempting to check table existence...');
        const { data: tableCheck, error: tableError } = await supabase
          .from('personal_training_schedules')
          .select('count')
          .limit(1);
        
        console.log('[AdminPanel] Table check result:', tableCheck, 'error:', tableError);
      }

      if (schedulesError) {
        console.error('[AdminPanel] Schedules error:', schedulesError);
        
        // If RLS is blocking us, let's try to create some test data or check if the table is empty
        console.log('[AdminPanel] RLS might be blocking access. Checking if we can insert test data...');
        
        // Don't throw error, just continue with empty schedules
        console.log('[AdminPanel] Continuing with empty schedules due to RLS restrictions');
      }

      if (!userProfiles || userProfiles.length === 0) {
        console.log('[AdminPanel] No users found in database - setting empty states');
        setAllUsers([]);
        setProgramStatuses([]);
        return;
      }

      // Transform user profiles to the format we need
      console.log('[AdminPanel] Transforming user profiles...');
      const usersWithAuthData = userProfiles.map(profile => {
        const transformedUser = {
          id: profile.user_id,
          email: profile.email || `user-${profile.user_id.slice(0, 8)}@example.com`,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          profile_photo: profile.profile_photo || '',
          profile_photo_locked: profile.profile_photo_locked || false,
          dob: profile.dob || '',
          address: profile.address || '',
          emergency_contact: profile.emergency_contact || '',
          dob_locked: profile.dob_locked || false,
          hasPersonalTrainingCode: false, // Will be updated when we check for codes
          personalTrainingCode: undefined,
          packageType: undefined
        } as UserWithPersonalTraining;
        
        return transformedUser;
      });
      
      console.log('[AdminPanel] Transformed users count:', usersWithAuthData.length);
      setAllUsers(usersWithAuthData);
      
      // Mark data as loaded to prevent re-loading
      setDataLoaded(prev => ({ ...prev, 'personal-training': true }));
      
      // Create real program statuses from schedules data
      console.log('[AdminPanel] Creating program statuses from schedules...');
      console.log('[AdminPanel] Schedules data:', schedules);
      
      const realProgramStatuses = (schedules || [])
        .map(schedule => {
          console.log('[AdminPanel] Processing schedule:', schedule.id, 'for user:', schedule.user_id);
          const user = usersWithAuthData.find(u => u.id === schedule.user_id);
          if (!user) {
            console.warn(`[AdminPanel] User not found for schedule ${schedule.id}, user_id: ${schedule.user_id}`);
            return null;
          }
          
          const programStatus = {
            user,
            schedule: {
              id: schedule.id,
              userId: schedule.user_id,
              month: schedule.month,
              year: schedule.year,
              status: schedule.status as 'pending' | 'accepted' | 'declined',
              scheduleData: schedule.schedule_data,
              createdBy: schedule.created_by,
              createdAt: schedule.created_at,
              updatedAt: schedule.updated_at,
              acceptedAt: schedule.accepted_at,
              declinedAt: schedule.declined_at
            } as PersonalTrainingSchedule,
            status: schedule.status as 'pending' | 'accepted' | 'declined'
          };
          
          console.log('[AdminPanel] Created program status:', programStatus);
          return programStatus;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null); // Remove null entries with proper typing
      
      console.log('[AdminPanel] Final program statuses count:', realProgramStatuses.length);
      
      // If no schedules found, let's try to create some test data to verify the system works
      if (realProgramStatuses.length === 0 && usersWithAuthData.length > 0) {
        console.log('[AdminPanel] No schedules found. Creating test data to verify system...');
        
        // Check if we can create data (RLS working)
        const canCreateData = await checkIfCanCreateData();
        if (canCreateData) {
          await createTestScheduleData(usersWithAuthData[0], user?.id);
        } else {
          console.warn('[AdminPanel] Cannot create test data due to RLS restrictions.');
          console.warn('[AdminPanel] Please fix RLS policies by running: database/fix_admin_rls_policies.sql');
        }
      }
      
      setProgramStatuses(realProgramStatuses);
      
      // Check which users have personal training codes
      console.log('[AdminPanel] Checking personal training codes...');
      
      // First, let's check if there are any personal training codes at all
      const { data: codesCheck, error: codesError } = await supabase
        .from('personal_training_codes')
        .select('*')
        .limit(5);
      
      console.log('[AdminPanel] Personal training codes check - rows:', codesCheck?.length, 'error:', codesError);
      
      await checkPersonalTrainingCodes(usersWithAuthData);
      
      setDataLoaded(prev => ({ ...prev, 'personal-training': true }));
      console.log('[AdminPanel] ===== DATA LOADING COMPLETED SUCCESSFULLY =====');
      
    } catch (error) {
      console.error('[AdminPanel] ===== DATA LOADING FAILED =====');
      console.error('[AdminPanel] Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Σφάλμα κατά τη φόρτωση των χρηστών: ${errorMessage}`);
      
      // Fallback to empty arrays if database fails
      setAllUsers([]);
      setProgramStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.role]);

  // Check which users have personal training codes
  const checkPersonalTrainingCodes = async (users: UserWithPersonalTraining[]) => {
    try {
      // Query the personal_training_codes table to get real data
      // Use admin client with RLS bypass
      const { data: personalTrainingCodes, error } = await supabase
        .from('personal_training_codes')
        .select('user_id, code, package_type, sessions_remaining')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching personal training codes:', error);
        // If table doesn't exist or has RLS issues, just set users without codes
        setAllUsers(users);
        return;
      }

      const updatedUsers = users.map(user => {
        const codeData = personalTrainingCodes?.find(code => code.user_id === user.id);
        if (codeData) {
          return {
            ...user,
            hasPersonalTrainingCode: true,
            personalTrainingCode: codeData.code,
            packageType: codeData.package_type
          };
        }
        return user;
      });

      setAllUsers(updatedUsers);
    } catch (error) {
      console.error('Error checking personal training codes:', error);
    }
  };

  // Track loading states to prevent duplicate calls
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  // Load data when user changes (after login) - OPTIMIZED
  useEffect(() => {
    console.log('[AdminPanel] useEffect triggered - user:', user?.email, 'role:', user?.role, 'activeTab:', activeTab);
    
    if (!user) {
      console.log('[AdminPanel] No user logged in');
      return;
    }
    
    if (user.role !== 'admin') {
      console.warn('[AdminPanel] User is not admin! Role:', user.role, 'Email:', user.email);
      return;
    }
    
    // Prevent duplicate loading calls
    if (loadingStates[activeTab]) {
      console.log(`[AdminPanel] ${activeTab} is already loading, skipping...`);
      return;
    }
    
    // Load data based on active tab - ONLY if not already loaded
    if (activeTab === 'personal-training' && !dataLoaded['personal-training']) {
      console.log('[AdminPanel] Loading data for personal-training tab');
      setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
      loadAllUsers().finally(() => setLoadingStates(prev => ({ ...prev, [activeTab]: false })));
    } else if (activeTab === 'membership-packages' && !dataLoaded['membership-packages']) {
      console.log('[AdminPanel] Loading membership packages');
      setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
      loadMembershipPackages().finally(() => setLoadingStates(prev => ({ ...prev, [activeTab]: false })));
    } else if (activeTab === 'kettlebell-points' && !dataLoaded['kettlebell-points']) {
      console.log('[AdminPanel] Loading kettlebell points');
      setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
      loadKettlebellPointsData().finally(() => setLoadingStates(prev => ({ ...prev, [activeTab]: false })));
    } else {
      console.log(`[AdminPanel] ${activeTab} data already loaded, skipping reload`);
    }
  }, [user?.id, activeTab]); // Removed dataLoaded from dependencies to prevent infinite loops



  const loadPersonalTrainingSchedule = async (userId: string) => {
    try {
      setLoading(true);
      // Φέρνουμε το πιο πρόσφατο πραγματικό πρόγραμμα από τη βάση
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('id, user_id, month, year, schedule_data, status, created_by, created_at, updated_at, accepted_at, declined_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[ADMIN] Error loading schedule for user', userId, error);
        toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
        setPersonalTrainingSchedule(null);
        return;
      }

      if (!data || data.length === 0) {
        setPersonalTrainingSchedule(null);
        toast.error('Δεν βρέθηκε πρόγραμμα για τον συγκεκριμένο χρήστη');
        return;
      }

      const row = data[0] as any;
      const realSchedule: PersonalTrainingSchedule = {
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
      } as any;

      setPersonalTrainingSchedule(realSchedule);
    } catch (error) {
      console.error('[ADMIN] Exception while loading schedule', error);
      toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
      setPersonalTrainingSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  // Personal Training functions

  const addPersonalTrainingSession = () => {
    if (!personalTrainingSchedule) return;
    
    const newSession: PersonalTrainingSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'personal',
      trainer: 'Mike',
      room: 'Αίθουσα Mike',
      notes: ''
    };

    const updatedSchedule = {
      ...personalTrainingSchedule,
      scheduleData: {
        ...personalTrainingSchedule.scheduleData,
        sessions: [...personalTrainingSchedule.scheduleData.sessions, newSession]
      }
    };
    setPersonalTrainingSchedule(updatedSchedule);
  };

  const updatePersonalTrainingSession = (sessionId: string, field: keyof PersonalTrainingSession, value: any) => {
    if (!personalTrainingSchedule) return;

    const updatedSessions = personalTrainingSchedule.scheduleData.sessions.map(session =>
      session.id === sessionId ? { ...session, [field]: value } : session
    );

    const updatedSchedule = {
      ...personalTrainingSchedule,
      scheduleData: {
        ...personalTrainingSchedule.scheduleData,
        sessions: updatedSessions
      }
    };
    setPersonalTrainingSchedule(updatedSchedule);
  };

  const removePersonalTrainingSession = (sessionId: string) => {
    if (!personalTrainingSchedule) return;

    const updatedSessions = personalTrainingSchedule.scheduleData.sessions.filter(
      session => session.id !== sessionId
    );

    const updatedSchedule = {
      ...personalTrainingSchedule,
      scheduleData: {
        ...personalTrainingSchedule.scheduleData,
        sessions: updatedSessions
      }
    };
    setPersonalTrainingSchedule(updatedSchedule);
  };

  const savePersonalTrainingSchedule = async () => {
    if (!personalTrainingSchedule || !selectedUser) return;

    try {
      setLoading(true);
      // Save schedule locally for now
      toast.success(`Το πρόγραμμα για τον ${selectedUser.firstName} ${selectedUser.lastName} αποθηκεύτηκε!`);
      setEditingSchedule(false);
    } catch (error) {
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving program options with approval system
  const handleSaveProgramOptions = async () => {
    if (programApprovalStatus === 'none' || !user) {
      toast.error('Παρακαλώ επιλέξτε μια κατάσταση έγκρισης');
      return;
    }

    try {
      setLoading(true);
      const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
      
      if (userIds.length === 0) {
        toast.error('Δεν υπάρχουν επιλεγμένοι χρήστες');
        return;
      }

      // Validate group room selection for group training and combination
      if (trainingType === 'group') {
        if (!selectedGroupRoom || !weeklyFrequency) {
          toast.error('Παρακαλώ επιλέξτε Ομαδική Αίθουσα και συχνότητα εβδομάδας');
          return;
        }
        
        if (selectedUserIds.length === 0) {
          toast.error('Παρακαλώ επιλέξτε τουλάχιστον έναν χρήστη για το ομαδικό πρόγραμμα');
          return;
        }
      }
      
      // For combination training, also validate group room selection if group sessions are configured
      if (trainingType === 'combination' && combinationGroupSessions > 0) {
        if (!selectedGroupRoom || !weeklyFrequency) {
          toast.error('Για συνδυασμένο πρόγραμμα με ομαδικές σεσίες, παρακαλώ επιλέξτε Ομαδική Αίθουσα και συχνότητα εβδομάδας');
          return;
        }
      }
      

      // Save approval states for each user
      for (const userId of userIds) {
        // Check if user is pending and use frozen options if available
        const isPending = isUserPending(userId);
        const userOptions = isPending ? getFrozenOptions(userId) : selectedOptions[userId];
        
        if (!userOptions) continue;

        const success = await saveProgramApprovalState(
          userId,
          programApprovalStatus as 'approved' | 'rejected' | 'pending',
          {
            oldMembersUsed: userOptions.oldMembers || false,
            kettlebellPoints: userOptions.kettlebellPoints ? parseInt(userOptions.kettlebellPoints) : 0,
            cashAmount: userOptions.cashAmount || 0,
            posAmount: userOptions.posAmount || 0,
            createdBy: user.id,
            // Add group room information for group training and combination
            groupRoomSize: (trainingType === 'group' || trainingType === 'combination') ? parseInt(selectedGroupRoom!) : null,
            weeklyFrequency: (trainingType === 'group' || trainingType === 'combination') ? weeklyFrequency : null,
            monthlyTotal: (trainingType === 'group' || trainingType === 'combination') ? monthlyTotal : null,
            notes: `Program options saved with ${programApprovalStatus} status${isPending ? ' (from frozen state)' : ''}${(trainingType === 'group' || trainingType === 'combination') ? ` - Ομαδική Αίθουσα: ${selectedGroupRoom} χρήστες, ${weeklyFrequency} φορές/εβδομάδα` : ''}`
          }
        );

        if (success) {
          console.log(`Program approval state saved for user ${userId}: ${programApprovalStatus}${isPending ? ' (from frozen state)' : ''}`);
        } else {
          console.warn(`Failed to save program approval state for user ${userId}`);
        }
      }

      // Execute actions based on approval status
      if (programApprovalStatus === 'approved') {
        // Execute all the original program creation actions
        await executeApprovedProgramActions(userIds);
      } else if (programApprovalStatus === 'rejected') {
        // For rejected, just log and don't execute any actions
        console.log('Program options rejected - no actions executed');
        toast('Program Options απορρίφθηκαν - δεν εκτελέστηκαν ενέργειες', { icon: 'ℹ️' });
      } else if (programApprovalStatus === 'pending') {
        // For pending, save options locally and mark users as pending
        console.log('Program options pending - saving locally and freezing UI');
        
        // Save frozen options for each user
        const newFrozenOptions = { ...frozenOptions };
        const newPendingUsers = new Set(pendingUsers);
        
        for (const userId of userIds) {
          const userOptions = selectedOptions[userId];
          if (userOptions) {
            newFrozenOptions[userId] = {
              oldMembers: userOptions.oldMembers,
              kettlebellPoints: userOptions.kettlebellPoints,
              cash: userOptions.cash,
              pos: userOptions.pos,
              cashAmount: userOptions.cashAmount,
              posAmount: userOptions.posAmount,
              // Add group room information for group training and combination
              groupRoomSize: (trainingType === 'group' || trainingType === 'combination') ? parseInt(selectedGroupRoom!) : null,
              weeklyFrequency: (trainingType === 'group' || trainingType === 'combination') ? weeklyFrequency : null,
              monthlyTotal: (trainingType === 'group' || trainingType === 'combination') ? monthlyTotal : null
            };
            newPendingUsers.add(userId);
          }
        }
        
        setFrozenOptions(newFrozenOptions);
        setPendingUsers(newPendingUsers);
        
        toast('Program Options τοποθετήθηκαν στην αναμονή - οι επιλογές παγώθηκαν', { icon: '⏳' });
      }

      // Reset approval status and clear pending states if needed
      setProgramApprovalStatus('none');
      
      // If status changed from pending, clear pending states
      if (programApprovalStatus === 'approved' || programApprovalStatus === 'rejected') {
        const newPendingUsers = new Set(pendingUsers);
        const newFrozenOptions = { ...frozenOptions };
        
        for (const userId of userIds) {
          if (isUserPending(userId)) {
            newPendingUsers.delete(userId);
            delete newFrozenOptions[userId];
          }
        }
        
        setPendingUsers(newPendingUsers);
        setFrozenOptions(newFrozenOptions);
      }
      
      // Show success message
      const hasPendingUsers = userIds.some(id => isUserPending(id));
      const statusText = {
        approved: hasPendingUsers ? 'εγκρίθηκε και εκτελέστηκαν οι ενέργειες (από frozen state)' : 'εγκρίθηκε και εκτελέστηκαν οι ενέργειες',
        rejected: hasPendingUsers ? 'απορρίφθηκε (από frozen state)' : 'απορρίφθηκε', 
        pending: 'τοποθετήθηκε στην αναμονή'
      };
      
      toast.success(`Program Options ${statusText[programApprovalStatus]} επιτυχώς!`);
      
    } catch (error) {
      console.error('Error saving program options:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των Program Options');
    } finally {
      setLoading(false);
    }
  };

  // Execute approved program actions (original logic)
  const executeApprovedProgramActions = async (userIds: string[]) => {
    console.log('Executing approved program actions for users:', userIds);
    
    try {
      // Execute actions for each user
      for (const userId of userIds) {
        // Check if user is pending and use frozen options if available
        const isPending = isUserPending(userId);
        const userOptions = isPending ? getFrozenOptions(userId) : selectedOptions[userId];
        
        if (!userOptions) continue;

        // 1. Save Old Members usage if selected
        if (userOptions.oldMembers) {
          const oldMembersSuccess = await markOldMembersUsed(userId, user?.id || '');
          if (oldMembersSuccess) {
            console.log(`[APPROVED] Old Members marked as used for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
            // Update local state
            setUsedOldMembers(prev => new Set([...prev, userId]));
          } else {
            console.warn(`[APPROVED] Failed to mark Old Members as used for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        }

        // 2. Save Kettlebell Points if provided
        if (userOptions.kettlebellPoints && parseInt(userOptions.kettlebellPoints) > 0) {
          const kettlebellSuccess = await saveKettlebellPoints(
            userId, 
            parseInt(userOptions.kettlebellPoints), 
            undefined, // No program_id for now
            user?.id || ''
          );
          if (kettlebellSuccess) {
            console.log(`[APPROVED] Kettlebell Points saved for user: ${userId}, Points: ${userOptions.kettlebellPoints}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save Kettlebell Points for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        }

        // 3. Save Cash transactions if provided
        if (userOptions.cashAmount && userOptions.cashAmount > 0) {
          const cashSuccess = await saveCashTransaction(
            userId,
            userOptions.cashAmount,
            'cash',
            undefined,
            user?.id || '',
            'Cash transaction from approved program creation'
          );
          if (cashSuccess) {
            console.log(`[APPROVED] Cash transaction saved for user: ${userId}, Amount: €${userOptions.cashAmount}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save Cash transaction for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        }

        // 4. Save POS transactions if provided
        if (userOptions.posAmount && userOptions.posAmount > 0) {
          const posSuccess = await saveCashTransaction(
            userId,
            userOptions.posAmount,
            'pos',
            undefined,
            user?.id || '',
            'POS transaction from approved program creation'
          );
          if (posSuccess) {
            console.log(`[APPROVED] POS transaction saved for user: ${userId}, Amount: €${userOptions.posAmount}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save POS transaction for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        }
      }

      toast.success('Έγιναν όλες οι απαραίτητες ενέργειες για τα εγκεκριμένα προγράμματα!');
    } catch (error) {
      console.error('Error executing approved program actions:', error);
      toast.error('Σφάλμα κατά την εκτέλεση των ενεργειών');
    }
  };

  const createPersonalTrainingProgram = async () => {
    const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
    
    if (userIds.length === 0) {
      toast.error('Παρακαλώ επιλέξτε χρήστη/ες');
      return;
    }

    try {
      setLoading(true);
      console.log('[ADMIN] Starting to create personal training program...');
      console.log('[ADMIN] User type:', userType);

      // Δημιουργούμε το πρόγραμμα για όλους τους επιλεγμένους χρήστες
      for (const userId of userIds) {
        const selectedUser = allUsers.find(user => user.id === userId);
        
        if (!selectedUser) {
          toast.error(`Δεν βρέθηκε ο χρήστης με ID: ${userId}`);
          continue;
        }

        console.log('[ADMIN] Selected user:', selectedUser.firstName, selectedUser.lastName, 'ID:', selectedUser.id);
        console.log('[ADMIN] Admin user ID:', user?.id);

        // Δημιουργούμε το πρόγραμμα Personal Training
        // ΓΙΑ GROUP PROGRAMS: Δημιουργούμε sessions όπως για Individual (για Paspartu users)
        // ΓΙΑ COMBINATION PROGRAMS: Δημιουργούμε μόνο τις personal sessions από το Προσωποποιημένο Πρόγραμμα
        let scheduleSessions: PersonalTrainingSession[] = [];
        
        if (trainingType === 'group') {
          // Για Group Paspartu: δημιουργούμε sessions από Group Assignment Interface ή από programSessions
          if (userType === 'paspartu') {
            // Get sessions from Group Assignment Interface for this user
            const userGroupSlots = selectedGroupSlots[selectedUser.id] || [];
            if (userGroupSlots.length > 0) {
              // Use sessions from Group Assignment Interface
              scheduleSessions = userGroupSlots.map((slot, index) => ({
                id: `group-session-${index + 1}`,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                type: 'personal' as const,
                trainer: slot.trainer || 'Mike',
                room: slot.room || 'Αίθουσα Mike',
                notes: `Group Paspartu Session ${index + 1} - ${slot.notes || ''}`
              }));
            } else {
              // ✅ FIXED: Use programSessions for Group Paspartu (same as Individual)
              // This ensures that admin-created sessions are used for Group Paspartu
              scheduleSessions = programSessions.map((s) => ({
                id: s.id,
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                type: s.type,
                trainer: s.trainer || 'Mike',
                room: s.room,
                notes: s.notes + ' (Group Paspartu)'
              }));
              
              console.log(`[ADMIN] Using ${scheduleSessions.length} program sessions for Group Paspartu user: ${selectedUser.email}`);
            }
          } else {
            scheduleSessions = []; // Άδεια σεσίες για κανονικά group programs
          }
        } else if (trainingType === 'combination') {
          // Για combination, παίρνουμε μόνο τις πρώτες N σεσίες για personal training
          scheduleSessions = programSessions.slice(0, combinationPersonalSessions).map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
            trainer: s.trainer || 'Mike',
            room: s.room,
            notes: s.notes + ' (Personal - Συνδυασμός)'
          }));
        } else {
          // Individual training - όλες οι σεσίες
          scheduleSessions = programSessions.map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
            trainer: s.trainer || 'Mike',
            room: s.room,
            notes: s.notes
          }));
        }

        const schedulePayload = {
          user_id: selectedUser.id,
          trainer_name: trainingType === 'group' ? 'Mike' : (scheduleSessions[0]?.trainer || 'Mike'),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          schedule_data: {
            sessions: scheduleSessions,
            notes: trainingType === 'group' 
              ? 'Group program - Οι σεσίες θα προστεθούν μέσω του Group Assignment Interface'
              : trainingType === 'combination'
              ? `Combination program - ${combinationPersonalSessions} Personal + ${combinationGroupSessions} Group sessions`
              : '',
            trainer: trainingType === 'group' ? 'Mike' : (scheduleSessions[0]?.trainer || 'Mike'),
            specialInstructions: trainingType === 'group' 
              ? 'Ομαδικό πρόγραμμα - Οι λεπτομέρειες των σεσίων διαχειρίζονται ξεχωριστά'
              : trainingType === 'combination'
              ? `Συνδυασμένο πρόγραμμα - Περιλαμβάνει ${combinationPersonalSessions} ατομικές σεσίες και ${combinationGroupSessions} ομαδικές σεσίες`
              : '',
            // Add group room information for group training and combination
            groupRoomSize: (trainingType === 'group' || trainingType === 'combination') ? parseInt(selectedGroupRoom!) : null,
            weeklyFrequency: (trainingType === 'group' || trainingType === 'combination') ? weeklyFrequency : null,
            monthlyTotal: (trainingType === 'group' || trainingType === 'combination') ? monthlyTotal : null,
            // Add combination-specific information
            combinationPersonalSessions: trainingType === 'combination' ? combinationPersonalSessions : null,
            combinationGroupSessions: trainingType === 'combination' ? combinationGroupSessions : null
          },
          status: 'accepted',
          created_by: user?.id,
          user_type: userType, // Add user type to schedule
          is_flexible: userType === 'paspartu', // Paspartu users get flexible schedules
          training_type: trainingType, // Add training type (individual/group/combination)
          group_room_size: (trainingType === 'group' || trainingType === 'combination') ? parseInt(selectedGroupRoom!) : null,
          weekly_frequency: (trainingType === 'group' || trainingType === 'combination') ? weeklyFrequency : null,
          monthly_total: (trainingType === 'group' || trainingType === 'combination') ? monthlyTotal : null
        };

        console.log('[ADMIN] Schedule payload:', schedulePayload);
        console.log('[ADMIN] Inserting schedule into personal_training_schedules...');
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('personal_training_schedules')
          .insert(schedulePayload)
          .select()
          .single();
        
        if (scheduleError) {
          console.error('[ADMIN] Schedule insertion error:', scheduleError);
          throw scheduleError;
        }
        
        console.log('[ADMIN] Schedule inserted successfully for user:', selectedUser.email);

        // For combination training, create group_sessions for individual sessions from Προσωποποιημένο Πρόγραμμα
        if (trainingType === 'combination' && scheduleSessions.length > 0) {
          console.log('[ADMIN] Creating group_sessions for combination individual sessions...', scheduleSessions);
          
          // Convert individual sessions to group_sessions format with group_type = null
          const individualGroupSessions = scheduleSessions.map(session => ({
            session_date: session.date,
            start_time: session.startTime,
            end_time: session.endTime,
            trainer: session.trainer,
            room: session.room,
            group_type: null, // Individual sessions have no group_type (NULL in database)
            notes: session.notes + ' (Individual - Combination Program)'
          }));
          
          console.log('[ADMIN] Individual group sessions to insert:', individualGroupSessions);
          
          // Insert group_sessions directly to database for individual sessions
          const { data: groupSessionsData, error: groupSessionsError } = await supabase
            .from('group_sessions')
            .insert(
              individualGroupSessions.map(session => ({
                program_id: scheduleData.id,
                user_id: selectedUser.id,
                session_date: session.session_date,
                start_time: session.start_time,
                end_time: session.end_time,
                trainer: session.trainer,
                room: session.room,
                group_type: session.group_type, // null for individual sessions
                notes: session.notes,
                is_active: true,
                created_by: user?.id || ''
              }))
            );
          
          if (groupSessionsError) {
            console.error('[ADMIN] Error creating group_sessions for combination individual sessions:', groupSessionsError);
            console.error('[ADMIN] Error details:', {
              message: groupSessionsError.message,
              details: groupSessionsError.details,
              hint: groupSessionsError.hint,
              code: groupSessionsError.code
            });
            toast.error('Σφάλμα κατά τη δημιουργία των ατομικών σεσίων του συνδυασμού');
          } else {
            console.log('[ADMIN] Created group_sessions for combination individual sessions:', groupSessionsData);
            console.log('[ADMIN] Number of individual sessions created:', groupSessionsData?.length || 0);
          }
        } else {
          console.log('[ADMIN] Skipping individual sessions creation:', {
            trainingType,
            scheduleSessionsLength: scheduleSessions.length,
            willCreate: trainingType === 'combination' && scheduleSessions.length > 0
          });
        }

        // Save program options (Old Members and Kettlebell Points)
        const userOptions = selectedOptions[selectedUser.id];
        if (userOptions) {
          // Save Old Members usage if selected
          if (userOptions.oldMembers) {
            const oldMembersSuccess = await markOldMembersUsed(selectedUser.id, user?.id || '');
            if (oldMembersSuccess) {
              console.log('[ADMIN] Old Members marked as used for user:', selectedUser.email);
            } else {
              console.warn('[ADMIN] Failed to mark Old Members as used for user:', selectedUser.email);
            }
          }

          // Save Kettlebell Points if provided
          if (userOptions.kettlebellPoints && parseInt(userOptions.kettlebellPoints) > 0) {
            const kettlebellSuccess = await saveKettlebellPoints(
              selectedUser.id, 
              parseInt(userOptions.kettlebellPoints), 
              scheduleData.id, 
              user?.id || ''
            );
            if (kettlebellSuccess) {
              console.log('[ADMIN] Kettlebell Points saved for user:', selectedUser.email, 'Points:', userOptions.kettlebellPoints);
            } else {
              console.warn('[ADMIN] Failed to save Kettlebell Points for user:', selectedUser.email);
            }
          }
        }

        // Special logic for Paspartu users - replace old schedule and reset deposit
        if (userType === 'paspartu') {
          console.log('[ADMIN] Handling Paspartu user - replacing old schedule and managing deposits...');
          
          // First, replace any old Paspartu schedule with the new one
          const { error: replaceError } = await supabase
            .rpc('replace_paspartu_schedule', {
              p_user_id: selectedUser.id,
              p_new_schedule_id: scheduleData.id
            });

          if (replaceError) {
            console.error('[ADMIN] Error replacing old Paspartu schedule:', replaceError);
            console.warn('[ADMIN] Failed to replace old schedule, but new schedule was created successfully');
          } else {
            console.log('[ADMIN] Old Paspartu schedule replaced successfully for user:', selectedUser.email);
          }
          
          // Calculate deposit based on training type
          let totalDeposits = 5; // Paspartu users always start with 5 deposits
          let usedDeposits = 0;
          
          if (trainingType === 'combination') {
            // For combination: used_deposits = personal_sessions + group_sessions
            usedDeposits = combinationPersonalSessions + combinationGroupSessions;
            console.log(`[ADMIN] Combination Paspartu: ${combinationPersonalSessions} personal + ${combinationGroupSessions} group = ${usedDeposits} used deposits`);
          } else if (trainingType === 'individual') {
            // For individual: credit 5 lessons, no deduction (original behavior preserved)
            usedDeposits = 0;
            console.log(`[ADMIN] Individual Paspartu: Credit 5 lessons, no deduction (original behavior)`);
          } else if (trainingType === 'group') {
            // For group Paspartu: same logic as individual (credit 5 lessons, no deduction)
            usedDeposits = 0;
            console.log(`[ADMIN] Group Paspartu: Credit 5 lessons, no deduction (same as Individual)`);
          }
          
          // Ensure we don't exceed available deposits
          if (usedDeposits > totalDeposits) {
            console.warn(`[ADMIN] Warning: Used deposits (${usedDeposits}) exceeds total deposits (${totalDeposits}). Setting to max.`);
            usedDeposits = totalDeposits;
          }
          
          // Reset lesson deposit with calculated values
          const { error: depositError } = await supabase
            .rpc('reset_lesson_deposit_for_new_program', {
              p_user_id: selectedUser.id,
              p_total_lessons: totalDeposits,
              p_created_by: user?.id
            });

          if (depositError) {
            console.error('[ADMIN] Lesson deposit reset error:', depositError);
            console.warn('[ADMIN] Failed to reset lesson deposit, but schedule was created successfully');
          } else {
            console.log(`[ADMIN] Lesson deposit reset successfully for Paspartu user: ${selectedUser.email}`);
            console.log(`[ADMIN] Deposits: ${totalDeposits} total, ${usedDeposits} will be used, ${totalDeposits - usedDeposits} remaining`);
            
            // If we have used deposits, update the used count
            if (usedDeposits > 0) {
              const { error: updateError } = await supabase
                .from('lesson_deposits')
                .update({ 
                  used_lessons: usedDeposits,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', selectedUser.id);
                
              if (updateError) {
                console.error('[ADMIN] Error updating used deposits:', updateError);
              } else {
                console.log(`[ADMIN] Updated used deposits to ${usedDeposits} for user: ${selectedUser.email}`);
              }
            }
          }
        }

        // ✅ CRITICAL FIX: Ensure lesson deposit exists for ALL Paspartu users
        if (userType === 'paspartu') {
          console.log('[ADMIN] Ensuring lesson deposit exists for Paspartu user:', selectedUser.email);
          
          // Check if deposit already exists
          const { data: existingDeposit } = await supabase
            .from('lesson_deposits')
            .select('id')
            .eq('user_id', selectedUser.id)
            .single();
          
          if (!existingDeposit) {
            // Create lesson deposit if it doesn't exist
            const { error: depositError } = await supabase
              .from('lesson_deposits')
              .insert({
                user_id: selectedUser.id,
                total_lessons: 5,
                used_lessons: 0
              });
            
            if (depositError) {
              console.error('[ADMIN] Error creating lesson deposit:', depositError);
            } else {
              console.log('[ADMIN] Lesson deposit created successfully for Paspartu user:', selectedUser.email);
            }
          } else {
            console.log('[ADMIN] Lesson deposit already exists for Paspartu user:', selectedUser.email);
          }
        }

        // Δημιουργούμε αυτόματα μια ενεργή συνδρομή Personal Training
        console.log('[ADMIN] Creating Personal Training membership...');
        
        // Βρίσκουμε το Personal Training package by name
        const { data: personalPackage, error: packageError } = await supabase
          .from('membership_packages')
          .select('id')
          .eq('name', 'Personal Training')
          .eq('is_active', true)
          .single();

        if (packageError || !personalPackage) {
          console.error('[ADMIN] Error finding Personal Training package:', packageError);
          console.warn('[ADMIN] Personal Training package not found, skipping membership creation');
          // Don't throw error, just skip membership creation
          continue;
        }

        // Δημιουργούμε την ενεργή συνδρομή
        const membershipPayload = {
          user_id: selectedUser.id,
          package_id: personalPackage.id,
          duration_type: 'lesson', // Default duration type
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month from now
          is_active: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        };

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert(membershipPayload);

        if (membershipError) {
          console.error('[ADMIN] Membership insertion error:', membershipError);
          // Don't throw here, just log - the schedule is more important
          console.warn('[ADMIN] Failed to create membership, but schedule was created successfully');
        } else {
          console.log('[ADMIN] Personal Training membership created successfully for user:', selectedUser.email);
        }
      }

      const userNames = userIds.map(id => {
        const user = allUsers.find(u => u.id === id);
        return user ? `${user.firstName} ${user.lastName}` : 'Άγνωστος';
      }).join(', ');

      const userTypeText = userType === 'personal' ? 'Personal' : 'Paspartu';
      const typeText = trainingType === 'individual' ? 'Ατομικό' : trainingType === 'combination' ? 'Συνδυασμένο' : 'Ομαδικό';
      const userText = (trainingType === 'individual' || trainingType === 'combination') ? 'τον χρήστη' : 'τους χρήστες';
      toast.success(`Το πρόγραμμα ${typeText} ${userTypeText} Training δημιουργήθηκε επιτυχώς για ${userText}: ${userNames}!`);
      
      // For group training or combination training, create group sessions if slots were selected
      if ((trainingType === 'group' || trainingType === 'combination') && userIds.length > 0 && Object.keys(selectedGroupSlots).length > 0) {
        console.log('[AdminPanel] Creating group sessions for selected slots:', selectedGroupSlots);
        
        // Create group sessions for each user
        for (const userId of userIds) {
          const userSlots = selectedGroupSlots[userId];
          if (userSlots && userSlots.length > 0) {
            // Find the schedule that was just created for this user
            const { data: userSchedule } = await supabase
              .from('personal_training_schedules')
              .select('id')
              .eq('user_id', userId)
              .in('training_type', ['group', 'combination']) // Support both group and combination
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (userSchedule && userSchedule.length > 0) {
              const programId = userSchedule[0].id;
              
              // Convert sessions to group_sessions format
              const groupSessions = userSlots.map(session => ({
                session_date: session.date,
                start_time: session.startTime,
                end_time: session.endTime,
                trainer: session.trainer,
                room: session.room,
                group_type: session.groupType,
                notes: session.notes || `Group session created by admin`
              }));
              
              // Create group sessions using the new API
              const result = await createUserGroupSessions(
                userId,
                programId,
                groupSessions,
                user?.id || ''
              );
              
              if (result.success) {
                console.log(`[AdminPanel] Created ${result.createdCount} group sessions for user ${userId}`);
                
                // Show warning if some sessions were blocked
                if (result.blockedSessions && result.blockedSessions.length > 0) {
                  const blockedCount = result.blockedSessions.length;
                  const createdCount = result.createdCount || 0;
                  
                  toast.error(
                    `Δημιουργήθηκαν ${createdCount} σεσίες, αλλά ${blockedCount} σεσίες αποκλείστηκαν λόγω γεμάτου capacity. ` +
                    `Λεπτομέρειες: ${result.blockedSessions.slice(0, 2).join(', ')}${blockedCount > 2 ? '...' : ''}`
                  );
                }
              } else {
                console.error('[AdminPanel] Error creating group sessions:', result.error);
                
                // Show specific error for capacity issues
                if (result.error?.includes('capacity')) {
                  toast.error(`Δεν μπορούν να δημιουργηθούν σεσίες: ${result.error}`);
                } else {
                  toast.error(`Σφάλμα δημιουργίας σεσίων: ${result.error}`);
                }
              }
            }
          }
        }
        
        toast.success('Το ομαδικό πρόγραμμα και οι αναθέσεις δημιουργήθηκαν επιτυχώς!');
        
      } else if ((trainingType === 'group' || trainingType === 'combination') && userIds.length > 0) {
        // No slots selected, show info message
        const programType = trainingType === 'combination' ? 'συνδυασμένο' : 'ομαδικό';
        toast(`Το ${programType} πρόγραμμα δημιουργήθηκε. ${trainingType === 'combination' ? 'Μπορείτε να κάνετε ομαδικές αναθέσεις αργότερα από το Group Programs Overview.' : 'Μπορείτε να κάνετε αναθέσεις αργότερα από το Group Programs Overview.'}`, { icon: 'ℹ️' });
        
      }
      
      setShowCreateCodeModal(false);
      setNewCode({ code: '', selectedUserId: '' });
      setTrainingType('individual');
      setUserType('personal'); // Reset to default
      setSelectedUserIds([]);
      setSelectedGroupSlots({}); // Reset group slots
      setSelectedGroupRoom(null);
      setWeeklyFrequency(null);
      setMonthlyTotal(0);
      setUserSearchTerm('');
      setUserSearchMode('dropdown');
      setProgramSessions([{ id: 'tmp-1', date: new Date().toISOString().split('T')[0], startTime: '18:00', endTime: '19:00', type: 'personal', trainer: 'Mike', room: 'Αίθουσα Mike', group: '2ΑτομαGroup', notes: '' }]);
      
      // Refresh the users list
      loadAllUsers();
    } catch (error) {
      console.error('[ADMIN] Error creating personal training program:', error);
      
      // Καλύτερο error handling με συγκεκριμένα μηνύματα
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as any;
        if (supabaseError.code === '23505') {
          toast.error('Το πρόγραμμα υπάρχει ήδη για αυτόν τον χρήστη.');
        } else if (supabaseError.code === '23503') {
          toast.error('Πρόβλημα με τα δεδομένα χρήστη. Ελέγξτε ότι ο χρήστης υπάρχει.');
        } else if (supabaseError.code === 'PGRST301') {
          toast.error('Πρόβλημα αυθεντικοποίησης. Κάντε επανασύνδεση.');
        } else {
          toast.error(`Σφάλμα βάσης δεδομένων: ${supabaseError.message || 'Άγνωστο σφάλμα'}`);
        }
      } else {
        toast.error('Σφάλμα κατά τη δημιουργία του προγράμματος');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Δεν έχετε δικαίωμα πρόσβασης</h2>
          <p className="text-gray-600">Μόνο οι διαχειριστές μπορούν να έχουν πρόσβαση σε αυτή τη σελίδα.</p>
        </div>
      </div>
    );
  }

  // ===== MEMBERSHIP PACKAGES FUNCTIONS =====

  const loadMembershipPackages = useCallback(async () => {
    try {
      setLoading(true);
      const packages = await getMembershipPackages();
      
      // Filter out unwanted packages from UI
      const unwantedPackages = [
        'Personal Training',
        'Premium', 
        'Βασικό + προσωπική προπόνηση',
        'VIP',
        'Premium + όλα τα προνόμια',
        'Όλα από το premium',
        'Απεριόριστη προσωπική προπόνηση',
        'Βασικό',
        'Πρόσβαση σε όλες τις αίθουσες',
        'Όλες οι ομαδικές τάξεις'
      ];
      
      const filteredPackages = packages.filter(pkg => 
        !unwantedPackages.includes(pkg.name) && 
        !unwantedPackages.some(unwanted => pkg.description?.includes(unwanted))
      );
      
      setMembershipPackages(filteredPackages);
      setDataLoaded(prev => ({ ...prev, 'membership-packages': true }));
      
      // Load Pilates durations
      const pilatesDurations = await getPilatesPackageDurations();
      setPilatesDurations(pilatesDurations);
    } catch (error) {
      console.error('Error loading membership packages:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των πακέτων');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPackageDurations = async (packageId: string) => {
    try {
      const durations = await getMembershipPackageDurations(packageId);
      setPackageDurations(durations);
    } catch (error) {
      console.error('Error loading package durations:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των επιλογών διάρκειας');
    }
  };

  const loadMembershipRequests = async () => {
    try {
      const requests = await getMembershipRequests();
      setMembershipRequests(requests);
      // Reset to first page when loading new data
      setMembershipRequestsPage(1);
    } catch (error) {
      console.error('Error loading membership requests:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων');
    }
  };


  // Filter and paginate membership requests
  const getFilteredMembershipRequests = () => {
    const filtered = membershipRequests.filter(request => {
      // Filter by package type
      const packageMatch = request.package?.name === 'Free Gym' || request.package?.name === 'Pilates' || request.package?.name === 'Ultimate';
      
      // Filter by search term (user name)
      const searchMatch = membershipRequestsSearchTerm === '' || 
        `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.toLowerCase()
          .includes(membershipRequestsSearchTerm.toLowerCase());
      
      return packageMatch && searchMatch;
    });

    // Sort by most recent first (created_at descending)
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getPaginatedMembershipRequests = () => {
    const filtered = getFilteredMembershipRequests();
    const startIndex = (membershipRequestsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredMembershipRequests();
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setMembershipRequestsPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setMembershipRequestsPage(prev => Math.min(prev + 1, getTotalPages()));
  };

  const handleFirstPage = () => {
    setMembershipRequestsPage(1);
  };

  const handleLastPage = () => {
    setMembershipRequestsPage(getTotalPages());
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMembershipRequestsSearchTerm(e.target.value);
    setMembershipRequestsPage(1); // Reset to first page when searching
  };

  const handlePackageSelect = (pkg: MembershipPackage) => {
    setSelectedPackage(pkg);
    
    // If it's the Pilates package, load Pilates durations
    if (pkg.name === 'Pilates') {
      setPackageDurations(pilatesDurations);
    } else {
      loadPackageDurations(pkg.id);
    }
  };

  const handleEditDuration = (duration: MembershipPackageDuration) => {
    setEditingDuration(duration);
    setNewPrice(duration.price.toString());
  };

  const handleSavePrice = async () => {
    if (!editingDuration || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Παρακαλώ εισάγετε έγκυρη τιμή');
      return;
    }

    try {
      setLoading(true);
      
      // Check if this is a Pilates duration
      if (selectedPackage?.name === 'Pilates') {
        const success = await updatePilatesPackagePricing(editingDuration.duration_type, price);
        
        if (success) {
          // Update the local state
          setPackageDurations(prev => 
            prev.map(d => d.id === editingDuration.id ? { ...d, price } : d)
          );
          setPilatesDurations(prev => 
            prev.map(d => d.id === editingDuration.id ? { ...d, price } : d)
          );
          setEditingDuration(null);
          setNewPrice('');
          toast.success('Η τιμή Pilates ενημερώθηκε επιτυχώς');
        }
      } else {
        const success = await updateMembershipPackageDuration(editingDuration.id, price);
        if (success) {
          setEditingDuration(null);
          setNewPrice('');
          loadPackageDurations(selectedPackage?.id || '');
        }
      }
    } catch (error) {
      console.error('Error updating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Find the request to check if it's Ultimate package
      const request = membershipRequests.find(r => r.id === requestId);
      const isUltimatePackage = request?.package?.name === 'Ultimate';
      
      if (isUltimatePackage) {
        // Handle Ultimate package approval with dual activation
        const success = await approveUltimateMembershipRequest(requestId);
        if (success) {
          toast.success('Το Ultimate αίτημα εγκρίθηκε επιτυχώς! Δημιουργήθηκαν 2 συνδρομές: Pilates + Open Gym');
          loadMembershipRequests();
        }
      } else {
        // Handle regular package approval
        const success = await approveMembershipRequest(requestId);
        if (success) {
          toast.success('Το αίτημα εγκρίθηκε επιτυχώς!');
          loadMembershipRequests();
        }
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Σφάλμα κατά την έγκριση του αιτήματος');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Παρακαλώ εισάγετε τον λόγο απόρριψης:');
    if (!reason) return;

    try {
      setLoading(true);
      const success = await rejectMembershipRequest(requestId, reason);
      if (success) {
        toast.success('Το αίτημα απορρίφθηκε επιτυχώς!');
        loadMembershipRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Σφάλμα κατά την απόρριψη του αιτήματος');
    } finally {
      setLoading(false);
    }
  };

  // ===== MEMBERSHIP REQUEST PROGRAM OPTIONS FUNCTIONS =====

  const handleRequestOptionChange = (requestId: string, option: string, value: any) => {
    setSelectedRequestOptions(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [option]: value
      }
    }));
  };

  const handleRequestProgramApprovalChange = (requestId: string, status: 'none' | 'approved' | 'rejected' | 'pending') => {
    setRequestProgramApprovalStatus(prev => ({
      ...prev,
      [requestId]: status
    }));
  };

  const handleSaveRequestProgramOptions = async (requestId: string) => {
    const status = requestProgramApprovalStatus[requestId];
    if (status === 'none' || !user) {
      toast.error('Παρακαλώ επιλέξτε μια κατάσταση έγκρισης');
      return;
    }

    try {
      setLoading(true);
      
      const requestOptions = selectedRequestOptions[requestId];
      if (!requestOptions) {
        toast.error('Δεν υπάρχουν επιλογές για αυτό το αίτημα');
        return;
      }

      // Find the request to get user_id
      const request = membershipRequests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Αίτημα δεν βρέθηκε');
        return;
      }

      // Save approval state for the request
      const success = await saveProgramApprovalState(
        request.user_id,
        status as 'approved' | 'rejected' | 'pending',
        {
          oldMembersUsed: requestOptions.oldMembers || false,
          kettlebellPoints: requestOptions.kettlebellPoints ? parseInt(requestOptions.kettlebellPoints) : 0,
          cashAmount: requestOptions.cashAmount || 0,
          posAmount: requestOptions.posAmount || 0,
          createdBy: user.id,
          notes: `Program options saved for membership request ${requestId} with ${status} status`
        }
      );

      if (success) {
        console.log(`Program approval state saved for membership request: ${requestId}`);
        
        // Handle pending state
        if (status === 'pending') {
          const newPendingUsers = new Set(requestPendingUsers);
          const newFrozenOptions = { ...requestFrozenOptions };
          
          newPendingUsers.add(requestId);
          newFrozenOptions[requestId] = requestOptions;
          
          setRequestPendingUsers(newPendingUsers);
          setRequestFrozenOptions(newFrozenOptions);
          
          toast('Program Options τοποθετήθηκαν στην αναμονή - οι επιλογές παγώθηκαν', { icon: '⏳' });
        } else {
          // Execute actions for approved status
          if (status === 'approved') {
            await executeApprovedRequestProgramActions(requestId, request.user_id, requestOptions);
          }
          
          // Clear pending state if it was pending
          if (isRequestPending(requestId)) {
            const newPendingUsers = new Set(requestPendingUsers);
            const newFrozenOptions = { ...requestFrozenOptions };
            
            newPendingUsers.delete(requestId);
            delete newFrozenOptions[requestId];
            
            setRequestPendingUsers(newPendingUsers);
            setRequestFrozenOptions(newFrozenOptions);
          }
        }
        
        // Reset approval status
        setRequestProgramApprovalStatus(prev => ({
          ...prev,
          [requestId]: 'none'
        }));
        
        // Show success message
        const statusText = {
          approved: 'εγκρίθηκε και εκτελέστηκαν οι ενέργειες',
          rejected: 'απορρίφθηκε', 
          pending: 'τοποθετήθηκε στην αναμονή'
        };
        
        toast.success(`Program Options ${statusText[status]} επιτυχώς!`);
      } else {
        toast.error('Σφάλμα κατά την αποθήκευση των Program Options');
      }
    } catch (error) {
      console.error('Error saving request program options:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των Program Options');
    } finally {
      setLoading(false);
    }
  };

  const executeApprovedRequestProgramActions = async (requestId: string, userId: string, userOptions: any) => {
    console.log('Executing approved program actions for membership request:', requestId);
    
    try {
      // 1. Save Old Members usage if selected
      if (userOptions.oldMembers) {
        const oldMembersSuccess = await markOldMembersUsed(userId, user?.id || '');
        if (oldMembersSuccess) {
          console.log(`[APPROVED] Old Members marked as used for membership request: ${requestId}`);
        } else {
          console.warn(`[APPROVED] Failed to mark Old Members as used for membership request: ${requestId}`);
        }
      }

      // 2. Save Kettlebell Points if provided
      if (userOptions.kettlebellPoints && parseInt(userOptions.kettlebellPoints) > 0) {
        const kettlebellSuccess = await saveKettlebellPoints(
          userId, 
          parseInt(userOptions.kettlebellPoints), 
          undefined, // No program_id for now
          user?.id || ''
        );
        
        if (kettlebellSuccess) {
          console.log(`[APPROVED] Kettlebell Points saved for membership request: ${requestId}, Points: ${userOptions.kettlebellPoints}`);
        } else {
          console.warn(`[APPROVED] Failed to save Kettlebell Points for membership request: ${requestId}`);
        }
      }

      // 3. Save Cash transactions if provided
      if (userOptions.cashAmount && userOptions.cashAmount > 0) {
        const cashSuccess = await saveCashTransaction(
          userId,
          userOptions.cashAmount,
          'cash',
          undefined,
          user?.id || '',
          'Cash transaction from approved membership request'
        );
        if (cashSuccess) {
          console.log(`[APPROVED] Cash transaction saved for membership request: ${requestId}, Amount: €${userOptions.cashAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save Cash transaction for membership request: ${requestId}`);
        }
      }

      // 4. Save POS transactions if provided
      if (userOptions.posAmount && userOptions.posAmount > 0) {
        const posSuccess = await saveCashTransaction(
          userId,
          userOptions.posAmount,
          'pos',
          undefined,
          user?.id || '',
          'POS transaction from approved membership request'
        );
        if (posSuccess) {
          console.log(`[APPROVED] POS transaction saved for membership request: ${requestId}, Amount: €${userOptions.posAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save POS transaction for membership request: ${requestId}`);
        }
      }

      toast.success('Έγιναν όλες οι απαραίτητες ενέργειες για το εγκεκριμένο αίτημα!');
    } catch (error) {
      console.error('Error executing approved program actions for membership request:', error);
      toast.error('Σφάλμα κατά την εκτέλεση των ενεργειών');
    }
  };

  // ===== PILATES PACKAGE FUNCTIONS =====

  // ===== KETTLEBELL POINTS FUNCTIONS =====

  const loadKettlebellPointsData = useCallback(async () => {
    try {
      setLoading(true);
      const [totalPoints, summary] = await Promise.all([
        getTotalKettlebellPoints(),
        getKettlebellPointsSummary()
      ]);
      
      setTotalKettlebellPoints(totalPoints);
      setKettlebellSummary(summary);
      setDataLoaded(prev => ({ ...prev, 'kettlebell-points': true }));
    } catch (error) {
      console.error('Error loading kettlebell points data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των Kettlebell Points');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserKettlebellPoints = async (userId: string) => {
    try {
      const userPoints = await getUserKettlebellPoints(userId);
      const totalUserPoints = userPoints.reduce((sum, point) => sum + point.points, 0);
      setKettlebellPoints(totalUserPoints.toString());
    } catch (error) {
      console.error('Error loading user kettlebell points:', error);
      setKettlebellPoints('');
    }
  };

  // Search kettlebell users
  const searchKettlebellUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setKettlebellSearchResults([]);
      return;
    }

    const filtered = kettlebellSummary.filter(user => 
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setKettlebellSearchResults(filtered);
  };

  // Handle search input change
  const handleKettlebellSearchChange = (value: string) => {
    setKettlebellSearchTerm(value);
    searchKettlebellUsers(value);
  };

  // Load data when membership-packages tab is selected
  useEffect(() => {
    if (activeTab === 'membership-packages') {
      loadMembershipPackages();
      loadMembershipRequests();
    }
  }, [activeTab]);

  // Load data when kettlebell-points tab is selected
  useEffect(() => {
    if (activeTab === 'kettlebell-points') {
      loadKettlebellPointsData();
    }
  }, [activeTab]);

  // Load old members usage when component mounts
  useEffect(() => {
    const loadOldMembersUsage = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_old_members_usage')
          .select('user_id');

        if (error) {
          console.error('Error loading old members usage:', error);
          return;
        }

        const usedOldMembersSet = new Set(data?.map(record => record.user_id) || []);
        setUsedOldMembers(usedOldMembersSet);
      } catch (error) {
        console.error('Exception loading old members usage:', error);
      }
    };

    loadOldMembersUsage();
  }, [user]);

  // ===== ULTIMATE SUBSCRIPTIONS FUNCTIONS =====

  const loadUltimateRequests = async () => {
    try {
      setUltimateLoading(true);
      
      const requests = await withDatabaseRetry(
        () => getMembershipRequests(),
        'φόρτωση Ultimate αιτημάτων'
      );
      
      // Filter all Ultimate requests (with and without installments)
      const ultimateRequests = requests.filter((request: MembershipRequest) => 
        request.package?.name === 'Ultimate'
      );
      
      // Handle large datasets
      if (ultimateRequests.length > LARGE_DATASET_THRESHOLD) {
        console.log(`[AdminPanel] Large Ultimate dataset detected: ${ultimateRequests.length} items`);
        toast(`Φορτώθηκαν ${ultimateRequests.length} Ultimate αιτήματα. Χρησιμοποιείται σελιδοποίηση.`, { icon: '👑' });
      }
      
      setUltimateRequests(ultimateRequests);
      setDataLoaded(prev => ({ ...prev, 'ultimate-subscriptions': true }));
    } catch (error) {
      handleDatabaseError(error, 'φόρτωση Ultimate αιτημάτων');
    } finally {
      setUltimateLoading(false);
    }
  };

  const deleteUltimateRequest = async (requestId: string) => {
    try {
      await withDatabaseRetry(
        async () => {
          const { error } = await supabase
            .from('membership_requests')
            .delete()
            .eq('id', requestId);

          if (error) throw error;
          return true;
        },
        'διαγραφή Ultimate αιτήματος'
      );

      toast.success('Το Ultimate αίτημα διαγράφηκε επιτυχώς');
      await loadUltimateRequests();
    } catch (error) {
      handleDatabaseError(error, 'διαγραφή Ultimate αιτήματος');
    }
  };

  const handleUltimateApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Find the request to check if it's Ultimate package
      const request = ultimateRequests.find(r => r.id === requestId);
      const isUltimatePackage = request?.package?.name === 'Ultimate';
      
      if (isUltimatePackage) {
        // Handle Ultimate package approval with dual activation
        await withDatabaseRetry(
          async () => {
            const { approveUltimateMembershipRequest } = await import('@/utils/membershipApi');
            const success = await approveUltimateMembershipRequest(requestId);
            if (!success) throw new Error('Approval failed');
            return success;
          },
          'έγκριση Ultimate αιτήματος'
        );
        
        toast.success('Το Ultimate αίτημα εγκρίθηκε επιτυχώς! Δημιουργήθηκαν 2 συνδρομές: Pilates + Open Gym');
        loadUltimateRequests();
      }
    } catch (error) {
      handleDatabaseError(error, 'έγκριση Ultimate αιτήματος');
    } finally {
      setLoading(false);
    }
  };

  const handleUltimateRejectRequest = async (requestId: string) => {
    const reason = prompt('Παρακαλώ εισάγετε τον λόγο απόρριψης:');
    if (!reason) return;

    try {
      setLoading(true);
      
      await withDatabaseRetry(
        async () => {
          const success = await rejectMembershipRequest(requestId, reason);
          if (!success) throw new Error('Rejection failed');
          return success;
        },
        'απόρριψη Ultimate αιτήματος'
      );
      
      toast.success('Το Ultimate αίτημα απορρίφθηκε επιτυχώς!');
      loadUltimateRequests();
    } catch (error) {
      handleDatabaseError(error, 'απόρριψη Ultimate αιτήματος');
    } finally {
      setLoading(false);
    }
  };

  const updateInstallmentAmounts = async (requestId: string, installment1Amount: number, installment2Amount: number, installment3Amount: number, installment1PaymentMethod: string, installment2PaymentMethod: string, installment3PaymentMethod: string, installment1DueDate?: string, installment2DueDate?: string, installment3DueDate?: string) => {
    try {
      const updateData: any = {
        installment_1_amount: installment1Amount,
        installment_2_amount: installment2Amount,
        installment_3_amount: installment3Amount,
        installment_1_payment_method: installment1PaymentMethod,
        installment_2_payment_method: installment2PaymentMethod,
        installment_3_payment_method: installment3PaymentMethod
      };

      // Add due dates if provided
      if (installment1DueDate) updateData.installment_1_due_date = installment1DueDate;
      if (installment2DueDate) updateData.installment_2_due_date = installment2DueDate;
      if (installment3DueDate) updateData.installment_3_due_date = installment3DueDate;

      await withDatabaseRetry(
        async () => {
          const { error } = await supabase
            .from('membership_requests')
            .update(updateData)
            .eq('id', requestId);

          if (error) throw error;
          return true;
        },
        'ενημέρωση δόσεων'
      );

      toast.success('Οι δόσεις και ημερομηνίες ενημερώθηκαν επιτυχώς');
      // Reload ultimate requests
      await loadUltimateRequests();
    } catch (error) {
      handleDatabaseError(error, 'ενημέρωση δόσεων');
    }
  };

  // Load ultimate requests when tab is active
  useEffect(() => {
    if (activeTab === 'ultimate-subscriptions' && !dataLoaded['ultimate-subscriptions']) {
      console.log('[AdminPanel] Loading Ultimate Subscriptions data...');
      loadUltimateRequests();
    }
  }, [activeTab]);

  // Additional effect to ensure data is loaded for ultimate subscriptions
  useEffect(() => {
    if (activeTab === 'ultimate-subscriptions' && ultimateRequests.length === 0 && !ultimateLoading) {
      console.log('[AdminPanel] Ultimate Subscriptions tab active but no data, reloading...');
      loadUltimateRequests();
    }
  }, [activeTab, ultimateRequests.length, ultimateLoading]);

  // ===== LARGE DATASET HANDLING UTILITIES =====

  const paginateData = (data: any[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const handleLargeDataset = async (loadFunction: () => Promise<any[]>, setDataFunction: (data: any[]) => void, datasetName: string) => {
    try {
      setIsLoadingLargeDataset(true);
      console.log(`[AdminPanel] Loading ${datasetName} dataset...`);
      
      const data = await loadFunction();
      
      if (data.length > LARGE_DATASET_THRESHOLD) {
        console.log(`[AdminPanel] Large dataset detected (${data.length} items), implementing pagination`);
        toast(`Φορτώθηκαν ${data.length} εγγραφές. Χρησιμοποιείται σελιδοποίηση για βελτίωση επιδόσεων.`, { icon: '📄' });
        
        // Reset to first page for large datasets
        setLargeDatasetPage(1);
      }
      
      setDataFunction(data);
      return data;
    } catch (error) {
      console.error(`[AdminPanel] Error loading ${datasetName}:`, error);
      toast.error(`Σφάλμα κατά τη φόρτωση ${datasetName}`);
      throw error;
    } finally {
      setIsLoadingLargeDataset(false);
    }
  };

  const getDatasetTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / ITEMS_PER_PAGE);
  };

  // ===== DATABASE RETRY LOGIC & ERROR HANDLING =====

  const withDatabaseRetry = async (
    operation: () => Promise<any>, 
    context: string = 'operation',
    maxRetries: number = 3
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`[AdminPanel] Database ${context} failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          const errorMessage = `Σφάλμα σύνδεσης με τη βάση δεδομένων κατά ${context}. Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.`;
          toast.error(errorMessage);
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 3s
        const delay = 1000 * attempt;
        console.log(`[AdminPanel] Retrying ${context} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`Failed to complete ${context} after ${maxRetries} attempts`);
  };

  const handleDatabaseError = (error: any, context: string) => {
    console.error(`[AdminPanel] Database error in ${context}:`, error);
    
    if (error.message?.includes('network') || error.message?.includes('connection')) {
      toast.error('Πρόβλημα σύνδεσης δικτύου. Παρακαλώ ελέγξτε τη σύνδεσή σας.');
    } else if (error.message?.includes('timeout')) {
      toast.error('Η λειτουργία διήρκησε πολύ. Παρακαλώ δοκιμάστε ξανά.');
    } else {
      toast.error(`Παρουσιάστηκε σφάλμα κατά ${context}. Παρακαλώ δοκιμάστε ξανά.`);
    }
  };

  // Load Kettlebell Points when selected user changes
  useEffect(() => {
    if (newCode.selectedUserId) {
      loadUserKettlebellPoints(newCode.selectedUserId);
    }
  }, [newCode.selectedUserId]);

  return (
    <div className="space-y-6">
      {/* Mobile-First Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl shadow-xl p-4 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-2">🏋️‍♂️ Διαχείριση Γυμναστηρίου</h1>
            <p className="text-blue-100 text-sm sm:text-lg">Καλώς ήρθες, <span className="font-semibold">{user.firstName}</span>!</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm self-start sm:self-auto">
            <Users className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      {/* Mobile-First Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto space-x-2 sm:space-x-8 px-3 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-3 font-semibold text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</span>
            </div>
          )}

          {/* Personal Training Tab */}
          {activeTab === 'personal-training' && !loading && (
            <div className="space-y-6">
              {/* Mobile-First Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold mb-2">💪 Personal Training Πρόγραμμα</h2>
                    <p className="text-purple-100 text-sm sm:text-base">Διαχείριση προγραμμάτων προπόνησης</p>
                  </div>
                  <button
                    onClick={() => setShowCreateCodeModal(true)}
                    className="flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg text-sm sm:text-base"
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>🏋️‍♂️ Δημιουργία Προγράμματος</span>
                  </button>
                </div>
              </div>


              {/* Mobile-First Schedule Editor */}
              {selectedUser && personalTrainingSchedule && !isBlockedTestUser({ email: selectedUser.email, personalTrainingCode: selectedUser.personalTrainingCode }) && (
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl shadow-xl p-4 sm:p-8" id="schedule-editor">
                  <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 rounded-xl shadow-lg flex-1 sm:flex-none">
                      <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                        🏋️‍♂️ Πρόγραμμα για {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-blue-100 text-sm sm:text-lg">
                        📅 {days[personalTrainingSchedule.month - 1]} {personalTrainingSchedule.year}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0">
                      {!editingSchedule ? (
                        <button
                          onClick={() => setEditingSchedule(true)}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Επεξεργασία</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={addPersonalTrainingSession}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Προσθήκη Σεσίας</span>
                            <span className="sm:hidden">Προσθήκη</span>
                          </button>
                          <button
                            onClick={savePersonalTrainingSchedule}
                            className="flex items-center space-x-1 px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors text-sm"
                          >
                            <Save className="h-4 w-4" />
                            <span>Αποθήκευση</span>
                          </button>
                          <button
                            onClick={() => setEditingSchedule(false)}
                            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <span>Ακύρωση</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile-First Schedule Sessions */}
                  <div className="space-y-3 sm:space-y-4">
                    {personalTrainingSchedule.scheduleData.sessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                          <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ημέρα</label>
                            {editingSchedule ? (
                              <input
                                type="date"
                                value={session.date}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'date', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                              />
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900">
                                {new Date(session.date).toLocaleDateString('el-GR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ώρα Έναρξης</label>
                            {editingSchedule ? (
                              <select
                                value={session.startTime}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'startTime', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                              >
                                {timeSlots.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900">{session.startTime}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ώρα Λήξης</label>
                            {editingSchedule ? (
                              <select
                                value={session.endTime}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'endTime', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                              >
                                {timeSlots.map((time) => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900">{session.endTime}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Τύπος</label>
                            {editingSchedule ? (
                              <select
                                value={session.type}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'type', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                              >
                                <option value="personal">Personal Training</option>
                                <option value="kickboxing">Kick Boxing</option>
                                <option value="combo">Combo</option>
                              </select>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900 capitalize">{session.type}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Προπονητής</label>
                            {editingSchedule ? (
                              <select
                                value={session.trainer}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'trainer', e.target.value as TrainerName)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                              >
                                {AVAILABLE_TRAINERS.map(trainer => (
                                  <option key={trainer} value={trainer}>{trainer}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900">{session.trainer}</p>
                            )}
                          </div>
                          <div className="flex items-end sm:col-span-2 lg:col-span-1">
                            {editingSchedule && (
                              <button
                                onClick={() => removePersonalTrainingSession(session.id)}
                                className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm w-full sm:w-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Διαγραφή</span>
                              </button>
                            )}
                          </div>
                        </div>
                        {session.notes && (
                          <div className="mt-3">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
                            {editingSchedule ? (
                              <input
                                type="text"
                                value={session.notes}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'notes', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                                placeholder="Σημειώσεις για τη σέσια"
                              />
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900">{session.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mobile-First General Notes */}
                  <div className="mt-4 sm:mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Γενικές Σημειώσεις</label>
                    {editingSchedule ? (
                      <textarea
                        value={personalTrainingSchedule.scheduleData.notes || ''}
                        onChange={(e) => {
                          const updatedSchedule = {
                            ...personalTrainingSchedule,
                            scheduleData: {
                              ...personalTrainingSchedule.scheduleData,
                              notes: e.target.value
                            }
                          };
                          setPersonalTrainingSchedule(updatedSchedule);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Γενικές σημειώσεις για το πρόγραμμα..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{personalTrainingSchedule.scheduleData.notes || 'Δεν υπάρχουν σημειώσεις'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Group Training Calendar Section - ΜΟΝΟ στην καρτέλα Personal Training */}
              {groupCalendarEnabled && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg border-2 border-green-200">
                  <div className="p-4 sm:p-6">
                    <GroupTrainingCalendar featureEnabled={groupCalendarEnabled} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Membership Packages Tab */}
          {activeTab === 'membership-packages' && !loading && (
            <div className="space-y-6">
              {/* Packages List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Διαχείριση Πακέτων Συνδρομών</h3>
                  <p className="text-gray-600 mt-1">Ενημερώστε τις τιμές για κάθε πακέτο και διάρκεια</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {membershipPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                          selectedPackage?.id === pkg.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {pkg.name === 'Pilates' ? (
                              <span className="text-2xl">🧘</span>
                            ) : (
                              <Award className="h-6 w-6 text-blue-500" />
                            )}
                            <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                          </div>
                          <Settings className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                        {pkg.features && (
                          <ul className="space-y-1">
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="text-xs text-gray-500 flex items-center">
                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Durations */}
              {selectedPackage && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                      Τιμές για {selectedPackage.name}
                    </h3>
                    <p className="text-gray-600 mt-1">Ενημερώστε τις τιμές για κάθε διάρκεια</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packageDurations.map((duration) => (
                        <div key={duration.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {getDurationLabel(duration.duration_type)}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {duration.duration_days} ημέρες
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleEditDuration(duration)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {editingDuration?.id === duration.id ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Νέα τιμή"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                              <button
                                onClick={handleSavePrice}
                                disabled={loading}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDuration(null);
                                  setNewPrice('');
                                }}
                                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {formatPrice(duration.price)}
                              </div>
                              <div className="text-sm text-gray-600">EUR</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Membership Requests */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Enhanced Header with Gradient */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Αιτήματα Συνδρομών</h3>
                        <p className="text-slate-200 mt-1">Διαχειριστείτε τα αιτήματα συνδρομών από χρήστες</p>
                      </div>
                </div>
                
                    {/* Enhanced Search Input */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Αναζήτηση με όνομα χρήστη..."
                        value={membershipRequestsSearchTerm}
                        onChange={handleSearchChange}
                        className="pl-12 pr-6 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full lg:w-80 text-white placeholder-slate-300 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Alert with Better UI */}
                <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Οδηγίες Διαχείρισης Αιτημάτων
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Search Instructions */}
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Search className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-800 mb-1">Αναζήτηση & Πλοήγηση</h5>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                Χρησιμοποιήστε το πεδίο αναζήτησης για να βρείτε γρήγορα αιτήματα με όνομα χρήστη. 
                                Η λίστα εμφανίζεται σε <span className="font-semibold text-blue-700">6άδες</span> - ελέγξτε την επόμενη σελίδα αν δεν βρείτε το επιθυμητό αίτημα.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Payment Instructions */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <DollarSign className="h-3 w-3 text-amber-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-amber-800 mb-1 flex items-center">
                                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                                Σημαντική Προσοχή - Διαδικασία Πληρωμής
                              </h5>
                              <p className="text-sm text-amber-700 leading-relaxed">
                                <span className="font-semibold">ΠΡΩΤΑ</span> αποθηκεύουμε τα χρήματα στο σύστημα (Cash Register) και 
                                <span className="font-semibold"> ΕΠΕΙΤΑ</span> επιλέγουμε για το αίτημα του χρήστη εάν εγκρίνεται ή απορρίπτεται.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  {getFilteredMembershipRequests().length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {membershipRequestsSearchTerm 
                          ? `Δεν βρέθηκαν αποτελέσματα`
                          : 'Δεν υπάρχουν αιτήματα'
                        }
                      </h3>
                      <p className="text-gray-500">
                        {membershipRequestsSearchTerm 
                          ? `Για την αναζήτηση "${membershipRequestsSearchTerm}"`
                          : 'Δεν έχουν υποβληθεί αιτήματα συνδρομών ακόμα'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Enhanced Results count and pagination info */}
                      <div className="bg-slate-50 rounded-xl p-6 mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                              <p className="text-sm font-medium text-slate-700">
                                Εμφάνιση {((membershipRequestsPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(membershipRequestsPage * ITEMS_PER_PAGE, getFilteredMembershipRequests().length)} από {getFilteredMembershipRequests().length} αιτήματα
                              </p>
                              <p className="text-xs text-slate-500">Οργανωμένα σε 6άδες για εύκολη πλοήγηση</p>
                            </div>
                          </div>
                          
                          {/* Enhanced Pagination Controls */}
                          <div className="flex items-center space-x-2">
                            {/* First page button */}
                            {getTotalPages() > 3 && (
                              <button
                                onClick={handleFirstPage}
                                disabled={membershipRequestsPage === 1}
                                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                title="Πρώτη σελίδα"
                              >
                                ««
                              </button>
                            )}
                            
                            <button
                              onClick={handlePreviousPage}
                              disabled={membershipRequestsPage === 1}
                              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
                            >
                              <span>←</span>
                              <span>Προηγούμενο</span>
                            </button>
                            
                            <div className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg min-w-[120px] text-center">
                              {membershipRequestsPage} / {getTotalPages()}
                            </div>
                            
                            <button
                              onClick={handleNextPage}
                              disabled={membershipRequestsPage >= getTotalPages()}
                              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
                            >
                              <span>Επόμενο</span>
                              <span>→</span>
                            </button>
                            
                            {/* Last page button */}
                            {getTotalPages() > 3 && (
                              <button
                                onClick={handleLastPage}
                                disabled={membershipRequestsPage >= getTotalPages()}
                                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                title="Τελευταία σελίδα"
                              >
                                »»
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Requests List */}
                      <div className="space-y-6">
                        {getPaginatedMembershipRequests().map((request) => (
                        <div key={request.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                          {/* Main Request Card */}
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                              {/* User Information */}
                              <div className="flex items-start space-x-4">
                                <div className="relative">
                                  {request.user?.profile_photo ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                      <img 
                                        src={request.user.profile_photo} 
                                        alt={`${request.user?.first_name} ${request.user?.last_name}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to icon if image fails to load
                                          e.currentTarget.style.display = 'none';
                                          const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallbackElement) {
                                            fallbackElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center hidden">
                                        <User className="h-6 w-6 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                      <User className="h-6 w-6 text-white" />
                                    </div>
                                  )}
                                  {request.status === 'pending' && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                                  {request.user?.first_name} {request.user?.last_name}
                                </h4>
                                  <p className="text-sm text-slate-600 mb-2 flex items-center">
                                    <span className="w-2 h-2 bg-slate-300 rounded-full mr-2"></span>
                                    {request.user?.email}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {request.package?.name}
                                    </span>
                                    <span className="text-sm text-slate-500">•</span>
                                    <span className="text-sm text-slate-600">{getDurationLabel(request.duration_type)}</span>
                                  </div>
                              </div>
                            </div>
                            
                              {/* Price and Date */}
                              <div className="flex items-center space-x-6">
                              <div className="text-right">
                                  <div className="text-2xl font-bold text-slate-900 mb-1">
                                  {formatPrice(request.requested_price)}
                                </div>
                                  <div className="text-sm text-slate-500 flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(request.created_at).toLocaleDateString('el-GR')}
                                </div>
                              </div>
                              
                                {/* Status and Actions */}
                                <div className="flex flex-col items-end space-y-3">
                              {request.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id)}
                                    disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Εγκρίνω</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.id)}
                                    disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span>Απορρίπτω</span>
                                  </button>
                                </div>
                              )}
                              
                              {request.status === 'approved' && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                  Εγκεκριμένο
                                </span>
                                    </div>
                              )}
                              
                              {request.status === 'rejected' && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                  Απορριφθέν
                                </span>
                                    </div>
                              )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Program Options Section */}
                          {((request.status === 'pending') || 
                            (request.status === 'approved' && isRequestPending(request.id)) || 
                            (request.status === 'rejected' && isRequestPending(request.id))) && (
                          <div className={`border-t border-slate-200 ${isRequestPending(request.id) ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : 'bg-slate-50'}`}>
                            <div className="p-6">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`p-2 rounded-lg ${isRequestPending(request.id) ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                                  <Settings className={`h-5 w-5 ${isRequestPending(request.id) ? 'text-yellow-600' : 'text-slate-600'}`} />
                                </div>
                                <h5 className={`text-lg font-semibold ${isRequestPending(request.id) ? 'text-yellow-800' : 'text-slate-700'} flex items-center`}>
                              Program Options
                                  {isRequestPending(request.id) && (
                                    <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                                      Κλειδωμένο
                                    </span>
                                  )}
                            </h5>
                              </div>
                            
                            {/* Program Options Section */}
                            <div className="space-y-4">
                              {/* Old Members and Kettlebell Points */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Old Members - Hide for Pilates package */}
                                {request.package?.name !== 'Pilates' && (
                                <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                                  <button
                                    onClick={() => {
                                      if (isRequestPending(request.id)) {
                                        toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                        return;
                                      }
                                      handleRequestOptionChange(request.id, 'oldMembers', !selectedRequestOptions[request.id]?.oldMembers);
                                    }}
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                                      selectedRequestOptions[request.id]?.oldMembers || getRequestFrozenOptions(request.id)?.oldMembers
                                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                        : isRequestPending(request.id)
                                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        {isRequestPending(request.id) && '🔒 '}👴 Παλαιά μέλη
                                      </span>
                                      {(selectedRequestOptions[request.id]?.oldMembers || getRequestFrozenOptions(request.id)?.oldMembers) && (
                                        <span className="text-green-600">✓</span>
                                      )}
                                    </div>
                                  </button>
                                </div>
                                )}

                                {/* Kettlebell Points - Hide for Pilates package */}
                                {request.package?.name !== 'Pilates' && (
                                <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {isRequestPending(request.id) && '🔒 '}🏋️ Kettlebell Points
                                  </label>
                                  <input
                                    type="number"
                                    value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.kettlebellPoints || '' : selectedRequestOptions[request.id]?.kettlebellPoints || ''}
                                    onChange={(e) => {
                                      if (isRequestPending(request.id)) return;
                                      handleRequestOptionChange(request.id, 'kettlebellPoints', e.target.value);
                                    }}
                                    placeholder="Εισάγετε πόντους"
                                    className={`w-full p-2 border rounded-lg ${
                                      isRequestPending(request.id)
                                        ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    disabled={isRequestPending(request.id)}
                                  />
                                </div>
                                )}
                              </div>

                              {/* Payment Section - Separated from other options */}
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200">
                                <div className="flex items-center space-x-2 mb-4">
                                  <span className="text-2xl">💳</span>
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {isRequestPending(request.id) && '🔒 '}SECTION ΠΛΗΡΩΜΩΝ
                                  </h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Cash Payment */}
                                  <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                                    <button
                                      onClick={() => {
                                        if (isRequestPending(request.id)) {
                                          toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                          return;
                                        }
                                        handleRequestOptionChange(request.id, 'cash', !selectedRequestOptions[request.id]?.cash);
                                      }}
                                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                                        selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash
                                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                          : isRequestPending(request.id)
                                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                          : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                          {isRequestPending(request.id) && '🔒 '}💰 Μετρητά
                                        </span>
                                        {(selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash) && (
                                          <span className="text-green-600">✓</span>
                                        )}
                                      </div>
                                    </button>
                                    
                                    {(selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash) && (
                                      <div className="mt-2">
                                        <input
                                          type="number"
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.cashAmount || '' : selectedRequestOptions[request.id]?.cashAmount || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'cashAmount', parseFloat(e.target.value) || 0);
                                          }}
                                          placeholder="Ποσό σε €"
                                          className={`w-full p-2 border rounded-lg ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        />
                                        <button
                                          onClick={() => {
                                            if (isRequestPending(request.id)) return;
                                            // Handle cash selection
                                          }}
                                          className={`mt-2 w-full px-3 py-1 text-sm rounded-lg ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                                              : 'bg-green-600 text-white hover:bg-green-700'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        >
                                          ✓ Επιλογή
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* POS Payment */}
                                  <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                                    <button
                                      onClick={() => {
                                        if (isRequestPending(request.id)) {
                                          toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                          return;
                                        }
                                        handleRequestOptionChange(request.id, 'pos', !selectedRequestOptions[request.id]?.pos);
                                      }}
                                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                                        selectedRequestOptions[request.id]?.pos || getRequestFrozenOptions(request.id)?.pos
                                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                          : isRequestPending(request.id)
                                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                          : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                          {isRequestPending(request.id) && '🔒 '}💳 POS
                                        </span>
                                        {(selectedRequestOptions[request.id]?.pos || getRequestFrozenOptions(request.id)?.pos) && (
                                          <span className="text-blue-600">✓</span>
                                        )}
                                      </div>
                                    </button>
                                    
                                    {(selectedRequestOptions[request.id]?.pos || getRequestFrozenOptions(request.id)?.pos) && (
                                      <div className="mt-2">
                                        <input
                                          type="number"
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.posAmount || '' : selectedRequestOptions[request.id]?.posAmount || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'posAmount', parseFloat(e.target.value) || 0);
                                          }}
                                          placeholder="Ποσό σε €"
                                          className={`w-full p-2 border rounded-lg ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        />
                                        <button
                                          onClick={() => {
                                            if (isRequestPending(request.id)) return;
                                            // Handle POS selection
                                          }}
                                          className={`mt-2 w-full px-3 py-1 text-sm rounded-lg ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                                              : 'bg-blue-600 text-white hover:bg-blue-700'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        >
                                          ✓ Επιλογή
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Installments Management - Only for Ultimate package with installments */}
                              {request.package?.name === 'Ultimate' && request.has_installments && (
                              <div className={`col-span-2 p-4 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-orange-50 border-orange-200'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <span className="text-2xl">💳</span>
                                  <h4 className="text-lg font-semibold text-orange-800">
                                    {isRequestPending(request.id) && '🔒 '}Διαχείριση Δόσεων Ultimate
                                  </h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* 1η Δόση */}
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      1η Δόση
                                    </label>
                                    <div className="space-y-2">
                                      <input
                                        type="number"
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1Amount || '' : selectedRequestOptions[request.id]?.installment1Amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment1Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment1PaymentMethod || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment1PaymentMethod', e.target.value);
                                        }}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      >
                                        <option value="cash">💰 Μετρητά</option>
                                        <option value="pos">💳 POS</option>
                                      </select>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          📅 Ημερομηνία Πληρωμής
                                        </label>
                                        <input
                                          type="date"
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1DueDate || '' : selectedRequestOptions[request.id]?.installment1DueDate || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment1DueDate', e.target.value);
                                          }}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2η Δόση */}
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      2η Δόση
                                    </label>
                                    <div className="space-y-2">
                                      <input
                                        type="number"
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2Amount || '' : selectedRequestOptions[request.id]?.installment2Amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment2Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment2PaymentMethod || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment2PaymentMethod', e.target.value);
                                        }}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      >
                                        <option value="cash">💰 Μετρητά</option>
                                        <option value="pos">💳 POS</option>
                                      </select>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          📅 Ημερομηνία Πληρωμής
                                        </label>
                                        <input
                                          type="date"
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2DueDate || '' : selectedRequestOptions[request.id]?.installment2DueDate || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment2DueDate', e.target.value);
                                          }}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3η Δόση */}
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      3η Δόση
                                    </label>
                                    <div className="space-y-2">
                                      <input
                                        type="number"
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3Amount || '' : selectedRequestOptions[request.id]?.installment3Amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment3Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment3PaymentMethod || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment3PaymentMethod', e.target.value);
                                        }}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                        disabled={isRequestPending(request.id)}
                                      >
                                        <option value="cash">💰 Μετρητά</option>
                                        <option value="pos">💳 POS</option>
                                      </select>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          📅 Ημερομηνία Πληρωμής
                                        </label>
                                        <input
                                          type="date"
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3DueDate || '' : selectedRequestOptions[request.id]?.installment3DueDate || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment3DueDate', e.target.value);
                                          }}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                          disabled={isRequestPending(request.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Total Display */}
                                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-orange-800">Σύνολο Δόσεων:</span>
                                    <span className="text-lg font-bold text-orange-900">
                                      {formatPrice(
                                        (Number(selectedRequestOptions[request.id]?.installment1Amount || 0) || 
                                         Number(getRequestFrozenOptions(request.id)?.installment1Amount || 0)) +
                                        (Number(selectedRequestOptions[request.id]?.installment2Amount || 0) || 
                                         Number(getRequestFrozenOptions(request.id)?.installment2Amount || 0)) +
                                        (Number(selectedRequestOptions[request.id]?.installment3Amount || 0) || 
                                         Number(getRequestFrozenOptions(request.id)?.installment3Amount || 0))
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-sm text-orange-700 mt-1">
                                    Από {formatPrice(request.requested_price)} (Πακέτο Ultimate)
                                  </div>
                                </div>
                              </div>
                              )}

                            </div>

                            {/* Approval Buttons */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleRequestProgramApprovalChange(request.id, 'approved')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'approved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                ✅ Έγκριση
                              </button>
                              <button
                                onClick={() => handleRequestProgramApprovalChange(request.id, 'rejected')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                ❌ Απόρριψη
                              </button>
                              <button
                                onClick={() => handleRequestProgramApprovalChange(request.id, 'pending')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                }`}
                              >
                                ⏳ Αναμονή
                              </button>
                              <button
                                onClick={() => handleSaveRequestProgramOptions(request.id)}
                                disabled={loading || requestProgramApprovalStatus[request.id] === 'none'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Αποθήκευση Program Options
                              </button>
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                      ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Installments Tab */}

          {/* Pilates Schedule Tab */}
          {activeTab === 'pilates-schedule' && !loading && (
            <PilatesScheduleManagement />
          )}


          {/* Cash Register Tab */}
          {activeTab === 'cash-register' && !loading && (
            <CashRegister />
          )}

          {/* Kettlebell Points Tab */}
          {activeTab === 'kettlebell-points' && !loading && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold mb-2">🏋️‍♂️ Kettlebell Points Ranking</h2>
                    <p className="text-orange-100 text-sm sm:text-base">Συνολικοί βαθμοί και κατάταξη χρηστών</p>
                  </div>
                  <button
                    onClick={loadKettlebellPointsData}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg text-sm"
                  >
                    <Award className="h-4 w-4" />
                    <span>🔄 Ανανέωση</span>
                  </button>
                </div>
              </div>

              {/* Total Points Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">📊 Συνολικοί Βαθμοί</h3>
                    <p className="text-blue-600">Όλοι οι χρήστες συνολικά</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-900">{totalKettlebellPoints}</div>
                    <div className="text-sm text-blue-600">βαθμοί</div>
                  </div>
                </div>
              </div>

              {/* User Rankings */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">🏆 Κατάταξη Χρηστών</h3>
                      <p className="text-gray-600 mt-1">Βαθμοί Kettlebell ανά χρήστη</p>
                    </div>
                    
                    {/* Search Input */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Αναζήτηση χρήστη..."
                          value={kettlebellSearchTerm}
                          onChange={(e) => handleKettlebellSearchChange(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      </div>
                      {kettlebellSearchTerm && (
                        <button
                          onClick={() => handleKettlebellSearchChange('')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {kettlebellSummary.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Δεν υπάρχουν βαθμοί Kettlebell ακόμα</p>
                      <p className="text-sm mt-2">Οι βαθμοί θα εμφανιστούν εδώ όταν δημιουργηθούν προγράμματα με Kettlebell Points</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Show search results if searching, otherwise show top 10 */}
                      {(kettlebellSearchTerm ? kettlebellSearchResults : kettlebellSummary.slice(0, 10)).map((user, index) => (
                        <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Rank Badge */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-500' : 
                                'bg-blue-500'
                              }`}>
                                {kettlebellSearchTerm ? 
                                  kettlebellSummary.findIndex(u => u.user_id === user.user_id) + 1 : 
                                  index + 1
                                }
                              </div>
                              
                              {/* User Info */}
                              <div>
                                <h4 className="font-semibold text-gray-900">{user.user_name}</h4>
                                <p className="text-sm text-gray-600">{user.user_email}</p>
                                <p className="text-xs text-gray-500">
                                  {user.points_count} {user.points_count === 1 ? 'πρόγραμμα' : 'προγράμματα'} • 
                                  Τελευταία ενημέρωση: {new Date(user.last_updated).toLocaleDateString('el-GR')}
                                </p>
                              </div>
                            </div>
                            
                            {/* Points */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{user.total_points}</div>
                              <div className="text-sm text-gray-600">βαθμοί</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show message if no search results */}
                      {kettlebellSearchTerm && kettlebellSearchResults.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Δεν βρέθηκαν χρήστες με αυτό το όνομα</p>
                          <p className="text-sm mt-2">Δοκιμάστε ένα διαφορετικό όρο αναζήτησης</p>
                        </div>
                      )}
                      
                      {/* Show "Show more" if there are more than 10 users and not searching */}
                      {!kettlebellSearchTerm && kettlebellSummary.length > 10 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">
                            Εμφανίζονται οι πρώτοι 10 από {kettlebellSummary.length} χρήστες
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Other tabs placeholder */}
          {activeTab !== 'personal-training' && activeTab !== 'membership-packages' && activeTab !== 'ultimate-subscriptions' && activeTab !== 'pilates-schedule' && activeTab !== 'kettlebell-points' && activeTab !== 'cash-register' && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>Αυτή η κατηγορία θα υλοποιηθεί σύντομα.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-First Create Code Modal */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Mobile-First Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl sm:rounded-t-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">🏋️‍♂️ Δημιουργία Προγράμματος</h3>
                  <p className="text-purple-100 text-sm sm:text-base">Δημιουργήστε νέο πρόγραμμα Personal Training</p>
                </div>
                <button
                  onClick={() => setShowCreateCodeModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 flex-shrink-0 ml-2"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-8">
              <div className="space-y-6 sm:space-y-8">
               {/* Mobile-First Training Type Selection */}
               <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-200">
                 <label className="block text-base sm:text-lg font-bold text-indigo-800 mb-3 sm:mb-4 flex items-center">
                   🏋️‍♂️ Τύπος Προπόνησης
                 </label>
                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                   <button
                     type="button"
                     onClick={() => setTrainingType('individual')}
                     className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                       trainingType === 'individual' 
                         ? 'bg-indigo-600 text-white shadow-lg' 
                         : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400'
                     }`}
                   >
                     👤 Ατομικό
                   </button>
                   <button
                     type="button"
                     onClick={() => setTrainingType('group')}
                     className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                       trainingType === 'group' 
                         ? 'bg-indigo-600 text-white shadow-lg' 
                         : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400'
                     }`}
                   >
                     👥 Group
                   </button>
                   <button
                     type="button"
                     onClick={() => setTrainingType('combination')}
                     className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                       trainingType === 'combination' 
                         ? 'bg-indigo-600 text-white shadow-lg' 
                         : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400'
                     }`}
                   >
                     🔀 Συνδυασμός
                   </button>
                 </div>
               </div>

               {/* Mobile-First User Type Selection */}
               <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                 <label className="block text-base sm:text-lg font-bold text-blue-800 mb-3 sm:mb-4 flex items-center">
                   👥 Τύπος Χρήστη
                 </label>
                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                   <button
                     type="button"
                     onClick={() => setUserType('personal')}
                     className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                       userType === 'personal' 
                         ? 'bg-blue-600 text-white shadow-lg' 
                         : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
                     }`}
                   >
                     🏋️‍♂️ Personal User
                   </button>
                   {trainingType !== 'combination' && (
                     <button
                       type="button"
                       onClick={() => setUserType('paspartu')}
                       className={`px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                         userType === 'paspartu' 
                           ? 'bg-blue-600 text-white shadow-lg' 
                           : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
                       }`}
                     >
                       🎯 Paspartu User
                     </button>
                   )}
                 </div>
                 <div className="mt-3 text-sm text-blue-700">
                   {trainingType === 'combination' ? (
                     <span>📋 Combination Training: Μόνο Personal Users - κλειδωμένο πρόγραμμα με συγκεκριμένες ώρες</span>
                   ) : userType === 'personal' ? (
                     <span>📋 Personal Users: Παίρνουν κλειδωμένο πρόγραμμα με συγκεκριμένες ώρες</span>
                   ) : (
                     <span>💳 Paspartu Users: Παίρνουν 5 μαθήματα και επιλέγουν ελεύθερα τις ώρες</span>
                   )}
                 </div>
               </div>

               {/* Combination Configuration - Only show for combination type */}
               {trainingType === 'combination' && (
                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
                   <label className="block text-base sm:text-lg font-bold text-purple-800 mb-3 sm:mb-4 flex items-center">
                     🔀 Διαμόρφωση Συνδυασμού
                   </label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-white rounded-lg p-4 border border-purple-200">
                       <label className="block text-sm font-bold text-purple-700 mb-2">
                         👤 Ατομικές Σεσίες
                       </label>
                       <select
                         value={combinationPersonalSessions}
                         onChange={(e) => setCombinationPersonalSessions(parseInt(e.target.value))}
                         className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                       >
                         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                           <option key={num} value={num}>{num} σεσίες</option>
                         ))}
                       </select>
                     </div>
                     <div className="bg-white rounded-lg p-4 border border-purple-200">
                       <label className="block text-sm font-bold text-purple-700 mb-2">
                         👥 Ομαδικές Σεσίες
                       </label>
                       <select
                         value={combinationGroupSessions}
                         onChange={(e) => setCombinationGroupSessions(parseInt(e.target.value))}
                         className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                       >
                         {[1, 2, 3, 4, 5].map(num => (
                           <option key={num} value={num}>{num} {num === 1 ? 'φορά' : 'φορές'}/εβδομάδα</option>
                         ))}
                       </select>
                     </div>
                   </div>
                   <div className="mt-3 text-sm text-purple-700 bg-purple-100 p-3 rounded-lg">
                     <strong>📊 Σύνολο:</strong> {combinationPersonalSessions} ατομικές σεσίες + {combinationGroupSessions} {combinationGroupSessions === 1 ? 'φορά' : 'φορές'}/εβδομάδα ομαδικές
                   </div>
                 </div>
               )}

               {/* Enhanced User Selection */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                 <label className="block text-lg font-bold text-blue-800 mb-4 flex items-center">
                   👤 {trainingType === 'individual' ? 'Επιλογή Χρήστη' : trainingType === 'combination' ? 'Επιλογή Χρήστη (Συνδυασμός)' : 'Επιλογή Χρηστών (Group)'}
                   {(trainingType === 'individual' || trainingType === 'combination') && (
                     <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                       Selected: {newCode.selectedUserId ? '✅' : '❌'}
                     </span>
                   )}
                 </label>
                
                {/* Enhanced Mode Selection */}
                <div className="flex space-x-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setUserSearchMode('dropdown')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      userSearchMode === 'dropdown' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    📋 Dropdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserSearchMode('search')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      userSearchMode === 'search' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    🔍 Αναζήτηση
                  </button>
                </div>

                                 {/* Enhanced User Selection based on mode */}
                 {userSearchMode === 'dropdown' ? (
                   (trainingType === 'individual' || trainingType === 'combination') ? (
                     <select
                       className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                       value={newCode.selectedUserId}
                       onChange={(e) => {
                         console.log('[AdminPanel] User selected:', e.target.value);
                         setNewCode({ ...newCode, selectedUserId: e.target.value });
                       }}
                     >
                       <option value="">-- Επιλέξτε χρήστη --</option>
                       {allUsers.length > 0 ? (
                         allUsers.map((user) => (
                           <option key={user.id} value={user.id}>
                             {user.firstName} {user.lastName} ({user.email})
                           </option>
                         ))
                       ) : (
                         <option value="" disabled>Δεν υπάρχουν χρήστες</option>
                       )}
                     </select>
                   ) : (
                     <div className="max-h-48 overflow-y-auto border-2 border-blue-200 rounded-xl bg-white">
                       {paginatedUsers.length > 0 ? (
                         paginatedUsers.map((user) => (
                           <div
                             key={user.id}
                             className={`p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-all duration-200 ${
                               selectedUserIds.includes(user.id) ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                             }`}
                             onClick={() => {
                               if (selectedUserIds.includes(user.id)) {
                                 setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                               } else {
                                 setSelectedUserIds(prev => [...prev, user.id]);
                               }
                             }}
                           >
                             <div className="flex items-center">
                               <input
                                 type="checkbox"
                                 checked={selectedUserIds.includes(user.id)}
                                 onChange={() => {}}
                                 className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                               />
                               <div>
                                 <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                                 <div className="text-sm text-gray-600">{user.email}</div>
                               </div>
                             </div>
                           </div>
                         ))
                       ) : (
                         <div className="p-4 text-gray-500 text-sm text-center">Δεν υπάρχουν χρήστες</div>
                       )}
                     </div>
                   )
                 ) : (
                   <div className="space-y-3">
                     <input
                       type="text"
                       className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                       placeholder="🔍 Αναζήτηση με όνομα ή email..."
                       value={userSearchTerm}
                       onChange={(e) => setUserSearchTerm(e.target.value)}
                     />
                     {userSearchTerm && (
                       <div className="max-h-48 overflow-y-auto border-2 border-blue-200 rounded-xl bg-white shadow-lg">
                         {filteredUsers.length > 0 ? (
                           filteredUsers.map((user) => (
                             <div
                               key={user.id}
                               className={`p-4 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-all duration-200 ${
                                 (trainingType === 'individual' || trainingType === 'combination')
                                   ? (newCode.selectedUserId === user.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : '')
                                   : (selectedUserIds.includes(user.id) ? 'bg-blue-100 border-l-4 border-l-blue-500' : '')
                               }`}
                               onClick={() => {
                                 if (trainingType === 'individual' || trainingType === 'combination') {
                                   setNewCode({ ...newCode, selectedUserId: user.id });
                                 } else {
                                   if (selectedUserIds.includes(user.id)) {
                                     setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                                   } else {
                                     setSelectedUserIds(prev => [...prev, user.id]);
                                   }
                                 }
                               }}
                             >
                               {trainingType === 'group' && (
                                 <input
                                   type="checkbox"
                                   checked={selectedUserIds.includes(user.id)}
                                   onChange={() => {}}
                                   className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                 />
                               )}
                               <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                               <div className="text-sm text-gray-600">{user.email}</div>
                             </div>
                           ))
                         ) : (
                           <div className="p-4 text-gray-500 text-sm text-center">Δεν βρέθηκαν χρήστες</div>
                         )}
                       </div>
                     )}
                   </div>
                 )}
                
                                 {/* Enhanced Selected User Display */}
                 {((trainingType === 'individual' || trainingType === 'combination') ? newCode.selectedUserId : selectedUserIds.length > 0) && (
                   <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                     <div className="flex items-center">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                         <span className="text-white text-sm">✓</span>
                       </div>
                       <div>
                         <div className="text-sm font-bold text-green-800">
                           ✅ {(trainingType === 'individual' || trainingType === 'combination') ? 'Επιλεγμένος:' : 'Επιλεγμένοι:'}
                         </div>
                         {(trainingType === 'individual' || trainingType === 'combination') ? (
                           <div className="text-xs text-green-600">
                             {allUsers.find(u => u.id === newCode.selectedUserId)?.firstName} {allUsers.find(u => u.id === newCode.selectedUserId)?.lastName} ({allUsers.find(u => u.id === newCode.selectedUserId)?.email})
                           </div>
                         ) : (
                           <div className="text-xs text-green-600">
                             {selectedUserIds.map(id => {
                               const user = allUsers.find(u => u.id === id);
                               return user ? `${user.firstName} ${user.lastName}` : 'Άγνωστος';
                             }).join(', ')} ({selectedUserIds.length} χρήστες)
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
              </div>

              {/* Group Room Options - For Group Training and Combination */}
              {((trainingType === 'group' && selectedUserIds.length > 0) || (trainingType === 'combination' && newCode.selectedUserId)) && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 border border-orange-200 mt-4">
                  <h4 className="text-lg sm:text-xl font-bold text-orange-800 mb-4 sm:mb-6 flex items-center">
                    🏠 {trainingType === 'combination' ? 'Επιλογές Ομαδικής Αίθουσας (για Group Sessions)' : 'Επιλογές Ομαδικής Αίθουσας'}
                  </h4>
                  
                  <div className="space-y-6">
                    {/* Info about per-session group room selection */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-purple-600">💡</div>
                        <div className="text-sm text-purple-700">
                          <strong>Νέα Λειτουργία:</strong> Θα επιλέξετε το Group Size (2, 3, ή 6 άτομα) για κάθε σεσία ξεχωριστά στη Διαχείριση Ομαδικών Αναθέσεων
                        </div>
                      </div>
                    </div>
                    
                    {/* Weekly Frequency Selection */}
                    <div>
                      <div>
                        <label className="block text-base font-semibold text-orange-700 mb-3">
                          Πόσες φορές την εβδομάδα θα παρακολουθούν οι χρήστες;
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((freq) => (
                            <button
                              key={freq}
                              type="button"
                              onClick={() => setWeeklyFrequency(freq as 1 | 2 | 3 | 4 | 5)}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                weeklyFrequency === freq
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                                  : 'bg-white text-orange-600 border-orange-300 hover:border-orange-500'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-xl font-bold">{freq}</div>
                                <div className="text-xs opacity-75">
                                  {freq === 1 ? 'φορά' : 'φορές'}/εβδομάδα
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Monthly Total Display */}
                    {selectedGroupRoom && weeklyFrequency && (
                      <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-orange-700 mb-1">Μηνιαίο Σύνολο</div>
                          <div className="text-2xl font-bold text-orange-800">
                            {monthlyTotal} συνεδρίες/μήνα
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            ({weeklyFrequency} φορές/εβδομάδα × 4 εβδομάδες)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group Assignment Interface - For Group Training and Combination */}
                    {selectedGroupRoom && weeklyFrequency && (
                      <GroupAssignmentInterface 
                        selectedGroupRoom={selectedGroupRoom}
                        weeklyFrequency={weeklyFrequency}
                        monthlyTotal={monthlyTotal}
                        selectedUserIds={trainingType === 'combination' ? [newCode.selectedUserId] : selectedUserIds}
                        onSlotsChange={setSelectedGroupSlots}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* New Options Panel */}
              {((trainingType === 'individual' || trainingType === 'combination') ? newCode.selectedUserId : selectedUserIds.length > 0) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200 mt-4">
                  <h4 className="text-lg sm:text-xl font-bold text-purple-800 mb-4 sm:mb-6 flex items-center">
                    ⚙️ Επιλογές Προγράμματος
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Παλαιά μέλη - Μόνο αν δεν έχει χρησιμοποιηθεί */}
                    {!(((trainingType === 'individual' || trainingType === 'combination')
                      ? usedOldMembers.has(newCode.selectedUserId)
                      : selectedUserIds.some(id => usedOldMembers.has(id)))) && (
                      <div className={`rounded-lg p-4 border ${
                        ((trainingType === 'individual' || trainingType === 'combination')
                          ? isUserPending(newCode.selectedUserId)
                          : selectedUserIds.some(id => isUserPending(id)))
                          ? 'bg-yellow-100 border-yellow-300' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => {
                            const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                            
                            // Check if any user is pending
                            const hasPendingUser = userIds.some(id => isUserPending(id));
                            if (hasPendingUser) {
                              toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                              return;
                            }
                            
                            setSelectedOptions(prev => {
                              const newOptions = { ...prev };
                              userIds.forEach(id => {
                                newOptions[id] = {
                                  ...newOptions[id],
                                  oldMembers: !newOptions[id]?.oldMembers
                                };
                              });
                              return newOptions;
                            });
                          }}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 relative shadow-lg ${
                            ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? (getFrozenOptions(newCode.selectedUserId)?.oldMembers 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-blue-500 text-white')
                                  : (selectedOptions[newCode.selectedUserId]?.oldMembers
                                      ? 'bg-green-500 text-white hover:bg-green-600' 
                                      : 'bg-blue-500 text-white hover:bg-blue-600'))
                              : (selectedUserIds.some(id => selectedOptions[id]?.oldMembers)
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600')
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <span>👴 Παλαιά μέλη</span>
                            {(((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? getFrozenOptions(newCode.selectedUserId)?.oldMembers
                                  : selectedOptions[newCode.selectedUserId]?.oldMembers)
                              : selectedUserIds.some(id => selectedOptions[id]?.oldMembers)) && (
                              <span className="text-green-200">✓</span>
                            )}
                            {(trainingType === 'individual' 
                              ? isUserPending(newCode.selectedUserId)
                              : selectedUserIds.some(id => isUserPending(id))) && (
                              <span className="text-yellow-600">🔒</span>
                            )}
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Kettlebell Points */}
                    <div className={`rounded-lg p-4 border ${
                      ((trainingType === 'individual' || trainingType === 'combination')
                        ? isUserPending(newCode.selectedUserId)
                        : selectedUserIds.some(id => isUserPending(id)))
                        ? 'bg-yellow-100 border-yellow-300' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏋️‍♂️ Kettlebell Points
                        {((trainingType === 'individual' || trainingType === 'combination')
                          ? isUserPending(newCode.selectedUserId)
                          : selectedUserIds.some(id => isUserPending(id))) && (
                          <span className="text-yellow-600 ml-2">🔒</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                          ? (isUserPending(newCode.selectedUserId) 
                              ? (getFrozenOptions(newCode.selectedUserId)?.kettlebellPoints || '')
                              : kettlebellPoints)
                          : kettlebellPoints}
                        onChange={(e) => {
                          const userIds = trainingType === 'individual' ? [newCode.selectedUserId] : selectedUserIds;
                          
                          // Check if any user is pending
                          const hasPendingUser = userIds.some(id => isUserPending(id));
                          if (hasPendingUser) {
                            toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                            return;
                          }
                          
                          setKettlebellPoints(e.target.value);
                          setSelectedOptions(prev => {
                            const newOptions = { ...prev };
                            userIds.forEach(id => {
                              newOptions[id] = {
                                ...newOptions[id],
                                kettlebellPoints: e.target.value
                              };
                            });
                            return newOptions;
                          });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          (trainingType === 'individual' 
                            ? isUserPending(newCode.selectedUserId)
                            : selectedUserIds.some(id => isUserPending(id)))
                            ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500'
                            : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                        }`}
                        placeholder="Εισάγετε αριθμό..."
                        disabled={((trainingType === 'individual' || trainingType === 'combination') 
                          ? isUserPending(newCode.selectedUserId)
                          : selectedUserIds.some(id => isUserPending(id)))}
                      />
                    </div>

                    {/* Μετρητά */}
                    <div className={`rounded-lg p-4 border ${
                      ((trainingType === 'individual' || trainingType === 'combination')
                        ? isUserPending(newCode.selectedUserId)
                        : selectedUserIds.some(id => isUserPending(id)))
                        ? 'bg-yellow-100 border-yellow-300' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💰 Μετρητά (€)
                        {((trainingType === 'individual' || trainingType === 'combination')
                          ? isUserPending(newCode.selectedUserId)
                          : selectedUserIds.some(id => isUserPending(id))) && (
                          <span className="text-yellow-600 ml-2">🔒</span>
                        )}
                      </label>
                      {!showCashInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                            
                            // Check if any user is pending
                            const hasPendingUser = userIds.some(id => isUserPending(id));
                            if (hasPendingUser) {
                              toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                              return;
                            }
                            
                            setShowCashInput(true);
                          }}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                            ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? (getFrozenOptions(newCode.selectedUserId)?.cash 
                                      ? 'bg-green-500 text-white cursor-not-allowed'
                                      : 'bg-yellow-500 text-white cursor-not-allowed')
                                  : 'bg-green-500 text-white hover:bg-green-600')
                              : (selectedUserIds.some(id => isUserPending(id))
                                  ? 'bg-yellow-500 text-white cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600')
                          }`}
                          disabled={((trainingType === 'individual' || trainingType === 'combination') 
                            ? isUserPending(newCode.selectedUserId)
                            : selectedUserIds.some(id => isUserPending(id)))}
                        >
                          💰 Μετρητά
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? (getFrozenOptions(newCode.selectedUserId)?.cashAmount?.toString() || '')
                                  : cashAmount)
                              : cashAmount}
                            onChange={(e) => {
                              const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                              
                              // Check if any user is pending
                              const hasPendingUser = userIds.some(id => isUserPending(id));
                              if (hasPendingUser) {
                                toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                return;
                              }
                              
                              setCashAmount(e.target.value);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              (trainingType === 'individual' 
                                ? isUserPending(newCode.selectedUserId)
                                : selectedUserIds.some(id => isUserPending(id)))
                                ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                            placeholder="Εισάγετε ποσό σε €..."
                            autoFocus
                            disabled={((trainingType === 'individual' || trainingType === 'combination') 
                              ? isUserPending(newCode.selectedUserId)
                              : selectedUserIds.some(id => isUserPending(id)))}
                          />
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                                
                                // Check if any user is pending
                                const hasPendingUser = userIds.some(id => isUserPending(id));
                                if (hasPendingUser) {
                                  toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                  return;
                                }
                                
                                if (cashAmount && parseFloat(cashAmount) > 0) {
                                  // Update selected options only
                                  setSelectedOptions(prev => {
                                    const newOptions = { ...prev };
                                    userIds.forEach(id => {
                                      newOptions[id] = {
                                        ...newOptions[id],
                                        cash: true,
                                        cashAmount: parseFloat(cashAmount)
                                      };
                                    });
                                    return newOptions;
                                  });
                                  
                                  toast.success(`Μετρητά €${cashAmount} προστέθηκαν! Θα αποθηκευτούν με το Save.`);
                                }
                                setShowCashInput(false);
                                setCashAmount('');
                              }}
                              className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm ${
                                ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                                  ? (isUserPending(newCode.selectedUserId) 
                                      ? (getFrozenOptions(newCode.selectedUserId)?.cash 
                                          ? 'bg-green-600 cursor-not-allowed'
                                          : 'bg-yellow-500 cursor-not-allowed')
                                      : 'bg-green-600 hover:bg-green-700')
                                  : (selectedUserIds.some(id => isUserPending(id))
                                      ? 'bg-yellow-500 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700')
                              }`}
                              disabled={((trainingType === 'individual' || trainingType === 'combination') 
                                ? isUserPending(newCode.selectedUserId)
                                : selectedUserIds.some(id => isUserPending(id)))}
                            >
                              ✓ Επιλογή
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCashInput(false);
                                setCashAmount('');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              Ακύρωση
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* POS */}
                    <div className={`rounded-lg p-4 border ${
                      ((trainingType === 'individual' || trainingType === 'combination')
                        ? isUserPending(newCode.selectedUserId)
                        : selectedUserIds.some(id => isUserPending(id)))
                        ? 'bg-yellow-100 border-yellow-300' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💳 POS (€)
                        {((trainingType === 'individual' || trainingType === 'combination')
                          ? isUserPending(newCode.selectedUserId)
                          : selectedUserIds.some(id => isUserPending(id))) && (
                          <span className="text-yellow-600 ml-2">🔒</span>
                        )}
                      </label>
                      {!showPosInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                            
                            // Check if any user is pending
                            const hasPendingUser = userIds.some(id => isUserPending(id));
                            if (hasPendingUser) {
                              toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                              return;
                            }
                            
                            setShowPosInput(true);
                          }}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                            ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? (getFrozenOptions(newCode.selectedUserId)?.pos 
                                      ? 'bg-blue-500 text-white cursor-not-allowed'
                                      : 'bg-yellow-500 text-white cursor-not-allowed')
                                  : 'bg-blue-500 text-white hover:bg-blue-600')
                              : (selectedUserIds.some(id => isUserPending(id))
                                  ? 'bg-yellow-500 text-white cursor-not-allowed'
                                  : 'bg-blue-500 text-white hover:bg-blue-600')
                          }`}
                          disabled={((trainingType === 'individual' || trainingType === 'combination') 
                            ? isUserPending(newCode.selectedUserId)
                            : selectedUserIds.some(id => isUserPending(id)))}
                        >
                          💳 POS
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                              ? (isUserPending(newCode.selectedUserId) 
                                  ? (getFrozenOptions(newCode.selectedUserId)?.posAmount?.toString() || '')
                                  : posAmount)
                              : posAmount}
                            onChange={(e) => {
                              const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                              
                              // Check if any user is pending
                              const hasPendingUser = userIds.some(id => isUserPending(id));
                              if (hasPendingUser) {
                                toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                return;
                              }
                              
                              setPosAmount(e.target.value);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              (trainingType === 'individual' 
                                ? isUserPending(newCode.selectedUserId)
                                : selectedUserIds.some(id => isUserPending(id)))
                                ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="Εισάγετε ποσό σε €..."
                            autoFocus
                            disabled={((trainingType === 'individual' || trainingType === 'combination') 
                              ? isUserPending(newCode.selectedUserId)
                              : selectedUserIds.some(id => isUserPending(id)))}
                          />
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                                
                                // Check if any user is pending
                                const hasPendingUser = userIds.some(id => isUserPending(id));
                                if (hasPendingUser) {
                                  toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                  return;
                                }
                                
                                if (posAmount && parseFloat(posAmount) > 0) {
                                  // Update selected options only
                                  setSelectedOptions(prev => {
                                    const newOptions = { ...prev };
                                    userIds.forEach(id => {
                                      newOptions[id] = {
                                        ...newOptions[id],
                                        pos: true,
                                        posAmount: parseFloat(posAmount)
                                      };
                                    });
                                    return newOptions;
                                  });
                                  
                                  toast.success(`POS €${posAmount} προστέθηκε! Θα αποθηκευτεί με το Save.`);
                                }
                                setShowPosInput(false);
                                setPosAmount('');
                              }}
                              className={`flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm ${
                                ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                                  ? (isUserPending(newCode.selectedUserId) 
                                      ? (getFrozenOptions(newCode.selectedUserId)?.pos 
                                          ? 'bg-blue-600 cursor-not-allowed'
                                          : 'bg-yellow-500 cursor-not-allowed')
                                      : 'bg-blue-600 hover:bg-blue-700')
                                  : (selectedUserIds.some(id => isUserPending(id))
                                      ? 'bg-yellow-500 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700')
                              }`}
                              disabled={((trainingType === 'individual' || trainingType === 'combination') 
                                ? isUserPending(newCode.selectedUserId)
                                : selectedUserIds.some(id => isUserPending(id)))}
                            >
                              ✓ Επιλογή
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPosInput(false);
                                setPosAmount('');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              Ακύρωση
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Έγκριση */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setProgramApprovalStatus('approved');
                        }}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          programApprovalStatus === 'approved'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                        }`}
                      >
                        ✅ Έγκριση
                      </button>
                    </div>

                    {/* Απόρριψη */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setProgramApprovalStatus('rejected');
                        }}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          programApprovalStatus === 'rejected'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                        }`}
                      >
                        ❌ Απόρριψη
                      </button>
                    </div>

                    {/* Στην Αναμονή */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setProgramApprovalStatus('pending');
                        }}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          programApprovalStatus === 'pending'
                            ? 'bg-yellow-600 text-white shadow-lg'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg'
                        }`}
                      >
                        ⏳ Στην Αναμονή
                      </button>
                    </div>

                    {/* Save Program Options Button */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                      <button
                        type="button"
                        onClick={handleSaveProgramOptions}
                        disabled={programApprovalStatus === 'none' || loading}
                        className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                          programApprovalStatus === 'none' || loading
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Αποθήκευση...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Save className="h-5 w-5" />
                            <span>💾 Αποθήκευση Program Options</span>
                          </div>
                        )}
                      </button>
                      {programApprovalStatus === 'none' && (
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          Επιλέξτε Έγκριση, Απόρριψη ή Στην Αναμονή για να αποθηκεύσετε
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            
              {/* Excel-Style Προσωποποιημένο Πρόγραμμα - HIDE WHEN GROUP IS SELECTED */}
              {trainingType !== 'group' && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 sm:p-6 border border-orange-200">
                 <div className="flex items-center justify-between mb-4 sm:mb-6">
                   <h4 className="text-lg sm:text-xl font-bold text-orange-800 flex items-center">
                   🏋️‍♂️ Προσωποποιημένο Πρόγραμμα 
                   {trainingType === 'combination' && (
                     <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                       Personal Sessions
                     </span>
                   )}
                 </h4>
                   <div className={`text-sm px-3 py-2 rounded-lg ${
                     trainingType === 'combination' && programSessions.length > combinationPersonalSessions
                       ? 'bg-red-100 text-red-700 border border-red-300'
                       : 'text-gray-600 bg-gray-100'
                   }`}>
                     📊 Σύνολο: {programSessions.length} σεσίας
                     {trainingType === 'combination' && (
                       <span className={`ml-2 ${
                         programSessions.length > combinationPersonalSessions ? 'text-red-600' : 'text-purple-600'
                       }`}>
                         ({combinationPersonalSessions} θα χρησιμοποιηθούν)
                         {programSessions.length > combinationPersonalSessions && (
                           <span className="ml-1 font-bold">⚠️ Περισσότερες από όσες θα χρησιμοποιηθούν!</span>
                         )}
                       </span>
                     )}
                   </div>
                 </div>

                 {/* Excel-Style Table */}
                 <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
                   {/* Table Header */}
                   <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-400">
                     <div className={`grid gap-0 text-sm font-bold text-gray-800 ${trainingType === 'individual' ? 'grid-cols-7' : 'grid-cols-8'}`}>
                       <div className="col-span-1 text-center py-3 border-r border-gray-300 bg-gray-200">#</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">📅 Ημερομηνία</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">🕐 Έναρξη</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">🕕 Λήξη</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">💪 Τύπος</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">🏠 Αίθουσα</div>
                       {trainingType !== 'individual' && (
                         <div className="col-span-1 py-3 px-2 border-r border-gray-300">👥 Group</div>
                       )}
                       <div className="col-span-1 py-3 px-2">👨‍🏫 Προπονητής</div>
                           </div>
                         </div>

                   {/* Table Body */}
                   <div className="divide-y divide-gray-300">
                     {programSessions.map((session, idx) => (
                       <div key={session.id} className={`grid gap-0 hover:bg-blue-50 transition-colors ${trainingType === 'individual' ? 'grid-cols-7' : 'grid-cols-8'}`}>
                         {/* Row Number & Actions */}
                         <div className="col-span-1 flex items-center justify-center space-x-2 py-3 border-r border-gray-300 bg-gray-50">
                           <span className="text-sm font-bold text-gray-700">{idx + 1}</span>
                           <div className="flex flex-col space-y-1">
                           <button
                             onClick={() => setProgramSessions(prev => prev.filter((_, i) => i !== idx))}
                               className="text-red-600 hover:text-red-800 p-1 text-xs bg-red-100 rounded hover:bg-red-200"
                               title="Διαγραφή Σέσιας"
                           >
                               <Trash2 className="h-3 w-3" />
                           </button>
                             <button
                               onClick={() => setProgramSessions(prev => {
                                 const newSession = { ...session, id: `tmp-${Date.now()}` };
                                 return [...prev.slice(0, idx + 1), newSession, ...prev.slice(idx + 1)];
                               })}
                               className="text-blue-600 hover:text-blue-800 p-1 text-xs bg-blue-100 rounded hover:bg-blue-200"
                               title="Αντιγραφή Σέσιας"
                             >
                               <Plus className="h-3 w-3" />
                             </button>
                           </div>
                       </div>

                         {/* Date */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <input 
                             type="date" 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.date}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, date: e.target.value } : ps))}
                           />
                         </div>

                         {/* Start Time */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <input 
                             type="time" 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.startTime}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, startTime: e.target.value } : ps))}
                           />
                         </div>

                         {/* End Time */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <input 
                             type="time" 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.endTime}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, endTime: e.target.value } : ps))}
                           />
                         </div>

                         {/* Training Type */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <select 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.type}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, type: e.target.value as any } : ps))}
                           >
                             <option value="personal">Προσωπική</option>
                             <option value="kickboxing">Kick Boxing</option>
                             <option value="combo">Combo</option>
                           </select>
                         </div>

                         {/* Room */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <select 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.room}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, room: e.target.value } : ps))}
                           >
                             <option value="Αίθουσα Mike">Αίθουσα Mike</option>
                             <option value="Αίθουσα Jordan">Αίθουσα Jordan</option>
                           </select>
                         </div>

                        {/* Group - Only show for non-individual training */}
                        {trainingType !== 'individual' && (
                          <div className="col-span-1 p-2 border-r border-gray-300">
                            {trainingType === 'combination' ? (
                              // For combination, lock to 1 person (individual sessions)
                              <div className="w-full px-2 py-2 text-sm border-2 border-gray-200 rounded bg-gray-100 text-gray-600 font-medium">
                                🔒 1 άτομο (Ατομική)
                              </div>
                            ) : (
                              // For group training, allow selection
                              <select 
                                className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                value={session.group || ''}
                                onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, group: e.target.value as '2ΑτομαGroup' | '3ΑτομαGroup' | '6ΑτομαGroup' | undefined } : ps))}
                              >
                                <option value="">Επιλέξτε Group</option>
                                <option value="2ΑτομαGroup">2ΑτομαGroup</option>
                                <option value="3ΑτομαGroup">3ΑτομαGroup</option>
                                <option value="6ΑτομαGroup">6ΑτομαGroup</option>
                              </select>
                            )}
                          </div>
                        )}

                         {/* Trainer */}
                         <div className="col-span-1 p-2">
                           <select 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.trainer}
                             onChange={(e) => setProgramSessions(prev => prev.map((ps, i) => i === idx ? { ...ps, trainer: e.target.value as TrainerName } : ps))}
                           >
                             {AVAILABLE_TRAINERS.map(trainer => (
                               <option key={trainer} value={trainer}>{trainer}</option>
                             ))}
                           </select>
                       </div>
                     </div>
                   ))}
                 </div>

                 </div>

                 {/* Table Action Buttons */}
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-3 sm:space-y-0">
                   <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                     <button 
                       type="button" 
                       className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center"
                       onClick={() => {
                         // Validation για combination training
                         if (trainingType === 'combination' && programSessions.length >= combinationPersonalSessions) {
                           toast.error(`Για συνδυασμένο πρόγραμμα μπορείτε να έχετε μέγιστο ${combinationPersonalSessions} ατομικές σεσίες`);
                           return;
                         }
                         
                        setProgramSessions(prev => [...prev, {
                          id: `tmp-${Date.now()}`,
                          date: new Date().toISOString().split('T')[0], 
                          startTime: '19:00', 
                          endTime: '20:00', 
                          type: 'personal', 
                          trainer: 'Mike', 
                          room: 'Αίθουσα Mike', 
                          group: trainingType === 'combination' ? undefined : '2ΑτομαGroup', // For combination, no group (individual sessions)
                          notes: prev[0]?.notes || ''
                        }]);
                       }}
                     >
                       ➕ Προσθήκη Σέσιας
                     </button>
                     <button
                       type="button"
                       className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center"
                       onClick={() => {
                         // Validation για combination training
                         if (trainingType === 'combination' && programSessions.length >= combinationPersonalSessions) {
                           toast.error(`Για συνδυασμένο πρόγραμμα μπορείτε να έχετε μέγιστο ${combinationPersonalSessions} ατομικές σεσίες`);
                           return;
                         }
                         
                         const newSession = {
                           id: `tmp-${Date.now()}`,
                           date: new Date().toISOString().split('T')[0],
                           startTime: '19:00',
                           endTime: '20:00',
                           type: 'personal' as const,
                           trainer: 'Mike' as TrainerName,
                           room: 'Αίθουσα Mike',
                           group: '2ΑτομαGroup' as const,
                           notes: programSessions[0]?.notes || ''
                         };
                         setProgramSessions(prev => [...prev, newSession]);
                       }}
                     >
                       📋 Αντιγραφή Τελευταίας
                     </button>
                     {programSessions.length > 1 && (
                       <button 
                         type="button" 
                         className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center"
                         onClick={() => setProgramSessions(prev => prev.slice(0, -1))}
                       >
                         ➖ Διαγραφή Τελευταίας
                       </button>
                     )}
                   </div>
                   <div className="text-center sm:text-right">
                     <div className="text-xs text-gray-500">
                       💡 Κάντε κλικ στα κελιά για επεξεργασία • Χρησιμοποιήστε τα κουμπιά για διαχείριση
                     </div>
                   </div>
                 </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateCodeModal(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg"
              >
                ❌ Ακύρωση
              </button>
              <button
                onClick={() => {
                  console.log('[AdminPanel] Button clicked - trainingType:', trainingType, 'selectedUserId:', newCode.selectedUserId);
                  createPersonalTrainingProgram();
                }}
                disabled={(trainingType === 'individual' || trainingType === 'combination') ? !newCode.selectedUserId : selectedUserIds.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
                title={
                  (trainingType === 'individual' || trainingType === 'combination') 
                    ? (!newCode.selectedUserId ? 'Παρακαλώ επιλέξτε χρήστη' : 'Δημιουργία Προγράμματος')
                    : (selectedUserIds.length === 0 ? 'Παρακαλώ επιλέξτε χρήστες' : 'Δημιουργία Προγράμματος')
                }
              >
                ✅ Δημιουργία Προγράμματος
                {(trainingType === 'individual' || trainingType === 'combination') && !newCode.selectedUserId && (
                  <span className="ml-2 text-xs opacity-75">(Επιλέξτε χρήστη)</span>
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Assignment Manager Modal */}
      {showGroupAssignmentManager && groupAssignmentUser && groupAssignmentProgramId && weeklyFrequency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Διαχείριση Ομαδικών Αναθέσεων
                </h2>
                <button
                  onClick={() => {
                    setShowGroupAssignmentManager(false);
                    setGroupAssignmentUser(null);
                    setGroupAssignmentProgramId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <GroupAssignmentManager
                selectedUser={groupAssignmentUser}
                programId={groupAssignmentProgramId}
                weeklyFrequency={weeklyFrequency}
                onAssignmentComplete={() => {
                  
                  // Check if there are more users to assign
                  const currentUserIndex = selectedUserIds.findIndex(id => id === groupAssignmentUser.id);
                  if (currentUserIndex < selectedUserIds.length - 1) {
                    // Move to next user
                    const nextUserId = selectedUserIds[currentUserIndex + 1];
                    const nextUser = allUsers.find(u => u.id === nextUserId);
                    if (nextUser) {
                      // Find the schedule for the next user
                      supabase
                        .from('personal_training_schedules')
                        .select('id')
                        .eq('user_id', nextUser.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .then(({ data }) => {
                          if (data && data.length > 0) {
                            setGroupAssignmentUser(nextUser);
                            setGroupAssignmentProgramId(data[0].id);
                            toast.success(`Μετάβαση στον επόμενο χρήστη: ${nextUser.firstName} ${nextUser.lastName}`);
                          }
                        });
                    }
                  } else {
                    // All users assigned, close modal
                    toast.success('Όλες οι αναθέσεις ολοκληρώθηκαν!');
                    setShowGroupAssignmentManager(false);
                    setGroupAssignmentUser(null);
                    setGroupAssignmentProgramId(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ultimate Subscriptions Tab */}
      {activeTab === 'ultimate-subscriptions' && !loading && (
        <ErrorBoundary
          fallback={
            <div className="text-center py-16">
              <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Σφάλμα στη φόρτωση Ultimate Συνδρομών
              </h3>
              <p className="text-gray-600 mb-6">
                Παρουσιάστηκε ένα σφάλμα. Παρακαλώ ανανεώστε τη σελίδα ή δοκιμάστε ξανά.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Ανανέωση Σελίδας
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <AdminUltimateInstallmentsTab
              ultimateRequests={ultimateRequests}
              ultimateLoading={ultimateLoading}
              ultimateSearchTerm={ultimateSearchTerm}
              setUltimateSearchTerm={setUltimateSearchTerm}
              selectedRequestOptions={selectedRequestOptions}
              handleRequestOptionChange={handleRequestOptionChange}
              updateInstallmentAmounts={updateInstallmentAmounts}
              deleteUltimateRequest={deleteUltimateRequest}
              loadUltimateRequests={loadUltimateRequests}
              handleApproveRequest={handleUltimateApproveRequest}
              handleRejectRequest={handleUltimateRejectRequest}
              loading={loading}
              requestProgramApprovalStatus={requestProgramApprovalStatus}
              handleRequestProgramApprovalChange={handleRequestProgramApprovalChange}
              handleSaveRequestProgramOptions={handleSaveRequestProgramOptions}
              requestPendingUsers={requestPendingUsers}
              requestFrozenOptions={requestFrozenOptions}
            />
          </div>
        </ErrorBoundary>
      )}

    </div>
  );
};

export default AdminPanel;

