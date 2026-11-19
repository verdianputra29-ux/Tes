#!/usr/bin/env bash
# Build one episode: ./build_ep.sh 2  ->  mochi_eps2.mp4  (1080x1920, 30 fps, H.264 + AAC)
set -euo pipefail
cd "$(dirname "$0")"
N=$1; TMP=$(mktemp -d)
node render_ep.js "ep$N.html" "$TMP"
python3 sfx.py "$TMP/timeline.json" "$TMP/audio.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$TMP/f%04d.jpg" -i "$TMP/audio.wav" \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 192k -shortest -movflags +faststart "mochi_eps$N.mp4"
rm -rf "$TMP"
echo "done: mochi_eps$N.mp4"
