// =====================================================================
// Live QR Scanner — Audio feedback (synthetic, Web Audio API)
// =====================================================================
// Zero assets, zero network, instant playback. Works offline & in Capacitor.
//  * PASS  -> short clear rising two-tone "bip-bip" (positive)
//  * DENIED-> short low buzz, distinctly negative
//  * INVALID-> single short neutral-low blip (treated like denied family)
//
// A single shared AudioContext is lazily created and resumed on the first
// user gesture (START SCANNER button), satisfying browser autoplay policies.
// =====================================================================

let audioCtx: AudioContext | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch (e) {
    console.warn('[scannerSounds] AudioContext unavailable:', e);
    return null;
  }
}

/**
 * Must be called from a user gesture (e.g. START SCANNER click) so that the
 * AudioContext is allowed to produce sound afterwards without delay.
 */
export async function primeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (e) {
    console.warn('[scannerSounds] Failed to resume AudioContext:', e);
  }
}

/** Play a single oscillator tone with a soft attack/decay envelope. */
function playTone(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.18
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  // Envelope: quick attack, smooth exponential release (avoids clicks)
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Positive: clear rising two-tone (880Hz -> 1320Hz). */
export function playPassSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void primeAudio();
  const now = ctx.currentTime;
  playTone(ctx, 880, now, 0.12, 'sine', 0.2);
  playTone(ctx, 1320, now + 0.12, 0.16, 'sine', 0.2);
}

/** Negative: low buzz, doubled (220Hz square). Distinct from PASS. */
export function playDeniedSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void primeAudio();
  const now = ctx.currentTime;
  playTone(ctx, 220, now, 0.18, 'square', 0.16);
  playTone(ctx, 180, now + 0.2, 0.22, 'square', 0.16);
}

/** Invalid QR: single short low blip (neutral-negative). */
export function playInvalidSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void primeAudio();
  const now = ctx.currentTime;
  playTone(ctx, 300, now, 0.16, 'sawtooth', 0.14);
}

/** Convenience dispatcher based on a scan result. */
export function playResultSound(result: 'PASS' | 'DENIED' | 'INVALID'): void {
  switch (result) {
    case 'PASS':
      playPassSound();
      break;
    case 'DENIED':
      playDeniedSound();
      break;
    case 'INVALID':
      playInvalidSound();
      break;
  }
}

/** Release audio resources (call on full unmount). */
export function disposeAudio(): void {
  try {
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close();
    }
  } catch {
    /* no-op */
  } finally {
    audioCtx = null;
  }
}
