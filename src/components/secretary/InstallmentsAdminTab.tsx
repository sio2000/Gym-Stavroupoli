import React, { useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { InstallmentListItem } from '@/services/api/installmentAdminApi';

interface InstallmentsAdminTabProps {
  installments: InstallmentListItem[];
  loading: boolean;
  onRefresh: () => void;
  onPay: (
    inst: InstallmentListItem,
    payment: { amount: number; method: 'cash' | 'pos'; note?: string }
  ) => Promise<void>;
}

const PAGE_SIZE = 10;

const statusLabel: Record<InstallmentListItem['status'], string> = {
  pending: 'Αναμένεται πληρωμή',
  overdue: 'Εκπρόθεσμη',
  paid: 'Εξοφλημένη'
};

const InstallmentsAdminTab: React.FC<InstallmentsAdminTabProps> = ({
  installments,
  loading,
  onRefresh,
  onPay
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InstallmentListItem['status']>('all');
  const [page, setPage] = useState(1);

  const [selectedInst, setSelectedInst] = useState<InstallmentListItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'pos'>('cash');
  const [payNote, setPayNote] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return installments.filter((inst) => {
      const matchSearch =
        !term ||
        inst.userName.toLowerCase().includes(term) ||
        (inst.userEmail || '').toLowerCase().includes(term) ||
        (inst.userPhone || '').toLowerCase().includes(term);
      const matchStatus = statusFilter === 'all' ? true : inst.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [installments, search, statusFilter]);

  const overdue = useMemo(
    () => filtered.filter((inst) => inst.status === 'overdue'),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openPayment = (inst: InstallmentListItem) => {
    setSelectedInst(inst);
    setPayAmount(inst.amount.toString());
    setPayMethod('cash');
    setPayNote('');
  };

  const closePayment = () => {
    setSelectedInst(null);
    setPayAmount('');
    setPayNote('');
    setSaving(false);
  };

  const handlePay = async () => {
    if (!selectedInst) return;
    const amountNum = Number(payAmount || 0);
    if (!amountNum || Number.isNaN(amountNum)) return;
    try {
      setSaving(true);
      await onPay(selectedInst, { amount: amountNum, method: payMethod, note: payNote });
      closePayment();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Δόσεις</h2>
          <p className="text-gray-300 mt-1">
            Αναζήτηση, ενημέρωση πληρωμών και προβολή καθυστερημένων δόσεων
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow hover:shadow-lg disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Ανανέωση</span>
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Αναζήτηση χρήστη (όνομα/email/τηλ)"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Όλες οι καταστάσεις</option>
            <option value="pending">Αναμένεται πληρωμή</option>
            <option value="overdue">Εκπρόθεσμες</option>
            <option value="paid">Εξοφλημένες</option>
          </select>
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <Wallet className="h-4 w-4 mr-2 text-blue-300" />
          <span>{filtered.length} δόσεις</span>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/40 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-orange-200 mb-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Καθυστερημένες / Ληγούσες δόσεις</span>
          </div>
          <div className="space-y-2">
            {overdue.map((inst) => (
              <div
                key={`${inst.requestId}-${inst.installmentNumber}-overdue`}
                className="flex flex-wrap items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="font-semibold text-white">
                    {inst.userName} • Δόση {inst.installmentNumber}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Λήξη: {inst.dueDate} • Ποσό: €{inst.amount.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-200 border border-red-500/30">
                    Εκπρόθεσμη
                  </span>
                  <button
                    onClick={() => openPayment(inst)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs"
                  >
                    Καταχώρηση πληρωμής
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Χρήστης</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Πακέτο</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Δόση</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Λήξη</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Ποσό</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Κατάσταση</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-300">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                      <span>Φόρτωση δόσεων...</span>
                    </div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center space-y-2">
                      <CreditCard className="h-8 w-8 text-gray-500" />
                      <span>Δεν βρέθηκαν δόσεις</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((inst) => (
                  <tr key={`${inst.requestId}-${inst.installmentNumber}`} className="hover:bg-gray-800/60">
                    <td className="px-4 py-3">
                      <div className="text-white font-semibold">{inst.userName}</div>
                      <div className="text-xs text-gray-400">
                        {inst.userEmail || '–'} {inst.userPhone ? `• ${inst.userPhone}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-200 text-sm">{inst.packageName || '—'}</td>
                    <td className="px-4 py-3 text-gray-200 text-sm">Δόση {inst.installmentNumber}</td>
                    <td className="px-4 py-3 text-gray-200 text-sm">{inst.dueDate}</td>
                    <td className="px-4 py-3 text-gray-100 font-semibold">€{inst.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          inst.status === 'paid'
                            ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                            : inst.status === 'overdue'
                            ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                        }`}
                      >
                        {inst.status === 'paid' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {statusLabel[inst.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inst.status === 'paid' ? (
                        <span className="text-xs text-gray-400">Εξοφλημένη</span>
                      ) : (
                        <button
                          onClick={() => openPayment(inst)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          Καταχώρηση πληρωμής
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-300">
          <div>
            Σελίδα {currentPage} / {totalPages}
          </div>
          <div className="space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-700 text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Προηγούμενη
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-700 text-white disabled:opacity-50"
            >
              Επόμενη
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedInst && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Καταχώρηση πληρωμής</h3>
                <p className="text-gray-300 text-sm">
                  {selectedInst.userName} • Δόση {selectedInst.installmentNumber}
                </p>
                <p className="text-gray-400 text-sm">
                  Ποσό δόσης: €{selectedInst.amount.toFixed(2)} • Λήξη: {selectedInst.dueDate}
                </p>
              </div>
              <button onClick={closePayment} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Ποσό πληρωμής</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Μέθοδος</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(['cash', 'pos'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        payMethod === m
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-200'
                      }`}
                    >
                      {m === 'cash' ? 'Μετρητά' : 'POS'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Σημείωση (προαιρετικό)</label>
              <textarea
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="π.χ. Απόδειξη #123"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={closePayment}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-750"
              >
                Άκυρο
              </button>
              <button
                onClick={handlePay}
                disabled={saving || !payAmount}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center space-x-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Καταχώρηση</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentsAdminTab;

