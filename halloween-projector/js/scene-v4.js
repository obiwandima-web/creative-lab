// V4 scene, after notes on V3 (closer to ref-style.jpg, cleaner pixel work):
// banded sky with checker dither only at the seams, stepped clouds, a lit hill rising to the right, far trees behind the left tree,
// bark drawn as black grooves with teal glints, carved tombstones, four smaller skeletons dancing in a ring round a flameless glowing
// cauldron, a reaper casting sparkles with a proper sleeve. Older looks: js/scene-v1.js .. scene-v3.js (?v=1..3).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";

const C = {
  K: pk(0x02020a), ink: pk(0x05040c), white: pk(0xffffff),
  // sky bands top -> horizon (fraction of H where each band starts)
  sky: [[0, 0x100d2e], [0.08, 0x15113a], [0.16, 0x1b1744], [0.24, 0x211e4e], [0.31, 0x272858], [0.37, 0x2c3262], [0.43, 0x323b6c]].map(([y, c]) => [y, pk(c)]),
  halo: pk(0x3a4378), halo2: pk(0x323a70),
  star: pk(0xeef6ff), star2: pk(0x8890c8),
  moon: pk(0xeefcfa), moonM: pk(0xd6eaea), moonD: pk(0xb6cfd8), moonE: pk(0xc8dde4),
  cloudL: pk(0x3e4a82), cloud: pk(0x2c3368), cloudD: pk(0x22265a),
  farTree: pk(0x34548e), farTreeD: pk(0x2e4c84),
  far: pk(0x264873), farS: pk(0x1d3360),
  vale: pk(0x1f4d72), valeD: pk(0x1a4167), valeS: pk(0x163557),
  gr: [0x7fd2c0, 0x5db5ae, 0x3a8e9e, 0x2f7c8f, 0x267085, 0x1f667d, 0x1c5a74, 0x184c69].map(pk),
  trunk: pk(0x29275f), trunkD: pk(0x1e1b4b), rim: pk(0x3a9ea4), rimL: pk(0x63c8bd),
  stone: pk(0x444877), stoneL: pk(0x5f86b6), stoneM: pk(0x3a3d6c), stoneD: pk(0x2e2f5e), stoneDD: pk(0x24244e),
  cross: pk(0x3a2a6a), crossD: pk(0x2c1f56),
  leaf: pk(0x0d0f2a), leafM: pk(0x141a3a), leafL: pk(0x2f8a96),
  pot: pk(0x3e4670), potM: pk(0x56608e), potL: pk(0x8290b8), potRim: pk(0x9aa6cc), potD: pk(0x262a4e),
  brew: pk(0x6cf060), brewM: pk(0x34c050), brewD: pk(0x1a8a3a), brewL: pk(0xd8ffc0),
  robe: pk(0x5a2a8e), robeM: pk(0x45206e), robeD: pk(0x2e1450), robeL: pk(0x7444b0), hood: pk(0x05040c), glove: pk(0x15111f), gloveL: pk(0x2c2640),
  eye: pk(0x40d8ff), eyeL: pk(0xc8f6ff), redEye: pk(0xff3a3a),
  bone: pk(0xf4ecd0), boneM: pk(0xcfc29c), boneD: pk(0x8c7e60),
  wood: pk(0x8a5a30), woodD: pk(0x553418), woodL: pk(0xb07a44),
  blade: pk(0xe0e4ec), bladeL: pk(0xffffff), bladeM: pk(0x9ca2b4),
  magic: pk(0x40c8ff), magicL: pk(0xd0f6ff), magicP: pk(0x9a5cff), magicPL: pk(0xd2acff),
  cat: pk(0x2a2c52), catL: pk(0x6a72a8), catEye: pk(0xffe23a),
  red: pk(0xff2a2a), redD: pk(0x9a1010),
  green: pk(0x50ff90), flash: pk(0xb8d8ff), black: pk(0x020104),
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const D = Math.PI / 180;
const pick = (r, a) => a[Math.floor(r() * a.length)];
/** clean pixel-art dither between two colours: 2 px checker at the seam, sparse dots before it */
const seam = (x, y, d, a, b) => (d < 2 ? ((x + y) & 1 ? b : a) : d < 4 ? (!(x & 1) && !(y & 1) ? b : a) : a);

// ---------- sprites ----------
const BP = { w: C.bone, m: C.boneM, d: C.boneD };
const SKULL = sprite([
  "..wwwwwww..",
  ".wwwwwwwwm.",
  "wwwwwwwwwwm",
  "wwwwwwwwwwm",
  "wwwwwwwwwwm",
  "wwwwwwwwwwm",
  ".wwwwwwwwm.",
  "..wwwwwwm..",
  "..w.w.w.m..",
], BP);
const JAW = sprite(["w.w.w.m", "wwwwwmm"], BP);
const RIBS = sprite([
  "..wwwww..",
  "....w....",
  "wwwwwwwwm",
  "....w....",
  "wwwwwwwwm",
  "....w....",
  ".wwwwwwm.",
], BP);
const PELVIS = sprite([".wwwwwm.", "ww.ww.mm", ".w....m."], BP);
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
const BASE = { aL: 20, fL: 10, aR: 20, fR: 10, uL: 6, kL: -6, uR: 6, kR: -6, dy: 0, lean: 0, tilt: 0, jaw: 0, look: 0, sx: 0, sy: 0 };
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
  cower: P({ aL: 165, fL: 115, aR: 165, fR: 115, uL: 16, kL: -30, uR: 16, kR: -30, dy: 3, jaw: 1 }),
  startle: P({ aL: 170, fL: -10, aR: 170, fR: -10, uL: 18, kL: 0, uR: 18, kR: 0, dy: -6, jaw: 1 }),
  freeze: P({ aL: 40, fL: 70, aR: 40, fR: 70, uL: 10, kL: -10, uR: 10, kR: -10, jaw: 1, dy: 1 }),
  fall: P({ aL: 110, fL: 30, aR: 110, fR: 30, uL: 60, kL: -10, uR: 60, kR: -10, dy: 7, sx: 3, sy: 6, jaw: 1 }),
};
export { MOVES, SPECIAL };
const blend = (a, b, t) => Object.fromEntries(Object.keys(BASE).map((k) => [k, lerp(a[k] || 0, b[k] || 0, t)]));

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
    this.r = rng(1031);
    this.names = []; // review support: what drew each pixel (ids maps), see tag()
    this.trace = false; // per-frame id map, only for the review page
    this.condL = new Buf(80, 90);
    this.potL = new Buf(44, 40);
    this.dl = new Buf(60, 64);
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.buf = new Buf(W, H);
    this.cx = Math.round(W * 0.45); // cauldron
    this.potY = Math.round(H * 0.85); // cauldron feet
    this.rimY = this.potY - 26;
    this.ring = { rx: 58, ry: 14 };
    this.cond = { x: Math.round(W * 0.8), y: Math.round(H * 0.33) }; // reaper hood centre
    this.dancers = [0, 1, 2, 3].map((k) => ({ k, move: k % 2 ? "ring" : "ring", step: k, prev: P({}), cur: P({}), tSw: -9, seed: k * 0.27 }));
    this.stars = [[0.02, 0.04], [0.19, 0.31], [0.26, 0.12], [0.36, 0.08], [0.42, 0.04], [0.67, 0.07], [0.72, 0.03], [0.62, 0.2], [0.68, 0.36], [0.93, 0.08], [0.98, 0.3], [0.84, 0.05], [0.5, 0.02], [0.12, 0.18], [0.58, 0.42]].map(([x, y], i) => ({ x: Math.round(W * x), y: Math.round(H * y), b: (i * 0.37) % 1 }));
    const r = rng(77);
    this.eyes = [];
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? 10 + r() * W * 0.2 : W - 10 - r() * W * 0.2;
      this.eyes.push({ x: Math.round(x), y: Math.round(H * (0.42 + r() * 0.2)), side, ph: r() * 10 });
    }
    this.moon = { x: Math.round(W * 0.5), y: Math.round(H * 0.25), r: Math.round(H * 0.215) };
    this.bg = this.buildBg();
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
  /** the ground: a flat clearing on the left, a hill rising in an S to the right */
  groundTop(x) {
    const { W, H } = this, u = clamp((x - W * 0.38) / (W * 0.5));
    return Math.round(H * (0.665 - 0.17 * smooth(u)) + 1.5 * Math.sin(x * 0.045 + 1));
  }

  buildBg() {
    const { W, H } = this, b = new Buf(W, H), m = this.moon, r = rng(4242);
    const ids = (this.bgIds = new Uint16Array(W * H)), tag = (name, fn) => this.tag(b, ids, name, fn);
    tag("небо", () => {
    // sky in bands, dithered only at the seams; a lighter ring round the moon
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
    // moon: soft large patches in 2 px cells
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
    // far hills with grave silhouettes, a dead tree behind the moon
    tag("дальние холмы", () => { for (let x = 0; x < W; x++) for (let y = this.farTop(x); y < H; y++) b.set(x, y, C.far); });
    tag("сухое дерево за луной", () => this.silTree(b, Math.round(W * 0.585), this.farTop(W * 0.585) + 2, 46, C.farS, rng(5), 4));
    tag("деревце на дальнем холме", () => this.silTree(b, Math.round(W * 0.31), this.farTop(W * 0.31) + 2, 24, C.farS, rng(8), 2.5));
    tag("силуэты могил вдали", () => [0.06, 0.15, 0.36, 0.41, 0.46, 0.52, 0.63, 0.69, 0.74, 0.88].forEach((fx, i) => this.graveSil(b, Math.round(W * fx), this.farTop(W * fx) + 3, i, C.farS)));
    // far trees behind the left tree
    const F = new Buf(W, H);
    this.silTree(F, Math.round(W * 0.03), this.valeTop(0) + 4, 120, C.farTree, rng(11), 9, -0.15);
    this.silTree(F, Math.round(W * 0.27), this.valeTop(W * 0.27) + 4, 90, C.farTree, rng(13), 7, 0.1);
    this.silTree(F, Math.round(W * 0.92), this.valeTop(W * 0.92) + 4, 80, C.farTreeD, rng(17), 6, 0);
    tag("дальние деревья", () => b.blit(F, 0, 0));
    // the valley in between
    tag("долина", () => { for (let x = 0; x < W; x++) { const top = this.valeTop(x); for (let y = top; y < H; y++) b.set(x, y, y - top < 1 ? C.far : seam(x, y, y - top - 6, C.vale, C.valeD)); } });
    tag("силуэты могил в долине", () => [0.05, 0.13, 0.24, 0.34, 0.49, 0.56, 0.66].forEach((fx, i) => this.graveSil(b, Math.round(W * fx), this.valeTop(W * fx) + 5, i + 3, C.valeS)));
    // ground: bright ridge, bands following the slope, lighter grass strokes along the contour
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
    for (let k = 0; k < 3; k++) { // two curving highlight streaks down the hill face, like the reference
      const off = [9, 17, 26][k];
      for (let x = Math.round(W * 0.3); x < W; x++) {
        const y = this.groundTop(x) + off + Math.round(Math.sin(x * 0.05 + k) * 2), on = Math.sin(x * 0.21 + k * 3) > -0.2;
        if (on) { b.set(x, y, C.gr[2 + k]); if (Math.sin(x * 0.11 + k) > 0.3) b.set(x, y - 1, C.gr[2 + k]); }
      }
    }
    });
    tag("трава на поляне", () => {
    for (let i = 0; i < W * 0.9; i++) { // short dashes and tufts
      const x = Math.floor(r() * W), top = this.groundTop(x), y = Math.floor(top + 3 + r() * (H - top - 3)), d = y - top;
      const c = d < 12 ? C.gr[2] : d < 30 ? C.gr[4] : C.gr[6];
      b.rect(x, y, 2 + Math.floor(r() * 2), 1, c);
    }
    for (let x = 0; x < W; x += 2 + Math.floor(r() * 3)) { const top = this.groundTop(x); b.set(x, top - 1, C.gr[1]); if (r() < 0.4) b.set(x + 1, top - 2, C.gr[1]); }
    });
    // framing trees (in front of all of that)
    const T = this.buildTrees();
    for (let i = 0; i < T.d.length; i++) if (T.d[i]) { b.d[i] = T.d[i]; ids[i] = this.treeIds[i]; }
    return b;
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

  graveSil(b, x, y, i, col) {
    if (i % 3 === 1) { b.rect(x, y - 8, 2, 9, col); b.rect(x - 2, y - 6, 6, 2, col); }
    else { const w = i % 3 ? 7 : 5, h = i % 3 ? 7 : 6; for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) if (!(j === 0 && (k === 0 || k === w - 1))) b.set(x - (w >> 1) + k, y - h + j, col); }
  }

  /** the two framing trees, traced from the reference. Bark: indigo wood, darker shadow side, teal glint inside the outline on the moon side,
   *  long black grooves with a teal line beside them; thin twigs are plain black strokes */
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
    const grooves = [], tips = [], ids = (this.treeIds = new Uint16Array(W * H));
    this.treeLabels = [];
    const limbs = [...LEFT, ...RIGHT], names = limbs.map((_, i) => (i < LEFT.length ? "левое дерево · " : "правое дерево · ") + ((i < LEFT.length ? i : i - LEFT.length) === 0 ? "ствол" : "ветка " + (i < LEFT.length ? i : i - LEFT.length)));
    limbs.forEach((pts, li) => this.tag(T, ids, names[li], () => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0, w0] = pts[k], [x1, y1, w1] = pts[k + 1], X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, n = Math.ceil(Math.hypot(X1 - X0, Y1 - Y0));
        const nx = -(Y1 - Y0) / n, ny = (X1 - X0) / n;
        for (let i = 0; i <= n; i++) {
          const t = i / n, w = lerp(w0, w1, t), cx = lerp(X0, X1, t) + Math.sin((k + t) * 4.1) * 1.1, cy = lerp(Y0, Y1, t);
          T.disc(cx, cy, Math.max(0, (w - 1) / 2), C.trunk);
          if (w > 17) for (const o of [0.2]) grooves.push([cx + nx * w * o + Math.sin(cy * 0.15 + o * 9) * 1.2, cy + ny * w * o, w]);
        }
      }
      const [xa, ya] = pts[pts.length - 2], [xb, yb] = pts[pts.length - 1];
      tips.push([xb * W, yb * H, Math.atan2((xb - xa) * W, -(yb - ya) * H), names[li]]);
      const mid = pts[Math.min(pts.length - 1, li % limbs.length === 0 || li === LEFT.length ? 2 : Math.floor(pts.length / 2))];
      this.treeLabels.push({ name: names[li], x: clamp(mid[0], 0.02, 0.98) * W, y: clamp(mid[1], 0.03, 0.97) * H });
    }));
    // light: shadow band on the far side, teal glint just inside the edge facing the moon, teal on top edges of limbs
    const src = T.d.slice(), w = W, h = H;
    const emp = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && !src[Y * w + X];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const sx = Math.sign(m.x - x) || 1;
      if (emp(x + sx, y) && !emp(x - sx, y) && !emp(x - 2 * sx, y)) T.d[y * w + x] = C.rim;
      else if (emp(x, y - 1) && !emp(x, y + 1) && !emp(x, y + 2) && !emp(x - sx, y) && (x + y) % 9) T.d[y * w + x] = C.rim;
      else if (emp(x - sx, y) || emp(x - 2 * sx, y) || emp(x - 3 * sx, y)) T.d[y * w + x] = C.trunkD;
    }
    // grooves: a black line with a teal line on its lit side, only well inside the wood
    for (const [gx, gy] of grooves) {
      const X = Math.round(gx), Y = Math.round(gy), sx = Math.sign(m.x - X) || 1;
      if (emp(X - 2, Y) || emp(X + 2, Y) || emp(X, Y - 2) || emp(X, Y + 2)) continue;
      if ((Y >> 2) % 5 >= 3) continue; // dashes, not cables
      T.set(X, Y, C.K);
      if (!emp(X + sx * 3, Y)) T.set(X + sx, Y, (Y >> 2) % 3 ? C.rim : C.rimL);
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

  /** carved stone: rounded/pointed/flat top, teal-blue edge light on the upper left, dark right side, engraving, cracks */
  stone(L, cx, base, w, h, shape, carving, r) {
    const S = new Buf(w + 4, h + 4), ox = 2, oy = 2;
    const inside = (i, j) => {
      if (shape === "round") return !(j < w / 2 && Math.hypot(i - (w - 1) / 2, j - w / 2) > w / 2);
      if (shape === "point") return Math.abs(i - (w - 1) / 2 + j * 0.08) <= (j / h) * (w / 2) + 0.5;
      if (shape === "broken") return j > (i < w * 0.4 ? 2 + i * 0.6 : w * 0.24 + (w - i) * 0.25) ;
      return true;
    };
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inside(i, j)) S.set(ox + i, oy + j, C.stone);
    const src = S.d.slice(), emp = (i, j) => !src[(oy + j) * S.w + ox + i] || i < 0 || j < 0 || i >= w || j >= h;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (emp(i, j)) continue;
      let c = C.stone;
      if (emp(i - 1, j) || emp(i, j - 1)) c = C.stoneL;
      else if (emp(i + 1, j) || emp(i + 2, j) || emp(i + 3, j)) c = C.stoneD;
      else if (j > h - 4) c = C.stoneM;
      else if (emp(i - 2, j) || emp(i, j - 2)) c = C.stone;
      S.set(ox + i, oy + j, c);
    }
    // speckles
    for (let k = 0; k < w * h * 0.025; k++) { const i = 3 + Math.floor(r() * (w - 6)), j = 3 + Math.floor(r() * (h - 6)); if (!emp(i, j)) { S.set(ox + i, oy + j, C.stoneM); S.set(ox + i + 1, oy + j, C.stoneM); } }
    // engraving: dark line, light pixel under/right (cut into the stone)
    const cut = (a, b2, c, d) => {
      const n = Math.max(Math.abs(c - a), Math.abs(d - b2)) || 1;
      for (let k = 0; k <= n; k++) { const i = Math.round(lerp(a, c, k / n)), j = Math.round(lerp(b2, d, k / n)); S.set(ox + i, oy + j, C.stoneDD); if (S.get(ox + i + 1, oy + j + 1) === C.stone || S.get(ox + i + 1, oy + j + 1) === C.stoneM) S.set(ox + i + 1, oy + j + 1, C.stoneL); }
    };
    const mx = Math.round((w - 1) / 2);
    if (carving === "rune") { const t = Math.round(w * 0.45); cut(mx, t, mx, h - 6); cut(mx - 5, t + 3, mx, t + 9); cut(mx + 5, t + 3, mx, t + 9); cut(mx - 4, t - 3, mx, t + 2); cut(mx + 4, t - 3, mx, t + 2); cut(mx - 5, h - 9, mx, h - 13); cut(mx + 5, h - 9, mx, h - 13); }
    if (carving === "cross") { cut(mx, 5, mx, 14); cut(mx - 3, 8, mx + 3, 8); }
    if (carving === "lines") for (let k = 0; k < 3; k++) cut(3, Math.round(h * 0.35) + k * 3, w - 5, Math.round(h * 0.35) + k * 3);
    // a crack from the top
    if (shape !== "point") { let i = Math.round(w * 0.7), j = shape === "round" ? 2 : 1; for (let k = 0; k < h * 0.3; k++) { S.set(ox + i, oy + j, C.stoneDD); j++; if (k % 3 === 1) i += r() < 0.5 ? -1 : 1; } }
    S.outline(C.K);
    L.blit(S, cx - ox - mx, base - oy - h);
  }

  // foreground: carved stones, a shard, a cross, the slab at the right edge, big dark leaves with teal edges
  buildFg() {
    const { W, H } = this, L = new Buf(W, H), r = rng(555);
    const ids = (this.fgIds = new Uint16Array(W * H)), tag = (name, fn) => this.tag(L, ids, name, fn);
    tag("надгробие с руной", () => this.stone(L, Math.round(W * 0.8), Math.round(H * 0.875), 26, 38, "round", "rune", r));
    tag("высокий обломок", () => this.stone(L, Math.round(W * 0.71), Math.round(H * 0.9), 9, 30, "point", null, r));
    tag("разбитая плита", () => this.stone(L, Math.round(W * 0.69), Math.round(H * 0.94), 17, 13, "broken", "lines", r));
    tag("маленький обломок", () => this.stone(L, Math.round(W * 0.745), Math.round(H * 0.925), 7, 10, "point", null, r));
    tag("надгробие с крестом слева", () => this.stone(L, Math.round(W * 0.06), Math.round(H * 0.87), 22, 26, "round", "cross", r));
    // cross on the hill, right
    const X = new Buf(W, H), crx = Math.round(W * 0.915), cry = Math.round(H * 0.53);
    X.rect(crx - 2, cry, 5, 25, C.cross); X.rect(crx - 9, cry + 6, 19, 5, C.cross);
    X.rect(crx - 2, cry, 1, 25, C.leafL); X.rect(crx - 9, cry + 6, 7, 1, C.leafL); X.rect(crx + 3, cry + 6, 7, 1, C.leafL);
    X.rect(crx + 2, cry + 11, 1, 14, C.crossD);
    // small crosses far left and behind the ring
    for (const [fx, fy] of [[0.025, 0.55], [0.3, 0.62]]) { const x = Math.round(W * fx), y = Math.round(H * fy); X.rect(x - 1, y, 3, 10, C.cross); X.rect(x - 4, y + 3, 9, 3, C.cross); X.rect(x - 1, y, 1, 10, C.leafL); }
    // the tall slab on the right edge
    for (let j = 0; j < H * 0.44; j++) { const x0 = Math.round(W * 0.945) + Math.max(0, 7 - j); X.rect(x0, Math.round(H * 0.56) + j, W, 1, C.stoneD); X.set(x0, Math.round(H * 0.56) + j, C.stoneL); }
    X.outline(C.K);
    const xIds = new Uint16Array(W * H), cr = this.nameId("крест на горке"), sm = this.nameId("маленькие кресты"), sl = this.nameId("плита у правого края");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (X.d[y * W + x]) xIds[y * W + x] = x > W * 0.93 && y > H * 0.55 ? sl : x > W * 0.85 ? cr : sm;
    for (let i = 0; i < X.d.length; i++) if (X.d[i]) { L.d[i] = X.d[i]; ids[i] = xIds[i]; }
    // dark leaves along the bottom: tapered curved blades, teal edge on one side
    const leaf = (x, y, len, ang, wid, bend) => {
      let px = x, py = y, a = ang;
      for (let i = 0; i <= len; i++) {
        const t = i / len, wd = wid * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
        a += bend / len;
        px += Math.sin(a); py -= Math.cos(a);
        L.disc(px, py, Math.max(0, wd / 2), C.leaf);
        if (t > 0.15 && t < 0.95) L.set(px + Math.cos(a) * wd / 2, py + Math.sin(a) * wd / 2, C.leafL);
      }
    };
    tag("листья и трава спереди", () => {
    for (let x = 0; x < W; x++) { const e = Math.min(x / W, 1 - x / W), base = 2 + Math.max(0, 0.2 - e) * 30 + 1.5 * Math.sin(x * 0.3); for (let y = H - Math.round(base); y < H; y++) L.set(x, y, C.leaf); }
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? r() * W * 0.24 : W - r() * W * 0.3, len = 10 + r() * 22;
      leaf(x, H + 2, len, side * (0.15 + r() * 0.5) * -1, 3 + r() * 3, side * (0.3 + r() * 0.5));
    }
    for (let i = 0; i < 18; i++) { const x = W * (0.25 + r() * 0.5); leaf(x, H + 2, 4 + r() * 7, (r() - 0.5) * 0.8, 2, (r() - 0.5) * 0.6); }
    });
    L.outline(C.K);
    this.claimEdges(L, ids);
    // a stray bone in the grass
    tag("кость в траве", () => { L.line(W * 0.6, H - 3, W * 0.65, H - 8, C.K, 4); L.line(W * 0.6, H - 3, W * 0.65, H - 8, C.boneD, 2); });
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
    // the ring turns: one lap per 32 beats while the music plays
    if (!this.refPoses && !sk) this.ringA += dt * (ears.active ? (Math.PI * 2) / (32 * (ears.period || 0.5)) : 0.05);
    this.glowV = Math.max(0.25 + 0.15 * Math.sin(t * 2.1), this.glowV - dt * 1.6);

    buf.d.set(this.bg.d);
    // review page: credit each pixel to what drew it (off at the party)
    if (this.trace) this.ids = this.bgIds.slice();
    const T = (name, fn) => (this.trace ? this.tag(buf, this.ids, name, fn) : fn());
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < Math.round(H * 0.5) * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.5);
    T("облака и звёзды", () => this.drawSky(t, tq, ears));
    this.groundGlow();

    const boo = sk === "boo" && se > 0.15 && se < 2.45;
    if (!boo) T("жнец", () => this.drawReaper(t, tq, ears, se, sk, 1));
    const ring = this.dancers.map((d) => {
      const a = this.ringA + d.k * (Math.PI / 2);
      return { d, x: Math.round(this.cx + Math.cos(a) * this.ring.rx), fy: Math.round(this.potY + 1 + Math.sin(a) * this.ring.ry), front: Math.sin(a) > 0 };
    }).sort((a, b) => a.fy - b.fy);
    for (const q of ring) if (!q.front) T("скелет " + (q.d.k + 1), () => this.drawDancer(q, t, tq, ears, se, sk));
    T("котёл", () => this.drawCauldron(t, tq, ears, dt));
    for (const q of ring) if (q.front) T("скелет " + (q.d.k + 1), () => this.drawDancer(q, t, tq, ears, se, sk));
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
  drawSky(t, tq, ears) {
    const { buf, W, H } = this, m = this.moon;
    const tw = Math.floor(tq * 3);
    for (const s of this.stars) {
      if (Math.hypot(s.x - m.x, s.y - m.y) < m.r + 3) continue;
      const on = (s.b * 13 + tw) % 5 > 0.6;
      buf.set(s.x, s.y, on || ears.high > 0.7 ? C.star : C.star2);
      if (s.b > 0.6 && on) { buf.set(s.x + 1, s.y, C.star2); buf.set(s.x - 1, s.y, C.star2); buf.set(s.x, s.y + 1, C.star2); buf.set(s.x, s.y - 1, C.star2); }
    }
    // stepped clouds: rows of 2 px, each row a little shorter, light top row, dark underside
    for (const [fx, fy, len, sp] of [[0.3, 0.165, 0.2, 0.5], [0.58, 0.1, 0.25, 0.35], [0.63, 0.21, 0.1, 0.6], [0.02, 0.12, 0.13, 0.4]]) {
      const Lw = Math.round(W * len), x0 = Math.round(((W * fx + t * sp) % (W + Lw)) - Lw / 2), y0 = Math.round(H * fy);
      const rows = [[0.18, 0.4], [0.1, 0.8], [0, 1], [0.06, 0.94]], cols = [C.cloudL, C.cloud, C.cloud, C.cloudD];
      rows.forEach(([a, b], k) => {
        const xa = x0 + Math.round(a * Lw), xb = x0 + Math.round(b * Lw);
        for (let y = y0 + k * 2; y < y0 + k * 2 + 2; y++) for (let x = xa; x < xb; x++) buf.set(x, y, k === 1 && y === y0 + 2 && (x < xa + 3 || x > xb - 4) ? C.cloudL : cols[k]);
      });
      for (let x = x0 + Math.round(0.5 * Lw); x < x0 + Math.round(0.72 * Lw); x++) { buf.set(x, y0 - 1, C.cloudL); buf.set(x, y0, C.cloudL); buf.set(x, y0 + 1, C.cloud); } // second hump
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

  /** green light from the brew on the ground, in a few clean steps */
  groundGlow() {
    const { buf, W, H, cx, potY } = this, g = this.glowV;
    const R = 30 + g * 22;
    for (let y = Math.max(0, Math.round(potY - R * 0.45)); y < Math.min(H, potY + R * 0.45); y++) for (let x = Math.max(0, Math.round(cx - R)); x < Math.min(W, cx + R); x++) {
      const d = Math.hypot((x - cx) / R, (y - potY) / (R * 0.32));
      if (d >= 1) continue;
      const lv = Math.floor((1 - d) * 3 * g + (bayer(x, y) > 0.5 ? 0.25 : 0));
      if (lv > 0) buf.d[y * W + x] = mix(buf.d[y * W + x], C.green, 0.07 * lv);
    }
  }

  // ---------- cauldron: no fire, the brew glows on the beat and breathes out green motes ----------
  drawCauldron(t, tq, ears, dt) {
    const { buf, cx, potY: fy, rimY } = this, g = this.glowV;
    const L = this.potL, ox = 22, oy = 37;
    L.clear();
    for (const lx of [-11, 9]) { L.rect(ox + lx, oy - 6, 3, 6, C.potD); L.set(ox + lx, oy - 6, C.pot); }
    const by = oy - 17, rx = 17, ry = 12;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = y / ry;
      if (nx * nx + ny * ny > 1.02) continue;
      const l = -0.65 * nx - 0.45 * ny;
      L.set(ox + x, by + y, l > 0.52 ? C.potL : l > 0.12 ? C.potM : l > -0.4 ? C.pot : C.potD);
    }
    // the glow catches the upper rim of the pot
    const ry0 = oy - 27;
    L.ellipse(ox, ry0, 19, 4, C.potM);
    for (let x = -19; x <= 1; x++) L.set(ox + x, ry0 + (x < -15 ? 1 : 3), C.potRim);
    const bL = g > 0.7 ? C.brewL : C.brew, bM = g > 0.7 ? C.brew : C.brewM;
    L.ellipse(ox, ry0, 16, 2.5, C.brewD);
    L.ellipse(ox, ry0 + 0.5, 15, 2, bM);
    L.ellipse(ox - 1, ry0 + 1, 10, 1.2, bL);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 4; i++) { const bx = ox - 10 + ((i * 7 + sp * 3) % 20); L.set(bx, ry0 + (i % 2), C.brewL); L.set(bx + 1, ry0 + (i % 2) - 1, C.brewL); }
    for (let x = -12; x <= 12; x += 3) if (g > 0.55) L.set(ox + x, ry0 + 4, mix(C.potM, C.green, 0.45));
    L.outline(C.K);
    // shadow under the pot
    for (let x = -14; x <= 14; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 14 - y * 5) buf.set(cx + x, fy + y, mix(buf.get(cx + x, fy + y), C.black, 0.5));
    buf.blit(L, cx - ox, fy - oy);
    this.mouth = { x: cx, y: fy - oy + ry0 };
    // green motes rising
    const rate = (0.25 + g * 1.4 + ears.level * 0.4) * dt * 12;
    for (let i = 0; i < rate; i++) if (Math.random() < rate - i) this.parts.push({ k: "mote", x: cx + (Math.random() - 0.5) * 22, y: this.mouth.y - 1, t0: t, life: 1.2 + Math.random() * 1.2, ph: Math.random() * 6, v: 9 + Math.random() * 10 });
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
    // right sleeve holds the scythe
    const sleeveTo = (sx, sy, hx, hy, cuff) => {
      // a cloth sleeve: narrow at the shoulder, wide bell at the cuff, darker underside
      const n = Math.ceil(Math.hypot(hx - sx, hy - sy)), px = -(hy - sy) / n, py = (hx - sx) / n;
      for (let i = 0; i <= n; i++) {
        const t = i / n, w = lerp(2.6, cuff, t * t), x = lerp(sx, hx, t), y = lerp(sy, hy, t);
        for (let o = -w; o <= w; o += 0.5) L.set(x + px * o, y + py * o, o > w * 0.35 ? C.robeD : o < -w * 0.6 ? C.robeL : C.robe);
      }
    };
    sleeveTo(ox + 6, oy + 11, shx - 2, oy + 17, 2.8);
    L.rect(shx - 3, oy + 16, 3, 3, C.glove);
    // left sleeve: up and forward, the gloved hand open at its end
    const hx = ox - 6 + g.hand.x, hy = oy + 10 + g.hand.y, sx = ox - 6, sy = oy + 10;
    const ux = (hx - sx) / Math.hypot(hx - sx, hy - sy), uy = (hy - sy) / Math.hypot(hx - sx, hy - sy);
    sleeveTo(sx, sy, hx - ux * 2, hy - uy * 2, 4);
    L.disc(hx, hy, 1.6, C.glove);
    L.set(hx + ux * 2, hy + uy * 2, C.glove); L.set(hx + ux * 2 - uy * 1.5, hy + uy * 2 + ux * 1.5, C.glove); L.set(hx + ux * 2 + uy * 1.5, hy + uy * 2 - ux * 1.5, C.glove); // fingers
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
    // smooth: ease from the previous key pose to the new one over half a beat
    const u = smooth(clamp((t - d.tSw) / ((this.period || 0.6) * 0.5)));
    let p = blend(d.prev, d.cur, u);
    // a little bounce on every beat
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

  drawDancer(q, t, tq, ears, se, sk) {
    const { d } = q;
    d.x = q.x;
    const p = this.dancerPose(d, t, tq, ears, se, sk);
    const L = this.dl, ox = 30, oy = 58;
    L.clear();
    if (p.pile) this.pile(L, ox, oy, d);
    else this.skeleton(L, ox, oy, p, ears);
    L.outline(C.K);
    for (let x = -7; x <= 7; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 7 - y * 3) { const X = q.x + x, Y = q.fy + 1 + y; this.buf.set(X, Y, mix(this.buf.get(X, Y), C.black, 0.4)); }
    // the ones behind the cauldron sit a touch further into the night
    this.buf.blit(L, q.x - ox, q.fy - oy, false, q.front ? null : (c) => (c === C.K ? c : mix(c, C.vale, 0.12)));
  }

  skeleton(L, fx, fy, p, ears) {
    const hipY = Math.round(fy - 18 + p.dy), hx = fx + p.lean * 0.5, cxx = fx + p.lean;
    const limb = (x0, y0, side, a, f, l1, l2) => {
      const a1 = a * D, a2 = (a + f) * D;
      const x1 = x0 + side * Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + side * Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      return [x1, y1, x2, y2];
    };
    const bone = (x0, y0, x1, y1) => { L.line(x0, y0, x1, y1, C.K, 4); L.line(x0, y0, x1, y1, C.bone, 2); };
    for (const [side, u, k] of [[-1, p.uL, p.kL], [1, p.uR, p.kR]]) {
      const x0 = hx + side * 2, [x1, y1, x2, y2] = limb(x0, hipY + 1, side, u, k, 9, 9);
      bone(x0, hipY + 1, x1, y1); bone(x1, y1, x2, y2);
      L.line(x2, y2, x2 + side * 2, y2, C.K, 4); L.line(x2, y2, x2 + side * 2, y2, C.bone, 2);
    }
    L.blit(PELVIS, Math.round(hx) - 4, hipY - 1);
    for (let y = hipY - 2; y > hipY - 5; y--) L.set(Math.round(lerp(hx, cxx, (hipY - y) / 5)), y, C.bone);
    L.blit(RIBS, Math.round(cxx) - 4, hipY - 12);
    const shY = hipY - 11;
    const arms = () => {
      for (const [side, a, f] of [[-1, p.aL, p.fL], [1, p.aR, p.fR]]) {
        const x0 = cxx + side * 4, [x1, y1, x2, y2] = limb(x0, shY, side, a, f, 7, 7);
        bone(x0, shY, x1, y1); bone(x1, y1, x2, y2);
        L.disc(x2, y2, 2, C.K); L.disc(x2, y2, 1, C.bone); L.set(x2 + side, y2 - 1, C.bone);
      }
    };
    const over = p.aL > 140 && p.fL > 60;
    if (!over) arms();
    const sx = Math.round(cxx + p.tilt - 5 + p.sx), sy = Math.round(hipY - 23 + p.sy);
    L.blit(SKULL, sx, sy);
    const lk = Math.round(clamp(p.look, -1, 1));
    // sockets: 3x3 with the inner top corner rounded, a small nose
    for (const ex of [2, 6]) { L.rect(sx + ex + lk, sy + 3, 3, 3, C.ink); L.set(sx + ex + lk + (ex < 5 ? 0 : 2), sy + 3, C.bone); }
    if (ears.pulse > 0.6 && !this.refPoses) { L.set(sx + 3 + lk, sy + 4, C.eye); L.set(sx + 7 + lk, sy + 4, C.eye); }
    L.set(sx + 5, sy + 6, C.ink);
    L.blit(JAW, sx + 2, sy + 9 + Math.round(p.jaw));
    if (over) arms();
  }

  pile(L, fx, fy, d) {
    const s = d.k % 2 ? -1 : 1;
    const bone = (x0, y0, x1, y1) => { L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.K, 4); L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.bone, 2); };
    bone(-14, -2, -5, -2); bone(-3, -5, 5, -3); bone(7, -2, 15, -3); bone(-10, -6, -2, -7);
    L.blit(RIBS, fx - 4 - 3 * s, fy - 9);
    L.blit(PELVIS, fx + 3 * s - 4, fy - 4);
    L.blit(SKULL, fx + 7 * s - 5, fy - 11);
    for (const ex of [2, 6]) L.rect(fx + 7 * s - 5 + ex, fy - 8, 3, 3, C.ink);
    L.blit(JAW, fx - 12 * s - 4, fy - 3);
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
      // sparkles drifting out of the reaper's hand in a loose cone toward the cauldron
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
      } else if (q.k === "spark") {
        const e = t - q.t0, drag = 1 - Math.min(0.7, e * 0.45), x = Math.round(q.x + q.vx * e * drag), y = Math.round(q.y + q.vy * e * drag + Math.sin(e * 4 + q.j * 9) * 2);
        const purple = q.j < 0.4, c = age < 0.3 ? (purple ? C.magicPL : C.magicL) : purple ? C.magicP : C.magic;
        if (age > 0.7 && (x + y + Math.floor(t * 12)) % 2) continue;
        buf.set(x, y, c);
        if (q.j > 0.86 && age < 0.6) { buf.set(x - 1, y, c); buf.set(x + 1, y, c); buf.set(x, y - 1, c); buf.set(x, y + 1, c); } // a few little crosses
        else if (q.j > 0.6 && age < 0.5) buf.set(x + Math.sign(q.vx) * -1, y - Math.sign(q.vy) * -1, purple ? C.magicP : C.magic); // short tails
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
