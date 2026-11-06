// V6 scene, after the second round of pins: light haze on the distance, a plain background cross on the far hill, moonlit cloud rims,
// softer bark glints, a cleaner skull. V5 was after Dmitrii's 21 pins on V4 (review page review.html):
// graves grounded and layered behind the trees, every stone/cross with bevel, moss, chips and cracks; clouds behind the trees with billows;
// a neat dead tree behind the moon; the clearing lower for a steeper diagonal; bark lit as a dithered gradient with grooves, knots, cracks;
// richer front leaves; more detailed skeletons (cower covers the face, a rare somersault); the cauldron on a fire again, smooth shading,
// boiling on the beat; the reaper's scythe hand without holes. Older looks: js/scene-v1.js .. scene-v5.js (?v=1..5).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";

const C = {
  K: pk(0x02020a), ink: pk(0x05040c), white: pk(0xffffff),
  // sky bands top -> horizon (fraction of H where each band starts)
  sky: [[0, 0x100d2e], [0.08, 0x15113a], [0.16, 0x1b1744], [0.24, 0x211e4e], [0.31, 0x272858], [0.37, 0x2c3262], [0.43, 0x323b6c]].map(([y, c]) => [y, pk(c)]),
  halo: pk(0x3a4378), halo2: pk(0x323a70),
  star: pk(0xeef6ff), star2: pk(0x8890c8),
  moon: pk(0xeefcfa), moonM: pk(0xd6eaea), moonD: pk(0xb6cfd8), moonE: pk(0xc8dde4),
  cloudLL: pk(0x51609c), cloudL: pk(0x3f4b84), cloud: pk(0x2e356a), cloudD: pk(0x24285c), cloudDD: pk(0x1c1e4e),
  farTree: pk(0x34548e), farTreeD: pk(0x2e4c84),
  far: pk(0x264873), farS: pk(0x1d3360), deadTree: pk(0x18264f),
  vale: pk(0x1f4d72), valeD: pk(0x1a4167), valeS: pk(0x163557),
  gr: [0x7fd2c0, 0x5db5ae, 0x3a8e9e, 0x2f7c8f, 0x267085, 0x1f667d, 0x1c5a74, 0x184c69].map(pk),
  // bark, dark side to lit side
  bark: [0x18153f, 0x1f1b4c, 0x29275f, 0x2c3670, 0x2e4a80].map(pk), rim: pk(0x2f7a88), rimL: pk(0x469ea4), rimS: pk(0x2e5f86),
  haze: pk(0x4a68a0), silver: pk(0xc4d8ea), moonRim: pk(0x8ea4d4), moonRim2: pk(0x5f71aa),
  moss: pk(0x2a5e62), mossL: pk(0x3f8478), mossD: pk(0x1e4650),
  leafDD: pk(0x06071a), leaf: pk(0x0c0e28), leafM: pk(0x141a3c), leafV: pk(0x1e2a50), leafL: pk(0x2f8a96), leafLL: pk(0x62c4b8),
  cap: pk(0x6a2e9a), capL: pk(0xa66ad8), stem: pk(0xc8c2dc),
  pot: [0x1e2242, 0x2a3058, 0x3a4270, 0x4c5684, 0x606c9c, 0x7c8ab6, 0xa2b0d6].map(pk), potHL: pk(0xd8e2f6), potRim: pk(0xa4b0d6),
  brew: pk(0x6cf060), brewM: pk(0x34c050), brewD: pk(0x1a8a3a), brewL: pk(0xd8ffc0),
  fire: [0xfff6c0, 0xffd860, 0xffa030, 0xf06020, 0xb02818].map(pk), ember: pk(0xff7a2a),
  log: pk(0x6a3a20), logD: pk(0x3e200f), logL: pk(0x9a6034), ash: pk(0x3a3450),
  robe: pk(0x5a2a8e), robeM: pk(0x45206e), robeD: pk(0x2e1450), robeL: pk(0x7444b0), hood: pk(0x05040c), glove: pk(0x15111f), gloveL: pk(0x3a3456),
  eye: pk(0x40d8ff), eyeL: pk(0xc8f6ff), redEye: pk(0xff3a3a),
  bone: pk(0xf4ecd0), boneM: pk(0xd2c49e), boneD: pk(0x9a8a68),
  wood: pk(0x8a5a30), woodD: pk(0x553418), woodL: pk(0xb07a44),
  blade: pk(0xe0e4ec), bladeL: pk(0xffffff), bladeM: pk(0x9ca2b4),
  magic: pk(0x40c8ff), magicL: pk(0xd0f6ff), magicP: pk(0x9a5cff), magicPL: pk(0xd2acff),
  cat: pk(0x2a2c52), catL: pk(0x6a72a8), catEye: pk(0xffe23a),
  red: pk(0xff2a2a), redD: pk(0x9a1010),
  green: pk(0x50ff90), warm: pk(0xff9a40), flash: pk(0xb8d8ff), black: pk(0x020104),
};
// stone materials: [cut, deep shadow, shadow, base, low, light, edge]
const GREY = { cut: pk(0x1c1c42), DD: pk(0x24244e), D: pk(0x2e2f5e), M: pk(0x3a3d6c), base: pk(0x464a7a), L: pk(0x5f86b6), L2: pk(0x86aed2) };
const PURPLE = { cut: pk(0x170f32), DD: pk(0x1f1844), D: pk(0x2a1e54), M: pk(0x32255e), base: pk(0x3c2c6c), L: pk(0x3a8e98), L2: pk(0x63c8bd) };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const D = Math.PI / 180;
const pick = (r, a) => a[Math.floor(r() * a.length)];
/** clean pixel-art dither between two colours: 2 px checker at the seam, sparse dots before it */
const seam = (x, y, d, a, b) => (d < 2 ? ((x + y) & 1 ? b : a) : d < 4 ? (!(x & 1) && !(y & 1) ? b : a) : a);
/** a value 0..1 to one of n tones; only a thin checker band at each step edge */
const tone = (v, x, y, cols) => { const f = clamp(v, 0, 0.999) * cols.length, i = Math.floor(f); return cols[Math.min(cols.length - 1, f - i > 0.78 && (x + y) & 1 ? i + 1 : i)]; };

/** nearest-neighbour rotation of a layer about (cx, cy) */
export function rotateBuf(src, cx, cy, a) {
  const out = new Buf(src.w, src.h), c = Math.cos(a), s = Math.sin(a);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const dx = x - cx, dy = y - cy, sx = Math.round(cx + dx * c + dy * s), sy = Math.round(cy - dx * s + dy * c);
    if (sx >= 0 && sy >= 0 && sx < src.w && sy < src.h) out.d[y * src.w + x] = src.d[sy * src.w + sx];
  }
  return out;
}

// ---------- sprites ----------
const BP = { w: C.bone, m: C.boneM, d: C.boneD };
// skull: rounded cranium, temple shade on the right, cheekbones, teeth; sockets and nose are cut in by code
const SKULL = sprite([
  "....wwwww....",
  "..wwwwwwwwm..",
  ".wwwwwwwwwwm.",
  "wwwwwwwwwwwwm",
  "wwwwwwwwwwwwm",
  "wwwwwwwwwwwwm",
  "wwwwwwwwwwwwm",
  ".wwwwwwwwwwm.",
  "..mwwwwwwwm..",
  "..wwwwwwwwm..",
  "..w.w.w.w.m..",
], BP);
const JAW = sprite(["w.w.w.w.m", "wwwwwwwmm", ".wwwwwmm."], BP);
const RIBS = sprite([
  "...wwwww...",
  ".....w.....",
  ".wwwwwwwwm.",
  "w....w....m",
  ".wwwwwwwwm.",
  "w....w....m",
  ".wwwwwwwm..",
  ".....w.....",
  "..wwwwwwm..",
], BP);
const PELVIS = sprite([".wwwwwwm.", "ww.www.mm", "w..w.w..m", ".w.....m."], BP);
const CP = { k: C.cat, l: C.catL, y: C.catEye };
const CAT_RUN = [
  sprite(["................k.k.", "...............kkkk.", "k.............kkykyk", ".k...........kkkkkkk", "..llllllllllllkkkkk.", "..kkkkkkkkkkkkkkkk..", "..kk..........kk....", ".kk............kk...", "kk..............kk.."], CP),
  sprite(["................k.k.", "...............kkkk.", "k..............kykyk", ".k....lllllllllkkkkk", "..k.kkkkkkkkkkkkkkk.", "...kkkkkkkkkkkkkk...", ".....kk...kkk.......", "......kk.kk.........", ".......kkk.........."], CP),
];
const CAT_ARCH = sprite(["k......lllllll.......", "kk...kkkkkkkkkkk.....", ".k..kkkkkkkkkkkkk.k.k", ".kk.kkkk.....kkkkkkkk", "..kkkk.........kkykyk", "..kkk..........kkkkkk", "..kk...........kk.kk.", "..kk...........kk.kk.", "..kk...........kk.kk.", ".kkk..........kkk.kkk"], CP);
const BATP = { b: pk(0x0c0a24), r: C.red };
const BAT = [sprite(["b.....b", "bb.b.bb", ".bbrbb.", "...b..."], BATP), sprite(["...b...", ".bbrbb.", "bb.b.bb", "b.....b"], BATP)];

// ---------- poses ----------
// a = upper arm angle out from straight down (deg), f = forearm extra turn (+ outward/up), u = thigh angle out, k = shin extra turn (- = inward)
// front: draw the arms over the skull
const BASE = { aL: 20, fL: 10, aR: 20, fR: 10, uL: 6, kL: -6, uR: 6, kR: -6, dy: 0, lean: 0, tilt: 0, jaw: 0, look: 0, sx: 0, sy: 0, front: 0 };
const P = (o) => ({ ...BASE, ...o });
function flipPose(p) { return { ...p, aL: p.aR, fL: p.fR, aR: p.aL, fR: p.fL, uL: p.uR, kL: p.kR, uR: p.uL, kR: p.kL, lean: -p.lean, tilt: -p.tilt, look: -p.look }; }
// a ring dance: every move is a loop of key poses, one per beat, blended smoothly
const STEP = P({ aL: 60, fL: 50, aR: 60, fR: 50, uL: 22, kL: -40, uR: 4, kR: -2, dy: -1, lean: -1, tilt: -1 });
const MOVES = {
  ring: [STEP, P({ aL: 45, fL: 30, aR: 45, fR: 30, uL: 8, kL: -12, uR: 8, kR: -12, dy: 1 }), flipPose(STEP), P({ aL: 45, fL: 30, aR: 45, fR: 30, uL: 8, kL: -12, uR: 8, kR: -12, dy: 1 })],
  wave: [P({ aL: 155, fL: 20, aR: 40, fR: -30, uL: 10, kL: -14, lean: 1 }), P({ aL: 40, fL: -30, aR: 155, fR: 20, uR: 10, kR: -14, dy: 1, lean: -1 })],
  kick: [P({ aR: 150, fR: 25, aL: 55, fL: -35, uL: 8, kL: -12, uR: 80, kR: 4, lean: -1, tilt: -1 }), P({ aL: 70, fL: 30, aR: 70, fR: 30, dy: 1, uL: 12, kL: -20, uR: 12, kR: -20 }), P({ aL: 150, fL: 25, aR: 55, fR: -35, uR: 8, kR: -12, uL: 80, kL: 4, lean: 1, tilt: 1 }), P({ aL: 70, fL: 30, aR: 70, fR: 30, dy: 1, uL: 12, kL: -20, uR: 12, kR: -20 })],
  jump: [P({ aL: 150, fL: 35, aR: 150, fR: 35, uL: 30, kL: -75, uR: 20, kR: -50, dy: -4, jaw: 1 }), P({ aL: 110, fL: 40, aR: 110, fR: 40, uL: 14, kL: -26, uR: 14, kR: -26, dy: 2 })],
  hips: [P({ aL: 50, fL: -110, aR: 50, fR: -110, dy: 2, uL: 14, kL: -26, uR: 14, kR: -26, tilt: -1, jaw: 1 }), P({ aL: 50, fL: -110, aR: 50, fR: -110, tilt: 1 })],
  chomp: [P({ aL: 75, fL: 60, aR: 75, fR: -30, jaw: 1, dy: 1, tilt: -1 }), P({ aL: 75, fL: -30, aR: 75, fR: 60, tilt: 1 })],
  sway: [P({ lean: -1, tilt: -1, aL: 25, aR: 12 }), P({ lean: 1, tilt: 1, aL: 12, aR: 25 })],
};
const DANCE = ["ring", "ring", "wave", "kick", "jump", "hips", "chomp"];
const SPECIAL = {
  // forearms crossed in front of the face, knees bent
  cower: P({ aL: 130, fL: -235, aR: 130, fR: -235, uL: 16, kL: -30, uR: 16, kR: -30, dy: 3, jaw: 1, front: 1 }),
  startle: P({ aL: 170, fL: -10, aR: 170, fR: -10, uL: 18, kL: 0, uR: 18, kR: 0, dy: -6, jaw: 1 }),
  freeze: P({ aL: 40, fL: 70, aR: 40, fR: 70, uL: 10, kL: -10, uR: 10, kR: -10, jaw: 1, dy: 1 }),
  fall: P({ aL: 110, fL: 30, aR: 110, fR: 30, uL: 60, kL: -10, uR: 60, kR: -10, dy: 7, sx: 3, sy: 6, jaw: 1 }),
  // the somersault: crouch, then a tight tuck while it turns over in the air
  crouch: P({ aL: 35, fL: 20, aR: 35, fR: 20, uL: 30, kL: -60, uR: 30, kR: -60, dy: 5 }),
  tuck: P({ aL: 70, fL: -120, aR: 70, fR: -120, uL: 160, kL: -170, uR: 160, kR: -170, jaw: 1 }),
};
export { MOVES, SPECIAL };
const blend = (a, b, t) => Object.fromEntries(Object.keys(BASE).map((k) => [k, lerp(a[k] || 0, b[k] || 0, t)]));
export const FLIP = { dur: 1.15, every: [600, 1200] }; // seconds; one skeleton flips every 10-20 min (about 15 on average)

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
    this.sc = null;
    this.lastBeat = -1;
    this.idleT = 0;
    this.refPoses = false; // true = the still-frame layout (ring at a fixed angle, cast pose)
    this.ringA = 30 * D;
    this.glowV = 0.4;
    this.flipAt = null;
    this.r = rng(1031);
    this.names = []; // review support: what drew each pixel (ids maps), see tag()
    this.trace = false; // per-frame id map, only for the review page
    this.condL = new Buf(80, 90);
    this.potL = new Buf(48, 44);
    this.dl = new Buf(64, 72);
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.buf = new Buf(W, H);
    this.cx = Math.round(W * 0.45); // cauldron
    this.potY = Math.round(H * 0.85); // cauldron feet
    this.rimY = this.potY - 27;
    this.ring = { rx: 58, ry: 14 };
    this.cond = { x: Math.round(W * 0.8), y: Math.round(H * 0.33) }; // reaper hood centre
    this.dancers = [0, 1, 2, 3].map((k) => ({ k, move: "ring", step: k, prev: P({}), cur: P({}), tSw: -9, seed: k * 0.27, flipT0: -99, flipDir: 1 }));
    this.stars = [[0.02, 0.04], [0.19, 0.31], [0.26, 0.12], [0.36, 0.08], [0.42, 0.04], [0.67, 0.07], [0.72, 0.03], [0.62, 0.2], [0.68, 0.36], [0.93, 0.08], [0.98, 0.3], [0.84, 0.05], [0.5, 0.02], [0.12, 0.18], [0.58, 0.42]].map(([x, y], i) => ({ x: Math.round(W * x), y: Math.round(H * y), b: (i * 0.37) % 1 }));
    const r = rng(77);
    this.eyes = [];
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? 10 + r() * W * 0.2 : W - 10 - r() * W * 0.2;
      this.eyes.push({ x: Math.round(x), y: Math.round(H * (0.42 + r() * 0.2)), side, ph: r() * 10 });
    }
    this.moon = { x: Math.round(W * 0.5), y: Math.round(H * 0.25), r: Math.round(H * 0.215) };
    this.bg = this.buildBg();
    this.treesL = this.buildTrees();
    this.clouds = this.buildClouds();
    this.fgL = this.buildFg();
  }

  // ---------- review support: name what each step draws ----------
  nameId(n) { let i = this.names.indexOf(n); if (i < 0) { this.names.push(n); i = this.names.length - 1; } return i + 1; }
  /** run fn; every pixel of buf it changed is credited to name in ids */
  tag(buf, ids, name, fn) {
    const before = buf.d.slice();
    fn();
    const id = this.nameId(name), d = buf.d;
    for (let i = 0; i < d.length; i++) if (d[i] !== before[i]) ids[i] = id;
  }
  /** outline pixels (opaque, no id yet) take the id of an opaque neighbour */
  claimEdges(buf, ids) {
    const { w, h, d } = buf;
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i] || ids[i]) continue;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (j >= 0 && j < d.length && ids[j]) { ids[i] = ids[j]; break; }
    }
  }

  // ---------- terrain lines ----------
  farTop(x) { return Math.round(this.H * 0.47 + 3 * Math.sin(x * 0.03 + 1) + 2 * Math.sin(x * 0.09)); }
  valeTop(x) { return Math.round(this.H * 0.56 + 3 * Math.sin(x * 0.022 + 2) + 1.5 * Math.sin(x * 0.07)); }
  /** the ground: a lower clearing on the left, a hill rising in an S to the right (steeper diagonal since V5) */
  groundTop(x) {
    const { W, H } = this, u = clamp((x - W * 0.34) / (W * 0.54));
    return Math.round(H * (0.73 - 0.235 * smooth(u)) + 1.5 * Math.sin(x * 0.045 + 1));
  }

  buildBg() {
    const { W, H } = this, b = new Buf(W, H), m = this.moon, r = rng(4242);
    const ids = (this.bgIds = new Uint16Array(W * H)), tag = (name, fn) => this.tag(b, ids, name, fn);
    tag("небо", () => {
      for (let y = 0; y < H; y++) {
        let i = 0;
        while (i < C.sky.length - 1 && y >= C.sky[i + 1][0] * H) i++;
        const next = i < C.sky.length - 1 ? C.sky[i + 1][0] * H : 1e9;
        for (let x = 0; x < W; x++) {
          let c = seam(x, y, next - y, C.sky[i][1], i < C.sky.length - 1 ? C.sky[i + 1][1] : C.sky[i][1]);
          const d = Math.hypot(x - m.x, y - m.y) - m.r;
          if (d > 0 && d < 9) c = d < 5 ? C.halo : seam(x, y, 9 - d, c, C.halo2);
          b.d[y * W + x] = c;
        }
      }
    });
    tag("луна", () => {
      const blob = (x, y) => 0.5 + 0.3 * Math.sin(x * 0.13 + 1.3) * Math.sin(y * 0.16 - 0.4) + 0.2 * Math.sin((x - y) * 0.09 + 2) + 0.12 * Math.sin(x * 0.31 + y * 0.27);
      for (let y = -m.r; y <= m.r; y++) for (let x = -m.r; x <= m.r; x++) {
        const d = Math.hypot(x, y);
        if (d > m.r + 0.3) continue;
        const v = blob(x & ~1, y & ~1);
        let c = v > 0.78 ? C.moonD : v > 0.64 ? C.moonM : C.moon;
        if (d > m.r - 1.2) c = C.moonE;
        b.set(m.x + x, m.y + y, c);
      }
    });
    tag("дальние холмы", () => { for (let x = 0; x < W; x++) for (let y = this.farTop(x); y < H; y++) b.set(x, y, C.far); });
    tag("сухое дерево за луной", () => this.deadTree(b, Math.round(W * 0.585), this.farTop(W * 0.585) + 2, C.deadTree));
    tag("деревце на дальнем холме", () => this.silTree(b, Math.round(W * 0.31), this.farTop(W * 0.31) + 2, 24, C.farS, rng(8), 2.5));
    tag("силуэты могил вдали", () => [0.06, 0.15, 0.36, 0.41, 0.46, 0.52, 0.63, 0.69, 0.74, 0.88].forEach((fx, i) => this.graveSil(b, Math.round(W * fx), this.farTop(W * fx) + 3, i, C.farS)));
    const F = new Buf(W, H);
    this.silTree(F, Math.round(W * 0.03), this.valeTop(0) + 4, 120, C.farTree, rng(11), 9, -0.15);
    this.silTree(F, Math.round(W * 0.27), this.valeTop(W * 0.27) + 4, 90, C.farTree, rng(13), 7, 0.1);
    this.silTree(F, Math.round(W * 0.92), this.valeTop(W * 0.92) + 4, 80, C.farTreeD, rng(17), 6, 0);
    tag("дальние деревья", () => b.blit(F, 0, 0));
    tag("долина", () => { for (let x = 0; x < W; x++) { const top = this.valeTop(x); for (let y = top; y < H; y++) b.set(x, y, y - top < 1 ? C.far : seam(x, y, y - top - 6, C.vale, C.valeD)); } });
    this.haze(b);
    tag("силуэты могил в долине", () => [0.13, 0.24, 0.34, 0.49, 0.56, 0.66].forEach((fx, i) => this.graveSil(b, Math.round(W * fx), this.valeTop(W * fx) + 5, i + 3, C.valeS)));
    tag("крест на дальнем холме", () => this.graveSil(b, Math.round(W * 0.06), this.valeTop(W * 0.06) + 5, 1, C.valeS));
    tag("поляна и горка", () => {
      for (let x = 0; x < W; x++) {
        const top = this.groundTop(x);
        for (let y = top; y < H; y++) {
          const d = y - top, bands = [1, 3, 6, 11, 18, 28, 40];
          let i = 0;
          while (i < bands.length && d >= bands[i]) i++;
          const next = i < bands.length ? bands[i] - d : 1e9;
          b.d[y * W + x] = i < bands.length ? seam(x, y, next, C.gr[i], C.gr[i + 1]) : C.gr[7];
        }
      }
    });
    tag("полосы света на склоне", () => {
      for (let k = 0; k < 3; k++) {
        const off = [9, 17, 26][k];
        for (let x = Math.round(W * 0.28); x < W; x++) {
          const y = this.groundTop(x) + off + Math.round(Math.sin(x * 0.05 + k) * 2), on = Math.sin(x * 0.21 + k * 3) > -0.2;
          if (on) { b.set(x, y, C.gr[2 + k]); if (Math.sin(x * 0.11 + k) > 0.3) b.set(x, y - 1, C.gr[2 + k]); }
        }
      }
    });
    tag("трава на поляне", () => {
      for (let i = 0; i < W * 0.9; i++) {
        const x = Math.floor(r() * W), top = this.groundTop(x), y = Math.floor(top + 3 + r() * (H - top - 3)), d = y - top;
        b.rect(x, y, 2 + Math.floor(r() * 2), 1, d < 12 ? C.gr[2] : d < 30 ? C.gr[4] : C.gr[6]);
      }
      for (let x = 0; x < W; x += 2 + Math.floor(r() * 3)) { const top = this.groundTop(x); b.set(x, top - 1, C.gr[1]); if (r() < 0.4) b.set(x + 1, top - 2, C.gr[1]); }
    });
    // graves that stand on the ground behind the trees
    tag("надгробие с крестом слева", () => this.stone(b, Math.round(W * 0.035), this.groundTop(W * 0.035) + 22, 20, 24, "round", "cross", rng(41), GREY, true));
    tag("маленький крест у поляны", () => this.stone(b, Math.round(W * 0.235), this.groundTop(W * 0.235) + 7, 9, 14, "cross", null, rng(43), PURPLE, true));
    tag("крест на горке", () => this.stone(b, Math.round(W * 0.875), this.groundTop(W * 0.875) + 4, 15, 24, "cross", null, rng(47), PURPLE, true));
    return b;
  }

  /** a very light mist lying on the far hills and along the top of the valley, fine dither so it reads as air */
  haze(b) {
    const { W, H } = this;
    for (let x = 0; x < W; x++) {
      const f = this.farTop(x), v = this.valeTop(x);
      for (let y = Math.max(0, f - 10); y < Math.min(H, v + 16); y++) {
        const a = Math.max(0, 1 - Math.abs(y - (f + 6)) / 16) * 0.55 + Math.max(0, 1 - Math.abs(y - (v + 2)) / 12) * 0.45;
        if (a * (0.75 + 0.25 * Math.sin(x * 0.05 + y * 0.2)) > bayer(x, y) + 0.08) b.d[y * W + x] = mix(b.d[y * W + x], C.haze, 0.22);
      }
    }
  }

  /** flat dead-tree silhouette for the distance */
  silTree(b, x, y, h, col, r, th, lean = 0) {
    const br = (x0, y0, ang, len, w, d) => {
      let px = x0, py = y0;
      for (let i = 1; i <= len; i++) { px += Math.sin(ang); py -= Math.cos(ang); b.disc(px, py, Math.max(0, (w * (1 - (i / len) * 0.35) - 1) / 2), col); }
      if (d <= 0 || w < 1.1) return;
      for (let i = 0; i < 2 + (r() < 0.4 ? 1 : 0); i++) br(px, py, ang + (r() - 0.5) * 1.1 + (i - 0.5) * 0.8, len * (0.55 + r() * 0.2), w * 0.62, d - 1);
    };
    br(x, y, lean + (r() - 0.5) * 0.1, h * 0.4, th, 4);
  }

  /** the dead tree silhouetted against the moon, traced by hand: trunk, five limbs, forked 1 px twigs */
  deadTree(b, x, y, col) {
    const strokes = [
      [[0, 0, 4], [1, -8, 3], [0, -16, 3], [1, -24, 2], [0, -31, 1]],
      [[0, -12, 2], [-5, -17, 2], [-9, -19, 1], [-13, -24, 1]],
      [[1, -15, 2], [6, -19, 2], [10, -20, 1], [14, -25, 1]],
      [[1, -21, 2], [-3, -26, 1], [-5, -31, 1]],
      [[1, -23, 2], [5, -28, 1], [6, -34, 1]],
      [[0, -8, 2], [-6, -10, 1], [-9, -9, 1]],
      [[1, -5, 2], [6, -8, 1], [8, -12, 1]],
    ];
    for (const s of strokes) for (let k = 0; k < s.length - 1; k++) {
      const [x0, y0, w0] = s[k], [x1, y1, w1] = s[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= n; i++) { const t = i / n, w = lerp(w0, w1, t); if (w >= 2) b.disc(x + lerp(x0, x1, t), y + lerp(y0, y1, t), (w - 1) / 2, col); else b.set(x + lerp(x0, x1, t), y + lerp(y0, y1, t), col); }
    }
    for (const [tx, ty, a] of [[-13, -24, -0.4], [-13, -24, 0.3], [14, -25, 0.4], [14, -25, -0.3], [-5, -31, -0.2], [-5, -31, 0.5], [6, -34, 0.2], [6, -34, -0.5], [0, -31, 0], [-9, -9, -1.2], [8, -12, 0.6]]) {
      let px = x + tx, py = y + ty;
      for (let i = 0; i < 3; i++) { px += Math.sin(a); py -= Math.cos(a); b.set(px, py, col); }
    }
    for (const s of [-1, 1]) { b.set(x + s * 2, y + 1, col); b.set(x + s * 3, y + 2, col); } // roots
  }

  graveSil(b, x, y, i, col) {
    if (i % 3 === 1) { b.rect(x, y - 8, 2, 9, col); b.rect(x - 2, y - 6, 6, 2, col); }
    else { const w = i % 3 ? 7 : 5, h = i % 3 ? 7 : 6; for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) if (!(j === 0 && (k === 0 || k === w - 1))) b.set(x - (w >> 1) + k, y - h + j, col); }
  }

  /** clouds: billows built from puffs, lit top rim, inner billow lines, dark flat underside, thin wisps; drawn behind the trees */
  buildClouds() {
    const { W, H } = this;
    return [[0.36, 0.17, 0.24, 1, 0.5], [0.64, 0.1, 0.28, 2, 0.35], [0.67, 0.23, 0.12, 3, 0.6], [0.07, 0.12, 0.16, 4, 0.4]].map(([fx, fy, fw, seed, sp]) => {
      const r = rng(seed * 97), w = Math.round(W * fw), h = 16, B = new Buf(w + 30, h), base = 11, puffs = [];
      for (let x = 4; x < w - 4; x += 5 + Math.floor(r() * 6)) { const e = Math.min(x, w - x) / w; puffs.push([x + 15, base - 2 - e * 6 - r() * 2, 4 + e * 12 + r() * 3, 2 + e * 6 + r() * 1.5]); }
      const inside = (x, y) => y <= base && puffs.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
      for (let y = 0; y < h; y++) for (let x = 0; x < B.w; x++) {
        if (!inside(x, y)) continue;
        let up = 0; while (up < 4 && inside(x, y - up - 1)) up++;
        let dn = 0; while (dn < 4 && inside(x, y + dn + 1)) dn++;
        let c = up === 0 ? C.cloudLL : up === 1 ? C.cloudL : dn === 0 ? C.cloudDD : dn === 1 ? C.cloudD : C.cloud;
        if (c === C.cloud && dn === 2 && (x + y) & 1) c = C.cloudD;
        // the upper arc of a billow that sits in front of another one
        if (c === C.cloud && puffs.some(([cx, cy, rx, ry]) => { const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; return e > 0.78 && e <= 1 && y < cy; })) c = C.cloudL;
        B.set(x, y, c);
      }
      // wisps trailing from both ends
      for (const [x0, len, dir] of [[15, 6 + Math.floor(r() * 8), -1], [w + 14, 8 + Math.floor(r() * 10), 1]]) for (let i = 0; i < len; i++) { B.set(x0 + dir * i, base - (i > len / 2 ? 1 : 0), i < len * 0.6 ? C.cloud : C.cloudD); if (i < len * 0.3) B.set(x0 + dir * i, base + 1, C.cloudDD); }
      return { B, x: Math.round(W * fx) - (w + 30) / 2, y: Math.round(H * fy) - base, sp };
    });
  }

  /** the two framing trees, traced from the reference. Bark: a lit-to-shadow gradient across every limb (dithered only at the steps),
   *  a teal glint at the edge facing the moon, grooves along the wood, knots and cracks; thin twigs are plain black strokes */
  buildTrees() {
    const { W, H } = this, T = new Buf(W, H), r = rng(21), m = this.moon;
    const LEFT = [
      [[0.115, 1.03, 44], [0.15, 0.8, 32], [0.17, 0.6, 26], [0.2, 0.4, 21], [0.21, 0.2, 15], [0.225, 0.06, 10], [0.235, -0.03, 7]],
      [[0.2, 0.36, 13], [0.25, 0.29, 10], [0.3, 0.22, 8], [0.35, 0.18, 5], [0.385, 0.145, 3]],
      [[0.21, 0.24, 11], [0.26, 0.13, 8], [0.3, 0.05, 6], [0.33, -0.03, 3]],
      [[0.17, 0.5, 14], [0.12, 0.44, 11], [0.06, 0.4, 8], [0.0, 0.37, 6]],
      [[0.2, 0.3, 11], [0.14, 0.2, 9], [0.09, 0.12, 7], [0.03, 0.07, 4], [-0.01, 0.05, 3]],
      [[0.2, 0.43, 9], [0.26, 0.41, 7], [0.31, 0.39, 5], [0.355, 0.4, 3]],
      [[0.1, 0.43, 7], [0.075, 0.3, 5], [0.055, 0.22, 3]],
    ];
    const RIGHT = [
      [[0.975, 1.03, 36], [0.955, 0.8, 26], [0.95, 0.6, 21], [0.955, 0.4, 17], [0.94, 0.2, 13], [0.92, 0.05, 8], [0.91, -0.03, 6]],
      [[0.95, 0.38, 12], [0.9, 0.3, 9], [0.85, 0.23, 7], [0.8, 0.19, 4], [0.765, 0.18, 3]],
      [[0.94, 0.22, 10], [0.89, 0.12, 7], [0.86, 0.05, 5], [0.84, -0.01, 3]],
      [[0.95, 0.52, 8], [0.915, 0.48, 6], [0.885, 0.47, 3]],
      [[0.925, 0.1, 7], [0.97, 0.03, 4], [1.01, -0.01, 3]],
    ];
    const samples = [], tips = [], knots = [], ids = (this.treeIds = new Uint16Array(W * H));
    this.treeLabels = [];
    const limbs = [...LEFT, ...RIGHT], names = limbs.map((_, i) => (i < LEFT.length ? "левое дерево · " : "правое дерево · ") + ((i < LEFT.length ? i : i - LEFT.length) === 0 ? "ствол" : "ветка " + (i < LEFT.length ? i : i - LEFT.length)));
    limbs.forEach((pts, li) => this.tag(T, ids, names[li], () => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0, w0] = pts[k], [x1, y1, w1] = pts[k + 1], X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, n = Math.ceil(Math.hypot(X1 - X0, Y1 - Y0));
        const nx = -(Y1 - Y0) / n, ny = (X1 - X0) / n;
        for (let i = 0; i <= n; i++) {
          const t = i / n, w = lerp(w0, w1, t), cx = lerp(X0, X1, t) + Math.sin((k + t) * 4.1) * 1.1, cy = lerp(Y0, Y1, t);
          T.disc(cx, cy, Math.max(0, (w - 1) / 2), C.bark[2]);
          if (w > 20) samples.push([cx, cy, w, nx, ny]);
          if (w > 20 && i === Math.floor(n / 2)) knots.push([cx + nx * w * 0.1, cy]);
        }
      }
      const [xa, ya] = pts[pts.length - 2], [xb, yb] = pts[pts.length - 1];
      tips.push([xb * W, yb * H, Math.atan2((xb - xa) * W, -(yb - ya) * H), names[li]]);
      const mid = pts[Math.min(pts.length - 1, li === 0 || li === LEFT.length ? 2 : Math.floor(pts.length / 2))];
      this.treeLabels.push({ name: names[li], x: clamp(mid[0], 0.02, 0.98) * W, y: clamp(mid[1], 0.03, 0.97) * H });
    }));
    // light across each limb: measure the way to the lit edge (toward the moon) and to the dark edge, pick a tone from that
    const src = T.d.slice(), w = W, h = H;
    const emp = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && !src[Y * w + X];
    const raw = new Float32Array(W * H), edge = new Uint8Array(W * H), wid = new Uint8Array(W * H);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const sx = Math.sign(m.x - x) || 1;
      let dl = 0; while (dl < 16 && !emp(x + sx * (dl + 1), y)) dl++;
      let dd = 0; while (dd < 16 && !emp(x - sx * (dd + 1), y)) dd++;
      raw[y * w + x] = 1 - dl / Math.max(1, dl + dd);
      edge[y * w + x] = dl; wid[y * w + x] = Math.min(255, dl + dd + 1);
    }
    // smooth the light along the wood (a few rows up and down) so junctions don't leave steps
    this.barkLit = new Float32Array(W * H);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      let s2 = 0, n = 0;
      for (let k = -3; k <= 3; k++) { const Y = y + k; if (Y >= 0 && Y < h && src[Y * w + x]) { s2 += raw[Y * w + x]; n++; } }
      this.barkLit[y * w + x] = s2 / n;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const dl = edge[y * w + x], width = wid[y * w + x], lit = this.barkLit[y * w + x];
      let c;
      if (dl === 0 && width > 2) c = (y * 7 + x) % 17 === 0 ? C.rimL : C.rim;
      else if (dl === 1 && width > 4) c = (x + y) & 1 ? C.rimS : C.bark[4];
      else if (dl === 2 && width > 7) c = (x + y) & 1 ? C.bark[4] : tone(lit * 0.92, x, y, C.bark);
      else if (width <= 2) c = C.bark[1];
      else c = tone(lit * 0.92 + (emp(x, y - 1) ? 0.15 : 0), x, y, C.bark);
      // limb tops catch a little light too
      if (emp(x, y - 1) && !emp(x, y + 1) && !emp(x, y + 2) && lit > 0.35 && width > 3) c = lit > 0.7 ? C.rim : C.rimS;
      T.d[y * w + x] = c;
    }
    // grooves: a few long lines that follow the wood and drift across it; black, with teal beside them on the lit half
    for (let g = 0; g < samples.length / 6; g++) {
      let i = Math.floor(r() * samples.length), o = (r() - 0.5) * 0.6;
      const len = 14 + Math.floor(r() * 22), drift = (r() - 0.5) * 0.015;
      for (let k = 0; k < len && i < samples.length; k++, i++) {
        const [cx, cy, wd, nx, ny] = samples[i], X = Math.round(cx + nx * wd * o), Y = Math.round(cy + ny * wd * o), sx = Math.sign(m.x - X) || 1;
        o = clamp(o + drift, -0.38, 0.38);
        if (emp(X - 2, Y) || emp(X + 2, Y)) continue;
        const lit = this.barkLit[Y * w + X];
        T.set(X, Y, C.K);
        if (lit > 0.5 && k % 4 !== 3 && !emp(X + sx * 3, Y)) T.set(X + sx, Y, lit > 0.75 ? C.rim : C.rimS);
        else if (lit <= 0.5 && !emp(X - sx * 2, Y)) T.set(X - sx, Y, C.bark[0]);
      }
    }
    // knots: a dark hole with a lit lip
    for (const [kx, ky] of knots) {
      const X = Math.round(kx), Y = Math.round(ky), sx = Math.sign(m.x - X) || 1;
      T.ellipse(X, Y, 2, 3, C.bark[0]); T.rect(X, Y - 1, 1, 3, C.K);
      T.set(X + sx * 2, Y - 2, C.rim); T.set(X + sx * 2, Y - 1, C.rim); T.set(X - sx * 2, Y + 2, C.K);
    }
    // short cracks on the shadow side
    for (let i = 0; i < 70; i++) {
      const X = Math.floor(r() * W), Y = Math.floor(r() * H);
      if (!src[Y * w + X] || this.barkLit[Y * w + X] > 0.4 || emp(X - 2, Y) || emp(X + 2, Y)) continue;
      T.set(X, Y, C.K); T.set(X, Y + 1, C.K); if (r() < 0.5) T.set(X + (r() < 0.5 ? 1 : -1), Y + 2, C.bark[0]);
    }
    T.outline(C.K);
    this.claimEdges(T, ids);
    // sharp black twigs at the limb ends and a few along the way
    const twig = (x, y, a, len, wd) => {
      for (let i = 0; i <= len; i++) { x += Math.sin(a); y -= Math.cos(a); a += (r() - 0.5) * 0.12; if (i < len * 0.5 && wd > 1) T.disc(x, y, 0.6, C.K); else T.set(x, y, C.K); }
      if (len > 7 && r() < 0.6) twig(x, y, a + (r() < 0.5 ? -0.55 : 0.55), len * 0.5, 1);
    };
    for (const [x, y, a, nm] of tips) this.tag(T, ids, nm, () => { for (let i = 0; i < 3; i++) twig(x, y, a + (i - 1) * 0.5 + (r() - 0.5) * 0.25, 7 + r() * 9, 2); });
    for (let i = 0; i < 14; i++) {
      const s = i % 2 ? RIGHT : LEFT, li = 1 + (i % (s.length - 1)), pts = s[li], k = Math.floor(r() * (pts.length - 1)), t = r();
      const x = lerp(pts[k][0], pts[k + 1][0], t) * W, y = lerp(pts[k][1], pts[k + 1][1], t) * H;
      this.tag(T, ids, names[(i % 2 ? LEFT.length : 0) + li], () => twig(x, y, (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.8) + (i % 2 ? -0.3 : 0.3), 5 + r() * 6, 1));
    }
    return T;
  }

  /** carved stone or cross. Light from the upper left: a bright edge and a bevel row, a shadow band on the right, darker foot,
   *  speckles, chipped rim, moss, a crack, engraving cut in (dark line + light pixel), grass over the foot */
  stone(L, cx, base, w, h, shape, carving, r, pal = GREY, grass = true) {
    const S = new Buf(w + 4, h + 6), ox = 2, oy = 2;
    const bw = Math.max(3, Math.round(w * 0.3)), barY = Math.round(h * 0.22);
    const inside = (i, j) => {
      if (shape === "round") return !(j < w / 2 && Math.hypot(i - (w - 1) / 2, j - w / 2) > w / 2);
      if (shape === "point") return Math.abs(i - (w - 1) / 2 + j * 0.08) <= (j / h) * (w / 2) + 0.5;
      if (shape === "broken") return j > (i < w * 0.4 ? 2 + i * 0.6 : w * 0.24 + (w - i) * 0.25);
      if (shape === "cross") return Math.abs(i - (w - 1) / 2) < bw / 2 || (j >= barY && j < barY + bw);
      if (shape === "slab") return j >= (w - 1 - i) * 0.45;
      return true;
    };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inside(i, j)) S.set(ox + i, oy + j, pal.base);
    // chipped rim: knock out a few edge pixels
    const edge = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !S.get(ox + i + a, oy + j + b));
    for (let k = 0; k < (w + h) * 0.12; k++) { const i = Math.floor(r() * w), j = Math.floor(r() * h * 0.8); if (S.get(ox + i, oy + j) && edge(i, j)) S.set(ox + i, oy + j, 0); }
    const src = S.d.slice(), on = (i, j) => i >= 0 && j >= 0 && i < w && j < h && !!src[(oy + j) * S.w + ox + i];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!on(i, j)) continue;
      let c = pal.base;
      const r1 = !on(i + 1, j), r2 = !on(i + 2, j), r3 = !on(i + 3, j);
      if (!on(i, j - 1) || !on(i - 1, j)) c = !on(i, j - 1) && !on(i - 1, j) ? pal.L2 : pal.L;
      else if (r1) c = pal.DD;
      else if (r2) c = pal.D;
      else if (r3) c = (i + j) & 1 ? pal.D : pal.base;
      else if (!on(i, j - 2) || !on(i - 2, j)) c = (i + j) & 1 ? pal.L : pal.base; // bevel
      else if (j > h - 3) c = pal.M;
      else if (j > h - 5) c = (i + j) & 1 ? pal.M : pal.base;
      S.set(ox + i, oy + j, c);
    }
    // speckles, dark and light
    for (let k = 0; k < w * h * 0.03; k++) { const i = 2 + Math.floor(r() * (w - 4)), j = 2 + Math.floor(r() * (h - 4)); if (S.get(ox + i, oy + j) === pal.base) S.set(ox + i, oy + j, r() < 0.7 ? pal.M : pal.L); }
    // engraving
    const cut = (a, b2, c, d) => {
      const n = Math.max(Math.abs(c - a), Math.abs(d - b2)) || 1;
      for (let k = 0; k <= n; k++) { const i = Math.round(lerp(a, c, k / n)), j = Math.round(lerp(b2, d, k / n)); if (!on(i, j)) continue; S.set(ox + i, oy + j, pal.cut); if (on(i + 1, j + 1) && S.get(ox + i + 1, oy + j + 1) !== pal.cut) S.set(ox + i + 1, oy + j + 1, pal.L); }
    };
    const mx = Math.round((w - 1) / 2);
    if (carving === "rune") { const t = Math.round(w * 0.45); cut(mx, t, mx, h - 6); cut(mx - 5, t + 3, mx, t + 9); cut(mx + 5, t + 3, mx, t + 9); cut(mx - 4, t - 3, mx, t + 2); cut(mx + 4, t - 3, mx, t + 2); cut(mx - 5, h - 9, mx, h - 13); cut(mx + 5, h - 9, mx, h - 13); for (const [a, b2] of [[mx - 7, t + 1], [mx + 7, t + 1]]) cut(a, b2, a, b2 + 1); }
    if (carving === "cross") { cut(mx, 5, mx, 13); cut(mx - 3, 8, mx + 3, 8); cut(mx - 5, h - 7, mx + 5, h - 7); }
    if (carving === "lines") for (let k = 0; k < 3; k++) cut(3, Math.round(h * 0.35) + k * 3, w - 5, Math.round(h * 0.35) + k * 3);
    if (shape === "cross" && h > 16) { cut(mx, barY + 1, mx, barY + bw - 2); cut(mx - 1, barY + Math.floor(bw / 2), mx + 1, barY + Math.floor(bw / 2)); }
    // a crack running down from the top
    if (shape !== "point" && h > 10) { let i = Math.round(w * 0.65), j = shape === "round" ? 2 : 1; for (let k = 0; k < h * 0.35; k++) { if (on(i, j) && on(i + 1, j)) { S.set(ox + i, oy + j, pal.cut); if (on(i + 1, j) && k % 2) S.set(ox + i + 1, oy + j, pal.L); } j++; if (k % 3 === 1) i += r() < 0.5 ? -1 : 1; } }
    // moss: little clumps at the foot and on the upper left
    const clump = (i0, j0, n) => { let i = i0, j = j0; for (let k = 0; k < n; k++) { if (on(i, j)) S.set(ox + i, oy + j, k % 3 === 0 ? C.mossL : k % 3 === 1 ? C.moss : C.mossD); i += Math.floor(r() * 3) - 1; j += Math.floor(r() * 3) - 1; } };
    clump(1 + Math.floor(r() * 3), h - 2, 6 + Math.floor(w / 3));
    clump(w - 3, h - 2, 4);
    if (w > 10) clump(2, 2 + Math.floor(r() * 3), 5);
    S.outline(C.K);
    if (grass) for (let k = 0; k < w + 2; k += 1 + Math.floor(r() * 2)) { const hh = 1 + Math.floor(r() * 3); S.line(ox + k - 1, oy + h + 1, ox + k - 1 + (r() < 0.5 ? 0 : 1), oy + h + 1 - hh, r() < 0.5 ? C.gr[2] : C.gr[3]); }
    L.blit(S, cx - ox - mx, base - oy - h);
  }

  // foreground: carved stones, the slab at the right edge, big dark leaves with veins and teal edges, grass, pebbles, two mushrooms
  buildFg() {
    const { W, H } = this, L = new Buf(W, H), r = rng(555);
    const ids = (this.fgIds = new Uint16Array(W * H)), tag = (name, fn) => this.tag(L, ids, name, fn);
    tag("плита у правого края", () => this.stone(L, Math.round(W * 0.985), H + 3, 26, Math.round(H * 0.46), "slab", null, rng(61), GREY, false));
    tag("надгробие с руной", () => this.stone(L, Math.round(W * 0.8), Math.round(H * 0.885), 26, 38, "round", "rune", r));
    tag("высокий обломок", () => this.stone(L, Math.round(W * 0.71), Math.round(H * 0.91), 9, 30, "point", null, r));
    tag("разбитая плита", () => this.stone(L, Math.round(W * 0.69), Math.round(H * 0.95), 17, 13, "broken", "lines", r));
    tag("маленький обломок", () => this.stone(L, Math.round(W * 0.745), Math.round(H * 0.935), 7, 10, "point", null, r));
    const leafL = new Buf(W, H);
    const leaf = (x, y, len, ang, wid, bend, back) => {
      leafL.clear();
      let px = x, py = y, a = ang;
      const vein = [];
      for (let i = 0; i <= len; i++) {
        const t = i / len, wd = wid * Math.sin(Math.PI * Math.min(1, t * 1.12 + 0.08));
        a += bend / len; px += Math.sin(a); py -= Math.cos(a);
        leafL.disc(px, py, Math.max(0, wd / 2), back ? C.leafDD : C.leaf);
        if (t > 0.1 && t < 0.85) vein.push([px, py]);
      }
      if (!back) {
        // light comes from above: the upper edge of the blade gets a teal line, the lower edge a dark one, the tip is brightest
        const src = leafL.d.slice(), at = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && src[Y * W + X];
        for (let Y = Math.max(0, Math.floor(y - len - 4)); Y < H; Y++) for (let X = Math.max(0, Math.floor(x - len - 4)); X < Math.min(W, x + len + 4); X++) {
          if (!at(X, Y)) continue;
          const up = !at(X, Y - 1), dn = !at(X, Y + 1), side = !at(X - 1, Y) || !at(X + 1, Y);
          if (up && Y < y - len * 0.85) leafL.d[Y * W + X] = C.leafLL;
          else if (up || (side && !at(X, Y - 2))) leafL.d[Y * W + X] = C.leafL;
          else if (dn) leafL.d[Y * W + X] = C.leafDD;
          else if (!at(X, Y - 2)) leafL.d[Y * W + X] = C.leafM;
        }
        for (const [vx, vy] of vein) if (leafL.get(vx, vy) === C.leaf || leafL.get(vx, vy) === C.leafM) leafL.set(vx, vy, C.leafV);
      }
      L.blit(leafL, 0, 0);
    };
    tag("листья и трава спереди", () => {
      for (let x = 0; x < W; x++) { const e = Math.min(x / W, 1 - x / W), base = 2 + Math.max(0, 0.2 - e) * 30 + 1.5 * Math.sin(x * 0.3); for (let y = H - Math.round(base); y < H; y++) L.set(x, y, y < H - base + 1 ? C.leafM : C.leaf); }
      for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1, x = side < 0 ? r() * W * 0.26 : W - r() * W * 0.32; leaf(x, H + 3, 16 + r() * 20, -side * (0.35 + r() * 0.5), 6 + r() * 4, side * (0.5 + r() * 0.5), true); }
      for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1, x = side < 0 ? r() * W * 0.24 : W - r() * W * 0.3; leaf(x, H + 3, 13 + r() * 20, -side * (0.25 + r() * 0.55), 5 + r() * 4, side * (0.5 + r() * 0.6), false); }
      // grass blades along the whole bottom: dark, a lighter top half, a teal tip on some
      for (let i = 0; i < W * 0.45; i++) {
        const x = Math.floor(r() * W), e = Math.min(x / W, 1 - x / W), hh = 3 + r() * (e < 0.2 ? 11 : 6), lean = (r() - 0.5) * 4;
        L.line(x, H, x + lean * 0.5, H - hh * 0.5, C.leaf); L.line(x + lean * 0.5, H - hh * 0.5, x + lean, H - hh, C.leafM);
        if (r() < 0.2) L.set(x + lean, H - hh, C.leafL);
      }
      for (let i = 0; i < 12; i++) { const x = W * (0.3 + r() * 0.4); leaf(x, H + 2, 4 + r() * 6, (r() - 0.5) * 0.8, 2, (r() - 0.5) * 0.6, false); }
      // pebbles
      for (let i = 0; i < 9; i++) { const x = Math.round(W * (0.28 + r() * 0.46)), y = H - 2 - Math.floor(r() * 3), w = 2 + Math.floor(r() * 3); L.rect(x, y, w, 2, GREY.D); L.rect(x, y, w - 1, 1, GREY.L); }
    });
    tag("грибы", () => {
      for (const [fx, hh, cw] of [[0.055, 5, 5], [0.075, 3, 3]]) {
        const x = Math.round(W * fx), y = H - 4;
        L.rect(x, y - hh, 1, hh, C.stem); L.set(x + 1, y - hh + 1, C.stem);
        const cy = y - hh - 1;
        L.rect(x - (cw >> 1), cy, cw, 2, C.cap); L.rect(x - (cw >> 1) + 1, cy - 1, cw - 2, 1, C.cap); L.set(x - (cw >> 1) + 1, cy, C.capL); L.set(x, cy - 1, C.capL);
      }
    });
    L.outline(C.K);
    this.claimEdges(L, ids);
    tag("кость в траве", () => { L.line(W * 0.6, H - 3, W * 0.65, H - 8, C.K, 4); L.line(W * 0.6, H - 3, W * 0.65, H - 8, C.boneM, 2); L.line(W * 0.6, H - 4, W * 0.65, H - 9, C.bone, 1); for (const [x, y] of [[W * 0.6, H - 3], [W * 0.65, H - 8]]) { L.disc(x, y, 1.6, C.K); L.disc(x, y, 1, C.bone); } });
    return L;
  }

  // ---------- events ----------
  scare(kind, t) {
    this.sc = { kind, t0: t, side: Math.random() < 0.5 ? -1 : 1, has: 0 };
    if (kind === "scream") {
      const s = this.sc.side;
      for (let i = 0; i < 9; i++) this.bats.push({ x: s < 0 ? 14 + Math.random() * 20 : this.W - 14 - Math.random() * 20, y: this.H * 0.3 - Math.random() * 30, vx: -s * (70 + Math.random() * 50), vy: -10 - Math.random() * 20, t0: t + 0.3 + i * 0.07 });
    }
  }
  scareT(t) {
    if (!this.sc) return null;
    const e = t - this.sc.t0;
    if (e > SCARES[this.sc.kind].dur) { this.sc = null; return null; }
    return e;
  }
  /** one skeleton does a somersault now (also fired by the timer about every 15 minutes) */
  flip(t, k) {
    const d = this.dancers[k === undefined ? Math.floor(Math.random() * 4) : k];
    d.flipT0 = t; d.flipDir = Math.random() < 0.5 ? -1 : 1;
  }

  onBeat(t, idx, idle, period) {
    const r = this.r;
    this.period = period || 0.6;
    for (const d of this.dancers) {
      if (idle) d.move = "sway";
      else if (d.move === "sway" || (idx % 16 === 0 && r() < 0.5)) d.move = pick(r, DANCE);
      d.step++;
      const seq = MOVES[d.move];
      d.prev = d.shown || d.cur;
      d.cur = seq[d.step % seq.length];
      d.tSw = t;
    }
    if (!idle) this.glowV = 1;
  }

  // ---------- frame ----------
  draw(t, ears) {
    const { W, H, buf } = this;
    const tq = Math.floor(t * 12) / 12; // on twos for the background bits
    const dt = this.lastT ? Math.min(0.1, t - this.lastT) : 0;
    this.lastT = t;
    const se = this.scareT(t), sk = this.sc ? this.sc.kind : null;

    if (ears.active) {
      if (ears.beatIndex !== this.lastBeat) { this.lastBeat = ears.beatIndex; this.onBeat(t, ears.beatIndex, false, ears.period); }
    } else if (t - this.idleT > 0.75) { this.idleT = t; this.onBeat(t, ++this.lastBeat, true, 0.75); }
    if (!this.refPoses && !sk) this.ringA += dt * (ears.active ? (Math.PI * 2) / (32 * (ears.period || 0.5)) : 0.05);
    this.glowV = Math.max(0.25 + 0.15 * Math.sin(t * 2.1), this.glowV - dt * 1.6);
    if (!this.refPoses) {
      if (this.flipAt === null) this.flipAt = t + FLIP.every[0] + Math.random() * (FLIP.every[1] - FLIP.every[0]);
      if (t >= this.flipAt && !sk) { this.flip(t); this.flipAt = t + FLIP.every[0] + Math.random() * (FLIP.every[1] - FLIP.every[0]); }
    }

    buf.d.set(this.bg.d);
    // review page: credit each pixel to what drew it (off at the party)
    if (this.trace) this.ids = this.bgIds.slice();
    const T = (name, fn) => (this.trace ? this.tag(buf, this.ids, name, fn) : fn());
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < Math.round(H * 0.5) * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.5);
    T("звёзды", () => this.drawStars(tq, ears));
    T("облака", () => this.drawClouds(t));
    buf.blit(this.treesL, 0, 0);
    if (this.trace) for (let i = 0; i < this.treeIds.length; i++) if (this.treesL.d[i]) this.ids[i] = this.treeIds[i];
    this.groundGlow(tq);

    const boo = sk === "boo" && se > 0.15 && se < 2.45;
    if (!boo) T("жнец", () => this.drawReaper(t, tq, ears, se, sk, 1));
    const ring = this.dancers.map((d) => {
      const a = this.ringA + d.k * (Math.PI / 2);
      return { d, x: Math.round(this.cx + Math.cos(a) * this.ring.rx), fy: Math.round(this.potY + 1 + Math.sin(a) * this.ring.ry), front: Math.sin(a) > 0 };
    }).sort((a, b) => a.fy - b.fy);
    for (const q of ring) if (!q.front && !this.noDancers) T("скелет " + (q.d.k + 1), () => this.drawDancer(q, t, tq, ears, se, sk));
    T("котёл", () => this.drawCauldron(t, tq, ears, dt));
    for (const q of ring) if (q.front && !this.noDancers) T("скелет " + (q.d.k + 1), () => this.drawDancer(q, t, tq, ears, se, sk));
    T("частицы котла", () => this.drawParts(t, dt, ears, "mid"));
    buf.blit(this.fgL, 0, 0);
    if (this.trace) for (let i = 0; i < this.fgIds.length; i++) if (this.fgL.d[i]) this.ids[i] = this.fgIds[i];
    if (sk === "cat") this.drawCat(se);
    T("искры жнеца", () => this.drawParts(t, dt, ears, "top"));

    if (sk === "scream") {
      this.dim(clamp(se / 0.3) * clamp((3.6 - se) / 0.5) * 0.55);
      this.drawEyes(se);
    }
    if (boo) {
      this.dim(0.6);
      this.drawReaper(t, tq, ears, se, sk, se < 0.25 ? 3 : se < 0.35 ? 4 : se < 2.15 ? 6 : se < 2.3 ? 4 : 3);
      if (se > 0.35 && se < 2.1) {
        const s = 4, w = textW("BOO!", s), sh = Math.floor(tq * 12) % 2;
        this.textOut("BOO!", Math.round(W / 2 - w / 2) + sh, H - 36, s, C.eye, 2);
      }
    }
    this.drawBats(t);
  }

  // ---------- pieces ----------
  drawStars(tq, ears) {
    const { buf } = this, m = this.moon, tw = Math.floor(tq * 3);
    for (const s of this.stars) {
      if (Math.hypot(s.x - m.x, s.y - m.y) < m.r + 3) continue;
      const on = (s.b * 13 + tw) % 5 > 0.6;
      buf.set(s.x, s.y, on || ears.high > 0.7 ? C.star : C.star2);
      if (s.b > 0.6 && on) { buf.set(s.x + 1, s.y, C.star2); buf.set(s.x - 1, s.y, C.star2); buf.set(s.x, s.y + 1, C.star2); buf.set(s.x, s.y - 1, C.star2); }
    }
  }

  drawClouds(t) {
    const { buf, W, H } = this, m = this.moon;
    for (const c of this.clouds) {
      const B = c.B, span = W + B.w, x0 = ((((c.x + B.w + Math.floor(t * c.sp)) % span) + span) % span) - B.w;
      const open = (x, y) => !B.get(x, y);
      for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
        let col = B.d[y * B.w + x];
        if (!col) continue;
        const X = x0 + x, Y = c.y + y;
        if (X < 0 || X >= W || Y < 0 || Y >= H) continue;
        const dx = m.x - X, dy = m.y - Y, d = Math.hypot(dx, dy);
        if (d < m.r + 1) {
          // in front of the moon: lit from behind, a thin silver lining all round, a second softer row inside
          if (open(x + 1, y) || open(x - 1, y) || open(x, y + 1) || open(x, y - 1)) col = C.silver;
          else if ((open(x, y - 2) || open(x + 2, y) || open(x - 2, y)) && (X + Y) & 1) col = C.moonRim;
        } else if (d < m.r * 2.7) {
          const near = 1 - (d - m.r) / (m.r * 1.7), sx = Math.sign(dx), sy = Math.sign(dy);
          if (open(x + sx, y) || open(x, y + sy)) col = near > 0.62 ? C.moonRim : near > 0.35 ? ((X + Y) & 1 ? C.moonRim : C.moonRim2) : near > 0.12 ? C.moonRim2 : col;
          else if (near > 0.6 && (open(x + 2 * sx, y) || open(x, y + 2 * sy)) && (X + Y) & 1) col = C.moonRim2;
        }
        buf.d[Y * W + X] = col;
      }
    }
  }

  drawEyes(se) {
    for (const e of this.eyes) {
      if (e.side !== this.sc.side || se < 0.15 + (e.ph % 1) * 0.5 || se > 3.3) continue;
      this.buf.set(e.x, e.y, C.red); this.buf.set(e.x + 3, e.y, C.red);
      this.buf.set(e.x + 1, e.y, C.redD); this.buf.set(e.x + 4, e.y, C.redD);
    }
  }

  dim(a) {
    const d = this.buf.d;
    for (let i = 0; i < d.length; i++) d[i] = mix(d[i], C.black, a);
  }

  /** firelight and the green of the brew on the ground, in a few clean steps */
  groundGlow(tq) {
    const { buf, W, H, cx, potY } = this, g = this.glowV, fl = 0.85 + 0.15 * Math.sin(tq * 23);
    const R = 34 + g * 20;
    for (let y = Math.max(0, Math.round(potY - R * 0.45)); y < Math.min(H, potY + R * 0.45); y++) for (let x = Math.max(0, Math.round(cx - R)); x < Math.min(W, cx + R); x++) {
      const d = Math.hypot((x - cx) / R, (y - potY) / (R * 0.32));
      if (d >= 1) continue;
      const th = bayer(x, y) > 0.5 ? 0.25 : 0, lv = Math.floor((1 - d) * 3 * g + th), lw = Math.floor((1 - d * 1.3) * 3 * fl + th);
      let c = buf.d[y * W + x];
      if (lw > 0) c = mix(c, C.warm, 0.07 * lw);
      if (lv > 0) c = mix(c, C.green, 0.06 * lv);
      buf.d[y * W + x] = c;
    }
  }

  // ---------- cauldron on its fire; the brew glows and boils on the beat ----------
  drawCauldron(t, tq, ears, dt) {
    const { buf, cx, potY: fy } = this, g = this.glowV;
    // flames behind the pot, licking up its sides
    const flames = (half, base, amp, k, y0, front) => {
      for (let x = -half; x <= half; x++) {
        const h = Math.max(0, (base + ears.bass * amp + g * amp * 0.4) * (1 - (x / (half + 1)) ** 2) * (0.62 + 0.38 * Math.sin(x * 1.7 + tq * 9 + k) * Math.sin(x * 0.9 - tq * 5.3 + k)));
        for (let j = 0; j < h; j++) {
          const f = j / h;
          buf.set(cx + x, y0 - j, C.fire[f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : f < 0.92 ? 3 : 4]);
        }
        if (!front && h > 4 && (x + Math.floor(tq * 12)) % 5 === 0) buf.set(cx + x, y0 - h - 2, C.fire[3]); // a loose tongue tip
      }
    };
    flames(20, 12, 7, 0, fy - 3, false);
    const L = this.potL, ox = 24, oy = 38;
    L.clear();
    for (const lx of [-12, 10]) { L.rect(ox + lx, oy - 7, 3, 7, C.pot[1]); L.set(ox + lx, oy - 7, C.pot[3]); L.set(ox + lx, oy - 1, C.pot[0]); }
    // the pot: a smooth light falloff from the upper left, warm firelight from below, a specular spot
    const by = oy - 18, rx = 18, ry = 13;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = y / ry, rr = nx * nx + ny * ny;
      if (rr > 1.02) continue;
      const nz = Math.sqrt(Math.max(0, 1 - rr)), l = clamp(0.5 - 0.42 * nx - 0.32 * ny + 0.28 * nz - 0.1);
      let c = tone(l, x, y, C.pot);
      if (ny > 0.62) c = mix(c, C.fire[2], ny > 0.82 ? 0.35 : (x + y) & 1 ? 0.22 : 0.1);
      L.set(ox + x, by + y, c);
    }
    L.rect(ox - 10, by - 6, 3, 2, C.potHL); L.set(ox - 11, by - 5, C.pot[6]); L.set(ox - 7, by - 6, C.pot[6]); L.set(ox - 9, by - 4, C.pot[6]);
    for (let x = -rx + 2; x <= rx - 2; x++) { const yy = by - 8 + Math.round((x / rx) ** 2 * 1.5); L.set(ox + x, yy, x % 5 === 0 ? C.potRim : C.pot[1]); } // band with rivets
    // rim
    const ry0 = oy - 29;
    L.ellipse(ox, ry0, 20, 4.5, C.pot[2]);
    for (let x = -20; x <= 20; x++) { const top = ry0 - Math.round(Math.sqrt(Math.max(0, 1 - (x / 20) ** 2)) * 4.5); L.set(ox + x, top, x < 4 ? C.potRim : C.pot[4]); L.set(ox + x, ry0 + Math.round(Math.sqrt(Math.max(0, 1 - (x / 20) ** 2)) * 4.5), C.pot[1]); }
    for (let x = -19; x <= 2; x++) L.set(ox + x, ry0 + (x < -15 ? 2 : 3), C.pot[5]);
    // brew: darker ring, swirling light middle, foam on the boil
    const boil = g > 0.62;
    L.ellipse(ox, ry0, 17, 2.8, C.brewD);
    L.ellipse(ox, ry0 + 0.4, 16, 2.2, boil ? C.brew : C.brewM);
    L.ellipse(ox - 1, ry0 + 0.8, 11, 1.3, boil ? C.brewL : C.brew);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 5; i++) { const bx = ox - 12 + ((i * 7 + sp * 3) % 24); L.set(bx, ry0 + (i % 2), C.brewL); L.set(bx + 1, ry0 + (i % 2) - 1, C.brewL); }
    if (boil) for (let x = -15; x <= 15; x += 2) if ((x + sp) % 3) L.set(ox + x, ry0 - 2 + (Math.abs(x) > 12 ? 1 : 0), C.brewL); // foam heaving over
    for (let x = -14; x <= 14; x += 3) if (g > 0.55) L.set(ox + x, ry0 + 5, mix(C.pot[3], C.green, 0.45)); // glow on the rim's underside
    L.outline(C.K);
    for (let x = -16; x <= 16; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 16 - y * 5) buf.set(cx + x, fy + y, mix(buf.get(cx + x, fy + y), C.black, 0.5));
    buf.blit(L, cx - ox, fy - oy);
    this.mouth = { x: cx, y: fy - oy + ry0 };
    // small flames in front between the legs, then the crossed logs with glowing ends, ash
    flames(9, 7, 4, 2, fy - 1, true);
    for (const s of [-1, 1]) {
      buf.line(cx - 17 * s, fy + 3, cx + 13 * s, fy - 2, C.K, 6); buf.line(cx - 17 * s, fy + 3, cx + 13 * s, fy - 2, s < 0 ? C.log : C.logD, 4); buf.line(cx - 17 * s, fy + 2, cx + 13 * s, fy - 3, C.logL, 1);
      buf.set(cx + 13 * s, fy - 2, C.ember); buf.set(cx + 12 * s, fy - 1, C.fire[2]);
    }
    for (let x = -8; x <= 8; x += 2) buf.set(cx + x, fy + 3, (x + sp) % 4 ? C.ash : C.ember);
    if (Math.random() < 0.2 + ears.bass * 0.4) this.parts.push({ k: "ember", x: cx + (Math.random() < 0.5 ? -1 : 1) * (19 + Math.random() * 5), y: fy - 6, vx: (Math.random() - 0.5) * 10, vy: -16 - Math.random() * 18, t0: t, life: 0.6 + Math.random() * 0.5 });
    // green motes; on the boil, bubbles swell and burst
    const rate = (0.25 + g * 1.4 + ears.level * 0.4) * dt * 12;
    for (let i = 0; i < rate; i++) if (Math.random() < rate - i) this.parts.push({ k: "mote", x: cx + (Math.random() - 0.5) * 24, y: this.mouth.y - 1, t0: t, life: 1.2 + Math.random() * 1.2, ph: Math.random() * 6, v: 9 + Math.random() * 10 });
    if (boil) { const n = dt * 30; for (let i = 0; i < n; i++) if (Math.random() < n - i) this.parts.push({ k: "boil", x: cx + Math.round((Math.random() - 0.5) * 26), y: this.mouth.y, t0: t, life: 0.3 + Math.random() * 0.2, r: 1 + Math.random() * 1.6 }); }
  }

  // ---------- reaper ----------
  reaperPose(t, tq, ears, se, sk) {
    const g = { face: "idle", rise: 0, shake: 0, blink: false, hemPh: tq * 5, sway: Math.sin(tq * 1.7), look: 0 };
    // casting hand, relative to the left shoulder: held forward-left near head height, conducting small figures on the beat
    const base = [-11, -9];
    let dx = 0, dy = 0;
    if (!this.refPoses && ears.active) {
      const pts = [[0, 3], [2, 0], [-2, 0], [0, -3]], k = this.lastBeat % 4, ph = smooth(clamp(ears.phase * 1.4));
      const a = pts[(k + 3) % 4], b = pts[k];
      dx = lerp(a[0], b[0], ph); dy = lerp(a[1], b[1], ph);
    } else if (!this.refPoses) { dx = 1.5 * Math.sin(t * 1.3); dy = 1.5 * Math.cos(t * 1.1); }
    g.hand = { x: base[0] + dx, y: base[1] + dy };
    g.blink = !this.refPoses && t % 4.3 < 0.13;
    if (sk === "laugh" && se > 0.1 && se < 2.9) { g.face = "laugh"; g.shake = Math.floor(tq * 12) % 2 ? 1 : -1; g.rise = Math.min(3, se * 12); g.hand = { x: -8, y: 2 }; }
    else if (sk === "boo" && se < 2.45) { g.face = se < 0.15 ? "idle" : "boo"; g.rise = se < 0.15 ? se * 20 : 0; g.hand = { x: -13, y: -12 }; g.shake = se > 0.35 && Math.floor(tq * 12) % 2 ? 1 : 0; }
    else if (sk === "scream" && se > 0.25 && se < 3.4) { g.face = "scared"; g.look = this.sc.side; g.hand = { x: -5, y: -4 }; }
    else if (sk === "cat" && se > 0.5 && se < 1.8) { g.face = "scared"; g.rise = 4; g.hand = { x: -10, y: -10 }; }
    return g;
  }

  drawReaper(t, tq, ears, se, sk, scale) {
    const g = this.reaperPose(t, tq, ears, se, sk);
    const L = this.condL, ox = 36, oy = 26;
    L.clear();
    // scythe
    const shx = ox + 13, top = oy - 10, bot = oy + 36;
    L.line(shx, top, shx - 1, bot, C.K, 4); L.line(shx, top, shx - 1, bot, C.wood, 2); L.line(shx, top + 1, shx - 1, bot, C.woodL, 1);
    const bc = { x: shx + 1, y: top + 12 }, R = 12;
    const arc = (fn) => { for (let a = -100; a <= -18; a += 2) { const f = (a + 100) / 82, w = 4 - f * 3, x = bc.x + Math.cos(a * D) * R, y = bc.y + Math.sin(a * D) * R; fn(x, y, w, a); } };
    arc((x, y, w) => L.disc(x, y, w / 2 + 1, C.K));
    arc((x, y, w, a) => { L.disc(x, y, Math.max(0, w / 2), C.blade); L.set(bc.x + Math.cos(a * D) * (R - w / 2), bc.y + Math.sin(a * D) * (R - w / 2), C.bladeM); });
    // robe with a ragged hem
    for (let y = 6; y <= 33; y++) {
      const hw = 7 + (y - 6) * 0.2, xo = g.sway * Math.pow((y - 6) / 27, 2) * 2;
      for (let x = Math.floor(-hw + xo); x <= Math.ceil(hw + xo); x++) {
        const hem = 29 + 3 * Math.abs(Math.sin((x - xo) * 0.45 + g.hemPh * 0.3));
        if (y > hem) continue;
        const nx = (x - xo) / hw;
        let c = nx > 0.45 ? C.robeM : C.robe;
        if (nx > 0.8) c = C.robeD;
        if (Math.abs(x - xo + 2 + Math.sin(y * 0.3)) < 0.6 && y > 15) c = C.robeD;
        if (Math.abs(x - xo - 3 - Math.sin(y * 0.25)) < 0.6 && y > 19) c = C.robeD;
        if (nx < -0.85) c = C.robeL;
        if (y > hem - 2) c = C.robeM;
        L.set(ox + x, oy + y, c);
      }
    }
    // hood
    for (let y = -11; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      const inHead = (x * x) / 72 + ((y + 0.5) * (y + 0.5)) / 82 <= 1;
      const tip = y < -4 && x > 1 && y > -11 + (x - 1) * 0.2 && x < 9 - (y + 11) * 0.3;
      if (!inHead && !tip) continue;
      L.set(ox + x, oy + y, x / 9 > 0.5 ? C.robeM : x / 9 < -0.72 ? C.robeL : C.robe);
    }
    L.ellipse(ox - 1, oy + 1, 5, 5.5, C.hood);
    const ex = ox - 1 + g.look, ey = oy + 1;
    if (g.face === "laugh") for (const bx of [-3, 1]) { L.set(ex + bx, ey + 1, C.eye); L.set(ex + bx + 1, ey, C.eyeL); }
    else if (g.face === "boo") { L.rect(ex - 4, ey - 1, 2, 3, C.redEye); L.rect(ex + 1, ey - 1, 2, 3, C.redEye); }
    else if (g.face === "scared") { L.set(ex - 3, ey, C.eyeL); L.set(ex + 2, ey, C.eyeL); }
    else if (g.blink) { L.rect(ex - 4, ey + 1, 2, 1, C.eye); L.rect(ex + 1, ey + 1, 2, 1, C.eye); }
    else { L.rect(ex - 4, ey - 1, 2, 2, C.eye); L.rect(ex + 1, ey - 1, 2, 2, C.eye); L.set(ex - 4, ey - 1, C.eyeL); L.set(ex + 1, ey - 1, C.eyeL); }
    // a cloth sleeve: narrow at the shoulder, wide bell at the cuff, darker underside; filled with discs so it has no holes
    const sleeveTo = (sx, sy, hx, hy, cuff) => {
      const n = Math.ceil(Math.hypot(hx - sx, hy - sy)), px = -(hy - sy) / n, py = (hx - sx) / n;
      for (let i = 0; i <= n; i++) { const t2 = i / n; L.disc(lerp(sx, hx, t2), lerp(sy, hy, t2), lerp(2.6, cuff, t2 * t2), C.robe); }
      for (let i = 0; i <= n; i++) { const t2 = i / n, w = lerp(2.6, cuff, t2 * t2), x = lerp(sx, hx, t2), y = lerp(sy, hy, t2); L.set(x + px * w * 0.8, y + py * w * 0.8, C.robeD); L.set(x - px * w * 0.8, y - py * w * 0.8, C.robeL); }
    };
    // right sleeve holds the scythe: the gloved hand wraps round the shaft
    sleeveTo(ox + 6, oy + 11, shx - 3, oy + 16, 2.6);
    L.rect(shx - 3, oy + 15, 4, 4, C.glove); L.set(shx - 3, oy + 15, C.gloveL); L.set(shx, oy + 16, C.gloveL);
    // left sleeve: up and forward, the gloved hand open at its end
    const hx = ox - 6 + g.hand.x, hy = oy + 10 + g.hand.y, sx = ox - 6, sy = oy + 10;
    const ux = (hx - sx) / Math.hypot(hx - sx, hy - sy), uy = (hy - sy) / Math.hypot(hx - sx, hy - sy);
    sleeveTo(sx, sy, hx - ux * 2, hy - uy * 2, 4);
    L.disc(hx, hy, 1.6, C.glove);
    L.set(hx + ux * 2, hy + uy * 2, C.glove); L.set(hx + ux * 2 - uy * 1.5, hy + uy * 2 + ux * 1.5, C.glove); L.set(hx + ux * 2 + uy * 1.5, hy + uy * 2 - ux * 1.5, C.glove);
    L.set(hx - uy, hy + ux, C.gloveL);
    L.outline(C.K);

    const gx = this.cond.x + g.shake, gy = this.cond.y + (this.refPoses ? 0 : Math.round(Math.sin(t * 1.3) * 1.5)) - Math.round(g.rise);
    this.castHand = { x: gx - ox + hx + ux * 3, y: gy - oy + hy + uy * 3, ux, uy, cast: g.face === "idle" };
    this.condMouth = { x: gx, y: gy + 3 };
    if (scale === 1) {
      const sy0 = this.groundTop(gx) + 6;
      for (let x = -11; x <= 11; x++) if (x % 6 !== 4) { this.buf.set(gx + x, sy0, C.K); if (Math.abs(x) < 7) this.buf.set(gx + x, sy0 + 1, C.K); }
      for (let x = -6; x <= 4; x += 5) this.buf.set(gx + x, sy0 - 4 - (x & 1), C.K);
      this.buf.blit(L, gx - ox, gy - oy);
    } else this.buf.blitScaled(L, scale, this.W / 2 + g.shake * scale, this.H * 0.42, ox, oy + 4);
  }

  // ---------- dancers ----------
  dancerPose(d, t, tq, ears, se, sk) {
    if (this.refPoses) return (d.shown = [MOVES.ring[0], MOVES.kick[0], MOVES.jump[0], MOVES.wave[1]][d.k]);
    const u = smooth(clamp((t - d.tSw) / ((this.period || 0.6) * 0.5)));
    let p = blend(d.prev, d.cur, u);
    if (ears.active) p.dy += Math.round(-Math.sin(clamp(ears.phase) * Math.PI) * 1.4);
    const trem = Math.floor(t * 12 + d.seed * 4) % 2 ? 1 : 0;
    if (sk === "laugh" && se > 0.2 && se < 2.7) p = { ...SPECIAL.cower, lean: trem };
    else if (sk === "boo") {
      if (se > 0.3 && se < 0.42) p = SPECIAL.fall;
      else if (se >= 0.42 && se < 2.3) p = { ...SPECIAL.fall, pile: 1 };
      else if (se >= 2.3 && se < 2.5) p = SPECIAL.fall;
    } else if (sk === "scream" && se > 0.3 && se < 3.3) p = { ...SPECIAL.freeze, look: this.sc.side, lean: trem * this.sc.side };
    else if (sk === "cat" && ((se > 0.7 && se < 1.6) || (this.catX !== undefined && Math.abs(this.catX - (d.x || 0)) < 30))) p = SPECIAL.startle;
    d.shown = p;
    return p;
  }

  /** the somersault: crouch, a tucked turn in the air along an arc, land in a crouch. Returns {pose, lift, angle} or null */
  flipState(d, t) {
    const e = t - d.flipT0;
    if (e < 0 || e > FLIP.dur) return null;
    if (e < 0.15) return { pose: blend(BASE, SPECIAL.crouch, smooth(e / 0.15)), lift: 0, angle: 0 };
    if (e < 0.85) { const u = (e - 0.15) / 0.7; return { pose: SPECIAL.tuck, lift: Math.round(Math.sin(u * Math.PI) * 22), angle: Math.round(u * 12) / 12 * Math.PI * 2 * d.flipDir }; }
    return { pose: blend(SPECIAL.crouch, BASE, smooth((e - 0.85) / 0.3)), lift: 0, angle: 0 };
  }

  drawDancer(q, t, tq, ears, se, sk) {
    const { d } = q;
    d.x = q.x;
    const fs = this.flipState(d, t);
    const p = fs ? fs.pose : this.dancerPose(d, t, tq, ears, se, sk);
    if (fs) d.shown = fs.pose;
    let L = this.dl;
    const ox = 32, oy = 66;
    L.clear();
    if (p.pile) this.pile(L, ox, oy, d);
    else this.skeleton(L, ox, oy, p, ears);
    L.outline(C.K);
    if (fs && fs.angle) L = rotateBuf(L, ox, oy - 26, fs.angle);
    for (let x = -8; x <= 8; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 8 - y * 3 - (fs ? Math.floor(fs.lift / 6) : 0)) { const X = q.x + x, Y = q.fy + 1 + y; this.buf.set(X, Y, mix(this.buf.get(X, Y), C.black, 0.4)); }
    this.buf.blit(L, q.x - ox, q.fy - oy - (fs ? fs.lift : 0), false, q.front ? null : (c) => (c === C.K ? c : mix(c, C.vale, 0.12)));
  }

  /** one skeleton in a pose: bones with a shaded side, knobbly joints, fingers and toes, ribs, spine, skull with sockets and teeth */
  skeleton(L, fx, fy, p, ears) {
    const hipY = Math.round(fy - 21 + p.dy), hx = fx + p.lean * 0.5, cxx = fx + p.lean;
    const limb = (x0, y0, side, a, f, l1, l2) => {
      const a1 = a * D, a2 = (a + f) * D;
      const x1 = x0 + side * Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + side * Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      return [x1, y1, x2, y2, a2];
    };
    const bone = (x0, y0, x1, y1) => {
      L.line(x0, y0, x1, y1, C.K, 4); L.line(x0, y0, x1, y1, C.bone, 2);
      const n = Math.hypot(x1 - x0, y1 - y0) || 1, sx = (y1 - y0) / n > 0 ? 1 : -1; // shade the side away from the light
      L.line(x0 + sx * 0.7, y0 + 0.4, x1 + sx * 0.7, y1 + 0.4, C.boneM, 1);
      L.set(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), C.bone);
    };
    const knob = (x, y) => { L.disc(x, y, 1.6, C.bone); L.set(x + 1, y + 1, C.boneM); };
    for (const [side, u, k] of [[-1, p.uL, p.kL], [1, p.uR, p.kR]]) {
      const x0 = hx + side * 2, [x1, y1, x2, y2] = limb(x0, hipY + 1, side, u, k, 10, 10);
      bone(x0, hipY + 1, x1, y1); bone(x1, y1, x2, y2); knob(x1, y1);
      // foot: heel, sole, toe
      L.line(x2, y2, x2 + side * 3, y2 + 1, C.K, 4); L.line(x2, y2, x2 + side * 3, y2 + 1, C.bone, 2); L.set(x2 + side * 4, y2 + 1, C.bone); L.set(x2 - side, y2 + 1, C.boneM);
    }
    L.blit(PELVIS, Math.round(hx) - 4, hipY - 1);
    for (let y = hipY - 2; y > hipY - 6; y--) { const x = Math.round(lerp(hx, cxx, (hipY - y) / 6)); L.set(x, y, y % 2 ? C.bone : C.boneM); L.set(x + 1, y, y % 2 ? C.boneM : C.boneD); }
    L.blit(RIBS, Math.round(cxx) - 5, hipY - 15);
    const shY = hipY - 14;
    const arms = () => {
      for (const [side, a, f] of [[-1, p.aL, p.fL], [1, p.aR, p.fR]]) {
        const x0 = cxx + side * 5, [x1, y1, x2, y2, a2] = limb(x0, shY, side, a, f, 8, 8);
        bone(x0, shY, x1, y1); bone(x1, y1, x2, y2); knob(x1, y1);
        // hand: palm and three fingers along the forearm, a thumb
        const fx2 = side * Math.sin(a2), fy2 = Math.cos(a2);
        L.disc(x2, y2, 2.2, C.K); L.disc(x2, y2, 1.3, C.bone);
        for (const o of [-1, 0, 1]) { const tx = x2 + fx2 * 2.6 - fy2 * o, ty = y2 + fy2 * 2.6 + fx2 * o; L.set(tx, ty, C.bone); }
        L.set(x2 - fy2 * 2, y2 + fx2 * 2, C.boneM);
      }
    };
    if (!p.front) arms();
    const sx = Math.round(cxx + p.tilt - 6 + p.sx), sy = Math.round(hipY - 28 + p.sy);
    L.blit(SKULL, sx, sy);
    const lk = Math.round(clamp(p.look, -1, 1));
    // sockets: even rounded 3x3 holes under a light brow, a glint on the beat, a small nose
    for (const ex of [2, 8]) {
      const X = sx + ex + lk;
      L.rect(X, sy + 4, 3, 3, C.ink); L.set(X + (ex < 5 ? 0 : 2), sy + 4, C.bone); L.set(X + 1, sy + 7, C.ink);
      L.set(X + (ex < 5 ? 0 : 2), sy + 7, C.boneM);
    }
    if (ears.pulse > 0.6 && !this.refPoses) { L.set(sx + 3 + lk, sy + 5, C.eye); L.set(sx + 9 + lk, sy + 5, C.eye); }
    L.set(sx + 6, sy + 8, C.ink); L.set(sx + 6, sy + 9, C.boneM);
    L.blit(JAW, sx + 2, sy + 11 + Math.round(p.jaw));
    if (p.front) arms();
  }

  pile(L, fx, fy, d) {
    const s = d.k % 2 ? -1 : 1;
    const bone = (x0, y0, x1, y1) => { L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.K, 4); L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.bone, 2); };
    bone(-15, -2, -5, -2); bone(-3, -5, 6, -3); bone(8, -2, 17, -3); bone(-11, -6, -2, -7);
    L.blit(RIBS, fx - 5 - 3 * s, fy - 10);
    L.blit(PELVIS, fx + 3 * s - 4, fy - 5);
    L.blit(SKULL, fx + 8 * s - 6, fy - 12);
    for (const ex of [2, 7]) L.rect(fx + 8 * s - 6 + ex, fy - 8, 3, 3, C.ink);
    L.blit(JAW, fx - 13 * s - 4, fy - 3);
  }

  // ---------- cat ----------
  drawCat(se) {
    const { W, H } = this, s = this.sc.side, from = s < 0 ? -24 : W + 4, mid = this.cx + 40 * -s;
    let x, spr;
    if (se < 0.7) { x = lerp(from, mid, se / 0.7); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    else if (se < 1.6) { x = mid; spr = CAT_ARCH; if (Math.floor(se * 16) % 2) x += 1; }
    else { x = lerp(mid, s < 0 ? W + 24 : -30, (se - 1.6) / 0.8); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    this.catX = se < 2.5 ? x : undefined;
    const L = new Buf(spr.w + 2, spr.h + 2);
    L.blit(spr, 1, 1, s > 0);
    L.outline(C.K);
    this.buf.blitScaled(L, 2, x, H - 1, L.w / 2, L.h);
  }

  // ---------- particles ----------
  drawParts(t, dt, ears, layer) {
    const { buf } = this;
    if (layer === "mid") {
      const h = this.castHand;
      if (h && h.cast) {
        const n = this.refPoses ? (this.parts.filter((q) => q.k === "spark").length < 30 ? 3 : 0) : (3 + ears.mid * 5 + ears.pulse * 6) * dt * 6;
        for (let i = 0; i < n; i++) if (Math.random() < n - i) {
          const tx = this.cx - h.x, ty = this.mouth ? this.mouth.y - 14 - h.y : 0, len = Math.hypot(tx, ty), sp = (Math.random() - 0.5) * 0.9;
          const ux = tx / len, uy = ty / len, vx = ux * Math.cos(sp) - uy * Math.sin(sp), vy = ux * Math.sin(sp) + uy * Math.cos(sp), speed = 22 + Math.random() * 18;
          this.parts.push({ k: "spark", x: h.x, y: h.y, vx: vx * speed, vy: vy * speed - 6, t0: this.refPoses ? t - Math.random() * 1.4 : t, life: 1.2 + Math.random() * 0.8, j: Math.random() });
        }
      }
    }
    const keep = [];
    for (const q of this.parts) {
      const age = (t - q.t0) / q.life;
      if (age >= 1) continue;
      keep.push(q);
      const top = q.k === "spark" || q.k === "ha";
      if (top !== (layer === "top")) continue;
      if (q.k === "mote") {
        const e = t - q.t0, x = Math.round(q.x + Math.sin(e * 3 + q.ph) * 2), y = Math.round(q.y - e * q.v);
        if (age > 0.75 && (x + y) % 2) continue;
        buf.set(x, y, age < 0.35 ? C.brewL : age < 0.7 ? C.brew : C.brewM);
      } else if (q.k === "ember") buf.set(q.x + q.vx * age * q.life, q.y + q.vy * age * q.life, age < 0.5 ? C.fire[1] : C.fire[3]);
      else if (q.k === "boil") {
        // a bubble swells above the surface, then bursts into droplets
        const y = Math.round(q.y - age * 3);
        if (age < 0.7) {
          const r = Math.max(1, Math.round(q.r * (0.5 + age)));
          for (let a = 0; a < 12; a++) buf.set(q.x + Math.round(Math.cos((a / 12) * Math.PI * 2) * r), y + Math.round(Math.sin((a / 12) * Math.PI * 2) * r * 0.8), C.brewL);
          if (r > 1) buf.set(q.x, y, C.brew); buf.set(q.x - Math.floor(r / 2), y - Math.floor(r / 2), C.white);
        } else { const k = (age - 0.7) * 10; for (const [dx, dy] of [[-2, -1], [2, -1], [-1, -2], [1, -2]]) buf.set(q.x + dx * (1 + k), y + dy * (1 + k) + k * k, C.brew); }
      } else if (q.k === "spark") {
        const e = t - q.t0, drag = 1 - Math.min(0.7, e * 0.45), x = Math.round(q.x + q.vx * e * drag), y = Math.round(q.y + q.vy * e * drag + Math.sin(e * 4 + q.j * 9) * 2);
        const purple = q.j < 0.4, c = age < 0.3 ? (purple ? C.magicPL : C.magicL) : purple ? C.magicP : C.magic;
        if (age > 0.7 && (x + y + Math.floor(t * 12)) % 2) continue;
        buf.set(x, y, c);
        if (q.j > 0.86 && age < 0.6) { buf.set(x - 1, y, c); buf.set(x + 1, y, c); buf.set(x, y - 1, c); buf.set(x, y + 1, c); }
        else if (q.j > 0.6 && age < 0.5) buf.set(x + Math.sign(q.vx) * -1, y - Math.sign(q.vy) * -1, purple ? C.magicP : C.magic);
      } else if (q.k === "ha") {
        const y = q.y - age * 26, x = q.x + Math.sin(age * 8) * 3;
        this.textOut("HA", Math.round(x), Math.round(y), 2, age > 0.7 && Math.floor(age * 20) % 2 ? C.magic : C.eyeL);
      }
    }
    this.parts = keep;
    if (layer === "top" && this.sc && this.sc.kind === "laugh") {
      const se = t - this.sc.t0, n = Math.floor((se - 0.2) / 0.32);
      if (se > 0.2 && se < 2.6 && n >= this.sc.has) {
        this.sc.has = n + 1;
        const m = this.condMouth;
        this.parts.push({ k: "ha", x: m.x + (n % 2 ? 10 : -32), y: m.y - 16, t0: t, life: 1.1 });
      }
    }
  }

  drawBats(t) {
    this.bats = this.bats.filter((b) => t - b.t0 < 4);
    for (const b of this.bats) {
      const e = t - b.t0;
      if (e < 0) continue;
      this.buf.blit(BAT[Math.floor(e * 10) % 2], b.x + b.vx * e - 3, b.y + b.vy * e + Math.sin(e * 9) * 3 - 2, b.vx < 0);
    }
  }

  textOut(s, x, y, sc, c, o = 1) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2]]) text(this.buf, s, x + dx * o, y + dy * o, sc, C.K);
    text(this.buf, s, x, y, sc, c);
  }
}
