import React from 'react';
import { 
  CreditCard,
  Search,
  X,
  Save,
  Loader2,
  Trash2,
  User,
  Calendar
} from 'lucide-react';
import { MembershipRequest } from '@/types';
import { formatPrice, getDurationLabel } from '@/utils/membershipApi';

interface AdminUltimateInstallmentsTabProps {
  ultimateRequests: MembershipRequest[];
  ultimateLoading: boolean;
  ultimateSearchTerm: string;
  setUltimateSearchTerm: (term: string) => void;
  selectedRequestOptions: {[requestId: string]: any};
  handleRequestOptionChange: (requestId: string, option: string, value: any) => void;
  updateInstallmentAmounts: (
    requestId: string,
    installment1Amount: number,
    installment2Amount: number,
    installment3Amount: number,
    installment1PaymentMethod: string,
    installment2PaymentMethod: string,
    installment3PaymentMethod: string,
    installment1DueDate?: string,
    installment2DueDate?: string,
    installment3DueDate?: string
  ) => Promise<void>;
  deleteUltimateRequest: (requestId: string) => Promise<void>;
  loadUltimateRequests: () => Promise<void>;
  handleApproveRequest: (requestId: string) => Promise<void>;
  handleRejectRequest: (requestId: string) => Promise<void>;
  loading: boolean;
  requestProgramApprovalStatus: {[requestId: string]: 'none' | 'approved' | 'rejected' | 'pending'};
  handleRequestProgramApprovalChange: (requestId: string, status: 'approved' | 'rejected' | 'pending') => void;
  handleSaveRequestProgramOptions: (requestId: string) => Promise<void>;
  requestPendingUsers: Set<string>;
  requestFrozenOptions: {[requestId: string]: any};
}

const AdminUltimateInstallmentsTab: React.FC<AdminUltimateInstallmentsTabProps> = ({
  ultimateRequests,
  ultimateLoading,
  ultimateSearchTerm,
  setUltimateSearchTerm,
  selectedRequestOptions,
  handleRequestOptionChange,
  updateInstallmentAmounts,
  deleteUltimateRequest,
  loadUltimateRequests,
  handleApproveRequest,
  handleRejectRequest,
  loading,
  requestProgramApprovalStatus,
  handleRequestProgramApprovalChange,
  handleSaveRequestProgramOptions,
  requestPendingUsers,
  requestFrozenOptions
}) => {
  // Pagination state for large datasets
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 50;
  const LARGE_DATASET_THRESHOLD = 100;
  // Filter ultimate requests by search term
  const getFilteredUltimateRequests = () => {
    const filtered = ultimateRequests.filter(request => {
      const searchMatch = ultimateSearchTerm === '' || 
        `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.toLowerCase()
          .includes(ultimateSearchTerm.toLowerCase()) ||
        (request.user?.email || '').toLowerCase().includes(ultimateSearchTerm.toLowerCase());
      
      return searchMatch;
    });

    // Apply pagination for large datasets
    if (filtered.length > LARGE_DATASET_THRESHOLD) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return filtered.slice(startIndex, endIndex);
    }

    return filtered;
  };

  const getTotalFilteredCount = () => {
    return ultimateRequests.filter(request => {
      const searchMatch = ultimateSearchTerm === '' || 
        `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.toLowerCase()
          .includes(ultimateSearchTerm.toLowerCase()) ||
        (request.user?.email || '').toLowerCase().includes(ultimateSearchTerm.toLowerCase());
      
      return searchMatch;
    }).length;
  };

  const getTotalPages = () => {
    const totalCount = getTotalFilteredCount();
    return Math.ceil(totalCount / ITEMS_PER_PAGE);
  };

  const isLargeDataset = () => {
    return getTotalFilteredCount() > LARGE_DATASET_THRESHOLD;
  };

  const isRequestPending = (requestId: string) => {
    return requestPendingUsers.has(requestId);
  };

  const getFrozenRequestOptions = (requestId: string) => {
    return requestFrozenOptions[requestId] || {};
  };

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [ultimateSearchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <span className="text-4xl mr-3">👑</span>
            Ultimate Συνδρομές
          </h2>
          <p className="text-gray-300 mt-2 text-lg">Διαχείριση αιτημάτων για πακέτα Ultimate με και χωρίς δόσεις</p>
        </div>
        <button
          onClick={loadUltimateRequests}
          disabled={ultimateLoading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
        >
          {ultimateLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>Ανανέωση</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl shadow-lg border border-gray-600 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
              <input
                type="text"
                placeholder="🔍 Αναζήτηση με όνομα χρήστη ή email..."
                value={ultimateSearchTerm}
                onChange={(e) => setUltimateSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg font-medium"
              />
            </div>
          </div>
          {ultimateSearchTerm && (
            <button
              onClick={() => setUltimateSearchTerm('')}
              className="px-4 py-4 text-gray-400 hover:text-white transition-colors bg-gray-600 rounded-xl hover:bg-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Pagination Controls for Large Datasets */}
      {isLargeDataset() && !ultimateLoading && (
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl shadow-lg border border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">
              Σελίδα {currentPage} από {getTotalPages()} • Σύνολο: {getTotalFilteredCount()} αιτήματα
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Πρώτη
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Προηγούμενη
              </button>
              <span className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">
                {currentPage} / {getTotalPages()}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                disabled={currentPage === getTotalPages()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Επόμενη
              </button>
              <button
                onClick={() => setCurrentPage(getTotalPages())}
                disabled={currentPage === getTotalPages()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Τελευταία
              </button>
            </div>
          </div>
        </div>
      )}

      {ultimateLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <span className="text-gray-300 font-medium text-lg">Φόρτωση Ultimate αιτημάτων...</span>
          </div>
        </div>
      ) : getFilteredUltimateRequests().length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-full p-6 w-24 h-24 mx-auto mb-6 shadow-2xl">
            <CreditCard className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">
            {ultimateSearchTerm ? '🔍 Δεν βρέθηκαν αποτελέσματα' : '👑 Δεν υπάρχουν Ultimate αιτήματα'}
          </h3>
          <p className="text-gray-300 text-lg">
            {ultimateSearchTerm 
              ? 'Δοκιμάστε διαφορετικό όνομα για την αναζήτηση.' 
              : 'Όταν οι χρήστες υποβάλουν αιτήματα για το πακέτο Ultimate, θα εμφανίζονται εδώ.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {getFilteredUltimateRequests().map((request) => (
            <div key={request.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-8 hover:shadow-3xl transition-all duration-300 transform hover:scale-102">
              {/* Main Request Card */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                {/* User Information */}
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    {request.user?.profile_photo ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-3 border-blue-400">
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
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center hidden">
                          <User className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {request.status === 'pending' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-2xl font-bold text-white mb-2">
                      {request.user?.first_name} {request.user?.last_name}
                    </h4>
                    <p className="text-gray-300 mb-3 flex items-center text-lg">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {request.user?.email}
                    </p>
                    <div className="flex items-center space-x-3 flex-wrap">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                        👑 Ultimate Package
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-200 font-medium">{getDurationLabel(request.duration_type)}</span>
                      {request.has_installments && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
                            💳 Με Δόσεις
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Price and Actions */}
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent mb-2">
                      {formatPrice(request.requested_price)}
                    </div>
                    <div className="text-gray-300 flex items-center justify-end">
                      <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="font-medium">{new Date(request.created_at).toLocaleDateString('el-GR')}</span>
                    </div>
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    {request.status === 'pending' && (
                      <div className="flex flex-col space-y-3">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={loading}
                          className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-lg font-bold shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-110"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>✅ Εγκρίνω</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                          className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-lg font-bold shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-110"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span>❌ Απορρίπτω</span>
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'approved' && (
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-3 border border-green-500/30">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-lg">
                          ✅ Εγκεκριμένο
                        </span>
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl p-3 border border-red-500/30">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg">
                          ❌ Απορριφθέν
                        </span>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το Ultimate αίτημα; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
                          deleteUltimateRequest(request.id);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>🗑️ Διαγραφή</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Installments Management - Only for requests with installments */}
              {request.has_installments && (
                <div className="mt-8 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30 shadow-xl">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">💳</span>
                    Διαχείριση Δόσεων
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1η Δόση */}
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-5 border border-gray-600 shadow-lg">
                      <label className="block text-lg font-bold text-white mb-4 flex items-center">
                        <span className="text-2xl mr-2">1️⃣</span>
                        1η Δόση
                      </label>
                      <div className="space-y-4">
                        <input
                          type="number"
                          value={selectedRequestOptions[request.id]?.installment1Amount || request.installment_1_amount || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment1Amount', e.target.value)}
                          placeholder="Ποσό"
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg font-medium"
                        />
                        <select
                          value={selectedRequestOptions[request.id]?.installment1PaymentMethod || request.installment_1_payment_method || 'cash'}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment1PaymentMethod', e.target.value)}
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-lg font-medium"
                        >
                          <option value="cash">💰 Μετρητά</option>
                          <option value="pos">💳 POS</option>
                        </select>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            📅 Ημερομηνία Πληρωμής
                          </label>
                          <input
                            type="date"
                            value={selectedRequestOptions[request.id]?.installment1DueDate || request.installment_1_due_date || ''}
                            onChange={(e) => handleRequestOptionChange(request.id, 'installment1DueDate', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2η Δόση */}
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-5 border border-gray-600 shadow-lg">
                      <label className="block text-lg font-bold text-white mb-4 flex items-center">
                        <span className="text-2xl mr-2">2️⃣</span>
                        2η Δόση
                      </label>
                      <div className="space-y-4">
                        <input
                          type="number"
                          value={selectedRequestOptions[request.id]?.installment2Amount || request.installment_2_amount || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment2Amount', e.target.value)}
                          placeholder="Ποσό"
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg font-medium"
                        />
                        <select
                          value={selectedRequestOptions[request.id]?.installment2PaymentMethod || request.installment_2_payment_method || 'cash'}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment2PaymentMethod', e.target.value)}
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-lg font-medium"
                        >
                          <option value="cash">💰 Μετρητά</option>
                          <option value="pos">💳 POS</option>
                        </select>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            📅 Ημερομηνία Πληρωμής
                          </label>
                          <input
                            type="date"
                            value={selectedRequestOptions[request.id]?.installment2DueDate || request.installment_2_due_date || ''}
                            onChange={(e) => handleRequestOptionChange(request.id, 'installment2DueDate', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3η Δόση */}
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-5 border border-gray-600 shadow-lg">
                      <label className="block text-lg font-bold text-white mb-4 flex items-center">
                        <span className="text-2xl mr-2">3️⃣</span>
                        3η Δόση
                      </label>
                      <div className="space-y-4">
                        <input
                          type="number"
                          value={selectedRequestOptions[request.id]?.installment3Amount || request.installment_3_amount || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment3Amount', e.target.value)}
                          placeholder="Ποσό"
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg font-medium"
                        />
                        <select
                          value={selectedRequestOptions[request.id]?.installment3PaymentMethod || request.installment_3_payment_method || 'cash'}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment3PaymentMethod', e.target.value)}
                          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-lg font-medium"
                        >
                          <option value="cash">💰 Μετρητά</option>
                          <option value="pos">💳 POS</option>
                        </select>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            📅 Ημερομηνία Πληρωμής
                          </label>
                          <input
                            type="date"
                            value={selectedRequestOptions[request.id]?.installment3DueDate || request.installment_3_due_date || ''}
                            onChange={(e) => handleRequestOptionChange(request.id, 'installment3DueDate', e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/30 to-blue-600/30 rounded-2xl border border-blue-500/50 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-300 text-lg">💰 Σύνολο Δόσεων:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                        {formatPrice(
                          (Number(selectedRequestOptions[request.id]?.installment1Amount || request.installment_1_amount || 0)) +
                          (Number(selectedRequestOptions[request.id]?.installment2Amount || request.installment_2_amount || 0)) +
                          (Number(selectedRequestOptions[request.id]?.installment3Amount || request.installment_3_amount || 0))
                        )}
                      </span>
                    </div>
                    <div className="text-blue-200 mt-2 font-medium">
                      📊 Από {formatPrice(request.requested_price)} (Πακέτο Ultimate)
                    </div>
                  </div>

                  {/* Save Installments Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        const installment1Amount = parseFloat(selectedRequestOptions[request.id]?.installment1Amount || request.installment_1_amount || '0');
                        const installment2Amount = parseFloat(selectedRequestOptions[request.id]?.installment2Amount || request.installment_2_amount || '0');
                        const installment3Amount = parseFloat(selectedRequestOptions[request.id]?.installment3Amount || request.installment_3_amount || '0');
                        const installment1PaymentMethod = selectedRequestOptions[request.id]?.installment1PaymentMethod || request.installment_1_payment_method || 'cash';
                        const installment2PaymentMethod = selectedRequestOptions[request.id]?.installment2PaymentMethod || request.installment_2_payment_method || 'cash';
                        const installment3PaymentMethod = selectedRequestOptions[request.id]?.installment3PaymentMethod || request.installment_3_payment_method || 'cash';
                        const installment1DueDate = selectedRequestOptions[request.id]?.installment1DueDate || request.installment_1_due_date;
                        const installment2DueDate = selectedRequestOptions[request.id]?.installment2DueDate || request.installment_2_due_date;
                        const installment3DueDate = selectedRequestOptions[request.id]?.installment3DueDate || request.installment_3_due_date;

                        updateInstallmentAmounts(
                          request.id,
                          installment1Amount,
                          installment2Amount,
                          installment3Amount,
                          installment1PaymentMethod,
                          installment2PaymentMethod,
                          installment3PaymentMethod,
                          installment1DueDate,
                          installment2DueDate,
                          installment3DueDate
                        );
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-3 shadow-2xl hover:shadow-3xl transform hover:scale-110 font-bold text-lg"
                    >
                      <Save className="h-5 w-5" />
                      <span>💾 Αποθήκευση Δόσεων & Ημερομηνιών</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Program Options Section */}
              <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="text-3xl mr-3">⚙️</span>
                  Program Options
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Old Members Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRequestPending(request.id)) {
                        return; // Frozen, can't change
                      }
                      handleRequestOptionChange(request.id, 'oldMembers', !selectedRequestOptions[request.id]?.oldMembers);
                    }}
                    className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-200 shadow-2xl transform hover:scale-105 text-lg ${
                      isRequestPending(request.id) 
                        ? (getFrozenRequestOptions(request.id)?.oldMembers 
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white cursor-not-allowed border-2 border-yellow-400'
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-yellow-400')
                        : (selectedRequestOptions[request.id]?.oldMembers
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-2 border-green-400' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-2 border-blue-400')
                    }`}
                    disabled={isRequestPending(request.id)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>👴 Παλαιά μέλη</span>
                      {((isRequestPending(request.id) ? getFrozenRequestOptions(request.id)?.oldMembers : selectedRequestOptions[request.id]?.oldMembers)) && (
                        <span className="text-green-200 text-xl">✓</span>
                      )}
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400">🔒</span>
                      )}
                    </div>
                  </button>

                  {/* Kettlebell Points Input */}
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-5 border border-gray-600 shadow-lg">
                    <label className="block text-lg font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-2">🏋️‍♂️</span>
                      Kettlebell Points
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400 ml-2">🔒</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={isRequestPending(request.id) 
                        ? (getFrozenRequestOptions(request.id)?.kettlebellPoints || '')
                        : (selectedRequestOptions[request.id]?.kettlebellPoints || '')}
                      onChange={(e) => {
                        if (isRequestPending(request.id)) return;
                        handleRequestOptionChange(request.id, 'kettlebellPoints', e.target.value);
                      }}
                      className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 text-lg font-medium ${
                        isRequestPending(request.id)
                          ? 'border-yellow-500 bg-yellow-500/20 focus:ring-yellow-500 cursor-not-allowed text-yellow-200 placeholder-yellow-300'
                          : 'border-gray-600 bg-gray-800 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400'
                      }`}
                      placeholder="Εισάγετε αριθμό..."
                      disabled={isRequestPending(request.id)}
                    />
                  </div>

                  {/* Cash Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRequestPending(request.id)) return;
                      handleRequestOptionChange(request.id, 'cash', !selectedRequestOptions[request.id]?.cash);
                    }}
                    className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-200 shadow-2xl transform hover:scale-105 text-lg ${
                      isRequestPending(request.id)
                        ? (getFrozenRequestOptions(request.id)?.cash 
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white cursor-not-allowed border-2 border-yellow-400'
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-yellow-400')
                        : (selectedRequestOptions[request.id]?.cash
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-2 border-green-400' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-2 border-blue-400')
                    }`}
                    disabled={isRequestPending(request.id)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>💰 Μετρητά</span>
                      {((isRequestPending(request.id) ? getFrozenRequestOptions(request.id)?.cash : selectedRequestOptions[request.id]?.cash)) && (
                        <span className="text-green-200 text-xl">✓</span>
                      )}
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400">🔒</span>
                      )}
                    </div>
                  </button>

                  {/* POS Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isRequestPending(request.id)) return;
                      handleRequestOptionChange(request.id, 'pos', !selectedRequestOptions[request.id]?.pos);
                    }}
                    className={`w-full px-6 py-4 rounded-2xl font-bold transition-all duration-200 shadow-2xl transform hover:scale-105 text-lg ${
                      isRequestPending(request.id)
                        ? (getFrozenRequestOptions(request.id)?.pos 
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white cursor-not-allowed border-2 border-yellow-400'
                            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-yellow-400')
                        : (selectedRequestOptions[request.id]?.pos
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-2 border-green-400' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-2 border-blue-400')
                    }`}
                    disabled={isRequestPending(request.id)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>💳 POS</span>
                      {((isRequestPending(request.id) ? getFrozenRequestOptions(request.id)?.pos : selectedRequestOptions[request.id]?.pos)) && (
                        <span className="text-green-200 text-xl">✓</span>
                      )}
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400">🔒</span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Cash Amount Input - Show if cash is selected */}
                {(selectedRequestOptions[request.id]?.cash || getFrozenRequestOptions(request.id)?.cash) && (
                  <div className="mb-6 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl p-5 border border-green-500/30">
                    <label className="block text-lg font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-2">💰</span>
                      Ποσό Μετρητών (€)
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400 ml-2">🔒</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={isRequestPending(request.id) 
                        ? (getFrozenRequestOptions(request.id)?.cashAmount?.toString() || '')
                        : (selectedRequestOptions[request.id]?.cashAmount?.toString() || '')}
                      onChange={(e) => {
                        if (isRequestPending(request.id)) return;
                        handleRequestOptionChange(request.id, 'cashAmount', parseFloat(e.target.value) || 0);
                      }}
                      className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 text-lg font-medium ${
                        isRequestPending(request.id)
                          ? 'border-yellow-500 bg-yellow-500/20 focus:ring-yellow-500 cursor-not-allowed text-yellow-200 placeholder-yellow-300'
                          : 'border-gray-600 bg-gray-800 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400'
                      }`}
                      placeholder="Εισάγετε ποσό σε €..."
                      disabled={isRequestPending(request.id)}
                    />
                  </div>
                )}

                {/* POS Amount Input - Show if pos is selected */}
                {(selectedRequestOptions[request.id]?.pos || getFrozenRequestOptions(request.id)?.pos) && (
                  <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl p-5 border border-blue-500/30">
                    <label className="block text-lg font-bold text-white mb-4 flex items-center">
                      <span className="text-2xl mr-2">💳</span>
                      Ποσό POS (€)
                      {isRequestPending(request.id) && (
                        <span className="text-yellow-400 ml-2">🔒</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={isRequestPending(request.id) 
                        ? (getFrozenRequestOptions(request.id)?.posAmount?.toString() || '')
                        : (selectedRequestOptions[request.id]?.posAmount?.toString() || '')}
                      onChange={(e) => {
                        if (isRequestPending(request.id)) return;
                        handleRequestOptionChange(request.id, 'posAmount', parseFloat(e.target.value) || 0);
                      }}
                      className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 text-lg font-medium ${
                        isRequestPending(request.id)
                          ? 'border-yellow-500 bg-yellow-500/20 focus:ring-yellow-500 cursor-not-allowed text-yellow-200 placeholder-yellow-300'
                          : 'border-gray-600 bg-gray-800 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400'
                      }`}
                      placeholder="Εισάγετε ποσό σε €..."
                      disabled={isRequestPending(request.id)}
                    />
                  </div>
                )}

                {/* Approval Buttons */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <button
                    onClick={() => handleRequestProgramApprovalChange(request.id, 'approved')}
                    className={`px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-200 shadow-xl transform hover:scale-105 ${
                      requestProgramApprovalStatus[request.id] === 'approved'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-400'
                        : 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border-2 border-green-500/30 hover:from-green-500/30 hover:to-green-600/30'
                    }`}
                  >
                    ✅ Έγκριση
                  </button>
                  <button
                    onClick={() => handleRequestProgramApprovalChange(request.id, 'rejected')}
                    className={`px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-200 shadow-xl transform hover:scale-105 ${
                      requestProgramApprovalStatus[request.id] === 'rejected'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-2 border-red-400'
                        : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-2 border-red-500/30 hover:from-red-500/30 hover:to-red-600/30'
                    }`}
                  >
                    ❌ Απόρριψη
                  </button>
                  <button
                    onClick={() => handleRequestProgramApprovalChange(request.id, 'pending')}
                    className={`px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-200 shadow-xl transform hover:scale-105 ${
                      requestProgramApprovalStatus[request.id] === 'pending'
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white border-2 border-yellow-400'
                        : 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-2 border-yellow-500/30 hover:from-yellow-500/30 hover:to-yellow-600/30'
                    }`}
                  >
                    ⏳ Αναμονή
                  </button>
                  <button
                    onClick={() => handleSaveRequestProgramOptions(request.id)}
                    disabled={loading || requestProgramApprovalStatus[request.id] === 'none'}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-2xl hover:shadow-3xl transform hover:scale-105"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    💾 Αποθήκευση Program Options
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUltimateInstallmentsTab;
