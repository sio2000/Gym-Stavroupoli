import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock,
  DollarSign,
  Settings,
  Users,
  CreditCard,
  User,
  Check,
  X,
  Euro,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  MembershipRequest
} from '@/types';
import PilatesScheduleManagement from '@/components/admin/PilatesScheduleManagement';
import CashRegister from '@/components/admin/CashRegister';
import UsersInformation from '@/components/admin/UsersInformation';
import ErrorFixing from '@/components/admin/ErrorFixing';
import ErrorBoundary from '@/components/ErrorBoundary';

import { 
  getMembershipRequestsWithLockedInstallments,
  approveMembershipRequest,
  rejectMembershipRequest,
} from '@/utils/membershipApi';


const ControlPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pilates-schedule' | 'membership-packages' | 'cash-register' | 'users-information' | 'error-fixing'>('pilates-schedule');
  

  // Membership packages state - removed unused variables
  
  // Membership Requests state
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [requestSearch, setRequestSearch] = useState<string>('');
  const [requestsPage, setRequestsPage] = useState<number>(1);
  const REQUESTS_PER_PAGE = 6;
  
  // Membership Requests filters
  const [requestPackageFilter, setRequestPackageFilter] = useState<'all' | 'Open Gym' | 'Pilates' | 'Ultimate' | 'Installments'>('all');
  

  // Tabs configuration
  const tabs = [
    { id: 'pilates-schedule', name: 'Πρόγραμμα Pilates', icon: Clock },
    { id: 'membership-packages', name: 'Πακέτα Συνδρομών', icon: Settings },
    { id: 'cash-register', name: 'Ταμείο', icon: DollarSign },
    { id: 'users-information', name: 'Χρήστες-Πληροφορίες', icon: Users },
    { id: 'error-fixing', name: 'Διόρθωση Σφαλμάτων', icon: AlertTriangle }
  ];


  // Load data when tab changes
  useEffect(() => {
    if (!user?.id) return;

    // Load data based on active tab
    if (activeTab === 'membership-packages') {
      console.log('[ControlPanel] Loading data for membership-packages tab');
      loadMembershipRequests();
    }
  }, [user?.id, activeTab]);

  // Load data when membership-packages tab is selected
  useEffect(() => {
    if (activeTab === 'membership-packages') {
      loadMembershipRequests();
    }
  }, [activeTab]);

  // Load membership requests
  const loadMembershipRequests = async () => {
    try {
      setMembershipLoading(true);
      const requests = await getMembershipRequestsWithLockedInstallments();
      setMembershipRequests(requests);
    } catch (error) {
      console.error('Error loading membership requests:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των αιτημάτων συνδρομών');
    } finally {
      setMembershipLoading(false);
    }
  };


  // Handle membership request approval
  const handleApproveRequest = async (requestId: string) => {
    try {
      await approveMembershipRequest(requestId);
      await loadMembershipRequests();
      toast.success('Το αίτημα εγκρίθηκε επιτυχώς');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Σφάλμα κατά την έγκριση του αιτήματος');
    }
  };

  // Handle membership request rejection
  const handleRejectRequest = async (requestId: string, reason?: string) => {
    try {
      await rejectMembershipRequest(requestId, reason || 'Απόρριψη από τον διαχειριστή');
      await loadMembershipRequests();
      toast.success('Το αίτημα απορρίφθηκε');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Σφάλμα κατά την απόρριψη του αιτήματος');
    }
  };


  // Helper functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getDurationLabel = (durationType: string) => {
    const durationMap: { [key: string]: string } = {
      'lesson': 'Μάθημα',
      'month': 'Μήνας',
      '3 Μήνες': '3 Μήνες',
      'semester': 'Εξάμηνο',
      'year': 'Έτος'
    };
    return durationMap[durationType] || durationType;
  };


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
                  <p className="text-sm text-gray-500">Διαχείριση Pilates, Ταμείου, Πακέτων & Χρηστών</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Control Panel</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mx-4 mt-6">
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
            {/* Pilates Schedule Tab */}
            {activeTab === 'pilates-schedule' && (
              <PilatesScheduleManagement />
            )}

            {/* Membership Packages Tab - Membership Requests */}
            {activeTab === 'membership-packages' && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-3xl mr-3">📋</span>
                    Πακέτα Συνδρομών
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2" onClick={() => setRequestsPage(1)}>
                      <button
                        onClick={() => setRequestPackageFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${requestPackageFilter === 'all' ? 'bg-gray-700 text-white border-gray-500' : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'}`}
                      >
                        Όλα
                      </button>
                      <button
                        onClick={() => setRequestPackageFilter('Open Gym')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${requestPackageFilter === 'Open Gym' ? 'bg-blue-700 text-white border-blue-500' : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'}`}
                      >
                        Open Gym
                      </button>
                      <button
                        onClick={() => setRequestPackageFilter('Pilates')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${requestPackageFilter === 'Pilates' ? 'bg-purple-700 text-white border-purple-500' : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'}`}
                      >
                        Pilates
                      </button>
                      <button
                        onClick={() => setRequestPackageFilter('Ultimate')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${requestPackageFilter === 'Ultimate' ? 'bg-orange-700 text-white border-orange-500' : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'}`}
                      >
                        Ultimate
                      </button>
                      <button
                        onClick={() => setRequestPackageFilter('Installments')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${requestPackageFilter === 'Installments' ? 'bg-amber-700 text-white border-amber-500' : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'}`}
                      >
                        Δόσεις
                      </button>
                    </div>
                    <input
                      type="text"
                      value={requestSearch}
                      onChange={(e) => { setRequestsPage(1); setRequestSearch(e.target.value); }}
                      placeholder="Αναζήτηση χρήστη..."
                      className="px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={loadMembershipRequests}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Ανανέωση</span>
                    </button>
                  </div>
                </div>

                {membershipLoading ? (
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
                      .filter(request => {
                        // package filter
                        if (requestPackageFilter === 'all') return true;
                        if (requestPackageFilter === 'Installments') {
                          return !!request.has_installments;
                        }
                        const pkg = (request.package?.name || '').trim();
                        if (requestPackageFilter === 'Open Gym') {
                          return pkg === 'Free Gym';
                        }
                        return pkg === requestPackageFilter;
                      })
                      .filter(request => {
                        // search by user name
                        const term = requestSearch.trim().toLowerCase();
                        if (!term) return true;
                        const fullName = `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim().toLowerCase();
                        return fullName.includes(term);
                      })
                      .slice((requestsPage - 1) * REQUESTS_PER_PAGE, requestsPage * REQUESTS_PER_PAGE)
                      .map((request) => (
                      <div key={`${request.id}-${request.package?.name || 'pkg'}`} className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-2xl p-6 hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-102">
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
                          
                          {/* Κουμπιά Έγκριση/Απόρριψη */}
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
                                  handleRejectRequest(request.id, reason);
                                }
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <X className="h-4 w-4 inline mr-2" />
                              ❌ Απόρριψη
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                        disabled={requestsPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${requestsPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-800 text-gray-200 hover:text-white border-gray-700'}`}
                      >
                        Προηγούμενο
                      </button>
                      <span className="text-gray-300 text-sm">Σελίδα {requestsPage}</span>
                      <button
                        onClick={() => setRequestsPage(p => p + 1)}
                        className="px-4 py-2 rounded-lg text-sm font-medium border bg-gray-800 text-gray-200 hover:text-white border-gray-700"
                      >
                        Επόμενη
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Cash Register Tab */}
            {activeTab === 'cash-register' && (
              <CashRegister />
            )}

            {/* Users Information Tab */}
            {activeTab === 'users-information' && (
              <UsersInformation />
            )}

            {/* Error Fixing Tab */}
            {activeTab === 'error-fixing' && (
              <ErrorFixing />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ControlPanel;
