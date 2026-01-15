import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  CheckCircle, 
  TrendingUp,
  Award,
  Zap,
  Clock,
  Calendar,
  ChevronDown,
  Play,
  ExternalLink,
  X
} from 'lucide-react';
import { 
  mockMemberships, 
  mockMembershipPackages, 
  mockPayments
} from '@/data/mockData';
import { formatDate, formatCurrency, getPaymentStatusName } from '@/utils';
import { 
  getMembershipPackages, 
  createMembershipRequest,
  getUserActiveMemberships,
  getDurationLabel,
  getDurationDisplayText,
  formatPrice,
  createPilatesMembershipRequest,
  createUltimateMembershipRequest,
  getSmartDurationLabel
} from '@/utils/membershipApi';
import { getActiveBanners, Banner } from '@/utils/bannersApi';
import { isInstallmentsEligible } from '@/utils/installmentsEligibility';
import { MembershipPackage, MembershipPackageDuration, MembershipRequest, Membership as MembershipType } from '@/types';
import toast from 'react-hot-toast';
import SuccessPopup from '@/components/SuccessPopup';
import {
  WorkoutCategory,
  WorkoutExercise,
  CombinedWorkoutProgram,
  getWorkoutCategories,
  getWorkoutExercises,
  getCombinedWorkoutPrograms
} from '@/utils/workoutProgramsApi';

// Helper function για να εμφανίζουμε "Open Gym" αντί για "Free Gym" μόνο στο UI
const formatPackageNameForUser = (packageName: string | null | undefined): string => {
  if (!packageName) return '';
  if (packageName === 'Free Gym') return 'Open Gym';
  return packageName;
};

const MembershipPage: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<MembershipPackageDuration | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPackageName, setSuccessPackageName] = useState('');
  const [showPersonalTrainingModal, setShowPersonalTrainingModal] = useState(false);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [packageDurations] = useState<MembershipPackageDuration[]>([]);
  const [userMemberships, setUserMemberships] = useState<MembershipType[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  // Selection state for Combined Programs filtering (Level -> Program)
  const [selectedLevelByProgram, setSelectedLevelByProgram] = useState<Record<string, string | null>>({});
  const [selectedProgramByProgram, setSelectedProgramByProgram] = useState<Record<string, number | null>>({});
  const [bannerPreview, setBannerPreview] = useState<Banner | null>(null);
  
  // Workout programs state
  const [workoutCategories, setWorkoutCategories] = useState<WorkoutCategory[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [combinedPrograms, setCombinedPrograms] = useState<CombinedWorkoutProgram[]>([]);
  const [workoutProgramsLoading, setWorkoutProgramsLoading] = useState(false);
  
  // Installments state
  const [hasInstallments, setHasInstallments] = useState(false);

  // Get user's active membership from mock data (for backward compatibility)
  const userMembership = mockMemberships.find(m => m.user_id === user?.id);
  
  // Get user's payments
  const userPayments = mockPayments.filter(p => p.userId === user?.id);

  // Transform database data to workout programs format
  const workoutPrograms = useMemo(() => {
    const programs: Record<string, {
      title: string;
      icon: string;
      exercises: Array<{
        name: string;
        description: string;
        youtubeUrl: string;
        sets: string;
      }>;
    }> = {};

    // Deduplicate categories by name (keep first occurrence)
    const seenNames = new Set<string>();
    const uniqueCategories = workoutCategories.filter(category => {
      if (seenNames.has(category.name)) {
        return false;
      }
      seenNames.add(category.name);
      return true;
    });

    // Group exercises by category
    uniqueCategories.forEach(category => {
      const categoryExercises = workoutExercises
        .filter(ex => ex.category_id === category.id)
        .map(ex => {
          const setConfig = ex.set_config;
          let setsText = '';
          if (setConfig) {
            if (setConfig.reps_text) {
              setsText = `${setConfig.sets} x ${setConfig.reps_text}`;
            } else if (setConfig.reps_min && setConfig.reps_max) {
              setsText = `${setConfig.sets} x ${setConfig.reps_min}-${setConfig.reps_max}`;
            } else if (setConfig.reps_min) {
              setsText = `${setConfig.sets} x ${setConfig.reps_min}`;
            } else {
              setsText = `${setConfig.sets} sets`;
            }
            if (setConfig.rest_seconds) {
              setsText += ` (${setConfig.rest_seconds}s rest)`;
            }
          }
          
          return {
            name: ex.name,
            description: ex.description || '',
            youtubeUrl: ex.youtube_url || 'https://www.youtube.com',
            sets: setsText
          };
        });

      if (categoryExercises.length > 0) {
        programs[category.id] = {
          title: category.name,
          icon: category.icon || '💪',
          exercises: categoryExercises
        };
      }
    });

    // NO HARDCODED FALLBACK - Only use database data
    return programs;
  }, [workoutCategories, workoutExercises]);

  // Transform combined programs
  const combinedProgramsFormatted = useMemo(() => {
    return combinedPrograms.map(program => ({
      id: program.id,
      title: program.name || (program.program_type === 'upper-body' ? 'Άνω μέρος σώματος (Up body)' :
                              program.program_type === 'lower-body' ? 'Κάτω μέρος σώματος (Down body)' :
                              program.program_type === 'full-body' ? 'Όλο το σώμα (Full body)' :
                              program.program_type === 'pyramidal' ? 'Pyramidal (Πυραμιδική)' :
                              program.program_type === 'warm-up' ? 'Warm up program' :
                              program.program_type === 'cool-down' ? 'Cool down program' :
                              'Ελεύθερα βάρη (Free weights)'),
      description: program.description || (
        program.program_type === 'upper-body' ? 'Συνδυασμός ασκήσεων για άνω μέρος σώματος' :
        program.program_type === 'lower-body' ? 'Συνδυασμός ασκήσεων για κάτω μέρος σώματος' :
        program.program_type === 'full-body' ? 'Συνδυασμός ασκήσεων για όλο το σώμα' :
        program.program_type === 'pyramidal' ? 'Πυραμιδική μεθοδολογία - συνδυασμός ασκήσεων σε "πυραμίδα"' :
        program.program_type === 'warm-up' ? 'Προγράμματα προθέρμανσης' :
        program.program_type === 'cool-down' ? 'Προγράμματα ψύξης' :
        'Συνδυασμός ασκήσεων με ελεύθερα βάρη'
      ),
      icon: '🔲',
      exercises: (program.exercises || []).map(progEx => {
        const ex = progEx.exercise;
        const setsValue = (progEx.sets !== null && progEx.sets !== undefined && !isNaN(Number(progEx.sets))) ? progEx.sets : '-';
        const restValue = (progEx.rest_seconds !== null && progEx.rest_seconds !== undefined && !isNaN(Number(progEx.rest_seconds))) ? progEx.rest_seconds : '-';
        
        let setsText = '';
        if (progEx.reps_text) {
          setsText = `${setsValue} x ${progEx.reps_text}`;
        } else if (progEx.reps_min && progEx.reps_max) {
          setsText = `${setsValue} x ${progEx.reps_min}-${progEx.reps_max}`;
        } else if (progEx.reps_min) {
          setsText = `${setsValue} x ${progEx.reps_min}`;
        } else {
          setsText = `${setsValue} sets`;
        }
        if (restValue !== '-') {
          setsText += ` (${restValue}s rest)`;
        } else {
          setsText += ` (- rest)`;
        }
        
        return {
          name: ex?.name || 'Unknown Exercise',
          description: progEx.notes || ex?.description || '',
          youtubeUrl: ex?.youtube_url || 'https://www.youtube.com',
          sets: setsText,
          weight_kg: progEx.weight_kg,
          rm_percentage: progEx.rm_percentage,
          rpe: progEx.rpe,
          time_seconds: progEx.time_seconds,
          rest_seconds: progEx.rest_seconds,
          method: progEx.method,
          level: progEx.level,
          tempo: progEx.tempo,
          program_number: (progEx as any)?.program_number ?? (progEx as any)?.programNumber ?? null,
          reps_text: progEx.reps_text,
          reps_min: progEx.reps_min,
          reps_max: progEx.reps_max
        };
      })
    }));
  }, [combinedPrograms]);

  useEffect(() => {
    loadPackages();
    loadUserMemberships();
    loadBanners();
    loadWorkoutPrograms();
  }, []);


  const loadPackages = async () => {
    try {
      const packagesData = await getMembershipPackages();
      // console.log('[Membership] Packages loaded:', packagesData);
      // console.log('[Membership] Pilates package found:', packagesData.find(p => p.name === 'Pilates'));
      setPackages(packagesData);
    } catch (error) {
      console.error('[Membership] Error loading packages:', error);
    }
  };

  const loadBanners = async () => {
    try {
      setBannersLoading(true);
      const active = await getActiveBanners();
      setBanners(active.slice(0, 5));
    } catch (error) {
      console.error('[Membership] Error loading banners:', error);
    } finally {
      setBannersLoading(false);
    }
  };

  const loadWorkoutPrograms = async () => {
    try {
      setWorkoutProgramsLoading(true);
      const [categories, exercises, combined] = await Promise.all([
        getWorkoutCategories(),
        getWorkoutExercises(),
        getCombinedWorkoutPrograms()
      ]);
      setWorkoutCategories(categories);
      setWorkoutExercises(exercises);
      setCombinedPrograms(combined);
    } catch (error) {
      console.error('[Membership] Error loading workout programs:', error);
    } finally {
      setWorkoutProgramsLoading(false);
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

  // Sort database packages to ensure Ultra Gym (Ultimate Medium) comes before Ultimate
  const sortedDatabasePackages = filteredDatabasePackages.sort((a, b) => {
    if (a.name === 'Ultimate Medium' && b.name === 'Ultimate') return -1;
    if (a.name === 'Ultimate' && b.name === 'Ultimate Medium') return 1;
    return 0;
  });

  // Combine filtered packages
  const allPackages = [
    ...filteredMockPackages, 
    ...sortedDatabasePackages
  ];

  // Έλεγχος αν υπάρχει ενεργή Open Gym / Free Gym συνδρομή
  const hasOpenGymMembership = useMemo(() => {
    const checkPkg = (pkg?: MembershipPackage | null) => {
      if (!pkg) return false;
      const name = (pkg.name || '').toLowerCase();
      const type = (pkg as any)?.package_type?.toLowerCase?.() || '';
      return type === 'free_gym' || name.includes('open gym') || name.includes('free gym');
    };

    if (userMemberships.length > 0) {
      return userMemberships.some((m) => {
        const pkg = m.package || allPackages.find(p => p.id === m.package_id) || null;
        return checkPkg(pkg);
      });
    }

    if (userMembership) {
      const pkg = allPackages.find(p => p.id === userMembership.package_id) || null;
      return checkPkg(pkg);
    }

    return false;
  }, [userMemberships, userMembership, allPackages]);

  // Έλεγχος αν υπάρχει ενεργή συνδρομή Free Gym, Ultimate ή Ultimate Medium (για να εμφανιστεί το section Προγράμματα Προπόνησης)
  const hasWorkoutProgramsEligibleMembership = useMemo(() => {
    const checkPkg = (pkg?: MembershipPackage | null) => {
      if (!pkg) return false;
      const name = (pkg.name || '').toLowerCase();
      const type = (pkg as any)?.package_type?.toLowerCase?.() || '';
      // Free Gym, Ultimate, ή Ultimate Medium
      return type === 'free_gym' || 
             name.includes('open gym') || 
             name.includes('free gym') ||
             name.includes('ultimate');
    };

    if (userMemberships.length > 0) {
      return userMemberships.some((m) => {
        const pkg = m.package || allPackages.find(p => p.id === m.package_id) || null;
        return checkPkg(pkg);
      });
    }

    if (userMembership) {
      const pkg = allPackages.find(p => p.id === userMembership.package_id) || null;
      return checkPkg(pkg);
    }

    return false;
  }, [userMemberships, userMembership, allPackages]);

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
                        {formatPackageNameForUser(membership.package?.name)}
                      </h3>
                      <p className="text-primary-700">
                        {getSmartDurationLabel(membership.duration_type, membership.start_date, membership.end_date)}
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
                  {formatPackageNameForUser(allPackages.find(p => p.id === userMembership.package_id)?.name) || 'Unknown Package'}
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

      {/* Banners */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 px-6 py-5">
          <h2 className="text-xl font-bold text-white">Προσφορές & Banners</h2>
        </div>

        {bannersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Φόρτωση banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center text-gray-500 py-6">Δεν υπάρχουν διαθέσιμα banners.</div>
        ) : (
          <div className="px-4 py-5">
            <div className="flex flex-col gap-4">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="group relative rounded-3xl border border-gray-100 shadow-2xl bg-white w-full overflow-hidden hover:-translate-y-1 hover:shadow-3xl transition-all duration-300"
                  style={{ animation: 'fadeInUp 0.5s ease', animationDelay: `${index * 80}ms` }}
                >
                  <button
                    type="button"
                    className="w-full h-64 sm:h-72 relative"
                    onClick={() => setBannerPreview(banner)}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none"></div>
                    <span className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-white/90 text-primary-700 font-semibold shadow pointer-events-none">
                      Zoom
                    </span>
                  </button>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900 break-words flex-1">
                        {banner.title || 'Προσφορά'}
                      </h3>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-primary-50 text-primary-700 shrink-0">
                        Promo
                      </span>
                    </div>
                    {banner.target_url && (
                      <a
                        href={banner.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Μάθετε περισσότερα
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {bannerPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setBannerPreview(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setBannerPreview(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={bannerPreview.image_url}
              alt={bannerPreview.title || 'Banner Preview'}
              className="w-full object-contain max-h-[75vh] bg-black"
            />
            {bannerPreview.title && (
              <div className="bg-black/90 px-6 py-4 border-t border-gray-700">
                <p className="text-white text-center text-lg font-medium">
                  {bannerPreview.title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Μεθοδολογίες Προπόνησης Section */}
      {hasWorkoutProgramsEligibleMembership && (
        <TrainingMethodologiesSection />
      )}

      {hasWorkoutProgramsEligibleMembership && (
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
            {workoutProgramsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Φόρτωση προγραμμάτων...</span>
              </div>
            ) : Object.keys(workoutPrograms).length === 0 && combinedProgramsFormatted.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p>Δεν υπάρχουν διαθέσιμα προγράμματα προπόνησης.</p>
              </div>
            ) : (
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
                        <div className="flex-1 w-full">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 break-words">
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
                          {(program.exercises || []).map((exercise: any, exerciseIndex: number) => (
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
                                <div className="flex-1 w-full">
                                  <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg group-hover/exercise:text-blue-700 transition-colors duration-300 break-words">
                                    {exercise.name}
                                  </h4>
                                  {exercise.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed break-words whitespace-normal">
                                      {exercise.description}
                                    </p>
                                  )}
                                  {exercise.sets && (
                                    <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {exercise.sets}
                                    </div>
                                  )}
                                  {exercise.youtubeUrl && exercise.youtubeUrl !== 'https://www.youtube.com' && (
                                    <a
                                      href={exercise.youtubeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200"
                                    >
                                      <span>Δες το βίντεο</span>
                                      <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Combined Programs */}
              {combinedProgramsFormatted.map((program, index) => (
                <div
                  key={program.id}
                  className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden hover:scale-105 hover:-translate-y-2"
                  style={{
                    // Βάλε τα Συνδυαστικά πρώτα στο grid, πριν από τα κανονικά προγράμματα
                    order: -1,
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0
                  }}
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedWorkout(expandedWorkout === program.id ? null : program.id)}
                    className="w-full p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl hover:bg-blue-50/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div 
                          className="p-3 sm:p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0"
                        >
                          <span className="text-2xl sm:text-3xl">{program.icon}</span>
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300 break-words">
                            {program.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                            {program.description}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {program.exercises.length} ασκήσεις διαθέσιμες
                          </p>
                        </div>
                      </div>
                      <div
                        className={`transition-transform duration-300 flex-shrink-0 ${expandedWorkout === program.id ? 'rotate-180' : 'rotate-0'}`}
                      >
                        <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                      </div>
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {expandedWorkout === program.id && (
                    <div
                      className="overflow-hidden transition-all duration-400 ease-in-out"
                      style={{
                        animation: 'slideDown 0.4s ease-out forwards',
                        opacity: 0
                      }}
                    >
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                        {(() => {
                          // --- Stepper: Level -> Program -> Exercises ---
                          const normalizeLevelKey = (raw?: any): 'beginner' | 'intermediate' | 'pro' | null => {
                            if (!raw) return null;
                            const s = String(raw).toLowerCase();
                            // Handle internal keys we store in state
                            if (s === 'beginner') return 'beginner';
                            if (s === 'intermediate') return 'intermediate';
                            if (s === 'pro') return 'pro';
                            if (s.includes('αρχ')) return 'beginner';
                            if (s.includes('προχω') || s.includes('μετρ')) return 'intermediate';
                            if (s.includes('επαγ') || s.includes('ειδικ')) return 'pro';
                            return null;
                          };

                          const levelLabel: Record<'beginner'|'intermediate'|'pro', string> = {
                            beginner: 'Αρχάριος',
                            intermediate: 'Προχωρημένος',
                            pro: 'Επαγγελματίας'
                          };

                          const levelStyle: Record<'beginner'|'intermediate'|'pro', { pill: string; pillSelected: string }> = {
                            beginner: { pill: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', pillSelected: 'bg-red-600 text-white border-red-600' },
                            intermediate: { pill: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100', pillSelected: 'bg-yellow-500 text-white border-yellow-500' },
                            pro: { pill: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', pillSelected: 'bg-green-600 text-white border-green-600' }
                          };

                          const selectedLevelRaw = selectedLevelByProgram[program.id] || null;
                          const selectedLevel = normalizeLevelKey(selectedLevelRaw);
                          const selectedProgram = selectedProgramByProgram[program.id] || null;

                          const exercisesAll = (program.exercises || []) as any[];
                          const availableLevels = Array.from(new Set(exercisesAll.map(e => normalizeLevelKey(e.level)).filter(Boolean))) as Array<'beginner'|'intermediate'|'pro'>;

                          const availablePrograms = Array.from(
                            new Set(
                              exercisesAll
                                .filter(e => selectedLevel && normalizeLevelKey(e.level) === selectedLevel)
                                .map(e => e.program_number)
                                .filter((n:any) => n !== null && n !== undefined)
                            )
                          ).sort((a:any,b:any)=>a-b);

                          if (!selectedLevel) {
                            return (
                              <div className="pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-gray-700">Επίλεξε Επίπεδο</h4>
                                  <span className="text-xs text-gray-500">Βήμα 1/2</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(['beginner','intermediate','pro'] as const).map((lvlKey) => {
                                    const enabled = availableLevels.includes(lvlKey);
                                    return (
                                      <button
                                        key={lvlKey}
                                        onClick={() => {
                                          if (!enabled) return;
                                          setSelectedLevelByProgram(prev => ({ ...prev, [program.id]: lvlKey }));
                                          setSelectedProgramByProgram(prev => ({ ...prev, [program.id]: null }));
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                          enabled ? levelStyle[lvlKey].pill : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                        disabled={!enabled}
                                      >
                                        {levelLabel[lvlKey]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          if (!selectedProgram) {
                            return (
                              <div className="pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`px-2 py-1 rounded-full text-xs border ${levelStyle[selectedLevel].pill}`}>
                                    Level: {levelLabel[selectedLevel]}
                                  </span>
                                  <span className="text-xs text-gray-500">Βήμα 2/2</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-semibold text-gray-700">Επίλεξε Program</h4>
                                  <button
                                    onClick={() => {
                                      setSelectedLevelByProgram(prev => ({ ...prev, [program.id]: null }));
                                      setSelectedProgramByProgram(prev => ({ ...prev, [program.id]: null }));
                                    }}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    ← αλλαγή επιπέδου
                                  </button>
                                </div>
                                {availablePrograms.length === 0 ? (
                                  <div className="text-sm text-gray-500 py-3">
                                    Δεν υπάρχουν διαθέσιμα programs για το επίπεδο «{levelLabel[selectedLevel]}».
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {availablePrograms.map((pn: number) => (
                                      <button
                                        key={pn}
                                        onClick={() => setSelectedProgramByProgram(prev => ({ ...prev, [program.id]: pn }))}
                                        className="px-3 py-1.5 rounded-full text-xs border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                                      >
                                        Program {pn}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          const filtered = exercisesAll.filter(e =>
                            normalizeLevelKey(e.level) === selectedLevel &&
                            e.program_number === selectedProgram
                          );

                          return (
                            <div className="pt-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-1 rounded-full text-xs border ${levelStyle[selectedLevel].pill}`}>
                                    Level: {levelLabel[selectedLevel]}
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs border bg-blue-50 text-blue-700 border-blue-200">
                                    Program {selectedProgram}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setSelectedProgramByProgram(prev => ({ ...prev, [program.id]: null }))}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    αλλαγή program
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProgramByProgram(prev => ({ ...prev, [program.id]: null }));
                                      setSelectedLevelByProgram(prev => ({ ...prev, [program.id]: null }));
                                    }}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    αλλαγή level
                                  </button>
                                </div>
                              </div>

                              {filtered.length === 0 ? (
                                <div className="text-sm text-gray-500 py-3">
                                  Δεν υπάρχουν ασκήσεις στο επιλεγμένο Level/Program.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  {filtered.map((exercise, exerciseIndex) => (
                                    <div
                                      key={exerciseIndex}
                                      className="group/exercise bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:scale-105 hover:-translate-y-1"
                                      style={{
                                        animationDelay: `${exerciseIndex * 100}ms`,
                                        animation: 'fadeInScale 0.4s ease-out forwards',
                                        opacity: 0
                                      }}
                                    >
                                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        <div className="flex-1 w-full">
                                          <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg group-hover/exercise:text-purple-700 transition-colors duration-300 break-words">
                                            {exercise.name}
                                          </h4>
                                          {exercise.description && (
                                            <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed break-words whitespace-normal">
                                              {exercise.description}
                                            </p>
                                          )}
                                          <div className="flex flex-wrap gap-2 items-center">
                                            {exercise.sets && (
                                              <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {exercise.sets}
                                              </div>
                                            )}
                                            {(exercise.reps_text || exercise.reps_min || exercise.reps_max) && (
                                              <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                                Reps: {exercise.reps_text 
                                                  ? exercise.reps_text 
                                                  : exercise.reps_min && exercise.reps_max
                                                    ? `${exercise.reps_min}-${exercise.reps_max}`
                                                    : exercise.reps_min
                                                      ? exercise.reps_min.toString()
                                                      : exercise.reps_max
                                                        ? exercise.reps_max.toString()
                                                        : '-'}
                                              </div>
                                            )}
                                            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                              Kg: {(exercise.weight_kg !== null && exercise.weight_kg !== undefined && !isNaN(Number(exercise.weight_kg)))
                                                ? exercise.weight_kg
                                                : '-'}
                                            </div>
                                            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                              RM: {(exercise.rm_percentage !== null && exercise.rm_percentage !== undefined && !isNaN(Number(exercise.rm_percentage)))
                                                ? `${exercise.rm_percentage}%`
                                                : '-'}
                                            </div>
                                            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                              RPE: {(exercise.rpe !== null && exercise.rpe !== undefined && !isNaN(Number(exercise.rpe)))
                                                ? exercise.rpe
                                                : '-'}
                                            </div>
                                            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                                              Time: {(exercise.time_seconds !== null && exercise.time_seconds !== undefined && !isNaN(Number(exercise.time_seconds)))
                                                ? (Number(exercise.time_seconds) >= 60
                                                  ? `${Math.floor(Number(exercise.time_seconds) / 60)}:${String(Number(exercise.time_seconds) % 60).padStart(2, '0')}`
                                                  : `${exercise.time_seconds}s`)
                                                : '-'}
                                            </div>
                                            {exercise.method && (
                                              <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                                Method: {exercise.method}
                                              </div>
                                            )}
                                            <div className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                              selectedLevel === 'beginner'
                                                ? 'bg-red-50 text-red-700'
                                                : selectedLevel === 'intermediate'
                                                ? 'bg-yellow-50 text-yellow-800'
                                                : 'bg-green-50 text-green-700'
                                            }`}>
                                              Level: {levelLabel[selectedLevel]}
                                            </div>
                                            {exercise.tempo && (
                                              <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                                                Tempo: {exercise.tempo}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* No YouTube link for combined programs - removed as per request */}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

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

// Training Methodologies Component
const TrainingMethodologiesSection: React.FC = () => {
  const [selectedMethodology, setSelectedMethodology] = useState<'circuit' | 'rm' | 'anti-extension' | 'density' | 'strength' | 'cluster-sets' | 'max-load' | 'drop-set' | 'mechanical-drop' | 'load-focus' | 'superset' | 'straight-sets' | 'pump' | 'isolation' | 'tempo-control' | 'neural' | 'core' | 'alternating' | 'stability' | null>(null);

  const methodologies = [
    {
      id: 'circuit' as const,
      title: 'Circuit',
      icon: '⚡',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600'
    },
    {
      id: 'rm' as const,
      title: 'Βασικό Πλαίσιο RM',
      icon: '📊',
      color: 'from-blue-500 to-indigo-500',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-600'
    },
    {
      id: 'anti-extension' as const,
      title: 'Anti-Extension',
      icon: '🛡️',
      color: 'from-green-500 to-teal-500',
      hoverColor: 'hover:from-green-600 hover:to-teal-600'
    },
    {
      id: 'density' as const,
      title: 'Density',
      icon: '⏱️',
      color: 'from-orange-500 to-red-500',
      hoverColor: 'hover:from-orange-600 hover:to-red-600'
    },
    {
      id: 'strength' as const,
      title: 'Strength',
      icon: '💪',
      color: 'from-indigo-500 to-purple-500',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-600'
    },
    {
      id: 'cluster-sets' as const,
      title: 'Cluster Sets',
      icon: '🔗',
      color: 'from-cyan-500 to-blue-500',
      hoverColor: 'hover:from-cyan-600 hover:to-blue-600'
    },
    {
      id: 'max-load' as const,
      title: 'Max Load',
      icon: '🏋️',
      color: 'from-amber-500 to-yellow-500',
      hoverColor: 'hover:from-amber-600 hover:to-yellow-600'
    },
    {
      id: 'drop-set' as const,
      title: 'Drop Set',
      icon: '⬇️',
      color: 'from-red-500 to-pink-500',
      hoverColor: 'hover:from-red-600 hover:to-pink-600'
    },
    {
      id: 'mechanical-drop' as const,
      title: 'Mechanical Drop',
      icon: '⚙️',
      color: 'from-slate-500 to-gray-500',
      hoverColor: 'hover:from-slate-600 hover:to-gray-600'
    },
    {
      id: 'load-focus' as const,
      title: 'Load Focus',
      icon: '🎯',
      color: 'from-violet-500 to-purple-500',
      hoverColor: 'hover:from-violet-600 hover:to-purple-600'
    },
    {
      id: 'superset' as const,
      title: 'Superset A / B',
      icon: '🔄',
      color: 'from-emerald-500 to-green-500',
      hoverColor: 'hover:from-emerald-600 hover:to-green-600'
    },
    {
      id: 'straight-sets' as const,
      title: 'Straight Sets',
      icon: '📏',
      color: 'from-rose-500 to-red-500',
      hoverColor: 'hover:from-rose-600 hover:to-red-600'
    },
    {
      id: 'pump' as const,
      title: 'Pump',
      icon: '💉',
      color: 'from-fuchsia-500 to-pink-500',
      hoverColor: 'hover:from-fuchsia-600 hover:to-pink-600'
    },
    {
      id: 'isolation' as const,
      title: 'Isolation',
      icon: '🎯',
      color: 'from-sky-500 to-blue-500',
      hoverColor: 'hover:from-sky-600 hover:to-blue-600'
    },
    {
      id: 'tempo-control' as const,
      title: 'Tempo Control',
      icon: '⏱️',
      color: 'from-lime-500 to-green-500',
      hoverColor: 'hover:from-lime-600 hover:to-green-600'
    },
    {
      id: 'neural' as const,
      title: 'Neural',
      icon: '🧠',
      color: 'from-indigo-500 to-blue-500',
      hoverColor: 'hover:from-indigo-600 hover:to-blue-600'
    },
    {
      id: 'core' as const,
      title: 'Core',
      icon: '💪',
      color: 'from-orange-500 to-amber-500',
      hoverColor: 'hover:from-orange-600 hover:to-amber-600'
    },
    {
      id: 'alternating' as const,
      title: 'Alternating',
      icon: '🔄',
      color: 'from-teal-500 to-cyan-500',
      hoverColor: 'hover:from-teal-600 hover:to-cyan-600'
    },
    {
      id: 'stability' as const,
      title: 'Stability',
      icon: '⚖️',
      color: 'from-stone-500 to-neutral-500',
      hoverColor: 'hover:from-stone-600 hover:to-neutral-600'
    }
  ];

  const getMethodologyContent = (id: 'circuit' | 'rm' | 'anti-extension' | 'density' | 'strength' | 'cluster-sets' | 'max-load' | 'drop-set' | 'mechanical-drop' | 'load-focus' | 'superset' | 'straight-sets' | 'pump' | 'isolation' | 'tempo-control' | 'neural' | 'core' | 'alternating' | 'stability') => {
    if (id === 'circuit') {
      return {
        title: '🔹 Circuit',
        content: [
          { type: 'section', text: 'Τι είναι:' },
          { type: 'text', text: 'Σειρά ασκήσεων που εκτελούνται η μία μετά την άλλη χωρίς διάλειμμα.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Leg Press → Chest Press → Lat Pulldown → Plank' },
          { type: 'text', text: '(διάλειμμα μόνο στο τέλος του κύκλου)', className: 'text-sm text-gray-500 italic' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'αύξηση καρδιοαναπνευστικής επιβάρυνσης',
            'γενική φυσική κατάσταση',
            'beginner-friendly'
          ]}
        ]
      };
    } else if (id === 'rm') {
      return {
        title: 'Βασικό Πλαίσιο RM (σταθερό για όλα τα προγράμματα)',
        content: [
          { type: 'section', text: 'Τεχνική / βάση' },
          { type: 'text', text: '55–65% του 1RM, 12–15 επαναλήψεις, RIR 3–4.' },
          { type: 'section', text: 'Υπερτροφία' },
          { type: 'text', text: '65–75% του 1RM, 8–12 επαναλήψεις, RIR 2.' },
          { type: 'section', text: 'Δύναμη – υπερτροφία' },
          { type: 'text', text: '75–85% του 1RM, 5–8 επαναλήψεις, RIR 1.' },
          { type: 'section', text: 'Μέγιστη δύναμη' },
          { type: 'text', text: '85–90% του 1RM, 3–5 επαναλήψεις, RIR 0–1.' },
          { type: 'divider' },
          { type: 'section', text: 'Διάλειμμα 📌' },
          { type: 'text', text: 'Πολυαρθρικές ασκήσεις: 90–150 δευτερόλεπτα.' },
          { type: 'text', text: 'Μονοαρθρικές ασκήσεις: 45–75 δευτερόλεπτα' },
          { type: 'divider' },
          { type: 'section', text: 'RIR σημαίνει Reps In Reserve.' },
          { type: 'text', text: 'Δηλαδή: πόσες επαναλήψεις "σου μένουν" πριν την αποτυχία.' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'list', items: [
            'RIR 3 → σταματάς το σετ ενώ θα μπορούσες να κάνεις άλλες 3 επαναλήψεις',
            'RIR 2 → σου μένουν 2 επαναλήψεις',
            'RIR 1 → σου μένει 1 επανάληψη',
            'RIR 0 → καμία επανάληψη, είσαι στην αποτυχία'
          ]},
          { type: 'section', text: 'Με απλά λόγια:' },
          { type: 'text', text: 'το RIR δείχνει πόσο κοντά στη μυϊκή αποτυχία δουλεύεις.' }
        ]
      };
    } else if (id === 'anti-extension') {
      return {
        title: '🔹 Anti-Extension',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Ο κορμός αντιστέκεται στο «σπάσιμο» της μέσης.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'list', items: ['Plank', 'Ab Wheel'] },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'προστασία μέσης',
            'καλύτερα squat / deadlift',
            'σταθερότητα υπό φορτίο'
          ]}
        ]
      };
    } else if (id === 'density') {
      return {
        title: '🔹 Density',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Ίδιος όγκος δουλειάς, λιγότερος χρόνος.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: '4×10 με 60" αντί για 90" rest' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'μυϊκή αντοχή',
            'conditioning',
            'time efficiency'
          ]}
        ]
      };
    } else if (id === 'strength') {
      return {
        title: '🔹 Strength (ως Method)',
        content: [
          { type: 'section', text: 'Τι σημαίνει εδώ:' },
          { type: 'text', text: 'Καθαρή προπόνηση δύναμης, χωρίς τεχνικά tricks.' },
          { type: 'divider' },
          { type: 'section', text: 'Χαρακτηριστικά:' },
          { type: 'list', items: [
            'compound lifts',
            '4–6 επαναλήψεις',
            '75–85% 1RM'
          ]}
        ]
      };
    } else if (id === 'cluster-sets') {
      return {
        title: '🔹 Cluster Sets (π.χ. 3+3)',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Το σετ «σπάει» σε μικρά κομμάτια με μίνι παύσεις.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: '3 reps → 15–20″ → 3 reps' },
          { type: 'text', text: '(ίδιο βάρος)', className: 'text-sm text-gray-500 italic' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'περισσότερες ποιοτικές επαναλήψεις',
            'διατήρηση τεχνικής',
            'υψηλή νευρική διέγερση'
          ]}
        ]
      };
    } else if (id === 'max-load') {
      return {
        title: '🔹 Max Load',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Σετ με πολύ βαρύ φορτίο, αλλά χωρίς αποτυχία.' },
          { type: 'divider' },
          { type: 'section', text: 'Χαρακτηριστικά:' },
          { type: 'list', items: [
            '80–90% 1RM',
            'λίγες επαναλήψεις',
            'μεγάλο διάλειμμα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'κορύφωση δύναμης',
            'νευρική προσαρμογή',
            'confidence under load'
          ]}
        ]
      };
    } else if (id === 'drop-set') {
      return {
        title: '🔹 Drop Set',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Εκτελείς:' },
          { type: 'list', items: [
            'σετ μέχρι κοντά στην αποτυχία',
            'μειώνεις βάρος',
            'συνεχίζεις ΧΩΡΙΣ διάλειμμα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: '8 reps → −20% βάρος → 8 reps' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'έντονο metabolic stress',
            '«κάψιμο» μυός',
            'advanced hypertrophy'
          ]}
        ]
      };
    } else if (id === 'mechanical-drop') {
      return {
        title: '🔹 Mechanical Drop',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Μείωση της μηχανικής δυσκολίας της άσκησης, όχι του βάρους.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'list', items: [
            'Push Press → Strict Press',
            'Pull-Up → Chin-Up'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'παράταση του σετ',
            'περισσότερες επαναλήψεις',
            'έντονη υπερτροφία'
          ]}
        ]
      };
    } else if (id === 'load-focus') {
      return {
        title: '🔹 Load Focus',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Η άσκηση εκτελείται με προτεραιότητα στο βάρος, όχι στον όγκο.' },
          { type: 'divider' },
          { type: 'section', text: 'Χαρακτηριστικά:' },
          { type: 'list', items: [
            'λιγότερες επαναλήψεις',
            'μεγαλύτερο διάλειμμα',
            'υψηλό %1RM'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'προοδευτική υπερφόρτωση',
            'αύξηση δύναμης'
          ]}
        ]
      };
    } else if (id === 'superset') {
      return {
        title: '🔹 Superset A / Superset B',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Δύο ασκήσεις εκτελούνται η μία αμέσως μετά την άλλη, χωρίς διάλειμμα.' },
          { type: 'divider' },
          { type: 'section', text: 'Superset A' },
          { type: 'text', text: 'Συνήθως:' },
          { type: 'list', items: [
            'μεγάλοι μύες',
            'ανταγωνιστικές κινήσεις'
          ]},
          { type: 'text', text: 'π.χ. Squat → Row', className: 'text-sm text-gray-500 italic' },
          { type: 'divider' },
          { type: 'section', text: 'Superset B' },
          { type: 'text', text: 'Συνήθως:' },
          { type: 'list', items: [
            'μικρότεροι μύες',
            'arms / shoulders'
          ]},
          { type: 'text', text: 'π.χ. Curl → Triceps Extension', className: 'text-sm text-gray-500 italic' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'εξοικονόμηση χρόνου',
            'αυξημένη ένταση',
            'καλύτερο conditioning'
          ]}
        ]
      };
    } else if (id === 'straight-sets') {
      return {
        title: '🔹 Straight Sets',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Κλασικά σετ:' },
          { type: 'list', items: [
            'ίδιο βάρος',
            'ίδιες επαναλήψεις',
            'κανονικό διάλειμμα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: '4×10 @ 70% με 90" rest' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'σταθερή πρόοδος',
            'εύκολη παρακολούθηση φορτίου',
            'βάση κάθε προγράμματος'
          ]}
        ]
      };
    } else if (id === 'pump') {
      return {
        title: '🔹 Pump',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Σετ με:' },
          { type: 'list', items: [
            'μέτριο φορτίο',
            'πολλές επαναλήψεις',
            'μικρά διαλείμματα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'αυξημένη αιμάτωση',
            'metabolic stress',
            '«γεμάτη» αίσθηση μυός'
          ]},
          { type: 'text', text: '📌 Δεν είναι δύναμη, είναι υπερτροφία & αντοχή', className: 'text-sm text-gray-500 italic mt-2' }
        ]
      };
    } else if (id === 'isolation') {
      return {
        title: '🔹 Isolation',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Άσκηση που απομονώνει έναν βασικό μυ, χωρίς μεγάλη συμμετοχή άλλων.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Leg Extension, Lateral Raises, Cable Curl' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'μυϊκή ενεργοποίηση',
            'διόρθωση αδυναμιών',
            'προετοιμασία για compound lifts'
          ]}
        ]
      };
    } else if (id === 'tempo-control') {
      return {
        title: '🔹 Tempo Control',
        content: [
          { type: 'section', text: 'Τι σημαίνει:' },
          { type: 'text', text: 'Η άσκηση εκτελείται με συγκεκριμένο, ελεγχόμενο ρυθμό (tempo).' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Tempo 3–1–1' },
          { type: 'list', items: [
            '3″ κατέβασμα',
            '1″ παύση',
            '1″ ανέβασμα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'τεχνική ακρίβεια',
            'μυϊκός έλεγχος',
            'ασφάλεια (ιδανικό για beginners)'
          ]}
        ]
      };
    } else if (id === 'neural') {
      return {
        title: '🔹 Neural',
        content: [
          { type: 'section', text: 'Τι είναι:' },
          { type: 'text', text: 'Μέθοδοι που στοχεύουν στο νευρικό σύστημα, όχι στον μυϊκό όγκο.' },
          { type: 'divider' },
          { type: 'section', text: 'Χαρακτηριστικά:' },
          { type: 'list', items: [
            'πολύ βαριά φορτία',
            'χαμηλές επαναλήψεις',
            'μεγάλα διαλείμματα'
          ]},
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Deadlift 5×3 @ 90%' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'μέγιστη δύναμη',
            'ταχύτητα ενεργοποίησης κινητικών μονάδων'
          ]}
        ]
      };
    } else if (id === 'core') {
      return {
        title: '🔹 Core',
        content: [
          { type: 'section', text: 'Τι είναι:' },
          { type: 'text', text: 'Ασκήσεις που στοχεύουν κεντρικά στον κορμό (κοιλιακοί, ραχιαίοι, σταθεροποιητές).' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Plank, Hanging Knee Raises, Ab Wheel' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'σταθερότητα',
            'μεταφορά δύναμης',
            'προστασία σπονδυλικής στήλης'
          ]}
        ]
      };
    } else if (id === 'alternating') {
      return {
        title: '🔹 Alternating',
        content: [
          { type: 'section', text: 'Τι είναι:' },
          { type: 'text', text: 'Εναλλαγή άνω–κάτω σώματος ή ανταγωνιστικών μυών, με διάλειμμα ενδιάμεσα.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Squat → Rest → Bench Press → Rest → Row' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'καλύτερη διαχείριση κόπωσης',
            'εξοικονόμηση χρόνου',
            'ιδανικό για Full Body'
          ]}
        ]
      };
    } else if (id === 'stability') {
      return {
        title: '🔹 Stability',
        content: [
          { type: 'section', text: 'Τι είναι:' },
          { type: 'text', text: 'Ασκήσεις που στοχεύουν στη σταθεροποίηση αρθρώσεων και κορμού, όχι στη μέγιστη δύναμη.' },
          { type: 'divider' },
          { type: 'section', text: 'Παράδειγμα:' },
          { type: 'text', text: 'Plank, single-leg holds, slow controlled movements' },
          { type: 'divider' },
          { type: 'section', text: 'Στόχος:' },
          { type: 'list', items: [
            'έλεγχος σώματος',
            'πρόληψη τραυματισμών',
            'βελτίωση τεχνικής σε compound lifts'
          ]}
        ]
      };
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden mb-6"
        style={{
          animation: 'fadeInUp 0.6s ease-out forwards',
          opacity: 0
        }}
      >
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Μεθοδολογίες Προπόνησης</h2>
              <p className="text-purple-100 text-sm sm:text-base lg:text-lg">Εξερευνήστε διάφορες προπονητικές μεθοδολογίες</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {methodologies.map((methodology) => (
              <button
                key={methodology.id}
                onClick={() => setSelectedMethodology(methodology.id)}
                className={`group relative bg-gradient-to-br ${methodology.color} ${methodology.hoverColor} rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 text-left`}
              >
                <div className="text-2xl sm:text-3xl mb-2">{methodology.icon}</div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">{methodology.title}</h3>
                <p className="text-white/90 text-xs sm:text-sm">Κάντε κλικ</p>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology Modal */}
      {selectedMethodology && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl my-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {getMethodologyContent(selectedMethodology)?.title || ''}
                </h2>
                <button
                  onClick={() => setSelectedMethodology(null)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-4">
                {getMethodologyContent(selectedMethodology)?.content.map((item, index) => {
                  if (item.type === 'section') {
                    return (
                      <h3 key={index} className="text-xl font-bold text-gray-900 mt-6 first:mt-0">
                        {item.text}
                      </h3>
                    );
                  } else if (item.type === 'text') {
                    return (
                      <p key={index} className={`text-gray-700 leading-relaxed ${item.className || ''}`}>
                        {item.text}
                      </p>
                    );
                  } else if (item.type === 'divider') {
                    return <hr key={index} className="my-4 border-gray-300" />;
                  } else if (item.type === 'list' && item.items) {
                    return (
                      <ul key={index} className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        {item.items.map((listItem, i) => (
                          <li key={i}>{listItem}</li>
                        ))}
                      </ul>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MembershipPage;