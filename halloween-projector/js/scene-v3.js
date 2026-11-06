// V3 scene: a close match of ref-style.jpg — moonlit graveyard (purple-navy sky, huge blotchy moon, blue hills, teal grass),
// gnarled trees with teal edges, three armoured skeletons dancing at a cauldron, a small hooded reaper casting sparks.
// Older looks: js/scene-v1.js (?v=1), js/scene-v2.js (?v=2).
// Everything is drawn into one native-resolution buffer; poses are held and change on beats (sprite-style, ~12 fps).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";

// colours picked from the reference
const C = {
  K: pk(0x02020a), ink: pk(0x05040c), white: pk(0xffffff),
  sky: [0x100d2e, 0x16113a, 0x1d1745, 0x231f50, 0x292b5d, 0x2e3463, 0x353c70].map(pk),
  halo: pk(0x353c70),
  star: pk(0xeef6ff), star2: pk(0x8890c8),
  moon: pk(0xeefcfa), moonM: pk(0xdbe9e2), moonD: pk(0xb4cbd4), moonDD: pk(0x8eaabb),
  cloud: pk(0x232456), cloudL: pk(0x353a70), cloudD: pk(0x18173f),
  far: pk(0x264873), farD: pk(0x1f3a66), farS: pk(0x1a2c58),
  mid: pk(0x1c5373), midD: pk(0x163b5d), midS: pk(0x122c4e), midG: pk(0x2a4f7c),
  gr: [0x3a7e98, 0x2a7489, 0x1e6b81, 0x1c5f78, 0x1c5373, 0x163b5d].map(pk), grL: pk(0x5db5ae), grLL: pk(0x7fd2c0),
  trunk: pk(0x110c2c), trunkM: pk(0x1d1745), rim: pk(0x3a8e98), rimL: pk(0x5db5ae),
  stone: pk(0x464c76), stoneL: pk(0x5a6290), stoneD: pk(0x2e2e5d), stoneDD: pk(0x232b56), stoneP: pk(0x3a2a6a),
  fg: pk(0x080723), fgM: pk(0x100d2e), fgL: pk(0x3a7e98),
  fog: pk(0x66849e),
  pot: pk(0x3e4670), potM: pk(0x56608e), potL: pk(0x8290b8), potRim: pk(0x9aa6cc), potD: pk(0x262a4e),
  brew: pk(0x6cf060), brewM: pk(0x34c050), brewD: pk(0x1a8a3a), brewL: pk(0xd0ffb8),
  smokeG: pk(0x52d266), smokeGL: pk(0x9cf6a0), smokeP: pk(0x8a3ed0), smokePL: pk(0xb878f0),
  fire: [0xfff2a0, 0xffc040, 0xff8a24, 0xe04a1c, 0x8a1a20].map(pk),
  log: pk(0x7a4424), logD: pk(0x4a2412), logL: pk(0xa86a38),
  robe: pk(0x5a2a8e), robeM: pk(0x45206e), robeD: pk(0x2e1450), robeL: pk(0x7444b0), hood: pk(0x05040c), glove: pk(0x14101e),
  eye: pk(0x40d8ff), eyeL: pk(0xc8f6ff), redEye: pk(0xff3a3a),
  bone: pk(0xf4ecd0), boneM: pk(0xcfc29c), boneD: pk(0x8c7e60),
  iron: pk(0xa4a8b8), ironL: pk(0xd8dce6), ironM: pk(0x787c90), ironD: pk(0x4c5068),
  wood: pk(0x8a5a30), woodD: pk(0x553418), woodL: pk(0xb07a44), gold: pk(0xb07a44), blood: pk(0xa0141e),
  blade: pk(0xe0e4ec), bladeL: pk(0xffffff), bladeM: pk(0x9ca2b4),
  shield: pk(0x8a5228), shieldD: pk(0x5c3418),
  magic: pk(0x40c8ff), magicL: pk(0xc8f4ff), magicP: pk(0x9a5cff), magicPL: pk(0xc8a0ff),
  cat: pk(0x2a2c52), catL: pk(0x6a72a8), catEye: pk(0xffe23a),
  red: pk(0xff2a2a), redD: pk(0x9a1010),
  warm: pk(0xff9a40), green: pk(0x50ff90), flash: pk(0xb8d8ff), black: pk(0x020104),
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const D = Math.PI / 180;
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- sprites ----------
const BP = { w: C.bone, m: C.boneM, d: C.boneD };
const SKULL = sprite([
  "...wwwwwwwww...",
  ".wwwwwwwwwwwwm.",
  "wwwwwwwwwwwwwwm",
  "wwwwwwwwwwwwwwm",
  "wwwwwwwwwwwwwwm",
  "wwwwwwwwwwwwwwm",
  "wwwwwwwwwwwwwwm",
  "wwwwwwwwwwwwwwm",
  ".wwwwwwwwwwwwm.",
  "..wwwwwwwwwwm..",
  "..wwwwwwwwwwm..",
  "..w.w.w.w.w.m..",
], BP);
const JAW = sprite(["w.w.w.w.wm.", "wwwwwwwwwmm", ".wwwwwwwmm."], BP);
const RIBS = sprite([
  "..wwwwwwwww..",
  ".............",
  "wwwwwwwwwwwwm",
  ".............",
  "wwwwwwwwwwwwm",
  ".............",
  ".wwwwwwwwwwm.",
  "......w......",
  "......w......",
], BP);
const PELVIS = sprite([".wwwwwwwwm.", "wwww.w.wwmm", "ww..www..mm", ".w..w.w..m."], BP);
const IP = { I: C.ironL, i: C.iron, M: C.ironM, D: C.ironD, k: C.ink };
const HELM = sprite([
  ".....IIIIiii.....",
  "...IIIiiiiiiMM...",
  "..IIiiiiiiiiiMM..",
  ".IIiiiiiiiiiiiMM.",
  ".IiiiiiiiiiiiiMM.",
  "MMMMMMMMMMMMMMMMD",
  ".DDDDDDDDDDDDDDD.",
], IP);
// closed helm with visor slits (the sword skeleton)
const VISOR = sprite([
  "....IIIIiiii....",
  "..IIIiiiiiiiMM..",
  ".IIiiiiiiiiiiMM.",
  ".IiiiiiiiiiiiiM.",
  "IIiiiiiiiiiiiiMM",
  "IiMMMMMMMMMMMMMD",
  "Iik.k.k.k.k.k.MD",
  "IiMMMMMMMMMMMMMD",
  "Ii............MD",
  "Ii............MD",
], IP);
const PAUL = sprite(["..III..", ".IIiiM.", "IIiiiMM", "DMMMMMD", ".D.D.D."], IP);
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
const BATP = { b: pk(0x0c0a24), r: C.red };
const BAT = [
  sprite(["b.....b", "bb.b.bb", ".bbrbb.", "...b..."], BATP),
  sprite(["...b...", ".bbrbb.", "bb.b.bb", "b.....b"], BATP),
];

// ---------- poses ----------
// a = upper arm angle out from straight down (deg), f = forearm extra turn (+ outward/up), u = thigh angle out, k = shin extra turn (- = inward)
// pole: direction of a pole weapon in degrees from straight up (- = toward the body's left)
const BASE = { aL: 20, fL: 10, aR: 20, fR: 10, uL: 6, kL: -6, uR: 6, kR: -6, dy: 0, lean: 0, tilt: 0, jaw: 0, look: 0, sx: 0, sy: 0, pole: 0 };
const P = (o) => ({ ...BASE, ...o });
function flipPose(p) { return { ...p, aL: p.aR, fL: p.fR, aR: p.aL, fR: p.fL, uL: p.uR, kL: p.kR, uR: p.uL, kR: p.kL, lean: -p.lean, tilt: -p.tilt, look: -p.look, pole: -p.pole }; }
// the three poses of the reference picture
const REF = {
  kick: P({ aR: 150, fR: 25, aL: 55, fL: -35, uL: 8, kL: -12, uR: 88, kR: 4, lean: -1, tilt: -1 }),
  spear: P({ aR: 165, fR: -15, aL: 85, fL: -85, uL: 5, kL: -3, uR: 5, kR: -3, pole: -62 }),
  jump: P({ aL: 150, fL: 35, aR: 150, fR: 35, uL: 35, kL: -80, uR: 22, kR: -55, dy: -4, jaw: 1 }),
};
const BOUNCE = P({ aL: 80, fL: 20, aR: 80, fR: 20, dy: 1, uL: 10, kL: -15, uR: 10, kR: -15 });
const MOVES = {
  wave: [P({ aL: 160, fL: 15, aR: 35, fR: -40 }), P({ aL: 35, fL: -40, aR: 160, fR: 15, dy: 1, uL: 12, kL: -20, uR: 12, kR: -20 })],
  hips: [P({ aL: 50, fL: -110, aR: 50, fR: -110, dy: 2, uL: 14, kL: -26, uR: 14, kR: -26, tilt: -1, jaw: 1 }), P({ aL: 50, fL: -110, aR: 50, fR: -110, tilt: 1 })],
  kick: [REF.kick, BOUNCE, flipPose(REF.kick), BOUNCE],
  jack: [P({ aL: 165, fL: 0, aR: 165, fR: 0, uL: 25, kL: 0, uR: 25, kR: 0, dy: -3, jaw: 1 }), P({ aL: 15, fL: 0, aR: 15, fR: 0, uL: 4, uR: 4, dy: 1 })],
  jump: [REF.jump, P({ aL: 120, fL: 40, aR: 120, fR: 40, uL: 14, kL: -26, uR: 14, kR: -26, dy: 2 })],
  spear: [REF.spear, P({ aR: 140, fR: 10, aL: 70, fL: -60, uL: 12, kL: -20, uR: 12, kR: -20, dy: 1, pole: -30 })],
  chomp: [P({ aL: 75, fL: 60, aR: 75, fR: -30, jaw: 1, dy: 1, tilt: -1 }), P({ aL: 75, fL: -30, aR: 75, fR: 60, tilt: 1 })],
  sway: [P({ lean: -1, tilt: -1, aL: 25, aR: 12 }), P({ lean: 1, tilt: 1, aL: 12, aR: 25 })],
};
const DANCE = ["wave", "hips", "kick", "jack", "jump", "spear", "chomp"];
const SPECIAL = {
  cower: P({ aL: 165, fL: 115, aR: 165, fR: 115, uL: 16, kL: -30, uR: 16, kR: -30, dy: 4, jaw: 1 }),
  startle: P({ aL: 170, fL: -10, aR: 170, fR: -10, uL: 18, kL: 0, uR: 18, kR: 0, dy: -7, jaw: 1 }),
  freeze: P({ aL: 40, fL: 70, aR: 40, fR: 70, uL: 10, kL: -10, uR: 10, kR: -10, jaw: 1, dy: 1 }),
  fall: P({ aL: 110, fL: 30, aR: 110, fR: 30, uL: 60, kL: -10, uR: 60, kR: -10, dy: 10, sx: 4, sy: 8, jaw: 1 }),
};
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
    this.sc = null;
    this.lastBeat = -1;
    this.idleT = 0;
    this.refPoses = false; // true = hold the poses of the reference picture
    this.r = rng(1031);
    this.condL = new Buf(80, 90);
    this.potL = new Buf(50, 44);
    this.dl = new Buf(96, 100);
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.buf = new Buf(W, H);
    this.cx = Math.round(W * 0.355); // cauldron
    this.potY = Math.round(H * 0.89); // cauldron feet
    this.rimY = this.potY - 27;
    this.cond = { x: Math.round(W * 0.815), y: Math.round(H * 0.37) }; // reaper hood centre
    this.condShadow = Math.round(H * 0.6);
    this.dancers = [];
    const r = rng(77);
    const add = (fx, fy, gear, move, ref) => this.dancers.push({ x: Math.round(W * fx), fy: Math.round(H * fy), gear, flip: false, move, ref, step: 0, prev: ref, cur: ref, tSw: -1, seed: r() });
    add(0.2, 0.89, { helm: "visor", weapon: "sword", paul: "L" }, "kick", REF.kick);
    add(0.45, 0.865, { helm: "cap", weapon: "spear" }, "spear", REF.spear);
    add(0.585, 0.87, { helm: "cap", shield: 1, paul: "L" }, "jump", REF.jump);
    this.stars = [[0.02, 0.04], [0.19, 0.31], [0.26, 0.12], [0.36, 0.13], [0.42, 0.04], [0.67, 0.09], [0.72, 0.03], [0.665, 0.17], [0.7, 0.42], [0.93, 0.08], [0.98, 0.33], [0.84, 0.05], [0.5, 0.02], [0.12, 0.18], [0.57, 0.46]].map(([x, y], i) => ({ x: Math.round(W * x), y: Math.round(H * y), b: (i * 0.37) % 1 }));
    this.eyes = [];
    for (let i = 0; i < 10; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? 10 + r() * W * 0.2 : W - 10 - r() * W * 0.2;
      this.eyes.push({ x: Math.round(x), y: Math.round(H * (0.45 + r() * 0.2)), side, ph: r() * 10 });
    }
    this.moon = { x: Math.round(W * 0.5), y: Math.round(H * 0.245), r: Math.round(H * 0.215) };
    this.bg = this.buildBg();
    this.fgL = this.buildFg();
  }

  // ---------- static background ----------
  farTop(x) { const { H } = this; return Math.round(H * 0.42 + 3 * Math.sin(x * 0.03 + 1) + 2 * Math.sin(x * 0.09)); }
  midTop(x) { const { H, W } = this; return Math.round(H * (0.52 - 0.03 * x / W) + 4 * Math.sin(x * 0.025 + 2) + 1.5 * Math.sin(x * 0.11)); }
  groundTop(x) { const { H, W } = this; const u = x / W; return Math.round(H * (0.625 - 0.13 * u * u) + 2 * Math.sin(x * 0.05 + 1)); }

  buildBg() {
    const { W, H } = this, b = new Buf(W, H), r = rng(4242), m = this.moon;
    // sky: purple-navy at the top, bluer to the horizon, checker dither between bands
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const f = (y / (H * 0.55)) * (C.sky.length - 1), i = Math.min(C.sky.length - 1, Math.floor(f));
      let c = f - i > bayer(x, y) ? C.sky[Math.min(i + 1, C.sky.length - 1)] : C.sky[i];
      const d = Math.hypot(x - m.x, y - m.y) / m.r;
      if (d > 1 && d < 1.7 && ((1.7 - d) / 0.7) * 0.6 > bayer(x, y)) c = mix(c, C.halo, 0.6);
      b.d[y * W + x] = c;
    }
    // moon: big blocky patches (3 px cells), like the reference
    const cell = (x, y) => { const X = Math.floor((x + 99) / 3), Y = Math.floor((y + 99) / 3); return (Math.sin(X * 12.9898 + Y * 78.233) * 43758.5453) % 1; };
    const blob = (x, y) => 0.5 + 0.28 * Math.sin(x * 0.19 + 1.3) * Math.sin(y * 0.23 - 0.4) + 0.22 * Math.sin((x + y) * 0.11 + 2) + 0.12 * Math.abs(cell(x, y));
    for (let y = -m.r; y <= m.r; y++) for (let x = -m.r; x <= m.r; x++) {
      const d = Math.hypot(x, y);
      if (d > m.r + 0.3) continue;
      const v = blob(x, y);
      let c = v > 0.74 ? C.moonD : v > 0.6 ? C.moonM : C.moon;
      if (d > m.r - 1.5 && c === C.moon) c = C.moonM;
      b.set(m.x + x, m.y + y, c);
    }
    // far hills: graves and dead trees as darker silhouettes
    for (let x = 0; x < W; x++) for (let y = this.farTop(x); y < H; y++) b.set(x, y, y - this.farTop(x) > 6 + bayer(x, y) * 4 ? C.farD : C.far);
    this.tree(b, Math.round(W * 0.585), this.farTop(W * 0.585) + 3, 40, C.farS, rng(5), 4, 4, 0.2);
    this.tree(b, Math.round(W * 0.27), this.farTop(W * 0.27) + 2, 22, C.farS, rng(8), 2.5, 3, 0);
    [0.05, 0.08, 0.14, 0.31, 0.35, 0.38, 0.44, 0.47, 0.53, 0.61, 0.64, 0.7, 0.76, 0.83, 0.9].forEach((fx, i) => {
      const x = Math.round(W * fx), y = this.farTop(x) + 4;
      if (i % 2) { b.rect(x, y - 8, 2, 9, C.farS); b.rect(x - 2, y - 6, 6, 2, C.farS); }
      else { b.rect(x - 3, y - 6, 7, 7, C.farS); b.rect(x - 2, y - 7, 5, 1, C.farS); }
    });
    // mid hill
    for (let x = 0; x < W; x++) for (let y = this.midTop(x); y < H; y++) b.set(x, y, y - this.midTop(x) < 1 ? C.midG : y - this.midTop(x) > 8 + bayer(x, y) * 5 ? C.midD : C.mid);
    [0.04, 0.12, 0.22, 0.29, 0.34, 0.41, 0.5, 0.55, 0.62, 0.66, 0.73].forEach((fx, i) => {
      const x = Math.round(W * fx), y = this.midTop(x) + 6;
      if (i % 2 === 0) { b.rect(x, y - 10, 3, 11, C.midS); b.rect(x - 3, y - 8, 9, 3, C.midS); }
      else for (let j = 0; j < 9; j++) for (let k = 0; k < 8; k++) if (!(j < 2 && (k === 0 || k === 7))) b.set(x - 4 + k, y - 9 + j, k < 1 ? C.midG : C.midS);
    });
    // teal ground rising to the right, bright ridge
    for (let x = 0; x < W; x++) {
      const top = this.groundTop(x);
      for (let y = top; y < H; y++) {
        const t = (y - top) / Math.max(1, H - top), f = 1 + Math.pow(t, 1.6) * (C.gr.length - 2), i = Math.floor(f);
        let c = f - i > bayer(x, y) ? C.gr[Math.min(i + 1, C.gr.length - 1)] : C.gr[i];
        if (y - top < 2) c = y - top < 1 ? C.grL : C.gr[0];
        b.d[y * W + x] = c;
      }
    }
    // grass strokes: light dashes near the ridge, darker tufts below
    for (let i = 0; i < W * 2.2; i++) {
      const x = Math.floor(r() * W), top = this.groundTop(x), y = Math.floor(top + 1 + r() * (H - top)), t = (y - top) / (H - top);
      if (t < 0.35) b.line(x, y, x + 1 + Math.floor(r() * 2), y - 1, r() < 0.5 ? C.grL : C.gr[0]);
      else b.line(x, y, x + (r() < 0.5 ? -1 : 1), y - 1 - Math.floor(r() * 2), t > 0.7 ? C.gr[5] : C.gr[1]);
    }
    for (let x = 0; x < W; x += 2 + Math.floor(r() * 3)) { const top = this.groundTop(x); b.line(x, top, x + 1, top - 2, C.grL); }
    // framing trees
    const T = new Buf(W, H);
    this.drawTrees(T);
    this.rimLight(T);
    T.outline(C.K);
    b.blit(T, 0, 0);
    return b;
  }

  /** the two framing trees, traced from the reference: polylines in fractions of the frame [x, y, width px] */
  drawTrees(T) {
    const { W, H } = this, r = rng(21);
    const LEFT = [
      [[0.12, 1.02, 42], [0.15, 0.8, 31], [0.17, 0.6, 25], [0.2, 0.4, 21], [0.21, 0.2, 15], [0.23, 0.05, 10], [0.24, -0.02, 6]], // trunk
      [[0.2, 0.36, 14], [0.25, 0.29, 11], [0.3, 0.22, 8], [0.35, 0.18, 6], [0.39, 0.14, 3]], // across toward the moon
      [[0.21, 0.24, 11], [0.27, 0.12, 8], [0.31, 0.04, 6], [0.34, -0.02, 3]], // up and right
      [[0.17, 0.5, 14], [0.12, 0.44, 11], [0.06, 0.4, 8], [0.0, 0.37, 6]], // out to the left
      [[0.2, 0.3, 11], [0.14, 0.2, 8], [0.09, 0.12, 7], [0.03, 0.07, 4], [-0.01, 0.05, 3]], // up and left
      [[0.2, 0.42, 10], [0.26, 0.4, 7], [0.31, 0.38, 6], [0.36, 0.39, 3]], // low branch to the right
      [[0.21, 0.31, 8], [0.27, 0.32, 6], [0.32, 0.29, 3]],
      [[0.1, 0.43, 7], [0.07, 0.3, 6], [0.05, 0.22, 3]],
    ];
    const RIGHT = [
      [[0.975, 1.02, 36], [0.955, 0.8, 25], [0.95, 0.6, 21], [0.955, 0.4, 17], [0.94, 0.2, 13], [0.92, 0.05, 8], [0.91, -0.02, 6]],
      [[0.95, 0.38, 13], [0.9, 0.3, 10], [0.85, 0.23, 7], [0.8, 0.19, 4], [0.76, 0.18, 3]],
      [[0.94, 0.22, 10], [0.89, 0.12, 7], [0.86, 0.05, 4], [0.84, 0.0, 3]],
      [[0.95, 0.52, 8], [0.91, 0.48, 6], [0.88, 0.47, 3]],
      [[0.92, 0.1, 7], [0.97, 0.03, 4], [1.0, -0.01, 3]],
    ];
    const stroke = (pts) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0, w0] = pts[k], [x1, y1, w1] = pts[k + 1], X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, n = Math.ceil(Math.hypot(X1 - X0, Y1 - Y0));
        for (let i = 0; i <= n; i++) {
          const t = i / n, wob = Math.sin((k + t) * 5.3) * 1.2;
          T.disc(lerp(X0, X1, t) + wob, lerp(Y0, Y1, t), Math.max(0, (lerp(w0, w1, t) - 1) / 2), C.trunk);
          // little spurs along thinner wood
          if (lerp(w0, w1, t) < 9 && r() < 0.025) twig(lerp(X0, X1, t), lerp(Y0, Y1, t), Math.atan2(X1 - X0, -(Y1 - Y0)) + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), 5 + r() * 6, 2);
        }
      }
      const [xa, ya] = pts[pts.length - 2], [xb, yb] = pts[pts.length - 1], a = Math.atan2((xb - xa) * W, -(yb - ya) * H);
      for (let i = 0; i < 3; i++) twig(xb * W, yb * H, a + (i - 1) * 0.55 + (r() - 0.5) * 0.3, 6 + r() * 8, 2); // forked sharp tips
    };
    const twig = (x, y, a, len, w) => {
      for (let i = 0; i <= len; i++) { x += Math.sin(a); y -= Math.cos(a); a += (r() - 0.5) * 0.15; T.disc(x, y, i < len * 0.4 ? (w - 1) / 2 : 0, C.trunk); }
      if (len > 6 && r() < 0.6) twig(x, y, a + (r() < 0.5 ? -0.6 : 0.6), len * 0.5, 1);
    };
    for (const s of [...LEFT, ...RIGHT]) stroke(s);
    // flared roots
    for (const [fx, s] of [[0.12, -1], [0.12, 1], [0.975, -1]]) { let rx = fx * W, ry = H - 8; for (let j = 0; j < 16; j++) { rx += s * 1.2; ry += 0.45; T.disc(rx, ry, Math.max(0, 4 - j * 0.25), C.trunk); } }
  }

  /** teal edges on the side facing the moon, a darker band on the other side, a few dark grain lines */
  rimLight(L) {
    const { w, h, d } = L, src = d.slice(), m = this.moon;
    const empty = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && !src[Y * w + X];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const sx = Math.sign(m.x - x) || 1;
      if ((empty(x + sx, y) && !empty(x - sx, y)) || (empty(x, y - 1) && !empty(x, y + 1) && !empty(x, y + 2))) d[y * w + x] = C.rim;
      else if (empty(x - sx, y) && !empty(x + sx, y) && !empty(x + 2 * sx, y) && y % 3) d[y * w + x] = C.trunkM;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (src[y * w + x] && d[y * w + x] === C.trunk && (x * 7 + y * 3) % 23 === 0 && !empty(x - 3, y) && !empty(x + 3, y)) for (let k = 0; k < 6 && y + k < h; k++) if (d[(y + k) * w + x] === C.trunk) d[(y + k) * w + x] = C.K;
  }

  tree(b, x, y, h, col, r, th, depth, bias) {
    const br = (x0, y0, ang, len, w, d) => {
      let px = x0, py = y0;
      for (let i = 1; i <= len; i++) { px += Math.sin(ang); py -= Math.cos(ang); b.disc(px, py, Math.max(0, (w * (1 - (i / len) * 0.35) - 1) / 2), col); }
      if (d <= 0 || w < 1.1) return;
      for (let i = 0; i < 2 + (r() < 0.4 ? 1 : 0); i++) br(px, py, ang + (r() - 0.5) * 1.2 + (i - 0.5) * 0.8 + bias * 0.2, len * (0.55 + r() * 0.2), w * 0.6, d - 1);
    };
    br(x, y, (r() - 0.5) * 0.15, h * 0.4, th, depth);
  }

  // foreground like the reference: big tombstone, broken shard, cross, slab on the right edge, dark grass, crosses bottom-left
  buildFg() {
    const { W, H } = this, L = new Buf(W, H), R = new Buf(W, H), r = rng(555);
    const stone = (cx, base, w, h, round) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (round && j < w / 2 && Math.hypot(i - w / 2 + 0.5, j - w / 2) > w / 2) continue;
        R.set(cx - (w >> 1) + i, base - h + j, C.stone);
      }
    };
    stone(Math.round(W * 0.81), Math.round(H * 0.87), 28, 40, true);
    stone(Math.round(W * 0.68), Math.round(H * 0.94), 18, 12, true);
    stone(Math.round(W * 0.745), Math.round(H * 0.93), 7, 9, false);
    stone(Math.round(W * 0.065), Math.round(H * 0.86), 22, 26, true);
    // broken shard
    for (let j = 0; j < 30; j++) { const w = Math.max(1, Math.round(j * 0.33)); R.rect(Math.round(W * 0.705) - (w >> 1) + Math.round(j * 0.1), Math.round(H * 0.9) - 30 + j, w, 1, C.stone); }
    // cross on the right, small purple crosses on the left
    const crx = Math.round(W * 0.925), cry = Math.round(H * 0.56);
    R.rect(crx - 2, cry, 5, 24, C.stoneP); R.rect(crx - 9, cry + 5, 19, 5, C.stoneP);
    for (const [fx, fy] of [[0.03, 0.56], [0.27, 0.66]]) { const x = Math.round(W * fx), y = Math.round(H * fy); R.rect(x - 1, y, 3, 10, C.stoneP); R.rect(x - 4, y + 3, 9, 3, C.stoneP); }
    // tall slab on the right edge
    for (let j = 0; j < H * 0.42; j++) R.rect(Math.round(W * 0.945) + Math.max(0, 6 - j), Math.round(H * 0.58) + j, W, 1, C.stoneD);
    this.rimLight(R);
    for (let i = 0; i < R.d.length; i++) if (R.d[i] === C.trunkM) R.d[i] = C.stoneD; else if (R.d[i] === C.K) R.d[i] = C.stoneDD;
    // carved rune on the big stone
    const gx = Math.round(W * 0.81), gy = Math.round(H * 0.87) - 30;
    const carve = (a, b2, c, d) => R.line(gx + a, gy + b2, gx + c, gy + d, C.stoneD);
    carve(0, 0, 0, 18); carve(-6, 4, 6, 4); carve(-6, 4, 0, 12); carve(6, 4, 0, 12); carve(-5, 14, 5, 22); carve(5, 14, -5, 22);
    R.outline(C.K);
    L.blit(R, 0, 0);
    // dark grass along the bottom: thick at the corners, low in the middle, teal tips
    for (let x = 0; x < W; x++) {
      const e = Math.min(x / W, 1 - x / W), base = 3 + Math.max(0, 0.22 - e) * 50 + 2 * Math.sin(x * 0.37) + 2 * Math.sin(x * 0.13);
      for (let y = H - Math.round(base); y < H; y++) L.set(x, y, C.fg);
    }
    for (let i = 0; i < W * 0.7; i++) {
      const x = Math.floor(r() * W), e = Math.min(x / W, 1 - x / W), h = 5 + r() * (e < 0.2 ? 30 : 10), lean = (r() - 0.5) * 10;
      L.line(x, H, x + lean, H - h, C.fg, r() < 0.35 ? 3 : 2);
      if (r() < 0.35) L.line(x + lean * 0.7, H - h * 0.7, x + lean, H - h, C.fgL);
    }
    // a stray bone lying in the grass
    L.line(W * 0.6, H - 3, W * 0.66, H - 9, C.K, 5); L.line(W * 0.6, H - 3, W * 0.66, H - 9, C.stoneL, 3);
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

  onBeat(t, idx, idle) {
    const r = this.r;
    for (const d of this.dancers) {
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
      this.parts.push({ k: "ring", t0: t, life: 0.35 });
      if (idx % 8 === 0) this.parts.push({ k: "skull", x: this.cx + (r() - 0.5) * 12, y: this.rimY - 6, t0: t, life: 2.2 });
    }
  }

  // ---------- frame ----------
  draw(t, ears) {
    const { W, H, buf } = this;
    const tq = Math.floor(t * 12) / 12; // on twos
    const dt = this.lastT ? Math.min(0.1, t - this.lastT) : 0;
    this.lastT = t;
    const se = this.scareT(t), sk = this.sc ? this.sc.kind : null;

    if (ears.active) {
      if (ears.beatIndex !== this.lastBeat) { this.lastBeat = ears.beatIndex; this.onBeat(t, ears.beatIndex, false); }
    } else if (t - this.idleT > 0.75) { this.idleT = t; this.onBeat(t, ++this.lastBeat, true); }

    buf.d.set(this.bg.d);
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < Math.round(H * 0.5) * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.5);
    this.drawSky(t, tq, ears);

    const boo = sk === "boo" && se > 0.15 && se < 2.45;
    if (!boo) this.drawReaper(t, tq, ears, se, sk, 1);
    const order = [...this.dancers].sort((a, b) => a.fy - b.fy);
    for (const d of order) if (d.fy < this.potY) this.drawDancer(d, t, tq, ears, se, sk);
    this.drawCauldron(t, tq, ears, dt);
    this.drawParts(t, dt, ears, "mid");
    for (const d of order) if (d.fy >= this.potY) this.drawDancer(d, t, tq, ears, se, sk);
    buf.blit(this.fgL, 0, 0);
    if (sk === "cat") this.drawCat(se);
    this.glow(ears, sk === "scream" ? 0.5 : 1);
    this.drawParts(t, dt, ears, "top");

    if (sk === "scream") {
      const a = clamp(se / 0.3) * clamp((3.6 - se) / 0.5) * 0.55;
      this.dim(a);
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
    const { buf, W } = this, m = this.moon;
    const tw = Math.floor(tq * 3);
    for (const s of this.stars) {
      if (Math.hypot(s.x - m.x, s.y - m.y) < m.r + 3) continue;
      const big = s.b > 0.6, on = (s.b * 13 + tw) % 5 > 0.6;
      buf.set(s.x, s.y, on || ears.high > 0.7 ? C.star : C.star2);
      if (big && on) { buf.set(s.x + 1, s.y, C.star2); buf.set(s.x - 1, s.y, C.star2); buf.set(s.x, s.y + 1, C.star2); buf.set(s.x, s.y - 1, C.star2); }
    }
    // the reference's cloud streaks: across the lower-left of the moon, to its right, and on the left; they drift slowly and wrap
    for (const [fx, fy, len, th, sp] of [[0.37, 0.2, 0.24, 9, 0.6], [0.62, 0.12, 0.26, 10, 0.45], [0.68, 0.24, 0.14, 5, 0.7], [0.08, 0.2, 0.16, 7, 0.5]]) {
      const L = Math.round(W * len), x0 = Math.round(((W * fx + t * sp) % (W + L)) - L / 2), y0 = Math.round(this.H * fy);
      for (let i = 0; i < L; i++) {
        const u = i / L, h = Math.max(1, Math.round(th * Math.pow(Math.sin(u * Math.PI), 0.6) * (0.7 + 0.3 * Math.sin(Math.floor(i / 4) * 1.7))));
        const x = x0 + i, top = y0 - Math.round(h * 0.6 + Math.sin(Math.floor(i / 5) * 2.1) * 1.5);
        for (let y = top; y < top + h; y++) buf.set(x, y, y - top < 2 ? C.cloudL : y >= top + h - 2 ? C.cloudD : C.cloud);
      }
    }
  }

  /** red eyes in the dark during the scream */
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

  glow(ears, k) {
    const { buf, W, H, cx, potY, rimY } = this;
    const sw = (0.65 + ears.level * 0.3 + ears.pulse * 0.25) * k, sg = (0.45 + ears.mid * 0.3 + ears.pulse * 0.4) * k;
    const rw = 40 + ears.bass * 8, rg = 44 + ears.pulse * 10;
    for (let y = Math.max(0, rimY - rg); y < H; y++) for (let x = Math.max(0, cx - rg - 10); x < Math.min(W, cx + rg + 10); x++) {
      const i = y * W + x, c = buf.d[i];
      if (c === C.K) continue;
      const th = bayer(x, y);
      const dw = Math.hypot(x - cx, (y - potY) * 1.6) / rw, dg = Math.hypot(x - cx, (y - rimY) * 1.2) / rg;
      const lw = Math.max(0, (1 - dw) * sw) * 3, lg = Math.max(0, (1 - dg) * sg) * 3;
      const nw = Math.min(3, Math.floor(lw) + (lw % 1 > th ? 1 : 0)), ng = Math.min(3, Math.floor(lg) + (lg % 1 > th ? 1 : 0));
      let o = c;
      if (nw) o = mix(o, C.warm, 0.08 * nw);
      if (ng) o = mix(o, C.green, 0.06 * ng);
      buf.d[i] = o;
    }
  }

  // ---------- cauldron ----------
  drawCauldron(t, tq, ears, dt) {
    const { buf, cx, potY: fy, rimY } = this;
    const T = tq;
    const flames = (half, base, amp, k, y0) => {
      for (let x = -half; x <= half; x++) {
        const h = Math.max(0, (base + ears.bass * amp + ears.pulse * amp * 0.5) * (1 - (x / (half + 1)) ** 2) * (0.6 + 0.4 * Math.sin(x * 1.7 + T * 9 + k) * Math.sin(x * 0.9 - T * 5.3 + k)));
        for (let j = 0; j < h; j++) { const f = j / h; buf.set(cx + x, y0 - j, C.fire[f < 0.3 ? 0 : f < 0.55 ? 1 : f < 0.8 ? 2 : 3]); }
      }
    };
    const L = this.potL, ox = 25, oy = 38;
    L.clear();
    for (const lx of [-11, 9]) L.rect(ox + lx, oy - 10, 3, 6, C.potD);
    const by = oy - 19, rx = 15, ry = 12;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = y / ry;
      if (nx * nx + ny * ny > 1.02) continue;
      const l = -0.65 * nx - 0.4 * ny;
      let c = l > 0.5 ? C.potL : l > 0.1 ? C.potM : l > -0.45 ? C.pot : C.potD;
      if (ny > 0.6) c = mix(c, C.fire[2], 0.3);
      L.set(ox + x, by + y, c);
    }
    const ry0 = oy - 29;
    L.ellipse(ox, ry0, 17, 4, C.potM);
    for (let x = -17; x <= 0; x++) L.set(ox + x, ry0 + (x < -13 ? 1 : 3), C.potRim);
    L.ellipse(ox, ry0, 14, 2.5, C.brewM);
    L.ellipse(ox - 1, ry0 + 1, 11, 1.5, C.brew);
    // brew boiling over the rim on the left
    L.rect(ox - 15, ry0 + 1, 3, 3, C.brewM); L.rect(ox - 14, ry0 + 4, 2, 2, C.brewM);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 4; i++) L.set(ox - 10 + ((i * 7 + sp * 3) % 20), ry0 + (i % 2), C.brewL);
    L.outline(C.K);
    flames(16, 10, 6, 0, fy - 5); // behind the pot
    buf.blit(L, cx - ox, fy - oy);
    // flames in front of the pot bottom, then crossed logs
    flames(10, 7, 5, 2, fy - 3);
    for (const s of [-1, 1]) {
      buf.line(cx - 18 * s, fy + 2, cx + 14 * s, fy - 3, C.K, 6); buf.line(cx - 18 * s, fy + 2, cx + 14 * s, fy - 3, s < 0 ? C.log : C.logD, 4); buf.line(cx - 18 * s, fy + 1, cx + 14 * s, fy - 4, C.logL, 1);
    }
    if (Math.random() < 0.25 + ears.bass * 0.5) this.parts.push({ k: "ember", x: cx + (Math.random() - 0.5) * 24, y: fy - 8, vx: (Math.random() - 0.5) * 10, vy: -16 - Math.random() * 18, t0: t, life: 0.6 + Math.random() * 0.5 });
    if (Math.random() < 0.1 + ears.bass * 0.4) this.parts.push({ k: "bubble", x: cx + (Math.random() - 0.5) * 22, y: rimY + (Math.random() - 0.5) * 2, t0: t, life: 0.4 + Math.random() * 0.4 });

    // the ladle, stirred by magic
    this.ladleA = (this.ladleA || 0) + dt * (1.6 + ears.mid * 2.5 + ears.pulse * 2);
    const a = Math.floor(this.ladleA * 8) / 8, px = cx + Math.cos(a) * 8, py = rimY + Math.sin(a) * 1.2;
    const qx = cx + 3 + Math.cos(a) * 4, qy = rimY - 20 + Math.sin(a) * 1.2;
    this.ladleTop = { x: qx, y: qy };
    buf.line(px, py, qx, qy, C.K, 4); buf.line(px, py, qx, qy, C.woodD, 2); buf.line(px - 1, py, qx - 1, qy, C.woodL, 1);
    for (let x = -3; x <= 3; x++) if (Math.abs(x) > 1) buf.set(px + x, py + 1, C.brewL);

    // thick smoke ribbons: green one curls left, purple one rises right; small rings float above
    const rib = (c, cl, off, dir, ph) => {
      const len = 24 + ears.level * 8;
      const pt = (s) => { const f = s / len; return [cx + off + dir * Math.sin(f * 4.2 - tq * 3 + ph) * (2 + f * 6) + 1, rimY - 2 - s, 2.6 - f * 1.5]; };
      for (let s = 0; s < len; s++) { const [x, y, rad] = pt(s); buf.disc(x, y, rad + 1, C.K); }
      for (let s = 0; s < len; s++) { const [x, y, rad] = pt(s); buf.disc(x, y, rad, c); if (rad > 1.1) buf.set(x - 1, y, cl); }
    };
    rib(C.smokeG, C.smokeGL, -3, -1, 0);
    rib(C.smokeP, C.smokePL, 5, 1, 1.7);
    const ringY = rimY - 34 - ((tq * 8) % 8);
    for (const [dx, c] of [[-7, C.smokeG], [9, C.smokeP]]) {
      const X = cx + dx, Y = Math.round(ringY + (dx > 0 ? 6 : 0));
      for (const [i, j] of [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-2, 1], [2, 1], [-1, 2], [0, 2], [1, 2]]) buf.set(X + i, Y + j, c);
    }
  }

  // ---------- reaper ----------
  reaperPose(t, tq, ears, se, sk) {
    const g = { face: "idle", rise: 0, shake: 0, blink: false, hemPh: tq * 5, sway: Math.sin(tq * 1.7), look: 0 };
    const sL = { x: -6, y: 10 };
    // conducting with the free hand (relative to its shoulder): down, in, out, up — the reference pose is "up and out"
    const pts = [[-7, 8], [1, 3], [-13, 0], [-9, -9]];
    let hand;
    if (this.refPoses) hand = pts[3];
    else if (ears.active) {
      const k = this.lastBeat % 4, ph = Math.floor(ears.phase * 6) / 6, e = ph < 0.5 ? 2 * ph * ph : 1 - Math.pow(-2 * ph + 2, 2) / 2;
      const p0 = pts[(k + 3) % 4], p1 = pts[k], p2 = pts[(k + 1) % 4];
      hand = ph < 0.15 ? [lerp(p0[0], p1[0], 0.85 + ph), lerp(p0[1], p1[1], 0.85 + ph) + 1] : [lerp(p1[0], p2[0], e), lerp(p1[1], p2[1], e)];
    } else hand = [-9 + 3 * Math.sin(tq * 1.3), -3 + 4 * Math.cos(tq * 1.3)];
    g.hand = { x: sL.x + hand[0], y: sL.y + hand[1] };
    g.blink = !this.refPoses && t % 4.3 < 0.13;
    if (sk === "laugh" && se > 0.1 && se < 2.9) {
      g.face = "laugh"; g.shake = Math.floor(tq * 12) % 2 ? 1 : -1; g.rise = Math.min(3, se * 12); g.hand = { x: sL.x - 3, y: sL.y + 5 };
    } else if (sk === "boo" && se < 2.45) {
      g.face = se < 0.15 ? "idle" : "boo"; g.rise = se < 0.15 ? se * 20 : 0; g.hand = { x: sL.x - 9, y: sL.y - 13 };
      g.shake = se > 0.35 && Math.floor(tq * 12) % 2 ? 1 : 0;
    } else if (sk === "scream" && se > 0.25 && se < 3.4) {
      g.face = "scared"; g.look = this.sc.side; g.hand = { x: sL.x + 2, y: sL.y - 3 };
    } else if (sk === "cat" && se > 0.5 && se < 1.8) {
      g.face = "scared"; g.rise = 4; g.hand = { x: sL.x - 4, y: sL.y - 10 };
    }
    return g;
  }

  drawReaper(t, tq, ears, se, sk, scale) {
    const g = this.reaperPose(t, tq, ears, se, sk);
    const L = this.condL, ox = 34, oy = 24;
    L.clear();
    // scythe: tall shaft on its left side (our right), white blade curving right at the top
    const shx = ox + 13, top = oy - 9, bot = oy + 34;
    L.line(shx, top, shx - 1, bot, C.K, 4); L.line(shx, top, shx - 1, bot, C.wood, 2); L.line(shx, top + 1, shx - 1, bot, C.woodL, 1);
    const bc = { x: shx + 1, y: top + 12 }, R = 12;
    const arc = (fn) => { for (let a = -100; a <= -18; a += 2) { const f = (a + 100) / 82, w = 4 - f * 3, x = bc.x + Math.cos(a * D) * R, y = bc.y + Math.sin(a * D) * R; fn(x, y, w, a); } };
    arc((x, y, w) => L.disc(x, y, w / 2 + 1, C.K));
    arc((x, y, w, a) => { L.disc(x, y, Math.max(0, w / 2), C.blade); L.set(bc.x + Math.cos(a * D) * (R - w / 2), bc.y + Math.sin(a * D) * (R - w / 2), C.bladeM); });
    // robe: widening, ragged hem of three points
    for (let y = 6; y <= 32; y++) {
      const hw = 7 + (y - 6) * 0.2, xo = g.sway * Math.pow((y - 6) / 26, 2) * 2;
      for (let x = Math.floor(-hw + xo); x <= Math.ceil(hw + xo); x++) {
        const hem = 28 + 3 * Math.abs(Math.sin((x - xo) * 0.45 + g.hemPh * 0.3));
        if (y > hem) continue;
        const nx = (x - xo) / hw;
        let c = nx > 0.45 ? C.robeM : C.robe;
        if (nx > 0.8) c = C.robeD;
        if (Math.abs(x - xo + 2 + Math.sin(y * 0.3)) < 0.6 && y > 15) c = C.robeD;
        if (y > hem - 2) c = C.robeM;
        L.set(ox + x, oy + y, c);
      }
    }
    // hood with its tip falling to the right
    for (let y = -11; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      const inHead = (x * x) / 72 + ((y + 0.5) * (y + 0.5)) / 82 <= 1;
      const tip = y < -4 && x > 1 && y > -11 + (x - 1) * 0.2 && x < 9 - (y + 11) * 0.3;
      if (!inHead && !tip) continue;
      L.set(ox + x, oy + y, x / 9 > 0.5 ? C.robeM : x / 9 < -0.75 ? C.robeL : C.robe);
    }
    L.ellipse(ox - 1, oy + 1, 5, 5.5, C.hood);
    const ex = ox - 1 + g.look, ey = oy + 1;
    if (g.face === "laugh") for (const bx of [-3, 1]) { L.set(ex + bx, ey + 1, C.eye); L.set(ex + bx + 1, ey, C.eyeL); }
    else if (g.face === "boo") { L.rect(ex - 4, ey - 1, 2, 3, C.redEye); L.rect(ex + 1, ey - 1, 2, 3, C.redEye); }
    else if (g.face === "scared") { L.set(ex - 3, ey, C.eyeL); L.set(ex + 2, ey, C.eyeL); }
    else if (g.blink) { L.rect(ex - 4, ey + 1, 2, 1, C.eye); L.rect(ex + 1, ey + 1, 2, 1, C.eye); }
    else { L.rect(ex - 4, ey - 1, 2, 2, C.eye); L.rect(ex + 1, ey - 1, 2, 2, C.eye); L.set(ex - 4, ey - 1, C.eyeL); L.set(ex + 1, ey - 1, C.eyeL); }
    // sleeves with dark gloves: right one grips the scythe, left one conducts
    const sleeve = (sx, sy, hx, hy) => {
      L.line(sx, sy, hx, hy, C.K, 6); L.line(sx, sy, hx, hy, C.robe, 4);
      L.disc(hx, hy, 2, C.K); L.disc(hx, hy, 1.4, C.glove);
    };
    sleeve(ox + 6, oy + 11, shx - 1, oy + 16);
    const hx = ox + g.hand.x, hy = oy + g.hand.y;
    sleeve(ox - 6, oy + 10, hx, hy);
    L.outline(C.K);

    const gx = this.cond.x + g.shake, gy = this.cond.y + (this.refPoses ? 0 : Math.round(Math.sin(tq * 1.3) * 1.5)) - Math.round(g.rise);
    this.castHand = { x: gx - ox + hx, y: gy - oy + hy, cast: g.face === "idle" };
    this.condMouth = { x: gx, y: gy + 3 };
    if (scale === 1) {
      // dashed shadow on the hill, like the reference
      const sy = this.condShadow;
      for (let x = -11; x <= 11; x++) if (x % 6 !== 4) { this.buf.set(gx + x, sy, C.K); if (Math.abs(x) < 7) this.buf.set(gx + x, sy + 1, C.K); }
      for (let x = -6; x <= 4; x += 5) this.buf.set(gx + x, sy - 4 - (x & 1), C.K);
      this.buf.blit(L, gx - ox, gy - oy);
    } else this.buf.blitScaled(L, scale, this.W / 2 + g.shake * scale, this.H * 0.42, ox, oy + 4);
  }

  // ---------- dancers ----------
  dancerPose(d, t, tq, ears, se, sk) {
    if (this.refPoses) return (d.shown = d.ref);
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
      if ((se > 0.7 && se < 1.6) || (cat !== undefined && Math.abs(cat - d.x) < 30)) p = SPECIAL.startle;
    }
    d.shown = p;
    return p;
  }

  drawDancer(d, t, tq, ears, se, sk) {
    const p = this.dancerPose(d, t, tq, ears, se, sk);
    const L = this.dl, ox = 48, oy = 94;
    L.clear();
    if (p.pile) this.pile(L, ox, oy, d);
    else this.skeleton(L, ox, oy, p, d, ears);
    L.outline(C.K);
    // ground shadow (stays on the ground when it jumps)
    for (let x = -10; x <= 10; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 10 - y * 4) { const X = d.x + x, Y = d.fy + 1 + y; this.buf.set(X, Y, mix(this.buf.get(X, Y), C.black, 0.45)); }
    this.buf.blit(L, d.x - ox, d.fy - oy);
  }

  skeleton(L, fx, fy, p, d, ears) {
    const g = d.gear, hand = d.flip ? -1 : 1; // weapon hand
    const hipY = fy - 25 + p.dy, hx = fx + p.lean * 0.5, cxx = fx + p.lean;
    const limb = (x0, y0, side, a, f, l1, l2) => {
      const a1 = a * D, a2 = (a + f) * D;
      const x1 = x0 + side * Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + side * Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      return [x1, y1, x2, y2];
    };
    const bone = (x0, y0, x1, y1, c) => { L.line(x0, y0, x1, y1, C.K, 4); L.line(x0, y0, x1, y1, c, 2); };
    const shY = hipY - 16;
    if (g.shield) { // round shield slung on the back
      const sx = cxx + hand * 8, sy = shY + 8;
      L.ellipse(sx, sy, 8, 9, C.K); L.ellipse(sx, sy, 7, 8, C.shield); L.ellipse(sx - 2, sy - 2, 3, 3, C.woodL); L.line(sx - 6, sy + 3, sx + 6, sy - 3, C.shieldD);
    }
    for (const [side, u, k] of [[-1, p.uL, p.kL], [1, p.uR, p.kR]]) {
      const x0 = hx + side * 3, [x1, y1, x2, y2] = limb(x0, hipY + 1, side, u, k, 12, 12);
      bone(x0, hipY + 1, x1, y1, C.bone); bone(x1, y1, x2, y2, C.bone);
      L.disc(x1, y1, 1.5, C.bone);
      L.line(x2, y2, x2 + side * 3, y2, C.K, 4); L.line(x2, y2, x2 + side * 3, y2, C.bone, 2);
    }
    L.blit(PELVIS, hx - 5, hipY - 1);
    for (let y = hipY - 2; y > hipY - 8; y--) { const x = Math.round(lerp(hx, cxx, (hipY - y) / 8)); L.rect(x - 1, y, 2, 1, C.bone); }
    L.blit(RIBS, cxx - 6, hipY - 17);
    let weaponHand = null, forearm = null;
    const arms = () => {
      for (const [side, a, f] of [[-1, p.aL, p.fL], [1, p.aR, p.fR]]) {
        const x0 = cxx + side * 6, y0 = shY, [x1, y1, x2, y2] = limb(x0, y0, side, a, f, 10, 9);
        bone(x0, y0, x1, y1, C.bone); bone(x1, y1, x2, y2, C.bone);
        L.disc(x1, y1, 1.5, C.bone);
        L.disc(x2, y2, 2.6, C.K); L.disc(x2, y2, 1.8, C.bone); // big mitten hands
        if (side === hand) { weaponHand = [x2, y2]; forearm = [x2 - x1, y2 - y1]; }
        if (g.paul === "L" && side === -1) L.blit(PAUL, x0 - 4, y0 - 3);
      }
    };
    const over = p.aL > 140 && p.fL > 60;
    if (!over) arms();
    const sx = Math.round(cxx + p.tilt - 7 + p.sx), sy = Math.round(hipY - 31 + p.sy);
    L.blit(SKULL, sx, sy);
    const lk = Math.round(clamp(p.look, -1, 1));
    for (const ex of [3, 9]) { L.rect(sx + ex + lk, sy + 5, 3, 3, C.ink); L.set(sx + ex + 1 + lk, sy + 8, C.ink); }
    if (ears.pulse > 0.6 && !this.refPoses) { L.set(sx + 4 + lk, sy + 6, C.eye); L.set(sx + 10 + lk, sy + 6, C.eye); }
    L.rect(sx + 7, sy + 9, 1, 2, C.ink);
    L.blit(JAW, sx + 2, sy + 12 + Math.round(p.jaw * 2));
    if (g.helm === "cap") L.blit(HELM, sx - 1, sy - 3);
    if (g.helm === "visor") L.blit(VISOR, sx - 1, sy - 3);
    if (over) arms();
    if (weaponHand && g.weapon) this.weapon(L, g.weapon, weaponHand, forearm, hand, p.pole);
  }

  weapon(L, kind, [hx, hy], [fx, fy], side, pole) {
    const n = Math.hypot(fx, fy) || 1, dx = fx / n, dy = fy / n;
    if (kind === "sword") {
      // the blade continues the forearm, tilted back over the head
      const a = Math.atan2(dy, dx) - 0.55 * side, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
      L.line(hx - ux * 3, hy - uy * 3, hx + ux, hy + uy, C.K, 4); L.line(hx - ux * 3, hy - uy * 3, hx + ux, hy + uy, C.woodD, 2);
      L.line(hx + ux * 2 - px * 4, hy + uy * 2 - py * 4, hx + ux * 2 + px * 4, hy + uy * 2 + py * 4, C.K, 4);
      L.line(hx + ux * 2 - px * 4, hy + uy * 2 - py * 4, hx + ux * 2 + px * 4, hy + uy * 2 + py * 4, C.gold, 2);
      const tx = hx + ux * 22, ty = hy + uy * 22;
      L.line(hx + ux * 3, hy + uy * 3, tx, ty, C.K, 6); L.line(hx + ux * 3, hy + uy * 3, tx, ty, C.bladeM, 4);
      L.line(hx + ux * 3 + px * 0.6, hy + uy * 3 + py * 0.6, tx, ty, C.blade, 2);
      L.line(hx + ux * 4, hy + uy * 4, tx - ux * 2, ty - uy * 2, C.bladeL, 1);
    } else {
      const a = (pole || 0) * D, ux = Math.sin(a), uy = -Math.cos(a);
      const bx = hx - ux * 12, byy = hy - uy * 12, tx = hx + ux * 26, ty = hy + uy * 26;
      L.line(bx, byy, tx, ty, C.K, 4); L.line(bx, byy, tx, ty, C.wood, 2);
      const px = -uy, py = ux;
      for (let k = 0; k <= 9; k++) { const w = k < 3 ? k * 0.9 : (9 - k) * 0.4; L.line(tx + ux * k - px * w, ty + uy * k - py * w, tx + ux * k + px * w, ty + uy * k + py * w, k < 5 ? C.iron : C.ironL); }
      L.line(tx + ux * 2 + px * 1.5, ty + uy * 2 + py * 1.5, tx + ux * 8, ty + uy * 8, C.ironL);
      // blood dripping from the head
      L.rect(Math.round(tx - ux), Math.round(ty - uy), 2, 2, C.blood); L.rect(Math.round(tx - ux), Math.round(ty - uy) + 2, 1, 3, C.blood);
    }
  }

  pile(L, fx, fy, d) {
    const s = d.flip ? -1 : 1;
    const bone = (x0, y0, x1, y1) => { L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.K, 4); L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.bone, 2); };
    bone(-18, -3, -6, -2); bone(-4, -6, 6, -3); bone(9, -2, 19, -4); bone(-12, -7, -2, -9); bone(14, -9, 21, -3);
    L.blit(RIBS, fx - 6 - 3 * s, fy - 12);
    L.blit(PELVIS, fx + 4 * s - 5, fy - 6);
    L.blit(SKULL, fx + 9 * s - 7, fy - 14);
    for (const ex of [3, 9]) L.rect(fx + 9 * s - 7 + ex, fy - 9, 3, 3, C.ink);
    L.blit(JAW, fx - 16 * s - 5, fy - 4);
    if (d.gear.helm) L.blit(HELM, fx - 20 * s - 8, fy - 9);
  }

  // ---------- cat ----------
  drawCat(se) {
    const { W, H } = this, s = this.sc.side, from = s < 0 ? -24 : W + 4, mid = this.cx + 40 * -s;
    let x, spr;
    const flip = s > 0;
    if (se < 0.7) { x = lerp(from, mid, se / 0.7); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    else if (se < 1.6) { x = mid; spr = CAT_ARCH; if (Math.floor(se * 16) % 2) x += 1; }
    else { x = lerp(mid, s < 0 ? W + 24 : -30, (se - 1.6) / 0.8); spr = CAT_RUN[Math.floor(se * 14) % 2]; }
    this.catX = se < 2.5 ? x : undefined;
    const L = new Buf(spr.w + 2, spr.h + 2);
    L.blit(spr, 1, 1, flip);
    L.outline(C.K);
    this.buf.blitScaled(L, 2, x, H - 1, L.w / 2, L.h);
  }

  // ---------- particles ----------
  drawParts(t, dt, ears, layer) {
    const { buf } = this;
    if (layer === "mid") {
      // a spray of cyan/purple streaks from the reaper's hand toward the cauldron
      const gh = this.castHand, lt = this.ladleTop;
      if (gh && lt && gh.cast) {
        const n = (4 + ears.mid * 6 + ears.pulse * 6) * dt * 6;
        for (let i = 0; i < n; i++) if (Math.random() < n / Math.ceil(n)) this.parts.push({ k: "spell", t0: t, life: 0.6 + Math.random() * 0.3, j: Math.random() * 6, a: { ...gh }, b: { ...lt } });
      }
    }
    const keep = [];
    const at = (q, u) => {
      const dx = q.b.x - q.a.x, dy = q.b.y - q.a.y, n = Math.hypot(dx, dy) || 1, sp = (q.j / 6 - 0.5) * 1.5 + 0.55;
      const ux = (dx / n) * Math.cos(sp) - (dy / n) * Math.sin(sp), uy = (dx / n) * Math.sin(sp) + (dy / n) * Math.cos(sp), d = Math.sqrt(u) * (34 + q.j * 3);
      return [q.a.x + ux * d, q.a.y + uy * d + u * u * 6];
    };
    for (const q of this.parts) {
      const age = (t - q.t0) / q.life;
      if (age >= 1) continue;
      keep.push(q);
      const top = q.k === "spell" || q.k === "ha" || q.k === "ring" || q.k === "skull";
      if (top !== (layer === "top")) continue;
      if (q.k === "ember") buf.set(q.x + q.vx * age * q.life, q.y + q.vy * age * q.life, age < 0.5 ? C.fire[1] : C.fire[3]);
      else if (q.k === "bubble") {
        if (age < 0.7) { buf.set(q.x, q.y, C.brewL); buf.set(q.x + 1, q.y, C.brewL); }
        else { buf.set(q.x - 1, q.y, C.brewL); buf.set(q.x + 2, q.y, C.brewL); buf.set(q.x, q.y - 1, C.brewL); }
      } else if (q.k === "spell") {
        // short streaks along the path
        const [x, y] = at(q, age), [x0, y0] = at(q, Math.max(0, age - 0.2));
        buf.line(x0, y0, x, y, q.j > 4.5 ? C.magicL : q.j > 2.6 ? C.magic : q.j > 1.2 ? C.magicP : C.magicPL);
      } else if (q.k === "ring") {
        const rx = 16 + age * 18, ry = 3 + age * 4;
        for (let i = 0; i < 36; i++) {
          if ((i + Math.floor(age * 8)) % 3 === 0) continue;
          const a = (i / 36) * Math.PI * 2;
          buf.set(this.cx + Math.cos(a) * rx, this.rimY + Math.sin(a) * ry, age < 0.5 ? C.brewL : C.brewM);
        }
      } else if (q.k === "skull") {
        const y = q.y - age * 30, a = (1 - age) * 0.8;
        for (let yy = 0; yy < SKULL.h; yy++) for (let xx = 0; xx < SKULL.w; xx++) {
          if (!SKULL.d[yy * SKULL.w + xx]) continue;
          const X = Math.round(q.x - 7 + xx + Math.sin(age * 5) * 2), Y = Math.round(y + yy);
          if (a > bayer(X, Y)) buf.set(X, Y, yy >= 5 && yy <= 7 && ((xx >= 3 && xx <= 5) || (xx >= 9 && xx <= 11)) ? C.smokeP : C.smokeGL);
        }
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
