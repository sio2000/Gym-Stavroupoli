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
}

const InstallmentsTab: React.FC<InstallmentsTabProps> = ({
  installmentRequests,
  installmentLoading,
  installmentSearchTerm,
  setInstallmentSearchTerm,
  selectedRequestOptions,
  handleRequestOptionChange,
  updateInstallmentAmounts,
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
  cancelDeleteThirdInstallment
}) => {
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

                {/* Save Button */}
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
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Αποθήκευση Δόσεων & Ημερομηνιών</span>
                  </button>
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
