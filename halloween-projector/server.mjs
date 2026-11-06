// Local server for the Halloween projector page:
//  - serves the page and sounds/
//  - watches Spotify / Apple Music via AppleScript and pushes track changes over Server-Sent Events (/events)
//  - POST /duck lowers the player's volume for a moment so a scare sound is heard, then brings it back
// Run:  node server.mjs   then open http://localhost:8031
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8031;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".png": "image/png" };
const AUDIO = /\.(mp3|wav|ogg|m4a)$/i;

const run = (script) => new Promise((res) => execFile("osascript", ["-e", script], { timeout: 2500 }, (err, out) => res(err ? null : out.trim())));
const running = (app) => new Promise((res) => execFile("pgrep", ["-xq", app], (err) => res(!err)));
const nowScript = (app, idProp) => `tell application "${app}"
  if player state is not playing then return "paused"
  set n to ""
  set a to ""
  try
    set n to name of current track
  end try
  try
    set a to artist of current track
  end try
  set i to n & a
  try
    set i to ${idProp} of current track
  end try
  return i & "|" & n & "|" & a
end tell`;
const APPS = [["Spotify", "id"], ["Music", "persistent ID"]];

const clients = new Set();
const send = (msg) => { const s = `data: ${JSON.stringify(msg)}\n\n`; for (const c of clients) c.write(s); };
let state = { type: "status", player: null, playing: false, name: "", artist: "" };
let lastId = null;

async function poll() {
  let found = null;
  for (const [app, idProp] of APPS) {
    if (!(await running(app))) continue;
    const out = await run(nowScript(app, idProp));
    if (out === null) continue;
    found = app;
    if (out === "paused") { state = { ...state, player: app, playing: false }; break; }
    const [id, name, artist] = out.split("|");
    if (lastId !== null && id !== lastId) send({ type: "track", player: app, name, artist });
    lastId = id;
    state = { type: "status", player: app, playing: true, name, artist };
    break;
  }
  if (!found) state = { ...state, player: null, playing: false };
  send(state);
}
setInterval(poll, 800);

let ducking = false;
async function duck(ms) {
  const app = state.player;
  if (ducking || !app) return;
  ducking = true;
  const v = parseInt(await run(`tell application "${app}" to get sound volume`), 10);
  if (Number.isNaN(v)) { ducking = false; return; }
  await run(`tell application "${app}" to set sound volume to ${Math.round(v * 0.35)}`);
  setTimeout(async () => {
    for (const k of [0.6, 0.85, 1]) {
      await run(`tell application "${app}" to set sound volume to ${Math.round(v * k)}`);
      await new Promise((r) => setTimeout(r, 200));
    }
    ducking = false;
  }, ms);
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(`data: ${JSON.stringify(state)}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (url.pathname === "/duck" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => { let ms = 2500; try { ms = Math.min(8000, JSON.parse(body).ms || ms); } catch {} duck(ms); res.end("ok"); });
    return;
  }
  if (url.pathname === "/sounds-list") {
    let names = [];
    try { names = fs.readdirSync(path.join(ROOT, "sounds")).filter((n) => AUDIO.test(n)); } catch {}
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(names));
    return;
  }
  const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).on("error", (e) => {
  // a second copy: the first one is already serving the page, so say so instead of a stack trace
  if (e.code === "EADDRINUSE") { console.log(`Halloween projector is already running: http://localhost:${PORT}`); process.exit(0); }
  throw e;
}).listen(PORT, () => console.log(`Halloween projector: http://localhost:${PORT}`));
