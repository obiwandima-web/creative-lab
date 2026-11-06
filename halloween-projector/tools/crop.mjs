// Save named elements of the frame as a big PNG, the same cut the review page makes.
//   node tools/crop.mjs out.png "жнец,искры жнеца" [--scale 8] [--glow 1] [--scene]   (--scene: the rest of the frame dimmed behind)
import fs from "node:fs";
import zlib from "node:zlib";
import { Scene } from "../js/scene.js";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const out = args[0], want = (args[1] || "").split(","), S = +opt("scale", 8), W = 320, H = 180;
const scene = new Scene(W, H);
scene.trace = true; scene.refPoses = !args.includes("--live");
const ears = { active: true, bass: 0.6, mid: 0.5, high: 0.4, level: 0.6, pulse: 0, beatIndex: 0, period: 0.5, lastBeat: 0, phase: 0 };
let t = 7;
for (let f = 0; f <= 72; f++) {
  t = 7 + f / 24; const b = Math.floor(t / 0.5);
  if (b !== ears.beatIndex) { ears.beatIndex = b; ears.lastBeat = b * 0.5; ears.pulse = 1; }
  ears.pulse *= 0.8; ears.phase = (t - ears.lastBeat) / 0.5;
  scene.draw(t, ears);
}
if (opt("glow")) { scene.glowV = +opt("glow"); scene.draw(t + 1 / 24, ears); }
const nameOf = (i) => (i ? scene.names[i - 1] : ""), test = (n) => want.some((w) => w && n.startsWith(w));
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(nameOf(scene.ids[y * W + x]))) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(W - 1, x1 + 3); y1 = Math.min(H - 1, y1 + 3);
const w = (x1 - x0 + 1) * S, h = (y1 - y0 + 1) * S, raw = Buffer.alloc((w * 4 + 1) * h);
for (let y = 0; y < h; y++) {
  raw[y * (w * 4 + 1)] = 0;
  for (let x = 0; x < w; x++) {
    const i = (y0 + Math.floor(y / S)) * W + x0 + Math.floor(x / S), mine = !want[0] || test(nameOf(scene.ids[i]));
    let c = scene.buf.d[i], o = y * (w * 4 + 1) + 1 + x * 4, k = mine ? 1 : args.includes("--scene") ? 0.35 : 0;
    if (!mine && !args.includes("--scene")) { raw[o] = 0x6f; raw[o + 1] = 0x73; raw[o + 2] = 0x97; raw[o + 3] = 255; continue; }
    raw[o] = (c & 255) * k; raw[o + 1] = ((c >> 8) & 255) * k; raw[o + 2] = ((c >> 16) & 255) * k; raw[o + 3] = 255;
  }
}
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
console.log("wrote", out, w + "x" + h, "from", x0, y0);
