# carriers/

How to write a new carrier file — the reverse map saying which of *your*
content covers which standard code. One file per source. This doc is meant
to be self-contained: paste it (plus, if you have it, the relevant
`../<framework>.json` catalog file for whatever framework you're mapping
against) into a fresh conversation — a Claude Project, a new chat, whatever —
and it should be enough to produce a valid file without needing repo access.

## Where this fits

`../*.json` (the catalog) says what a standard *means* — code, title,
paraphrase. It almost never changes. A carrier file says which of *your*
lessons/chapters/units *cover* that code — it changes every time you add
content. See `../README.md` for the fuller catalog-vs-carriers story if you
want it; you don't need it to write a carrier file.

## File naming

`<source-slug-with-hyphens>.json`, e.g. source `cmu_cs1` (underscores, matches
`meta.source` and the CLI `--source` flag) → filename `cmu-cs1.json`
(hyphens). Same slug pattern for every existing file: `working-in-python.json`
(source `working_in_python`), `little-brother.json` (`little_brother`).

## Top-level shape

```json
{
  "meta": { ... },
  "coverage": { "<framework>": { "<code>": { ... } } },
  "rollups": { ... }
}
```

`rollups` is optional and rare — see the very bottom of this doc.

## `meta` fields

| Field | Required? | What it is |
|---|---|---|
| `title` | yes | Human-readable name, shown in legends and tooltips. e.g. `"CMU CS Academy — CS1"` |
| `abbrev` | yes, once you have ≥4 sources in one combined view | Short mnemonic (2-7 chars), shown as a text label directly on the coverage-map's per-source bars. e.g. `"CS1"`, `"CS50AP+"`. Once several sources are combined, some hues read too close to each other at a glance — the abbrev, not the color, is what actually disambiguates a bar. Pick something a reader would recognize without checking the legend. |
| `source` | yes | The slug, matching the filename (underscores). Must match exactly what you'll pass to `--source` on the command line. |
| `base_url` | yes (use `null` if none) | The site/platform's own base URL, if it has one. Doesn't need to be a real deep-linkable page. |
| `locator_kind` | yes | A short word for what a "locator" means for this source — `"chapter"`, `"unit"`, `"none"`. `"none"` is for a source with no real sub-units (a single blog post, say): a locator entry still needs *some* value (e.g. `"post"`) so `locators` isn't empty, but the display skips the "Chapter"/"Unit" noun entirely and just shows that locator's own `locator_titles` entry — "Unit post" would imply structure that doesn't exist. Otherwise only changes display wording ("Chapter 3" vs "Unit 3"); doesn't affect behavior. |
| `locator_url_template` | yes (use `null` if none) | A Python `.format()` string like `"{base_url}/chap{locator}.html"`, used to build a link *if* the platform has public, stable per-unit URLs. Most third-party/login-gated platforms should just use `null` — do not guess a URL scheme you haven't confirmed. For a single-page source with `locator_kind: "none"`, this is just `"{base_url}"` with no `{locator}` substitution — there's only one page to link to. |
| `readonly_suffix` | optional, rare | `true` only for a source whose `locator_url_template` should get `?readonly` (or `?readonly#anchor`) appended — a JupyterLite-specific convention (`working-in-python.json` is the only current example: always link the static read-only view, never the live notebook pane, since a live pane can interfere with anchor scrolling). Leave unset for everything else, including any other source that happens to set `locator_url_template` — the suffix is not a generic default. |
| `locator_titles` | optional | `{"<locator>": "<human title>"}` — e.g. `{"3": "Functions"}`. Shown next to the locator in tooltips/links: "Chapter 3 (Functions)" (or, with `locator_kind: "none"`, just the title alone). Skip it if you don't know unit/chapter titles. |
| `caveat` | optional | One sentence of honest confidence-flagging, shown nowhere yet but read by humans maintaining the file. Use it whenever the mapping is inferred/unverified rather than directly taught and checked — see `codehs-corgi.json` for the pattern (syllabus-inferred, explicitly lower confidence than `cmu-cs1.json`'s unit-by-unit mapping). **Don't skip this when it's true.** A carrier file that overclaims confidence is worse than one that's honest about being a first pass. |
| `interlude_letters` | optional, rare | Only relevant if `locator_kind` is `"chapter"` and some locators are lettered sub-chapters you want displayed as "Interlude A/B" instead of "Chapter 6b". See `working-in-python.json` for the only current example. Ignore this unless it clearly applies. |
| `alignment_log` | optional | An array recording each alignment pass done on this file, oldest first: `{"date": "YYYY-MM-DD", "by": "who/what did it", "scope": "which frameworks/areas were (re)checked", "note": "optional detail, e.g. how many entries changed"}`. This is a history of *review passes*, not of every edit — add an entry when you deliberately sit down and check this carrier's coverage (or a slice of it, e.g. one framework's newly-added tier) against the source material, not for routine touch-ups. `by` should name whoever/whatever actually did the reading and judgment — a person's name, or the specific model (e.g. `"Claude Sonnet 5"`) if an AI assistant did it — never guess or round to a more prestigious-sounding model than what actually ran. |

## `coverage` structure

```json
"coverage": {
  "castandards": {
    "9-12.AP.14": { "locators": [3, 4, 5], "note": "..." }
  }
}
```

**Framework keys** (only use these four, spelled exactly): `apcsp`,
`castandards`, `csta2026`, `ca-ict-anchor`.

**Codes** must match the catalog exactly, including any grade-band prefix:
`castandards` codes look like `9-12.AP.14` or `6-8.CS.1` (the grade band is
part of the code string, not a separate field). `apcsp` codes are bare like
`3.8`. `csta2026` codes look like `HS-ALG-PS-02`. `ca-ict-anchor` codes look
like `5.12` (anchor standards) or `C4.9` (Pathway C). **Only include a code
if it actually exists in that framework's catalog file** — if you have the
catalog file, grep it; if you don't, ask rather than guess a code.

## Coverage entry fields

Every code you include gets one entry:

| Field | Required? | Meaning |
|---|---|---|
| `locators` | yes | A list. Where in your content this is covered — chapter/unit numbers (ints), or strings for anything non-numeric (e.g. `"7b"`, `"creative-task"`, `"optional-extension"`). **Empty list `[]` is valid and means something specific — see below.** |
| `note` | recommended | A sentence or two, your own words, saying *how* it's covered and any caveat. Style: plain, direct, cites the locator by name/number, honest about partial coverage. Read a few existing files (`cmu-cs1.json` is a good model) for tone. |
| `checked` | only with empty `locators` | `true` means "I specifically looked for this and it's genuinely not covered" — an acknowledged gap, not silence. See the semantics table below. |
| `strength` | recommended for new/re-checked entries | How much of the standard the content actually earns, not just whether it's present at all. Same three-tier vocabulary as `../crosswalk-castandards-csta2017.json`'s `strength_definitions`, reused here for one consistent scale across the whole project: `strong` — the content directly and substantially teaches or demonstrates what the standard asks for; a reader would recognize this as real, thorough coverage, not a stretch. `partial` — genuine coverage of part of the standard's scope, or the same idea in a narrower/shallower form than the standard's own framing (e.g. teaches the mechanism but not through the standard's own example, or covers half of a two-part standard). `related` — touches the same topic or vocabulary, worth surfacing, but on a close read doesn't actually rise to teaching the standard itself (a passing mention, a satirical or one-line example). This is exactly the distinction between content that *touches* a standard and content that *covers* it — don't skip it to make coverage look more complete than it is. **Optional and unset on most existing entries** — those predate this field and haven't been re-graded; treat a missing `strength` as unrated, not as an implicit `strong`. Only applies to real `{"locators": [...], "note": "..."}` coverage entries, never to a `checked: true` gap. |

### The three states, precisely

This is the part most worth getting right, because a whole coverage-map
visualization downstream depends on this exact distinction:

| State | How to write it | What it means |
|---|---|---|
| **Covered** | `{"locators": [3, 7], "note": "..."}` (or `{"locators": [], "note": "..."}` if you don't track per-unit locations for this source) | This source teaches it. |
| **Explicitly not covered** | `{"locators": [], "checked": true, "note": "why not"}` | You looked. It's a real, deliberate gap — not an oversight. Use this when you have something specific to say about *why* (deferred to a later course, out of scope by design, etc.) |
| **No claim / not examined** | Don't include the code at all | You haven't checked, or it's genuinely irrelevant to this source. This is the default for everything you don't explicitly list — **don't pad a file with absent codes to look thorough; just omit them.** |

Getting "explicitly not covered" vs "no claim" backwards is the one mistake
that actually breaks something downstream: a genuinely-uncovered code that's
silently omitted just reads as "nobody's checked yet" everywhere it's
combined with other sources, which is honest. But marking something
`checked: true` when you *haven't* actually verified it is a false claim of
rigor — don't do that to look complete.

### `anchors` (optional, rare)

If you know a specific locator points to a specific labeled section (not
just "chapter 4" but "chapter 4, the part about parameters"), a locator can
carry a section reference:

```json
"locators": [4],
"anchors": { "4": { "slug": "defining-new-functions", "title": "Defining new functions" } }
```

`slug` only makes sense if the source publishes real HTML with that anchor
id — skip this entirely unless you know one exists. `title` alone (no
`slug`) is not currently supported; either both or neither.

## Worked example

From `cmu-cs1.json`, one strong entry and one deliberate-gap entry:

```json
"9-12.AP.14": {
  "locators": [3, 4, 5, 7, 8, 9, "creative-task"],
  "note": "Woven through every conditionals/loop unit (3-5, 7-9) and made explicit in the Creative Task's own design step, which has students list the concepts they plan to use and justify why -- the standard's own language, 'justify the selection.' Not in CMU's own official standards document; the teacher's own classroom analysis argues it should be."
},
"9-12.AP.19": {
  "locators": [],
  "checked": true,
  "note": "Not taught in CS1 -- software license limitations are deliberately deferred to AP CS Principles, where this teacher covers it directly with his own materials."
}
```

## What NOT to do

- Don't invent a code that isn't in the actual catalog file.
- Don't copy a third-party curriculum's own copyrighted materials (syllabus
  text, lesson descriptions) verbatim into a `note` — summarize in your own
  words, same as everywhere else in this project.
- Don't mark something `checked: true` without having actually verified it.
- Don't pad the file with `"locators": []` entries for codes you simply
  haven't looked at — omit them instead.

## After you have the file

Bring it back into `_standards/carriers/<slug>.json` in this repo. To use it:

```
python3 tools/build_alignment.py --catalog _standards --carriers _standards/carriers --out <dir> --source <your_slug> [--source <another>]
```

If it's combined with other sources on `learn.porttack.com/standards/`
(the client-side coverage map, rendered by `assets/js/standards-coverage.js`
from JSON `tools/publish_standards_data.py` publishes), add its slug to
`SOURCE_ORDER` near the top of `tools/publish_standards_data.py` (append it
— don't insert it before an already-shipped source, since that would shift
everyone else's assigned color) and rerun `tools/publish_standards.sh`.

## `rollups` (optional, rare)

A coarser, whole-Big-Idea-level claim, separate from per-code `coverage`.
Only one current example — `working-in-python.json`'s
`rollups.apcsp_big_ideas` — and it's a holdover from before the carrier
schema existed, not a pattern to reach for. Skip this unless you're
specifically trying to match that shape.
