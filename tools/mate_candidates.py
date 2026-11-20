#!/usr/bin/env python3
"""Suggest which existing content might help with each MATE competency.

The MATE carrier (_standards/carriers/mate-rov.json) says which standards each
competency draws on. Every other carrier says which standards a lesson covers.
Joining the two through the standards gives CANDIDATES: lessons that cover a
standard the competency draws on. That is a hint, not a claim. A lesson can cover
the same standard as a competency and still teach nothing the team needs (both
"use conditionals", say), so this script:

  * never rates a candidate above "partial", however strong each link is;
  * rates a candidate by its WEAKEST link, and by how many of the competency's
    standards it covers (all of them is "covers all N", otherwise "k of N");
  * ignores generic standards, ones so many lessons carry that sharing them says
    nothing (--generic, default 8 sources);
  * leaves the competency unlinked if only generic standards are left.

Only a person confirming it should turn a candidate into a direct link: a
mate-rov code entered in the lesson's own carrier, with its own strength.

Usage:
  mate_candidates.py [--generic N] [--out FILE]      (default: print markdown)
"""
import argparse
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RANK = {"related": 0, "partial": 1, "strong": 2}
NAME = {0: "related", 1: "partial", 2: "strong"}


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--generic", type=int, default=8)
    ap.add_argument("--out")
    args = ap.parse_args()

    catalog = load(ROOT / "_standards" / "mate-rov.json")
    titles = {i["code"]: i["name"] for g in catalog["groups"] for i in g["items"]}
    carriers = {}
    for f in sorted((ROOT / "_standards" / "carriers").glob("*.json")):
        d = load(f)
        carriers[d["meta"]["source"]] = d
    mate = carriers.pop("mate_rov")

    # standard -> list of (source, locator, strength) from every other carrier
    by_std = defaultdict(list)
    for src, d in carriers.items():
        for fw, codes in d.get("coverage", {}).items():
            for std, e in codes.items():
                for loc in e.get("locators", []):
                    by_std[(fw, std)].append((src, loc, e.get("strength", "related")))
    # how many distinct sources carry each standard
    spread = {k: len({s for s, _, _ in v}) for k, v in by_std.items()}

    # directly confirmed links: a lesson's own carrier lists the mate-rov code itself
    direct = defaultdict(list)
    for src, d in carriers.items():
        for code, e in d.get("coverage", {}).get("mate-rov", {}).items():
            for loc in e.get("locators", []):
                direct[code].append((src, str(loc), e.get("strength", "related")))

    # competency -> {(fw, std): strength of the standard in the competency}
    draws = defaultdict(dict)
    for fw, codes in mate["coverage"].items():
        if fw == "mate-rov":
            continue  # the source listing its own competencies
        for std, e in codes.items():
            for loc in e["locators"]:
                draws[loc][(fw, std)] = e["strength"]

    out = ["# MATE competencies: candidate content", "",
           "Candidates only. Each is a lesson that covers a standard the competency draws on. "
           "None is confirmed, and none is rated above partial. A person has to read the lesson "
           "against the competency before it becomes a direct link.", "",
           f"Standards carried by {args.generic} or more sources are ignored as too generic.", ""]
    for code in sorted(draws, key=lambda c: (c.split(".")[0], int(c.split(".")[1]))):
        stds = draws[code]
        usable = {k: v for k, v in stds.items() if 0 < spread.get(k, 0) < args.generic}
        out.append(f"## {code}: {titles[code]}")
        out.append("")
        for src, loc, st in sorted(direct.get(code, [])):
            title = carriers[src]["meta"].get("locator_titles", {}).get(loc, loc)
            out.append(f"- CONFIRMED ({st}): **{carriers[src]['meta'].get('abbrev', src)}** {title}")
        if direct.get(code):
            out.append("")
        out.append("Draws on: " + ", ".join(f"{fw} {s} ({v})" for (fw, s), v in sorted(stds.items())) + "  ")
        ignored = [k for k in stds if spread.get(k, 0) >= args.generic]
        if ignored:
            out.append("Too generic to use: " + ", ".join(f"{fw} {s}" for fw, s in sorted(ignored)) + "  ")
        if not usable:
            out.append("")
            out.append("No candidates.")
            out.append("")
            continue
        # candidate = (source, locator) -> list of (std, weakest of the two strengths)
        cand = defaultdict(dict)
        for (fw, std), mate_strength in usable.items():
            for src, loc, s in by_std[(fw, std)]:
                if any(x[0] == src and x[1] == str(loc) for x in direct.get(code, [])):
                    continue  # already confirmed above
                weakest = min(RANK[mate_strength], RANK[s])
                key = (src, loc)
                cand[key][(fw, std)] = max(cand[key].get((fw, std), -1), weakest)
        rows = []
        for (src, loc), got in cand.items():
            n = len(got)
            link = min(got.values())
            # never above partial; "covers all" needs every usable standard
            rating = NAME[min(link, 1)]
            rows.append((-n, -min(got.values()), src, str(loc), rating, got))
        rows.sort()
        out.append("")
        total = len(stds)
        for _, _, src, loc, rating, got in rows[:12]:
            tag = f"all {total} standards" if len(got) == total else f"{len(got)} of its {total} standards"
            std_list = ", ".join(f"{fw} {s}" for (fw, s) in sorted(got))
            title = carriers[src]["meta"].get("locator_titles", {}).get(loc, loc)
            out.append(f"- **{carriers[src]['meta'].get('abbrev', src)}** {title} ({rating} at best, {tag}): {std_list}")
        if len(rows) > 12:
            out.append(f"- ...and {len(rows) - 12} more")
        out.append("")
    text = "\n".join(out) + "\n"
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(text)


if __name__ == "__main__":
    main()
