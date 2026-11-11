#!/bin/sh
# Rebuilds the CS Unplugged banner from the original logo: shrink it to fit a
# 1024x254 white banner, then add the small tagline at the bottom right.
# Usage: tools/banners/make-unplugged.sh ["tagline"]
cd "$(dirname "$0")/../.." || exit 1
TAG="${1:-Great for subs}"
magick -size 1024x254 xc:white \
  \( tools/banners/originals/unplugged.png -background white -flatten -resize 940x \) \
  -gravity center -composite \
  -font Helvetica-Bold -pointsize 20 -fill '#1f3a5f' -gravity southeast \
  -annotate +14+8 "$TAG" assets/img/unplugged/unplugged-banner.png
