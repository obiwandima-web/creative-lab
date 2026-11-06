// Render one frame of the scene to a PNG without a browser.
//   node tools/still.mjs out.png [--w 320] [--h 180] [--scale 4] [--t 10] [--scare boo --se 0.8] [--v 1|2] [--ref]
import fs from "node:fs";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--") && !/^[\d.]+$/.test(a) && !["boo", "laugh", "scream", "cat"].includes(a)) || "still.png";
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const W = +opt("w", 320), H = +opt("h", 180), S = +opt("scale", 4), T = +opt("t", 10);
const v = opt("v", "15"), { Scene } = await import(/^([1-9]|1[0-4])$/.test(v) ? `../js/scene-v${v}.js` : "../js/scene.js");

// a steady fake beat at 120 bpm
const ears = { active: true, bass: 0.6, mid: 0.5, high: 0.4, level: 0.6, pulse: 0, beatIndex: 0, period: 0.5, lastBeat: 0, phase: 0, bpm: 120 };
const scene = new Scene(W, H);
scene.refPoses = args.includes("--ref"); // hold the poses of the reference picture
const t0 = T - 3;
for (let f = 0; f <= 72; f++) {
  const t = t0 + f / 24;
  const b = Math.floor(t / 0.5);
  if (b !== ears.beatIndex) { ears.beatIndex = b; ears.lastBeat = b * 0.5; ears.pulse = 1; }
  ears.pulse *= 0.8;
  ears.phase = (t - ears.lastBeat) / 0.5;
  if (f === 72 - Math.round(+opt("se", 0) * 24) && opt("scare")) scene.scare(opt("scare"), t);
  scene.draw(t, ears);
}

// scale up and write PNG
const src = scene.buf.d, w = W * S, h = H * S, raw = Buffer.alloc((w * 4 + 1) * h);
for (let y = 0; y < h; y++) {
  raw[y * (w * 4 + 1)] = 0;
  for (let x = 0; x < w; x++) {
    const c = src[Math.floor(y / S) * W + Math.floor(x / S)], o = y * (w * 4 + 1) + 1 + x * 4;
    raw[o] = c & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = (c >> 16) & 255; raw[o + 3] = 255;
  }
}
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
console.log("wrote", out, w + "x" + h);
