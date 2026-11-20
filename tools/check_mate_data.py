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
skills_cat = load(S / "mate-skills.json")
skills = {i["code"] for g in skills_cat["groups"] for i in g["items"]}
subskills = {c["code"]: i["code"] for g in skills_cat["groups"] for i in g["items"] for c in i.get("components", [])}
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
            if s not in subskills:
                problems.append(f"{i['code']} names unknown sub-skill {s}")
        for n in i.get("ocean_decade", []):
            if not 1 <= n <= 10:
                problems.append(f"{i['code']} has Ocean Decade number {n}")
seen_sub = {}
for g in skills_cat["groups"]:
    for i in g["items"]:
        for k, c in enumerate(i.get("components", [])):
            if c["code"] != i["code"] + chr(97 + k):
                problems.append(f"component code {c['code']} is out of order under {i['code']}")
            sh = c.get("short", "")
            if not sh or len(sh) > 26:
                problems.append(f"{c['code']} needs a short phrase of 1 to 26 characters (has {sh!r})")
            if sh in seen_sub:
                problems.append(f"sub-skill phrase {sh!r} is used by both {seen_sub[sh]} and {c['code']}")
            seen_sub[sh] = c["code"]
built = {s for g in comps["groups"] for i in g["items"] for s in i.get("skills", [])}
print("sub-skills no competency builds (by design the dispositions):", ", ".join(sorted(set(subskills) - built)))
shorts_seen = {}
for g in comps["groups"]:
    for i in g["items"]:
        sh = i.get("short", "")
        if not sh or len(sh) > 16:
            problems.append(f"{i['code']} needs a short phrase of 1 to 16 characters (has {sh!r})")
        if sh in shorts_seen:
            problems.append(f"short phrase {sh!r} is used by both {shorts_seen[sh]} and {i['code']}")
        shorts_seen[sh] = i["code"]
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
ocean = load(S / "mate-ocean-links.json")
od_codes = {f"OD.{n}" for n in range(1, 11)}
for l in ocean["wef30_ocean"]:
    if l["a"] not in od_codes or not 0 <= l["s"] < n_wef or l["w"] not in ("strong", "partial"):
        problems.append(f"wef30_ocean link is not valid: {l}")
for l in ocean["ocean_mate"]:
    if l["o"] not in od_codes or l["a"] not in skills or l["w"] not in ("strong", "partial"):
        problems.append(f"ocean_mate link is not valid: {l}")
backed = set()
for g in comps["groups"]:
    for i in g["items"]:
        for n in i.get("ocean_decade", []):
            for sk in i.get("skills", []):
                backed.add((f"OD.{n}", subskills.get(sk, sk)))
solid = {(l["o"], l["a"]) for l in ocean["ocean_mate"] if l["w"] == "strong"}
for pair in sorted(solid - backed):
    problems.append(f"ocean_mate solid line {pair} is not backed by MATE's tags through a competency")
for pair in sorted(backed - solid):
    problems.append(f"MATE's tags reach {pair} through a competency but the line is not solid")
wef30_ranked = {w["index"] for w in wef["wef_skills"] if w["rank_2030"]}
for l in ocean["wef30_ocean"]:
    if l["s"] not in wef30_ranked:
        problems.append(f"wef30_ocean uses a skill that is not on the 2030 list: {l['s']}")
for n in range(1, 11):
    if not any(l["a"] == f"OD.{n}" for l in ocean["wef30_ocean"]):
        problems.append(f"no 2030 skill links to OD.{n}")
for loc in {l for d in mate["coverage"].values() for e in d.values() for l in e["locators"]}:
    if loc not in comp_codes:
        problems.append(f"carrier locator {loc} is not a competency")
for f in ("mate-rov.json", "mate-skills.json", "ocean-decade.json", "mate-classes.json", "mate-short-summaries.json",
          "mate-wef-links.json", "mate-ocean-links.json", "mate-manual-map.json", "carriers/mate-rov.json", "carriers/mate-missions.json"):
    t = (S / f).read_text(encoding="utf-8")
    if "—" in t or "–" in t:
        problems.append(f"{f} contains an em or en dash")

mm = json.loads((S / "mate-manual-map.json").read_text(encoding="utf-8"))
part_codes = {p["code"] for p in mm["parts"]}
for r in mm["rows"]:
    if r["part"] not in part_codes:
        problems.append(f"manual map row {r['section']} has unknown part {r['part']}")
    for c in r["competencies"]:
        if c not in comp_codes:
            problems.append(f"manual map row {r['section']} uses unknown competency {c}")

if problems:
    print("\n".join(problems))
    sys.exit(1)
print(f"ok: {len(comp_codes)} competencies, {len(skills)} skills, {sum(len(c) for fw, c in summ.items())} summaries, {len(wef['links'])} employer-skill links")
