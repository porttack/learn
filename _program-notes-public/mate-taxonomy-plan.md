# MATE ROV taxonomies: rebuild around what MATE says it builds, on its own page

## Record of decisions (2026-11-20)

**Decided by you** (in your words where I have them):
1. **The MATE catalog is a cross-reference, not a standard**, and is not tied to a year. ("I don't think I want any specific year. This is about MATE in general so teachers know what needs to be taught and where they can find it.")
2. **Infer what MATE is trying to build** by reading the manuals and briefings thoroughly, not copy one year's rules. FLOAT.1 to 6 were too specific and too synthetic; collapse the float into general competencies.
3. **Rebuild the catalog around MATE's stated aims** in three areas: engineering practice, professional and team skills, ocean and environmental understanding. The rules (fuse sizes, tether lengths, depths) become evidence notes, not competencies.
4. **The Ocean Decade is its own catalog** (the ten Challenges, plus the seven Outcomes), with MATE's own task tags as the evidence.
5. **MATE's own 18 Evaluate-Compete skills are their own taxonomy**, separate from our competencies, which cross-reference them.
6. **Class level (Scout, Navigator, Ranger) is its own taxonomy**, eventually shown as a tag or color. **Only Scout, Navigator and Ranger matter** (you teach middle and high school); Pioneer and Explorer are out of scope.
7. **Move all MATE material onto its own page** and off the main `/standards/` page; decide later what and how to move back. `mate-rov.json` stays a catalog; what the main page shows later is a display choice.
8. **Presentation, outreach, team building and project management are in scope**, cross-referenced to ELA (Speaking & Listening, Writing), CTE ICT anchors and CASEL, not only to CS standards.
9. **ENG.9 (collect, transmit, analyze and graph data) is a general data competency, not a float one.** Electricity-physics standards exist elsewhere and are **not a concern now**.
10. **Process:** judgment-heavy work is planned in plan mode (Opus) and written down as decision tables; Sonnet only transcribes and builds; if execution hits a judgment it returns to plan mode. Stages 1 to 6 below.
11. You added the primary sources to `attic/`: 2024 Ranger, 2025 Scout, Navigator and Ranger, 2026 Scout manuals; the Ocean Decade Challenges and Vision 2030 pages; the SLVUSD LCAP.
12. **Keep the Vision 2030 / Ocean Decade resources in mind as future lessons** (white papers, videos, expert profiles). Not cataloged now.
13. **The MATE start page is `/standards/mate/`** (confirmed 2026-11-20: "/standards/mate is fine").
14. **Keep the MATE links on the Profiling Float lesson pages for now**, pointing at the new page; revisit later ("we will fix later").

**Accepted by delegation, 2026-11-20** (you said "do whatever you recommend" without reviewing the tables line by line, so these are my recommendations adopted on your word, and the Stage 4 audit is where they get a real review):
- The 26 competencies, the standards chosen for each, and their strengths in "Stage 2 results".
- Profiling Float claims ENG.8 only (partial); ELA cited as grades 8 and 9-10 together.
- Five NGSS expectations to add (MS-ESS3-3, MS-LS2-5, HS-LS2-7, HS-ESS2-6, HS-ESS3-2), wording to be fetched from nextgenscience.org in Stage 3.

**Already done in the repo before this plan** (commits, not pushed unless noted): NGSS 2013 and California EP&Cs catalogs and the "Science and Environmental Literacy" group; Profiling Float and Profiling Float: PID aligned to NGSS, EP&Cs, AP CSP, California CS, CSTA 2026, CTE ICT (pushed as 47109e2); first MATE catalog, carrier, cross-reference pages, crosswalk and `tools/mate_candidates.py` (commit 3ebb697, **not pushed**; this plan replaces much of it). Nothing from this plan has been executed yet.

**Where this is saved:** the working copy is `/Users/ebrown/.claude/plans/radiant-greeting-salamander.md` (outside the repo); a copy is kept in the repo at `_program-notes-public/mate-taxonomy-plan.md` (saved 2026-11-20, not yet committed). Execution of Stage 3 has not started; it begins when you say so.

## PHASE 3 (2026-11-20, after Phase 2 was built and committed as b48f3a6): eight views in the skills chart

### What you asked for
"For js, I want most essential 2025, most essential 2030, 2025 MATE Matchup, 2030 MATE Matchup, Ocean 10, Ocean 10 MATE Matchup, 2030 Ocean 10 Matchup, Ocean 10 to 2030 Matchup."

### Decided by you in this phase
19. **"Ocean 10" is a bar chart of equal-length bars, 1 to 10** (no ranking implied).
20. **The last two views are the same links read from opposite sides**: "2030 Ocean 10 match-up" has the ten 2030 employer skills on the left and the Ocean 10 on the right; "Ocean 10 to 2030 match-up" has the Ocean 10 on the left and the 2030 skills on the right.
Carried over: the post on porttack.com keeps its four tabs and gets the new views as hidden ones (reachable by `#anchor` only); this site's chart page shows all eight as tabs.

### The eight views
| # | View key | Tab label (this site) | Left column | Right column / bars |
|---|---|---|---|---|
| 1 | `now` (exists) | Most essential 2025 | | WEF top ten of 2025, bars |
| 2 | `growing` (exists) | Growing fastest 2030 | | WEF top ten growing fastest to 2030, bars |
| 3 | `mate25` | 2025 MATE match-up | the ten 2025 skills | MATE's 18 skills |
| 4 | `mate30` | 2030 MATE match-up | the ten 2030 skills | MATE's 18 skills |
| 5 | `ocean` | Ocean 10 | | the ten challenges, equal bars, numbered 1 to 10 |
| 6 | `ocean-mate` | Ocean 10 MATE match-up | the Ocean 10 | MATE's 18 skills |
| 7 | `wef30-ocean` | 2030 Ocean 10 match-up | the ten 2030 skills | the Ocean 10 |
| 8 | `ocean-wef30` | Ocean 10 to 2030 match-up | the Ocean 10 | the ten 2030 skills |
**One label to confirm:** WEF's 2030 list is the skills **growing fastest**, not "most essential" (that is the 2025 list), so view 2 stays labeled "Growing fastest 2030". Say if you want your wording instead.
The union "MATE match-up" from Phase 2 (13 skills) is replaced by views 3 and 4; views 3 and 4 are subsets of the same 25 links.

### Why this needs an engine change (porttack.com `assets/skills-widget.js`)
Today every match view puts the same 13 employer skills on the left (`this.SKILLS`), links are `{s: index into SKILLS, a: anchor id}`, and the left chip colors, the detail wording ("Matched employer skills") and the column title are fixed. Needed, all additive so existing views behave exactly as now:
1. A match view may carry **`left`** (its own list of `{name, cls}`) and **`leftTitle`**; links' `s` then index that list. Default stays `this.SKILLS`. (Touches `buildMatch`, `drawMatchLines`, `anchorMatches`.)
2. A match view may carry **`leftNoun`** ("employer skills", "Ocean Decade challenges", "MATE skills") for the detail panel's "Matched ...:" and "No ... points here" text (`showDetail`).
3. A bar row may carry **`w`** (explicit width, for equal bars) and **`valText`** (text in the value column) (`buildBars`).
4. A new color class **`ocean`** (bars, dots, lines, tags; a blue) in the injected CSS and `LINE_COLORS`.
5. Views 3 and 4 are built **at load time** from the single authored link list: `left` = the ten skills in rank order, links remapped. No second copy of the 25 links.
Regression check: before and after, the four existing match views and two bar views must render identical row counts, line counts and captions.

### Decision table 2: WEF 2030 skills to the Ocean 10 (draft, for your review; views 7 and 8)
Rule: a line only where the Challenge's own description (read from the Ocean Decade page) calls for that skill. Solid = the challenge is mainly that skill; dashed = a real piece of it. OD codes follow the challenge numbers.
| 2030 skill (rank) | Ocean 10 challenges (strength) | Why |
|---|---|---|
| AI and big data (1) | OD.8 (strong); OD.7 (partial) | A dynamic, open digital ocean needs data science and AI; the observing system delivers data to users |
| Networks and cybersecurity (2) | OD.7 (partial); OD.8 (partial) | Delivering and sharing ocean data openly depends on networks; no challenge names security |
| Technological literacy (3) | OD.9 (strong); OD.8 (partial) | Equitable access to technology and skills; using a digital ocean takes it |
| Creative thinking (4) | OD.4 (partial); OD.3 (partial) | Both call for innovation and new solutions |
| Resilience, flexibility and agility (5) | OD.6 (strong); OD.5 (partial); OD.4 (partial) | Community resilience; adapting to climate; a resilient ocean economy |
| Curiosity and lifelong learning (6) | OD.9 (strong); OD.10 (partial) | Capacity development and knowledge for all; people's motivation and capability to understand the ocean |
| Leadership and social influence (7) | OD.10 (partial); OD.4 (partial) | Moving people and sectors to act; multi-sector partnerships |
| Talent management (8) | OD.9 (partial) | Building capacity across stakeholders |
| Analytical thinking (9) | OD.2 (partial); OD.1 (partial); OD.5 (partial) | Challenges that begin with "understand": stressors on ecosystems, sources of pollution, the ocean-climate link |
| Environmental stewardship (10) | OD.2 (strong); OD.1 (strong); OD.10 (strong); OD.5 (partial) | Protecting and restoring ecosystems, removing pollution, people acting for a healthy ocean; climate solutions |
Every challenge gets at least one line (OD.3 only a dashed one).

### Decision table 3: Ocean 10 to MATE's 18 skills (draft, for your review; view 6)
MATE tags mission **tasks** with challenges, not skills, so there is no direct MATE statement. Rule: **solid** = MATE's own tags reach the skill through a competency (a competency tagged with that challenge, in `mate-rov.json` `ocean_decade`, lists the skill); **dashed** = this project's reading from the Ocean Decade and Evaluate-Compete descriptions only.
| Challenge | Solid (through MATE's tags) | Dashed (our reading) |
|---|---|---|
| OD.1 Understand and beat marine pollution | none (never tagged) | ROV.9, ROV.5 (monitoring and measuring) |
| OD.2 Protect and restore ecosystems and biodiversity | ROV.9, GEN.8 | none |
| OD.3 Sustainably nourish the global population | none (never tagged) | ROV.9 |
| OD.4 Sustainable, resilient and equitable ocean economy | ROV.9, GEN.8 | GEN.3 (business and customer needs) |
| OD.5 Ocean-based solutions to climate change | ROV.9, GEN.8, ROV.1, ROV.4, ROV.5 | none |
| OD.6 Community resilience to ocean and coastal risks | ROV.9, GEN.8 | ROV.6 (safety and hazards) |
| OD.7 Sustainably expand the Global Ocean Observing System | ROV.9, GEN.8, ROV.1, ROV.4, ROV.5 | none |
| OD.8 Digital representation of the ocean | ROV.9, GEN.8, ROV.1, ROV.4, ROV.5 | none |
| OD.9 Skills, knowledge, technology and participation for all | none (MATE tags the whole competition 9 overall, not a competency) | GEN.8, GEN.9, GEN.1 |
| OD.10 Restore society's relationship with the ocean | none (never tagged except the overall label) | ROV.9, GEN.1, ROV.8 |
Reading note for the caption: ROV.9 (Technology and Society) and GEN.8 (Project Knowledge and Skills) carry most solid lines because every "understanding" competency lists them; ROV.1, ROV.4 and ROV.5 come in through the float, which MATE tags 5 every year and 7 and 8 from 2025. MATE skills with no Ocean 10 line: GEN.2, GEN.4, GEN.5, GEN.6, GEN.7, ROV.2, ROV.3, ROV.7.

### The Ocean 10 bars (view 5)
Ten equal-width bars, numbered 1 to 10 (the UN's numbers), the challenge name as the label, colored `ocean`. The value column says how many of MATE's 11 mission tasks (2024 to 2026) tag it: OD.1 none, OD.2 5, OD.3 none, OD.4 2, OD.5 4, OD.6 1, OD.7 7, OD.8 4, OD.9 none, OD.10 none. (That is MATE's own tagging, counted; it is shown as text, not as bar length. Say if you would rather leave it blank.)

### Data authoring: one source in learn, generated into porttack.com
- New **`_standards/mate-ocean-links.json`**: `wef30_ocean` links (table 2), `ocean_mate` links (table 3), the ten challenges' names and MATE tag counts. Tables 2 and 3 above are its content.
- New **`tools/build_skills_widget_data.py`**: writes everything MATE and Ocean into the porttack.com data file between `// BEGIN MATE AND OCEAN VIEWS (generated by learn.porttack.com/tools/build_skills_widget_data.py)` and `// END ...` markers (replacing Phase 2's hand-inserted block), from `mate-wef-links.json`, `mate-ocean-links.json`, `mate-skills.json`, `mate-rov.json` and `ocean-decade.json`. Re-runnable.
- Extend **`tools/check_mate_wef_sync.mjs`**: for each of views 3 to 8 recompute the expected links, left list and anchors from the learn JSON and compare with the widget data; check the ocean bars' names and counts.

### Build (Stage B, execute; Sonnet)
1. **porttack.com** (`/Users/ebrown/src/porttack.com`): engine edits 1 to 5 in `assets/skills-widget.js`; replace the Phase 2 block in `assets/skills-widget-data.js` with the generated block and add the new `MATCH_VIEWS` entries, bar view `ocean`, captions for views 3 to 8 (plain words, no dashes); in the draft post's `hiddenViews` replace the `mate` entry with six (`wef-skills-mate25`, `-mate30`, `-ocean`, `-ocean-mate`, `-wef30-ocean`, `-ocean-wef30`). Edit only; **do not commit or push** there.
2. **learn:** `_standards/mate-ocean-links.json`; `tools/build_skills_widget_data.py`; run `tools/sync_skills_widget.sh` (copies both widget files); update `render_mate_skills_match` in `tools/build_alignment.py` (eight tabs in the order above, defaultView `mate30`? see below; legend gains an Ocean entry; intro text); extend the sync check; `tools/check_mate_data.py` validates the new JSON (codes exist, strengths valid); run `tools/publish_standards.sh`; commit learn.
3. Default tab on this site: **"2030 MATE match-up"** (the forward-looking one), unless you prefer 2025.

### Verify
`check_mate_data.py` and the extended sync check pass. Regression: the post built locally from porttack.com shows its four tabs and unchanged CTE and CSTA views (13 left, 11 right, 16 lines for the CTE view), and each hidden anchor opens its view. On this site's chart page (headless Chrome, own port): eight tabs; each view draws the expected left and right counts and line counts (view 3: ten left, 18 right; view 4: ten left, 18 right; view 5: ten equal bars; view 6: ten left, 18 right; views 7 and 8: ten and ten, with equal numbers of lines); hover and tap show the right wording ("Matched Ocean Decade challenges", "Matched employer skills"); the tab bar with eight labels wraps cleanly (screenshot); readable in light and dark (white card).

### Stages for this phase
- **Stage A, plan mode: this section.** The judgment is Tables 2 and 3, the bars and the labels; change any before approving.
- **Stage B, execute (Sonnet):** the Build steps.
- **Stage C, plan mode (Opus): audit** the two mappings and the chart as a whole (is eight tabs too many? does the Ocean 10 side tell a clear story?).

### Open items
- Tables 2 and 3 are my drafts from the Ocean Decade page and Evaluate-Compete; neither source links employer skills to challenges, so every line is this project's reading.
- Eight tabs may wrap awkwardly on a phone.
- The Ocean Decade page and the roll-up are not changed in this phase (a line on each challenge listing its 2030 skills and MATE skills is an easy later addition).

## PHASE 2 (2026-11-20, after Stage 3 was built and committed as 2cd4b31): bubbles, more pages, employer-skills chart

### What you asked for (your words, condensed)
"I like the full page, but it is too much to absorb." Wants: (a) a page that **maps competencies to standards with a short summary of each standard**; (b) a **first page of bubbles like /standards/, categorized by the 18 skills**, with the **cross-references to other standards** on the bubbles, and the material **split into multiple pages**; (c) in the porttack.com repo, update the shared skills-widget JS used by the post "Soft Skills Are Already in the Standards" so it **maps the WEF 2025 and 2030 skills to MATE's skills, hidden by default**, and **copy it to our side**; (d) **another mapping**: MATE skills to 2030 and to all the other standards, "a way to easily scroll through."

### Decided by you in this phase
15. **Bubbles are competencies, shown under each of the 18 skills they develop** (so one competency can appear under two or three skills). Tooltip carries the cross-reference lines to other standards, expandable to the short standard wording, as on `/standards/`.
16. **One page per section.** Not a page per skill.
17. **The copied employer-skills chart gets its own page in the MATE section** (`/standards/mate/skills-match/`).
18. **The "2030" in the scroll-through is both**: the WEF 2030 growing-skills list and the UN Ocean Decade (2030) challenges, side by side for each MATE skill, then the standards.
Also: the porttack.com widget change is authorized (edit only; no commit or push in that repo unless you say so). "Hidden by default" means a view with no tab, reachable only by its `#anchor`.

### What I found (read-only)
- **porttack.com** is `/Users/ebrown/src/porttack.com`. The post is `_posts/2026-07-08-hope-in-the-standards.md` (a draft). It loads two shared files, `assets/skills-widget.js` (engine, 629 lines, injects its own CSS, light colors only) and `assets/skills-widget-data.js` (dataset "wef-skills"). "2025 and 2030" are WEF's two lists in that chart: the ten skills employers call most essential in 2025, and the ten growing fastest by 2030. The union is **13 skills**, in a fixed order, index 0 to 12: 0 Analytical thinking, 1 Resilience/flexibility/agility, 2 Leadership and social influence, 3 Creative thinking, 4 Motivation and self-awareness, 5 Technological literacy, 6 Empathy and active listening, 7 Curiosity and lifelong learning, 8 Talent management, 9 Service orientation, 10 AI and big data, 11 Networks and cybersecurity, 12 Environmental stewardship.
- A match-up view is `matchViews[name] = {anchors, links, details, covered, rightTitle}`: left column = those 13 skills; right column = "anchors" (CTE's 11 anchors today); `links` = `{s: index 0-12, a: anchor id, w: "strong"|"partial"}` (solid or dashed line); `details[id] = {desc, subs:[{n,t}]}` shown in a panel; an anchor may carry `unit` (e.g. "pillar"). Views with no tab are listed in the post's `hiddenViews`. **A MATE view therefore needs only data**, no engine change (to verify: 18 anchors lay out cleanly; a browser check).
- `/standards/`'s bubble look is ~90 lines of CSS inside `standards/index.html` (`.cov-group`, `.cov-grid`, `.cov-badge`, `.cov-badge-btn`, `.cov-tooltip`, `.tt-xref-*`), driven by a 1,700-line JS. I will **not** touch `standards/index.html`.

### The page set (all generated by `tools/build_alignment.py` into `standards/mate/<name>/index.html`; a shared nav strip at the top of each)
1. **`/standards/mate/` Start.** Three sentences of intro, links to the other pages, then the **18 skills as headings (employability group, ROV-specific group), each with a one-line meaning and its competency bubbles.** Bubble = competency code (e.g. ENG.4), tinted by area (ENG, PRO, UND); a small mark on a bubble means a lesson here teaches it. Tooltip (click or tap, as on `/standards/`): code and name, one-sentence meaning, the skills it develops (chips that jump to the skill), "Adds in Navigator/Ranger" if any, and the **cross-reference toggles** (`AP CSP 3.6 (partial)`) that expand to the short standard wording and the reason. Static HTML with a tiny JS for open/close, so it prints and works without a network.
2. **`/standards/mate/aims/`** What MATE says it builds (the ten stated aims, already in the catalog).
3. **`/standards/mate/competencies/`** The full detail page that exists today for the 26 competencies (everything open), minus the aims, skills, Ocean Decade and classes sections.
4. **`/standards/mate/standards-map/`** NEW, compact: a table, grouped by area, one row per competency: code and name, then a chip per standard (`NGSS MS-ETS1-1 strong`) each with a **one-line summary** (table below). Fits on a screen or two per area; prints.
5. **`/standards/mate/skills-match/`** NEW: the employer-skills chart (copied widget) with tabs "MATE match-up" (default), "Most essential today (2025)", "Growing fastest by 2030".
6. **`/standards/mate/rollup/`** NEW, the scroll-through: **18 anchored sections, one per MATE skill**: its meaning; the **WEF employer skills** it matches (with 2025 rank and 2030 rank, strong or partial); the **Ocean Decade challenges** reached through its competencies; its **competencies**; and the **standards from every framework** its competencies draw on, deduped, each with its one-line summary. A jump list at the top. Prints.
7. **`/standards/mate/ocean-decade/`** The challenges and outcomes with MATE's own task tags (today's section).
8. **`/standards/mate/classes/`** The three classes and the ladder (today's section).
`/standards/` stays free of MATE. The Profiling Float lesson widget's link moves from `/standards/mate/#T-ENG.8` to `/standards/mate/competencies/#T-ENG.8` (`assets/js/standards-alignment.js`).

### New data (author once, in `_standards/`)
- **`mate-short-summaries.json`**: `{framework: {code: "one line"}}`, for the 53 standards the MATE carrier uses (table in the appendix below). Used by the standards map and roll-up.
- **Per competency `ocean_decade`** (field in `mate-rov.json`), from MATE's own task tags and the theme each competency grew from: ENG.8 `[5,7,8]` (floats are tagged 5 every year, 7 and 8 from 2025); UND.1 `[7,8]`; UND.2 `[2]`; UND.3 `[5]`; UND.4 `[4,5]`; UND.5 `[2,6]`; every other competency none. The roll-up shows a skill's challenges as the union over its competencies, and says so ("MATE tags tasks, not skills, so this is reached through the competencies"); the whole competition is also tagged 9 and 10 overall (as MATE labels them), shown as a banner, not per skill.
- **`mate-wef-links.json`** (the mapping below): the one place the learn side reads it; the same links are written into the porttack.com widget data. A small script `tools/check_mate_wef_sync.mjs` loads the porttack.com data file under a stub `SkillsWidget` and fails if the two disagree.

### Decision table 1: WEF employer skills to MATE's 18 skills (draft, for your review)
MATE skill codes: GEN.1 Communication, GEN.2 Creativity, GEN.3 Entrepreneurship, GEN.4 Autonomy, GEN.5 Ability to Deal with Obstacles, GEN.6 Intellectual Development, GEN.7 Critical Thinking and Problem Solving, GEN.8 Project Knowledge and Skills, GEN.9 Teamwork/Collaboration; ROV.1 Vehicle Design/Buoyancy/Propulsion, ROV.2 Systems Design, ROV.3 Structure, ROV.4 Control/Electrical, ROV.5 Sensors/Payload/Tools, ROV.6 Safety, ROV.7 Project Management, ROV.8 Technical Presentation, ROV.9 Technology and Society. Rule: a line only where Evaluate-Compete's own description says the same thing; `strong` = the MATE skill is that employer skill; `partial` = a real piece of it.

| WEF skill (2025 rank / 2030 rank) | MATE skills (strength) | Why |
|---|---|---|
| 0 Analytical thinking (1 / 9) | GEN.7 (strong); GEN.6 (partial) | E-C critical thinking: skeptical, root causes, compares alternatives; intellectual development sees problems are complex |
| 1 Resilience, flexibility and agility (2 / 5) | GEN.5 (strong); GEN.4 (partial) | E-C obstacles: keeps going, stays flexible, improvises; autonomy tries again after failing |
| 2 Leadership and social influence (3 / 7) | ROV.7 (partial); GEN.9 (partial) | Project management organizes the team as a company with roles; E-C has no leadership outcome, so no strong line |
| 3 Creative thinking (4 / 4) | GEN.2 (strong) | E-C creativity |
| 4 Motivation and self-awareness (5 / not on list) | GEN.4 (partial); GEN.6 (partial) | Autonomy takes criticism and risks failure; intellectual development knows the limits of own knowledge |
| 5 Technological literacy (6 / 3) | ROV.4 (strong); ROV.2 (strong); ROV.5 (strong); ROV.1 (partial); GEN.8 (partial) | Control and electrical, systems design and sensors/tools are applied technology; vehicle design is the physical part |
| 6 Empathy and active listening (7 / not on list) | GEN.9 (partial); GEN.1 (partial) | Teamwork respects others and shares knowledge; communication explains to a broad audience |
| 7 Curiosity and lifelong learning (8 / 6) | GEN.6 (strong); GEN.8 (partial) | Intellectual development and project knowledge |
| 8 Talent management (9 / 8) | ROV.7 (partial); GEN.9 (partial) | Roles, deliverables and shared knowledge in a team |
| 9 Service orientation and customer service (10 / not on list) | GEN.3 (strong); ROV.8 (partial) | E-C entrepreneurship builds for customer needs; the marketing display speaks to non-technical people |
| 10 AI and big data (not on 2025 list / 1) | ROV.5 (partial) | **A gap, as in the CTE view**: E-C names no AI or data outcome; the nearest is sensors and the programming that controls them. The manual's own AI note is a competency (PRO.8), not an E-C skill |
| 11 Networks and cybersecurity (not on 2025 list / 2) | ROV.4 (partial) | The tether network and control software; no E-C outcome names security |
| 12 Environmental stewardship (not on 2025 list / 10) | ROV.9 (strong) | E-C technology and society: connects the theme to real problems and ESG |

MATE skills with **no** employer-skill line: **ROV.3 Structure** and **ROV.6 Safety** (neither is on WEF's lists). The chart's caption says so, as the CTE view's does about its gaps.

The porttack.com data additions: `MATE_ANCHORS` (18, `id` like "GEN.7", `disp`, `name`, `cls` human for GEN and tech for ROV, `unit:"skill"`), `MATE_LINKS` (the table), `MATE_DETAILS` (each skill's description in our wording, with `subs` = the competencies that develop it, `{n:"ENG.4", t:"Build reliable electrical and mechanical systems"}`), `MATE_COVERED` (empty), `MATCH_VIEWS.mate` with `rightTitle:"MATE ROV skills (Evaluate-Compete)"`, and a caption in plain words with no dashes. The post gets `{view:"mate", anchor:"wef-skills-mate"}` in its `hiddenViews` (the post is a draft; one config line).

### Appendix: one-line summaries for the standards map (53; wording for review)
**NGSS 2013:** MS-ETS1-1 State what a design must do and what limits it. HS-ETS1-1 Turn a big real-world need into specific requirements. MS-ETS1-2 Compare design options against criteria and limits. HS-ETS1-3 Judge a design on priorities and trade-offs such as cost and safety. MS-ETS1-4 Build a model or test, then improve the design from the data. MS-ESS3-3 Design a way to monitor and reduce a human impact. MS-LS2-5 Weigh designs that protect biodiversity and ecosystem services. HS-LS2-7 Design and improve a way to reduce human harm to ecosystems. HS-ESS2-6 Model how carbon cycles through ocean, air, rock and life. HS-ESS3-2 Compare energy and mineral resource designs by costs and benefits.
**CA CTE (ICT):** C2.4 Understand what the client needs before designing. 7.5 Quality counts in how work is built and presented. C9.2 Assemble hardware with the right tools and testing. C9.5 Program a microcontroller to run a device or robot. C9.3 Hardware takes input, processes it and acts. C5.6 Debugging is part of quality assurance. 7.4 Manage time so responsibilities get met. 2.5 Fit the message and medium to each audience. 11.3 Entrepreneurship and new ventures are real options. 11.4 Entrepreneurial practice applies in ICT. 6.6 A safe workplace must be actively maintained. 6.2 Workplace rules state what employers and workers owe. 10.2 Technical fields have rules and expectations to follow. 10.1 Use the field's own terms and symbols. 9.3 Teamwork, leadership and citizenship in school and community.
**California CS:** 9-12.AP.20 Improve programs by repeated testing and fixing. 9-12.DA.10 How data is visualized shapes what readers take from it. 9-12.CS.3 Troubleshoot complex problems by researching and testing. 9-12.AP.21 Team projects need defined roles and shared tools. 9-12.AP.22 Write design decisions down so others can follow them.
**CSTA 2026:** HS-DAT-DC-24 Check that data has the right type and range. HS-DAT-DI-25 Turn data into a chart that answers a question. HS-PRO-PD-15 Team programming needs roles, a design document and tracking. HS-ALG-PS-05 Check AI output for accuracy, bias and harm. HS-PRO-RD-18 Test AI-written code against what it should do. HS-SOC-ET-41 Weigh a new technology's benefits against its costs.
**AP CSP:** 3.6 Choose between paths with an if statement. 2.3 Turn raw data into information by finding patterns.
**Common Core ELA** (both grade bands share a line): W.8.2 and W.9-10.2 Write clear informative texts that explain ideas. SL.8.4 and SL.9-10.4 Present findings clearly, with evidence. SL.8.5 and SL.9-10.5 Use visuals and media to strengthen a presentation.
**CASEL:** REL.4 Practice teamwork and collaboration. SM.5 Use planning and organizational skills. RDM.6 Reflect on your role in your community's well-being. RDM.4 Think through the consequences of actions.
**California EP&Cs:** I.B Ecosystem services, like clean water, are essential to people. III.C Human practices can change natural cycles. IV.B By-products enter natural systems and are hard to contain. II.B How resources are harvested and used shapes natural systems. V.A Many factors go into decisions about natural resources.

### Build (Stage B, execute; Sonnet, mechanical)
1. **learn data:** add `_standards/mate-short-summaries.json`, `_standards/mate-wef-links.json`; add `ocean_decade` to the competencies in `_standards/mate-rov.json`. Add `tools/check_mate_data.py` (every standards code in the MATE carriers valid; every competency skill id valid; every used standard has a summary; every WEF link refers to real ids; no dashes) and `tools/check_mate_wef_sync.mjs`.
2. **porttack.com** (`/Users/ebrown/src/porttack.com`): edit `assets/skills-widget-data.js` as above; add the hidden-view line to the draft post; run its dataset load under a stub to confirm it parses; **do not commit or push** in that repo.
3. **learn widget copy:** `assets/js/skills-widget/skills-widget.js` and `skills-widget-data.js`, copied unchanged from porttack.com with a one-line header noting origin and date; `tools/sync_skills_widget.sh` to refresh them; note in `tools/` that the data is authored in porttack.com and `mate-wef-links.json` mirrors the MATE view (the sync check enforces it).
4. **learn pages:** replace `render_mate_page` in `tools/build_alignment.py` with one function per page above, sharing the nav strip and the competency/standard lookup helpers already there (`mate_standard_text`, `Coverage`, `MATE_FRAMEWORKS`); a new `assets/standards-bubbles.css` (copied from the bubble rules in `standards/index.html`, scoped to the MATE pages) and `assets/js/mate-bubbles.js` (open/close tooltip, cross-reference toggles, click-away). `tools/publish_standards.sh` copies the whole `standards/mate/` tree; update the Profiling Float link target in `assets/js/standards-alignment.js`. Remove the old single-page output.
5. Run `tools/publish_standards.sh`.

### Verify
`tools/check_mate_data.py` and `tools/check_mate_wef_sync.mjs` pass. Headless Chrome on a scratchpad Jekyll build with its own port (never 4000, 4002 or 4010): `/standards/` unchanged and free of MATE; each of the 8 pages renders, nav links resolve, `../` links to the reference pages resolve; start page shows 18 skill groups and all 26 competencies appear under their skills (count the bubbles against the `skills` fields); a tooltip opens and its cross-reference toggle expands; the chart page shows 13 employer skills and 18 MATE skills with lines, hover and the detail panel work, the 18-row column lays out, and it is readable in light and dark mode (the widget is light only; if dark mode clashes, wrap it in a light card); the roll-up has 18 anchored sections. Screenshot the start page and chart page and look at them. Print the standards map and roll-up to PDF and report page counts. In porttack.com, load the post locally (its own Jekyll build, scratchpad destination) and confirm the existing tabs are unchanged and `#wef-skills-mate` opens the new view.

### Stages for this phase (Opus plans, Sonnet builds)
- **Stage A, plan mode (this section): done once you approve.** The decision tables (Table 1 and the summaries and `ocean_decade` values) are the judgment; they are yours to change before approving.
- **Stage B, execute (Sonnet):** the Build steps above; commit learn in one commit; leave porttack.com uncommitted for you to look at.
- **Stage C, plan mode (Opus): audit and design review.** Review the WEF mapping against Evaluate-Compete's wording, the page-by-page reading experience ("too much to absorb"), what moves back to the main `/standards/` page, and how class shows (tag or color).
- **Stage D, execute (Sonnet):** apply the punch list; commit; push only if you ask.

### Open items for this phase
- The WEF mapping and summaries are my drafts from Evaluate-Compete's descriptions; the audit is where they get a real review.
- The widget is light-colored only and styled by its own injected CSS; dark mode on the learn pages may need a wrapper.
- Two copies of the MATE-to-WEF links (porttack.com JS and learn JSON) are kept honest by the sync check, not by one source.
- Not touched: `standards/index.html`, `CLAUDE.md` (your uncommitted edits), the Ocean Decade tags themselves.

## Context

The first MATE catalog (commit 3ebb697, not pushed) was organized around the manuals' rule sections (SAFE, ELEC, MECH, FLOAT...). It fixated on numbers (15 amps, 0.33 m, 400 points) and six FLOAT entries that are 2027 Ranger/Pioneer details, while its own scope note claimed it was not tied to a year. Direction from the user: infer the skills and understanding MATE is trying to build; class and year are a separate taxonomy; MATE's stated aims up front are interesting in themselves; put it all on its own page and decide later what returns to `/standards/`.

Read so far (all in `attic/`, text and the Overview pages as images, nothing saved): 2024 Ranger, 2025 Scout, Navigator and Ranger, 2026 Scout manuals; 2027 Floats Preview (Ranger and Pioneer); SLVUSD LCAP; the Ocean Decade Challenges and Vision 2030 pages. Plus Evaluate-Compete's skill definitions and MATE's class pages from the web. Scope is Scout, Navigator and Ranger only.

## Answers to the open questions

**Will `mate-rov.json` go on the general standards page?** It stays a catalog under `_standards/`, the source of truth, like `ngss.json`. The main page is generated from catalogs and carriers, so nothing new has to be produced for it later. What the main page shows is a display choice made then, by manifest: a panel for a catalog, the "↔ MATE" lines in other standards' tooltips, or neither. Likely candidates to return first: the Ocean Decade and the cross-reference lines; the MATE competencies themselves may be better kept on the MATE page. For now none of it is on `/standards/`.

**Is public speaking, presentation, outreach, team building and project management part of this?** Yes, and my first cross-references under-served them (they used only AP CSP, CSTA, California CS, CTE ICT, NGSS, EP&Cs, CASEL). They get proper links:
- Presentation, technical writing, marketing display: **Common Core ELA**, which is already cataloged (`ccss-ela.json`, Speaking & Listening and Writing, grades 6 to 11-12), e.g. SL.x.4 (present findings), SL.x.5 (visual displays), W.x.2 (informative writing), W.x.4 (clear, organized writing), SL.x.1 (collaborative discussion). Grade bands must be chosen (see Stage 2).
- Outreach and corporate responsibility, leadership, team building, project management, entrepreneurship: **CA CTE ICT anchors** 7 (responsibility, 7.4 time management), 8 (ethics), 9 (leadership and teamwork), 11.3 and 11.4 (entrepreneurship), plus **CASEL** (relationship skills, responsible decision-making, self-management).
- Where these are already taught on this site: the Kagan team-building and class-building carriers, the Socratic seminar kit, and CS50 AP and CSTA team-programming standards (`castandards` 9-12.AP.21, `csta2026` HS-PRO-PD-15).

**Is there another long list of goals MATE states up front?** Yes, and it is the best find in the manuals. The Overview's icon legend is **MATE's own skills taxonomy, from Evaluate-Compete: 18 skills**.
- *Employability (9, orange):* Communication, Creativity, Entrepreneurship, Autonomy, Obstacles, Intellectual Development, Critical Thinking/Problem Solving, Content Knowledge, Teamwork/Collaboration.
- *ROV-specific (9, green):* Vehicle Design/Buoyancy/Propulsion, System Design, Structure, Control/Electrical, Sensors/Payload/Tools, Safety, Technical Presentation, Project Management, Technology and Society.
- MATE says the icons mark which competition requirements develop which skill, so the manuals themselves are tagged. That is primary evidence.
- **Plan: its own taxonomy** (`mate-skills.json`), separate from my competencies. MATE's list is MATE's words; mine is an inference built on top of it. Each of my competencies lists the Evaluate-Compete skills it develops (same cross-reference mechanism as standards). Meanings are taken from Evaluate-Compete's own descriptions (fetched in Stage 2), not guessed from icon labels.
- Other lists seen: the Overview's nine in-demand skills (a subset of the above in spirit); the UN Ocean Decade's 10 Challenges (tagged per task, their own catalog); the UN SDGs (mentioned in 2025 but never tagged per task, so not cataloged); the Decade of Action for Cryospheric Sciences' four goals (2026 only, in prose).

## What the manuals say (evidence the taxonomy rests on)

- **Skills up front (Overview, identical 2024 to 2026, all classes):** "From Technical Talents to Teamwork, Problem-Solving, Creativity, and Critical Thinking"; in-demand skills named: machine learning, data analytics, AI, video marketing, critical thinking, creativity, collaboration, time management, leadership; the 18 Evaluate-Compete icons above.
- **Entrepreneur framing (all):** run the team as a start-up (CEO, CFO, regulatory affairs, R&D, systems engineering, testing, operations, fundraising/marketing, ESG analyst); business acumen, data-informed financial decisions, critiquing design solutions, media outreach, knowing strengths and weaknesses, ESG factors, "good for good."
- **Environmental frame (all):** "10 Challenges, 10 Years, One Ocean"; "from the ocean we have to the ocean we want"; "the client is us." Each yearly Context & Need teaches real science (2024 ocean observing and SMART cables; 2025 Great Lakes acidification, eDNA and invasive carp, offshore wind and solar, shipwreck heritage; 2026 cryosphere, cold-water corals, eDNA and invasive green crab, right-whale ropeless gear, iceberg risk, hybrid wind and oil energy, float under-ice avoidance). Every mission task is tagged with Ocean Decade challenges by MATE itself.
- **Engineering reasoning (Tips for effective written and oral communication, 2025 Ranger, 2026 Scout):** technical storytelling; evaluate alternatives; work breakdown structure; constraints; power budget; sensor calibration; where code runs and data flow; troubleshoot and record anything over 20 minutes; project notebook; "what choices would matter in a less controlled environment?" Rules text: "works at home, not in the competition's industrial environment."
- **Industry practice:** Ranger adds a JSEA (steps, hazards, safeguard hierarchy eliminate/engineer/PPE, named responsibility, from Oceaneering) and a documented safety pre-inspection. Navigator and Ranger score organizational and operational effectiveness (teamwork, collaboration and communication, project management, problem solving and dealing with obstacles, system design and control).
- **AI (2026 Scout only):** a tool, not a crutch; describe how in the documentation and presentation; do not use it to write them.
- **Task families (2024 to 2026):** recover objects; install, replace or connect equipment; survey and measure; sample and analyze (pH, CO2, eDNA, counts); and a **non-ROV device, the profiling float, every year 2024 to 2027**, rising in demand (2025 temperature only, propeller allowed, manual or autonomous; 2027 buoyancy-engine bonus, depth hold, defined data packet, transmission).
- **Stable:** Scout spec codes identical in 2025 and 2026 (36 codes); E&C deliverable points (tech doc 50, presentation 50, marketing 50, spec sheet 20, corporate responsibility 20, safety 10). **Not stable:** totals and demonstration points (Scout 450/400, Navigator 475, Ranger 725), so no totals in the catalog.

## Class ladder (its own taxonomy; Scout is a subset)

| | Scout | Navigator | Ranger |
|---|---|---|---|
| Cameras | optional | required to pilot (CCC-004) | required to pilot (CCC-004R) |
| Surface power | 12 V supply only | adds 115 V AC for surface equipment (CCC-001) | same |
| Fluid power | manual pumps, water or air | hydraulic and pneumatic, limits (2.75 bar) | same family |
| Lasers | no | yes, with safety rules | yes, with safety rules |
| Organizational and operational effectiveness | not scored | 10 points | 10 points |
| Safety documentation | SID | SID | SID, JSEA (10 pts, required for Worlds), pre-inspection set, company safety review |
| Presentation | 5 to 10 min | 15 min | longer class |
| Demonstration timing | 3/10/2 (2026) | 5/15 | 5/15/5, launch through a 1 m square (2025) |

Scope: Scout, Navigator and Ranger only (the user teaches middle and high school). Pioneer and Explorer are college classes and out of scope. Ranger beyond the overview, scoring, JSEA, pre-inspection and C3 sections is not yet read in full.

## Structure: four taxonomies and two carriers, on one new page, off the main `/standards/` map

1. **`mate-skills.json` (new): MATE's own 18 Evaluate-Compete skills**, nine employability and nine ROV-specific.
2. **`mate-rov.json` (rebuilt): our competencies, three areas, about 24 items**, each with first class (`all` by default), evidence references, the Evaluate-Compete skills it develops, and standards cross-references. Draft below.
3. **`ocean-decade.json` (new): the UN Ocean Decade's 10 Challenges, plus its seven Outcomes ("the ocean we want").** Titles and descriptions now come from the primary source: the oceandecade.org Challenges page you saved to `attic/` (verified, not from memory). MATE's text uses shorter older wordings for #4, #7 and #9 and repeats #9's wording as its "#10" (2026 overarching tag only).
4. **Classes: a small catalog (Scout, Navigator, Ranger only)**; later a tag or color. For now a table and a plain tag.
5. **`mate-missions` carrier (new): MATE's own task tags.** Locators are year-task pairs; coverage is the Ocean Decade challenges the manual itself lists for that task. MATE's statement, not mine.
6. **`mate-rov` carrier (rewritten):** competency to standards, to Evaluate-Compete skills.

### Draft competencies (names and meaning; wording written in the build)

**Engineering practice (ENG)**
- ENG.1 Turn a request for proposals into criteria and constraints, and decide what to build for the points available.
- ENG.2 Generate design alternatives, compare them and justify the choice (trade studies, build versus buy).
- ENG.3 Budget power and protect against overcurrent (measure loads, size the fuse, stay within the class limit).
- ENG.4 Build reliable electrical and mechanical systems: wiring workmanship, strain relief, waterproofing and corrosion, guarded propellers, hand-launchable.
- ENG.5 Design for the real environment and test under realistic conditions.
- ENG.6 Control and operate a vehicle: control system, pilot interface, cameras and sensors for piloting, command-control-communication, software and data flow. *Navigator and up: cameras required, surface AC, lasers.*
- ENG.7 Sense, measure and calibrate.
- ENG.8 Design and run a non-ROV device that works on its own (profiling float). *Demand rises by year.*
- ENG.9 Collect, transmit, analyze and graph data to answer a question.
- ENG.10 Do underwater work with purpose-built tools: recover, install, repair, release, survey.
- ENG.11 Test, troubleshoot and keep a record of what you learned.

**Professional and team skills (PRO)**
- PRO.1 Run the team as a company: roles, shared responsibility, deck crew.
- PRO.2 Manage the project: work breakdown, schedule, budget, deadlines. *Navigator and up: scored.*
- PRO.3 Communicate technical work in writing and in person (spec sheet, technical documentation, presentation and Q&A).
- PRO.4 Communicate with a non-technical audience (marketing display, media).
- PRO.5 Think like an entrepreneur: business acumen, clients, financial decisions, ESG.
- PRO.6 Work safely and manage hazards as industry does (inspection, SID, PPE; JSEA). *JSEA: Ranger.*
- PRO.7 Know and follow the rules and standards.
- PRO.8 Use AI as a tool, not a crutch, and say how. *2026 manual only.*
- PRO.9 Give back: mentoring, outreach, community engagement, with measurable impact.

**Ocean and environmental understanding (UND)**
- UND.1 Ocean observing and data (floats, buoys, observatories, cables, mapping, digital ocean).
- UND.2 Ecosystems, biodiversity and invasive species.
- UND.3 Climate and ocean change (acidification, warming, sea level, ice).
- UND.4 Ocean energy and the sustainable ocean economy.
- UND.5 People, heritage and risk (shipwrecks, icebergs, whale entanglement, community resilience).
- UND.6 Weighing environmental, social and governance factors in a decision.

### Cross-reference rule (the "too specific" fix)
Cite only standards that describe the competency's core: one to three per competency; `strong` only if the competency is an instance of the standard, `partial` if it covers a real piece, drop `related` unless nothing else fits. UND items cross-reference EP&Cs and NGSS Earth/Life science (a few more expectations to be added, each verified against the NGSS source and paraphrased: ocean acidification and human impacts, e.g. MS-ESS3-3, HS-ESS2-6, HS-LS2-7, MS-LS2-4). PRO items use ELA, CTE ICT anchors and CASEL as above. cs50psets links are remapped: FLOAT.2 to 5 collapse to ENG.8 (partial) for the two Profiling Float problems; nothing else claimed.

## The new page and main-page cleanup

- **The MATE start page is `standards/mate/index.html`, served at `/standards/mate/`** (the user asked for a main start page; a folder URL is the clean form and leaves room for sub-pages later). One page for now, everything on it; it replaces `mate-rov-cross-reference.html` and `mate-rov-standards-reference.html` (the earlier commit is unpushed). It is reachable by its URL and not linked from the main `/standards/` page until you decide to; a single plain link there is the likely first thing to move back. Because it sits one folder down, its links to the framework reference pages use `../`, and `tools/publish_standards.sh`, which today copies only top-level `*.html`, must also copy `mate/`. Sections: what MATE says it builds (by manual section); the 18 Evaluate-Compete skills; competencies by area with class tag, skills developed, cross-references (standard's wording, strength, why) and linked lessons; Ocean Decade with MATE's task tags by year; classes. Print-friendly, everything open, filter box. A new `render_mate_page` in `tools/build_alignment.py` reusing `Coverage`, `page()`, `mate_standard_text`, `MATE_FRAMEWORKS`.
- **Remove from `/standards/`:** the MATE group, `<hr>`, explainer and report section in `assets/js/standards-coverage.js`; the `mate-rov` entries in `CATALOG_FILES`/manifest and `mate_rov` in `SOURCE_ORDER` in `tools/publish_standards_data.py`; the generated `mate-rov-*` crosswalk files (so other standards' tooltips stop listing MATE).
- **Default, vetoable:** keep the Profiling Float lesson widget's MATE links, pointing at the new page. Catalog JSON still publishes to `standards/data/catalog/` for the widget but is not in the main map's manifest.

## Stages (planning in plan mode for Opus; execution in normal mode for Sonnet)

The model setting is "Opus in plan mode, else Sonnet", so every judgment gets made in a plan-mode stage and written down as a decision table; execution stages only transcribe and build. If an execution stage hits a judgment call it stops and returns to plan mode instead of deciding. (I cannot see from inside which model is answering; check the model indicator after entering plan mode.)

- **Stage 1, plan mode (this plan, done):** read the manuals, infer the taxonomy, settle structure.
- **Stage 2, plan mode (Opus): decisions. DONE except your review; results and decision tables are in "Stage 2 results" at the end of this file.** Fetched: Evaluate-Compete's definitions of the 18 skills; the Ocean Decade's ten Challenges and seven Outcomes (read from your saved copy of the official page); MATE's class and grade eligibility (all three classes span grades 5 to 12, so ELA bands are not class-determined; my earlier guess was wrong); the public general rubric scale. Not done: the per-requirement icon sampling (expensive, little gain over the competency table; can be a Stage 4 spot check) and the per-class rubric categories (Excel files, not public text).
- **Stage 3, execute (Sonnet): transcribe and build.** Write the JSON catalogs and carriers from the approved tables; build the page; remove MATE from `/standards/`; validate every code; headless Chrome checks; print check. No new judgments. Commit.
- **Stage 4, plan mode (Opus): audit.** Compare Stage 3's output to the tables and the evidence: anything too specific, overclaimed, or missing; wording review; decide what moves back to the main standards page and how class shows (tag or color). Output: a punch list.
- **Stage 5, execute (Sonnet): apply the punch list**, rebuild, verify, commit (push only if asked).
- **Stage 6, plan mode, later:** the main-page return, class tag or color, per-class rubric sheets, and Vision 2030 / Ocean Decade material as lessons.

## Verification (Stage 3 and 5)

Validate every standards code in the carriers against its catalog; no em or en dashes in new text; every item in the evidence tables accounted for. Headless Chrome on a scratchpad Jekyll build with its own port (never 4000, 4002 or 4010): `/standards/` has no MATE group, no `<hr>`, no MATE lines in other tooltips, no MATE source in the sidebar; `/standards/mate/` renders every section and its links to `../` reference pages resolve; Profiling Float widget links resolve. Print the new page to PDF and check its length. Commit only my files; the working tree holds other people's edits.

## Stage 2 results

### What the primary sources settled

- **Evaluate-Compete** (SERC at Carleton, outcomes page revised Nov 2024) names exactly MATE's 18 skills, split as "E-Compete General Outcomes" (9) and "MATE ROV E-Compete Outcomes" (9). Four labels differ from the manual icons: Obstacles = "Ability to Deal with Obstacles"; Content Knowledge = "Project Knowledge and Skills"; Critical Thinking/Problem Solving = "Critical Thinking and Problem Solving"; System Design = "Systems Design". The catalog uses Evaluate-Compete's wording and records the icon labels. Definitions below are paraphrases of its text. It publishes no requirement-to-skill table in text (one image only), so per-requirement icon tags would need page-by-page viewing; deferred.
- **Ocean Decade Challenges: VERIFIED from the primary source** (the oceandecade.org Challenges page you saved to `attic/`, read directly; the earlier journal list matches it exactly). Official titles and the gist of each official description (my paraphrase for the catalog):
  1 Understand and beat marine pollution (map land and sea sources of pollutants, their effects on health and ecosystems, and solutions); 2 Protect and restore ecosystems and biodiversity (effects of multiple stressors; monitor, protect, manage, restore); 3 Sustainably nourish the global population (the ocean's role in feeding people); 4 Develop a sustainable, resilient and equitable ocean economy; 5 Unlock ocean-based solutions to climate change (the ocean-climate link; mitigate, adapt, build resilience); 6 Increase community resilience to ocean and coastal risks (multi-hazard early warning, community preparedness); 7 Sustainably expand the Global Ocean Observing System (sustained observing across all basins, delivering accessible, timely data); 8 Create a digital representation of the ocean (a dynamic, open ocean map for exploring past, present and future); 9 Skills, knowledge, technology and participation for all (capacity development and equitable access); 10 Restore society's relationship with the ocean (stronger society-ocean connections that drive decisions and behavior for a healthy ocean).
  **The seven Decade Outcomes, "the ocean we want" by 2030** (this is MATE's own phrase): a clean, healthy, productive, predicted, safe, accessible and inspiring ocean.
  MATE's wordings differ: #4 "Develop a sustainable and equitable ocean economy", #7 "Expand the Global Ocean Observing System", #9 "Skills, knowledge, and technology for all"; and **MATE's 2026 overarching "#10" repeats #9's wording**, so the carrier keeps MATE's tag as written and notes it. Pages not fetched here (they block automated access) are no longer needed.
- **Classes and grades (MATE's class pages):** Scout, grades K-12 (elementary with coordinator approval), "recommended for elementary, middle and beginning high schools"; Navigator, grades 5-12, "middle schools with robotics experience, high schools new to robotics"; Ranger, grades 5-12, "middle and high school students with robotics experience"; Pioneer, first-time college teams; Explorer, advanced college teams and returning high schools. **So the three classes overlap in grade; class is skill and experience level, not grade band.** Only Scout, Navigator and Ranger are in scope (Pioneer and Explorer, the college classes, are dropped from everything below).
- **Rubrics are public** (`materovcompetition.org/scoring`), mostly Excel per class. The general scale (read): outcome scored 0 missing, 1 needs work, 2 partially meets, 3 meets, 4 exceeds; discretionary points for novelty, depth of understanding, depth of analysis, effectiveness (functions as intended) and quality of implementation; deductions for relying on outside help, existing work or purchased components and services. This is what MATE rewards, and it goes on the page as "what judges look for". Per-class category sheets not read.

### The 18 skills (`mate-skills.json`; code, Evaluate-Compete name, meaning in my words from its text)

General (GEN): 1 Communication (explains the engineering process and design to a broad audience, uses images, diagrams and data well, writes clearly); 2 Creativity (sees a problem from several angles, connects ideas, applies knowledge in new ways); 3 Entrepreneurship (builds a product or service that meets customer needs, understands operations and budgets, manages a project); 4 Autonomy (works independently, knows when to ask for help, takes criticism, risks failing and tries again); 5 Ability to Deal with Obstacles (keeps going after setbacks, stays flexible, improvises a fix); 6 Intellectual Development (sees problems are more complex than they look, accepts more than one acceptable design, knows the limits of own knowledge); 7 Critical Thinking and Problem Solving (open-minded but skeptical, looks for root causes, compares alternatives); 8 Project Knowledge and Skills (understands the engineering and science behind the vehicle and has the skills to do it); 9 Teamwork/Collaboration (respectful, works well in a team, shares knowledge in and across teams).
ROV-specific (ROV): 1 Vehicle Design, Buoyancy, Propulsion; 2 Systems Design; 3 Structure (trade-offs behind cost, size and weight); 4 Control/Electrical; 5 Sensors/Payload/Tools (identify and evaluate sensors and tooling against mission requirements); 6 Safety; 7 Project Management (company roles, deliverables, budget, tasks and time); 8 Technical Presentation (documentation, presenting the design, marketing display, strengths and weaknesses); 9 Technology and Society (connects the theme and tasks to real problems, aware of ESG factors).

### The 26 competencies (`mate-rov.json` and its carrier): decision table

Rule applied: one to three core standards each (an ELA pair of grade bands 8 and 9-10 counts as one), `strong` only if the competency is an instance of the standard, `partial` for a real piece, no `related`. Class column: `all` unless MATE's manuals show otherwise.

| Code | Competency | Class | E-C skills | Standards (strength) |
|---|---|---|---|---|
| ENG.1 | Turn the request for proposals into criteria and constraints | all | GEN.7, GEN.3 | NGSS MS-ETS1-1 (strong), HS-ETS1-1 (strong); CTE C2.4 (partial) |
| ENG.2 | Compare design alternatives and justify the choice | all | GEN.7, GEN.2, ROV.3 | NGSS MS-ETS1-2 (strong), HS-ETS1-3 (strong) |
| ENG.3 | Budget power and protect against overcurrent | all, limits differ | ROV.4, ROV.6 | NGSS MS-ETS1-1 (partial); electricity standards left for later |
| ENG.4 | Build reliable electrical and mechanical systems (workmanship, strain relief, sealing, guarded propellers) | all | ROV.2, ROV.3, ROV.6 | CTE 7.5 (strong), C9.2 (partial) |
| ENG.5 | Design for the real environment and test under realistic conditions | all | ROV.1, GEN.7 | NGSS MS-ETS1-4 (partial); CA 9-12.AP.20 (partial) |
| ENG.6 | Control and operate a vehicle (control system, pilot interface, cameras, sensors) | all; cameras required Navigator and up | ROV.4, ROV.5, ROV.2 | CTE C9.5 (partial), C9.3 (partial) |
| ENG.7 | Sense, measure and calibrate | all | ROV.5, GEN.8 | CSTA 2026 HS-DAT-DC-24 (partial) |
| ENG.8 | Design and run a non-ROV device that works on its own (the profiling float) | all; demand rises by year | ROV.1, ROV.4, ROV.5 | AP CSP 3.6 (partial); CTE C9.5 (partial) |
| ENG.9 | Collect, transmit, analyze and graph data | all | ROV.5, GEN.7 | CSTA 2026 HS-DAT-DI-25 (strong); CA 9-12.DA.10 (partial); AP CSP 2.3 (partial) |
| ENG.10 | Do underwater work with purpose-built tools (recover, install, repair, release, survey) | all | ROV.5, GEN.2 | NGSS MS-ETS1-4 (partial) |
| ENG.11 | Test, troubleshoot and keep a record of what you learned | all | GEN.5, GEN.7 | CA 9-12.CS.3 (strong); CTE C5.6 (strong) |
| PRO.1 | Run the team as a company (roles, shared responsibility, deck crew) | all | GEN.9, ROV.7 | CA 9-12.AP.21 (strong); CSTA 2026 HS-PRO-PD-15 (strong); CASEL REL.4 (strong) |
| PRO.2 | Manage the project (work breakdown, schedule, budget, deadlines) | all; scored Navigator and up | ROV.7, GEN.3 | CASEL SM.5 (strong); CTE 7.4 (partial) |
| PRO.3 | Communicate technical work in writing and in person | all | ROV.8, GEN.1 | ELA W.8.2 and W.9-10.2 (strong); ELA SL.8.4 and SL.9-10.4 (strong); CA 9-12.AP.22 (strong) |
| PRO.4 | Communicate with a non-technical audience | all | GEN.1, ROV.8 | CTE 2.5 (strong); ELA SL.8.5 and SL.9-10.5 (partial) |
| PRO.5 | Think like an entrepreneur (business acumen, clients, financial decisions, ESG) | all | GEN.3, ROV.9 | CTE 11.3 (strong), 11.4 (partial) |
| PRO.6 | Work safely and manage hazards as industry does | all; JSEA Ranger | ROV.6 | CTE 6.6 (strong), 6.2 (partial) |
| PRO.7 | Know and follow the rules and standards | all | GEN.8 | CTE 10.2 (strong), 10.1 (partial) |
| PRO.8 | Use AI as a tool, not a crutch, and say how | in the 2026 Scout manual only (not in 2024 or 2025) | GEN.6, GEN.4 | CSTA 2026 HS-ALG-PS-05 (partial), HS-PRO-RD-18 (partial) |
| PRO.9 | Give back to the community (mentoring, outreach, with measurable impact) | all | ROV.9, GEN.9 | CTE 9.3 (strong); CASEL RDM.6 (partial) |
| UND.1 | Ocean observing and data | all | ROV.9, GEN.8 | NGSS MS-ESS3-3 (partial, to add) |
| UND.2 | Ecosystems, biodiversity and invasive species | all | ROV.9, GEN.8 | NGSS MS-LS2-5 (partial, to add), HS-LS2-7 (partial, to add); EP&C I.B (partial) |
| UND.3 | Climate and ocean change | all | ROV.9, GEN.8 | NGSS HS-ESS2-6 (partial, to add); EP&C III.C (strong), IV.B (partial) |
| UND.4 | Ocean energy and the sustainable ocean economy | all | ROV.9, GEN.8 | NGSS HS-ESS3-2 (partial, to add); EP&C II.B (partial) |
| UND.5 | People, heritage and risk | all | ROV.9, GEN.8 | EP&C V.A (partial) |
| UND.6 | Weigh environmental, social and governance factors in a decision | all | ROV.9, GEN.7 | EP&C V.A (strong); CASEL RDM.4 (partial); CSTA 2026 HS-SOC-ET-41 (partial) |

All codes above were checked against the repo's catalogs except the five "to add" NGSS expectations (MS-ESS3-3, MS-LS2-5, HS-LS2-7, HS-ESS2-6, HS-ESS3-2). Their codes exist (confirmed in NGSS course-mapping tables); their official wording could not be retrieved here, so Stage 3 fetches each expectation's page on nextgenscience.org, then paraphrases. HS-ESS3-2 has not been confirmed at all yet.

### Ocean Decade tags by task (MATE's own statements; `mate-missions` carrier; locator = year plus task)

| Year | Task | Challenges MATE tags |
|---|---|---|
| 2024 | 1 OOI Coastal Pioneer Array | 7 |
| 2024 | 2 SMART Cables for Ocean Observing | 7 |
| 2024 | 3 From the Red Sea to Tennessee (ecosystems, species) | 2 |
| 2024 | 4 MATE Floats | 5 |
| 2025 | 1 Shipwrecks, Spotter Buoys and Flying Fish | 2, 7, 8 |
| 2025 | 2 Marine Renewable Energy | 2, 4 |
| 2025 | 3 MATE Floats | 5, 7, 8 |
| 2026 | 1 Seabed 2030: coral garden | 2, 8 |
| 2026 | 2 SmartAtlantic Alliance | 2, 7 |
| 2026 | 3 Wind-Powered Offshore Oil Platform | 4, 5, 6, 7 |
| 2026 | 4 MATE Floats Under the Ice | 5, 7, 8 |
| 2026 | overarching | 9 and 10, as MATE labels them |

Observations for the page: the float is tagged every year, always with 5 and from 2025 with 7 and 8; Challenges 1 (pollution) and 3 (food) are never tagged in these three years.

### Other decisions made

- **ELA bands:** cite grades 8 and 9-10 together as one cross-reference, since every class spans grades 5 to 12 and the program teaches grades 6 to 12. Other bands exist in the catalog and can be added.
- **Class taxonomy:** Scout, Navigator, Ranger only, with MATE's grade eligibility and the ladder table.
- **cs50psets links:** the four hand-made links collapse to **ENG.8 only** (partial, both Profiling Float problems: PID holds depth in simulation, the judge reads a log). ENG.9 is a general data competency, not a float one; the Profiling Float problems do not have students collect, transmit or graph data, so they do not claim it.
- **Ocean Decade and lessons later:** the Vision 2030 page you saved lists ten white papers (June 2024), a video per Challenge, and expert Working Group profiles. These look like good future lesson material (and ocean careers, which MATE's workforce framing wants). Not cataloged now; noted for a later stage.
- **Evidence file:** `_program-notes/mate-evidence.md` (gitignored) records, per manual, each statement of aims with section, class and year; it is the coverage check.

## Stage 3 checklist (Sonnet, mechanical)

1. Write `_standards/mate-skills.json` (codes GEN.1 to GEN.9, ROV.1 to ROV.9), `_standards/ocean-decade.json` (codes OD.1 to OD.10 from the primary source, MATE's wording variants noted, plus the seven Outcomes as a second group), a classes catalog (SCOUT, NAVIGATOR, RANGER), and rebuild `_standards/mate-rov.json` (26 competencies) exactly from the tables above. Wording is written to the existing catalogs' style: own paraphrases, no dashes, manual spec codes only as identifiers.
2. Write `_standards/carriers/mate-rov.json` (competency to standards and to E-C skills, with `by_locator` reasons) and `_standards/carriers/mate-missions.json` from the tables; update `_standards/carriers/cs50psets.json`.
3. Add the five NGSS expectations to `_standards/ngss.json` after fetching their pages; if a page cannot be fetched, stop and ask.
4. Build the new start page at `standards/mate/index.html` (`render_mate_page`, writing into a `mate/` subfolder of the output; adjust `tools/publish_standards.sh` to copy it), retire the two old pages, remove MATE from `/standards/` as listed, run `tools/publish_standards.sh`.
5. Verify as in the Verification section; write `_program-notes/mate-evidence.md`; commit only my files.
If any step needs a judgment the tables do not answer, stop and return to plan mode.

## Open items

- The five NGSS expectations to add (MS-ESS3-3, MS-LS2-5, HS-LS2-7, HS-ESS2-6, HS-ESS3-2): their wording must be fetched from nextgenscience.org in Stage 3 (HS-ESS3-2 not yet confirmed to exist as I recalled it).
- Per-class rubric category sheets (Excel, on materovcompetition.org) not read; Ranger manual sections beyond those listed not read in full.
- Electricity standards are deliberately left alone for now.
