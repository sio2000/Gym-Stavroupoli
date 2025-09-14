export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  referralCode: string;
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

export interface Membership {
  id: string;
  userId: string;
  packageId: string;
  status: MembershipStatus;
  credits: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  frequency: '1x' | '2x' | '3x'; // φορές ανά εβδομάδα
  createdAt: string;
  updatedAt: string;
}

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
  duration_type: 'year' | 'semester' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  duration_days: number;
  price: number;
  classes_count?: number; // For Pilates packages
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipRequest {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: 'year' | 'semester' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  requested_price: number;
  classes_count?: number; // For Pilates packages
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}

export interface Membership {
  id: string;
  user_id: string;
  package_id: string;
  duration_type: 'year' | 'semester' | 'month' | 'lesson' | 'pilates_trial' | 'pilates_1month' | 'pilates_2months' | 'pilates_3months' | 'pilates_6months' | 'pilates_1year';
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  approved_by?: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  package?: MembershipPackage;
  duration?: MembershipPackageDuration;
}

export interface LessonDeposit {
  id: string;
  user_id: string;
  package_id: string;
  total_classes: number;
  remaining_classes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  package?: MembershipPackage;
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
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
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
}

export interface PersonalTrainingScheduleData {
  sessions: PersonalTrainingSession[];
  notes?: string;
  trainer?: string;
  specialInstructions?: string;
}

export interface PersonalTrainingSession {
  id: string;
  date: string; // YYYY-MM-DD format (πλήρη ημερομηνία)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'personal' | 'kickboxing' | 'combo';
  trainer: TrainerName; // Now restricted to Mike or Jordan
  room?: string;
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