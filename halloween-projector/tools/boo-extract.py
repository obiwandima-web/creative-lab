# Turn the six screamer panels of boo-ref/boo-sheet.jpg into clean pixel art:
# sample each art pixel at the centre of its grid cell, snap to one shared palette, cut away the grey background
# (flood fill from the panel edge), save boo-ref/frame-N.png (native size, transparent) and a 4x check sheet.
import json, numpy as np
from PIL import Image
im = np.asarray(Image.open("boo-ref/boo-sheet.jpg").convert("RGB")).astype(float)
G = json.load(open("boo-ref/grid.json"))
BG = np.array([48, 46, 57.0])
frames = []
for g in G:
    x0, y0, x1, y1 = g["box"]; sx, sy = g["sx"], g["sy"]
    gx = x0 + g["phx"] % sx; gy = y0 + g["phy"] % sy
    nx = int((x1 - gx) // sx); ny = int((y1 - gy) // sy)
    cells = np.zeros((ny, nx, 3))
    for j in range(ny):
        for i in range(nx):
            cx0, cy0 = gx + i * sx, gy + j * sy
            a = im[int(cy0 + sy * 0.3): int(cy0 + sy * 0.7) + 1, int(cx0 + sx * 0.3): int(cx0 + sx * 0.7) + 1]
            cells[j, i] = np.median(a.reshape(-1, 3), axis=0)
    frames.append(cells)
# one palette for all frames (k-means in RGB)
allc = np.concatenate([f.reshape(-1, 3) for f in frames])
rng = np.random.default_rng(3); K = 48
cent = allc[rng.choice(len(allc), K, replace=False)]
for _ in range(25):
    lab = np.argmin(((allc[:, None] - cent[None]) ** 2).sum(2), 1)
    cent = np.array([allc[lab == k].mean(0) if np.any(lab == k) else cent[k] for k in range(K)])
cent = np.round(cent).astype(int)
out = []
for n, f in enumerate(frames):
    ny, nx, _ = f.shape
    lab = np.argmin(((f[:, :, None] - cent[None, None]) ** 2).sum(3), 2)
    q = cent[lab]
    # trim the panel frame: 2 cells at the top and sides, the frame line (top row) or the ornament strip (bottom row) at the bottom
    cut = 5 if n >= 3 else 2
    f = f[2:ny - cut, 2:nx - 2]; q = q[2:ny - cut, 2:nx - 2]; ny, nx, _ = f.shape
    # background: flood from every grey cell near the edge through cells close to the panel grey
    bgish = np.sqrt(((f - BG) ** 2).sum(2)) < 30
    alpha = np.ones((ny, nx), bool)
    stack = [(j, i) for j in range(ny) for i in range(nx) if (j < 3 or i < 3 or i >= nx - 3) and bgish[j, i]]
    seen = np.zeros((ny, nx), bool)
    while stack:
        j, i = stack.pop()
        if j < 0 or i < 0 or j >= ny or i >= nx or seen[j, i]: continue
        seen[j, i] = True
        if not bgish[j, i]: continue
        alpha[j, i] = False
        stack += [(j + 1, i), (j - 1, i), (j, i + 1), (j, i - 1)]
    # keep only the figure: the largest connected blob (drops leftover frame lines and corner ornaments)
    comp = np.zeros((ny, nx), int); sizes = [0]
    for j0 in range(ny):
        for i0 in range(nx):
            if not alpha[j0, i0] or comp[j0, i0]: continue
            c = len(sizes); sizes.append(0); st = [(j0, i0)]
            while st:
                j, i = st.pop()
                if j < 0 or i < 0 or j >= ny or i >= nx or comp[j, i] or not alpha[j, i]: continue
                comp[j, i] = c; sizes[c] += 1; st += [(j + 1, i), (j - 1, i), (j, i + 1), (j, i - 1)]
    big = int(np.argmax(sizes)); alpha = comp == big
    rgba = np.zeros((ny, nx, 4), np.uint8); rgba[..., :3] = q; rgba[..., 3] = alpha * 255
    Image.fromarray(rgba).save(f"boo-ref/frame-{n + 1}.png")
    out.append((nx, ny))
    print("frame", n + 1, nx, "x", ny)
json.dump({"palette": cent.tolist()}, open("boo-ref/palette.json", "w"))
# check sheet: 4x, on magenta so holes show
ims = [Image.open(f"boo-ref/frame-{n + 1}.png") for n in range(6)]
W = max(i.width for i in ims) * 4; H = max(i.height for i in ims) * 4
sheet = Image.new("RGB", (W * 3 + 8, H * 2 + 4), (255, 0, 255))
for n, i in enumerate(ims):
    big = i.resize((i.width * 4, i.height * 4), Image.NEAREST)
    bg = Image.new("RGB", big.size, (255, 0, 255)); bg.paste(big, (0, 0), big)
    sheet.paste(bg, ((n % 3) * (W + 4), (n // 3) * (H + 4)))
sheet.save("boo-ref/check.png")
