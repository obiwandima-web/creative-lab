// V9 scene (kept as scene-v9.js, ?v=9): wolf-howl bats make the moon glow, the spell throws a glowing geyser and steam from the cauldron, a little spider
// hangs from the leftmost branch (5 min there, 5 min away). V8 kept as scene-v8.js (?v=8).
// V8: BOO is now a flipbook of Dmitrii's six screamer frames (boo-ref/, js/boo-frames.js); the BOO drawn in code is in scene-v7.js (?v=7).
// V7 was the animation pass. Skeletons dance with weight (planted feet, two-bone legs, a body on springs) in a plan of dancing in place
// and turns round the cauldron; the reaper idles like an NPC and casts on a music drop; the cauldron boils and the fire flares from his spell;
// BOO is a detailed close-up screamer. The V6 picture is unchanged (kept as js/scene-v6.js, ?v=6).
// V6 scene, after the second round of pins: light haze on the distance, a plain background cross on the far hill, moonlit cloud rims,
// softer bark glints, a cleaner skull. V5 was after Dmitrii's 21 pins on V4 (review page review.html):
// graves grounded and layered behind the trees, every stone/cross with bevel, moss, chips and cracks; clouds behind the trees with billows;
// a neat dead tree behind the moon; the clearing lower for a steeper diagonal; bark lit as a dithered gradient with grooves, knots, cracks;
// richer front leaves; more detailed skeletons (cower covers the face, a rare somersault); the cauldron on a fire again, smooth shading,
// boiling on the beat; the reaper's scythe hand without holes. Older looks: js/scene-v1.js .. scene-v5.js (?v=1..5).
import { Buf, pk, mix, bayer, rng, sprite, text, textW } from "./px.js";
import { BOO_PAL, BOO_FRAMES } from "./boo-frames.js";

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

export const SCARES = {
  laugh: { dur: 3.2, sound: 0.15 },
  boo: { dur: 3.0, sound: 0.6 },
  scream: { dur: 4.6, sound: 0.3 }, // bats and a wolf howl; the moon glows
  cat: { dur: 2.9, sound: 0.72 },
};

// ---------- choreography (V7) ----------
// The group dances in place for 5-10 s (each skeleton its own move), then turns round the cauldron for 3-5 s in one of four ways,
// so a new turn comes every 10-15 s; now and then one of them somersaults while dancing in place.
// Feet stay planted (two-bone legs solved to reach them), the body rides on springs: it sinks into the knees on every beat,
// the chest and skull lag behind the hips, the arms overshoot a little and settle.
export const CHOREO = { place: [5, 10], rot: [3, 5], flip: 0.35 };
// turn = degrees round the ring, every = beats per step, lift = foot lift, hop = body hop per step, low = knees bent, spin = each turns round
const ROTS = {
  walk: { turn: 90, every: 1, lift: 3, hop: 0, low: 0.5 },
  skip: { turn: 135, every: 1, lift: 4, hop: 3, low: 0 },
  spin: { turn: 90, every: 1, lift: 2, hop: 0, low: 1, spin: 1 },
  slide: { turn: 180, every: 0.5, lift: 1, hop: 0, low: 3 },
};
// keys of a dance in place, one per beat; L / R = [foot x from the body centre, foot lift], dy = sink into the knees, hx = hips over a foot,
// air = a hop that lands on this beat
const K = (o) => ({ ...BASE, L: [-4, 0], R: [4, 0], dy: 1.5, hx: 0, air: 0, ...o });
const PLACE = {
  groove: [K({ aL: 150, fL: 30, aR: 35, fR: 70, dy: 3, lean: -1, tilt: -1, hx: -1, L: [-5, 0], R: [5, 0] }), K({ aL: 35, fL: 70, aR: 150, fR: 30, dy: 3, lean: 1, tilt: 1, hx: 1, L: [-5, 0], R: [5, 0] })],
  steptouch: [
    K({ R: [10, 0], L: [-3, 0], hx: 2, lean: 1, tilt: 1, aL: 75, fL: 60, aR: 25, fR: 30 }),
    K({ R: [5, 0], L: [-4, 0], dy: 3, aL: 30, fL: 40, aR: 30, fR: 40, jaw: 1 }),
    K({ L: [-10, 0], R: [3, 0], hx: -2, lean: -1, tilt: -1, aR: 75, fR: 60, aL: 25, fL: 30 }),
    K({ L: [-5, 0], R: [4, 0], dy: 3, aL: 30, fL: 40, aR: 30, fR: 40, jaw: 1 }),
  ],
  kick: [
    K({ R: [11, 8], L: [-3, 0], aL: 150, fL: 25, aR: 60, fR: -30, lean: -1, tilt: -1, dy: 1 }),
    K({ dy: 3.5, aL: 70, fL: 30, aR: 70, fR: 30 }),
    K({ L: [-11, 8], R: [3, 0], aR: 150, fR: 25, aL: 60, fL: -30, lean: 1, tilt: 1, dy: 1 }),
    K({ dy: 3.5, aL: 70, fL: 30, aR: 70, fR: 30 }),
  ],
  jump: [K({ dy: 5, aL: 25, fL: -25, aR: 25, fR: -25 }), K({ air: 8, aL: 165, fL: 20, aR: 165, fR: 20, jaw: 1, dy: 0.5, L: [-7, 0], R: [7, 0] })],
  hips: [K({ hx: -3, lean: -2, tilt: -1, aL: 50, fL: -110, aR: 50, fR: -110, dy: 3, jaw: 1, L: [-5, 0], R: [5, 0] }), K({ hx: 3, lean: 2, tilt: 1, aL: 50, fL: -110, aR: 50, fR: -110, dy: 1.5, L: [-5, 0], R: [5, 0] })],
  chicken: [K({ aL: 60, fL: -140, aR: 60, fR: -140, dy: 3.5, jaw: 1, tilt: -1, L: [-5, 0], R: [5, 0] }), K({ aL: 100, fL: -150, aR: 100, fR: -150, dy: 1, tilt: 1, L: [-5, 0], R: [5, 0] })],
  wave: [K({ aL: 165, fL: 15, aR: 150, fR: -25, hx: -2, lean: -1, tilt: -1, dy: 2 }), K({ aL: 150, fL: -25, aR: 165, fR: 15, hx: 2, lean: 1, tilt: 1, dy: 2 })],
  sway: [K({ hx: -1, lean: -1, tilt: -1, aL: 25, fL: 10, aR: 12, fR: 10, dy: 1.5 }), K({ hx: 1, lean: 1, tilt: 1, aL: 12, fL: 10, aR: 25, fR: 10, dy: 1.5 })],
};
const PLACE_MOVES = ["groove", "steptouch", "kick", "jump", "hips", "chicken", "wave"];
const REST = K({ aL: 30, fL: 20, aR: 30, fR: 20, dy: 2 });
/** arms (and the rest of the body) on step i of a turn */
function rotKey(kind, i) {
  const o = i % 2;
  if (kind === "walk") return K(o ? { aL: 45, fL: 35, aR: 12, fR: 15, lean: 1, tilt: 1 } : { aL: 12, fL: 15, aR: 45, fR: 35, lean: -1, tilt: -1 });
  if (kind === "skip") return K(o ? { aL: 165, fL: 20, aR: 120, fR: 50, tilt: 1, jaw: 1 } : { aL: 120, fL: 50, aR: 165, fR: 20, tilt: -1 });
  if (kind === "spin") return K({ aL: 95, fL: 5, aR: 95, fR: 5, jaw: o });
  return K(o ? { aL: 70, fL: 55, aR: 70, fR: 55 } : { aL: 55, fL: -110, aR: 55, fR: -110, jaw: 1 }); // slide: clap at the chest, open
}
const SPR = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { x: v, v: 0 }]));
/** a damped spring towards `to`, w = stiffness (rad/s), z = damping ratio; small fixed substeps keep it stable */
function spring(s, to, w, z, dt) {
  const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
  for (let i = 0; i < n; i++) { s.v += (-w * w * (s.x - to) - 2 * z * w * s.v) * h; s.x += s.v * h; }
}
/** two-bone leg from the hip (x0, y0) to the ankle (x2, y2); the knee bends out to `side`; returns knee and (clamped) ankle */
function ik(x0, y0, x2, y2, side, l1 = 10, l2 = 10) {
  let dx = x2 - x0, dy = y2 - y0, d = Math.hypot(dx, dy) || 0.01;
  const m = l1 + l2 - 0.05;
  if (d > m) { x2 = x0 + (dx / d) * m; y2 = y0 + (dy / d) * m; dx = x2 - x0; dy = y2 - y0; d = m; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let px = -dy / d, py = dx / d;
  if (px * side < 0) { px = -px; py = -py; }
  return [x0 + (dx * a) / d + px * h, y0 + (dy * a) / d + py * h, x2, y2];
}
/** squash a layer sideways about x = cx (a turn seen from the front); s < 0 mirrors; steps of a quarter keep it crisp */
function squeeze(src, cx, s) {
  const q = Math.max(0.25, Math.round(Math.abs(s) * 4) / 4), m = s < 0 ? -1 : 1, out = new Buf(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const sx = Math.round(cx + ((x - cx) / q) * m);
    if (sx >= 0 && sx < src.w) out.d[y * src.w + x] = src.d[y * src.w + sx];
  }
  return out;
}

/** the BOO frames as layers: each in three heats of its glowing reds (dim, as drawn, hot), the robe carried on below the frame's edge */
function decodeBoo() {
  const bytes = (b64) => (typeof atob === "function" ? Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)) : new Uint8Array(Buffer.from(b64, "base64")));
  const pal = BOO_PAL.map(pk), rgb = BOO_PAL.map((c) => [c >> 16, (c >> 8) & 255, c & 255]);
  const glowing = rgb.map(([r, g, b]) => r > 150 && r > g * 1.6 && r > b * 1.5); // the eye fire and its smoke
  const heat = (k, f) => { const [r, g, b] = rgb[k]; return glowing[k] ? pk((Math.min(255, Math.round(r * f)) << 16) | (Math.min(255, Math.round(g * f)) << 8) | Math.min(255, Math.round(b * f))) : pal[k]; };
  const EXT = 70;
  return BOO_FRAMES.map((fr, n) => {
    const px = bytes(fr.px), h = fr.h + EXT;
    const out = { eye: fr.eye, base: n < 2 ? 2 : 3, glow: new Uint8Array(fr.w * h), heat: [0.8, 1, 1.22].map(() => new Buf(fr.w, h)) };
    for (let y = 0; y < h; y++) {
      const row = Math.min(y, fr.h - 1) * fr.w, cutL = px[row] !== 255 || px[row + 1] !== 255, cutR = px[row + fr.w - 1] !== 255 || px[row + fr.w - 2] !== 255;
      for (let x = 0; x < fr.w; x++) {
        const k = px[row + x];
        if (k === 255) continue;
        const i = y * fr.w + x;
        out.glow[i] = glowing[k] ? 1 : 0;
        // where the panel cut the robe off at its side, let it sink into the dark instead of ending in a straight line
        const e = Math.min(cutL ? x / 8 : 1, cutR ? (fr.w - 1 - x) / 8 : 1);
        [0.8, 1, 1.22].forEach((f, j) => (out.heat[j].d[i] = e < 1 ? mix(C.black, heat(k, f), Math.round(Math.max(0, e) * 4) / 4) : heat(k, f)));
      }
    }
    return out;
  });
}

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
    this.plan = null; this.cB = 0; this.prevCB = 0; this.rawB = 0; this.beatN = 0; this.wantFlip = false; // the dance
    this.boilE = 0; this.fireE = 0; this.spellT0 = null; this.wisps = 0; this.fid = null; // the spell and the cauldron
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
    this.dancers = [0, 1, 2, 3].map((k) => {
      const a = this.ringA + (k * Math.PI) / 2;
      return { k, seed: k * 0.27, flipB: -99, flipDir: 1, lift: 0, peakLift: 0, dust: 0,
        feet: [-1, 1].map((s) => ({ s, a, o: s * 4, l: 0, peak: 0, id: "", from: { a, o: s * 4, l: 0 } })),
        s: SPR({ hx: 0, dy: 1.5, cx: 0, cy: 1.5, hdx: 0, hdy: 1.5, aL: 20, fL: 10, aR: 20, fR: 10, lean: 0, tilt: 0, jaw: 0, look: 0 }) };
    });
    this.plan = null;
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
  /** a somersault soon: on the next free bar while dancing in place, else in the next place phase (key S) */
  flip(t, k) {
    const p = this.plan, b = Math.ceil(this.cB / 4) * 4;
    if (p && p.kind === "place" && b + 4 <= p.b1) { const d = this.dancers[k === undefined ? Math.floor(Math.random() * 4) : k]; d.flipB = b; d.flipDir = Math.random() < 0.5 ? -1 : 1; }
    else this.wantFlip = true;
  }
  onBeat(t, idx, idle, period) { this.period = period || 0.6; this.beatN++; }

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
    // the cauldron follows the reaper: his wisps make it boil, the fire flares up slowly and dies down
    this.boilE = Math.max(0, this.boilE - dt * 0.12);
    const E = Math.min(1, this.boilE);
    this.fireE += (E - this.fireE) * Math.min(1, dt * (E > this.fireE ? 2.5 : 0.8));
    if (!this.refPoses || this.glowV === undefined) this.glowV = clamp(0.28 + 0.06 * Math.sin(t * 2.1) + 0.72 * Math.max(E, this.fireE));

    buf.d.set(this.bg.d);
    // review page: credit each pixel to what drew it (off at the party)
    if (this.trace) this.ids = this.bgIds.slice();
    const T = (name, fn) => (this.trace ? this.tag(buf, this.ids, name, fn) : fn());
    if (sk === "laugh" && ((se > 0.12 && se < 0.2) || (se > 0.32 && se < 0.42))) for (let i = 0; i < Math.round(H * 0.5) * W; i++) buf.d[i] = mix(buf.d[i], C.flash, 0.5);
    T("звёзды", () => this.drawStars(tq, ears));
    T("облака", () => this.drawClouds(t));
    buf.blit(this.treesL, 0, 0);
    if (this.trace) for (let i = 0; i < this.treeIds.length; i++) if (this.treesL.d[i]) this.ids[i] = this.treeIds[i];
    if (!this.refPoses) T("паучок", () => this.drawSpider(t));
    this.groundGlow(tq);

    const boo = sk === "boo" && se > 0.1 && se < 2.85;
    if (!boo) T("жнец", () => this.drawReaper(t, tq, ears, se, sk));
    let ring;
    if (this.refPoses) ring = this.dancers.map((d) => {
      const a = this.ringA + d.k * (Math.PI / 2);
      return { d, x: Math.round(this.cx + Math.cos(a) * this.ring.rx), fy: Math.round(this.potY + 1 + Math.sin(a) * this.ring.ry), front: Math.sin(a) > 0 };
    });
    else {
      this.danceClock(t, ears, sk);
      for (const d of this.dancers) this.updateDancer(d, t, dt, ears, se, sk);
      ring = this.dancers.map((d) => ({ d, fy: d.fy, front: Math.sin(d.ang) > 0 }));
    }
    ring.sort((a, b) => a.fy - b.fy);
    const dancer = (q) => T("скелет " + (q.d.k + 1), () => (this.refPoses ? this.drawDancer(q, ears) : this.drawDancer2(q, ears)));
    for (const q of ring) if (!q.front && !this.noDancers) dancer(q);
    T("котёл", () => this.drawCauldron(t, tq, ears, dt));
    for (const q of ring) if (q.front && !this.noDancers) dancer(q);
    T("частицы котла", () => this.drawParts(t, dt, ears, "mid"));
    buf.blit(this.fgL, 0, 0);
    if (this.trace) for (let i = 0; i < this.fgIds.length; i++) if (this.fgL.d[i]) this.ids[i] = this.fgIds[i];
    if (sk === "cat") this.drawCat(se);
    T("искры жнеца", () => this.drawParts(t, dt, ears, "top"));

    if (sk === "scream") {
      const m = this.moon, x0 = m.x - m.r - 18, y0 = Math.max(0, m.y - m.r - 18), n = 2 * m.r + 37, pre = [];
      for (let y = y0; y < Math.min(H, y0 + n); y++) pre.push(buf.d.slice(y * W + Math.max(0, x0), y * W + Math.min(W, x0 + n)));
      this.dim(clamp(se / 0.3) * clamp((4.6 - se) / 0.5) * 0.55);
      this.moonGlow(clamp((se - 0.4) / 0.9) * clamp((4.6 - se) / 0.9), pre, Math.max(0, x0), y0, t);
      this.drawEyes(se);
    }
    if (sk === "boo") this.drawBoo(t, tq, se);
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

  /** the moon lights up while the wolf howls: brighter face, a wide halo in a few dithered steps; pre = the moon area before the dim */
  moonGlow(g, pre, x0, y0, t) {
    if (g <= 0) return;
    const { buf, W, H } = this, m = this.moon, R = m.r + 3 + 14 * g, pulse = 0.85 + 0.15 * Math.sin(t * 5);
    for (let j = 0; j < pre.length; j++) {
      const y = y0 + j, row = pre[j];
      for (let i = 0; i < row.length; i++) {
        const x = x0 + i, d = Math.hypot(x - m.x, y - m.y);
        if (d > R) continue;
        const k = y * W + x;
        if (d <= m.r + 0.5) { buf.d[k] = mix(buf.d[k], mix(row[i], C.white, 0.3 * g), Math.min(1, g * 1.4)); continue; }
        const u = 1 - (d - m.r) / (R - m.r), lv = Math.floor(u * 4 * g * pulse + bayer(x, y) * 0.8);
        if (lv > 0) buf.d[k] = mix(buf.d[k], C.moonE, Math.min(0.75, 0.16 * lv));
      }
    }
  }
  /** a little spider on a thread from the leftmost branch: it hangs for 5 min (now and then swinging), climbs away for 5 min, comes back */
  drawSpider(t) {
    const { buf, W, H } = this, ax = Math.round(W * 0.035), ay = Math.round(H * 0.39) + 3; // under the lowest left branch, over the end grave
    const ph = (((t + 10) % 600) + 600) % 600, LEN = 30;
    let len, climbing = false;
    if (ph < 8) { len = LEN * smooth(ph / 8); climbing = true; } // lets itself down
    else if (ph < 300) len = LEN + Math.sin(t * 0.7) * 1.2; // hangs, breathing a little on the thread
    else if (ph < 308) { len = LEN * (1 - smooth((ph - 300) / 8)); climbing = true; } // climbs back up
    else return;
    if (len < 1) return;
    // now and then a gust swings it: a pendulum that dies down
    const gust = Math.floor(t / 14), gt = t - gust * 14, amp = ((gust * 7919) % 5 > 1 ? 0.35 : 0.12) * Math.exp(-gt * 0.45);
    const a = amp * Math.sin(gt * 2.6) + 0.03 * Math.sin(t * 0.9);
    const sx = Math.round(ax + Math.sin(a) * len), sy = Math.round(ay + Math.cos(a) * len);
    for (let i = 0; i <= len; i++) { const f = i / len; buf.set(Math.round(ax + Math.sin(a * f) * len * f), Math.round(ay + Math.cos(a * f) * len * f), i % 2 ? C.star2 : C.moonRim2); }
    // the spider: a round body, a small head, four legs a side (they paddle while it climbs)
    const ink = pk(0x120a22), body = pk(0x2a1c44), w = climbing && Math.floor(t * 12) % 2;
    for (const s of [-1, 1]) for (let l = 0; l < 4; l++) {
      const ly = sy + l - 1, kx = sx + s * (3 + (l === 1 || l === 2 ? 1 : 0)), kne = ly - (l < 2 ? 1 : -1) + (w && l % 2 ? 1 : 0);
      buf.set(sx + s * 2, ly, ink); buf.set(kx, kne, ink); buf.set(kx + s, kne + (l < 2 ? -1 : 1), ink);
    }
    buf.rect(sx - 2, sy - 1, 5, 4, ink); buf.rect(sx - 1, sy - 1, 3, 3, body); buf.set(sx - 1, sy - 1, C.rimS);
    buf.rect(sx - 1, sy - 3, 3, 2, ink); buf.set(sx - 1, sy - 2, C.redD); buf.set(sx + 1, sy - 2, C.redD);
  }
  drawEyes(se) {
    for (const e of this.eyes) {
      if (e.side !== this.sc.side || se < 0.15 + (e.ph % 1) * 0.5 || se > 4.3) continue;
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
    const { buf, cx, potY: fy } = this, g = this.glowV, E = Math.min(1, this.boilE), fe = this.fireE, fl = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    // flames behind the pot, licking up its sides
    const flames = (half, base, amp, k, y0, front) => {
      for (let x = -half; x <= half; x++) {
        const h = Math.max(0, (base * (1 + 1.5 * fe) + amp * fl * 0.4) * (1 - (x / (half + 1)) ** 2) * (0.62 + 0.38 * Math.sin(x * 1.7 + tq * 9 + k) * Math.sin(x * 0.9 - tq * 5.3 + k)));
        for (let j = 0; j < h; j++) {
          const f = j / h - fe * 0.12; // a hotter, whiter core when it flares
          buf.set(cx + x, y0 - j, C.fire[f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : f < 0.92 ? 3 : 4]);
        }
        if (!front && h > 4 && (x + Math.floor(tq * 12)) % 5 === 0) buf.set(cx + x, y0 - h - 2, C.fire[3]); // a loose tongue tip
      }
    };
    flames(Math.round(20 * (1 + 0.3 * fe)), 10, 7, 0, fy - 3, false);
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
    const boil = g > 0.62 || E > 0.2, ry0b = ry0 - (E > 0.5 ? 1 : 0); // the brew swells when it boils hard
    L.ellipse(ox, ry0b, 17, 2.8, C.brewD);
    L.ellipse(ox, ry0b + 0.4, 16, 2.2, boil ? C.brew : C.brewM);
    L.ellipse(ox - 1, ry0b + 0.8, 11, 1.3, boil ? C.brewL : C.brew);
    const sp = Math.floor(tq * 6);
    for (let i = 0; i < 5; i++) { const bx = ox - 12 + ((i * 7 + sp * 3) % 24); L.set(bx, ry0 + (i % 2), C.brewL); L.set(bx + 1, ry0 + (i % 2) - 1, C.brewL); }
    if (boil) for (let x = -15; x <= 15; x += E > 0.5 ? 1 : 2) if ((x + sp) % 3) L.set(ox + x, ry0b - 2 - (E > 0.7 && (x + sp) % 2 ? 1 : 0) + (Math.abs(x) > 12 ? 1 : 0), C.brewL); // foam heaving over
    for (let x = -14; x <= 14; x += 3) if (g > 0.55) L.set(ox + x, ry0 + 5, mix(C.pot[3], C.green, 0.45)); // glow on the rim's underside
    L.outline(C.K);
    for (let x = -16; x <= 16; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 16 - y * 5) buf.set(cx + x, fy + y, mix(buf.get(cx + x, fy + y), C.black, 0.5));
    buf.blit(L, cx - ox, fy - oy);
    this.mouth = { x: cx, y: fy - oy + ry0 };
    // a fresh hit of the spell: a column of glowing brew jumps out of the pot; while it boils hard, steam keeps rising
    this.jetE = Math.max(0, (this.jetE || 0) - dt * 2.4);
    if (this.jetE > 0.02) {
      const h = Math.round(38 * Math.sin(Math.min(1, this.jetE) * Math.PI * 0.5) * (0.85 + 0.15 * Math.sin(t * 40))), top = this.mouth.y - 1 - h;
      for (let y = top; y < this.mouth.y; y++) {
        const f = (y - top) / Math.max(1, h), hw = Math.round(1 + f * 3 * this.jetE);
        for (let x = -hw - 2; x <= hw + 2; x++) {
          const X = cx + x + Math.round(Math.sin(y * 0.4 + t * 9)), inner = Math.abs(x) <= hw;
          if (inner) buf.set(X, y, Math.abs(x) < hw * 0.5 || f < 0.15 ? C.white : Math.abs(x) < hw ? C.brewL : C.brew);
          else if (bayer(X, y) < 0.5 * this.jetE) buf.set(X, y, mix(buf.get(X, y), C.green, 0.45)); // its glow
        }
      }
    }
    const ns = Math.max(0, E - 0.3) * 18 * dt;
    for (let i = 0; i < ns; i++) if (Math.random() < ns - i) this.parts.push({ k: "steam", x: cx + (Math.random() - 0.5) * 22, y: this.mouth.y - 2, vx: (Math.random() - 0.5) * 6, vy: -14 - Math.random() * 12, t0: t, life: 1.6 + Math.random() * 1, r: 1.5 + Math.random() * 1.5 });
    // boiling hard, the brew runs over the rim and down the sides
    if (E > 0.5) for (const [i, dx] of [-18, -13, -7, 4, 10, 16].entries()) {
      const len = Math.round(clamp((E - 0.5) * 2) * (3 + ((i * 5) % 4) * 2)), y0 = this.mouth.y + 3 + (Math.abs(dx) > 14 ? 0 : 2);
      for (let j = 0; j < len; j++) buf.set(cx + dx, y0 + j, j === len - 1 ? C.brewL : j % 3 ? C.brew : C.brewM);
    }
    // small flames in front between the legs, then the crossed logs with glowing ends, ash
    flames(Math.round(9 * (1 + 0.3 * fe)), 6, 4, 2, fy - 1, true);
    for (const s of [-1, 1]) {
      buf.line(cx - 17 * s, fy + 3, cx + 13 * s, fy - 2, C.K, 6); buf.line(cx - 17 * s, fy + 3, cx + 13 * s, fy - 2, s < 0 ? C.log : C.logD, 4); buf.line(cx - 17 * s, fy + 2, cx + 13 * s, fy - 3, C.logL, 1);
      buf.set(cx + 13 * s, fy - 2, C.ember); buf.set(cx + 12 * s, fy - 1, C.fire[2]);
    }
    for (let x = -8; x <= 8; x += 2) buf.set(cx + x, fy + 3, (x + sp) % 4 ? C.ash : C.ember);
    const ne = (2.5 + fe * 30) * dt;
    for (let i = 0; i < ne; i++) if (Math.random() < ne - i) this.parts.push({ k: "ember", x: cx + (Math.random() < 0.5 ? -1 : 1) * (19 + Math.random() * 5), y: fy - 6, vx: (Math.random() - 0.5) * 10, vy: -16 - Math.random() * (18 + fe * 30), t0: t, life: 0.6 + Math.random() * 0.5 });
    // green motes; on the boil, bubbles swell and burst
    const rate = (0.25 + E * 2.2) * dt * 12;
    for (let i = 0; i < rate; i++) if (Math.random() < rate - i) this.parts.push({ k: "mote", x: cx + (Math.random() - 0.5) * 24, y: this.mouth.y - 1, t0: t, life: 1.2 + Math.random() * 1.2, ph: Math.random() * 6, v: 9 + Math.random() * 10 });
    // bubbles: a lazy one now and then; under the spell they come thick and big, and the brew spits droplets
    const nb = (g > 0.62 && E < 0.2 ? 30 : 1.5 + E * 50) * dt;
    for (let i = 0; i < nb; i++) if (Math.random() < nb - i) this.parts.push({ k: "boil", x: cx + Math.round((Math.random() - 0.5) * 26), y: this.mouth.y, t0: t, life: 0.3 + Math.random() * 0.25, r: 1 + Math.random() * (0.8 + E * 2.2) });
    const nd = Math.max(0, E - 0.4) * 14 * dt;
    for (let i = 0; i < nd; i++) if (Math.random() < nd - i) this.parts.push({ k: "drop", x: cx + (Math.random() - 0.5) * 24, y: this.mouth.y - 1, vx: (Math.random() - 0.5) * 30, vy: -25 - Math.random() * 35, t0: t, life: 0.7 });
  }

  // ---------- reaper ----------
  /** the music drop: he raises his hand, gathers light, throws a volley of wisps into the cauldron */
  spell(t) {
    if (this.spellT0 !== null && t - this.spellT0 < 2.6) return;
    this.spellT0 = t; this.wisps = 0;
  }
  reaperPose(t, tq, ears, se, sk) {
    const g = { face: "idle", rise: 0, shake: 0, blink: false, hemPh: t * 2.2, sway: Math.sin(t * 1.6 - 0.9), look: 0, grip: 0, glow: 0, bob: 0, drift: 0 };
    if (this.refPoses) { g.hand = { x: -11, y: -9 }; g.hemPh = tq * 5; g.sway = Math.sin(tq * 1.7); return g; }
    // idle: he hovers, drifts a little and now and then fidgets, like a waiting NPC
    g.bob = Math.sin(t * 1.6) * 2; g.drift = Math.sin(t * 0.37) * 2;
    let hand = [-9 + Math.sin(t * 0.9) * 0.8, 2 + Math.sin(t * 1.6 - 0.5)];
    if (!this.fid || t > this.fid.t1 + 1) {
      const k = pick(Math.random, ["look", "peer", "hand", "nod", "grip"]), dur = { look: 1.6, peer: 1.4, hand: 1.8, nod: 1.0, grip: 0.9 }[k], t0 = t + 1.5 + Math.random() * 3.5;
      this.fid = { k, t0, t1: t0 + dur, s: Math.random() < 0.5 ? -1 : 1 };
    }
    const F = this.fid, fe = t - F.t0, fu = clamp(fe / (F.t1 - F.t0)), env = smooth(clamp(fu * 5)) * smooth(clamp((1 - fu) * 5));
    if (fe >= 0 && fu < 1) {
      if (F.k === "look") g.look = Math.round(F.s * env); // glances aside
      else if (F.k === "peer") { g.look = -Math.round(env); g.rise = -env * 1.5; } // leans to peer into the pot
      else if (F.k === "hand") { const a = fu * Math.PI * 4; hand = [hand[0] + Math.cos(a) * 2.5 * env, hand[1] - 3 * env + Math.sin(a) * 2 * env]; } // idle circles of the hand
      else if (F.k === "nod") g.rise = -Math.abs(Math.sin(fu * Math.PI * 2)) * 1.5;
      else if (F.k === "grip") g.grip = -Math.round(2 * env); // shifts his grip on the scythe
    }
    const s = this.spellT0 === null ? 99 : t - this.spellT0, UP = [-7, -20], THROW = [-17, -6];
    if (s < 0.32) { const u = smooth(s / 0.32); hand = [lerp(hand[0], UP[0], u), lerp(hand[1], UP[1], u)]; g.glow = u; g.face = "cast"; g.rise = u * 2; }
    else if (s < 0.44) { const u = smooth((s - 0.32) / 0.12), o = Math.sin(u * Math.PI) * 3; hand = [lerp(UP[0], THROW[0], u) - o, lerp(UP[1], THROW[1], u)]; g.glow = 1; g.face = "cast"; g.rise = 2; }
    else if (s < 1.6) { const k = ((s - 0.44) % 0.16) / 0.16; hand = [THROW[0] - (1 - k) * 2, THROW[1] + (1 - k) * 0.5]; g.glow = 1; g.face = "cast"; g.rise = 2; }
    else if (s < 2.4) { const u = smooth((s - 1.6) / 0.8); hand = [lerp(THROW[0], hand[0], u), lerp(THROW[1], hand[1], u)]; g.glow = 1 - u; g.rise = 2 * (1 - u); }
    g.hand = { x: hand[0], y: hand[1] };
    g.blink = t % 4.3 < 0.13 && g.face === "idle";
    if (sk === "laugh" && se > 0.1 && se < 2.9) { g.face = "laugh"; g.shake = Math.floor(tq * 12) % 2 ? 1 : -1; g.rise = Math.min(3, se * 12); g.hand = { x: -8, y: 2 }; }
    else if (sk === "scream" && se > 0.25 && se < 4.3) { g.face = "scared"; g.look = this.sc.side; g.hand = { x: -5, y: -4 }; }
    else if (sk === "cat" && se > 0.5 && se < 1.8) { g.face = "scared"; g.rise = 4; g.hand = { x: -10, y: -10 }; }
    return g;
  }

  drawReaper(t, tq, ears, se, sk) {
    const g = this.reaperPose(t, tq, ears, se, sk);
    const L = this.condL, ox = 36, oy = 26;
    L.clear();
    // scythe (moves with his grip)
    const shx = ox + 13, top = oy - 10 + g.grip, bot = oy + 36 + g.grip;
    L.line(shx, top, shx - 1, bot, C.K, 4); L.line(shx, top, shx - 1, bot, C.wood, 2); L.line(shx, top + 1, shx - 1, bot, C.woodL, 1);
    const bc = { x: shx + 1, y: top + 12 }, R = 12;
    const arc = (fn) => { for (let a = -100; a <= -18; a += 2) { const f = (a + 100) / 82, w = 4 - f * 3, x = bc.x + Math.cos(a * D) * R, y = bc.y + Math.sin(a * D) * R; fn(x, y, w, a); } };
    arc((x, y, w) => L.disc(x, y, w / 2 + 1, C.K));
    arc((x, y, w, a) => { L.disc(x, y, Math.max(0, w / 2), C.blade); L.set(bc.x + Math.cos(a * D) * (R - w / 2), bc.y + Math.sin(a * D) * (R - w / 2), C.bladeM); });
    // robe with a ragged hem that trails the hover
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
    else if (g.face === "scared") { L.set(ex - 3, ey, C.eyeL); L.set(ex + 2, ey, C.eyeL); }
    else if (g.face === "cast") { L.rect(ex - 4, ey - 1, 2, 2, C.eyeL); L.rect(ex + 1, ey - 1, 2, 2, C.eyeL); L.set(ex - 5, ey, C.eye); L.set(ex + 3, ey, C.eye); }
    else if (g.blink) { L.rect(ex - 4, ey + 1, 2, 1, C.eye); L.rect(ex + 1, ey + 1, 2, 1, C.eye); }
    else { L.rect(ex - 4, ey - 1, 2, 2, C.eye); L.rect(ex + 1, ey - 1, 2, 2, C.eye); L.set(ex - 4, ey - 1, C.eyeL); L.set(ex + 1, ey - 1, C.eyeL); }
    const sleeveTo = (sx, sy, hx, hy, cuff) => {
      const n = Math.ceil(Math.hypot(hx - sx, hy - sy)) || 1, px = -(hy - sy) / n, py = (hx - sx) / n;
      for (let i = 0; i <= n; i++) { const t2 = i / n; L.disc(lerp(sx, hx, t2), lerp(sy, hy, t2), lerp(2.6, cuff, t2 * t2), C.robe); }
      for (let i = 0; i <= n; i++) { const t2 = i / n, w = lerp(2.6, cuff, t2 * t2), x = lerp(sx, hx, t2), y = lerp(sy, hy, t2); L.set(x + px * w * 0.8, y + py * w * 0.8, C.robeD); L.set(x - px * w * 0.8, y - py * w * 0.8, C.robeL); }
    };
    sleeveTo(ox + 6, oy + 11, shx - 3, oy + 16 + g.grip, 2.6);
    L.rect(shx - 3, oy + 15 + g.grip, 4, 4, C.glove); L.set(shx - 3, oy + 15 + g.grip, C.gloveL); L.set(shx, oy + 16 + g.grip, C.gloveL);
    const hx = ox - 6 + g.hand.x, hy = oy + 10 + g.hand.y, sx = ox - 6, sy = oy + 10;
    const hl = Math.hypot(hx - sx, hy - sy) || 1, ux = (hx - sx) / hl, uy = (hy - sy) / hl;
    sleeveTo(sx, sy, hx - ux * 2, hy - uy * 2, 4);
    L.disc(hx, hy, 1.6, C.glove);
    L.set(hx + ux * 2, hy + uy * 2, C.glove); L.set(hx + ux * 2 - uy * 1.5, hy + uy * 2 + ux * 1.5, C.glove); L.set(hx + ux * 2 + uy * 1.5, hy + uy * 2 - ux * 1.5, C.glove);
    L.set(hx - uy, hy + ux, C.gloveL);
    L.outline(C.K);

    const gx = this.cond.x + g.shake + Math.round(g.drift), gy = this.cond.y + Math.round(g.bob) - Math.round(g.rise);
    this.castHand = { x: gx - ox + hx + ux * 3, y: gy - oy + hy + uy * 3, ux, uy, cast: this.refPoses && g.face === "idle", glow: g.glow };
    this.condMouth = { x: gx, y: gy + 3 };
    // his shadow on the hill stays put and shrinks as he floats up
    const sy0 = this.groundTop(this.cond.x) + 6, sw = 11 - Math.round(this.cond.y - gy + 2) / 2;
    for (let x = -sw; x <= sw; x++) if (x % 6 !== 4) { this.buf.set(this.cond.x + x, sy0, C.K); if (Math.abs(x) < sw - 4) this.buf.set(this.cond.x + x, sy0 + 1, C.K); }
    for (let x = -6; x <= 4; x += 5) this.buf.set(this.cond.x + x, sy0 - 4 - (x & 1), C.K);
    this.buf.blit(L, gx - ox, gy - oy);
    // the hand glows while the spell gathers
    if (g.glow > 0.05) {
      const h = this.castHand, rr = 2 + g.glow * 3;
      for (let a = 0; a < 16; a++) { const x = Math.round(h.x + Math.cos((a / 16) * Math.PI * 2 + t * 6) * rr), y = Math.round(h.y + Math.sin((a / 16) * Math.PI * 2 + t * 6) * rr); if ((a + Math.floor(t * 24)) % 3) this.buf.set(x, y, a % 2 ? C.magic : C.magicL); }
      this.buf.set(h.x, h.y, C.white);
    }
  }

  // ---------- dancers: the still layout (review page and --ref) ----------
  drawDancer(q, ears) {
    const { d } = q, p = [MOVES.ring[0], MOVES.kick[0], MOVES.jump[0], MOVES.wave[1]][d.k], L = this.dl, ox = 32, oy = 66;
    d.shown = p;
    L.clear();
    this.skeleton(L, ox, oy, p, ears);
    L.outline(C.K);
    for (let x = -8; x <= 8; x++) for (let y = 0; y <= 1; y++) if (Math.abs(x) < 8 - y * 3) { const X = q.x + x, Y = q.fy + 1 + y; this.buf.set(X, Y, mix(this.buf.get(X, Y), C.black, 0.4)); }
    this.buf.blit(L, q.x - ox, q.fy - oy, false, q.front ? null : (c) => (c === C.K ? c : mix(c, C.vale, 0.12)));
  }

  // ---------- dancers (V7): a plan of dancing in place and turns, planted feet, a body on springs ----------
  /** the dance's own beat count: music beats (or a slow idle beat when nothing is heard), frozen while a scare plays */
  danceClock(t, ears, sk) {
    const ph = ears.active ? clamp(ears.phase, 0, 0.999) : clamp((t - this.idleT) / 0.75, 0, 0.999);
    const raw = this.beatN + ph, dB = clamp(raw - this.rawB, 0, 2);
    this.rawB = Math.max(this.rawB, raw);
    this.prevCB = this.cB;
    if (!sk) this.cB += dB;
    if (!this.plan) this.plan = this.newPlace(Math.floor(this.cB), ears);
    while (this.cB >= this.plan.b1) this.plan = this.plan.kind === "rot" || !ears.active ? this.newPlace(this.plan.b1, ears) : this.newRot(this.plan.b1);
  }
  newPlace(b0, ears) {
    const r = this.r, per = this.period || 0.5, idle = !ears.active;
    const bars = Math.max(2, Math.round(lerp(CHOREO.place[0], CHOREO.place[1], r()) / per / 4));
    const pool = PLACE_MOVES.slice().sort(() => r() - 0.5);
    const p = { kind: "place", b0, b1: b0 + bars * 4, moves: this.dancers.map((d, i) => (idle ? ["sway"] : [pool[i], pool[(i + 4) % pool.length]])) };
    if (!idle && (this.wantFlip || r() < CHOREO.flip)) {
      this.wantFlip = false;
      const d = this.dancers[Math.floor(r() * 4)];
      d.flipB = b0 + 4 * (1 + Math.floor(r() * (bars - 1)));
      d.flipDir = r() < 0.5 ? -1 : 1;
    }
    return p;
  }
  newRot(b0) {
    const r = this.r, per = this.period || 0.5;
    if (!this.bag || !this.bag.length) this.bag = Object.keys(ROTS).sort(() => r() - 0.5); // all four kinds before any repeats
    const rot = this.bag.pop(), R = ROTS[rot];
    const n = Math.max(4, 2 * Math.round(lerp(CHOREO.rot[0], CHOREO.rot[1], r()) / per / R.every / 2));
    const turn = R.turn * D * (r() < 0.5 ? -1 : 1), a0 = this.ringA;
    this.ringA = a0 + turn;
    // the foot that leads is the one on the side it travels to on screen
    const lead = this.dancers.map((d) => Math.sign(-Math.sin(a0 + d.k * Math.PI / 2) * turn) || 1);
    return { kind: "rot", rot, b0, b1: b0 + n * R.every, n, e: R.every, a0, a1: a0 + turn, lead };
  }
  placeKey(p, d, b) {
    if (p.kind !== "place" || b >= p.b1 || b < p.b0) return REST;
    const ms = p.moves[d.k], m = PLACE[ms[Math.floor((b - p.b0) / 8) % ms.length]];
    return m[(b - p.b0) % m.length];
  }
  /** where a foot must be and by which beat: {at, dur, a (ring angle), o (x offset), l (held lift), arc (lift on the way)} */
  footGoal(d, f, p, cB) {
    const base = (d.k * Math.PI) / 2;
    if (p.kind === "rot") {
      // step-together round the ring: the lead foot steps two notches ahead, the other closes up to it
      const R = ROTS[p.rot], i = Math.floor((cB - p.b0) / p.e), isLead = f.s === p.lead[d.k];
      const th = (j) => p.a0 + base + ((p.a1 - p.a0) * j) / p.n, land = (j) => (isLead ? Math.min(p.n, j + 2) : j + 1), mine = (j) => (j % 2 === 0) === isLead;
      if (i < p.n && mine(i)) return { at: p.b0 + (i + 1) * p.e, dur: p.e * 0.85, a: th(land(i)), o: f.s * 4, l: 0, arc: R.lift };
      let j = Math.min(i, p.n) - 1;
      while (j >= 0 && !mine(j)) j--;
      return { at: p.b0 + (j + 1) * p.e, dur: p.e * 0.85, a: th(j < 0 ? 0 : land(j)), o: f.s * 4, l: 0, arc: R.lift };
    }
    const b = Math.floor(cB) + 1, key = this.placeKey(p, d, b), F = f.s < 0 ? key.L : key.R;
    return { at: b, dur: 0.45, a: this.ringA + base, o: F[0], l: F[1], arc: 2.5 };
  }
  stepFoot(d, f, g, cB) {
    const id = g.at + "|" + g.a.toFixed(4) + "|" + g.o + "|" + g.l;
    if (id !== f.id) { f.id = id; f.from = { a: f.a, o: f.o, l: f.l }; }
    const F = f.from, u = clamp((cB - (g.at - g.dur)) / g.dur), e = smooth(u);
    const moved = Math.abs(g.o - F.o) > 1 || Math.abs(g.a - F.a) > 0.01, was = f.l;
    f.a = lerp(F.a, g.a, e); f.o = lerp(F.o, g.o, e);
    f.l = lerp(F.l, g.l, e) + (moved ? g.arc * Math.sin(Math.PI * u) : 0);
    if (f.l > f.peak) f.peak = f.l;
    if (was > 0.6 && f.l <= 0.6) { d.s.dy.v += 10 + f.peak * 5; if (f.peak > 3.5) f.dust = true; f.peak = 0; } // the foot comes down and the body takes the weight
  }
  footWorld(f) { return [this.cx + Math.cos(f.a) * this.ring.rx + f.o, this.potY + 1 + Math.sin(f.a) * this.ring.ry]; }

  updateDancer(d, t, dt, ears, se, sk) {
    const p = this.plan, cB = this.cB, per = this.period || 0.5, ox = 32, oy = 66;
    if (!sk) for (const f of d.feet) this.stepFoot(d, f, this.footGoal(d, f, p, cB), cB);
    const a = (d.feet[0].a + d.feet[1].a) / 2;
    d.ang = a; d.x = this.cx + Math.cos(a) * this.ring.rx; d.fy = this.potY + 1 + Math.sin(a) * this.ring.ry;
    // what the body aims at
    let key, lift = 0, low = 0, spin = 0, fk = null, pile = false, rotA = 0;
    if (p.kind === "rot") {
      const R = ROTS[p.rot], sg = (cB - p.b0) / p.e, u = sg - Math.floor(sg);
      key = rotKey(p.rot, clamp(Math.floor(sg + 0.5), 0, p.n - 1));
      key = { ...key, lean: key.lean + p.lead[d.k] }; // leaning into the way it goes
      low = R.low;
      if (R.hop) lift = R.hop * Math.sin(Math.PI * u);
      if (R.spin) { const q = ((cB - p.b0) % 4) / 3; spin = q < 1 ? smooth(q) * Math.PI * 2 : 0; }
    } else {
      key = this.placeKey(p, d, Math.floor(cB + 0.5)); // aim at the coming beat from half a beat before
      const b = Math.floor(cB) + 1, nk = this.placeKey(p, d, b);
      if (nk.air) { const u = clamp((cB - (b - 0.7)) / 0.7); lift = nk.air * 4 * u * (1 - u); }
    }
    // the somersault: crouch for a beat, two beats in the air turning over, land deep in the knees
    const fe = cB - d.flipB;
    if (fe >= 0 && fe < 4 && !sk) {
      if (fe < 1) key = K({ dy: 6.5, aL: 15, fL: -30, aR: 15, fR: -30, jaw: 1 });
      else if (fe < 3) { const u = (fe - 1) / 2; lift = 26 * 4 * u * (1 - u); rotA = (Math.round(u * 12) / 12) * Math.PI * 2 * d.flipDir; key = { ...SPECIAL.tuck, dy: 0 }; fk = SPECIAL.tuck; }
      else key = K({ dy: 6, aL: 120, fL: 30, aR: 120, fR: 30 });
      spin = 0;
    }
    const trem = Math.floor(t * 12 + d.seed * 4) % 2 ? 1 : 0;
    if (sk) { lift = 0; spin = 0; }
    if (sk === "laugh" && se > 0.2 && se < 2.7) key = K({ ...SPECIAL.cower, lean: trem });
    else if (sk === "boo") {
      if ((se > 0.6 && se < 0.72) || (se >= 2.6 && se < 2.8)) { key = SPECIAL.fall; fk = SPECIAL.fall; }
      else if (se >= 0.72 && se < 2.6) pile = true;
    } else if (sk === "scream" && se > 0.3 && se < 4.3) key = K({ ...SPECIAL.freeze, look: this.sc.side, lean: trem * this.sc.side });
    else if (sk === "cat" && ((se > 0.7 && se < 1.6) || (this.catX !== undefined && Math.abs(this.catX - d.x) < 30))) { key = SPECIAL.startle; fk = SPECIAL.startle; }

    // springs: arms overshoot and settle, the hips sink on each beat, the chest and the skull follow late
    const S = d.s, wA = clamp(7.5 / per, 9, 18) * (sk ? 1.6 : 1);
    for (const k of ["aL", "fL", "aR", "fR"]) spring(S[k], key[k], wA, 0.42, dt);
    for (const k of ["lean", "tilt", "jaw", "look"]) spring(S[k], key[k] || 0, wA * 1.2, 0.6, dt);
    const loc = d.feet.map((f) => { const [x, y] = this.footWorld(f); return [x - d.x, y - d.fy]; });
    const [fl, fr] = d.feet;
    let mx = (loc[0][0] + loc[1][0]) / 2;
    if (fl.l > 1 && fr.l <= 1) mx = lerp(mx, loc[1][0], 0.6);
    else if (fr.l > 1 && fl.l <= 1) mx = lerp(mx, loc[0][0], 0.6);
    spring(S.hx, mx + (key.hx || 0), 14, 0.55, dt);
    if (Math.floor(cB) > Math.floor(this.prevCB) && !sk) S.dy.v += p.kind === "rot" ? 13 : 19; // down into the knees on the beat
    spring(S.dy, (key.dy || 0) * (fk ? 1 : 0.65) + low, 16, 0.42, dt);
    S.dy.x = clamp(S.dy.x, -4, 9);
    if (d.lift > 0.5 && lift <= 0.5) { S.dy.v += 36 + d.peakLift * 6; d.dust = 2; d.peakLift = 0; } // landing from a hop or a somersault
    d.lift = lift; d.peakLift = Math.max(d.peakLift, lift);
    const bodyY = S.dy.x - lift;
    spring(S.cx, S.hx.x, 26, 0.4, dt); spring(S.cy, bodyY, 26, 0.4, dt);
    spring(S.hdx, S.cx.x, 20, 0.32, dt); spring(S.hdy, S.cy.x, 20, 0.32, dt);
    const lag = (v) => clamp(v, -1.6, 1.6);
    // dust where a foot or the whole body comes down
    for (const [i, f] of d.feet.entries()) if (f.dust || d.dust) {
      f.dust = false;
      const [x, y] = this.footWorld(f);
      for (const s of [-1, 1]) this.parts.push({ k: "dust", x: x + s * 2, y, vx: s * (8 + Math.random() * 10), t0: t, life: 0.3 + Math.random() * 0.15 });
      if (i === 1) d.dust = 0;
    }
    const hipX = ox + S.hx.x + S.lean.x * 0.5, hipY = oy - 21 + S.dy.x, cX = ox + S.hx.x + S.lean.x + lag(S.cx.x - S.hx.x), cY = hipY + lag(S.cy.x - bodyY);
    d.r = {
      hip: [hipX, hipY], chest: [cX, cY], head: [cX + S.tilt.x + lag(S.hdx.x - S.cx.x) + (key.sx || 0), cY + lag(S.hdy.x - S.cy.x) + (key.sy || 0)],
      aL: S.aL.x, fL: S.fL.x, aR: S.aR.x, fR: S.fR.x, jaw: S.jaw.x, look: S.look.x, front: key.front,
      fk, pile, lift, rotA, spin, back: spin && Math.cos(spin) < 0,
      feet: loc.map(([x, y], i) => [ox + x, oy + y - d.feet[i].l + lift * 0.35]),
    };
  }

  drawDancer2(q, ears) {
    const { d } = q, r = d.r, ox = 32, oy = 66, L = this.dl;
    L.clear();
    if (r.pile) this.pile(L, ox, oy, d);
    else this.rig(L, r, ears);
    L.outline(C.K);
    let out = L;
    if (r.rotA) out = rotateBuf(out, ox, oy - 16, r.rotA);
    if (r.spin) out = squeeze(out, ox, Math.cos(r.spin));
    // contact shadows: a small one under each foot (smaller as it lifts), a faint one under the body
    const X = Math.round(d.x), Y = Math.round(d.fy);
    for (const f of d.feet) {
      const [fx, fy] = this.footWorld(f), hw = Math.round(3 - (f.l + r.lift) / 3);
      for (let x = -hw; x <= hw; x++) { const xx = Math.round(fx) + x, yy = Math.round(fy) + 1; this.buf.set(xx, yy, mix(this.buf.get(xx, yy), C.black, 0.45)); }
    }
    for (let x = -6; x <= 6; x++) if (Math.abs(x) < 6 - r.lift / 5) { const yy = Y + 2; this.buf.set(X + x, yy, mix(this.buf.get(X + x, yy), C.black, 0.22)); }
    this.buf.blit(out, X - ox, Y - oy - Math.round(r.lift), false, q.front ? null : (c) => (c === C.K ? c : mix(c, C.vale, 0.12)));
  }

  /** a skeleton from solved joints: hips, chest and skull positions, arm angles, feet reached by two-bone legs (or leg angles in r.fk) */
  rig(L, r, ears) {
    const bone = (x0, y0, x1, y1) => {
      L.line(x0, y0, x1, y1, C.K, 4); L.line(x0, y0, x1, y1, C.bone, 2);
      const n = Math.hypot(x1 - x0, y1 - y0) || 1, sx = (y1 - y0) / n > 0 ? 1 : -1;
      L.line(x0 + sx * 0.7, y0 + 0.4, x1 + sx * 0.7, y1 + 0.4, C.boneM, 1);
      L.set(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), C.bone);
    };
    const knob = (x, y) => { L.disc(x, y, 1.6, C.bone); L.set(x + 1, y + 1, C.boneM); };
    const [hx, hy] = r.hip, [cx, cy] = r.chest;
    for (const [i, side] of [[0, -1], [1, 1]]) {
      const x0 = hx + side * 2, y0 = hy + 1;
      let x1, y1, x2, y2;
      if (r.fk) {
        const u = side < 0 ? r.fk.uL : r.fk.uR, k = side < 0 ? r.fk.kL : r.fk.kR, a1 = u * D, a2 = (u + k) * D;
        x1 = x0 + side * Math.sin(a1) * 10; y1 = y0 + Math.cos(a1) * 10; x2 = x1 + side * Math.sin(a2) * 10; y2 = y1 + Math.cos(a2) * 10;
      } else [x1, y1, x2, y2] = ik(x0, y0, r.feet[i][0], r.feet[i][1], side);
      bone(x0, y0, x1, y1); bone(x1, y1, x2, y2); knob(x1, y1);
      L.line(x2, y2, x2 + side * 3, y2 + 1, C.K, 4); L.line(x2, y2, x2 + side * 3, y2 + 1, C.bone, 2); L.set(x2 + side * 4, y2 + 1, C.bone); L.set(x2 - side, y2 + 1, C.boneM);
    }
    L.blit(PELVIS, Math.round(hx) - 4, Math.round(hy) - 1);
    for (let y = Math.round(hy) - 2; y > Math.round(cy) - 7; y--) { const u = clamp((hy - y) / 6), x = Math.round(lerp(hx, cx, u)); L.set(x, y, y % 2 ? C.bone : C.boneM); L.set(x + 1, y, y % 2 ? C.boneM : C.boneD); }
    L.blit(RIBS, Math.round(cx) - 5, Math.round(cy) - 15);
    const shY = cy - 14;
    const arms = () => {
      for (const [side, a, f] of [[-1, r.aL, r.fL], [1, r.aR, r.fR]]) {
        const x0 = cx + side * 5, a1 = a * D, a2 = (a + f) * D;
        const x1 = x0 + side * Math.sin(a1) * 8, y1 = shY + Math.cos(a1) * 8, x2 = x1 + side * Math.sin(a2) * 8, y2 = y1 + Math.cos(a2) * 8;
        bone(x0, shY, x1, y1); bone(x1, y1, x2, y2); knob(x1, y1);
        const fx2 = side * Math.sin(a2), fy2 = Math.cos(a2);
        L.disc(x2, y2, 2.2, C.K); L.disc(x2, y2, 1.3, C.bone);
        for (const o of [-1, 0, 1]) L.set(x2 + fx2 * 2.6 - fy2 * o, y2 + fy2 * 2.6 + fx2 * o, C.bone);
        L.set(x2 - fy2 * 2, y2 + fx2 * 2, C.boneM);
      }
    };
    if (!r.front) arms();
    const sx = Math.round(r.head[0]) - 6, sy = Math.round(r.head[1]) - 28;
    L.blit(SKULL, sx, sy);
    if (r.back) L.rect(sx + 2, sy + 10, 8, 1, C.boneM); // the back of the head: no face
    else {
      const lk = Math.round(clamp(r.look, -1, 1));
      for (const ex of [2, 8]) {
        const X = sx + ex + lk;
        L.rect(X, sy + 4, 3, 3, C.ink); L.set(X + (ex < 5 ? 0 : 2), sy + 4, C.bone); L.set(X + 1, sy + 7, C.ink);
        L.set(X + (ex < 5 ? 0 : 2), sy + 7, C.boneM);
      }
      if (ears.pulse > 0.6) { L.set(sx + 3 + lk, sy + 5, C.eye); L.set(sx + 9 + lk, sy + 5, C.eye); }
      L.set(sx + 6, sy + 8, C.ink); L.set(sx + 6, sy + 9, C.boneM);
      L.blit(JAW, sx + 2, sy + 11 + Math.round(clamp(r.jaw, 0, 1.4)));
    }
    if (r.front) arms();
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
      const h = this.castHand, s = this.spellT0 === null ? 99 : t - this.spellT0;
      if (h && !this.refPoses) {
        // the hand gathers light, then throws a wisp every 0.16 s into the pot
        if (s < 0.42) { const n = 50 * dt; for (let i = 0; i < n; i++) if (Math.random() < n - i) this.parts.push({ k: "gather", h, a: Math.random() * Math.PI * 2, r0: 7 + Math.random() * 7, t0: t, life: 0.28 }); }
        const due = s >= 0.44 && s < 1.6 ? Math.min(8, Math.floor((s - 0.44) / 0.16) + 1) : 0;
        while (this.mouth && this.wisps < due) {
          this.wisps++;
          this.parts.push({ k: "wisp", x0: h.x, y0: h.y, x1: this.cx + (Math.random() - 0.5) * 18, y1: this.mouth.y - 1, arc: 12 + Math.random() * 14, t0: t, life: 0.55 + Math.random() * 0.2, j: Math.random() });
        }
      }
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
      if (age >= 1) {
        if (q.k === "wisp") { // a wisp hits the brew: a splash, and the cauldron boils harder
          this.boilE = Math.min(1.25, this.boilE + 0.2);
          this.jetE = 1; // the brew shoots up in a glowing column
          for (let i = 0; i < 7; i++) keep.push({ k: "drop", x: q.x1, y: q.y1, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 50, t0: t, life: 0.6 + Math.random() * 0.3 });
          for (let i = 0; i < 14; i++) keep.push({ k: "geyser", x: this.cx + (Math.random() - 0.5) * 10, y: q.y1, vx: (Math.random() - 0.5) * 40, vy: -90 - Math.random() * 70, t0: t, life: 0.9 + Math.random() * 0.4 });
          for (let i = 0; i < 6; i++) keep.push({ k: "steam", x: this.cx + (Math.random() - 0.5) * 20, y: q.y1 - 2, vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 16, t0: t, life: 1.6 + Math.random() * 0.8, r: 2 + Math.random() * 2 });
        }
        continue;
      }
      keep.push(q);
      const top = q.k === "spark" || q.k === "ha" || q.k === "wisp" || q.k === "gather";
      if (top !== (layer === "top")) continue;
      if (q.k === "mote") {
        const e = t - q.t0, x = Math.round(q.x + Math.sin(e * 3 + q.ph) * 2), y = Math.round(q.y - e * q.v);
        if (age > 0.75 && (x + y) % 2) continue;
        buf.set(x, y, age < 0.35 ? C.brewL : age < 0.7 ? C.brew : C.brewM);
      } else if (q.k === "drop") {
        const e = t - q.t0;
        buf.set(q.x + q.vx * e, q.y + q.vy * e + 110 * e * e, age < 0.3 ? C.brewL : age < 0.7 ? C.brew : C.brewM);
      } else if (q.k === "geyser") {
        // droplets of glowing brew flung high, falling back under gravity
        const e = t - q.t0, x = Math.round(q.x + q.vx * e), y = Math.round(q.y + q.vy * e + 150 * e * e), c = age < 0.25 ? C.white : age < 0.55 ? C.brewL : C.brew;
        buf.set(x, y, c);
        if (age < 0.5) { buf.set(x, y + 1, C.brewL); buf.set(x + 1, y, C.brew); }
        if (age < 0.35) buf.set(x, y + 2, C.brew);
      } else if (q.k === "steam") {
        // glowing steam: a soft puff that swells, drifts up and thins out (light laid over the picture, not a solid blob)
        const e = t - q.t0, cx2 = q.x + q.vx * e + Math.sin(e * 2 + q.r) * 2, cy2 = q.y + q.vy * e, r = q.r + age * 6, a = (1 - age) * 0.55;
        for (let y = Math.floor(cy2 - r); y <= cy2 + r; y++) for (let x = Math.floor(cx2 - r); x <= cx2 + r; x++) {
          const d = Math.hypot(x - cx2, y - cy2) / r;
          if (d > 1 || bayer(x, y) > (1 - d) * 1.6) continue;
          buf.set(x, y, mix(buf.get(x, y), d < 0.4 && age < 0.4 ? C.brewL : C.green, a * (1 - d * 0.6)));
        }
      } else if (q.k === "dust") {
        const e = t - q.t0, x = Math.round(q.x + q.vx * e), y = Math.round(q.y - 4 * e);
        if (age < 0.6 || (x + y) % 2) buf.set(x, y, age < 0.4 ? C.gr[0] : C.gr[2]);
      } else if (q.k === "gather") {
        const rr = q.r0 * (1 - age), x = Math.round(q.h.x + Math.cos(q.a) * rr), y = Math.round(q.h.y + Math.sin(q.a) * rr);
        buf.set(x, y, age > 0.6 ? C.magicL : C.magic);
      } else if (q.k === "wisp") {
        // a ball of cold fire on an arc, with a trail
        const pos = (u) => [lerp(q.x0, q.x1, u), lerp(q.y0, q.y1, u) - q.arc * 4 * u * (1 - u)];
        for (let k = 6; k >= 1; k--) { const u = age - k * 0.035; if (u < 0) continue; const [x, y] = pos(u); if (k > 3 && (Math.round(x) + Math.round(y)) % 2) continue; buf.set(x, y, k > 4 ? C.magicP : k > 2 ? C.magic : C.magicL); }
        const [x, y] = pos(age), big = Math.floor(t * 24 + q.j * 5) % 3;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) buf.set(x + dx, y + dy, C.magicL);
        if (big) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, -2]]) buf.set(x + dx, y + dy, C.magic);
        buf.set(x, y, C.white);
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

  // ---------- BOO (V8): the screamer, a flipbook of six drawn frames ----------
  // Timeline (SCARES.boo, 3 s, the sound hits at 0.6): dark; frame 1 slams in with only the eyes lit, the face surfaces; frame 2 creeps
  // closer with the jaw opening; on the scream frame 5 punches in, then frame 6 (flaming eyes) holds, twitching to 3 and 4; he sinks back.
  drawBoo(t, tq, se) {
    const { W, H } = this;
    if (!this.booF) this.booF = decodeBoo();
    const seq = [[0.1, 0], [0.32, 1], [0.6, 4], [0.68, 5], [0.9, 2], [0.98, 5], [1.2, 3], [1.28, 5]];
    let f = -1;
    for (const [at, k] of seq) if (se >= at) f = k;
    const z = se < 0.1 ? 0 : se < 0.2 ? lerp(0.6, 1.06, smooth((se - 0.1) / 0.1)) : se < 0.3 ? lerp(1.06, 1, smooth((se - 0.2) / 0.1)) : se < 0.6 ? lerp(1, 1.08, (se - 0.3) / 0.3)
      : se < 0.75 ? 1 + 0.16 * (1 - (se - 0.6) / 0.15) : se < 2.1 ? 1 : se < 2.6 ? lerp(1, 0.7, smooth((se - 2.1) / 0.5)) : 0.7;
    const light = se < 0.14 ? 0 : se < 0.5 ? smooth((se - 0.14) / 0.36) : se < 2.1 ? 1 : 1 - smooth(clamp((se - 2.1) / 0.45)); // the face out of the dark
    const eyes = se < 0.12 ? 0 : se < 0.24 ? (Math.floor(se * 40) % 2 ? 1 : 0.35) : se < 2.6 ? 1 : 1 - clamp((se - 2.6) / 0.25);
    const scream = se > 0.6 && se < 2.1, shx = scream ? (Math.floor(tq * 12) % 2 ? 2 : -2) : 0, shy = scream ? (Math.floor(tq * 12) % 3) - 1 : 0;
    const dark = se < 0.1 ? se / 0.1 : se < 2.75 ? 1 : 1 - clamp((se - 2.75) / 0.25);
    this.dim(0.92 * dark);
    if (f >= 0 && z > 0 && se < 2.85) {
      const F = this.booF[f], hot = scream ? Math.floor(tq * 12) % 3 : 1; // the eye fire flickers through three heats
      const src = light >= 1 && eyes >= 1 ? F.heat[hot] : this.booLit(F, light, eyes, hot);
      this.blitZoom(src, (H / 180) * F.base * z, F.eye[0], F.eye[1], Math.round(W / 2) + shx, Math.round(H * 0.4) + shy);
    }
    if (se > 0.6 && se < 0.67) for (let i = 0; i < this.buf.d.length; i++) this.buf.d[i] = mix(this.buf.d[i], C.redD, 0.35); // a red flash on the scream
  }
  /** a frame half out of the dark: everything darkened by `light`, the glowing reds kept at `eyes` */
  booLit(F, light, eyes, hot) {
    const S = F.heat[hot], L = this.booTmp && this.booTmp.w === S.w && this.booTmp.h === S.h ? this.booTmp : (this.booTmp = new Buf(S.w, S.h));
    for (let i = 0; i < S.d.length; i++) {
      const c = S.d[i];
      if (!c) { L.d[i] = 0; continue; }
      const k = F.glow[i] ? Math.max(light, eyes) : light;
      L.d[i] = k >= 1 ? c : k <= 0 ? (F.glow[i] ? 0 : C.black) : mix(C.black, c, Math.round(k * 5) / 5);
    }
    return L;
  }
  /** nearest-neighbour blit at any zoom: source point (ax, ay) lands on (tx, ty) */
  blitZoom(src, k, ax, ay, tx, ty) {
    const { W, H } = this, d = this.buf.d;
    const x0 = Math.max(0, Math.floor(tx - ax * k)), x1 = Math.min(W, Math.ceil(tx + (src.w - ax) * k)), y0 = Math.max(0, Math.floor(ty - ay * k)), y1 = Math.min(H, Math.ceil(ty + (src.h - ay) * k));
    for (let y = y0; y < y1; y++) {
      const sy = Math.floor((y - ty) / k + ay);
      if (sy < 0 || sy >= src.h) continue;
      for (let x = x0; x < x1; x++) {
        const sx = Math.floor((x - tx) / k + ax);
        if (sx < 0 || sx >= src.w) continue;
        const c = src.d[sy * src.w + sx];
        if (c) d[y * W + x] = c;
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
