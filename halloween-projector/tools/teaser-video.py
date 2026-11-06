# Turn the teaser video (teaser/video/source.mp4, Veo, 1280x720, 24 fps) into the scene's own pixels: every frame box-averaged down to
# 320x180, all frames mapped to one shared 255-colour palette (so it flickers less than per-frame colours), packed as zlib'd indices.
# The frame where the hand stands still in front of the moon is picked as the stop for the title. The video's sound is not used.
#   python3 tools/teaser-video.py FRAMES_DIR   (FRAMES_DIR: the source frames as f001.png...; ffmpeg -i source.mp4 -an DIR/f%03d.png)
#   -> teaser/video/frames.bin, teaser/video/meta.json
# The video's own sound goes next to it as teaser/video/sound.wav: ffmpeg -i source.mp4 -vn -ac 2 -ar 44100 -c:a pcm_s16le sound.wav
import json, sys, zlib, glob
import numpy as np
from PIL import Image

src = sorted(glob.glob(sys.argv[1] + "/f*.png"))
W, H = 320, 180
small = [Image.open(p).convert("RGB").resize((W, H), Image.BOX) for p in src]
# palette from a montage of every 4th frame
mont = Image.new("RGB", (W, H * len(small[::4])))
for i, im in enumerate(small[::4]): mont.paste(im, (0, i * H))
palimg = mont.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
idx = np.stack([np.asarray(im.quantize(palette=palimg, dither=Image.Dither.NONE)) for im in small]).astype(np.uint8)
pal = np.asarray(palimg.getpalette()[:255 * 3]).reshape(-1, 3)
# the stop: in the stretch where the picture hardly moves (the hand held up), the frame with the least change around it
g = np.stack([np.asarray(im.convert("L")).astype(float) for im in small])
mot = np.r_[0, np.abs(np.diff(g, axis=0)).mean((1, 2))]
lo, hi = len(src) // 3, 2 * len(src) // 3
win = np.convolve(mot, np.ones(9) / 9, "same")
stop = int(lo + np.argmin(win[lo:hi]))
open("teaser/video/frames.bin", "wb").write(zlib.compress(idx.tobytes(), 9))
json.dump({"w": W, "h": H, "n": len(src), "fps": 24, "stop": stop, "pal": ["%06x" % (r << 16 | g_ << 8 | b) for r, g_, b in pal]}, open("teaser/video/meta.json", "w"))
print("frames", len(src), "stop at frame", stop, f"({stop / 24:.2f} s)", "bin", round(len(open('teaser/video/frames.bin', 'rb').read()) / 1e6, 2), "MB")
