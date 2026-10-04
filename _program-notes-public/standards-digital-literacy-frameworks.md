# Adding digital citizenship / media literacy / AI literacy to the standards map

**Done, 2026-10-03 (three rounds the same week).** Four catalogs are live in
`_standards/` (ISTE, UNESCO MIL, UNESCO AI CFS, and AASL Engage, added in a
follow-up pass), wired into `tools/build_alignment.py`,
`tools/publish_standards_data.py`, `assets/js/standards-coverage.js`, and
`_layouts/lesson.html`, and nested on `/standards/` under one shared
"Digital Citizenship, Media Literacy & AI Literacy" chevron with an
explainer about just how sparse this corner of the standards landscape
actually is -- including, as of a third round, a real answer to "doesn't
California law already require this?" (short answer: no, not yet, but it's
been building toward one since 2023 -- see the new section below). This file
is kept as the record of which source documents and codes were used, and
why -- useful background if a framework ever needs updating, or if the next
step (an actual carrier mapping pass) gets picked up.

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

## What was actually done (2026-10-03)

- [x] Re-confirmed the MIL Guidelines (2022) are still UNESCO's current,
      directly-linked document for this specific table. A newer, related
      publication exists ("Media and Information Literate Citizens: Think
      Critically, Click Wisely," 2nd edition) but it's a teacher-training
      curriculum, not a replacement for this Table 1 -- didn't switch to it.
- [x] Re-fetched the AI CFS source (the July 2024 *draft* PDF has no codes;
      the final publication, mirrored at
      `newmoesitev2.blob.core.windows.net/files/uploads/391105eng.pdf` since
      `unesdoc.unesco.org` blocks direct fetches, has the real
      `4.<level>.<dimension>` numbering) and wrote paraphrases from its
      Chapter 3 competency descriptions, not the table alone.
- [x] Wrote `_standards/iste-digital-citizen.json`, `unesco-mil.json`,
      `unesco-ai-cfs.json` using the shared grouped shape. No em/en dashes or
      `--` in any paraphrase (checked by grep).
- [x] Updated `_standards/README.md` (documents the grouped shape and the
      licensing reasoning for paraphrasing even the CC BY-SA AI CFS source)
      and `_standards/carriers/README.md` (framework keys + code formats;
      also fixed that it was missing `csta2017` from its framework-key list,
      a pre-existing gap unrelated to this change).
- [x] Added `render_grouped` to `build_alignment.py`, `renderGroupedPanel` +
      `reportGroupedSection` to `standards-coverage.js`, three entries to
      `CATALOG_FILES` in `publish_standards_data.py`, and three entries to
      `STANDARDS_FRAMEWORKS` + a generic `groups` branch in `catalogLabel()`
      in `lesson.html`. One shared function per file, not three, since all
      three catalogs use the same shape.
- [x] Regenerated via `tools/publish_standards.sh`. The five pre-existing
      reference pages came out byte-identical (confirmed via `git diff`);
      only `standards/alignment.md` and `standards/data/manifest.json`
      changed, both as pure additions.
- [x] Verified on `bundle exec jekyll serve --port 4010`: `/standards/`
      shows three new panels (4/25/12 badges, matching each catalog's item
      count, all uncovered as expected), all three new reference pages
      serve at 200, no new JS console errors, and the Pico ch.5 lesson's
      standards widget renders unchanged.
- [ ] **Not done, future work:** an actual carrier-mapping pass (deciding
      which lessons genuinely earn coverage under these four frameworks).
      Deliberately out of scope for this round -- see the conversation this
      file was born from for why "add only" was chosen first.

## Round two (same day): a fourth catalog, nesting, and the sparsity writeup

After the first round shipped, the teacher asked two good verification
questions -- is ISTE's 1.2 really only 4 indicators (yes, confirmed directly
against iste.org: every one of ISTE's seven student standards is similarly
small, and the leading "1" in "1.2" is ISTE's own audience prefix, 1=Students
vs 2=Educators/3=Education Leaders/4=Coaches, not something we invented), and
why do all the AI CFS codes start with "4" (because they live in that
document's own Chapter 4, "Specifications of AI competencies for students" --
also confirmed directly, not an artifact of our cataloging). That prompted a
bigger ask: group everything under one visible chevron, say plainly that
standards are sparse here, and look harder for anything else in CSTA/CA/US
sources, footnoting it from the new group.

### A fourth catalog: AASL Engage

Research initially (wrongly) suggested AASL's **Include** Shared Foundation
covered digital citizenship. Checking AASL's own framework-matrix PDF
directly (`180206-AASL-framework-for-learners-2.pdf`, mirrored by RI's
Department of Education since AASL's own site renders key content via JS
that a plain fetch can't see) showed Include is actually about diversity and
inclusion in the learning community generally -- **Engage** is the one
that's actually on-topic ("Demonstrate safe, legal, and ethical creating and
sharing of knowledge products independently while engaging in a community of
practice and an interconnected world"). Added `_standards/aasl-engage.json`:
11 items across 4 groups (Think/Create/Share/Grow, AASL's own Domain
letters), codes `VI.A.1`-`VI.D.3` (`VI.<domain letter>.<n>`, all under the
VI. Engage Shared Foundation). License is ALA/AASL all-rights-reserved, same
paraphrase-only treatment as ISTE and College Board. Wired into all four
files the same way as the first three (same grouped shape, so `render_grouped`
/ `renderGroupedPanel` / `reportGroupedSection` needed no changes, just one
more entry each).

### Nesting on `/standards/`

Confirmed by reading `wirePanelActions()` in `standards-coverage.js` before
touching anything: `.cov-panel` elements are found by a flat
`querySelectorAll`, each toggled independently by its own `<details>` and
`data-panel-category` -- nesting one `.cov-panel` inside another's `<details>`
body needed **zero changes** to that logic, `VIEW_PRESETS`, or the
default-view-on-load behavior. The four frameworks' existing flat `panels`
array entries were replaced with a separate `litPanels` array, wrapped in one
outer `<div class="cov-panel" data-panel-category="lit">` alongside a new
`LIT_EXPLAINER_HTML` constant (module-level, same pattern as Python's
`SITE_MENU_HTML`). Report mode (`?report=<slug>`) stays flat on purpose --
AASL just got a 4th plain `reportGroupedSection(...)` call appended there,
no nesting, since that view is "everything one source covers," not a
taxonomy browse. CSS added to `standards/index.html`'s inline `<style>`:
`.cov-panel .cov-panel` for indentation/smaller heading, `.cov-group-explainer`
styled like `build_alignment.py`'s own `.provenance` box for visual
consistency between the live map and the static reference pages.

### The sparsity writeup and its six footnotes

The explainer states plainly that none of the five original frameworks has a
dedicated digital-citizenship strand, and that all four new ones are
genuinely small (4/25/12/11 items -- guidance-level, not exam-style). Then
six confirmed, already-anchored "related codes elsewhere" links (verified by
curling each generated reference page and grepping for the literal anchor
`id=` before hardcoding the link):

- AP CSP **5.6 Safe Computing** -- passwords/MFA/phishing/malware (the EKs
  `IOC-2.B`/`IOC-2.C` nest directly under this topic; cited at topic level
  per this project's own convention of topic-level AP CSP citations, not
  deep EK codes).
- CSTA 2017 **3A-IC-29** -- automatically-collected data / privacy.
- CSTA 2017 **2-IC-21** -- bias in a technology tested on one kind of user.
- CSTA 2026 **S1-AIN-HR-08** -- human checkpoint in an AI workflow.
- CA CTE ICT **2.6** -- safe/legal/responsible use of digital media.
- CA CTE ICT **3.8** -- digital footprint (new find this round; not
  previously cited anywhere in this project).

Then names what's actually used in practice, and what's coming, neither a
coded standard: **Common Sense Education's** free K-12 Digital Citizenship
Curriculum (not coded, but CDE promotes it every October for Digital
Citizenship Week, and it's cross-walked by its own publisher to ISTE/CASEL/
AASL/Common Core/TEKS), and California's **AB 2071**, the Digital Wellness
Education Act. Checked its actual legislative status rather than assuming:
a related 2023-2024 bill (**AB-787**, "digital citizenship and media
literacy: survey") died in the Assembly Appropriations Committee and never
became law -- it would only have required a survey and an advisory
committee anyway, not a standard. **AB 2071 did pass**: chaptered
2026-09-10, it requires CDE to publish real digital-wellness curriculum
guidance for middle/high schools, explicitly including "evolving digital and
artificial intelligence technologies," by **2028-01-01**. Nothing to catalog
yet, but worth re-checking back around then -- this is the most likely
source of an actual California digital-citizenship standard.

### Verified

`bundle exec jekyll serve --port 4010` + headless Chrome: exactly one
top-level "Digital Citizenship, Media Literacy & AI Literacy" chevron
(confirmed via DOM dump, not just visually), each of the four frameworks
appears exactly once with the right badge count, all six footnote anchors
resolve (200 + literal `id=` match), "Open all"/default-view collapse
behavior matches CSTA's existing precedent (not a regression), report mode
shows AASL flatly, each of the four static reference pages carries a
one-line "See also" pointer back to `/standards/`, and a lesson page's
widget is unaffected. No new JS console errors.

## Round three (same day): does California law actually require this?

The teacher pushed back on round two's California paragraph: doesn't state
law already mandate K-12 digital literacy? Worth researching properly rather
than assuming the round-two summary (AB-787 dead, AB 2071 due 2028) was the
whole picture -- it wasn't.

**The real find: Education Code §33548.** Added by **AB 873** (Berman),
signed 2023-10-13 -- three years earlier than anything round two had found.
It genuinely *defines*, in California statute, "media literacy" ("the
ability to access, analyze, evaluate, and use media and information... the
foundational skills that lead to digital citizenship"), "digital
citizenship" ("a diverse set of skills related to current technology and
social media, including the norms of appropriate, responsible, and healthy
behavior"), and, as amended by **AB 2876** (effective 2025-01-01), "AI
literacy" ("the knowledge, skills, and attitudes associated with how
artificial intelligence works... including its limitations, implications,
and ethical considerations"). A pending bill, **AB 2452** (introduced
2026-02-20, not yet chaptered), would further spell out specific media-
literacy sub-topics (social media health, online permanency, cyberbullying,
predatory behavior, human trafficking awareness) -- worth re-checking once
it resolves.

**But the operative verb throughout is "shall consider incorporating,"
never "shall teach."** §33548 only directs the Instructional Quality
Commission to *consider* folding media literacy into the ELA/ELD, math,
science, and history-social science curriculum frameworks the next time
each is revised after a given date (2024 for media literacy, 2025 for AI
literacy) -- gated behind California's multi-year framework-revision cycle,
not a current-year classroom requirement. **AB 2298** (cybersecurity in
computer science content standards, chaptered 2026-09-10, same day as AB
2071) does the identical soft move: "the commission shall consider
incorporating cybersecurity skills content" when CS content standards are
next revised after 2027-01-01.

**AB 2071 re-examined with its actual text** (round two only had secondhand
summaries): it amends Education Code §§51928/51929, the same mechanism an
earlier law used to require a *mental health* instruction plan by 2024.
Existing law already required that mental-health plan; AB 2071 adds a
parallel "digital wellness instruction" plan requirement, due **2028-01-01**.
Confirmed precisely: this is a plan-development deadline on CDE, not a
requirement that any school teach anything on any date. (A press-friendly
EFF write-up described it more strongly than the bill text supports --
textual confirmation from the bill itself matters more than secondary
coverage here.)

**Loose end from round two, now resolved:** Education Code §51871.5
("Internet Safety"), which repeated searches last time couldn't produce
text for, has been **repealed** (via SB 1038, an education-finance bill).
The only live requirement in that space today is federal: CIPA's E-rate
condition that a district have an internet-safety *policy* (acceptable-use,
filtering), not a curriculum-content requirement.

**Bottom line, now stated precisely in the site's explainer**: California
does not have a law requiring digital/media/AI literacy be taught. It has
been legislating steadily toward one since 2023 (§33548's definitions), with
two more bills in 2026 (AB 2298, AB 2071) extending the same "consider
incorporating" pattern, plus one real, dated deliverable (AB 2071's 2028
plan) that's worth checking back on. The explainer in
`assets/js/standards-coverage.js`'s `LIT_EXPLAINER_HTML` now says exactly
this, with links to §33548, AB 2298, and AB 2071's bill text.

### Verified (round three)

Same jekyll/headless-Chrome process as before: the revised explainer renders
(checked for the literal strings "33548", "AB 2298", "AB 873", "51871.5"),
`node --check` on the edited JS file passes, no em/en dashes or `--`
introduced, badge counts for all four frameworks unchanged (no regression),
no new JS console errors. The three new external links (§33548, AB 2298,
AB 2071) were each separately confirmed to return real content via a proper
fetch (not just a raw `curl`, which times out against
leginfo.legislature.ca.gov for reasons unrelated to the links' validity).
