#!/bin/bash
# Records, edits, scores and encodes one TikTok clip:  marketing/clips/make.sh <empire|revenge|naval> <workdir> <out.mp4> [--skip-record]
set -e
S="$1";W="$2";OUT="$3";D="$(dirname "$0")"
[ "$4" = "--skip-record" ] || node "$D/record.js" "$S" "$W/$S"
node "$D/compose.js" "$S" "$W/$S" "$W/$S-out"
node "$D/music.js" "$W/$S-out/marks.json" "$W/$S-out/music.wav"
ffmpeg -y -loglevel error -framerate 30 -i "$W/$S-out/f/%05d.jpg" -i "$W/$S-out/music.wav" \
  -vf "format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -movflags +faststart -c:a aac -b:a 192k -shortest "$OUT"
echo "made $OUT"
