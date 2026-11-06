// The scene: night forest clearing, a cauldron on a fire, a big ghost conducting a magic ladle, skeletons (and a pumpkin guest) dancing.
// Everything is drawn into one native-resolution buffer; poses are held and change on beats (sprite-style, ~12 fps).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";

const C = {
  K: pk(0x0d0716), ink: pk(0x140a10), white: pk(0xffffff),
  sky: [0x0f0820, 0x170c2e, 0x21113c, 0x2e174a, 0x3e1f58, 0x512862].map(pk),
  star: pk(0xeee6ff), star2: pk(0x8a7fbf),
  moon: pk(0xf6eecb), moonM: pk(0xdccc94), moonD: pk(0xb6a476), moonGlow: pk(0x6c4c80),
  cloud: pk(0x2a1a42), cloudL: pk(0x4a3466),
  hill: pk(0x241838), far: pk(0x2c1c46), mid: pk(0x1a0f2e), near: pk(0x0a0512),
  ground: pk(0x150e1c), ground2: pk(0x21182c), ground3: pk(0x2c2238), grass: pk(0x16241e), grass2: pk(0x24382c),
  stone: pk(0x4c4664), stoneD: pk(0x302a44), stoneL: pk(0x6c6690),
  fog: pk(0x6a5a8c),
  pot: pk(0x24243a), potM: pk(0x3a3a56), potL: pk(0x62628a), potRim: pk(0x9090b8), potD: pk(0x16162a),
  brew: pk(0x3cf06a), brewM: pk(0x1fb848), brewD: pk(0x0f7a30), brewL: pk(0xc8ffbc),
  fire: [0xfff6b0, 0xffc63c, 0xff7a1c, 0xd8361c, 0x8a1a20].map(pk),
  log: pk(0x5a3420), logD: pk(0x341c10), logL: pk(0x8a5a34),
  ghost: pk(0xf4f6ff), ghostM: pk(0xc6c9ea), ghostD: pk(0x8c8ec4), mouth: pk(0x3a1030), tongue: pk(0xd84a6c),
  bone: pk(0xf2ead0), boneM: pk(0xc4b896), boneD: pk(0x8a7f62),
  pump: pk(0xff9a2e), pumpM: pk(0xd8661a), pumpD: pk(0x9c4008), stem: pk(0x4a7a2a), carve: pk(0xffe25a), carveD: pk(0xffa020),
  cape: pk(0xc8283a), capeM: pk(0x8e1a2c), capeD: pk(0x4a0a18),
  cat: pk(0x3a2852), catL: pk(0x7a62a8), catEye: pk(0xffe23a),
  magic: pk(0x8affb8), magicL: pk(0xeafff2), magicD: pk(0x3ad08a),
  red: pk(0xff2a2a), redD: pk(0x9a1010), eyeY: pk(0xd8c040),
  wood: pk(0xa8743e), woodD: pk(0x5e3c1e),
  warm: pk(0xff9a40), green: pk(0x50ff90), flash: pk(0xc8b8ff), black: pk(0x020104),
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const D = Math.PI / 180;
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- sprites ----------
const BP = { w: C.bone, m: C.boneM, d: C.boneD };
const SKULL = sprite([
  "...wwwww...",
  ".wwwwwwwmm.",
  "wwwwwwwwwmm",
  "wwwwwwwwwwm",
  "wwwwwwwwwwm",
  "wwwwwwwwwwm",
  ".wwwwwwwwm.",
  "..wwwwwwm..",
  "..w.w.w.m..",
], BP);
const JAW = sprite(["w.w.w.m", "wwwwwmm"], BP);
const RIBS = sprite([
  ".wwwwwww.",
  "w...w...m",
  ".wwwwwwm.",
  "w...w...m",
  ".wwwwwwm.",
  "....w....",
], BP);
const PELVIS = sprite(["wwwwwww", "w.www.m", ".w...m."], BP);
const PP = { o: C.pump, O: C.pumpM, d: C.pumpD, g: C.stem, K: C.ink, w: C.white, c: C.carve, C: C.carveD };
const PUMPHEAD = sprite([
  "......gg.....",
  "......g......",
  "...ooOoOoo...",
  ".oooOoooOood.",
  "ooooOoooOoood",
  "ooKKOoooKKOdd",
  "owKKOoooKwKdd",
  "ooKKOoooKKOdd",
  ".oooOoooOodd.",
  "..ooOoooOdd..",
  "....ooodd....",
], PP);
const JACK = sprite([
  "....g....",
  ".ooOoOod.",
  "oOcoOocOd",
  "oOccOccOd",
  "oOoOoOoOd",
  "occcccccd",
  ".oOcOcOd.",
  "..oooddd.",
], PP);
const CP = { k: C.cat, l: C.catL, y: C.catEye };
const CAT_RUN = [
  sprite([
    "................k.k.",
    "...............kkkk.",
    "k.............kkykyk",
    ".k...........kkkkkkk",
    "..llllllllllllkkkkk.",
    "..kkkkkkkkkkkkkkkk..",
    "..kk..........kk....",
    ".kk............kk...",
    "kk..............kk..",
  ], CP),
  sprite([
    "................k.k.",
    "...............kkkk.",
    "k..............kykyk",
    ".k....lllllllllkkkkk",
    "..k.kkkkkkkkkkkkkkk.",
    "...kkkkkkkkkkkkkk...",
    ".....kk...kkk.......",
    "......kk.kk.........",
    ".......kkk..........",
  ], CP),
];
const CAT_ARCH = sprite([
  "k......lllllll.......",
  "kk...kkkkkkkkkkk.....",
  ".k..kkkkkkkkkkkkk.k.k",
  ".kk.kkkk.....kkkkkkkk",
  "..kkkk.........kkykyk",
  "..kkk..........kkkkkk",
  "..kk...........kk.kk.",
  "..kk...........kk.kk.",
  "..kk...........kk.kk.",
  ".kkk..........kkk.kkk",
], CP);
const BATP = { b: pk(0x1c0f2a), r: C.red };
const BAT = [
  sprite(["b.....b", "bb.b.bb", ".bbrbb.", "...b..."], BATP),
  sprite(["...b...", ".bbrbb.", "bb.b.bb", "b.....b"], BATP),
];
const STONE = sprite([
  "..sss..",
  ".sLsss.",
  "sLsDsss",
  "sLDDDss",
  "sLsDsss",
  "sLsDsss",
  "sLsssss",
  "sssssss",
], { s: C.stoneD, L: C.stone, D: C.ink });

// ---------- poses ----------
// a = upper arm angle out from straight down (deg), f = forearm extra turn (+ outward/up), u = thigh angle out, k = shin extra turn (- = inward)
const BASE = { aL: 20, fL: 10, aR: 20, fR: 10, uL: 6, kL: -6, uR: 6, kR: -6, dy: 0, lean: 0, tilt: 0, jaw: 0, look: 0, sx: 0, sy: 0 };
const P = (o) => ({ ...BASE, ...o });
const MOVES = {
  wave: [P({ aL: 160, fL: 15, aR: 35, fR: -40 }), P({ aL: 35, fL: -40, aR: 160, fR: 15, dy: 1, uL: 12, kL: -20, uR: 12, kR: -20 })],
  hips: [P({ aL: 50, fL: -110, aR: 50, fR: -110, dy: 2, uL: 14, kL: -26, uR: 14, kR: -26, tilt: -1, jaw: 1 }), P({ aL: 50, fL: -110, aR: 50, fR: -110, tilt: 1 })],
  kick: [
    P({ aL: 90, fL: 0, aR: 90, fR: 0, uL: 4, kL: 0, uR: 80, kR: -30, lean: -1 }),
    P({ aL: 80, fL: 20, aR: 80, fR: 20, dy: 1, uL: 10, kL: -15, uR: 10, kR: -15 }),
    P({ aL: 90, fL: 0, aR: 90, fR: 0, uR: 4, kR: 0, uL: 80, kL: -30, lean: 1 }),
    P({ aL: 80, fL: 20, aR: 80, fR: 20, dy: 1, uL: 10, kL: -15, uR: 10, kR: -15 }),
  ],
  jack: [P({ aL: 165, fL: 0, aR: 165, fR: 0, uL: 25, kL: 0, uR: 25, kR: 0, dy: -3, jaw: 1 }), P({ aL: 15, fL: 0, aR: 15, fR: 0, uL: 4, uR: 4, dy: 1 })],
  disco: [
    P({ aR: 150, fR: 0, aL: 50, fL: -110, lean: 2, uL: 8, uR: 22, kR: -30, tilt: 1 }),
    P({ aR: 25, fR: -70, aL: 50, fL: -110, lean: -1, uL: 8, uR: 8, dy: 1, tilt: -1 }),
  ],
  chomp: [P({ aL: 75, fL: 60, aR: 75, fR: -30, jaw: 1, dy: 1, tilt: -1 }), P({ aL: 75, fL: -30, aR: 75, fR: 60, tilt: 1 })],
  sway: [P({ lean: -1, tilt: -1, aL: 25, aR: 12 }), P({ lean: 1, tilt: 1, aL: 12, aR: 25 })],
};
const DANCE = ["wave", "hips", "kick", "jack", "disco", "chomp"];
const SPECIAL = {
  cower: P({ aL: 165, fL: 115, aR: 165, fR: 115, uL: 16, kL: -30, uR: 16, kR: -30, dy: 4, jaw: 1 }),
  startle: P({ aL: 170, fL: -10, aR: 170, fR: -10, uL: 18, kL: 0, uR: 18, kR: 0, dy: -7, jaw: 1 }),
  freeze: P({ aL: 40, fL: 70, aR: 40, fR: 70, uL: 10, kL: -10, uR: 10, kR: -10, jaw: 1, dy: 1 }),
  fall: P({ aL: 110, fL: 30, aR: 110, fR: 30, uL: 60, kL: -10, uR: 60, kR: -10, dy: 8, sx: 3, sy: 6, jaw: 1 }),
};
const flipPose = (p) => ({ ...p, aL: p.aR, fL: p.fR, aR: p.aL, fR: p.fL, uL: p.uR, kL: p.kR, uR: p.uL, kR: p.kL, lean: -p.lean, tilt: -p.tilt, look: -p.look });
const blend = (a, b, t) => Object.fromEntries(Object.keys(BASE).map((k) => [k, lerp(a[k], b[k], t)]));

export const SCARES = {
  laugh: { dur: 3.2, sound: 0.15 },
  boo: { dur: 3.0, sound: 0.35 },
  scream: { dur: 3.6, sound: 0.3 },
  cat: { dur: 2.9, sound: 0.72 },
};

export class Scene {
  constructor(W, H) {
    this.parts = [];
    this.bats = [];
    this.has = [];
    this.sc = null;
    this.lastBeat = -1;
    this.idleT = 0;
    this.r = rng(1031);
    this.ghostL = new Buf(140, 130);
    this.potL = new Buf(64, 44);
    this.dl = new Buf(44, 60);
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.buf = new Buf(W, H);
    this.hz = H - 70; // horizon
    this.cx = Math.round(W / 2);
    this.potY = H - 26; // cauldron feet
    this.rimY = this.potY - 28;
    this.frontY = H - 12;
    this.backY = H - 44;
    const r = rng(77);
    this.dancers = [];
    const add = (x, fy, row, kind, flip) => this.dancers.push({ x: Math.round(x), fy, row, kind, flip, move: pick(r, DANCE), step: 0, half: row === "back", prev: P({}), cur: P({}), tSw: -1, seed: r() });
    for (let i = 0, off = 50; off < W / 2 - 14; i++, off += 34) {
      add(this.cx - off, this.frontY, "front", i === 1 ? "pump" : "skel", false);
      add(this.cx + off, this.frontY, "front", "skel", true);
    }
    add(this.cx - 46, this.backY, "back", "skel", false);
    add(this.cx + 46, this.backY, "back", "skel", true);
    this.dancers.sort((a, b) => a.fy - b.fy);
    this.jacks = [-27, 27, -(W / 2 - 22), W / 2 - 22].map((o) => this.cx + o);
    this.stars = [];
    for (let i = 0; i < W * 0.35; i++) this.stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * (this.hz - 25)), b: r() });
    this.eyes = [];
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? 10 + r() * W * 0.3 : W - 10 - r() * W * 0.3;
      this.eyes.push({ x: Math.round(x), y: Math.round(this.hz - 6 - r() * 40), side, ph: r() * 10, red: i >= 4 });
    }
    this.moon = { x: Math.round(W * 0.73), y: Math.round(H * 0.17), r: 15 };
    this.bg = this.buildBg();
  }

  // ---------- static background ----------
  buildBg() {
    const { W, H, hz } = this, b = new Buf(W, H), r = rng(4242);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (y < hz) {
        const f = (y / hz) * (C.sky.length - 1), i = Math.floor(f);
        b.d[y * W + x] = f - i > bayer(x, y) ? C.sky[Math.min(i + 1, C.sky.length - 1)] : C.sky[i];
      } else {
        const t = (y - hz) / (H - hz);
        b.d[y * W + x] = t < 0.25 ? (t * 4 > bayer(x, y) ? C.ground2 : C.ground3) : t * 1.3 - 0.3 > bayer(x, y) ? C.ground : C.ground2;
      }
    }
    // moon + halo
    const m = this.moon;
    for (let y = -m.r - 16; y <= m.r + 16; y++) for (let x = -m.r - 16; x <= m.r + 16; x++) {
      const d = Math.hypot(x, y);
      if (d > m.r && d < m.r + 16 && (1 - (d - m.r) / 16) * 0.75 > bayer(m.x + x, m.y + y)) b.set(m.x + x, m.y + y, mix(b.get(m.x + x, m.y + y), C.moonGlow, 0.45));
      if (d <= m.r + 0.3) {
        const s = (x / m.r) * 0.8 + (y / m.r) * 0.35;
        b.set(m.x + x, m.y + y, s > 0.62 ? C.moonD : s > 0.3 ? C.moonM : C.moon);
      }
    }
    for (const [cx, cy, cr] of [[-5, -4, 3], [4, 3, 2], [-2, 7, 2], [6, -6, 1], [-8, 4, 1]]) {
      b.disc(m.x + cx, m.y + cy, cr, C.moonM);
      b.set(m.x + cx + cr, m.y + cy + 1, C.moonD);
    }
    // hills
    for (let x = 0; x < W; x++) {
      const yh = Math.round(hz - 5 - 3 * Math.sin(x * 0.031 + 1) - 2 * Math.sin(x * 0.083));
      for (let y = yh; y < hz + 2; y++) b.set(x, y, C.hill);
    }
    for (let x = 4; x < W; x += 9 + Math.floor(r() * 14)) this.tree(b, x, hz + 1, 16 + r() * 22, C.far, r, 2.2, 4, 0);
    for (const x of [this.cx - 92, this.cx - 70, this.cx + 64, this.cx + 98]) b.blit(STONE, x, hz - 1 + Math.floor(r() * 3));
    for (let i = 0; i < 7; i++) {
      const x = r() * W;
      if (Math.abs(x - this.cx) < 34) continue;
      this.tree(b, x, hz + 6, 45 + r() * 45, C.mid, r, 3.5, 5, 0);
    }
    // ground texture
    for (let i = 0; i < W * 1.2; i++) {
      const x = Math.floor(r() * W), y = Math.floor(hz + 3 + r() * (H - hz - 3));
      if (r() < 0.5) b.set(x, y, C.ground3);
      else { const h = 1 + Math.floor(r() * 3); b.line(x, y, x, y - h, C.grass); b.set(x + 1, y, C.grass2); }
    }
    // framing trees
    this.tree(b, 5, H + 4, H * 1.15, C.near, r, 11, 6, 1);
    this.tree(b, W - 5, H + 4, H * 1.15, C.near, r, 11, 6, -1);
    return b;
  }

  tree(b, x, y, h, col, r, th, depth, bias) {
    const br = (x0, y0, ang, len, w, d) => {
      const x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len, n = Math.ceil(len);
      for (let i = 0; i <= n; i++) { const t = i / n; b.disc(lerp(x0, x1, t), lerp(y0, y1, t), Math.max(0, (w * (1 - t * 0.35) - 1) / 2), col); }
      if (d <= 0 || w < 1.1) return;
      const k = 2 + (r() < 0.45 ? 1 : 0);
      for (let i = 0; i < k; i++) br(x1, y1, ang + (r() - 0.5) * 1.1 + (i - (k - 1) / 2) * 0.7 + bias * 0.25, len * (0.55 + r() * 0.25), w * 0.62, d - 1);
    };
    br(x, y, bias * 0.3 + (r() - 0.5) * 0.15, h * 0.38, th, depth);
  }

  // ---------- events ----------
  scare(kind, t) {
    this.sc = { kind, t0: t, side: Math.random() < 0.5 ? -1 : 1, has: 0 };
    if (kind === "scream") {
      const s = this.sc.side;
      for (let i = 0; i < 9; i++) this.bats.push({ x: s < 0 ? 14 + Math.random() * 20 : this.W - 14 - Math.random() * 20, y: this.hz - 50 - Math.random() * 30, vx: -s * (70 + Math.random() * 50), vy: -10 - Math.random() * 20, t0: t + 0.3 + i * 0.07 });
    }
  }
  scareT(t) {
    if (!this.sc) return null;
    const e = t - this.sc.t0;
    if (e > SCARES[this.sc.kind].dur) { this.sc = null; return null; }
    return e;
  }

  onBeat(t, idx, idle) {
    const r = this.r;
    for (const d of this.dancers) {
      if (d.half && idx % 2) continue;
      if (idle) d.move = "sway";
      else if (d.move === "sway" || (idx % 16 === 0 && r() < 0.6)) d.move = pick(r, DANCE);
      d.step++;
      const seq = MOVES[d.move];
      let p = seq[d.step % seq.length];
      if (d.flip) p = flipPose(p);
      d.prev = d.shown || d.cur;
      d.cur = p;
      d.tSw = t;
    }
    if (!idle) {
      // spell ring and a burst of sparks on the beat
      this.parts.push({ k: "ring", t0: t, life: 0.35 });
      if (idx % 8 === 0) this.parts.push({ k: "skull", x: this.cx + (r() - 0.5) * 16, y: this.rimY - 6, t0: t, life: 2.2 });
    }
  }

  // ---------- frame ----------
  draw(t, ears) {
    const { W, H, buf, cx, hz } = this;
    const tq = Math.floor(t * 12) / 12; // on twos
    const dt = this.lastT ? Math.min(0.1, t - this.lastT) : 0;
    this.lastT = t;
    const se = this.scareT(t), sk = this.sc ? this.sc.kind : null;

    if (ears.active) {
      if (ears.beatIndex !== this.lastBeat) { this.lastBeat = ears.beatIndex; this.onBeat(t, ears.beatIndex, false); }
    } else if (t - this.idleT > 0.75) { this.idleT = t; this.onBeat(t, ++this.lastBeat, true); }

    buf.d.set(this.bg.d);
    // lightning for the laugh
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < hz * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.55);
    this.drawSky(t, tq, ears);
    this.drawEyes(t, tq, se, sk);
    this.fog(tq, hz - 6, hz + 10, 0.35, 0.03);

    for (const d of this.dancers) if (d.row === "back") this.drawDancer(d, t, tq, ears, se, sk);
    const boo = sk === "boo" && se > 0.15 && se < 2.45;
    if (!boo) this.drawGhost(t, tq, ears, se, sk, 1);
    this.drawCauldron(t, tq, ears, dt);
    this.drawParts(t, dt, ears, "mid");
    for (const j of this.jacks) {
      const hot = ears.pulse > 0.5;
      buf.blit(JACK, j - 4, this.potY + 6 - 7, false, hot ? (c) => (c === C.carve ? C.white : c === C.carveD ? C.carve : c) : null);
    }
    for (const d of this.dancers) if (d.row === "front") this.drawDancer(d, t, tq, ears, se, sk);
    this.fog(tq + 3, H - 16, H, 0.5, 0.06);
    if (sk === "cat") this.drawCat(se);
    this.glow(ears, sk === "scream" ? 0.5 : 1);
    this.drawParts(t, dt, ears, "top");

    if (sk === "scream") {
      const a = clamp(se / 0.3) * clamp((3.6 - se) / 0.5) * 0.55;
      this.dim(a);
      this.drawEyes(t, tq, se, sk, true);
    }
    if (boo) {
      this.dim(0.6);
      this.drawGhost(t, tq, ears, se, sk, se < 0.25 ? 2 : se < 0.35 ? 3 : se < 2.15 ? 4 : se < 2.3 ? 3 : 2);
      if (se > 0.35 && se < 2.1) {
        const s = 4, w = textW("BOO!", s), sh = Math.floor(tq * 12) % 2;
        this.textOut("BOO!", Math.round(cx - w / 2) + sh, H - 36, s, C.pump, 2);
      }
    }
    this.drawBats(t, dt);
  }

  // ---------- pieces ----------
  drawSky(t, tq, ears) {
    const { buf } = this;
    const tw = Math.floor(tq * 4);
    for (const s of this.stars) {
      const on = ((s.b * 97 + tw) % 7) > 0.9;
      if (!on) continue;
      buf.set(s.x, s.y, s.b > 0.75 || (ears.high > 0.7 && s.b > 0.5) ? C.star : C.star2);
      if (s.b > 0.93) { buf.set(s.x + 1, s.y, C.star2); buf.set(s.x - 1, s.y, C.star2); buf.set(s.x, s.y + 1, C.star2); buf.set(s.x, s.y - 1, C.star2); }
    }
    // clouds drifting across the moon
    const W = this.W;
    for (let i = 0; i < 3; i++) {
      const w = 46 + i * 12, x0 = ((i * 137 + Math.floor(t * (2 + i))) % (W + w * 2)) - w, y0 = this.moon.y - 6 + i * 11;
      for (const [fx, fy, rx, ry] of [[0.18, 1, 7, 3], [0.42, -1, 11, 4], [0.68, 0, 9, 4], [0.88, 1, 6, 3]]) {
        const bx = Math.round(x0 + fx * w), by = y0 + fy;
        for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
          const e = 1 - (x * x) / (rx * rx) - (y * y) / (ry * ry);
          if (e > 0 && e * 1.8 > bayer(bx + x, by + y)) buf.set(bx + x, by + y, y < -ry * 0.3 ? C.cloudL : C.cloud);
        }
      }
    }
  }

  drawEyes(t, tq, se, sk, emissive = false) {
    const { buf } = this;
    for (const e of this.eyes) {
      if (emissive !== e.red) continue;
      if (e.red) {
        if (sk !== "scream" || e.side !== this.sc.side) continue;
        if (se < 0.15 + (e.ph % 1) * 0.5 || se > 3.3) continue;
      } else {
        const p = (t * 0.25 + e.ph) % 6;
        if (p > 1.6 || (p > 0.7 && p < 0.8)) continue; // appear for a while, blink once
      }
      const c = e.red ? C.red : C.eyeY;
      buf.set(e.x, e.y, c); buf.set(e.x + 3, e.y, c);
      if (e.red) { buf.set(e.x + 1, e.y, C.redD); buf.set(e.x + 4, e.y, C.redD); }
    }
  }

  fog(tq, y0, y1, dens, speed) {
    const { buf, W } = this;
    for (let y = Math.max(0, y0); y < Math.min(this.H, y1); y++) {
      const fy = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const n = 0.5 + 0.3 * Math.sin(x * 0.045 + tq * speed * 20 + y * 0.3) + 0.2 * Math.sin(x * 0.11 - tq * speed * 31);
        const a = n * dens * Math.sin(fy * Math.PI);
        if (a > bayer(x, y)) buf.d[y * W + x] = mix(buf.d[y * W + x], C.fog, 0.3);
      }
    }
  }

  dim(a) {
    const d = this.buf.d;
    for (let i = 0; i < d.length; i++) d[i] = mix(d[i], C.black, a);
  }

  glow(ears, k) {
    const { buf, W, H, cx, potY, rimY } = this;
    const sw = (0.75 + ears.level * 0.3 + ears.pulse * 0.25) * k, sg = (0.6 + ears.mid * 0.3 + ears.pulse * 0.4) * k;
    const rw = 62 + ears.bass * 10, rg = 80 + ears.pulse * 14;
    for (let y = Math.max(0, rimY - rg); y < H; y++) for (let x = Math.max(0, cx - rg - 10); x < Math.min(W, cx + rg + 10); x++) {
      const i = y * W + x, c = buf.d[i];
      if (c === C.K) continue;
      const th = bayer(x, y);
      const dw = Math.hypot(x - cx, (y - potY) * 1.6) / rw, dg = Math.hypot(x - cx, (y - rimY) * 1.2) / rg;
      // light in 3 steps; only the step edges are dithered
      const lw = Math.max(0, (1 - dw) * sw) * 3, lg = Math.max(0, (1 - dg) * sg) * 3;
      const nw = Math.min(3, Math.floor(lw) + (lw % 1 > th ? 1 : 0)), ng = Math.min(3, Math.floor(lg) + (lg % 1 > th ? 1 : 0));
      let o = c;
      if (nw) o = mix(o, C.warm, 0.09 * nw);
      if (ng) o = mix(o, C.green, 0.08 * ng);
      buf.d[i] = o;
    }
  }

  // ---------- cauldron ----------
  drawCauldron(t, tq, ears, dt) {
    const { buf, cx, potY: fy, rimY } = this;
    // fire
    buf.line(cx - 16, fy + 1, cx + 13, fy - 3, C.logD, 4); buf.line(cx - 16, fy, cx + 13, fy - 4, C.log, 2);
    buf.line(cx + 16, fy + 1, cx - 13, fy - 3, C.logD, 4); buf.line(cx + 16, fy, cx - 13, fy - 4, C.logL, 2);
    const T = tq;
    const flames = (half, base, amp, k) => {
      for (let x = -half; x <= half; x++) {
        const h = Math.max(0, (base + ears.bass * amp + ears.pulse * amp * 0.5) * (1 - (x / (half + 1)) ** 2) * (0.6 + 0.4 * Math.sin(x * 1.7 + T * 9 + k) * Math.sin(x * 0.9 - T * 5.3 + k)));
        for (let j = 0; j < h; j++) {
          const f = j / h;
          buf.set(cx + x, fy - 1 - j, C.fire[f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.8 ? 2 : 3]);
        }
      }
    };
    flames(27, 16, 12, 0); // behind the pot, licking up its sides
    if (Math.random() < 0.3 + ears.bass * 0.5) this.parts.push({ k: "ember", x: cx + (Math.random() - 0.5) * 26, y: fy - 6, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 20, t0: t, life: 0.8 + Math.random() * 0.6 });

    // pot into its own layer, outlined
    const L = this.potL, ox = 32, oy = 34; // layer origin = cauldron feet centre
    L.clear();
    for (const lx of [-13, 12]) { L.rect(ox + lx, oy - 8, 2, 8, C.pot); L.set(ox + lx, oy - 8, C.potM); }
    const by = oy - 17, rx = 21, ry = 13;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = y / ry;
      if (nx * nx + ny * ny > 1.02) continue;
      const l = -0.6 * nx - 0.45 * ny;
      let c = l > 0.5 ? C.potL : l > 0.05 ? C.potM : C.pot;
      if (ny > 0.55 && (ny - 0.55) * 1.8 > bayer(x, y)) c = mix(c, C.fire[2], 0.4);
      L.set(ox + x, by + y, c);
    }
    for (let x = -rx + 1; x < rx; x++) L.set(ox + x, by - 6, x % 6 === 0 ? C.potRim : C.potD);
    const ry0 = oy - 28;
    L.ellipse(ox, ry0, 23, 5, C.potL);
    for (let x = -23; x <= 23; x++) if (x < -6) L.set(ox + x, ry0 + (x < -18 ? 1 : 2), C.potRim);
    L.ellipse(ox, ry0, 19, 3, C.brewM);
    L.ellipse(ox, ry0 + 1, 16, 2, C.brew);
    for (let x = -18; x <= 18; x++) L.set(ox + x, ry0 - 3 + (Math.abs(x) > 14 ? 1 : 0), C.brewD);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 4; i++) L.set(ox - 12 + ((i * 9 + sp * 3) % 24), ry0 + (i % 2), C.brewL);
    L.outline(C.K);
    buf.blit(L, cx - ox, fy - oy);
    flames(11, 4, 4, 2); // small tongues in front

    // bubbles on the surface
    if (Math.random() < 0.12 + ears.bass * 0.5) this.parts.push({ k: "bubble", x: cx + (Math.random() - 0.5) * 30, y: rimY + (Math.random() - 0.5) * 3, t0: t, life: 0.4 + Math.random() * 0.4 });
    if (Math.random() < 0.25 + ears.level * 0.4) this.parts.push({ k: "steam", x: cx + (Math.random() - 0.5) * 28, y: rimY - 3, vx: (Math.random() - 0.5) * 4, vy: -10 - Math.random() * 8, t0: t, life: 1.4 + Math.random() * 1.2, r: 1.5 + Math.random() * 1.5 });

    // the ladle, stirred by magic
    this.ladleA = (this.ladleA || 0) + dt * (1.6 + ears.mid * 2.5 + ears.pulse * 2);
    const a = Math.floor(this.ladleA * 8) / 8, px = cx + Math.cos(a) * 11, py = rimY + Math.sin(a) * 1.6;
    const qx = cx + Math.cos(a) * 5 + Math.sin(a * 0.5) * 2, qy = rimY - 27 + Math.sin(a) * 1.5;
    this.ladleTop = { x: qx, y: qy };
    buf.line(px, py, qx, qy, C.K, 4);
    buf.line(px, py, qx, qy, C.woodD, 2);
    buf.line(px - 1, py, qx - 1, qy, C.wood, 1);
    buf.ellipse(qx, qy - 1, 2, 2, C.K);
    buf.ellipse(qx, qy - 1, 1, 1, C.wood);
    for (let x = -4; x <= 4; x++) if (Math.abs(x) > 1) buf.set(px + x, py + (Math.abs(x) > 3 ? 0 : 1), C.brewL);
    // magic aura around the handle
    for (let i = 0; i < 6; i++) {
      const u = ((i / 6 + tq * 0.8) % 1);
      const ax = lerp(px, qx, u) + Math.sin(u * 20 + tq * 8) * 3, ay = lerp(py, qy, u);
      buf.set(ax, ay, i % 2 ? C.magic : C.magicL);
    }
  }

  // ---------- ghost ----------
  ghostPose(t, tq, ears, se, sk) {
    const g = { face: "idle", look: 0, rise: 0, shake: 0, blink: false, mouth: ears.mid, hemPh: tq * 5, sway: Math.sin(tq * 1.7) };
    const R = 20, sR = { x: R - 2, y: 12 }, sL = { x: -(R - 2), y: 12 };
    // conducting pattern, hand relative to the right shoulder: down, in, out, up
    const pts = [[9, 12], [-3, 2], [19, 1], [11, -18]];
    let hand;
    if (ears.active) {
      const k = this.lastBeat % 4, ph = Math.floor(ears.phase * 6) / 6, e = ph < 0.5 ? 2 * ph * ph : 1 - Math.pow(-2 * ph + 2, 2) / 2;
      const p0 = pts[(k + 3) % 4], p1 = pts[k];
      // arrive at the beat point on the beat, then travel to the next
      const p2 = pts[(k + 1) % 4];
      hand = ph < 0.15 ? [lerp(p0[0], p1[0], 0.85 + ph), lerp(p0[1], p1[1], 0.85 + ph) + 2] : [lerp(p1[0], p2[0], e), lerp(p1[1], p2[1], e)];
    } else hand = [12 + 4 * Math.sin(tq * 1.3), -6 + 5 * Math.cos(tq * 1.3)];
    g.hand = { x: sR.x + hand[0], y: sR.y + hand[1] };
    const wig = Math.sin(tq * 14) * (1 + ears.mid * 2);
    g.lhand = { x: sL.x - 15, y: sL.y - 9 + wig };
    g.blink = (t % 4.3) < 0.13;
    g.look = Math.round(Math.sin(t * 0.4) * 1.2);
    if (sk === "laugh" && se > 0.1 && se < 2.9) {
      g.face = "laugh"; g.shake = Math.floor(tq * 12) % 2 ? 1 : -1; g.rise = Math.min(4, se * 12);
      g.hand = { x: sR.x + 8, y: sR.y + 6 }; g.lhand = { x: sL.x - 8, y: sL.y + 6 };
    } else if (sk === "boo" && se < 2.45) {
      g.face = se < 0.15 ? "idle" : "boo"; g.mouth = 0; g.rise = se < 0.15 ? se * 30 : 0;
      g.hand = { x: sR.x + 14, y: sR.y - 22 }; g.lhand = { x: sL.x - 14, y: sL.y - 22 };
      g.shake = se > 0.35 && Math.floor(tq * 12) % 2 ? 1 : 0;
    } else if (sk === "scream" && se > 0.25 && se < 3.4) {
      g.face = "scared"; g.look = this.sc.side * 2;
      g.hand = { x: sR.x - 4, y: sR.y - 2 }; g.lhand = { x: sL.x + 4, y: sL.y - 2 };
    } else if (sk === "cat" && se > 0.5 && se < 1.8) {
      g.face = "scared"; g.rise = 4; g.look = 0;
      g.hand = { x: sR.x + 10, y: sR.y - 16 }; g.lhand = { x: sL.x - 10, y: sL.y - 16 };
    }
    return g;
  }

  drawGhost(t, tq, ears, se, sk, scale) {
    const g = this.ghostPose(t, tq, ears, se, sk);
    const L = this.ghostL, ox = 70, oy = 46, R = 20, Lh = 44;
    L.clear();
    // body
    for (let y = -R; y <= Lh + 5; y++) {
      const yy = y < 0 ? 0 : y, hw = y < 0 ? Math.sqrt(Math.max(0, R * R - y * y)) : R + yy * 0.2;
      const xo = y < 0 ? 0 : g.sway * Math.pow(yy / Lh, 2) * 5;
      for (let x = Math.floor(-hw + xo) - 1; x <= Math.ceil(hw + xo) + 1; x++) {
        const nx = (x - xo) / hw;
        if (Math.abs(nx) > 1.02) continue;
        if (y < 0 && x * x + y * y > R * R + R * 0.6) continue;
        if (y >= 0 && y > Lh + 3.5 * Math.sin(x * 0.42 + g.hemPh)) continue;
        let c = C.ghost;
        if (nx > 0.62 || (nx > 0.45 && bayer(x, y) < 0.5)) c = C.ghostM;
        if (nx > 0.9 || y > Lh - 4 + 3.5 * Math.sin(x * 0.42 + g.hemPh)) c = nx > 0.6 ? C.ghostD : C.ghostM;
        L.set(ox + x, oy + y, c);
      }
    }
    // face
    const ex = g.look, F = (x, y, w, h, c) => L.rect(ox + x, oy + y, w, h, c);
    if (g.face === "laugh") {
      for (const bx of [-10, 6]) for (let i = 0; i < 5; i++) { const yy = -3 + Math.abs(i - 2); F(bx + i, yy, 1, 2, C.K); }
      for (let y = 0; y <= 8; y++) { const w = Math.round(Math.sqrt(1 - (y / 9) ** 2) * 8); F(-w, 5 + y, 2 * w + 1, 1, C.K); if (w > 1 && y < 8) F(-w + 1, 5 + y, 2 * w - 1, 1, y > 5 ? C.tongue : C.mouth); }
    } else if (g.face === "boo") {
      L.line(ox - 12, oy - 9, ox - 5, oy - 6, C.K, 2); L.line(ox + 12, oy - 9, ox + 5, oy - 6, C.K, 2);
      L.ellipse(ox - 8, oy - 1, 2, 3, C.K); L.ellipse(ox + 8, oy - 1, 2, 3, C.K);
      L.ellipse(ox, oy + 11, 7, 8, C.K); L.ellipse(ox, oy + 11, 6, 7, C.mouth); L.ellipse(ox, oy + 16, 4, 2, C.tongue);
    } else if (g.face === "scared") {
      for (const bx of [-8, 8]) { L.ellipse(ox + bx, oy - 1, 3, 4, C.K); L.ellipse(ox + bx, oy - 1, 2, 3, C.white); L.rect(ox + bx + Math.sign(ex || 1) * 1, oy - 1, 1, 2, C.K); }
      L.ellipse(ox, oy + 10, 2, 3, C.K); L.ellipse(ox, oy + 10, 1, 2, C.mouth);
    } else {
      for (const bx of [-10, 6]) {
        if (g.blink) F(bx + ex, 1, 4, 1, C.K);
        else { F(bx + ex + 1, -4, 2, 1, C.K); F(bx + ex, -3, 4, 5, C.K); F(bx + ex + 1, 2, 2, 1, C.K); F(bx + ex + 1, -3, 1, 1, C.white); }
      }
      const mh = 1 + Math.round(clamp(g.mouth) * 3);
      L.ellipse(ox + ex, oy + 9, 3, mh / 2 + 1, C.K); L.ellipse(ox + ex, oy + 9, 2, mh / 2, C.mouth);
    }
    // arms (stamped ink first so they read over the body)
    const arm = (s, h, out, baton) => {
      const sx = ox + s.x, sy = oy + s.y, hx = ox + h.x, hy = oy + h.y, mx = (sx + hx) / 2 + out * 4, my = (sy + hy) / 2 + 3;
      L.line(sx, sy, mx, my, C.K, 5); L.line(mx, my, hx, hy, C.K, 5); L.disc(hx, hy, 3, C.K);
      L.line(sx, sy, mx, my, C.ghost, 3); L.line(mx, my, hx, hy, C.ghost, 3); L.disc(hx, hy, 2, C.ghost); L.set(hx + 1, hy + 1, C.ghostM);
      if (baton) {
        const dx = hx - mx, dy = hy - my, n = Math.hypot(dx, dy) || 1, bx = hx + (dx / n) * 12 + 3, byy = hy + (dy / n) * 12 - 4;
        L.line(hx, hy, bx, byy, C.K, 3); L.line(hx, hy, bx, byy, C.wood, 1); L.set(bx, byy, C.white);
        this.batonTip = { x: bx - ox, y: byy - oy };
      }
    };
    arm({ x: R - 3, y: 12 }, g.hand, 1, g.face === "idle");
    arm({ x: -(R - 3), y: 12 }, g.lhand, -1, false);
    L.outline(C.K);

    const gx = this.cx + g.shake, gy = this.rimY - 62 + Math.round(Math.sin(tq * 1.3) * 2) - Math.round(g.rise) + (this.lastBeatPulse ? 1 : 0);
    this.ghostHand = { x: gx + g.lhand.x, y: gy + g.lhand.y, cast: g.face === "idle" };
    this.ghostMouth = { x: gx, y: gy + 10 };
    if (scale === 1) this.buf.blit(L, gx - ox, gy - oy);
    else this.buf.blitScaled(L, scale, this.cx + g.shake * scale, this.H * 0.42, ox, oy + 4);
  }

  // ---------- dancers ----------
  dancerPose(d, t, tq, ears, se, sk) {
    let p = t - d.tSw < 1 / 12 ? blend(d.prev, d.cur, 0.5) : d.cur;
    if (ears.active && ears.bass > 0.85 && p.dy >= 0) p = { ...p, dy: p.dy + 1 };
    const trem = Math.floor(tq * 12 + d.seed * 4) % 2 ? 1 : 0;
    if (sk === "laugh" && se > 0.2 && se < 2.7) p = { ...SPECIAL.cower, lean: trem };
    else if (sk === "boo") {
      if (se > 0.3 && se < 0.42) p = SPECIAL.fall;
      else if (se >= 0.42 && se < 2.3) p = { ...SPECIAL.fall, pile: 1 };
      else if (se >= 2.3 && se < 2.5) p = SPECIAL.fall;
    } else if (sk === "scream" && se > 0.3 && se < 3.3) p = { ...SPECIAL.freeze, look: this.sc.side, lean: trem * this.sc.side };
    else if (sk === "cat") {
      const cat = this.catX;
      if ((se > 0.7 && se < 1.6) || (cat !== undefined && Math.abs(cat - d.x) < 24)) p = SPECIAL.startle;
    }
    d.shown = p;
    return p;
  }

  drawDancer(d, t, tq, ears, se, sk) {
    const p = this.dancerPose(d, t, tq, ears, se, sk);
    const L = this.dl, ox = 22, oy = 56;
    L.clear();
    if (d.kind === "pump") this.pumpkin(L, ox, oy, p, d, ears, tq, sk);
    else if (p.pile) this.pile(L, ox, oy, d);
    else this.skeleton(L, ox, oy, p, ears);
    L.outline(C.K);
    const tint = d.row === "back" ? (c) => mix(c, C.hill, 0.35) : null;
    this.buf.blit(L, d.x - ox, d.fy - oy, false, tint);
  }

  skeleton(L, fx, fy, p, ears) {
    const hipY = fy - 16 + p.dy, hx = fx + p.lean * 0.5, cxx = fx + p.lean;
    const limb = (x0, y0, side, a, f, l1, l2) => {
      const a1 = a * D, a2 = (a + f) * D;
      const x1 = x0 + side * Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + side * Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      return [x1, y1, x2, y2];
    };
    const bone = (x0, y0, x1, y1) => { L.line(x0, y0, x1, y1, C.K, 3); L.line(x0, y0, x1, y1, C.bone, 1); };
    // legs
    for (const [side, u, k] of [[-1, p.uL, p.kL], [1, p.uR, p.kR]]) {
      const x0 = hx + side * 2, [x1, y1, x2, y2] = limb(x0, hipY + 1, side, u, k, 8, 8);
      bone(x0, hipY + 1, x1, y1); bone(x1, y1, x2, y2);
      L.line(x2, y2, x2 + side * 2, y2, C.boneM, 1);
      L.set(x1, y1, C.boneM);
    }
    L.blit(PELVIS, hx - 3, hipY - 1);
    for (let y = hipY - 2; y > hipY - 12; y--) L.set(Math.round(lerp(hx, cxx, (hipY - y) / 12)), y, y % 2 ? C.bone : C.boneD);
    L.blit(RIBS, cxx - 4, hipY - 13);
    const arms = () => {
      for (const [side, a, f] of [[-1, p.aL, p.fL], [1, p.aR, p.fR]]) {
        const x0 = cxx + side * 5, y0 = hipY - 12, [x1, y1, x2, y2] = limb(x0, y0, side, a, f, 6, 6);
        bone(x0, y0, x1, y1); bone(x1, y1, x2, y2);
        L.rect(Math.round(x2) - 1, Math.round(y2) - 1, 2, 2, C.boneM);
      }
    };
    const over = p.aL > 140 && p.fL > 60;
    if (!over) arms();
    const sx = Math.round(cxx + p.tilt - 5 + p.sx), sy = Math.round(hipY - 24 + p.sy);
    L.blit(SKULL, sx, sy);
    const lk = Math.round(clamp(p.look, -1, 1));
    L.rect(sx + 2 + lk, sy + 3, 2, 3, C.ink); L.rect(sx + 7 + lk, sy + 3, 2, 3, C.ink);
    if (ears.pulse > 0.6) { L.set(sx + 2 + lk + (lk > 0 ? 1 : 0), sy + 4, C.magic); L.set(sx + 7 + lk + (lk > 0 ? 1 : 0), sy + 4, C.magic); }
    L.set(sx + 5, sy + 6, C.ink);
    L.blit(JAW, sx + 2, sy + 9 + Math.round(p.jaw));
    if (over) arms();
  }

  pile(L, fx, fy, d) {
    const s = d.flip ? -1 : 1;
    const bone = (x0, y0, x1, y1) => { L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.K, 3); L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.bone, 1); };
    bone(-12, -2, -4, -1); bone(-3, -4, 4, -2); bone(6, -1, 13, -3); bone(-8, -5, -1, -6); bone(10, -6, 15, -2);
    L.blit(RIBS, fx - 4 - 2 * s, fy - 9);
    L.blit(PELVIS, fx + 3 * s - 3, fy - 4);
    L.blit(SKULL, fx + 6 * s - 5, fy - 10);
    L.rect(fx + 6 * s - 3, fy - 7, 2, 3, C.ink); L.rect(fx + 6 * s + 2, fy - 7, 2, 3, C.ink);
    L.blit(JAW, fx - 12 * s - 3, fy - 3);
  }

  pumpkin(L, fx, fy, p, d, ears, tq, sk) {
    const wide = (d.step % 2 === 0) !== (p.dy > 0);
    const sit = p.pile || p === SPECIAL.fall || (p.aL > 140 && p.fL > 60);
    const hop = !sit && p.dy < -2 ? -4 : !sit && d.step % 4 === 3 ? -2 : 0;
    const capeH = sit ? 4 : 12, top = fy - capeH + hop;
    for (let y = 0; y < capeH; y++) {
      const f = y / Math.max(1, capeH - 1), hw = sit ? 6 + y * 2 : 3 + f * (wide ? 6 : 4.5);
      for (let x = -Math.round(hw); x <= Math.round(hw); x++) {
        let c = x > hw * 0.45 ? C.capeM : C.cape;
        if (!sit && y > capeH * 0.55 && Math.abs(x) <= (y - capeH * 0.55) * 0.6) c = C.capeD;
        L.set(fx + x, top + y, c);
      }
    }
    if (!sit) { L.rect(fx - 4, top - 1, 9, 2, C.cape); L.rect(fx + 2, top - 1, 3, 2, C.capeM); }
    const bob = d.step % 2 && !sit ? 1 : 0, hx = fx - 6 + Math.round(p.tilt * 0.5);
    L.blit(PUMPHEAD, hx, top - 10 + bob);
    if (ears.pulse > 0.7 && !sit) { L.set(hx + 3, top - 10 + bob + 5, C.white); L.set(hx + 9, top - 10 + bob + 5, C.white); }
  }

  // ---------- cat ----------
  drawCat(se) {
    const { W, H } = this, s = this.sc.side, from = s < 0 ? -24 : W + 4, mid = this.cx + 30 * -s;
    let x, spr, flip = s > 0;
    if (se < 0.7) { x = lerp(from, mid, se / 0.7); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    else if (se < 1.6) { x = mid; spr = CAT_ARCH; if (Math.floor(se * 16) % 2) x += 1; }
    else { x = lerp(mid, s < 0 ? W + 24 : -30, (se - 1.6) / 0.8); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    this.catX = se < 2.5 ? x : undefined;
    const L = new Buf(spr.w + 2, spr.h + 2);
    L.blit(spr, 1, 1, flip);
    L.outline(C.K);
    // the cat runs right past the camera, so it is drawn twice as big
    this.buf.blitScaled(L, 2, x, H - 1, L.w / 2, L.h);
    if (se < 0.7 || se > 1.6) this.parts.push({ k: "dust", x: x - (flip ? -14 : 14), y: H - 4, t0: this.lastT, life: 0.3 });
  }

  // ---------- particles ----------
  drawParts(t, dt, ears, layer) {
    const { buf } = this;
    if (layer === "mid") {
      // spell stream from the ghost's raised hand to the ladle
      const gh = this.ghostHand, lt = this.ladleTop;
      if (gh && lt && gh.cast) {
        const n = (4 + ears.mid * 10 + ears.pulse * 8) * dt * 6;
        for (let i = 0; i < n; i++) if (Math.random() < n / Math.ceil(n)) this.parts.push({ k: "spell", t0: t, life: 0.9 + Math.random() * 0.3, j: Math.random() * 6, a: { ...gh }, b: { ...lt } });
      }
    }
    const keep = [];
    for (const q of this.parts) {
      const age = (t - q.t0) / q.life;
      if (age >= 1) continue;
      keep.push(q);
      const top = q.k === "spell" || q.k === "ha" || q.k === "ring" || q.k === "skull";
      if (top !== (layer === "top")) continue;
      if (q.k === "ember") {
        const x = q.x + q.vx * age * q.life, y = q.y + q.vy * age * q.life;
        buf.set(x, y, age < 0.5 ? C.fire[1] : C.fire[3]);
      } else if (q.k === "bubble") {
        const r = age < 0.7 ? 1 : 2;
        if (age < 0.7) { buf.set(q.x, q.y, C.brewL); buf.set(q.x + 1, q.y, C.brewL); buf.set(q.x, q.y - 1, C.brew); }
        else { buf.set(q.x - r, q.y, C.brewL); buf.set(q.x + r + 1, q.y, C.brewL); buf.set(q.x, q.y - r, C.brewL); }
      } else if (q.k === "steam") {
        const x = q.x + q.vx * age * q.life + Math.sin(age * 6 + q.x) * 2, y = q.y + q.vy * age * q.life, r = q.r + age * 3, a = (1 - age) * 0.7;
        for (let yy = -Math.ceil(r); yy <= Math.ceil(r); yy++) for (let xx = -Math.ceil(r); xx <= Math.ceil(r); xx++) {
          if (xx * xx + yy * yy > r * r) continue;
          const X = Math.round(x + xx), Y = Math.round(y + yy);
          if (a > bayer(X, Y)) buf.set(X, Y, yy < 0 ? C.brewL : C.magicD);
        }
      } else if (q.k === "dust") {
        buf.set(q.x - age * 6, q.y - age * 4, C.ground3); buf.set(q.x + 1 - age * 3, q.y - age * 6, C.ground3);
      } else if (q.k === "spell") {
        const u = age, mx = (q.a.x + q.b.x) / 2, my = Math.min(q.a.y, q.b.y) - 22;
        const x = (1 - u) ** 2 * q.a.x + 2 * (1 - u) * u * mx + u * u * q.b.x + Math.sin(u * 9 + q.j) * 2.5;
        const y = (1 - u) ** 2 * q.a.y + 2 * (1 - u) * u * my + u * u * q.b.y + Math.cos(u * 7 + q.j) * 2;
        const c = q.j > 4 ? C.magicL : q.j > 1.5 ? C.magic : C.magicD;
        buf.set(x, y, c);
        if (q.j > 5.4) { buf.set(x + 1, y, C.magic); buf.set(x - 1, y, C.magic); buf.set(x, y + 1, C.magic); buf.set(x, y - 1, C.magic); }
      } else if (q.k === "ring") {
        const rx = 20 + age * 22, ry = 4 + age * 5;
        for (let i = 0; i < 40; i++) {
          if ((i + Math.floor(age * 8)) % 3 === 0) continue;
          const a = (i / 40) * Math.PI * 2;
          buf.set(this.cx + Math.cos(a) * rx, this.rimY + Math.sin(a) * ry, age < 0.5 ? C.magicL : C.magicD);
        }
      } else if (q.k === "skull") {
        const y = q.y - age * 30, a = (1 - age) * 0.8;
        for (let yy = 0; yy < SKULL.h; yy++) for (let xx = 0; xx < SKULL.w; xx++) {
          if (!SKULL.d[yy * SKULL.w + xx]) continue;
          const X = Math.round(q.x - 5 + xx + Math.sin(age * 5) * 2), Y = Math.round(y + yy);
          if (a > bayer(X, Y)) buf.set(X, Y, (xx === 3 || xx === 8) && yy > 2 && yy < 6 ? C.magicD : C.brewL);
        }
      } else if (q.k === "ha") {
        const y = q.y - age * 26, x = q.x + Math.sin(age * 8) * 3;
        this.textOut("HA", Math.round(x), Math.round(y), 2, age > 0.7 && Math.floor(age * 20) % 2 ? C.ghostM : C.ghost);
      }
    }
    this.parts = keep;
    if (layer === "top" && this.sc && this.sc.kind === "laugh") {
      const se = t - this.sc.t0, n = Math.floor((se - 0.2) / 0.32);
      if (se > 0.2 && se < 2.6 && n >= this.sc.has) {
        this.sc.has = n + 1;
        const m = this.ghostMouth;
        this.parts.push({ k: "ha", x: m.x + (n % 2 ? 14 : -36), y: m.y - 6, t0: t, life: 1.1 });
      }
    }
  }

  drawBats(t, dt) {
    this.bats = this.bats.filter((b) => t - b.t0 < 4);
    for (const b of this.bats) {
      const e = t - b.t0;
      if (e < 0) continue;
      const x = b.x + b.vx * e, y = b.y + b.vy * e + Math.sin(e * 9) * 3;
      this.buf.blit(BAT[Math.floor(e * 10) % 2], x - 3, y - 2, b.vx < 0);
    }
    // an occasional lone bat crossing the moon
    if (Math.random() < 0.002 && this.bats.length < 3) {
      const s = Math.random() < 0.5 ? -1 : 1;
      this.bats.push({ x: s < 0 ? -10 : this.W + 10, y: 15 + Math.random() * 40, vx: -s * (40 + Math.random() * 30), vy: (Math.random() - 0.5) * 6, t0: t });
    }
  }

  textOut(s, x, y, sc, c, o = 1) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) text(this.buf, s, x + dx * o, y + dy * o, sc, C.K);
    text(this.buf, s, x, y, sc, c);
  }
}
