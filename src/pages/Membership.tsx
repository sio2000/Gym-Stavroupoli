import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  CheckCircle, 
  TrendingUp,
  Award,
  Zap,
  Clock,
  Calendar,
  Lock,
  ChevronDown,
  Play,
  ExternalLink
} from 'lucide-react';
import { 
  mockMemberships, 
  mockMembershipPackages, 
  mockPayments
} from '@/data/mockData';
import { formatDate, formatCurrency, getPaymentStatusName } from '@/utils';
import { 
  getMembershipPackages, 
  getMembershipPackageDurations, 
  createMembershipRequest,
  getUserMembershipRequests,
  getUserActiveMemberships,
  checkUserHasActiveMembership,
  getDurationLabel,
  getDurationDisplayText,
  formatPrice,
  getPilatesPackageDurations,
  createPilatesMembershipRequest,
  getUltimatePackageDurations,
  createUltimateMembershipRequest
} from '@/utils/membershipApi';
import { isInstallmentsEligible } from '@/utils/installmentsEligibility';
import { MembershipPackage, MembershipPackageDuration, MembershipRequest, Membership as MembershipType } from '@/types';
import toast from 'react-hot-toast';
import SuccessPopup from '@/components/SuccessPopup';

const MembershipPage: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<MembershipPackageDuration | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPackageName, setSuccessPackageName] = useState('');
  const [showPersonalTrainingModal, setShowPersonalTrainingModal] = useState(false);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations, setPackageDurations] = useState<MembershipPackageDuration[]>([]);
  const [pilatesDurations, setPilatesDurations] = useState<MembershipPackageDuration[]>([]);
  const [ultimateDurations, setUltimateDurations] = useState<MembershipPackageDuration[]>([]);
  const [userRequests, setUserRequests] = useState<MembershipRequest[]>([]);
  const [userMemberships, setUserMemberships] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  
  // Installments state
  const [hasInstallments, setHasInstallments] = useState(false);

  // Get user's active membership from mock data (for backward compatibility)
  const userMembership = mockMemberships.find(m => m.user_id === user?.id);
  
  // Get user's payments
  const userPayments = mockPayments.filter(p => p.userId === user?.id);

  // Workout program data
  const workoutPrograms = {
    'upper-body': {
      title: 'Άνω Μέρος Σώματος',
      icon: '💪',
      exercises: [
        {
          name: 'Push-ups',
          description: 'Κλασικές push-ups για ενδυνάμωση στήθους και τρικεφάλων',
          youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          sets: '3 x 10-15'
        },
        {
          name: 'Pull-ups',
          description: 'Pull-ups για ενδυνάμωση ράχης και δικεφάλων',
          youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
          sets: '3 x 5-10'
        },
        {
          name: 'Dumbbell Press',
          description: 'Κάθισμα με dumbells για στήθος',
          youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          sets: '3 x 8-12'
        },
        {
          name: 'Lateral Raises',
          description: 'Πλαγίες ανυψώσεις για ώμους',
          youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
          sets: '3 x 10-15'
        }
      ]
    },
    'lower-body': {
      title: 'Κάτω Μέρος Σώματος',
      icon: '🦵',
      exercises: [
        {
          name: 'Squats',
          description: 'Κλασικές squats για ενδυνάμωση μηρών και γλουτών',
          youtubeUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
          sets: '3 x 15-20'
        },
        {
          name: 'Lunges',
          description: 'Lunges για ενδυνάμωση μηρών και ισορροπία',
          youtubeUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
          sets: '3 x 10-12 κάθε πόδι'
        },
        {
          name: 'Deadlifts',
          description: 'Deadlifts για ενδυνάμωση ράχης και μηρών',
          youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
          sets: '3 x 8-10'
        },
        {
          name: 'Calf Raises',
          description: 'Ανυψώσεις αστραγάλων για ενδυνάμωση μοσχών',
          youtubeUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
          sets: '3 x 15-20'
        }
      ]
    },
    'full-body': {
      title: 'Πλήρες Σώμα',
      icon: '🔥',
      exercises: [
        {
          name: 'Burpees',
          description: 'Burpees για πλήρη ενδυνάμωση και καρδιαγγειακό',
          youtubeUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU',
          sets: '3 x 8-12'
        },
        {
          name: 'Mountain Climbers',
          description: 'Mountain climbers για καρδιαγγειακό και πυρήνα',
          youtubeUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
          sets: '3 x 20-30 δευτερόλεπτα'
        },
        {
          name: 'Plank',
          description: 'Plank για ενδυνάμωση πυρήνα',
          youtubeUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          sets: '3 x 30-60 δευτερόλεπτα'
        },
        {
          name: 'Jumping Jacks',
          description: 'Jumping jacks για καρδιαγγειακό',
          youtubeUrl: 'https://www.youtube.com/watch?v=1b98WrRrmUs',
          sets: '3 x 30-60 δευτερόλεπτα'
        }
      ]
    },
    'cardio': {
      title: 'Καρδιαγγειακή Προπόνηση',
      icon: '❤️',
      exercises: [
        {
          name: 'High Knees',
          description: 'Υψηλά γόνατα για καρδιαγγειακό και ενδυνάμωση μηρών',
          youtubeUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU',
          sets: '3 x 30-45 δευτερόλεπτα'
        },
        {
          name: 'Jump Rope',
          description: 'Σκοινάκι για καρδιαγγειακό και συντονισμό',
          youtubeUrl: 'https://www.youtube.com/watch?v=1b98WrRrmUs',
          sets: '3 x 1-2 λεπτά'
        },
        {
          name: 'Box Jumps',
          description: 'Πηδήματα σε κουτί για δύναμη και καρδιαγγειακό',
          youtubeUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
          sets: '3 x 8-12'
        },
        {
          name: 'Battle Ropes',
          description: 'Σχοινιά μάχης για καρδιαγγειακό και αντοχή',
          youtubeUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          sets: '3 x 20-30 δευτερόλεπτα'
        }
      ]
    },
    'flexibility': {
      title: 'Ευλυγισία & Χάλαση',
      icon: '🧘',
      exercises: [
        {
          name: 'Yoga Flow',
          description: 'Βασική ακολουθία yoga για ευλυγισία και χαλάρωση',
          youtubeUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
          sets: '1 x 15-20 λεπτά'
        },
        {
          name: 'Hip Flexor Stretch',
          description: 'Τέντωμα μυών ισχίου για ευλυγισία',
          youtubeUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
          sets: '2 x 30 δευτερόλεπτα κάθε πόδι'
        },
        {
          name: 'Shoulder Stretch',
          description: 'Τέντωμα ώμων για ευλυγισία και χαλάρωση',
          youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
          sets: '2 x 20 δευτερόλεπτα κάθε χέρι'
        },
        {
          name: 'Spinal Twist',
          description: 'Στριφογυρισμός σπονδυλικής στήλης για ευλυγισία',
          youtubeUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          sets: '2 x 30 δευτερόλεπτα κάθε πλευρά'
        }
      ]
    }
  };

  useEffect(() => {
    loadPackages();
    loadUserRequests();
    loadUserMemberships();
    loadPilatesDurations();
    loadUltimateDurations();
  }, []);


  const loadPackages = async () => {
    // console.log('[Membership] ===== LOADING PACKAGES =====');
    setLoading(true);
    try {
      const packagesData = await getMembershipPackages();
      // console.log('[Membership] Packages loaded:', packagesData);
      // console.log('[Membership] Pilates package found:', packagesData.find(p => p.name === 'Pilates'));
      setPackages(packagesData);
    } catch (error) {
      console.error('[Membership] Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRequests = async () => {
    if (!user?.id) return;
    try {
      const requests = await getUserMembershipRequests(user.id);
      setUserRequests(requests);
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const loadUserMemberships = async () => {
    if (!user?.id) return;
    try {
      const memberships = await getUserActiveMemberships(user.id);
      setUserMemberships(memberships);
    } catch (error) {
      console.error('Error loading user memberships:', error);
    }
  };

  const loadPackageDurations = async (packageId: string) => {
    try {
      const durations = await getMembershipPackageDurations(packageId);
      setPackageDurations(durations);
    } catch (error) {
      console.error('Error loading package durations:', error);
    }
  };

  const loadPilatesDurations = async () => {
    try {
      const durations = await getPilatesPackageDurations();
      setPilatesDurations(durations);
    } catch (error) {
      console.error('Error loading Pilates durations:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των επιλογών Pilates');
    }
  };

  const loadUltimateDurations = async () => {
    try {
      const durations = await getUltimatePackageDurations();
      setUltimateDurations(durations);
    } catch (error) {
      console.error('Error loading Ultimate durations:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των επιλογών Ultimate');
    }
  };

  const handlePackageSelect = async (pkg: MembershipPackage) => {
    // Check if user already has an active membership for this package
    if (user?.id) {
      const hasActiveMembership = await checkUserHasActiveMembership(user.id, pkg.id);
      if (hasActiveMembership) {
        toast.error('Έχετε ήδη ενεργή συνδρομή για αυτό το πακέτο');
        return;
      }
    }

    setSelectedPackage(pkg);
    
    // Load appropriate durations based on package type
    if (pkg.name === 'Pilates') {
      setPackageDurations(pilatesDurations);
    } else if (pkg.name === 'Ultimate' || pkg.name === 'Ultimate Medium') {
      setPackageDurations(ultimateDurations);
    } else {
      loadPackageDurations(pkg.id);
    }
    
    // Reset installments state when selecting a new package
    setHasInstallments(false);
    
    setShowPurchaseModal(true);
  };

  const handleDurationSelect = (duration: MembershipPackageDuration) => {
    setSelectedDuration(duration);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || !selectedDuration || !user?.id) return;

    console.log('[Membership] Starting purchase process:', {
      selectedPackage: selectedPackage?.name,
      selectedDuration: selectedDuration?.duration_type,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role
    });

    try {
      // Add a small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if this is a Pilates package
      if (selectedPackage.name === 'Pilates') {
        await createPilatesMembershipRequest(
          selectedPackage.id,
          selectedDuration.duration_type,
          selectedDuration.classes_count || 0,
          selectedDuration.price,
          user.id,
          hasInstallments
        );
      } else if (selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium') {
        await createUltimateMembershipRequest(
          selectedPackage.id,
          selectedDuration.duration_type,
          selectedDuration.price,
          hasInstallments,
          user.id
        );
      } else {
        await createMembershipRequest(
          selectedPackage.id,
          selectedDuration.duration_type,
          selectedDuration.price,
          hasInstallments
        );
      }
      
      // Show success popup instead of toast
      setSuccessPackageName(selectedPackage.name);
      setShowSuccessPopup(true);
      setShowPurchaseModal(false);
      setSelectedPackage(null);
      setSelectedDuration(null);
      loadUserRequests();
    } catch (error) {
      console.error('Error creating membership request:', error);
      if (selectedPackage.name === 'Pilates') {
        toast.error('Σφάλμα κατά τη δημιουργία του αιτήματος Pilates');
      } else {
        toast.error('Σφάλμα κατά τη δημιουργία του αιτήματος');
      }
    }
  };


  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getMembershipProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalTime = end.getTime() - start.getTime();
    const elapsedTime = today.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
  };

  const getRequestStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Σε Αναμονή' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Εγκεκριμένο' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Απορριφθέν' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };


  // Pilates package will be loaded from database

  // Filter to only keep the three desired packages: Free Gym, Pilates, Personal Training
  const filteredMockPackages = mockMembershipPackages.filter(pkg => 
    ['Personal Training'].includes(pkg.name)
  );

  // Filter database packages to include Free Gym, Pilates, Ultimate, and Ultimate Medium
  const filteredDatabasePackages = packages.filter(pkg => 
    pkg.name === 'Free Gym' || pkg.name === 'Pilates' || pkg.name === 'Ultimate' || pkg.name === 'Ultimate Medium'
  );

  // Combine filtered packages
  const allPackages = [
    ...filteredMockPackages, 
    ...filteredDatabasePackages
  ];

  // Debug logging - REMOVED TO PREVENT UNNECESSARY RENDERS
  // console.log('[Membership] All packages:', allPackages);
  // console.log('[Membership] Filtered database packages:', filteredDatabasePackages);
  // console.log('[Membership] Pilates in allPackages:', allPackages.find(p => p.name === 'Pilates'));

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-0">Διαχείριση Συνδρομής</h1>
          <p className="text-sm sm:text-base text-gray-300">Διαχειριστείτε τη συνδρομή και τις πιστώσεις σας</p>
        </div>

      {/* Active Memberships */}
      {userMemberships.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <h2 className="text-xl font-bold text-primary-900 mb-4">Ενεργές Συνδρομές</h2>
          <div className="space-y-4">
            {userMemberships.map((membership) => (
              <div key={membership.id} className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-600 rounded-lg">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary-900">
                        {membership.package?.name}
                      </h3>
                      <p className="text-primary-700">
                        {getDurationLabel(membership.duration_type)} - {formatPrice(membership.duration?.price || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700">
                      {getDaysRemaining(membership.end_date)} ημέρες ακόμα
                    </div>
                    <div className="text-xs text-primary-600">
                      Λήγει: {formatDate(membership.end_date)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-primary-700 mb-2">
                    <span>Πρόοδος συνδρομής</span>
                    <span>{getDaysRemaining(membership.end_date)} ημέρες ακόμα</span>
                  </div>
                  <div className="w-full bg-primary-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getMembershipProgress(membership.start_date, membership.end_date)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Active Membership (for backward compatibility) */}
      {userMembership && userMemberships.length === 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-600 rounded-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-900">Ενεργή Συνδρομή</h2>
                <p className="text-primary-700">
                  {allPackages.find(p => p.id === userMembership.package_id)?.name || 'Unknown Package'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-900">
                {(userMembership as any).credits || 0} πιστώσεις
              </div>
              <p className="text-primary-700">διαθέσιμες</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-primary-700 mb-2">
              <span>Πρόοδος συνδρομής</span>
              <span>{getDaysRemaining(userMembership.end_date)} ημέρες ακόμα</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getMembershipProgress(userMembership.start_date, userMembership.end_date)}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-900">
                {formatDate(userMembership.start_date)}
              </div>
              <p className="text-sm text-primary-700">Ημερομηνία έναρξης</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-900">
                {formatDate(userMembership.end_date)}
              </div>
              <p className="text-sm text-primary-700">Ημερομηνία λήξης</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-900">
                {(userMembership as any).auto_renew ? 'Ναι' : 'Όχι'}
              </div>
              <p className="text-sm text-primary-700">Αυτόματη ανανέωση</p>
            </div>
          </div>
        </div>
      )}

      {/* Available Packages */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Διαθέσιμα Πακέτα</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allPackages.map((pkg) => {
              const isSpecial = pkg.name === 'Personal Training'; // Personal Training package
              const isFreeGym = pkg.name === 'Free Gym'; // Free Gym package
              const isPilates = pkg.name === 'Pilates'; // Pilates package
              const isUltimate = pkg.name === 'Ultimate' || pkg.name === 'Ultimate Medium'; // Ultimate packages
              // const hasPersonalTraining = userMemberships.some(m => m.package_id === pkg.id);
              // Check if user has active membership for this package type
              const isLocked = userMemberships.some(m => {
                // For Personal Training, check if user has any personal training membership
                // Only lock if user already has Personal Training, not for other package types
                if (pkg.name === 'Personal Training') {
                  return (m.package?.name === 'Personal Training' || 
                         m.package?.package_type === 'personal_training');
                }
                // For Ultimate packages, check if user has any Ultimate-sourced memberships
                if (pkg.name === 'Ultimate' || pkg.name === 'Ultimate Medium') {
                  return m.package?.name === 'Ultimate' || m.package?.name === 'Ultimate Medium' ||
                         m.package?.package_type === 'ultimate' ||
                         (m as any).source_package_name === 'Ultimate' || (m as any).source_package_name === 'Ultimate Medium'; // Check Ultimate-sourced memberships
                }
                // For other packages, check by package_id
                return m.package_id === pkg.id;
              });
              
              return (
                <div 
                  key={pkg.id} 
                  className={`relative bg-white border-2 rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-300 ${
                    isLocked
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-75'
                      : isSpecial 
                        ? 'border-purple-300 hover:border-purple-400 cursor-pointer hover:shadow-xl' 
                        : isFreeGym
                          ? 'border-green-300 hover:border-green-400 cursor-pointer hover:shadow-xl'
                          : isPilates
                            ? 'border-pink-300 hover:border-pink-400 cursor-pointer hover:shadow-xl'
                            : isUltimate
                              ? 'border-orange-300 hover:border-orange-400 cursor-pointer hover:shadow-xl'
                              : 'border-gray-200 hover:border-primary-300 cursor-pointer hover:shadow-xl'
                  }`}
                  onClick={() => isLocked ? null : (!isSpecial ? handlePackageSelect(pkg) : null)}
                >
                  {isLocked && (
                    <div className="absolute -top-2 -right-2 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>Κλειδωμένο</span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center ${
                      isSpecial 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : isFreeGym
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : isPilates
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                            : isUltimate
                              ? 'bg-gradient-to-br from-orange-500 to-red-500'
                              : 'bg-gradient-to-br from-primary-500 to-primary-600'
                    }`}>
                      {isSpecial ? (
                        <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      ) : isFreeGym ? (
                        <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      ) : isPilates ? (
                        <span className="text-xl sm:text-2xl">🧘</span>
                      ) : isUltimate ? (
                        <span className="text-xl sm:text-2xl">👑</span>
                      ) : (
                        <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      )}
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {pkg.name === 'Free Gym' ? 'Open Gym' : 
                       pkg.name === 'Ultimate Medium' ? 'Ultra Gym' : 
                       pkg.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{pkg.description}</p>
                    
                    {isLocked ? (
                      <div className="space-y-2">
                        <div className="text-lg font-bold text-gray-500">
                          Έχετε ήδη συνδρομή
                        </div>
                        <div className="text-sm text-gray-400">
                          Αυτό το πακέτο είναι κλειδωμένο
                        </div>
                      </div>
                    ) : isSpecial ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">Αξέχαστη εμπειρία</div>
                          <div className="text-xs text-gray-500">Εξειδικευμένη προπόνηση</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPersonalTrainingModal(true);
                          }}
                          className="w-full bg-purple-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm sm:text-base"
                        >
                          Επιλέξτε Πακέτο
                        </button>
                      </div>
                    ) : isFreeGym ? (
                      <div className="space-y-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackageSelect(pkg);
                          }}
                          className="w-full bg-green-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base"
                        >
                          Επιλέξτε Πακέτο
                        </button>
                      </div>
                    ) : isPilates ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">Από</div>
                          <div className="text-2xl font-bold text-pink-600">
                            {formatPrice(6.00)}
                          </div>
                          <div className="text-xs text-gray-500">για 1 μάθημα</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackageSelect(pkg);
                          }}
                          className="w-full bg-pink-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-pink-700 transition-colors font-semibold text-sm sm:text-base"
                        >
                          Επιλέξτε Πακέτο
                        </button>
                      </div>
                    ) : isUltimate ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">Από</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {formatPrice(pkg.price)}
                          </div>
                          <div className="text-xs text-gray-500">για 1 έτος</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackageSelect(pkg);
                          }}
                          className="w-full bg-orange-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm sm:text-base"
                        >
                          Επιλέξτε Πακέτο
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-primary-600">
                          {formatCurrency(pkg.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pkg.duration_days || 30} ημέρες
                        </div>
                        <button className="w-full bg-primary-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base">
                          Επιλέξτε Πακέτο
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workout Programs - Enhanced UI/UX */}
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden"
        style={{
          animation: 'fadeInUp 0.6s ease-out forwards',
          opacity: 0
        }}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Προγράμματα Προπόνησης</h2>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Επιλέξτε την κατηγορία που σας ενδιαφέρει</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Object.entries(workoutPrograms).map(([key, program], index) => (
              <div
                key={key}
                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden hover:scale-105 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  opacity: 0
                }}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedWorkout(expandedWorkout === key ? null : key)}
                  className="w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl hover:bg-blue-50/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div 
                        className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0"
                      >
                        <span className="text-2xl sm:text-3xl">{program.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 truncate">
                          {program.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {program.exercises.length} ασκήσεις διαθέσιμες
                        </p>
                      </div>
                    </div>
                    <div
                      className={`transition-transform duration-300 flex-shrink-0 ${expandedWorkout === key ? 'rotate-180' : 'rotate-0'}`}
                    >
                      <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                    </div>
                  </div>
                </button>
                
                {/* Expanded Content */}
                {expandedWorkout === key && (
                  <div
                    className="overflow-hidden transition-all duration-400 ease-in-out"
                    style={{
                      animation: 'slideDown 0.4s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6">
                        {program.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                            className="group/exercise bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-105 hover:-translate-y-1"
                            style={{
                              animationDelay: `${exerciseIndex * 100}ms`,
                              animation: 'fadeInScale 0.4s ease-out forwards',
                              opacity: 0
                            }}
                          >
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg group-hover/exercise:text-blue-700 transition-colors duration-300 truncate">
                                  {exercise.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                                  {exercise.description}
                                </p>
                                <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {exercise.sets}
                                </div>
                              </div>
                            </div>
                            
                            <a
                              href={exercise.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 transition-all duration-300 text-xs sm:text-sm font-semibold group-hover/exercise:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:scale-105 w-full sm:w-auto justify-center sm:justify-start"
                            >
                              <div className="p-1 sm:p-1.5 bg-red-100 rounded-lg group-hover/exercise:bg-red-200 transition-colors duration-300 group-hover/exercise:rotate-360">
                                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                              <span>Δες το βίντεο</span>
                              <ExternalLink className="h-3 w-3 group-hover/exercise:translate-x-1 transition-transform duration-300" />
                            </a>
                          </div>
                        ))}
                      </div>
                      
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      {userPayments.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Πρόσφατες Πληρωμές</h2>
          <div className="space-y-3">
            {userPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {allPackages.find(p => p.id === payment.membershipId)?.name || 'Unknown Package'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(payment.amount)} • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  payment.status === 'completed' as any 
                    ? 'bg-green-100 text-green-800' 
                    : payment.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {getPaymentStatusName(payment.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Membership Requests */}
      {userRequests.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Αιτήματα Συνδρομής</h2>
          <div className="space-y-3">
            {userRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {request.package?.name} - {getDurationLabel(request.duration_type)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatPrice(request.requested_price)} • {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
                {getRequestStatusBadge(request.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 flex flex-col">
            {/* Header with gradient */}
            <div className={`relative p-6 pb-4 ${
              selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium' 
                ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500' 
                : selectedPackage.name === 'Pilates'
                ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500'
                : selectedPackage.name === 'Free Gym'
                ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500'
            }`}>
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  {selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium' ? (
                    <span className="text-2xl">👑</span>
                  ) : selectedPackage.name === 'Pilates' ? (
                    <span className="text-2xl">🧘</span>
                  ) : selectedPackage.name === 'Free Gym' ? (
                    <Award className="h-8 w-8 text-white" />
                  ) : (
                    <Zap className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Επιλογή Πακέτου
                  </h3>
                  <p className="text-white/90 text-sm">
                    {selectedPackage.name === 'Free Gym' ? 'Open Gym' : 
                     selectedPackage.name === 'Ultimate Medium' ? 'Ultra Gym' : 
                     selectedPackage.name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 pt-4">
              
              {packageDurations.length > 0 ? (
                <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-700">Επιλέξτε Διάρκεια:</h4>
                </div>
                {packageDurations
                  .filter((duration) => {
                    // Filter for Ultimate Medium - show only 400€ option
                    if (selectedPackage.name === 'Ultimate Medium') {
                      return duration.price === 400;
                    }
                    // Filter for Ultimate - show only 500€ option
                    if (selectedPackage.name === 'Ultimate') {
                      return duration.price === 500;
                    }
                    // For other packages, show all options
                    return true;
                  })
                  .sort((a, b) => {
                    // For Pilates packages, sort by classes_count
                    if (selectedPackage.name === 'Pilates' && a.classes_count && b.classes_count) {
                      return a.classes_count - b.classes_count;
                    }
                    
                    // For other packages, use custom sorting by duration_type
                    const order = { 'lesson': 1, 'month': 30, '3 Μήνες': 90, 'semester': 180, 'year': 365 };
                    const aOrder = order[a.duration_type as keyof typeof order] || a.duration_days;
                    const bOrder = order[b.duration_type as keyof typeof order] || b.duration_days;
                    return aOrder - bOrder;
                  })
                  .map((duration) => (
                  <div 
                    key={duration.id}
                    className={`group relative p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      selectedDuration?.id === duration.id
                        ? `${
                            selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                              ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg'
                              : selectedPackage.name === 'Pilates'
                              ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50 shadow-lg'
                              : selectedPackage.name === 'Free Gym'
                              ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                              : 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                          }`
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleDurationSelect(duration)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium' ? (
                            <span className="text-lg">👑</span>
                          ) : selectedPackage.name === 'Pilates' ? (
                            <span className="text-lg">🧘</span>
                          ) : selectedPackage.name === 'Free Gym' ? (
                            <Award className="h-4 w-4 text-green-600" />
                          ) : (
                            <Zap className="h-4 w-4 text-blue-600" />
                          )}
                          <h5 className="font-bold text-gray-900 text-lg">
                            {getDurationLabel(duration.duration_type)}
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {(['Ultimate', 'Ultimate Medium'].includes(selectedPackage.name)) && (duration.duration_type as any === 'ultimate_1year' || duration.duration_type as any === 'ultimate_medium_1year')
                            ? selectedPackage.name === 'Ultimate Medium' 
                              ? 'Διαθέσιμα έως 1 μάθημα την εβδομάδα'
                              : 'Διαθέσιμα έως 3 μαθήματα την εβδομάδα'
                            : (duration.classes_count ? `${duration.classes_count} μαθήματα` : getDurationDisplayText(duration.duration_type, duration.duration_days))
                          }
                        </p>
                        {/* Special description for Ultimate packages */}
                        {(['Ultimate', 'Ultimate Medium'].includes(selectedPackage.name)) && (duration.duration_type as any === 'ultimate_1year' || duration.duration_type as any === 'ultimate_medium_1year') && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">🏋️‍♀️</span>
                            <p className="text-xs text-blue-600 font-medium">
                              1 έτος Pilates + 1 έτος ελεύθερο γυμναστήριο
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${
                          selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                            ? 'text-orange-600'
                            : selectedPackage.name === 'Pilates'
                            ? 'text-pink-600'
                            : selectedPackage.name === 'Free Gym'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}>
                          {formatPrice(duration.price)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Ευρώ</div>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedDuration?.id === duration.id && (
                      <div className="absolute -top-2 -right-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                            ? 'bg-orange-500'
                            : selectedPackage.name === 'Pilates'
                            ? 'bg-pink-500'
                            : selectedPackage.name === 'Free Gym'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}>
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Επιλογή Δόσεων για συγκεκριμένα πακέτα */}
                {selectedDuration && (
                  (() => {
                    if (!isInstallmentsEligible(selectedPackage.name, selectedDuration.duration_type)) return null;
                    return (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      hasInstallments 
                        ? `${
                            selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                              ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-red-50'
                              : selectedPackage.name === 'Pilates'
                              ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50'
                              : selectedPackage.name === 'Free Gym'
                              ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
                              : 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'
                          }`
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                      <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                        hasInstallments 
                          ? `${
                              selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                                ? 'border-orange-500 bg-orange-500'
                                : selectedPackage.name === 'Pilates'
                                ? 'border-pink-500 bg-pink-500'
                                : selectedPackage.name === 'Free Gym'
                                ? 'border-green-500 bg-green-500'
                                : 'border-blue-500 bg-blue-500'
                            }`
                          : 'border-gray-300 bg-white'
                      }`}>
                        {hasInstallments && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        id="installments"
                        checked={hasInstallments}
                        onChange={(e) => setHasInstallments(e.target.checked)}
                        className="absolute opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">💳</span>
                        <label htmlFor="installments" className="text-sm font-semibold text-gray-700 cursor-pointer">
                          Πληρωμή με δόσεις
                        </label>
                      </div>
                    </div>
                    
                    {hasInstallments && (
                      <div className={`border-2 rounded-2xl p-4 transition-all duration-300 ${
                        selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                          ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50'
                          : selectedPackage.name === 'Pilates'
                          ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50'
                          : selectedPackage.name === 'Free Gym'
                          ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                          : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                                ? 'bg-orange-100'
                                : selectedPackage.name === 'Pilates'
                                ? 'bg-pink-100'
                                : selectedPackage.name === 'Free Gym'
                                ? 'bg-green-100'
                                : 'bg-blue-100'
                            }`}>
                              <span className="text-lg">ℹ️</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-bold mb-2 ${
                              selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                                ? 'text-orange-900'
                                : selectedPackage.name === 'Pilates'
                                ? 'text-pink-900'
                                : selectedPackage.name === 'Free Gym'
                                ? 'text-green-900'
                                : 'text-blue-900'
                            }`}>
                              Πληρωμή με Δόσεις
                            </h4>
                            <p className={`text-sm leading-relaxed ${
                              selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                                ? 'text-orange-700'
                                : selectedPackage.name === 'Pilates'
                                ? 'text-pink-700'
                                : selectedPackage.name === 'Free Gym'
                                ? 'text-green-700'
                                : 'text-blue-700'
                            }`}>
                              Με την ενεργοποίηση αυτής της επιλογής, μπορείτε να πληρώσετε το πακέτο με έως 3 δόσεις στο γυμναστήριο.
                              Ο διαχειριστής θα καθορίσει τα ακριβή ποσά και τις ημερομηνίες πληρωμής.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                    );
                  })()
                )}
              </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                    <span className="text-4xl">😔</span>
                  </div>
                  <p className="text-gray-600 mb-4">Δεν υπάρχουν διαθέσιμες επιλογές διάρκειας.</p>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-all duration-300 font-semibold hover:scale-105"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>🚪</span>
                      <span>Κλείσιμο</span>
                    </span>
                  </button>
                </div>
              )}
              </div>
            </div>
            
            {/* Fixed bottom section with buttons */}
            <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-100">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 font-semibold text-gray-700 hover:scale-105"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>❌</span>
                    <span>Ακύρωση</span>
                  </span>
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={!selectedDuration}
                  className={`flex-1 px-6 py-3 rounded-2xl text-white font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    selectedPackage.name === 'Ultimate' || selectedPackage.name === 'Ultimate Medium'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
                      : selectedPackage.name === 'Pilates'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                      : selectedPackage.name === 'Free Gym'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>✅</span>
                    <span>Επιβεβαίωση</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        packageName={successPackageName}
      />

      {/* Personal Training Modal */}
      {showPersonalTrainingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header with gym-themed gradient */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl">💪</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">
                  Personal Training
                </h3>
                
                <div className="flex items-center justify-center space-x-2 text-white/90">
                  <span className="text-lg">🏋️‍♂️</span>
                  <span className="text-sm font-medium">Εξειδικευμένη Προπόνηση</span>
                  <span className="text-lg">🏋️‍♀️</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📋</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Εγγραφή στη Γραμματεία</h4>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✍️</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Για να γίνετε μέλος στο <span className="font-bold text-purple-600">Personal Training</span> πρέπει να μεταβείτε στην γραμματεία του γυμναστηρίου για να ολοκληρώσετε την εγγραφή σας.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPersonalTrainingModal(false)}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-4 rounded-2xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-semibold hover:scale-105 shadow-md"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>👍</span>
                    <span>Κατάλαβα</span>
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    // Open map with gym location
                    const gymAddress = "Μαιάνδρου 43, Κορδελιό Εύοσμος 562 24";
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gymAddress)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-bold hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🗺️</span>
                    <span>Βρείτε το Γυμναστήριο</span>
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </button>
              </div>
              
              {/* Gym info footer */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>🏢</span>
                    <span>Μαιάνδρου 43</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>Κορδελιό Εύοσμος</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
});

export default MembershipPage;