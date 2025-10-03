import React from 'react';
import { 
  CreditCard,
  Search,
  X,
  Save,
  Loader2,
  Trash2,
  User,
  Calendar,
  Lock
} from 'lucide-react';
import { MembershipRequest } from '@/types';
import { formatPrice, getDurationLabel } from '@/utils/membershipApi';

interface InstallmentsTabProps {
  installmentRequests: MembershipRequest[];
  installmentLoading: boolean;
  installmentSearchTerm: string;
  setInstallmentSearchTerm: (term: string) => void;
  selectedRequestOptions: {[requestId: string]: any};
  handleRequestOptionChange: (requestId: string, option: string, value: any) => void;
  deleteInstallmentRequest: (requestId: string) => Promise<void>;
  loadInstallmentRequests: () => Promise<void>;
  handleApproveRequest: (requestId: string) => Promise<void>;
  handleRejectRequest: (requestId: string) => Promise<void>;
  loading: boolean;
  handleInstallmentLockClick: (requestId: string, installmentNumber: number) => void;
  handleDeleteThirdInstallmentClick: (requestId: string) => void;
  isInstallmentLocked: (request: MembershipRequest, installmentNumber: number) => boolean;
  showLockConfirmation: boolean;
  pendingLockRequest: { requestId: string; installmentNumber: number } | null;
  confirmInstallmentLock: () => Promise<void>;
  cancelInstallmentLock: () => void;
  showDeleteConfirmation: boolean;
  pendingDeleteRequest: string | null;
  confirmDeleteThirdInstallment: () => Promise<void>;
  cancelDeleteThirdInstallment: () => void;
  // Program Options props
  requestProgramApprovalStatus: {[requestId: string]: 'none' | 'approved' | 'rejected' | 'pending'};
  handleRequestProgramApprovalChange: (requestId: string, status: 'none' | 'approved' | 'rejected' | 'pending') => void;
  handleSaveRequestProgramOptions: (requestId: string) => Promise<void>;
  requestPendingUsers: Set<string>;
  requestFrozenOptions: {[requestId: string]: any};
}

const InstallmentsTab: React.FC<InstallmentsTabProps> = ({
  installmentRequests,
  installmentLoading,
  installmentSearchTerm,
  setInstallmentSearchTerm,
  selectedRequestOptions,
  handleRequestOptionChange,
  deleteInstallmentRequest,
  loadInstallmentRequests,
  handleApproveRequest,
  handleRejectRequest,
  loading,
  handleInstallmentLockClick,
  handleDeleteThirdInstallmentClick,
  isInstallmentLocked,
  showLockConfirmation,
  pendingLockRequest,
  confirmInstallmentLock,
  cancelInstallmentLock,
  showDeleteConfirmation,
  pendingDeleteRequest,
  confirmDeleteThirdInstallment,
  cancelDeleteThirdInstallment,
  requestProgramApprovalStatus,
  handleRequestProgramApprovalChange,
  handleSaveRequestProgramOptions,
  requestPendingUsers,
  requestFrozenOptions
}) => {
  // Helper functions for Program Options
  const isRequestPending = (requestId: string) => {
    return requestPendingUsers.has(requestId);
  };

  const getFrozenRequestOptions = (requestId: string) => {
    return requestFrozenOptions[requestId] || {};
  };

  // Filter installment requests by search term
  const getFilteredInstallmentRequests = () => {
    return installmentRequests.filter(request => {
      const searchMatch = installmentSearchTerm === '' || 
        `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.toLowerCase()
          .includes(installmentSearchTerm.toLowerCase());
      
      return searchMatch;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Δόσεις Ultimate</h2>
          <p className="text-gray-600 mt-1">Διαχείριση δόσεων για πακέτα Ultimate</p>
        </div>
        <button
          onClick={loadInstallmentRequests}
          disabled={installmentLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {installmentLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>Ανανέωση</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Αναζήτηση με όνομα χρήστη..."
                value={installmentSearchTerm}
                onChange={(e) => setInstallmentSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          {installmentSearchTerm && (
            <button
              onClick={() => setInstallmentSearchTerm('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {installmentLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Φόρτωση αιτημάτων δόσεων...</span>
        </div>
      ) : getFilteredInstallmentRequests().length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {installmentSearchTerm ? 'Δεν βρέθηκαν αποτελέσματα' : 'Δεν υπάρχουν αιτήματα δόσεων'}
          </h3>
          <p className="text-gray-600">
            {installmentSearchTerm 
              ? 'Δοκιμάστε διαφορετικό όνομα για την αναζήτηση.' 
              : 'Όταν οι χρήστες επιλέξουν δόσεις για το πακέτο Ultimate, θα εμφανίζονται εδώ.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {getFilteredInstallmentRequests().map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    {/* Main Request Card - Same as Admin Panel */}
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* User Information */}
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            {request.user?.profile_photo ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                <img 
                                  src={request.user.profile_photo} 
                                  alt={`${request.user?.first_name} ${request.user?.last_name}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to icon if image fails to load
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
                            {request.status === 'pending' && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-slate-900 mb-1">
                              {request.user?.first_name} {request.user?.last_name}
                            </h4>
                            <p className="text-sm text-slate-600 mb-2 flex items-center">
                              <span className="w-2 h-2 bg-slate-300 rounded-full mr-2"></span>
                              {request.user?.email}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Ultimate Package
                              </span>
                              <span className="text-sm text-slate-500">•</span>
                              <span className="text-sm text-slate-600">{getDurationLabel(request.duration_type)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price and Date */}
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900 mb-1">
                              {formatPrice(request.requested_price)}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(request.created_at).toLocaleDateString('el-GR')}
                            </div>
                          </div>
                          
                          {/* Status and Actions */}
                          <div className="flex flex-col items-end space-y-3">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveRequest(request.id)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span>Εγκρίνω</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request.id)}
                                  disabled={loading}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  <span>Απορρίπτω</span>
                                </button>
                              </div>
                            )}
                            
                            {request.status === 'approved' && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                  Εγκεκριμένο
                                </span>
                              </div>
                            )}
                            
                            {request.status === 'rejected' && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                  Απορριφθέν
                                </span>
                              </div>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αίτημα δόσεων; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
                                  deleteInstallmentRequest(request.id);
                                }
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center space-x-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Διαγραφή</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

              {/* Installments Management */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">💳</span>
                  Διαχείριση Δόσεων
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1η Δόση */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      1η Δόση
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={selectedRequestOptions[request.id]?.installment1Amount || request.installment_1_amount || ''}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment1Amount', e.target.value)}
                        placeholder="Ποσό"
                        disabled={isInstallmentLocked(request, 1)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 1)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      />
                      <select
                        value={selectedRequestOptions[request.id]?.installment1PaymentMethod || request.installment_1_payment_method || 'cash'}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment1PaymentMethod', e.target.value)}
                        disabled={isInstallmentLocked(request, 1)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 1)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      >
                        <option value="cash">💰 Μετρητά</option>
                        <option value="pos">💳 POS</option>
                      </select>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          📅 Ημερομηνία Πληρωμής
                        </label>
                        <input
                          type="date"
                          value={selectedRequestOptions[request.id]?.installment1DueDate || request.installment_1_due_date || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment1DueDate', e.target.value)}
                          disabled={isInstallmentLocked(request, 1)}
                          className={`w-full p-2 border rounded-lg focus:ring-2 text-sm ${
                            isInstallmentLocked(request, 1)
                              ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                              : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                          }`}
                        />
                      </div>
                      
                      {/* Lock Checkbox */}
                      <div className="flex items-center space-x-2 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInstallmentLocked(request, 1)}
                            onChange={() => handleInstallmentLockClick(request.id, 1)}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-xs text-gray-600 flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>Κλείδωμα Δόσης</span>
                          </span>
                        </label>
                      </div>
                      
                      {/* Locked Values Display */}
                      {isInstallmentLocked(request, 1) && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Lock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">Κλειδωμένες Τιμές</span>
                          </div>
                          <div className="space-y-1 text-xs text-orange-600">
                            <div><span className="font-medium">💰 Ποσό:</span> {formatPrice(request.installment_1_amount || 0)}</div>
                            <div><span className="font-medium">💳 Τρόπος:</span> {request.installment_1_payment_method === 'cash' ? '💰 Μετρητά' : '💳 POS'}</div>
                            <div><span className="font-medium">📅 Ημερομηνία:</span> {request.installment_1_due_date || 'Δεν ορίστηκε'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2η Δόση */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      2η Δόση
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={selectedRequestOptions[request.id]?.installment2Amount || request.installment_2_amount || ''}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment2Amount', e.target.value)}
                        placeholder="Ποσό"
                        disabled={isInstallmentLocked(request, 2)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 2)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      />
                      <select
                        value={selectedRequestOptions[request.id]?.installment2PaymentMethod || request.installment_2_payment_method || 'cash'}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment2PaymentMethod', e.target.value)}
                        disabled={isInstallmentLocked(request, 2)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 2)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      >
                        <option value="cash">💰 Μετρητά</option>
                        <option value="pos">💳 POS</option>
                      </select>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          📅 Ημερομηνία Πληρωμής
                        </label>
                        <input
                          type="date"
                          value={selectedRequestOptions[request.id]?.installment2DueDate || request.installment_2_due_date || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment2DueDate', e.target.value)}
                          disabled={isInstallmentLocked(request, 2)}
                          className={`w-full p-2 border rounded-lg focus:ring-2 text-sm ${
                            isInstallmentLocked(request, 2)
                              ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                              : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                          }`}
                        />
                      </div>
                      
                      {/* Lock Checkbox */}
                      <div className="flex items-center space-x-2 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInstallmentLocked(request, 2)}
                            onChange={() => handleInstallmentLockClick(request.id, 2)}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-xs text-gray-600 flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>Κλείδωμα Δόσης</span>
                          </span>
                        </label>
                      </div>
                      
                      {/* Locked Values Display */}
                      {isInstallmentLocked(request, 2) && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Lock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">Κλειδωμένες Τιμές</span>
                          </div>
                          <div className="space-y-1 text-xs text-orange-600">
                            <div><span className="font-medium">💰 Ποσό:</span> {formatPrice(request.installment_2_amount || 0)}</div>
                            <div><span className="font-medium">💳 Τρόπος:</span> {request.installment_2_payment_method === 'cash' ? '💰 Μετρητά' : '💳 POS'}</div>
                            <div><span className="font-medium">📅 Ημερομηνία:</span> {request.installment_2_due_date || 'Δεν ορίστηκε'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3η Δόση */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                      <span>3η Δόση</span>
                      {/* Delete Third Installment Checkbox */}
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted || false}
                            onChange={() => handleDeleteThirdInstallmentClick(request.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                          />
                          <span className="text-xs text-red-600 flex items-center space-x-1">
                            <Trash2 className="h-3 w-3" />
                            <span>Διαγραφή 3ης Δόσης</span>
                          </span>
                        </label>
                      </div>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={selectedRequestOptions[request.id]?.installment3Amount || request.installment_3_amount || ''}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment3Amount', e.target.value)}
                        placeholder="Ποσό"
                        disabled={isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 3)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                            ? 'border-red-500 bg-red-50 focus:ring-red-500 cursor-not-allowed text-red-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      />
                      <select
                        value={selectedRequestOptions[request.id]?.installment3PaymentMethod || request.installment_3_payment_method || 'cash'}
                        onChange={(e) => handleRequestOptionChange(request.id, 'installment3PaymentMethod', e.target.value)}
                        disabled={isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                        className={`w-full p-2 border rounded-lg focus:ring-2 ${
                          isInstallmentLocked(request, 3)
                            ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                            : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                            ? 'border-red-500 bg-red-50 focus:ring-red-500 cursor-not-allowed text-red-600'
                            : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                      >
                        <option value="cash">💰 Μετρητά</option>
                        <option value="pos">💳 POS</option>
                      </select>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          📅 Ημερομηνία Πληρωμής
                        </label>
                        <input
                          type="date"
                          value={selectedRequestOptions[request.id]?.installment3DueDate || request.installment_3_due_date || ''}
                          onChange={(e) => handleRequestOptionChange(request.id, 'installment3DueDate', e.target.value)}
                          disabled={isInstallmentLocked(request, 3) || (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)}
                          className={`w-full p-2 border rounded-lg focus:ring-2 text-sm ${
                            isInstallmentLocked(request, 3)
                              ? 'border-orange-500 bg-orange-50 focus:ring-orange-500 cursor-not-allowed text-orange-600'
                              : (selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted)
                              ? 'border-red-500 bg-red-50 focus:ring-red-500 cursor-not-allowed text-red-600'
                              : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                          }`}
                        />
                      </div>
                      
                      {/* Lock Checkbox */}
                      <div className="flex items-center space-x-2 pt-2">
                        <label className={`flex items-center space-x-2 ${(selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={isInstallmentLocked(request, 3)}
                            onChange={() => handleInstallmentLockClick(request.id, 3)}
                            disabled={selectedRequestOptions[request.id]?.deleteThirdInstallment || request.third_installment_deleted}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                          />
                          <span className="text-xs text-gray-600 flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>Κλείδωμα Δόσης</span>
                          </span>
                        </label>
                      </div>
                      
                      {/* Locked Values Display */}
                      {isInstallmentLocked(request, 3) && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Lock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">Κλειδωμένες Τιμές</span>
                          </div>
                          <div className="space-y-1 text-xs text-orange-600">
                            <div><span className="font-medium">💰 Ποσό:</span> {formatPrice(request.installment_3_amount || 0)}</div>
                            <div><span className="font-medium">💳 Τρόπος:</span> {request.installment_3_payment_method === 'cash' ? '💰 Μετρητά' : '💳 POS'}</div>
                            <div><span className="font-medium">📅 Ημερομηνία:</span> {request.installment_3_due_date || 'Δεν ορίστηκε'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Program Options Section */}
                <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">⚙️</span>
                    Program Options
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Old Members Button */}
                    <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                  <button
                    onClick={() => {
                          if (isRequestPending(request.id)) {
                            return; // Frozen, can't change
                          }
                          handleRequestOptionChange(request.id, 'oldMembers', 
                            !(selectedRequestOptions[request.id]?.oldMembers || false)
                          );
                        }}
                        disabled={isRequestPending(request.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedRequestOptions[request.id]?.oldMembers || getFrozenRequestOptions(request.id)?.oldMembers
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
                          {(selectedRequestOptions[request.id]?.oldMembers || getFrozenRequestOptions(request.id)?.oldMembers) && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* First 150 Members - Only show when Old Members is selected */}
                    {(() => {
                      const hasOldMembersSelected = selectedRequestOptions[request.id]?.oldMembers || getFrozenRequestOptions(request.id)?.oldMembers;
                      const hasFirst150Used = selectedRequestOptions[request.id]?.first150Members === false || getFrozenRequestOptions(request.id)?.first150Members === false;
                      return hasOldMembersSelected && !hasFirst150Used;
                    })() && (
                      <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                        {/* Info text above the button */}
                        <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                          <span className="font-medium">ℹ️ Πληροφορίες:</span> Ισχύει μόνο για τα πρώτα 150 παλιά μέλη του γυμναστηρίου με τιμή 45€ ετήσιος (προσφορά), τα οποία εμφανίζονται στην καρτέλα Ταμείο
                        </div>
                        
                        <button
                          onClick={() => {
                            if (isRequestPending(request.id)) {
                              return; // Frozen, can't change
                            }
                            
                            const newFirst150 = !(selectedRequestOptions[request.id]?.first150Members || false);
                            handleRequestOptionChange(request.id, 'first150Members', newFirst150);
                            if (newFirst150) {
                              // When first150Members is selected, automatically set cash to 45 and lock POS
                              handleRequestOptionChange(request.id, 'cash', true);
                              handleRequestOptionChange(request.id, 'cashAmount', 45);
                              handleRequestOptionChange(request.id, 'pos', false);
                              handleRequestOptionChange(request.id, 'posAmount', 0);
                            }
                          }}
                          disabled={isRequestPending(request.id)}
                          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 relative shadow-lg ${
                            selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members
                              ? 'bg-orange-500 text-white hover:bg-orange-600' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <span>🏆 Πρώτα 150 Μέλη</span>
                            {(selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) && (
                              <span className="text-orange-200">✓</span>
                            )}
                            {isRequestPending(request.id) && (
                              <span className="text-yellow-600">🔒</span>
                            )}
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Kettlebell Points */}
                    <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isRequestPending(request.id) && '🔒 '}🏋️ Kettlebell Points
                      </label>
                      <input
                        type="number"
                        value={isRequestPending(request.id) 
                          ? (getFrozenRequestOptions(request.id)?.kettlebellPoints || '')
                          : (selectedRequestOptions[request.id]?.kettlebellPoints || '')}
                        onChange={(e) => {
                          if (isRequestPending(request.id)) return; // Frozen
                          handleRequestOptionChange(request.id, 'kettlebellPoints', e.target.value);
                        }}
                        placeholder="Εισάγετε πόντους"
                        disabled={isRequestPending(request.id)}
                        className={`w-full p-2 border rounded-lg ${
                          isRequestPending(request.id)
                            ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                    </div>

                    {/* Cash */}
                    <div className={`p-3 rounded-lg border ${isRequestPending(request.id) ? 'bg-yellow-100 border-yellow-300' : 'bg-white border-gray-200'}`}>
                      <button
                        onClick={() => {
                          if (isRequestPending(request.id)) {
                            return; // Frozen, can't change
                          }
                          // Block changes if First 150 Members is selected
                          if (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) {
                            return; // Locked when First 150 Members is selected
                          }
                          handleRequestOptionChange(request.id, 'cash', !(selectedRequestOptions[request.id]?.cash || false));
                        }}
                        disabled={isRequestPending(request.id) || (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members)
                            ? 'bg-gray-100 text-gray-500 border-2 border-gray-300 cursor-not-allowed'
                            : selectedRequestOptions[request.id]?.cash || getFrozenRequestOptions(request.id)?.cash
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : isRequestPending(request.id)
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {isRequestPending(request.id) && '🔒 '}
                            {(selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) && '🔒 '}
                            💰 Μετρητά
                          </span>
                          {(selectedRequestOptions[request.id]?.cash || getFrozenRequestOptions(request.id)?.cash) && 
                           !(selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                      </button>
                      
                      {(selectedRequestOptions[request.id]?.cash || getFrozenRequestOptions(request.id)?.cash) && 
                       !(selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={isRequestPending(request.id) ? getFrozenRequestOptions(request.id)?.cashAmount || '' : selectedRequestOptions[request.id]?.cashAmount || ''}
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
                            return; // Frozen, can't change
                          }
                          // Block changes if First 150 Members is selected
                          if (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) {
                            return; // Locked when First 150 Members is selected
                          }
                          handleRequestOptionChange(request.id, 'pos', !(selectedRequestOptions[request.id]?.pos || false));
                        }}
                        disabled={isRequestPending(request.id) || (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedRequestOptions[request.id]?.pos || getFrozenRequestOptions(request.id)?.pos
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                            : isRequestPending(request.id)
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed'
                            : (selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members)
                            ? 'bg-gray-100 text-gray-500 border-2 border-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {isRequestPending(request.id) && '🔒 '}
                            {(selectedRequestOptions[request.id]?.first150Members || getFrozenRequestOptions(request.id)?.first150Members) && '🔒 '}
                            💳 POS
                          </span>
                          {(selectedRequestOptions[request.id]?.pos || getFrozenRequestOptions(request.id)?.pos) && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </div>
                      </button>
                      
                      {(selectedRequestOptions[request.id]?.pos || getFrozenRequestOptions(request.id)?.pos) && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={isRequestPending(request.id) ? getFrozenRequestOptions(request.id)?.posAmount || '' : selectedRequestOptions[request.id]?.posAmount || ''}
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

                  {/* Program Options Status and Actions */}
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-bold text-white">Κατάσταση Program Options</h5>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRequestProgramApprovalChange(request.id, 'approved')}
                          disabled={loading || isRequestPending(request.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            requestProgramApprovalStatus[request.id] === 'approved'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-green-600 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          ✅ Εγκρίνω
                        </button>
                        <button
                          onClick={() => handleRequestProgramApprovalChange(request.id, 'rejected')}
                          disabled={loading || isRequestPending(request.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            requestProgramApprovalStatus[request.id] === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-red-600 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          ❌ Απορρίπτω
                        </button>
                        <button
                          onClick={() => handleRequestProgramApprovalChange(request.id, 'pending')}
                          disabled={loading || isRequestPending(request.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            requestProgramApprovalStatus[request.id] === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-yellow-600 hover:text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          ⏳ Αναμονή
                        </button>
                      </div>
                    </div>
                    
                    {isRequestPending(request.id) && (
                      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-lg mr-2">⏳</span>
                          <span className="text-yellow-200 font-medium">Program Options είναι στην αναμονή - οι επιλογές είναι παγωμένες</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
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

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lock Confirmation Popup */}
      {showLockConfirmation && pendingLockRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 border border-gray-200 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Κλείδωμα Δόσης
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Είστε σίγουροι ότι θέλετε να κλειδώσετε την {pendingLockRequest.installmentNumber}η δόση; 
                Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelInstallmentLock}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={confirmInstallmentLock}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                >
                  Κλείδωμα
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Third Installment Confirmation Popup */}
      {showDeleteConfirmation && pendingDeleteRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 border border-gray-200 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trash2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Διαγραφή 3ης Δόσης
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Είστε σίγουροι ότι θέλετε να διαγράψετε την 3η δόση; 
                Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelDeleteThirdInstallment}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={confirmDeleteThirdInstallment}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium"
                >
                  Διαγραφή
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentsTab;
