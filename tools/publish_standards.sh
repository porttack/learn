#!/usr/bin/env bash
# Regenerate this repo's own public /standards/ pages from _standards/ +
# _standards/carriers/ (the cross-source view -- no --source scoping on
# build_alignment.py, since this is the umbrella repo's exhaustive reference).
# Wraps the generated markdown coverage report in the Jekyll front matter
# standards/index.md's link expects, since build_alignment.py itself stays
# Jekyll-agnostic (working-in-python's Sphinx build consumes the same script
# unwrapped).
#
# The coverage map (build_coverage_map.py) is /standards/'s actual landing
# page (index.html) -- a curated, named list of sources, not "everything in
# the carriers directory": supplement is excluded (not a named course an
# admin would recognize) and cs50psets doesn't exist yet. Add a new source's
# slug to COVERAGE_MAP_SOURCES below once its carrier file is real.
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

COVERAGE_MAP_SOURCES=(working_in_python little_brother cmu_cs1 codehs_corgi cs50ap cs50ap_extended cs50p)
SOURCE_ARGS=()
for s in "${COVERAGE_MAP_SOURCES[@]}"; do SOURCE_ARGS+=(--source "$s"); done

python3 "$ROOT/tools/build_coverage_map.py" --catalog "$ROOT/_standards" --carriers "$ROOT/_standards/carriers" \
  --out "$ROOT/standards" --filename index.html --with-refs-nav \
  --title "Standards Coverage" "${SOURCE_ARGS[@]}"

rm -rf "$TMP"
echo "Published cross-source reference pages + coverage map (index.html) to $ROOT/standards/"
