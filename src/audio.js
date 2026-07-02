// All audio is generated with the Web Audio API — no sound files.
// The AudioContext can only start after a user gesture, so ensure() is
// called from input handlers; everything degrades silently before that.
const AudioSys = {
  ctx: null,
  master: null,
  sfxBus: null,
  musicBus: null,
  muted: false,
  volume: 0.8,
  intensity: 1,        // current round (1..10); drives music layering
  chargeOsc: null,
  chargeGain: null,
  musicTimer: null,
  step: 0,
  nextNoteTime: 0,
  _noiseBuf: null,

  // Perceptual volume: human loudness is logarithmic, so a linear slider
  // mapped straight to gain sounds like it does nothing over most of its
  // range. Squaring the slider value spreads the audible change out.
  masterGainValue() {
    return this.muted ? 0 : this.volume * this.volume;
  },

  applyMasterGain() {
    if (!this.master) return;
    // short ramp avoids zipper noise while dragging the slider
    this.master.gain.setTargetAtTime(this.masterGainValue(), this.ctx.currentTime, 0.02);
  },

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterGainValue();
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.5;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.16;
      this.musicBus.connect(this.master);
      this.startMusic();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    this.applyMasterGain();
    return this.muted;
  },

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, v));
    this.muted = false;   // adjusting volume always unmutes
    this.applyMasterGain();
  },

  setIntensity(round) {
    this.intensity = Math.min(10, Math.max(1, round));
  },

  // --- helpers ---

  note(freq, when, dur, type, vol, dest) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g).connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  },

  noiseBuffer() {
    if (!this._noiseBuf) {
      const len = this.ctx.sampleRate;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this._noiseBuf;
  },

  noise(when, dur, vol, filterFrom, filterTo) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(filterFrom, when);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, filterTo), when + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(when);
    src.stop(when + dur + 0.02);
  },

  // --- SFX ---

  fire() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.25);
    this.noise(t, 0.08, 0.25, 2500, 400);
  },

  explosion() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.7, 0.7, 2800, 120);
    // sub-bass thump
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.5);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.6);
  },

  hit(pts) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = pts >= 100 ? [660, 880, 1320] : pts >= 70 ? [660, 880] : [660];
    notes.forEach((f, i) => this.note(f, t + 0.12 + i * 0.09, 0.22, 'sine', 0.35, this.sfxBus));
  },

  miss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.22);
  },

  startCharge() {
    if (!this.ctx || this.chargeOsc) return;
    this.chargeOsc = this.ctx.createOscillator();
    this.chargeGain = this.ctx.createGain();
    this.chargeOsc.type = 'triangle';
    this.chargeOsc.frequency.value = 140;
    this.chargeGain.gain.value = 0.1;
    this.chargeOsc.connect(this.chargeGain).connect(this.sfxBus);
    this.chargeOsc.start();
  },

  setCharge(power) {
    if (this.chargeOsc) this.chargeOsc.frequency.value = 100 + power * 3.2;
  },

  stopCharge() {
    if (!this.chargeOsc) return;
    this.chargeOsc.stop();
    this.chargeOsc = null;
    this.chargeGain = null;
  },

  jingle(result) {  // 'win' | 'lose' | 'draw'
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.3;
    const seqs = {
      win:  [523.25, 659.25, 783.99, 1046.5],
      lose: [392, 311.13, 261.63, 196],
      draw: [440, 440],
    };
    seqs[result].forEach((f, i) =>
      this.note(f, t + i * 0.16, 0.3, 'triangle', 0.4, this.sfxBus));
  },

  // --- music: 16-step chiptune loop, A minor pentatonic ---

  // The game loop (rAF) pauses when the tab is hidden; suspend audio too so
  // music doesn't keep playing over a frozen game.
  handleVisibility() {
    if (!this.ctx) return;
    if (document.visibilityState === 'hidden') this.ctx.suspend();
    else this.ctx.resume();
  },

  // Layers stack as rounds progress (intensity = current round):
  //   1+  bass line
  //   2+  melody
  //   4+  hi-hat ticks on even steps
  //   6+  melody doubled an octave up
  //   8+  hats every step + off-beat octave bass
  // Tempo also climbs from ~92 to ~110 bpm across the game.

  hat(when, vol) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    src.connect(f).connect(g).connect(this.musicBus);
    src.start(when);
    src.stop(when + 0.06);
  },

  startMusic() {
    const BASS = [
      110, 0, 110, 0, 87.31, 0, 87.31, 0,
      98, 0, 98, 0, 110, 0, 130.81, 98,
    ];
    const MELODY = [
      440, 0, 523.25, 587.33, 0, 440, 0, 0,
      659.25, 0, 587.33, 523.25, 0, 440, 0, 0,
    ];
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;

    this.musicTimer = setInterval(() => {
      while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
        const lvl = this.intensity;
        const bpm = 90 + lvl * 2;
        const stepDur = 60 / bpm / 2;   // eighth notes
        const i = this.step % 16;
        const t = this.nextNoteTime;

        if (BASS[i]) this.note(BASS[i], t, stepDur * 1.8, 'triangle', 0.5, this.musicBus);
        if (lvl >= 2 && MELODY[i]) this.note(MELODY[i], t, stepDur * 1.3, 'square', 0.12, this.musicBus);
        if (lvl >= 4 && (lvl >= 8 || i % 2 === 0)) this.hat(t, lvl >= 8 ? 0.09 : 0.06);
        if (lvl >= 6 && MELODY[i]) this.note(MELODY[i] * 2, t, stepDur, 'square', 0.05, this.musicBus);
        if (lvl >= 8 && i % 4 === 2) {
          const barRoot = BASS[i - (i % 4)] || 110;
          this.note(barRoot * 2, t, stepDur * 0.9, 'triangle', 0.25, this.musicBus);
        }

        this.step++;
        this.nextNoteTime += stepDur;
      }
    }, 30);
  },
};

document.addEventListener('visibilitychange', () => AudioSys.handleVisibility());
