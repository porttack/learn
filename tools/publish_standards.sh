#!/usr/bin/env bash
# Regenerate this repo's own public /standards/ pages from _standards/ +
# _standards/carriers/ (the cross-source view -- no --source scoping, since
# this is the umbrella repo). Wraps the generated markdown coverage report in
# the Jekyll front matter standards/index.md's link expects, since
# build_alignment.py itself stays Jekyll-agnostic (working-in-python's Sphinx
# build consumes the same script unwrapped).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"

python3 "$ROOT/tools/build_alignment.py" --catalog "$ROOT/_standards" --carriers "$ROOT/_standards/carriers" --out "$TMP"

cp "$TMP"/*.html "$ROOT/standards/"

{
  echo "---"
  echo "layout: default"
  echo 'title: "Standards Alignment"'
  echo "permalink: /standards/alignment/"
  echo "---"
  echo
  tail -n +3 "$TMP/standards-alignment.md"
} > "$ROOT/standards/alignment.md"

rm -rf "$TMP"
echo "Published cross-source reference pages + coverage report to $ROOT/standards/"
