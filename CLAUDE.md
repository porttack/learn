# learn.porttack.com

Jekyll site hosting multiple learning pathways for a middle and high school
CS/robotics program. Deployed via GitHub Pages on a custom domain.

Author is the classroom teacher. Readers are students (grades 6-12), plus
other teachers who may reuse material.

## Courses

The author teaches three official courses (2026-27 course descriptions).
Pathways in this repo are focus units built from these, not 1:1 with them —
a course may draw on several pathways, and a pathway may be shared across
courses. In practice `_pico` and `_electronics101` are foundational
material reused across AP Computer Science Principles and Programming with
Robotics, not tied to one course — don't assume a lesson there belongs to
just one of them.

**Exploring Computer Science** — no prerequisite. Intro programming course:
building blocks of code, then graphics-based projects (animations, games,
interactive applications). No prior experience assumed.

**AP Computer Science Principles** — prerequisite: Exploring Computer
Science or teacher recommendation. Adapted from Harvard's CS50 (CS50 AP).
Covers algorithms, abstraction, data, global impact, internet technologies.
Programming-heavy but fundamentally about computational thinking; students
are encouraged to sit the AP exam in May.
**Currently shifting to a much more Python-centric version**, built around
*Think Python* and CS50's Python track (cs50-python) — expect new
pathway/lesson content here as that transition lands.

**Programming with Robotics** — prerequisite: Exploring Computer Science
AND teacher recommendation. Underwater robotics (MATE ROV): students run
the class as a simulated engineering company with roles/titles, meeting an
RFP from the competition manual — design, build, and test an ROV, then
compete at local/regional events. This is the course the `rovrobotics`
pathway serves.

## Architecture

One Jekyll **collection per pathway**. A pathway is a sequenced set of
lessons for one course or unit.

    _pico/         MicroPython on Raspberry Pi Pico
    _rovrobotics/  MATE ROV: running the program as an engineering studio
    _electronics101/  Tinkercad circuit sequence

Collections give `/rovrobotics/card-0-2-writing-a-design-decision-record/`
for free via the permalink config. Filenames use the stable card number, not
a sequence prefix, so inserting a lesson later never forces a rename cascade;
`order:` front matter alone drives sort and prev/next nav. Each pathway also
has a landing page at `rovrobotics/index.md` with `permalink: /rovrobotics/`.

`_data/pathways.yml` drives the site index. Add a pathway there when you
create its collection, and add the collection to `_config.yml`.

### Mounted external pathways

Not every pathway is a collection. `working-in-python/` is a git submodule
tracking the `gh-pages` branch of the separate `porttack/working-in-python`
repo — a pre-built static Sphinx site (an AP CSP-oriented fork of Allen
Downey's *Think Python* 3e), not Jekyll source. It also publishes
independently at python.porttack.com; this is a second, mirrored copy, not
a migration.

It still gets a `_data/pathways.yml` entry (for the homepage card) but no
collection, no `_config.yml` collection block, and no lesson front matter —
it's served as plain static files underneath its mount path.

Because it's pre-built with root-relative-free (`_static/...`, `chap01.html`)
asset paths, it can be mounted at any subpath without breaking. The one
gotcha: Jekyll excludes `_`-prefixed entries by default, and its `include:`
config re-includes them by **bare basename only** — never by relative or
nested path. `Jekyll::Reader#read_directories` walks one directory at a
time and hands `EntryFilter` just the bare filename it's looking at, so a
pattern like `working-in-python/*/files/_static` can never match anything;
it has to be `_static` bare, never prefixed with `working-in-python/`. This is
true for files as much as directories -- but as of working-in-python's
2026-08-16 naming cleanup, its chapter/exercises notebooks are no longer
underscore-prefixed at all (`ChapterNN-<Title>[-exercises].ipynb`, Title
Case), so Jekyll includes those by default with no entry needed. The
"teach"/"blank" classroom-projection copy went through two more renames the
same day before working-in-python decided to stop shipping it into the
JupyterLite build at all for now (see that repo's AUDIT.md, 2026-08-16, for
the full back-and-forth) -- it doesn't exist in that submodule right now, so
nothing to include for it either. `_config.yml`'s `include:` now only lists
the handful of `.ipynb` files that still are underscore-prefixed: the two
front-matter notebooks (also Title
Case now: `_Start-Here.ipynb`, `_Using-Notebooks.ipynb`), plus two temporary
aliases for chapters 2 and 3 (old, all-lowercase served names, deliberately
NOT recapitalized since they exist only to match whatever a student's browser
may already have cached -- kept a few days post-cleanup, see that repo's
AUDIT.md, 2026-08-16). Remove the alias lines once working-in-python's own
`ALIASES` dict drops them.

To pull in a new build after the upstream repo pushes to its `gh-pages`
branch (including after a force-push — that's fine, submodules just track
whatever commit `gh-pages` points to when you update):

    git submodule update --remote working-in-python
    git add working-in-python
    git commit -m "Update working-in-python mirror"

### Teacher planning notes

Two non-collection, non-published directories (Jekyll ignores underscore
prefixes by default) hold planning material that isn't a lesson:

    _program-notes/         gitignored. Candid working drafts.
    _program-notes-public/  committed. The same kind of material, reviewed.

Write freely in `_program-notes/`. Once something no longer needs that
privacy, move it to `_program-notes-public/` before committing. Neither
directory is ever rendered as a page; if something needs to be visible to
students, it belongs in a pathway directory instead.

## Stack

- Jekyll with the `minima` theme (GitHub Pages native, no build action needed)
- kramdown with GFM input, Rouge highlighting
- Custom domain via `CNAME`. **Keep `baseurl` empty.** The site is at a domain
  root, not a project path.

Local dev:

    bundle install
    bundle exec jekyll serve

**Claude: use port 4010 for any verification server, never 4000.** The
author often has their own `bundle exec jekyll serve` running on the
default port 4000 for manual testing; `pkill`-ing "jekyll serve" and
restarting it to check a change kills that server out from under them.
Run your own instance on 4010 instead (`bundle exec jekyll serve --port
4010`), and only `pkill` a process you started yourself on that port, never
a blanket `pkill -f "jekyll serve"`.

## Licensing — read before adding content

This repo mixes two content sources. Getting this wrong is the one mistake
that's expensive to unwind.

**Adapted content** derives from *Get Started with MicroPython on Raspberry
Pi Pico*, 2nd ed., by Gareth Halfacree and Ben Everard, which is
CC BY-NC-SA 3.0 Unported. ShareAlike means derivatives stay CC BY-NC-SA 3.0.
Note that 3.0 Unported is not one-way compatible with CC 4.0, so these pages
cannot be relicensed to 4.0.

**Original content** is written by the teacher and carries whatever licence
the site chooses for its own work.

Rules:

1. **Never mix sources within one page.** A page is entirely adapted or
   entirely original. Mixing forces the whole page to 3.0 and makes the
   provenance line a lie. If a lesson needs both, split it into two lessons.
2. Every lesson declares `source:` in front matter — matching an `id` in
   `_data/sources.yml` (e.g. `rpi-pico-2e`) or `original`. The layout renders
   the correct attribution footer from that field. Do not hand-write
   attribution.
3. **Do not commit the EPUB or PDF.** They are gitignored. They are working
   input, not repo content. Redistributing the whole book is a separate
   question from publishing an adaptation, and one we don't need to answer.
4. Images from the book are "except where otherwise noted" territory.
   Photographs are by Brian O'Halloran, illustrations by Sam Alder. Flag any
   image use for review rather than assuming it's covered.
5. No ads, no sponsor logos, no donation links anywhere on this site. The
   NonCommercial term applies. Team fundraising lives on rov.porttack.com,
   which is a separate repo, deliberately.

## Converting from the EPUB

The EPUB is a zip of XHTML plus an images folder. Unzip it somewhere
gitignored and read it directly.

**Write a converter script in `tools/`. Do not hand-transcribe chapters.**
Hand transcription drifts between chapters, burns context, and can't be
re-run when a convention changes — and conventions will change. The script
should walk the spine, emit lesson markdown, and copy images to
`assets/img/<pathway>/`.

An earlier attempt used a project-file upload, which silently ran the EPUB
through a text extractor: images were dropped and every code listing was
flattened (indentation stripped, blank line inserted between each line).
Verify against the real XHTML if a listing looks wrong.

## Content conventions

Front matter:

    ---
    layout: lesson
    title: "Reading a depth sensor"
    pathway: rovrobotics
    order: 8
    source: original          # or rpi-pico-2e
    ---

Figures:

    <figure id="fig-8-2">
      <img src="{{ '/assets/img/rovrobotics/fig-8-2.jpg' | relative_url }}" alt="…">
      <figcaption>Figure 8-2: …</figcaption>
    </figure>

Cross-references link to `#fig-8-2`. Alt text is the caption.

Callouts:

    <aside class="callout warning" markdown="1">
    **WARNING**

    …
    </aside>

Classes: `warning`, `note`, `challenge`.

Code: fenced blocks tagged `python`. Real, runnable MicroPython. Never
pseudocode presented as if it runs.

## Companion materials: graphic organizers and slides

Some chapters get two optional companion pages, built so far for `_pico`
chapters 1 and 3 (`01`/`03-get-to-know...`, `01`/`03-physical-computing`).
Use those two chapters as the template rather than starting from scratch.

**Wiring, on the chapter's own front matter:**

    organizer: /pico/01-graphic-organizer/
    slides: /pico/01-intro-slides/

`pico/index.md`'s contents list reads these to render a small pill link next
to that chapter's title. **The link text must include the chapter number**
(`Chapter {{ lesson.chapter }} slides`, not a bare "Intro slides") — every
row would otherwise show identical, ambiguous link text.

**The graphic organizer** is a printable fill-in-as-you-read worksheet:
`_pico/NN-graphic-organizer.md`, a real collection member (`layout: lesson`,
`order: N.1`, `label: "Chapter N Companion"`, `source: original`,
`companion: true`). The `companion: true` flag excludes it from
`pico/index.md`'s contents list and `pico/print.md`'s full-pathway printout
(both loops skip anything with that flag) while still giving it a working
permalink and correct prev/next nav via the collection.

Reuses `electronics101`'s existing `.checkoff`/`.fill-line`/
`.checkoff-questions` worksheet CSS, plus additions in `assets/main.scss`:
`.vocab-table` (term + definition, definition column deliberately wider,
taller rows so a multi-line answer fits; add `.with-pins` for an extra
narrow physical-pin-number column), `.components-table` (a labeled figure's
parts matched to a category and a description), `.draw-box` (a dashed empty
box for a hand-drawn answer). **Column widths on either table must be set
via an explicit `<colgroup><col style="width: …">` in the markup, not
CSS `th:nth-child`/`td:nth-child` rules** — `table-layout: fixed` sizes
columns from the table's first row, so a width declared only on a body
`<td class="checkbox-cell">` and never the matching header `<th>` is
silently ignored. A `<thead>` on a `table.checkoff` that splits across a
print page boundary repeats automatically (verified empirically); no extra
CSS needed for that. Target **1 to 4 printed pages** — verify with a real
print-to-PDF (headless Chrome + `pdfinfo`), not just the on-screen view,
since taller rows and extra columns can quietly push a page over. If the
teacher flags a topic as something they "only marginally care about," keep
its footprint small (fewer questions, no extra column) rather than giving
it equal weight to the rest of the organizer.

**The slides** are a self-contained page, `pico/NN-intro-slides.html` —
a plain page, **not** a collection member, front matter only carries
`title:`/`permalink:`, no `layout:` (so Jekyll emits the file's own HTML
completely unwrapped, no site chrome). React 18 + ReactDOM 18 (UMD) +
Babel standalone, loaded from `unpkg.com` with **exact pinned versions**,
compiling JSX in-browser. The whole `<script type="text/babel">` body must
be wrapped in `{% raw %}…{% endraw %}` — Liquid otherwise chokes on JSX
object-literal syntax like `style={{ transform: ... }}`, reading `{{` as
its own variable tag. It needs its own `<link rel="icon" ...>` by hand,
since it never goes through `_includes/head.html`'s pathway-scoped favicon
include.

Design rules for the deck itself: big type, few words per slide (the class
reads fast; explanation belongs in a slide's `notes` field, shown only in a
toggleable panel hidden by default so a projected view stays clean, or in
the `?outline=1` printable view for pre-class paper prep). A bullet can be
a plain string or `{ text, href }` to link straight at the chapter or its
organizer. A top-level slide can carry a `down: [...]` array of optional
"down arrow" slides (extra photos, safety detail, a worked example) that
the normal next/prev flow skips right past — put anything that would let a
student skip the actual reading behind one of these, and say so in its own
`notes`. Other built-in features: live 16:9/4:3 aspect toggle, fullscreen,
and deep-linking via `?slide=N&extra=M`.

## Hard content rules

- **ViperIDE, not Thonny.** Students are on Macs with Chrome, connecting over
  WebSerial. There is no software install and no admin rights. Any adapted
  content mentioning Thonny, its Run/Stop icons, interpreter switching, or its
  modes must be rewritten, not converted.
- ViperIDE's Virtual Device runs the MicroPython WebAssembly build. It has no
  `machine` module and no GPIO. Never present it as a way to test hardware
  code.
- Wi-Fi and Bluetooth are near-useless underwater. That's why the tether
  exists. Mention it once as a teaching point, don't build lessons on it.
- Code that touches thrusters, power, or anything in water gets a safety
  callout. Water and mains-adjacent power near teenagers is the real risk in
  this course, not bad syntax.
- **No em dashes or en dashes in original student-facing content.** Part of
  the program's AI-signal awareness; a stray em dash reads as machine-written
  to the students and parents who notice. Applies to prose written for this
  site, not to code, and not to text adapted from a licensed source (e.g. the
  rpi-pico-2e book): a faithful adaptation keeps the source's own dashes
  rather than rewriting its voice out.

## Writing style

- Plain, direct, age-appropriate for grades 6-12 without being condescending.
- Second person. "You'll wire the sensor," not "the student will wire."
- Explain why before how. Students who know why a pull-up resistor is there
  will debug; students who copied a diagram won't.
- Short paragraphs. This gets read on a laptop in a noisy lab.

## Print

Every lesson is printable, and each pathway has a `/print/` page that
concatenates its lessons. Teachers hand out paper. The print stylesheet drops
site chrome, keeps figures and callouts off page boundaries, prevents orphaned
headings, and appends URLs after external links. Test print output when
changing layouts — it breaks silently.
