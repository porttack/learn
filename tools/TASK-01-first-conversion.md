# Task 01 — First conversion: front matter and chapter 1

Read `CLAUDE.md` first. It governs conventions, licensing, and style. This
file is the task; CLAUDE.md is the law.

**Source file:** `source/rpi-pico-2e/book.epub`
(*Get Started with MicroPython on Raspberry Pi Pico*, 2nd ed. Gitignored.)

**Scope:** front matter and chapter 1 only. Do not convert chapters 2+.
This run exists to prove the pipeline, not to produce the course.

**Pathway:** this book's content is its own `pico` collection/pathway, not
`rov`. It's foundational MicroPython/Pico material that other classes may
reuse — ROV-specific lessons come later, in their own pathway, and will
link to this one rather than duplicate it.

Work through the phases in order. **Stop at each checkpoint and wait for
me.** Do not run ahead.

---

## Phase 0 — Inspect. Convert nothing.

Unzip the EPUB to a temp directory outside the repo. Then report:

1. The spine order, with each file's first heading, so we can see how
   chapters map to XHTML files.
2. The full XHTML for chapter 1, or a representative 200 lines if it's long.
3. **How code listings are marked up.** Which element, which classes, is
   indentation inside the element or in attributes. This determines the whole
   converter design.
4. How figures are marked up: element, caption element, the `id` scheme, and
   where the image files live in the archive.
5. How the sidebars are marked up. In the reading order they appear as
   WARNING, NOTE, CHALLENGE, FURTHER READING, and similar all-caps labels.
6. Total image count and format.

**CHECKPOINT. Show me all of the above and stop.** I want to read the real
markup before you design against it.

---

## Phase 1 — Site shell, only if missing

If `_layouts/lesson.html` already exists, skip this phase entirely.

Otherwise build the shell, with no lesson content:

- `_layouts/lesson.html` — lesson label, title, prev/next within the pathway,
  a print button, and an attribution footer rendered from the `source:` front
  matter field via `_includes/provenance.html`. Never hand-write attribution.
- `assets/css/style.scss` — imports minima, then figure, callout, and
  `@media print` styles per CLAUDE.md.
- `index.md` — lists pathways from `_data/pathways.yml`.
- `rov/index.md` with `permalink: /rov/` — pathway landing page and contents.
- `rov/print.md` with `permalink: /rov/print/` — concatenates the pathway.
- `license.md` — explains the mixed-source licensing.

Then `bundle exec jekyll serve` and confirm a clean build.

**CHECKPOINT. Tell me it builds and stop.**

---

## Phase 2 — Write the converter

Write `tools/epub_to_lessons.py`. Python 3, standard library plus
BeautifulSoup if it helps.

**Write a script. Do not hand-transcribe the chapters.** This is the rule
that matters most in this repo. Hand transcription drifts between chapters,
can't be re-run when conventions change, and conventions will change.

The script must:

- Take the EPUB path and a list of spine items to convert.
- Emit `_pico/00-front-matter.md` and `_pico/01-get-to-know-your-pico.md`.
- Write front matter: `layout: lesson`, `title`, `pathway: pico`, `order`, and
  `source: rpi-pico-2e`.
- Preserve code listings exactly, in fenced blocks tagged `python`.
  Indentation is semantically load-bearing in Python and must survive byte
  for byte.
- Convert figures to the `<figure id="fig-1-N">` pattern from CLAUDE.md, copy
  images to `assets/img/pico/`, and use the caption as `alt` text.
- Rewrite internal cross-references. In-book links like
  `05.xhtml#fig_pico_top` become `#fig-1-1`. Links to chapters we haven't
  converted become plain text, not dead links.
- Convert sidebars to `<aside class="callout warning|note|challenge">`.
  Map FURTHER READING and any other unlisted label to `note`.
- Preserve emphasis, inline code, lists, and tables.

Make it idempotent and re-runnable. I will run it many times.

**CHECKPOINT. Show me the script and stop before running it.**

---

## Phase 3 — Run and verify

Run the converter on the two sections. Then check, and report results as a
short list rather than prose:

1. `bundle exec jekyll build` completes with no errors or warnings.
2. Every `<img>` src resolves to a file that exists.
3. `grep -ri thonny _pico/` — chapter 1 should return nothing, because Thonny
   doesn't appear until chapter 2. A hit here means the converter pulled from
   the wrong spine item.
4. Every code fence contains correctly indented, syntactically valid Python.
   Compare at least one listing against the raw XHTML to prove indentation
   survived.
5. Figure count matches what Phase 0 reported for chapter 1.
6. No `.xhtml` strings remain anywhere in the output.
7. `/pico/print/` renders both sections and the print CSS applies.

Then show me the first 80 lines of each converted file.

---

## Notes

- Front matter is a **pipeline test, not a lesson.** It's the book's title
  page and colophon, which will most likely end up as an attribution page
  rather than lesson 00 in the final sequence. Convert it now because it's a
  cheap, structurally simple target. Don't design the pathway around it.
- Chapter 1 is hardware, soldering, and flashing MicroPython. It's the one
  chapter with no IDE dependency, so it converts cleanly. Chapter 2 is
  wall-to-wall Thonny and will need rewriting rather than converting. That's
  a later task.
- Never commit `source/`. It's gitignored and stays that way.
