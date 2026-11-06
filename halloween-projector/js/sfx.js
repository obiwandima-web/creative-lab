// Scare sounds: real samples from sounds/<kind>*.{mp3,wav,ogg,m4a} when present, otherwise synthesized 8-bit placeholders.
// Several files of one kind are variants: a random one plays, unless one was chosen (keys B / K on the page, kept in localStorage).
export const KINDS = ["laugh", "boo", "scream", "cat"];
const EXTRA = ["thunder"]; // loaded and played on cue, never picked as a random scare
const MAX = { laugh: 3.0, boo: 2.8, scream: 4.5, cat: 2.4, thunder: 6.5 };
// levels in dB. Master -16.5 dB (x0.15): was -10.5 dB, then halved (-6 dB) so the scares sit well under the music.
// Per kind on top of it: the BOO screamer a third of before instead of a half (another -3.5 dB, -20 dB in all).
// The teaser is the exception: its thunder (+14 dB, -2.5 in all) and the video's own sound (+6 dB) are meant to be heard over the music.
const MASTER_DB = -16.5, KIND_DB = { laugh: 0, boo: -3.5, scream: 0, cat: 0, thunder: 14, video: 6 };
const db = (v) => Math.pow(10, v / 20), GAIN = Object.fromEntries(Object.entries(KIND_DB).map(([k, v]) => [k, db(v)]));

export class Sfx {
  constructor(ctx) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = db(MASTER_DB);
    this.out.connect(ctx.destination);
    this.samples = Object.fromEntries([...KINDS, ...EXTRA].map((k) => [k, []]));
    this.names = Object.fromEntries([...KINDS, ...EXTRA].map((k) => [k, []]));
    this.pick = {};
    try { this.pick = JSON.parse(localStorage.getItem("hw-sfx-pick") || "{}"); } catch {}
  }
  async load() {
    // the local server lists the folder; a static host (GitHub Pages) has no /sounds-list, so sounds/list.json stands in for it
    let names = null;
    try { names = await (await fetch("/sounds-list")).json(); } catch {}
    if (!Array.isArray(names)) try { names = await (await fetch("sounds/list.json")).json(); } catch { return; }
    await Promise.all(names.map(async (n) => {
      const kind = [...KINDS, ...EXTRA].find((k) => n.toLowerCase().startsWith(k));
      if (!kind) return;
      try {
        const buf = await this.ctx.decodeAudioData(await (await fetch("sounds/" + encodeURIComponent(n))).arrayBuffer());
        this.samples[kind].push({ n, buf });
      } catch (e) { console.warn("sound", n, e); }
    }));
    for (const k of [...KINDS, ...EXTRA]) { this.samples[k].sort((a, b) => (a.n < b.n ? -1 : 1)); this.names[k] = this.samples[k].map((s) => s.n); }
  }
  count(kind) { return this.samples[kind].length; }
  /** the teaser video's sound (teaser/video/sound.wav), played in pieces in step with the picture */
  async loadVideo(url) { try { this.video = await this.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()); } catch (e) { console.warn("video sound", e); } }
  playVideo(from, to) {
    if (!this.video) return;
    this.stopVideo();
    const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.video; g.gain.value = GAIN.video;
    s.connect(g).connect(this.out); s.start(c.currentTime, from, Math.max(0, to - from));
    this.vid = { s, g };
  }
  /** fades the video's sound out (the picture stops on the hand) */
  stopVideo(fade = 0.3) {
    if (!this.vid) return;
    const t = this.ctx.currentTime, { s, g } = this.vid;
    g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); s.stop(t + fade + 0.05);
    this.vid = null;
  }
  /** step the chosen variant of a kind: 1, 2, ... then back to random; returns a label for the HUD */
  next(kind) {
    const n = this.count(kind), cur = this.pick[kind];
    this.pick[kind] = cur === undefined || cur === null ? 0 : cur + 1 < n ? cur + 1 : null;
    try { localStorage.setItem("hw-sfx-pick", JSON.stringify(this.pick)); } catch {}
    return this.label(kind);
  }
  label(kind) { const i = this.pick[kind]; return i === undefined || i === null ? "случайный" : `${i + 1}: ${this.names[kind][i] || "?"}`; }
  play(kind) {
    const list = this.samples[kind];
    if (list.length) {
      const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), t = c.currentTime, max = MAX[kind];
      const i = this.pick[kind];
      s.buffer = list[i !== undefined && i !== null && list[i] ? i : Math.floor(Math.random() * list.length)].buf;
      g.gain.value = GAIN[kind];
      s.connect(g).connect(this.out);
      // long files (a pack of four screams) are cut with a fade to fit the scare
      if (s.buffer.duration > max) { g.gain.setValueAtTime(GAIN[kind], t + max - 0.4); g.gain.linearRampToValueAtTime(0, t + max); s.stop(t + max + 0.05); }
      s.start(t);
      return Math.min(max, s.buffer.duration);
    }
    return this[kind] ? this[kind]() : 0;
  }

  // ---- synth placeholders ----
  voice(type, t0, dur, f0, f1, gain, formant = 900) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    bp.type = "bandpass"; bp.frequency.value = formant; bp.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(bp).connect(g).connect(this.out);
    o.start(t0); o.stop(t0 + dur + 0.05);
    return { o, g, bp };
  }
  vibrato(param, t0, dur, rate, depth) {
    const c = this.ctx, l = c.createOscillator(), g = c.createGain();
    l.frequency.value = rate; g.gain.value = depth;
    l.connect(g).connect(param);
    l.start(t0); l.stop(t0 + dur);
  }
  noise(t0, dur, gain, type = "highpass", freq = 2000) {
    const c = this.ctx, n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b;
    const f = c.createBiquadFilter(), g = c.createGain();
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    n.connect(f).connect(g).connect(this.out);
    n.start(t0);
  }
  laugh() {
    const t = this.ctx.currentTime + 0.02;
    for (let i = 0; i < 7; i++) {
      const s = t + i * 0.19, f = 330 - i * 22;
      this.voice("square", s, 0.15, f * 1.15, f, 0.35, 700);
      this.noise(s, 0.05, 0.08, "bandpass", 1500);
    }
    return 1.5;
  }
  boo() {
    const t = this.ctx.currentTime + 0.02;
    const v = this.voice("sawtooth", t, 1.3, 170, 70, 0.6, 450);
    v.bp.frequency.setValueAtTime(700, t);
    v.bp.frequency.exponentialRampToValueAtTime(260, t + 1.2);
    this.vibrato(v.o.frequency, t, 1.3, 6, 8);
    this.noise(t, 0.35, 0.15, "lowpass", 900);
    return 1.4;
  }
  scream() {
    const t = this.ctx.currentTime + 0.02;
    const v = this.voice("sawtooth", t, 1.8, 900, 1300, 0.45, 1800);
    v.o.frequency.setValueAtTime(900, t);
    v.o.frequency.linearRampToValueAtTime(1500, t + 0.4);
    v.o.frequency.linearRampToValueAtTime(700, t + 1.8);
    this.vibrato(v.o.frequency, t, 1.8, 11, 40);
    this.noise(t, 1.6, 0.12, "bandpass", 2500);
    return 1.9;
  }
  cat() {
    const t = this.ctx.currentTime + 0.02;
    const v = this.voice("triangle", t, 1.0, 500, 600, 0.6, 1200);
    v.o.frequency.setValueAtTime(480, t);
    v.o.frequency.linearRampToValueAtTime(950, t + 0.35);
    v.o.frequency.linearRampToValueAtTime(560, t + 1.0);
    v.bp.frequency.setValueAtTime(900, t);
    v.bp.frequency.linearRampToValueAtTime(2600, t + 0.35);
    v.bp.frequency.linearRampToValueAtTime(800, t + 1.0);
    this.vibrato(v.o.frequency, t, 1.0, 7, 25);
    this.noise(t + 1.05, 0.6, 0.25, "highpass", 3000); // hiss
    return 1.7;
  }
}
