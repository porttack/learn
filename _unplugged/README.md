# CS Unplugged (`/unplugged/`)

Developer and teacher notes for this section. Not published (excluded in
`_config.yml`). Open work: [`_program-notes-public/unplugged-todo.md`](../_program-notes-public/unplugged-todo.md).

## What it is

Printable computer science worksheets and pair games with no computer, for
grades 6-12: brain breaks, computers-down days, and practice on one idea. A
student should be able to pick up a sheet and do it with no teacher
explanation. Many are Creative Commons or public-domain unplugged
activities rewritten as ready-to-print sheets.

## The rules for every sheet

- **Print and use.** A printed sheet and a pencil. No scissors or cut-out
  cards (the Caesar cipher wheel is the one allowed exception), and nothing
  that needs a teacher running the room. Pair games give each player their
  own page.
- **Simple to understand, 15+ minutes of work.** One idea per sheet, short
  instructions (5 numbered steps or fewer), a worked example before the
  first question, then enough practice on that idea to last. Harder variants
  become a generator level, not more on the page.
- **Aim at 6th/7th grade first**, but never print a grade level on a sheet:
  the teacher sometimes gives middle school sheets to high schoolers. The
  `level:` field only feeds the landing page's teacher-facing table.
- **Black-and-white printers.** Never let color carry meaning.
- **Pictures stay big.** Never shrink a map or puzzle to hit a page count;
  3 pages with a usable picture beats 2 with an unusable one.
- **No em or en dashes in original prose** (site-wide rule). Adapted text
  keeps its source's own dashes. Kramdown turns ` -- ` into an en dash, so
  don't type that either.

## Sources and licences

Every sheet sets `source:` (an `id` in `_data/sources.yml`); the layout
renders the credit footer. **A page is entirely adapted from one source or
entirely original, never mixed.**

| `source:` | What | Licence |
|---|---|---|
| `cs-unplugged-2015` | The CS Unplugged book (Bell, Witten, Fellows), PDF in `tmp/` | CC BY-NC-SA 3.0, **illustrations included** (no carve-out) |
| `cs-unplugged-web` | The csunplugged.org website (set `source_url:`) | CC BY-SA 4.0 |
| `teaching-london-computing` | Paul Curzon, QMUL (set `source_url:`) | CC BY-NC-SA |
| `original` | Written for this site | CC BY-NC-SA 4.0 |

Math for Love and Bootstrap are inspiration only: nothing from them goes on
the site. Traditional games (Nim) are public domain; our write-ups are
original.

**Don't over-paraphrase CC sources.** Where the book's student worksheet
already works for a student alone, keep its wording and pictures nearly
verbatim and change only what print-and-use needs ("counters" becomes
"shade with a pencil"). Rewrite only teacher-script material. The model is
`muddy-city.md`: book wording, book images, the book's "What's it all
about?" reading, extra questions, and the book's solutions as the key.

Book images: `pdfimages -png -f P -l P tmp/CSUnplugged_2015_v3.1.pdf out`
(or `pdftoppm -r 200 -x -y -W -H` for vector figures), grayscale, at most
~1800px wide, into `assets/img/unplugged/<activity>/`. PDF page = book page
+ 8.

## Front matter

    title: "The Muddy City"
    source: cs-unplugged-2015
    level: ms                  # ms | hs | both: landing table only, never shown on the sheet
    topics: [Graphs, Algorithms]   # the landing table groups by the first one
    time: 30                   # minutes
    grouping: "Solo"           # free text; "solo", "pair", "trade" mark the table's columns
    materials: "Pencil"
    generator: /unplugged/muddy-city-generator/     # optional
    generator_presets:                               # optional "Make a new set" buttons
      - { label: "Small towns", query: "size=small" }
    scripts: [/assets/js/unplugged/<slug>-page.js]   # only if the page needs JS
    source_url: https://...    # link to the original activity (web sources, and book activities on classic.csunplugged.org)
    original_print: https://...  # the original printable PDF, when there is one
    k5: true                   # K-5 column: only when the source's own age range is 10 or under
    reviewed: 2026-10-03       # Reviewed column: the teacher has checked this sheet. Only the teacher sets it.
    slides: /unplugged/<slug>-slides/  # optional intro deck (pattern: unplugged/muddy-city-slides.html, copied from the Pico decks)
    supports: /working-in-python/chap09.html         # optional, with supports_title:

`layout`, `pathway`, and `label` come from `_config.yml` defaults. Don't set
`order:`. `kind:` is still on older pages but no longer drives anything.

## What the layout adds automatically

(`_layouts/lesson.html`, for pathways with `name_line: true` in
`_data/pathways.yml`)

- A print-only **Name / Date / Period** line with the section logo.
- The **"Make a new set"** bar from `generator:` / `generator_presets:`
  (screen only; don't write "Want more?" links in page text).
- A **"Show answer key"** link on any page containing `.answer-key`.
- No prev/next links (`nav: none`): the teacher doesn't want them.
- **"Suggest an edit"** (opens the page's source in GitHub's web editor;
  non-collaborators get a fork and a pull request) and **"Request a change
  or fix"** (a prefilled GitHub issue), from `suggest_edits: true` and
  `repository:` in `_config.yml`. Screen only. Both need a GitHub account,
  which GitHub limits to ages 13+. An edit to a sheet's text won't change
  puzzles or keys that live in `_data/` or JS.
- **"Download as Word (.docx)"** (`docx_export: true` in
  `_data/pathways.yml`): `assets/js/docx-export.js` converts the sheet as it
  is showing (current "New set", `?player=`, `?key=1`) into a real .docx in
  the browser, using the `docx` and `html-to-image` libraries from jsdelivr
  (loaded on click). Text, headings, lists, tables, and code stay editable;
  flex/grid widgets, SVG, and images become pictures. Google Docs opens the
  same file when it's uploaded to Drive. To test without clicking, load a
  page with `?docx=selftest`: the file appears base64 in
  `<pre id="docx-selftest">` (headless Chrome's virtual clock won't wait for
  the CDN; drive it over the DevTools protocol instead).
- **"History"**: opens a version-history list under the page (the same idea
  as porttack.com's), loaded from GitHub's public API only when clicked (or
  with `?history` in the URL), because unauthenticated API calls are limited
  to 60 an hour per IP and a school shares one. The link itself goes to the
  file's history on GitHub if the API refuses. It tracks the page's own file,
  not its `_data/` or JS.

## Answer keys

Every sheet with checkable answers ends with a hidden
`<section class="answer-key" markdown="1">` (or a `.answer-key` element its
JS fills). Students never see it: CSS hides it, and `?key=1` (the "Show
answer key" link) shows it for grading. Only a shown key starts a new print
page. **Keys are never hand-typed:** they come from the same data/JS as the
sheet and are verified by that family's checker.

## Checkers

Each activity family keeps its puzzle logic DOM-free in
`assets/js/unplugged/<family>.js` and has a `tools/check_<family>.mjs` that
proves every fixed and generated answer (simulation, brute force, or a
second independent method). Run them all after any change:

    for t in tools/check_*.mjs; do node "$t" | tail -1; done

## Generators

A `companion: true` page `_unplugged/<slug>-generator.md` makes a fresh set
on demand. Shared pieces in `assets/js/unplugged/`: `rng.js` (seeded RNG)
and `generator-shell.js` (toolbar; the seed and options live in the URL, and
the set number prints on the sheet and its key so paper and key match).
**Class sets:** the toolbar's "Copies" option (in `generator-shell.js`)
draws N different sets (#seed, #seed+1, ...) by calling `render()` once per
copy and snapshotting the result; each copy starts a new printed page with
its own Name line, and with `?key=1` all keys print together at the end. It
works for any generator that draws into its root element. "Sets per
student" (1-3) puts that many different sets in each copy, each starting a
new page, so a two-sided print gives one student a set on the front and back
(it lines up only when each set fills exactly one page; Chrome ignores
`break-before: right`, so the browser can't force a copy onto a front side).
**Fixed sheets never depend on a live seed:** generated puzzles used on a
fixed page are frozen into `_data/unplugged/*.yml` (see
`tools/freeze_*.mjs`), so a later generator change can't break a printed
class set.

## Files for one activity family

    _unplugged/<slug>.md                  the sheet
    _unplugged/<slug>-generator.md        optional generator page
    assets/js/unplugged/<family>*.js      logic (DOM-free) + render/page modules
    _data/unplugged/<slug>*.yml           frozen puzzles, transcribed book data
    _includes/unplugged/<slug>*.html      shared markup
    _sass/unplugged/_<family>.scss        styles (imported by _sass/unplugged/_index.scss)
    assets/img/unplugged/<slug>/          images
    tools/check_<family>.mjs              the checker

## Landing page and sequences

`unplugged/index.md` is one table of every non-companion sheet (MS / HS /
Solo / Pair columns, filter buttons), then the sequences, then teacher
notes and other resources. Sequences live in
`_data/unplugged_sequences.yml` and list steps by filename, so one sheet can
be in several tracks.

## Patterns and gotchas

- **Two-player sheets:** each player's section is
  `<section class="..." data-player="A" markdown="1">` starting with
  `{% include unplugged/name-line.html %}`, and the page includes
  `{% include unplugged/player-switch.html %}`, so a teacher can print one
  player's sheet at a time (`?player=A`). Scope the page-break rule with
  `html:not(.only-player-a):not(.only-player-b)` (see `_search.scss`).
- **Code fences in HTML lists** render only if both the `<ol>` and each
  `<li>` carry `markdown="1"`.
- **Tables** in sheets need `width: auto` when cells must stay square:
  minima makes every table 100% wide.
- **Blank last page in print** usually means the page is a few lines over;
  trim or tighten, and check the count with `pdfinfo`.
- **AP robot** (`robot*.js`) follows the exam reference sheet exactly:
  `CAN_MOVE` is relative to the robot (`left`, `right`, `forward`,
  `backward`), and moving into a black square or off the grid leaves the
  robot in place and ends the program.

## Checking print

Build into a scratch folder and print with headless Chrome (JS pages need
time to render):

    bundle exec jekyll build -d /tmp/site
    (cd /tmp/site && python3 -m http.server 4011 &)
    CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "$CH" --headless --disable-gpu --virtual-time-budget=4000 --no-pdf-header-footer \
      --print-to-pdf=out.pdf "http://localhost:4011/unplugged/<slug>/"
    pdfinfo out.pdf | grep Pages

Look at the pages, not just the count. Never use port 4000 (the teacher's
own `jekyll serve`) and only stop servers you started.

## Standards alignment

Starred (reviewed) sheets are aligned in `_standards/carriers/unplugged.json`.
Locators are the sheet's URL slug (`count-the-dots`), enabled by
`standards_locator: slug` on the pathway in `_data/pathways.yml`. Give each
page its own sentence in `locator_notes` when an entry covers several sheets.
After editing, run `bash tools/publish_standards.sh` and commit the
regenerated `standards/` files with it. A sheet not listed in the carrier
shows no "Standards alignment" section at all.

## Short links for subs

`go/<word>.md` pages (layout `redirect`) forward `learn.porttack.com/go/<word>`
to a longer address, so a sub can type it off a printed sub box. Pass
`go="<word>"` to `_includes/unplugged/sub-box.html` along with `slides=` and
the box prints the short address. Use a plain lowercase word, not an
abbreviation: addresses are case-sensitive and typed from paper.
