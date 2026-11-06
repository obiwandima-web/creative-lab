// V2 scene (style: ref-style.jpg + visual ref/): moonlit graveyard clearing in blue/teal, a hooded reaper with a scythe conducts
// and casts magic into a cauldron, armoured skeletons dance. Old look: js/scene-v1.js (?v=1).
// Everything is drawn into one native-resolution buffer; poses are held and change on beats (sprite-style, ~12 fps).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";

const C = {
  K: pk(0x060816), ink: pk(0x05040c), white: pk(0xffffff),
  sky: [0x0c1030, 0x10163a, 0x151d46, 0x1b2654, 0x223062, 0x2a3b72].map(pk),
  halo: pk(0x34508e), halo2: pk(0x2c437e),
  star: pk(0xeaf6ff), star2: pk(0x7d8fd0),
  moon: pk(0xeef8f4), moonM: pk(0xcfe5e6), moonD: pk(0xa9c8d2), moonDD: pk(0x8aaec2),
  cloud: pk(0x1e2858), cloudL: pk(0x34437e), cloudD: pk(0x161d48),
  far1: pk(0x3a5590), far1D: pk(0x33498a), far2: pk(0x283a74), far2D: pk(0x212f66),
  win: pk(0xffd060),
  hill: pk(0x1d3f68), hillL: pk(0x2a6680), hillD: pk(0x183258),
  gr: [0x1e6a72, 0x1a5865, 0x164858, 0x113849, 0x0d2a3c].map(pk), grL: pk(0x2f9a92), grLL: pk(0x4cc2a8),
  grave: pk(0x5876a6), graveL: pk(0x7898c4), graveD: pk(0x31477a),
  trunk: pk(0x0f1638), trunkM: pk(0x1a2552), rim: pk(0x2a9ea4), rimL: pk(0x63d4ca), midTree: pk(0x1b2a5a),
  stone: pk(0x4a5a92), stoneL: pk(0x6a7cb2), stoneD: pk(0x2e3a6c), stoneDD: pk(0x222c58),
  fg: pk(0x060d20), fgM: pk(0x0b1a34), fgL: pk(0x173c58), pink: pk(0xe060c8), pinkL: pk(0xff9ae6),
  fog: pk(0x6a86b8),
  pot: pk(0x353e66), potM: pk(0x4e5a88), potL: pk(0x7e8ebc), potRim: pk(0xa4b2d8), potD: pk(0x222846),
  brew: pk(0x5cf05a), brewM: pk(0x2cbc48), brewD: pk(0x168034), brewL: pk(0xd0ffb8),
  smokeG: pk(0x46d464), smokeGL: pk(0x9cf6a0), smokeP: pk(0x9446d6), smokePL: pk(0xc888f8),
  fire: [0xfff6b0, 0xffc63c, 0xff7a1c, 0xd8361c, 0x8a1a20].map(pk),
  log: pk(0x6a3a20), logD: pk(0x3e200f), logL: pk(0x9a6034),
  robe: pk(0x5a2c92), robeM: pk(0x432074), robeD: pk(0x2c1450), robeL: pk(0x8a58c8), hood: pk(0x07050e),
  eye: pk(0x58eaff), eyeL: pk(0xd4fbff), redEye: pk(0xff3a3a),
  bone: pk(0xf0e6c8), boneM: pk(0xc4b48e), boneD: pk(0x8c7e60),
  iron: pk(0xb0b8d0), ironL: pk(0xe2e8f4), ironM: pk(0x737ea0), ironD: pk(0x48506e),
  wood: pk(0x8a5a30), woodD: pk(0x553418), woodL: pk(0xb07a44), gold: pk(0xd8a840), blood: pk(0xa0141e),
  blade: pk(0xd8e0ee), bladeL: pk(0xffffff), bladeM: pk(0x98a4bc),
  skullF: pk(0x46e070), skullFL: pk(0xaaffb0), skullFD: pk(0x1f9a52),
  magic: pk(0x58e0ff), magicL: pk(0xdaf8ff), magicP: pk(0xa064ff), magicPL: pk(0xd8b0ff),
  cat: pk(0x2a2c52), catL: pk(0x6a72a8), catEye: pk(0xffe23a),
  red: pk(0xff2a2a), redD: pk(0x9a1010), eyeY: pk(0xd8d050),
  warm: pk(0xff9a40), green: pk(0x50ff90), cyan: pk(0x60e0ff), flash: pk(0xb8d8ff), black: pk(0x020104),
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const D = Math.PI / 180;
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- sprites ----------
const BP = { w: C.bone, m: C.boneM, d: C.boneD };
const SKULL = sprite([
  "....wwwwwww....",
  "..wwwwwwwwwwm..",
  ".wwwwwwwwwwwwm.",
  "wwwwwwwwwwwwwmm",
  "wwwwwwwwwwwwwmm",
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
  "...wwwwwww...",
  ".wwwwwwwwwwm.",
  "ww....w....mm",
  ".wwwww.wwwwm.",
  "ww....w....mm",
  ".wwwww.wwwwm.",
  ".w....w....m.",
  "..wwwww.wwm..",
  "......w......",
  "......w......",
], BP);
const PELVIS = sprite([".wwwwwwwwm.", "wwww.w.wwmm", "ww..www..mm", ".w..w.w..m."], BP);
const IP = { I: C.ironL, i: C.iron, M: C.ironM, D: C.ironD, s: C.ironL };
const HELM = sprite([
  ".....IIIIiii.....",
  "...IIIiiiiiiMM...",
  "..IIiiiiiiiiiMM..",
  ".IIiiiiiiiiiiiMM.",
  ".IiiiiiiiiiiiiMM.",
  "MMMMMMMMMMMMMMMMD",
  ".DDDDDDDDDDDDDDD.",
], IP);
const SPIKE = sprite(["s", "i", "i"], IP);
const PAUL = sprite(["..III..", ".IIiiM.", "IIiiiMM", "DMMMMMD", ".D.D.D."], IP);
const SKULLBALL = sprite([".www.", "wwwww", "wkwkw", "wwwww", ".w.w."], { w: C.bone, k: C.ink });
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
const BATP = { b: pk(0x0c1028), r: C.red };
const BAT = [
  sprite(["b.....b", "bb.b.bb", ".bbrbb.", "...b..."], BATP),
  sprite(["...b...", ".bbrbb.", "bb.b.bb", "b.....b"], BATP),
];

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
  fall: P({ aL: 110, fL: 30, aR: 110, fR: 30, uL: 60, kL: -10, uR: 60, kR: -10, dy: 10, sx: 4, sy: 8, jaw: 1 }),
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
    this.sc = null;
    this.lastBeat = -1;
    this.idleT = 0;
    this.r = rng(1031);
    this.condL = new Buf(120, 120);
    this.potL = new Buf(70, 50);
    this.dl = new Buf(90, 96);
    this.resize(W, H);
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.buf = new Buf(W, H);
    this.cx = Math.round(W * 0.4); // cauldron
    this.potY = Math.round(H * 0.88); // cauldron feet
    this.rimY = this.potY - 32;
    this.cond = { x: Math.round(W * 0.82), y: Math.round(H * 0.4) }; // reaper hood centre
    this.groundY = Math.round(H * 0.8);
    const r = rng(77);
    this.dancers = [];
    const add = (fx, fy, gear, flip) => this.dancers.push({ x: Math.round(W * fx), fy: Math.round(H * fy), gear, flip, move: pick(r, DANCE), step: 0, prev: P({}), cur: P({}), tSw: -1, seed: r() });
    add(0.12, 0.9, { helm: "cap", weapon: "sword", paul: 1 }, false);
    add(0.25, 0.84, { helm: null, weapon: "spear", paul: 0 }, true);
    add(0.56, 0.84, { helm: "spike", weapon: null, shield: 1, paul: 2 }, false);
    add(0.67, 0.9, { helm: "cap", weapon: "halberd", paul: 1 }, true);
    this.dancers.sort((a, b) => a.fy - b.fy);
    this.stars = [];
    for (let i = 0; i < W * 0.3; i++) this.stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * H * 0.45), b: r() });
    this.flies = [];
    for (let i = 0; i < 16; i++) this.flies.push({ x: r() * W, y: H * (0.45 + r() * 0.45), ph: r() * 10, sp: 0.3 + r() * 0.5, pink: r() < 0.6 });
    this.eyes = [];
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, x = side < 0 ? 12 + r() * W * 0.22 : W - 12 - r() * W * 0.22;
      this.eyes.push({ x: Math.round(x), y: Math.round(H * (0.5 + r() * 0.2)), side, ph: r() * 10, red: i >= 4 });
    }
    this.moon = { x: Math.round(W * 0.5), y: Math.round(H * 0.25), r: Math.round(H * 0.19) };
    this.bg = this.buildBg();
    this.fgL = this.buildFg();
  }

  // ---------- static background ----------
  hillTop(k, x) {
    const H = this.H;
    if (k === 1) return Math.round(H * 0.5 + 3 * Math.sin(x * 0.021) + 2 * Math.sin(x * 0.057 + 1));
    if (k === 2) return Math.round(H * 0.57 + 4 * Math.sin(x * 0.017 + 2) + 2 * Math.sin(x * 0.061));
    return Math.round(H * 0.66 - (x / this.W) * H * 0.05 + 3 * Math.sin(x * 0.013 + 0.7) + 1.5 * Math.sin(x * 0.05));
  }

  buildBg() {
    const { W, H } = this, b = new Buf(W, H), r = rng(4242), m = this.moon;
    // sky + moon halo
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const f = (y / (H * 0.62)) * (C.sky.length - 1), i = Math.min(C.sky.length - 1, Math.floor(f));
      let c = f - i > bayer(x, y) ? C.sky[Math.min(i + 1, C.sky.length - 1)] : C.sky[i];
      const d = Math.hypot(x - m.x, (y - m.y) * 1.15) / m.r;
      if (d > 1 && d < 3.2) {
        const a = (3.2 - d) / 2.2;
        if (a * 1.2 > bayer(x, y) + 0.5) c = C.halo; else if (a > bayer(x, y)) c = mix(c, C.halo2, 0.6);
      }
      b.d[y * W + x] = c;
    }
    // moon with maria
    const mr = rng(9);
    const maria = Array.from({ length: 9 }, () => [(mr() - 0.5) * m.r * 1.4, (mr() - 0.5) * m.r * 1.4, 3 + mr() * m.r * 0.35]);
    for (let y = -m.r; y <= m.r; y++) for (let x = -m.r; x <= m.r; x++) {
      const d = Math.hypot(x, y);
      if (d > m.r + 0.3) continue;
      let c = C.moon;
      for (const [ax, ay, ar] of maria) { const e = 1 - Math.hypot(x - ax, y - ay) / ar; if (e > 0) c = e > 0.45 + bayer(x, y) * 0.3 ? C.moonD : e * 1.6 > bayer(x, y) ? C.moonM : c; }
      if ((x * 0.6 + y * 0.4) / m.r > 0.6 && bayer(x, y) < 0.6) c = c === C.moon ? C.moonM : C.moonD;
      if (d > m.r - 1.2) c = C.moonM;
      b.set(m.x + x, m.y + y, c);
    }
    for (const [cx, cy, cr] of [[-12, -9, 2], [8, 6, 3], [-4, 14, 2], [15, -12, 1], [-18, 6, 1]]) {
      b.disc(m.x + cx, m.y + cy, cr, C.moonDD);
      b.disc(m.x + cx - 1, m.y + cy - 1, Math.max(0, cr - 1), C.moonD);
    }
    // far hills (hazy), chapel, crosses
    for (let x = 0; x < W; x++) for (let y = this.hillTop(1, x); y < H; y++) b.set(x, y, (y - this.hillTop(1, x)) / 8 > bayer(x, y) * 2 + 0.6 ? C.far1D : C.far1);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * W), y = this.hillTop(1, x);
      if (r() < 0.5) this.tree(b, x, y + 1, 10 + r() * 12, C.far1D, r, 1.6, 3, 0);
      else { b.rect(x, y - 5, 1, 6, C.far1D); b.rect(x - 1, y - 4, 3, 1, C.far1D); }
    }
    for (let x = 0; x < W; x++) for (let y = this.hillTop(2, x); y < H; y++) b.set(x, y, (y - this.hillTop(2, x)) / 10 > bayer(x, y) * 2 + 0.5 ? C.far2D : C.far2);
    const chx = Math.round(W * 0.6), chy = this.hillTop(2, chx) + 1;
    b.rect(chx - 7, chy - 12, 14, 12, C.far2D); // chapel
    for (let i = 0; i < 8; i++) b.rect(chx - 8 + i, chy - 13 - i, 18 - i * 2, 1, C.far2D);
    b.rect(chx + 3, chy - 26, 4, 14, C.far2D); b.rect(chx + 4, chy - 31, 2, 5, C.far2D); b.rect(chx + 3, chy - 29, 4, 1, C.far2D);
    b.rect(chx - 3, chy - 8, 2, 3, C.win); b.rect(chx + 4, chy - 21, 2, 3, C.win);
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(r() * W), y = this.hillTop(2, x) + 1 + Math.floor(r() * 3);
      if (Math.abs(x - chx) < 12) continue;
      if (r() < 0.5) { b.rect(x, y - 7, 2, 8, C.far2D); b.rect(x - 2, y - 5, 6, 2, C.far2D); }
      else { b.rect(x - 2, y - 5, 5, 5, C.far2D); b.rect(x - 1, y - 6, 3, 1, C.far2D); }
    }
    for (let i = 0; i < 4; i++) this.tree(b, r() * W, this.hillTop(2, 0) + 4, 26 + r() * 20, C.far2D, r, 2.4, 4, 0);
    // haze between far layers
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const top = this.hillTop(2, x), d = (y - (top - 6)) / 10;
      if (d > 0 && d < 1 && Math.sin(d * Math.PI) * 0.45 > bayer(x, y)) b.d[y * W + x] = mix(b.d[y * W + x], C.fog, 0.25);
    }
    // near hill: the clearing, moonlit edge, graves
    for (let x = 0; x < W; x++) {
      const top = this.hillTop(3, x);
      for (let y = top; y < H; y++) {
        const t = (y - top) / (H - top), f = t * (C.gr.length - 1.2), i = Math.floor(f);
        let c = f - i > bayer(x, y) ? C.gr[Math.min(i + 1, C.gr.length - 1)] : C.gr[i];
        if (y - top < 1) c = C.grL;
        b.d[y * W + x] = c;
      }
    }
    // grass blades
    for (let i = 0; i < W * 1.6; i++) {
      const x = Math.floor(r() * W), top = this.hillTop(3, x), y = Math.floor(top + 2 + r() * (H - top - 2)), h = 1 + Math.floor(r() * 3);
      const lit = (y - top) / (H - top) < 0.45;
      b.line(x, y, x + (r() < 0.5 ? 0 : 1), y - h, lit ? C.grL : C.gr[1]);
    }
    for (let x = 0; x < W; x += 1 + Math.floor(r() * 3)) { const top = this.hillTop(3, x); b.line(x, top, x, top - 1 - Math.floor(r() * 2), C.grL); }
    // mid graves on the hill
    for (let i = 0; i < 11; i++) {
      const x = Math.floor(W * (0.04 + r() * 0.92));
      if (Math.abs(x - this.cx) < 20) continue;
      const y = this.hillTop(3, x) + 2 + Math.floor(r() * 4);
      this.grave(b, x, y, r);
    }
    // framing trees, rim lit by the moon
    // framing trees, rim lit by the moon; pick the seeds that keep the moon clear
    const T = new Buf(W, H), cover = (L) => { let n = 0; for (let y = m.y - m.r; y <= m.y + m.r; y++) for (let x = m.x - m.r; x <= m.x + m.r; x++) if (L.get(x, y) && Math.hypot(x - m.x, y - m.y) < m.r * 1.1) n++; for (let y = Math.round(H * 0.4); y < H; y++) for (let x = Math.round(W * 0.16); x < W * 0.84; x++) if (L.get(x, y)) n += 2; return n; };
    for (const [fx, th, h, bias] of [[0.05, 20, 1.2, 1], [0.97, 16, 1.1, -1]]) {
      let best = 1, bestN = 1e9;
      for (let s = 1; s <= 16; s++) { const P = new Buf(W, H); this.tree(P, Math.round(W * fx), H + 6, H * h, C.trunk, rng(s * 31 + bias), th, 4, bias, true); const n = cover(P); if (n < bestN) { bestN = n; best = s; } }
      this.tree(T, Math.round(W * fx), H + 6, H * h, C.trunk, rng(best * 31 + bias), th, 4, bias, true);
    }
    this.rimLight(T);
    T.outline(C.K);
    b.blit(T, 0, 0);
    return b;
  }

  grave(b, x, y, r) {
    const k = r();
    if (k < 0.4) { // cross
      b.rect(x - 1, y - 9, 3, 10, C.graveD); b.rect(x - 3, y - 7, 7, 3, C.graveD);
      b.rect(x - 1, y - 9, 1, 10, C.grave); b.rect(x - 3, y - 7, 3, 1, C.grave);
    } else { // stone
      const w = 5 + Math.floor(r() * 3), h = 6 + Math.floor(r() * 4), lean = r() < 0.3 ? 1 : 0;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (j === 0 && (i === 0 || i === w - 1)) continue;
        b.set(x + i - (w >> 1) + (j < h / 2 ? lean : 0), y - h + j, i < 2 ? C.graveL : i > w - 2 ? C.graveD : C.grave);
      }
    }
    b.line(x - 4, y + 1, x + 4, y + 1, C.gr[2]);
  }

  /** rim light from the moon on silhouettes in a layer */
  rimLight(L) {
    const { w, h, d } = L, src = d.slice(), m = this.moon;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const sx = Math.sign(m.x - x) || 1, sy = y > m.y ? -1 : 0;
      const empty = (dx, dy) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= w || Y >= h ? false : !src[Y * w + X]; };
      // thin twigs (empty on both sides) stay dark; only solid wood catches the light
      if ((empty(sx, 0) && !empty(-sx, 0) && !empty(-2 * sx, 0)) || (sy && empty(0, sy) && !empty(0, -sy) && !empty(0, -2 * sy))) d[y * w + x] = C.rim;
      else if ((empty(2 * sx, 0) || empty(3 * sx, 0)) && !empty(-sx, 0)) d[y * w + x] = C.trunkM;
    }
  }

  tree(b, x, y, h, col, r, th, depth, bias, gnarl = false) {
    const br = (x0, y0, ang, len, w, d) => {
      const n = Math.ceil(len), bend = (r() - 0.5) * (gnarl ? 0.5 : 0.2);
      let px = x0, py = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, a = ang + bend * Math.sin(t * Math.PI * 2);
        px += Math.sin(a); py -= Math.cos(a);
        b.disc(px, py, Math.max(0, (w * (1 - t * 0.35) - 1) / 2), col);
      }
      if (d <= 0 || w < 1.1) return;
      const k = gnarl ? 2 : 2 + (r() < 0.45 ? 1 : 0);
      for (let i = 0; i < k; i++) {
        const a = ang + (r() - 0.5) * 0.9 + (i - (k - 1) / 2) * (gnarl ? 0.95 : 0.75) + bias * (gnarl ? 0.45 : 0.3);
        br(px, py, gnarl ? clamp(a, -1.45, 1.45) : a, len * (gnarl ? 0.62 + r() * 0.15 : 0.55 + r() * 0.25), w * (gnarl ? 0.66 : 0.6), d - 1);
      }
    };
    if (gnarl) for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { // roots
      let px = x, py = y - 6 - i * 5;
      for (let j = 0; j < 12; j++) { px += s * 1; py += 0.5; b.disc(px, py, Math.max(0, (th * 0.4 - j * 0.25) / 2), col); }
    }
    br(x, y, bias * 0.25 + (r() - 0.5) * 0.12, h * 0.38, th, depth);
  }

  // foreground: dark plants along the bottom, big tombstones on the right
  buildFg() {
    const { W, H } = this, L = new Buf(W, H), r = rng(555);
    // tombstones
    const big = (x, y, w, h, cross) => {
      const S = new Buf(w + 2, h + 2);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const top = j < w / 2 && Math.hypot(i - w / 2 + 0.5, j - w / 2) > w / 2;
        if (top) continue;
        S.set(i + 1, j + 1, i < 2 ? C.stoneL : i > w - 4 ? C.stoneD : bayer(i, j) < 0.15 ? C.stoneD : C.stone);
      }
      if (cross) { S.rect(w / 2, 6, 2, 12, C.stoneDD); S.rect(w / 2 - 3, 9, 8, 2, C.stoneDD); }
      else for (let k = 0; k < 4; k++) S.rect(4, 10 + k * 4, w - 7, 1, C.stoneDD);
      S.line(w - 6, 3, w - 9, 12, C.stoneDD); S.line(w - 9, 12, w - 7, 16, C.stoneDD); // crack
      S.outline(C.K);
      L.blit(S, x - S.w / 2, y - S.h);
    };
    big(Math.round(W * 0.8), H - 6, 22, 32, true);
    big(Math.round(W * 0.93), H - 2, 16, 22, false);
    big(Math.round(W * 0.03), H - 4, 12, 16, false);
    // leaning stone cross
    L.line(W * 0.71, H - 2, W * 0.73, H - 26, C.K, 6); L.line(W * 0.71, H - 2, W * 0.73, H - 26, C.stoneD, 4);
    L.line(W * 0.69, H - 19, W * 0.765, H - 21, C.K, 6); L.line(W * 0.69, H - 19, W * 0.765, H - 21, C.stoneD, 4);
    L.line(W * 0.712, H - 4, W * 0.728, H - 25, C.stone, 1);
    // plant silhouettes: dense at the corners, low in the middle
    for (let x = 0; x < W; x++) {
      const e = Math.min(x, W - x) / W, base = 3 + Math.max(0, 0.18 - e) * 70 + 2 * Math.sin(x * 0.3);
      for (let y = H - Math.round(base); y < H; y++) L.set(x, y, y < H - base + 2 ? C.fgM : C.fg);
    }
    for (let i = 0; i < W * 0.5; i++) { // blades and fern leaves
      const x = Math.floor(r() * W), e = Math.min(x, W - x) / W, h = 4 + r() * (e < 0.15 ? 26 : 9), lean = (r() - 0.5) * 8;
      L.line(x, H, x + lean, H - h, C.fg, r() < 0.3 ? 2 : 1);
      if (e < 0.15 && r() < 0.5) for (let k = 2; k < h; k += 3) L.line(x + lean * k / h, H - k, x + lean * k / h + (k % 2 ? 3 : -3), H - k - 2, C.fg);
      if (r() < 0.15) L.set(x + lean, H - h, C.fgL);
    }
    for (let i = 0; i < 5; i++) { // a few glowing pink plants on the left
      const x = Math.round(W * (0.03 + r() * 0.16)), h = 6 + r() * 8;
      L.line(x, H - 3, x + 1, H - h, C.fgL);
      L.set(x + 1, H - h, C.pinkL); L.set(x + 2, H - h + 1, C.pink); L.set(x, H - h + 1, C.pink);
    }
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
      if (idx % 8 === 0) this.parts.push({ k: "skull", x: this.cx + (r() - 0.5) * 16, y: this.rimY - 6, t0: t, life: 2.2 });
    }
  }

  // ---------- frame ----------
  draw(t, ears) {
    const { W, H, buf, cx } = this;
    const tq = Math.floor(t * 12) / 12; // on twos
    const dt = this.lastT ? Math.min(0.1, t - this.lastT) : 0;
    this.lastT = t;
    const se = this.scareT(t), sk = this.sc ? this.sc.kind : null;

    if (ears.active) {
      if (ears.beatIndex !== this.lastBeat) { this.lastBeat = ears.beatIndex; this.onBeat(t, ears.beatIndex, false); }
    } else if (t - this.idleT > 0.75) { this.idleT = t; this.onBeat(t, ++this.lastBeat, true); }

    buf.d.set(this.bg.d);
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < Math.round(H * 0.55) * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.5);
    this.drawSky(t, tq, ears);
    this.drawEyes(t, tq, se, sk);

    const boo = sk === "boo" && se > 0.15 && se < 2.45;
    const back = this.dancers.filter((d) => d.fy < this.potY), front = this.dancers.filter((d) => d.fy >= this.potY);
    if (!boo) this.drawReaper(t, tq, ears, se, sk, 1);
    for (const d of back) this.drawDancer(d, t, tq, ears, se, sk);
    this.drawCauldron(t, tq, ears, dt);
    this.drawParts(t, dt, ears, "mid");
    for (const d of front) this.drawDancer(d, t, tq, ears, se, sk);
    this.fog(tq + 3, H - 30, H - 6, 0.35, 0.05);
    buf.blit(this.fgL, 0, 0);
    if (sk === "cat") this.drawCat(se);
    this.glow(ears, sk === "scream" ? 0.5 : 1);
    this.drawFlies(t, tq, ears);
    this.drawParts(t, dt, ears, "top");

    if (sk === "scream") {
      const a = clamp(se / 0.3) * clamp((3.6 - se) / 0.5) * 0.55;
      this.dim(a);
      this.drawEyes(t, tq, se, sk, true);
    }
    if (boo) {
      this.dim(0.6);
      this.drawReaper(t, tq, ears, se, sk, se < 0.25 ? 2 : se < 0.35 ? 3 : se < 2.15 ? 4 : se < 2.3 ? 3 : 2);
      if (se > 0.35 && se < 2.1) {
        const s = 4, w = textW("BOO!", s), sh = Math.floor(tq * 12) % 2;
        this.textOut("BOO!", Math.round(W / 2 - w / 2) + sh, H - 36, s, C.eye, 2);
      }
    }
    this.drawBats(t, dt);
  }

  // ---------- pieces ----------
  drawSky(t, tq, ears) {
    const { buf, W } = this, m = this.moon;
    const tw = Math.floor(tq * 4);
    for (const s of this.stars) {
      if ((s.b * 97 + tw) % 7 <= 0.9) continue;
      if (Math.hypot(s.x - m.x, s.y - m.y) < m.r * 1.6) continue;
      buf.set(s.x, s.y, s.b > 0.75 || (ears.high > 0.7 && s.b > 0.5) ? C.star : C.star2);
      if (s.b > 0.95) { buf.set(s.x + 1, s.y, C.star2); buf.set(s.x - 1, s.y, C.star2); buf.set(s.x, s.y + 1, C.star2); buf.set(s.x, s.y - 1, C.star2); }
    }
    // long cloud streaks drifting across the moon
    for (const [k, len, dy, sp] of [[0, 90, 0.45, 1.5], [1, 70, -0.25, 1], [2, 110, 0.9, 2]]) {
      const x0 = Math.round(((k * 151 + t * sp) % (W + len * 2)) - len), y0 = Math.round(m.y + m.r * dy);
      for (let i = 0; i < 5; i++) {
        const bx = x0 + i * len * 0.22, rx = len * (0.18 + 0.06 * Math.sin(i * 2.3 + k)), ry = 2 + (i % 3);
        const by = y0 + ((i * 3 + k) % 4) - 2;
        for (let y = -ry; y <= ry; y++) for (let x = -Math.ceil(rx); x <= rx; x++) {
          const e = 1 - (x * x) / (rx * rx) - (y * y) / (ry * ry);
          if (e > 0 && e * 2 > bayer(bx + x, by + y)) buf.set(bx + x, by + y, y < -ry * 0.4 ? C.cloudL : y > ry * 0.5 ? C.cloudD : C.cloud);
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
        if (p > 1.6 || (p > 0.7 && p < 0.8)) continue;
      }
      const c = e.red ? C.red : C.eyeY;
      buf.set(e.x, e.y, c); buf.set(e.x + 3, e.y, c);
      if (e.red) { buf.set(e.x + 1, e.y, C.redD); buf.set(e.x + 4, e.y, C.redD); }
    }
  }

  drawFlies(t, tq, ears) {
    for (const f of this.flies) {
      const x = f.x + Math.sin(tq * f.sp + f.ph) * 10, y = f.y + Math.sin(tq * f.sp * 1.7 + f.ph * 2) * 6;
      if ((tq * 2 + f.ph) % 3 < 0.5) continue;
      const c = f.pink ? (ears.high > 0.6 ? C.pinkL : C.pink) : C.magic;
      this.buf.set(x, y, c);
      if (ears.pulse > 0.6) { this.buf.set(x + 1, y, c); this.buf.set(x, y - 1, c); }
    }
  }

  fog(tq, y0, y1, dens, speed) {
    const { buf, W } = this;
    for (let y = Math.max(0, y0); y < Math.min(this.H, y1); y++) {
      const fy = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) {
        const n = 0.5 + 0.3 * Math.sin(x * 0.045 + tq * speed * 20 + y * 0.3) + 0.2 * Math.sin(x * 0.11 - tq * speed * 31);
        if (n * dens * Math.sin(fy * Math.PI) > bayer(x, y)) buf.d[y * W + x] = mix(buf.d[y * W + x], C.fog, 0.25);
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
    const rw = 58 + ears.bass * 10, rg = 64 + ears.pulse * 12;
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
      if (ng) o = mix(o, C.green, 0.07 * ng);
      buf.d[i] = o;
    }
  }

  // ---------- cauldron ----------
  drawCauldron(t, tq, ears, dt) {
    const { buf, cx, potY: fy, rimY } = this;
    buf.line(cx - 19, fy + 2, cx + 16, fy - 3, C.K, 6); buf.line(cx - 19, fy + 2, cx + 16, fy - 3, C.logD, 4); buf.line(cx - 19, fy + 1, cx + 16, fy - 4, C.log, 1);
    buf.line(cx + 19, fy + 2, cx - 16, fy - 3, C.K, 6); buf.line(cx + 19, fy + 2, cx - 16, fy - 3, C.log, 4); buf.line(cx + 19, fy + 1, cx - 16, fy - 4, C.logL, 1);
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
    flames(29, 18, 12, 0);
    if (Math.random() < 0.3 + ears.bass * 0.5) this.parts.push({ k: "ember", x: cx + (Math.random() - 0.5) * 30, y: fy - 6, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 20, t0: t, life: 0.8 + Math.random() * 0.6 });

    const L = this.potL, ox = 35, oy = 40;
    L.clear();
    for (const lx of [-15, 13]) { L.rect(ox + lx, oy - 9, 3, 9, C.pot); L.set(ox + lx, oy - 9, C.potM); }
    const by = oy - 19, rx = 23, ry = 15;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx, ny = y / ry;
      if (nx * nx + ny * ny > 1.02) continue;
      const l = -0.6 * nx - 0.45 * ny;
      let c = l > 0.55 ? C.potL : l > 0.05 ? C.potM : C.pot;
      if (l > 0.4 && l <= 0.55 && bayer(x, y) < 0.5) c = C.potL;
      if (ny > 0.55 && (ny - 0.55) * 1.8 > bayer(x, y)) c = mix(c, C.fire[2], 0.4);
      L.set(ox + x, by + y, c);
    }
    for (let x = -rx + 1; x < rx; x++) L.set(ox + x, by - 7, x % 6 === 0 ? C.potRim : C.potD);
    const ry0 = oy - 32;
    L.ellipse(ox, ry0, 26, 5, C.potL);
    for (let x = -26; x <= 26; x++) if (x < -6) L.set(ox + x, ry0 + (x < -20 ? 1 : 3), C.potRim);
    L.ellipse(ox, ry0, 22, 3, C.brewM);
    L.ellipse(ox, ry0 + 1, 18, 2, C.brew);
    for (let x = -21; x <= 21; x++) L.set(ox + x, ry0 - 3 + (Math.abs(x) > 16 ? 1 : 0), C.brewD);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 5; i++) L.set(ox - 14 + ((i * 9 + sp * 3) % 28), ry0 + (i % 2), C.brewL);
    L.outline(C.K);
    buf.blit(L, cx - ox, fy - oy);
    flames(12, 5, 4, 2);

    if (Math.random() < 0.12 + ears.bass * 0.5) this.parts.push({ k: "bubble", x: cx + (Math.random() - 0.5) * 34, y: rimY + (Math.random() - 0.5) * 3, t0: t, life: 0.4 + Math.random() * 0.4 });

    // the ladle, stirred by magic
    this.ladleA = (this.ladleA || 0) + dt * (1.6 + ears.mid * 2.5 + ears.pulse * 2);
    const a = Math.floor(this.ladleA * 8) / 8, px = cx + Math.cos(a) * 12, py = rimY + Math.sin(a) * 1.6;
    const qx = cx + Math.cos(a) * 6 + Math.sin(a * 0.5) * 2, qy = rimY - 30 + Math.sin(a) * 1.5;
    this.ladleTop = { x: qx, y: qy };
    buf.line(px, py, qx, qy, C.K, 5);
    buf.line(px, py, qx, qy, C.woodD, 3);
    buf.line(px - 1, py, qx - 1, qy, C.woodL, 1);
    buf.ellipse(qx, qy - 1, 2, 2, C.K);
    buf.ellipse(qx, qy - 1, 1, 1, C.woodL);
    for (let x = -5; x <= 5; x++) if (Math.abs(x) > 1) buf.set(px + x, py + (Math.abs(x) > 3 ? 0 : 1), C.brewL);
    for (let i = 0; i < 6; i++) {
      const u = (i / 6 + tq * 0.8) % 1;
      buf.set(lerp(px, qx, u) + Math.sin(u * 20 + tq * 8) * 3, lerp(py, qy, u), i % 2 ? C.magic : C.magicL);
    }
    // green and purple smoke ribbons curling up
    for (const [k, c, cl, off] of [[0, C.smokeG, C.smokeGL, -7], [1, C.smokeP, C.smokePL, 6]]) {
      const len = 26 + ears.level * 12;
      for (let s = 0; s < len; s++) {
        const f = s / len, x = cx + off + Math.sin(s * 0.22 - tq * 4 + k * 2) * (2 + f * 6), y = rimY - 4 - s;
        const rad = 2.6 - f * 2;
        if (f > 0.75 && bayer(Math.round(x), Math.round(y)) > (1 - f) * 3) continue;
        buf.disc(x, y, rad, c);
        if (rad > 1.2) buf.set(x - 1, y, cl);
      }
    }
  }

  // ---------- reaper ----------
  reaperPose(t, tq, ears, se, sk) {
    const g = { face: "idle", rise: 0, shake: 0, blink: false, hemPh: tq * 5, sway: Math.sin(tq * 1.7), look: -1 };
    const sL = { x: -10, y: 16 };
    // conducting with the free hand, relative to its shoulder: down, in, out, up (mirrored: out = left, toward the cauldron)
    const pts = [[-8, 12], [3, 4], [-20, 3], [-12, -14]];
    let hand;
    if (ears.active) {
      const k = this.lastBeat % 4, ph = Math.floor(ears.phase * 6) / 6, e = ph < 0.5 ? 2 * ph * ph : 1 - Math.pow(-2 * ph + 2, 2) / 2;
      const p0 = pts[(k + 3) % 4], p1 = pts[k], p2 = pts[(k + 1) % 4];
      hand = ph < 0.15 ? [lerp(p0[0], p1[0], 0.85 + ph), lerp(p0[1], p1[1], 0.85 + ph) + 2] : [lerp(p1[0], p2[0], e), lerp(p1[1], p2[1], e)];
    } else hand = [-14 + 4 * Math.sin(tq * 1.3), -4 + 5 * Math.cos(tq * 1.3)];
    g.hand = { x: sL.x + hand[0], y: sL.y + hand[1] };
    g.blink = t % 4.3 < 0.13;
    if (sk === "laugh" && se > 0.1 && se < 2.9) {
      g.face = "laugh"; g.shake = Math.floor(tq * 12) % 2 ? 1 : -1; g.rise = Math.min(4, se * 12); g.hand = { x: sL.x - 4, y: sL.y + 8 };
    } else if (sk === "boo" && se < 2.45) {
      g.face = se < 0.15 ? "idle" : "boo"; g.rise = se < 0.15 ? se * 30 : 0; g.hand = { x: sL.x - 14, y: sL.y - 20 };
      g.shake = se > 0.35 && Math.floor(tq * 12) % 2 ? 1 : 0;
    } else if (sk === "scream" && se > 0.25 && se < 3.4) {
      g.face = "scared"; g.look = this.sc.side; g.hand = { x: sL.x + 2, y: sL.y - 4 };
    } else if (sk === "cat" && se > 0.5 && se < 1.8) {
      g.face = "scared"; g.rise = 5; g.look = 0; g.hand = { x: sL.x - 6, y: sL.y - 14 };
    }
    return g;
  }

  drawReaper(t, tq, ears, se, sk, scale) {
    const g = this.reaperPose(t, tq, ears, se, sk);
    const L = this.condL, ox = 52, oy = 34;
    L.clear();
    // scythe behind (held in the right hand)
    const shx = ox + 18, top = oy - 10;
    L.line(shx, top, shx - 2, oy + 62, C.K, 5); L.line(shx, top, shx - 2, oy + 62, C.woodD, 3); L.line(shx - 1, top, shx - 3, oy + 62, C.wood, 1);
    const bc = { x: shx + 1, y: top + 17 }, R = 17;
    for (let a = -100; a <= -8; a += 2) {
      const f = (a + 100) / 92, w = 4.5 - f * 3.5, x = bc.x + Math.cos(a * D) * R, y = bc.y + Math.sin(a * D) * R;
      L.disc(x, y, w / 2 + 1, C.K);
    }
    for (let a = -100; a <= -8; a += 2) {
      const f = (a + 100) / 92, w = 4.5 - f * 3.5, x = bc.x + Math.cos(a * D) * R, y = bc.y + Math.sin(a * D) * R;
      L.disc(x, y, Math.max(0, w / 2), C.blade);
      L.set(bc.x + Math.cos(a * D) * (R - w / 2), bc.y + Math.sin(a * D) * (R - w / 2), C.bladeM);
      L.set(x + Math.cos(a * D), y + Math.sin(a * D) * 1.2, C.bladeL);
    }
    // robe
    for (let y = 8; y <= 60; y++) {
      const hw = 11 + (y - 8) * 0.27, xo = g.sway * Math.pow((y - 8) / 52, 2) * 4;
      for (let x = Math.floor(-hw + xo); x <= Math.ceil(hw + xo); x++) {
        const hem = 55 + 3.5 * Math.abs(Math.sin(x * 0.33 + g.hemPh));
        if (y > hem) continue;
        const nx = (x - xo) / hw;
        let c = nx > 0.5 ? C.robeM : C.robe;
        if (nx > 0.82) c = C.robeD;
        if ((Math.abs(x - xo + 5 + Math.sin(y * 0.2) * 1.2) < 0.8 || Math.abs(x - xo - 4 - Math.sin(y * 0.25) * 1.2) < 0.8) && y > 22) c = C.robeD;
        if (nx < -0.86) c = C.robeL;
        if (y > hem - 3) c = nx > 0.3 ? C.robeD : C.robeM;
        L.set(ox + x, oy + y, c);
      }
    }
    // hood with a floppy tip
    for (let y = -14; y <= 14; y++) for (let x = -13; x <= 13; x++) {
      const inHead = (x * x) / 160 + ((y + 1) * (y + 1)) / 170 <= 1;
      const tip = y < -6 && x > 2 && x < 10 - (y + 14) * 0.3 && y > -14 + (x - 2) * 0.4;
      if (!inHead && !tip) continue;
      const nx = x / 13;
      L.set(ox + x, oy + y, nx > 0.55 ? C.robeM : nx < -0.8 ? C.robeL : C.robe);
    }
    L.ellipse(ox - 2, oy + 2, 7, 8, C.hood);
    // eyes
    const ex = ox - 2 + g.look, ey = oy + 1;
    if (g.face === "laugh") for (const bx of [-5, 1]) { L.set(ex + bx, ey + 1, C.eye); L.set(ex + bx + 1, ey, C.eyeL); L.set(ex + bx + 2, ey + 1, C.eye); }
    else if (g.face === "boo") { L.rect(ex - 6, ey - 2, 3, 4, C.redEye); L.rect(ex + 2, ey - 2, 3, 4, C.redEye); L.set(ex - 5, ey - 1, C.white); L.set(ex + 3, ey - 1, C.white); }
    else if (g.face === "scared") { L.set(ex - 4, ey, C.eyeL); L.set(ex + 2, ey, C.eyeL); }
    else if (g.blink) { L.rect(ex - 5, ey + 1, 2, 1, C.eye); L.rect(ex + 1, ey + 1, 2, 1, C.eye); }
    else { L.rect(ex - 5, ey - 1, 2, 3, C.eye); L.rect(ex + 1, ey - 1, 2, 3, C.eye); L.set(ex - 5, ey - 1, C.eyeL); L.set(ex + 1, ey - 1, C.eyeL); }
    // sleeves: right one grips the scythe, left one conducts
    const sleeve = (sx, sy, hx, hy) => {
      L.line(sx, sy, hx, hy, C.K, 9); L.line(sx, sy, hx, hy, C.robe, 7);
      L.line(sx, sy + 2, hx, hy + 2, C.robeM, 2);
      L.disc(hx, hy, 2, C.K); L.disc(hx, hy, 1, C.bone); L.set(hx - 1, hy - 1, C.bone);
    };
    sleeve(ox + 10, oy + 16, shx - 3, oy + 22);
    L.rect(shx - 4, oy + 21, 3, 3, C.bone);
    const hx = ox + g.hand.x, hy = oy + g.hand.y;
    sleeve(ox - 10, oy + 16, hx, hy);
    L.outline(C.K);

    const gx = this.cond.x + g.shake, gy = this.cond.y + Math.round(Math.sin(tq * 1.3) * 2) - Math.round(g.rise);
    this.castHand = { x: gx - ox + hx, y: gy - oy + hy, cast: g.face === "idle" };
    this.condMouth = { x: gx, y: gy + 4 };
    if (scale === 1) {
      // shadow on the ground, smaller when it rises
      const sy = this.groundY + 2, sw = 14 - Math.round(g.rise / 2);
      for (let x = -sw; x <= sw; x++) for (let y = -1; y <= 1; y++) if (Math.abs(x) < sw - Math.abs(y) * 3) this.buf.set(gx + x, sy + y, mix(this.buf.get(gx + x, sy + y), C.black, 0.45));
      this.buf.blit(L, gx - ox, gy - oy);
      this.drawSkullBalls(t, tq, ears, gx, gy, g);
    } else this.buf.blitScaled(L, scale, this.W / 2 + g.shake * scale, this.H * 0.45, ox, oy + 4);
  }

  /** green-flame skulls hovering around the reaper */
  drawSkullBalls(t, tq, ears, gx, gy, g) {
    const n = 3, spin = g.face === "laugh" ? 4 : 0.8;
    for (let i = 0; i < n; i++) {
      const a = tq * spin + (i / n) * Math.PI * 2, x = Math.round(gx + Math.cos(a) * 30), y = Math.round(gy + 10 + Math.sin(a) * 9 + Math.sin(tq * 3 + i) * 2);
      const fl = Math.floor(tq * 12 + i) % 3;
      const S = new Buf(13, 15);
      S.ellipse(6, 9, 5, 5, C.skullFD);
      S.ellipse(6, 9, 4, 4, C.skullF);
      for (let k = 0; k < 4; k++) S.rect(2 + k * 3, 1 + ((k + fl) % 3), 1, 4 - ((k + fl) % 3), k % 2 ? C.skullFL : C.skullF);
      S.blit(SKULLBALL, 4, 7);
      S.outline(C.K);
      this.buf.blit(S, x - 6, y - 9);
    }
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
      if ((se > 0.7 && se < 1.6) || (cat !== undefined && Math.abs(cat - d.x) < 30)) p = SPECIAL.startle;
    }
    d.shown = p;
    return p;
  }

  drawDancer(d, t, tq, ears, se, sk) {
    const p = this.dancerPose(d, t, tq, ears, se, sk);
    const L = this.dl, ox = 45, oy = 90;
    L.clear();
    if (p.pile) this.pile(L, ox, oy, d);
    else this.skeleton(L, ox, oy, p, d, ears);
    L.outline(C.K);
    const far = d.fy < this.potY;
    this.buf.blit(L, d.x - ox, d.fy - oy, false, far ? (c) => (c === C.K ? c : mix(c, C.hill, 0.18)) : null);
    // contact shadow
    for (let x = -9; x <= 9; x++) { const X = d.x + x, Y = d.fy + 1; this.buf.set(X, Y, mix(this.buf.get(X, Y), C.black, 0.4)); }
  }

  skeleton(L, fx, fy, p, d, ears) {
    const g = d.gear, hand = d.flip ? -1 : 1; // weapon hand
    const hipY = fy - 25 + p.dy, hx = fx + p.lean * 0.5, cxx = fx + p.lean;
    const limb = (x0, y0, side, a, f, l1, l2) => {
      const a1 = a * D, a2 = (a + f) * D;
      const x1 = x0 + side * Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1, x2 = x1 + side * Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
      return [x1, y1, x2, y2];
    };
    const bone = (x0, y0, x1, y1, c) => { L.line(x0, y0, x1, y1, C.K, 5); L.line(x0, y0, x1, y1, c, 3); };
    const joint = (x, y, c) => L.disc(x, y, 1.6, c);
    const shY = hipY - 17;
    // shield on the back
    if (g.shield) { const sx = cxx - hand * 7, sy = shY + 6; L.disc(sx, sy, 8, C.K); L.disc(sx, sy, 7, C.ironM); L.disc(sx, sy, 6, C.wood); L.line(sx - 5, sy, sx + 5, sy, C.woodD); L.line(sx, sy - 5, sx, sy + 5, C.woodD); L.disc(sx, sy, 1, C.iron); }
    // legs (the far one darker)
    for (const [side, u, k] of [[-hand, hand > 0 ? p.uL : p.uR, hand > 0 ? p.kL : p.kR], [hand, hand > 0 ? p.uR : p.uL, hand > 0 ? p.kR : p.kL]]) {
      const c = side === -hand ? C.boneM : C.bone, x0 = hx + side * 3, [x1, y1, x2, y2] = limb(x0, hipY + 1, side, u, k, 12, 12);
      bone(x0, hipY + 1, x1, y1, c); bone(x1, y1, x2, y2, c); joint(x1, y1, c);
      L.line(x2, y2, x2 + side * 4, y2 + 1, C.K, 5); L.line(x2, y2, x2 + side * 4, y2 + 1, c, 3);
    }
    L.blit(PELVIS, hx - 5, hipY - 1);
    for (let y = hipY - 2; y > hipY - 9; y--) { const x = Math.round(lerp(hx, cxx, (hipY - y) / 9)); L.rect(x - 1, y, 3, 1, y % 2 ? C.bone : C.boneD); }
    L.blit(RIBS, cxx - 6, hipY - 19);
    let weaponHand = null, forearm = null;
    const arms = () => {
      for (const [side, a, f] of [[-1, p.aL, p.fL], [1, p.aR, p.fR]]) {
        const c = side === -hand ? C.boneM : C.bone, x0 = cxx + side * 7, y0 = shY, [x1, y1, x2, y2] = limb(x0, y0, side, a, f, 10, 10);
        bone(x0, y0, x1, y1, c); bone(x1, y1, x2, y2, c); joint(x1, y1, c);
        L.disc(x2, y2, 2, C.K); L.disc(x2, y2, 1, c);
        if (side === hand) { weaponHand = [x2, y2]; forearm = [x2 - x1, y2 - y1]; }
        if (g.paul === 2 || (g.paul === 1 && side === hand)) L.blit(PAUL, x0 - 3, y0 - 3);
      }
    };
    const over = p.aL > 140 && p.fL > 60;
    if (!over) arms();
    const sx = Math.round(cxx + p.tilt - 7 + p.sx), sy = Math.round(hipY - 33 + p.sy);
    L.blit(SKULL, sx, sy);
    const lk = Math.round(clamp(p.look, -1, 1));
    for (const ex of [3, 9]) { L.rect(sx + ex + lk, sy + 5, 3, 3, C.ink); L.set(sx + ex + 1 + lk, sy + 8, C.ink); }
    if (ears.pulse > 0.6) { L.set(sx + 4 + lk, sy + 6, C.cyan); L.set(sx + 10 + lk, sy + 6, C.cyan); }
    L.rect(sx + 7, sy + 9, 1, 2, C.ink);
    L.blit(JAW, sx + 2, sy + 12 + Math.round(p.jaw * 2));
    if (g.helm) { L.blit(HELM, sx - 1, sy - 2); if (g.helm === "spike") L.blit(SPIKE, sx + 7, sy - 5); }
    if (over) arms();
    if (weaponHand && g.weapon) this.weapon(L, g.weapon, weaponHand, forearm, hand);
  }

  weapon(L, kind, [hx, hy], [fx, fy], side) {
    const n = Math.hypot(fx, fy) || 1, dx = fx / n, dy = fy / n;
    if (kind === "sword") {
      const px = -dy, py = dx;
      L.line(hx - dx * 3, hy - dy * 3, hx + dx, hy + dy, C.K, 4); L.line(hx - dx * 3, hy - dy * 3, hx + dx, hy + dy, C.woodD, 2);
      L.line(hx + dx * 2 - px * 4, hy + dy * 2 - py * 4, hx + dx * 2 + px * 4, hy + dy * 2 + py * 4, C.K, 4);
      L.line(hx + dx * 2 - px * 4, hy + dy * 2 - py * 4, hx + dx * 2 + px * 4, hy + dy * 2 + py * 4, C.gold, 2);
      const tx = hx + dx * 24, ty = hy + dy * 24;
      L.line(hx + dx * 3, hy + dy * 3, tx, ty, C.K, 5); L.line(hx + dx * 3, hy + dy * 3, tx, ty, C.bladeM, 3);
      L.line(hx + dx * 3 + px, hy + dy * 3 + py, tx, ty, C.blade, 1);
    } else {
      // pole weapons stay upright, tilting with the arm
      let ux = dx * 0.35 + side * 0.1, uy = -1;
      const m = Math.hypot(ux, uy); ux /= m; uy /= m;
      const bx = hx - ux * 14, byy = hy - uy * 14, tx = hx + ux * 34, ty = hy + uy * 34;
      L.line(bx, byy, tx, ty, C.K, 4); L.line(bx, byy, tx, ty, C.wood, 2);
      const hx2 = tx + ux * 7, hy2 = ty + uy * 7, px = -uy, py = ux;
      for (let k = 0; k <= 7; k++) { const w = k < 3 ? k * 0.8 : (7 - k) * 0.45; L.line(tx + ux * k - px * w, ty + uy * k - py * w, tx + ux * k + px * w, ty + uy * k + py * w, C.iron); }
      L.line(tx, ty, hx2, hy2, C.ironL);
      if (kind === "halberd") for (let k = 1; k <= 5; k++) L.line(tx + ux * k, ty + uy * k, tx + ux * k + px * side * (6 - Math.abs(k - 3)), ty + uy * k + py * side * (6 - Math.abs(k - 3)), k === 1 ? C.ironM : C.iron);
      else { L.set(tx - ux * 2, ty - uy * 2, C.blood); L.set(tx - ux * 3 + px, ty - uy * 3 + py, C.blood); L.set(tx - ux * 5 + px, ty - uy * 5 + py, C.blood); }
    }
  }

  pile(L, fx, fy, d) {
    const s = d.flip ? -1 : 1;
    const bone = (x0, y0, x1, y1) => { L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.K, 5); L.line(fx + x0 * s, fy + y0, fx + x1 * s, fy + y1, C.bone, 3); };
    bone(-18, -3, -6, -2); bone(-4, -6, 6, -3); bone(9, -2, 19, -4); bone(-12, -7, -2, -9); bone(14, -9, 21, -3);
    L.blit(RIBS, fx - 6 - 3 * s, fy - 13);
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
    // the cat runs right past the camera, so it is drawn twice as big
    this.buf.blitScaled(L, 2, x, H - 1, L.w / 2, L.h);
  }

  // ---------- particles ----------
  drawParts(t, dt, ears, layer) {
    const { buf } = this;
    if (layer === "mid") {
      // spell stream from the reaper's hand to the ladle
      const gh = this.castHand, lt = this.ladleTop;
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
      if (q.k === "ember") buf.set(q.x + q.vx * age * q.life, q.y + q.vy * age * q.life, age < 0.5 ? C.fire[1] : C.fire[3]);
      else if (q.k === "bubble") {
        const r = age < 0.7 ? 1 : 2;
        if (age < 0.7) { buf.set(q.x, q.y, C.brewL); buf.set(q.x + 1, q.y, C.brewL); buf.set(q.x, q.y - 1, C.brew); }
        else { buf.set(q.x - r, q.y, C.brewL); buf.set(q.x + r + 1, q.y, C.brewL); buf.set(q.x, q.y - r, C.brewL); }
      } else if (q.k === "spell") {
        const u = age, mx = (q.a.x + q.b.x) / 2, my = Math.min(q.a.y, q.b.y) - 26;
        const x = (1 - u) ** 2 * q.a.x + 2 * (1 - u) * u * mx + u * u * q.b.x + Math.sin(u * 9 + q.j) * 3;
        const y = (1 - u) ** 2 * q.a.y + 2 * (1 - u) * u * my + u * u * q.b.y + Math.cos(u * 7 + q.j) * 2.5;
        const c = q.j > 4.5 ? C.magicL : q.j > 3 ? C.magic : q.j > 1.5 ? C.magicP : C.magicPL;
        buf.set(x, y, c);
        if (q.j > 5.4) { buf.set(x + 1, y, c); buf.set(x - 1, y, c); buf.set(x, y + 1, c); buf.set(x, y - 1, c); }
      } else if (q.k === "ring") {
        const rx = 22 + age * 24, ry = 4 + age * 5;
        for (let i = 0; i < 44; i++) {
          if ((i + Math.floor(age * 8)) % 3 === 0) continue;
          const a = (i / 44) * Math.PI * 2;
          buf.set(this.cx + Math.cos(a) * rx, this.rimY + Math.sin(a) * ry, age < 0.5 ? C.brewL : C.brewM);
        }
      } else if (q.k === "skull") {
        const y = q.y - age * 30, a = (1 - age) * 0.8;
        for (let yy = 0; yy < SKULL.h; yy++) for (let xx = 0; xx < SKULL.w; xx++) {
          if (!SKULL.d[yy * SKULL.w + xx]) continue;
          const X = Math.round(q.x - 7 + xx + Math.sin(age * 5) * 2), Y = Math.round(y + yy);
          if (a > bayer(X, Y)) buf.set(X, Y, (yy >= 5 && yy <= 7 && (xx >= 3 && xx <= 5 || xx >= 9 && xx <= 11)) ? C.smokeP : C.smokeGL);
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
        this.parts.push({ k: "ha", x: m.x + (n % 2 ? 14 : -36), y: m.y - 14, t0: t, life: 1.1 });
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
