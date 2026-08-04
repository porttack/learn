# INTEGRATE.md: Adding the Studio pathway to porttack/learn

This archive contains a complete Jekyll collection built to match the existing
conventions in `porttack/learn` (collections in `_<id>/`, landing page at
`<id>/index.md`, print page at `<id>/print.md`, `order` and `source` front
matter, provenance rendered from `_data/sources.yml`).

Everything here is additive. No existing file is overwritten by unzipping,
but two existing files need small edits, described in step 2.

## What is in the archive

```
_studio/              44 lesson pages (the published pathway)
studio/index.md       pathway landing page
studio/print.md       print-all page
_program-notes/       teacher material, NOT published by Jekyll
INTEGRATE.md          this file
```

Page order in `_studio/`:

- 01 to 04: How the Studio Works, Design Decision Records, Independent
  Contractors, The Python Ladder
- 05 to 10: Unit 0 cards, engineering process
- 11 to 14: Unit 1 cards, water physics
- 15 to 21: Unit 2 cards, electricity and fabrication
- 22 to 29: Unit 3 cards, control and actuation
- 30 to 34: Unit 4 cards, software
- 35 to 44: Unit 5 cards, mission science and safety

Unit 0 and Unit 1 cards have their one page reading merged in at the top under
"Before Class Reading". Units 2 through 5 readings are not written yet; when
they are, they go in the same place, in the same format.

## Step 1: unzip at the repo root

```bash
cd /path/to/learn
unzip ~/Downloads/studio-pathway.zip
```

## Step 2: two edits to existing files

**`_config.yml`**, add to `collections:`

```yaml
  studio:
    output: true
    permalink: /studio/:name/
```

and add to `defaults:`

```yaml
  - scope: { path: "", type: "studio" }
    values:
      layout: lesson
      pathway: studio
```

**`_data/pathways.yml`**, append:

```yaml
- id: studio
  title: "Studio: Running an ROV Program"
  collection: studio
  url: /studio/
  status: in-progress
  blurb: >-
    The curriculum and working practices behind a MATE ROV team run as an
    engineering company. Sprints, pool days, design decision records, and a
    library of lesson cards covering water physics, electricity, control,
    software, and ocean science.
```

No change is needed in `_data/sources.yml`. Every page uses `source: original`,
which already exists there.

## Step 3: build and check

```bash
bundle exec jekyll serve
```

Then open `/studio/` and confirm the contents list renders in order, a lesson
page shows prev/next navigation, and `/studio/print/` renders all 44 pages.

## Important: `_program-notes/` must stay unpublished

`_program-notes/` holds the fall calendar, the verification prompt bank, and
the full program context dump. Jekyll ignores top level directories beginning
with an underscore unless they are registered as collections, so these are
committed but not built. Do not register this directory as a collection.

Two of these are deliberately not for students. The verification prompt bank
is the answer key for oral checks. The context dump discusses grading policy,
staffing, and an individual student accommodation, so it should not be
published to a public site at all. If the repo is public, consider keeping the
context dump out of git entirely and storing it elsewhere.

## Notes on what was normalized during the build

- Four cards drafted earlier under a single number sequence were renumbered to
  the unit.card scheme: 13 became 3.5, 24 became 2.3, 25 became 3.4, and 26
  became 3.3. Cross references inside those cards were rewritten to match.
- The heading "Absent or Self-Paced Path" was renamed to "If You Miss This
  Class" everywhere, for consistency and to avoid misreading by administrators.
- Student facing pages contain no em-dashes, by house rule. If you add pages,
  keep that rule; the build can be re-checked with
  `grep -rl "—" _studio/ studio/` which should return nothing.

## Instructions for Claude Code, if you would rather have it do the work

Paste this into Claude Code with the archive unzipped somewhere and the repo
open:

> The directory `studio-pathway/` contains a new Jekyll collection for this
> site. Please:
> 1. Move `_studio/`, `studio/`, and `_program-notes/` to the repo root.
> 2. Register a `studio` collection in `_config.yml` with
>    `output: true` and `permalink: /studio/:name/`, and add a matching
>    `defaults` scope setting `layout: lesson` and `pathway: studio`, following
>    the exact pattern used by the existing `rov` collection.
> 3. Append a `studio` entry to `_data/pathways.yml` matching the shape of the
>    existing entries. Title: "Studio: Running an ROV Program". Status:
>    in-progress. Write the blurb from `studio/index.md`.
> 4. Confirm every file in `_studio/` has `title`, `order`, and `source`
>    front matter, that `order` runs 1 to 44 with no gaps or duplicates, and
>    that `source` values all exist in `_data/sources.yml`.
> 5. Do not register `_program-notes/` as a collection. It must not be
>    published.
> 6. Run the build and report any Liquid or front matter errors.
> 7. Report back with a list of any internal cross references in `_studio/`
>    that point at cards or readings which do not exist yet, so I can decide
>    what to write next.

## Known gaps, if you want a to-do list from this

- Readings for Units 2 through 5, about twenty pages
- Unit 5 seminar cards reference provided excerpts that still need sourcing
- A design spec template, referenced in several cards, is not written yet
- Card 0.2 references a worked example DDR that you intend to author
- Spring semester calendar, pending MATE 2027 dates
