# Site-wide to-do

Work that spans more than one section of learn.porttack.com. Section-specific
lists live next to this one (e.g. `unplugged-todo.md`).

## Page history

Lesson pages on pathways with `suggest_edits: true` have a **History** link
that lists the commits touching the page's source file
(`_layouts/lesson.html`). Readers mostly want to see what the page *used to
look like*, not the commit list.

- [ ] **Quick: Wayback Machine link** in the History panel,
      `https://web.archive.org/web/*/learn.porttack.com<page.url>`. Shows real
      rendered past versions, but only for dates the Internet Archive crawled;
      optionally add a "Save this version" link
      (`https://web.archive.org/save/<url>`) so a teacher can snapshot a page
      before a big change.
- [ ] **Quick: "view this version" per commit**, linking to the source file at
      that commit (`github.com/porttack/learn/blob/<sha>/<path>`). Easy, but it
      shows Markdown/HTML, not the rendered page.
- [ ] **Real rendered history (larger project).** Options:
      - A GitHub Actions workflow that, on each push, builds the site and keeps
        the rendered page under something like `/history/<date-or-sha>/<path>/`
        (published via Pages), so History can link to real past renderings.
        Storage grows with every change; prune to tagged releases or the last
        N versions per page.
      - Build on demand for an older commit (e.g. a workflow_dispatch that
        takes a SHA). Slower, but nothing stored between uses.
      - Caveats: a page's look also depends on shared layouts, CSS, `_data/`,
        and JS at that commit, so a faithful snapshot needs the whole site
        built at that commit, not just the page's own file.

## Other ideas

- [ ] Section READMEs for each pathway (CS Unplugged has one:
      `_unplugged/README.md`). Remember to add each to `exclude:` in
      `_config.yml`, or it publishes as `/README.md`.
- [ ] Turn on `suggest_edits: true` for the remaining pathways (Pico,
      Electronics 101, Python in 3D, ...) if wanted.
