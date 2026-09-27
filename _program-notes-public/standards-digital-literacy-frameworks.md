# Adding digital citizenship / media literacy / AI literacy to the standards map

Not started yet. Picking this back up should start from this file, not
memory. Full engineering plan (code-change level detail) also saved locally
in Claude Code's plan store as `curried-shimmying-pinwheel.md` -- that copy
isn't in git and may not survive a machine change, so treat this file as the
source of truth and the other as a bonus.

## Why

An audit of `_standards/` (five frameworks: AP CSP, CA CS, CSTA 2017, CSTA
2026, CA CTE ICT) found essentially nothing mapped for password/account
safety, terms-of-service literacy, or AI/media literacy specifically. A few
carriers touch adjacent ground (`little-brother.json` maps CA ICT `2.6` and
`8.8`; `codeorg-apcsp.json` picks up some AP CSP `IOC-2.*` privacy/security
codes) but nothing purpose-built. Decision: add three new framework catalogs,
one per topic, appended after the existing five. **This pass is add-and-wire
only** -- no carrier gets coverage entries yet, so all three will show up
fully unmapped on `/standards/`. Mapping actual lesson content to them is a
separate, later pass.

## The three frameworks (confirmed against primary sources this session)

### 1. Digital citizenship: ISTE Standards for Students, 1.2 Digital Citizen (2024 refresh)

Fetched from iste.org directly. Stem: "Students recognize the
responsibilities and opportunities for positively contributing to their
digital communities."

- **1.2.a Digital Footprint** -- managing digital identity, understanding
  lasting impact of online behavior, safe/legal/ethical decisions.
- **1.2.b Online Interactions** -- empathetic, inclusive interactions;
  contributing responsibly to online communities.
- **1.2.c Safeguard Well-being** -- being intentional about online time and
  activity for one's own well-being.
- **1.2.d Digital Privacy** -- protecting digital privacy, managing personal
  data and security.

Copyright: "ISTE Standards (c) 2024 4.02, ISTE. All rights reserved." -- same
codes-and-names-only, our-own-paraphrase approach already used for AP CSP
(College Board is also all-rights-reserved) is the right model here, per
`_standards/README.md`'s existing convention. Do not use the 2016 version's
wording (it doesn't have the same four sub-codes; the 2024 refresh
restructured 1.2).

### 2. Media literacy: UNESCO *Global Standards for Media and Information
Literacy Curricula Development Guidelines* (2022), Table 1

Fetched the PDF directly (not yet re-checked for a newer edition -- worth a
quick re-search before starting). Table 1 lists **19 broad MIL learning
outcomes/competencies** (numbered 1-19) plus **6 values/attitudes** (numbered
20-25). Directly relevant ones for our gap:

- **#3** -- conditions of use of information/media providers: the closest
  thing to a "terms of service" standard that exists in any framework I
  checked (also covers disinformation/misinformation and fact-checking).
- **#5** -- critically evaluate content (source credibility, authenticity,
  debunking conspiracy theories).
- **#6** -- protect oneself from online risks: phishing, identity theft,
  spyware -- this is the password/account-safety standard.
- **#14** -- manage privacy online and offline.
- **#15** -- games and AI: understanding AI within games, advocating for
  transparency/audits of AI.
- **#19** -- recognizing and responding to hate speech / violent extremism.

Full text of all 25 items is in the scratchpad copy of the PDF (not
committed) from this session; re-fetch before writing the catalog rather than
relying on this summary, since only a handful of items were read closely.

### 3. AI literacy: UNESCO *AI Competency Framework for Students* (2024)

**Important correction from earlier assumption:** I originally thought
UNESCO assigned no codes here and planned to invent project-local ones. That
was wrong -- confirmed by pulling and reading the actual 80-page publication
(`391105eng.pdf`, mirrored at
`https://newmoesitev2.blob.core.windows.net/files/uploads/391105eng.pdf`
since unesdoc.unesco.org blocks direct fetches; the July 2024 *draft* PDF
that's easier to find has no codes, but the final publication does).

**License: CC-BY-SA 3.0 IGO** (Attribution-ShareAlike) -- unlike ISTE and
College Board, this one can likely be quoted more directly, though ShareAlike
has implications worth thinking through given this repo's own CC BY-NC-SA
entanglement with the Pico book (see CLAUDE.md's Licensing section) --
don't just assume compatibility, check before reusing anything beyond a
paraphrase.

Real official numbering: competency code `4.<level>.<dimension>`, and each
competency has 2-3 curricular goals coded `CG4.<level>.<dimension>.<n>`.
Levels: 1=Understand, 2=Apply, 3=Create. Dimensions: 1=Human-centred mindset,
2=Ethics of AI, 3=AI techniques and applications, 4=AI system design.

| Code | Competency name |
|---|---|
| 4.1.1 | Human agency |
| 4.1.2 | Embodied ethics |
| 4.1.3 | AI foundations |
| 4.1.4 | Problem scoping |
| 4.2.1 | Human accountability |
| 4.2.2 | Safe and responsible use |
| 4.2.3 | Application skills |
| 4.2.4 | Architecture design |
| 4.3.1 | AI society citizenship |
| 4.3.2 | Ethics by design |
| 4.3.3 | Creating AI tools |
| 4.3.4 | Iteration and feedback loops |

Each has a full paragraph description in Chapter 3 of the PDF (read in full
this session) plus curricular goals in Chapter 4 (skimmed, not fully read).
Use the Chapter 3 paragraph as the basis for a one-sentence paraphrase per
competency -- do not paraphrase from this table alone, it's too thin.

## Engineering scope (confirmed by reading the actual code, not guessed)

There's no single registry that makes a new framework "just work." Three
files need hand edits, because each new catalog will have its own JSON shape
unless normalized into a shared one:

1. **`tools/build_alignment.py`** -- hardcoded `catalogs` dict in `main()`
   (~L801), one `render_*` function per catalog shape (~L417-660s), hardcoded
   output filenames in both the docstring and `main()`, and a hardcoded
   `fw_entries` dict in `build_markdown()` (~L756).
2. **`tools/publish_standards_data.py`** -- hardcoded `CATALOG_FILES` list
   (~L20), which is the thing that actually drives `manifest.json`.
3. **`assets/js/standards-coverage.js`** -- generic manifest-driven fetch/join
   logic, but the on-page `panels` array (~L1199) and matching
   `render*Panel`/`report*Section` function pairs (~L334-656) are hand-written
   per framework and won't pick up a new one automatically. File has a
   non-UTF-8 byte somewhere -- edit with the Edit tool, never `sed`/regex
   replace across the whole file.
4. **`_layouts/lesson.html`** -- `STANDARDS_FRAMEWORKS` map (~L132) and
   `catalogLabel()`'s per-framework branches (~L151) for the per-lesson
   widget.

Plan (from the earlier planning session): give all three new catalogs one
shared "grouped" JSON shape (`meta` + `groups[].items[]`, each item has
`code`/`name?`/`level?`/`paraphrase`) so it only takes *one* new render
function per file (not three), based on the existing `render_ca_ict` /
`renderCaIctPanel` / `reportCaIctSection` pattern, which already handles
nested groups-with-items.

## To resume

- [ ] Re-confirm the MIL Guidelines are still the current edition (quick
      search -- a lot can change in the intervening time).
- [ ] Re-fetch/re-verify the AI CFS Chapter 3 paragraph text before writing
      paraphrases (scratchpad copy is session-local and gone by next visit).
- [ ] Write the three catalog JSON files in `_standards/` using the shared
      grouped shape. No em/en dashes or `--` in any paraphrase (student-facing
      text rule).
- [ ] Update `_standards/README.md` and `_standards/carriers/README.md` to
      list the three new framework keys.
- [ ] Make the four code changes above (`build_alignment.py`,
      `publish_standards_data.py`, `standards-coverage.js`,
      `_layouts/lesson.html`).
- [ ] Regenerate via `tools/publish_standards.sh`.
- [ ] Verify: `bundle exec jekyll serve --port 4010` (never 4000 --
      that's the teacher's own dev server); check `/standards/` shows three
      new empty panels, a lesson page's standards widget still renders, and
      the five existing reference pages are byte-identical to what's
      committed.
- [ ] Only after all that: decide whether/how to start an actual carrier
      mapping pass (out of scope for this round -- see conversation this was
      born from for the reasoning on why "add only" was chosen first).
