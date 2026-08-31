#!/usr/bin/env python3
"""Generate standards reference pages and coverage reports from standards/*.json
(catalog) + alignment/carriers/*.json (reverse map).

Usage:
  build_alignment.py --catalog _standards/ --carriers _standards/carriers/ --out <dir>
  build_alignment.py --catalog _standards/ --carriers _standards/carriers/ --out <dir> \
      --source working_in_python --scope-label "Working in Python"

With no --source, joins every carrier file in the carriers dir (the cross-source
view). With one or more --source, loads only those carrier files and treats every
other standard as uncarried -- this is how a single-book repo generates a
book-scoped view without knowing the wider course picture.

Outputs, into --out:
  apcsp-standards-reference.html
  ca-cs-standards-reference.html
  csta2026-standards-reference.html
  csta2017-standards-reference.html
  ca-ict-anchor-standards-reference.html
  standards-alignment.md   (by-locator, by-standard, and gap views, plus a
                             per-framework coverage summary)
  reports/<source-slug>.html   (one per loaded carrier, skipped if it covers
                                 nothing -- a short, printable "everything
                                 this source covers" page: a summary table,
                                 then full detail per standard)

Anchor scheme (fixed, matches existing external links -- do not change):
  T-<code>  AP CSP topics, CSTA 2026, CA ICT
  S-<code>  California 9-12, CSTA 2017
  bare P1..P6, bare big-idea ids (CRD/DAT/...), bare LO/EK codes
"""
import argparse
import html as htmlmod
import json
import re
from pathlib import Path

# Shared by CSS (the big sidebar+search reference-page template) and
# REPORT_CSS (the single-column, printable per-source report) so the two
# page styles never drift into two different color palettes.
ROOT_TOKENS = """
:root {
  --bg: #ffffff; --fg: #1b1f23; --muted: #57606a; --border: #d0d7de;
  --accent: #0969da; --code-bg: #f6f8fa; --topic-bg: #f6f8fa;
  --ek-bg: #fbfbfc;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0d1117; --fg: #e6edf3; --muted: #8b949e; --border: #30363d;
    --accent: #4493f8; --code-bg: #161b22; --topic-bg: #161b22; --ek-bg: #11151a; }
}
:root[data-theme="dark"] { --bg: #0d1117; --fg: #e6edf3; --muted: #8b949e; --border: #30363d;
  --accent: #4493f8; --code-bg: #161b22; --topic-bg: #161b22; --ek-bg: #11151a; }
:root[data-theme="light"] { --bg: #ffffff; --fg: #1b1f23; --muted: #57606a; --border: #d0d7de;
  --accent: #0969da; --code-bg: #f6f8fa; --topic-bg: #f6f8fa; --ek-bg: #fbfbfc; }
"""

CSS = ROOT_TOKENS + """* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.layout { display: flex; max-width: 1200px; margin: 0 auto; align-items: flex-start; }
nav.toc {
  position: sticky; top: 0; height: 100vh; overflow-y: auto; flex: 0 0 260px;
  padding: 1rem; border-right: 1px solid var(--border); font-size: 0.85rem;
}
nav.toc h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 1.2rem 0 .4rem; }
nav.toc ul { list-style: none; margin: 0; padding: 0; }
nav.toc li a { display: block; padding: .15rem 0; color: var(--fg); text-decoration: none; }
nav.toc li a:hover { color: var(--accent); }
nav.toc .topic-link { padding-left: .75rem; color: var(--muted); font-size: .82em; }
main { flex: 1 1 auto; min-width: 0; padding: 1.5rem 2rem 6rem; }
h1 { margin-top: 0; }
.provenance {
  border: 1px solid var(--border); background: var(--code-bg); border-radius: 8px;
  padding: .9rem 1.1rem; font-size: .92rem; color: var(--muted);
}
.provenance strong { color: var(--fg); }
#search {
  width: 100%; padding: .6rem .8rem; font-size: 1rem; border: 1px solid var(--border);
  border-radius: 8px; background: var(--bg); color: var(--fg); margin: 1rem 0;
}
.code-badge {
  display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .78em; background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 5px; padding: .05em .4em; color: var(--accent); white-space: nowrap;
}
.weight { font-size: .78rem; color: var(--muted); font-weight: normal; }
.anchor-link {
  color: var(--muted); text-decoration: none; margin-right: .35em; font-weight: normal;
  opacity: .5;
}
.anchor-link:hover { opacity: 1; color: var(--accent); }
section.big-idea { margin-top: 3rem; padding-top: 1rem; border-top: 3px solid var(--border); }
section.big-idea > h2 { font-size: 1.5rem; }
.carrier-line { color: var(--muted); font-size: .85rem; margin: .2rem 0 1rem; }
.subconcept-heading { font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin: 2rem 0 .5rem; }
.tier-heading { font-size: .82rem; font-weight: 600; color: var(--accent); margin: 1rem 0 .4rem 1rem; }
.topic {
  background: var(--topic-bg); border: 1px solid var(--border); border-radius: 10px;
  padding: 1rem 1.25rem; margin: 1.25rem 0;
}
.topic h3 { margin: 0 0 .3rem; font-size: 1.1rem; }
.topic .paraphrase { margin: .3rem 0; }
.topic .meta { font-size: .8rem; color: var(--muted); margin: .2rem 0 .8rem; }
.topic .note { font-size: .82rem; color: var(--muted); border-left: 3px solid var(--border); padding-left: .6rem; margin: .5rem 0; }
.lo { margin: .9rem 0 .9rem .2rem; }
.lo h4 { margin: 0 0 .25rem; font-size: 1rem; font-weight: 600; }
.lo h4 .lo-text { font-weight: normal; color: var(--fg); }
ul.ek-list { list-style: none; margin: .3rem 0 0; padding: 0; }
ul.ek-list li {
  background: var(--ek-bg); border: 1px solid var(--border); border-radius: 6px;
  padding: .35rem .6rem; margin: .3rem 0 .3rem 1.1rem; font-size: .92rem;
}
.item-meta { font-size: .8rem; color: var(--muted); margin: .2rem 0 .2rem 1.1rem; }
.item-note { font-size: .82rem; color: var(--muted); border-left: 3px solid var(--border); padding-left: .6rem; margin: .3rem 0 .5rem 1.1rem; }
.practice-table { width: 100%; border-collapse: collapse; margin: 1rem 0 2rem; }
.practice-table th, .practice-table td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid var(--border); }
.practice-table th { color: var(--muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
.hidden { display: none !important; }
footer { color: var(--muted); font-size: .8rem; margin-top: 3rem; border-top: 1px solid var(--border); padding-top: 1rem; }
:target { scroll-margin-top: 1rem; outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 6px; }
"""

SEARCH_JS = """
(function() {
  var input = document.getElementById('search');
  if (!input) return;
  var los = Array.from(document.querySelectorAll('.lo'));
  var topicsEls = Array.from(document.querySelectorAll('.topic'));
  function normalize(s) { return s.toLowerCase(); }
  input.addEventListener('input', function() {
    var q = normalize(input.value.trim());
    if (!q) {
      los.forEach(function(el) { el.classList.remove('hidden'); });
      topicsEls.forEach(function(el) { el.classList.remove('hidden'); });
      return;
    }
    topicsEls.forEach(function(topicEl) {
      var h = topicEl.querySelector('h3');
      var topicMatches = h ? normalize(h.textContent).indexOf(q) !== -1 : false;
      var anyVisible = false;
      var los2 = topicEl.querySelectorAll('.lo');
      if (los2.length === 0) {
        topicEl.classList.toggle('hidden', !topicMatches && normalize(topicEl.textContent).indexOf(q) === -1);
        return;
      }
      los2.forEach(function(loEl) {
        var text = normalize(loEl.textContent);
        var match = topicMatches || text.indexOf(q) !== -1;
        loEl.classList.toggle('hidden', !match);
        if (match) anyVisible = true;
      });
      topicEl.classList.toggle('hidden', !anyVisible && !topicMatches);
    });
  });
})();
"""

# A per-source report is a different document than CSS/page() above render --
# those are big, sidebar-navigated reference copies of an entire framework,
# built for on-screen browsing/searching. A report is short (only what one
# source actually covers, typically a few dozen entries at most) and exists
# to be printed and handed to someone, so it gets its own single-column
# template: no sidebar, no search box (nothing to search past what's already
# a skimmable page), a visible print button, and print rules tuned for a
# stack of short cards rather than the reference pages' long browsing session.
REPORT_CSS = ROOT_TOKENS + """* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
main { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
h1 { margin: 0 0 .2rem; }
.subtitle { color: var(--muted); margin: 0 0 1.3rem; }
.report-actions { display: flex; gap: 1.2rem; align-items: center; margin: 0 0 1.3rem; }
.print-button {
  font: inherit; font-size: .92rem; padding: .5rem 1rem; border-radius: 8px;
  border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer;
}
.report-actions a { color: var(--accent); font-size: .92rem; }
.provenance {
  border: 1px solid var(--border); background: var(--code-bg); border-radius: 8px;
  padding: .8rem 1rem; font-size: .88rem; color: var(--muted); margin: 0 0 1.6rem;
}
.provenance strong { color: var(--fg); }
h2 { margin: 2.2rem 0 .8rem; font-size: 1.3rem; }
.summary-table { width: 100%; border-collapse: collapse; margin: 0 0 2rem; font-size: .92rem; }
.summary-table th, .summary-table td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid var(--border); vertical-align: top; }
.summary-table th { color: var(--muted); font-size: .76rem; text-transform: uppercase; letter-spacing: .04em; }
.summary-table a { text-decoration: none; }
.fw-label { color: var(--muted); font-size: .82em; white-space: nowrap; }
.code-badge {
  display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .78em; background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 5px; padding: .05em .4em; color: var(--accent); white-space: nowrap;
}
.anchor-link { color: var(--muted); text-decoration: none; margin-right: .35em; font-weight: normal; opacity: .5; }
.anchor-link:hover { opacity: 1; color: var(--accent); }
.topic {
  background: var(--topic-bg); border: 1px solid var(--border); border-radius: 10px;
  padding: 1rem 1.25rem; margin: 1.1rem 0;
}
.topic h3 { margin: 0 0 .3rem; font-size: 1.05rem; display: flex; flex-wrap: wrap; gap: .5rem; align-items: baseline; }
.topic .paraphrase { margin: .3rem 0; }
.topic .meta { font-size: .84rem; color: var(--muted); margin: .2rem 0 .6rem; }
.topic .note { font-size: .86rem; color: var(--muted); border-left: 3px solid var(--border); padding-left: .6rem; margin: .5rem 0; }
.strength-tag { color: var(--muted); font-weight: normal; }
footer { color: var(--muted); font-size: .8rem; margin-top: 3rem; border-top: 1px solid var(--border); padding-top: 1rem; }
:target { scroll-margin-top: 1rem; outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 6px; }
@media print {
  .report-actions { display: none; }
  main { max-width: none; padding: 0 .3in; }
  .topic, tr { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  a[href^="http"]:after { content: " (" attr(href) ")"; font-size: .8em; color: var(--muted); }
}
"""


def report_page(title, subtitle_html, body_html, provenance_html, back_href):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>{REPORT_CSS}</style>
</head>
<body>
<main>
<h1>{esc(title)}</h1>
<p class="subtitle">{subtitle_html}</p>
<div class="report-actions">
<button class="print-button" onclick="window.print()">Print this page</button>
<a href="{esc(back_href)}">&larr; Back to Standards Coverage</a>
</div>
<div class="provenance">{provenance_html}</div>
{body_html}
<footer>Generated by build_alignment.py. Not an official framework document.</footer>
</main>
</body>
</html>
"""


def esc(s):
    return htmlmod.escape(s, quote=False) if s else ""


CHAP_REF_RE = re.compile(r"\bchap(\d{2})([a-z]?)\b")


def humanize_chapter_refs(text, interlude_letters=None):
    """Carrier notes are written by/for editors, who naturally use the book's own
    internal shorthand ("chap07", "chap07b") -- the same convention used throughout
    AUDIT.md and CHAPTER_MANIFEST.md. That shorthand means nothing to a reader of a
    published standards page, so displayed notes spell it out: "chap07" -> "Chapter 7",
    or "chap07b" -> "Interlude B" when that locator has an assigned interlude letter
    (matching how the carrier link itself displays it -- see _locator_clause).
    Applied at render time, not by editing the source notes, so authors can keep
    writing new notes the way they always have."""
    interlude_letters = interlude_letters or {}

    def repl(m):
        key = f"{int(m.group(1))}{m.group(2)}"
        if key in interlude_letters:
            return f"Interlude {interlude_letters[key]}"
        return f"Chapter {key}"

    return CHAP_REF_RE.sub(repl, text)


def load_json(path):
    return json.loads(Path(path).read_text())


class Coverage:
    """Joins catalog codes against loaded carrier files for one framework."""

    def __init__(self, carrier_files, framework, scoped):
        self.by_code = {}
        self.scoped = scoped
        self.source_meta = {source: data.get("meta", {}) for source, data in carrier_files.items()}
        for source, data in carrier_files.items():
            for code, entry in data.get("coverage", {}).get(framework, {}).items():
                self.by_code.setdefault(code, []).append((source, entry))

    def get(self, code):
        return self.by_code.get(code, [])

    def _locator_url(self, source, locator, anchor_slug):
        """Resolve a locator to a URL, or None if its source has no url template
        (little_brother, supplement -- nowhere to link yet). Always links to the
        static ?readonly view (no live JupyterLite pane), never the interactive
        notebook -- a chapter's live pane can interfere with anchor scrolling, and
        a reader clicking through from a standards page wants to read the content,
        not launch a kernel. A separate link to the live/interactive notebook view
        (python.porttack.com/current/notebooks/index.html?path=...) is a deferred,
        separate feature, not this one."""
        meta = self.source_meta.get(source, {})
        template = meta.get("locator_url_template")
        if not template:
            return None
        # Chapter locators zero-pad only the leading numeric run, e.g. 3 -> "03" and
        # the lettered interlude "7b" -> "07b" (never "7b" padded to width 2, which
        # would wrongly leave it unpadded since it's already 2 characters long).
        if meta.get("locator_kind") == "chapter":
            m = re.match(r"^(\d+)([a-zA-Z]*)$", str(locator))
            padded = f"{int(m.group(1)):02d}{m.group(2)}" if m else str(locator)
        else:
            padded = str(locator)
        url = template.format(base_url=meta.get("base_url", ""), locator=padded)
        url += f"?readonly#{anchor_slug}" if anchor_slug else "?readonly"
        return url

    def _locator_clause(self, source, locator, anchor):
        """"Chapter 9 (Lists)", or with a known section instead, "Chapter 4 – Defining
        new functions" -- the section title (specific to this standard) takes priority
        over the chapter's own title (generic, the same for every standard in that
        chapter) when both are known. A locator with an assigned interlude letter (an
        editorial label, e.g. "6b" -> "A") reads as "Interlude A" instead of "Chapter
        6b" -- display only, the URL still resolves from the underlying locator, since
        this is not a file/URL rename. Linked when the source has somewhere to link
        to, plain text otherwise."""
        meta = self.source_meta.get(source, {})
        interlude_letter = meta.get("interlude_letters", {}).get(str(locator))
        if interlude_letter:
            text = f"Interlude {interlude_letter}"
        else:
            noun = "Chapter" if meta.get("locator_kind") == "chapter" else "Unit"
            text = f"{noun} {locator}"
        section_title = anchor.get("title") if anchor else None
        chapter_title = meta.get("locator_titles", {}).get(str(locator))
        if section_title:
            text += f" – {section_title}"
        elif chapter_title:
            text += f" ({chapter_title})"
        url = self._locator_url(source, locator, anchor.get("slug") if anchor else None)
        return f'<a href="{esc(url)}">{esc(text)}</a>' if url else esc(text)

    def carrier_html(self, code):
        """None means: say nothing (used when --source scoping is active and this
        code has no coverage from the loaded source -- it may well be carried by a
        source this run was never given, and "unassigned" would be a false claim of
        a gap. Only the unscoped, all-sources view may claim "Unassigned". Returns
        HTML -- callers must NOT esc() the result."""
        entries = self.get(code)
        if not entries:
            return None if self.scoped else "Unassigned"
        parts = []
        for source, entry in entries:
            locs = entry.get("locators", [])
            anchors = entry.get("anchors", {})
            title = esc(self.source_meta.get(source, {}).get("title", source))
            if locs:
                clauses = ", ".join(self._locator_clause(source, loc, anchors.get(str(loc))) for loc in locs)
                strength = entry.get("strength")
                if strength and strength != "strong":
                    clauses += f" ({esc(strength)})"
                # In scoped (single-source) mode the source name is always the one
                # source this run was given -- redundant on every line, so drop it.
                # In the cross-source view, multiple sources are genuinely in play.
                parts.append(f"Covered in {clauses}" if self.scoped else f"Covered by {title}: {clauses}")
            elif entry.get("checked"):
                parts.append("Not covered" if self.scoped else f"Not covered by {title}")
            else:
                parts.append("Covered, no locator on record" if self.scoped else f"Covered by {title}, no locator on record")
        return "; ".join(parts)

    def coverage_summary(self, code):
        """(covering: list[str], total: int) -- of every source this Coverage was
        built from (self.source_meta), which ones actually cover `code`. Same
        covered/not-covered predicate carrier_html already applies: an entry counts
        as covering unless it's checked=true with empty locators (an explicit
        acknowledged gap, not silence)."""
        covering = [source for source, entry in self.get(code) if not (entry.get("checked") and not entry.get("locators"))]
        return covering, len(self.source_meta)

    def notes(self, code):
        return [
            humanize_chapter_refs(entry["note"], self.source_meta.get(source, {}).get("interlude_letters"))
            for source, entry in self.get(code)
            if entry.get("note")
        ]


def load_carrier_files(carriers_dir, sources):
    files = {}
    for path in sorted(Path(carriers_dir).glob("*.json")):
        data = load_json(path)
        source = data["meta"]["source"]
        if sources and source not in sources:
            continue
        files[source] = data
    return files


# ---------- AP CSP ----------

def render_apcsp(catalog, cov, scope_label):
    big_ideas = {b["id"]: b for b in catalog["big_ideas"]}
    practices = catalog["practices"]
    topics_by_bi = {}
    for t in catalog["topics"]:
        topics_by_bi.setdefault(t["big_idea"], []).append(t)

    toc = ['<h2>Practices</h2>', "<ul>"]
    for p in practices:
        toc.append(f'<li><a href="#{p["id"]}">{p["id"]} {esc(p["name"])}</a></li>')
    toc.append("</ul>")
    for num, bi in sorted(big_ideas.items(), key=lambda kv: kv[1]["number"]):
        toc.append(f'<h2><a href="#{bi["id"]}">Big Idea {bi["number"]} · {esc(bi["name"])}</a></h2><ul>')
        for t in topics_by_bi.get(bi["id"], []):
            toc.append(f'<li class="topic-link"><a href="#T-{t["code"]}">{t["code"]} {esc(t["title"])}</a></li>')
        toc.append("</ul>")

    body = ['<section id="practices"><h2>Computational Thinking Practices</h2>',
            '<table class="practice-table"><thead><tr><th>Code</th><th>Name</th><th>MCQ weight</th></tr></thead><tbody>']
    for p in practices:
        weight = f'{p["mcq_weight_low"]}–{p["mcq_weight_high"]}%' if p.get("mcq_weight_low") is not None else "Create PT only (not on MCQ)"
        body.append(f'<tr id="{p["id"]}"><td><a class="anchor-link" href="#{p["id"]}">#</a><span class="code-badge">{p["id"]}</span></td><td>{esc(p["name"])}</td><td>{weight}</td></tr>')
    body.append("</tbody></table></section>")

    for num, bi in sorted(big_ideas.items(), key=lambda kv: kv[1]["number"]):
        body.append(f'<section class="big-idea" id="{bi["id"]}">')
        body.append(f'<h2><a class="anchor-link" href="#{bi["id"]}">#</a><span class="code-badge">{bi["id"]}</span> Big Idea {bi["number"]}: {esc(bi["name"])} <span class="weight">({bi["mcq_weight_low"]}–{bi["mcq_weight_high"]}% MCQ)</span></h2>')
        for t in topics_by_bi.get(bi["id"], []):
            body.append(f'<div class="topic" id="T-{t["code"]}">')
            body.append(f'<h3><a class="anchor-link" href="#T-{t["code"]}">#</a><span class="code-badge">{t["code"]}</span> {esc(t["title"])}</h3>')
            body.append(f'<p class="paraphrase">{esc(t["paraphrase"])}</p>')
            line = cov.carrier_html(t["code"])
            if line:
                body.append(f'<p class="meta">{line}</p>')
            for note in cov.notes(t["code"]):
                body.append(f'<p class="note">{esc(note)}</p>')
            for ex in t.get("exclusions", []):
                body.append(f'<p class="note">Out of scope: {esc(ex)}</p>')
            for lo in t.get("los", []):
                body.append(f'<div class="lo" id="{lo["code"]}">')
                body.append(f'<h4><a class="anchor-link" href="#{lo["code"]}">#</a><span class="code-badge">{lo["code"]}</span> <span class="lo-text">{esc(lo["text"])}</span></h4>')
                body.append('<ul class="ek-list">')
                for ek in lo.get("eks", []):
                    body.append(f'<li id="{ek["code"]}"><a class="anchor-link" href="#{ek["code"]}">#</a><span class="code-badge">{ek["code"]}</span> {esc(ek["text"])}</li>')
                body.append("</ul></div>")
            body.append("</div>")
        body.append("</section>")

    provenance = f"""<strong>What this is.</strong> A locally built index of the AP Computer Science Principles
framework — Practices, Big Ideas, Topics, Learning Objectives, and Essential Knowledge —
for linking from standards-alignment work ({esc(catalog['meta']['ced_version'])}).
<strong>What this is not.</strong> Every sentence of description below is an original
paraphrase, not College Board's text. Only the AP-assigned codes are reproduced as-is."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'

    return page("AP CSP Standards Reference", "\n".join(toc), "\n".join(body), provenance)


# ---------- California 9-12 ----------

def render_castandards(catalog, cov, scope_label):
    by_strand = {}
    for s in catalog["standards"]:
        by_strand.setdefault(s["strand"], []).append(s)
    strand_names = {s["strand"]: s["strand_name"] for s in catalog["standards"]}

    toc = []
    for strand in sorted(by_strand):
        toc.append(f'<h2><a href="#{strand}">{strand} · {esc(strand_names[strand])}</a></h2><ul>')
        for s in by_strand[strand]:
            toc.append(f'<li class="topic-link"><a href="#S-{s["code"]}">{s["code"]}</a></li>')
        toc.append("</ul>")

    body = []
    for strand in sorted(by_strand):
        body.append(f'<section class="big-idea" id="{strand}">')
        body.append(f'<h2><a class="anchor-link" href="#{strand}">#</a><span class="code-badge">{strand}</span> {esc(strand_names[strand])}</h2>')
        # A strand (e.g. "AP") spans multiple grade bands -- 6-8, 9-12, and the
        # separate non-core "9-12 Specialty" pathway -- with the same strand
        # name in each, so grouping strictly by grade_band within the strand
        # is what actually tells them apart, rather than leaving that to a
        # code prefix easy to skim past.
        by_band = {}
        band_order = []
        for s in by_strand[strand]:
            band = s.get("grade_band", "")
            if band not in by_band:
                band_order.append(band)
            by_band.setdefault(band, []).append(s)
        show_band = len(band_order) > 1
        for band in band_order:
            if show_band:
                body.append(f'<div class="tier-heading">{esc(band)}</div>')
            for s in by_band[band]:
                body.append(f'<div class="topic" id="S-{s["code"]}">')
                body.append(f'<h3><a class="anchor-link" href="#S-{s["code"]}">#</a><span class="code-badge">{s["code"]}</span></h3>')
                body.append(f'<p class="paraphrase">{esc(s["paraphrase"])}</p>')
                if s.get("scope_note"):
                    body.append(f'<p class="note">{esc(s["scope_note"])}</p>')
                line = cov.carrier_html(s["code"])
                if line:
                    body.append(f'<p class="meta">{line}</p>')
                for note in cov.notes(s["code"]):
                    body.append(f'<p class="note">{esc(note)}</p>')
                body.append("</div>")
        body.append("</section>")

    provenance = """<strong>What this is.</strong> A locally built index of California's 9-12 Computer
Science core standards (adopted 2018), for linking from standards-alignment work.
<strong>What this is not.</strong> Original paraphrases, not the CDE's text; only codes
are reproduced as-is."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'
    return page("CA CS Standards Reference", "\n".join(toc), "\n".join(body), provenance)


# ---------- CSTA 2017 ----------

def render_csta2017(catalog, cov, scope_label):
    by_strand = {}
    for s in catalog["standards"]:
        by_strand.setdefault(s["strand"], []).append(s)
    strand_names = {s["strand"]: s["strand_name"] for s in catalog["standards"]}

    toc = []
    for strand in sorted(by_strand):
        toc.append(f'<h2><a href="#{strand}">{strand} · {esc(strand_names[strand])}</a></h2><ul>')
        for s in by_strand[strand]:
            toc.append(f'<li class="topic-link"><a href="#S-{s["code"]}">{s["code"]}</a></li>')
        toc.append("</ul>")

    body = []
    for strand in sorted(by_strand):
        body.append(f'<section class="big-idea" id="{strand}">')
        body.append(f'<h2><a class="anchor-link" href="#{strand}">#</a><span class="code-badge">{strand}</span> {esc(strand_names[strand])}</h2>')
        for s in by_strand[strand]:
            body.append(f'<div class="topic" id="S-{s["code"]}">')
            body.append(f'<h3><a class="anchor-link" href="#S-{s["code"]}">#</a><span class="code-badge">{s["code"]}</span></h3>')
            if not s.get("core", True):
                body.append('<p class="note">Level 3B: elective/specialty, not required of all students.</p>')
            body.append(f'<p class="paraphrase">{esc(s["paraphrase"])}</p>')
            line = cov.carrier_html(s["code"])
            if line:
                body.append(f'<p class="meta">{line}</p>')
            for note in cov.notes(s["code"]):
                body.append(f'<p class="note">{esc(note)}</p>')
            body.append("</div>")
        body.append("</section>")

    provenance = """<strong>What this is.</strong> A locally built index of the CSTA K-12 Computer
Science Standards, Revised 2017 (Computer Science Teachers Association) -- Level 2 (grades 6-8)
and, merged into one 9-12 band, Levels 3A (grades 9-10, required of all students) and 3B (grades
11-12, elective/specialty, marked as such below), for linking from standards-alignment work.
<strong>What this is not.</strong> Original paraphrases, not CSTA's text; only codes are reproduced
as-is. See _standards/crosswalk-castandards-csta2017.json for how these compare to California's own
K-12 CS standards -- most match closely, but a few diverge in wording or don't correspond to any
single CA standard."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'
    return page("CSTA 2017 Standards Reference", "\n".join(toc), "\n".join(body), provenance)


# ---------- CSTA 2026 ----------

# A standard's code prefix (before the first hyphen) is its level/tier:
# MS/HS for the core Middle School/High School bands, S1/S2 for the two
# elective Specialty tiers. A concept or subconcept name is shared across
# tiers (e.g. "Algorithmic Problem Solving" holds both MS-* and HS-* codes;
# a Specialty subconcept like "Hardware & Circuit Design" holds both S1-*
# and S2-* codes), so the tier itself has to be rendered explicitly -- a
# reader skimming a grid of similar-looking codes shouldn't have to parse
# the badge prefix by hand to tell them apart.
LEVEL_LABELS = {"MS": "Middle School", "HS": "High School", "S1": "Specialty I", "S2": "Specialty II"}


def render_csta2026(catalog, cov, scope_label):
    by_concept = {}
    for s in catalog["standards"]:
        by_concept.setdefault(s["concept"], []).append(s)

    toc = []
    for concept in sorted(by_concept):
        slug = re.sub(r"\W+", "", concept)
        toc.append(f'<h2><a href="#{slug}">{esc(concept)}</a></h2><ul>')
        for s in by_concept[concept]:
            toc.append(f'<li class="topic-link"><a href="#T-{s["code"]}">{s["code"]}</a></li>')
        toc.append("</ul>")

    body = []
    for concept in sorted(by_concept):
        slug = re.sub(r"\W+", "", concept)
        body.append(f'<section class="big-idea" id="{slug}"><h2>{esc(concept)}</h2>')
        by_sub = {}
        for s in by_concept[concept]:
            by_sub.setdefault(s.get("subconcept", ""), []).append(s)
        for sub in sorted(by_sub):
            if sub:
                body.append(f'<div class="subconcept-heading">{esc(sub)}</div>')
            by_tier = {}
            tier_order = []
            for s in by_sub[sub]:
                tier = LEVEL_LABELS.get(s["code"].split("-")[0], s["code"].split("-")[0])
                if tier not in by_tier:
                    tier_order.append(tier)
                by_tier.setdefault(tier, []).append(s)
            show_tier = len(tier_order) > 1
            for tier in tier_order:
                if show_tier:
                    body.append(f'<div class="tier-heading">{esc(tier)}</div>')
                for s in by_tier[tier]:
                    body.append(f'<div class="topic" id="T-{s["code"]}">')
                    body.append(f'<h3><a class="anchor-link" href="#T-{s["code"]}">#</a><span class="code-badge">{s["code"]}</span></h3>')
                    body.append(f'<p class="paraphrase">{esc(s["paraphrase"])}</p>')
                    if s.get("scope_note"):
                        body.append(f'<p class="note">{esc(s["scope_note"])}</p>')
                    line = cov.carrier_html(s["code"])
                    if line:
                        body.append(f'<p class="meta">{line}</p>')
                    for note in cov.notes(s["code"]):
                        body.append(f'<p class="note">{esc(note)}</p>')
                    body.append("</div>")
        body.append("</section>")

    provenance = """<strong>What this is.</strong> A locally built index of the CSTA 2026 K-12 Computer
Science Standards (high-school level), for linking from standards-alignment work.
<strong>What this is not.</strong> Original paraphrases, not CSTA's text; only codes are
reproduced as-is."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'
    return page("CSTA 2026 Standards Reference", "\n".join(toc), "\n".join(body), provenance)

    provenance = """<strong>What this is.</strong> A locally built index of the CSTA 2026 K-12 Computer
Science Standards (high-school level), for linking from standards-alignment work.
<strong>What this is not.</strong> Original paraphrases, not CSTA's text; only codes are
reproduced as-is."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'
    return page("CSTA 2026 Standards Reference", "\n".join(toc), "\n".join(body), provenance)


# ---------- CA CTE ICT ----------

def render_ca_ict(catalog, cov, scope_label):
    def render_group(grp, prefix, anchor_id):
        out = [f'<div class="topic" id="T-{grp["code"]}">']
        out.append(f'<h3><a class="anchor-link" href="#T-{grp["code"]}">#</a><span class="code-badge">{grp["code"]}</span> {esc(grp["name"])}</h3>')
        out.append(f'<p class="paraphrase">{esc(grp["paraphrase"])}</p>')
        grp_line = cov.carrier_html(grp["code"])
        if grp_line:
            out.append(f'<p class="meta">{grp_line}</p>')
        if grp.get("items"):
            out.append('<ul class="ek-list">')
            for item in grp["items"]:
                out.append(f'<li id="T-{item["code"]}"><a class="anchor-link" href="#T-{item["code"]}">#</a><span class="code-badge">{item["code"]}</span> {esc(item["paraphrase"])}')
                line = cov.carrier_html(item["code"])
                if line:
                    out.append(f'<div class="item-meta">{line}</div>')
                for note in cov.notes(item["code"]):
                    out.append(f'<div class="item-note">{esc(note)}</div>')
                out.append("</li>")
            out.append("</ul>")
        out.append("</div>")
        return out

    toc = ['<h2><a href="#anchors">Anchor Standards</a></h2><ul>']
    for grp in catalog["anchor_standards"]:
        toc.append(f'<li class="topic-link"><a href="#anchor-{grp["code"]}">{grp["code"]} {esc(grp["name"])}</a></li>')
    toc.append(f'</ul><h2><a href="#pathwayC">Pathway C · {esc(catalog["pathway"]["name"])}</a></h2><ul>')
    for grp in catalog["pathway"]["standards"]:
        toc.append(f'<li class="topic-link"><a href="#pathwayC-{grp["code"]}">{grp["code"]} {esc(grp["name"])}</a></li>')
    toc.append("</ul>")

    body = ['<h2 id="anchors">Anchor Standards</h2>']
    for grp in catalog["anchor_standards"]:
        body += render_group(grp, "anchor", f'anchor-{grp["code"]}')
    body.append(f'<h2 id="pathwayC">Pathway C · {esc(catalog["pathway"]["name"])}</h2>')
    body.append(f'<p class="paraphrase">{esc(catalog["pathway"]["description"])}</p>')
    for grp in catalog["pathway"]["standards"]:
        body += render_group(grp, "pathwayC", f'pathwayC-{grp["code"]}')

    provenance = """<strong>What this is.</strong> A locally built index of California's CTE Model
Curriculum Standards, ICT sector (2013): the 11 cross-sector anchor standards plus
Pathway C (Software and Systems Development). <strong>What this is not.</strong> Original
paraphrases, not the CDE's text; only codes are reproduced as-is."""
    if scope_label:
        provenance += f' <strong>Scope.</strong> This copy shows only what {esc(scope_label)} carries.'
    return page("CA ICT & Anchor Standards Reference", "\n".join(toc), "\n".join(body), provenance)


# ---------- Per-source report: everything one carrier covers, one page ----------
#
# The five render_* functions above each walk their own framework's full
# catalog and annotate coverage in passing -- right for "here is everything
# in AP CSP, and here's what carries which part of it." A report inverts
# that: start from one carrier's own coverage dict, across all five
# frameworks, and skip every code it doesn't touch. Meant to be linked from
# (or embedded in) that source's own page -- see #only-banner and the
# sidebar's "only" link in standards-coverage.js/standards/index.html for
# the interactive-map equivalent of this same "just this one source" idea.

FRAMEWORK_HEADINGS = {
    "apcsp": "AP Computer Science Principles",
    "castandards": "California Computer Science Standards",
    "csta2026": "CSTA 2026",
    "csta2017": "CSTA 2017",
    "ca-ict-anchor": "California CTE (ICT)",
}

# Matches the fixed anchor scheme documented at the top of this file (T- for
# AP CSP/CSTA 2026/CA ICT, S- for California 9-12/CSTA 2017) so a report's
# anchors line up with the same code's anchor on that framework's own
# reference page -- a link built from one transfers to the other unchanged.
ANCHOR_PREFIX = {"apcsp": "T", "castandards": "S", "csta2026": "T", "csta2017": "S", "ca-ict-anchor": "T"}


def build_catalog_index(catalogs):
    """framework -> code -> {paraphrase, scope_note, title, label}, flattened
    out of each framework's own nested catalog shape (topics/big ideas,
    strand/grade-band standards, concept/tier standards, anchor+pathway
    groups-with-items) so render_source_report can look up any covered code
    by (framework, code) without re-deriving that shape itself. `label` is a
    human-readable, code-specific framework name -- e.g. distinguishing
    "CSTA 2026 (Specialty I)" from "CSTA 2026 (High School)", since both
    share one catalog file and a bare framework name would blur them."""
    index = {}

    index["apcsp"] = {
        t["code"]: {"paraphrase": t["paraphrase"], "scope_note": None, "title": t.get("title"),
                     "label": FRAMEWORK_HEADINGS["apcsp"]}
        for t in catalogs["apcsp"]["topics"]
    }

    castandards_idx = {}
    for s in catalogs["castandards"]["standards"]:
        band = s.get("grade_band", "")
        castandards_idx[s["code"]] = {
            "paraphrase": s["paraphrase"], "scope_note": s.get("scope_note"), "title": None,
            "label": f"California {band} Computer Science",
        }
    index["castandards"] = castandards_idx

    csta2017_idx = {}
    for s in catalogs["csta2017"]["standards"]:
        band = s.get("grade_band", "")
        tail = ", Level 3B elective" if not s.get("core", True) else ""
        csta2017_idx[s["code"]] = {
            "paraphrase": s["paraphrase"], "scope_note": s.get("scope_note"), "title": None,
            "label": f"CSTA 2017 ({band}{tail})",
        }
    index["csta2017"] = csta2017_idx

    csta2026_idx = {}
    for s in catalogs["csta2026"]["standards"]:
        tier = LEVEL_LABELS.get(s["code"].split("-")[0], s["code"].split("-")[0])
        csta2026_idx[s["code"]] = {
            "paraphrase": s["paraphrase"], "scope_note": s.get("scope_note"), "title": None,
            "label": f"CSTA 2026 ({tier})",
        }
    index["csta2026"] = csta2026_idx

    ict_idx = {}
    def add_ict_group(grp, label):
        ict_idx[grp["code"]] = {"paraphrase": grp["paraphrase"], "scope_note": None, "title": grp["name"], "label": label}
        for item in grp.get("items", []):
            ict_idx[item["code"]] = {"paraphrase": item["paraphrase"], "scope_note": None, "title": None, "label": label}
    for grp in catalogs["ca-ict-anchor"]["anchor_standards"]:
        add_ict_group(grp, FRAMEWORK_HEADINGS["ca-ict-anchor"] + " — Anchor Standards")
    pathway_name = catalogs["ca-ict-anchor"]["pathway"]["name"]
    for grp in catalogs["ca-ict-anchor"]["pathway"]["standards"]:
        add_ict_group(grp, f'{FRAMEWORK_HEADINGS["ca-ict-anchor"]} — Pathway C: {pathway_name}')
    index["ca-ict-anchor"] = ict_idx

    return index


def render_source_report(slug, carrier, catalog_index):
    """None if this carrier covers nothing (an empty/stub carrier file) --
    callers should skip writing a file rather than publish a blank report."""
    meta = carrier.get("meta", {})
    title = meta.get("title", slug)

    entries = []  # (framework, code, catalog_entry, coverage_entry, locator_html)
    for fw in FRAMEWORK_HEADINGS:
        cov_dict = carrier.get("coverage", {}).get(fw, {})
        if not cov_dict:
            continue
        cov = Coverage({slug: carrier}, fw, scoped=True)
        for code in sorted(cov_dict):
            centry = cov_dict[code]
            if centry.get("checked") and not centry.get("locators"):
                continue  # an acknowledged gap, not coverage -- this report is only what it DOES cover
            cat = catalog_index.get(fw, {}).get(code)
            if not cat:
                continue  # a code the carrier cites that isn't in the catalog shouldn't happen, but don't crash a report over it
            entries.append((fw, code, cat, centry, cov.carrier_html(code)))

    if not entries:
        return None

    def strength_tag(centry):
        s = centry.get("strength")
        return f' <span class="strength-tag">({esc(s)})</span>' if s and s != "strong" else ""

    summary_rows = []
    for fw, code, cat, centry, _locator_html in entries:
        anchor = f"{ANCHOR_PREFIX[fw]}-{code}"
        summary_rows.append(
            f'<tr><td><a href="#{esc(anchor)}"><span class="code-badge">{esc(code)}</span></a></td>'
            f'<td class="fw-label">{esc(cat["label"])}</td>'
            f'<td>{esc(cat["paraphrase"])}{strength_tag(centry)}</td></tr>'
        )
    summary_html = (
        '<h2 id="summary">Summary</h2>'
        '<table class="summary-table"><thead><tr><th>Code</th><th>Framework</th><th>What it asks for</th></tr></thead>'
        f'<tbody>{"".join(summary_rows)}</tbody></table>'
    )

    detail_parts = []
    current_fw = None
    for fw, code, cat, centry, locator_html in entries:
        if fw != current_fw:
            if current_fw is not None:
                detail_parts.append("</section>")
            detail_parts.append(f'<section><h2>{esc(FRAMEWORK_HEADINGS[fw])}</h2>')
            current_fw = fw
        anchor = f"{ANCHOR_PREFIX[fw]}-{code}"
        title_bit = f" {esc(cat['title'])}" if cat.get("title") else ""
        detail_parts.append(f'<div class="topic" id="{esc(anchor)}">')
        detail_parts.append(
            f'<h3><a class="anchor-link" href="#{esc(anchor)}">#</a><span class="code-badge">{esc(code)}</span>'
            f'{title_bit} <span class="fw-label">{esc(cat["label"])}</span></h3>'
        )
        detail_parts.append(f'<p class="paraphrase">{esc(cat["paraphrase"])}</p>')
        if cat.get("scope_note"):
            detail_parts.append(f'<p class="note">{esc(cat["scope_note"])}</p>')
        # locator_html (from Coverage.carrier_html) already appends "(partial)"/
        # "(related)" itself when set -- unlike the summary table's row, which
        # has no locator clause of its own to carry it, so strength_tag() is
        # only needed there, not here too.
        detail_parts.append(f'<p class="meta">{locator_html}</p>')
        if centry.get("note"):
            note = humanize_chapter_refs(centry["note"], meta.get("interlude_letters"))
            detail_parts.append(f'<p class="note">{esc(note)}</p>')
        detail_parts.append("</div>")
    detail_parts.append("</section>")

    frameworks_touched = len({fw for fw, *_ in entries})
    subtitle = f"{len(entries)} standard{'s' if len(entries) != 1 else ''} across {frameworks_touched} framework{'s' if frameworks_touched != 1 else ''}"
    base_url = meta.get("base_url")
    provenance = f'<strong>What this is.</strong> Every standard {esc(title)} is recorded as covering, generated from this project’s standards-alignment data ({esc(subtitle)}).'
    if base_url:
        provenance += f' <strong>Source.</strong> <a href="{esc(base_url)}">{esc(base_url)}</a>'

    body = summary_html + "".join(detail_parts)
    return report_page(f"{title} — Standards Alignment", esc(subtitle), body, provenance, f"../?only={esc(slug)}")


def page(title, toc_html, body_html, provenance_html):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>{CSS}</style>
</head>
<body>
<div class="layout">
<nav class="toc" aria-label="Table of contents">
{toc_html}
</nav>
<main>
<h1>{esc(title)}</h1>
<div class="provenance">{provenance_html}</div>
<input id="search" type="search" placeholder="Filter by code or text…" aria-label="Filter standards">
{body_html}
<footer>Generated by build_alignment.py. Not an official framework document.</footer>
</main>
</div>
<script>{SEARCH_JS}</script>
</body>
</html>
"""


# ---------- Markdown coverage report ----------

def build_markdown(catalogs, covs, carrier_files, scope_label):
    lines = [f"# Standards Alignment{' -- ' + scope_label if scope_label else ''}", "",
             "Generated by `build_alignment.py`. Do not hand-edit.", ""]

    scoped = bool(scope_label)
    other_col = "Not carried by this source" if scoped else "Unassigned"
    gaps_heading = "## Not carried by this source" if scoped else "## Gaps (unassigned everywhere)"
    gaps_caveat = (
        "\nMay be carried by a source outside this repo's view -- this is not a claim "
        "that these are real gaps, only that this source doesn't cover them. See "
        "learn.porttack.com/standards/alignment/ for the cross-source picture.\n"
        if scoped else ""
    )

    lines.append("## Coverage summary")
    lines.append("")
    lines.append(f"| Framework | Codes | Carried | {other_col} |")
    lines.append("|---|---|---|---|")
    fw_entries = {
        "apcsp": [t["code"] for t in catalogs["apcsp"]["topics"]],
        "castandards": [s["code"] for s in catalogs["castandards"]["standards"]],
        "csta2026": [s["code"] for s in catalogs["csta2026"]["standards"]],
        "csta2017": [s["code"] for s in catalogs["csta2017"]["standards"]],
        "ca-ict-anchor": [i["code"] for grp in catalogs["ca-ict-anchor"]["anchor_standards"] + catalogs["ca-ict-anchor"]["pathway"]["standards"] for i in grp.get("items", [])],
    }
    for fw, codes in fw_entries.items():
        carried = sum(1 for c in codes if covs[fw].get(c))
        lines.append(f"| {fw} | {len(codes)} | {carried} | {len(codes) - carried} |")
    lines.append("")

    lines.append("## By source")
    lines.append("")
    for source in sorted(carrier_files):
        title = carrier_files[source]["meta"].get("title", source)
        lines.append(f"### {title} {{#{source}}}")
        for fw, entries in carrier_files[source].get("coverage", {}).items():
            codes = sorted(entries)
            if codes:
                lines.append(f"- **{fw}:** {', '.join(codes)}")
        lines.append("")

    lines.append(gaps_heading)
    lines.append(gaps_caveat)
    for fw, codes in fw_entries.items():
        gaps = [c for c in codes if not covs[fw].get(c)]
        if gaps:
            lines.append(f"- **{fw}:** {', '.join(gaps)}")
    lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--carriers", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--source", action="append", default=[])
    ap.add_argument("--scope-label", default=None)
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    catalogs = {name: load_json(Path(args.catalog) / f"{name}.json") for name in ["apcsp", "castandards", "csta2026", "csta2017", "ca-ict-anchor"]}
    sources = set(args.source) if args.source else None
    carrier_files = load_carrier_files(args.carriers, sources)

    covs = {fw: Coverage(carrier_files, fw, scoped=bool(sources)) for fw in catalogs}

    (out / "apcsp-standards-reference.html").write_text(render_apcsp(catalogs["apcsp"], covs["apcsp"], args.scope_label))
    (out / "ca-cs-standards-reference.html").write_text(render_castandards(catalogs["castandards"], covs["castandards"], args.scope_label))
    (out / "csta2026-standards-reference.html").write_text(render_csta2026(catalogs["csta2026"], covs["csta2026"], args.scope_label))
    (out / "csta2017-standards-reference.html").write_text(render_csta2017(catalogs["csta2017"], covs["csta2017"], args.scope_label))
    (out / "ca-ict-anchor-standards-reference.html").write_text(render_ca_ict(catalogs["ca-ict-anchor"], covs["ca-ict-anchor"], args.scope_label))
    (out / "standards-alignment.md").write_text(build_markdown(catalogs, {k: v.by_code for k, v in covs.items()}, carrier_files, args.scope_label))

    # One printable report per loaded carrier -- same carrier_files this run
    # already loaded (all of them unscoped, or just the --source ones when
    # scoped), so a report never claims coverage from a source this run
    # wasn't given. Skipped for a carrier with nothing covered (an empty/stub
    # file) rather than publishing a blank page.
    catalog_index = build_catalog_index(catalogs)
    reports_dir = out / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_slugs = []
    for slug, carrier in carrier_files.items():
        html = render_source_report(slug, carrier, catalog_index)
        if html is None:
            continue
        (reports_dir / f"{slug}.html").write_text(html)
        report_slugs.append(slug)

    print(f"Wrote 6 files to {out}/ from {len(carrier_files)} carrier source(s): {sorted(carrier_files)}")
    print(f"Wrote {len(report_slugs)} per-source report(s) to {reports_dir}/: {sorted(report_slugs)}")


if __name__ == "__main__":
    main()
