export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  referralCode: string;
  referralPoints?: number; // New field for referral points
  phone?: string;
  avatar?: string;
  language: 'el' | 'en';
  createdAt: string;
  updatedAt: string;
  // New profile fields
  dob?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile_photo?: string;
  profile_photo_locked?: boolean;
  dob_locked?: boolean;
}

export type UserRole = 'user' | 'trainer' | 'admin' | 'secretary';

// Trainer names for dropdown selection
export type TrainerName = 'Mike' | 'Jordan';

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  avatar?: string;
  language: 'el' | 'en';
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  language: 'el' | 'en';
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  roomId: string;
  trainerId: string;
  capacity: number;
  duration: number; // σε λεπτά
  schedule: LessonSchedule[];
  category: LessonCategory;
  difficulty: LessonDifficulty;
  credits: number;
  isActive: boolean;
  maxParticipants: number;
}

export interface LessonSchedule {
  id: string;
  lessonId: string;
  dayOfWeek: number; // 1-5 (Δευτέρα-Παρασκευή)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export type LessonCategory = 'pilates' | 'personal_training_a' | 'personal_training_b' | 'kick_boxing' | 'free_gym';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  floor: number;
  isActive: boolean;
  lessonType: LessonCategory; // Εξειδικευμένος τύπος μαθήματος
}

export interface Trainer {
  id: string;
  userId: string;
  specialties: LessonCategory[];
  bio: string;
  experience: number; // σε χρόνια
  certifications: string[];
  isActive: boolean;
  hourlyRate: number;
}

export interface Booking {
  id: string;
  userId: string;
  lessonId: string;
  date: string;
  status: BookingStatus;
  qrCode: string;
  checkInTime?: string;
  checkOutTime?: string;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'pending';

export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'suspended';

export interface MembershipPackage {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  package_type: string;
  is_active: boolean;
  features?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MembershipPackageDuration {
  id: string;
  package_id: string;
  duration_type: 'year' | 'semester' | '3 Μήνες' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  duration_days: number;
  price: number;
  classes_count?: number; // For Pilates packages
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User data as returned from database (with snake_case)
export interface DatabaseUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo?: string;
}

export interface MembershipRequest {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: 'year' | 'semester' | '3 Μήνες' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  requested_price: number;
  classes_count?: number; // For Pilates packages
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  // Ultimate package installments
  has_installments?: boolean;
  installment_1_amount?: number;
  installment_2_amount?: number;
  installment_3_amount?: number;
  installment_1_payment_method?: string;
  installment_2_payment_method?: string;
  installment_3_payment_method?: string;
  installment_1_due_date?: string;
  installment_2_due_date?: string;
  installment_3_due_date?: string;
  installment_1_locked?: boolean;
  installment_2_locked?: boolean;
  installment_3_locked?: boolean;
  // Third installment deletion
  third_installment_deleted?: boolean;
  third_installment_deleted_at?: string;
  third_installment_deleted_by?: string;
  // Joined data - database format
  user?: DatabaseUser;
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}

export interface Membership {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: 'year' | 'semester' | '3 Μήνες' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  approved_by?: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}


export interface Payment {
  id: string;
  userId: string;
  membershipId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt: string; // 48ωρη περίοδος
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash';

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: ReferralStatus;
  rewardCredits: number;
  completedAt?: string;
  createdAt: string;
}

export type ReferralStatus = 'pending' | 'completed' | 'expired';

export interface QRCode {
  id: string;
  bookingId: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  activeMemberships: number;
  availableCredits: number;
  upcomingLessons: number;
  referralRewards: number;
  totalUsers: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface LessonAvailability {
  lessonId: string;
  date: string;
  availableSpots: number;
  isBooked: boolean;
  canBook: boolean;
  roomCapacity: number;
  currentBookings: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode?: string;
  language?: 'el' | 'en';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  justLoggedIn: boolean;
  justRegistered: boolean;
  showEmailConfirmationPopup: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearJustLoggedIn: () => void;
  clearJustRegistered: () => void;
  handleEmailConfirmationPopupClose: () => void;
}

// New interfaces for specialized requirements
export interface BookingRestrictions {
  isAugustClosed: boolean;
  workingDays: number[]; // [1,2,3,4,5] for Monday-Friday
  maxBookingsPerWeek: number;
  advanceBookingDays: number;
}

export interface TrainerSchedule {
  trainerId: string;
  weekStart: string;
  lessons: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    lessonType: LessonCategory;
    roomId: string;
    maxParticipants: number;
  }[];
}

export interface AdminDashboard {
  totalUsers: number;
  totalRevenue: number;
  pendingPayments: number;
  weeklyBookings: number;
  monthlyStats: {
    users: number;
    revenue: number;
    bookings: number;
  };
}

export interface MultilingualText {
  el: string;
  en: string;
}

// Personal Training Schedule Types
export interface PersonalTrainingCode {
  id: string;
  code: string;
  packageType: 'personal' | 'kickboxing' | 'combo';
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  usedBy?: string;
  usedAt?: string;
}

export interface PersonalTrainingSchedule {
  id: string;
  userId: string;
  month: number;
  year: number;
  scheduleData: PersonalTrainingScheduleData;
  status: 'pending' | 'accepted' | 'declined';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  userType?: 'personal' | 'paspartu'; // New field to distinguish user types
  isFlexible?: boolean; // New field to indicate if schedule allows flexible booking
  trainingType?: 'individual' | 'group' | 'combination'; // Training type
  groupRoomSize?: number; // Group size (2, 3, or 6)
  weeklyFrequency?: number; // Weekly frequency for group training
}

export interface PersonalTrainingScheduleData {
  sessions: PersonalTrainingSession[];
  notes?: string;
  trainer?: string;
  specialInstructions?: string;
  // Group training specific fields
  groupRoomSize?: number | null;
  weeklyFrequency?: number | null;
  monthlyTotal?: number | null;
}

export interface PersonalTrainingSession {
  id: string;
  date: string; // YYYY-MM-DD format (πλήρη ημερομηνία)
  startTime: string; // HH:mm format
  type: 'personal' | 'kickboxing' | 'combo';
  trainer: TrainerName; // Now restricted to Mike or Jordan
  room?: string;
  group?: '2ΑτομαGroup' | '3ΑτομαGroup' | '6ΑτομαGroup';
  notes?: string;
}

export interface UserWithPersonalTraining {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile_photo?: string;
  profile_photo_locked?: boolean;
  dob?: string;
  address?: string;
  emergency_contact?: string;
  dob_locked?: boolean;
  hasPersonalTrainingCode: boolean;
  personalTrainingCode?: string;
  packageType?: 'personal' | 'kickboxing' | 'combo';
}

// Group Assignment System Types
export interface GroupScheduleTemplate {
  id: string;
  groupType: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  trainer: string;
  room: string;
  groupIdentifier: string;
  maxCapacity: number;
  currentAssignments: number;
  availableSpots: number;
  isFull: boolean;
}

export interface GroupAssignment {
  id: string;
  programId: string;
  userId: string;
  groupType: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  trainer: string;
  room: string;
  groupIdentifier: string;
  weeklyFrequency: number;
  assignmentDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  userInfo?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserWeeklyAssignment {
  id: string;
  userId: string;
  programId: string;
  targetWeeklyFrequency: number;
  currentAssignmentsCount: number;
  weekStartDate: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupAssignmentValidation {
  isValid: boolean;
  errorMessage: string;
  errorType: string;
}

export interface GroupAssignmentResult {
  success: boolean;
  assignmentId: string | null;
  message: string;
}

// Lesson Deposit System Types for Paspartu Users
export interface LessonDeposit {
  id: string;
  userId: string;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface LessonBooking {
  id: string;
  userId: string;
  scheduleId: string;
  sessionId: string;
  bookingDate: string; // YYYY-MM-DD format
  bookingTime: string; // HH:mm format
  trainerName: string;
  room?: string;
  notes?: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  sessionId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'personal' | 'kickboxing' | 'combo';
  trainer: TrainerName;
  room?: string;
  isBooked: boolean;
  bookingId?: string;
}

// Pilates Schedule System Types
export interface PilatesScheduleSlot {
  id: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  max_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PilatesBooking {
  id: string;
  user_id: string;
  slot_id: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  slot?: PilatesScheduleSlot;
  user?: User;
}

export interface PilatesAvailableSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  available_capacity: number;
  booked_count: number;
  status: 'available' | 'almost_full' | 'full';
  is_active: boolean;
}

export interface PilatesScheduleFormData {
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
}

export interface PilatesBookingFormData {
  slotId: string;
  notes?: string;
}