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

`_data/pathways.yml` drives the site index. `suggest_edits: true` on a
pathway there adds "Suggest an edit" / "Request a change or fix" / "History"
links to the bottom of its lesson pages (GitHub web editor, a prefilled
issue, and on-demand version history; see `_layouts/lesson.html`). On for
CS Unplugged, CS50 Problems, and ROV Robotics. `docx_export: true` adds a
"Download as Word (.docx)" button (in-browser conversion of the page as
shown; `assets/js/docx-export.js`); on for CS Unplugged. Add a pathway there when you
create its collection, and add the collection to `_config.yml`.

### TurtleLab Lessons (`_turtlelessons/`)

Eighteen steps that use TurtleLab, at `/turtle-lessons/`: 1 initials, 2 loops, 3 random, 4 if/else, 5 a capstone (random art), then
(added 2026-11-06, after the capstone, so nothing already published was renumbered) 6 Boxes (variables), 7 Boxes that count,
8 Teach the turtle a word (your own blocks), 9 A loop inside a loop, 10 Color is three numbers (RGB, hex, binary), 11 Find the bug,
12 Capstone 2 (a box, a block of your own and a loop), then (added 2026-11-06 again, after Capstone 2, so nothing was renumbered) 13 Ask for a number (the `ask` block), 14 Click to draw (`when paper clicked`, `mouseX`, `mouseY`) and 15 Capstone 3 (ask and click, with a block of your own and a loop), then (added 2026-11-06 once more, after Capstone 3, so nothing was renumbered) 16 Catch the square (`and`, `or` and `not`, and a click game), then (added 2026-11-07, after Step 16, so nothing was renumbered) 17 Steer the snake (`when [key] pressed`, `every`, and a snake game), then (added 2026-11-07 once more, after Step 17, so nothing was renumbered) 18 Capstone 4 (a game of the student's own). Files are `_turtlelessons/step-N-slug.md`, `order: N`; the label "Step N" comes from `order`
(so a fractional order would show as "Step 4.5"), and `turtlelab/test/lessons.test.js` requires the steps to be 1 to N with none missing. It is a normal collection (original content, `source: original`), **not**
inside `turtlelab/` (that folder is the AGPL app; CC lesson content stays out) and **not** named
`turtlelab` (that would collide with the app's own `/turtlelab/` folder). Each step starts from a
TurtleLab demo the student changes. **Steps 1 to 4, 6 to 11, 13 and 14 show the demo inside the page** (Step 1: an L to read and run, `lesson-l`, and an L and an I with the four blocks that walk the turtle between letters, `lesson-travel`; both pass `grid="numbers"` so the frame shows the x and y grid, and there is no block of your own on the page; the student still BUILDS the L, and the initials, in a fresh tab. Step 8 frames the B drawn two ways, `lesson-b-two-ways`, and the teacher's own E and B, a B of angled lines with the turtle walking from the E to the B by `pen up, forward 20, left 90, pen down`, `lesson-b-diagonal` (their Logo, word for word; a test requires the same drawing). They were in Step 1 until 2026-11-07; the user had asked for them on 2026-11-06: "the build an L needs an embed, and see how it is done could show B drawn two different ways and demo how to travel between letters") with `{% include turtlelab-embed.html sample="ID" title="..." %}` (optional `grid="numbers"`, any `?grid=` kind)
(a frame of the real app in its slim `?embed=1` mode: see `turtlelab/CLAUDE.md`, "Embedding in lessons"; at most four per page, each is a whole copy of the app;
on paper the frame is replaced by its address). A frame has no PDF button and never saves, so steps that end in a PDF say "Open full size" first. Step 6 teaches the word **variable** and calls TurtleLab's boxes variables throughout; its main demo (`lesson-box-steps`) is one slow program (it uses a `speed 1` block) so each REAL block lights up while the
yellow box strip and the Output box change (2026-11-06, the user: the first version, a custom "Box lab" with buttons like "store box1 + 1 in box1" and "look at box1", was confusing because those are not blocks:
"use the actual blocks from our implementation"; it was deleted). Never describe a block in a way the app does not show it: `store in box1` has a number slot, `box1` is a round block, a `+` block goes in the slot.
(A tapped stack runs with fresh boxes at 0, so separate stacks cannot show a variable keeping its value: use one program.)
**Steps 13 and 14 (2026-11-06) teach the two ways a program listens to a person.** Step 13's frame (`lesson-ask-sides`) asks as soon as it loads; Step 14's (`lesson-click-stamp`) is listening as soon as it loads. Both are demos that WAIT for a person, so the sample says what to type (`answers`) or where to click (`clicks`) and the tests and browser checks do it (see `turtlelab/CLAUDE.md`, "Samples"). Gotchas the pages teach: `ask` always writes box1 (a second answer replaces the first; store it in another box to keep it); the PDF button's run-first answers an ask with 0, so a student must run, answer and click BEFORE pressing PDF (Steps 13, 14 and 15 say so). Step 15 (Capstone 3) has no frames, like Step 12, and the rubric for it is the teacher's to write (the teacher notes offer to draft one).
**Step 16 (2026-11-06, `_turtlelessons/step-16-catch-the-square.md`) teaches the Math blocks `and`, `or` and `not` and ends in a click game.** Three frames: `lesson-click-and` (a red stripe from x = 100 to 220, and a handler that prints the click's x and then 1 for a click inside it, 0 for one outside, by `mouseX > 100 and mouseX < 220`; both stripe frames pass `grid="numbers"` so a student can aim at an x, and print the x because nobody can click exactly 160), `lesson-click-or` (the same stripe asked the other way, with `or`: 1 for outside) and `lesson-click-game` (a red square that jumps to a random place when clicked; box1 is the score, box2 and box3 are where the square's corner is, box4 is scratch for "how far from the corner is the click"). **The game frame has no blocks showing:** the sample says `hideBlocks: true`, and `main.js` hides the blocks only inside an embed (no button there to bring them back), because its handler is too wide to sit beside the paper in a 700 wide frame; the page shows the program as an outline (the block that draws the square in full, the click handler with the two questions left in brackets for the student to build) and "Open full size" is the whole app with the blocks. The hit test is two nested `if`s, each `box4 > 0 and box4 < 60`, on purpose: it keeps every block narrow enough to read, and Done early replaces it with one `if` of `and`s inside an `and`. A click on the turtle counts as a click on the paper (the locked turtle lets presses through, `app.css`), because the turtle sits on the square's corner. The user (2026-11-06) asked for "these 3 things": the three blocks, the ring where a click lands, and this step. The assignment text is in the teacher notes, with no rubric (it offers to draft one, as for Capstone 3). No app screenshots in these pages (its artwork is AGPL). "TurtleLab Lessons" is in the site menu and in TurtleLab's own toolbar.

**Step 17 (2026-11-07, `_turtlelessons/step-17-steer-the-snake.md`) teaches `when [key] pressed` and `every` and ends in a snake game.** The user (2026-11-07) asked for "onKeyPress and onStep too" so a snake could be written. Three frames: `lesson-key-steer` (up arrow walks 20, left and right turn a quarter; the page says to click the paper once so the frame has the keyboard), `lesson-every-spiral` (an `every 3` that draws a growing spiral by itself: the third tick walks 24 and leaves 32 in box1) and `lesson-snake` (`hideBlocks`, like the click game: the page gives the two blocks of the student's own, `food` and `restart`, in full and the rest as an outline with the questions left in brackets). **The snake fits the four boxes by getting fatter instead of longer** (pen size is the score; box3 and box4 remember where the snake was while `food` walks to a new place and back); the page says so honestly. It uses two `if`s with an `or` each for the edges (one `or` of four questions was 880 px wide and covered the paper whenever the blocks were showing) and nested `if`s of `and` for the square, as Step 16 did. The assignment text is in the teacher notes with no rubric (it offers to draft one), the answer key has numbers computed by running the real programs (`lessons.test.js` plays the snake), and the standards had a fifth pass (AP CSP 1.2, 3.1, 3.5, 3.7, 3.12 and California 6-8.AP.12). A program with keys or timers needs `speed 4` under Start (blocks wait 100 ms each at the default speed), and a key does nothing until the paper has been clicked once; both are on the page and in the teacher notes' stuck list.

**Step 18 (2026-11-07, `_turtlelessons/step-18-capstone-4.md`) is Capstone 4, a game or toy of the student's own** (the user, 2026-11-07, right after Step 17: "can we create a lesson about all this -- and maybe a few samples?"; Step 17 already taught the blocks, so this is the capstone, in the shape of Steps 12 and 15). No frames. It sends the student to five **listed** samples on the Samples page first (`keyboard-painter` for keys, `bouncing-turtle` for a timer and `or`, `click-flowers` for clicks, a block of your own and random, `catch-the-square` and `fat-snake` for the two games), offers four themes (click race, steer a painter, catch the falling dot, your own snake), asks for three plan sentences and at least two of the three ways of listening, a box that changes, an `if` with `and` or `or`, a block of their own used twice, a loop and two colors. The teacher notes have the paste-ready assignment text with **no rubric** (it offers to draft one) and the answer key says nothing is checked by number. Standards sixth pass (AP CSP 1.3, 1.2, 3.1, 3.5, 3.12). **The five listed samples** are ordinary samples (blocks showing, no `hideBlocks`) with their own thumbnails; the two games share their programs with the lesson-only `lesson-click-game` and `lesson-snake` through constants in `samples.js` (`CLICK_GAME`, `SNAKE_GAME`), so a change to a game is made once. `dev/make-sample-thumbs.mjs` now acts as a person (clicks, keys, waits for a timer) before it photographs a sample that listens.

**Units (2026-11-07, the user: "i think we need to break these lessons into units and represent those somewhat visually in our list of lessons").** Four units, each ending in its capstone: 1 (Steps 1 to 5, "Tell the turtle what to do"), 2 (6 to 12, "Remember and reuse"), 3 (13 to 15, "Listen to the person"), 4 (16 to 18, "Make a game"). They are runs of the existing order, so **nothing was renumbered** (renumbering would break the pasted assignment texts, the answer key, the standards locators and every "Step N" in the pages). Each step has `unit: N` in its front matter; `_data/turtle_units.yml` has each unit's title and one line blurb; `turtle-lessons/index.md` draws four bands (an accent color on the left border, numbered rings, a star after the capstone; `.tl-unit` in `assets/main.scss`, made only of borders and text so it prints in black and white) and `print.md` puts "Unit N: title" above each lesson. `lessons.test.js` requires every step to be in a unit, the units to run in order with no gaps, each to have three or more steps, and each to end in the one step called Capstone (so a new unit needs a capstone at its end). **Not built: a "Unit 2, Step 8 of 18" chip on each lesson page** (the user was unsure; it needs `_layouts/lesson.html`, which has the user's own uncommitted edits). Steps 10 (color) and 11 (bugs) are the loose fit in Unit 2.
**Step 1 has no blocks of your own, and Step 8 draws a name (2026-11-07, the user: "we use user-blocks even in lesson 1 without even explaining what these are"; "In the past, I've taught initials without blocks. And then, later, I make kids do it again only with user blocks").** Step 1 now frames `lesson-l` and `lesson-travel` (an L and an I, both starting top left facing down, the same four travel blocks before each; changing the 180 above the I to 90 lays it along the paper) and `lessons.test.js` fails if the page mentions a block of your own. Step 8 gained "Your name, again" (the user: "maybe this is their whole name, not just initials ... maybe add color"): the B frame with its three questions, one block for each **different** letter (ANNA is two blocks used four times), no `set xy` inside a letter block, every letter its own color (a `set color` before a call colors that use, inside the block colors every use), a Check yourself list, and in Done early the E and B frame, the `initials-lines` and `initials-curves` links and a size input for every letter. It has four frames, the most a page may have, and it is the longest of Steps 1 to 15 (about 1,700 words): if it is split, a new step renumbers 9 to 18. The teacher notes have a paste-ready "Your name, with blocks" assignment with no rubric. Standards: Step 1 left AP CSP 3.13 and CSTA 2026 MS-PRO-PD-12 (it had only read the sample letters); Step 8 already held both.

**Standards:** `_standards/carriers/turtlelessons.json` aligns all eighteen steps to apcsp, castandards, csta2026 and the CTE
ICT anchor (locators are the step slugs; `standards_locator: slug` on the pathway). Loops, if/else, random and run to run
variation were the strong fits for Steps 1 to 5; Steps 6 to 12 made variables (AP CSP 3.1), procedures (3.12, 3.13, CSTA MS-PRO-PD-12), binary (2.1) and debugging
(1.4) strong or partial (second pass 2026-11-06; boxes hold numbers only and are named box1 to box4, so the variable codes say so). Steps 13 to 15 (third pass, 2026-11-06) raised AP CSP 1.2 (input and events, CRD-2.C) to strong and added Step 13 to 3.1 and 3.12 (ask is the block version of INPUT) and Step 15 to 1.3; the California and CSTA 2026 middle school codes have no event or input code, so nothing was added there. CTE stays at two codes on purpose. Step 16 (fourth pass, 2026-11-06) added AP CSP 3.5 (Boolean expressions, strong), 3.7 (nested conditionals, partial) and Step 16 to 3.6, California 6-8.AP.12 (now strong) and CSTA 2026 MS-PRO-RD-17. Step 17 (fifth pass, 2026-11-07) added keys and timers to AP CSP 1.2 and the snake to 3.1, 3.5, 3.7, 3.12 and California 6-8.AP.12; there is still no event or keyboard code in the California and CSTA 2026 middle school sets.
`lessons.test.js` checks every step is named in the file, every locator is a real step, and the wording has no dashes or banned words. The per-lesson widget shows each step's own codes. After editing it, run `tools/publish_standards.sh`.

TurtleLab has a `write` block (Notes palette) that draws words in one of five fonts. Student Steps 1 and 5 say to skip it, and
`teacher-notes.md` has the line for an assignment that should not allow it.

**Two audiences, kept apart.** The student pages (steps, planning sheet, landing page) serve a kid
working alone and never mention a teacher, class, substitute, grading, points, timing, an LMS or
"turn it in" (a test of the words: grep them, expect none; "initials" is the topic of Step 1).
There are no "Challenge" boxes: extras go under a plain "Done early?" heading. Everything for
classrooms lives only in `turtle-lessons/teacher-notes.md`: paste-ready assignment text for
Schoology/Google Classroom (initials, practice PDF, capstone with its 10 point rubric), a
substitute-day plan, a stuck list, and a hidden `?key=1` answer key. **That page is deliberately a
plain page, not a collection member:** a member would show up as the pager link after Step 5
("For teachers") on a student page. It is reachable only by its URL. PDFs: Step 1 (initials),
Step 4 (practice), Step 5 (capstone). The capstone's one page printable is
`_turtlelessons/planning-sheet.md` (a `companion: true` page, so it stays out of the contents and
`/print/`); its `@page` rule (US Letter, 1.25 in left margin, 0.5 in right) is inside the page, and
its print CSS in `main.scss` keeps it to exactly one page (check with Chrome print-to-PDF and
`pdfinfo`, and keep a little spare height). Raw markdown does not render inside a bare HTML block
in kramdown: the answer key's `<section>` needs `markdown="1"`.

### CS Unplugged (`_unplugged/`)

**Before working on anything under `/unplugged/`, read `_unplugged/README.md`**
(conventions, front matter, answer keys, checkers, generators, print
checks) and `_program-notes-public/unplugged-todo.md` (open work). Section
READMEs are excluded from the build in `_config.yml`; add the path there
when creating one for another section.

The rules most often gotten wrong:

- Print and use: no scissors (the Caesar wheel is the one exception), no
  teacher running the room; simple to understand but 15+ minutes of work.
- Never show a grade level on a sheet; `level:` feeds only the landing
  page's teacher table.
- Answer keys are hidden (`?key=1` shows them) and never hand-typed: every
  key is computed from the sheet's data and proven by `tools/check_*.mjs`.
- Keep CC sources' student-facing wording and illustrations nearly
  verbatim (the CS Unplugged book's illustrations are covered by its
  licence); don't over-paraphrase.
- Never shrink a map or puzzle picture to hit a page count.

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

### TurtleLab (`turtlelab/`)

A block-based turtle graphics app for grades 6-11. **Before working on anything under `turtlelab/`, read
`turtlelab/CLAUDE.md`** (licensing, privacy and "forbidden sources" rules,
architecture, milestone status).

The rules most often gotten wrong:

- It is an **AGPL-3.0 island** in an otherwise MIT/CC repo. Never put CC
  lesson content in that folder, and never copy its code elsewhere in `learn`.
- Plain static files, like `python3d/`: no front matter, no collection, no
  build step. Its dev files (`CLAUDE.md`, `README.md`, `NOTICE.md`,
  `package.json`, `test/`, `dev/`) are excluded from the Jekyll build.
- **Published** at `/turtlelab/` since 2026-11-03 (home card, `/license/`
  and `/privacy/` sections, and its own About, Privacy and Guide pages).
  Pushing `learn` publishes it, so Claude never pushes. Its privacy pages
  promise no network use, cookies or storage; when saving or autosave is
  added, update them first (see `turtlelab/CLAUDE.md`, "Publishing").
- Dev server on port **4011** (`python3 -m http.server 4011 --directory
  turtlelab`), unit tests with `cd turtlelab && node --test`.

### JSLogo (`logo/`)

A copy of Joshua Bell's **JSLogo** (https://github.com/inexorabletash/jslogo, Apache-2.0, copied from commit 26dfcac, 2 Oct 2026), served at
`/logo/` as plain static files (moved there from `/jslogo/` on 2026-11-04; the folder is still called JSLogo in code, tests and
the home card's id, and a tiny `jslogo/` folder remains only to forward old links, keeping a program in the address; delete it when nothing links there), **outside `turtlelab/`** (the AGPL island takes no outside code; this is its own third-party folder, like
`working-in-python/`). It exists so TurtleLab's Logo box can send a program to a *real* Logo without anything leaving the site. Rules:

- **It must make no request to any other site and keep nothing in the browser.** The upstream loaded CodeMirror from cdnjs, a font from Google
  and TogetherJS from togetherjs.com, and saved procedures and history in IndexedDB. All of that is removed (CodeMirror is vendored in
  `vendor/codemirror/`; `initStorage` in `index.js` does nothing), both HTML pages carry a strict Content-Security-Policy (no inline script, no
  `eval`, `connect-src 'self'`), and `to_arity` in `logo.js` no longer uses `eval`. `logo/about-this-copy.html` lists every change, as Apache-2.0 asks.
  **If you ever update from upstream, re-apply those changes** (list is in that page) and run the checks below.
- **`vendor/` is in `.gitignore` (for Bundler), so `!logo/vendor/` re-includes the editor.** Without that line CodeMirror was silently left out of every commit
  (found 2026-11-04: the pushed page had no editor, though it worked from the disk). `test/jslogo.test.js` fails if any file the JSLogo pages load is ignored.
- Do not add an analytics script, CDN link, font import or `eval`, and do not let it store anything. The site and TurtleLab privacy pages promise this.
- **Programs arrive in the address:** `/logo/#<program>` runs at once (`?<program>` too). JSLogo turns every `_` into a space, so write `%5F`
  (`jsLogoAddress` in `turtlelab/js/core/logo.js` does). Several lines open the big editor box (our fix).
- **TurtleLab's Logo is not JSLogo's Logo,** so `toLogo(project, { jslogo: true })` writes the program again for JSLogo: colors as `"#rrggbb` words (JSLogo's
  lists are 0 to 99), arcs as a `tlarc` helper of 3 degree steps (JSLogo's `arc` draws around the turtle and does not move it), `clean` as `clearscreen` plus
  the pen put back (red, size 5, down), `%` as a `tlmod` helper (JSLogo's own `modulo` gives 1 for -7 mod 3), fills as `filled pencolor [ ... ]`, `window`
  first (JSLogo wraps round the edges by default), boxes made 0, and `setspeed`, `write` (shown with `label`) and the pen color readers dropped or approximated
  with one comment saying so. `test/jslogo.test.js` runs that Logo in JSLogo's real interpreter (loaded in Node by `test/jslogo-harness.mjs`, with a turtle that
  records) and requires the same drawing as the blocks, for every sample.
- Checks: `node turtlelab/dev/jslogo-checks.mjs` needs the WHOLE site served (`python3 -m http.server 4012` from the repo's top folder, never 4000): it checks no
  outside requests, nothing stored, the policy refusing fetch, images, scripts and eval, and four TurtleLab programs opened in it from the Logo box.
- It has a home page card in `_data/pathways.yml` and entries in `LICENSE`, `license.md` and `privacy.md`. It is not in the site menu (the menu is copied into several
  pages and pinned by a test); add it there if you want it.

### Student Movies (`_movies/`, `movies/`, `_data/movie_worksheets/`)

Movie suggestions and companion worksheets for substitute days (grades 6 to 11, mostly 6th). The goal is **character
development and social-emotional learning (SEL)**, not CS content. A worksheet succeeds if it makes kids think and be
better people. A CS/robotics angle ("Think Like a Computer Scientist") is fine when the film naturally supports it or the
user asks for it; SEL is the default.

**Built 2026-11-10** from the user's .docx worksheets (zip in `attic/`). A film is three small files plus data, and the
layouts do the rest: `_movies/<slug>.md` (collection, `layout: movie`; front matter `director`, `studio`, `year`, `rating`,
`runtime`, `blurb`, `trailer` (YouTube id, embedded via youtube-nocookie), `grades`, `cs` (1 to 5), `rt_critics`, `rt_audience`; `/movies/` is a table built from these; body is "What happens" and "Why we watch it"), `movies/<slug>-worksheet.md` (`layout: movie-worksheet`,
`movie: <slug>`, `permalink`), and `_data/movie_worksheets/<slug>.yml` (Part 1 questions with `answer`, Part 2 items with
`label`, `text`, `lines`, optional `fields`, `choices`, `circle`, `table`, and `bonus`). The worksheet is printed HTML
(print CSS at the end of `assets/main.scss`); after adding or editing one, print it with headless Chrome and check
`pdfinfo` says 2 pages. `movies/teacher-notes.md` is a plain page (answer keys read from the data, plus Ron's Gone Wrong
discussion questions); an optional `before:` (markdown) in the data holds pre-movie warm-up ideas for the teacher notes, and an optional `before_you_watch:` front matter question shows on the movie page right under the teacher ideas (Robots has both; useful when a film is shorter than the block); a movie page's answer key and notes show on screen only with `?key=1` but always print; a blank `answer:` means "to check against the film". Home page card "Student Movies" (banner source `tools/banners/movies.svg`, after CS Unplugged); not in the site menu. Not yet done: CASEL tags in the teacher notes, standards links, and the streaming service for each film
(changes often, so verify before adding). Grades and `cs` are the author's-judgment defaults, not the user's. No .docx export built; the user has the originals.

**Film selection rules**
- Age-appropriateness across grades 6 to 9 is non-negotiable. Verify the actual rating (G, PG, PG-13, TV-PG, TV-14) and flag
  anything above PG or any content concern before recommending.
- Must hold a room without the teacher: engaging, calm enough pacing, no facilitation needed.
- Prefer character growth, emotional intelligence, community and civic themes.
- Note where it streams (Apple TV is primary, Netflix secondary).

**Worksheet structure** (student-facing, two printed sides)
- Header: `Movie: <Title>`; an italic line `Directed by <Director> | <Studio> (<Year>) | Rated <X> | <N> minutes`;
  `Name: ____  Period: ____  Date: ____`.
- **Part 1, Watch and Learn** (answer while watching): about 5 multiple choice, "Circle the best answer", options A to D.
  Roughly 3 plot comprehension and 2 that need reading a social or emotional situation. Follow the film's chronology so
  students can answer as they watch. Plausible distractors, one clearly correct answer.
- **Part 2, Social-Emotional Learning** (or Think Like a Computer Scientist), on the back: 4 to 5 free-response questions.
  Each opens with a bold label ("Self-Awareness:", "Empathy:", "Relationship Skills:") then a specific scene or moment, then
  a reflection prompt. Built on CASEL's five competencies: Self-Awareness, Self-Management, Social Awareness, Relationship
  Skills, Responsible Decision-Making.
  - Observational and analytical, not personal disclosure, especially for older students. Nobody should feel they must
    reveal something private.
  - Always end with a Personal Connection question: "Which character in the movie do you think you are most like and why?"
    with a short list of character options.
  - Sentence starters sparingly, only where scaffolding helps; none on questions meant to show how a student really thinks.
  - Answer lines after each free-response question in printable versions.

**Teacher notes** (their own page, reachable only by URL like the TurtleLab teacher notes; never a collection member that
shows up as pager navigation on a student page): Part 1 answer key, the CASEL competency each Part 2 question targets,
content warnings, discussion follow-ups. **Competency labels and answer keys never appear on the student worksheet.**

**Style:** no em dashes or en dashes in student-facing text (the site-wide rule); reading level for 6th grade unless the
film is specifically for high school; two printed sides (verify with print-to-PDF and `pdfinfo`).

**Output for each film:** a suggestion entry (title, rating, runtime, streaming service, one paragraph on why it fits), a
student worksheet page, teacher notes, and a **.docx of the worksheet** for printing or importing into Google Docs. The user
imports into Docs themselves: **never write to Google Drive.** Minimal preamble. On feedback (too personal, too long, too
technical) make targeted revisions, not full rewrites.

**Films already done** (worksheets exist outside this repo): The Wild Robot, WALL-E, Ron's Gone Wrong, Inside Out 2,
Big Hero 6, Spare Parts, The Imitation Game, Kiki's Delivery Service, My Neighbor Totoro. Planned: Spirited Away.

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

**The graphic organizer** (shown to readers as "Notes page" -- non-educators
don't reliably know the term "graphic organizer", so the front matter key,
filename pattern, and this doc keep it, but reader-facing text doesn't) is a
printable fill-in-as-you-read worksheet: `_pico/NN-graphic-organizer.md`, a
real collection member (`layout: lesson`, `order: N.1`,
`label: "Chapter N Companion"`, `source: original`, `companion: true`). The `companion: true` flag excludes it from
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
