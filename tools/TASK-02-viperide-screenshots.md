# Task 02 — ViperIDE screenshots (for the teacher, not Claude)

Take these with your own Pico and a fresh MicroPython flash, in Chrome.
Full browser window is fine — cropping happens later. PNG preferred.

Context: `_pico/02-viperide-and-your-first-program.md` currently borrows one
screenshot from ViperIDE's own GitHub repo (MIT licensed, credited in the
figcaption), but it shows someone else's project with a Bluetooth library
already loaded — not what a student will actually see. These replace/add
to that.

## Shots wanted

1. **Device picker** — the moment Chrome's "Select a device" popup appears
   after clicking connect, listing your Pico. This is the step most likely
   to confuse a student, since it's a browser dialog, not part of ViperIDE.
2. **Freshly connected, empty Pico** — the File Manager pane right after
   connecting to a Pico that only has MicroPython flashed, nothing else on
   it.
3. **Hello World running** — `main.py` open in the editor with
   `print("Hello, world!")`, just after clicking the play button, with the
   output visible in the Terminal pane below.
4. *(optional)* **Virtual Device** — wherever/however you switch into
   Virtual Device mode, if it's a visible toggle or separate link. Useful
   because the lesson's warning callout about Virtual Device vs. real
   hardware currently has no visual.

You don't need all four — even just #1 and #2 already fix the main gap.

## When done

Save them wherever's easiest (or drop straight into `assets/img/pico/`)
and tell Claude the path(s). Claude will handle renaming, cropping, alt
text, and wiring them into the lesson.
