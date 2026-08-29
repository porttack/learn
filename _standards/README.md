# _standards/

Canonical catalog of standard codes and original paraphrases: `apcsp.json`,
`castandards.json`, `csta2026.json`, `csta2017.json`, `ca-ict-anchor.json`,
`crosswalk.json`, `crosswalk-castandards-csta2017.json`. Each contains only
official codes and paraphrases written for this project — never verbatim
framework text. The third-party framework documents these are built from (the
AP CSP CED, California K-12 CS Standards, CSTA 2026, CSTA 2017, CA CTE ICT)
are never committed here.

`csta2017.json`'s paraphrases are written directly from CSTA's own 2017 text,
independently of `castandards.json` — even for the Level 2 (6-8) standards
California adapted almost unchanged, the point of cataloging both frameworks
is to let a reader compare their actual wording, so reusing one file's
paraphrase in the other would defeat that. `crosswalk-castandards-csta2017.json`
is what actually makes the comparison possible: a hand-built, code-to-code
mapping with a strength rating (`strong`/`partial`/`related`) and a note on
any difference in wording or scope, in the same spirit as `crosswalk.json`
below but for California's standards against CSTA 2017 instead of AP CSP. It
surfaces some real divergences — CA's 6-8.IC.23 (software licensing) has no
Level 2 counterpart at all, CA's core 9-12 AP strand draws entirely from
CSTA's Level 3A (all seventeen of Level 3B's AP standards go unindexed on the
CA side), and a few CA 9-12 standards turn out to renumber or blend CSTA's
Level 3A/3B standards in ways the code alone doesn't reveal.

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
