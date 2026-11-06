// The teaser's home frame: the whole scene on its marks (Scene.setHome) at a multiple of HOME.P, when the clouds are back in place.
// The video starts and ends on it, the live scene lands on it before the video and picks up from it after.
//   node tools/teaser-home.mjs  -> teaser/home.png (320x180), home-1280.png, home-1920.png; also checks two periods give the same frame
import fs from "node:fs";
import zlib from "node:zlib";
import { Scene, HOME } from "../js/scene.js";

const W = 320, H = 180, ears = { active: true, bass: 0.5, mid: 0.5, high: 0.4, level: 0.5, pulse: 0, beatIndex: 0, period: 60 / 118, lastBeat: 0, phase: 0 };
function home(T) {
  const sc = new Scene(W, H);
  for (let t = T - 30; t < T - 1; t += 1 / 24) { const b = Math.floor(t / ears.period); if (b !== ears.beatIndex) { ears.beatIndex = b; ears.lastBeat = b * ears.period; ears.pulse = 1; } ears.pulse *= 0.8; ears.phase = (t - ears.lastBeat) / ears.period; sc.draw(t, ears); }
  sc.setHome();
  for (let t = T - 1; t <= T + 1e-9; t += 1 / 24) sc.draw(t, ears);
  sc.draw(T, ears);
  return sc.buf.d.slice();
}
const a = home(HOME.P), b = home(HOME.P * 3);
let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
console.log("pixels that differ between two periods:", diff);
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (buf) => { let c = -1; for (const v of buf) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(t), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(path, src, z) {
  const ow = W * z, oh = H * z, raw = Buffer.alloc((ow * 3 + 1) * oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const c = src[Math.floor(y / z) * W + Math.floor(x / z)], o = y * (ow * 3 + 1) + 1 + x * 3; raw[o] = c & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = (c >> 16) & 255; }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(ow, 0); ih.writeUInt32BE(oh, 4); ih[8] = 8; ih[9] = 2;
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path);
}
png("teaser/home.png", a, 1); png("teaser/home-1280.png", a, 4); png("teaser/home-1920.png", a, 6);
