import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  User,
  Calendar,
  Shield,
  CreditCard,
  Clock,
  Euro,
  Check,
  X,
  Save,
  Loader2,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/config/supabase';
import toast from 'react-hot-toast';
import { 
  getMembershipRequests,
  getMembershipRequestsWithLockedInstallments,
  approveMembershipRequest,
  rejectMembershipRequest,
  formatPrice,
  getDurationLabel
} from '@/utils/membershipApi';
import { 
  markOldMembersUsed, 
  saveKettlebellPoints
} from '@/utils/programOptionsApi';
import { createUserGroupSessions } from '@/utils/groupSessionsApi';
import {
  saveSecretaryCashTransaction,
  saveSecretaryKettlebellPoints,
  saveSecretaryOldMembersUsage
} from '@/utils/secretaryProgramOptionsApi';
import { 
  saveProgramApprovalState
} from '@/utils/programApprovalApi';
import { MembershipRequest } from '@/types';
import UltimateInstallmentsTab from '@/components/secretary/UltimateInstallmentsTab';
import SecretaryUsersInformation from '@/components/secretary/SecretaryUsersInformation';
import GroupTrainingCalendar from '@/components/admin/GroupTrainingCalendar';
import GroupAssignmentInterface from '@/components/admin/GroupAssignmentInterface';

// Constants for the modal - moved to avoid duplication
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { Result, Exception } from '@zxing/library';

interface ScanResult {
  success: boolean;
  message: string;
  userData?: {
    id: string;
    email: string;
    name: string;
    category: string;
  };
  reason?: string;
}

// Personal Training Types
interface PersonalTrainingSchedule {
  id: string;
  userId: string;
  month: number;
  year: number;
  scheduleData: {
    sessions: PersonalTrainingSession[];
    notes?: string;
  };
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}

interface PersonalTrainingSession {
  id: string;
  date: string;
  startTime: string;
  type: 'personal' | 'kickboxing' | 'combo';
  trainer: string;
  notes?: string;
}

interface UserWithPersonalTraining {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  personalTrainingCode?: string;
}

type TrainerName = 'Mike' | 'Jordan' | 'Alex' | 'Sarah';

const AVAILABLE_TRAINERS: TrainerName[] = ['Mike', 'Jordan', 'Alex', 'Sarah'];
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

const days = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];

const SecretaryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'membership-requests' | 'ultimate-installments' | 'users-information' | 'personal-training'>('scanner');
  
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
    installment1Locked?: boolean;
    installment2Locked?: boolean;
    installment3Locked?: boolean;
    deleteThirdInstallment?: boolean;
  }}>({});
  const [requestProgramApprovalStatus, setRequestProgramApprovalStatus] = useState<{[requestId: string]: 'none' | 'approved' | 'rejected' | 'pending'}>({});
  
  // Personal Training state variables
  const [selectedUser, setSelectedUser] = useState<UserWithPersonalTraining | null>(null);
  const [personalTrainingSchedule, setPersonalTrainingSchedule] = useState<PersonalTrainingSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserWithPersonalTraining[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    selectedUserId: '' 
  });
  const [trainingType, setTrainingType] = useState<'individual' | 'group' | 'combination'>('individual');
  const [userType, setUserType] = useState<'personal' | 'paspartu'>('personal');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<'2' | '3' | '6' | null>(null);
  const [weeklyFrequency, setWeeklyFrequency] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [combinationPersonalSessions, setCombinationPersonalSessions] = useState(1);
  const [combinationGroupSessions, setCombinationGroupSessions] = useState(2);
  const [showGroupAssignmentManager, setShowGroupAssignmentManager] = useState(false);
  const [groupAssignmentUser, setGroupAssignmentUser] = useState<UserWithPersonalTraining | null>(null);
  const [groupAssignmentProgramId, setGroupAssignmentProgramId] = useState<string | null>(null);
  const [selectedGroupSlots, setSelectedGroupSlots] = useState<{[userId: string]: any[]}>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchMode, setUserSearchMode] = useState<'dropdown' | 'search'>('dropdown');
  const [programStatusSearchTerm] = useState('');
  const [statusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [groupCalendarEnabled] = useState(true);

  // Open Gym state variables
  const [openGymSelectedUserId, setOpenGymSelectedUserId] = useState('');
  const [openGymUserSearchMode, setOpenGymUserSearchMode] = useState<'dropdown' | 'search'>('dropdown');
  const [openGymUserSearchTerm, setOpenGymUserSearchTerm] = useState('');
  const [openGymKettlebellPoints, setOpenGymKettlebellPoints] = useState('');
  const [openGymStatus, setOpenGymStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Additional state variables for full modal functionality
  const [usedOldMembers, setUsedOldMembers] = useState<Set<string>>(new Set());
  const [localUsedOldMembers, setLocalUsedOldMembers] = useState<Set<string>>(new Set());
  const [selectedOptions, setSelectedOptions] = useState<{[userId: string]: any}>({});
  const [kettlebellPoints, setKettlebellPoints] = useState('');
  const [showCashInput, setShowCashInput] = useState(false);
  const [showPosInput, setShowPosInput] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [programApprovalStatus, setProgramApprovalStatus] = useState<'none' | 'approved' | 'rejected' | 'pending'>('none');
  const [loading, setLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'new' | 'existing'>('new');
  const [programSessions, setProgramSessions] = useState<any[]>([]);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);
  const [loadingExistingSessions, setLoadingExistingSessions] = useState(false);
  const [paginatedUsers, setPaginatedUsers] = useState<UserWithPersonalTraining[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [requestPendingUsers, setRequestPendingUsers] = useState<Set<string>>(new Set());
  const [requestFrozenOptions, setRequestFrozenOptions] = useState<{[requestId: string]: any}>({});
  
  // Installment state variables
  const [installmentLoading, setInstallmentLoading] = useState(false);
  const [installmentRequests, setInstallmentRequests] = useState<MembershipRequest[]>([]);
  
  

  // Ultimate Installments state
  const [ultimateRequests, setUltimateRequests] = useState<MembershipRequest[]>([]);
  const [ultimateLoading, setUltimateLoading] = useState(false);
  const [ultimateSearchTerm, setUltimateSearchTerm] = useState('');

  const webcamRef = useRef<Webcam>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Helper functions for membership request pending users
  const isRequestPending = (requestId: string) => {
    return requestPendingUsers.has(requestId);
  };

  const getRequestFrozenOptions = (requestId: string) => {
    return requestFrozenOptions[requestId] || null;
  };

  // Check if user is secretary
  useEffect(() => {
    console.log('🔍 [SecretaryDashboard] User role check:', user?.role);
    if (user && (user.role as string) !== 'secretary') {
      console.log('❌ [SecretaryDashboard] User is not secretary, showing error');
      toast.error('Δεν έχετε δικαίωμα πρόσβασης σε αυτή τη σελίδα');
      return;
    }
    console.log('✅ [SecretaryDashboard] User is secretary, proceeding');
  }, [user]);

  // Calculate monthly total when weekly frequency changes
  useEffect(() => {
    if (weeklyFrequency) {
      setMonthlyTotal(weeklyFrequency * 4);
    } else {
      setMonthlyTotal(0);
    }
  }, [weeklyFrequency]);

  // Load recent scans
  useEffect(() => {
    loadRecentScans();
  }, []);

  // Load membership requests when tab is active
  useEffect(() => {
    if (activeTab === 'membership-requests') {
      loadMembershipRequests();
    } else if (activeTab === 'ultimate-installments') {
      loadUltimateRequests();
    } else if (activeTab === 'personal-training') {
      // Clear existing users first to force reload
      setAllUsers([]);
      // Small delay to ensure state is cleared
      setTimeout(() => {
      loadAllUsers();
      }, 100);
    }
    // Note: users-information tab loads its own data
  }, [activeTab]);

  // Debug video container rendering
  useEffect(() => {
    if (isScanning) {
      console.log('🎬 [UI] Video container rendering - isScanning:', isScanning, 'isVideoReady:', isVideoReady, 'cameraError:', cameraError);
      console.log('🎬 [UI] webcamRef.current:', webcamRef.current);
    }
  }, [isScanning, isVideoReady, cameraError]);

  const loadRecentScans = async () => {
    try {
      // First get the scan logs
      const { data: scanLogs, error: scanError } = await supabase
        .from('scan_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (scanError) throw scanError;

      // Then get user profiles for each scan
      const userIds = scanLogs?.map(scan => scan.user_id) || [];
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (userError) throw userError;

      // Combine the data
      const combinedData = scanLogs?.map(scan => ({
        ...scan,
        user_profiles: userProfiles?.find(user => user.user_id === scan.user_id)
      })) || [];

      setRecentScans(combinedData);
    } catch (error) {
      console.error('Error loading recent scans:', error);
    }
  };

  // ===== MEMBERSHIP REQUESTS FUNCTIONS =====

  const loadMembershipRequests = async () => {
    try {
      setLoading(true);
      const requests = await getMembershipRequests();
      setMembershipRequests(requests);
    } catch (error) {
      console.error('Error loading membership requests:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων');
    } finally {
      setLoading(false);
    }
  };

  // ===== INSTALLMENTS FUNCTIONS =====

  const loadInstallmentRequests = async () => {
    try {
      setInstallmentLoading(true);
      const requests = await getMembershipRequests();
      // Filter only Ultimate requests with installments
      const installmentRequests = requests.filter(request => 
        request.package?.name === 'Ultimate' && request.has_installments
      );
      setInstallmentRequests(installmentRequests);
    } catch (error) {
      console.error('Error loading installment requests:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων δόσεων');
    } finally {
      setInstallmentLoading(false);
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

      // Handle installment locking using the new database table
      const requestOptions = selectedRequestOptions[requestId];
      if (requestOptions) {
        // Lock installments that were just locked
        // Helper function to validate user ID
        const getValidUserId = (userId: string | undefined) => {
          if (!userId || userId === "00000000-0000-0000-0000-000000000001" || userId === "undefined") {
            return null;
          }
          return userId;
        };

        if (requestOptions.installment1Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              request_id: requestId, 
              installment_num: 1, 
              locked_by_user_id: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 1:', lockError);
          }
        }
        if (requestOptions.installment2Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              request_id: requestId, 
              installment_num: 2, 
              locked_by_user_id: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 2:', lockError);
          }
        }
        if (requestOptions.installment3Locked) {
          const { error: lockError } = await supabase
            .rpc('lock_installment', { 
              request_id: requestId, 
              installment_num: 3, 
              locked_by_user_id: getValidUserId(user?.id) 
            });
          if (lockError) {
            console.error('Error locking installment 3:', lockError);
          }
        }

        // Handle third installment deletion
        if (requestOptions.deleteThirdInstallment) {
          const { error: deleteError } = await supabase
            .rpc('delete_third_installment_permanently', { 
              request_id: requestId, 
              deleted_by_user_id: getValidUserId(user?.id) 
            });
          if (deleteError) {
            console.error('Error deleting third installment:', deleteError);
          }
        }
      }

      const { error } = await supabase
        .from('membership_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Οι δόσεις και ημερομηνίες ενημερώθηκαν επιτυχώς');
      // Reload installment requests
      await loadInstallmentRequests();
    } catch (error) {
      console.error('Error updating installment amounts:', error);
      toast.error('Σφάλμα κατά την ενημέρωση των δόσεων');
    }
  };

  const deleteInstallmentRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('membership_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Το αίτημα δόσεων διαγράφηκε επιτυχώς');
      // Reload installment requests
      await loadInstallmentRequests();
    } catch (error) {
      console.error('Error deleting installment request:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του αιτήματος');
    }
  };

  // ===== ULTIMATE INSTALLMENTS FUNCTIONS =====

  const loadUltimateRequests = async () => {
    try {
      setUltimateLoading(true);
      const requests = await getMembershipRequestsWithLockedInstallments();
      // Filter all Ultimate requests (with and without installments)
      const ultimateRequests = requests.filter(request => 
        request.package?.name === 'Ultimate'
      );
      
      setUltimateRequests(ultimateRequests);
    } catch (error) {
      console.error('Error loading ultimate requests:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των Ultimate αιτημάτων');
    } finally {
      setUltimateLoading(false);
    }
  };

  // ===== PERSONAL TRAINING FUNCTIONS =====

  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, email, first_name, last_name, personal_training_code')
        .order('first_name');

      if (error) {
        console.error('Error loading users:', error);
        toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
        return;
      }

      const users: UserWithPersonalTraining[] = data.map(user => ({
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        personalTrainingCode: user.personal_training_code || null
      }));

      setAllUsers(users);
    } catch (error) {
      console.error('Exception loading users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPersonalTrainingSchedule = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personal_training_schedules')
        .select('id, user_id, month, year, schedule_data, status, created_by, created_at, updated_at, accepted_at, declined_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading schedule for user', userId, error);
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
      console.error('Exception while loading schedule', error);
      toast.error('Σφάλμα κατά τη φόρτωση του προγράμματος');
      setPersonalTrainingSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const addPersonalTrainingSession = () => {
    if (!personalTrainingSchedule) return;

    const newSession: PersonalTrainingSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      type: 'personal',
      trainer: 'Mike',
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

  const updatePersonalTrainingSession = (sessionId: string, field: keyof PersonalTrainingSession, value: string) => {
    if (!personalTrainingSchedule) return;

    const updatedSchedule = {
      ...personalTrainingSchedule,
      scheduleData: {
        ...personalTrainingSchedule.scheduleData,
        sessions: personalTrainingSchedule.scheduleData.sessions.map(session =>
          session.id === sessionId ? { ...session, [field]: value } : session
        )
      }
    };

    setPersonalTrainingSchedule(updatedSchedule);
  };

  const removePersonalTrainingSession = (sessionId: string) => {
    if (!personalTrainingSchedule) return;

    const updatedSchedule = {
      ...personalTrainingSchedule,
      scheduleData: {
        ...personalTrainingSchedule.scheduleData,
        sessions: personalTrainingSchedule.scheduleData.sessions.filter(session => session.id !== sessionId)
      }
    };

    setPersonalTrainingSchedule(updatedSchedule);
  };

  const savePersonalTrainingSchedule = async () => {
    if (!personalTrainingSchedule) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('personal_training_schedules')
        .update({
          schedule_data: personalTrainingSchedule.scheduleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', personalTrainingSchedule.id);

      if (error) {
        console.error('Error saving schedule:', error);
        toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
        return;
      }

      toast.success('Το πρόγραμμα αποθηκεύτηκε επιτυχώς!');
      setEditingSchedule(false);
    } catch (error) {
      console.error('Exception saving schedule:', error);
      toast.error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const isBlockedTestUser = (u: { email?: string | null; personalTrainingCode?: string | null; firstName?: string; lastName?: string }): boolean => {
    const blockedEmails = ['user1@freegym.gr', 'user2@freegym.gr'];
    const blockedCodes = ['PERSONAL2024', 'KICKBOX2024'];
    const byEmail = !!u.email && blockedEmails.includes(u.email);
    const byCode = !!u.personalTrainingCode && blockedCodes.includes(u.personalTrainingCode);
    return byEmail || byCode;
  };

  const deleteUltimateRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('membership_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Το Ultimate αίτημα διαγράφηκε επιτυχώς');
      await loadUltimateRequests();
    } catch (error) {
      console.error('Error deleting ultimate request:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του Ultimate αιτήματος');
    }
  };


  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Find the request to check if it's Ultimate package
      const allRequests = [...membershipRequests, ...ultimateRequests];
      const request = allRequests.find(r => r.id === requestId);
      const isUltimatePackage = request?.package?.name === 'Ultimate';
      
      if (isUltimatePackage) {
        // Handle Ultimate package approval with dual activation
        const { approveUltimateMembershipRequest } = await import('@/utils/membershipApi');
        const success = await approveUltimateMembershipRequest(requestId);
        if (success) {
          toast.success('Το Ultimate αίτημα εγκρίθηκε επιτυχώς! Δημιουργήθηκαν 2 συνδρομές: Pilates + Open Gym');
          if (activeTab === 'ultimate-installments') {
            loadUltimateRequests();
          } else {
            loadMembershipRequests();
          }
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
        if (activeTab === 'ultimate-installments') {
          loadUltimateRequests();
        } else {
          loadMembershipRequests();
        }
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
          kettlebellPoints: requestOptions.kettlebellPoints && requestOptions.kettlebellPoints.trim() !== '' 
            ? parseInt(requestOptions.kettlebellPoints) || 0 
            : 0,
          cashAmount: requestOptions.cashAmount && requestOptions.cashAmount > 0 ? requestOptions.cashAmount : 0,
          posAmount: requestOptions.posAmount && requestOptions.posAmount > 0 ? requestOptions.posAmount : 0,
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
    console.log('User Options received:', userOptions);
    console.log('User ID:', userId);
    
    try {
      // 1. Save Old Members usage if selected
      if (userOptions.oldMembers) {
        const oldMembersSuccess = await saveSecretaryOldMembersUsage(userId, user?.id || '');
        if (oldMembersSuccess) {
          console.log(`[APPROVED] Old Members marked as used for membership request: ${requestId}`);
        } else {
          console.warn(`[APPROVED] Failed to mark Old Members as used for membership request: ${requestId}`);
        }
      }

      // 2. Save Kettlebell Points (handle empty fields as 0)
      const kettlebellPoints = userOptions.kettlebellPoints && userOptions.kettlebellPoints.trim() !== '' 
        ? parseInt(userOptions.kettlebellPoints) || 0 
        : 0;
      if (kettlebellPoints > 0) {
        const kettlebellSuccess = await saveSecretaryKettlebellPoints(
          userId, 
          kettlebellPoints, 
          undefined, // No program_id for now
          user?.id || ''
        );
        
        if (kettlebellSuccess) {
          console.log(`[APPROVED] Kettlebell Points saved for membership request: ${requestId}, Points: ${kettlebellPoints}`);
        } else {
          console.warn(`[APPROVED] Failed to save Kettlebell Points for membership request: ${requestId}`);
        }
      } else {
        console.log(`[APPROVED] Kettlebell Points set to 0 for membership request: ${requestId}`);
      }

      // 3. Save Cash transactions (handle empty fields as 0)
      const cashAmount = userOptions.cashAmount && userOptions.cashAmount > 0 ? userOptions.cashAmount : 0;
      console.log('Checking cash amount:', cashAmount, 'Type:', typeof cashAmount);
      if (cashAmount > 0) {
        console.log('Attempting to save cash transaction...');
        const cashSuccess = await saveSecretaryCashTransaction(
          userId,
          cashAmount,
          'cash',
          undefined,
          user?.id || '',
          'Cash transaction from approved membership request'
        );
        if (cashSuccess) {
          console.log(`[APPROVED] Cash transaction saved for membership request: ${requestId}, Amount: €${cashAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save Cash transaction for membership request: ${requestId}`);
        }
      } else {
        console.log(`[APPROVED] Cash amount set to 0 for membership request: ${requestId}`);
      }

      // 4. Save POS transactions (handle empty fields as 0)
      const posAmount = userOptions.posAmount && userOptions.posAmount > 0 ? userOptions.posAmount : 0;
      console.log('Checking POS amount:', posAmount, 'Type:', typeof posAmount);
      if (posAmount > 0) {
        console.log('Attempting to save POS transaction...');
        const posSuccess = await saveSecretaryCashTransaction(
          userId,
          posAmount,
          'pos',
          undefined,
          user?.id || '',
          'POS transaction from approved membership request'
        );
        if (posSuccess) {
          console.log(`[APPROVED] POS transaction saved for membership request: ${requestId}, Amount: €${posAmount}`);
        } else {
          console.warn(`[APPROVED] Failed to save POS transaction for membership request: ${requestId}`);
        }
      } else {
        console.log(`[APPROVED] POS amount set to 0 for membership request: ${requestId}`);
      }

      toast.success('Έγιναν όλες οι απαραίτητες ενέργειες για το εγκεκριμένο αίτημα!');
    } catch (error) {
      console.error('Error executing approved program actions for membership request:', error);
      toast.error('Σφάλμα κατά την εκτέλεση των ενεργειών');
    }
  };

  const startScanning = () => {
    try {
      console.log('🎥 [Camera] Starting camera initialization...');
      console.log('🎥 [Camera] Current states - isScanning:', isScanning, 'isVideoReady:', isVideoReady, 'cameraError:', cameraError);
      
      setCameraError(null);
      setIsVideoReady(false);
      setIsScanning(true);
      setScanResult(null);
      setShowResult(false);
      
      console.log('🎥 [Camera] Initializing ZXing continuous reader...');
      
      // Start continuous decode via @zxing/browser
      setTimeout(() => {
        startContinuousZXing();
      }, 500);
      
    } catch (error) {
      console.error('❌ [Camera] Error starting scanning:', error);
      const errorMessage = error instanceof Error ? error.message : 'Άγνωστο σφάλμα';
      setCameraError(`Δεν ήταν δυνατή η έναρξη της σάρωσης: ${errorMessage}`);
      toast.error('Δεν ήταν δυνατή η έναρξη της σάρωσης');
    }
  };

  const stopScanning = () => {
    console.log('🛑 [Camera] Stopping scanning...');
    
    // Clear scan interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
    setIsVideoReady(false);
    setCameraError(null);

    try {
      // Stop ZXing controls if active
      try {
        scannerControlsRef.current?.stop();
      } catch {}
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach(t => t.stop());
      if (v) {
        v.srcObject = null;
      }
    } catch (e) {
      console.log('🧹 [Camera] Cleanup error:', e);
    }
  };

  const startContinuousZXing = async () => {
    try {
      console.log('🔍 [QR Scanner] Starting continuous ZXing via BrowserQRCodeReader...');
      if (!videoRef.current) {
        console.log('❌ [QR Scanner] videoRef not available');
        return;
      }
      const reader = new BrowserQRCodeReader();
      qrReaderRef.current = reader;
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      console.log('🎥 [Camera] Found devices:', devices.map(d => ({ id: d.deviceId?.slice(-6), label: d.label })));
      const backCamera = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
      const deviceId = backCamera?.deviceId || undefined;
      if (!deviceId) {
        console.warn('⚠️ [Camera] No camera deviceId resolved, falling back to default.');
      }

      await reader.decodeFromVideoDevice(deviceId, videoRef.current, async (result: Result | undefined, err: Exception | undefined, controls: IScannerControls) => {
        scannerControlsRef.current = controls;
        if (result) {
          const text = result.getText();
          console.log('✅ [QR Scanner] ZXing stream detected:', text);
          try {
            const pts = (result as any)?.getResultPoints?.() || [];
            if (pts && pts.length >= 3) {
              drawOverlayPolygon(pts.map((p: any) => ({ x: p.getX ? p.getX() : p.x, y: p.getY ? p.getY() : p.y })), 'rgba(16,185,129,0.9)');
            } else {
              drawOverlayBorder('rgba(16,185,129,0.9)');
            }
          } catch {}
          await processQRCode(text);
          controls.stop();
          stopScanning();
        } else if (err) {
          // Σιωπηλό αναμενόμενο error όταν δεν υπάρχει κώδικας στο καρέ, αλλά κρατάμε trace κάθε ~2s
          if ((Date.now() % 2000) < 50) {
            console.log('ℹ️ [QR Scanner] No code in frame yet. err:', err?.name || err);
          }
        }
      });
      setIsVideoReady(true);
      // Παράλληλο fallback loop με jsQR (αν δεν έχει ήδη ξεκινήσει)
      if (!scanIntervalRef.current) {
        startScanLoop();
      }
    } catch (e) {
      console.error('❌ [QR Scanner] Error starting continuous ZXing:', e);
      setCameraError('Αποτυχία εκκίνησης ZXing reader');
    }
  };

  const startScanLoop = () => {
    console.log('🔍 [QR Scanner] Starting scan loop with ZXing...');
    
    if (!videoRef.current) {
      console.log('❌ [QR Scanner] Video element not available');
      return;
    }

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Create ZXing reader with hints to focus only on QR codes
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    const codeReader = new BrowserMultiFormatReader(hints, 100);
    
    // Configure ZXing for better QR code detection
    codeReader.timeBetweenDecodingAttempts = 80; // Faster scanning
    
    // Start scanning every 1000ms (slower for better performance)
    scanIntervalRef.current = setInterval(async () => {
      // Check if webcam is still available
      if (!videoRef.current) {
        console.log('🔍 [QR Scanner] Video element not available, stopping scan');
        return;
      }

      try {
        // Prefer grabbing the native video frame for maximum resolution
        const videoEl = videoRef.current as HTMLVideoElement | undefined;
        if (!videoEl || videoEl.readyState < 2) {
          console.log('🔍 [QR Scanner] Video element not ready');
          return;
        }
        const vW = videoEl.videoWidth;
        const vH = videoEl.videoHeight;
        if (!vW || !vH) {
          console.log('🔍 [QR Scanner] Invalid video dimensions');
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true } as unknown as CanvasRenderingContext2D);
        canvas.width = vW;
        canvas.height = vH;
        if (!ctx) {
          console.log('🔍 [QR Scanner] Canvas 2D context not available');
          return;
        }
        (ctx as CanvasRenderingContext2D).drawImage(videoEl, 0, 0, vW, vH);

        // Πλήρες καρέ + αντίγραφο για preprocessing
        const imageData = (ctx as CanvasRenderingContext2D).getImageData(0, 0, vW, vH);
        const imageDataOriginal = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
        console.log('🔍 [QR Scanner] Captured frame from video:', vW, 'x', vH);

        // Προεπεξεργασία: grayscale + threshold για αύξηση αντίθεσης πάνω σε αντίγραφο
        try {
          const pixels = imageData.data;
          let sum = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
            sum += gray;
          }
          const avg = sum / (pixels.length / 4);
          const threshold = avg * 0.9; // ελαφρώς κάτω από τον μέσο όρο
          for (let i = 0; i < pixels.length; i += 4) {
            const v = pixels[i] > threshold ? 255 : 0;
            pixels[i] = v;
            pixels[i + 1] = v;
            pixels[i + 2] = v;
          }
          (ctx as CanvasRenderingContext2D).putImageData(imageData, 0, 0);
          console.log('🔍 [QR Scanner] Applied grayscale+threshold. Avg:', Math.round(avg), 'Threshold:', Math.round(threshold));
        } catch (prepErr) {
          console.log('🔍 [QR Scanner] Preprocess error (grayscale/threshold):', prepErr);
        }

        // 1) jsQR στο ORIGINAL ImageData (χωρίς αλλοίωση)
        try {
          const jsqrModule = await import('jsqr');
          const jsQR = jsqrModule.default;
          console.log('🔍 [QR Scanner] jsQR analyzing ORIGINAL (dontInvert/attemptBoth)...');
          const modes1 = ['dontInvert', 'attemptBoth'] as const;
          for (const mode of modes1) {
            const res = jsQR(imageDataOriginal.data, vW, vH, { inversionAttempts: mode });
            if (res && res.data) {
              try {
                drawOverlayPolygon([
                  res.location.topLeftCorner,
                  res.location.topRightCorner,
                  res.location.bottomRightCorner,
                  res.location.bottomLeftCorner,
                ], 'rgba(16,185,129,0.9)', vW, vH);
              } catch {}
              console.log(`✅ [QR Scanner] jsQR ORIGINAL detected (${mode}):`, res.data);
              await processQRCode(res.data);
              return;
            }
          }
        } catch (jsErr) {
          console.log('🔍 [QR Scanner] jsQR ORIGINAL error:', jsErr);
        }

        // 2) jsQR στο PREPROCESSED ImageData
        try {
          const jsqrModule = await import('jsqr');
          const jsQR = jsqrModule.default;
          console.log('🔍 [QR Scanner] jsQR analyzing PREPROCESSED (dontInvert/attemptBoth)...');
          const modes = ['dontInvert', 'attemptBoth'] as const;
          for (const mode of modes) {
            const res = jsQR(imageData.data, vW, vH, { inversionAttempts: mode });
            if (res && res.data) {
              try {
                drawOverlayPolygon([
                  res.location.topLeftCorner,
                  res.location.topRightCorner,
                  res.location.bottomRightCorner,
                  res.location.bottomLeftCorner,
                ], 'rgba(16,185,129,0.9)', vW, vH);
              } catch {}
              console.log(`✅ [QR Scanner] jsQR PREPROCESSED detected (${mode}):`, res.data);
              await processQRCode(res.data);
              return;
            }
          }
          console.log('🔍 [QR Scanner] jsQR did not detect, falling back to ZXing...');
        } catch (jsErr) {
          console.log('🔍 [QR Scanner] jsQR PREPROCESSED error:', jsErr);
        }

        // 3) ZXing: προσπάθεια σε κεντρικό crop 60% (συχνά ο κωδικός είναι στο κέντρο)
        try {
          const cropCanvas = document.createElement('canvas');
          const cropCtx = cropCanvas.getContext('2d');
          const cropW = Math.floor(vW * 0.6);
          const cropH = Math.floor(vH * 0.6);
          const sx = Math.floor((vW - cropW) / 2);
          const sy = Math.floor((vH - cropH) / 2);
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          cropCtx?.drawImage(canvas, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

          const image = new Image();
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = reject;
            image.src = cropCanvas.toDataURL('image/png');
          });
          const result = await codeReader.decodeFromImage(image);
          if (result && result.getText) {
            const text = result.getText();
            try {
              const pts = (result as any)?.getResultPoints?.() || [];
              if (pts && pts.length >= 3) {
                drawOverlayPolygon(pts.map((p: any) => ({ x: p.getX ? p.getX() : p.x, y: p.getY ? p.getY() : p.y })), 'rgba(16,185,129,0.9)');
              } else {
                drawOverlayBorder('rgba(16,185,129,0.9)');
              }
            } catch {}
            console.log('✅ [QR Scanner] ZXing detected from CENTER CROP image:', text);
            await processQRCode(text);
            return;
          }
          console.log('🔍 [QR Scanner] ZXing returned empty result from center crop');
        } catch (zerr) {
          console.log('🔍 [QR Scanner] ZXing image decode error:', zerr);
          console.log('🔍 [QR Scanner] No QR code found in this frame');
          // Log central crop sample to aid debugging (downscale to 512 for readability)
          try {
            const dbg = document.createElement('canvas');
            const dctx = dbg.getContext('2d');
            const cropW = Math.floor(vW * 0.6);
            const cropH = Math.floor(vH * 0.6);
            const sx = Math.floor((vW - cropW) / 2);
            const sy = Math.floor((vH - cropH) / 2);
            if (dctx) {
              dbg.width = 512;
              dbg.height = Math.floor(512 * (cropH / cropW));
              dctx.drawImage(canvas, sx, sy, cropW, cropH, 0, 0, dbg.width, dbg.height);
              console.log('🔍 [QR Scanner] Debug crop data URL:', dbg.toDataURL('image/png').slice(0, 100) + '...');
            }
          } catch (cropErr) {
            console.log('🔍 [QR Scanner] Debug crop error:', cropErr);
          }
        }

        // 4) Multi-scale προσπάθειες (ορισμένοι decoders λειτουργούν καλύτερα σε χαμηλότερη ανάλυση)
        try {
          const scales = [0.8, 0.6, 0.5, 0.4];
          for (const s of scales) {
            const sw = Math.max(160, Math.floor(vW * s));
            const sh = Math.max(120, Math.floor(vH * s));
            const sc = document.createElement('canvas');
            const sctx = sc.getContext('2d');
            sc.width = sw; sc.height = sh;
            sctx?.drawImage(canvas, 0, 0, vW, vH, 0, 0, sw, sh);
            const scaledImg = new Image();
            await new Promise<void>((resolve, reject) => {
              scaledImg.onload = () => resolve();
              scaledImg.onerror = reject;
              scaledImg.src = sc.toDataURL('image/png');
            });
            try {
              const zr = await codeReader.decodeFromImage(scaledImg);
              if (zr && zr.getText) {
                console.log(`✅ [QR Scanner] ZXing detected at scale ${s}:`, zr.getText());
                await processQRCode(zr.getText());
                return;
              }
            } catch (_) { /* continue */ }

            try {
              const jsqrModule = await import('jsqr');
              const jsQR = jsqrModule.default;
              const sImageData = sctx?.getImageData(0, 0, sw, sh);
              if (sImageData) {
                const res = jsQR(sImageData.data, sw, sh, { inversionAttempts: 'attemptBoth' });
                if (res && res.data) {
                  console.log(`✅ [QR Scanner] jsQR detected at scale ${s}:`, res.data);
                  await processQRCode(res.data);
                  return;
                }
              }
            } catch (_) { /* continue */ }
          }
          console.log('🔍 [QR Scanner] Multi-scale attempts completed without detection');
        } catch (msErr) {
          console.log('🔍 [QR Scanner] Multi-scale error:', msErr);
        }
      } catch (error) {
        console.error('❌ [QR Scanner] Error capturing image:', error);
      }
    }, 1000); // Check every 1000ms
  };

  // Process ULTRA SIMPLE QR format: userId__category__timestamp (or older formats for backwards compatibility)
  const processUltraSimpleQR = async (qrData: string) => {
    console.log('🔍 [Ultra Simple QR] Processing ultra simple QR format');
    console.log('🔍 [Ultra Simple QR] QR Data:', qrData);
    
     // Find QR code by qr_token with user profile join
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_token', qrData)
      .eq('status', 'active')
      .maybeSingle();

    console.log('🔍 [Ultra Simple QR] Database query result:', qrCode ? 'Found' : 'Not found', qrError ? 'Error' : 'No error');
    console.log('🔍 [Ultra Simple QR] QR Code data:', qrCode);
    console.log('🔍 [Ultra Simple QR] QR Error:', qrError);

    if (qrError || !qrCode) {
      console.log('❌ [Ultra Simple QR] QR code validation failed');
      setScanResult({
        success: false,
        message: 'Μη έγκυρο QR Code',
        reason: 'QR Code δεν βρέθηκε ή είναι ανενεργό'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Get user profile data manually
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('user_id', qrCode.user_id)
      .maybeSingle();

    console.log('🔍 [Ultra Simple QR] User profile query result:', userProfile ? 'Found' : 'Not found', userError ? 'Error' : 'No error');
    console.log('🔍 [Ultra Simple QR] User profile data:', userProfile);
    console.log('🔍 [Ultra Simple QR] User profile error:', userError);

    // Check if QR code is expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      console.log('❌ [Ultra Simple QR] QR code is expired');
      setScanResult({
        success: false,
        message: 'QR Code έχει λήξει',
        reason: 'Το QR Code έχει λήξει και δεν είναι πλέον έγκυρο'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Success! Use the manually fetched user profile data
    console.log('✅ [Ultra Simple QR] QR code validated successfully for user:', userProfile?.first_name, userProfile?.last_name);
    console.log('✅ [Ultra Simple QR] Full user profile data:', userProfile);
    console.log('✅ [Ultra Simple QR] QR code data:', qrCode);
    
    setScanResult({
      success: true,
      message: 'Επιτυχής είσοδος!',
      userData: {
        id: userProfile?.id || 'unknown',
        email: userProfile?.email || 'unknown@email.com',
        name: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Άγνωστος',
        category: qrCode.category
      }
    });
    setShowResult(true);
    stopScanning();
    loadRecentScans();
  };

  // Process simple QR format: QR_USER_CATEGORY (OLD FORMAT - KEEP FOR BACKWARDS COMPATIBILITY)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processSimpleQR = async (userId: string, category: string) => {
    console.log('🔍 [Simple QR] Processing simple QR format');
    console.log('🔍 [Simple QR] User ID:', userId, 'Category:', category);
    
    // Find QR code in database by user and category
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*, user_profiles!inner(id, email, first_name, last_name)')
      .eq('user_id', userId)
      .eq('category', category.toLowerCase())
      .eq('status', 'active')
      .single();

    console.log('🔍 [Simple QR] Database query result:', qrCode ? 'Found' : 'Not found', qrError ? 'Error' : 'No error');

    if (qrError || !qrCode) {
      console.log('❌ [Simple QR] QR code validation failed');
      setScanResult({
        success: false,
        message: 'Μη έγκυρο QR Code',
        reason: 'QR Code δεν βρέθηκε ή είναι ανενεργό'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Check if QR code is expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      console.log('❌ [Simple QR] QR code is expired');
      setScanResult({
        success: false,
        message: 'QR Code έχει λήξει',
        reason: 'Το QR Code έχει λήξει και δεν είναι πλέον έγκυρο'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Success! Get user data from the joined query
    const userProfile = qrCode.user_profiles;
    console.log('✅ [Simple QR] QR code validated successfully for user:', userProfile.first_name, userProfile.last_name);
    
    setScanResult({
      success: true,
      message: 'Επιτυχής είσοδος!',
      userData: {
        id: userProfile.id,
        email: userProfile.email,
        name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Άγνωστος',
        category: qrCode.category
      }
    });
    setShowResult(true);
    stopScanning();
    loadRecentScans();
  };

  // Process standard QR format: qrId:userId:category:timestamp:signature (OLD FORMAT - KEEP FOR BACKWARDS COMPATIBILITY)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processStandardQR = async (qrId: string, userId: string, category: string) => {
    console.log('🔍 [Standard QR] Processing standard QR format');
    console.log('🔍 [Standard QR] QR ID:', qrId, 'User ID:', userId, 'Category:', category);
    
    // Validate QR code in database with user profile
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*, user_profiles!inner(id, email, first_name, last_name)')
      .eq('id', qrId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    console.log('🔍 [Standard QR] Database query result:', qrCode ? 'Found' : 'Not found', qrError ? 'Error' : 'No error');

    if (qrError || !qrCode) {
      console.log('❌ [Standard QR] QR code validation failed');
      setScanResult({
        success: false,
        message: 'Μη έγκυρο QR Code',
        reason: 'QR Code δεν βρέθηκε ή είναι ανενεργό'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Check if QR code is expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      console.log('❌ [Standard QR] QR code is expired');
      setScanResult({
        success: false,
        message: 'QR Code έχει λήξει',
        reason: 'Το QR Code έχει λήξει και δεν είναι πλέον έγκυρο'
      });
      setShowResult(true);
      stopScanning();
      return;
    }

    // Success! Get user data from the joined query
    const userProfile = qrCode.user_profiles;
    console.log('✅ [Standard QR] QR code validated successfully for user:', userProfile.first_name, userProfile.last_name);
    
    setScanResult({
      success: true,
      message: 'Επιτυχής είσοδος!',
      userData: {
        id: userProfile.id,
        email: userProfile.email,
        name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Άγνωστος',
        category: qrCode.category
      }
    });
    setShowResult(true);
    stopScanning();
    loadRecentScans();
  };

  // Process URL QR format: https://qr.codes/xxxxx
  const processURLQR = async (qrData: string) => {
    console.log('🔍 [URL QR] Processing URL QR format:', qrData);
    
    // First, try to find this QR code in our database
    console.log('🔍 [URL QR] Checking if QR code exists in database...');
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*, user_profiles!inner(id, email, first_name, last_name)')
      .eq('qr_token', qrData)
      .eq('status', 'active')
      .single();

    if (qrError || !qrCode) {
      console.log('🔍 [URL QR] QR code not found in database, treating as external');
      // External QR code - show generic success message
      setScanResult({
        success: true,
        message: 'Εξωτερικό QR Code σαρώθηκε!',
        userData: {
          id: 'external',
          email: 'External QR Code',
          name: 'Εξωτερικό QR Code',
          category: 'external'
        }
      });
    } else {
      console.log('🔍 [URL QR] QR code found in database, processing as valid user QR');
      // Found in database - process as valid user QR
      const userProfile = qrCode.user_profiles;
      setScanResult({
        success: true,
        message: 'Επιτυχής είσοδος!',
        userData: {
          id: userProfile.id,
          email: userProfile.email,
          name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Άγνωστος',
          category: qrCode.category
        }
      });
    }
    
    setShowResult(true);
    stopScanning();
    loadRecentScans();
  };

  // Test QR function removed - no longer needed

  const processQRCode = async (qrData: string) => {
    try {
      console.log('🔍 [QR Process] Processing QR data:', qrData);
      console.log('🔍 [QR Process] QR data length:', qrData.length);
      console.log('🔍 [QR Process] QR data type:', typeof qrData);
      
      // Handle different QR code formats
      // 0) Opaque short token (current format): letters/digits, 6-64 chars
      if (/^[A-Za-z0-9]{6,64}$/.test(qrData)) {
        console.log('🔍 [QR Process] Opaque short token detected');
        await processUltraSimpleQR(qrData);
      } else if (qrData.includes('__') && qrData.length > 36) {
        // ULTRA SIMPLE format: userId__category__timestamp
        console.log('🔍 [QR Process] Ultra simple QR format detected (userId__category__timestamp)');
        console.log('🔍 [QR Process] QR Data:', qrData);
        await processUltraSimpleQR(qrData);
      } else if (qrData.includes('_') && qrData.length > 36) {
        // OLD FORMAT: userId_category_timestamp (backwards compatibility)
        console.log('🔍 [QR Process] Old QR format detected (userId_category_timestamp)');
        console.log('🔍 [QR Process] QR Data:', qrData);
        await processUltraSimpleQR(qrData);
      } else if (qrData.includes('-') && qrData.length > 36) {
        // OLD FORMAT: userId-category-timestamp (backwards compatibility)
        console.log('🔍 [QR Process] Old QR format detected (userId-category-timestamp)');
        console.log('🔍 [QR Process] QR Data:', qrData);
        await processUltraSimpleQR(qrData);
      } else if (qrData.includes(':') && qrData.length > 50) {
        // COMPLEX format: id:userId:category:timestamp:hash
        console.log('🔍 [QR Process] Complex QR format detected (id:userId:category:timestamp:hash)');
        console.log('🔍 [QR Process] QR Data:', qrData);
        await processUltraSimpleQR(qrData);
      } else if (qrData.startsWith('https://')) {
        // URL format: https://qr.codes/xxxxx
        console.log('🔍 [QR Process] URL format detected');
        await processURLQR(qrData);
      } else {
        console.log('❌ [QR Process] Unknown QR code format');
        throw new Error('Unknown QR code format');
      }

    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        success: false,
        message: 'Σφάλμα επεξεργασίας QR Code',
        reason: 'Μη έγκυρο ή απροσδιόριστο QR Code format'
      });
      setShowResult(true);
      stopScanning();
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'free_gym': return 'Ελεύθερο Gym';
      case 'pilates': return 'Pilates';
      case 'personal': return 'Personal Training';
      default: return category;
    }
  };

  // Overlay helpers
  const clearOverlay = () => {
    const c = overlayCanvasRef.current;
    const v = videoRef.current;
    if (!c || !v) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = v.clientWidth;
    c.height = v.clientHeight;
    ctx.clearRect(0, 0, c.width, c.height);
  };

  // Open Gym filtered users
  const openGymFilteredUsers = allUsers.filter(user => 
    user.firstName?.toLowerCase().includes(openGymUserSearchTerm?.toLowerCase() || '') ||
    user.lastName?.toLowerCase().includes(openGymUserSearchTerm?.toLowerCase() || '') ||
    user.email?.toLowerCase().includes(openGymUserSearchTerm?.toLowerCase() || '')
  );

  // Open Gym action handler
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

  // Additional functions for full modal functionality
  const isUserPending = (userId: string) => {
    return requestPendingUsers.has(userId);
  };

  const getFrozenOptions = (userId: string) => {
    return requestFrozenOptions[userId] || null;
  };

  const getCurrentSessions = () => {
    return sessionFilter === 'new' ? programSessions : existingSessions;
  };

  const updateCurrentSessions = (sessions: any[]) => {
    if (sessionFilter === 'existing') {
      setExistingSessions(sessions);
    } else {
      setProgramSessions(sessions);
    }
  };

  const loadExistingSessions = async (userId: string) => {
    if (!userId) return;
    
    setLoadingExistingSessions(true);
    try {
      const { data: schedules } = await supabase
        .from('personal_training_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (schedules && schedules.length > 0) {
        const schedule = schedules[0];
        const sessions = schedule.sessions || [];
        setExistingSessions(sessions);
      } else {
        setExistingSessions([]);
      }
    } catch (error) {
      console.error('Error loading existing sessions:', error);
      setExistingSessions([]);
    } finally {
      setLoadingExistingSessions(false);
    }
  };

  const handleSaveProgramOptions = async () => {
    if (programApprovalStatus === 'none' || !user) {
      toast.error('Παρακαλώ επιλέξτε μια κατάσταση έγκρισης');
      return;
    }

    try {
      setLoading(true);
      
      const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
      
      // Save program options for each user
      for (const userId of userIds) {
        const userOptions = selectedOptions[userId] || {};
        
        // Update the user's program options in the database
        const { error } = await supabase
          .from('personal_training_schedules')
          .update({
            program_options: userOptions,
            approval_status: programApprovalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error saving program options:', error);
          toast.error(`Σφάλμα κατά την αποθήκευση επιλογών για χρήστη ${userId}`);
          return;
        }
      }

      toast.success('Οι επιλογές προγράμματος αποθηκεύτηκαν επιτυχώς!');
      
      // Reset form
      setProgramApprovalStatus('none');
      setSelectedOptions({});
      setShowCreateCodeModal(false);
      
    } catch (error) {
      console.error('Error saving program options:', error);
      toast.error('Σφάλμα κατά την αποθήκευση των επιλογών');
    } finally {
      setLoading(false);
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
      console.log('[SECRETARY] Starting to create personal training program...');
      console.log('[SECRETARY] User type:', userType);

      // Δημιουργούμε το πρόγραμμα για όλους τους επιλεγμένους χρήστες
      for (const userId of userIds) {
        const selectedUser = allUsers.find(user => user.id === userId);
        
        if (!selectedUser) {
          toast.error(`Δεν βρέθηκε ο χρήστης με ID: ${userId}`);
          continue;
        }

        console.log('[SECRETARY] Selected user:', selectedUser.firstName, selectedUser.lastName, 'ID:', selectedUser.id);
        console.log('[SECRETARY] Secretary user ID:', user?.id);

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
              // ✅ FIXED: Use current sessions for Group Paspartu (same as Individual)
              // This ensures that admin-created sessions are used for Group Paspartu
              const currentSessions = getCurrentSessions();
              scheduleSessions = currentSessions.map((s) => ({
                id: s.id,
                date: s.date,
                startTime: s.startTime,
                type: s.type,
                trainer: s.trainer || 'Mike',
                room: (s as any).room || 'Αίθουσα Mike',
                notes: s.notes + ' (Group Paspartu)'
              }));
              
              console.log(`[SECRETARY] Using ${scheduleSessions.length} current sessions for Group Paspartu user: ${selectedUser.email}`);
            }
          } else {
            scheduleSessions = []; // Άδεια σεσίες για κανονικά group programs
          }
        } else if (trainingType === 'combination') {
          // Για combination, παίρνουμε μόνο τις πρώτες N σεσίες για personal training
          const currentSessions = getCurrentSessions();
          scheduleSessions = currentSessions.slice(0, combinationPersonalSessions).map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            type: s.type,
            trainer: s.trainer || 'Mike',
            room: (s as any).room || 'Αίθουσα Mike',
            notes: s.notes + ' (Personal - Συνδυασμός)'
          }));
        } else {
          // Individual training - όλες οι σεσίες
          const currentSessions = getCurrentSessions();
          scheduleSessions = currentSessions.map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            type: s.type,
            trainer: s.trainer || 'Mike',
            room: (s as any).room || 'Αίθουσα Mike',
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

        console.log('[SECRETARY] Schedule payload:', schedulePayload);
        console.log('[SECRETARY] Inserting schedule into personal_training_schedules...');
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('personal_training_schedules')
          .insert(schedulePayload)
          .select()
          .single();
        
        if (scheduleError) {
          console.error('[SECRETARY] Schedule insertion error:', scheduleError);
          throw scheduleError;
        }
        
        console.log('[SECRETARY] Schedule inserted successfully for user:', selectedUser.email);

        // For combination training, create group_sessions for individual sessions from Προσωποποιημένο Πρόγραμμα
        if (trainingType === 'combination' && scheduleSessions.length > 0) {
          console.log('[SECRETARY] Creating group_sessions for combination individual sessions...', scheduleSessions);
          
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
              room: (session as any).room || 'Αίθουσα Mike',
              group_type: null, // Individual sessions have no group_type (NULL in database)
              notes: session.notes + ' (Individual - Combination Program)'
            };
          });
          
          console.log('[SECRETARY] Individual group sessions to insert:', individualGroupSessions);
          
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
            console.error('[SECRETARY] Error creating group_sessions for combination individual sessions:', groupSessionsError);
            console.error('[SECRETARY] Error details:', {
              message: groupSessionsError.message,
              details: groupSessionsError.details,
              hint: groupSessionsError.hint,
              code: groupSessionsError.code
            });
            toast.error('Σφάλμα κατά τη δημιουργία των ατομικών σεσίων του συνδυασμού');
          } else {
            console.log('[SECRETARY] Created group_sessions for combination individual sessions:', groupSessionsData);
            console.log('[SECRETARY] Individual sessions created successfully');
          }
        } else {
          console.log('[SECRETARY] Skipping individual sessions creation:', {
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
              console.log('[SECRETARY] Old Members marked as used for user:', selectedUser.email);
            } else {
              console.warn('[SECRETARY] Failed to mark Old Members as used for user:', selectedUser.email);
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
              console.log('[SECRETARY] Kettlebell Points saved for user:', selectedUser.email, 'Points:', userOptions.kettlebellPoints);
            } else {
              console.warn('[SECRETARY] Failed to save Kettlebell Points for user:', selectedUser.email);
            }
          }
        }

        // Special logic for Paspartu users - replace old schedule and reset deposit
        if (userType === 'paspartu') {
          console.log('[SECRETARY] Handling Paspartu user - replacing old schedule and managing deposits...');
          
          // First, replace any old Paspartu schedule with the new one
          const { error: replaceError } = await supabase
            .rpc('replace_paspartu_schedule', {
              p_user_id: selectedUser.id,
              p_new_schedule_id: scheduleData.id
            });

          if (replaceError) {
            console.error('[SECRETARY] Error replacing old Paspartu schedule:', replaceError);
            console.warn('[SECRETARY] Failed to replace old schedule, but new schedule was created successfully');
          } else {
            console.log('[SECRETARY] Old Paspartu schedule replaced successfully for user:', selectedUser.email);
          }
          
          // Calculate deposit based on training type
          let totalDeposits = 5; // Paspartu users always start with 5 deposits
          let usedDeposits = 0;
          
          if (trainingType === 'combination') {
            // For combination: used_deposits = personal_sessions + group_sessions
            usedDeposits = combinationPersonalSessions + combinationGroupSessions;
            console.log(`[SECRETARY] Combination Paspartu: ${combinationPersonalSessions} personal + ${combinationGroupSessions} group = ${usedDeposits} used deposits`);
          } else if (trainingType === 'individual') {
            // For individual: credit 5 lessons, no deduction (original behavior preserved)
            usedDeposits = 0;
            console.log(`[SECRETARY] Individual Paspartu: Credit 5 lessons, no deduction (original behavior)`);
          } else if (trainingType === 'group') {
            // For group Paspartu: same logic as individual (credit 5 lessons, no deduction)
            usedDeposits = 0;
            console.log(`[SECRETARY] Group Paspartu: Credit 5 lessons, no deduction (same as Individual)`);
          }
          
          // Ensure we don't exceed available deposits
          if (usedDeposits > totalDeposits) {
            console.warn(`[SECRETARY] Warning: Used deposits (${usedDeposits}) exceeds total deposits (${totalDeposits}). Setting to max.`);
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
            console.error('[SECRETARY] Lesson deposit reset error:', depositError);
            console.warn('[SECRETARY] Failed to reset lesson deposit, but schedule was created successfully');
          } else {
            console.log(`[SECRETARY] Lesson deposit reset successfully for Paspartu user: ${selectedUser.email}`);
            console.log(`[SECRETARY] Deposits: ${totalDeposits} total, ${usedDeposits} will be used, ${totalDeposits - usedDeposits} remaining`);
            
            // If we have used deposits, update the used count
            if (usedDeposits > 0) {
              const { error: updateError } = await supabase
                .from('lesson_deposits')
                .update({ used_lessons: usedDeposits })
                .eq('user_id', selectedUser.id)
                .eq('is_active', true);

              if (updateError) {
                console.error('[SECRETARY] Error updating used deposits:', updateError);
                console.warn('[SECRETARY] Failed to update used deposits, but schedule was created successfully');
              } else {
                console.log(`[SECRETARY] Updated used deposits to ${usedDeposits} for user: ${selectedUser.email}`);
              }
            }
          }
        }

        console.log(`[SECRETARY] Successfully created program for user: ${selectedUser.email}`);
      }

      // For group training or combination training, create group sessions if slots were selected
      if ((trainingType === 'group' || trainingType === 'combination') && userIds.length > 0 && Object.keys(selectedGroupSlots).length > 0) {
        console.log('[SECRETARY] Creating group sessions for selected slots:', selectedGroupSlots);
        
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
                notes: session.notes || `Group session created by secretary`
              }));
              
              // Create group sessions using the new API
              const result = await createUserGroupSessions(
                userId,
                programId,
                groupSessions,
                user?.id || ''
              );
              
              if (result.success) {
                console.log(`[SECRETARY] Created ${result.createdCount} group sessions for user ${userId}`);
                
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
                console.error('[SECRETARY] Error creating group sessions:', result.error);
                
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
        
      } else {
        // Individual training success message
        const userNames = userIds.map(userId => {
          const user = allUsers.find(u => u.id === userId);
          return user ? `${user.firstName} ${user.lastName}` : userId;
        }).join(', ');
        
        const typeText = trainingType === 'individual' ? 'Ατομικό' : trainingType === 'combination' ? 'Συνδυασμένο' : 'Ομαδικό';
        const userTypeText = userType === 'paspartu' ? 'Paspartu' : 'Personal';
        const userText = (trainingType === 'individual' || trainingType === 'combination') ? 'τον χρήστη' : 'τους χρήστες';
        toast.success(`Το πρόγραμμα ${typeText} ${userTypeText} Training δημιουργήθηκε επιτυχώς για ${userText}: ${userNames}!`);
      }
      
      // Reset form
      setShowCreateCodeModal(false);
      setNewCode({ code: '', selectedUserId: '' });
      setSelectedUserIds([]);
      setProgramSessions([]);
      setExistingSessions([]);
      setSelectedOptions({});
      setProgramApprovalStatus('none');
      setSelectedGroupSlots({}); // Reset group slots
      setSelectedGroupRoom(null);
      setWeeklyFrequency(null);
      setMonthlyTotal(0);
      setUserSearchTerm('');
      setUserSearchMode('dropdown');
      
    } catch (error) {
      console.error('[SECRETARY] Error creating program:', error);
      toast.error('Σφάλμα κατά τη δημιουργία του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  const drawOverlayBorder = (color: string) => {
    const c = overlayCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  };

  const drawOverlayPolygon = (points: Array<{ x: number; y: number }>, color: string, srcW?: number, srcH?: number) => {
    const c = overlayCanvasRef.current;
    const v = videoRef.current;
    if (!c || !v || !points?.length) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    // scale points from source dimensions to canvas dimensions if needed
    const scaleX = srcW ? c.width / srcW : 1;
    const scaleY = srcH ? c.height / srcH : 1;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    points.forEach((p, i) => {
      const x = p.x * scaleX;
      const y = p.y * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  };

  const closeResult = () => {
    setShowResult(false);
    setScanResult(null);
  };

  if (!user || (user.role as string) !== 'secretary') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Δεν έχετε δικαίωμα πρόσβασης</h1>
          <p className="text-gray-600">Αυτή η σελίδα είναι διαθέσιμη μόνο για γραμματεία</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-2xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="Get Fit Logo" 
                className="h-32 w-32 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Secretary Dashboard
                </h1>
                <p className="text-gray-300 mt-1">
                  {activeTab === 'scanner' ? '🔍 Σαρώστε QR codes για είσοδο/έξοδο' : 
                   activeTab === 'membership-requests' ? '📋 Διαχείριση αιτημάτων συνδρομών' : 
                   activeTab === 'ultimate-installments' ? '👑 Διαχείριση Ultimate συνδρομών και δόσεων' :
                   activeTab === 'users-information' ? '👥 Πληροφορίες χρηστών' :
                   activeTab === 'personal-training' ? '💪 Διαχείριση προγραμμάτων Personal Training' :
                   '💳 Διαχείριση δόσεων για πακέτα Ultimate'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={activeTab === 'scanner' ? loadRecentScans : 
                         activeTab === 'membership-requests' ? loadMembershipRequests : 
                         activeTab === 'ultimate-installments' ? loadUltimateRequests :
                         activeTab === 'personal-training' ? () => {} : // personal-training tab handles its own refresh
                         () => {}} // users-information tab handles its own refresh
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">Ανανέωση</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <X className="h-4 w-4" />
                <span className="font-medium">Αποσύνδεση</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-t border-gray-600">
            <nav className="flex space-x-2 p-2">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  activeTab === 'scanner'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-2 border-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>🔍 QR Scanner</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('membership-requests')}
                className={`py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  activeTab === 'membership-requests'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg border-2 border-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>📋 Αιτήματα Συνδρομών</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ultimate-installments')}
                className={`py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  activeTab === 'ultimate-installments'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg border-2 border-orange-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-orange-400 text-lg">👑</span>
                  <span>Ultimate Συνδρομές</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users-information')}
                className={`py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  activeTab === 'users-information'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg border-2 border-purple-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400 text-lg">👥</span>
                  <span>Χρήστες</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('personal-training')}
                className={`py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                  activeTab === 'personal-training'
                    ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-lg border-2 border-pink-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-pink-400 text-lg">💪</span>
                  <span>Personal Training</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scanner' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* QR Scanner */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🔍</span>
                QR Code Scanner
              </h2>
            
            <div className="space-y-4">
              {!isScanning ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-lg">
                    <Camera className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Ξεκινήστε τη σάρωση</h3>
                  <p className="text-gray-300 mb-6">Πατήστε το κουμπί για να ανοίξετε την κάμερα</p>
                  <button
                    onClick={() => {
                      console.log('🎯 [UI] Start scanning button clicked');
                      startScanning();
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    <Camera className="h-5 w-5 inline mr-2" />
                    Ξεκινήστε σάρωση
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="relative bg-black rounded-lg overflow-hidden" 
                    style={{ aspectRatio: '16/9', minHeight: '200px' }}
                    data-scanning={isScanning ? 'true' : 'false'}
                  >
                    {/* Overlay for detected QR bounds */}
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                    {/* Continuous ZXing video */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain bg-black"
                      playsInline
                      muted
                      autoPlay
                    />
                    
                    {/* Loading State */}
                    {!isVideoReady && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p className="text-sm">Φόρτωση κάμερας...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Error State */}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
                        <div className="text-center text-white p-4">
                          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                          <p className="text-sm font-medium mb-2">Σφάλμα κάμερας</p>
                          <p className="text-xs text-red-200">{cameraError}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Scan Overlay */}
                    {isVideoReady && !cameraError && (
                      <>
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                          <div className="absolute top-2 left-2 right-2 bg-blue-500 text-white text-center py-1 rounded text-sm">
                            Σαρώστε QR Code εδώ
                          </div>
                        </div>
                        
                        {/* Debug info */}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                          Camera Status: {isVideoReady ? 'Ready' : 'Loading'}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => stopScanning()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4 inline mr-2" />
                      Σταματήστε σάρωση
                    </button>
                    
                    {cameraError && (
                      <button
                        onClick={startScanning}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="h-4 w-4 inline mr-2" />
                        Δοκιμάστε ξανά
                      </button>
                    )}
                  </div>
            </div>
          )}
          {/* Canvas removed - using direct video scanning */}
        </div>
          </div>

          {/* Recent Scans */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Πρόσφατες σαρώσεις
            </h2>
            
            {recentScans.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
                  <QrCode className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-300">Δεν υπάρχουν πρόσφατες σαρώσεις</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentScans.map((scan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-102">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full shadow-lg ${scan.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                        {scan.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <XCircle className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {scan.user_profiles ? `${scan.user_profiles.first_name} ${scan.user_profiles.last_name}` : 'Άγνωστος'}
                        </p>
                        <p className="text-sm text-gray-300">
                          {getCategoryLabel(scan.category)} • {scan.scan_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {new Date(scan.created_at).toLocaleTimeString('el-GR')}
                      </p>
                      <p className={`text-xs font-medium px-2 py-1 rounded-full ${scan.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {scan.status === 'approved' ? 'Εγκεκριμένο' : 'Απορριφθέν'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        ) : activeTab === 'membership-requests' ? (
          /* Membership Requests */
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="text-3xl mr-3">📋</span>
                Αιτήματα Συνδρομών
              </h2>
              <button
                onClick={loadMembershipRequests}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Ανανέωση
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300 font-medium">Φόρτωση αιτημάτων...</p>
              </div>
            ) : membershipRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-lg">
                  <CreditCard className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Δεν υπάρχουν αιτήματα</h3>
                <p className="text-gray-300">Δεν υπάρχουν αιτήματα συνδρομών για επεξεργασία</p>
              </div>
            ) : (
              <div className="space-y-4">
                {membershipRequests
                  .filter(request => request.package?.name === 'Free Gym' || request.package?.name === 'Pilates')
                  .filter(request => 
                    request.status === 'pending' || 
                    (request.status === 'approved' && isRequestPending(request.id)) || 
                    (request.status === 'rejected' && isRequestPending(request.id))
                  )
                  .map((request) => (
                  <div key={request.id} className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-6 hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-102">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex-shrink-0">
                            {request.user?.profile_photo ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-blue-400">
                                <img 
                                  src={request.user.profile_photo} 
                                  alt={`${request.user?.first_name} ${request.user?.last_name}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
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
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">{request.user?.first_name && request.user?.last_name ? `${request.user.first_name} ${request.user.last_name}` : 'Άγνωστος χρήστης'}</h3>
                            <p className="text-sm text-gray-300">{request.user?.email || 'Δεν υπάρχει email'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                            <CreditCard className="h-5 w-5 text-blue-400" />
                            <span className="text-sm text-gray-200">
                              <span className="font-medium text-blue-300">Πακέτο:</span> {request.package?.name || 'Άγνωστο πακέτο'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                            <Clock className="h-5 w-5 text-purple-400" />
                            <span className="text-sm text-gray-200">
                              <span className="font-medium text-purple-300">Διάρκεια:</span> {getDurationLabel(request.duration_type)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-3 border border-green-500/30">
                            <Euro className="h-5 w-5 text-green-400" />
                            <span className="text-sm text-gray-200">
                              <span className="font-medium text-green-300">Τιμή:</span> {formatPrice(request.requested_price)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Show classes count for Pilates requests */}
                        {request.classes_count && request.classes_count > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">🧘</span>
                              <span className="text-sm font-medium text-pink-300">
                                Μαθήματα Pilates: {request.classes_count}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 text-sm text-gray-300 bg-gray-600/30 rounded-lg p-3">
                          <span className="font-medium text-gray-200">📅 Ημερομηνία αίτησης:</span> {new Date(request.created_at).toLocaleDateString('el-GR')}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3 ml-4">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Check className="h-4 w-4 inline mr-2" />
                          ✅ Έγκριση
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Λόγος απόρριψης:');
                            if (reason) {
                              handleRejectRequest(request.id);
                            }
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <X className="h-4 w-4 inline mr-2" />
                          ❌ Απόρριψη
                        </button>
                      </div>
                    </div>
                    
                    {/* Program Options Section for Free Gym requests - Only show if not approved/rejected OR if pending */}
                    {((request.status === 'pending') || 
                      (request.status === 'approved' && isRequestPending(request.id)) || 
                      (request.status === 'rejected' && isRequestPending(request.id))) && (
                    <div className={`mt-6 p-6 rounded-2xl border shadow-lg ${isRequestPending(request.id) ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30' : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'}`}>
                      <h5 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="text-2xl mr-2">⚙️</span>
                        Program Options
                        {isRequestPending(request.id) && <span className="ml-2 text-yellow-400">🔒</span>}
                      </h5>
                      
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

                        {/* Cash */}
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

                        {/* POS */}
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'ultimate-installments' ? (
          <UltimateInstallmentsTab
            ultimateRequests={ultimateRequests}
            ultimateLoading={ultimateLoading}
            ultimateSearchTerm={ultimateSearchTerm}
            setUltimateSearchTerm={setUltimateSearchTerm}
            selectedRequestOptions={selectedRequestOptions}
            handleRequestOptionChange={handleRequestOptionChange}
            updateInstallmentAmounts={updateInstallmentAmounts}
            deleteUltimateRequest={deleteUltimateRequest}
            loadUltimateRequests={loadUltimateRequests}
            handleApproveRequest={handleApproveRequest}
            handleRejectRequest={handleRejectRequest}
            loading={loading}
            requestProgramApprovalStatus={requestProgramApprovalStatus}
            handleRequestProgramApprovalChange={handleRequestProgramApprovalChange}
            handleSaveRequestProgramOptions={handleSaveRequestProgramOptions}
            requestPendingUsers={requestPendingUsers}
            requestFrozenOptions={requestFrozenOptions}
          />
        ) : activeTab === 'users-information' ? (
          <SecretaryUsersInformation />
        ) : activeTab === 'personal-training' ? (
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


            {/* Schedule Editor */}
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

                {/* Schedule Sessions */}
                <div className="space-y-3 sm:space-y-4">
                  {personalTrainingSchedule.scheduleData.sessions.map((session) => (
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

                {/* General Notes */}
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

            {/* No Schedule Message */}
            {selectedUser && !personalTrainingSchedule && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl shadow-xl p-4 sm:p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Δεν βρέθηκε πρόγραμμα</h3>
                  <p className="text-gray-600 mb-4">Ο χρήστης {selectedUser.firstName} {selectedUser.lastName} δεν έχει δημιουργημένο πρόγραμμα Personal Training.</p>
                  <button
                    onClick={() => setShowCreateCodeModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Δημιουργία Νέου Προγράμματος
                  </button>
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
                      Εξτρά Υπηρεσία
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
        ) : null}
      </div>

      {/* Personal Training Create Code Modal - Admin Panel Style */}
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

                 {/* User Selection based on mode */}
                 {userSearchMode === 'dropdown' ? (
                   (trainingType === 'individual' || trainingType === 'combination') ? (
                     <select
                       className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                       value={newCode.selectedUserId}
                       onChange={(e) => {
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
                       {allUsers.length > 0 ? (
                         allUsers.map((user) => (
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
                         {allUsers
                           .filter(user => 
                             user.firstName?.toLowerCase().includes(userSearchTerm?.toLowerCase() || '') ||
                             user.lastName?.toLowerCase().includes(userSearchTerm?.toLowerCase() || '') ||
                             user.email?.toLowerCase().includes(userSearchTerm?.toLowerCase() || '')
                           )
                           .map((user) => (
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
                           ))}
                       </div>
                     )}
                   </div>
                 )}
                
                 {/* Selected User Display */}
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
                                 const newOldMembers = !newOptions[id]?.oldMembers;
                                 newOptions[id] = {
                                   ...newOptions[id],
                                   oldMembers: newOldMembers,
                                   // Reset first150Members when oldMembers is deselected
                                   first150Members: newOldMembers ? newOptions[id]?.first150Members : false,
                                   // Reset cash and pos when oldMembers is deselected
                                   cash: newOldMembers ? newOptions[id]?.cash : false,
                                   pos: newOldMembers ? newOptions[id]?.pos : false,
                                   cashAmount: newOldMembers ? newOptions[id]?.cashAmount : undefined,
                                   posAmount: newOldMembers ? newOptions[id]?.posAmount : undefined
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

                     {/* Πρώτα 150 Μέλη - Only show when Παλαιά μέλη is selected AND not used */}
                     {(() => {
                       const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                       const hasOldMembersSelected = userIds.some(id => selectedOptions[id]?.oldMembers);
                       const hasOldMembersUsed = userIds.some(id => usedOldMembers.has(id) || localUsedOldMembers.has(id));
                       // Also check if oldMembers is explicitly false (meaning it was used and reset)
                       const hasOldMembersReset = userIds.some(id => selectedOptions[id]?.oldMembers === false);
                       return hasOldMembersSelected && !hasOldMembersUsed && !hasOldMembersReset;
                     })() && (
                       <div className={`rounded-lg p-4 border ${
                         ((trainingType === 'individual' || trainingType === 'combination')
                           ? isUserPending(newCode.selectedUserId)
                           : selectedUserIds.some(id => isUserPending(id)))
                           ? 'bg-yellow-100 border-yellow-300' 
                           : 'bg-white border-gray-200'
                       }`}>
                         {/* Info text above the button */}
                         <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                           <span className="font-medium">ℹ️ Πληροφορίες:</span> Ισχύει μόνο για τα πρώτα 150 παλιά μέλη του γυμναστηρίου με τιμή 45€ ετήσιος (προσφορά), τα οποία εμφανίζονται στην καρτέλα Ταμείο
                         </div>
                         
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
                                 const newFirst150 = !newOptions[id]?.first150Members;
                                 newOptions[id] = {
                                   ...newOptions[id],
                                   first150Members: newFirst150,
                                   // When first150Members is selected, automatically set cash to 45 and lock POS
                                   cash: newFirst150 ? true : newOptions[id]?.cash || false,
                                   cashAmount: newFirst150 ? 45 : newOptions[id]?.cashAmount,
                                   pos: newFirst150 ? false : newOptions[id]?.pos || false,
                                   posAmount: newFirst150 ? 0 : newOptions[id]?.posAmount
                                 };
                               });
                               return newOptions;
                             });
                           }}
                           className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 relative shadow-lg ${
                             ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                               ? (isUserPending(newCode.selectedUserId) 
                                   ? (getFrozenOptions(newCode.selectedUserId)?.first150Members 
                                       ? 'bg-orange-500 text-white' 
                                       : 'bg-blue-500 text-white')
                                   : (selectedOptions[newCode.selectedUserId]?.first150Members
                                       ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                       : 'bg-blue-500 text-white hover:bg-blue-600'))
                               : (selectedUserIds.some(id => selectedOptions[id]?.first150Members)
                                   ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                   : 'bg-blue-500 text-white hover:bg-blue-600')
                           }`}
                         >
                           <div className="flex items-center justify-center space-x-2">
                             <span>🏆 Πρώτα 150 Μέλη</span>
                             {(((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) 
                               ? (isUserPending(newCode.selectedUserId) 
                                   ? getFrozenOptions(newCode.selectedUserId)?.first150Members
                                   : selectedOptions[newCode.selectedUserId]?.first150Members)
                               : selectedUserIds.some(id => selectedOptions[id]?.first150Members)) && (
                               <span className="text-orange-200">✓</span>
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
                                 kettlebellPoints: e.target.value || '' // Explicitly handle empty string
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
                             
                             // Check if first150Members is selected for any user
                             const hasFirst150 = userIds.some(id => selectedOptions[id]?.first150Members);
                             if (hasFirst150) {
                               toast('Το πεδίο Μετρητά είναι κλειδωμένο όταν είναι επιλεγμένο "Πρώτα 150 Μέλη"', { icon: '🔒' });
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
                                   : (selectedOptions[newCode.selectedUserId]?.first150Members
                                       ? 'bg-orange-500 text-white cursor-not-allowed'
                                       : 'bg-green-500 text-white hover:bg-green-600'))
                               : (selectedUserIds.some(id => isUserPending(id))
                                   ? 'bg-yellow-500 text-white cursor-not-allowed'
                                   : (selectedUserIds.some(id => selectedOptions[id]?.first150Members)
                                       ? 'bg-orange-500 text-white cursor-not-allowed'
                                       : 'bg-green-500 text-white hover:bg-green-600'))
                           }`}
                           disabled={((trainingType === 'individual' || trainingType === 'combination') 
                             ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                             : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))}
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
                                   : (selectedOptions[newCode.selectedUserId]?.first150Members ? '45' : cashAmount))
                               : (selectedUserIds.some(id => selectedOptions[id]?.first150Members) ? '45' : cashAmount)}
                             onChange={(e) => {
                               const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                               
                               // Check if any user is pending
                               const hasPendingUser = userIds.some(id => isUserPending(id));
                               if (hasPendingUser) {
                                 toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                 return;
                               }
                               
                               // Check if first150Members is selected for any user
                               const hasFirst150 = userIds.some(id => selectedOptions[id]?.first150Members);
                               if (hasFirst150) {
                                 toast('Το πεδίο Μετρητά είναι κλειδωμένο όταν είναι επιλεγμένο "Πρώτα 150 Μέλη"', { icon: '🔒' });
                                 return;
                               }
                               
                               setCashAmount(e.target.value);
                             }}
                             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                               (trainingType === 'individual' 
                                 ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                                 : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))
                                 ? 'border-orange-300 bg-orange-50 focus:ring-orange-500'
                                 : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                             }`}
                             placeholder="Εισάγετε ποσό σε €..."
                             autoFocus
                             disabled={((trainingType === 'individual' || trainingType === 'combination') 
                               ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                               : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))}
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
                                 
                                 // Always update selected options, even for empty values
                                 setSelectedOptions(prev => {
                                   const newOptions = { ...prev };
                                   userIds.forEach(id => {
                                     const amount = cashAmount && parseFloat(cashAmount) > 0 ? parseFloat(cashAmount) : 0;
                                     newOptions[id] = {
                                       ...newOptions[id],
                                       cash: amount > 0,
                                       cashAmount: amount
                                     };
                                   });
                                   return newOptions;
                                 });
                                 
                                 if (cashAmount && parseFloat(cashAmount) > 0) {
                                   toast.success(`Μετρητά €${cashAmount} προστέθηκαν! Θα αποθηκευτούν με το Save.`);
                                 } else {
                                   toast.success('Μετρητά μηδενίστηκαν! Θα αποθηκευτεί με το Save.');
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
                             
                             // Check if first150Members is selected for any user
                             const hasFirst150 = userIds.some(id => selectedOptions[id]?.first150Members);
                             if (hasFirst150) {
                               toast('Το πεδίο POS είναι κλειδωμένο όταν είναι επιλεγμένο "Πρώτα 150 Μέλη"', { icon: '🔒' });
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
                                   : (selectedOptions[newCode.selectedUserId]?.first150Members
                                       ? 'bg-orange-500 text-white cursor-not-allowed'
                                       : 'bg-blue-500 text-white hover:bg-blue-600'))
                               : (selectedUserIds.some(id => isUserPending(id))
                                   ? 'bg-yellow-500 text-white cursor-not-allowed'
                                   : (selectedUserIds.some(id => selectedOptions[id]?.first150Members)
                                       ? 'bg-orange-500 text-white cursor-not-allowed'
                                       : 'bg-blue-500 text-white hover:bg-blue-600'))
                           }`}
                           disabled={((trainingType === 'individual' || trainingType === 'combination') 
                             ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                             : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))}
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
                                   : (selectedOptions[newCode.selectedUserId]?.first150Members ? '0' : posAmount))
                               : (selectedUserIds.some(id => selectedOptions[id]?.first150Members) ? '0' : posAmount)}
                             onChange={(e) => {
                               const userIds = (trainingType === 'individual' || trainingType === 'combination') ? [newCode.selectedUserId] : selectedUserIds;
                               
                               // Check if any user is pending
                               const hasPendingUser = userIds.some(id => isUserPending(id));
                               if (hasPendingUser) {
                                 toast('Οι επιλογές είναι παγωμένες - αλλάξτε το status για να τις τροποποιήσετε', { icon: '🔒' });
                                 return;
                               }
                               
                               // Check if first150Members is selected for any user
                               const hasFirst150 = userIds.some(id => selectedOptions[id]?.first150Members);
                               if (hasFirst150) {
                                 toast('Το πεδίο POS είναι κλειδωμένο όταν είναι επιλεγμένο "Πρώτα 150 Μέλη"', { icon: '🔒' });
                                 return;
                               }
                               
                               setPosAmount(e.target.value);
                             }}
                             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                               (trainingType === 'individual' 
                                 ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                                 : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))
                                 ? 'border-orange-300 bg-orange-50 focus:ring-orange-500'
                                 : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                             }`}
                             placeholder="Εισάγετε ποσό σε €..."
                             autoFocus
                             disabled={((trainingType === 'individual' || trainingType === 'combination') 
                               ? (isUserPending(newCode.selectedUserId) || selectedOptions[newCode.selectedUserId]?.first150Members)
                               : (selectedUserIds.some(id => isUserPending(id)) || selectedUserIds.some(id => selectedOptions[id]?.first150Members)))}
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
                                 
                                 // Always update selected options, even for empty values
                                 setSelectedOptions(prev => {
                                   const newOptions = { ...prev };
                                   userIds.forEach(id => {
                                     const amount = posAmount && parseFloat(posAmount) > 0 ? parseFloat(posAmount) : 0;
                                     newOptions[id] = {
                                       ...newOptions[id],
                                       pos: amount > 0,
                                       posAmount: amount
                                     };
                                   });
                                   return newOptions;
                                 });
                                 
                                 if (posAmount && parseFloat(posAmount) > 0) {
                                   toast.success(`POS €${posAmount} προστέθηκε! Θα αποθηκευτεί με το Save.`);
                                 } else {
                                   toast.success('POS μηδενίστηκε! Θα αποθηκευτεί με το Save.');
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

               {/* Group Room Options - For Group Training and Combination */}
               {((trainingType === 'group' && selectedUserIds.length > 0) || (trainingType === 'combination' && newCode.selectedUserId)) && (
                 <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 border border-orange-200 mt-4">
                   <h4 className="text-lg sm:text-xl font-bold text-orange-800 mb-4 sm:mb-6 flex items-center">
                     🏠 {trainingType === 'combination' ? 'Επιλογές Ομαδικής Αίθουσας (για Group Sessions)' : 'Επιλογές Ομαδικής Αίθουσας'}
                   </h4>
                   
                   <div className="space-y-6">
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
                     {weeklyFrequency && (
                       <GroupAssignmentInterface 
                         selectedGroupRoom="3"
                         weeklyFrequency={weeklyFrequency}
                         monthlyTotal={monthlyTotal}
                         selectedUserIds={trainingType === 'combination' ? [newCode.selectedUserId] : selectedUserIds}
                         onSlotsChange={setSelectedGroupSlots}
                       />
                     )}
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
                      trainingType === 'combination' && getCurrentSessions().length > combinationPersonalSessions
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      📊 Σύνολο: {getCurrentSessions().length} σεσίας
                      {trainingType === 'combination' && (
                        <span className={`ml-2 ${
                          getCurrentSessions().length > combinationPersonalSessions ? 'text-red-600' : 'text-purple-600'
                        }`}>
                          ({combinationPersonalSessions} θα χρησιμοποιηθούν)
                          {getCurrentSessions().length > combinationPersonalSessions && (
                            <span className="ml-1 font-bold">⚠️ Περισσότερες από όσες θα χρησιμοποιηθούν!</span>
                          )}
                        </span>
                      )}
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
                            if ((trainingType === 'individual' || trainingType === 'combination') && newCode.selectedUserId) {
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
                      <div className={`grid gap-0 text-sm font-bold text-gray-800 ${trainingType === 'individual' ? 'grid-cols-6' : 'grid-cols-7'}`}>
                        <div className="col-span-1 text-center py-3 border-r border-gray-300 bg-gray-200">#</div>
                        <div className="col-span-1 py-3 px-2 border-r border-gray-300">📅 Ημερομηνία</div>
                        <div className="col-span-1 py-3 px-2 border-r border-gray-300">🕐 Έναρξη</div>
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
                      {getCurrentSessions().map((session, idx) => (
                        <div key={session.id} className={`grid gap-0 hover:bg-blue-50 transition-colors ${trainingType === 'individual' ? 'grid-cols-6' : 'grid-cols-7'}`}>
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
                                 onChange={(e) => {
                                   const currentSessions = getCurrentSessions();
                                   updateCurrentSessions(currentSessions.map((ps, i) => i === idx ? { ...ps, group: e.target.value as '2ΑτομαGroup' | '3ΑτομαGroup' | '6ΑτομαGroup' | undefined } : ps));
                                 }}
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
                          // Validation για combination training
                          const currentSessions = getCurrentSessions();
                          if (trainingType === 'combination' && currentSessions.length >= combinationPersonalSessions) {
                            toast.error(`Για συνδυασμένο πρόγραμμα μπορείτε να έχετε μέγιστο ${combinationPersonalSessions} ατομικές σεσίες`);
                            return;
                          }
                          
                         updateCurrentSessions([...currentSessions, {
                           id: `tmp-${Date.now()}`,
                           date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`, 
                           startTime: '19:00', 
                           type: 'personal', 
                           trainer: 'Mike', 
                           room: 'Αίθουσα Mike', 
                           group: trainingType === 'combination' ? undefined : '2ΑτομαGroup', // For combination, no group (individual sessions)
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


               {/* Enhanced Action Buttons */}
               <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200">
                 <button
                   onClick={() => setShowCreateCodeModal(false)}
                   className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg"
                 >
                   ❌ Ακύρωση
                 </button>
                 <button
                   onClick={() => {
                     console.log('[SecretaryDashboard] Button clicked - trainingType:', trainingType, 'selectedUserId:', newCode.selectedUserId);
                     
                     // Validation
                     if (trainingType === 'individual' && !newCode.selectedUserId) {
                       toast.error('Παρακαλώ επιλέξτε χρήστη για ατομικό πρόγραμμα');
                       return;
                     }
                     
                     if (trainingType === 'group' && selectedUserIds.length === 0) {
                       toast.error('Παρακαλώ επιλέξτε χρήστες για ομαδικό πρόγραμμα');
                       return;
                     }
                     
                     if (trainingType === 'combination' && !newCode.selectedUserId) {
                       toast.error('Παρακαλώ επιλέξτε χρήστη για συνδυασμένο πρόγραμμα');
                       return;
                     }
                     
                     // Check if sessions exist based on training type
                     if (trainingType === 'group') {
                       // For group training, check if group slots exist
                       if (!selectedGroupSlots || Object.keys(selectedGroupSlots).length === 0) {
                         toast.error('Παρακαλώ προσθέστε τουλάχιστον μία σεσία');
                         return;
                       }
                     } else {
                       // For individual and combination, check personal sessions
                       const currentSessions = getCurrentSessions();
                       if (currentSessions.length === 0) {
                         toast.error('Παρακαλώ προσθέστε τουλάχιστον μία σεσία');
                         return;
                       }
                     }
                     
                     // For combination training, check if we have both personal and group sessions
                     if (trainingType === 'combination') {
                       if (!selectedGroupSlots || Object.keys(selectedGroupSlots).length === 0) {
                         toast.error('Για συνδυασμένο πρόγραμμα χρειάζονται και ομαδικές σεσίες');
                         return;
                       }
                     }
                     
                     // Create the program
                     createPersonalTrainingProgram();
                   }}
                   className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg flex items-center justify-center"
                   disabled={loading}
                 >
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                       Δημιουργία...
                     </>
                   ) : (
                     <>
                       ✅ Δημιουργία Προγράμματος
                     </>
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>
     )}

      {/* Scan Result Modal */}
      {showResult && scanResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                scanResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {scanResult.success ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              
              <h3 className={`text-lg font-semibold mb-2 ${
                scanResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {scanResult.message}
              </h3>
              
              {scanResult.userData && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{scanResult.userData.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{scanResult.userData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{getCategoryLabel(scanResult.userData.category)}</span>
                  </div>
                </div>
              )}
              
              {scanResult.reason && (
                <p className="text-sm text-gray-600 mb-4">{scanResult.reason}</p>
              )}
              
              <button
                onClick={closeResult}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default SecretaryDashboard;