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

Collections give `/rovrobotics/03-independent-contractors/` for free via the
permalink config. Each pathway also has a landing page at
`rovrobotics/index.md` with `permalink: /rovrobotics/`.

`_data/pathways.yml` drives the site index. Add a pathway there when you
create its collection, and add the collection to `_config.yml`.

## Stack

- Jekyll with the `minima` theme (GitHub Pages native, no build action needed)
- kramdown with GFM input, Rouge highlighting
- Custom domain via `CNAME`. **Keep `baseurl` empty.** The site is at a domain
  root, not a project path.

Local dev:

    bundle install
    bundle exec jekyll serve

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
2. Every lesson declares `source:` in front matter — either
   `adapted-rpi-pico-2e` or `original`. The layout renders the correct
   attribution footer from that field. Do not hand-write attribution.
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
- **No em dashes or en dashes in student-facing content.** Part of the
  program's AI-signal awareness; a stray em dash reads as machine-written to
  the students and parents who notice. Applies to prose, not to code.

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
