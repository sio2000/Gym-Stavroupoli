import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  X, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  Package,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  searchUsers, 
  getRandomUsers, 
  getUserCount, 
  getUserDetailedInfo,
  UserInfo,
  UserDetailedInfo
} from '@/utils/userInfoApi';
import toast from 'react-hot-toast';

const SecretaryUsersInformation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [randomUsers, setRandomUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetailedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const USERS_PER_PAGE = 10;

  // Load random users and total count
  const loadRandomUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const [users, count] = await Promise.all([
        getRandomUsers(page, USERS_PER_PAGE),
        getUserCount()
      ]);
      
      setRandomUsers(users);
      setTotalUsers(count);
      setTotalPages(Math.ceil(count / USERS_PER_PAGE));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading random users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των χρηστών');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRandomUsers(1);
  }, []);

  // Search functionality
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await searchUsers(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Σφάλμα κατά την αναζήτηση');
    } finally {
      setSearchLoading(false);
    }
  };

  // Load detailed user information
  const loadUserDetails = async (userId: string) => {
    try {
      setUserDetailsLoading(true);
      const details = await getUserDetailedInfo(userId);
      setSelectedUser(details);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των λεπτομερειών χρήστη');
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadRandomUsers(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadRandomUsers(currentPage + 1);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  // Format date safely in case of null/undefined
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const displayUsers = searchTerm ? searchResults : randomUsers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-2">
              <span className="hidden sm:inline">👥 Χρήστες-Πληροφορίες</span>
              <span className="sm:hidden">👥 Χρήστες</span>
            </h2>
            <p className="text-purple-100 text-sm sm:text-base">
              <span className="hidden sm:inline">Αναζήτηση και λεπτομέρειες χρηστών</span>
              <span className="sm:hidden">Αναζήτηση χρηστών</span>
            </p>
          </div>
          <button
            onClick={() => loadRandomUsers(1)}
            disabled={loading}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg text-xs sm:text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">🔄 Ανανέωση</span>
            <span className="sm:hidden">⟳</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="🔍 Αναζήτηση με όνομα, email ή ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            {searchTerm ? (
              <>
                <span className="hidden sm:inline">Αποτελέσματα αναζήτησης ({searchResults.length})</span>
                <span className="sm:hidden">Αποτελέσματα ({searchResults.length})</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Χρήστες (Σελίδα {currentPage} από {totalPages})</span>
                <span className="sm:hidden">Χρήστες ({currentPage}/{totalPages})</span>
              </>
            )}
          </h3>
        </div>

        {loading || searchLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Φόρτωση χρηστών...</span>
            </div>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Δεν βρέθηκαν χρήστες</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayUsers.map((user) => (
              <div
                key={user.user_id}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => loadUserDetails(user.user_id)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                      {(() => {
                        const firstInitial = (user.first_name && user.first_name.trim()) ? user.first_name.trim().charAt(0) : '';
                        const lastInitial = (user.last_name && user.last_name.trim()) ? user.last_name.trim().charAt(0) : '';
                        const combined = `${firstInitial}${lastInitial}`;
                        if (combined) return combined;
                        const emailInitial = (user.email && user.email.trim()) ? user.email.trim().charAt(0) : '?';
                        return emailInitial;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {((user.first_name && user.first_name.trim()) || (user.last_name && user.last_name.trim()))
                          ? `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`.trim()
                          : (user.email || '—')}
                      </h4>
                      <p className="text-sm sm:text-base text-gray-600 truncate">{user.email || '—'}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        ID: {user.user_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Εγγραφή: {formatDate(user.created_at)}
                    </p>
                    <button className="mt-2 px-3 sm:px-4 py-1 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm">
                      <span className="hidden sm:inline">Προβολή Λεπτομερειών</span>
                      <span className="sm:hidden">Λεπτομέρειες</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!searchTerm && totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                <span className="hidden sm:inline">Εμφάνιση {((currentPage - 1) * USERS_PER_PAGE) + 1}-{Math.min(currentPage * USERS_PER_PAGE, totalUsers)} από {totalUsers} χρήστες</span>
                <span className="sm:hidden">{((currentPage - 1) * USERS_PER_PAGE) + 1}-{Math.min(currentPage * USERS_PER_PAGE, totalUsers)} / {totalUsers}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Προηγούμενη</span>
                  <span className="sm:hidden">Προηγ.</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Επόμενη</span>
                  <span className="sm:hidden">Επόμ.</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                  <span className="hidden sm:inline">Λεπτομέρειες Χρήστη</span>
                  <span className="sm:hidden">Λεπτομέρειες</span>
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {userDetailsLoading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Φόρτωση λεπτομερειών...</span>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">Βασικές Πληροφορίες</span>
                    <span className="sm:hidden">Βασικές Πληροφορίες</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Όνομα</p>
                      <p className="font-medium">{selectedUser.user_info.first_name} {selectedUser.user_info.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedUser.user_info.email}
                      </p>
                    </div>
                    {selectedUser.user_info.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Τηλέφωνο</p>
                        <p className="font-medium flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {selectedUser.user_info.phone}
                        </p>
                      </div>
                    )}
                    {selectedUser.user_info.date_of_birth && (
                      <div>
                        <p className="text-sm text-gray-600">Ημερομηνία Γέννησης</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(selectedUser.user_info.date_of_birth)}
                        </p>
                      </div>
                    )}
                    {selectedUser.user_info.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Διεύθυνση</p>
                        <p className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {selectedUser.user_info.address}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Εγγραφή</p>
                      <p className="font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(selectedUser.user_info.created_at)}
                      </p>
                    </div>
                    {selectedUser.user_info.referral_code && (
                      <div>
                        <p className="text-sm text-gray-600">Κωδικός Παραπομπής</p>
                        <p className="font-medium font-mono">{selectedUser.user_info.referral_code}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Subscriptions */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Ενεργές Συνδρομές ({selectedUser.active_memberships.length})
                  </h4>
                  {selectedUser.active_memberships.length === 0 ? (
                    <p className="text-gray-600">Δεν υπάρχουν ενεργές συνδρομές</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.active_memberships.map((membership) => (
                        <div key={membership.id} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">{membership.package_name}</h5>
                              <p className="text-sm text-gray-600">
                                {membership.credits_remaining > 0 ? `${membership.credits_remaining} / ${membership.credits_total} credits` : 'Credits not available'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {formatDate(membership.start_date)} - {formatDate(membership.end_date)}
                              </p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ενεργή
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Membership Requests */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Εκκρεμή Αιτήματα Συνδρομών ({selectedUser.pending_requests.length})
                  </h4>
                  {selectedUser.pending_requests.length === 0 ? (
                    <p className="text-gray-600">Δεν υπάρχουν εκκρεμή αιτήματα συνδρομών</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.pending_requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">{request.package_name}</h5>
                              <p className="text-sm text-gray-600">
                                Διάρκεια: {request.duration_type} | Τιμή: €{request.requested_price}
                                {request.classes_count && ` | Μαθήματα: ${request.classes_count}`}
                              </p>
                              {request.has_installments && (
                                <div className="mt-2 text-xs text-gray-500">
                                  <p>Δόσεις: {request.installment_1_amount && `€${request.installment_1_amount}`} 
                                     {request.installment_2_amount && `, €${request.installment_2_amount}`}
                                     {request.installment_3_amount && `, €${request.installment_3_amount}`}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {formatDate(request.created_at)}
                              </p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Εκκρεμές
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Subscriptions History */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Ιστορικό Συνδρομών ({selectedUser.all_memberships.length})
                  </h4>
                  {selectedUser.all_memberships.length === 0 ? (
                    <p className="text-gray-600">Δεν υπάρχει ιστορικό συνδρομών</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.all_memberships.map((membership) => (
                        <div key={membership.id} className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">{membership.package_name}</h5>
                              <p className="text-sm text-gray-600">
                                {membership.credits_remaining > 0 ? `${membership.credits_remaining} / ${membership.credits_total} credits` : 'Credits not available'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {formatDate(membership.start_date)} - {formatDate(membership.end_date)}
                              </p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                membership.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : membership.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {membership.is_active ? 'Ενεργή' : membership.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretaryUsersInformation;
