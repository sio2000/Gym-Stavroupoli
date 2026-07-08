// =====================================================================
// Tablet / TV display — fullscreen QR scan result (URL-only page: /tablet)
// =====================================================================
// Shows ONLY the scan result panel, fullscreen, with sound. Meant to be put
// on a TV so members see their PASS / DENIED / INVALID result. It receives the
// result live from the secretary's Live QR Scanner via a Supabase Realtime
// broadcast channel — works cross-device, no DB changes required.
// =====================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, User as UserIcon, Radio } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { supabase } from '@/config/supabase';
import { primeAudio, playResultSound, disposeAudio } from '@/utils/scannerSounds';
import {
  formatScanTime,
  formatExpiryDate,
  subscriptionStatusLabel,
  evaluateScanGate,
  nextGateState,
  LIVE_SCAN_CHANNEL,
  LIVE_SCAN_EVENT,
  type GateState,
} from '@/utils/liveScannerLogic';
import {
  validateLiveScan,
  saveScanHistory,
  mirrorToAuditLog,
  type LiveScanOutcome,
} from '@/services/qrScanHistoryService';

// Auto-clear the result after this idle time so a stale scan doesn't linger on
// the TV once no one else scans. A new scan resets the timer.
const RESULT_VISIBLE_MS = 4000;

const theme = (r: LiveScanOutcome['result']) => {
  switch (r) {
    case 'PASS':
      return { bg: 'from-green-600 to-emerald-800', ring: 'ring-green-300', label: 'PASS', Icon: CheckCircle };
    case 'DENIED':
      return { bg: 'from-red-600 to-rose-800', ring: 'ring-red-300', label: 'DENIED', Icon: XCircle };
    case 'INVALID':
    default:
      return { bg: 'from-orange-500 to-amber-700', ring: 'ring-orange-300', label: 'INVALID QR', Icon: AlertTriangle };
  }
};

const TabletDisplay: React.FC = () => {
  const [result, setResult] = useState<LiveScanOutcome | null>(null);
  const [started, setStarted] = useState(false); // audio unlocked (needs a user gesture)
  const [connected, setConnected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bottom-half live camera — members point their QR at it and it scans them in.
  // It decodes QR locally, validates the subscription and shows the result on the
  // top half (same outcome shape/logic the secretary's scanner uses).
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const gateRef = useRef<GateState>({ lastAcceptedAt: null, lastValue: null, lastValueAt: null });
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  // Subscribe to the live broadcast channel.
  useEffect(() => {
    const channel = supabase.channel(LIVE_SCAN_CHANNEL, {
      config: { broadcast: { self: false } },
    });
    channel
      .on('broadcast', { event: LIVE_SCAN_EVENT }, (msg) => {
        const payload = msg.payload as LiveScanOutcome;
        if (!payload || !payload.result) return;
        setResult(payload);
        try {
          playResultSound(payload.result);
        } catch {
          /* audio not unlocked yet */
        }
        // Auto-hide after a few idle seconds; a new scan resets the timer.
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => setResult(null), RESULT_VISIBLE_MS);
      })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
      disposeAudio();
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  // Show a result (from a local scan) on the top half, with sound + auto-clear.
  const showOutcome = useCallback((outcome: LiveScanOutcome) => {
    setResult(outcome);
    try {
      playResultSound(outcome.result);
    } catch {
      /* audio not unlocked yet */
    }
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => setResult(null), RESULT_VISIBLE_MS);
  }, []);

  // Validate one accepted QR and persist it (best-effort), just like the
  // secretary's Live scanner does.
  const processScan = useCallback(
    async (value: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const outcome = await validateLiveScan(value);
        if (!mountedRef.current) return;
        showOutcome(outcome);
        void saveScanHistory({ outcome, scannedBy: null }).catch(() => {});
        if (outcome.result === 'PASS' && outcome.qrCodeId) {
          void mirrorToAuditLog(outcome, outcome.qrCodeId, null).catch(() => {});
        }
      } catch {
        /* keep scanning even if a single validation fails */
      } finally {
        processingRef.current = false;
      }
    },
    [showOutcome]
  );

  // Start the bottom-half camera and begin decoding QR codes from it.
  const startPreviewCamera = useCallback(async () => {
    if (!previewVideoRef.current) return;
    try {
      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserQRCodeReader(hints);

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const backCamera =
        devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];
      const deviceId = backCamera?.deviceId || undefined;
      const hiRes = { width: { ideal: 1280 }, height: { ideal: 720 } };
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, ...hiRes }
          : { facingMode: 'environment', ...hiRes },
      };

      const onResult = (r: Result | undefined) => {
        if (!r) return;
        const value = r.getText();
        const now = Date.now();
        const decision = evaluateScanGate(value, now, gateRef.current);
        if (!decision.accept) return;
        gateRef.current = nextGateState(value, now);
        void processScan(value);
      };

      let controls: IScannerControls;
      try {
        controls = await reader.decodeFromConstraints(constraints, previewVideoRef.current, onResult);
      } catch {
        controls = await reader.decodeFromVideoDevice(deviceId, previewVideoRef.current, onResult);
      }
      controlsRef.current = controls;
      previewStreamRef.current = (previewVideoRef.current.srcObject as MediaStream) ?? null;
      setCameraError(null);
    } catch {
      setCameraError('Δεν ήταν δυνατή η πρόσβαση στην κάμερα.');
    }
  }, [processScan]);

  // First tap: unlock audio (TV/browser autoplay policy) + start camera preview
  // + go fullscreen.
  const handleStart = useCallback(async () => {
    await primeAudio();
    setStarted(true);
    // Give React a tick to mount the <video> element before attaching the camera.
    setTimeout(() => {
      if (mountedRef.current) void startPreviewCamera();
    }, 300);
    try {
      await rootRef.current?.requestFullscreen?.();
    } catch {
      /* fullscreen may be blocked; harmless */
    }
  }, [startPreviewCamera]);

  // Release the camera + decoder on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        controlsRef.current?.stop();
      } catch {
        /* no-op */
      }
      controlsRef.current = null;
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
      previewStreamRef.current = null;
    };
  }, []);

  const t = result ? theme(result.result) : null;

  return (
    <div
      ref={rootRef}
      onClick={!started ? handleStart : undefined}
      className="min-h-screen h-screen w-full flex flex-col text-white bg-gray-900 overflow-hidden"
    >
      {/* Start overlay (until the first tap unlocks audio) — full screen */}
      {!started && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center cursor-pointer select-none">
            <Radio className="h-16 w-16 mx-auto mb-6 text-emerald-400" />
            <div className="text-4xl font-bold mb-3">Οθόνη Αποτελεσμάτων</div>
            <div className="text-xl text-gray-300">Πατήστε οπουδήποτε για έναρξη</div>
            <div className="mt-8 text-sm text-gray-400">
              {connected ? '● Συνδεδεμένο' : '○ Σύνδεση…'}
            </div>
          </div>
        </div>
      )}

      {/* ===== TOP HALF (larger): scan result ===== */}
      {started && (
        <div
          className={`flex-[3] min-h-0 w-full flex items-center justify-center p-6 overflow-hidden ${
            result ? `bg-gradient-to-br ${t!.bg}` : 'bg-gray-900'
          }`}
        >
          {/* Idle (started, no scan yet) */}
          {!result && (
            <div className="text-center">
              <UserIcon className="h-24 w-24 mx-auto mb-6 opacity-30" />
              <div className="text-5xl font-bold text-gray-200">Αναμονή σάρωσης…</div>
              <div className="mt-6 text-lg text-gray-400">
                {connected ? '● Συνδεδεμένο' : '○ Σύνδεση…'}
              </div>
            </div>
          )}

          {/* Result — compact so the whole panel always fits (no scrollbar) */}
          {result && t && (
            <div className="w-full max-w-4xl h-full overflow-hidden flex flex-col items-center justify-center text-center gap-[1.2vh]">
              <div className="flex items-center justify-center gap-4">
                <t.Icon className="h-[7vh] w-[7vh] drop-shadow-lg shrink-0" />
                <div className="text-[8vh] leading-none font-extrabold tracking-wider">{t.label}</div>
              </div>

              {result.user?.photo ? (
                <img
                  src={result.user.photo}
                  alt={result.user?.name || ''}
                  className="h-[14vh] w-[14vh] rounded-full object-cover ring-4 ring-white/40"
                />
              ) : (
                <div className="h-[14vh] w-[14vh] rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                  <UserIcon className="h-[8vh] w-[8vh]" />
                </div>
              )}

              {result.user?.name && (
                <div className="text-[4.5vh] leading-tight font-bold">{result.user.name}</div>
              )}

              <div className="text-[3vh] leading-tight opacity-95">
                {subscriptionStatusLabel(result.subscriptionStatus)}
              </div>

              {/* Active subscriptions with expiry date(s) */}
              {result.user?.subscriptions && result.user.subscriptions.length > 0 && (
                <div className="w-full max-w-2xl mx-auto space-y-[0.8vh]">
                  {result.user.subscriptions.map((s, i) => (
                    <div
                      key={i}
                      className="text-[2.4vh] bg-white/15 rounded-xl px-5 py-[0.8vh] flex items-center justify-between gap-6"
                    >
                      <span className="font-semibold truncate">{s.packageName}</span>
                      {s.endDate ? (
                        <span className="opacity-95 whitespace-nowrap">Λήξη: {formatExpiryDate(s.endDate)}</span>
                      ) : (
                        <span className="opacity-70 whitespace-nowrap text-[2vh]">χωρίς λήξη</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[2.4vh] opacity-90">{formatScanTime(result.scanTime)}</div>
              {result.reason && <div className="text-[2vh] opacity-80">{result.reason}</div>}
            </div>
          )}
        </div>
      )}

      {/* ===== BOTTOM HALF (smaller): live camera preview (aiming mirror) ===== */}
      {started && (
        <div className="flex-[2] min-h-0 w-full relative bg-black border-t-4 border-gray-700">
          <video
            ref={previewVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-lg md:text-xl font-medium px-4 py-1.5 rounded-full pointer-events-none">
            Σημαδέψτε το QR στην κάμερα
          </div>
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-center p-4">
              <div>
                <XCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="text-lg text-red-200">{cameraError}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabletDisplay;
