import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Search,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  getCashRegisterTotals, 
  getCashSummaryPerUser, 
  CashRegisterTotals, 
  UserCashSummary 
} from '@/utils/cashRegisterApi';
import toast from 'react-hot-toast';

const CashRegister: React.FC = () => {
  const [totals, setTotals] = useState<CashRegisterTotals>({
    total_cash: 0,
    total_pos: 0,
    total_transactions: 0
  });
  const [userSummaries, setUserSummaries] = useState<UserCashSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserCashSummary[]>([]);

  const loadCashRegisterData = async () => {
    try {
      setLoading(true);
      const [totalsData, summariesData] = await Promise.all([
        getCashRegisterTotals(),
        getCashSummaryPerUser()
      ]);
      
      setTotals(totalsData);
      setUserSummaries(summariesData);
    } catch (error) {
      console.error('Error loading cash register data:', error);
      toast.error('Σφάλμα κατά τη φόρτωση των δεδομένων ταμείου');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadCashRegisterData();
  }, []);

  // Search functionality
  const searchUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = userSummaries.filter(user => 
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchUsers(value);
  };

  const displayUsers = searchTerm ? searchResults : userSummaries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-2">💰 Ταμείο</h2>
            <p className="text-green-100 text-sm sm:text-base">Συνολικά ποσά και ανάλυση χρηστών</p>
          </div>
          <button
            onClick={loadCashRegisterData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>🔄 Ανανέωση</span>
          </button>
        </div>
      </div>

      {/* Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cash */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-800 mb-2">💵 Συνολικά Μετρητά</h3>
              <p className="text-green-600">Όλοι οι χρήστες συνολικά</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-900">€{totals.total_cash.toFixed(2)}</div>
              <div className="text-sm text-green-600">ευρώ</div>
            </div>
          </div>
        </div>

        {/* Total POS */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-800 mb-2">💳 Συνολικά POS</h3>
              <p className="text-blue-600">Όλοι οι χρήστες συνολικά</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-900">€{totals.total_pos.toFixed(2)}</div>
              <div className="text-sm text-blue-600">ευρώ</div>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-purple-800 mb-2">📊 Συνολικές Συναλλαγές</h3>
              <p className="text-purple-600">Όλες οι συναλλαγές</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-900">{totals.total_transactions}</div>
              <div className="text-sm text-purple-600">συναλλαγές</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">👥 Ανάλυση Χρηστών</h3>
              <p className="text-gray-600 mt-1">Μετρητά και POS ανά χρήστη</p>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Αναζήτηση χρήστη..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500">Φόρτωση δεδομένων...</p>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Δεν υπάρχουν συναλλαγές ακόμα</p>
              <p className="text-sm mt-2">Οι συναλλαγές θα εμφανιστούν εδώ όταν δημιουργηθούν</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayUsers.map((user, index) => (
                <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.user_name}</h4>
                        <p className="text-sm text-gray-600">{user.user_email}</p>
                        <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                          <span>💵 {user.cash_count} μετρητά</span>
                          <span>💳 {user.pos_count} POS</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amounts */}
                    <div className="text-right space-y-2">
                      <div className="flex space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">€{user.cash_total.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Μετρητά</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">€{user.pos_total.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">POS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">€{(user.cash_total + user.pos_total).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Σύνολο</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show message if no search results */}
              {searchTerm && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Δεν βρέθηκαν χρήστες με αυτό το όνομα</p>
                  <p className="text-sm mt-2">Δοκιμάστε ένα διαφορετικό όρο αναζήτησης</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashRegister;
