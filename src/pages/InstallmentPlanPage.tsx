import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard,
  Calendar,
  Euro,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { InstallmentPlanData } from '@/services/api/installmentApi';
import InstallmentStatus, { InstallmentStatusType } from '@/components/InstallmentStatus';

// Helper function για να λάβει τα δεδομένα από το API
const fetchInstallmentPlan = async (): Promise<InstallmentPlanData | null> => {
  try {
    // Import και κλήση του service απευθείας
    const { getInstallmentPlan } = await import('@/services/api/installmentApi');
    const data = await getInstallmentPlan();
    return data;
  } catch (error) {
    console.error('Error fetching installment plan:', error);
    throw error;
  }
};

// Helper function για να μορφοποιήσει την ημερομηνία
const formatDate = (dateString: string): string => {
  // Χρησιμοποιούμε μόνο το date part χωρίς timezone conversion
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('el-GR');
};

// Helper function για να μορφοποιήσει το ποσό
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Helper function για να μετατρέψει το status σε InstallmentStatusType
const mapStatusToType = (status: string): InstallmentStatusType => {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'overdue':
      return 'overdue';
    default:
      return 'pending';
  }
};

const InstallmentPlanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<InstallmentPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInstallments, setExpandedInstallments] = useState<Set<number>>(new Set());
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  useEffect(() => {
    const loadInstallmentPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchInstallmentPlan();
        
        if (data === null) {
          setError('Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας');
        } else {
          setPlanData(data);
        }
      } catch (err) {
        console.error('Error loading installment plan:', err);
        setError('Σφάλμα κατά τη φόρτωση του πλάνου δόσεων');
        toast.error('Σφάλμα κατά τη φόρτωση του πλάνου δόσεων');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadInstallmentPlan();
    }
  }, [user?.id]);

  // Helper functions για mobile UI
  const toggleInstallmentExpansion = (installmentNumber: number) => {
    const newExpanded = new Set(expandedInstallments);
    if (newExpanded.has(installmentNumber)) {
      newExpanded.delete(installmentNumber);
    } else {
      newExpanded.add(installmentNumber);
    }
    setExpandedInstallments(newExpanded);
  };

  const toggleMobileSummary = () => {
    setShowMobileSummary(!showMobileSummary);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="animate-spin h-10 w-10 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Φόρτωση...</h2>
          <p className="text-gray-600 text-sm">Φόρτωση πλάνου δόσεων</p>
        </div>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Πλάνο Δόσεων</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full inline-flex items-center justify-center px-6 py-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-h-[56px]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Επιστροφή στο Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Mobile Header */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 sm:p-3 rounded-xl shadow-lg">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Πλάνο Δόσεων</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Σχέδιο δόσεων συνδρομής</p>
              </div>
            </div>
            
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-3 sm:px-5 sm:py-3.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2 sm:mr-2" />
              <span className="hidden sm:inline">Επιστροφή</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Summary Toggle */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={toggleMobileSummary}
            className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-5 flex items-center justify-between hover:shadow-xl transition-all duration-200 min-h-[56px]"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Σύνοψη Πλάνου</h3>
                <p className="text-sm text-gray-500">Πατήστε για λεπτομέρειες</p>
              </div>
            </div>
            {showMobileSummary ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Payment Alert - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-4 sm:p-5 rounded-2xl shadow-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-amber-800 mb-2">
                Ενημέρωση Πληρωμής Δόσης
              </h3>
              <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                Παρακαλώ εξοφλήστε την επόμενη δόση σας μέχρι την δηλωμένη καταληκτική ημερομηνία. 
                Σε περίπτωση που η δόση παραμείνει ανεξόφλητη, θα χάσετε τα προνόμιά σας.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Responsive */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-6">
          {/* Desktop Summary - Hidden on mobile */}
          <div className="hidden sm:block bg-gradient-to-r from-blue-600 to-blue-700 p-6 lg:p-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6 lg:mb-8">Σύνοψη Πλάνου Δόσεων</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-6 hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <Euro className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  <div>
                    <p className="text-white/80 text-sm lg:text-base">Συνολικό Ποσό</p>
                    <p className="text-white text-xl lg:text-2xl font-bold">{formatPrice(planData.total_amount)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-6 hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <Check className="h-8 w-8 lg:h-10 lg:w-10 text-green-300" />
                  <div>
                    <p className="text-white/80 text-sm lg:text-base">Πληρωμένο</p>
                    <p className="text-white text-xl lg:text-2xl font-bold">{formatPrice(planData.total_paid)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-6 hover:bg-white/20 transition-all duration-200">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <Clock className="h-8 w-8 lg:h-10 lg:w-10 text-yellow-300" />
                  <div>
                    <p className="text-white/80 text-sm lg:text-base">Υπόλοιπο</p>
                    <p className="text-white text-xl lg:text-2xl font-bold">{formatPrice(planData.remaining)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Summary - Expandable */}
          <div className={`sm:hidden ${showMobileSummary ? 'block' : 'hidden'}`}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Σύνοψη Πλάνου Δόσεων</h2>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <Euro className="h-8 w-8 text-white" />
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">Συνολικό Ποσό</p>
                      <p className="text-white text-xl font-bold">{formatPrice(planData.total_amount)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <Check className="h-8 w-8 text-green-300" />
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">Πληρωμένο</p>
                      <p className="text-white text-xl font-bold">{formatPrice(planData.total_paid)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-yellow-300" />
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">Υπόλοιπο</p>
                      <p className="text-white text-xl font-bold">{formatPrice(planData.remaining)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installments Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Λεπτομέρειες Δόσεων</h3>
            
            {planData.installments.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Δεν υπάρχουν δόσεις για εμφάνιση</p>
              </div>
            ) : (
              <>
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Δόση
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ημερομηνία Λήξης
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ποσό
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Κατάσταση
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {planData.installments.map((installment) => (
                        <tr key={installment.installment_number} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                Δόση {installment.installment_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(installment.due_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(installment.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <InstallmentStatus status={mapStatusToType(installment.status)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - Visible only on mobile */}
                <div className="sm:hidden space-y-4">
                  {planData.installments.map((installment) => (
                    <div
                      key={installment.installment_number}
                      className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <button
                        onClick={() => toggleInstallmentExpansion(installment.installment_number)}
                        className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 min-h-[60px]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-md">
                            Δόση {installment.installment_number}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(installment.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(installment.due_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <InstallmentStatus status={mapStatusToType(installment.status)} />
                          {expandedInstallments.has(installment.installment_number) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                      
                      {/* Expanded Details */}
                      {expandedInstallments.has(installment.installment_number) && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Ημερομηνία Λήξης:</span>
                              <div className="flex items-center text-sm text-gray-900">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {formatDate(installment.due_date)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Ποσό:</span>
                              <span className="text-sm font-bold text-gray-900">
                                {formatPrice(installment.amount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Κατάσταση:</span>
                              <InstallmentStatus status={mapStatusToType(installment.status)} />
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

          {/* Footer Note - Mobile Optimized */}
          <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Αυτό το πλάνο δόσεων έχει κλειδωθεί από τη διοίκηση και δεν μπορεί να τροποποιηθεί.
                  Για οποιαδήποτε ερώτηση, επικοινωνήστε με τη διοίκηση.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentPlanPage;
