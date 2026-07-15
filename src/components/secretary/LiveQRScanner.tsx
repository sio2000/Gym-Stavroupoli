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
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
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
// Dedicated dimension-diagnostics logger — filter console by "[LiveQR-DIMS]"
const logDims = (...a: unknown[]) => console.log(`[LiveQR-DIMS ${ts()}]`, ...a);

// ---------------------------------------------------------------------------
// DIMENSION DIAGNOSTICS
// Exhaustive logging of every dimension the app sees on THIS device, so a
// remote client's "scans horizontally but not vertically" report can be
// diagnosed from the console output alone.
// ---------------------------------------------------------------------------
function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Log the full device/browser/display environment. */
function logEnvironmentDiagnostics(tag: string) {
  try {
    logDims(`=== ENV SNAPSHOT (${tag}) ===`);
    logDims(`userAgent: ${navigator.userAgent}`);
    logDims(`platform: ${navigator.platform} | vendor: ${navigator.vendor} | hwConcurrency: ${navigator.hardwareConcurrency}`);
    logDims(
      `screen: ${screen.width}x${screen.height} | avail: ${screen.availWidth}x${screen.availHeight} | colorDepth: ${screen.colorDepth}`
    );
    const so = (screen as Screen & { orientation?: ScreenOrientation }).orientation;
    logDims(`screen.orientation: type=${so?.type ?? 'n/a'} angle=${so?.angle ?? 'n/a'}`);
    logDims(
      `window inner: ${window.innerWidth}x${window.innerHeight} | outer: ${window.outerWidth}x${window.outerHeight} | devicePixelRatio: ${window.devicePixelRatio}`
    );
    const vv = window.visualViewport;
    if (vv) {
      logDims(
        `visualViewport: ${vv.width.toFixed(1)}x${vv.height.toFixed(1)} scale=${vv.scale} offset=(${vv.offsetLeft},${vv.offsetTop})`
      );
    } else {
      logDims('visualViewport: not available');
    }
    logDims(`document.fullscreenElement: ${document.fullscreenElement ? 'YES' : 'no'} | document.hidden: ${document.hidden}`);
    logDims(`matchMedia portrait: ${window.matchMedia('(orientation: portrait)').matches} | landscape: ${window.matchMedia('(orientation: landscape)').matches}`);
  } catch (e) {
    logWarn('logEnvironmentDiagnostics failed:', e);
  }
}

/** Log everything about the active MediaStream + its video track(s). */
function logStreamDiagnostics(tag: string, video: HTMLVideoElement | null) {
  try {
    logDims(`=== STREAM SNAPSHOT (${tag}) ===`);
    if (!video) {
      logDims('video element: NULL');
      return;
    }
    const stream = video.srcObject as MediaStream | null;
    if (!stream) {
      logDims('video.srcObject: NULL (no stream attached)');
      return;
    }
    logDims(`stream: id=${stream.id} active=${stream.active} tracks=${stream.getTracks().length}`);
    stream.getVideoTracks().forEach((t, i) => {
      logDims(`track[${i}]: label="${t.label}" readyState=${t.readyState} enabled=${t.enabled} muted=${t.muted}`);
      try {
        const s = t.getSettings();
        logDims(
          `track[${i}].getSettings(): width=${s.width} height=${s.height} aspectRatio=${s.aspectRatio} frameRate=${s.frameRate} facingMode=${s.facingMode} resizeMode=${(s as MediaTrackSettings & { resizeMode?: string }).resizeMode} deviceId=${s.deviceId?.slice(-8)}`
        );
        logDims(`track[${i}].getSettings() FULL: ${safeJson(s)}`);
      } catch (e) {
        logDims(`track[${i}].getSettings() FAILED: ${e}`);
      }
      try {
        const caps = typeof t.getCapabilities === 'function' ? t.getCapabilities() : null;
        logDims(`track[${i}].getCapabilities() FULL: ${caps ? safeJson(caps) : 'not supported'}`);
      } catch (e) {
        logDims(`track[${i}].getCapabilities() FAILED: ${e}`);
      }
      try {
        logDims(`track[${i}].getConstraints() FULL: ${safeJson(t.getConstraints())}`);
      } catch (e) {
        logDims(`track[${i}].getConstraints() FAILED: ${e}`);
      }
    });
  } catch (e) {
    logWarn('logStreamDiagnostics failed:', e);
  }
}

/** Log everything about the <video> element's intrinsic vs rendered size. */
function logVideoElementDiagnostics(tag: string, video: HTMLVideoElement | null) {
  try {
    logDims(`=== VIDEO ELEMENT SNAPSHOT (${tag}) ===`);
    if (!video) {
      logDims('video element: NULL');
      return;
    }
    logDims(
      `intrinsic (camera frame): videoWidth=${video.videoWidth} videoHeight=${video.videoHeight} ` +
        `aspect=${video.videoHeight ? (video.videoWidth / video.videoHeight).toFixed(3) : 'n/a'} ` +
        `orientation=${video.videoWidth >= video.videoHeight ? 'LANDSCAPE' : 'PORTRAIT'}`
    );
    logDims(
      `rendered (CSS box): clientW=${video.clientWidth} clientH=${video.clientHeight} offsetW=${video.offsetWidth} offsetH=${video.offsetHeight}`
    );
    const r = video.getBoundingClientRect();
    logDims(
      `boundingRect: ${r.width.toFixed(1)}x${r.height.toFixed(1)} at (${r.left.toFixed(1)},${r.top.toFixed(1)})`
    );
    try {
      const cs = window.getComputedStyle(video);
      logDims(`computedStyle: objectFit=${cs.objectFit} transform=${cs.transform} width=${cs.width} height=${cs.height}`);
    } catch {
      /* no-op */
    }
    logDims(
      `playback: readyState=${video.readyState} paused=${video.paused} currentTime=${video.currentTime.toFixed(2)} playbackRate=${video.playbackRate}`
    );
    if (video.videoWidth && video.clientWidth) {
      logDims(
        `scale factor camera→CSS: x=${(video.clientWidth / video.videoWidth).toFixed(3)} y=${(video.clientHeight / video.videoHeight).toFixed(3)}`
      );
    }
  } catch (e) {
    logWarn('logVideoElementDiagnostics failed:', e);
  }
}

/** One-call full snapshot: env + stream + video element. */
function logFullDiagnostics(tag: string, video: HTMLVideoElement | null) {
  logEnvironmentDiagnostics(tag);
  logStreamDiagnostics(tag, video);
  logVideoElementDiagnostics(tag, video);
  logDims(`=== END SNAPSHOT (${tag}) ===`);
}

/** Log the geometry of a decoded QR inside the camera frame (finder-pattern points). */
function logDecodeGeometry(result: Result, video: HTMLVideoElement | null) {
  try {
    const pts = (result as unknown as {
      getResultPoints?: () => Array<{ getX?: () => number; getY?: () => number; x?: number; y?: number }>;
    }).getResultPoints?.();
    if (!pts || pts.length === 0) {
      logDims('decode geometry: no result points available');
      return;
    }
    const xy = pts.map((p) => ({
      x: typeof p.getX === 'function' ? p.getX() : (p.x ?? 0),
      y: typeof p.getY === 'function' ? p.getY() : (p.y ?? 0),
    }));
    logDims(
      `decode geometry: ${xy.length} points: ${xy
        .map((p, i) => `P${i}=(${p.x.toFixed(1)},${p.y.toFixed(1)})`)
        .join(' ')}`
    );
    if (xy.length >= 2) {
      const xs = xy.map((p) => p.x);
      const ys = xy.map((p) => p.y);
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      // Rotation of the top edge relative to horizontal (0°≈upright, ±90°≈sideways)
      const angle = (Math.atan2(xy[1].y - xy[0].y, xy[1].x - xy[0].x) * 180) / Math.PI;
      const vw = video?.videoWidth || 0;
      const vh = video?.videoHeight || 0;
      logDims(
        `decode geometry: QR bbox=${w.toFixed(1)}x${h.toFixed(1)}px angle≈${angle.toFixed(1)}° ` +
          `in frame ${vw}x${vh} (QR covers ${vw ? ((w / vw) * 100).toFixed(1) : '?'}% of frame width, ${
            vh ? ((h / vh) * 100).toFixed(1) : '?'
          }% of height)`
      );
    }
  } catch (e) {
    logWarn('logDecodeGeometry failed:', e);
  }
}

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

    // QR-only + TRY_HARDER so codes shown at an angle / in portrait / smaller in
    // the frame (which occupy fewer pixels of a landscape webcam) still decode.
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserQRCodeReader(hints);

    // Full environment snapshot BEFORE we touch the camera.
    logEnvironmentDiagnostics('beginDecode:before-camera');

    log('beginDecode: listing camera devices…');
    const devices = await withTimeout(
      BrowserQRCodeReader.listVideoInputDevices(),
      8000,
      'listVideoInputDevices'
    );
    devices.forEach((d, i) =>
      logDims(`camera device[${i}]: label="${d.label}" kind=${d.kind} deviceId=…${d.deviceId?.slice(-8)} groupId=…${d.groupId?.slice(-8)}`)
    );
    const backCamera =
      devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
    const deviceId = backCamera?.deviceId || undefined;
    log(`beginDecode: ${devices.length} device(s); using "${backCamera?.label || 'default'}"`);

    // Request a HIGH-RESOLUTION stream. A QR shown on a phone held in PORTRAIT
    // occupies far fewer pixels of a landscape webcam frame; the low default
    // resolution (often 640x480) then can't resolve it — which is exactly why it
    // "only works horizontally". 1280x720 gives enough detail for any orientation.
    const hiRes = { width: { ideal: 1280 }, height: { ideal: 720 } };
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId }, ...hiRes }
        : { facingMode: 'environment', ...hiRes },
    };
    logDims(`beginDecode: REQUESTED constraints: ${safeJson(constraints)}`);

    // Per-decode-success geometry logging (QR position/size/angle in the frame).
    const handleResult = (result: Result | undefined) => {
      if (result) {
        setIsVideoReady(true);
        logDecodeGeometry(result, videoRef.current);
        onDecode(result.getText());
      }
    };

    let controls: IScannerControls;
    let constraintPath = 'decodeFromConstraints(hi-res)';
    try {
      controls = await reader.decodeFromConstraints(constraints, videoRef.current, handleResult);
    } catch (constraintErr) {
      // Some cameras reject the resolution hint — fall back to the plain device.
      logWarn('beginDecode: hi-res constraints failed, falling back:', constraintErr);
      logDims(`beginDecode: FALLBACK to decodeFromVideoDevice (NO resolution hint) — error was: ${constraintErr}`);
      constraintPath = 'decodeFromVideoDevice(fallback, browser-default resolution)';
      controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, handleResult);
    }
    logDims(`beginDecode: camera acquired via ${constraintPath}`);

    controlsRef.current = controls;
    setIsVideoReady(true);
    const v = videoRef.current;
    lastVideoTimeRef.current = v?.currentTime ?? 0;
    log(
      `beginDecode: reader started (video ${v?.videoWidth || 0}x${v?.videoHeight || 0}, readyState=${
        v?.readyState
      })`
    );

    // Immediate + delayed full snapshots (some browsers report 0x0 until
    // loadedmetadata, so log again after the stream settles).
    logFullDiagnostics('beginDecode:stream-started', v);
    if (v) {
      v.addEventListener(
        'loadedmetadata',
        () => {
          logDims(`event: loadedmetadata fired`);
          logVideoElementDiagnostics('event:loadedmetadata', videoRef.current);
          logStreamDiagnostics('event:loadedmetadata', videoRef.current);
        },
        { once: true }
      );
      // 'resize' on <video> fires when the STREAM's intrinsic size changes
      // (e.g. some drivers deliver a different resolution than granted).
      v.addEventListener('resize', () => {
        logDims(`event: <video> intrinsic resize -> ${v.videoWidth}x${v.videoHeight}`);
      });
    }
    setTimeout(() => {
      if (mountedRef.current && isScanningRef.current) {
        logFullDiagnostics('beginDecode:+2s-settled', videoRef.current);
      }
    }, 2000);
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

      // Periodic compact dimension trace — one line per watchdog tick.
      try {
        const trk = (v.srcObject as MediaStream | null)?.getVideoTracks()[0];
        const s = trk?.getSettings();
        logDims(
          `watchdog tick: frame=${v.videoWidth}x${v.videoHeight} css=${v.clientWidth}x${v.clientHeight} ` +
            `track=${s?.width ?? '?'}x${s?.height ?? '?'}@${s?.frameRate ?? '?'}fps trackState=${trk?.readyState ?? 'none'} ` +
            `win=${window.innerWidth}x${window.innerHeight} dpr=${window.devicePixelRatio} ` +
            `orient=${(screen as Screen & { orientation?: ScreenOrientation }).orientation?.type ?? 'n/a'}`
        );
      } catch {
        /* no-op */
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

  // Dimension-change listeners: log every resize / orientation / visibility
  // change while the scanner is active — these are prime suspects for the
  // "scans horizontally but not vertically" report.
  useEffect(() => {
    if (!isScanning) return;
    const onResize = () => {
      logDims(
        `event: window resize -> inner=${window.innerWidth}x${window.innerHeight} outer=${window.outerWidth}x${window.outerHeight} dpr=${window.devicePixelRatio}`
      );
      logVideoElementDiagnostics('event:window-resize', videoRef.current);
    };
    const onOrientation = () => {
      const so = (screen as Screen & { orientation?: ScreenOrientation }).orientation;
      logDims(`event: orientationchange -> type=${so?.type ?? 'n/a'} angle=${so?.angle ?? 'n/a'}`);
      logFullDiagnostics('event:orientationchange', videoRef.current);
    };
    const onVisibility = () => {
      logDims(`event: visibilitychange -> hidden=${document.hidden}`);
    };
    const onVVResize = () => {
      const vv = window.visualViewport;
      if (vv) logDims(`event: visualViewport resize -> ${vv.width.toFixed(1)}x${vv.height.toFixed(1)} scale=${vv.scale}`);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrientation);
    document.addEventListener('visibilitychange', onVisibility);
    window.visualViewport?.addEventListener('resize', onVVResize);
    const so = (screen as Screen & { orientation?: ScreenOrientation }).orientation;
    so?.addEventListener?.('change', onOrientation);
    logDims('dimension-change listeners attached (resize/orientation/visibility/visualViewport)');
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientation);
      document.removeEventListener('visibilitychange', onVisibility);
      window.visualViewport?.removeEventListener('resize', onVVResize);
      so?.removeEventListener?.('change', onOrientation);
      logDims('dimension-change listeners removed');
    };
  }, [isScanning]);

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
