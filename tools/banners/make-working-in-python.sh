#!/bin/sh
# Rebuilds the Working in Python banner from the original artwork: the baked-in
# grey checkerboard becomes white, the name goes small across the top and the
# tagline small along the bottom, both centered.
cd "$(dirname "$0")/../.." || exit 1
magick tools/banners/originals/working-in-python.png \
  -fuzz 3% -fill white -opaque 'srgb(229,229,229)' \
  -font Helvetica-Bold -fill '#1f3a5f' \
  -gravity north -pointsize 26 -annotate +0+8 "Working in Python" \
  -gravity south -pointsize 19 -annotate +0+9 "Jupyter notebooks that run in your browser" \
  assets/img/working-in-python/banner.png
