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
  LIVE_SCAN_CHANNEL,
  LIVE_SCAN_EVENT,
  type GateState,
  type ScanHistoryRow,
  type ResultFilter,
  type DateFilter,
  type SortField,
  type SortDir,
} from '@/utils/liveScannerLogic';
import { primeAudio, playResultSound, disposeAudio } from '@/utils/scannerSounds';
import { supabase } from '@/config/supabase';

const PAGE_SIZE = 8;
const HISTORY_CAP = 500;

// --- Continuous-operation tuning (kept light for low-end laptops) ------------
const VALIDATION_TIMEOUT_MS = 12000; // abandon a hung DB call so scanning never freezes
const VIDEO_WATCHDOG_MS = 4000;      // how often we check the camera is still "alive"
const VIDEO_STALL_LIMIT = 3;         // consecutive stalled checks before auto-restart

// --- Filterable logger (filter the console by "[LiveQR]" to see everything) ---
const ts = () => new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
function memInfo(): string {
  const m = (performance as unknown as {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  if (!m) return '';
  return ` | heap=${Math.round(m.usedJSHeapSize / 1048576)}/${Math.round(
    m.jsHeapSizeLimit / 1048576
  )}MB`;
}
const log = (...a: unknown[]) => console.log(`[LiveQR ${ts()}]`, ...a);
const logWarn = (...a: unknown[]) => console.warn(`[LiveQR ${ts()}]`, ...a);
const logErr = (...a: unknown[]) => console.error(`[LiveQR ${ts()}]`, ...a);

// Race a promise against a timeout so a hung network call can't wedge the scanner.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

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

  // Continuous-operation / recovery refs (do not trigger re-render)
  const isScanningRef = useRef(false); // latest scanning state for interval closures
  const scanSeqRef = useRef(0); // total accepted scans (for logs)
  const processStartedAtRef = useRef(0); // epoch ms the current validation began
  const videoWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastVideoTimeRef = useRef(0);
  const videoStallCountRef = useRef(0);
  const restartingRef = useRef(false);
  const restartCameraRef = useRef<() => Promise<void>>(async () => {});
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Broadcast channel that mirrors each result to the /tablet TV display.
  useEffect(() => {
    const channel = supabase.channel(LIVE_SCAN_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe((status) => log(`broadcast channel: ${status}`));
    broadcastRef.current = channel;
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* no-op */
      }
      broadcastRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------
  // Scan processing (one accepted scan)
  // -------------------------------------------------------------------
  const processScan = useCallback(
    async (value: string) => {
      if (processingRef.current) {
        log(`scan ignored (busy) token="${value.slice(0, 16)}"`);
        return;
      }
      processingRef.current = true;
      processStartedAtRef.current = Date.now();
      const seq = ++scanSeqRef.current;
      const t0 = performance.now();
      log(`scan #${seq} START token="${value.slice(0, 24)}"${memInfo()}`);
      try {
        // Timeout-guarded: a hung DB call can no longer freeze the scanner.
        const outcome = await withTimeout(
          validateLiveScan(value),
          VALIDATION_TIMEOUT_MS,
          `validateLiveScan #${seq}`
        );
        const ms = Math.round(performance.now() - t0);
        if (!mountedRef.current) return;

        log(
          `scan #${seq} RESULT=${outcome.result} status=${outcome.subscriptionStatus} user="${
            outcome.user?.name || '-'
          }" in ${ms}ms`
        );

        // Immediate feedback: sound + panel
        try {
          playResultSound(outcome.result);
        } catch (soundErr) {
          logWarn(`scan #${seq} sound failed:`, soundErr);
        }
        setCurrentResult(outcome);

        // Mirror the result to the /tablet TV display (best-effort, non-blocking).
        try {
          void broadcastRef.current?.send({
            type: 'broadcast',
            event: LIVE_SCAN_EVENT,
            payload: outcome,
          });
          log(`scan #${seq} broadcast → tablet`);
        } catch (bErr) {
          logWarn(`scan #${seq} broadcast failed:`, bErr);
        }

        // Persist (fault tolerant, timeout-guarded) — never blocks scanning.
        void withTimeout(
          saveScanHistory({ outcome, scannedBy: user?.id ?? null }),
          VALIDATION_TIMEOUT_MS,
          `saveScanHistory #${seq}`
        )
          .then((ok) => {
            if (!mountedRef.current) return;
            log(`scan #${seq} history saved=${ok}`);
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
          })
          .catch((e) => logWarn(`scan #${seq} saveScanHistory failed:`, e));

        // Mirror successful entrances for occupancy — reuse the id from
        // validation (no extra DB round-trip).
        if (outcome.result === 'PASS' && outcome.qrCodeId) {
          void mirrorToAuditLog(outcome, outcome.qrCodeId, user?.id ?? null).catch((e) =>
            logWarn(`scan #${seq} mirrorToAuditLog failed:`, e)
          );
        }

        // Cooldown UI hint (~3s) — does not stop the camera.
        setInCooldown(true);
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setInCooldown(false);
        }, DEFAULT_COOLDOWN_MS);
      } catch (e) {
        logErr(`scan #${seq} FAILED (continuing):`, e);
      } finally {
        // ALWAYS release the guard — even on timeout — so scanning never wedges.
        processingRef.current = false;
        log(`scan #${seq} END (guard released)`);
      }
    },
    [user?.id]
  );

  // ZXing detection callback — runs continuously while scanning.
  const onDecode = useCallback(
    (value: string) => {
      const now = Date.now();
      const decision = evaluateScanGate(value, now, gateRef.current);
      if (!decision.accept) {
        // Light log — confirms the reader is alive and seeing codes.
        log(`decode seen (skipped: ${decision.reason}) token="${value.slice(0, 12)}"`);
        return;
      }
      gateRef.current = nextGateState(value, now);
      void processScan(value);
    },
    [processScan]
  );

  // -------------------------------------------------------------------
  // Camera lifecycle
  // -------------------------------------------------------------------
  const stopVideoWatchdog = useCallback(() => {
    if (videoWatchdogRef.current) {
      clearInterval(videoWatchdogRef.current);
      videoWatchdogRef.current = null;
    }
  }, []);

  // Core ZXing init — reusable by START and by the auto-restart watchdog.
  const beginDecode = useCallback(async () => {
    if (!videoRef.current) {
      logErr('beginDecode: <video> element not available');
      throw new Error('no-video-element');
    }
    const reader = new BrowserQRCodeReader();
    log('beginDecode: listing camera devices…');
    const devices = await withTimeout(
      BrowserQRCodeReader.listVideoInputDevices(),
      8000,
      'listVideoInputDevices'
    );
    const backCamera =
      devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
    const deviceId = backCamera?.deviceId || undefined;
    log(`beginDecode: ${devices.length} device(s); using "${backCamera?.label || 'default'}"`);
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
    const v = videoRef.current;
    lastVideoTimeRef.current = v?.currentTime ?? 0;
    log(
      `beginDecode: reader started (video ${v?.videoWidth || 0}x${v?.videoHeight || 0}, readyState=${
        v?.readyState
      })`
    );
  }, [onDecode]);

  // Recover the camera/decoder without a user gesture (called by the watchdog).
  const restartCamera = useCallback(async () => {
    if (restartingRef.current) return;
    restartingRef.current = true;
    logWarn('restartCamera: recovering camera/decoder…');
    try {
      controlsRef.current?.stop();
    } catch {
      /* no-op */
    }
    controlsRef.current = null;
    processingRef.current = false; // release any stuck guard
    try {
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    } catch {
      /* no-op */
    }
    await new Promise((r) => setTimeout(r, 500));
    if (!mountedRef.current || !isScanningRef.current) {
      restartingRef.current = false;
      return;
    }
    try {
      await beginDecode();
      videoStallCountRef.current = 0;
      log('restartCamera: done ✓');
    } catch (e) {
      logErr('restartCamera failed:', e);
      if (mountedRef.current) setCameraError('Αποτυχία επανεκκίνησης κάμερας.');
    } finally {
      restartingRef.current = false;
    }
  }, [beginDecode]);

  // Keep a stable ref so interval closures always call the latest restartCamera.
  useEffect(() => {
    restartCameraRef.current = restartCamera;
  }, [restartCamera]);

  const startVideoWatchdog = useCallback(() => {
    stopVideoWatchdog();
    videoStallCountRef.current = 0;
    lastVideoTimeRef.current = videoRef.current?.currentTime ?? 0;
    videoWatchdogRef.current = setInterval(() => {
      const v = videoRef.current;
      if (!v || !isScanningRef.current || restartingRef.current) return;

      // Browser tab in background throttles/pauses video — that's not a crash,
      // so skip stall detection (avoids pointless restart loops).
      if (typeof document !== 'undefined' && document.hidden) {
        lastVideoTimeRef.current = v.currentTime;
        return;
      }

      // Safety net: release a guard that's been stuck far too long.
      const stuckMs = processingRef.current ? Date.now() - processStartedAtRef.current : 0;
      if (stuckMs > VALIDATION_TIMEOUT_MS + 3000) {
        logWarn(`watchdog: processing guard stuck ${stuckMs}ms — force-releasing`);
        processingRef.current = false;
      }

      const ct = v.currentTime;
      const advanced = ct > lastVideoTimeRef.current + 0.05;
      if (advanced) {
        if (videoStallCountRef.current > 0) log(`watchdog: video recovered (t=${ct.toFixed(2)})`);
        videoStallCountRef.current = 0;
      } else {
        videoStallCountRef.current += 1;
        logWarn(
          `watchdog: video STALLED ${videoStallCountRef.current}/${VIDEO_STALL_LIMIT} (t=${ct.toFixed(
            2
          )}, readyState=${v.readyState})${memInfo()}`
        );
        if (videoStallCountRef.current >= VIDEO_STALL_LIMIT) {
          void restartCameraRef.current();
        }
      }
      lastVideoTimeRef.current = ct;
    }, VIDEO_WATCHDOG_MS);
    log('video watchdog started');
  }, [stopVideoWatchdog]);

  const stopScanner = useCallback(() => {
    log('STOP SCANNER pressed');
    isScanningRef.current = false;
    stopVideoWatchdog();
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
    processingRef.current = false;
    setIsScanning(false);
    setIsVideoReady(false);
    setInCooldown(false);
  }, [stopVideoWatchdog]);

  const startScanner = useCallback(async () => {
    log('START SCANNER pressed');
    setCameraError(null);
    setCurrentResult(null);
    setIsScanning(true);
    isScanningRef.current = true;
    setIsVideoReady(false);
    // Reset the gate so the first scan after START is always accepted.
    gateRef.current = { lastAcceptedAt: null, lastValue: null, lastValueAt: null };

    // Prime audio inside the user gesture so sounds play without delay.
    await primeAudio();

    // Give React a tick to mount the <video> element.
    setTimeout(async () => {
      if (!mountedRef.current || !isScanningRef.current) return;
      try {
        await beginDecode();
        startVideoWatchdog();
      } catch (e) {
        logErr('Failed to start camera:', e);
        if (mountedRef.current) {
          setCameraError('Αποτυχία εκκίνησης κάμερας. Ελέγξτε τα δικαιώματα κάμερας.');
          setIsScanning(false);
          isScanningRef.current = false;
          toast.error('Αποτυχία εκκίνησης κάμερας');
        }
      }
    }, 300);
  }, [beginDecode, startVideoWatchdog]);

  // Full cleanup on unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      isScanningRef.current = false;
      if (videoWatchdogRef.current) clearInterval(videoWatchdogRef.current);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      try {
        controlsRef.current?.stop();
      } catch {
        /* no-op */
      }
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
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
