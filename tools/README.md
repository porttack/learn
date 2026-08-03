# tools/

Conversion and build scripts. Nothing here is served by Jekyll.

`epub_to_lessons.py` walks spine sections of the Pico MicroPython book EPUB
and converts them into lesson markdown for a given collection (currently
`_pico/`, plus copied images into `assets/img/pico/`). It's pathway-agnostic
— pass `--pathway`/`--outdir`/`--imgdir` for a different collection. See
CLAUDE.md — write the script, don't transcribe by hand.

Put the source EPUB in `source/<id>/book.epub` (see `_data/sources.yml`),
which is gitignored.

`pdf_to_diagrams.py` extracts the nine circuit-diagram photos embedded in
`source/electronics101/circuit-diagrams.pdf` (also gitignored) straight out
with poppler's `pdfimages` — no re-rendering, since each source page embeds
exactly one full-page JPEG — and writes them to
`assets/img/electronics101/diagram-N.jpg`. Re-run it if the source PDF
changes.

`TASK-01-first-conversion.md` and `TASK-02-viperide-screenshots.md` are
one-off work orders (the first for Claude, the second for the teacher),
kept for reference rather than as living docs.
