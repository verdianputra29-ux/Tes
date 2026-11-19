#!/usr/bin/env bash
# Build mochi_reels.mp4 (1080x1920, 30 fps, 16 s, H.264 + AAC)
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d)
node render.js "$TMP/frames"
python3 audio.py "$TMP/audio.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$TMP/frames/f%04d.jpg" -i "$TMP/audio.wav" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 192k -shortest -movflags +faststart mochi_reels.mp4
rm -rf "$TMP"
echo "done: $(pwd)/mochi_reels.mp4"
