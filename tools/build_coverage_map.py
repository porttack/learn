#!/usr/bin/env python3
"""Coverage map: a combined-source visual coverage grid.

Answers a different question than build_alignment.py's reference pages do.
Those answer "what does this code mean and who cites it," one code at a
time. This answers "across everything we teach, roughly how much of each
framework do we cover, and which course covers which piece" -- at a glance,
for an admin audience.

One badge per leaf standard (AP Topic, CA/CSTA standard, ICT item). Coverage
is shown as a row of small strips beneath the badge, one strip per source in
view, lit in that source's own color if it covers this standard, dim
otherwise -- a fixed position per source, so "which one is missing" reads
positionally without a legend lookup. This scales by adding a strip (five to
ten sources is still a short row), unlike trying to split the badge's own
fill into more and more slivers. Big-Idea/Strand/Concept/Anchor grouping is
conveyed only by its heading text -- no color -- since color there was
carrying no real information, just decoration. Click (or Enter/Space if
focused) opens a small detail panel per badge, reusing the exact same
phrasing Coverage.carrier_html/_locator_clause already produce -- following
this site's own established disclosure-panel convention (see
_cs50psets/pathfinder.md's quickref toggle), since no hover-tooltip pattern
exists anywhere on the site to retrofit.

Usage:
  build_coverage_map.py --catalog _standards --carriers _standards/carriers \\
      --out standards --source working_in_python --source little_brother \\
      --title "Working in Python + Little Brother"
"""
import argparse
from pathlib import Path

from build_alignment import CSS as BASE_CSS
from build_alignment import esc, load_carrier_files, load_json

# Validated this session: node scripts/validate_palette.js "<hexes>" --mode light/dark,
# both PASS every hard gate on the *adjacent* pairlist (worst adjacent CVD ~9 light /
# ~8 dark) -- the right check here, since strips render in this same fixed order every
# time, so only neighboring strips are ever actually adjacent. One slot per content
# source; order is the CVD-safety mechanism (dataviz skill's color-formula.md) -- do
# not reorder casually. Supports up to 8 sources without new validation work.
HUES = [
    ("#2a78d6", "#3987e5"),  # 1 blue
    ("#eb6834", "#d95926"),  # 2 orange
    ("#1baf7a", "#199e70"),  # 3 aqua
    ("#eda100", "#c98500"),  # 4 yellow
    ("#e87ba4", "#d55181"),  # 5 magenta
    ("#008300", "#008300"),  # 6 green
    ("#4a3aa7", "#9085e9"),  # 7 violet
    ("#e34948", "#e66767"),  # 8 red
]

# Fixed source -> hue-slot assignment (not derived from --source CLI order), so a
# source's color and strip position stay the same across every combined view. supplement
# is intentionally omitted -- excluded from this admin-facing view by direction, though
# it stays in the underlying data.
#
# ORDER MATTERS: every source with a real carrier file today must come before any
# not-yet-built placeholder (cs50psets). The palette's "adjacent" CVD validation only
# covers slots that are actually next to each other in this list -- if a real source's
# slot were separated from another real source's slot by an unused reserved slot, a
# combined view showing just the real sources would render two colors adjacent that
# were never validated as a pair. Keeping real sources contiguous at the front avoids
# that: all 8 slots (blue/orange/aqua/yellow/magenta/green/violet/red) were validated
# together, so any subset of today's eight sources is safe in any combination.
# cs50psets has no carrier file and is never actually rendered (harmless to leave it
# here at slot 9, past the end of HUES) -- when it becomes real, HUES needs a 9th
# color and a fresh validation pass, same as every slot addition before it.
SOURCE_ORDER = [
    "working_in_python",
    "little_brother",
    "cmu_cs1",
    "codehs_corgi",
    "cs50ap",
    "cs50ap_extended",
    "cs50p",
    "cmu_cs0",
    "cs50psets",
]
SOURCE_HUE_SLOT = {source: i + 1 for i, source in enumerate(SOURCE_ORDER)}

COVERAGE_CSS = (
    BASE_CSS
    + """
.cov-panel { margin: 2.5rem 0; }
.cov-panel > h2 { font-size: 1.4rem; margin: 0 0 .3rem; }
.cov-legend { display: flex; flex-wrap: wrap; gap: .4rem 1.3rem; margin: 0 0 1.2rem; font-size: .9rem; }
.cov-legend .cov-swatch { width: 22px; height: 16px; border-radius: 5px; display: inline-block; margin-right: .5em; vertical-align: middle; border: 1px solid var(--border); }
.cov-group { margin: 1.3rem 0; }
.cov-group-title { font-size: .9rem; font-weight: 600; margin: 0 0 .5rem; }
.cov-subpanel-heading { font-size: 1.1rem; margin: 1.8rem 0 .3rem; padding-top: .8rem; border-top: 1px solid var(--border); }
.cov-subgroup { margin: .9rem 0; }
.cov-subgroup h4 { font-size: .88rem; color: var(--muted); font-weight: 600; margin: 0 0 .4rem; }
.cov-grid { display: flex; flex-wrap: wrap; gap: .5rem; align-items: flex-start; }
.cov-badge { position: relative; display: inline-flex; flex-direction: column; align-items: stretch; }
.cov-badge-btn {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .78em;
  padding: .4em .6em; border-radius: 8px; border: 1px solid var(--border);
  background: var(--code-bg); color: var(--fg); cursor: pointer; white-space: nowrap;
  line-height: 1.2;
}
.cov-badge-btn:hover, .cov-badge-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.cov-badge.has-coverage .cov-badge-btn { background: color-mix(in oklch, var(--muted) 22%, var(--bg)); }
.cov-bars { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
.cov-bar {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .6rem;
  font-weight: 600; line-height: 1.7; letter-spacing: .01em; white-space: nowrap;
  padding: 0 .4em; border-left: 3px solid; border-radius: 2px;
  background: var(--code-bg); color: var(--fg); text-align: left;
}
.cov-tooltip {
  display: none; position: absolute; top: 100%; left: 0; z-index: 10; margin-top: .35rem;
  background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
  padding: .7rem .9rem; box-shadow: 0 6px 20px rgba(0,0,0,.18); width: max-content;
  max-width: 280px; font-size: .82rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.cov-badge.is-open .cov-tooltip { display: block; }
.cov-tooltip .tt-code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--accent); }
.cov-tooltip .tt-paraphrase { margin: .4em 0; color: var(--fg); }
.cov-tooltip .tt-source { margin: .3em 0 0; color: var(--muted); }
.cov-anchor-block { opacity: .6; font-size: .92em; }
.cov-refs-nav { font-size: .85rem; color: var(--muted); margin: -.3rem 0 1.2rem; }
.cov-refs-nav a { color: var(--accent); }
"""
)

TOOLTIP_JS = """
(function() {
  var badges = Array.from(document.querySelectorAll('.cov-badge'));
  var open = null;
  function close(b) {
    b.classList.remove('is-open');
    b.querySelector('.cov-badge-btn').setAttribute('aria-expanded', 'false');
    if (open === b) open = null;
  }
  badges.forEach(function(b) {
    var btn = b.querySelector('.cov-badge-btn');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var wasOpen = b.classList.contains('is-open');
      if (open) close(open);
      if (!wasOpen) { b.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); open = b; }
    });
  });
  document.addEventListener('click', function(e) {
    if (open && !open.contains(e.target)) close(open);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && open) close(open);
  });
})();
"""


def bars_html(covering, cov):
    """A bar only for a source that actually covers this code -- no placeholder for
    "not covered," since the badge's own gray/white fill already answers "covered by
    anything at all." Stacked vertically in SOURCE_ORDER, so more bars = more sources,
    at a glance; which exact source(s) is in the tooltip too, not just here.

    Each bar carries its source's short abbrev as a text label, in normal ink on the
    page's own surface, with only a colored left edge for the source -- not colored
    text-on-fill. Some hues read too close to each other at a glance (this is why:
    yellow/magenta, or violet, whose light- and dark-mode values are opposite ends of
    the lightness scale), and no single text color stays legible against every hue in
    both themes at once. Text is the reliable identifier; color is a secondary cue
    beside it, not the thing carrying the identity -- the same principle the badge
    codes themselves already follow (always labeled, never color-alone)."""
    ordered = [s for s in SOURCE_ORDER if s in covering]
    if not ordered:
        return ""
    bars = "".join(
        f'<span class="cov-bar" style="border-left-color:var(--hue-{SOURCE_HUE_SLOT[s]})" title="{esc(cov.source_meta.get(s, {}).get("title", s))}">'
        f'{esc(cov.source_meta.get(s, {}).get("abbrev", s))}</span>'
        for s in ordered
    )
    return f'<div class="cov-bars">{bars}</div>'


def badge_html(code, display_code, title, paraphrase, cov):
    covering, _total = cov.coverage_summary(code)
    heading = f"{esc(code)} · {esc(title)}" if title else esc(code)
    detail_line = cov.carrier_html(code)
    source_line = f'<div class="tt-source">{detail_line}</div>' if covering else ""
    cls = "cov-badge has-coverage" if covering else "cov-badge"
    return f"""<div class="{cls}">
<button class="cov-badge-btn" aria-expanded="false" aria-label="{esc(code)}">{esc(display_code)}</button>
{bars_html(covering, cov)}
<div class="cov-tooltip" role="dialog">
<div class="tt-code">{heading}</div>
<div class="tt-paraphrase">{esc(paraphrase)}</div>
{source_line}
</div>
</div>"""


def source_legend_html(carrier_files):
    """The page's one color key: one swatch per source in view, in the same fixed
    order/color as the strips, so the legend and every badge agree."""
    parts = ['<div class="cov-legend">']
    for source in SOURCE_ORDER:
        if source not in carrier_files:
            continue
        slot = SOURCE_HUE_SLOT[source]
        title = esc(carrier_files[source]["meta"].get("title", source))
        parts.append(f'<span><span class="cov-swatch" style="background:var(--hue-{slot})"></span>{title}</span>')
    parts.append("</div>")
    return "\n".join(parts)


def render_group_grid(label, entries, cov):
    """entries: list of (code, display_code, title, paraphrase). No color here --
    the cluster's own heading text is the only grouping cue; the old faint color
    dot/border was decoration, not information."""
    badges = "\n".join(badge_html(code, disp, title, para, cov) for code, disp, title, para in entries)
    return f"""<div class="cov-group">
<div class="cov-group-title">{esc(label)}</div>
<div class="cov-grid">{badges}</div>
</div>"""


def render_apcsp_panel(catalog, cov):
    big_ideas = {b["id"]: b for b in catalog["big_ideas"]}
    order = [b["id"] for b in sorted(catalog["big_ideas"], key=lambda b: b["number"])]
    by_bi = {}
    for t in catalog["topics"]:
        by_bi.setdefault(t["big_idea"], []).append((t["code"], t["code"], t["title"], t["paraphrase"]))
    body = []
    for bid in order:
        bi = big_ideas[bid]
        label = f'Big Idea {bi["number"]}: {bi["name"]} ({bi["mcq_weight_low"]}–{bi["mcq_weight_high"]}%)'
        body.append(render_group_grid(label, by_bi.get(bid, []), cov))
    # Computational Thinking Practices deliberately omitted: never reverse-mapped in
    # this data, and too broad/cross-cutting to be a meaningful coverage question here.
    return "\n".join(body)


# Canonical strand order (matches the CDE document's own sequence) -- fixed, not
# derived from first-appearance in the catalog array, since that array's order is an
# incidental byproduct of whenever each grade band happened to be extracted/appended
# (6-8 landed alphabetical by strand when it was added; 9-12 happened to already be
# in this order). Both grade-band panels use this same explicit sequence.
STRAND_ORDER = ["CS", "NI", "DA", "AP", "IC"]


def render_castandards_panel(catalog, cov, grade_band):
    """One grade band at a time -- 6-8 and 9-12 are different courses' worth of
    standards and don't belong in the same visual section just because they share
    strand codes (a bare "AP.14" means something different in each band)."""
    strand_names = {}
    by_strand = {}
    for s in catalog["standards"]:
        if s["grade_band"] != grade_band:
            continue
        strand_names[s["strand"]] = s["strand_name"]
        display = s["code"].removeprefix(f"{grade_band}.")
        by_strand.setdefault(s["strand"], []).append((s["code"], display, None, s["paraphrase"]))
    body = []
    for strand in STRAND_ORDER:
        if strand in by_strand:
            body.append(render_group_grid(f"{strand} · {strand_names[strand]}", by_strand[strand], cov))
    return "\n".join(body)


def render_csta2026_panel(catalog, cov):
    order = []
    by_concept = {}
    for s in catalog["standards"]:
        if s["concept"] not in by_concept:
            order.append(s["concept"])
        display = s["code"].removeprefix("HS-")
        by_concept.setdefault(s["concept"], []).append((s["code"], display, None, s["paraphrase"]))
    body = []
    for concept in order:
        body.append(render_group_grid(concept, by_concept[concept], cov))
    return "\n".join(body)


def render_ca_ict_panel(catalog, cov):
    def render_subgroup(grp, cov):
        entries = [(item["code"], item["code"], None, item["paraphrase"]) for item in grp.get("items", [])]
        badges = "\n".join(badge_html(code, disp, title, para, cov) for code, disp, title, para in entries)
        return f'<div class="cov-subgroup"><h4>{esc(grp["code"])} {esc(grp["name"])}</h4><div class="cov-grid">{badges}</div></div>'

    body = ['<div class="cov-anchor-block">', '<h3 class="cov-subpanel-heading">Anchor Standards (cross-sector)</h3>']
    for grp in catalog["anchor_standards"]:
        body.append(render_subgroup(grp, cov))
    body.append("</div>")
    body.append(f'<h3 class="cov-subpanel-heading">Pathway C: {esc(catalog["pathway"]["name"])}</h3>')
    for grp in catalog["pathway"]["standards"]:
        body.append(render_subgroup(grp, cov))
    return "\n".join(body)


def hue_css_vars():
    lines = [":root {"]
    for i, (light, _dark) in enumerate(HUES, start=1):
        lines.append(f"  --hue-{i}: {light};")
    lines.append("}")
    lines.append("@media (prefers-color-scheme: dark) {")
    lines.append("  :root {")
    for i, (_light, dark) in enumerate(HUES, start=1):
        lines.append(f"    --hue-{i}: {dark};")
    lines.append("  }")
    lines.append("}")
    lines.append(':root[data-theme="dark"] {')
    for i, (_light, dark) in enumerate(HUES, start=1):
        lines.append(f"    --hue-{i}: {dark};")
    lines.append("}")
    lines.append(':root[data-theme="light"] {')
    for i, (light, _dark) in enumerate(HUES, start=1):
        lines.append(f"    --hue-{i}: {light};")
    lines.append("}")
    return "\n".join(lines)


REFERENCE_PAGES_NAV = """<div class="cov-refs-nav">
Standards reference:
<a href="apcsp-standards-reference.html">AP CSP</a> ·
<a href="ca-cs-standards-reference.html">California 9-12</a> ·
<a href="csta2026-standards-reference.html">CSTA 2026</a> ·
<a href="ca-ict-anchor-standards-reference.html">CA ICT</a> ·
<a href="alignment/">coverage detail</a>
</div>"""


def page(title, sources_label, panels, carrier_files, refs_nav=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
{COVERAGE_CSS}
{hue_css_vars()}
</style>
</head>
<body>
<div class="layout" style="display:block; max-width:1100px;">
<main style="padding: 1.5rem 2rem 6rem;">
<h1>{esc(title)}</h1>
{refs_nav}
<div class="provenance">
  <strong>What this is.</strong> Which of {esc(sources_label)} covers each standard,
  one badge per standard. A gray badge is covered by something; a white badge is not
  covered by anything -- that's the gap to look for. The bars underneath show how
  many sources contribute (one color-coded bar per covering source, stacked). Click
  any badge for exactly which source and where.
</div>
{source_legend_html(carrier_files)}
{"".join(f'<div class="cov-panel"><h2>{esc(name)}</h2>{html}</div>' for name, html in panels)}
<footer>Generated by build_coverage_map.py. Not an official framework document.</footer>
</main>
</div>
<script>{TOOLTIP_JS}</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--carriers", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--source", action="append", required=True)
    ap.add_argument("--title", default="Standards Coverage Map")
    ap.add_argument("--filename", default="coverage-map.html", help="Output filename -- use index.html when this is meant to be a section's landing page.")
    ap.add_argument("--with-refs-nav", action="store_true", help="Include a nav row linking to the sibling reference pages (apcsp-standards-reference.html etc.) -- only meaningful when those files are co-located in --out.")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    catalogs = {name: load_json(Path(args.catalog) / f"{name}.json") for name in ["apcsp", "castandards", "csta2026", "ca-ict-anchor"]}
    carrier_files = load_carrier_files(args.carriers, set(args.source))
    sources_label = " + ".join(esc(carrier_files[s]["meta"].get("title", s)) for s in args.source if s in carrier_files)

    from build_alignment import Coverage

    covs = {fw: Coverage(carrier_files, fw, scoped=False) for fw in catalogs}

    panels = [
        ("AP Computer Science Principles", render_apcsp_panel(catalogs["apcsp"], covs["apcsp"])),
        ("California 9-12 Computer Science", render_castandards_panel(catalogs["castandards"], covs["castandards"], "9-12")),
        ("CSTA 2026", render_csta2026_panel(catalogs["csta2026"], covs["csta2026"])),
        ("California CTE (ICT)", render_ca_ict_panel(catalogs["ca-ict-anchor"], covs["ca-ict-anchor"])),
        # Last, deliberately: this is the only middle-school-level panel among
        # otherwise all-high-school frameworks.
        ("California 6-8 Computer Science", render_castandards_panel(catalogs["castandards"], covs["castandards"], "6-8")),
    ]

    refs_nav = REFERENCE_PAGES_NAV if args.with_refs_nav else ""
    html = page(args.title, sources_label, panels, carrier_files, refs_nav)
    (out / args.filename).write_text(html)
    print(f"Wrote {args.filename} to {out}/ combining {len(carrier_files)} source(s): {sorted(carrier_files)}")


if __name__ == "__main__":
    main()
