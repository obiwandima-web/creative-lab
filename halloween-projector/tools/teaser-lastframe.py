# The teaser's last frame: the close-up plate (teaser/plate.png) with a huge zombie hand burst out of a mound on the ridge,
# palm to us, fingers spread like claws, right on the middle of the moon (Dmitrii's composition reference). Drawn at the plate's own
# pixel size: a dark backlit silhouette with a thin moonlit rim, knuckles, tendons, claws; the mound of broken earth at its foot.
#   python3 tools/teaser-lastframe.py  -> teaser/last-frame.png (320x180), last-frame-1280.png, last-frame-1920.png
import math
import numpy as np
from PIL import Image

plate = np.asarray(Image.open("teaser/plate.png").convert("RGB")).copy()
H, W, _ = plate.shape
MX, MY, MR = 160, 72, 68  # moon in the plate (see tools/teaser-plate.mjs)
yy, xx = np.mgrid[0:H, 0:W].astype(float)

def capsule(ax, ay, bx, by, ra, rb):
    """tapered capsule from a (radius ra) to b (radius rb)"""
    dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
    t = np.clip(((xx - ax) * dx + (yy - ay) * dy) / max(L2, 1e-9), 0, 1)
    px, py = ax + t * dx, ay + t * dy
    return np.hypot(xx - px, yy - py) <= ra + (rb - ra) * t

def poly(pts):
    """even-odd fill of a polygon"""
    inside = np.zeros((H, W), bool); n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]; x1, y1 = pts[(i + 1) % n]
        cond = ((y0 <= yy) & (yy < y1)) | ((y1 <= yy) & (yy < y0))
        xi = x0 + (yy - y0) * (x1 - x0) / ((y1 - y0) if y1 != y0 else 1e-9)
        inside ^= cond & (xx < xi)
    return inside

hand = np.zeros((H, W), bool); joints = []; tips = []
# forearm out of the ground: a thin wrist (overlapping the palm, no seam), widening and slightly bowed toward the elbow underground
hand |= poly([(153, 84), (167, 84), (170, 98), (172, 112), (173, 126), (176, 147), (146, 147), (148, 128), (150, 112), (151, 98)])
# palm (palm to the viewer, a right hand: the thumb on our left)
hand |= poly([(146, 60), (174, 60), (177, 74), (172, 91), (150, 91), (144, 76)])
# fingers: base point on the palm, angle from straight up (deg, + = to our right), length, base width; each bends a little at the joints
# bony, crooked fingers spread wide: each joint bends a different way, the last one hooks in like a claw
for bx, by, ang, ln, wd, bends in [(149, 63, -22, 29, 2.7, (9, -16)), (155, 60, -8, 34, 2.9, (-6, 12)), (163, 60, 7, 32, 2.8, (8, -14)), (170, 63, 24, 24, 2.5, (10, -18))]:
    x, y, a = bx, by, ang
    for k, f in enumerate([0.45, 0.33, 0.22]):
        a2 = a + (bends[k - 1] if k else 0)
        nx, ny = x + math.sin(math.radians(a2)) * ln * f, y - math.cos(math.radians(a2)) * ln * f
        r0, r1 = wd * (1 - 0.14 * k), wd * (1 - 0.14 * (k + 1))
        hand |= capsule(x, y, nx, ny, r0, r1)
        if k < 2: joints.append((nx, ny, a2)); hand |= capsule(nx, ny, nx, ny, r1 + 1.0, r1 + 1.0)  # knobbly knuckles
        x, y, a = nx, ny, a2
    tips.append((x, y, a))
# thumb, out to our left and up
x, y = 146, 80
for k, (a, f) in enumerate([(-58, 11), (-38, 8), (-26, 6)]):
    nx, ny = x + math.sin(math.radians(a)) * f, y - math.cos(math.radians(a)) * f
    hand |= capsule(x, y, nx, ny, 4.0 - k * 0.6, 3.4 - k * 0.6)
    if k < 2: joints.append((nx, ny, a))
    x, y = nx, ny
tips.append((x, y, -26))
# claws: sharp, curved, past the fingertips
claw = np.zeros((H, W), bool)
for x, y, a in tips:
    for s in range(1, 5):
        aa = math.radians(a + (s * 6 if a >= 0 else -s * 6))
        cx, cy = x + math.sin(aa) * (s + 1.5), y - math.cos(aa) * (s + 1.5)
        claw |= capsule(cx, cy, cx, cy, max(0.4, 1.4 - s * 0.3), max(0.4, 1.4 - s * 0.3))

# mound of broken earth on the ridge at the hand's foot
mound = (((xx - 160) / 31) ** 2 + ((yy - 151) / 11) ** 2 <= 1) & (yy <= 151 + 6)
mound |= (((xx - 160) / 44) ** 2 + ((yy - 153) / 5) ** 2 <= 1)
rng = np.random.default_rng(7)

def shift(m, dx, dy):
    o = np.zeros_like(m); ys, xs = slice(max(0, dy), H + min(0, dy)), slice(max(0, dx), W + min(0, dx))
    o[ys, xs] = m[max(0, -dy):H - max(0, dy), max(0, -dx):W - max(0, dx)]; return o

out = plate.astype(int)
C = lambda h: np.array([(h >> 16) & 255, (h >> 8) & 255, h & 255])
INK, DARK, MID, KNOT, RIM, RIM2, K = C(0x0a0916), C(0x141428), C(0x1e2240), C(0x2c3658), C(0x4f8496), C(0x8ec4c8), C(0x02020a)
# the hand: near-black inside, a lighter band just inside the edge, the moonlit rim on the outermost pixel; the edge facing the
# moon's centre-top catches it most
edge1 = hand & ~(shift(hand, 1, 0) & shift(hand, -1, 0) & shift(hand, 0, 1) & shift(hand, 0, -1))
inner = shift(hand, 1, 0) & shift(hand, -1, 0) & shift(hand, 0, 1) & shift(hand, 0, -1)
edge2 = inner & ~(shift(inner, 1, 0) & shift(inner, -1, 0) & shift(inner, 0, 1) & shift(inner, 0, -1))
out[hand] = INK
out[edge2] = DARK
lit = edge1 & (np.hypot(xx - MX, yy - MY) < MR + 2)  # rim only where the moon is behind
out[edge1] = MID
out[lit] = RIM
out[lit & ((xx < 158) | (yy < 70)) & ((xx.astype(int) + yy.astype(int)) % 3 == 0)] = RIM2
# knuckle creases and wrist tendons, a few torn spots
for x, y, a in joints:
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    for t in (-1, 0, 1): out[int(round(y + sa * t)), int(round(x + ca * t))] = KNOT
for tx in (156, 160, 164):
    for ty in range(93, 118, 2): out[ty, tx + (1 if ty > 105 else 0)] = DARK if ty % 4 else KNOT
for x, y in [(153, 80), (167, 72), (158, 136), (163, 101)]: out[y, x] = MID; out[y, x + 1] = KNOT
for x, y, a in joints: out[int(round(y)) - 1, int(round(x)) - 1] = RIM if np.hypot(x - MX, y - MY) < MR else KNOT  # moonlight on the knuckle bones
# a torn strip of dark cloth round the forearm
rag = hand & (yy >= 113 + 4 * np.abs(np.sin(xx * 0.8))) & (yy <= 124 + 6 * np.abs(np.sin(xx * 1.7 + 1)) ** 2)
out[rag] = C(0x1c1638)
out[rag & ~shift(rag, 0, 1)] = C(0x2e2552)
out[rag & edge1 & lit] = C(0x4a3c7a)
out[claw & ~hand] = K
# outline
ring = (shift(hand | claw, 1, 0) | shift(hand | claw, -1, 0) | shift(hand | claw, 0, 1) | shift(hand | claw, 0, -1)) & ~(hand | claw)
out[ring] = K
# the mound: dark soil, a moonlit crust on top, clods
SOIL = [C(0x10122a), C(0x1c2240), C(0x2a3456)]
m = mound & ~hand
top = m & ~shift(m, 0, 1)
out[m] = SOIL[0]
out[m & (rng.random((H, W)) < 0.28)] = SOIL[1]
out[top] = SOIL[2]
out[top & (xx < 160)] = C(0x2f6a7c)
for _ in range(26):
    x, y = int(rng.integers(124, 197)), int(rng.integers(140, 153))
    if mound[y, x] and not hand[y, x]: out[y, x] = SOIL[2]; out[y, min(W - 1, x + 1)] = SOIL[1]
# falling dirt from the forearm
for x, y in [(147, 112), (175, 104), (146, 126), (176, 122), (150, 99), (171, 133), (144, 138), (178, 139)]:
    out[y, x] = SOIL[1]; out[y + 1, x] = K
img = Image.fromarray(out.astype(np.uint8))
img.save("teaser/last-frame.png")
for z in (4, 6): img.resize((W * z, H * z), Image.NEAREST).save(f"teaser/last-frame-{W * z}.png")
print("wrote teaser/last-frame*.png")
