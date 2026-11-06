# Pack boo-ref/frame-1..6.png into js/boo-frames.js: one shared palette, each frame as palette indices (255 = clear) in base64,
# plus the point between the eyes (the anchor the animation aligns frames on) and the eye distance (to match their sizes).
import json, base64, numpy as np
from PIL import Image
pal = json.load(open("boo-ref/palette.json"))["palette"]
P = np.array(pal)
# hand fixes where the detector is fooled (frame 6: the eye flames pull it up)
EYE_FIX = {6: [41.0, 22.0]}
frames = []
for n in range(1, 7):
    a = np.asarray(Image.open(f"boo-ref/frame-{n}.png").convert("RGBA")).astype(int)
    h, w, _ = a.shape
    idx = np.argmin(((a[:, :, None, :3] - P[None, None]) ** 2).sum(3), 2).astype(np.uint8)
    idx[a[:, :, 3] < 128] = 255
    # eyes: the hottest cells (bright red-orange), split into a left and a right blob
    # the brightest warm cells in the upper part of the face (teeth and gums sit lower)
    lum = a[:, :, 0] * 0.5 + a[:, :, 1] * 0.4 + a[:, :, 2] * 0.1
    warm = (a[:, :, 0] > 200) & (a[:, :, 0] - a[:, :, 2] > 60) & (a[:, :, 3] > 0)
    warm[int(h * 0.55):] = False
    thr = np.percentile(lum[warm], 70)
    ys, xs = np.nonzero(warm & (lum >= thr))
    mid = np.median(xs)
    L = (xs < mid); R = ~L
    el = (xs[L].mean(), ys[L].mean()); er = (xs[R].mean(), ys[R].mean())
    eye = [round((el[0] + er[0]) / 2, 1), round((el[1] + er[1]) / 2, 1)]
    if n in EYE_FIX: eye = EYE_FIX[n]
    frames.append({"w": w, "h": h, "eye": eye, "span": round(er[0] - el[0], 1), "px": base64.b64encode(idx.tobytes()).decode()})
    print(n, w, h, frames[-1]["eye"], frames[-1]["span"])
hexes = ["0x%02x%02x%02x" % tuple(c) for c in pal]
js = "// The BOO screamer frames, cleaned from boo-ref/boo-sheet.jpg by tools/boo-extract.py and packed by tools/boo-pack.py (do not edit by hand).\n"
js += "// pal: shared palette (0xRRGGBB); each frame: w, h, eye = point between the eyes, span = eye distance, px = base64 palette indices, 255 = clear.\n"
js += "export const BOO_PAL = [" + ", ".join(hexes) + "];\n"
js += "export const BOO_FRAMES = [\n" + ",\n".join("  " + json.dumps(f) for f in frames) + ",\n];\n"
open("js/boo-frames.js", "w").write(js)
print("wrote js/boo-frames.js", len(js))
