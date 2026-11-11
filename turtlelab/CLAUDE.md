# TurtleLab

A block-based turtle graphics app for a grades 6-11 CS and robotics classroom,
hosted on GitHub Pages. Students drag Sugar-style blocks to draw with a turtle.
Nothing a student does ever leaves their browser. Chromebooks with Chrome,
mouse and touch.

It lives inside the `learn` repo at `turtlelab/` but is its own **AGPL-3.0
island**: everything else in `learn` is MIT (code) or CC BY-NC-SA (lessons).

## Non-negotiables

Read these before changing anything.

1. **License: AGPL-3.0-or-later for everything in this folder.** `COPYING` is
   here. The About page must credit Sugar Labs and link to the source (AGPL
   section 13). Never put CC lesson content in this folder, and never copy
   code from this folder into other parts of `learn`.
2. **Allowed borrowing:** Sugar Labs' Turtle Blocks JS
   (https://github.com/sugarlabs/turtleblocksjs, AGPL-3.0): the SVGs in
   `images/` and `header-icons/`, and the block-shape and turtle SVG templates
   in `js/artwork.js` and `js/blockfactory.js`. Keep their copyright notices
   on anything copied, say what was modified, and record every borrowed file
   in `NOTICE.md`. Check each copied file's header for a different license:
   `js/utils/platformstyle.js` is GPL-3.0-or-later (Sam Parkinson); Material
   Icons and Roboto are Apache 2.0 from Google and need their own notices.
   **Do not** pull in their runtime engine or dependencies (jQuery, EaselJS,
   require.js, Tone.js, p5, the Planet server, and so on).
3. **Forbidden:** no code, artwork, icons, text, or name from Playful
   Invention's TurtleArt. Implement from the functional spec only. Never name
   the app TurtleArt or Turtle Blocks. Block labels, help tips and error
   messages are written fresh.
4. **Privacy:** fully static, client-side HTML, CSS and JavaScript. No
   analytics, accounts, cookies, server or CDNs. Vendor every font and
   library into the repo. Every HTML page carries the strict
   Content-Security-Policy meta tag (everything `'self'`, plus `data:` and
   `blob:` for images). No inline `<script>` or `<style>`; style from script
   through the CSSOM (`el.style.x = ...`), which the policy allows.
   `localStorage` is used only to autosave the current project.
5. **Readable code:** no build step, plain ES modules, so the source on GitHub
   Pages is the source in the repo and advanced students can read it. Comment
   for a smart high schooler. `js/core/` never touches the DOM and is tested
   with `node --test`.

## Naming

The teacher chose **TurtleLab** on 2026-11-03 (it was called "Turtle Draw"
while it was being built). It is written TurtleLab, one word, in the page and
the docs, and `turtlelab`, lowercase with no hyphen, in the folder, the URL
and every command, because nothing should need a hyphen to type and GitHub
Pages paths are case-sensitive (`/TurtleLab/` would be a 404). The name
lives in `js/app-info.js`. The saved-file format names (`FORMAT_ID` in
`js/core/project.js`, the PNG chunk keyword) are deliberately independent of
the app name so old pictures keep opening if it ever changes again. Two
small projects with similar names exist (a Python turtle web app on GitHub
called Turtle Lab, and a Python turtle page at atweimer.com/turtlelab); both
are text-based, and neither is the same product.

## Writing rules for student-facing text

Block labels, help tips, error messages, and the About, privacy and guide
pages follow the `learn` repo rules: **no em dashes or en dashes**, second
person, plain and short, no condescension. Error messages say what happened
and what to try. Code comments are not student-facing in this sense, but keep
the dashes out of them too for consistency.

## Layout

    index.html        the app (CSP meta tag, module script)
    js/core/          NO DOM. Runs under node --test.
      blocks-spec.js  every block: palette, kind, label, sockets, help tip
      interpreter.js  generator-based: every block yields once when it runs
      scheduler.js    drives the generator: speed, 12 ms slices, stop
      turtle.js       state, geometry, records drawing ops (line, arc, fill...)
      edit.js         what happens when a block is dropped: detach, snap, plug
      history.js      undo and redo (whole-project snapshots)
      view.js         pan and zoom maths
      color.js        RGB 0-255
      names.js        what a name for a block or input may be (letters, numbers, _, spaces)
      definitions.js  blocks you make yourself: find them, rename them, keep calls in step
      project.js      project JSON: validate, find the Run stack
      python.js       the blocks as Python (turtle module); see "Python box"
      logo.js         the blocks as Logo text; logo-compile.js reads Logo text back as blocks; see "The Logo box"
      pdf.js          writes the one page PDF with no library; see "The PDF"
      squeeze.js      closes wide empty gaps between stacks, for the PDF's picture of the blocks
      fit.js          what has been drawn (even off the paper) and the zoom that fits it; the drawing "view"
      grid.js         which grid lines to draw for a view, at nice numbers; the four kinds of grid (squares with numbers, squares, dots, polar)
      paper.js        the five papers (white, whiteboard, graph, chalkboard, blueprint), the lines printed on graph and blueprint paper, the smudges on the boards
      complexity.js   the complexity points: what a project's blocks are worth (variables most), see "The badge"
      elegance.js     elegance 0.0 to 1.0 from the blocks (copy and paste, repeated numbers, left over, nesting) with plain reasons
      efficiency.js   efficiency 0.0 to 1.0 from a run (lines drawn over again, pen up walking, tiny lines, steps) with reasons
      quality.js      puts the three together: assess(), complexity01 (points on a curve), tenths() for showing one decimal
      can-score.js    the shark's score on the can (a point per meal, one off per harpoon) and how many pokes call a visitor
      hand.js         the wobble of a hand drawn line (a smooth noise of WHERE a point is) and the tile of chalk grain; see "Hand drawn papers"
      svg-export.js   the drawing as SVG: a picture, or hairlines for a cutter
      stitch-plan.js  a drawing as stitches for an embroidery machine (running stitch, one thread a color)
      embroidery.js   writes .dst (Tajima) and .pes (Brother) files; the Brother thread palette
      lettering.js    the write block's words as lines (seven fonts of lines, LETTER_FONTS); lettering-data.js is GENERATED
      png-chunks.js   hand-written CRC-32 and PNG iTXt text chunks (no library)
      project-file.js put a project inside a PNG, and read a PNG or .json back
    js/embed-flag.js  one line, a classic script in index.html's head: ?embed=1 puts class `embedded` on the page before it is drawn (see "Embedding in lessons")
    js/ui/            the browser side
      blockfactory.js PORTED from Turtle Blocks JS (see NOTICE.md; rebuilt by
                      dev/port-blockfactory.mjs). Draws block shapes.
      block-view.js   layout (sizes, connection points) and SVG for stacks
      workspace.js    the editor: render, drag, snap, number editing, marks
      palette.js      palette buttons + the flyout of blocks to drag out
      help-bubble.js  the tip bubble (press and hold, right-click) + Copy stack
      palette-colors.js, artwork.js (PORTED), demos.js (developer examples)
      samples.js      the student samples (see "Samples" below)
      python-box.js   the show/hide Python panel
      logo-box.js     the show/hide Logo panel: shows the blocks as Logo, can be edited, has Run Logo
      export-menu.js  the list of ways to save, on a right-click or press and hold of Save
      code-image.js   the blocks as a picture for the PDF (SVG, then canvas)
      roboto-data.js  GENERATED: the Roboto font as text (dev/make-font-data.mjs)
      trash.js        the trash can and its shark (see Deleting, above)
      canvas-view.js  paper canvas (1400x1120) + sketch canvas for the hand drawn papers + draggable turtle overlay
      hand-drawn.js   makes the chalk grain tile into a picture for CSS mask-image (once, from numbers)
      color-picker.js the picker panel that opens from a color box on set color / fill screen (number, hex, binary)
      ask-box.js      the question box an ask block shows (see "The ask block")
      score-badge.js  the card in the bottom right corner (blocks, complexity, elegance, efficiency), its details panel and the floating "+0.1 elegance"
      files.js        Save (download a PNG with the blocks inside), Open, drops
      fullscreen.js   the Full screen button (standard and webkit names; hides itself where the browser cannot)
      storage.js      autosave to local storage (one item: turtlelab-project)
      main.js         wiring
    css/app.css  css/pages.css  fonts/roboto/  images/  images/samples/
    samples.html      the Samples page (GENERATED by dev/make-samples-page.mjs)
    test/             node --test
    dev/              real-Chrome checks over DevTools Protocol, port script

## Samples

`js/ui/samples.js` holds the student samples (32 listed, easiest first, the last seven for an embroidery machine, plus twenty-two demos made only for lessons: `listed: false`, ids `lesson-...`), each
with `id`, `title`, `summary`, `look` (the picture's alt text), `concepts`
(little tags), `note` (a sticky note, at most 250 characters so it is not cut
off), `program` and optionally `defines` (blocks the sample makes). They are different from `demos.js`, which is for the
checks. All wording is student-facing, so no dashes and no grade level.

- **`?sample=square`** loads the note and the program down the left edge
  (note on top; `sampleStacks`). A sample with `defines` puts those down the
  left and moves the note and program to the right edge, so the blocks stay out
  of the middle of the page where the drawing is, zooms out until it fits the window
  (`workspace.fitHeight`, never below 0.6), and runs it. `&autorun=0` loads
  without running. An unknown or odd id (`toString`, `<img...>`) says so in a
  message and starts the normal way. The reset-view button brings full size back.
- **A sample never reads or writes what a student saved.** `main.js` skips
  `loadAutosave()` and calls `autosave.pause()`, after which `schedule()` and
  `flush()` do nothing (this also stops a second tab from overwriting the
  first on `pagehide`). Save and Ctrl+S still work. Keep it this way: the
  privacy pages say nothing is stored except the one autosave item. `sample-checks.mjs`
  proves it with real saved work in place.
- **A sample can wait for a person (2026-11-06).** `handlers` (a list of block lists, each under a `when paper clicked` hat; placed down the left with the blocks it makes by `sampleStacks`), and, for the tests and checks only,
  `answers` (what to type into each ask, in order) and `clicks` (`[x, y]` in the turtle's steps, once it is listening; they must be on clear paper even in a 700 wide frame, where blocks sit over part of it). `lesson-ask-sides` and
  `lesson-click-stamp` are the two. `samples.test.js` runs a sample as that person (`runSample`), the Python and JSLogo every-sample tests are given the same answers and clicks (JSLogo has no mouse, so a sample with handlers is only
  checked to run there; `allLeft: true` puts the note, the program and the handlers all down the left, as `lesson-click-stamp` does, because the Output box sits at the top right edge and hid whatever was there), and `sample-checks.mjs` and `embed-checks.mjs` (standalone and inside the real lesson pages' frames) type the answers and click the paper, treating "the question is open" or "listening for clicks" as settled.
- **Adding or changing a sample** is: edit `samples.js`, then run
  `node turtlelab/dev/make-sample-thumbs.mjs` (needs the dev server; the
  thumbnails are photographs of the real app, 350x280, and a sample that uses
  `random` is re-run until it stays on the paper) and
  `node turtlelab/dev/make-samples-page.mjs`. The unit tests fail if the
  thumbnails or `samples.html` are missing or out of date, if a note is too
  long or has a dash, if a sample errors or draws nothing, or if a sample that
  claims print, wait, fill, if else, random or boxes does not use it.
- Keep programs short. Blocks are drawn large (a `set color` block is 3
  sockets tall), so a program with an `ifelse` and a `set color` or two goes
  past a Chromebook screen unzoomed. `sample-checks.mjs` checks every sample
  fits a 1366 by 700 window with the note above it.
- The toolbar and the Guide link to `samples.html`; each card on it is one
  link containing the picture, title and "Open in TurtleLab".
- The toolbar also has a **Lessons** link (to `../turtle-lessons/`, the lesson pathway kept outside
  this folder because it is CC content), and "TurtleLab Lessons" is in the site menu (all five pages'
  copies, kept in step by a test). The toolbar is full: below 1100 px wide its gaps are squeezed in
  `app.css` so it stays on one row down to 1000 px (`sample-checks.mjs` checks 1366, 1100, 1000). The Full screen button made one icon too
  many at 1000 px, so below 1060 px the icons are 2rem (a probe measured one row at 1000 and two rows from about 960 down, as before).

### The initials samples (for Lesson 1)

`initials-lines` and `initials-curves` draw A, B and C in blue, one without `arc` and one with, and **Step 8 of the
lessons links both** (in Done early, so keep their ids). Step 1 FRAMES two lesson demos, with no `to` block in either (a student has not met them yet: Step 8 teaches them, and `test/lessons.test.js` fails if Step 1 mentions one): `lesson-l` (the L, one slow program, on the grid) and `lesson-travel` (an L and an I, both starting at their top left corner facing down, with the same four travel blocks written out before each, `pen up`, `set xy`, `set heading`, `pen down`; the turtle ends the L facing right, which is why the `set heading 180` before the I matters). The page states that the L ends at (-90, -60) facing right and that changing the 180 above the I to 90 lays it along the paper; `test/lessons.test.js` ("Step 1") pins it. **Step 8 FRAMES `lesson-b-two-ways` and `lesson-b-diagonal`** (they were in Step 1 until 2026-11-07): `lesson-b-two-ways` is `straight B` and `curved B`, which reuse the very same bodies as the initials samples, with the four travel blocks written out in the main program, not hidden in a `place` block, so a student sees `pen up`, `set xy`, `set heading`, `pen down`. The page states 15 and 9 blocks and that the turtle ends the straight B facing left (so the second B comes out turned without a `set heading`); `test/lessons.test.js` ("Step 8") pins all of it, so changing a letter or a place means changing the page. The second B is at x = 16 so its bowl stays clear of the `to curved B` blocks in a 700 wide frame. `lesson-b-diagonal` is the teacher's own E and B (2026-11-06, the user pasted the Logo they draw it with: "you could even draw B a 3rd way"): a third B shape (a spine, then angled lines with turns of 135 and 90) and a second way to travel between letters (walk `forward 20` and `left 90` with the pen up, no `set xy`). The frame's first three blocks (`pen up`, `set xy -40 -40`, `pen down`) only put the letters in the middle of the paper: their program draws from the middle and goes up and to the right, which put a `to` column on top of the drawing in a 700 wide frame (`sampleStacks` keeps only `clearWidth` clear, and `clearWidth: 120` is what lets both columns sit left of the paper). Each letter is a block of its own so the program fits a frame; the numbers are theirs and the test (`Step 8`) runs their Logo through `compileLogo` and requires the same lines, so do not tidy them (the last angled line ends about 5 steps below the spine's foot). The letters are 120 tall and drawn piece by piece, never with `write`, and each is a
block of its own (`to letter A`) so the program stays short enough to fit the window; the same A is in both. **A letter block never
uses `set xy`: it draws from wherever the turtle is** (starting at its bottom left corner, facing up, pen down), so it can be reused anywhere;
the sample's `place x y` block (pen up, set xy, set heading 0, pen down) is what puts the turtle there. The C hops (pen up) to its
bottom right end first so it can start at the bottom left like the others. In every B the top
part is a little smaller than the bottom part (straight: boxes 51 and 64 wide; curved: bowl radius 26 and 34, the middle at y = 8),
so a reader can tell which is which.

### The school's logo samples and the layout of blocks around the paper

`stitch-paw`, `stitch-paw-slv` and `stitch-cougars` are for the school's embroidery machine (the mascot is the
cougar). The paw and SLV were **traced from the school's own picture** (a 360 by 223 PNG kept in `attic/`,
which is gitignored and never committed; if it is lost the numbers in `samples.js` still draw the logo). The tracing was done once, with scratch scripts:
the picture's red shapes were separated, each outline was fitted by a closed chain of turtle `arc`s (pure
"angle, radius" numbers, so a toe is four quarter circles `arc 90 30, arc 90 75` twice, drawn by one `toe` block four
times), and the S is two identical halves (`repeat 2 [arc -240 50, arc 240 10, left 90, forward 40, left 90]`).
The L and V are plain polygons of `set xy`. It is close, not perfect, on purpose: stitched thread is not perfect either.
`stitch-cougars` is one `write` block (see "The write block"). Three samples show the text settings: `text-fonts` (set font, seven rows), `words-around`
(turning the turtle, and set curve as an arch and a bowl) and `stitch-badge` (an embroidery badge: two rings with SLV COUGARS arched over the top and GO TEAM
bowled along the bottom, 580 stitches, 22 hops; its curve numbers and standing places were worked out from the words' widths, so if the words or the size change,
work them out again and re-set `maxHops`). A sample may say `maxHops` (how many separate
lines the machine stitches; the default is 2), and `clearWidth` (how wide its drawing is, in steps).

`sampleStacks` puts a sample's blocks around the paper so the drawing stays clear. With blocks of its own: the
program goes down the right edge (the note above it, or, if both would not fit, packed in with the definitions);
the definitions are **packed into the fewest columns** (tallest first into the first column with room, never
taller than fits at the smallest zoom, 0.6); the columns fill the room left of the drawing first, then the room
right of it. Everything is placed for where it ends up AFTER the page zooms out (it keeps the top left corner
still and pulls the rest toward it), not where it starts. Measured from the real page, so `stageHeight` is the
workspace height (534 on a 1366 by 700 window, with the message bar below it). `test/samples.test.js` and
`dev/sample-checks.mjs` check it (everything fits at 1366 by 700, nothing overlaps, no column is too tall).

## Embedding in lessons

A lesson page (`_turtlelessons/`, the CC side) shows a TurtleLab demo in a frame: `{% include turtlelab-embed.html sample="ID" title="..." %}` (`_includes/turtlelab-embed.html`:
`<iframe loading="lazy">` of `/turtlelab/?sample=ID&embed=1`, a caption with an "Open full size" link, and a line with the address that shows instead of the frame on paper;
no `sandbox` attribute, because module scripts need the same origin). **Same app, same origin, nothing new stored or sent:** the lesson page only frames a URL, as its links always did.

- **`?embed=1`** (2026-11-06, the user: "embed demos into the lessons and make them a bit interactive"): `js/embed-flag.js` (a one line classic script in the head, because the page may have no inline script)
  puts `embedded` on `<html>` before the first paint, so a frame never flashes the whole toolbar. The stylesheet then shows only **Run, Stop, Undo, Redo, Start over** (`#embed-reset`, reloads the demo) and
  **Open full size** (`#embed-open`, the same address without `embed=1`, a new tab); palettes, the can, the boxes readout (moved back to the right edge, since the badge it made room for is hidden) and the message
  line stay. `main.js` (`const embed`): no saved project is read, autosave is paused (like a sample), `idle` is not started and `reward.stop()` is called (no antics, treats, surprises, fish or boat), and the load message is
  short so it stays on one line (a two line message took room from the blocks).
- **Lesson demos are unlisted samples** (`listed: false` in `samples.js`, ids start `lesson-`, `LISTED_SAMPLES` is what the Samples page and its thumbnails use). They are still held to every sample test (run, draw, no dashes, notes,
  concepts honest, nothing off the paper), and `lessons.test.js` requires each to be used by a lesson. The four `lesson-bug-*` programs are broken on purpose; their notes say what the program is FOR, never what is wrong, and
  `lessons.test.js` proves each is a real bug and that the fix in the lesson's answer fixes it.
- **They must fit a frame about 700 by 520** (the workspace zooms out to fit, never below 0.6, so a demo is short: about 14 blocks). `dev/embed-checks.mjs` checks, in real Chrome at exactly 700 x 520 (`Emulation.setDeviceMetricsOverride`; a
  launched window is shorter than its size because of the browser's own bars), that every demo any lesson frames fits, runs and draws; the slim toolbar; Start over and Open full size; saved work never read or written (a seeded
  `localStorage` item is untouched, nothing else is stored); nothing amusing itself (control: the same page without `embed=1` does); no request to another address; and, with `SITE_URL=http://127.0.0.1:4010/`
  (my own `bundle exec jekyll serve --port 4010 --no-watch`; it must be restarted to see new files), that each lesson page's frames load TurtleLab in embed mode and the demo inside drew something.
- **`hideBlocks: true`** on a sample (Step 16's game, `lesson-click-game`): inside a frame, and only there, `main.js` starts it with the blocks hidden (`blocks-hidden` on the stage), because its click handler is wider than the room beside the paper in 700 pixels. The frame has no
  button to bring them back, so the lesson page shows the program as an outline, and Open full size (no `embed=1`) is the whole app with every block. The message line says "Press Run to start again" and not "Change anything you like". `embed-checks.mjs` checks such a demo
  is hidden and the paper clear instead of that its blocks fit, plays the game in its frame (reads the square's place from the yellow strip, misses, then hits three times) and opens it full size to count its four stacks.
- A frame has no PDF button, so a lesson that ends in a PDF (Steps 4 and 12, and every "Save your work") says to use **Open full size** first.

## The ask block (input)

`ask |question|` (Boxes palette, label `ask [question] into box1`) shows the question in a box at the top of the page, waits for a number, and puts it in **box1** (2026-11-06, the user: "just ask [prompt] which writes to box1",
and "simple is good"; a lower and upper bound with an entry box and a slider was floated and left for later, and would be extra slots on this same block). It is a command, not a reporter, because reporters are plain synchronous
functions and this has to wait for a person.

- **The pieces.** `Ask` (interpreter.js) is what the block yields, like `Wait`; the scheduler (`onAsk(question, block)` returns `{ answered, cancel }`) lights the block, shows the question and waits, then hands the number back with
  `generator.next(number)`, and the block stores it and takes one more step so the yellow strip shows box1 changing. Stop while asking calls `cancel` (the box goes away) and the run ends `stopped`; the person giving up (Cancel,
  Escape) answers `null`, which stops the program the same way. **With no one to ask the answer is 0** (a run driven by hand in a test, or the PDF's run first). `ui/ask-box.js` is the box (a `<form>`, not `window.prompt`, which would
  freeze the shark and Stop): the answer must be a plain number (`parseAnswer` in core/format.js: 12, -3.5, .5; not 1e3, 0x10 or a word), else it says "Type a number, like 12 or -3.5." and stays open. Enter is OK, Escape is Cancel,
  and its keys never reach the workspace (Ctrl+Z does not undo blocks while it is open).
- **The block.** A `textSlot` block like `write` (words kept in `block.text`), with `default` 'How many?', `max` 60 letters (`ASK_MAX_CHARS`; write holds 40) and `shows` 30 (letters of it shown on the block before the dots), plus the new spec
  field `endLabel`, the little word after the box ('into box1'). It always writes box1, so a program that needs box1 for something else stores the answer in another box straight away. `usesBoxes` counts it (the readout shows).
- **The PDF** runs a program that has not run, with nobody to ask: ask answers 0 at once, and the message says "Your program asks a question, so this run used 0 as the answer." (`askedForPdf` in main.js).
- **Logo.** TurtleLab Logo has `ask |question|` (like `write |words|`); the compiler reserves box1 when a program asks, so a name of yours never takes it. For JSLogo it is `make "box1 sum 0 (readword [question])`: JSLogo's own question box
  gives back a word, and `sum 0` makes it a number (the parentheses are what make readword take its prompt); `test/jslogo.test.js` runs it there with answers.
- **Python.** `box1 = ask("question")`, with a small `ask` function (only when used) that calls `input()` until `float()` works and keeps a whole answer whole. `ask`, `input`, `float`, `ValueError` and `OverflowError` are names the
  program uses (reserved for your blocks' names; the builtins are real Python's, which PyScript has). `test/python-runner.py` answers `input()` from the request's `answers` and reports what was asked; the Python test runs the same
  answers through both and requires the same drawing, including bad answers (words, nan, inf, 1e999) that are asked about again.
- **Not built yet:** bounds and a slider; a second answer box (ask always writes box1); an ask that waits inside a frame is fine (`?demo=ask` is the developer program for it). A lesson step for it is next (Step 13).
- Tests: `test/scheduler.test.js`, `spec.test.js`, `logo.test.js`, `jslogo.test.js`, `python.test.js`, `format.test.js`, and `dev/ask-checks.mjs` (real Chrome: the block, editing the question, the box, bad answers, Cancel, Escape, Stop,
  Ctrl+Z, the PDF's run, a 700 x 520 frame, nothing stored or requested).

## Click handlers (`when paper clicked`, mouseX and mouseY)

(2026-11-06, the user, who comes from CMU where `onMousePress(x, y)` is real: "I like the idea that we could just do onClick and have two new built in variables called mouseX and mouseY that are global", and the trigger should be "a click".)
A hat `when paper clicked` (`onclick`, Flow palette, right after `start`) holds blocks that run each time the paper is clicked while a program is running. Two reporters, `mouseX` and `mouseY` (`mousex`, `mousey`, in the
Flow palette right under the hat: the user first found them in Boxes, did not see them there and chose Flow, 2026-11-06), say where, in the turtle's own x and y (whole numbers, y up, the same as `set xy`). They are global: they work in the main program, in a block you made and in a handler, 0 and 0 until the first
click, and they hold the last click until the next. They live in `ctx.mouse`, which the page sets when a handler starts.

- **A program with a handler listens.** `Scheduler.start(generator, { listen: true })` (main.js `beginRun` passes it when the project has handlers and the run is not for the PDF): when the last block has run the program does not end, it
  calls `onListen` (the message "Listening for clicks on the paper. Press Stop when you are done.", kept short so it stays on one line: a message that wraps takes room from the paper and the paper then resizes, which shifted a frame's
  clicks by 5%) and waits for clicks until Stop. A `stop` block in the main program ends the whole program, listening too; in a handler it only ends that handler. `Scheduler.queueEvent(makeGenerator)` is how the page hands over a click
  (`makeGenerator` is called when the handler starts, which is when `ctx.mouse` is set); it refuses clicks when nothing is listening and past `MAX_QUEUED_EVENTS` (10, so a slow handler and a fast hand never build a pile). **Clicks wait for the
  block that is running to finish, then the handler runs from start to end, then the program carries on**; a `wait` or a question inside it takes its time, and a question that is already open comes first. A mistake in a handler ends the run with
  that mistake, like one in the main program. A page with only a handler: Run listens at once.
- **Run never starts from a handler:** `findRunStack` skips `onclick` stacks (and tapping one says what it is for). `handlersOf(project)` lists them top to bottom, and every one runs on each click. The hat counts as a hat (not a plain block) for
  complexity and elegance, and a handler is not a stray stack.
- **What is a click** (`Workspace.listenForView`, which already handled sliding): a press and release of one finger or the left mouse button on the paper or the gray round it that moved less than `CLICK_SLOP` (6 px). More is a slide (the
  blocks move, nothing runs). Blocks, palettes, the turtle and the can are not "empty space", so a click on them is theirs. `CanvasView.worldAt(clientX, clientY)` turns the point into the paper's x and y through the drawing's view (so it is right after
  Fit or a zoom) or null if it is off the paper (the gray round it is not the paper). The sprite is locked while a program runs, so the turtle cannot be dragged during one.
- **The PDF** runs a program that has not run with `listen` off (a handler run for the PDF just ends: nobody will click).
- **Logo.** TurtleLab Logo has `onclick [ ... ]` on a line of its own (an error inside a repeat, an if or a `to`) and `mousex`, `mousey` like `xcor`. They are our own words (real Logo has none for events), written after the program. JSLogo has no
  mouse clicks, so for JSLogo the handlers are left out (one note in the comment at the top) and `mousex` and `mousey` are 0.
- **Python.** One handler is `def on_click(x, y):` with `global mouseX, mouseY` (and any box it sets), then `mouseX = x`, `mouseY = y`, then the blocks; several are `when_clicked_1()`, `when_clicked_2()` called in order by `on_click`.
  `onscreenclick(on_click)` is registered before `done()`, **inside `try: ... except NameError: pass`, because EduBlocks' turtle has no `onscreenclick`** (so there the handler does nothing, and the name check does not count it). The Python only
  clicks after the main program has run (in the blocks a click can come between blocks). A page with only a handler still starts facing up with a red pen. `test/python-runner.py` takes a `clicks` list: only then does it have `onscreenclick`,
  and it calls the handler for each click; `test/python.test.js` runs the same clicks through both and requires the same drawing.
- **A ring opens where a click lands (2026-11-06, the user asked for it from the list of next things).** `CanvasView.ring(clientX, clientY)` puts a `.click-ring` on the paper's box (above the turtle, `pointer-events: none`,
  removed on `animationend` and by a timer in case the animation never runs), called by `paperClicked` in `main.js` for every click that is on the paper and heard (not before Run, not a slide, not on a block or the gray). It grows from a small
  circle and fades in 0.5 s (`click-ring` in `app.css`); under `prefers-reduced-motion` it only fades (`click-ring-calm`). It is a picture on the page, never in a PNG, JPEG, SVG, the PDF or the autosave. White inside and outside its pink
  edge so it shows on every paper.
- **A click on the turtle is a click on the paper while a program runs** (2026-11-06, found building Step 16's game, where the turtle sits on the square's corner): `.turtle-sprite.locked` (the class a run puts on it, so it cannot be dragged) has
  `pointer-events: none`, so the press goes to the paper under it. Before a run, and after, the turtle is still draggable. `dev/click-checks.mjs` clicks right on the turtle.
- **Not built yet:** a click that arrives during a long `wait` runs after it; mouse move and release events; clicks outside the paper.
- Tests: `test/scheduler.test.js`, `spec.test.js`, `logo.test.js`, `jslogo.test.js`, `python.test.js`, `quality.test.js`, and `dev/click-checks.mjs` (real Chrome: the palettes, listening, a click's place, quick clicks in order, a slide
  and a click on gray, a block or a palette button that are not clicks, a click on the turtle itself, the ring (where it opens, that it goes away, that it only fades under reduced motion, that there is none before Run or for a slide), Stop, running again, mouseX read by the main program, a page with only a handler, the PDF not waiting, a 700 x 520 frame, nothing stored or requested).

## and, or and not

(2026-11-06. The user asked whether to add multiple turtles or something else "to make it more fun or be able to teach more"; the recommendation was these three blocks, a ring where a click lands, and a click game lesson, and the user said "okay, implement these 3 things". Without `and` a click could only be tested one stripe at a time, so a click game was not possible. They are in the Math palette after the three comparisons, before `print`.)
`and` and `or` are infix yes-or-no blocks with two pointed holes (`[ ] and [ ]`), `not` is a prefix one with one (`not [ ]`). They are pills like `<`, laid out as a row, so they nest inside each other and inside the `if` hole.

- **Spec.** `BLOCKS.and`, `or`, `not`: `kind: 'reporter'`, `returns: 'boolean'`, sockets `{ type: 'boolean' }`. The old rule "only a clamp has a pointed socket" and "a prefix has two sockets" are now "a reporter that holds yes-or-no blocks is a yes-or-no pill itself"
  and "a prefix has at least one" (`spec.test.js` pins the three that join them, and nothing else, as the reporters with pointed sockets). `canPlug` already matched socket types, so a number block never fits a hole and a yes-or-no block never fits a number box.
- **Drawing** (`layoutRow` in `block-view.js`). It had never drawn a pointed socket inside a row, and an empty one crashed it (`sizeOf` of nothing). An empty hole is a see-through pill (`EMPTY_YES_NO`, 46 wide) drawn into the row's own markup, a hole's dock is
  at its pointed left end (`[x + 1, y + height / 2]`, like a yes-or-no block's own plug) and not the round plug a number block uses, and a prefix row takes any number of sockets. `pillPath` is the pill outline shared by the block and the hole.
  `dev/logic-checks.mjs` drags them together in real Chrome.
- **Running** (`evalJoined` in `interpreter.js`). `and` and `or` stop as soon as the answer is known, like Python and like JSLogo (whose `and` and `or` are lazy too): `box1 > 0 and 10 / box1 > 2` is fine with box1 at 0. **An empty or wrong hole is still a
  mistake when the first half would have settled it**, checked before anything is worked out, so a program never works "sometimes" and the `and` is outlined with the usual "needs a yes or no block plugged into it" message. `not` has no such thing to skip.
- **Logo.** TurtleLab Logo has real Logo's `and a b`, `or a b` and `not a`, written by `toLogo` in brackets round every test: `(and (:x > 0) (:x < 10))`, `(not (:x = 5))`. Typed, brackets are optional (`if and :x > 0 :x < 10 [ ... ]` reads the way real Logo does, because a
  comparison takes its two sides before `and` takes its two inputs), and `(and a b c)` may have more than two (they nest left to right). **A test in brackets, `(:x < 5)`, compiles to the test itself**, not a `( )` block, which only holds numbers.
  **A bug this found in the compiler (fixed): a bracket that starts with a word that takes no input, `(xcor + 5)` or `(mousex > 0)`, was read as a call like `(random 1 10)` and failed with "could not find the )".** Only words with inputs start a bracketed call now.
  A missing test (`if and :a > 0 [ ... ]`) says "and needs 2 tests after it, and I only found 1". The words `and`, `or` and `not` came off the "real Logo, but not here yet" list, and a block of yours called `and` gets `and_`.
  JSLogo is the same `(and ...)`; `test/jslogo.test.js` runs it in JSLogo's own interpreter, guard and all.
- **Python.** `a and b`, `a or b`, `not (a)`: an `and` inside an `or` (or the other way) is put in brackets so nobody has to remember which comes first, and whatever `not` turns over always has brackets (`not (x == 7)`). `OR`, `AND` and `NOT` are precedences below
  `COMPARE` (0.2, 0.4 and 0.6). Python's `and` also stops early, so `test/python.test.js` compares drawings for a program with a guard.
- **Score.** They count as operators in complexity (`OPERATORS`), like the comparisons; nothing new in the panel or the PDF.
- Tests: `test/spec.test.js`, `interpreter.test.js` (truth tables, nesting, the guard, empty and wrong holes), `logo.test.js`, `jslogo.test.js`, `python.test.js`, and `dev/logic-checks.mjs` (the palette, plugging, a number block refused, a hole coming back, running with a guard, the outline,
  the Python and Logo boxes).

## Key handlers and timers (`when [key] pressed`, `every`)

(2026-11-07. The user, right after pushing the and/or/not, ring and Step 16 work and asking whether the click game was a sample: "Can we do onKeyPress and onStep too? Then we'd be able to write a fun snake game I think." They know CMU Graphics, where `onKeyPress(key)` and `onStep()` are real, as with `onClick`. Built in one go; the shapes below were my defaults, none of them asked for.)
Two more hats in the Flow palette, after `mouseX` and `mouseY`, both like `when paper clicked`: Run never starts from them (`HANDLER_OPS`, `isHandler`, `handlersOf` in `core/project.js` now know all three), a program with any keeps listening after its last block until Stop, and `handlersOf` gives each as `{ stack, op, hat, blocks }` (the hat holds the key or the time).

- **`when [key] pressed`** (`onkey`, `keySlot: true`, `endLabel: 'key pressed'`): a dropdown of 42 keys in `core/keys.js` (`KEYS`: the four arrows, space, enter, a to z, 0 to 9; each has a label, the browser's `KeyboardEvent.key`, Python's turtle name and the Logo word). **A key is an id, not text: boxes hold numbers only, so a program cannot ask "which key?", it has one hat for each key it listens for.** The choice is kept in `block.key` (`cleanKey` in `project.js` makes anything else the default, `up`; `newBlock` starts there). The box is drawn by `layoutKeySlot` (a copy of the font box) and opened by `Workspace.chooseKey` (a wrapping grid of buttons, `.key-menu`; it shares `fontMenuClose` with the font list so only one popup is open; arrow keys move through it, Escape closes it). The key box has the classes `node nameslot textslot keyslot` (the sample checks count a stack with a plain `nameslot` as "a block you made", so a new kind of box needs its own class).
- **`every [5] tenths`** (`onstep`, one socket, the label stacked over two lines, `every` over `tenths`, like `store in` over `box1`: a caption on a hat's socket was drawn over its cap and the word and the socket touched, so the unit is part of the label; `wait` says its unit only in its tip): the time is in **tenths of a second, like `wait`** (10 is a second, 5 is the default, 2 is five times a second). Hats with a socket draw like any command with one (`setCap`), and a block may be plugged in: the time is read **once, when the program starts listening** (`ticksOf` in `main.js`), so a box says what it is at that moment and later changes do nothing. Out of range is a plain mistake that outlines the hat: below 0.5 ("Every 0.1 is too fast. The fastest is 0.5, which is twenty times a second."), above 600, an empty box ("This block has an empty box. Put a number in it."), not a number.
- **Running.** `Scheduler.start(generator, { listen, ticks })`: `ticks` is a function the scheduler calls **when the last block has run** (right after `onListen`) and returns `[{ ms, make }]`; each becomes a `setRepeat` timer (injectable, like `setTimer`, for tests) that queues its handler with `queueEvent`, **unless the last tick of that timer has not finished** (so a slow handler and a fast timer never build a pile, and ten queued events is still the cap). `stop`, finish, error and a new `start` all clear the timers. A mistake while making them ends the run with that mistake. A tick runs from start to end like a click handler, one thing at a time (a key or a click waits for the block that is running); **a `stop` block in a tick or a key handler only ends that run, not the program** (so it cannot end a game: use a box or a restart block). **At the default speed each block waits 100 ms**, so a handler of eight blocks would take most of a second: a game puts `speed 4` under `start` (the speed carries into the handlers) and the lesson says so.
- **Keys in the page** (`main.js`: `handlersForKey`, `keyPressed`): a `keydown` on the document runs every `onkey` handler for that key, in order, if a program is listening and **no Ctrl, Cmd or Alt is held, and the person is not typing** (an input, textarea or select: the ask box, the Logo box, a sticky note, a rename). It calls `preventDefault` so an arrow does not scroll the page; a `keyup` handler also prevents the default, because **a button that has focus presses itself when space is let go** (Run and Stop keep focus after a click). A held key repeats, like typing (the queue cap stops a pile). A key with no handler is left alone. **The frame has to have the keyboard**: in a lesson the student clicks the paper once (a click on the paper does nothing for a program that only listens for keys: no ring, no handler), and the pages say so.
- **The message line** (`listeningMessage`): "Listening for clicks on the paper.", "Listening for keys.", "Listening for clicks and keys." (each with "Press Stop when you are done."), and for timers only "Repeating on a timer. Press Stop when you are done." (kept short: a message that wraps takes room from the paper). Tapping a handler hat says what it is for.
- **Logo.** Lines of their own after the program, like `onclick`: `onkey "up [ ... ]` (the key in quotes: `up down left right space enter`, a to z, 0 to 9; capitals are fine) and `every 12 [ ... ]` (**in 60ths of a second like `wait`**, written `every (:box1) * 6 [` when a block is plugged into the time, and read back as tenths). Errors say where they may not go, like `onclick`. `onkey` and `every` are in `BUILTIN_WORDS` and `SPECIAL_COMMANDS`. JSLogo has no keys or timers, so they are left out with the usual one comment.
- **Python.** `def on_key_up():` (several handlers for one key are `on_key_up_1()`, `on_key_up_2()` called in order by `on_key_up`, so a `return` in one does not skip the others), registered with `onkeypress(on_key_up, "Up")` and `listen()` **inside `try: ... except NameError: pass`** (EduBlocks' turtle has neither). A timer is `def on_timer():` that **sets up its own next time first** (`ontimer(on_timer, 200)`, in its own `try/except NameError`, so it comes round even when the blocks `return` early) and then does the blocks; the first call is registered at the bottom the same guarded way. `test/python-runner.py` takes `keys` (Python's names) and `ticks` (how many times every timer goes off, each running what it set up): `test/python.test.js` runs the same keys and ticks through both and requires the same drawing.
- **Score.** All three kinds of handler count in the "User input" row (`ask / when paper clicked / when key pressed / every` on the PDF), earn only with blocks under them, and the detail says which ("1 click handler, 2 key handlers, 1 timer"). `onkey` and `onstep` are hats for complexity and elegance (a handler is not a stray stack), and the key is part of a block's sameness in elegance.
- **Samples** (`samples.js`): `keyHandlers: [{ key, body }]` (use `onKey('up', ...)`), `timers: [{ tenths, body }]`, and for the tests and checks only `keys: [...]` (pressed in order after the program and the clicks) and `ticks: N` (how many times each timer goes off). `handlerCount(sample)` counts all three kinds: use it, not `sample.handlers`, where a sample "waits for a person". The three lesson demos are unlisted: `lesson-key-steer`, `lesson-every-spiral` and `lesson-snake` (`hideBlocks`).
- **The snake (`lesson-snake`)** fits the **four boxes** by giving up a tail: the turtle is the head, the trail is the body, **pen size is the score** (it gets fatter by 4 for each square eaten), box1 and box2 are where the square is, box3 and box4 remember where the snake was while `food` draws the square (it must walk there and back, and a fill needs no pen size). A tick walks 20, tests the edges with two `if`s of `or` (left and right, then top and bottom: one `or` of four was 880 px wide and covered the paper), works out how far the snake is from the square's corner into box3 and box4, and tests both with nested `if`s of `and`. Off the edge calls `restart` (clean, size 8, middle, facing right, a new square). **A real snake needs a list or a few more boxes; that is the open question to put to the user** (a fifth to eighth box, or lists of numbers).
- **Listed event samples (2026-11-07, "maybe a few samples")**: `keyboard-painter` (arrows walk and turn 45, r g b change the color; the checks press an octagon three times), `bouncing-turtle` (an `every 0.5` that walks 40 and, near an edge, backs up and turns 97, drawn by two `if`s of `or`), `click-flowers` (a click opens a flower of twelve turning squares, from a block of your own with an input, in a random color and size), and the two games as `catch-the-square` and `fat-snake`. **A wide expression covers the paper:** one `or` of four comparisons was 880 px wide and sat over the drawing whenever the blocks showed, so the edge tests are two `if`s with an `or` of two (about 430 px). A listed sample needs a thumbnail (`images/samples/<id>.png`, from `dev/make-sample-thumbs.mjs`, which now clicks, presses keys and waits for the timer first) and `samples.html` made again (`dev/make-samples-page.mjs`); an unlisted lesson demo must be named `lesson-...`, so a game that is both uses a shared constant. **The snake cannot rub out an eaten square** (only the newest is remembered, and the new square is drawn from the head's heading), so old squares stay on the paper; the Step 17 page says so and offers "Rub out the old square" as a Done early puzzle.
- **The yellow box strip** is refreshed after every click, key press and tick (`runHandlers` in `main.js`): at the instant speed a block does not stop to show it, and a game's score would stay stale until the program next waited.
- **Not built yet:** key release and held-key state (a program only hears presses), a `key` reporter (no text values), an `every` time that changes while it runs, pausing a timer, mouse move, a list for a tail, and listing the game samples on the Samples page (`lesson-click-game` and `lesson-snake` are unlisted; the user asked "did you make the game into a sample?" and has not said to list them).
- Tests: `test/spec.test.js` (the hats, the keys), `scheduler.test.js` (timers with a fake `setRepeat`), `complexity.test.js`, `logo.test.js`, `python.test.js`, `samples.test.js`, `lessons.test.js` (Step 17's numbers), and `dev/key-checks.mjs` (real Chrome: the palette, the key list, key presses, Ctrl, typing in the Logo box, a focused button, timers, Stop, a bad time, the message, and the snake in a 700 x 520 frame). **`dev/cdp.mjs` has `press(key)`; a headless page that has never had focus turns `hidden` on its first key press, which stops animation frames and throttles timers, so a check that presses keys must first call `Emulation.setFocusEmulationEnabled` and `Page.bringToFront`** (found the hard way: every check after the first key failed).

## Blocks you make yourself (functions)

A stack that starts with a `to` block IS the definition: `{ op: 'to', name,
params }`, and the blocks under it are what it does. Nothing else is stored, so
saving, undo, autosave, copying and deleting work with no extra code. Using it
is `{ op: 'call', name, params, args }`; `{ op: 'input', name }` hands back a
number the call was given. The fixed table `BLOCKS` stays fixed: `to`, `call`
and `input` are generic entries (`call` and `input` have `dynamic: true`), and
`specOf(block)` in blocks-spec.js builds the real spec from the names stored in
the block. Use `specOf(block)`, never `BLOCKS[block.op]`, anywhere a call or an
input could appear.

- **Calls hold copies of the name and input names**, so a call can be drawn and
  still makes sense after its definition is deleted (it says "There is no block
  called x" when run). That means a change to a definition must change every
  call: `renameDefinition`, `setInput` and `syncCalls` in definitions.js do that
  (and rename the input blocks inside the definition). Names are unique ignoring
  capitals (`nameKey`); two definitions with one name is refused when typing,
  fixed on copy (`uniquifyDefinition`: square becomes square2), and reported at
  Run if a file somehow has two.
- **The `to` hat's boxes are not sockets.** They live in `node.nameSlots`, apart
  from `node.args` (the snapping code treats every arg as a socket for blocks),
  with their own click entry type `nameslot`. The dashed box adds an input (at
  most two); emptying one removes it. `workspace.editName` is the typing overlay.
- **Running.** `findRunStack` never picks a definition. `main.js` collects
  `definitionsOf(project)` at each Run into `ctx.definitions`; a `call` pushes a
  frame (`ctx.frames`) holding its inputs, runs the body, pops in a `finally`.
  `stop` in a body only leaves that block (the call swallows STOP).
- **Depth.** Blocks inside blocks are generators inside generators, and V8 takes
  only about 4,400 of them, so deep recursion used to crash. `runBlocks` now
  dispatches without a generator layer for commands, and `MAX_CALL_DEPTH` is
  500 (a unit test runs 499 deep with an if and a repeat around each call).
  Past what fits, a `RangeError` is turned into a friendly message in `main.js`
  (proved in real Chrome by lifting the limit). Measure again before raising it.
- **Palette.** My Blocks lists the `to` block, then a call (and its
  input blocks) for every definition. (The boxes are in the Boxes palette.) `PaletteUI.entriesFor` builds entries with
  a `make()`, so a flyout block is made fresh when dragged; `refresh()` redraws
  the open flyout and `main.js` calls it after every change to the project.

## Python box

`core/python.js` (DOM-free) turns the project into a program for Python's standard
`turtle` module, shown in a small show/hide panel (`ui/python-box.js`, the `>>>`
button) that follows the blocks through `projectChanged()` in `main.js`. It exists
for students who are learning Python, so it favors reading over fidelity, but it is
meant to be right, and a test proves it: `test/python.test.js` runs the Python
(`test/python-runner.py`, a stand-in `turtle` module that copies CPython's own
`circle` steps) and the blocks (TurtleLab's interpreter) on every sample and on
hand-made tricky programs, and checks they end in the same place, facing the same
way, having drawn as far and printed the same. It is skipped if `python3` is
missing, so run it where Python is.

- **The translations that are not obvious:** headings (`90 - heading`, since Python's
  0 is east and counter-clockwise), arcs (a positive angle curves right, which is a
  NEGATIVE radius in Python), `color()` for the one color that serves pen and fill,
  `clean` as a helper function (it must not draw a line going home), boxes as
  globals with `global` where a block of your own changes one, `random.randint` only
  when both ends are whole-number literals, `stop` as `return` inside a block and
  `raise SystemExit` outside, and parentheses only where precedence needs them.
- **It must also run in EduBlocks (edublocks.org), which is NOT ordinary Python
  turtle, nor even stock Skulpt.** The teacher pastes the Python in, and was
  failing on one missing thing at a time: `NameError: name 'colormode' is not
  defined`, then `AttributeError: 'Screen' object has no attribute 'colormode'`
  (my first "fix" was a guess from Skulpt's source, which was the wrong thing to
  read). The truth is in EduBlocks' own file, which I fetched and read (November
  2026): `https://app.edublocks.org/pyscript/turtle/turtle.py`, a ~10 KB wrapper
  that PyScript loads. Its `__all__` is the whole list of names, and: **no
  `colormode` anywhere, no `done()`/`mainloop`, `color(r, g, b)` only for whole
  numbers (it builds a hex string with `%02x`), `pencolor()` and `pensize()` cannot
  be read back (they need an argument), and the top-level `clear` is the Screen's.**
  So the generator uses only what both Python and EduBlocks have:
  colors are hex strings from a tiny `rgb()` helper (with `channel()` clamping and
  rounding like the blocks do); a program that reads the pen color or size
  (`penred`, `pensize` blocks) keeps `pen_color` and `pen_size` itself through
  `set_color` and `set_pensize` (only such programs get that code); and the
  program ends `try: done() except NameError: pass`.
  `test/python-runner.py` is a stand-in for EduBlocks' turtle with exactly its
  names and its strictness (the old mistakes fail there with the real errors), it
  is the single source of the name list, and the tests RUN every sample and a
  program with every block on it, and check names with `ast` (a name inside
  `except NameError` is allowed to be missing). **If EduBlocks changes, fetch that
  file again and update `EDUBLOCKS_NAMES` in the runner.** The teacher pasted the
  result into the real editor at edublocks.org and it ran (2026-11-03), so the stand-in
  and the tests match what EduBlocks does.
- **Names** are made safe for Python (spaces, digits, keywords, and the names the
  program itself uses, which get a trailing underscore), and two names that would
  collide get a number.
- Sticky notes become comments at the top; stacks not connected to Start are only
  counted in a comment; a program that does not begin with `clean` is given
  TurtleLab's start (facing up, red pen, size 5) because Python's differs.
- It is not a promise that students can paste it back: it is for reading.

## The Logo box

The **Logo** button (`fd`) opens `ui/logo-box.js`, a panel in the Python box's corner (only one is open at a time) that shows the blocks as Logo
(`core/logo.js`, `toLogo(project, { short })`), **can be typed in**, and has **Run Logo**, Copy, Short words (fd, rt, pu instead of forward, right,
penup) and Follow my blocks. The user asked for it: "allow the user to modify the logo (knowing that then the blocks will not match) and hit run".

- **Logo is compiled into BLOCKS, not interpreted separately** (`core/logo-compile.js`, `compileLogo(text)` returns `{ ok, main, stacks }` or
  `{ ok: false, error, line }`). The block trees are run by the existing interpreter and scheduler, so speed, Stop, wait, print, recursion and every
  error message behave exactly as for blocks. The key test (`test/logo.test.js`) writes every sample and a program using every block out as Logo
  (both styles), reads it back, runs both with the same seeded random, and requires the very same ops, final state, printed lines, waits and boxes.
- **The dialect** (header comment of logo-compile.js is the list): fd/forward, bk/back, lt/left, rt/right, setxy, setx, sety, seth/setheading, home, arc,
  pu/penup, pd/pendown, setpensize, setpc/setpencolor ([r g b], a color name, or three inputs), setsc/setscreencolor, cs/clearscreen/clean (= the clean
  block, which also resets the pen), startfill, endfill, pr/print, setspeed, stop, wait, write |words| size, setfont "name, setcurve n, repeat, forever, if, ifelse, make, to ... end,
  `+ - * / %`, `< > =`, `(random lo hi)`, `random n` (0 to n-1, like UCB Logo), oneof, sum/difference/product/quotient/modulo, xcor/ycor/heading/pensize/penred/...
  It is deliberately NOT UCB Logo in these ways: colors are 0 to 255, `arc` moves the turtle (positive curves right), `%` is infix, `wait` IS in 60ths
  (Logo's way; the block counts tenths, converted both ways), `setspeed` and `oneof` and `write` are ours. Real Logo words we lack (sqrt, and/or/not, lists,
  output, local...) get "is real Logo, but it is not in TurtleLab Logo yet".
- **Minus signs:** a `-` with a space before and none after is the number -5 starting the next input (`setxy 10 -20`), otherwise it is subtraction
  (`10 - 5`, `10-5`). The tokenizer records `before` and `after` for this. The generator always spaces a subtraction.
- **Variables:** `make "name v` and `:name`. Names called box1 to box4 ARE those boxes (reading before making is fine, as in blocks); other names take the
  free boxes in order, and a fifth is an error (there are only four boxes). Inputs of a `to` are the `input` reporters (no limit on how many here, unlike the
  editor's two). `make` cannot change an input. Reading a name never made is an error with the fix in it.
- **Errors say the line** (`LogoError.line`, and each block carries `logoLine`, a non-enumerable property, so a run-time error such as division by zero can say
  "Line 2: ..."; `main.js` sets `runningLogo` to tell a Logo run from a block run, and `LogoBox.showError` selects the line). Also: "Did you mean right?" by edit distance.
- **No preamble:** the text starts with the program itself (or the first `to`). There is no heading comment and sticky notes are NOT written into the Logo
  (the user asked for the opening comments to go). The only comments left are guidance at the end: stacks not connected to Start, or "Nothing runs yet".
- **Names the generator writes** are made safe: spaces become underscores, words Logo already has get a trailing `_` (a block called forward is `forward_`), clashes are numbered.
- **Not saved.** The text lives only in the textarea (max 20,000 letters): no autosave, not in the project or PNG, nothing stored (the privacy page says so; `dev/logo-checks.mjs`
  checks storage and cookies). Until the student types, the box follows the blocks; once they have, it never overwrites their words (Follow my blocks does, on purpose).
  Deeply nested input is refused politely (the compiler catches RangeError).
- **Open in real Logo** (a button in the box): opens the program in JSLogo at `../logo/#...` on this same site (see the root CLAUDE.md, "JSLogo"). If the box has been
  typed in, that text is compiled first (a mistake is shown and nothing is sent), and the variables keep the names the student gave them (`compileLogo` returns
  `boxNames`, and `toLogo(..., { boxNames })` writes `:size` and not `:box1`). Then `toLogo(..., { jslogo: true })` writes it for JSLogo. `window.open` is called from the
  click, so a blocked pop-up is noticed and said.
- Tests: `test/logo.test.js` (unit, fast), `test/jslogo.test.js` (the JSLogo translation, run in JSLogo's own interpreter), `dev/logo-checks.mjs` (real Chrome, about half a minute, 37 checks: button, box, short words, run, edit, mistakes, Stop, follow, the shared corner,
  keys, storage, toolbar width).

## The PDF

The PDF button makes a US Letter PDF of your work with **the blocks and the drawing (with the turtle and a grid on it)**, the score along the top of page 1 and its reasons on a last page (see "The score is on the PDF" below), the file name above and a line of
help below. **Where they go depends on the blocks** (`chooseLayout` in `core/pdf.js`, tested in `test/pdf.test.js`): the blocks are 15 points
high when not shrunk and may not go below 8 (`READABLE_SCALE`). *Stacked* (blocks in the top half, drawing in the bottom half) if they stay readable; else *side*
(blocks down the left at up to full height, drawing at the top right at least 300 wide, preferably 380); else *pages* (blocks fill page 1, drawing fills
page 2). Programs are tall and thin, so half a page squeezed a dozen blocks to about 6 point writing, which is why. The first page's object numbers never
change (catalog 1, pages 2, page 3, font 4, contents 5, info 6); a second page's come after them. The app's message says which layout was used. `core/pdf.js` writes it by hand (numbered objects, a table of where
each starts), with no library, just as `png-chunks.js` writes PNG chunks. The two
pictures are raw RGB squashed with `CompressionStream('deflate')` (which is exactly
FlateDecode); text is the built-in Helvetica, so no font is embedded.

- **The score is on the PDF (2026-11-05, the user: "put the Blocks, Complexity, etc score on the first page of the PDF. And after the drawing, include the reasons that we already generate. Makes it easier to grade").**
  `savePdf(canvas, project, shown, score)` takes what the badge shows (`scoreBadge.result`, the `assess()` result, so the PDF always says exactly what the badge said) and `core/score-report.js`
  (`scoreReport`, pure, `test/score-report.test.js`) turns it into plain data for `buildPdf({ report })`, so `core/pdf.js` knows nothing about scores. **Page 1** gets a strip along the top
  (`SCORE_STRIP` 40 points, taken from the pictures by `chooseLayout(code, drawing, reserve)`, so every layout and every picture still fits under it; page 2 of the `pages` layout is not given less):
  Blocks, Complexity, Elegance and Efficiency, each with its number in bold and a small bar (none for Blocks; elegance with fewer than 3 blocks says `not yet` and efficiency before a run says
  `not run`, with no bar). **A last page** (more if it runs long) after the drawing has "Score and reasons": for each of the three, what it means, then complexity's level line and its points as a **ruled table** (2026-11-05, the user: the numbers were "several inches to the
  right and hard to line up", wanted "a bit of blank space to the right in case I want to hand-write points if I use it as a rubric", and asked why it said "try repeat"): columns Idea, Count, Points
  and an **empty Mark column** about three inches wide, every row 20 points tall so a mark fits, ruled across the whole width (`drawTable` in `core/pdf.js`; rows at 0 dimmed; a Total row, which equals the
  sum of the rows, `complexity.points`). The rows are named for the blocks they count and have **nothing in brackets** (`TABLE_LABELS` in `core/score-report.js`: Variables, repeat / forever, if / if else, Blocks you made,
  Math and random, Blocks, Big ideas used), and Count is `part.count` (how many). **The little hints that said "try repeat", "try if", "try to" and "store a number in a box, then use it" on a row with 0 were first
  copied into this table, and the user then asked for them gone from the badge panel too ("unnecessarily awkward"), so `complexity.js` no longer writes them: a row's `detail` is only ever a fact (`1 box, 1 input`,
  `1 inside another`, `1 with an else`, `1 used, one uses itself`, `the first 20 count`, `2 of 4`), and the panel shows the one-thing-to-try tip underneath instead.** Then its tip, and elegance's and efficiency's reasons, each beside a bold `Good` or `Tip` (words, not the badge's tick and arrow, so it prints
  the same in black and white). These are the badge panel's own sentences (`METRICS` and `levelLine` moved into `core/quality.js` so the badge and the PDF share one copy). **Text needs its
  width:** the PDF uses the built-in Helvetica, which has no widths in the file, so `core/pdf.js` carries the 95 Helvetica letter widths (`HELVETICA`; `textWidth`, `wrapText`) to wrap lines at the margin;
  the headings and numbers use Helvetica-Bold (`/F2`, one more object, only when there is a report). A letter that is not plain ASCII is written as `?` (and measured as one); a test checks every
  sample's report is plain ASCII. **A PDF with no `report` is exactly the old one** (the first page's object numbers do not change, no bold font, one page for a small program), and `buildPdf`
  without a report is what most of `test/pdf.test.js` still tests. Efficiency needs a run, and the badge has none until the program has run since its blocks last changed, so
  **the PDF button runs the program first when the badge has no run** (2026-11-05, the user: "My first experiment shows Efficiency: not run. I think maybe we need to run it if it hasn't been run yet when
  the PDF button is pressed"): `runBeforePdf` in `main.js`, which checks `scoreBadge.run === null`, takes the run stack from `findRunStack`, and runs it at **instant speed whatever the program's speed blocks say**
  (`hurry`, which `setSpeed` and `runStack` read; a run started by the Run button is not affected). A `wait` block still takes its real time, and a program that never ends (`forever`) is
  stopped after `PDF_RUN_MS` (5 s, which was 15 s at first: the user found 15 too long to wait, and at instant speed a loop has drawn all it will show in a second or two; `?pdfrun=3` makes it 3 s for trying it out), after which the PDF is made from what had been drawn (a stopped run can be measured). A run that is already going is
  waited for (not started again, same cap). The message in the bar says what happened, in front of "Saved ...": "Your program was run first, so the numbers and the drawing are from that run.", "... was still going
  after 5 seconds, so it was stopped there ...", or "... stopped with a mistake (the block is outlined), so the PDF has what it drew before that." (a run with a mistake has no efficiency, so the page says `not run`).
  Nothing is run when there is no Start block or command stack (an empty page, only blocks you made), or when the badge already has a run (the PDF does not run it again). The run redraws the paper, so a picture
  opened from a file is redrawn from its blocks, which is the same drawing unless the program uses `random`. `finishWaiters` is how `savePdfNow` hears the run end (it is called from `onFinish`). The score is worked out on the device and written into the file, so **the privacy page and the Guide say the PDF is the one
  place the score goes** (not into a saved picture, JPEG, SVG, embroidery file or the autosave). Poppler's `pdftotext` is used by the unit test and the editor checks to read the numbers back;
  poppler on a Mac may draw the bold as regular (a font substitution on its side; the file names Helvetica-Bold correctly).
- **The picture inside is the real PNG, with the blocks in it, attached as a file**
  (`/EmbeddedFile`) and stored plain, not squashed. A PDF image cannot carry PNG
  metadata, so this is how "the picture in the PDF has the code in it" is true. And
  because the bytes are plain, `project-file.js` can find the PNG inside the PDF by
  its signature (`findAttachedPng`), so **Open and drag-and-drop accept the PDF**.
  Poppler (`pdfdetach`) can pull the same PNG out, and any PNG viewer can then open it.
- **The drawing in the PDF has the turtle AND a grid on it; the PNG never has either.** The teacher grades from the PDF and asked for the grid always (not only when the
  grid button is on): `paperWithTurtle()` calls `paintGrid(..., { strong: true })` on its copy of the paper first (stronger lines, 30 px numbers, since the
  picture is shrunk onto a page). The paper canvas itself, the PNG, JPEG, SVG and the embedded PNG are still grid-free. **The drawing in the PDF has the turtle on it; the PNG never does.** The teacher grades
  from the PDF and wants to see which way the turtle was facing, so `CanvasView.paperWithTurtle()`
  copies the 1400x1120 paper and stamps the turtle sprite (the same SVG as on the screen,
  70 paper units wide, a bit bigger than on the screen so the nose is easy to see when
  printed small: `PDF_TURTLE_SIZE`) at the turtle's position, turned clockwise by its
  heading. `savePdf(canvas, project, shown)` shows `shown` on the page but still makes the
  attached PNG from the bare `canvas`, so saving a PNG, or opening a PDF, never puts a turtle
  on the paper. Both halves are tested (`dev/editor-checks.mjs`): poppler's rendering of the
  page has the turtle's green in the bottom half only, the attached PNG has none, and a big
  stamped turtle at six headings has its middle of mass behind its nose (the body is a little
  heavier toward the tail, which is a sturdy way to test the direction without comparing
  pictures by eye). A mutant with no `rotate()` and one that attached the stamped canvas both
  fail those checks.
- **The blocks picture** (`ui/code-image.js`) lays out every stack and note as the
  workspace does, puts them in one SVG, and draws that on a canvas at twice the
  sharpness. An SVG shown as an image cannot use the page's fonts, so the Roboto
  font is written into it from `ui/roboto-data.js`. **That file exists so nothing is
  fetched:** the privacy page promises no network requests, and a fetch of our own
  font would quietly break it. If the woff2 ever changes, run
  `node turtlelab/dev/make-font-data.mjs` (a test fails if they differ).
- **The picture of the blocks looks like the screen.** Each stack is drawn where it is on
  the page. The only change is that wide empty bands between stacks are narrowed to 40
  (`core/squeeze.js`), because the picture must fit half a page and empty space only
  makes the writing smaller. Nothing else moves: left stays left, above stays above,
  what lined up still does, and (a test checks random layouts) nothing starts to
  overlap. An earlier version packed the stacks into neat columns; the teacher
  noticed at once that the PDF no longer looked like their screen. Do not do that.
- Tests: `test/pdf.test.js` reads the PDF back with plain code (the table of
  offsets, the pictures coming out exactly as they went in, the attached bytes) and
  asks poppler (`pdfinfo`, `pdfdetach`, `pdftoppm`) what it thinks; the editor
  checks make a real one in Chrome, open it again, and assert **zero requests**.

## Fit, the grid and other ways to save

**The drawing has a view** (`core/fit.js`): `{ zoom, cx, cy }`, the part of the turtle's world the 700 by 560
paper shows (default `{1, 0, 0}`). It is a change of VIEW only: x and y mean what they always did. The
canvas is painted through it (`paintOp(ctx, op, view)`), and **a zoomed picture is painted again from the
turtle's own op list** (`CanvasView.repaint`), with an opened picture lying under the ops as one image
(`this.picture`, an `ImageBitmap` the canvas owns and closes). `clear` and `fillScreen` cover the whole
canvas whatever the view is. If the turtle dropped old ops (`turtle.truncated`, after 200,000), painting
again would lose the rest, so Fit and the house button refuse (a new Run forces the view back, because it
is about to clean anyway).

- **Fit** (`#fit`, four corners round a square): `fit()` finds a box round everything drawn since the last
  clean (arcs by their real bulge, fills by the whole walk, pen thickness included, an opened picture counted
  as the whole paper only if something was drawn on it), keeps the turtle in it, and zooms IN or OUT to fill
  the paper less a 40 unit margin (zoom 0.001 to 10). It also calls `workspace.fitBlocks` (never zooms in
  past 1, out as far as `FIT_MIN_ZOOM` 0.2 in `core/view.js`, which is further than the zoom buttons' 0.4 on purpose: a long program on a short window did not fit at 0.4, so the bottom of the code
  stayed off the screen; top left of the blocks at the top left of the room right of the palettes).
  **Pressed again, Fit goes back (2026-11-05, the user: "the Fit zoom button does not bring in the program code so I can see it, or resize it to normal size or something").** The paper goes to the default
  view (`sameView` in `core/fit.js`: within a fifth of a percent and half a pixel) **and the blocks go to normal size** with the top left of the code brought into the window (`fitBlocks(inset, { normal: true })`,
  `minZoom: 1`), so a long program is readable and can be slid. A long program is shrunk a lot by the first press (46 blocks to 0.35 in a 700 pixel window), and until this the second press fitted it again at
  that size, so nothing ever put it back. `fitEverything` in `main.js` remembers the view the blocks were left in (`blocksFitted`): the press counts as "back" if the paper was fitted OR the blocks are still exactly
  where the last Fit left them (so it works with nothing drawn, too); moving the blocks, or any change to them (`projectChanged`), forgets it, so the next press fits afresh. **The PDF button no longer touches the
  blocks on the screen:** it calls `view.fit({ toggle: false })` for the paper only (it used to call `fitEverything`, which left every long program shrunk to a tiny size on the screen after each PDF; the blocks
  in the PDF are drawn apart from the screen by `renderCodeImage`). The PDF button does fit the paper first, so the whole drawing is in the PDF, and it never toggles back. `?demo=tall` is a 46 block program for these checks (`dev/view-checks.mjs`). **A Run starts from the default view,**
  and so do New and Open; the house button goes back too. The sprite and the turtle drag go through the view.
  The zoom is not saved in a picture (a saved picture is what you saw).
- **Grid** (`#grid`): a second canvas, `.paper-grid`, above the paper and under the turtle, so it is never in a
  PNG, JPEG or SVG (the PDF paints its own copy, see "The PDF"). Lines at 1, 2, 5, 10... times a power of ten, never closer than 50 paper units on the
  screen (`core/grid.js`); axes darker; numbers along the axes, with a white halo, about 12 screen pixels
  tall. Not saved anywhere (no new storage). **Kinds of grid and paper looks: see "Other grids and papers" right below.**
- **Other grids and papers (2026-11-05, the user: "Now implement the different types of grids"; earlier, "I do want to build the paper styles").** Right-click or press and hold the grid button
  (`gridMenu` in `main.js`, which is the Save menu class `ExportMenu` generalized: it takes `{ heading }` rows, `radio: true` rows with `aria-checked` and a check mark, `setChecked(ids)`,
  and an `aria-label`) for a list with two independent parts. **A plain click no longer just toggles (2026-11-05, the user: "make the grid button when it is clicked either go back to the blank screen or cycle thru the Paper options, but always with just squares with x and y"):** it is `afterGridPress` in `core/paper.js` (pure, tested): grid off turns it on (kind forced to `numbers`, paper kept); grid on goes to the next paper in `PAPERS` order (white, whiteboard, graph, chalkboard, blueprint) with kind `numbers`; after the last paper the blank screen comes back (no grid, white). So from blank: grid on white, whiteboard, graph, chalkboard, blueprint, blank. The tooltip says what the next press does, the message line says what the paper is. The menu is how to get other kinds of grid. **Grid** (radio): No grid, then `GRID_TYPES` in `core/grid.js`: `numbers` (the old grid:
  squares with x and y numbers, the default), `squares` (no numbers), `dots`, `polar` (rings `step` apart, a spoke every 30 degrees, headings written just inside the paper's edge with
  0 up and growing clockwise like set heading, and the ring distances up the 0 heading). **There was a fifth, `triangles`, and the user removed it ("triangles are silly",
  2026-11-05): do not bring it back.** Choosing a kind turns the grid on. The geometry is pure (`gridLines`, `polarGrid`, unit tested) and `ui/grid-paint.js` draws it (`paintGrid`, with `rayInside` for the heading labels and `gridColors`); `CanvasView.paintGrid` delegates to it. **Paper** (radio): `PAPERS`
  in `core/paper.js`: `white`, `whiteboard`, `graph`, `chalkboard`, `blueprint` (the whiteboard and chalkboard are hand drawn, see "Hand drawn papers" below). **It is only a look, never in a saved file:** the paper canvas stays white (so every PNG, JPEG, SVG, embroidery file and the
  PDF are unchanged, and the PDF's copy always paints `type: 'numbers'`, `dark: false`, `strong: true`). Done with CSS on the box (class `paper-<id>`, set by `CanvasView.setPaper`): a dark paper
  puts `filter: invert(1) hue-rotate(180deg)` on the picture (on `canvas.paper` for the blueprint, on `canvas.paper-sketch` for the chalkboard; black becomes white chalk, red stays about red; other colors shift a little, which is why it is a look and not the data)
  and a third canvas `.paper-style` (between the paper and the grid) is filled with the board color and blended with `mix-blend-mode: lighten` (so black, after the invert, becomes the board color);
  graph paper prints faint squares on `.paper-style` blended with `multiply` (`printedLines` in `core/paper.js`: squares never finer than 10 units, never closer than 8 screen pixels, a bold
  line every 5th, so they zoom and slide with the drawing); blueprint is both. The grid draws light on a dark paper (`gridColors({ dark })`). **Nothing is remembered:** grid kind, paper and
  on/off reset when the page closes, like the grid on/off always did, so the privacy pages' storage promise is unchanged (they and the Guide say so). Developer shortcuts: `?grid=polar` and
  `?paper=blueprint`. Tests: `test/grid.test.js`, `paper.test.js`, `grid-paint.test.js` (a recording canvas), `pages.test.js`, and `dev/view-checks.mjs` (the real menu, pixels of each kind,
  each paper, forgetting on reload, the PDF still written). A bug worth remembering: `paintPolar` first passed `{dx, dy}` where `rayInside` wants `{x, y}`, so every heading label was silently
  skipped (nothing threw); the recording-canvas test now asserts every heading is written.
- **The color picker on set color and fill screen (2026-11-05, the user: "make a way for set color and fill screen blocks to have a color picker (but keep the 3 numbers)... useful when explaining some binary stuff. I'd display hex too").**
  Spec flag `colorSlot: true` on `setcolor` and `fillscreen` (`core/blocks-spec.js`; documented there). It is another *slot* on the block, like the font dropdown (`layoutColorSlot` in `ui/block-view.js`, drawn after the
  label, class `node nameslot colorslot`): a rounded box filled with the color of the three sockets with its hex written on it (`#FF8000`, white writing on dark colors), **under the block's words** (the user asked for under, not beside:
  the word on top and the box right under it, lined up on the left and centered in the block's height, so the block is also narrower), **always the same width** (so picking never resizes the block). **It has no
  `nameslot` class** (just `node colorslot`): the sample checks and the editor checks count `.node.nameslot` as the names of blocks you made, and with the class every sample's program looked like a definition (40
  failures "no program"; found by the sample suite). **The block keeps only its three numbers**: the slot has no data of its own, `colorOfArgs(block.args, defaults)` in `core/color.js` reads the sockets (a socket with another block in it means no one color: the
  box is dashed and says `N/A` (it said "blocks" first; the user pointed out that a variable in a socket is not "blocks": N/A is true for a box variable, an input or random alike), and pressing it only shows a message in `Workspace.chooseColor`). Pressing the box (in the workspace, not the palette, whose blocks are patterns) opens `ui/color-picker.js`, a panel
  with: the browser's own color chooser (`<input type="color">`), the whole color as hex (typed hex is read with or without `#`, any case, or 3 digits), and for each of red, green and blue a slider, the number, 2 hex
  digits and 8 binary digits (shown `1111 1111`), plus a line "All 24 bits". **Every control is editable and the others follow** (`show(except)` does not overwrite the one being typed in; a number over 255 or a short
  or non-hex entry just waits, and is put back when the box is left). `onLive` writes `block.args` and calls `workspace.render()` on each change (the block's box follows as you drag); `onCommit` (`workspace.onChange`, so the undo step, autosave, the score and the Python box)
  fires **once, when the picker closes**, if the color is not what it was when it opened: so **a whole picking session is one undo step** and Undo puts back the color the block had before. (The first version committed
  on each control's `change` event, which fires when you move from one box to the next, so one session made several undo steps; a browser check caught it.) Escape, Done, a press anywhere else, a file drop and Ctrl/Cmd
  plus Z, Y or S all close it (keeping the change first), since Undo and Redo swap the whole project and the picker would be writing into a block that is gone.
  It opens under the box, else above, else as far as it will go on screen (a short window covers its own block). Pure helpers with tests in `core/color.js` (`toHexUpper`, `channelHex`, `channelBinary`, `colorBits`,
  `parseHex`, `parseChannelHex`, `parseBinary`, `colorOfArgs`): `test/color.test.js`; real typing and clicking in `dev/editor-checks.mjs` ("The color picker"). Nothing is stored or sent, Logo/Python/PNG are unchanged.
- **The can's score, and poking the can (2026-11-05, the user: "put a score on the garbage can once the shark eats something and subtract a point if he gets harpooned. If it gets to zero or less, just remove the
  score. And if the click on the garbage can the number of times of the score (or once if the score is <= 0), make either the fish come up or the boat with the harpoon come. Is that nice whimsy?").**
  `core/can-score.js` (pure, `test/can-score.test.js`): `CanScore` (`ate()` +1; `harpooned()` -1 where reaching zero takes the score away, so it stays 0, never negative, and the next meal starts at 1; `set(n)`),
  `pokesNeeded(points)` (the score, or 1 if there is none) and `Pokes` (a run of pokes; a pause over `POKE_GAP_MS` 1500 starts the count again). `ui/trash.js` shows it: **a yellow sticker drawn inside the can's own
  SVG** (`g.can-score`, on the can's body, so it moves with the can; hidden by CSS unless `.has-score`; the number shrinks for 2 and 3 digits; it bumps on a point and flashes red on a harpoon that leaves a score).
  **Where the points come from** (all inside `Trash`, so nothing else has to know): `feed()` (a stack of blocks thrown in) is +1; `hunt()`'s bite (`BITE_AT_MS`, when a clicked fish or boat is eaten) is +1, once;
  `clang()` (the boat's harpoon hit) is -1. `snap()` (the shark snapping back at the boat) and `spit()` (Undo) change nothing. **Poking:** `.trash-hit`, a div over the can's body (below the shark, inside the can)
  with `pointer-events: auto` (the can itself stays `pointer-events: none` so a carried stack gets the mouse, and the stage's pan handler only reacts to the stage and the paper, so presses on the can do not pan).
  `Trash.poke()` jiggles the can (`.poked`), shows a bubble ("2 more", for 1.4 s), and on the last poke calls `onSummon`, which `main.js` sets: a fish or the boat, in a random order, the second tried if the first
  `swim()`/`sail()` returns false ("not now" shows if neither can come). **On a computer that asked for reduced motion poking does nothing** (like the burp and the idle antics); the sticker still shows. Nothing is
  stored; the score starts again at nothing on each page load. `?canscore=5` starts the can with a score, for trying it out. Big scores need many pokes (the user's rule: no cap; add one if it proves tedious).
  Tests: `test/hunt.test.js` (the stand-in page now has `addEventListener` and a writable `querySelector` stub; score and poke tests), and `dev/can-checks.mjs` (real clicks: sticker, feeding, poking, a clicked fish
  scoring, the harpoon taking a point and the sticker coming off, reduced motion, nothing stored; run it with the dev server like the others).
- **The badge: blocks, complexity, elegance, efficiency (2026-11-05).** First "a program complexity score... reward loops, conditionals, and especially variables", one number (points); then the user asked "should we
  give complexity, elegance and efficiency (0.0 to 1.0?)", then "we need to count blocks too. i love the reasons. whole decimals is fine I think? Let's try it. go". A card in the **bottom right corner** (`ui/score-badge.js`,
  created in `main.js`; it was first bottom left, where it covered the last blocks of the open Flow palette, which the editor suite caught): four columns, **Blocks** (the count, hats and notes not counted) and three numbers shown to
  one decimal (`tenths()`: 0.7; `?` when there is nothing to judge, `run it` for efficiency before a run), each with a small bar. Press it (or Escape / click away) for the details: a head with the block count, then
  Complexity, Elegance and Efficiency each with its number, a meter, what it means, and **its reasons** (two columns on a window 820 px wide or more, one scrolling column below). Hidden with the blocks.
  **Complexity** (`core/complexity.js` points, unchanged: plain blocks count 1 each up to 20; variables pay most: a box worth 12 once stored in, +3 per store, +4 per read, +8 for a counter like box1 + 1, +15 for the
  first variable really used, an input of your own block 6 and 3 per use; loops 6 (+4 nested); conditionals 7 (+2 else, +3 in a loop); own blocks 8 when used; math 2/chance 3 to 16; bonus 6 per big idea, 10 for the
  variable one, 10 for all of loops, conditionals, variables and own blocks; **plus user input, added 2026-11-06 at the user's request ("add input now as one of the things we count"): each `ask` block 6 and 6 more when box1 (its answer) is read anywhere, each `when paper clicked` that has blocks in it 8 and 3 per `mouseX` or `mouseY` read in such a program (at most 12), and 6 for the input idea like the others; an `ask` also counts as a store into box1, so using the answer earns the variable points; the panel and the PDF have a row for it (`User input`, written `ask / when paper clicked` on paper) and "Big ideas used" counts out of 5; the all four bonus is still for the first four only, so no earlier program lost points**) goes on a curve: `complexity01(points) = 1 - exp(-points / 80)` (`COMPLEXITY_SCALE`): never 1.0, a counter in a loop (82 points) is 0.6. It measures ambition, not quality; the
  panel still shows the points rows (dimmed when 0; no "try repeat" style hints: the user found them "unnecessarily awkward", in the panel as in the PDF), the level (Blank page, Just starting, Getting going, Building, Clever, Expert) and the tip.
  **Elegance** (`core/elegance.js`, from the blocks alone) starts at 1.0 and loses: *copy and paste* (one block 3+ times in a row, or 2 to 6 blocks twice or more in a row or in different places; the blocks that could be
  saved as a share of all blocks times 1.5, at most 0.6; `findCopies` counts a repeated block's inside once), *the same number typed 4+ times* (not 0, 1, -1, and not inside copies: 0.03 plus 0.01 per extra, at most 0.2),
  *left over* (a block of yours never used 0.05 each; a command stack not under start 0.05; blocks after a stop 0.05; an empty repeat/if 0.03), and *nesting past four deep* (0.05 a level). Tidy small programs reach 1.0
  (the point: a four block square can be perfect). Fewer than 3 blocks (`MIN_BLOCKS`): no number. The reasons are plain sentences (ticks for good: a block of yours used often, a loop doing the repeating, a variable; arrows for
  tips: "forward 100, right 90 comes 4 times in a row. A repeat block could do it, and save 6 blocks."); the good ones never change the number.
  **Efficiency** (`core/efficiency.js`) is about the last run, so there is none until a program has run, and it goes back to `run it` the moment the blocks change (`refresh` clears the run; `onStart` clears it too).
  `main.js` counts steps (`onStep`), resets `turtle.walked` (a new counter in `core/turtle.js`: distance walked with the pen up and down, by `moveTo` and `arc`; dragging the turtle and the write block do not count) at
  `onStart`, and at `onFinish` (done or stopped, not an error) gives `drawingStats({ ops: visibleOps(turtle.ops).ops, walked, steps, hasWrite, truncated })` to `badge.setRun`. It loses: *lines drawn over again* (walk along each
  line, 1 sample per step, in 2 step squares earlier lines went through, ignoring 3 steps at each end where lines meet; crossing lines do not count; 5% free, then 0.8 times the share, at most 0.4; at most 120,000 samples),
  *pen up walking* (10% free, then 0.5 times, at most 0.25), *tiny lines* (80+ lines, over 60% under 4 steps: 0.1 plus 1/4000 a line, at most 0.25: "an arc block draws a curve in one block") and *steps run* (3000 free, then
  0.25 per factor of ten, at most 0.3). It counts steps and distances, never time, so wait blocks do not hurt. **With a write block in the program only the walking and the steps are judged** (the words are many short
  lines, some doubled on purpose: the bold and pixel fonts). A run that drew nothing has none. Measured: neat square 1.0, star 1.0 (crossing is not overdrawing), square drawn back and forth 0.64, circle as 360 tiny steps
  0.81 against 1.0 for one arc block, two shapes 400 apart 0.77, 50,000 steps 0.70. Tests: `test/quality.test.js`, `test/complexity.test.js`, and the end of `dev/editor-checks.mjs`.
  **"+0.1 elegance" floats up** only for edits that raise complexity or elegance (from a real earlier number) and then sit still for 500 ms (`projectChanged({ edit: true })`); opening a file or sample, a new page, Undo and
  Redo and runs only show the numbers (`refresh(project, { quiet: true })`, `setRun`). Nothing is stored or sent.
- **Hand drawn papers (2026-11-05, the user: "make the chalk board look like it is hand drawn? I always want a bit of whimsy. Maybe a hand drawn whiteboard mode too?").** `whiteboard`
  (`hand: 'marker'`) and `chalkboard` (`hand: 'chalk'`) in `PAPERS`; `paper.hand` names the look, `paper.wipes` says how the board is smudged. **A new random look each time one is chosen (2026-11-05, the user: "make the dirtyness and unstraight lines a bit more randomness everytime the user switches"):** `newHandLook()` in `core/hand.js` gives `{ seed, amount, dirt, swipes }`: `seed` moves the wobble's noise layers (`saltFor`; seed 0 is the plain wobble every older test used), `amount` is 0.75 to 1.5 times `HAND_WOBBLE` (so up to 4.5 units), `dirt` 0.7 to 1.5 times the smudge strength and dust, `swipes` 0 to 3 extra swipes. `CanvasView.setHand` rolls a new one every time a hand paper is chosen, even the same paper again (a shake), and keeps it in `handLook` (memory only; `box.dataset.handLook` shows it to the browser checks, deleted on other papers); `paintHandOp`, `drawnPoint`, `drawWipes` and the grid warp all read it, so a Fit or zoom repaints the same look. Nothing is stored. The whiteboard's smudge alpha can reach about 135 of 255 at the dirtiest, so the browser check allows under 170. **How it is done, and why not the obvious way:**
  a third canvas, `.paper-sketch` (`CanvasView.sketchCanvas`, same 1400x1120, between the paper and the style layer), shows the same ops wobbled, and CSS hides the real paper canvas
  (`.paper-hand .paper { visibility: hidden }`; it is still painted exactly as before, because it is the real picture Save, the PDF and every export read, so none of them wobble).
  `paintHandOp` (canvas-view.js) mirrors `paintOp`: `clear` clears the sketch (see-through, so the box shows: white, or the board color set by `setPaper` as `box.style.backgroundColor`),
  `fillScreen` covers it, lines and arcs are `Path2D`s of `handSegment` points, fills use `handOutline` plus their pen outlines. `applyOp` and `repaint()` (so also zoom, Fit, opened pictures)
  keep the sketch up to date only while a hand paper is chosen (`setHand` repaints it on choosing). **`core/hand.js` is the wobble:** `wobbleAt(x, y)` is smooth value noise (two octaves,
  wavelengths 64 and 27 units, at most `HAND_WOBBLE` = 3 units either way) of the point's place in the turtle's world, NOT of the line it is on, so lines that meet at a corner are moved
  the same way there (a drawn square stays closed, an arc joins its neighbors), the same drawing wobbles the same way every paint, zooming scales the wobble with the drawing, and
  lines are cut into pieces of at most `HAND_STEP` = 6 units (never more than `MAX_PIECES`) so they can bend. The turtle sprite sits on the wobbled point (`drawnPoint`, used by `sync`
  and `spriteCenter`; `setHand` calls `sync`, which a browser check caught missing), and the grid wobbles with it: `paintGrid(..., { warp })` (`grid-paint.js`) draws lines and rings as
  short pieces whose points go through `warp` (`CanvasView.warpPoint`: canvas pixel to world to wobbled), dots move, the numbers stay straight so they can be read; the PDF's copy
  never passes `hand`, so it is straight. **Chalk:** every stroke gets a wider, faint dust stroke under it (`CHALK_DUST_WIDTH`, `CHALK_DUST_ALPHA`), the sketch is inverted by CSS like the
  other dark papers, and a CSS `mask-image` of grain (`chalkGrain` in hand.js: a 256 px tile, about a quarter see-through, wraps so no seam; `hand-drawn.js` turns it into a PNG data
  address once, shown at `GRAIN_SHOWN` css px) lets the board show through, so the line skips like chalk. CSP allows it (`img-src data:`). **The boards' smudges** (`wipes`, `specks`,
  `seeded` in `core/paper.js`, a fixed seed so a board always has the same ones) are painted on the style canvas by `drawWipes`: swipes of 22 to 34 thin streaks with ragged ends, and
  chalk dust; blended `lighten` on the chalkboard, `multiply` (gray) on the whiteboard; fixed to the board, so they do not move when the picture is zoomed.
  **Not done first time, and why: an SVG filter** (`feTurbulence` plus `feDisplacementMap` on the paper canvas) looked right in a screenshot but dropped the frame rate to 38 fps
  (whiteboard) and 19 fps (chalkboard) while a program drew, in headless Chrome without a GPU (worse on a retina screen or a weak Chromebook), because it is recomputed every time the canvas
  changes. The vector sketch plus a static mask measures 60 fps on every paper; keep it that way (`dev` probe: run the `spiral` sample at `?speed=fast` and count `requestAnimationFrame`s).
  Tests: `test/hand.test.js` (bounded, smooth, repeatable, corners meet, arcs, grain), `paper.test.js` (smudges), `grid-paint.test.js` (warp), `dev/view-checks.mjs` (wobble on the
  sketch and not on the paper, the turtle on the drawn tip, grain mask, Fit round trip, grid wobble, White puts everything back).
- **The toolbar is full.** Two new icon buttons pushed it to two rows at 1000 px; below 1100 px the icon
  buttons are 2.25rem and the gaps are squeezed (`css/app.css`), and `sample-checks.mjs` checks one row at 1366,
  1100 and 1000.
- **Other ways to save** (`ui/export-menu.js`, `EXPORTS` and `exportAs` in `ui/files.js`): right-click Save, or
  press and hold it (the held press must not also save: the capture-phase click handler swallows it; a check
  proves it). Formats: PNG with blocks (what Save does), PNG only, JPEG, SVG picture, SVG for a cutter, PES,
  DST, Python, project JSON. Nothing is fetched or stored. SVG (`core/svg-export.js`) is made from the op list, so
  it holds everything drawn; its arcs are real SVG arcs (a whole circle is two halves), a fill is drawn then its
  edge again like the screen, and the cutter kind is red 0.1 step hairlines, 100 steps to an inch, joined lines
  as one path. `dev/export-checks.mjs` lays the SVG over the screen's own painting for five examples and
  compares pixels (a mutant with the arc flag flipped fails it).

### Embroidery (.dst and .pes)

`core/stitch-plan.js` turns the pen's lines and arcs into a running stitch (3 mm longest, 0.4 mm shortest,
corners kept, curves followed within 0.15 mm), scaled so the longer side is 90 mm (fits a 4 inch hoop) and
centered, in tenths of a millimeter with y UP. One thread per color, in order of first appearance, with all of a
color stitched together; a hop between lines is a jump, cut first if over 3 mm. **Ignored on purpose:** pen
thickness, and fills (only their pen-down outline is stitched; the message says so). `core/embroidery.js` writes
the two files. The tests:

- **They match pyembroidery byte for byte** (`test/embroidery.test.js`, "oracle" tests, which call
  `test/embroidery-oracle.py`): the same stitches written by pyembroidery's own `.dst` and `.pes` writers give
  exactly TurtleLab's bytes, including jumps, trims, color changes and thread numbers; and pyembroidery reads
  TurtleLab's files back to the same stitches. pyembroidery (MIT) is NOT part of TurtleLab: the tests skip when it
  is missing. To run them: `python3 -m venv DIR && DIR/bin/pip install pyembroidery`, then
  `EMBROIDERY_PYTHON=DIR/bin/python3 node --test turtlelab/test/embroidery.test.js` (and the same variable for
  `dev/export-checks.mjs`). Always run them after touching `embroidery.js`.
- A `.dst` record holds a move of at most 121 (12.1 mm) in each direction (`dstRecord`; every move is
  checked to read back). Longer moves are split the way pyembroidery does (the even share is ADDED ON from the move's absolute start, in floats, and each piece is
  what reaches it from the last record, rounded half to even: doing it by multiplication differs by one tenth mm now and then, which the
  SLV logo found), and the header's +Y is the plan's lowest point and -Y its highest (the file counts y the other way; symmetric designs hid
  a swap until one was an odd number of tenths tall). Pieces are rounded like pyembroidery's (half to even,
  each piece rounded from what is still needed). A trim is three tiny jumps; a trim beside a color change is
  dropped (the machine cuts at a color change anyway).
- `.pes` is version 1 with the shape blocks (`CEmbOne`, `CSewSeg`) AND the machine's part (`PEC`): the
  512 byte header, the stitches (7 bit numbers, 12 bit with a jump or trim flag, `FE B0 01/02` for a color change,
  `FF` to end), a framed 48 by 38 picture of the design and one for each color. Thread colors are matched to Brother's
  64 colors by the "redmean" distance, one Brother color per thread (never the same twice).
- **Not tried on a real machine.** The school's machine takes `.pes` and `.dst`; test a new design on scrap cloth.
  The three samples for an embroidery machine (`concepts` includes "for an embroidery machine") are tested to be
  good to stitch: lines only, at most two threads, at most two hops (a sample of several shapes, like the paw and the script word, says its own `maxHops`), 80 to 600 stitches, no stitch over 3.1 mm.
- Possible later work: a fill stitch for filled shapes, a size choice other than 90 mm, ordering lines to shorten
  hops. Not done.

## The write block

`write` draws words as lines, in one of seven fonts (five Hershey fonts, public domain, `blocky`, EMS Osmotron, under the SIL OFL, and `pixel`, drawn for TurtleLab). It is in the **Notes** palette, not
Pen or Turtle, on purpose: the teacher worried students would use it as a shortcut for drawing letters (the lesson
Steps 1 and 5 tell students to skip it), and the Notes palette is where words live.

- **The block:** `{ op: 'write', args: [size], text, font? }`. The words are in `block.text` (cleaned by `cleanLetteringText`: only the
  95 printable ASCII characters, at most 40), the socket is how tall a capital letter is (default 60). Spec flag `textSlot`
  (`{ hint }`); `newBlock('write')` starts with the words "Hello". It is the only block with words on it besides the sticky note.
- **Settings are blocks of their own (2026-11-04, user: "make the curve a separate block like we are with the font"):** the font and the curve are
  the TURTLE's settings, like pen color and size, not parts of the write block (the dropdown was first built inside `write`; the user asked for a
  `set font` block like `set color`, and an earlier reading of "the block itself" as the write block had been mine, not theirs). **`set font`**
  (`{ op: 'setfont', args: [], font }`, Notes palette, spec flag `fontSlot: true`) picks `turtle.font`; **`set curve`** (`{ op: 'setcurve', args: [degrees] }`,
  default 120) sets `turtle.curve`. Both are put back (script, 0) by `clean` and `resetState`, so a run never depends on the last one. A `write` block has no
  font of its own (an earlier build kept one on it; `cleanBlock` now drops it). A `set font` block always keeps its `font` (an unknown value is script).
- **Fonts** (`LETTER_FONTS` in `core/lettering.js`): `script` (Script Simplex, the default and the only font before 2026-11-04), `fancy` (Script Complex,
  looped), `sans` (Futura Light), `bold` (Futura Medium, drawn as double lines so it stitches thick) and `serif` (Times Roman). Chosen because every one has
  all 95 keys and a capital H that is `size` tall, and the thin ones are few long lines (so few jumps for an embroidery machine: "Cougars" is 10 lines in
  script and sans, about 23 to 29 in fancy, bold and serif, which the tips tell the student). The Hershey set also has blackletter, Greek and symbols; left
  out (many short strokes, or not Latin). Cursive was tried and dropped: it draws "Cougars" exactly like script. To change the list: edit `FONTS` in
  `dev/make-lettering-data.py` AND `LETTER_FONTS` (a test requires the same ids in the same order).
  **`blocky` (2026-11-05, the user: "I want you to add a blocky font. Can you find one.")** is **EMS Osmotron**, a single line version of Orbitron (a squared, chamfered
  techno face: wide letters with cut off corners). Found by searching for open licensed stroke fonts: most of the monoline archives online state no license at all (so they
  cannot go in this repo); the Evil Mad Scientist `svg-fonts` set (https://gitlab.com/oskay/svg-fonts, made for Hershey Text) are derivatives of **SIL OFL** fonts with the credits in
  each file, and Osmotron is the blocky one. Only straight lines (M and L), all 95 keys, and "Cougars" is 7 lines (fewer than any other font). **Licensing:** OFL 1.1 with Orbitron's
  Reserved Font Name, so it is never *named* Orbitron in the app (the id and label are `blocky`; credits say "EMS Osmotron, from Orbitron"); `fonts/osmotron/OFL.txt` (Orbitron's own file with
  its copyright line) ships, the header of `lettering-data.js`, `NOTICE.md` and the About page credit it, and the `blocky` entry stays under the OFL (the rest of the file is AGPL).
  `dev/fonts/EMSOsmotron.svg` is the source file, unchanged (a dev file, not served), so the generator runs offline. **What the generator (`read_svg`) does to it**, because the
  block promises "a capital letter is exactly `size` tall": the E's flat bottom and top are the baseline and the capital height and an o is the x height; for capitals and digits, and for
  small letters with no ascender, every point's y is moved into that band (stems that poked out come back to the edge; letters with a tail keep it; marks like `.` `,` `'` are left alone);
  each letter is centered in its box (the conversion left more room on the left than the right) with at least 40 units each side; coordinates are scaled by 0.2 to whole numbers (a capital is
  **118** tall, where the Hershey fonts' is 21, so tests that check a font's height range are relative to its `cap`). **Do not clip instead of clamping:** the first version cut off every
  segment outside the band, and the top bars of C, F, G and S (a few units above the cap line) vanished, so the C looked like a bracket; the thumbnail showed it, no test did. The
  generator now stops if trimming takes away more than 15% of a letter's line, and `test/lettering.test.js` checks the bars exist. The five other fonts came out byte for byte the same.
  **`pixel` (2026-11-05, the user: "I was looking for a minecraft style blocky font too.")** is video game lettering made of square pixels. **Original to TurtleLab, not found:** the
  open pixel fonts online are bitmap or TrueType files (not lines), and a "Minecraft style" font from a game is not ours to use, so each of the 95 keys was drawn by hand as a picture of
  `#` (lit) and `.` pixels, 5 wide by 7 tall (`dev/fonts/pixel-5x7.txt`, with the format explained at its top: `@ x` starts a letter, `--` is the baseline, rows listed from the top, small
  letters are shorter, an `i` is 1 wide, one empty pixel between letters). Under the AGPL, no credit needed (NOTICE.md says so). **The app never names the game** (id and label `pixel`, the
  tip says "video game letters"; a test fails if "minecraft" or "mojang" is in the tip). `read_pixels` in the generator turns each picture into the **outline of its lit pixels**: every edge
  between a lit and an empty pixel, chained into closed loops (`pixel_outline`); where two pixels touch only at a corner the loop turns right, which joins them into one loop (the pen
  goes through that corner twice, which looks the same and saves a lift: otherwise the lone pixel on the left of an `a` is a separate stroke). Corners in a straight run are dropped, the
  loops are ordered biggest first then left to right so the file is the same every time, and the generator stops if a capital or digit does not fill rows 0 to 6. One pixel is **12**
  units, so a capital is **84** (`cap`), every number is a multiple of 12, and the data is only horizontal and vertical lines. **Why outlines, not a line down the middle of each
  stroke:** the pen draws round, and a one line skeleton of a 5 by 7 letter falls apart at the corners (pixels that touch diagonally do not join); the outline always keeps the square stair
  shape whatever pen size the student picks, and a thick pen or a small size fills the letters in solid, like the game's, because the two lines of a one pixel stem meet. At size 60 with pen 3
  they are crisp outlines; at size 40 with pen 3 they are nearly solid. "Cougars" is 10 strokes. Tests: `test/lettering.test.js` ("The pixel font").
- **The dropdown** is the `set font` block's one `nameSlots` entry with `editor: 'font'` (classes `nameslot textslot fontslot`; the `textslot` class keeps the
  sample checks from mistaking it for a definition). It shows the font name and an arrow, always as wide as the longest name so the block never changes size.
  `Workspace.chooseFont` opens `.font-menu` under it (above if there is no room), one button per font, each showing the word Hello drawn with the real
  lines (`fontPreview`); Escape, a click elsewhere or choosing closes it, arrow keys wrap, and choosing sets `block.font` (one undo step).
- **The words follow the turtle (2026-11-04, user: "how would we move it if we wanted the words sideways?"):** the tops of the letters point the way the turtle
  faces, so the turtle facing up (as it starts) writes upright text, and `right 90` makes the words run down the right side, `left 90` up the left. This
  CHANGED the old rule "whatever its heading": the only sample with a write block (`stitch-cougars`) writes at heading 0, and the lessons tell students to
  skip write. No new block: heading is the rotation (`Turtle.writeSteps` turns every point by the heading with `sinDeg`/`cosDeg`, so quarter turns are exact).
- **Curved text (`set curve`):** `curve` is how many degrees the BASELINE bends over the whole length of the words (`curvePoint` in `core/lettering.js`, tested
  against real circles): 0 straight, positive arches like a rainbow with the letters on the outside of the circle, negative is a bowl with the letters inside,
  360 goes right round (the most; clamped). The radius follows from the length (`radius = width / curve in radians`), so one number works for any word. **Bent
  words are centered on the turtle** (the top of the arch, the bottom of the bowl), unlike straight words, which start at the turtle; the user accepted that
  mismatch ("Okay") over adding a left/center choice. To put an arch around the middle of a badge, stand at y = the radius (`width / curve`), as the
  `stitch-badge` sample does with numbers worked out by a scratch script. Bent lines are NOT joined back into one line (a curve is not straight), so bent
  text is made of the little pieces. Walks between strokes stay straight across the paper.
- **Logo:** `setfont "fancy` (a quoted font name; an unknown one says which fonts there are) and `setcurve 120`; `write |Go| 60` is unchanged. The JSLogo
  translation leaves both out and says so (`setfont`, `setcurve` in its one comment). Python gets a comment and `pass` for each, like write.
- **On screen:** `block-view.js` draws "write", a box for the words, then the size socket. The box is a `nameSlots` entry like the
  hat's name boxes, with `editor: 'text'` (class `textslot`); `Workspace.editText` types into it; long words show shortened with `...`
  (the block keeps all of them). The sample checks tell a definition from a write block by `.nameslot:not(.textslot)`.
- **The turtle traces the letters (2026-11-04, user: "draw the text based on our speed parameter", then "simulate the turtle following the
  vectors", then "letters like H just sort of appear in pieces instead of pen-up, move, pen-down, draw"):** `write` is a FLOW generator in the
  interpreter. It steps `Turtle.writeSteps`, which yields a *share of a step* (the interpreter wraps it in a `Pace`) each time the pen tip moves a
  little: **drawing** along a stroke, or **walking** (pen up, no ink) from where the pen was to the start of the next stroke. A letter like H has three
  strokes, so the pen draws a side, walks to the next, draws it, walks to the bar, draws that. Script is joined, so it rarely walks. Each move is cut
  into pieces of at most `size / 16` steps so a long line is seen growing, and **when a line is finished its pieces are joined back into the one op**
  (`splice` in `writeSteps`), so the finished ops are byte for byte what `write` (all at once, which just runs the generator to the end) makes: SVG,
  PDF and embroidery do not change. The pieces of one letter add up to share 1, so a letter takes one step's wait at the speed (500, 100, 20 ms, none
  at instant); walking counts for `WALK_COST` (0.35) of drawing the same distance, as a hand moves faster when it is not writing. The scheduler saves
  up waits shorter than a frame (16 ms, `FRAME_MS`) and does them together (`owed`), so medium and fast are not slowed by tiny timers and the total
  time is exact. The picture of the turtle follows the pen tip (`Turtle.writing`, read by `CanvasView.sync`), turned the way it is going; `writing`
  is not the turtle's state (`x`, `y` and `heading`, what `x`, `y`, `heading` blocks report, never change) and goes back to null at the end, on Stop
  (`main.js` calls `turtle.stopWriting()` in onStart and onFinish, because a stopped generator is dropped, not finished), and on `clean`. Spaces take no
  time; an empty block takes one whole step (so a loop of them cannot freeze the page). The turtle's return to where it started after the last letter is
  instant, not walked. Slow is 0.5 s a letter, so 40 letters take 20 s. Tests: turtle, interpreter and scheduler (fake clock) unit tests. - **Drawing:** `Turtle.write(text, size, font = this.font)` records ordinary `line` ops (pen color and thickness), left to right starting at the turtle,
  **whether or not the pen is down** (and turned with the turtle, see above), and the turtle does not move. Because they are plain lines,
  Fit, SVG, the PDF and the embroidery files all work with nothing extra. Letters the font lacks are skipped.
- **Python:** the generator writes a comment and `pass` (EduBlocks' turtle has no `write`, and Python's draws a screen font, not lines). The
  Python tests compare where the turtle ends, not how far it drew, for samples with the `write` concept.
- **Data:** `js/core/lettering-data.js` (`FONT_DATA`, about 70 KB) is generated by `dev/make-lettering-data.py` from the Hershey-Fonts PyPI package
  (public domain fonts), `dev/fonts/EMSOsmotron.svg` (OFL) and `dev/fonts/pixel-5x7.txt` (our own); acknowledgments are in the file and in NOTICE.md; neither source is used at run time. The script font's numbers
  are byte for byte what they were when it was the only font.
- **Storage:** the words are part of the project like a sticky note's, so `privacy.html`, `privacy.md` (effective Nov 4, 2026) and the
  guide say "notes or write blocks".

## Full screen

The toolbar's `#fullscreen` button (two arrows pointing apart, `ui/fullscreen.js`) makes the whole page full screen and back. It uses the
browser's Fullscreen API under either name (`requestFullscreen`, or `webkitRequestFullscreen` on an iPad's Safari) and **hides itself where the
browser has neither** (an iPhone cannot do it for a page like this), so it never does nothing. It follows the browser's own
`fullscreenchange` event, so Esc, or the browser's own way out, puts the icon right (`exit-fullscreen-button.svg` while on). Nothing is stored.
`test/fullscreen.test.js` runs it against pretend documents (both names, refusal, Esc); `dev/view-checks.mjs` presses it in real Chrome.
**Not tried on a real iPad.** Safari restricts typing while a page is full screen in some versions, and number boxes need the keyboard, so the
dependable iPad route is also offered: `index.html` carries `apple-mobile-web-app-capable` tags and an `apple-touch-icon`
(`images/apple-touch-icon.png`, the turtle on blue, 180 pixels), so Share, then Add to Home Screen, opens TurtleLab with no browser bars.
The Guide says both. If a teacher reports the number boxes will not type in full screen on an iPad, that is the reason: tell them to use Add
to Home Screen instead.

## The turtle's look, the squirm, and the occasional fish

Small delights the user asked for (2026-11-04, from a list of ideas after saying "i like the shark for the garbage"). All of it is for looking at: none of it
touches a project, stores anything or fetches anything, and the art is TurtleLab's own (apart from Sugar's turtle, which is left as it is).

- **The shell is the pen's color** (`js/ui/turtle-look.js`). `spriteSvg()` is the turtle from `artwork.js` with two parts named, `shell` (the big oval) and `scutes`
  (the five markings), found by their path text (a test fails if the picture ever changes under it). `CanvasView.sync()` sets `--shell` and `--scute` on the sprite
  from `turtle.color` (cached, so it only touches the style when the color changes) and the stylesheet uses them. The markings are a shade of the pen: darker on a light
  pen, lighter on a dark one (`shellColors`), so they always show. **With the pen up the turtle hovers**: class `pen-up` makes the svg `scale: 1.14` with a drop shadow
  and a paler shell (opacity 0.4), as if the pen were lifted off the paper (the pen is under the turtle, where the turtle's middle is; a pencil by the nose would have
  looked like the pen was there). **The PDF's turtle is deliberately NOT tinted** (`paperWithTurtle` still stamps the plain `turtleSvg()`): the checks that find the turtle
  in the PDF by its green and its heading, and the teacher grades from it, so it must look the same whatever the pen was.
- **Squirm:** `.turtle-sprite.dragging svg` runs `turtle-squirm` (a wiggle of the separate `rotate` and `translate` properties, 0.3 s, alternating) for as long as the
  turtle is held, moved or turned. It uses the individual transform properties on the inner svg, so it never fights the sprite's own inline `transform` (its place and heading).
  The hover uses `scale` the same way.
- **The fish** (`js/ui/fish.js`, the `Fish` class; **now a treat for working, not on a timer: see "Treats for work" below**; with `auto` true, its default, it still comes 20 to 60 s after the page opens and then every 60 to 150 s, and the tests cover that): a little orange fish swims ALL the way across the window just above the
  trash can (at `FISH_SPEED` 110 px a second, so about 14 s on a laptop and never under 7 s or over 20 s; bobbing, either direction, in from off one edge and out past the other), the
  shark's head comes up over the lid when it is near (`Trash.setPeek`, class `peek`) and its pupils follow the fish (`Trash.look`, `--look-x` and `--look-y`). It swims in the
  window-sized layer above everything (`sky.js`, viewport coordinates), so the Fish no longer takes a `before` option. It is skipped, and tried again in 10 s, when the tab is
  hidden, the blocks are hidden, or the shark is hungry, eating, spitting, dreaming or a boat is here; it leaves by itself if the blocks are hidden mid-swim (that layer is outside
  the stage); it never appears when the computer asks for reduced motion (`prefers-reduced-motion`), not even with the address `?fish=now`, which is only the developer shortcut that
  sends one 0.4 s after load (the same kind as `?speed=`). **Click the fish (2026-11-04) and the shark eats it:** the layer ignores clicks but the fish itself does not
  (`pointer-events: auto`, `cursor: pointer`, with an invisible 0.9 rem border so a moving fish is easy to catch), and `pointerdown` runs `getEaten`: the fish stops and the shark swims out to it
  (see "Eating a visitor" below).
  Nothing is stored. The timing, path and gaze are small pure functions (`between`, `canSwim`, `swimPath`, `fishAt`, `gaze`, `isNear`), unit tested; the class is tested against stand-ins
  for the page, and the editor checks run a real one, including a click.
- **Yawn, wave, spit and burp (2026-11-04, the user's next pick from that list: "Add the yawn and wave and undo and bubble"):**
  - **Yawn:** a `wait` of 700 ms or more (`YAWN_AFTER_MS` in `main.js`) makes the sprite sway slowly and a "Zzz" float up (`CanvasView.setYawning`, class `yawning`,
    the `.turtle-zzz` piece, positioned by `sync()` and not turned with the turtle). The scheduler tells the app about a wait through the new `onWait(ms, block)` option
    (called after `onStep`); the next step (`onStep`), the end of the run or Stop turns it off. A shorter wait is only a pause.
  - **Wave:** when a run ends with status `done` (not stopped, not an error) the front right flipper (`wave-flipper`, named in `turtle-look.js`) swings out and back twice
    (`CanvasView.wave`, class `waving`, 1250 ms, `onStart` cancels it). Starting a run, or Stop, ends any wave.
  - **Spit:** an **Undo** that brings a deleted stack back (`restoredStack` in `core/project.js`: the blocks on the page grew and exactly one stack is new, at a place where
    there was no stack, so putting a few blocks back on the end of a stack, a move, or a redo do NOT count) has the shark come up (`Trash.spit`, class `spitting`, which
    looks like hungry) and a copy of the stack fly from its mouth to the stack's place (`Workspace.spitOut`: the same ghost trick as eating, backward; the real stack is
    `opacity: 0` until the copy lands, NOT `visibility: hidden`: a hidden stack ignores clicks, and an old editor check that names a restored block right after an Undo
    failed because of it)). `mouthPoint({ raised: true })` gives where the mouth will be once the shark is up (it is still sunk when this starts).
    Only Undo (button and Ctrl+Z) does this: `restore(snapshot, { spit: true })`. Redo and Open do not.
  - **Burp:** after a meal, `Trash.burp` has a 30 percent chance (`BURP_CHANCE`, `shouldBurp`) of floating three bubbles, one with "burp" in it, up out of the can, starting
    while the shark is still chewing. The address `?burp=always` makes it 100 percent, for trying it out.
  - **All of these are skipped when the computer asks for reduced motion** (CSS for the yawn and wave, the code for the spit and burp), and none of it touches a project or
    stores anything. The main.js hand-built `eater` object that the workspace gets must pass `spit` and the `raised` option on (it did not at first, which a probe caught).
- **Idle antics (2026-11-04, the user: "if the student is doing nothing after a minute, randomly make the turtle dance or scratch his head or maybe just yawn or release a
  bubble like it is breathing under water, or even poop (a poop emoji falling?). Or maybe the shark starts dreaming about turtle stew?"):** `js/ui/idle.js` (WHEN and WHICH,
  pure and unit tested with fake timers) and `js/ui/antics.js` (WHAT, with `ANTIC_MS` the lengths). After `IDLE_MS` (30 s since 2026-11-05: the user asked for the timer "a bit more frequent"; it was 45 s) with no `pointerdown`, `pointermove`, `keydown`,
  `wheel` or `touchstart` (main.js listens on the document, capture, and a run starting or ending also counts), one antic plays, chosen by weight; while it stays quiet another
  comes 20 to 50 s after each ends (`GAP_MS`; it was 30 to 80). ANY activity ends the current one at once (`Idle.poke`) and restarts the quiet time. It looks again 10 s later instead if a program is running
  (`busy`), the tab is hidden, or nothing is possible, and **never happens when the computer asks for reduced motion** (the timer is not even started). The six idle ones (dance moved to the treats, see below; the sixth, `spew`, is below too), with weights:
  scratch 3 (the front left flipper, named `scratch-flipper` in `turtle-look.js`, rubs the head), yawn 3 (the same yawn as a long
  wait), breathe 3 (bubbles wobble up from the nose, wherever the turtle faces), dream 2 and poop 1. **Dream:** the shark comes up over the lid with its eyes shut (`eyes-shut` in
  the can's picture; `Trash.setDreaming`, class `dreaming`) and a thought bubble with a pot of turtle stew (the turtle is our own turtle picture made small) floats above it; it
  is only possible when the shark is resting and no fish is swimming past (`Trash.canDream`). **Poop:** a small cartoon pile drawn in SVG (not an emoji, so it looks the same
  everywhere) drops from the tail, falls down the screen, bounces once and fades (`CanvasView.dropPoop`); it was the user's own suggestion and is the rarest, and it is one line in
  `makeAntics` (`show('poop', ...)`) to remove if it is ever not wanted. Developer shortcuts: `?antic=scratch` (or yawn, breathe, poop, dream, and now also the treats dance, fish and boat) plays one 0.5 s after load,
  `?idle=5` makes the quiet time 5 seconds (and the pauses between antics shrink in step, to 0.75 to 2 times that), `?poop=two` always drops two.
  **Floating and falling go all the way off the window (the user: "make the bubbles go all the way off the top of the browser window, sleep the same, and poop all the way to the
  bottom, maybe sometimes a 2nd poop too").** The turtle's Zzz and bubbles, the shark's z's and the poop live in one fixed, window-sized, click-proof layer above everything
  (`js/ui/sky.js`, `.sky`, z-index 60, overflow hidden), not inside the paper, which would clip them. Distances come from where they start (`riseDistance`, `fallDistance`) and are
  handed to the stylesheet as CSS variables (`--rise`, `--rise-time`, `--times` for the floaters, `--fall` and `--fall-time` for the poop), so a turtle low on the page takes longer
  to be rid of its bubbles; the speeds are `FLOAT_SPEED` (100 px a second for bubbles, 85 for z's) and a fall speeds up like a dropped thing (`fallTime`). Because the rise is long,
  an antic lasts as long as it needs (`makeAntics` takes the seconds `setBreathing`, `setYawning({ once: true })`, `dropPoop` and `Trash.setDreaming` give back), and any activity still
  ends it at once. The turtle drops a second poop `SECOND_POOP_CHANCE` (0.4) of the time, 0.7 to 1.3 s after the first. The shark's dream bubble now has the words "turtle soup" under the
  pot (a thought bubble, not a speech bubble, because it is a dream). **A mistake to avoid:** when `setDreaming` was rewritten, a replacement between two comment markers silently deleted
  `Trash.setPeek`, `look` and `mouthPoint` (the fish and the undo spit use them); `test/trash.test.js` now lists every method the shark must have.
- **Eating a visitor (2026-11-04, the user: "If user clicks on boat, can the shark come out and eat the boat? Same thing for the fish?"; then "can shark swim out to eat it rather than it moving
  to shark?"; same first message: "maybe the fish should go all the way across the screen too. And maybe we need to have things happen a tad more often"):** the visitor STOPS where it was
  clicked and the shark swims out to it. `js/ui/visitors.js` `eatVisitor({ el, trash, setTimer, onDone })` finds the middle of the visitor, stops the peeking and eye following, and calls
  `Trash.hunt(target, { onBite, onDone })`; `onBite` gives the visitor the class `eaten` (the stylesheet spins and shrinks the svg inside, `visitor-eaten`, `OVER_MS` 480, and turns clicks off)
  and takes it off the page after that; `onDone` is the fish's or boat's `finish(true)`, which waits for the next one. **`Trash.hunt`** (`HUNT` constants): class `hunting` (lid off, shark up, jaw
  open, the same pose as `hungry`) for `RISE_MS` 240, then `swimming-out` hides the real shark and a COPY of its head, `.shark-swimmer` (`SWIMMER`, built from the same `SHARK` markup the can
  uses, so it is the same picture, unclipped, in a box the can's size), is appended to the window-sized layer (`sky.js`) exactly where the shark was and swims, with a CSS transition
  and a side to side wag, to put its MOUTH on the target (`swimmerCorner`; `swimTime` = distance at 800 px/s, 450 to 1300 ms). It arrives, `chomp`s for `CHOMP_MS` 800 (`onBite` at 170 ms),
  swims back, the copy is removed and the real shark is there with a certain burp (`burp(1)`), and `BURP_HOLD_MS` 380 later `endHunt()` removes `hunting` (it sinks) and calls `onDone`.
  **Anything else that needs the shark ends the trip at once** (`setHungry(true)`, `feed`, `spit`, `snap` call `endHunt()`, which still calls `onDone` exactly once), so a block dropped on the
  can is never eaten by an empty can. `hunting` is in `NOT_RESTING`, in `mouthPoint`'s "already up" list, and in the fish's and the boat's busy lists. The boat's harpoon and rope are removed
  at once on the click and its visit never reaches the clang or snap. `Trash.feed` is a plain `feed()` again (the visitors no longer feed it; `burp(chance)` keeps its chance argument).
  If the can is not showing `hunt` returns false and the visitor just goes. Tested in `test/hunt.test.js` (the whole trip on a fake page and clock, and the interruptions),
  `test/visitors.test.js`, `fish.test.js`, `boat.test.js`, `trash.test.js` (`swimTime`, `swimmerCorner`), and with real clicks in `dev/editor-checks.mjs` (the shark reaches the visitor, which
  stood still; burp; everything gone afterwards). Timing, "a tad more often" (the fish and boat timers are now only the `auto` ones, see "Treats for work"): antics after 45 s then every 30 to 80 s, breathing after 30 s (now 5 s).
- **Poop falls slower, and a fishing boat (2026-11-04, the user: "poop falls too fast. can you add a fishing boat like the fish and the boat tries to harpoon the shark (or garbage can)?"):**
  **Poop:** `fallTime` in `js/ui/sky.js` now uses a gravity of 120 (it was 1100, under a second): about 2.5 s from the middle of a 613 px window, 3.2 s from a 1100 px one, at least 1.2 s.
  **Boat** (`js/ui/boat.js`, the `Boat` class, a cousin of the fish; a treat for working like the fish, `auto: false` in main.js, but with `auto` true it comes the first 1 to 2 minutes after the page opens and then every 2 to 5 minutes, rarer than the fish) a little red fishing boat
  with a fisherman in a yellow coat sails in from off the RIGHT edge along "the water" just above the can (the fish swim under that line), slows to a stop about 215 px to the right of the
  can, and the scene runs on a fixed timeline (`PHASES`, 12.3 s): arrive 4.5 s, watch 0.9 (the shark peeks and its eyes follow the boat), throw 0.5 (the harpoon arcs to the can's lid, a
  rope behind it), stuck 0.8 (it hits: `Trash.clang()` shakes the can and a "clang!" pops up), reel 0.9 (hauled back by the rope), snap 1.2 (the lid flips and the shark pops up and snaps,
  `Trash.snap()`, which is the eating pose without a burp, while the boat spins round), leave 3.5 (it sails off the way it came, faster). The boat's place and the harpoon's are pure
  functions of the time since it began (`boatAt`, `spearAt`, `phaseAt`), unit tested; the class draws them every frame in the window-sized layer (`sky.js`) and tells the shark what to do at
  each phase change. Same manners as the fish: never when the computer asks for reduced motion (not even with `?boat=now`, the developer shortcut), not while the tab or the blocks are hidden,
  and the fish and the boat never share the shark (`others` on both; the idle dream also waits for both). The harpoon always hits the can (it is a cartoon: the user said "tries to harpoon
  the shark (or garbage can)", and the clang is the joke), and the shark never gets hurt.
- **The turtle's color breathes (2026-11-04, the user: "after about 30 seconds, can you make the color of the turtle fade and unfade just a bit about 60 times per second like it is
  breathing?"):** 60 times a SECOND would be a flicker (no change you could see), so it was read as "smooth, at 60 frames a second", with a breath of about 4 seconds (`--breath` in
  `css/app.css`; say so if 60 a minute, a breath a second, was what they meant). After `BREATH_AFTER_MS` (5 s since 2026-11-05, when the user said it is not distracting and asked for "only 5 seconds after nothing is happening"; it was 30 s; with `?idle=N` it is N/2 seconds) with no activity,
  `.turtle-sprite.breathing-color` runs on the turtle's SHELL only (`.shell` and `.scutes path`), until anyone does anything. It is an *ambient* thing in `Idle`
  (`ambient: [{ name, afterMs, start, stop }]`), not an antic: it starts at its own earlier time, carries on while an antic plays, waits for the same good moments (not while a program
  runs or the tab is hidden), and any activity ends it. Never under reduced motion. `?antic=breath` starts it at once. `CanvasView.setColorBreathing`.
  **It went through three versions, each a correction from the user.** (1) Too faint ("too faint to see"): a small `saturate`/`brightness` filter. (2) Too much, and it MOVED: it faded the
  whole sprite with `opacity`/`filter`, then with a `scale`, and "why is the turtle moving too -- didn't want that" and "fade is just the top colored part of turtle, not the entire turtle"
  (a `scale` on the sprite scales its inline translate too, so the turtle drifted about 40 px; never put opacity, filter or a transform on the sprite for this). Faded only the shell's
  `fill-opacity` to 0.08. (3) "over the top -- it fades all the way to transparent -- I was just thinking of making the color less and more deep, not transparent -- kind of breathing or
  heartbeat." **Now it is a change of COLOR, never of see-through:** `shellColors` (`turtle-look.js`) also gives `shellBreath` and `scuteBreath`, a lighter shade (40% of the way to white; a
  pen that is already very light breathes to a deeper shade instead, 30% toward black, so white still changes), `CanvasView.sync` sets them as `--shell-breath` and `--scute-breath`
  next to `--shell` and `--scute`, and the keyframes only name the `50%` moment (`fill: var(--shell-breath)`), so each breath goes from the pen's true color to the lighter one and
  back. `fill-opacity` is never touched (the pen-up pale shell still works). `dev/editor-checks.mjs` checks all of it (the shell changes color by a visible but modest amount, stays at
  fill-opacity 1, the markings change shade, every other part never changes, the sprite's opacity, filter, transform and place never change, and the true color returns when stopped).
- **Whimsy on every change of grid or paper, and the shark being sick (2026-11-05, the user: "for whimsy, i do think i need a way to force more random actions. What if everytime I click to change the grid style, we do some random thing... Should we add a random action where the shark throws up everything it has eaten or been given all over the spaces near it and then these fade via opacity to invisible? We could use this random action other times too. And maybe our timer needs to be a bit more frequent").**
  **The surprise:** `Reward.surprise(name?)` (`js/ui/reward.js`, tested in `test/reward.test.js`) plays one thing on a whim: chosen by weight from `surprises` (`makeSurprises` in `antics.js`: every antic, which is dance, scratch, yawn,
  breathe, poop, dream and spew, plus a fish (3) and the boat (2)), only those that `can()` right now, not the one that was last if anything else will do, and one that says no (`play()` returns false, like a fish while a boat is about) is skipped for
  the next. **It plays like a treat, not like an idle antic:** moving the mouse does not end it (an idle antic ends on any `pointermove`, which would cut every one short at once, since the click that asked for it is activity). It ignores `busy` (a program
  running does not stop it: the user is asking for whimsy), but not calm (reduced motion: nothing happens) or a hidden tab. It does not earn or use up points and does not start the rest before the next work treat (`lastAt` and `events` are
  untouched; it has its own `lastSurprise`). A new one ends the one before first. `main.js` calls it from `surprise()` after the grid button's plain click AND after every pick in its right-click menu. `?surprise=spew` (or dance, fish ...) forces which one, for
  trying them out and for the browser checks. **The idle antics are a bit more frequent:** `IDLE_MS` 30 s (was 45), `GAP_MS` 20 to 50 s (was 30 to 80); `spew` is also one of the idle antics (weight 3, only when the shark has something to bring up).
  **Spew** (`Trash.spew()`, `js/ui/spew.js`, `test/spew.test.js` and the end of `test/hunt.test.js`): the shark **remembers what it ate** (`Trash.meals`, a `Meals` list of the latest 30, in memory only, gone when the page closes): a stack thrown in the can
  (`Workspace.swallow` hands `feed()` a clone of the ghost, `{ node, width, height }`, through the `eater` wrappers in `main.js` AND `palette.js`: the second one dropped the argument at first, which only the browser check caught) and a fish or the boat it was sent after
  (`eatVisitor` hands `hunt()` a clone of the visitor's svg, kept at the bite). An Undo that brings a stack back takes the latest meal out again (`spit` calls `giveBack`). `canSpew()` is: something eaten, the can showing, the shark resting (`canDream()`), no calm. `spew()`:
  the shark comes up in the `spitting` pose plus `heaving` (the can shakes, `can-queasy`, and the shark goes one sickly green with `sepia(1) hue-rotate(28deg) saturate(2.6)`: a plain hue turn made the red inside of its mouth blue), says "blech!" (`.spew-word`), and
  after `HEAVE_MS` brings up the latest 14 things (`PIECES_MAX`) one every 140 ms, each in the window-sized layer above everything (`sky.js`): `spewPlan` (pure) says where each lands (mostly out to the right of the can and below the mouth, some to the left, clamped inside the
  window), how high it flies, how far it spins, its timing; `arcPath` is its flight as points along a parabola (the web animations API, `piece.animate`, linear between 11 points; a browser without it just puts the thing down); it lies there 1.1 to 1.9 s then **fades by opacity
  over 1.8 s** and is removed (a timer takes it off whether or not the animation ran). A stack is a small svg of its own blocks (cloned, `style` and `transform` taken off, the longer side 46 px), a fish or boat is its own svg, and a thing with no picture (a stack eaten by someone
  who asked for less motion, or the `?antic=spew` seeding) is a plain colored chip. The shark is done a moment after the last thing is out; things already in the air carry on whatever stops (an idle antic's `stop` does nothing: the show is only a few seconds), and feeding it or sending
  it after a fish while it heaves ends the heaving at once (`unheave`). `?antic=spew` gives a shark that has eaten nothing three chips and plays it. Never on a computer that asked for calm (and the `.spew-*` pieces are `display: none` in the stylesheet's reduced motion block).
  Checks: `dev/can-checks.mjs` ("Being sick" and "Whimsy on every change": the heave, green, the two stacks landing near the can as small pictures, the fade seen as opacity between 0 and 1, the belly empty afterwards, a fish coming back as a fish, six presses each making something happen, the
  dance by press and by menu, not stopped by moving the mouse, nothing under reduced motion).
- **Treats for work (2026-11-05, the user: "i want to reward the students for doing work, so maybe some of these things should happen if they're writing code rather than when they're doing
  nothing"):** `js/ui/reward.js` (WHEN and WHICH, pure and unit tested with fake time, a sibling of `idle.js`) and the lists in `antics.js`. **Which is which:** idle antics (only when nobody is
  doing anything, ended by any activity): scratch, yawn, bubbles, poop, dream (`IDLE_ANTICS`), plus the breathing. Treats (play while they work, NOT ended by activity): the dance, bubbles,
  a fish swimming across, a fishing boat (`TREAT_ANTICS` + `makeRewards`); the fish and the boat no longer come on timers (`new Fish({ auto: false })`, `new Boat({ auto: false })`; the
  `auto` option keeps the old timer behavior, default true, tested). Move a name between the lists to change it; the bubbles are in both on purpose. **Points:** `EDIT_POINTS` 1 for a
  real change to the blocks, `RUN_POINTS` 3 for a program that ran to the end after the blocks changed since the last such run (so pressing Run again and again, or running an unchanged
  sample, earns nothing). A change is "real" by `workMark`/`earnedWork`: the blocks' own description (stack positions left out) is different AND the block count did not go down, so
  adding a block, changing a number and rearranging count, while moving a stack, deleting and Undo do not (`main.js` compares in `onChange`, against `lastMark`, which `projectChanged()`
  refreshes for every path that replaces the blocks). When the points of the last `WINDOW_MS` (4 min) reach `GOAL` (8: about a square's worth of building then running it) one treat plays
  (chosen by weight, never the same as the last one if another is possible; one that says no, like a fish while a boat is here, is skipped), the points start over, and there is a
  `COOLDOWN_MS` (75 s) rest. A treat for a run waits `AFTER_RUN_MS` (1.7 s) so it does not pile onto the wave. Nothing happens when busy (a program running), the tab is hidden, or under
  reduced motion (not even counted). All in memory: nothing is stored. Developer shortcuts: `?goal=3` (goal 3 points, 5 s rest), `?antic=dance` (or fish, boat, bubbles via breathe) plays a
  treat at once; `?fish=now` and `?boat=now` still work. Tests: `test/reward.test.js`, `antics.test.js`, `fish.test.js`/`boat.test.js` (`auto: false`), and real block drops, a tap-run, a sample
  run and calm in `dev/editor-checks.mjs`. The numbers (8, 3, 4 min, 75 s) are guesses to tune after watching students; they are the constants at the top of `reward.js`.
  Other ideas from that list that were NOT built (so they can be picked up later): a stamp block (paw, heart, star, fish, shark as line art), a celebration when a shape
  closes, seasonal shark outfits by date, a cougar-paw turtle skin, a ghost trail of pen-up walks, a confused turtle on an error.

## The picture shown when the address is pasted

`index.html` has Open Graph and Twitter card tags (title, description, `og:image` = `https://learn.porttack.com/turtlelab/images/social.png`,
1200 by 630, with its width, height and alt text). Mail programs (Apple Mail), chat and social sites read these when someone pastes
`https://learn.porttack.com/turtlelab/`; they need FULL web addresses, so the page names its own domain (the tags are only words, the page
fetches nothing from them). `images/social.png` is made by `dev/make-banner.mjs` (which also makes the home card's `banner.png`) and is recorded
in `NOTICE.md` like the banner. It only works once the site is pushed. Gmail shows no preview of a pasted link at all, whatever the tags say; other
programs may keep a stale preview for a while. Other pages (guide, samples, about) have no tags.

## Key design decisions

- **Own block engine, not Blockly.** Matching Sugar's look is a goal and the
  code doubles as teaching material. The block-shape generator is ported from
  Turtle Blocks' `blockfactory.js`.
- **Editing rebuilds the stacks it touches** (`Workspace.render`) rather than
  patching the SVG. Projects are tiny and it cannot drift out of sync. Layout
  (`block-view.js`) is separate from rendering and from the editing rules
  (`core/edit.js`), which are unit tested.
- **Sockets hold plain numbers or a plugged-in reporter.** Numbers are drawn
  as Sugar-style number boxes (Math color). Tapping one opens a text box.
  Pulling a reporter out puts the block's default number back.
- **Docks decide everything.** A shape's docks come in a fixed order (see the
  top of `block-view.js`); snapping compares dock positions in workspace
  coordinates, within 28 screen pixels.
- **Touch and mouse share one code path** (Pointer Events). The workspace
  captures the pointer on itself so a drag survives the re-render at drag
  start. The workspace SVG ignores pointer events except on blocks, so the
  turtle underneath stays draggable. The palette flyout uses
  `touch-action: pan-y`: vertical swipes scroll it, sideways drags pull a block
  out. The grab offset is measured from the press point, not from where the
  pointer is when the drag starts (a fast drag has already moved).
- **Tapping** a stack runs it. **Tapping a palette block never changes anything** (2026-11-10, the user: kids tapped palette blocks to move the turtle without building a program; asked for a grey line that fades and the turtle going back): `tapPaletteBlock` in `main.js` runs a movement block (`forward`, `back`, `left`, `right`, `arc`, `setxy`, `setheading`) on a scratch turtle and `CanvasView.peek` draws its lines in grey on `canvas.paper-peek`, glides the sprite to the end and back (`peekPose`), and fades; the real turtle, picture and boxes are untouched, and `applyOp` cancels a preview. Any other block says what it does and to drag it out; reporters still show their value (`dev/peek-checks.mjs`).
  (A lone reporter shows its value in the message bar.) **Dropping anywhere in
  the left column deletes** (`PaletteUI.isOver`: everything left of the palette
  or its open flyout, top to bottom, including past the window's edge). It used
  to be only the strip of buttons, so a drop just below or beside them silently
  kept the block, which a teacher reported as "delete does not work". The whole
  column tints red (`.trash-band`) while a block is held over it, and a **trash
  can with a shark** (`js/ui/trash.js`, original art, one inline SVG driven by
  `hungry` / `eating` / `chomp` classes) sits at the bottom of it: the lid flips
  off and the shark pops up with its jaw open, and on release a copy of the stack
  (the "ghost", stripped of every class and id the app looks things up by)
  shrinks into its mouth while the shark chomps and sinks. None of that tint or
  shark shows for a block fresh from the flyout until it has left the zone, and
  `prefers-reduced-motion` skips the flying copy. The can is under the blocks'
  layer, so a stack being carried is drawn on top of it.
- **A stack lying on the can is in the trash, wherever it was picked up**
  (`PaletteUI.coversCan`: the can's middle is under the stack's rectangle). Only
  testing the pointer failed for wide stacks: grab a `to` block by its last box
  and drop it so the block sits on the can, and the pointer is 150px from the
  zone, so nothing happened and the shark never opened. Hover and drop use the
  same test so what you see is what happens.
- **A drag must always end.** The workspace also handles a mouse-up it never
  hears (released off the window's edge): the next `pointermove` with no button
  down lets go at the block's last known spot (`drag.over`). A `pointercancel`
  or `lostpointercapture` does the same (the capture-lost one is deferred a tick,
  so a mouse-up right behind it, which says where it really was let go, wins). A
  window blur puts the drag down without deleting. Tests cannot use a
  scripted move for that (the browser still thinks the button is held); they
  dispatch a `PointerEvent` with `buttons: 0` (`strayMove` in editor-checks).
- **Undo and redo** keep whole-project JSON snapshots (`core/history.js`,
  100 steps). `Workspace.onChange` fires after every committed edit and
  `main.js` records it; a change that leaves the project identical (a block
  made and deleted in one drag) records nothing. Ctrl/Cmd+Z undoes,
  Ctrl+Y or Ctrl/Cmd+Shift+Z redoes (not while typing in the number box).
  Pan and zoom are view settings, not edits, so they are not undoable.
- **Pan and zoom** (`core/view.js`): drag empty space (paper or the gray
  around it) to slide the blocks; two fingers pinch; the wheel slides;
  Ctrl+wheel (also a trackpad pinch) zooms about the pointer; buttons zoom
  and go home. The turtle and the palettes are not empty space. Zoom is
  0.4 to 2.5. The flyout is not zoomed, so a block dragged out of it takes
  the workspace's size.
- **Copying a stack:** Shift-drag carries a copy of the whole stack, which
  starts exactly on top of the original. Touch has no Shift, so press and
  hold (500 ms, hardly moving) opens a bubble with the block's tip and a
  Copy stack button. Right-click opens the same bubble. Holding a palette
  block shows its tip without a Copy button. Holding a number box does
  nothing (a tap there is for typing).
- **Boxes are the variables.** Four of them, as eight fixed blocks in their own
  **Boxes** palette (`store in box1` to `box4` with a number socket, and
  reporters `box1` to `box4`), with no dropdowns. They are generated from
  `BOX_COUNT` in `core/blocks-spec.js` and the interpreter, so a fifth box is a
  one-number change (the palette, readout and tests all follow; an older project
  with fewer boxes still opens). **My Blocks** is a separate palette (lilac)
  for the blocks a student makes. Both palettes' colors and icons live in
  `palette-colors.js` and `images/palette-<id>.svg`. Calling variables "boxes" is the
  teacher's choice. Their look is original (Sugar-style, yellow); nothing was
  taken from anyone's palette screenshot. **Each run starts with all boxes at
  0** (like a Python program), so a run never depends on an earlier one; the
  context for a run is made fresh in `main.js`. A readout chip at the bottom
  right shows the values (live at slow speeds), but only when the project
  has a box block. Tapping a lone `box1` shows the value the last run left
  behind and never changes it. Boxes hold numbers only for now.
- **Socket types.** A socket is `number` (round) or `boolean` (pointed, only
  `if` has one); a reporter `returns` `number` or `boolean` (`<`, `>`, `=`).
  A reporter only snaps into a socket of its own type (`canPlug` in
  `core/edit.js`); the interpreter also checks, because a file could say
  otherwise. An empty pointed socket draws nothing (the notch is the empty
  socket) and running it is an error that outlines the `if`. Pulling a block
  out of a number socket restores the number; out of a pointed one leaves it
  empty.
- **Pen color is RGB, so there is no shade.** `set color` takes red, green and
  blue (0 to 255) and `fill screen` the same. The reporters `pen red`, `pen
  green`, `pen blue` read the pen color back (the RGB version of another
  app's color and shade readers). A gray is equal red, green and blue.
  The Pen palette puts all four readers at the bottom, like the Turtle
  palette.
- **Flow.** `start` (hat), `repeat`, `forever`, `if`, `ifelse`, `wait`, `speed`, `stop`. `stop`
  ends the whole program (inside a block you made it leaves just that block):
  it has a tail, so nothing snaps below it, and it cannot go on top of a stack.
  `forever` and every loop yield each lap, so none can freeze the tab.
  `wait` takes tenths of a second and is **real time even at Instant speed**;
  Stop cuts it short. (`Wait` is yielded to the scheduler, which sleeps.)
  `speed` (1 slow, 2 medium, 3 fast, 4 instant; off the ends is pulled back,
  like a color) is the ONLY speed control: the toolbar has no menu, on the
  teacher's say-so ("less cluttered, making people discover it is fine"). The
  interpreter calls `ctx.setSpeed(name)` and `main.js` hands it to the
  scheduler, which reads its speed fresh before every step. Each Run resets to
  `DEFAULT_SPEED` (fast), so one program's speed never leaks into the next.
  `?speed=slow` in the address is still a dev and teacher shortcut for where a
  run starts. The Guide's "Watch it draw slowly" row is where students find it.
  `ifelse` is the one block with **two mouths** (spec `mouths: 2`, with
  `mouthLabels: ['', 'else']`). A block's mouths are kept in the project as
  `body` and `elseBody` (`BODY_KEYS` in blocks-spec.js; `walkBlocks`,
  `cleanBlock`, `attachInside(..., mouth)` and the view all go through it, so
  a third mouth would be a one-line change). The generator draws a clamp's
  mouths itself; `port-blockfactory.mjs` patches in `setMouthExtras` so each
  mouth grows on its own when something is put in it. The word `else` is
  drawn in the block's own font size, not the small caption size.
  The Flow flyout scrolls up and down; on a short window `stop` is below the
  fold, and `dragFromPalette` in editor-checks scrolls a block into view
  first.
- **Math blocks read left to right.** `[ 3 ] + [ 4 ]`, `[ 3 ] < [ 4 ]`,
  `random [ 1 ] [ 10 ]`: the sockets sit side by side inside the block (spec
  field `layout`: `infix` puts the label between them, `prefix` before). A
  number is a white slot you tap to type in; a block plugs in over the slot
  and the parent grows (and gets taller if the child is). Nesting one block
  inside another is how you say what is worked out first, so there are no
  parenthesis blocks. Number blocks are rectangles with Sugar's plug on the
  left; yes-or-no blocks are pills (so they can't be mistaken for numbers
  and they fit the rounded socket of `if`). **This layout is TurtleLab's
  own drawing code** (`layoutRow` in `block-view.js`); only the plug and
  rectangle outline come from Sugar's `basicBox`. The teacher liked how
  another app lays out math and comparisons horizontally; nothing of that
  app's artwork was used. All other blocks keep Sugar's right-edge sockets.
- **Math.** `+ - x ÷ %`, `( )`, `random`, `one of`, `< > =`, `and`, `or`, `not` (see "and, or and not" below), `print`. The
  modulo block's op name is `mod` but it is labelled `%` (matches the Python
  course) and follows Python (never negative for a positive divisor). The
  `( )` block (`paren`, layout `wrap`) gives back what is inside it. It
  changes no answer, because which block is inside which already decides the
  order; it is there so expressions read like the Python students will write,
  and because the teacher asked for it. `random` of two whole
  numbers is a whole number and both ends can come up. `=` ignores tiny
  rounding errors. Divide or mod by zero is a friendly error naming the
  block. There is no separate `number` block: every socket already holds a
  number you tap to type, and pulling a block out puts one back.
  `print` shows numbers in a box at the top right, captioned "Output" (last 8
  lines, cleared each run, redrawn once a frame). Tapping a lone math block shows its answer.
- **Saving, opening and autosave** (milestone c).
  - **Save** (button or Ctrl+S) turns the paper canvas into a PNG, tucks the
    project JSON into an `iTXt` chunk just before `IEND` (keyword
    `porttack-turtle-project`, uncompressed, written by `core/png-chunks.js`
    with a hand-written CRC-32), and downloads it as `turtlelab-DATE-TIME.png`.
    The picture is an ordinary PNG; the turtle sprite is not in it (it is a
    separate layer; only the PDF's page has one stamped on, see "The PDF"). Only the project is stored: no name, date or device info.
  - **Open** (button) and **dropping a file anywhere on the page** read a saved
    PNG or a plain `.json` project, check it with `validateProject` (a bad or
    newer file gets a friendly message and changes nothing), replace the
    blocks, paint the saved picture onto the paper, and record an undo step.
    Handling the drop also stops the browser from navigating to the file.
  - **New** clears blocks and paper; Undo brings the blocks back.
  - **Autosave** (`ui/storage.js`) keeps one copy of the project in
    `localStorage` under `turtlelab-project`, debounced 400 ms and flushed on
    page hide; an empty project removes the item; a damaged or newer item is
    ignored; every use is in try/catch. A visit restores it unless `?demo=`
    is given. It is the only thing the app stores, and the privacy pages and
    checks say exactly that.
- **Sticky notes** (`note`, in a sixth palette, Notes). A note is a block of
  kind `note` with its words in `block.text` (cleaned by `project.js`: text
  only, no control characters, at most `NOTE_MAX_CHARS`, 300). It floats: it
  snaps to nothing and nothing snaps to it, a stack that is only a note is
  never what Run starts, running one does nothing, and tapping one opens a
  writing box (`Workspace.editNote`; clicking away keeps the words, Escape
  cancels, and each change is one undo step). Notes are saved with the project
  (autosave, and inside saved pictures), so the privacy pages say the stored
  text includes notes. The look (`layoutNote` in `block-view.js`) is original.
- **Palettes with no blocks are hidden** (none now: all six have blocks).
- **Coordinates:** paper 700 x 560, origin center, x right, y UP. Heading 0 is
  up and grows clockwise. Exact sin/cos at multiples of 90 so squares close.
- **Color is RGB 0-255**, rounded and clamped (not an error), so a loop that
  adds 10 to red just stays at full red. Grays are r = g = b.
- **Project JSON is the one data model:** editor, interpreter, undo, autosave
  and the PNG iTXt chunk all use it. Block = `{ op, args?, body? }`.
- **Interpreter errors are `RunError`** with a friendly message and the block
  object, so the editor can outline the block. Reporters are plain functions;
  commands are generators.
- **Turtle emits ops** (`line`, `arc`, `fill`, `fillScreen`, `clear`). The
  canvas paints them as they arrive; SVG export will read the same list.
  Only the most recent `MAX_OPS` are kept so `forever` can't eat memory.
- **Fill** follows the turtle's whole walk (pen-up moves count, like Python's
  turtle), uses the pen color from `start fill`, and the outline is repainted
  over the fill.
- **`arc(angle, radius)`:** positive angle curves right, negative curves left;
  a negative radius is treated as positive.
- **`clean`** resets everything: white paper, turtle home, pen down, red,
  size 5.
- **Run button** (`findRunStack` in `core/project.js`) starts at the topmost
  stack that begins with a `start` block (a "hat": cap on top, so nothing
  snaps above it, but it can be dropped on top of an existing stack). With
  several start blocks it runs the top one and says so. With none it falls
  back to the topmost stack of commands, so Run always does something with
  what is on the page. Tapping any stack runs that stack. One program at a
  time. `start` itself does nothing when it runs.
- **Dragging the turtle** (shell moves, head turns, rounded to whole units
  and degrees) is blocked while a program runs.

## Milestones

Plan: a scaffold + core, b1 block editor basics, b2 editor polish, c PNG
save/load, d Math and Flow, e My Blocks (and Boxes), f SVG export, privacy and
guide pages, real name, deploy.

Done: **a** (scaffold, core, canvas), **b1** (block editor: Turtle, Pen and
Flow palettes with `start` and `repeat`, drag, snap, unsnap, delete, plug reporters, type
numbers, tap to run, run highlight and error outline, Roboto vendored).
**b2** (undo and redo with buttons and keys, zoom and pan with buttons,
wheel, drag and pinch, Shift-drag and press-and-hold copying, help bubble).
**Boxes** (variables), done early at the teacher's request.
**d** (the rest of Flow: forever, if, if else, wait, stop; the Math palette; yes-or-no
shapes; print). **c** (Save as PNG with the blocks inside, Open, drag and drop,
New, autosave). The public pages (About, Privacy, Guide) are done (they go live when `learn` is pushed).
Also done: **if else** (a block with two mouths), **19 samples** with a Samples
page, and **blocks you make yourself** (e: functions, see below). Not yet: SVG
export for laser cutters and plotters (f).

Unknown: the teacher's second screenshot of another app's Flow palette showed
two blocks with dots and an arrow that are not in the brief. Ask what they
are before building anything like them.

Known limits to fix when they matter:
- Autosave keeps the blocks, not the picture: after a refresh the paper is
  blank until you press Run (or Open a saved picture).
- `?demo=name` (see `demos.js`) loads a program into the workspace for trying
  things out. It is a developer shortcut, not a feature for students.

## Licence exit option (deferred on purpose)

The teacher asked on 2026-11-03 whether the app could leave AGPL and chose to
**stay on AGPL for now and revisit later**. Everything except the Sugar Labs
material is original (Eric Brown) and could be licensed any way. The Sugar
material is: `js/ui/blockfactory.js` (about 820 code lines, AGPL), the turtle
sprite in `js/ui/artwork.js`, the five `images/palette-*.svg` and three
toolbar icons (AGPL), and the hex values in `js/ui/palette-colors.js`
(GPL-3.0-or-later; just colors). Roboto is Apache 2.0 and fine under any
licence. Only `block-view.js` touches the ported generator, so the seam is
clean.

To leave AGPL: write an independent shape generator (it must be genuinely
independent in structure and constants, not a retyping; whoever wrote this
code has seen the original), draw new turtle and icons, pick new colors,
drop the AGPL notices, relicense. The blocks would stop looking like
Sugar's. Milestone d (done) extended the generator (`setExpandYs`); the horizontal
math blocks are original code and no longer use any Sugar shape beyond
`basicBox`'s plug and outline. The seam is still just `block-view.js`. Any later milestone that adds a Sugar
block shape makes leaving slightly bigger, so keep the decision in mind. Keep
adding every borrowed file to `NOTICE.md`. Not legal advice; ask a lawyer if
it matters.

## Publishing

TurtleLab has been part of learn.porttack.com since 2026-11-03, at
`/turtlelab/` (lowercase: GitHub Pages paths are case-sensitive). The folder
is plain static files, copied by Jekyll as they are; its developer files
(`CLAUDE.md`, `README.md`, `NOTICE.md`, `package.json`, `test/`, `dev/`) are
excluded in `_config.yml`. **Pushing `learn` publishes it**: Claude never
pushes. The `learn` repo is public, so the source links on the About page
work once the folder is pushed.

Public pages: `about.html` (the Sugar Labs credit, the source link and the
licence, which the AGPL requires), `privacy.html` (written for IT staff) and
`guide.html`. The home page has a card (`_data/pathways.yml`), and
`license.md` and the site's `privacy.md` each have a TurtleLab section.

**The privacy pages make promises the code must keep:** no network requests
after load, no cookies, nothing loaded from another site, and the one thing
stored is the autosave item `turtlelab-project` in local storage (no session
storage, databases, caches or service workers). `test/pages.test.js` and the
"No backend" section of `dev/editor-checks.mjs` enforce them. **If the app
ever stores anything new, update `privacy.html`, `guide.html`, the TurtleLab
section of the site's `privacy.md` (its effective date too), and those
checks, before it ships.** Saving a PNG is a download made inside the page
(a `blob:` address), not a network request. **So is saving a PDF, and it
fetches nothing:** the picture of the blocks needs Roboto inside an SVG, so the
font ships inside `js/ui/roboto-data.js` (generated from the woff2 by
`dev/make-font-data.mjs`; a test keeps them in step) instead of being fetched.
The editor checks assert that making a PDF sends zero requests.

## Commands

    cd turtlelab && node --test                                # unit tests
    python3 -m http.server 4011 --directory turtlelab          # dev server
    node turtlelab/dev/browser-checks.mjs                      # real Chrome: turtle, Run/Stop
    node turtlelab/dev/editor-checks.mjs                       # real Chrome: block editor, touch, privacy
    node turtlelab/dev/sample-checks.mjs                       # real Chrome: every sample, saved work stays safe
    node turtlelab/dev/view-checks.mjs                         # real Chrome: Fit, the grid, the PDF button's fit
    node turtlelab/dev/logo-checks.mjs                         # real Chrome: the Logo box (short, about half a minute)
    node turtlelab/dev/can-checks.mjs                          # real Chrome: the score on the can and poking it (about a minute)
    node turtlelab/dev/ask-checks.mjs                          # real Chrome: the ask block and its question box (a minute)
    node turtlelab/dev/click-checks.mjs                        # real Chrome: the click handler, mouseX and mouseY (a minute)
    node turtlelab/dev/logic-checks.mjs                        # real Chrome: and, or and not in the palette, dragged together, run, and written as Python and Logo (under a minute)
    node turtlelab/dev/key-checks.mjs                          # real Chrome: when [key] pressed and every: the key list, key presses, timers, Stop, the snake in a frame (a minute and a half)
    node turtlelab/dev/embed-checks.mjs                        # real Chrome: ?embed=1 at 700 x 520 (add SITE_URL=http://127.0.0.1:4010/ to also load the lesson pages and their frames)
    node turtlelab/dev/jslogo-checks.mjs                       # real Chrome: the JSLogo copy and the trip to it (needs the whole site: python3 -m http.server 4012 in the top folder)
    EMBROIDERY_PYTHON=DIR/bin/python3 node turtlelab/dev/export-checks.mjs   # real Chrome: right-click Save, every file
    node turtlelab/dev/make-sample-thumbs.mjs                  # rewrite images/samples/*.png
    node turtlelab/dev/make-samples-page.mjs                   # rewrite samples.html from samples.js
    node turtlelab/dev/make-font-data.mjs                      # rewrite js/ui/roboto-data.js (the PDF's font)
    python3 turtlelab/dev/make-lettering-data.py               # rewrite js/core/lettering-data.js (needs pip install Hershey-Fonts)

To test the site exactly as GitHub Pages will serve it, build it and point
the checks at the `/turtlelab/` subpath:

    bundle exec jekyll build --destination /some/new/folder
    python3 -m http.server 4012 --directory /some/new/folder
    TURTLE_URL=http://127.0.0.1:4012/turtlelab/ node turtlelab/dev/editor-checks.mjs

The check driver (`dev/cdp.mjs`) leaves the page, then clears the site's
stored data before each `goto`, so autosave from one test cannot leak into the
next (pass `{ keepStorage: true }` to test a refresh). It also directs
downloads to a temporary folder (`downloadsTo`) and can pick a file for the
Open dialog (`setFileInput`).

Use port 4011 for this app's dev server. Never use 4000 (the author's own
Jekyll) or kill processes you did not start. The final check of the built
site uses Jekyll on 4010 as described in the repo's root `CLAUDE.md`.
The check scripts need Google Chrome at its macOS path and the dev server
running. They drive real mouse and touch input over DevTools Protocol and fail
on any console error or CSP violation. `editor-checks.mjs` also fails if any
label overflows its block or the page requests anything outside its own
address. Set `SHOTS_DIR` to keep their screenshots.
