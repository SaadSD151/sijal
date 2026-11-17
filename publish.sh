#!/usr/bin/env bash
# Builds the game and publishes dist/site to the gh-pages branch (GitHub Pages serves it)
set -euo pipefail
cd "$(dirname "$0")"
node build.js
tmp=$(mktemp -d)
cp dist/site/index.html "$tmp/" && touch "$tmp/.nojekyll"
cd "$tmp" && git init -q -b gh-pages && git add -A
git -c user.name="Sijal publisher" -c user.email="noreply@users.noreply.github.com" commit -q -m "Publish game site"
git push -f https://github.com/SaadSD151/sijal gh-pages
rm -rf "$tmp"
