# _standards/

Canonical catalog of standard codes and original paraphrases: `apcsp.json`,
`castandards.json`, `csta2026.json`, `ca-ict-anchor.json`, `crosswalk.json`.
Each contains only official codes and paraphrases written for this project —
never verbatim framework text. The third-party framework documents these are
built from (the AP CSP CED, California K-12 CS Standards, CSTA 2026, CA CTE
ICT) are never committed here.

**This directory used to live in `working-in-python`.** It moved here because
it stopped being book-specific the moment a second content source
(`little_brother`, a blog post in `porttack.com`) needed to cite it — a
standards catalog is naturally scoped to the whole course, not to one book's
mirror repo. See `carriers/` for the reverse map this used to
carry inline.

## What moved out: `carriers[]`

Every standard-level entry used to carry a `carriers: [{source, chapters}]`
array recording which content covers it. That's alignment data, not catalog
data — it changes every time a lesson is written, while the catalog only
changes when a framework itself is revised. It now lives in
`carriers/<source>.json`, one file per content source, keyed by
framework and code. `../tools/build_alignment.py` joins the two back together
to generate reference pages and coverage reports.

Two fields that used to sit next to `carriers[]` moved with it, because they
are alignment prose, not catalog description:

- `note` — nearly every occurrence discusses *this project's* coverage of a
  standard (a gap, a partial match, a chapter reference), not the standard's
  own meaning. Two exceptions were split by hand during the move
  (`castandards` `9-12.CS.1`, which opened with a framework-scope clause
  before the coverage discussion — the scope half is now `scope_note`) — see
  git history on this file for the ones that needed judgment.
- `apcsp.json`'s `big_ideas[].carrier` — a coarse "primary carrier for this
  whole Big Idea" rollup, now under `rollups.apcsp_big_ideas` in
  `carriers/working-in-python.json`.

## Consuming this from another repo

Copy this directory (it includes `carriers/<your-source>.json`) and
`../tools/build_alignment.py` via `../tools/sync-standards.sh`, then run the
generator locally against just your own carrier file. See that script's
header for the exact invocation. Nothing here is served as a live API — these
are static files and a build-time script, matched to how every site in this
project (including this one) is a static Jekyll build.
