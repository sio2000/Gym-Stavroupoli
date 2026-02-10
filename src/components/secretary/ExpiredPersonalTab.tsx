import React, { useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { ExpiredPersonalUser } from '@/services/api/expiredPersonalApi';
import { recordPersonalRegistration } from '@/services/api/expiredPersonalApi';
import toast from 'react-hot-toast';
import { formatDateForDisplay } from '@/utils/date';

interface ExpiredPersonalTabProps {
  users: ExpiredPersonalUser[];
  loading: boolean;
  onRefresh: () => void;
}

const PAGE_SIZE = 10;

const ExpiredPersonalTab: React.FC<ExpiredPersonalTabProps> = ({
  users,
  loading,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<ExpiredPersonalUser | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [posAmount, setPosAmount] = useState<string>('');
  const [kettlebellPoints, setKettlebellPoints] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchSearch =
        !term ||
        user.userName.toLowerCase().includes(term) ||
        (user.userEmail || '').toLowerCase().includes(term) ||
        (user.userPhone || '').toLowerCase().includes(term);
      return matchSearch;
    });
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openRegistration = (user: ExpiredPersonalUser) => {
    setSelectedUser(user);
    setPaymentMethod(null);
    setCashAmount('');
    setPosAmount('');
    setKettlebellPoints('');
    setNote('');
  };

  const closeRegistration = () => {
    setSelectedUser(null);
    setCashAmount('');
    setPosAmount('');
    setKettlebellPoints('');
    setNote('');
    setSaving(false);
  };

  const handleRegister = async () => {
    if (!selectedUser) return;

    const cash = Number(cashAmount || 0);
    const pos = Number(posAmount || 0);
    const points = Number(kettlebellPoints || 0);

    if (!paymentMethod) {
      toast.error('Παρακαλώ επιλέξτε μέthodo πληρωμής');
      return;
    }

    if (paymentMethod === 'cash' && cash <= 0 && pos <= 0 && points <= 0) {
      toast.error('Παρακαλώ εισάγετε ένα ποσό ή κουκίδες');
      return;
    }

    if (paymentMethod === 'pos' && pos <= 0 && cash <= 0 && points <= 0) {
      toast.error('Παρακαλώ εισάγετε ένα ποσό ή κουκίδες');
      return;
    }

    try {
      setSaving(true);
      const result = await recordPersonalRegistration({
        userId: selectedUser.userId,
        scheduleId: selectedUser.scheduleId,
        paymentMethod: paymentMethod === 'cash' ? 'cash' : paymentMethod === 'pos' ? 'pos' : null,
        cashAmount: paymentMethod === 'cash' ? cash : undefined,
        posAmount: paymentMethod === 'pos' ? pos : undefined,
        kettlebellPoints: points > 0 ? points : undefined,
        note: note || undefined
      });

      if (result.success) {
        toast.success(result.message);
        closeRegistration();
        onRefresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => formatDateForDisplay(dateString, 'el-GR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-2">⏰ Ληγμένα Personal</h2>
            <p className="text-red-100 text-sm sm:text-base">Χρήστες με ληγμένες sessions personal training</p>
          </div>
          <button
            onClick={onRefresh}
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
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="🔍 Αναζήτηση με όνομα, email ή τηλέφωνο..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {`Χρήστες Personal (${filtered.length})`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Φόρτωση χρηστών...</span>
            </div>
          </div>
        ) : paged.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{filtered.length === 0 ? 'Δεν βρέθηκαν ληγμένοι χρήστες personal' : 'Κανένας χρήστης σε αυτή τη σελίδα'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paged.map((user) => (
              <div key={user.scheduleId} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{user.userName}</h4>
                        <p className="text-gray-600 text-sm">{user.userEmail || '—'}</p>
                        {user.userPhone && (
                          <p className="text-gray-600 text-sm">📞 {user.userPhone}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center space-x-1 text-orange-600">
                            <Calendar className="h-4 w-4" />
                            <span>Τελ. μάθημα: {formatDate(user.lastSessionDate)}</span>
                          </div>
                          {user.lastSessionTime && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span>{user.lastSessionTime}</span>
                            </div>
                          )}
                          <div className="text-gray-600">
                            Σύνολο: {user.totalSessions} sessions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openRegistration(user)}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm whitespace-nowrap"
                  >
                    📝 Καταχώρηση
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Εμφάνιση {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} από {filtered.length} χρήστες
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Προηγούμενη</span>
                </button>
                <button
                  onClick={() => setPage(currentPage + 1)}
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

      {/* Registration Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">📝 Καταχώρηση Personal</h3>
              <button
                onClick={closeRegistration}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <p className="font-semibold text-gray-900">{selectedUser.userName}</p>
              <p className="text-sm text-gray-600">{selectedUser.userEmail}</p>
              <p className="text-sm text-gray-600 mt-2">
                Τελευταίο μάθημα: {formatDate(selectedUser.lastSessionDate)}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                💳 Μέθοδος Πληρωμής
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="h-4 w-4 text-orange-600"
                  />
                  <span className="text-gray-900 font-medium">💵 Χρηματικά</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pos"
                    checked={paymentMethod === 'pos'}
                    onChange={() => setPaymentMethod('pos')}
                    className="h-4 w-4 text-orange-600"
                  />
                  <span className="text-gray-900 font-medium">🔷 POS</span>
                </label>
              </div>
            </div>

            {/* Cash Amount */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  💵 Ποσό (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
            )}

            {/* POS Amount */}
            {paymentMethod === 'pos' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  🔷 Ποσό POS (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={posAmount}
                  onChange={(e) => setPosAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
            )}

            {/* Kettlebell Points (Optional) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                ⚡ Kettlebell Points <span className="text-gray-500 font-normal">(προαιρετικό)</span>
              </label>
              <input
                type="number"
                min="0"
                value={kettlebellPoints}
                onChange={(e) => setKettlebellPoints(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                📝 Σημειώσεις
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="προαιρετικό"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={closeRegistration}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
              >
                ❌ Ακύρωση
              </button>
              <button
                onClick={handleRegister}
                disabled={saving || !paymentMethod}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Αποθήκευση...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>✅ Αποθήκευση</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: use a generic Check icon since lucide might not export it differently
const Check = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default ExpiredPersonalTab;
