import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { InstallmentPlanData } from '@/services/api/installmentApi';
import InstallmentStatus, { InstallmentStatusType } from '@/components/InstallmentStatus';

// Helper function για να λάβει τα δεδομένα από το API - ΤΩΡΑ ΕΠΙΣΤΡΕΦΕΙ ΟΛΑ ΤΑ ΠΛΑΝΑ
const fetchAllInstallmentPlans = async (): Promise<InstallmentPlanData[]> => {
  try {
    // Import και κλήση του service απευθείας
    const { getAllInstallmentPlans } = await import('@/services/api/installmentApi');
    const data = await getAllInstallmentPlans();
    return data;
  } catch (error) {
    console.error('Error fetching installment plans:', error);
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
  // ΑΛΛΑΓΗ: Τώρα κρατάμε array από πλάνα αντί για ένα μόνο
  const [plansData, setPlansData] = useState<InstallmentPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ΑΛΛΑΓΗ: Χρησιμοποιούμε string key (planId-installmentNumber) για το expansion
  const [expandedInstallments, setExpandedInstallments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadInstallmentPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Φορτώνουμε ΟΛΑ τα πλάνα δόσεων
        const data = await fetchAllInstallmentPlans();
        
        if (data.length === 0) {
          setError('Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας');
        } else {
          setPlansData(data);
        }
      } catch (err) {
        console.error('Error loading installment plans:', err);
        setError('Σφάλμα κατά τη φόρτωση του πλάνου δόσεων');
        toast.error('Σφάλμα κατά τη φόρτωση του πλάνου δόσεων');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadInstallmentPlans();
    }
  }, [user?.id]);

  // Helper functions για mobile UI - ΑΛΛΑΓΗ: Χρησιμοποιεί planId-installmentNumber
  const toggleInstallmentExpansion = (planId: string, installmentNumber: number) => {
    const key = `${planId}-${installmentNumber}`;
    const newExpanded = new Set(expandedInstallments);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedInstallments(newExpanded);
  };

  const isInstallmentExpanded = (planId: string, installmentNumber: number) => {
    return expandedInstallments.has(`${planId}-${installmentNumber}`);
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

  if (error || plansData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-sm mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Πλάνο Δόσεων</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error || 'Δεν υπάρχει ενεργό πλάνο δόσεων'}</p>
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

        {/* Installments Section - ΤΩΡΑ ΕΜΦΑΝΙΖΕΙ ΟΛΑ ΤΑ ΠΛΑΝΑ */}
        {plansData.map((planData, planIndex) => (
          <div key={planData.subscriptionId} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Τίτλος με το όνομα του πακέτου */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  {planData.packageName}
                </h3>
                {plansData.length > 1 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                    Πλάνο {planIndex + 1} από {plansData.length}
                  </span>
                )}
              </div>
              
              
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
                          onClick={() => toggleInstallmentExpansion(planData.subscriptionId, installment.installment_number)}
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
                            {isInstallmentExpanded(planData.subscriptionId, installment.installment_number) ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Expanded Details */}
                        {isInstallmentExpanded(planData.subscriptionId, installment.installment_number) && (
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
        ))}
      </div>
    </div>
  );
};

export default InstallmentPlanPage;
