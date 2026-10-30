// Synthesized sound effects (no audio files, so everything works offline) + read-aloud speech.
let ctx = null, master = null, on = true;

export function setSound(v) { on = v; if (!v && 'speechSynthesis' in window) speechSynthesis.cancel(); }
export function soundOn() { return on; }

export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, at, dur, type = 'sine', vol = 0.3, glideTo = 0) {
  if (!on || !ctx) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap() { tone(660, 0, 0.07, 'sine', 0.15); },
  flip() { tone(420, 0, 0.12, 'sine', 0.16, 840); },
  right() {
    tone(784, 0, 0.16, 'triangle', 0.28);
    tone(1175, 0.09, 0.3, 'triangle', 0.26);
  },
  // Gentle, never harsh: a soft low "hmm", not a buzzer.
  wrong() { tone(330, 0, 0.18, 'sine', 0.2, 262); tone(262, 0.16, 0.24, 'sine', 0.16); },
  place() { tone(520, 0, 0.1, 'sine', 0.18, 700); },
  win() {
    const arp = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093];
    arp.forEach((f, i) => tone(f, i * 0.09, 0.32, 'triangle', 0.26));
    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 0.72, 1.1, 'triangle', 0.16));
    for (let i = 0; i < 10; i++) tone(1800 + Math.random() * 1800, 0.8 + i * 0.07, 0.15, 'sine', 0.05);
  },
};

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /en[-_]US/i.test(v.lang) && /female|google/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

export function speak(text, { rate = 0.92, pitch = 1.1 } = {}) {
  if (!on || !text || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    // "____" blanks read badly; say "blank" instead.
    const u = new SpeechSynthesisUtterance(String(text).replace(/_{2,}/g, ' blank '));
    if (voice) u.voice = voice;
    u.rate = rate; u.pitch = pitch; u.volume = 1;
    speechSynthesis.speak(u);
  } catch { /* speech is a bonus, never required */ }
}

export function hush() { try { speechSynthesis.cancel(); } catch {} }
