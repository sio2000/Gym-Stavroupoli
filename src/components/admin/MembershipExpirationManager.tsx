import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Calendar,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  expireOverdueMemberships, 
  getMembershipStatusSummary,
  ExpirationResult 
} from '@/utils/membershipExpiration';

interface MembershipSummary {
  total_memberships: number;
  truly_active: number;
  expired_by_date: number;
  should_be_expired: number;
  users_with_qr_access: number;
}

const MembershipExpirationManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MembershipSummary | null>(null);
  const [lastExpiration, setLastExpiration] = useState<ExpirationResult | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await getMembershipStatusSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading membership summary:', error);
      toast.error('Σφάλμα κατά τη φόρτωση της περίληψης συνδρομών');
    } finally {
      setLoading(false);
    }
  };

  const handleManualExpiration = async () => {
    try {
      setLoading(true);
      const result = await expireOverdueMemberships();
      setLastExpiration(result);
      
      if (result.success) {
        toast.success(`Επιτυχής λήξη ${result.expiredCount} συνδρομών`);
        // Reload summary after expiration
        await loadSummary();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error during manual expiration:', error);
      toast.error('Σφάλμα κατά τη λήξη συνδρομών');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Clock className="h-6 w-6 mr-3" />
              Διαχείριση Λήξης Συνδρομών
            </h2>
            <p className="text-orange-100">
              Έλεγχος και διαχείριση συνδρομών που έχουν λήξει
            </p>
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Ανανέωση</span>
          </button>
        </div>
      </div>

      {/* Status Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Memberships */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Συνολικές Συνδρομές</h3>
                <div className="text-3xl font-bold text-gray-900">{summary.total_memberships}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Memberships */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ενεργές Συνδρομές</h3>
                <div className="text-3xl font-bold text-green-600">{summary.truly_active}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Expired Memberships */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Ληγμένες</h3>
                <div className="text-3xl font-bold text-red-600">{summary.expired_by_date}</div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Problem Alert */}
          {summary.should_be_expired > 0 && (
            <div className="md:col-span-2 lg:col-span-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Προσοχή: Συνδρομές που χρειάζονται λήξη
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Υπάρχουν <strong>{summary.should_be_expired}</strong> συνδρομές που έχουν λήξει αλλά εξακολουθούν να είναι σημειωμένες ως ενεργές.
                    Αυτό σημαίνει ότι οι χρήστες μπορεί να έχουν πρόσβαση σε QR codes παρόλο που δεν θα έπρεπε.
                  </p>
                  <button
                    onClick={handleManualExpiration}
                    disabled={loading}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>Λήξη Συνδρομών Τώρα</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Expiration Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Χειροκίνητη Λήξη Συνδρομών</h3>
            <p className="text-gray-600">
              Εκτελέστε χειροκίνητα τη διαδικασία λήξης για συνδρομές που έχουν περάσει την ημερομηνία λήξης τους.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Button */}
          <div className="space-y-4">
            <button
              onClick={handleManualExpiration}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              <span>Εκτέλεση Λήξης Συνδρομών</span>
            </button>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Τι κάνει:</strong> Ενημερώνει όλες τις συνδρομές που έχουν περάσει την ημερομηνία λήξης τους και τις σημειώνει ως "expired" και "inactive".
            </div>
          </div>

          {/* Last Expiration Result */}
          {lastExpiration && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Τελευταίο Αποτέλεσμα</h4>
              <div className={`p-4 rounded-lg border-2 ${
                lastExpiration.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {lastExpiration.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <div className={`font-semibold ${
                      lastExpiration.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {lastExpiration.success ? 'Επιτυχία' : 'Σφάλμα'}
                    </div>
                    <div className={`text-sm ${
                      lastExpiration.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {lastExpiration.message}
                    </div>
                    {lastExpiration.success && (
                      <div className="text-sm text-green-600 mt-1">
                        Λήξη {lastExpiration.expiredCount} συνδρομών
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Πληροφορίες Συστήματος</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-blue-700">Λογική Λήξης:</strong>
            <div className="text-blue-600 mt-1">
              Deterministic - ελέγχει end_date σε real-time
            </div>
          </div>
          <div>
            <strong className="text-blue-700">Automatic Expiration:</strong>
            <div className="text-blue-600 mt-1">
              Όχι - χρειάζεται χειροκίνητη εκτέλεση
            </div>
          </div>
          <div>
            <strong className="text-blue-700">QR Access Logic:</strong>
            <div className="text-blue-600 mt-1">
              is_active = true AND end_date ≥ today
            </div>
          </div>
          <div>
            <strong className="text-blue-700">Συχνότητα Ελέγχου:</strong>
            <div className="text-blue-600 mt-1">
              Προτείνεται καθημερινά ή εβδομαδιαία
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipExpirationManager;
