#!/usr/bin/env python3
"""Checks the MATE cross-reference data. Exits 1 and lists every problem found.

- every standards code the MATE carriers cite exists in its catalog
- every skill a competency names exists in mate-skills.json
- every standard the MATE carrier cites has a one-line summary
- every Ocean Decade number on a competency is OD.1 to OD.10
- every employer-skill link (mate-wef-links.json) names a real MATE skill and a real employer skill
- no em or en dashes in any MATE file
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
S = ROOT / "_standards"


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def catalog_codes(fw):
    d = load(S / f"{fw}.json")
    if "topics" in d:
        return {t["code"] for t in d["topics"]}
    if "standards" in d:
        return {s["code"] for s in d["standards"]}
    if "anchor_standards" in d:
        return {i["code"] for g in d["anchor_standards"] + d["pathway"]["standards"] for i in g.get("items", [])}
    return {i["code"] for g in d["groups"] for i in g["items"]}


problems = []
mate = load(S / "carriers" / "mate-rov.json")
comps = load(S / "mate-rov.json")
skills = {i["code"] for g in load(S / "mate-skills.json")["groups"] for i in g["items"]}
summ = load(S / "mate-short-summaries.json")["summaries"]
wef = load(S / "mate-wef-links.json")

for fw, codes in mate["coverage"].items():
    if fw == "mate-rov":
        continue
    cat = catalog_codes(fw)
    for code in codes:
        if code not in cat:
            problems.append(f"carrier cites {fw} {code}, not in the catalog")
        if code not in summ.get(fw, {}):
            problems.append(f"no one-line summary for {fw} {code}")
comp_codes = set()
for g in comps["groups"]:
    for i in g["items"]:
        comp_codes.add(i["code"])
        for s in i.get("skills", []):
            if s not in skills:
                problems.append(f"{i['code']} names unknown skill {s}")
        for n in i.get("ocean_decade", []):
            if not 1 <= n <= 10:
                problems.append(f"{i['code']} has Ocean Decade number {n}")
for fw, codes in summ.items():
    for code in codes:
        if code not in catalog_codes(fw):
            problems.append(f"summary for {fw} {code}, not in the catalog")
n_wef = len(wef["wef_skills"])
for l in wef["links"]:
    if l["a"] not in skills:
        problems.append(f"WEF link names unknown MATE skill {l['a']}")
    if not 0 <= l["s"] < n_wef:
        problems.append(f"WEF link names employer skill index {l['s']}")
    if l["w"] not in ("strong", "partial"):
        problems.append(f"WEF link weight {l['w']}")
for loc in {l for d in mate["coverage"].values() for e in d.values() for l in e["locators"]}:
    if loc not in comp_codes:
        problems.append(f"carrier locator {loc} is not a competency")
for f in ("mate-rov.json", "mate-skills.json", "ocean-decade.json", "mate-classes.json", "mate-short-summaries.json",
          "mate-wef-links.json", "carriers/mate-rov.json", "carriers/mate-missions.json"):
    t = (S / f).read_text(encoding="utf-8")
    if "—" in t or "–" in t:
        problems.append(f"{f} contains an em or en dash")

if problems:
    print("\n".join(problems))
    sys.exit(1)
print(f"ok: {len(comp_codes)} competencies, {len(skills)} skills, {sum(len(c) for fw, c in summ.items())} summaries, {len(wef['links'])} employer-skill links")
