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
  AlertTriangle,
  Lock,
  Image,
  Activity
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
import UsersInformation from '@/components/admin/UsersInformation';
import ErrorFixing from '@/components/admin/ErrorFixing';
import ErrorBoundary from '@/components/ErrorBoundary';
import { isInstallmentsEligible } from '@/utils/installmentsEligibility';
import AdminBannersManager from '@/components/admin/AdminBannersManager';
import WorkoutProgramsManager from '@/components/admin/WorkoutProgramsManager';

import { 
  getMembershipPackages, 
  getMembershipPackageDurations, 
  updateMembershipPackageDuration,
  getMembershipRequests,
  getMembershipRequestsWithLockedInstallments,
  getUltimateMembershipRequests,
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

// Helper to validate user id for RPC calls (defined early to avoid hoisting issues)
const getValidUserId = async (userId: string | undefined) => {
  if (!userId || userId === 'undefined' || userId === '00000000-0000-0000-0000-000000000001') {
    // If no valid user ID, get the first admin user from user_profiles
    try {
      const { data: adminUser, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (error || !adminUser) {
        console.error('No admin user found:', error);
        return null;
      }
      
      return adminUser.id;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }
  // Allow valid user IDs for RPC calls
  return userId;
};

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'membership-packages' | 'ultimate-subscriptions' | 'pilates-schedule' | 'kettlebell-points' | 'cash-register' | 'users-information' | 'error-fixing' | 'banners' | 'workout-programs'>('membership-packages');
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
    'membership-packages': false,
    'ultimate-subscriptions': false,
    'pilates-schedule': false,
    'kettlebell-points': false,
    'cash-register': false,
    'users-information': false,
    'error-fixing': false,
    'banners': false,
    'workout-programs': false
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
  const [selectedUserDeposit, setSelectedUserDeposit] = useState<{ remaining: number; total: number; used: number } | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Group Room Options state
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<'2' | '3' | '6' | '10' | null>(null);
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
  // Hide admin subscription requests UI while keeping code for potential reuse
  const showAdminSubscriptionRequests = false;
  
  // New panel state variables
  const [usedOldMembers, setUsedOldMembers] = useState<Set<string>>(new Set());
  const [localUsedOldMembers, setLocalUsedOldMembers] = useState<Set<string>>(new Set());
  const [kettlebellPoints, setKettlebellPoints] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<{
    [userId: string]: {
      oldMembers: boolean;
      first150Members: boolean;
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
  const [kettlebellFromDate, setKettlebellFromDate] = useState<string>('');
  const [kettlebellToDate, setKettlebellToDate] = useState<string>('');
  
  // Kettlebell Points pagination state
  const [kettlebellCurrentPage, setKettlebellCurrentPage] = useState(1);
  const KETTLEBELL_USERS_PER_PAGE = 10;
  
  // Kettlebell Points user details modal state
  const [selectedKettlebellUser, setSelectedKettlebellUser] = useState<UserKettlebellSummary | null>(null);
  const [userKettlebellPointsDetails, setUserKettlebellPointsDetails] = useState<Array<{
    id: string;
    points: number;
    created_at: string;
    program_id?: string;
  }>>([]);
  const [showKettlebellDetailsModal, setShowKettlebellDetailsModal] = useState(false);
  const [loadingKettlebellDetails, setLoadingKettlebellDetails] = useState(false);

  // Open Gym section state
  const [openGymSelectedUserId, setOpenGymSelectedUserId] = useState<string>('');
  const [openGymKettlebellPoints, setOpenGymKettlebellPoints] = useState<string>('');
  const [openGymStatus, setOpenGymStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openGymUserSearchMode, setOpenGymUserSearchMode] = useState<'dropdown' | 'search'>('dropdown');
  const [openGymUserSearchTerm, setOpenGymUserSearchTerm] = useState<string>('');

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
    first150Members: boolean;
    kettlebellPoints: string;
    cash: boolean;
    pos: boolean;
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

  // Load frozen options when user is selected
  useEffect(() => {
    if (newCode.selectedUserId) {
      const frozen = getFrozenOptions(newCode.selectedUserId);
      if (frozen) {
        setKettlebellPoints(frozen.kettlebellPoints || '');
        setCashAmount(frozen.cashAmount?.toString() || '');
        setPosAmount(frozen.posAmount?.toString() || '');
      }
    }
  }, [newCode.selectedUserId]);
  
  // Load deposit for Paspartu user when selected
  useEffect(() => {
    const loadUserDeposit = async () => {
      if (!newCode.selectedUserId || userType !== 'paspartu') {
        setSelectedUserDeposit(null);
        return;
      }

      try {
        console.log('[ADMIN] Loading deposit for user:', newCode.selectedUserId);
        
        // Try RPC function first (bypasses RLS)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_lesson_deposit', { p_user_id: newCode.selectedUserId });
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          const deposit = rpcData[0];
          console.log('[ADMIN] Deposit loaded via RPC:', deposit);
          setSelectedUserDeposit({
            total: deposit.total_lessons || 0,
            used: deposit.used_lessons || 0,
            remaining: deposit.remaining_lessons || 0
          });
          return;
        }

        // Fallback to direct query if RPC doesn't exist or fails
        const { data: deposit, error } = await supabase
          .from('lesson_deposits')
          .select('total_lessons, used_lessons, remaining_lessons')
          .eq('user_id', newCode.selectedUserId)
          .maybeSingle();

        console.log('[ADMIN] Deposit query result:', { deposit, error, userId: newCode.selectedUserId });

        if (error) {
          console.error('[ADMIN] Error loading deposit:', error);
          setSelectedUserDeposit({ total: 0, used: 0, remaining: 0 });
          return;
        }

        if (deposit) {
          console.log('[ADMIN] Deposit loaded successfully:', deposit);
          setSelectedUserDeposit({
            total: deposit.total_lessons || 0,
            used: deposit.used_lessons || 0,
            remaining: deposit.remaining_lessons || 0
          });
        } else {
          console.log('[ADMIN] No deposit found for user:', newCode.selectedUserId);
          setSelectedUserDeposit({ total: 0, used: 0, remaining: 0 });
        }
      } catch (error) {
        console.error('[ADMIN] Exception loading deposit:', error);
        setSelectedUserDeposit({ total: 0, used: 0, remaining: 0 });
      }
    };

    loadUserDeposit();
  }, [newCode.selectedUserId, userType]);

  const itemsPerPage = 10;
  // Προσωποποιημένο πρόγραμμα που θα σταλεί μαζί με τον κωδικό
  const [programSessions, setProgramSessions] = useState<PersonalTrainingSession[]>([
    { id: 'tmp-1', date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`, startTime: '18:00', type: 'personal', trainer: 'Mike', room: 'Αίθουσα Mike', group: '2ΑτομαGroup', notes: '' }
  ]);

  // Session filter state for Personal Training modal
  const [sessionFilter, setSessionFilter] = useState<'new' | 'existing'>('new');
  const [existingSessions, setExistingSessions] = useState<PersonalTrainingSession[]>([]);
  const [loadingExistingSessions, setLoadingExistingSessions] = useState(false);

  // Load existing sessions when user changes and filter is set to 'existing'
  useEffect(() => {
    if (newCode.selectedUserId && sessionFilter === 'existing') {
      loadExistingSessions(newCode.selectedUserId);
    }
  }, [newCode.selectedUserId, sessionFilter]);

  // Membership Packages state
  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations, setPackageDurations] = useState<MembershipPackageDuration[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [editingDuration, setEditingDuration] = useState<MembershipPackageDuration | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  
  // Pagination and search state for membership requests
  const [membershipRequestsPage, setMembershipRequestsPage] = useState(1);
  const [membershipRequestsFilter, setMembershipRequestsFilter] = useState<'all' | 'freegym' | 'pilates' | 'installments'>('all');
  const [requestPaymentActionSaved, setRequestPaymentActionSaved] = useState<Set<string>>(new Set());
  const [membershipRequestsSearchTerm, setMembershipRequestsSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 6;
  
  // Program Options state for membership requests
  const [selectedRequestOptions, setSelectedRequestOptions] = useState<{[requestId: string]: {
    oldMembers?: boolean;
    first150Members?: boolean;
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
    installment1Locked?: boolean;
    installment2Locked?: boolean;
    installment3Locked?: boolean;
    deleteThirdInstallment?: boolean;
  }}>({});
  
  // Separate state for Ultimate tab to avoid conflicts
  const [selectedUltimateRequestOptions, setSelectedUltimateRequestOptions] = useState<{[requestId: string]: {
    oldMembers?: boolean;
    first150Members?: boolean;
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
    installment1Locked?: boolean;
    installment2Locked?: boolean;
    installment3Locked?: boolean;
    deleteThirdInstallment?: boolean;
  }}>({});
  const [requestProgramApprovalStatus, setRequestProgramApprovalStatus] = useState<{[requestId: string]: 'none' | 'approved' | 'rejected' | 'pending'}>({});
  const [requestPendingUsers, setRequestPendingUsers] = useState<Set<string>>(new Set());
  const [requestFrozenOptions, setRequestFrozenOptions] = useState<{[requestId: string]: any}>({});
  
  // Track which ultimate requests were frozen with "pending" status
  const [ultimateRequestFrozenWithPending, setUltimateRequestFrozenWithPending] = useState<Set<string>>(new Set());
  
  // Installment locking state
  const [showLockConfirmation, setShowLockConfirmation] = useState(false);
  const [pendingLockRequest, setPendingLockRequest] = useState<{
    requestId: string;
    installmentNumber: number;
  } | null>(null);
  
  // Delete third installment state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [pendingDeleteRequest, setPendingDeleteRequest] = useState<string | null>(null);
  
  // Pilates package state
  const [pilatesDurations, setPilatesDurations] = useState<MembershipPackageDuration[]>([]);
  

  // Feature toggle: hide Ultimate tab while keeping code for potential reuse
  const showUltimateTab = false;
  const tabs = [
    { id: 'membership-packages', name: 'Πακέτα Συνδρομών', icon: Settings },
    ...(showUltimateTab ? [{ id: 'ultimate-subscriptions', name: '👑 Ultimate Συνδρομές', icon: User }] : []),
    { id: 'pilates-schedule', name: 'Πρόγραμμα Pilates', icon: Clock },
    { id: 'kettlebell-points', name: 'Kettlebell Points', icon: Award },
    { id: 'cash-register', name: 'Ταμείο', icon: DollarSign },
    { id: 'users-information', name: 'Χρήστες-Πληροφορίες', icon: Users },
    { id: 'banners', name: 'Banners Αρχικής', icon: Image },
    { id: 'workout-programs', name: 'Προγράμματα Προπόνησης', icon: Activity },
    { id: 'error-fixing', name: 'Διόρθωση Σφαλμάτων', icon: AlertTriangle }
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

  // Filtered users for Open Gym search
  const openGymFilteredUsers = allUsers.filter(user => {
    if (!openGymUserSearchTerm) return true;
    const searchLower = openGymUserSearchTerm.toLowerCase();
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
              date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`,
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
    if (activeTab === 'membership-packages' && !dataLoaded['membership-packages']) {
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
      date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`,
      startTime: '09:00',
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
          (programApprovalStatus || 'pending') as 'approved' | 'rejected' | 'pending',
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
              first150Members: userOptions.first150Members,
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
            setLocalUsedOldMembers(prev => new Set([...prev, userId]));
            // Reset all options when oldMembers is used
            setSelectedOptions(prev => ({
              ...prev,
              [userId]: {
                ...prev[userId],
                oldMembers: false,
                first150Members: false,
                cash: false,
                pos: false,
                cashAmount: undefined,
                posAmount: undefined
              }
            }));
          } else {
            console.warn(`[APPROVED] Failed to mark Old Members as used for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        }

        // 2. Save Kettlebell Points (handle empty fields as 0)
        const kettlebellPoints = userOptions.kettlebellPoints && userOptions.kettlebellPoints.trim() !== '' 
          ? parseInt(userOptions.kettlebellPoints) || 0 
          : 0;
        if (kettlebellPoints > 0) {
          const kettlebellSuccess = await saveKettlebellPoints(
            userId, 
            kettlebellPoints, 
            undefined, // No program_id for now
            user?.id || ''
          );
          if (kettlebellSuccess) {
            console.log(`[APPROVED] Kettlebell Points saved for user: ${userId}, Points: ${kettlebellPoints}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save Kettlebell Points for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        } else {
          console.log(`[APPROVED] Kettlebell Points set to 0 for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
        }

        // 3. Save Cash transactions (handle empty fields as 0)
        const cashAmount = userOptions.cashAmount && userOptions.cashAmount > 0 ? userOptions.cashAmount : 0;
        if (cashAmount > 0) {
          const cashSuccess = await saveCashTransaction(
            userId,
            cashAmount,
            'cash',
            undefined,
            user?.id || '',
            'Cash transaction from approved program creation'
          );
          if (cashSuccess) {
            console.log(`[APPROVED] Cash transaction saved for user: ${userId}, Amount: €${cashAmount}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save Cash transaction for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        } else {
          console.log(`[APPROVED] Cash amount set to 0 for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
        }

        // 4. Save POS transactions (handle empty fields as 0)
        const posAmount = userOptions.posAmount && userOptions.posAmount > 0 ? userOptions.posAmount : 0;
        if (posAmount > 0) {
          const posSuccess = await saveCashTransaction(
            userId,
            posAmount,
            'pos',
            undefined,
            user?.id || '',
            'POS transaction from approved program creation'
          );
          if (posSuccess) {
            console.log(`[APPROVED] POS transaction saved for user: ${userId}, Amount: €${posAmount}${isPending ? ' (from frozen state)' : ''}`);
          } else {
            console.warn(`[APPROVED] Failed to save POS transaction for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
          }
        } else {
          console.log(`[APPROVED] POS amount set to 0 for user: ${userId}${isPending ? ' (from frozen state)' : ''}`);
        }
      }

      toast.success('Έγιναν όλες οι απαραίτητες ενέργειες για τα εγκεκριμένα προγράμματα!');
    } catch (error) {
      console.error('Error executing approved program actions:', error);
      toast.error('Σφάλμα κατά την εκτέλεση των ενεργειών');
    }
  };

  // Function to get current sessions based on filter selection
  const getCurrentSessions = (): PersonalTrainingSession[] => {
    const sessions = sessionFilter === 'existing' ? existingSessions : programSessions;
    
    // Ταξινόμηση από νωρίτερο σε αργότερο βάσει ημερομηνίας και ώρας
    return sessions.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Function to update sessions based on filter selection
  const updateCurrentSessions = (sessions: PersonalTrainingSession[]) => {
    if (sessionFilter === 'existing') {
      setExistingSessions(sessions);
    } else {
      setProgramSessions(sessions);
    }
  };

  // Function to load existing sessions for a user
  const loadExistingSessions = async (userId: string) => {
    if (!userId) return;
    
    setLoadingExistingSessions(true);
    try {
      console.log('[AdminPanel] Loading existing sessions for user:', userId);
      
      // Query the most recent personal training schedule for this user
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('schedule_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[AdminPanel] Error loading existing sessions:', error);
        toast.error('Σφάλμα κατά τη φόρτωση των υπαρχόντων σεσιών');
        setExistingSessions([]);
        return;
      }

      if (data && data.length > 0 && data[0].schedule_data?.sessions) {
        console.log('[AdminPanel] Found existing sessions:', data[0].schedule_data.sessions);
        setExistingSessions(data[0].schedule_data.sessions);
        toast.success(`Φορτώθηκαν ${data[0].schedule_data.sessions.length} υπάρχουσες σεσίες`);
      } else {
        console.log('[AdminPanel] No existing sessions found for user');
        setExistingSessions([]);
        toast('Δεν βρέθηκαν υπάρχουσες σεσίες για αυτόν τον χρήστη', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('[AdminPanel] Exception loading existing sessions:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των υπαρχόντων σεσιών');
      setExistingSessions([]);
    } finally {
      setLoadingExistingSessions(false);
    }
  };

  const createPersonalTrainingProgram = async () => {
    if (!newCode.selectedUserId) {
      toast.error('Παρακαλώ επιλέξτε χρήστη');
      return;
    }
    
    const userIds = [newCode.selectedUserId];

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
          // Individual training - όλες οι σεσίες
          const currentSessions = getCurrentSessions();
        const scheduleSessions: PersonalTrainingSession[] = currentSessions.map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            type: s.type,
            trainer: s.trainer || 'Mike',
            room: s.room,
            notes: s.notes
          }));

        const schedulePayload = {
          user_id: selectedUser.id,
          trainer_name: scheduleSessions[0]?.trainer || 'Mike',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          schedule_data: {
            sessions: scheduleSessions,
            notes: '',
            trainer: scheduleSessions[0]?.trainer || 'Mike',
            specialInstructions: ''
          },
          status: 'accepted',
          created_by: user?.id,
          user_type: userType,
          is_flexible: userType === 'paspartu',
          training_type: 'individual' as const,
          group_room_size: null,
          weekly_frequency: null,
          monthly_total: null
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
          const individualGroupSessions = scheduleSessions.map(session => {
            // Calculate end_time by adding 1 hour to start_time
            const startTime = session.startTime;
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = (hours + 1) % 24;
            const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            return {
              session_date: session.date,
              start_time: session.startTime,
              end_time: endTime,
              trainer: session.trainer,
              room: session.room,
              group_type: null, // Individual sessions have no group_type (NULL in database)
              notes: session.notes + ' (Individual - Combination Program)'
            };
          });
          
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
            console.log('[ADMIN] Individual sessions created successfully');
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

        // Special logic for Paspartu users - replace old schedule and manage deposit
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
          
          // Count sessions to deduct from deposit
          const sessionsCount = scheduleSessions.length;
          console.log(`[ADMIN] Paspartu user: ${sessionsCount} sessions will be deducted from deposit`);
          
          // Get current deposit status AFTER replace_paspartu_schedule (which may have deleted old bookings and updated used_lessons via trigger)
          // Use RPC function to avoid RLS issues
          const { data: depositData, error: depositFetchError } = await supabase
            .rpc('get_user_lesson_deposit', {
              p_user_id: selectedUser.id
            });

          let totalDeposits: number;
          let currentUsedLessons: number;

          if (depositFetchError) {
            // Error fetching deposit - log and use default
            console.error('[ADMIN] Error fetching current deposit via RPC:', depositFetchError);
            totalDeposits = 5;
            currentUsedLessons = 0;
          } else if (!depositData || depositData.length === 0 || (depositData[0].total_lessons === 0 && depositData[0].used_lessons === 0 && depositData[0].remaining_lessons === 0)) {
            // No deposit exists - credit 5 and start with 0 used
            totalDeposits = 5;
            currentUsedLessons = 0;
            console.log(`[ADMIN] Deposit doesn't exist - crediting 5 lessons, starting with 0 used`);
          } else {
            // Deposit exists - check if remaining is 0 (need to credit 5 new lessons)
            const deposit = depositData[0];
            if (deposit.remaining_lessons === 0) {
              // Deposit is exhausted - credit 5 new lessons and reset used to 0
              totalDeposits = 5;
              currentUsedLessons = 0;
              console.log(`[ADMIN] Deposit exhausted (remaining: 0) - crediting 5 new lessons, resetting used to 0`);
            } else {
              // Deposit has remaining lessons - use current values (already updated by trigger after old bookings were deleted)
              totalDeposits = deposit.total_lessons;
              currentUsedLessons = deposit.used_lessons;
              console.log(`[ADMIN] Deposit exists (total: ${totalDeposits}, used: ${currentUsedLessons}, remaining: ${deposit.remaining_lessons}) - will add ${sessionsCount} new bookings`);
            }
          }

          // IMPORTANT: Set used_lessons to current used (not including new sessions) because
          // the trigger will automatically increment it when bookings are created
          // The currentUsedLessons is already correct (after old bookings were deleted by replace_paspartu_schedule)

          // Update or create lesson deposit using RPC function (set used_lessons to current, not including new sessions)
          const { error: depositError } = await supabase
            .rpc('update_paspartu_deposit', {
              p_user_id: selectedUser.id,
              p_total_lessons: totalDeposits,
              p_used_lessons: currentUsedLessons, // Set to current used, trigger will add sessionsCount
              p_created_by: user?.id || null
            });

          if (depositError) {
            console.error('[ADMIN] Lesson deposit update error:', depositError);
            // Fallback: try using reset function and then update
            console.log('[ADMIN] Trying fallback: reset then manual update...');
            const { error: resetError } = await supabase
              .rpc('reset_lesson_deposit_for_new_program', {
                p_user_id: selectedUser.id,
                p_total_lessons: totalDeposits,
                p_created_by: user?.id || null
              });
            
            if (!resetError) {
              // Set used_lessons to current (trigger will add sessionsCount)
              const { error: updateError } = await supabase
                .from('lesson_deposits')
                .update({ used_lessons: currentUsedLessons })
                .eq('user_id', selectedUser.id);
                
              if (updateError) {
                console.error('[ADMIN] Failed to update used_lessons:', updateError);
              }
            }
              } else {
            console.log(`[ADMIN] Lesson deposit updated: ${totalDeposits} total, ${currentUsedLessons} used (before bookings)`);
        }

          // Auto-create lesson_bookings for all sessions
          // The trigger will automatically increment used_lessons for each booking created
          if (scheduleSessions.length > 0) {
            console.log(`[ADMIN] Auto-creating ${scheduleSessions.length} lesson bookings for Paspartu user...`);
            const sessionsArray = scheduleSessions.map(s => ({
              id: s.id,
              date: s.date,
              startTime: s.startTime,
              trainer: s.trainer || 'Mike',
              room: s.room || null
            }));
            
            const { data: bookingsCreated, error: bookingsError } = await supabase
              .rpc('create_paspartu_bookings', {
                p_user_id: selectedUser.id,
                p_schedule_id: scheduleData.id,
                p_sessions: sessionsArray
              });
            
            if (bookingsError) {
              console.error('[ADMIN] Error creating auto-bookings:', bookingsError);
              console.warn('[ADMIN] Failed to create auto-bookings, but schedule and deposit were created successfully');
            } else {
              console.log(`[ADMIN] Auto-created ${bookingsCreated || 0} lesson bookings for Paspartu user: ${selectedUser.email}`);
              // Verify final deposit after bookings (trigger should have updated it)
              const { data: finalDeposit } = await supabase
                .from('lesson_deposits')
                .select('total_lessons, used_lessons, remaining_lessons')
                .eq('user_id', selectedUser.id)
                .maybeSingle();
              
              if (finalDeposit) {
                console.log(`[ADMIN] Final deposit after bookings: ${finalDeposit.total_lessons} total, ${finalDeposit.used_lessons} used, ${finalDeposit.remaining_lessons} remaining`);
              }
            }
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
          start_date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`,
          end_date: (() => { const d=new Date(); d.setDate(d.getDate()+30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
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
      setProgramSessions([{ id: 'tmp-1', date: new Date().toISOString().split('T')[0], startTime: '18:00', type: 'personal', trainer: 'Mike', room: 'Αίθουσα Mike', group: '2ΑτομαGroup', notes: '' }]);
      setSessionFilter('new'); // Reset session filter
      setExistingSessions([]); // Reset existing sessions
      
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
      const requests = await getMembershipRequestsWithLockedInstallments();
      setMembershipRequests(requests);
      // Reset to first page when loading new data
      setMembershipRequestsPage(1);
    } catch (error) {
      console.error('Error loading membership requests:', error);
    }
  };


  // Filter and paginate membership requests
  const getFilteredMembershipRequests = () => {
    const filtered = membershipRequests.filter(request => {
      // Filter by package type (EXCLUDE Ultimate - αυτά έχουν ξεχωριστή καρτέλα)
      const isFreeGym = request.package?.name === 'Free Gym';
      const isPilates = request.package?.name === 'Pilates';
      const isInstallments = request.has_installments === true;

      let packageMatch = isFreeGym || isPilates;
      if (membershipRequestsFilter === 'freegym') packageMatch = isFreeGym;
      if (membershipRequestsFilter === 'pilates') packageMatch = isPilates;
      if (membershipRequestsFilter === 'installments') {
        // Για αιτήματα με δόσεις, δείξε όλα ανεξάρτητα από status
        packageMatch = isInstallments;
      }
      
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
      const isUltimatePackage = request?.package?.name === 'Ultimate' || request?.package?.name === 'Ultimate Medium';
      
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

  // Separate handler for Ultimate tab to avoid conflicts
  const handleUltimateRequestOptionChange = (requestId: string, option: string, value: any) => {
    setSelectedUltimateRequestOptions(prev => ({
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
        (status || 'pending') as 'approved' | 'rejected' | 'pending',
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
        const newSaved = new Set(requestPaymentActionSaved);
        newSaved.add(requestId);
        setRequestPaymentActionSaved(newSaved);
        
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

  // Separate handler for Ultimate requests
  const handleSaveUltimateRequestProgramOptions = async (requestId: string) => {
    const status = requestProgramApprovalStatus[requestId];
    if (status === 'none' || !user) {
      toast.error('Παρακαλώ επιλέξτε μια κατάσταση έγκρισης');
      return;
    }

    try {
      setLoading(true);
      
      const requestOptions = selectedUltimateRequestOptions[requestId];
      if (!requestOptions) {
        toast.error('Δεν υπάρχουν επιλογές για αυτό το αίτημα');
        return;
      }

      // Find the ultimate request to get user_id
      const request = ultimateRequests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Ultimate αίτημα δεν βρέθηκε');
        return;
      }

      // Save approval state for the ultimate request
      const success = await saveProgramApprovalState(
        request.user_id,
        (status || 'pending') as 'approved' | 'rejected' | 'pending',
        {
          oldMembersUsed: requestOptions.oldMembers || false,
          kettlebellPoints: requestOptions.kettlebellPoints ? parseInt(requestOptions.kettlebellPoints) : 0,
          cashAmount: requestOptions.cashAmount ?? 0,
          posAmount: requestOptions.posAmount ?? 0,
          createdBy: user.id,
          notes: `Program options saved for ultimate membership request ${requestId} with ${status} status`
        }
      );

      if (success) {
        console.log(`[AdminPanel] Successfully saved program options for ultimate request ${requestId}`);
        
        // Handle pending state
        if (status === 'pending') {
          // Freeze options for pending status
          setRequestPendingUsers(prev => new Set([...prev, requestId]));
          
          // Store frozen options
          setRequestFrozenOptions(prev => ({
            ...prev,
            [requestId]: {
              ...requestOptions,
              oldMembers: requestOptions.oldMembers || false,
              kettlebellPoints: requestOptions.kettlebellPoints || '',
              cash: requestOptions.cash || false,
              pos: requestOptions.pos || false,
              cashAmount: requestOptions.cashAmount ?? 0,
              posAmount: requestOptions.posAmount ?? 0
            }
          }));
          
          // Track that this request was frozen with "pending" status
          setUltimateRequestFrozenWithPending(prev => new Set([...prev, requestId]));
          
          toast('Ultimate Program Options τοποθετήθηκαν στην αναμονή - οι επιλογές παγώθηκαν', { icon: '⏳' });
        } else {
          // Execute actions for approved/rejected status
          if (status === 'approved') {
            await executeApprovedUltimateRequestProgramActions(requestId, request.user_id, requestOptions);
          }
          
          // Freeze options for any save (approved/rejected/pending)
          // Mark request as pending to freeze options
          setRequestPendingUsers(prev => new Set([...prev, requestId]));
          
          // Store frozen options
          setRequestFrozenOptions(prev => ({
            ...prev,
            [requestId]: {
              ...requestOptions,
              oldMembers: requestOptions.oldMembers || false,
              kettlebellPoints: requestOptions.kettlebellPoints || '',
              cash: requestOptions.cash || false,
              pos: requestOptions.pos || false,
              cashAmount: requestOptions.cashAmount ?? 0,
              posAmount: requestOptions.posAmount ?? 0
            }
          }));
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
        
        toast.success(`Ultimate Program Options ${statusText[status]} επιτυχώς!`);
        
        // Reload ultimate requests
        await loadUltimateRequests();
      } else {
        toast.error('Σφάλμα κατά την αποθήκευση των Ultimate Program Options');
      }
    } catch (error) {
      console.error('[AdminPanel] Error saving ultimate program options:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των Ultimate Program Options');
    } finally {
      setLoading(false);
    }
  };

  // Function to unfreeze ultimate request program options
  const handleUnfreezeUltimateRequestProgramOptions = async (requestId: string) => {
    try {
      // Remove from pending users
      setRequestPendingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      
      // Remove from pending tracking
      setUltimateRequestFrozenWithPending(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      
      // Remove frozen options
      setRequestFrozenOptions(prev => {
        const newOptions = { ...prev };
        delete newOptions[requestId];
        return newOptions;
      });
      
      toast.success('Program Options ξεπαγώθηκαν επιτυχώς!');
    } catch (error) {
      console.error('[AdminPanel] Error unfreezing ultimate program options:', error);
      toast.error('Σφάλμα κατά το ξεπάγωμα των Program Options');
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

      // 2. Handle First 150 Members if selected
      if (userOptions.first150Members) {
        // Mark old members as used (same as above but for first150Members)
        const oldMembersSuccess = await markOldMembersUsed(userId, user?.id || '');
        if (oldMembersSuccess) {
          console.log(`[APPROVED] First 150 Members - Old Members marked as used for membership request: ${requestId}`);
        } else {
          console.warn(`[APPROVED] First 150 Members - Failed to mark Old Members as used for membership request: ${requestId}`);
        }
        
        // Automatically set cash to 45€ and lock POS (this is handled in the UI state)
        console.log(`[APPROVED] First 150 Members selected - Cash set to 45€ and POS locked for membership request: ${requestId}`);
      }

      // 3. Save Kettlebell Points if provided
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
    }
  };

  // Execute approved program actions for Ultimate requests
  const executeApprovedUltimateRequestProgramActions = async (requestId: string, userId: string, userOptions: any) => {
    console.log('[AdminPanel] Executing approved program actions for Ultimate membership request:', requestId);
    
    try {
      // 1. Save Old Members usage if selected
      if (userOptions.oldMembers) {
        const oldMembersSuccess = await markOldMembersUsed(userId, user?.id || '');
        if (oldMembersSuccess) {
          console.log(`[APPROVED] Old Members marked as used for Ultimate membership request: ${requestId}`);
        } else {
          console.warn(`[APPROVED] Failed to mark Old Members as used for Ultimate membership request: ${requestId}`);
        }
      }

      // 2. Save Kettlebell Points if provided
      if (userOptions.kettlebellPoints && parseInt(userOptions.kettlebellPoints) > 0) {
        const kettlebellSuccess = await saveKettlebellPoints(
          userId, 
          parseInt(userOptions.kettlebellPoints), 
          requestId, // Use requestId as program_id for Ultimate requests
          user?.id || ''
        );
        
        if (kettlebellSuccess) {
          console.log(`[APPROVED] Kettlebell Points saved for Ultimate membership request: ${requestId}, Points: ${userOptions.kettlebellPoints}`);
        } else {
          console.warn(`[APPROVED] Failed to save Kettlebell Points for Ultimate membership request: ${requestId}`);
        }
      }

      // 3. Save Cash transactions if provided
      if (userOptions.cashAmount && userOptions.cashAmount > 0) {
        const cashSuccess = await saveCashTransaction(
          userId,
          userOptions.cashAmount,
          'cash',
          requestId, // Use requestId as program_id for Ultimate requests
          user?.id || '',
          'Cash transaction from approved Ultimate membership request'
        );
        if (cashSuccess) {
          console.log(`[APPROVED] Cash transaction saved for Ultimate membership request: ${requestId}, Amount: €${userOptions.cashAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save Cash transaction for Ultimate membership request: ${requestId}`);
        }
      }

      // 4. Save POS transactions if provided
      if (userOptions.posAmount && userOptions.posAmount > 0) {
        const posSuccess = await saveCashTransaction(
          userId,
          userOptions.posAmount,
          'pos',
          requestId, // Use requestId as program_id for Ultimate requests
          user?.id || '',
          'POS transaction from approved Ultimate membership request'
        );
        if (posSuccess) {
          console.log(`[APPROVED] POS transaction saved for Ultimate membership request: ${requestId}, Amount: €${userOptions.posAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save POS transaction for Ultimate membership request: ${requestId}`);
        }
      }

      toast.success('Έγιναν όλες οι απαραίτητες ενέργειες για το εγκεκριμένο Ultimate αίτημα!');
    } catch (error) {
      console.error('[AdminPanel] Error executing approved program actions for Ultimate membership request:', error);
      toast.error('Σφάλμα κατά την εκτέλεση των ενεργειών');
    }
  };

  // ===== PILATES PACKAGE FUNCTIONS =====

  // ===== KETTLEBELL POINTS FUNCTIONS =====

  const loadKettlebellPointsData = useCallback(async () => {
    try {
      setLoading(true);
      const [totalPoints, summary] = await Promise.all([
        getTotalKettlebellPoints(kettlebellFromDate || undefined, kettlebellToDate || undefined),
        getKettlebellPointsSummary(kettlebellFromDate || undefined, kettlebellToDate || undefined)
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
  }, [kettlebellFromDate, kettlebellToDate]);

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

  // Load user kettlebell points details for modal
  const loadUserKettlebellPointsDetails = async (user: UserKettlebellSummary) => {
    try {
      setLoadingKettlebellDetails(true);
      setSelectedKettlebellUser(user);
      const pointsDetails = await getUserKettlebellPoints(user.user_id);
      setUserKettlebellPointsDetails(pointsDetails.map(p => ({
        id: p.id,
        points: p.points,
        created_at: p.created_at,
        program_id: p.program_id
      })));
      setShowKettlebellDetailsModal(true);
    } catch (error) {
      console.error('Error loading user kettlebell points details:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των λεπτομερειών βαθμών');
    } finally {
      setLoadingKettlebellDetails(false);
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
    // Reset to first page when searching
    setKettlebellCurrentPage(1);
  };

  // Kettlebell Points pagination logic
  const kettlebellTotalPages = Math.ceil(kettlebellSummary.length / KETTLEBELL_USERS_PER_PAGE);
  const kettlebellStartIndex = (kettlebellCurrentPage - 1) * KETTLEBELL_USERS_PER_PAGE;
  const kettlebellEndIndex = kettlebellStartIndex + KETTLEBELL_USERS_PER_PAGE;
  const kettlebellPaginatedUsers = kettlebellSummary.slice(kettlebellStartIndex, kettlebellEndIndex);

  // Kettlebell Points pagination handlers
  const handleKettlebellPreviousPage = () => {
    setKettlebellCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleKettlebellNextPage = () => {
    setKettlebellCurrentPage(prev => Math.min(prev + 1, kettlebellTotalPages));
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
        setLocalUsedOldMembers(usedOldMembersSet);
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
      
      // Load Ultimate requests from the new dedicated table
      const ultimateRequests = await withDatabaseRetry(
        () => getUltimateMembershipRequests(),
        'φόρτωση Ultimate αιτημάτων'
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
      const isUltimatePackage = request?.package?.name === 'Ultimate' || request?.package?.name === 'Ultimate Medium';
      
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

  // Handle installment locking
  const handleInstallmentLockClick = (requestId: string, installmentNumber: number) => {
    setPendingLockRequest({ requestId, installmentNumber });
    setShowLockConfirmation(true);
  };

  const confirmInstallmentLock = async () => {
    if (pendingLockRequest) {
      const { requestId, installmentNumber } = pendingLockRequest;
      
      try {
        // First, save current values to database before locking
        const request = membershipRequests.find(r => r.id === requestId);
        if (request) {
          const requestOptions = selectedRequestOptions[requestId] || {};
          
          // Prepare update data with current values
          const updateData: any = {};
          
          // Save installment amounts (use current values from form or database)
          if (installmentNumber === 1) {
            updateData.installment_1_amount = parseFloat(requestOptions.installment1Amount || request.installment_1_amount || 0);
            updateData.installment_1_payment_method = requestOptions.installment1PaymentMethod || request.installment_1_payment_method || 'cash';
            updateData.installment_1_due_date = requestOptions.installment1DueDate || request.installment_1_due_date;
          } else if (installmentNumber === 2) {
            updateData.installment_2_amount = parseFloat(requestOptions.installment2Amount || request.installment_2_amount || 0);
            updateData.installment_2_payment_method = requestOptions.installment2PaymentMethod || request.installment_2_payment_method || 'cash';
            updateData.installment_2_due_date = requestOptions.installment2DueDate || request.installment_2_due_date;
          } else if (installmentNumber === 3) {
            updateData.installment_3_amount = parseFloat(requestOptions.installment3Amount || request.installment_3_amount || 0);
            updateData.installment_3_payment_method = requestOptions.installment3PaymentMethod || request.installment_3_payment_method || 'cash';
            updateData.installment_3_due_date = requestOptions.installment3DueDate || request.installment_3_due_date;
          }
          
          // Save values to database first (using ultimate_membership_requests table)
          const { error: saveError } = await supabase
            .from('membership_requests')
            .update(updateData)
            .eq('id', requestId);
          
          if (saveError) {
            console.error(`[AdminPanel] Error saving values before lock:`, saveError);
            toast.error('Σφάλμα κατά την αποθήκευση των τιμών');
            return;
          }
          
          console.log(`[AdminPanel] Saved values before locking:`, updateData);
        }
        
        // Then lock the installment
        const lockedBy = await getValidUserId(user?.id);
        const { error: lockError } = await supabase
          .rpc('lock_installment', { 
            p_request_id: requestId, 
            p_installment_number: installmentNumber, 
            p_locked_by: lockedBy 
          });
        
        if (lockError) {
          console.error(`Error locking installment ${installmentNumber}:`, lockError);
          toast.error(`Σφάλμα κατά το κλείδωμα της ${installmentNumber}ης δόσης`);
          return;
        }
        
        // Update local state - lock the installment
        const lockField = `installment${installmentNumber}Locked` as keyof MembershipRequest;
        handleRequestOptionChange(requestId, lockField, true);
        
        toast.success(`${installmentNumber}η δόση κλειδώθηκε επιτυχώς με τις τρέχουσες τιμές`);
        
        // Reload the requests to get updated data
        await loadMembershipRequests();
        
      } catch (error) {
        console.error('Exception locking installment:', error);
        toast.error('Σφάλμα κατά το κλείδωμα της δόσης');
      }
      
      setShowLockConfirmation(false);
      setPendingLockRequest(null);
    }
  };

  const cancelInstallmentLock = () => {
    setShowLockConfirmation(false);
    setPendingLockRequest(null);
  };

  // Delete third installment confirmation handlers
  const handleDeleteThirdInstallmentClick = (requestId: string) => {
    setPendingDeleteRequest(requestId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteThirdInstallment = async () => {
    if (pendingDeleteRequest) {
      try {
        // Get valid user ID for the deletion
        const deletedBy = await getValidUserId(user?.id);
        
        console.log('Deleting third installment for request:', pendingDeleteRequest, 'by user:', deletedBy);
        
        // Call RPC to delete third installment permanently
        // Use NULL for p_deleted_by if no valid user ID
        const { error: deleteError } = await supabase
          .rpc('delete_third_installment_permanently', { 
            p_request_id: pendingDeleteRequest, 
            p_deleted_by: deletedBy 
          });
        
        if (deleteError) {
          console.error('Error deleting third installment:', deleteError);
          toast.error('Σφάλμα κατά τη διαγραφή της 3ης δόσης');
          return;
        }
        
        // Update local state
        handleRequestOptionChange(pendingDeleteRequest, 'deleteThirdInstallment', true);
        
        toast.success('3η δόση διαγράφηκε επιτυχώς');
        
        // Reload the requests to get updated data
        await loadMembershipRequests();
        
      } catch (error) {
        console.error('Exception deleting third installment:', error);
        toast.error('Σφάλμα κατά τη διαγραφή της 3ης δόσης');
      }
      
      setShowDeleteConfirmation(false);
      setPendingDeleteRequest(null);
    }
  };

  const cancelDeleteThirdInstallment = () => {
    setShowDeleteConfirmation(false);
    setPendingDeleteRequest(null);
  };

  // Check if an installment is locked (from database only - permanent locking)
    const isInstallmentLocked = (request: MembershipRequest, installmentNumber: number) => {
      // Check if it's locked in the database (permanent locking)
      const dbLockField = `installment_${installmentNumber}_locked` as keyof MembershipRequest;
      const isDbLocked = request[dbLockField] === true;
      
      console.log(`[AdminPanel] isInstallmentLocked check for request ${request.id}, installment ${installmentNumber}: locked = ${isDbLocked}, field = ${dbLockField}, value = ${request[dbLockField]}`);
      
      // Check if the field exists and is properly set
      if (request[dbLockField] !== undefined && request[dbLockField] !== null) {
        return isDbLocked;
      }
      
      // Fallback: Check if it's locked in the old locked_installments table
      console.log(`[AdminPanel] Field ${dbLockField} is undefined/null, checking old locked_installments table...`);
      
      // Legacy method removed - using individual locked fields now
      // Default to false if no locking information is found
      return false;
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

      // Handle installment locking using the new database table
      const requestOptions = selectedRequestOptions[requestId];
      if (requestOptions) {
        // Lock installments that were just locked
        // Helper function to validate user ID
        const getValidUserId = (userId: string | undefined) => {
          if (!userId || userId === "undefined") {
            return null;
          }
          // Allow the admin user ID for RPC calls
          return userId;
        };

        if (requestOptions.installment1Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              p_request_id: requestId, 
              p_installment_number: 1, 
              p_locked_by: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 1:', lockError);
          }
        }
        if (requestOptions.installment2Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              p_request_id: requestId, 
              p_installment_number: 2, 
              p_locked_by: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 2:', lockError);
          }
        }
        if (requestOptions.installment3Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              p_request_id: requestId, 
              p_installment_number: 3, 
              p_locked_by: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 3:', lockError);
          }
        }

        // Handle third installment deletion
        if (requestOptions.deleteThirdInstallment) {
          const deletedBy = getValidUserId(user?.id);
          if (deletedBy) {
            const { error: deleteError } = await supabase
              .rpc('delete_third_installment_permanently', { 
                request_id: requestId, 
                deleted_by_user_id: deletedBy === '00000000-0000-0000-0000-000000000001' ? null : deletedBy 
              });
            if (deleteError) {
              console.error('Error deleting third installment:', deleteError);
            }
          } else {
            console.error('No valid user ID for third installment deletion');
          }
        }
      }

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
    if (showUltimateTab && activeTab === 'ultimate-subscriptions' && !dataLoaded['ultimate-subscriptions']) {
      console.log('[AdminPanel] Loading Ultimate Subscriptions data...');
      loadUltimateRequests();
    }
  }, [activeTab]);

  // Additional effect to ensure data is loaded for ultimate subscriptions
  useEffect(() => {
    if (showUltimateTab && activeTab === 'ultimate-subscriptions' && ultimateRequests.length === 0 && !ultimateLoading) {
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

  // ===== OPEN GYM FUNCTIONS =====

  const handleOpenGymAction = async () => {
    if (!openGymSelectedUserId || !openGymKettlebellPoints) {
      setOpenGymStatus({
        type: 'error',
        message: 'Παρακαλώ επιλέξτε χρήστη και εισάγετε αριθμό points'
      });
      return;
    }

    const points = parseInt(openGymKettlebellPoints);
    if (points <= 0) {
      setOpenGymStatus({
        type: 'error',
        message: 'Ο αριθμός των points πρέπει να είναι μεγαλύτερος από 0'
      });
      return;
    }

    try {
      setOpenGymStatus(null);
      setLoading(true);

      // Find the selected user
      const selectedUser = allUsers.find(user => user.id === openGymSelectedUserId);
      if (!selectedUser) {
        setOpenGymStatus({
          type: 'error',
          message: 'Δεν βρέθηκε ο επιλεγμένος χρήστης'
        });
        return;
      }

      console.log('[OpenGym] Starting Open Gym action for user:', selectedUser.email, 'Extra Service:', points);

      // 1. Save Kettlebell Points
      const kettlebellSuccess = await saveKettlebellPoints(
        openGymSelectedUserId,
        points,
        undefined, // No program_id for Open Gym
        user?.id || ''
      );

      if (!kettlebellSuccess) {
        setOpenGymStatus({
          type: 'error',
          message: 'Σφάλμα κατά την αποθήκευση των Kettlebell Points'
        });
        return;
      }

      console.log('[OpenGym] Kettlebell Points saved successfully');

      // 2. Create Free Gym membership (1 month)
      const freeGymMembershipSuccess = await createFreeGymMembership(openGymSelectedUserId);

      if (!freeGymMembershipSuccess) {
        setOpenGymStatus({
          type: 'error',
          message: 'Σφάλμα κατά τη δημιουργία της Free Gym συνδρομής'
        });
        return;
      }

      console.log('[OpenGym] Free Gym membership created successfully');

      // Success
      setOpenGymStatus({
        type: 'success',
        message: `Επιτυχής εφαρμογή Open Gym για ${selectedUser.firstName} ${selectedUser.lastName}! Ενεργοποιήθηκε η 1μηνη Free Gym συνδρομή.`
      });

      // Clear form
      setOpenGymSelectedUserId('');
      setOpenGymKettlebellPoints('');
      setOpenGymUserSearchTerm('');

      // Show success toast
      toast.success(`Open Gym εφαρμογή επιτυχής για ${selectedUser.firstName} ${selectedUser.lastName}`);

    } catch (error) {
      console.error('[OpenGym] Error during Open Gym action:', error);
      setOpenGymStatus({
        type: 'error',
        message: 'Σφάλμα κατά την εκτέλεση της ενέργειας Open Gym'
      });
    } finally {
      setLoading(false);
    }
  };

  const createFreeGymMembership = async (userId: string): Promise<boolean> => {
    try {
      // Get Free Gym package ID
      const { data: freeGymPackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('id')
        .eq('name', 'Free Gym')
        .eq('is_active', true)
        .single();

      if (packageError || !freeGymPackage) {
        console.error('[OpenGym] Error finding Free Gym package:', packageError);
        return false;
      }

      // Calculate dates (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          package_id: freeGymPackage.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true,
          expires_at: endDate.toISOString(),
          source_package_name: 'Open Gym'
        });

      if (membershipError) {
        console.error('[OpenGym] Error creating Free Gym membership:', membershipError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[OpenGym] Exception creating Free Gym membership:', error);
      return false;
    }
  };

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

          {/* Personal Training Tab - REMOVED */}
          {false && (
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
                    {personalTrainingSchedule.scheduleData.sessions
                      .sort((a, b) => {
                        // Ταξινόμηση από νωρίτερο σε αργότερο βάσει ημερομηνίας και ώρας
                        const dateA = new Date(`${a.date}T${a.startTime}`);
                        const dateB = new Date(`${b.date}T${b.startTime}`);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                          <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ημέρα</label>
                            {editingSchedule ? (
                              <input
                                type="date"
                                value={session.date}
                                onChange={(e) => updatePersonalTrainingSession(session.id, 'date', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                                lang="el"
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

              {/* Open Gym Section - Between Create Program and Calendar */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg border-2 border-orange-200">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-orange-800 mb-2">🏋️‍♂️ Open Gym</h3>
                      <p className="text-orange-600 text-sm sm:text-base">Διαχείριση εξτρα υπηρεσιών και Free Gym συνδρομών</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* User Selection */}
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        👤 Επιλογή Χρήστη
                        <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                          Selected: {openGymSelectedUserId ? '✅' : '❌'}
                        </span>
                      </label>
                      
                      {/* Mode Selection */}
                      <div className="flex space-x-3 mb-4">
                        <button
                          type="button"
                          onClick={() => setOpenGymUserSearchMode('dropdown')}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            openGymUserSearchMode === 'dropdown' 
                              ? 'bg-orange-600 text-white shadow-lg' 
                              : 'bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-400'
                          }`}
                        >
                          📋 Dropdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenGymUserSearchMode('search')}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            openGymUserSearchMode === 'search' 
                              ? 'bg-orange-600 text-white shadow-lg' 
                              : 'bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-400'
                          }`}
                        >
                          🔍 Αναζήτηση
                        </button>
                      </div>

                      {/* User Selection based on mode */}
                      {openGymUserSearchMode === 'dropdown' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={openGymSelectedUserId}
                          onChange={(e) => setOpenGymSelectedUserId(e.target.value)}
                        >
                          <option value="">-- Επιλέξτε χρήστη --</option>
                          {allUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-400"
                            placeholder="🔍 Αναζήτηση με όνομα ή email..."
                            value={openGymUserSearchTerm}
                            onChange={(e) => setOpenGymUserSearchTerm(e.target.value)}
                          />
                          {openGymUserSearchTerm && (
                            <div className="max-h-48 overflow-y-auto border-2 border-orange-200 rounded-xl bg-white shadow-lg">
                              {openGymFilteredUsers.length > 0 ? (
                                openGymFilteredUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className={`p-4 hover:bg-orange-50 cursor-pointer border-b border-orange-100 last:border-b-0 transition-all duration-200 ${
                                      openGymSelectedUserId === user.id ? 'bg-orange-100 border-l-4 border-l-orange-500' : ''
                                    }`}
                                    onClick={() => {
                                      setOpenGymSelectedUserId(user.id);
                                      setOpenGymUserSearchTerm(''); // Clear search after selection
                                    }}
                                  >
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

                      {/* Selected User Display */}
                      {openGymSelectedUserId && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {allUsers.find(u => u.id === openGymSelectedUserId)?.firstName} {allUsers.find(u => u.id === openGymSelectedUserId)?.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {allUsers.find(u => u.id === openGymSelectedUserId)?.email}
                              </div>
                            </div>
                            <button
                              onClick={() => setOpenGymSelectedUserId('')}
                              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Value Input */}
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏋️‍♂️ Kettlebell Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Εισάγετε αριθμό..."
                        value={openGymKettlebellPoints}
                        onChange={(e) => setOpenGymKettlebellPoints(e.target.value)}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleOpenGymAction}
                        disabled={!openGymSelectedUserId || !openGymKettlebellPoints || parseInt(openGymKettlebellPoints) <= 0}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-orange-500 disabled:hover:to-red-500"
                      >
                        🏋️‍♂️ Εφαρμογή Open Gym
                      </button>
                    </div>

                    {/* Status Display */}
                    {openGymStatus && (
                      <div className={`p-3 rounded-lg text-sm font-medium ${
                        openGymStatus.type === 'success' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {openGymStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Διαχείριση Των Τιμών Για Κάθε Πακέτου Συνδρομής</h3>
                      <p className="text-white/90 mt-1">Ενημερώστε τις τιμές για κάθε πακέτο και διάρκεια</p>
                    </div>
                  </div>
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
              {showAdminSubscriptionRequests && (
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
                <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 border-4 border-blue-500 rounded-xl p-6 shadow-2xl">
                  <div className="flex items-start">
                    <svg className="h-10 w-10 text-blue-700 mt-1 mr-4 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-2xl font-black text-black mb-3 leading-tight">
                        💡 Σημαντικές Οδηγίες
                      </h4>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-gray-800 leading-relaxed">
                          🔍 <strong>Αναζήτηση:</strong> Χρησιμοποιήστε το πεδίο αναζήτησης για να βρείτε γρήγορα αιτήματα με όνομα χρήστη
                        </p>
                        <p className="text-base font-semibold text-gray-800 leading-relaxed">
                          📄 <strong>Σελιδοποίηση:</strong> Η λίστα εμφανίζεται σε 6άδες - ελέγξτε την επόμενη σελίδα αν δεν βρείτε το επιθυμητό αίτημα
                        </p>
                        <p className="text-base font-bold text-orange-800 leading-relaxed bg-orange-200 rounded-lg px-3 py-2">
                          💰 <strong>Διαδικασία Πληρωμής:</strong> Αποθηκεύουμε τα χρήματα (μετρητά/κάρτα) στο σύστημα, μετά κλικάρουμε στο επιλογή και ΕΠΕΙΤΑ επιλέγουμε ✅ Έγκριση Πληρωμής → Αποθήκευση Program Options και τέλος εγκρίνουμε το αίτημα συνδρομής
                        </p>
                        <p className="text-base font-bold text-red-800 leading-relaxed bg-red-200 rounded-lg px-3 py-2">
                          ⚠️ <strong>ΠΡΟΣΟΧΗ ΣΤΙΣ ΔΟΣΕΙΣ:</strong> Κλειδώνουμε ΟΛΕς τις δόσεις (2 ή 3) του πελάτη ΕΠΕΙΤΑ ΑΠΟ ΣΥΝΝΕΝΟΗΣΗ και ΟΧΙ σταδιακά
                        </p>
                        <p className="text-base font-semibold text-gray-800 leading-relaxed">
                          📅 <strong>Προσυμφωνία:</strong> Εξαρχής προσυμφωνούνται ΟΛΕς οι δόσεις και οι ημερομηνίες του πελάτη (π.χ. 1η στις 12/10/25 μετρητά, 2η δόση 24/12/25)
                        </p>
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
                          
                          {/* Pagination Controls */}
                          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                            {/* Pagination */}
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
                      </div>

                      {/* Enhanced Requests List */}
                      <div className="space-y-8">
                        {getPaginatedMembershipRequests().map((request) => (
                        <div key={request.id} className="relative bg-slate-100 border-2 border-slate-300 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <div className={`absolute left-0 top-0 h-full w-2 
                            ${request.status === 'approved' ? 'bg-green-400' : ''}
                            ${request.status === 'pending' ? 'bg-yellow-400' : ''}
                            ${request.status === 'rejected' ? 'bg-red-400' : ''}
                          `} />
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
                                (requestPaymentActionSaved.has(request.id) || !!getRequestFrozenOptions(request.id)) ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id)}
                                    disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Εγκρίνω Συνδρομή</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.id)}
                                    disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                  >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        <span>Απορρίπτω Συνδρομή</span>
                                  </button>
                                </div>
                                ) : (
                                  <div className="max-w-[280px] text-right">
                                    <div className="inline-flex items-start bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs">
                                      <span className="mr-2">🔒</span>
                                      <span>
                                        Για να ενεργοποιηθούν τα κουμπιά «Εγκρίνω Συνδρομή / Απορρίπτω Συνδρομή»,
                                        εκτελέστε πρώτα ενέργεια πληρωμής (Έγκριση/Απόρριψη/Αναμονή) και πατήστε «Αποθήκευση Program Options».
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                              
                              {/* Για αιτήματα με δόσεις που έχουν ήδη εγκριθεί/απορριφθεί, δείξε μόνο το status */}
                              {(request.status === 'approved' || request.status === 'rejected') && request.has_installments && (
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${request.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${request.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                                    {request.status === 'approved' ? '✅ Εγκεκριμένο' : '❌ Απορριφθέν'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    (Διαχείριση δόσεων διαθέσιμη)
                                  </span>
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
                            (request.status === 'rejected' && isRequestPending(request.id)) ||
                            (request.has_installments && request.status === 'approved')) && (
                          <div className={`border-t border-slate-200 ${isRequestPending(request.id) ? 'bg-yellow-50' : 'bg-slate-50'}`}>
                            <div className="p-6 sm:p-7">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${isRequestPending(request.id) ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                                    <Settings className={`h-5 w-5 ${isRequestPending(request.id) ? 'text-yellow-600' : 'text-slate-600'}`} />
                                  </div>
                                  <h5 className={`text-xl font-bold ${isRequestPending(request.id) ? 'text-yellow-800' : 'text-slate-800'} flex items-center`}>
                                    🎛️ Επιλογές Προγράμματος
                                  </h5>
                                </div>
                                {isRequestPending(request.id) && (
                                  <span className="px-3 py-1 rounded-full bg-yellow-200 text-yellow-900 text-xs font-semibold">🔒 Κλειδωμένο</span>
                                )}
                              </div>
                            
                            {/* Program Options Section */}
                            <div className="space-y-4">
                              {/* Old Members, First 150 Members, and Kettlebell Points */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Old Members - Show also for Pilates */}
                                {(
                                <div className={`p-3 rounded-xl border-2 ${isRequestPending(request.id) ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                                  <button
                                    onClick={() => {
                                      if (isRequestPending(request.id)) {
                                        toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                        return;
                                      }
                                      handleRequestOptionChange(request.id, 'oldMembers', !selectedRequestOptions[request.id]?.oldMembers);
                                    }}
                                    className={`w-full p-3 rounded-full text-left transition-colors ${
                                      selectedRequestOptions[request.id]?.oldMembers || getRequestFrozenOptions(request.id)?.oldMembers
                                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                        : isRequestPending(request.id)
                                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                        : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200'
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

                                {/* First 150 Members - Only show when Old Members is selected AND not used - Show also for Pilates */}
                                {(
                                  (() => {
                                    const hasOldMembersSelected = selectedRequestOptions[request.id]?.oldMembers || getRequestFrozenOptions(request.id)?.oldMembers;
                                    const hasFirst150Used = selectedRequestOptions[request.id]?.first150Members === false || getRequestFrozenOptions(request.id)?.first150Members === false;
                                    return hasOldMembersSelected && !hasFirst150Used;
                                  })() && (
                                  <div className={`p-3 rounded-xl border-2 ${isRequestPending(request.id) ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                                    {/* Info text above the button */}
                                    <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                                      <span className="font-medium">ℹ️ Πληροφορίες:</span> Ισχύει μόνο για τα πρώτα 150 παλιά μέλη του γυμναστηρίου με τιμή 45€ ετήσιος (προσφορά), τα οποία εμφανίζονται στην καρτέλα Ταμείο
                                    </div>
                                    
                                    <button
                                      onClick={() => {
                                        if (isRequestPending(request.id)) {
                                          toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                          return;
                                        }
                                        
                                        setSelectedRequestOptions(prev => {
                                          const newOptions = { ...prev };
                                          const newFirst150 = !newOptions[request.id]?.first150Members;
                                          newOptions[request.id] = {
                                            ...newOptions[request.id],
                                            first150Members: newFirst150,
                                            // When first150Members is selected, automatically set cash to 45 and lock POS
                                            cash: newFirst150 ? true : newOptions[request.id]?.cash || false,
                                            cashAmount: newFirst150 ? 45 : newOptions[request.id]?.cashAmount,
                                            pos: newFirst150 ? false : newOptions[request.id]?.pos || false,
                                            posAmount: newFirst150 ? 0 : newOptions[request.id]?.posAmount
                                          };
                                          return newOptions;
                                        });
                                      }}
                                    className={`w-full px-4 py-3 rounded-full font-semibold transition-all duration-200 relative shadow ${
                                        selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members
                                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                          : 'bg-blue-500 text-white hover:bg-blue-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-center space-x-2">
                                        <span>🏆 Πρώτα 150 Μέλη</span>
                                        {(selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) && (
                                          <span className="text-orange-200">✓</span>
                                        )}
                                        {isRequestPending(request.id) && (
                                          <span className="text-yellow-600">🔒</span>
                                        )}
                                      </div>
                                    </button>
                                  </div>
                                  )
                                )}

                                {/* Kettlebell Points - Show also for Pilates */}
                                {(
                                <div className={`p-3 rounded-xl border-2 ${isRequestPending(request.id) ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
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
                              <div className="bg-white rounded-2xl p-4 border-2 border-slate-100">
                                <div className="flex items-center space-x-2 mb-4">
                                  <span className="text-2xl">💳</span>
                                  <h3 className="text-lg font-bold text-slate-800">SECTION ΠΛΗΡΩΜΩΝ</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Cash Payment */}
                                  <div className={`p-3 rounded-xl border-2 ${isRequestPending(request.id) ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                                    <button
                                      onClick={() => {
                                        if (isRequestPending(request.id)) {
                                          toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                          return;
                                        }
                                        // Block changes if First 150 Members is selected
                                        if (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) {
                                          toast('Το Μετρητά είναι κλειδωμένο όταν είναι επιλεγμένο το "Πρώτα 150 Μέλη"', { icon: '🔒' });
                                          return;
                                        }
                                        handleRequestOptionChange(request.id, 'cash', !selectedRequestOptions[request.id]?.cash);
                                      }}
                                      className={`w-full p-3 rounded-full text-left transition-colors ${
                                        (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members)
                                          ? 'bg-gray-100 text-gray-500 border-2 border-gray-300 cursor-not-allowed'
                                          : selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash
                                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                          : isRequestPending(request.id)
                                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                              : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200'
                                      }`}
                                      disabled={isRequestPending(request.id) || (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                          {isRequestPending(request.id) && '🔒 '}
                                          {(selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) && '🔒 '}
                                          💰 Μετρητά
                                        </span>
                                        {(selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash) && 
                                         !(selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) && (
                                          <span className="text-green-600">✓</span>
                                        )}
                                      </div>
                                    </button>
                                    
                                    {(selectedRequestOptions[request.id]?.cash || getRequestFrozenOptions(request.id)?.cash) && 
                                     !(selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) && (
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
                                  <div className={`p-3 rounded-xl border-2 ${isRequestPending(request.id) ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                                    <button
                                      onClick={() => {
                                        if (isRequestPending(request.id)) {
                                          toast('Οι επιλογές είναι παγωμένες - αλλάξτε status για να τις τροποποιήσετε', { icon: '🔒' });
                                          return;
                                        }
                                        // Block changes if First 150 Members is selected
                                        if (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) {
                                          toast('Το POS είναι κλειδωμένο όταν είναι επιλεγμένο το "Πρώτα 150 Μέλη"', { icon: '🔒' });
                                          return;
                                        }
                                        handleRequestOptionChange(request.id, 'pos', !selectedRequestOptions[request.id]?.pos);
                                      }}
                                      className={`w-full p-3 rounded-full text-left transition-colors ${
                                        selectedRequestOptions[request.id]?.pos || getRequestFrozenOptions(request.id)?.pos
                                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                          : isRequestPending(request.id)
                                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                                          : (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members)
                                          ? 'bg-gray-100 text-gray-500 border-2 border-gray-300 cursor-not-allowed'
                                          : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200'
                                      }`}
                                      disabled={isRequestPending(request.id) || (selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                          {isRequestPending(request.id) && '🔒 '}
                                          {(selectedRequestOptions[request.id]?.first150Members || getRequestFrozenOptions(request.id)?.first150Members) && '🔒 '}
                                          💳 POS
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
                                          className={`mt-2 w-full px-3 py-1 text-sm rounded-full ${
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

                              {/* Installments Management - Eligible packages with installments */}
                              {request.has_installments && isInstallmentsEligible(request.package?.name || '', request.duration_type as any) && (
                              <div className={`col-span-2 p-4 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-orange-50 border-orange-200'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <span className="text-2xl">💳</span>
                                  <h4 className="text-lg font-semibold text-orange-800">
                                    {isRequestPending(request.id) && '🔒 '}Διαχείριση Δόσεων
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
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1Amount || '' : selectedRequestOptions[request.id]?.installment1Amount || request.installment_1_amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment1Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 1)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 1)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment1PaymentMethod || request.installment_1_payment_method || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment1PaymentMethod', e.target.value);
                                        }}
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 1)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 1)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
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
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment1DueDate || '' : selectedRequestOptions[request.id]?.installment1DueDate || request.installment_1_due_date || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment1DueDate', e.target.value);
                                          }}
                                          disabled={isRequestPending(request.id) || isInstallmentLocked(request, 1)}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : isInstallmentLocked(request, 1)
                                              ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                        />
                                        <div className="mt-2 flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={isInstallmentLocked(request, 1)}
                                            onChange={() => handleInstallmentLockClick(request.id, 1)}
                                            className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                                            disabled={isRequestPending(request.id)}
                                          />
                                          <span className="text-xs text-gray-600">Κλείδωμα Δόσης</span>
                                        </div>
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
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2Amount || '' : selectedRequestOptions[request.id]?.installment2Amount || request.installment_2_amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment2Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 2)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 2)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment2PaymentMethod || request.installment_2_payment_method || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment2PaymentMethod', e.target.value);
                                        }}
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 2)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 2)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
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
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment2DueDate || '' : selectedRequestOptions[request.id]?.installment2DueDate || request.installment_2_due_date || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment2DueDate', e.target.value);
                                          }}
                                          disabled={isRequestPending(request.id) || isInstallmentLocked(request, 2)}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : isInstallmentLocked(request, 2)
                                              ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                        />
                                        <div className="mt-2 flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={isInstallmentLocked(request, 2)}
                                            onChange={() => handleInstallmentLockClick(request.id, 2)}
                                            className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                                            disabled={isRequestPending(request.id)}
                                          />
                                          <span className="text-xs text-gray-600">Κλείδωμα Δόσης</span>
                                        </div>
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
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3Amount || '' : selectedRequestOptions[request.id]?.installment3Amount || request.installment_3_amount || ''}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment3Amount', e.target.value);
                                        }}
                                        placeholder="Ποσό"
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 3)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                                            ? 'bg-red-50 border-red-300 cursor-not-allowed text-red-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
                                      />
                                      <select
                                        value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3PaymentMethod || 'cash' : selectedRequestOptions[request.id]?.installment3PaymentMethod || request.installment_3_payment_method || 'cash'}
                                        onChange={(e) => {
                                          if (isRequestPending(request.id)) return;
                                          handleRequestOptionChange(request.id, 'installment3PaymentMethod', e.target.value);
                                        }}
                                        disabled={isRequestPending(request.id) || isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                                        className={`w-full p-2 border rounded-lg ${
                                          isRequestPending(request.id)
                                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                            : isInstallmentLocked(request, 3)
                                            ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                            : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                                            ? 'bg-red-50 border-red-300 cursor-not-allowed text-red-600'
                                            : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                        }`}
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
                                          value={isRequestPending(request.id) ? getRequestFrozenOptions(request.id)?.installment3DueDate || '' : selectedRequestOptions[request.id]?.installment3DueDate || request.installment_3_due_date || ''}
                                          onChange={(e) => {
                                            if (isRequestPending(request.id)) return;
                                            handleRequestOptionChange(request.id, 'installment3DueDate', e.target.value);
                                          }}
                                          disabled={isRequestPending(request.id) || isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                                          className={`w-full p-2 border rounded-lg text-sm ${
                                            isRequestPending(request.id)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : isInstallmentLocked(request, 3)
                                              ? 'bg-orange-50 border-orange-300 cursor-not-allowed text-orange-600'
                                              : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                                              ? 'bg-red-50 border-red-300 cursor-not-allowed text-red-600'
                                              : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                          }`}
                                        />
                                        <div className="mt-2 flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={isInstallmentLocked(request, 3)}
                                              onChange={() => handleInstallmentLockClick(request.id, 3)}
                                              disabled={selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted || isRequestPending(request.id)}
                                              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                                            />
                                            <span className="text-xs text-gray-600">Κλείδωμα Δόσης</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteThirdInstallmentClick(request.id)}
                                            disabled={isRequestPending(request.id)}
                                            className={`text-xs px-2 py-1 rounded-md ${isRequestPending(request.id) ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                          >
                                            Διαγραφή 3ης Δόσης
                                          </button>
                                        </div>
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
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'approved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                ✅ Έγκριση Πληρωμής
                              </button>
                              <button
                                onClick={() => handleRequestProgramApprovalChange(request.id, 'rejected')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                ❌ Απόρριψη Πληρωμής
                              </button>
                              <button
                                onClick={() => handleRequestProgramApprovalChange(request.id, 'pending')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                  requestProgramApprovalStatus[request.id] === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                              >
                                ⏳ Αναμονή/Πάγωμα Πληρωμής
                              </button>
                              <button
                                onClick={() => handleSaveRequestProgramOptions(request.id)}
                                disabled={loading || requestProgramApprovalStatus[request.id] === 'none'}
                                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
              )}
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

          {/* Users Information Tab */}
          {activeTab === 'users-information' && !loading && (
            <UsersInformation />
          )}

          {/* Banners Tab */}
          {activeTab === 'banners' && !loading && (
            <AdminBannersManager />
          )}

          {/* Workout Programs Tab */}
          {activeTab === 'workout-programs' && !loading && (
            <WorkoutProgramsManager />
          )}

          {/* Error Fixing Tab */}
          {activeTab === 'error-fixing' && !loading && (
            <ErrorFixing />
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
                    
                    {/* Search + Date Range */}
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
                      <div className="hidden sm:flex items-center space-x-2 ml-2">
                        <div className="relative">
                          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={kettlebellFromDate}
                            onChange={(e) => setKettlebellFromDate(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <span className="text-gray-500 text-sm">—</span>
                        <div className="relative">
                          <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={kettlebellToDate}
                            onChange={(e) => setKettlebellToDate(e.target.value)}
                            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => { setKettlebellCurrentPage(1); loadKettlebellPointsData(); }}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                        >
                          Φίλτρο
                        </button>
                      </div>
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
                      {/* Show search results if searching, otherwise show paginated users */}
                      {(kettlebellSearchTerm ? kettlebellSearchResults : kettlebellPaginatedUsers).map((user, index) => (
                        <div 
                          key={user.user_id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-400"
                          onClick={() => loadUserKettlebellPointsDetails(user)}
                        >
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
                                  kettlebellStartIndex + index + 1
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
                      
                      {/* Pagination Controls - only show when not searching and there are multiple pages */}
                      {!kettlebellSearchTerm && kettlebellTotalPages > 1 && (
                        <div className="flex items-center justify-between py-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            Εμφανίζονται {kettlebellStartIndex + 1}-{Math.min(kettlebellEndIndex, kettlebellSummary.length)} από {kettlebellSummary.length} χρήστες
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleKettlebellPreviousPage}
                              disabled={kettlebellCurrentPage === 1}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ← Προηγούμενη
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-700">
                              Σελίδα {kettlebellCurrentPage} από {kettlebellTotalPages}
                            </span>
                            <button
                              onClick={handleKettlebellNextPage}
                              disabled={kettlebellCurrentPage === kettlebellTotalPages}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Επόμενη →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Kettlebell Points User Details Modal */}
          {showKettlebellDetailsModal && selectedKettlebellUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Αναλυτικό Ιστορικό Kettlebell Points</h3>
                    <p className="text-sm text-orange-100 mt-1">
                      {selectedKettlebellUser.user_name} ({selectedKettlebellUser.user_email})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowKettlebellDetailsModal(false);
                      setSelectedKettlebellUser(null);
                      setUserKettlebellPointsDetails([]);
                    }}
                    className="text-white hover:bg-orange-700 rounded-lg p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingKettlebellDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                      <span className="ml-3 text-gray-600">Φόρτωση λεπτομερειών...</span>
                    </div>
                  ) : userKettlebellPointsDetails.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600">Δεν υπάρχουν καταγραφές βαθμών για αυτόν τον χρήστη</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-orange-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Συνολικοί βαθμοί:</span>
                          <span className="text-2xl font-bold text-orange-600">{selectedKettlebellUser.total_points}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-gray-700">Συνολικές καταγραφές:</span>
                          <span className="text-lg font-semibold text-gray-900">{userKettlebellPointsDetails.length}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Ιστορικό Προσθήκης Βαθμών:</h4>
                        {userKettlebellPointsDetails.map((point) => (
                          <div 
                            key={point.id} 
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="bg-orange-100 rounded-full p-3">
                                  <Award className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    +{point.points} {point.points === 1 ? 'βαθμός' : 'βαθμοί'}
                                  </p>
                                  {point.program_id && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Program ID: {point.program_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(point.created_at).toLocaleDateString('el-GR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(point.created_at).toLocaleTimeString('el-GR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowKettlebellDetailsModal(false);
                      setSelectedKettlebellUser(null);
                      setUserKettlebellPointsDetails([]);
                    }}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Κλείσιμο
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Other tabs placeholder */}
          {activeTab !== 'membership-packages' && activeTab !== 'ultimate-subscriptions' && activeTab !== 'pilates-schedule' && activeTab !== 'kettlebell-points' && activeTab !== 'cash-register' && !loading && (
            <div className="text-center py-8 text-gray-500">
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


               {/* Enhanced User Selection */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                 <label className="block text-lg font-bold text-blue-800 mb-4 flex items-center">
                   👤 Επιλογή Χρήστη
                     <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                       Selected: {newCode.selectedUserId ? '✅' : '❌'}
                     </span>
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
                                 newCode.selectedUserId === user.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                               }`}
                               onClick={() => {
                                   setNewCode({ ...newCode, selectedUserId: user.id });
                               }}
                             >
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
                 {newCode.selectedUserId && (
                   <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                     <div className="flex items-center">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                         <span className="text-white text-sm">✓</span>
                       </div>
                       <div className="flex-1">
                         <div className="text-sm font-bold text-green-800">
                           ✅ Επιλεγμένος:
                         </div>
                           <div className="text-xs text-green-600">
                             {allUsers.find(u => u.id === newCode.selectedUserId)?.firstName} {allUsers.find(u => u.id === newCode.selectedUserId)?.lastName} ({allUsers.find(u => u.id === newCode.selectedUserId)?.email})
                           </div>
                           {userType === 'paspartu' && selectedUserDeposit !== null && (
                             <div className="mt-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-300">
                               💰 Deposit: <strong>{selectedUserDeposit.remaining}</strong> μαθήματα διαθέσιμα (Σύνολο: {selectedUserDeposit.total}, Χρησιμοποιημένα: {selectedUserDeposit.used})
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
              </div>


            
              {/* Excel-Style Προσωποποιημένο Πρόγραμμα */}
              {newCode.selectedUserId && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 sm:p-6 border border-orange-200">
                 <div className="flex items-center justify-between mb-4 sm:mb-6">
                   <h4 className="text-lg sm:text-xl font-bold text-orange-800 flex items-center">
                   🏋️‍♂️ Προσωποποιημένο Πρόγραμμα 
                 </h4>
                   <div className="text-sm px-3 py-2 rounded-lg text-gray-600 bg-gray-100">
                     📊 Σύνολο: {getCurrentSessions().length} σεσίας
                   </div>
                 </div>

                 {/* Session Filter Toggle Buttons */}
                 <div className="mb-4 sm:mb-6">
                   <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium text-gray-700">Φίλτρο Σεσιών:</span>
                     </div>
                     <div className="flex space-x-2">
                       <button
                         onClick={() => {
                           setSessionFilter('new');
                           // Reset to default new session when switching to new
                           if (programSessions.length === 0) {
                             setProgramSessions([{ 
                               id: 'tmp-1', 
                               date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`, 
                               startTime: '18:00', 
                               type: 'personal', 
                               trainer: 'Mike', 
                               room: 'Αίθουσα Mike', 
                               group: '2ΑτομαGroup', 
                               notes: '' 
                             }]);
                           }
                         }}
                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                           sessionFilter === 'new'
                             ? 'bg-blue-500 text-white shadow-lg'
                             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                         }`}
                       >
                         🆕 Νέες Σεσίες
                       </button>
                       <button
                         onClick={() => {
                           setSessionFilter('existing');
                           // Load existing sessions when switching to existing
                           if (newCode.selectedUserId) {
                             loadExistingSessions(newCode.selectedUserId);
                           }
                         }}
                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                           sessionFilter === 'existing'
                             ? 'bg-green-500 text-white shadow-lg'
                             : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                         }`}
                         disabled={!newCode.selectedUserId}
                       >
                         📚 Υπάρχουσες Σεσίες
                         {loadingExistingSessions && (
                           <span className="ml-2">⏳</span>
                         )}
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

                 {/* Excel-Style Table */}
                 <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
                   {/* Table Header */}
                   <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-400">
                     <div className="grid gap-0 text-sm font-bold text-gray-800 grid-cols-6">
                       <div className="col-span-1 text-center py-3 border-r border-gray-300 bg-gray-200">#</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">📅 Ημερομηνία</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">🕐 Έναρξη</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">💪 Τύπος</div>
                       <div className="col-span-1 py-3 px-2 border-r border-gray-300">🏠 Αίθουσα</div>
                       <div className="col-span-1 py-3 px-2">👨‍🏫 Προπονητής</div>
                           </div>
                         </div>

                   {/* Table Body */}
                   <div className="divide-y divide-gray-300">
                     {getCurrentSessions().map((session, idx) => (
                       <div key={session.id} className="grid gap-0 hover:bg-blue-50 transition-colors grid-cols-6">
                         {/* Row Number & Actions */}
                         <div className="col-span-1 flex items-center justify-center space-x-2 py-3 border-r border-gray-300 bg-gray-50">
                           <span className="text-sm font-bold text-gray-700">{idx + 1}</span>
                           <div className="flex flex-col space-y-1">
                           <button
                             onClick={() => updateCurrentSessions(getCurrentSessions().filter((_, i) => i !== idx))}
                               className="text-red-600 hover:text-red-800 p-1 text-xs bg-red-100 rounded hover:bg-red-200"
                               title="Διαγραφή Σέσιας"
                           >
                               <Trash2 className="h-3 w-3" />
                           </button>
                             <button
                               onClick={() => {
                                 const currentSessions = getCurrentSessions();
                                 const newSession = { ...session, id: `tmp-${Date.now()}` };
                                 updateCurrentSessions([...currentSessions.slice(0, idx + 1), newSession, ...currentSessions.slice(idx + 1)]);
                               }}
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
                             onChange={(e) => {
                               const currentSessions = getCurrentSessions();
                               updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, date: e.target.value } : ps));
                             }}
                             lang="el"
                           />
                         </div>

                         {/* Start Time */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <input 
                             type="time" 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.startTime}
                             onChange={(e) => {
                               const currentSessions = getCurrentSessions();
                               updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, startTime: e.target.value } : ps));
                             }}
                           />
                         </div>

                         {/* Training Type */}
                         <div className="col-span-1 p-2 border-r border-gray-300">
                           <select 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.type}
                             onChange={(e) => {
                               const currentSessions = getCurrentSessions();
                               updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, type: e.target.value as any } : ps));
                             }}
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
                             onChange={(e) => {
                               const currentSessions = getCurrentSessions();
                               updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, room: e.target.value } : ps));
                             }}
                           >
                             <option value="Αίθουσα Mike">Αίθουσα Mike</option>
                             <option value="Αίθουσα Jordan">Αίθουσα Jordan</option>
                           </select>
                         </div>


                         {/* Trainer */}
                         <div className="col-span-1 p-2">
                           <select 
                             className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                             value={session.trainer}
                             onChange={(e) => {
                               const currentSessions = getCurrentSessions();
                               updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, trainer: e.target.value as TrainerName } : ps));
                             }}
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
                         const currentSessions = getCurrentSessions();
                        updateCurrentSessions([...currentSessions, {
                          id: `tmp-${Date.now()}`,
                          date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`, 
                          startTime: '19:00', 
                          type: 'personal', 
                          trainer: 'Mike', 
                          room: 'Αίθουσα Mike', 
                          group: '2ΑτομαGroup',
                          notes: currentSessions[0]?.notes || ''
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
                         const currentSessions = getCurrentSessions();
                         if (trainingType === 'combination' && currentSessions.length >= combinationPersonalSessions) {
                           toast.error(`Για συνδυασμένο πρόγραμμα μπορείτε να έχετε μέγιστο ${combinationPersonalSessions} ατομικές σεσίες`);
                           return;
                         }
                         
                         const newSession = {
                           id: `tmp-${Date.now()}`,
                           date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`,
                           startTime: '19:00',
                           type: 'personal' as const,
                           trainer: 'Mike' as TrainerName,
                           room: 'Αίθουσα Mike',
                           group: '2ΑτομαGroup' as const,
                           notes: currentSessions[0]?.notes || ''
                         };
                         updateCurrentSessions([...currentSessions, newSession]);
                       }}
                     >
                       📋 Αντιγραφή Τελευταίας
                     </button>
                     {getCurrentSessions().length > 1 && (
                       <button 
                         type="button" 
                         className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center"
                         onClick={() => {
                           const currentSessions = getCurrentSessions();
                           updateCurrentSessions(currentSessions.slice(0, -1));
                         }}
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
                  console.log('[AdminPanel] Button clicked - selectedUserId:', newCode.selectedUserId);
                  createPersonalTrainingProgram();
                }}
                disabled={!newCode.selectedUserId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-500"
                title={!newCode.selectedUserId ? 'Παρακαλώ επιλέξτε χρήστη' : 'Δημιουργία Προγράμματος'}
              >
                ✅ Δημιουργία Προγράμματος
                {!newCode.selectedUserId && (
                  <span className="ml-2 text-xs opacity-75">(Επιλέξτε χρήστη)</span>
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Confirmation Popup */}
      {showLockConfirmation && pendingLockRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md mx-4 border border-gray-600 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Κλείδωμα Δόσης
              </h3>
              <p className="text-gray-300 mb-8 text-lg">
                Είστε σίγουροι ότι θέλετε να κλειδώσετε την {pendingLockRequest.installmentNumber}η δόση; 
                Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelInstallmentLock}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={confirmInstallmentLock}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                >
                  Κλείδωμα
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Third Installment Confirmation Popup */}
      {showDeleteConfirmation && pendingDeleteRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md mx-4 border border-gray-600 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trash2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Διαγραφή 3ης Δόσης
              </h3>
              <p className="text-gray-300 mb-8 text-lg">
                Είστε σίγουροι ότι θέλετε να διαγράψετε την 3η δόση; 
                Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelDeleteThirdInstallment}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={confirmDeleteThirdInstallment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium"
                >
                  Διαγραφή
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
      {showUltimateTab && activeTab === 'ultimate-subscriptions' && !loading && (
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
              selectedRequestOptions={selectedUltimateRequestOptions}
              handleRequestOptionChange={handleUltimateRequestOptionChange}
              updateInstallmentAmounts={updateInstallmentAmounts}
              deleteUltimateRequest={deleteUltimateRequest}
              loadUltimateRequests={loadUltimateRequests}
              handleApproveRequest={handleUltimateApproveRequest}
              handleRejectRequest={handleUltimateRejectRequest}
              loading={loading}
              requestProgramApprovalStatus={requestProgramApprovalStatus}
              handleRequestProgramApprovalChange={handleRequestProgramApprovalChange}
              handleSaveRequestProgramOptions={handleSaveUltimateRequestProgramOptions}
              handleUnfreezeRequestProgramOptions={handleUnfreezeUltimateRequestProgramOptions}
              requestPendingUsers={requestPendingUsers}
              requestFrozenOptions={requestFrozenOptions}
              ultimateRequestFrozenWithPending={ultimateRequestFrozenWithPending}
            />
          </div>
        </ErrorBoundary>
      )}

    </div>
  );
};

export default AdminPanel;

