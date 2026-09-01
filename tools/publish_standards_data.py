#!/usr/bin/env python3
"""Publish the standards catalog + curated carrier files as plain JSON under
standards/data/, for the client-side coverage map at standards/index.html to
fetch directly.

Replaces build_coverage_map.py, which rendered the coverage map as static
HTML at build time -- that approach couldn't let a reader toggle a source
on/off without re-running the script and republishing. This one just ships
the data; assets/js/standards-coverage.js does the rendering and the
toggling, live, in the browser.

Usage:
  publish_standards_data.py --catalog _standards --carriers _standards/carriers --out standards/data
"""
import argparse
import json
import shutil
from pathlib import Path

CATALOG_FILES = ["apcsp", "castandards", "csta2026", "csta2017", "ca-ict-anchor"]

# Pairs of catalogs with a hand-built crosswalk file (see _standards/README.md).
# "between" names the two frameworks in the order the crosswalk file's own row
# keys use, so the client can build a bidirectional lookup without guessing
# which key is which.
CROSSWALKS = [
    {"between": ["castandards", "csta2017"], "file": "castandards-csta2017.json"},
]

# Validated this session: node scripts/validate_palette.js "<hexes>" --mode light/dark,
# both PASS every hard gate on the *adjacent* pairlist (worst adjacent CVD ~9 light /
# ~8 dark) -- the right check here, since strips render in this same fixed order every
# time, so only neighboring strips are ever actually adjacent. One slot per content
# source; order is the CVD-safety mechanism (dataviz skill's color-formula.md) -- do
# not reorder casually. Supports up to 10 sources without new validation work.
#
# Slots 9-10 (cyan, olive) added 2026-08-29 alongside cmu_csp/codeorg_apcsp: re-ran
# the full 10-slot adjacent check in both modes (node scripts/validate_palette.js
# "<all 10 hexes>" --mode light, then --mode dark) -- both PASS, worst adjacent CVD
# unchanged from the 8-slot baseline (new pairs are #e34948/#e66767 (8, red) vs
# #288cbd/#0f7bd7 (9, cyan), and #288cbd/#0f7bd7 vs #8ca50d/#5c7000 (10, olive)).
#
# Slot 11 (brown) added 2026-08-29 alongside codeorg_csd (a single, since-split
# source): validated the adjacent pair against slot 10 (node
# scripts/validate_palette.js "#8ca50d,#a15c2e" --mode light;
# "#5c7000,#c9803f" --mode dark) -- both PASS, worst adjacent CVD 13.7 light /
# 10.3 dark, plus a full 11-slot run in both modes to confirm no other pair
# regressed.
#
# Slots 12-13 (teal, plum) added 2026-08-30 when codeorg_csd was split into
# three sibling sources (codeorg_csd_1_2, codeorg_csd_3a, codeorg_csd_3b) so
# each could be toggled independently -- three sources now need three slots
# where one sufficed before. Searched candidate hues in OKLCH space via the
# dataviz skill's validate() export directly (brute-force random HSL samples
# in a target hue bucket, kept only ones passing the adjacent check against
# their predecessor), landing on teal (vs slot 11 brown) and plum (vs slot 12
# teal) since neither hue family was in use yet. Re-ran the full 13-slot
# adjacent check in both modes afterward -- both PASS, worst adjacent CVD
# unchanged from the 11-slot baseline (new pairs are #a15c2e/#c9803f (11,
# brown) vs #1c83ab/#2993c1 (12, teal), and #1c83ab/#2993c1 vs #892b7b/#a6438b
# (13, plum)).
HUES = [
    ("#2a78d6", "#3987e5"),  # 1 blue
    ("#eb6834", "#d95926"),  # 2 orange
    ("#1baf7a", "#199e70"),  # 3 aqua
    ("#eda100", "#c98500"),  # 4 yellow
    ("#e87ba4", "#d55181"),  # 5 magenta
    ("#008300", "#008300"),  # 6 green
    ("#4a3aa7", "#9085e9"),  # 7 violet
    ("#e34948", "#e66767"),  # 8 red
    ("#288cbd", "#0f7bd7"),  # 9 cyan
    ("#8ca50d", "#5c7000"),  # 10 olive
    ("#a15c2e", "#c9803f"),  # 11 brown
    ("#1c83ab", "#2993c1"),  # 12 teal
    ("#892b7b", "#a6438b"),  # 13 plum
    ("#b8860b", "#b8860b"),  # 14 gold
    ("#b32eba", "#cb52d1"),  # 15 orchid
]

# Slot 14 (gold) added 2026-08-30 alongside hour_of_data. Only the new adjacent
# pair needed checking, since hour_of_data is appended at the end of
# SOURCE_ORDER (every other pair's order is unchanged): node
# scripts/validate_palette.js "#892b7b,#b8860b" --mode light and
# "#a6438b,#b8860b" --mode dark both PASS (worst adjacent CVD ~27.6 light /
# ~21.2 dark), plus a full 14-slot run in both modes to confirm no other pair
# regressed -- both PASS (light mode's pre-existing contrast WARN on slots
# 3/4/5/10 is unchanged, not something this addition introduced).
#
# Slot 15 (orchid) added 2026-08-31 alongside teaching_binary_with_coins,
# inserted before the still-placeholder cs50psets so real sources stay
# contiguous. Searched for a genuinely unused hue family (existing violet is
# ~248 deg, magenta ~338, plum ~318 -- nothing sat in the ~270-300 deg gap
# between them) via the dataviz skill's validate() export, brute-forcing
# random HSL samples and keeping only ones passing the adjacent check against
# slot 14 (gold, the new neighbor) in both modes: node
# scripts/validate_palette.js "#b8860b,#b32eba" --mode light and
# "#b8860b,#cb52d1" --mode dark both PASS (worst adjacent CVD ~26.6 light /
# ~24.0 dark), plus a full 15-slot run in both modes to confirm no other pair
# regressed -- both PASS (same pre-existing light-mode contrast WARN on slots
# 3/4/5/10, unchanged).
#
# Fixed source -> hue-slot assignment (not derived from directory order), so a
# source's color stays the same across every combined view. supplement is
# intentionally omitted -- excluded from this admin-facing view by direction,
# though it stays in the underlying data.
#
# ORDER MATTERS: every source with a real carrier file today must come before any
# not-yet-built placeholder (cs50psets). The palette's "adjacent" CVD validation only
# covers slots that are actually next to each other in this list -- if a real source's
# slot were separated from another real source's slot by an unused reserved slot, a
# combined view showing just the real sources would render two colors adjacent that
# were never validated as a pair. Keeping real sources contiguous at the front avoids
# that: all 14 slots were validated together, so any subset of today's fourteen sources is
# safe in any combination. cs50psets has no carrier file and is skipped below
# (harmless to leave it here, past the end of HUES) -- when it becomes real, HUES
# needs a 15th color and a fresh validation pass, same as every slot addition before it.
SOURCE_ORDER = [
    "working_in_python",
    "little_brother",
    "cmu_cs1",
    "codehs_corgi",
    "cs50ap",
    "cs50ap_extended",
    "cs50p",
    "cmu_cs0",
    "cmu_csp",
    "codeorg_apcsp",
    "codeorg_csd_1_2",
    "codeorg_csd_3a",
    "codeorg_csd_3b",
    "hour_of_data",
    "teaching_binary_with_coins",
    "cs50psets",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--carriers", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    catalog_dir = Path(args.catalog)
    carriers_dir = Path(args.carriers)
    out = Path(args.out)
    (out / "catalog").mkdir(parents=True, exist_ok=True)
    (out / "carriers").mkdir(parents=True, exist_ok=True)
    (out / "crosswalk").mkdir(parents=True, exist_ok=True)

    for name in CATALOG_FILES:
        shutil.copy(catalog_dir / f"{name}.json", out / "catalog" / f"{name}.json")

    for crosswalk in CROSSWALKS:
        shutil.copy(catalog_dir / f"crosswalk-{crosswalk['file']}", out / "crosswalk" / crosswalk["file"])

    manifest_sources = []
    for slot, source in enumerate(SOURCE_ORDER, start=1):
        filename = source.replace("_", "-") + ".json"
        src_path = carriers_dir / filename
        if not src_path.exists():
            continue
        meta = json.loads(src_path.read_text())["meta"]
        shutil.copy(src_path, out / "carriers" / filename)
        hue_light, hue_dark = HUES[slot - 1]
        manifest_sources.append(
            {
                "slug": source,
                "file": filename,
                "title": meta.get("title", source),
                "abbrev": meta.get("abbrev", source),
                "hue_light": hue_light,
                "hue_dark": hue_dark,
            }
        )

    manifest = {"catalog": CATALOG_FILES, "sources": manifest_sources, "crosswalks": CROSSWALKS}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(
        f"Published {len(CATALOG_FILES)} catalog file(s), {len(manifest_sources)} carrier file(s), "
        f"and {len(CROSSWALKS)} crosswalk file(s) to {out}/"
    )


if __name__ == "__main__":
    main()
