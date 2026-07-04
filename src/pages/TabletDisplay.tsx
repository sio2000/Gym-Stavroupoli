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
import { supabase } from '@/config/supabase';
import { primeAudio, playResultSound, disposeAudio } from '@/utils/scannerSounds';
import {
  formatScanTime,
  formatExpiryDate,
  subscriptionStatusLabel,
  LIVE_SCAN_CHANNEL,
  LIVE_SCAN_EVENT,
} from '@/utils/liveScannerLogic';
import type { LiveScanOutcome } from '@/services/qrScanHistoryService';

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
  const rootRef = useRef<HTMLDivElement>(null);

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
      })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
      disposeAudio();
    };
  }, []);

  // First tap: unlock audio (TV/browser autoplay policy) + go fullscreen.
  const handleStart = useCallback(async () => {
    await primeAudio();
    setStarted(true);
    try {
      await rootRef.current?.requestFullscreen?.();
    } catch {
      /* fullscreen may be blocked; harmless */
    }
  }, []);

  const t = result ? theme(result.result) : null;

  return (
    <div
      ref={rootRef}
      onClick={!started ? handleStart : undefined}
      className={`min-h-screen w-full flex items-center justify-center p-6 text-white ${
        result ? `bg-gradient-to-br ${t!.bg}` : 'bg-gray-900'
      }`}
    >
      {/* Start overlay (until the first tap unlocks audio) */}
      {!started && (
        <div className="text-center cursor-pointer select-none">
          <Radio className="h-16 w-16 mx-auto mb-6 text-emerald-400" />
          <div className="text-4xl font-bold mb-3">Οθόνη Αποτελεσμάτων</div>
          <div className="text-xl text-gray-300">Πατήστε οπουδήποτε για έναρξη</div>
          <div className="mt-8 text-sm text-gray-400">
            {connected ? '● Συνδεδεμένο' : '○ Σύνδεση…'}
          </div>
        </div>
      )}

      {/* Idle (started, no scan yet) */}
      {started && !result && (
        <div className="text-center">
          <UserIcon className="h-24 w-24 mx-auto mb-6 opacity-30" />
          <div className="text-5xl font-bold text-gray-200">Αναμονή σάρωσης…</div>
          <div className="mt-6 text-lg text-gray-400">
            {connected ? '● Συνδεδεμένο' : '○ Σύνδεση…'}
          </div>
        </div>
      )}

      {/* Result */}
      {started && result && t && (
        <div className="w-full max-w-5xl flex flex-col items-center justify-center text-center">
          <t.Icon className="h-40 w-40 md:h-52 md:w-52 mb-6 drop-shadow-lg" />
          <div className="text-7xl md:text-9xl font-extrabold tracking-wider mb-8">{t.label}</div>

          {result.user?.photo ? (
            <img
              src={result.user.photo}
              alt={result.user?.name || ''}
              className="h-40 w-40 md:h-48 md:w-48 rounded-full object-cover ring-8 ring-white/40 mb-6"
            />
          ) : (
            <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/20 flex items-center justify-center ring-8 ring-white/30 mb-6">
              <UserIcon className="h-24 w-24" />
            </div>
          )}

          {result.user?.name && (
            <div className="text-5xl md:text-6xl font-bold mb-4">{result.user.name}</div>
          )}

          <div className="text-3xl md:text-4xl opacity-95 mb-2">
            {subscriptionStatusLabel(result.subscriptionStatus)}
          </div>

          {/* Active subscriptions with expiry date(s) */}
          {result.user?.subscriptions && result.user.subscriptions.length > 0 && (
            <div className="mt-4 w-full max-w-2xl mx-auto space-y-2">
              {result.user.subscriptions.map((s, i) => (
                <div
                  key={i}
                  className="text-2xl md:text-3xl bg-white/15 rounded-2xl px-6 py-3 flex items-center justify-between gap-6"
                >
                  <span className="font-semibold truncate">{s.packageName}</span>
                  {s.endDate ? (
                    <span className="opacity-95 whitespace-nowrap">Λήξη: {formatExpiryDate(s.endDate)}</span>
                  ) : (
                    <span className="opacity-70 whitespace-nowrap text-xl">χωρίς λήξη</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-2xl md:text-3xl opacity-90">{formatScanTime(result.scanTime)}</div>
          {result.reason && <div className="mt-3 text-xl md:text-2xl opacity-80">{result.reason}</div>}
        </div>
      )}
    </div>
  );
};

export default TabletDisplay;
