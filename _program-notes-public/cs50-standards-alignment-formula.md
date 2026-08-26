# Formula: adding a Glossary + Standards Alignment section to a CS50 pset page

Established on the Caesar page (`_cs50psets/caesar.md`), 2026-08-26. Repeat
this for every new page in `_cs50psets/` (and eventually the other
pathways). This is a manual/editorial procedure, not a script — it needs
judgment about which standards genuinely fit, so don't try to automate
the whole thing away.

## Where the source data lives

All of it is in the **sibling `working-in-python` source repo**, not in
this repo and not in `learn/working-in-python` (that's just the built
`gh-pages` mirror — editing it is pointless, the next submodule update
overwrites it). On this machine that's `/Users/ebrown/src/working-in-python`.

- `standards/apcsp.json` — AP CSP topics, each with a `code` (e.g. `"3.8"`),
  `title`, `paraphrase`, `los` (learning objective codes), and sometimes a
  `note` flagging scope gaps.
- `standards/castandards.json` — California 9-12 CS standards (`code` like
  `"9-12.DA.8"`).
- `standards/csta2026.json` — CSTA 2026 standards (`code` like
  `"HS-ALG-PS-02"`), each with a `scope_note`.
- `standards/ca-ict-anchor.json` — CA CTE ICT standards. The 11 broad
  cross-sector anchor standards are in `anchor_standards`; the specific,
  actually-useful-for-programming ones are nested under
  `pathway.standards[].items[]` (Pathway C, Software and Systems
  Development — codes like `"C4.9"`).
- `alignment/ap-vocabulary-glossary.md` — the class's one AP-tagged
  vocabulary list, `| **term** | AP | chapter | definition |` rows. Pull
  glossary definitions from here verbatim; don't invent new ones. Terms
  tagged `AP` in the second column are official AP CSP vocabulary.
- `alignment/*-standards-reference.html` — the published, human-readable
  versions of the four JSON files above, each entry with an anchor `id`.
  This is what you link to. **Anchor ID prefix differs by framework:**
  `T-<code>` for AP CSP, CSTA 2026, and CA ICT; `S-<code>` for California
  9-12. Always grep the actual HTML file to confirm the exact `id=` before
  writing a link — don't assume.

## Steps

1. **Read the pset page you're aligning** and list what it actually
   makes students do: which control structures, which functions/methods,
   what kind of data, what concept ties it together (e.g. Caesar =
   encryption; Mario = nested loops/pyramids; Palindromes = string
   processing; Square = 2D iteration + validation).

2. **Search each JSON file** for those concepts. Don't read the files
   whole — grep with context, e.g.:

   ```
   grep -n -i -B2 -A6 'cipher\|encrypt\|modul\|string\|loop\|argument' \
     /Users/ebrown/src/working-in-python/standards/apcsp.json
   ```

   Do this once per JSON file (apcsp, castandards, csta2026, ca-ict-anchor).
   For `ca-ict-anchor.json`, search `pathway.standards[].items[]`, not just
   `anchor_standards` — the anchor standards are too generic to cite
   ("Academics", "Technology"); the pathway items are the real content.

3. **Pick 2-4 per framework.** Prefer topic-level codes over deep
   sub-objective codes for AP CSP (cite `3.8`, not `AAP-2.K.4`) — that
   matches how `working-in-python` cites them and keeps the section
   short. If a standard only partially fits, or the CED/framework itself
   notes the deep material is out of scope (like AP CSP's IOC-2.B.5 —
   "specific mathematical procedures for encryption/decryption are
   outside course/exam scope"), still cite the topic but mark it
   **headers only** in the prose and say why. Never imply a standard is
   more thoroughly covered than it is.

4. **Confirm every anchor** by grepping the matching HTML file for the
   code and reading off its actual `id="..."` — do not guess the anchor
   from the code alone:

   ```
   grep -n '"T-3.8"\|"T-3.13"' /Users/ebrown/src/working-in-python/alignment/apcsp-standards-reference.html
   ```

5. **Pick 3-5 glossary terms** — only ones genuinely used by the
   problem, only ones tagged `AP` in `ap-vocabulary-glossary.md`, and
   copy their definitions verbatim (light trimming for length is fine,
   don't change the meaning). If the problem leans on a term/operator the
   exam calls something else (`%` → `MOD`, `=` → `←`, 0-based vs 1-based
   indexing — see `alignment/glossary-map.md`'s crosswalk table for the
   full list of these), that's worth a glossary entry of its own, same as
   Caesar's "modulus operator" entry.

6. **Write the section**, appended at the bottom of the pset's `.md`
   file, after Style and Submission. Two `<hr>`-separated blocks, both
   Title Case headings to match this site's existing heading style (the
   source repo itself uses "Standards alignment" lowercase — don't copy
   that part, just the citation format):

   ```markdown
   <hr>

   ## Glossary

   - **term** — Definition, copied from ap-vocabulary-glossary.md.
   - **term** — ...

   <hr>

   ## Standards Alignment

   **AP CSP:** [3.8 Iteration](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.8), [3.X Title](...#T-3.X) (Big Idea N, NN–NN% of the exam). Also [N.N Title](...#T-N.N), headers only — why.
   **California 9-12:** [9-12.XX.N](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.XX.N)
   **CSTA 2026:** [HS-XXX-YY-NN](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-XXX-YY-NN)
   **CA CTE (ICT):** [CN.N](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-CN.N) (Pathway C).

   One short paragraph (2-4 sentences) connecting the problem's actual
   mechanics to the cited codes by number — this is what makes the
   section worth reading instead of just a link dump.
   ```

   Big Idea / percentage parentheticals are optional flavor, not
   required for every line — only include them where you actually know
   the number (they're in `standards/apcsp.json`'s `big_ideas` array).

7. **Build and spot-check.** `bundle exec jekyll build`, then confirm
   each of the four `python.porttack.com/alignment/*.html` URLs returns
   200 (`curl -s -o /dev/null -w '%{http_code}\n' <url>`) before
   committing — these are external links this repo doesn't control.

## What this is *not*, yet

No back-references from the standards pages to these lesson pages.
That would mean editing `working-in-python`'s own alignment docs from
outside their repo, which pollutes a book-specific reverse-mapping with
CS50-pset-specific links it has no business carrying. The right fix,
later, is a `learn`-repo-owned copy of the standards framework with its
own reverse map — not this. For now this is one-directional: pset page
→ standards reference, never the other way.
