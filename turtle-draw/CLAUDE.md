# Turtle Draw (working name)

A block-based turtle graphics app for a grades 6-11 CS and robotics classroom,
hosted on GitHub Pages. Students drag Sugar-style blocks to draw with a turtle.
Nothing a student does ever leaves their browser. Chromebooks with Chrome,
mouse and touch.

It lives inside the `learn` repo at `turtle-draw/` but is its own **AGPL-3.0
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

"Turtle Draw" is a placeholder. The name lives in `js/app-info.js` and the
folder name. **Ask the teacher for the real name before the first deploy**
(see "Deploy gate"). The saved-file format names (`FORMAT_ID` in
`js/core/project.js`, the PNG chunk keyword) are deliberately independent of
the app name so old pictures keep opening after a rename.

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
      color.js        RGB 0-255
      project.js      project JSON: validate, find the Run stack
    js/ui/            the browser side
      blockfactory.js PORTED from Turtle Blocks JS (see NOTICE.md; rebuilt by
                      dev/port-blockfactory.mjs). Draws block shapes.
      block-view.js   layout (sizes, connection points) and SVG for stacks
      workspace.js    the editor: render, drag, snap, number editing, marks
      palette.js      palette buttons + the flyout of blocks to drag out
      palette-colors.js, artwork.js (PORTED), demos.js
      canvas-view.js  paper canvas (1400x1120) + draggable turtle overlay
      main.js         wiring
    css/app.css  fonts/roboto/  images/
    test/             node --test (core only)
    dev/              real-Chrome checks over DevTools Protocol, port script

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
  (a lone reporter shows its value in the message bar). Dropping on the
  palette deletes; the palette tints red while you hover.
- **Palettes with no blocks yet are hidden** (Math and My Blocks until d, e).
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
save/load, d Math and Flow, e My Blocks and boxes, f SVG export, privacy and
guide pages, real name, deploy.

Done: **a** (scaffold, core, canvas), **b1** (block editor: Turtle, Pen and
Flow palettes with `start` and `repeat`, drag, snap, unsnap, delete, plug reporters, type
numbers, tap to run, run highlight and error outline, Roboto vendored).
Not yet: undo, zoom, pan, duplicate, help tips (b2); save and autosave (c);
Math and the rest of Flow (d); My Blocks (e).

Known limits to fix when they matter:
- `blockfactory.js` only grows the space for the first two sockets when
  something taller than a number box is plugged in (`setExpand` has two
  slots). Milestone d adds math reporters with sockets, so patch the port
  script to use a list of extra heights for every socket.
- Reporters with sockets and boolean shapes are not ported yet (`makeShape`
  in `block-view.js` throws for them).
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
Sugar's. **Decide before milestone d**, which ports boolean shapes and
entangles more of the original. Until then, keep adding every borrowed file
to `NOTICE.md`. Not legal advice; ask a lawyer if it matters.

## Deploy gate

While the app has its placeholder name, the whole `turtle-draw/` folder is
listed under `exclude:` in the repo's `_config.yml`, so pushing `learn` for
other reasons does not publish it. Remove that line (keep the dev-file
excludes) only after the teacher has named the app and the public pages
(about, privacy, guide) exist. Also add the public paragraph to `/license/`
and a card in `_data/pathways.yml` at that point. Confirm the `learn` repo is
public so the AGPL source link works.

## Commands

    cd turtle-draw && node --test                                # unit tests
    python3 -m http.server 4011 --directory turtle-draw          # dev server
    node turtle-draw/dev/browser-checks.mjs                      # real Chrome: turtle, Run/Stop
    node turtle-draw/dev/editor-checks.mjs                       # real Chrome: block editor, touch, privacy

Use port 4011 for this app's dev server. Never use 4000 (the author's own
Jekyll) or kill processes you did not start. The final check of the built
site uses Jekyll on 4010 as described in the repo's root `CLAUDE.md`.
The two check scripts need Google Chrome at its macOS path and the dev server
running. They drive real mouse and touch input over DevTools Protocol and fail
on any console error or CSP violation. `editor-checks.mjs` also fails if any
label overflows its block or the page requests anything outside its own
address. Set `SHOTS_DIR` to keep their screenshots.
