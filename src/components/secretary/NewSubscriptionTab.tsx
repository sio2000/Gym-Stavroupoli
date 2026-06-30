import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  UserCheck,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Euro,
  ListChecks,
  Zap,
  Coins,
  Dumbbell
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMembershipPackages,
  getMembershipPackageDurations,
  getPilatesPackageDurations,
  getUltimatePackageDurations,
  createMembershipRequest,
  createPilatesMembershipRequest,
  createUltimateMembershipRequest,
  createPersonalTrainingSubscription
} from '@/utils/membershipApi';
import { searchUsers, UserInfo } from '@/utils/userInfoApi';
import { MembershipPackage, MembershipPackageDuration } from '@/types';
import { saveSecretaryCashTransaction, saveSecretaryKettlebellPoints } from '@/utils/secretaryProgramOptionsApi';
import { useAuth } from '@/contexts/AuthContext';

type PackageKind = 'open_gym' | 'pilates' | 'ultimate' | 'personal' | 'custom';

const detectPackageKind = (pkg: MembershipPackage): PackageKind => {
  const name = (pkg.name || '').toLowerCase();
  if (name.includes('ultimate')) return 'ultimate';
  if (name.includes('pilates')) return 'pilates';
  if (name.includes('personal')) return 'personal';
  if (name.includes('free gym') || name.includes('open gym')) return 'open_gym';
  return 'custom';
};

const formatDateInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const durationDaysFromEndDate = (endDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

const formatDisplayDate = (dateStr: string): string =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('el-GR');

const MONTH_NAMES = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

const WEEKDAY_LABELS = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

const buildCalendarDays = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = firstDay.getDay();
  const days: (Date | null)[] = Array.from({ length: leadingEmpty }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }
  return days;
};

const ExpirationDatePicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(`${value}T00:00:00`);
    return new Date();
  });

  useEffect(() => {
    if (value) {
      setViewDate(new Date(`${value}T00:00:00`));
    }
  }, [value]);

  const calendarDays = useMemo(
    () => buildCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const goToPreviousMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: Date) => {
    if (day < today) return;
    onChange(formatDateInputValue(day));
  };

  return (
    <div className="rounded-lg border border-amber-600/40 bg-gray-950/60 p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-md text-amber-300 hover:bg-amber-900/30 transition-colors"
          aria-label="Προηγούμενος μήνας"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-amber-200">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1.5 rounded-md text-amber-300 hover:bg-amber-900/30 transition-colors"
          aria-label="Επόμενος μήνας"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const dayValue = formatDateInputValue(day);
          const isSelected = value === dayValue;
          const isToday = day.getTime() === today.getTime();
          const isDisabled = day < today;

          return (
            <button
              key={dayValue}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelectDay(day)}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-amber-500 text-gray-900 ring-2 ring-amber-300'
                  : isDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-amber-900/40 hover:text-amber-100'
              } ${isToday && !isSelected ? 'ring-1 ring-amber-500/70' : ''}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-300">
          {value
            ? <>Επιλεγμένη λήξη: <span className="text-amber-300 font-semibold">{formatDisplayDate(value)}</span></>
            : 'Επίλεξε ημέρα από το ημερολόγιο'}
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-gray-400 hover:text-amber-300 whitespace-nowrap"
          >
            Καθαρισμός
          </button>
        )}
      </div>
    </div>
  );
};

interface SelectedPackage {
  pkg: MembershipPackage;
  durations: MembershipPackageDuration[];
}

const NewSubscriptionTab: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [kettlebellPoints, setKettlebellPoints] = useState<string>('');
  const [hasInstallments, setHasInstallments] = useState(false);
  const [installment1Amount, setInstallment1Amount] = useState<string>('');
  const [installment1DueDate, setInstallment1DueDate] = useState<string>('');
  const [installment1Method, setInstallment1Method] = useState<'cash' | 'pos'>('cash');
  const [installment2Amount, setInstallment2Amount] = useState<string>('');
  const [installment2DueDate, setInstallment2DueDate] = useState<string>('');
  const [installment2Method, setInstallment2Method] = useState<'cash' | 'pos'>('cash');
  const [installment3Amount, setInstallment3Amount] = useState<string>('');
  const [installment3DueDate, setInstallment3DueDate] = useState<string>('');
  const [installment3Method, setInstallment3Method] = useState<'cash' | 'pos'>('cash');
  const [customClasses, setCustomClasses] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos'>('cash');

  // Personal Training states
  const [isPersonalTraining, setIsPersonalTraining] = useState(false);
  const [ptPrice, setPtPrice] = useState<string>('');
  const [ptKettlebellPoints, setPtKettlebellPoints] = useState<string>('');
  const [ptPaymentMethod, setPtPaymentMethod] = useState<'cash' | 'pos'>('cash');

  // Load packages once
  useEffect(() => {
    const loadPkgs = async () => {
      try {
        setLoadingPackages(true);
        const pkgs = await getMembershipPackages();
        const filtered = pkgs.filter((p) => {
          const name = (p.name || '').toLowerCase();
          return !(
            name.includes('personal') ||
            name.includes('premium') ||
            name.includes('vip') ||
            name.includes('βασικ')
          );
        });
        setPackages(filtered);
      } catch (err) {
        console.error('Error loading packages', err);
        toast.error('Σφάλμα φόρτωσης πακέτων');
      } finally {
        setLoadingPackages(false);
      }
    };
    loadPkgs();
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setUsers([]);
      setSelectedUser(null);
      return;
    }
    try {
      setSearchLoading(true);
      const results = await searchUsers(term);
      setUsers(results);
    } catch (err) {
      console.error('Search error', err);
      toast.error('Σφάλμα αναζήτησης χρήστη');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectPersonalTraining = () => {
    setIsPersonalTraining(true);
    setSelectedPackage(null);
    setSelectedDurationId('');
    setCustomPrice('');
    setCustomClasses('');
    setCustomEndDate('');
    setKettlebellPoints('');
    setHasInstallments(false);
  };

  const deselectPersonalTraining = () => {
    setIsPersonalTraining(false);
    setPtPrice('');
    setPtKettlebellPoints('');
    setPtPaymentMethod('cash');
  };

  const loadDurations = async (pkg: MembershipPackage) => {
    // Deselect PT when selecting a regular package
    deselectPersonalTraining();
    try {
      let durations: MembershipPackageDuration[] = [];
      const kind = detectPackageKind(pkg);
      if (kind === 'pilates') {
        durations = await getPilatesPackageDurations();
      } else if (kind === 'ultimate') {
        durations = await getUltimatePackageDurations();
        const name = (pkg.name || '').toLowerCase();
        if (name.includes('ultimate medium')) {
          // Δεχόμαστε είτε labeled είτε fallback στο common ultimate_1year
          durations = durations.filter(
            (d) =>
              (d.duration_type || '') === 'ultimate_medium_1year' ||
              (d.duration_type || '') === 'ultimate_1year'
          );
          // Override price/lessons to correct values (52, €400) και κρατάμε μόνο ένα
          durations = durations
            .map((d) => ({
              ...d,
              price: 400,
              classes_count: 52
            }))
            .slice(0, 1);
        } else if (name.includes('ultimate')) {
          durations = durations.filter((d) => (d.duration_type || '') === 'ultimate_1year');
        }
      } else {
        durations = await getMembershipPackageDurations(pkg.id);
      }
      setSelectedPackage({ pkg, durations });
      setSelectedDurationId('');
      setCustomPrice('');
      setCustomClasses('');
      setCustomEndDate('');
      setKettlebellPoints('');
      setHasInstallments(false);
      setInstallment1Amount('');
      setInstallment1DueDate('');
      setInstallment1Method('cash');
      setInstallment2Amount('');
      setInstallment2DueDate('');
      setInstallment2Method('cash');
      setInstallment3Amount('');
      setInstallment3DueDate('');
      setInstallment3Method('cash');
    } catch (err) {
      console.error('Error loading durations', err);
      toast.error('Σφάλμα φόρτωσης διάρκειας');
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error('Επίλεξε χρήστη');
      return;
    }
    if (!selectedPackage || !selectedDurationId) {
      toast.error('Επίλεξε πακέτο και διάρκεια');
      return;
    }
    const duration = selectedPackage.durations.find(d => d.id === selectedDurationId);
    if (!duration) {
      toast.error('Η διάρκεια δεν βρέθηκε');
      return;
    }

    if (hasInstallments) {
      const amount1 = Number(installment1Amount || 0);
      if (!amount1 || Number.isNaN(amount1)) {
        toast.error('Συμπλήρωσε ποσό για την 1η δόση');
        return;
      }
      if (!installment1DueDate) {
        toast.error('Συμπλήρωσε ημερομηνία για την 1η δόση');
        return;
      }
    }

    const kind = detectPackageKind(selectedPackage.pkg);
    const isUltimateMedium =
      (duration.duration_type || '') === 'ultimate_medium_1year' ||
      ((duration.duration_type || '') === 'ultimate_1year' &&
        (selectedPackage?.pkg.name || '').toLowerCase().includes('medium'));
    const price = customPrice
      ? Number(customPrice)
      : isUltimateMedium
      ? 400
      : duration.price || 0;

    const classesCount = customClasses
      ? Number(customClasses)
      : isUltimateMedium
      ? 52
      : duration.classes_count || 0;

    const installments = hasInstallments
      ? {
          installment1Amount: Number(installment1Amount || 0) || undefined,
          installment1DueDate: installment1DueDate || undefined,
          installment1PaymentMethod: installment1Method,
          installment2Amount: Number(installment2Amount || 0) || undefined,
          installment2DueDate: installment2DueDate || undefined,
          installment2PaymentMethod: installment2Method,
          installment3Amount: Number(installment3Amount || 0) || undefined,
          installment3DueDate: installment3DueDate || undefined,
          installment3PaymentMethod: installment3Method,
        }
      : undefined;

    // Custom end date → duration days (only for FreeGym and Pilates)
    let customDurationDays: number | undefined;
    if ((kind === 'open_gym' || kind === 'pilates') && customEndDate) {
      const days = durationDaysFromEndDate(customEndDate);
      if (days < 0) {
        toast.error('Η ημερομηνία λήξης δεν μπορεί να είναι στο παρελθόν');
        return;
      }
      customDurationDays = days;
    }

    setSubmitting(true);
    try {
      if (kind === 'pilates') {
        await createPilatesMembershipRequest(
          selectedPackage.pkg.id,
          duration.duration_type,
          classesCount,
          price,
          selectedUser.user_id,
          hasInstallments,
          paymentMethod,
          Number(kettlebellPoints || 0),
          installments,
          customDurationDays
        );
      } else if (kind === 'ultimate') {
        await createUltimateMembershipRequest(
          selectedPackage.pkg.id,
          duration.duration_type,
          price,
          hasInstallments,
          selectedUser.user_id,
          paymentMethod,
          Number(kettlebellPoints || 0),
          installments
        );
      } else if (kind === 'personal') {
        toast.error('Το Personal Training καταχωρείται από admin');
        setSubmitting(false);
        return;
      } else {
        await createMembershipRequest(
          selectedPackage.pkg.id,
          duration.duration_type,
          price,
          hasInstallments,
          selectedUser.user_id,
          paymentMethod,
          Number(kettlebellPoints || 0),
          installments,
          customDurationDays
        );
      }

      toast.success('Η νέα συνδρομή καταχωρήθηκε (approved)');
      setSelectedDurationId('');
      setSelectedPackage(null);
      setCustomPrice('');
      setCustomClasses('');
      setCustomEndDate('');
      setKettlebellPoints('');
      setHasInstallments(false);
      setInstallment1Amount('');
      setInstallment1DueDate('');
      setInstallment1Method('cash');
      setInstallment2Amount('');
      setInstallment2DueDate('');
      setInstallment2Method('cash');
      setInstallment3Amount('');
      setInstallment3DueDate('');
      setInstallment3Method('cash');
    } catch (err) {
      console.error('Submit error', err);
      toast.error('Σφάλμα καταχώρησης συνδρομής');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper για μετάφραση duration types στα ελληνικά (ΜΟΝΟ UI)
  const getDurationTypeLabel = (durationType: string): string => {
    const labels: Record<string, string> = {
      'lesson': 'Μάθημα',
      'month': 'Μήνας',
      'semester': 'Εξάμηνο',
      'year': 'Έτος',
      '3 Μήνες': '3 Μήνες',
      'pilates_trial': '1 Μάθημα (Δοκιμαστικό)',
      'pilates_1month': '4 Μαθήματα (1 μήνας)',
      'pilates_2months': '8 Μαθήματα (2 μήνες)',
      'pilates_3months': '16 Μαθήματα (3 μήνες)',
      'pilates_6months': '25 Μαθήματα (6 μήνες)',
      'pilates_1year': '50 Μαθήματα (1 έτος)',
      'ultimate_1year': '1 Έτος Ultimate',
      'ultimate_medium_1year': '1 Έτος Ultimate Medium'
    };
    return labels[durationType] || durationType;
  };

  const renderDurationLabel = (d: MembershipPackageDuration) => {
    if ((d.duration_type || '') === 'ultimate_medium_1year') return '52 μαθήματα';
    if ((d.duration_type || '') === 'ultimate_1year' && (selectedPackage?.pkg.name || '').toLowerCase().includes('medium')) {
      return '52 μαθήματα';
    }
    
    // Για FreeGym: εμφάνιση ημερών
    const packageKind = selectedPackage ? detectPackageKind(selectedPackage.pkg) : null;
    if (packageKind === 'open_gym') {
      return `${d.duration_days} ημέρες`;
    }
    
    // Για Pilates: εμφάνιση ημερών, τιμής και μαθημάτων
    if (packageKind === 'pilates') {
      if (d.classes_count) {
        // Αντιστοίχιση μαθημάτων σε μήνες
        const monthsMap: Record<number, string> = {
          1: '(Δοκιμαστικό)',
          4: '(1 μήνας)',
          8: '(2 μήνες)',
          16: '(3 μήνες)',
          25: '(6 μήνες)',
          50: '(1 έτος)'
        };
        const monthsLabel = monthsMap[d.classes_count] || '';
        return `${d.duration_days} ημέρες - ${d.classes_count} μαθήματα ${monthsLabel}`.trim();
      }
      return `${d.duration_days} ημέρες`;
    }
    
    // Για Pilates: προσθέτουμε τους μήνες στην παρένθεση
    if (d.classes_count) {
      const isPilates = (selectedPackage?.pkg.name || '').toLowerCase().includes('pilates');
      if (isPilates) {
        // Αντιστοίχιση μαθημάτων σε μήνες
        const monthsMap: Record<number, string> = {
          1: '(Δοκιμαστικό)',
          4: '(1 μήνας)',
          8: '(2 μήνες)',
          16: '(3 μήνες)',
          25: '(6 μήνες)',
          50: '(1 έτος)'
        };
        const monthsLabel = monthsMap[d.classes_count] || '';
        return `${d.classes_count} μαθήματα ${monthsLabel}`.trim();
      }
      return `${d.classes_count} μαθήματα`;
    }
    // Μετάφραση στα ελληνικά για το UI
    return getDurationTypeLabel(d.duration_type || '') || `${d.duration_days} ημέρες`;
  };

  return (
    <div className="bg-gray-900 text-white rounded-2xl border border-gray-700 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Νέα Συνδρομή</h3>
          <p className="text-gray-300 text-sm">
            Αναζήτησε χρήστη (επώνυμο ή τηλέφωνο) και επίλεξε υπηρεσίες.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-900/40 rounded-lg border border-blue-700 text-blue-100 text-sm">
          <Zap className="h-4 w-4" />
          <span>Γραμματεία</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
        {/* Search */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Επώνυμο ή τηλέφωνο (π.χ. 69...)"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
            {searchLoading && (
              <div className="flex items-center text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Αναζήτηση...
              </div>
            )}
            {!searchLoading && users.length === 0 && searchTerm.trim() && (
              <div className="text-sm text-gray-400">Δεν βρέθηκαν χρήστες</div>
            )}
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => setSelectedUser(u)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                  selectedUser?.user_id === u.user_id
                    ? 'border-blue-500 bg-blue-900/40 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                    {u.phone && <div className="text-xs text-gray-400">📞 {u.phone}</div>}
                  </div>
                  <UserCheck className="h-4 w-4 text-blue-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-blue-300" />
            <h4 className="font-semibold text-white">Επιλογή υπηρεσιών</h4>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {loadingPackages ? (
              <div className="flex items-center text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Φόρτωση πακέτων...
              </div>
            ) : packages.length === 0 ? (
              <div className="text-sm text-gray-400">Δεν υπάρχουν διαθέσιμα πακέτα</div>
            ) : (
              <>
                {packages.map((pkg) => {
                  const kind = detectPackageKind(pkg);
                  if (kind === 'personal') {
                    return null; // Hide from regular packages, we have separate PT option
                  }
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => loadDurations(pkg)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                        selectedPackage?.pkg.id === pkg.id && !isPersonalTraining
                          ? 'border-green-500 bg-green-900/30 text-white'
                          : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{pkg.name}</div>
                          <div className="text-xs text-gray-400">{pkg.description}</div>
                        </div>
                        <Euro className="h-4 w-4 text-green-400" />
                      </div>
                    </button>
                  );
                })}
                
                {/* Personal Training Option */}
                <button
                  onClick={selectPersonalTraining}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                    isPersonalTraining
                      ? 'border-purple-500 bg-purple-900/30 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Personal Training</div>
                      <div className="text-xs text-gray-400">Ατομικά μαθήματα με προπονητή</div>
                    </div>
                    <Dumbbell className="h-4 w-4 text-purple-400" />
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Personal Training Fields */}
          {isPersonalTraining && (
            <div className="space-y-4 mt-4 bg-purple-900/20 border border-purple-600/30 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-purple-400" />
                <h5 className="font-semibold text-white">Personal Training - Στοιχεία</h5>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-200 font-medium">Τιμή (€) *</label>
                  <input
                    type="number"
                    value={ptPrice}
                    onChange={(e) => setPtPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-purple-600/50 text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="π.χ. 150"
                  />
                </div>
                <div>
                  <label className="text-xs text-purple-200 font-medium">Kettlebell Points</label>
                  <input
                    type="number"
                    value={ptKettlebellPoints}
                    onChange={(e) => setPtKettlebellPoints(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-purple-600/50 text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="π.χ. 20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-purple-200 font-medium mb-2 block">Τρόπος πληρωμής</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'pos'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPtPaymentMethod(method)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        ptPaymentMethod === method
                          ? 'bg-purple-600 border-purple-400 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-200 hover:border-purple-500'
                      }`}
                    >
                      {method === 'cash' ? 'Μετρητά' : 'POS'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={submitting || !selectedUser || !ptPrice}
                onClick={async () => {
                  if (!selectedUser) {
                    toast.error('Επίλεξε χρήστη');
                    return;
                  }
                  const price = Number(ptPrice || 0);
                  // Convert to integer for Kettlebell Points (database field is integer)
                  const kbPoints = Math.round(Number(ptKettlebellPoints || 0));
                  
                  if (!price || price <= 0) {
                    toast.error('Συμπλήρωσε έγκυρη τιμή');
                    return;
                  }
                  
                  setSubmitting(true);
                  try {
                    const createdBy = user?.id || '';
                    
                    // 1. Save cash/POS transaction
                    const cashSuccess = await saveSecretaryCashTransaction(
                      selectedUser.user_id,
                      price,
                      ptPaymentMethod,
                      undefined, // program_id
                      createdBy,
                      'Personal Training - Πληρωμή'
                    );
                    
                    if (!cashSuccess) {
                      toast.error('Σφάλμα κατά την αποθήκευση της πληρωμής');
                      setSubmitting(false);
                      return;
                    }
                    
                    // 2. Save kettlebell points if provided
                    if (kbPoints > 0) {
                      // Ensure createdBy is not empty string
                      const validCreatedBy = createdBy || user?.id || '';
                      if (!validCreatedBy) {
                        toast.error('Σφάλμα: Δεν βρέθηκε ID χρήστη');
                        setSubmitting(false);
                        return;
                      }
                      
                      const kbSuccess = await saveSecretaryKettlebellPoints(
                        selectedUser.user_id,
                        kbPoints,
                        undefined, // program_id
                        validCreatedBy
                      );
                    
                      if (!kbSuccess) {
                        toast.error('Σφάλμα κατά την αποθήκευση των Kettlebell Points');
                        setSubmitting(false);
                        return;
                      }
                    }
                    
                    toast.success(`Personal Training καταχωρήθηκε: €${price.toFixed(2)}${kbPoints > 0 ? ` με ${kbPoints} Kettlebell Points` : ''}`);
                    
                      // Reset PT fields
                      setPtPrice('');
                      setPtKettlebellPoints('');
                      setPtPaymentMethod('cash');
                      setIsPersonalTraining(false);
                    setSelectedUser(null);
                    setSearchTerm('');
                    setUsers([]);
                  } catch (error) {
                    console.error('Error submitting Personal Training:', error);
                    toast.error('Σφάλμα κατά την καταχώρηση Personal Training');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Καταχώρηση Personal Training
              </button>
              <p className="text-xs text-gray-400">
                * Υποχρεωτικό πεδίο: Τιμή. Η καταχώρηση ενημερώνει το ταμείο και τα Kettlebell Points.
              </p>
            </div>
          )}

          {/* Durations */}
          {selectedPackage && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-300" />
                <h5 className="font-semibold text-white">Διάρκεια</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedPackage.durations.map((d) => (
                  <label
                    key={d.id}
                    className={`border rounded-lg px-3 py-2 cursor-pointer text-sm ${
                      selectedDurationId === d.id
                        ? 'border-blue-500 bg-blue-900/30 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      className="mr-2"
                      checked={selectedDurationId === d.id}
                      onChange={() => setSelectedDurationId(d.id)}
                    />
                    <div className="font-semibold">
                      {customEndDate
                        ? `Λήξη: ${formatDisplayDate(customEndDate)} (προσαρμοσμένη)`
                        : renderDurationLabel(d)}
                    </div>
                    <div className="text-xs text-gray-400">Τιμή: €{(d.price || 0).toFixed(2)}</div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">Προσαρμοσμένη τιμή (€)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="προαιρετικό"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">Kettlebell points</label>
                  <input
                    type="text"
                    value={kettlebellPoints}
                    onChange={(e) => setKettlebellPoints(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="π.χ. 10"
                  />
                </div>
              </div>

              {/* Custom end date override - Only for FreeGym and Pilates */}
              {(detectPackageKind(selectedPackage.pkg) === 'open_gym' || detectPackageKind(selectedPackage.pkg) === 'pilates') && (
                <div className="mt-3 bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <label className="text-xs text-amber-300 font-semibold">Προσαρμοσμένη ημερομηνία λήξης</label>
                  </div>
                  <ExpirationDatePicker value={customEndDate} onChange={setCustomEndDate} />
                  <p className="text-xs text-gray-400 mt-2">
                    Εάν επιλεγεί, η συνδρομή θα λήγει αυτή την ημερομηνία αντί της προεπιλεγμένης.
                  </p>
                </div>
              )}

              <div className="mt-3">
                <label className="text-xs text-gray-300 mb-2 block">Τρόπος πληρωμής</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'pos'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        paymentMethod === method
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-200 hover:border-blue-500'
                      }`}
                    >
                      {method === 'cash' ? 'Μετρητά' : 'POS'}
                    </button>
                  ))}
                </div>
              </div>

              {detectPackageKind(selectedPackage.pkg) === 'pilates' && (
                <div>
                  <label className="text-xs text-gray-300">Μαθήματα (αντικατάσταση του default)</label>
                  <input
                    type="number"
                    value={customClasses}
                    onChange={(e) => setCustomClasses(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="π.χ. 25"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={hasInstallments}
                  onChange={(e) => setHasInstallments(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-900"
                />
                <Coins className="h-4 w-4 text-amber-300" />
                <span>Πληρωμή με δόσεις</span>
              </label>

              {hasInstallments && (
                <div className="mt-3 space-y-3 bg-gray-900 border border-amber-400/40 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-200 font-semibold">Στοιχεία Δόσεων</span>
                    <span className="text-xs text-gray-400">Συμπλήρωσε ποσά & ημερομηνίες πριν το κλείδωμα</span>
                  </div>

                  {[1, 2, 3].map((idx) => {
                    const amount = idx === 1 ? installment1Amount : idx === 2 ? installment2Amount : installment3Amount;
                    const dueDate = idx === 1 ? installment1DueDate : idx === 2 ? installment2DueDate : installment3DueDate;
                    const method = idx === 1 ? installment1Method : idx === 2 ? installment2Method : installment3Method;
                    const setAmount = idx === 1 ? setInstallment1Amount : idx === 2 ? setInstallment2Amount : setInstallment3Amount;
                    const setDueDate = idx === 1 ? setInstallment1DueDate : idx === 2 ? setInstallment2DueDate : setInstallment3DueDate;
                    const setMethod = idx === 1 ? setInstallment1Method : idx === 2 ? setInstallment2Method : setInstallment3Method;
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-300">Ποσό δόσης {idx} (€){idx === 1 ? ' *' : ''}</label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-amber-400"
                            placeholder="π.χ. 100"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300">Ημερομηνία {idx}ης δόσης{idx === 1 ? ' *' : ''}</label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300">Τρόπος πληρωμής {idx}ης</label>
                          <div className="grid grid-cols-2 gap-1 mt-1">
                            {(['cash', 'pos'] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMethod(m)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                  method === m
                                    ? 'bg-amber-500 border-amber-300 text-black'
                                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-amber-400'
                                }`}
                              >
                                {m === 'cash' ? 'Μετρητά' : 'POS'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-gray-400">
                    * Υποχρεωτικά τουλάχιστον η 1η δόση. Οι επόμενες είναι προαιρετικές.
                  </p>
                </div>
              )}

              <button
                disabled={submitting || !selectedUser}
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Καταχώρηση συνδρομής
              </button>
              <p className="text-xs text-gray-400">
                Η καταχώρηση δημιουργεί αίτημα συνδρομής σε κατάσταση pending.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSubscriptionTab;

