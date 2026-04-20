import React, { useState, useEffect, useMemo } from 'react';
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
  getUsersWithFilter, 
  getAllUsersWithFilter,
  getUserDetailedInfo,
  UserInfo,
  UserDetailedInfo,
  UserFilter
} from '@/utils/userInfoApi';
import { formatDateForDisplay } from '@/utils/date';
import toast from 'react-hot-toast';

const SecretaryUsersInformation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [randomUsers, setRandomUsers] = useState<UserInfo[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetailedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<UserFilter>('all');
  const [alphabeticalSortEnabled, setAlphabeticalSortEnabled] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const USERS_PER_PAGE = 10;

  // Load random users and total count
  const loadUsers = async (page: number = 1, filter: UserFilter = filterStatus) => {
    try {
      setLoading(true);
      const [users, count] = await getUsersWithFilter(page, USERS_PER_PAGE, filter);
      
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

  const loadAllUsers = async (filter: UserFilter = filterStatus) => {
    try {
      setLoading(true);
      const users = await getAllUsersWithFilter(filter);
      setAllUsers(users);
      setTotalUsers(users.length);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading all users:', error);
      toast.error('Σφάλμα κατά τη φόρτωση όλων των χρηστών');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (alphabeticalSortEnabled) {
      loadAllUsers(filterStatus);
    } else {
      setAllUsers([]);
      loadUsers(1, filterStatus);
    }
  }, [filterStatus, alphabeticalSortEnabled]);

  // Search functionality
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      if (alphabeticalSortEnabled) {
        loadAllUsers(filterStatus);
      } else {
        loadUsers(1, filterStatus);
      }
      return;
    }

    try {
      setSearchLoading(true);
      const results = await searchUsers(term, filterStatus);
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
      loadUsers(currentPage - 1, filterStatus);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadUsers(currentPage + 1, filterStatus);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    if (alphabeticalSortEnabled) {
      loadAllUsers(filterStatus);
    } else {
      loadUsers(1, filterStatus);
    }
  };

  // Use the centralized date formatting utility to avoid UTC conversion issues
  const formatDate = (dateString: string) => formatDateForDisplay(dateString, 'el-GR');

  const displayUsers = useMemo(() => {
    const users = searchTerm ? searchResults : (alphabeticalSortEnabled ? allUsers : randomUsers);

    if (!alphabeticalSortEnabled) return users;

    return [...users].sort((a, b) => {
      const firstUserName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || a.user_id;
      const secondUserName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || b.user_id;
      return firstUserName.localeCompare(secondUserName, 'el', { sensitivity: 'base' });
    });
  }, [searchTerm, searchResults, randomUsers, allUsers, alphabeticalSortEnabled]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-2">👥 Χρήστες-Πληροφορίες</h2>
            <p className="text-purple-100 text-sm sm:text-base">Αναζήτηση και λεπτομέρειες χρηστών</p>
          </div>
          <button
            onClick={() => {
              if (alphabeticalSortEnabled) {
                loadAllUsers(filterStatus);
              } else {
                loadUsers(1, filterStatus);
              }
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>🔄 Ανανέωση</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="🔍 Αναζήτηση με όνομα, email ή ID χρήστη..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'all', label: 'Όλοι οι χρήστες' },
                { key: 'active', label: 'Ενεργοί Χρήστες' },
                { key: 'expired', label: 'Ληγμένες Συνδρομές' },
              ] as { key: UserFilter; label: string }[]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilterStatus(opt.key);
                    setSearchResults([]);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                    filterStatus === opt.key
                      ? 'bg-purple-600 text-white border-purple-500 shadow'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-purple-400 hover:text-purple-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setAlphabeticalSortEnabled(prev => !prev)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  alphabeticalSortEnabled
                    ? 'bg-purple-600 text-white border-purple-500 shadow'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-purple-400 hover:text-purple-700'
                }`}
              >
                Αλφαβητική σειρά
              </button>
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {searchTerm
              ? `Αποτελέσματα αναζήτησης (${searchResults.length})`
              : alphabeticalSortEnabled
                ? `Χρήστες (${displayUsers.length})`
                : `Χρήστες (Σελίδα ${currentPage} από ${totalPages})`}
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
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => loadUserDetails(user.user_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(() => {
                        const firstInitial = (user.first_name && user.first_name.trim()) ? user.first_name.trim().charAt(0) : '';
                        const lastInitial = (user.last_name && user.last_name.trim()) ? user.last_name.trim().charAt(0) : '';
                        const combined = `${firstInitial}${lastInitial}`;
                        if (combined) return combined;
                        const emailInitial = (user.email && user.email.trim()) ? user.email.trim().charAt(0) : '?';
                        return emailInitial;
                      })()}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {((user.first_name && user.first_name.trim()) || (user.last_name && user.last_name.trim()))
                          ? `${user.first_name ? user.first_name : ''} ${user.last_name ? user.last_name : ''}`.trim()
                          : (user.email || '—')}
                      </h4>
                      <p className="text-gray-600">{user.email || '—'}</p>
                      <p className="text-sm text-gray-500">
                        ID: {user.user_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Εγγραφή: {formatDate(user.created_at)}
                    </p>
                    <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                      Προβολή Λεπτομερειών
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!searchTerm && !alphabeticalSortEnabled && totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Εμφάνιση {((currentPage - 1) * USERS_PER_PAGE) + 1}-{Math.min(currentPage * USERS_PER_PAGE, totalUsers)} από {totalUsers} χρήστες
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Προηγούμενη</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <span>Επόμενη</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Λεπτομέρειες Χρήστη
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
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
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Βασικές Πληροφορίες
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Πλάνο Δόσεων */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Πλάνο Δόσεων ({selectedUser.installment_plans.length})
                  </h4>
                  {selectedUser.installment_plans.length === 0 ? (
                    <p className="text-gray-600">Δεν υπάρχει πλάνο δόσεων</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.installment_plans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">{plan.package_name}</h5>
                              <p className="text-sm text-gray-600">
                                Διάρκεια: {plan.duration_type} | Τιμή: €{plan.requested_price}
                                {plan.classes_count && ` | Μαθήματα: ${plan.classes_count}`}
                              </p>
                              <div className="mt-2 text-xs text-gray-600 space-y-1">
                                {plan.installment_1_amount && <p>Δόση 1: €{plan.installment_1_amount} {plan.installment_1_due_date && `(έως ${formatDate(plan.installment_1_due_date)})`}</p>}
                                {plan.installment_2_amount && <p>Δόση 2: €{plan.installment_2_amount} {plan.installment_2_due_date && `(έως ${formatDate(plan.installment_2_due_date)})`}</p>}
                                {plan.installment_3_amount && <p>Δόση 3: €{plan.installment_3_amount} {plan.installment_3_due_date && `(έως ${formatDate(plan.installment_3_due_date)})`}</p>}
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              plan.status === 'approved' ? 'bg-green-100 text-green-800' :
                              plan.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {plan.status === 'approved' ? 'Εγκεκριμένο' : plan.status === 'pending' ? 'Εκκρεμεί' : 'Απορριφθέν'}
                            </span>
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
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {membership.is_active ? 'Ενεργή' : 'Λήξη'}
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
