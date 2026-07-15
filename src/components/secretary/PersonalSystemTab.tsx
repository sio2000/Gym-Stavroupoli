// ============================================================================
// RECEPTION TAB: PERSONAL ΑΤΟΜΙΚΟ / ΟΜΑΔΙΚΟ WOD (νέο Personal σύστημα)
// ============================================================================
// Αντικαθιστά πλήρως το παλιό "Personal Training Πρόγραμμα" tab.
//   kind='personal' → PERSONAL ΑΤΟΜΙΚΟ (πάντα "Εμείς τους κλείνουμε")
//   kind='wod'      → ΟΜΑΔΙΚΟ WOD (επιλογή: Κλείνουν μόνοι τους / Εμείς τους κλείνουμε)
//
// Δομή: Επιλογή χρήστη → Πιστώσεις + Ταμείο + Kettlebell Points (ίδια σειρά)
//       → Σταθερά πακέτα → Freestyle → Ημερολόγιο κρατήσεων (staff)
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Euro, Dumbbell, Wallet, CalendarDays, Sparkles, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import PersonalSystemCalendar from '@/components/personal/PersonalSystemCalendar';
import {
  PersonalKind,
  PersonalBookingMode,
  FIXED_PERSONAL_PACKAGES,
  FixedPersonalPackage,
  PERSONAL_PACKAGE_NAMES,
  UserCreditsSummary,
  createPersonalSubscription,
  getUserCreditsSummary,
  processPersonalWeeklyRefills,
  getDaysRemaining,
} from '@/utils/personalSystemApi';

interface SimpleUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface PersonalSystemTabProps {
  kind: PersonalKind;
}

const PersonalSystemTab: React.FC<PersonalSystemTabProps> = ({ kind }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [credits, setCredits] = useState<UserCreditsSummary | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Purchase form
  const [bookingMode, setBookingMode] = useState<PersonalBookingMode>(kind === 'personal' ? 'staff' : 'self');
  const [selectedPackage, setSelectedPackage] = useState<FixedPersonalPackage | null>(null);
  // Freestyle
  const [freestyleFrequency, setFreestyleFrequency] = useState('');
  const [freestyleWeeks, setFreestyleWeeks] = useState('');
  const [useFreestyle, setUseFreestyle] = useState(false);
  // Payment
  const [cashAmount, setCashAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos'>('cash');
  const [kettlebellPoints, setKettlebellPoints] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load users
  useEffect(() => {
    const load = async () => {
      setUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, email')
          .eq('role', 'user')
          .order('first_name', { ascending: true });
        if (error) throw error;
        setUsers(data || []);
      } catch (e) {
        console.error('[PersonalSystemTab] load users error:', e);
        toast.error('Σφάλμα φόρτωσης χρηστών');
      } finally {
        setUsersLoading(false);
      }
    };
    load();
    // Εβδομαδιαία refills WOD self-booking: εκτέλεση στο άνοιγμα της καρτέλας
    processPersonalWeeklyRefills().catch(() => {});
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users.slice(0, 30);
    return users
      .filter(u =>
        `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      )
      .slice(0, 30);
  }, [users, searchTerm]);

  const refreshCredits = useCallback(async () => {
    if (!selectedUser) {
      setCredits(null);
      return;
    }
    setCreditsLoading(true);
    try {
      const summary = await getUserCreditsSummary(selectedUser.user_id, kind);
      setCredits(summary);
    } finally {
      setCreditsLoading(false);
    }
  }, [selectedUser, kind]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const resetPurchaseForm = () => {
    setSelectedPackage(null);
    setUseFreestyle(false);
    setFreestyleFrequency('');
    setFreestyleWeeks('');
    setCashAmount('');
    setKettlebellPoints('');
    setPaymentMethod('cash');
  };

  const handlePurchase = async () => {
    if (!selectedUser || !user?.id) {
      toast.error('Επιλέξτε χρήστη πρώτα');
      return;
    }
    const amount = parseFloat(cashAmount) || 0;
    const kbPoints = parseInt(kettlebellPoints) || 0;
    if (amount <= 0 && kbPoints <= 0) {
      toast.error('Δώστε χρηματικό ποσό ή Kettlebell Points');
      return;
    }

    let weeklyFrequency: number | null;
    let totalLessons: number;
    let durationWeeks: number;
    let isFreestyle = false;

    if (useFreestyle) {
      const freq = parseInt(freestyleFrequency) || 0;
      const weeks = parseInt(freestyleWeeks) || 0;
      if (freq < 1 || freq > 7 || weeks < 1) {
        toast.error('Freestyle: συμπληρώστε φορές/εβδομάδα (1-7) και διάρκεια σε εβδομάδες');
        return;
      }
      weeklyFrequency = freq;
      totalLessons = freq * weeks;
      durationWeeks = weeks;
      isFreestyle = true;
    } else if (selectedPackage) {
      weeklyFrequency = selectedPackage.weeklyFrequency;
      totalLessons = selectedPackage.totalLessons;
      durationWeeks = selectedPackage.durationWeeks;
    } else {
      toast.error('Επιλέξτε πακέτο ή Freestyle');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPersonalSubscription({
        userId: selectedUser.user_id,
        kind,
        bookingMode: kind === 'personal' ? 'staff' : bookingMode,
        weeklyFrequency,
        totalLessons,
        durationWeeks,
        isFreestyle,
        cashAmount: amount,
        paymentMethod,
        kettlebellPoints: kbPoints,
        createdBy: user.id,
      });
      if (!result.success) {
        toast.error(result.error || 'Σφάλμα καταχώρησης');
        return;
      }
      toast.success(
        `${PERSONAL_PACKAGE_NAMES[kind]}: ${totalLessons} μαθήματα καταχωρήθηκαν` +
          (amount > 0 ? ` · €${amount.toFixed(2)}` : '') +
          (kbPoints > 0 ? ` · ${kbPoints} Kettlebell Points` : '')
      );
      resetPurchaseForm();
      await refreshCredits();
    } finally {
      setSubmitting(false);
    }
  };

  const sub = credits?.subscription || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-xl p-4 sm:p-6 text-white ${
          kind === 'personal'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
            : 'bg-gradient-to-r from-orange-500 to-red-500'
        }`}
      >
        <h2 className="text-lg sm:text-2xl font-bold mb-1">
          {kind === 'personal' ? '🏋️‍♂️ PERSONAL ΑΤΟΜΙΚΟ' : '🔥 ΟΜΑΔΙΚΟ WOD'}
        </h2>
        <p className="text-sm sm:text-base opacity-90">
          {kind === 'personal'
            ? 'Ατομικά μαθήματα — οι κρατήσεις γίνονται από τη γραμματεία'
            : 'Ομαδικά μαθήματα WOD — self-booking ή κρατήσεις από γραμματεία'}
        </p>
      </div>

      {/* 1) Επιλογή χρήστη */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-gray-500" /> Επιλογή Χρήστη
        </h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Αναζήτηση με όνομα ή email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        {selectedUser ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-lg px-4 py-3">
            <div>
              <div className="font-semibold text-green-900">
                {`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()}
              </div>
              <div className="text-xs text-green-700">{selectedUser.email}</div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-sm text-green-700 hover:text-green-900 font-medium"
            >
              Αλλαγή
            </button>
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {usersLoading ? (
              <div className="p-4 text-sm text-gray-500">Φόρτωση χρηστών...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">Δεν βρέθηκαν χρήστες</div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition text-sm"
                >
                  <span className="font-medium text-gray-800">
                    {`${u.first_name || ''} ${u.last_name || ''}`.trim() || '—'}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2) Πιστώσεις + Ταμείο + Kettlebell Points (ίδια σειρά) */}
      {selectedUser && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border-2 border-blue-200 p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Πιστώσεις Μαθημάτων</div>
              <div className="text-xl font-bold text-blue-700">
                {creditsLoading ? '…' : credits?.depositRemaining ?? '—'}
                {credits?.weeklyTarget ? (
                  <span className="text-xs text-gray-400 font-normal ml-1">/ {credits.weeklyTarget} την εβδομάδα</span>
                ) : null}
              </div>
              {sub && (
                <div className="text-[11px] text-gray-500">
                  Λήξη: {new Date(sub.end_date + 'T12:00:00').toLocaleDateString('el-GR')} ·{' '}
                  {getDaysRemaining(sub.end_date)} ημέρες
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-green-200 p-4 flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Euro className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Ταμείο</div>
              <div className="text-xl font-bold text-green-700">
                {creditsLoading
                  ? '…'
                  : `€${((credits?.cashTotal || 0) + (credits?.posTotal || 0)).toFixed(2)}`}
              </div>
              <div className="text-[11px] text-gray-500">
                Μετρητά €{(credits?.cashTotal || 0).toFixed(2)} · POS €{(credits?.posTotal || 0).toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-purple-200 p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Dumbbell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Kettlebell Points</div>
              <div className="text-xl font-bold text-purple-700">
                {creditsLoading ? '…' : credits?.kettlebellPoints ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ενεργή συνδρομή */}
      {selectedUser && sub && (
        <div
          className={`rounded-xl border-2 p-4 text-sm ${
            sub.booking_mode === 'self'
              ? 'bg-green-50 border-green-300 text-green-900'
              : 'bg-indigo-50 border-indigo-300 text-indigo-900'
          }`}
        >
          <strong>Ενεργή συνδρομή:</strong> {PERSONAL_PACKAGE_NAMES[sub.kind]} ·{' '}
          {sub.is_freestyle ? 'Freestyle' : 'Σταθερό πακέτο'} · {sub.total_lessons} μαθήματα
          {sub.weekly_frequency ? ` · ${sub.weekly_frequency} φορές/εβδομάδα` : ''} ·{' '}
          {sub.booking_mode === 'self' ? '🟢 Κλείνουν μόνοι τους' : '🟣 Εμείς τους κλείνουμε'} · Λήξη{' '}
          {new Date(sub.end_date + 'T12:00:00').toLocaleDateString('el-GR')}
        </div>
      )}

      {/* 3) Νέα συνδρομή: mode (μόνο WOD) + πακέτα + freestyle + πληρωμή */}
      {selectedUser && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5">
          <h3 className="font-bold text-gray-900">Νέα Συνδρομή {PERSONAL_PACKAGE_NAMES[kind]}</h3>

          {/* Mode radio - ΜΟΝΟ στο ΟΜΑΔΙΚΟ WOD */}
          {kind === 'wod' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Τρόπος κρατήσεων</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setBookingMode('self')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-bold transition ${
                    bookingMode === 'self'
                      ? 'bg-green-600 text-white border-green-600 shadow-lg'
                      : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                  }`}
                >
                  ○ Κλείνουν μόνοι τους
                  <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                    Weekly deposit + self-booking όπως το Pilates
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode('staff')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-bold transition ${
                    bookingMode === 'staff'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400'
                  }`}
                >
                  ○ Εμείς τους κλείνουμε
                  <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                    Η γραμματεία κλείνει όλα τα μαθήματα
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Σταθερά πακέτα */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Πακέτα</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {FIXED_PERSONAL_PACKAGES.map(pkg => (
                <button
                  key={pkg.key}
                  type="button"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setUseFreestyle(false);
                  }}
                  className={`text-left px-3 py-3 rounded-xl border-2 text-sm transition ${
                    !useFreestyle && selectedPackage?.key === pkg.key
                      ? kind === 'personal'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-orange-500 text-white border-orange-500 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-bold">{pkg.label.split('·')[0].trim()}</div>
                  {pkg.durationWeeks > 0 && (
                    <div className="text-xs opacity-80">
                      {pkg.totalLessons} μαθήματα · 1 μήνας
                    </div>
                  )}
                  {pkg.durationWeeks === 0 && (
                    <div className="text-xs opacity-80">Μεμονωμένο · € ή Kettlebell Points</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Freestyle */}
          <div className={`rounded-xl border-2 p-4 ${useFreestyle ? 'border-pink-400 bg-pink-50' : 'border-dashed border-gray-300'}`}>
            <button
              type="button"
              onClick={() => {
                setUseFreestyle(!useFreestyle);
                if (!useFreestyle) setSelectedPackage(null);
              }}
              className="flex items-center gap-2 font-bold text-sm text-pink-700"
            >
              <Sparkles className="h-4 w-4" />
              FREESTYLE — Custom πακέτο {useFreestyle ? '▲' : '▼'}
            </button>
            {useFreestyle && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Φορές / εβδομάδα</label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={freestyleFrequency}
                    onChange={e => setFreestyleFrequency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="π.χ. 3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Διάρκεια (εβδομάδες)</label>
                  <input
                    type="number"
                    min={1}
                    value={freestyleWeeks}
                    onChange={e => setFreestyleWeeks(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="π.χ. 6"
                  />
                </div>
                {freestyleFrequency && freestyleWeeks && (
                  <div className="sm:col-span-2 text-sm text-pink-800 font-semibold">
                    Σύνολο: {(parseInt(freestyleFrequency) || 0) * (parseInt(freestyleWeeks) || 0)} μαθήματα
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Πληρωμή: € ή Kettlebell Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Χρηματικό ποσό (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Τρόπος πληρωμής</label>
              <div className="flex gap-2">
                {(['cash', 'pos'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 ${
                      paymentMethod === m
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {m === 'cash' ? '💶 Μετρητά' : '💳 POS'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ή Kettlebell Points</label>
              <input
                type="number"
                min={0}
                value={kettlebellPoints}
                onChange={e => setKettlebellPoints(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePurchase}
              disabled={submitting}
              className={`px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 ${
                kind === 'personal' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {submitting ? 'Καταχώρηση...' : 'Καταχώρηση Συνδρομής'}
            </button>
          </div>
        </div>
      )}

      {/* 4) Ημερολόγιο κρατήσεων (γραμματεία) */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-gray-500" />
          Ημερολόγιο Μαθημάτων
          {selectedUser && (
            <span className="text-sm font-normal text-gray-500">
              — κρατήσεις για {`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()}
            </span>
          )}
        </h3>
        {user?.id && (
          <PersonalSystemCalendar
            mode="reception"
            kindFilter={kind}
            currentUserId={user.id}
            bookForUserId={selectedUser?.user_id || null}
            canBook={!!selectedUser}
            onBookingChange={refreshCredits}
          />
        )}
      </div>
    </div>
  );
};

export default PersonalSystemTab;
