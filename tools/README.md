# tools/

Conversion and build scripts. Nothing here is served by Jekyll.

`epub_to_lessons.py` walks spine sections of the Pico MicroPython book EPUB
and converts them into lesson markdown for a given collection (currently
`_pico/`, plus copied images into `assets/img/pico/`). It's pathway-agnostic
— pass `--pathway`/`--outdir`/`--imgdir` for a different collection. See
CLAUDE.md — write the script, don't transcribe by hand.

Put the source EPUB in `source/<id>/book.epub` (see `_data/sources.yml`),
which is gitignored.

`TASK-01-first-conversion.md` and `TASK-02-viperide-screenshots.md` are
one-off work orders (the first for Claude, the second for the teacher),
kept for reference rather than as living docs.
