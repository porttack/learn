#!/usr/bin/env bash
# Copies the shared skills widget from the porttack.com repo into this one, unchanged, with a
# one-line header saying where it came from. The widget and its data are authored in porttack.com
# (assets/skills-widget.js and skills-widget-data.js); this repo only keeps a copy for
# /standards/mate/skills-match/. The MATE-to-employer-skill links are also kept in
# _standards/mate-wef-links.json; tools/check_mate_wef_sync.mjs fails if they disagree.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$ROOT/../porttack.com/assets}"
DEST="$ROOT/assets/js/skills-widget"
mkdir -p "$DEST"
for f in skills-widget.js skills-widget-data.js; do
  { echo "/* Copied unchanged from porttack.com/assets/$f on $(date +%Y-%m-%d) by tools/sync_skills_widget.sh. Edit it there, not here. */"
    cat "$SRC/$f"; } > "$DEST/$f"
done
node "$ROOT/tools/check_mate_wef_sync.mjs"
echo "Copied the skills widget from $SRC"
