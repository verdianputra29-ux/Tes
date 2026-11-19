#!/usr/bin/env bash
# Build the 16:9 long-form compilation from the vertical episodes:
#   intro -> [card N, episode N on side panel, poll N] x5 -> outro (end screen)
# Output: mochi_kompilasi_vol1.mp4 (1920x1080, 30 fps)
set -euo pipefail
cd "$(dirname "$0")"
TMP=$(mktemp -d)
node render_comp.js "$TMP"

ENC="-c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 44100 -ac 2"
for s in "$TMP"/seg_*/; do
  n=$(basename "$s"); n=${n#seg_}
  python3 sfx.py "$s/timeline.json" "$s/audio.wav"
  ffmpeg -y -loglevel error -framerate 30 -i "$s/f%04d.jpg" -i "$s/audio.wav" $ENC -shortest "$TMP/$n.mp4"
done
for e in 1 2 3 4 5; do
  src=mochi_eps$e.mp4; [ "$e" = 1 ] && src=mochi_reels.mp4
  ffmpeg -y -loglevel error -loop 1 -framerate 30 -i "$TMP/panel$e.png" -i "$src" \
    -filter_complex "[1:v]scale=608:1080[v];[0:v][v]overlay=656:0:shortest=1[o]" -map "[o]" -map 1:a $ENC "$TMP/ep$e.mp4"
done
LIST="$TMP/list.txt"; : > "$LIST"
echo "file '$TMP/intro.mp4'" >> "$LIST"
for e in 1 2 3 4 5; do printf "file '%s'\nfile '%s'\nfile '%s'\n" "$TMP/card$e.mp4" "$TMP/ep$e.mp4" "$TMP/poll$e.mp4" >> "$LIST"; done
echo "file '$TMP/outro.mp4'" >> "$LIST"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" $ENC -movflags +faststart mochi_kompilasi_vol1.mp4
rm -rf "$TMP"
echo "done: mochi_kompilasi_vol1.mp4"
