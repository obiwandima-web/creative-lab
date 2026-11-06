# Find the art-pixel grid (step and phase, both axes) in each panel of boo-ref/boo-sheet.jpg.
import json, numpy as np
from PIL import Image
im = np.asarray(Image.open("boo-ref/boo-sheet.jpg").convert("RGB")).astype(float)
P = [(17, 12, 650, 545), (666, 12, 1333, 545), (1349, 12, 1982, 545), (17, 570, 650, 1103), (666, 570, 1333, 1103), (1349, 570, 1982, 1103)]
def fit(prof):
    # the strongest repeat of the edge profile between 5 and 11 px (zero-padded spectrum), then its phase
    prof = prof - prof.mean(); n = len(prof); N = 1 << 16
    sp = np.abs(np.fft.rfft(prof * np.hanning(n), N)); f = np.fft.rfftfreq(N)
    ok = (f > 1 / 11) & (f < 1 / 5); k = np.argmax(np.where(ok, sp, 0)); p = 1 / f[k]
    c = np.sum(prof * np.exp(-2j * np.pi * np.arange(n) / p)); ph = (-np.angle(c) / (2 * np.pi) * p) % p
    return sp[k] / np.median(sp[ok]), p, ph
out = []
for (x0, y0, x1, y1) in P:
    a = im[y0:y1, x0:x1]
    px = np.abs(np.diff(a, axis=1)).sum(2).sum(0); py = np.abs(np.diff(a, axis=0)).sum(2).sum(1)
    sx, stx, phx = fit(px); sy, sty, phy = fit(py)
    out.append({"box": [x0, y0, x1, y1], "sx": round(stx, 3), "phx": round(phx, 2), "sy": round(sty, 3), "phy": round(phy, 2), "q": [round(sx, 2), round(sy, 2)]})
    print(out[-1])
json.dump(out, open("boo-ref/grid.json", "w"), indent=1)
