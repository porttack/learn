#!/usr/bin/env bash
# Sync the canonical standards catalog, generator, and named carrier file(s)
# into a consuming repo. One-way: the target repo gets read-only copies, never
# writes back here. Stamps a SYNCED_FROM marker with this repo's commit.
#
# Usage: tools/sync-standards.sh <target-repo-path> <carrier-source-slug> [<carrier-source-slug> ...]
# Example: tools/sync-standards.sh ../working-in-python working_in_python
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <target-repo-path> <carrier-source-slug> [...]" >&2
  exit 1
fi

TARGET="$1"; shift
SOURCES=("$@")

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMIT="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"

mkdir -p "$TARGET/standards" "$TARGET/standards/carriers" "$TARGET/tools"
cp "$ROOT"/_standards/*.json "$TARGET/standards/"
cp "$ROOT/tools/build_alignment.py" "$TARGET/tools/build_alignment.py"

for slug in "${SOURCES[@]}"; do
  file="$(echo "$slug" | tr '_' '-').json"
  cp "$ROOT/_standards/carriers/$file" "$TARGET/standards/carriers/$file"
done

cat > "$TARGET/standards/SYNCED_FROM.md" <<EOF
Synced from learn repo commit $COMMIT on $(date -u +%Y-%m-%d).
Canonical source: learn/_standards/, learn/tools/build_alignment.py.
Do not hand-edit standards/*.json or tools/build_alignment.py here --
edit them in the learn repo and re-run tools/sync-standards.sh.
Carrier file(s) synced: ${SOURCES[*]}
EOF

echo "Synced catalog + generator + carriers (${SOURCES[*]}) into $TARGET"
