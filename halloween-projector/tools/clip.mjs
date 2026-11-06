// Render a motion preview of the scene to MP4 with the demo beat (118 bpm, the same as the page's demo mode) on the sound track.
//   node tools/clip.mjs out.mp4 [--dur 20] [--fps 24] [--scale 4] [--w 320] [--h 180] [--flip 8] [--scare boo@15] [--v N]
// --flip / --scare take seconds from the start; several scares: --scare "laugh@6,cat@14". No sound for scares, only the beat.
// --drop "8,30": music drops at those seconds (snapped to the next bar): the reaper casts; the sound track gets a breakdown bar and a crash.
// --teaser 1|2|3: the teaser in that title look starts after 2 s (gather) with the thunder on the sound track.
// --sheet sheet.png [--every 6] [--cols 4] [--region x,y,w,h --zoom 3] [--from s --to s]: also a contact sheet of every Nth frame (1x pixels) for checking.
import fs from "node:fs";
import zlib from "node:zlib";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const out = path.resolve(args.find((a) => /\.(mp4|gif)$/.test(a)) || "clip.mp4"), GIF = out.endsWith(".gif"); // a .gif: crisp pixels, no sound (for READMEs)
const W = +opt("w", 320), H = +opt("h", 180), S = +opt("scale", 4), FPS = +opt("fps", 24), DUR = +opt("dur", 20);
const v = opt("v", "15"), { Scene, HOME, TEASER } = await import(/^([1-9]|1[0-4])$/.test(v) ? `../js/scene-v${v}.js` : "../js/scene.js");
const FF = process.env.FFMPEG || "ffmpeg"; // any ffmpeg on PATH, or point FFMPEG at one
const flipAt = opt("flip") ? +opt("flip") : null;
const scares = (opt("scare") || "").split(",").filter(Boolean).map((s) => { const [k, at] = s.split("@"); return { k, at: +at, done: false }; });

// ---- the beat clock, as Ears.update() runs it in demo mode (about 60 updates a second) ----
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const T0 = 100; // scene time of the first frame: a little warm-up so the ring and poses are settled
const period = 60 / 118, firstBeat = T0 + 0.2;
const ears = { mode: "demo", active: true, period, bass: 0, mid: 0, high: 0, level: 0, pulse: 0, beatIndex: 0, lastBeat: T0, nextBeat: firstBeat, phase: 0, bpm: 118 };
let clockT = T0 - 3;
function earsTo(t) {
  for (; clockT < t; clockT += 1 / 60) {
    const c = Math.min(clockT, t);
    ears.pulse *= 0.86;
    if (c >= ears.nextBeat) { ears.lastBeat = ears.nextBeat; ears.nextBeat += period; ears.beatIndex++; ears.pulse = 1; }
    const ph = clamp((c - ears.lastBeat) / period);
    ears.phase = ph;
    ears.bass = clamp(1 - ph * 1.6) * 0.9 + 0.1;
    ears.mid = 0.45 + 0.25 * Math.sin(c * 3.1) + 0.15 * Math.sin(c * 7.3);
    ears.high = 0.3 + 0.3 * ((ph * 2) % 1 < 0.2 ? 1 : 0);
    ears.level = 0.6 + 0.2 * Math.sin(c * 0.7);
  }
}

// ---- PNG ----
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(src, w = W, h = H) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = src[y * w + x], o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = c & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = (c >> 16) & 255; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 1 })), chunk("IEND", Buffer.alloc(0))]);
}

// ---- the demo beat as sound: kick on every beat, hat on the off-beat, a low minor drone that changes each bar ----
const SR = 48000, N = Math.ceil(DUR * SR), pcm = new Float32Array(N);
let seed = 7; const noise = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 31) - 1;
const bars = [55, 55, 51.9, 49]; // A1 A1 G#1 G1
// the teaser: its video frames, and when its thunder falls (the scene's clock is set so the gather starts 2 s in)
const TZ = opt("teaser") ? +opt("teaser") : 0, LEAD = 2;
let tzMeta = null, tzBytes = null, thunderAt = -1;
if (TZ) {
  tzMeta = JSON.parse(fs.readFileSync(new URL("../teaser/video/meta.json", import.meta.url)));
  tzBytes = new Uint8Array(zlib.inflateSync(fs.readFileSync(new URL("../teaser/video/frames.bin", import.meta.url))));
  thunderAt = LEAD + TEASER.gather + tzMeta.stop / tzMeta.fps;
}
// a 16-bit wav (mono or stereo, left channel) into the mix: seconds of it from `from` to `to`, placed at `at`, times gain
function mixWav(path, at, from, to, gain) {
  const b = fs.readFileSync(new URL(path, import.meta.url)), ch = b.readUInt16LE(22), sr = b.readUInt32LE(24);
  let o = 12; while (b.toString("ascii", o, o + 4) !== "data") o += 8 + b.readUInt32LE(o + 4);
  const d = o + 8, n = Math.floor(b.readUInt32LE(o + 4) / (2 * ch)), i0 = Math.floor(from * sr), i1 = Math.min(n, Math.floor(to * sr));
  for (let i = i0; i < i1; i++) { const j = Math.round((at + (i - i0) / sr) * SR); if (j >= 0 && j < N) pcm[j] += (gain * b.readInt16LE(d + i * 2 * ch)) / 32768; }
}
// drops: the first downbeat (beat index j = 0, 4, 8...) at or after each asked time
const drops = (opt("drop") || "").split(",").filter(Boolean).map((s) => { let j = Math.ceil((T0 + +s - firstBeat) / period); return Math.ceil(j / 4) * 4; });
const breakdown = (b) => drops.some((j) => b >= j - 4 && b < j), riser = (st) => { for (const j of drops) { const u = (st - (firstBeat + (j - 4) * period)) / (4 * period); if (u >= 0 && u < 1) return u; } return -1; };
for (let i = 0; i < N; i++) {
  const t = i / SR, st = T0 + t, b = Math.floor((st - firstBeat) / period), bt = st - firstBeat - b * period;
  const f = bars[(((Math.floor(b / 4)) % 4) + 4) % 4];
  pcm[i] = 0.06 * Math.sin(2 * Math.PI * f * t) + 0.03 * Math.sin(2 * Math.PI * f * 1.5 * t); // drone (root + fifth)
  const ru = riser(st);
  if (ru >= 0) pcm[i] += 0.1 * ru * ru * noise(); // a noise riser into the drop
  for (const j of drops) { const ct = st - (firstBeat + j * period); if (ct >= 0 && ct < 1.6) pcm[i] += 0.22 * noise() * Math.exp(-ct * 3); } // crash on the drop
  if (b >= 0 && bt < 0.35 && !breakdown(b)) { const fk = 45 + 90 * Math.exp(-bt * 30); pcm[i] += 0.7 * Math.sin(2 * Math.PI * fk * bt) * Math.exp(-bt * 9); }
  const ht = bt - period / 2;
  if (b >= 0 && ht >= 0 && ht < 0.05) pcm[i] += 0.12 * noise() * Math.exp(-ht * 70);
}
if (thunderAt >= 0) { // the teaser's sounds against the demo beat, about as loud as the page plays them over music
  const t0 = LEAD + TEASER.gather, stopT = tzMeta.stop / tzMeta.fps, end = tzMeta.n / tzMeta.fps;
  mixWav("../teaser/video/sound.wav", t0, 0, stopT, 0.45);
  mixWav("../teaser/video/sound.wav", t0 + stopT + TEASER.hold, stopT, end, 0.45);
  mixWav("../sounds/thunder-1.wav", thunderAt, 0, 6.5, 1.3);
}
for (let i = 0; i < N; i++) pcm[i] = Math.tanh(pcm[i] * 1.2); // soft clip
const wav = Buffer.alloc(44 + N * 2);
wav.write("RIFF", 0); wav.writeUInt32LE(36 + N * 2, 4); wav.write("WAVEfmt ", 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(Math.round(clamp(pcm[i], -1, 1) * 32000), 44 + i * 2);
const wavPath = path.join(os.tmpdir(), `hw-beat-${process.pid}.wav`);
fs.writeFileSync(wavPath, wav);

// ---- frames -> ffmpeg (no rawvideo demuxer in the bundled build, so PNGs through image2pipe) ----
const tmpMp4 = path.join(os.tmpdir(), `hw-clip-${process.pid}.mp4`), env = { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FF) };
const ff = GIF ? spawn(FF, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
  "-vf", `scale=${W * S}:${H * S}:flags=neighbor,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none`, "-loop", "0", out],
  { env, stdio: ["pipe", "inherit", "inherit"] }) : spawn(FF, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-i", wavPath,
  "-vf", `scale=${W * S}:${H * S}:flags=neighbor,format=yuv420p`, "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-tune", "animation",
  "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-colorspace", "bt709", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "160k", "-shortest", tmpMp4], { env, stdio: ["pipe", "inherit", "inherit"] });
const sheetPath = opt("sheet"), every = +opt("every", 6), cols = +opt("cols", 4), shots = [];

const scene = new Scene(W, H);
if (TZ) { scene.loadTeaser(tzMeta, tzBytes); scene.teaserStyle = TZ; scene.clockOff = T0 - (HOME.P - TEASER.gather - LEAD); }
for (let t = T0 - 3; t < T0; t += 1 / FPS) { earsTo(t); scene.draw(t, ears); } // warm-up, not recorded
const frames = Math.round(DUR * FPS);
let lastCast = -1;
for (let f = 0; f < frames; f++) {
  const e = f / FPS, t = T0 + e;
  earsTo(t);
  if (flipAt !== null && e >= flipAt && flipAt > e - 1 / FPS) scene.flip(t); // a somersault on the next free bar
  for (const s of scares) if (!s.done && e >= s.at) { s.done = true; scene.scare(s.k, t); }
  if (drops.includes(ears.beatIndex - 1) && ears.beatIndex !== lastCast) { lastCast = ears.beatIndex; scene.spell(t); }
  scene.draw(t, ears);
  if (sheetPath && f % every === 0 && e >= +opt("from", 0) && e <= +opt("to", 1e9)) shots.push(scene.buf.d.slice());
  if (!ff.stdin.write(png(scene.buf.d))) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
fs.unlinkSync(wavPath);
if (GIF) { console.log("wrote", out, `${W * S}x${H * S}`, frames, "frames"); process.exit(0); }
// retag the stream as sRGB transfer so Mac players do not show it lighter (see the video colour note)
const re = spawn(FF, ["-y", "-loglevel", "error", "-i", tmpMp4, "-c", "copy", "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=1:video_full_range_flag=0",
  "-movflags", "+faststart", out], { env, stdio: "inherit" });
await new Promise((r) => re.on("close", r));
fs.unlinkSync(tmpMp4);
if (sheetPath) {
  // --region x,y,w,h crops each frame, --zoom n enlarges it (for close checks of the poses)
  const [rx, ry, rw, rh] = (opt("region") || `0,0,${W},${H}`).split(",").map(Number), Z = +opt("zoom", 1), cw = rw * Z, ch = rh * Z;
  const rows = Math.ceil(shots.length / cols), sw = cols * (cw + 2), sh = rows * (ch + 2), d = new Uint32Array(sw * sh);
  shots.forEach((src, i) => { const ox = (i % cols) * (cw + 2), oy = Math.floor(i / cols) * (ch + 2); for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) d[(oy + y) * sw + ox + x] = src[(ry + Math.floor(y / Z)) * W + rx + Math.floor(x / Z)]; });
  fs.writeFileSync(sheetPath, png(d, sw, sh));
  console.log("wrote", sheetPath, shots.length, "frames, every", every);
}
console.log("wrote", out, `${W * S}x${H * S}`, frames, "frames");
