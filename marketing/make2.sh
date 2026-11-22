#!/bin/bash
# Builds one finished MP4 from a promo2.js render: music from marks, frames at 30 fps, H.264 + AAC
#   marketing/make2.sh <render dir> <out.mp4> <WxH>
set -e
D="$1";OUT="$2";SIZE="$3"
node "$(dirname "$0")/music2.js" "$D/marks.json" "$D/music.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$D/f/%05d.jpg" -i "$D/music.wav" \
  -vf "scale=${SIZE/x/:}:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -movflags +faststart \
  -c:a aac -b:a 192k -shortest "$OUT"
echo "made $OUT"
