import { Ears } from "./audio.js";
// ?v=1 first look (purple forest + white ghost), ?v=2 second (reaper, first blue graveyard), ?v=3 first match of ref-style.jpg
const V = new URLSearchParams(location.search).get("v");
const { Scene, SCARES } = await import(/^([1-9]|1[0-4])$/.test(V || "") ? `./scene-v${V}.js` : "./scene.js");
import { Sfx, KINDS } from "./sfx.js";

const cv = document.getElementById("c"), g = cv.getContext("2d");
const menu = document.getElementById("menu"), hud = document.getElementById("hud"), status = document.getElementById("status");
const ears = new Ears();
let scene, img, sfx, duckOn = false, last = null, player = null, track = "", lastFrame = -1;

function fit() {
  const s = Math.max(1, Math.round(innerHeight / 180));
  const W = Math.max(200, Math.ceil(innerWidth / s)), H = Math.max(150, Math.ceil(innerHeight / s));
  cv.width = W; cv.height = H;
  cv.style.width = W * s + "px"; cv.style.height = H * s + "px";
  if (!scene) scene = new Scene(W, H); else scene.resize(W, H);
  img = g.createImageData(W, H);
  lastFrame = -1;
}
addEventListener("resize", fit);
fit();
// the scene's own clock: the wall clock minus the time the teaser video took (it stands still meanwhile); scene events use it
const wt = () => performance.now() / 1000 - (scene.clockOff || 0);

// the teaser video, in the scene's pixels (tools/teaser-video.py); the scene plays it every 20 min of its own time
if (scene.loadTeaser) (async () => {
  try {
    const meta = await (await fetch("teaser/video/meta.json")).json();
    const raw = (await fetch("teaser/video/frames.bin")).body.pipeThrough(new DecompressionStream("deflate"));
    scene.loadTeaser(meta, new Uint8Array(await new Response(raw).arrayBuffer()));
    try { scene.teaserStyle = +localStorage.getItem("hw-teaser-style") || 1; } catch {}
  } catch (e) { console.warn("teaser video", e); }
})();
// teaser cues: the video's sound in step with the picture (stopped while it holds on the hand), the thunder on the title
scene.onEvent = (ev, a, b) => {
  if (!sfx) return;
  if (ev === "thunder") sfx.play("thunder");
  else if (ev === "video") sfx.playVideo(a, b);
  else if (ev === "video-stop") sfx.stopVideo();
};

// a short note in the corner (which sound variant is on), gone after 2.5 s
const toast = Object.assign(document.createElement("div"), { style: "position:fixed;right:10px;top:10px;font:13px ui-monospace,Menlo,monospace;color:#e6dcff;background:rgba(0,0,0,.6);padding:5px 8px;display:none" });
document.body.append(toast);
let toastT;
function flash(msg) { toast.textContent = msg; toast.style.display = "block"; clearTimeout(toastT); toastT = setTimeout(() => (toast.style.display = "none"), 2500); }

function scare(kind) {
  const t = wt();
  if (scene.sc || (scene.teaserBusy && scene.teaserBusy(performance.now() / 1000))) return; // nothing jumps out round the teaser
  if (!kind) { const opts = KINDS.filter((k) => k !== last); kind = opts[Math.floor(Math.random() * opts.length)]; }
  last = kind;
  scene.scare(kind, t);
  if (sfx) setTimeout(() => sfx.play(kind), SCARES[kind].sound * 1000);
  if (duckOn && player) fetch("/duck", { method: "POST", body: JSON.stringify({ ms: SCARES[kind].dur * 1000 }) }).catch(() => {});
}

ears.on("track", (name) => { track = name; setTimeout(() => scare(), 300); });
ears.on("gap", () => { if (!player && ears.mode === "mic") scare(); });
ears.on("drop", () => { if (scene.spell) scene.spell(wt()); }); // the reaper casts into the cauldron

// track changes from Spotify / Apple Music via the local server
try {
  const es = new EventSource("/events");
  es.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "status") { player = m.player; if (m.name) track = `${m.name} — ${m.artist}`; }
    if (m.type === "track") { track = `${m.name} — ${m.artist}`; setTimeout(() => scare(), 300); }
  };
  // no local server (a static host): stop retrying instead of a 404 every few seconds
  let open = false;
  es.onopen = () => (open = true);
  es.onerror = () => { if (!open) es.close(); };
} catch {}

async function begin(fn) {
  try { await fn(); } catch (e) { status.textContent = "Не получилось: " + e.message; return; }
  if (!sfx) { sfx = new Sfx(ears.ctx); sfx.load(); sfx.loadVideo("teaser/video/sound.wav"); }
  menu.classList.add("hidden");
}
async function listDevices() {
  try {
    const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
    const sel = document.getElementById("dev"), cur = sel.value;
    sel.innerHTML = '<option value="">вход по умолчанию</option>' + devs.map((d) => `<option value="${d.deviceId}">${d.label || "вход " + d.deviceId.slice(0, 6)}</option>`).join("");
    sel.value = cur;
  } catch {}
}
listDevices();
document.getElementById("mic").onclick = () => begin(async () => { await ears.startMic(document.getElementById("dev").value); listDevices(); });
document.getElementById("demo").onclick = () => begin(async () => ears.startDemo());
const fi = document.getElementById("fi");
document.getElementById("files").onclick = () => fi.click();
fi.onchange = () => begin(async () => { if (!ears.startFiles(fi.files)) throw new Error("нет аудиофайлов"); });
const drop = document.getElementById("drop");
addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
addEventListener("dragleave", () => drop.classList.remove("over"));
addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); begin(async () => { if (!ears.startFiles(e.dataTransfer.files)) throw new Error("нет аудиофайлов"); }); });

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "f" || k === "а") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  else if (e.code === "Space") { e.preventDefault(); scare(); }
  else if ("1234".includes(e.key) && e.key) scare(KINDS[+e.key - 1]);
  else if (e.code === "KeyH") hud.classList.toggle("on");
  else if (e.code === "KeyD") duckOn = !duckOn;
  else if (e.code === "KeyM" || e.key === "Escape") menu.classList.toggle("hidden");
  else if (e.code === "KeyN" && ears.mode === "files") ears.playTrack(ears.track + 1);
  else if (e.code === "KeyS" && scene.flip) scene.flip(wt()); // a somersault on the next free bar
  else if (e.code === "KeyB" && sfx) { flash("рык BOO " + sfx.next("boo")); scare("boo"); } // try the growls one by one
  else if (e.code === "KeyK" && sfx) { flash("кошка " + sfx.next("cat")); scare("cat"); }
  else if (e.code === "KeyE") scene.eyesT0 = wt(); // eyes in the hollow now (normally every 2 min)
  else if (e.code === "KeyZ") scene.handT0 = wt(); // the zombie hand now (normally every 3 min)
  else if (e.code === "KeyG") scene.shadeT0 = wt(); // the faint shadow over the graveyard now (every 3 min)
  else if (e.code === "KeyC" && scene.spell) scene.spell(wt()); // the reaper's spell now (normally on a music drop)
  else if ("789".includes(e.key) && e.key && scene.teaserNow) { // the teaser now in title look 1 / 2 / 3 (and keep that look for the 20-minute ones)
    scene.teaserStyle = +e.key - 6;
    try { localStorage.setItem("hw-teaser-style", scene.teaserStyle); } catch {}
    flash("тизер, надпись " + scene.teaserStyle + (scene.tv ? "" : " (видео ещё грузится)"));
    scene.teaserNow(performance.now() / 1000);
  }
});

const bar = (v) => "█".repeat(Math.round(v * 12)).padEnd(12, "·");
const show = (t) => { scene.draw(t, ears); img.data.set(new Uint8ClampedArray(scene.buf.d.buffer)); g.putImageData(img, 0, 0); };
// debug hook: HW.at("boo", 0.8) freezes the picture at that moment of a scare
window.HW = { scene, ears, get sfx() { return sfx; }, paused: false, at(kind, se) { this.paused = true; const t = performance.now() / 1000; scene.sc = null; scene.scare(kind, wt() - se); for (let k = 8; k >= 0; k--) show(t - k / 24); } };
function frame() {
  requestAnimationFrame(frame);
  if (window.HW.paused) return;
  ears.update();
  const t = performance.now() / 1000, f = Math.floor(t * 24);
  if (f === lastFrame) return;
  lastFrame = f;
  show(t);
  if (hud.classList.contains("on") && f % 3 === 0) {
    hud.textContent = `источник ${ears.mode}   ${ears.active ? ears.bpm + " bpm" : "бит не слышу"}   ${ears.pulse > 0.5 ? "●" : "○"}
бас   ${bar(ears.bass)}
сред  ${bar(ears.mid)}
верх  ${bar(ears.high)}
общий ${bar(ears.level)}
плеер ${player || "не найден"}   приглушение ${duckOn ? "вкл" : "выкл"}
трек  ${track || "—"}
звуки ${sfx ? KINDS.map((k) => k + ":" + (sfx.count(k) || "синт")).join(" ") : "—"}
рык BOO ${sfx ? sfx.label("boo") : "—"}   кошка ${sfx ? sfx.label("cat") : "—"}
тизер ${scene.tv ? (scene.tz ? "идёт" : "через " + Math.floor(scene.nextTeaser(t) / 60) + ":" + String(Math.floor(scene.nextTeaser(t) % 60)).padStart(2, "0")) + ", надпись " + scene.teaserStyle : "видео не загружено"}`;
  }
}
frame();
