// =====================================================================
// Live QR Scanner — continuous secretary scanning module
// =====================================================================
// Self-contained component rendered inside the Secretary "scanner" tab,
// alongside (and independent from) the existing single-shot scanner.
//
// Features:
//   * START / STOP continuous camera scanning (stays on, scans many users)
//   * ~3s cooldown + duplicate suppression between accepted scans
//   * Subscription validation -> PASS / DENIED / INVALID
//   * Synthetic audio feedback per result
//   * Big live result panel (photo, name, time, status, colour)
//   * Scan history table with filters / search / sorting / pagination
//   * Robust cleanup: camera tracks, controls & timers released on unmount
// =====================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User as UserIcon,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';
import toast from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';
import {
  validateLiveScan,
  saveScanHistory,
  mirrorToAuditLog,
  fetchScanHistory,
  getQrCodeIdByToken,
  type LiveScanOutcome,
} from '@/services/qrScanHistoryService';
import {
  evaluateScanGate,
  nextGateState,
  buildHistoryView,
  formatScanTime,
  formatScanDate,
  formatExpiryDate,
  subscriptionStatusLabel,
  DEFAULT_COOLDOWN_MS,
  type GateState,
  type ScanHistoryRow,
  type ResultFilter,
  type DateFilter,
  type SortField,
  type SortDir,
} from '@/utils/liveScannerLogic';
import { primeAudio, playResultSound, disposeAudio } from '@/utils/scannerSounds';

const PAGE_SIZE = 8;
const HISTORY_CAP = 500;

const LiveQRScanner: React.FC = () => {
  const { user } = useAuth();

  // Camera state
  const [isScanning, setIsScanning] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Result state
  const [currentResult, setCurrentResult] = useState<LiveScanOutcome | null>(null);
  const [inCooldown, setInCooldown] = useState(false);

  // History state
  const [history, setHistory] = useState<ScanHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filters / sorting / pagination
  const [resultFilter, setResultFilter] = useState<ResultFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('scan_time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // Refs (mutable, do not trigger re-render)
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const gateRef = useRef<GateState>({ lastAcceptedAt: null, lastValue: null, lastValueAt: null });
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------
  // History loading
  // -------------------------------------------------------------------
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const rows = await fetchScanHistory(HISTORY_CAP);
      if (mountedRef.current) setHistory(rows);
    } finally {
      if (mountedRef.current) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadHistory();
    return () => {
      mountedRef.current = false;
    };
  }, [loadHistory]);

  // -------------------------------------------------------------------
  // Scan processing (one accepted scan)
  // -------------------------------------------------------------------
  const processScan = useCallback(
    async (value: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const outcome = await validateLiveScan(value);
        if (!mountedRef.current) return;

        // Immediate feedback: sound + panel
        playResultSound(outcome.result);
        setCurrentResult(outcome);

        // Persist (fault tolerant) + mirror successful entrances for occupancy
        void saveScanHistory({ outcome, scannedBy: user?.id ?? null }).then((ok) => {
          if (!ok || !mountedRef.current) return;
          // Optimistic prepend so the table updates instantly.
          const optimistic: ScanHistoryRow = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            user_id: outcome.user?.userId ?? null,
            qr_code: outcome.qrCode,
            user_name: outcome.user?.name ?? null,
            scan_result: outcome.result,
            subscription_status: outcome.subscriptionStatus,
            category: outcome.category,
            reason: outcome.reason,
            scanned_by: user?.id ?? null,
            scan_time: outcome.scanTime,
            created_at: outcome.scanTime,
          };
          setHistory((prev) => [optimistic, ...prev].slice(0, HISTORY_CAP));
        });

        if (outcome.result === 'PASS') {
          void getQrCodeIdByToken(value).then((qrId) =>
            mirrorToAuditLog(outcome, qrId, user?.id ?? null)
          );
        }

        // Cooldown UI hint (~3s) — does not stop the camera.
        setInCooldown(true);
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setInCooldown(false);
        }, DEFAULT_COOLDOWN_MS);
      } catch (e) {
        console.error('[LiveQRScanner] processScan error (continuing):', e);
      } finally {
        processingRef.current = false;
      }
    },
    [user?.id]
  );

  // ZXing detection callback — runs continuously while scanning.
  const onDecode = useCallback(
    (value: string) => {
      const now = Date.now();
      const decision = evaluateScanGate(value, now, gateRef.current);
      if (!decision.accept) return; // cooldown or duplicate — silently ignore
      gateRef.current = nextGateState(value, now);
      void processScan(value);
    },
    [processScan]
  );

  // -------------------------------------------------------------------
  // Camera lifecycle
  // -------------------------------------------------------------------
  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* no-op */
    }
    controlsRef.current = null;
    try {
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    } catch {
      /* no-op */
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setIsScanning(false);
    setIsVideoReady(false);
    setInCooldown(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setCurrentResult(null);
    setIsScanning(true);
    setIsVideoReady(false);
    // Reset the gate so the first scan after START is always accepted.
    gateRef.current = { lastAcceptedAt: null, lastValue: null, lastValueAt: null };

    // Prime audio inside the user gesture so sounds play without delay.
    await primeAudio();

    // Give React a tick to mount the <video> element.
    setTimeout(async () => {
      if (!mountedRef.current) return;
      if (!videoRef.current) {
        setCameraError('Το στοιχείο βίντεο δεν είναι διαθέσιμο');
        return;
      }
      try {
        const reader = new BrowserQRCodeReader();
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        const backCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ||
          devices[devices.length - 1];
        const deviceId = backCamera?.deviceId || undefined;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result: Result | undefined) => {
            if (result) {
              setIsVideoReady(true);
              onDecode(result.getText());
            }
          }
        );
        controlsRef.current = controls;
        setIsVideoReady(true);
      } catch (e) {
        console.error('[LiveQRScanner] Failed to start camera:', e);
        if (mountedRef.current) {
          setCameraError('Αποτυχία εκκίνησης κάμερας. Ελέγξτε τα δικαιώματα κάμερας.');
          setIsScanning(false);
          toast.error('Αποτυχία εκκίνησης κάμερας');
        }
      }
    }, 300);
  }, [onDecode]);

  // Full cleanup on unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      try {
        controlsRef.current?.stop();
      } catch {
        /* no-op */
      }
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      disposeAudio();
    };
  }, []);

  // -------------------------------------------------------------------
  // Derived history view (filter -> sort -> paginate), memoised.
  // -------------------------------------------------------------------
  const view = useMemo(
    () =>
      buildHistoryView(
        history,
        { result: resultFilter, date: dateFilter, search },
        { field: sortField, dir: sortDir },
        page,
        PAGE_SIZE
      ),
    [history, resultFilter, dateFilter, search, sortField, sortDir, page]
  );

  // Keep page in range when filters shrink the list.
  useEffect(() => {
    if (page > view.totalPages) setPage(view.totalPages);
  }, [view.totalPages, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // -------------------------------------------------------------------
  // Result panel visuals
  // -------------------------------------------------------------------
  const resultTheme = (r: LiveScanOutcome['result']) => {
    switch (r) {
      case 'PASS':
        return {
          bg: 'from-green-600 to-emerald-700',
          ring: 'ring-green-400',
          label: 'PASS',
          Icon: CheckCircle,
        };
      case 'DENIED':
        return {
          bg: 'from-red-600 to-rose-700',
          ring: 'ring-red-400',
          label: 'DENIED',
          Icon: XCircle,
        };
      case 'INVALID':
      default:
        return {
          bg: 'from-orange-500 to-amber-600',
          ring: 'ring-orange-400',
          label: 'INVALID QR',
          Icon: AlertTriangle,
        };
    }
  };

  const resultBadgeClass = (r: ScanHistoryRow['scan_result']) => {
    if (r === 'PASS') return 'bg-green-500/20 text-green-300 border border-green-400/40';
    if (r === 'DENIED') return 'bg-red-500/20 text-red-300 border border-red-400/40';
    return 'bg-orange-500/20 text-orange-200 border border-orange-400/40';
  };

  return (
    <div className="space-y-6" data-testid="live-qr-scanner">
      {/* ============ Top: camera + live result ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Camera */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Radio className="h-6 w-6 mr-2 text-emerald-400" />
              Live QR Scanner
            </h2>
            {isScanning && (
              <span className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                {inCooldown ? 'Αναμονή 3s…' : 'Σάρωση…'}
              </span>
            )}
          </div>

          {!isScanning ? (
            <div className="text-center py-10">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-lg">
                <Camera className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Συνεχόμενη σάρωση</h3>
              <p className="text-gray-300 mb-6 text-sm">
                Ο scanner παραμένει ανοιχτός και σαρώνει διαδοχικά χρήστες. Αναμονή ~3s μεταξύ
                σαρώσεων.
              </p>
              <button
                onClick={startScanner}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <Camera className="h-5 w-5 inline mr-2" />
                START SCANNER
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: '16/9', minHeight: '200px' }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain bg-black"
                  playsInline
                  muted
                  autoPlay
                />
                {!isVideoReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                      <p className="text-sm">Φόρτωση κάμερας…</p>
                    </div>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90">
                    <div className="text-center text-white p-4">
                      <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                      <p className="text-sm font-medium mb-2">Σφάλμα κάμερας</p>
                      <p className="text-xs text-red-200">{cameraError}</p>
                    </div>
                  </div>
                )}
                {isVideoReady && !cameraError && (
                  <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 right-2 bg-emerald-500 text-white text-center py-1 rounded text-sm">
                      Σαρώστε QR Code εδώ
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={stopScanner}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <XCircle className="h-4 w-4 inline mr-2" />
                STOP SCANNER
              </button>
            </div>
          )}
        </div>

        {/* Live result panel */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600 p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Αποτέλεσμα</h2>
          {!currentResult ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-center py-10">
              <div>
                <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Δεν έχει γίνει σάρωση ακόμη.</p>
              </div>
            </div>
          ) : (
            (() => {
              const theme = resultTheme(currentResult.result);
              const { Icon } = theme;
              return (
                <div
                  className={`flex-1 rounded-xl bg-gradient-to-br ${theme.bg} ring-2 ${theme.ring} p-6 text-white flex flex-col items-center justify-center text-center`}
                >
                  <Icon className="h-16 w-16 mb-3" />
                  <div className="text-4xl font-extrabold tracking-wide mb-4">{theme.label}</div>

                  {currentResult.user?.photo ? (
                    <img
                      src={currentResult.user.photo}
                      alt={currentResult.user.name}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white/40 mb-3"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30 mb-3">
                      <UserIcon className="h-10 w-10" />
                    </div>
                  )}

                  {currentResult.user && (
                    <div className="text-2xl font-bold">{currentResult.user.name}</div>
                  )}
                  <div className="text-sm opacity-90 mt-1">
                    {subscriptionStatusLabel(currentResult.subscriptionStatus)}
                    {(!currentResult.user?.subscriptions ||
                      currentResult.user.subscriptions.length === 0) &&
                    currentResult.user?.membershipName
                      ? ` · ${currentResult.user.membershipName}`
                      : ''}
                  </div>

                  {/* Active subscriptions with expiry date(s) — supports multiple */}
                  {currentResult.user?.subscriptions &&
                    currentResult.user.subscriptions.length > 0 && (
                      <div className="mt-3 w-full max-w-xs mx-auto space-y-1.5">
                        {currentResult.user.subscriptions.map((s, i) => (
                          <div
                            key={i}
                            className="text-sm bg-white/15 rounded-lg px-3 py-1.5 flex items-center justify-between gap-3"
                          >
                            <span className="font-semibold truncate">{s.packageName}</span>
                            {s.endDate ? (
                              <span className="opacity-95 whitespace-nowrap">
                                Λήξη: {formatExpiryDate(s.endDate)}
                              </span>
                            ) : (
                              <span className="opacity-70 whitespace-nowrap text-xs">
                                χωρίς λήξη
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="text-sm opacity-90 mt-3">
                    {formatScanTime(currentResult.scanTime)}
                  </div>
                  <div className="text-xs opacity-80 mt-3">{currentResult.reason}</div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ============ History ============ */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Ιστορικό Σαρώσεων</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Αναζήτηση (όνομα, QR, status)"
                className="pl-8 pr-3 py-2 rounded-lg bg-white/10 border border-gray-600 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilter);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-white/10 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="ALL">Όλες οι ημ/νίες</option>
              <option value="TODAY">Σήμερα</option>
              <option value="WEEK">Αυτή την εβδομάδα</option>
            </select>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              Ανανέωση
            </button>
          </div>
        </div>

        {/* Result filter chips */}
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-800">
          {(['ALL', 'PASS', 'DENIED', 'INVALID'] as ResultFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setResultFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                resultFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {r === 'ALL' ? 'Όλα' : r}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase cursor-pointer select-none"
                  onClick={() => toggleSort('scan_time')}
                >
                  Ημ/νία{sortField === 'scan_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">
                  Ώρα
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase cursor-pointer select-none"
                  onClick={() => toggleSort('user_name')}
                >
                  Χρήστης{sortField === 'user_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">
                  Συνδρομή
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase cursor-pointer select-none"
                  onClick={() => toggleSort('scan_result')}
                >
                  Αποτέλεσμα
                  {sortField === 'scan_result' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase">
                  QR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {view.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {loadingHistory ? 'Φόρτωση…' : 'Δεν βρέθηκαν σαρώσεις'}
                  </td>
                </tr>
              )}
              {view.items.map((row) => (
                <tr key={row.id} className="hover:bg-gray-800/60 transition">
                  <td className="px-4 py-3 text-gray-200 text-sm">{formatScanDate(row.scan_time)}</td>
                  <td className="px-4 py-3 text-gray-200 text-sm">{formatScanTime(row.scan_time)}</td>
                  <td className="px-4 py-3 text-white font-medium">{row.user_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {subscriptionStatusLabel(row.subscription_status)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${resultBadgeClass(
                        row.scan_result
                      )}`}
                    >
                      {row.scan_result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {row.qr_code ? `${row.qr_code.slice(0, 12)}${row.qr_code.length > 12 ? '…' : ''}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-gray-300 text-sm">
          <span>
            Σύνολο: {view.totalItems} · Σελίδα {view.page}/{view.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={view.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Προηγ.
            </button>
            <button
              onClick={() => setPage((p) => Math.min(view.totalPages, p + 1))}
              disabled={view.page >= view.totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-40 flex items-center gap-1"
            >
              Επόμ.
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveQRScanner;
