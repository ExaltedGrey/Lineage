/**
 * Lightweight Web Audio API sound effects for playful kid-friendly feedback.
 * Zero external files needed; respects user mute toggle.
 */

let audioCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, startOffset, duration, type = 'sine', volume = 0.11) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playCorrectSound(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0, 0.14, 'triangle', 0.12);     // C5
  playTone(659.25, 0.08, 0.22, 'triangle', 0.12);  // E5
}

export function playWrongSound(enabled = true) {
  if (!enabled) return;
  playTone(293.66, 0, 0.12, 'sine', 0.09);         // D4
  playTone(246.94, 0.09, 0.16, 'sine', 0.08);      // B3
}

export function playUnsealSound(enabled = true) {
  if (!enabled) return;
  playTone(440, 0, 0.1, 'triangle', 0.1);          // A4
  playTone(587.33, 0.07, 0.12, 'triangle', 0.1);   // D5
  playTone(880, 0.14, 0.24, 'sine', 0.09);         // A5
}

export function playFanfareSound(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0, 0.14, 'triangle', 0.12);     // C5
  playTone(659.25, 0.1, 0.14, 'triangle', 0.12);   // E5
  playTone(783.99, 0.2, 0.16, 'triangle', 0.12);   // G5
  playTone(1046.5, 0.32, 0.38, 'triangle', 0.14);  // C6
}
