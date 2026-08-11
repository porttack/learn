#!/usr/bin/env bash
# Pulls the latest gh-pages build of porttack/working-in-python into this
# repo's submodule pointer, sanity-checks the site still builds, then
# commits and pushes so learn.porttack.com picks up the new build on its
# next GitHub Pages deploy. See CLAUDE.md, "Mounted external pathways".
set -euo pipefail

SUBMODULE=working-in-python
PUSH=1

for arg in "$@"; do
  case "$arg" in
    --no-push) PUSH=0 ;;
    *)
      echo "usage: $(basename "$0") [--no-push]" >&2
      exit 1
      ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain -- . ":!$SUBMODULE")" ]]; then
  echo "error: working tree has uncommitted changes outside $SUBMODULE." >&2
  echo "Commit or stash them first so this deploy only touches the submodule bump." >&2
  exit 1
fi

if [[ -n "$(git -C "$SUBMODULE" status --porcelain)" ]]; then
  echo "error: $SUBMODULE itself has local changes; resolve before deploying." >&2
  exit 1
fi

old_sha=$(git -C "$SUBMODULE" rev-parse HEAD)

echo "Fetching latest gh-pages build of $SUBMODULE..."
git submodule update --remote "$SUBMODULE"

new_sha=$(git -C "$SUBMODULE" rev-parse HEAD)

if [[ "$old_sha" == "$new_sha" ]]; then
  echo "Already up to date ($old_sha). Nothing to deploy."
  exit 0
fi

echo "New build: $old_sha -> $new_sha"
changelog=$(git -C "$SUBMODULE" log --oneline "$old_sha..$new_sha")
echo "$changelog"

echo "Building site to verify the bump doesn't break the Jekyll build..."
build_dir=$(mktemp -d)
trap 'rm -rf "$build_dir"' EXIT

if ! bundle exec jekyll build --destination "$build_dir" >/tmp/deploy-python-build.log 2>&1; then
  echo "error: jekyll build failed against the new submodule commit; not committing." >&2
  echo "See /tmp/deploy-python-build.log for details." >&2
  exit 1
fi

if [[ ! -e "$build_dir/working-in-python/index.html" ]]; then
  echo "error: build succeeded but $SUBMODULE/index.html is missing from the output; not committing." >&2
  exit 1
fi

echo "Build OK."

git add "$SUBMODULE"
git commit -m "$(cat <<EOF
Bump working-in-python submodule to latest gh-pages

$changelog
EOF
)"

if [[ "$PUSH" -eq 1 ]]; then
  git push
  echo "Pushed. GitHub Pages will rebuild learn.porttack.com shortly."
else
  echo "Committed locally. Run 'git push' when ready (--no-push was set)."
fi
