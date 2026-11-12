#!/bin/sh
# Rebuilds the Standards banner at exactly 1024x254 (the size of every other
# banner, so nothing is cropped anywhere). The original artwork is 1024x237, so
# its canvas is extended downward by mirroring the bottom edge (no stretching),
# then a small tagline goes in the bottom right on a white tab.
# Usage: tools/banners/make-standards.sh ["tagline"]
cd "$(dirname "$0")/../.." || exit 1
TAG="${1:-Standards Alignments}"
magick tools/banners/originals/standards.png \
  -virtual-pixel Mirror -set option:distort:viewport 1024x254+0+0 \
  -distort Affine '0,0 0,0 1,1 1,1' +repage \
  -font Helvetica-Bold -pointsize 28 -fill '#1565c0' -undercolor white \
  -gravity southeast -annotate +10+6 " $TAG " assets/img/standards/standards.png
