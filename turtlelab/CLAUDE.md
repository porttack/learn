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
      pdf.js          writes the hand-in PDF with no library; see "The PDF"
      squeeze.js      closes wide empty gaps between stacks, for the PDF's picture of the blocks
      png-chunks.js   hand-written CRC-32 and PNG iTXt text chunks (no library)
      project-file.js put a project inside a PNG, and read a PNG or .json back
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
      code-image.js   the blocks as a picture for the PDF (SVG, then canvas)
      roboto-data.js  GENERATED: the Roboto font as text (dev/make-font-data.mjs)
      trash.js        the trash can and its shark (see Deleting, above)
      canvas-view.js  paper canvas (1400x1120) + draggable turtle overlay
      files.js        Save (download a PNG with the blocks inside), Open, drops
      storage.js      autosave to local storage (one item: turtlelab-project)
      main.js         wiring
    css/app.css  css/pages.css  fonts/roboto/  images/  images/samples/
    samples.html      the Samples page (GENERATED by dev/make-samples-page.mjs)
    test/             node --test
    dev/              real-Chrome checks over DevTools Protocol, port script

## Samples

`js/ui/samples.js` holds the student samples (16 now, easiest first), each
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
  file again and update `EDUBLOCKS_NAMES` in the runner.** Still untried by me:
  pasting into the real editor in a browser.
- **Names** are made safe for Python (spaces, digits, keywords, and the names the
  program itself uses, which get a trailing underscore), and two names that would
  collide get a number.
- Sticky notes become comments at the top; stacks not connected to Start are only
  counted in a comment; a program that does not begin with `clean` is given
  TurtleLab's start (facing up, red pen, size 5) because Python's differs.
- It is not a promise that students can paste it back: it is for reading.

## The PDF

The PDF button makes a one page US Letter PDF for handing in: **the blocks in the top
half and the drawing in the bottom half**, with the file name above and a line of
help below. `core/pdf.js` writes it by hand (numbered objects, a table of where
each starts), with no library, just as `png-chunks.js` writes PNG chunks. The two
pictures are raw RGB squashed with `CompressionStream('deflate')` (which is exactly
FlateDecode); text is the built-in Helvetica, so no font is embedded.

- **The picture inside is the real PNG, with the blocks in it, attached as a file**
  (`/EmbeddedFile`) and stored plain, not squashed. A PDF image cannot carry PNG
  metadata, so this is how "the picture in the PDF has the code in it" is true. And
  because the bytes are plain, `project-file.js` can find the PNG inside the PDF by
  its signature (`findAttachedPng`), so **Open and drag-and-drop accept the PDF**.
  Poppler (`pdfdetach`) can pull the same PNG out, and any PNG viewer can then open it.
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
- **Tapping** a stack runs it; tapping a palette block runs that one block
  (a lone reporter shows its value in the message bar). **Dropping anywhere in
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
- **Math.** `+ - x ÷ %`, `( )`, `random`, `one of`, `< > =`, `print`. The
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
    separate layer). Only the project is stored: no name, date or device info.
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
Also done: **if else** (a block with two mouths), **16 samples** with a Samples
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
    node turtlelab/dev/make-sample-thumbs.mjs                  # rewrite images/samples/*.png
    node turtlelab/dev/make-samples-page.mjs                   # rewrite samples.html from samples.js
    node turtlelab/dev/make-font-data.mjs                      # rewrite js/ui/roboto-data.js (the PDF's font)

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
