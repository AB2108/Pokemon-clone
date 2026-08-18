/* =========================================================================
   FISCHMON — Chiptune-Audio (Web Audio API, keine externen Dateien)
   Hintergrundmusik + Soundeffekte im Game-Boy-Stil.
   ========================================================================= */
const Sound = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let muted = false;
  let cur = null;          // aktueller Musiktitel
  let sched = null;        // Scheduler-Intervall
  let step = 0, nextTime = 0;
  const LOOK = 0.14, TICK = 25;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---- Musiktitel (lead = Melodie/Square, bass = Triangle) ---- */
  const R = null;
  const TRACKS = {
    title: {
      tempo: 0.19,
      lead: [72, 76, 79, 84, 83, 79, 76, 79, 77, 81, 84, 81, 79, R, 74, R],
      bass: [48, 48, 55, 55, 52, 52, 55, 55, 53, 53, 57, 57, 55, 55, 50, 55]
    },
    overworld: {
      tempo: 0.15,
      lead: [72, 76, 79, 76, 69, 72, 76, 72, 74, 77, 81, 77, 79, 76, 72, R,
             71, 74, 79, 74, 69, 72, 76, 72, 77, 74, 71, 74, 72, R, 67, R],
      bass: [48, 55, 52, 55, 45, 52, 48, 52, 50, 57, 53, 57, 55, 52, 48, 48,
             47, 54, 50, 54, 45, 52, 48, 52, 53, 50, 47, 50, 48, 48, 43, 43]
    },
    battle: {
      tempo: 0.11,
      lead: [69, 72, 76, 72, 68, 71, 74, 71, 69, 72, 76, 79, 76, 72, 69, R,
             81, 79, 76, 72, 80, 77, 74, 71, 69, 72, 76, 79, 81, 79, 76, R],
      bass: [45, 45, 45, 45, 44, 44, 44, 44, 45, 45, 45, 45, 40, 40, 43, 43,
             45, 45, 45, 45, 44, 44, 44, 44, 45, 45, 45, 45, 40, 43, 45, 45]
    }
  };

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.30; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
  }

  function tone(dest, type, freq, start, dur, vol) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    const g = ctx.createGain();
    const a = 0.004, rel = Math.min(0.09, dur * 0.5);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + a);
    g.gain.setValueAtTime(vol, start + Math.max(a, dur - rel));
    g.gain.linearRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function sweep(dest, type, f1, f2, start, dur, vol) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f1, start);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), start + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function noise(dest, start, dur, vol) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(dest); src.start(start);
  }

  function scheduleStep() {
    if (!cur || !ctx || ctx.state !== 'running') return;
    const tr = TRACKS[cur];
    while (nextTime < ctx.currentTime + LOOK) {
      const i = step % tr.lead.length;
      const dur = tr.tempo;
      const ln = tr.lead[i];
      if (ln != null) tone(musicGain, 'square', mtof(ln), nextTime, dur * 0.92, 0.5);
      const bn = tr.bass[i];
      if (bn != null) tone(musicGain, 'triangle', mtof(bn), nextTime, dur * 0.98, 0.7);
      nextTime += dur;
      step++;
    }
  }

  function startSched(reset) {
    if (!ctx) return;
    if (reset || nextTime < ctx.currentTime) { step = 0; nextTime = ctx.currentTime + 0.06; }
    if (!sched) sched = setInterval(scheduleStep, TICK);
  }

  /* ---- öffentliche API ---- */
  function music(name) {
    ensure(); if (!ctx) return;
    if (cur === name) return;
    cur = name;
    if (ctx.state === 'running') startSched(true);
  }
  function stop() { cur = null; }

  function resume() {
    ensure(); if (!ctx) return;
    if (ctx.state !== 'running') { ctx.resume().then(() => startSched(true)).catch(() => {}); }
    else startSched(false);
  }

  function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.55; return muted; }
  function setMuted(m) { muted = m; if (master) master.gain.value = muted ? 0 : 0.55; }
  function isMuted() { return muted; }

  function sfx(name) {
    ensure(); if (!ctx || muted) return;
    const t = ctx.currentTime, S = sfxGain;
    switch (name) {
      case 'cursor': tone(S, 'square', 880, t, 0.05, 0.35); break;
      case 'select': tone(S, 'square', 660, t, 0.05, 0.4); tone(S, 'square', 990, t + 0.05, 0.07, 0.4); break;
      case 'back':   tone(S, 'square', 440, t, 0.06, 0.35); break;
      case 'bump':   tone(S, 'square', 130, t, 0.07, 0.4); break;
      case 'hit':    noise(S, t, 0.12, 0.35); tone(S, 'square', 180, t, 0.10, 0.4); break;
      case 'superhit': noise(S, t, 0.18, 0.5); sweep(S, 'sawtooth', 300, 90, t, 0.20, 0.5); break;
      case 'weakhit': tone(S, 'square', 320, t, 0.06, 0.3); break;
      case 'faint':  sweep(S, 'square', 500, 90, t, 0.5, 0.45); break;
      case 'run':    sweep(S, 'square', 700, 1200, t, 0.18, 0.35); break;
      case 'throw':  sweep(S, 'sine', 400, 900, t, 0.15, 0.4); break;
      case 'catch': {
        [523, 659, 784].forEach((f, i) => tone(S, 'square', f, t + i * 0.09, 0.09, 0.45));
        tone(S, 'square', 1046, t + 0.30, 0.22, 0.5); break;
      }
      case 'levelup': {
        [523, 659, 784, 1046].forEach((f, i) => tone(S, 'square', f, t + i * 0.07, 0.09, 0.45)); break;
      }
      case 'victory': {
        const seq = [[784, 0.12], [784, 0.12], [784, 0.12], [1046, 0.34]];
        let a = 0; seq.forEach(([f, d]) => { tone(S, 'square', f, t + a, d * 0.9, 0.5); tone(S, 'triangle', f / 2, t + a, d * 0.9, 0.5); a += d; }); break;
      }
      default: break;
    }
  }

  return { music, stop, sfx, resume, toggleMute, setMuted, isMuted };
})();
window.Sound = Sound;
