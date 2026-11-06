// Ears: listens to the music (microphone / loopback device, or a dropped playlist, or a fake demo beat)
// and turns it into band levels 0..1, a steady beat clock, "gap" events (silence between tracks) and "drop" events
// (the bass slams back in after a quieter stretch; if a track has none, a strong beat every ~45 s stands in for one).
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export class Ears {
  constructor() {
    this.mode = "none"; // mic | files | demo | none
    this.bass = 0; this.mid = 0; this.high = 0; this.level = 0;
    this.pulse = 0; // 1 on a beat, decays
    this.beatIndex = 0; this.period = 0.5; this.active = false;
    this.lastBeat = 0; this.nextBeat = 0;
    this.handlers = { beat: [], gap: [], track: [], drop: [] };
    this.fast = 0; this.slow = 0; this.lowSince = -1; this.armed = false; this.lastDrop = -99; this.tPrev = 0;
    this.hist = []; this.onsets = []; this.lastOnset = -9; this.misfits = [];
    this.norm = { bass: [1e-9, 1e-6], mid: [1e-9, 1e-6], high: [1e-9, 1e-6], level: [1e-9, 1e-6] };
    this.longAvg = 0; this.quietSince = -1; this.lastGap = -99;
    this.playlist = []; this.track = -1;
  }
  on(ev, fn) { this.handlers[ev].push(fn); }
  emit(ev, ...a) { this.handlers[ev].forEach((f) => f(...a)); }
  now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; }

  ensureCtx() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (!this.an) {
      this.an = this.ctx.createAnalyser();
      this.an.fftSize = 2048;
      this.an.smoothingTimeConstant = 0;
      this.spec = new Float32Array(this.an.frequencyBinCount);
    }
  }
  async startMic(deviceId) {
    this.ensureCtx();
    this.stopSource();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.stream = stream;
    this.src = this.ctx.createMediaStreamSource(stream);
    this.src.connect(this.an); // not to the speakers
    this.mode = "mic";
  }
  startFiles(files) {
    this.ensureCtx();
    this.stopSource();
    this.playlist = [...files].filter((f) => f.type.startsWith("audio") || /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name));
    if (!this.playlist.length) return false;
    this.el = new Audio();
    this.src = this.ctx.createMediaElementSource(this.el);
    this.src.connect(this.an);
    this.an.connect(this.ctx.destination);
    this.el.addEventListener("ended", () => this.playTrack(this.track + 1));
    this.mode = "files";
    this.track = -1;
    this.playTrack(0);
    return true;
  }
  playTrack(i) {
    if (!this.playlist.length) return;
    this.track = ((i % this.playlist.length) + this.playlist.length) % this.playlist.length;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(this.playlist[this.track]);
    this.el.src = this.url;
    this.el.play();
    if (i > 0) this.emit("track", this.playlist[this.track].name);
  }
  startDemo() { this.ensureCtx(); this.stopSource(); this.mode = "demo"; this.period = 60 / 118; this.active = true; this.nextBeat = this.now() + 0.2; }
  stopSource() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.el) { this.el.pause(); this.el = null; }
    if (this.src) { try { this.src.disconnect(); } catch {} }
    try { this.an.disconnect(); } catch {}
    this.stream = this.src = null;
    this.active = false;
  }

  /** beat phase 0..1 since the last beat */
  get phase() { return this.active ? clamp((this.now() - this.lastBeat) / this.period) : 0; }
  get bpm() { return Math.round(60 / this.period); }

  band(lo, hi) {
    const hz = this.ctx.sampleRate / this.an.fftSize;
    const a = Math.max(1, Math.floor(lo / hz)), b = Math.min(this.spec.length - 1, Math.ceil(hi / hz));
    let s = 0;
    for (let i = a; i <= b; i++) s += Math.pow(10, this.spec[i] / 10);
    return s / (b - a + 1);
  }
  /** adaptive 0..1: tracks a slowly decaying peak and floor in log space */
  normal(key, e) {
    const v = Math.log10(e + 1e-12), n = this.norm[key];
    n[0] = v < n[0] || n[0] < -11 ? v : n[0] + (v - n[0]) * 0.002; // floor creeps up
    n[1] = v > n[1] ? v : n[1] - 0.0015; // peak decays
    if (n[1] - n[0] < 1.2) n[0] = n[1] - 1.2;
    return clamp((v - n[0]) / (n[1] - n[0]));
  }

  update() {
    const t = this.now();
    this.pulse *= 0.86;
    if (this.mode === "demo") {
      const ph = this.phase;
      this.bass = clamp(1 - ph * 1.6) * 0.9 + 0.1;
      this.mid = 0.45 + 0.25 * Math.sin(t * 3.1) + 0.15 * Math.sin(t * 7.3);
      this.high = 0.3 + 0.3 * ((ph * 2) % 1 < 0.2 ? 1 : 0);
      this.level = 0.6 + 0.2 * Math.sin(t * 0.7);
      this.tickClock(t);
      return;
    }
    if (!this.an || (this.mode !== "mic" && this.mode !== "files")) { this.bass = this.mid = this.high = this.level = 0; return; }
    this.an.getFloatFrequencyData(this.spec);
    const eb = this.band(45, 140), em = this.band(300, 2000), eh = this.band(3000, 9000), el = this.band(45, 9000);
    const k = 0.5; // light smoothing for visuals
    this.bass += (this.normal("bass", eb) - this.bass) * k;
    this.mid += (this.normal("mid", em) - this.mid) * 0.3;
    this.high += (this.normal("high", eh) - this.high) * 0.4;
    this.level += (this.normal("level", el) - this.level) * 0.15;

    // onset on the bass band: energy jump against the last ~0.8 s
    this.hist.push(eb);
    if (this.hist.length > 48) this.hist.shift();
    const avg = this.hist.reduce((a, b) => a + b, 0) / this.hist.length;
    const prev = this.hist[this.hist.length - 2] || 0;
    if (eb > avg * 1.45 && eb > prev * 1.1 && t - this.lastOnset > 0.24 && this.bass > 0.35) this.onset(t, eb / avg);

    // silence between tracks (only meaningful for mic / loopback)
    if (this.quietSince < 0 && el > 0) this.longAvg = this.longAvg ? this.longAvg * 0.995 + el * 0.005 : el;
    if (el < this.longAvg * 0.04) { if (this.quietSince < 0) this.quietSince = t; }
    else if (this.quietSince >= 0) {
      if (t - this.quietSince > 0.7 && el > this.longAvg * 0.25 && t - this.lastGap > 20) { this.lastGap = t; this.emit("gap"); }
      if (el > this.longAvg * 0.1) this.quietSince = -1;
    }
    this.watchDrop(t, eb);
    this.tickClock(t);
  }

  /** a drop: bass energy back above its long average after at least 1.5 s well below it */
  watchDrop(t, eb) {
    const dt = clamp(t - this.tPrev, 0, 0.1);
    this.tPrev = t;
    this.fast += (eb - this.fast) * clamp(dt / 0.3);
    this.slow = this.slow ? this.slow + (eb - this.slow) * clamp(dt / 6) : eb;
    if (this.fast < this.slow * 0.45) { if (this.lowSince < 0) this.lowSince = t; if (t - this.lowSince > 1.5) this.armed = true; }
    else this.lowSince = -1;
    if (this.armed && this.fast > this.slow * 1.2 && t - this.lastDrop > 15) this.drop(t);
  }
  drop(t) { this.armed = false; this.lastDrop = t; this.emit("drop"); }

  onset(t, strength) {
    const ioi = t - this.lastOnset;
    this.lastOnset = t;
    if (ioi < 2) {
      let f = ioi;
      while (f < 0.33) f *= 2;
      while (f > 0.75) f /= 2;
      if (Math.abs(f - this.period) < this.period * 0.12) { this.period += (f - this.period) * 0.15; this.misfits = []; }
      else {
        this.misfits.push(f);
        if (this.misfits.length >= 4) { const m = [...this.misfits].sort((a, b) => a - b); this.period = m[2]; this.misfits = []; }
      }
    }
    if (!this.active) {
      if (ioi < 1.2) { this.active = true; this.fire(t, strength); }
      return;
    }
    const toNext = this.nextBeat - t, sincePrev = t - this.lastBeat;
    if (toNext < this.period * 0.22) this.fire(t, strength); // a little early: snap the grid to the kick
    else if (sincePrev < this.period * 0.22) { this.nextBeat += sincePrev * 0.5; this.lastBeat += sincePrev * 0.5; }
  }
  fire(t, strength = 1) {
    this.lastBeat = t;
    this.nextBeat = t + this.period;
    this.beatIndex++;
    this.pulse = 1;
    this.emit("beat", this.beatIndex, strength);
    // demo: a drop every 8 bars; real music: a stand-in drop on a beat when none was heard for 45 s
    if (this.mode === "demo" ? this.beatIndex % 32 === 0 : t - this.lastDrop > 45) this.drop(t);
  }
  tickClock(t) {
    if (!this.active) return;
    if (this.mode !== "demo" && t - this.lastOnset > 4) { this.active = false; return; }
    if (t >= this.nextBeat) this.fire(this.nextBeat > t - 0.1 ? t : t, 0.6);
  }
}
