// The teaser's close-up plate: the scene drawn at twice the size (so the moon, clouds and far hills get real detail at the same pixel
// size), cropped round the moon. This is where the camera pushes in to; the video model gets it as the first frame.
//   node tools/teaser-plate.mjs [--t auto|seconds] [--cy 72] [--s 1.75]   -> teaser/plate.png (320x180), teaser/first-frame-1280.png, teaser/first-frame-1920.png
import fs from "node:fs";
import zlib from "node:zlib";
import { Scene } from "../js/scene.js";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : +args[i + 1]; };
const S = opt("s", 1.75), W = 320, H = 180, big = new Scene(Math.round(W * S), Math.round(H * S));
big.noDancers = true; big.noReaper = true;
const ears = { active: false, phase: 0, pulse: 0 };
// the moment: unless given, the one in the first 10 minutes with the least cloud over the moon (its silhouette is the stage)
const covered = () => { const m = big.moon; let n = 0; for (let y = -m.r; y <= m.r; y++) for (let x = -m.r; x <= m.r; x++) if (x * x + y * y < m.r * m.r) { const i = (m.y + y) * big.W + m.x + x; if (big.buf.d[i] !== big.bg.d[i]) n++; } return n; };
let T = opt("t", NaN);
if (isNaN(T)) { let best = 1e9; for (let t = 5; t < 600; t += 5) { big.draw(t, ears); const c = covered(); if (c < best) { best = c; T = t; } } console.log("least cloud at t =", T, "pixels", best); }
for (let t = T - 2; t <= T; t += 1 / 24) big.draw(t, ears);
// crop: centred on the moon, its centre `cy` px from the top of the crop
const m = big.moon, cx = m.x - W / 2, cy = Math.round(m.y - opt("cy", 72));
const plate = new Uint32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) plate[y * W + x] = big.buf.d[(cy + y) * big.W + cx + x];
console.log("moon", m, "crop", cx, cy, "ridge at", big.farTop(m.x) - cy, "of", H);

const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(path, src, w, h, z) {
  const ow = w * z, oh = h * z, raw = Buffer.alloc((ow * 3 + 1) * oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const c = src[Math.floor(y / z) * w + Math.floor(x / z)], o = y * (ow * 3 + 1) + 1 + x * 3; raw[o] = c & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = (c >> 16) & 255; }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(ow, 0); ih.writeUInt32BE(oh, 4); ih[8] = 8; ih[9] = 2;
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path, ow + "x" + oh);
}
png("teaser/plate.png", plate, W, H, 1);
png("teaser/first-frame-1280.png", plate, W, H, 4);
png("teaser/first-frame-1920.png", plate, W, H, 6);
