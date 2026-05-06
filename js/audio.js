/* ============================================================
   Dice Throne — Web Audio synthesized SFX
   No external assets. All sounds generated procedurally.
   ============================================================ */

const Audio = (function () {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    return ctx;
  }

  function tone(freq, duration, type = 'sine', vol = 0.18, attack = 0.01, decay = null) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    const release = decay || duration;
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + release);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + release + 0.05);
  }

  function noise(duration, vol = 0.15, filterFreq = 1200) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
    src.stop(t0 + duration);
  }

  // ===== High-level SFX =====
  function diceRoll() {
    noise(0.35, 0.22, 1800);
    tone(180, 0.18, 'square', 0.06);
    setTimeout(() => tone(220, 0.12, 'square', 0.05), 100);
    setTimeout(() => tone(260, 0.08, 'square', 0.04), 200);
  }

  function diceLand() {
    tone(80, 0.06, 'square', 0.18);
    noise(0.08, 0.18, 600);
  }

  function diceLock() {
    tone(880, 0.06, 'sine', 0.1);
    tone(1320, 0.08, 'sine', 0.07);
  }

  function buttonClick() {
    tone(660, 0.04, 'square', 0.06);
    tone(990, 0.04, 'square', 0.04);
  }

  function abilityCast(strong = false) {
    if (strong) {
      tone(200, 0.4, 'sawtooth', 0.18, 0.02, 0.5);
      tone(400, 0.3, 'sawtooth', 0.14, 0.05, 0.4);
      tone(800, 0.2, 'sine', 0.08, 0.05, 0.3);
    } else {
      tone(440, 0.18, 'triangle', 0.14);
      tone(660, 0.14, 'triangle', 0.1);
    }
  }

  function hit(big = false) {
    noise(big ? 0.25 : 0.12, big ? 0.3 : 0.2, big ? 800 : 1500);
    tone(big ? 60 : 120, big ? 0.18 : 0.08, 'square', big ? 0.25 : 0.16);
  }

  function crit() {
    noise(0.3, 0.32, 600);
    tone(50, 0.3, 'square', 0.3);
    setTimeout(() => tone(110, 0.2, 'square', 0.2), 50);
    setTimeout(() => tone(880, 0.15, 'sine', 0.16), 80);
  }

  function heal() {
    tone(523, 0.1, 'sine', 0.12);
    setTimeout(() => tone(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => tone(784, 0.16, 'sine', 0.14), 160);
  }

  function miss() {
    tone(300, 0.08, 'sine', 0.06);
    tone(220, 0.1, 'sine', 0.05);
  }

  function status() {
    tone(440, 0.06, 'triangle', 0.08);
    setTimeout(() => tone(660, 0.06, 'triangle', 0.08), 60);
  }

  function turnStart(isYou) {
    const base = isYou ? 523 : 392;
    tone(base, 0.18, 'sine', 0.12);
    setTimeout(() => tone(base * 1.5, 0.18, 'sine', 0.1), 100);
    setTimeout(() => tone(base * 2, 0.22, 'sine', 0.09), 200);
  }

  function victory() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => tone(f, 0.4, 'sine', 0.18), i * 140);
    });
  }

  function defeat() {
    [392, 311, 247, 196].forEach((f, i) => {
      setTimeout(() => tone(f, 0.5, 'sawtooth', 0.14), i * 220);
    });
  }

  function setMuted(v) { muted = !!v; }
  function isMuted() { return muted; }
  function resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

  return {
    diceRoll, diceLand, diceLock, buttonClick, abilityCast, hit, crit,
    heal, miss, status, turnStart, victory, defeat, setMuted, isMuted, resume,
  };
})();

window.GameAudio = Audio;
