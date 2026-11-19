# Mochi si Kucing Oren — Eps. 1 "Senin Pagi" (Reels 9:16)

16-second vertical 2D animation (1080×1920, 30 fps), all drawn in code: original character, transitions, synthesized SFX + ukulele music, bold Inter Black captions, warm color grading.

- `mochi.html` — the animation (open it in a browser for a live preview)
- `audio.py` — synthesizes the music and sound effects
- `render.js` + `build.sh` — render the frames and combine them into `mochi_reels.mp4`

Rebuild: `./build.sh` (needs Node + Playwright, Python + NumPy, ffmpeg)

## Episodes 2–5
Shared drawing code lives in `lib.js`; each episode (`ep2.html` … `ep5.html`) defines its scenes plus a sound timeline (`sfx`, `music`).
Build one: `./build_ep.sh 3` → `mochi_eps3.mp4` (`render_ep.js` renders frames, `sfx.py` synthesizes the audio from the timeline).
Upload titles/descriptions: `channel/UPLOAD-EPS-2-5.md`.
