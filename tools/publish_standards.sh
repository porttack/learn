#!/usr/bin/env bash
# Regenerate this repo's own public /standards/ pages from _standards/ +
# _standards/carriers/ (the cross-source view -- no --source scoping on
# build_alignment.py, since this is the umbrella repo's exhaustive reference).
# Wraps the generated markdown coverage report in the Jekyll front matter
# standards/index.md's link expects, since build_alignment.py itself stays
# Jekyll-agnostic (working-in-python's Sphinx build consumes the same script
# unwrapped).
#
# /standards/'s landing page (index.html) is hand-authored, not generated --
# it's a static shell that fetches standards/data/*.json at runtime and
# renders the coverage map client-side, with a checkbox per source. This
# script only refreshes that data (standards/data/), via
# publish_standards_data.py -- the curated source list + hue assignment live
# there now (formerly build_coverage_map.py, which rendered the page
# server-side and is retired). Editing standards/index.html or
# assets/js/standards-coverage.js is a normal hand-edit; this script has
# nothing to do with them.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"

python3 "$ROOT/tools/build_alignment.py" --catalog "$ROOT/_standards" --carriers "$ROOT/_standards/carriers" --out "$TMP"

cp "$TMP"/*.html "$ROOT/standards/"

# One printable per-source report per carrier (standards/reports/<slug>.html) --
# regenerated wholesale each run, same as the reference pages above, so a
# carrier that's removed doesn't leave a stale report behind.
rm -rf "$ROOT/standards/reports"
cp -r "$TMP/reports" "$ROOT/standards/reports"

{
  echo "---"
  echo "layout: default"
  echo 'title: "Standards Alignment"'
  echo "permalink: /standards/alignment/"
  echo "---"
  echo
  tail -n +3 "$TMP/standards-alignment.md"
} > "$ROOT/standards/alignment.md"

python3 "$ROOT/tools/publish_standards_data.py" --catalog "$ROOT/_standards" --carriers "$ROOT/_standards/carriers" --out "$ROOT/standards/data"

rm -rf "$TMP"
echo "Published cross-source reference pages + coverage data (standards/data/) to $ROOT/standards/"
