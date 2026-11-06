// Pixel core: a native-resolution RGBA buffer (0 = transparent), outline pass, sprites from ASCII rows, a tiny 5x7 font.
export const pk = (rgb) => (0xff000000 | ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff)) >>> 0;
export const unpk = (c) => [c & 255, (c >> 8) & 255, (c >> 16) & 255];
export const mix = (a, b, t) => {
  const ar = a & 255, ag = (a >> 8) & 255, ab = (a >> 16) & 255, br = b & 255, bg = (b >> 8) & 255, bb = (b >> 16) & 255;
  return (0xff000000 | (Math.round(ab + (bb - ab) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ar + (br - ar) * t)) >>> 0;
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered-dither threshold 0..1 */
export const bayer = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// seeded random (mulberry32)
export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  clear(c = 0) { this.d.fill(c); }
  set(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  disc(cx, cy, r, c) {
    const r2 = r * r + r * 0.8;
    for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) if (x * x + y * y <= r2) this.set(cx + x, cy + y, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++)
      if ((x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01) <= 1.05) this.set(cx + x, cy + y, c);
  }
  /** Bresenham line; th > 1 stamps discs */
  line(x0, y0, x1, y1, c, th = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (th <= 1) this.set(x0, y0, c); else this.disc(x0, y0, (th - 1) / 2, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** copy non-transparent pixels; flip mirrors horizontally; tint(c) remaps colours */
  blit(src, dx, dy, flip = false, tint = null) {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      for (let x = 0; x < src.w; x++) {
        const c = src.d[y * src.w + (flip ? src.w - 1 - x : x)];
        if (!c) continue;
        const tx = dx + x;
        if (tx < 0 || tx >= this.w) continue;
        this.d[ty * this.w + tx] = tint ? tint(c) : c;
      }
    }
  }
  /** integer upscale blit, centred on (cx, cy) of the source mapped to (tx, ty) */
  blitScaled(src, s, tx, ty, cx, cy) {
    const ox = Math.round(tx - cx * s), oy = Math.round(ty - cy * s);
    const y0 = Math.max(0, oy), y1 = Math.min(this.h, oy + src.h * s), x0 = Math.max(0, ox), x1 = Math.min(this.w, ox + src.w * s);
    for (let y = y0; y < y1; y++) {
      const row = Math.floor((y - oy) / s) * src.w;
      for (let x = x0; x < x1; x++) {
        const c = src.d[row + Math.floor((x - ox) / s)];
        if (c) this.d[y * this.w + x] = c;
      }
    }
  }
  /** 1 px outline around opaque pixels (4-neighbour) */
  outline(c) {
    const { w, h, d } = this, src = d.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (src[i]) continue;
      if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) d[i] = c;
    }
  }
}

/** ASCII rows + letter palette -> Buf ('.' or ' ' = transparent) */
export const sprite = (rows, pal) => {
  const b = new Buf(Math.max(...rows.map((r) => r.length)), rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) b.set(x, y, pal[ch]); }));
  return b;
};

// 5x7 capitals for the few words on screen
const GL = {
  B: "####. #...# #...# ####. #...# #...# ####.", O: ".###. #...# #...# #...# #...# #...# .###.",
  H: "#...# #...# #...# ##### #...# #...# #...#", A: ".###. #...# #...# ##### #...# #...# #...#",
  "!": "..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..", E: "##### #.... #.... ####. #.... #.... #####",
  K: "#...# #..#. #.#.. ##... #.#.. #..#. #...#", R: "####. #...# #...# ####. #.#.. #..#. #...#",
  M: "#...# ##.## #.#.# #.#.# #...# #...# #...#", W: "#...# #...# #...# #.#.# #.#.# ##.## #...#",
  I: "##### ..#.. ..#.. ..#.. ..#.. ..#.. #####", S: ".#### #.... #.... .###. ....# ....# ####.",
};
/** draw text, each font pixel = s x s; returns width */
export const text = (buf, str, x, y, s, c) => {
  let cx = x;
  for (const ch of str) {
    const g = GL[ch];
    if (g) g.split(" ").forEach((row, j) => [...row].forEach((v, i) => { if (v === "#") buf.rect(cx + i * s, y + j * s, s, s, c); }));
    cx += 6 * s;
  }
  return cx - x - s;
};
export const textW = (str, s) => str.length * 6 * s - s;
