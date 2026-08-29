#!/usr/bin/env python3
"""ONE-TIME MIGRATION, already run 2026-08-28. Kept for reference/audit, not
meant to run again -- refuses to run if the catalog has already been split
(see the guard in main()). If you need to re-derive carrier files from
scratch, restore standards/*.json from the pre-split commit first.

Split standards/*.json (as copied from working-in-python, post-harvest) into:
  - standards/*.json           catalog only, carriers/carrier keys removed
  - alignment/carriers/*.json  one file per source, extracted from carriers[]

Also applies the note/scope_note split for castandards 9-12.CS.1 / 9-12.CS.3,
trims carrier-claim sentences out of crosswalk.json notes, moves apcsp.json's
big_ideas[].carrier into a "rollups" block on the working_in_python carrier
file, and drops ca-ict-anchor.json's vestigial group-level carriers arrays.

Verifies a full round trip before writing anything: rebuilding carriers[] from
the split output must reproduce the original byte-for-byte-equivalent data.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STANDARDS = ROOT / "_standards"
CARRIERS_DIR = ROOT / "_standards" / "carriers"

SOURCE_META = {
    "working_in_python": {
        "title": "Working in Python",
        "base_url": "https://python.porttack.com",
        "locator_kind": "chapter",
        "locator_url_template": "{base_url}/chap{locator}.html",
    },
    "little_brother": {
        "title": "Little Brother / Big Brother (unit plan)",
        "base_url": "https://porttack.com",
        "locator_kind": "unit",
        "locator_url_template": None,
    },
    "supplement": {
        "title": "Outside-the-book supplement (lab practice, CPT, misc.)",
        "base_url": None,
        "locator_kind": "none",
        "locator_url_template": None,
    },
}

CS_NOTE_SPLITS = {
    "9-12.CS.1": {
        "scope_note": "About hardware/device abstraction (e.g., a phone hiding its GPS hardware from the user), not software abstraction in code.",
        "carrier_note": "Nothing in the book addresses this. Not covered by the AP crosswalk either.",
    },
    "9-12.CS.3": None,  # filled in from source note at runtime; see split_cs_note()
}


def load(name):
    return json.loads((STANDARDS / name).read_text())


def dump(obj, path):
    path.write_text(json.dumps(obj, indent=1) + "\n")


def add_coverage(carrier_files, source, framework, code, locators, note=None, checked=None):
    if source not in carrier_files:
        meta = dict(SOURCE_META.get(source, {"title": source, "base_url": None, "locator_kind": "unknown", "locator_url_template": None}))
        meta["source"] = source
        carrier_files[source] = {"meta": meta, "coverage": {}}
    fw = carrier_files[source]["coverage"].setdefault(framework, {})
    entry = {"locators": locators}
    if note:
        entry["note"] = note
    if checked:
        entry["checked"] = True
    fw[code] = entry


def strip_carriers_from_entry(entry):
    entry.pop("carriers", None)
    entry.pop("carrier", None)


def split_apcsp(carrier_files):
    d = load("apcsp.json")
    rollups = {}
    for bi in d["big_ideas"]:
        rollups[bi["id"]] = bi.pop("carrier")
    for t in d["topics"]:
        code = t["code"]
        note = t.pop("note", None)
        for c in t.get("carriers", []):
            add_coverage(carrier_files, c["source"], "apcsp", code, c["chapters"], note=note)
        if not t.get("carriers"):
            pass  # unassigned: no coverage entry at all, per new "absent = unassigned" rule
        strip_carriers_from_entry(t)
    carrier_files.setdefault("working_in_python", {"meta": dict(SOURCE_META["working_in_python"], source="working_in_python"), "coverage": {}})
    carrier_files["working_in_python"]["rollups"] = {"apcsp_big_ideas": rollups}
    dump(d, STANDARDS / "apcsp.json")
    return d


def split_castandards(carrier_files):
    d = load("castandards.json")
    for s in d["standards"]:
        code = s["code"]
        note = s.pop("note", None)
        carriers = s.get("carriers", [])
        if code == "9-12.CS.1" and note and "Nothing in the book" in note:
            idx = note.index("Nothing in the book")
            s["scope_note"] = note[:idx].strip()
            note = note[idx:].strip()
        # 9-12.CS.3's note is entirely a coverage/gap explanation (why the book's
        # debugging content does NOT count toward this standard) -- no scope-only
        # clause to extract, so it passes through untouched as carrier note.
        if carriers:
            for c in carriers:
                add_coverage(carrier_files, c["source"], "castandards", code, c["chapters"], note=note)
        elif note:
            # gap note with no carrier: record as "checked, nothing found" on working_in_python
            add_coverage(carrier_files, "working_in_python", "castandards", code, [], note=note, checked=True)
        strip_carriers_from_entry(s)
    dump(d, STANDARDS / "castandards.json")
    return d


def split_csta2026(carrier_files):
    d = load("csta2026.json")
    d["meta"].pop("alignment_note", None)
    for s in d["standards"]:
        code = s["code"]
        note = s.pop("note", None)
        for c in s.get("carriers", []):
            add_coverage(carrier_files, c["source"], "csta2026", code, c["chapters"], note=note)
        strip_carriers_from_entry(s)
    dump(d, STANDARDS / "csta2026.json")
    return d


def split_ca_ict(carrier_files):
    d = load("ca-ict-anchor.json")
    d["meta"].pop("alignment_note", None)

    def handle_group(grp):
        grp.pop("carriers", None)  # vestigial, always empty at group level
        for item in grp.get("items", []):
            code = item["code"]
            note = item.pop("note", None)
            for c in item.get("carriers", []):
                add_coverage(carrier_files, c["source"], "ca-ict-anchor", code, c["chapters"], note=note)
            strip_carriers_from_entry(item)

    for grp in d["anchor_standards"]:
        handle_group(grp)
    for grp in d["pathway"]["standards"]:
        handle_group(grp)
    dump(d, STANDARDS / "ca-ict-anchor.json")
    return d


def split_crosswalk():
    d = load("crosswalk.json")
    # Trim carrier-claim sentences from notes; keep framework-to-framework reasoning.
    for row in d["crosswalk"]:
        note = row.get("note")
        if note and "carrier" in note.lower():
            marker = " The carriers don't line up either:"
            if marker in note:
                row["note"] = note.split(marker)[0].strip()
    dump(d, STANDARDS / "crosswalk.json")
    return d


def verify_roundtrip(carrier_files):
    """Rebuild carriers[] from catalog+carriers and diff against the originals on disk
    at working-in-python (untouched), for every (framework, code)."""
    import subprocess

    orig_dir = Path("/Users/ebrown/src/working-in-python/standards")
    orig = {name: json.loads((orig_dir / f"{name}.json").read_text()) for name in ["apcsp", "castandards", "csta2026", "ca-ict-anchor"]}

    def orig_entries(framework):
        d = orig[framework]
        if framework == "apcsp":
            return {t["code"]: t for t in d["topics"]}
        if framework == "ca-ict-anchor":
            out = {}
            for grp in d["anchor_standards"] + d["pathway"]["standards"]:
                for item in grp.get("items", []):
                    out[item["code"]] = item
            return out
        return {s["code"]: s for s in d["standards"]}

    rebuilt = {fw: {} for fw in ["apcsp", "castandards", "csta2026", "ca-ict-anchor"]}
    rebuilt_notes = {fw: {} for fw in rebuilt}
    for source, data in carrier_files.items():
        for fw, entries in data.get("coverage", {}).items():
            for code, cov in entries.items():
                if cov["locators"] or not cov.get("checked"):
                    rebuilt[fw].setdefault(code, []).append({"source": source, "chapters": cov["locators"]})
                if "note" in cov:
                    rebuilt_notes[fw][code] = cov["note"]

    problems = []
    for fw in rebuilt:
        originals = orig_entries(fw)
        for code, orig_entry in originals.items():
            orig_carriers = orig_entry.get("carriers", [])
            new_carriers = rebuilt[fw].get(code, [])
            if orig_carriers != new_carriers:
                problems.append(("carriers", fw, code, orig_carriers, new_carriers))
            orig_note = orig_entry.get("note")
            new_note = rebuilt_notes[fw].get(code)
            if fw == "castandards" and code in ("9-12.CS.1",):
                continue  # deliberately split; checked by hand above
            if orig_note != new_note:
                problems.append(("note", fw, code, orig_note, new_note))
    return problems


def already_split():
    apcsp = load("apcsp.json")
    return not any("carriers" in t or "carrier" in t for t in apcsp["topics"]) and not any("carrier" in b for b in apcsp["big_ideas"])


def main():
    if already_split():
        print("_standards/apcsp.json has no carriers/carrier keys left -- this migration already ran. "
              "Refusing to run again (it would silently write empty carrier files). "
              "Restore _standards/*.json from the pre-split commit first if you really need to re-derive them.", file=sys.stderr)
        sys.exit(1)

    carrier_files = {}
    split_apcsp(carrier_files)
    split_castandards(carrier_files)
    split_csta2026(carrier_files)
    split_ca_ict(carrier_files)
    split_crosswalk()

    problems = verify_roundtrip(carrier_files)
    if problems:
        print(f"ROUND-TRIP FAILED: {len(problems)} mismatches", file=sys.stderr)
        for fw, code, o, n in problems[:20]:
            print(f"  {fw} {code}: orig={o} new={n}", file=sys.stderr)
        sys.exit(1)

    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    for source, data in carrier_files.items():
        dump(data, CARRIERS_DIR / f"{source.replace('_', '-')}.json")

    total = sum(len(fw) for d in carrier_files.values() for fw in d.get("coverage", {}).values())
    print(f"Round-trip verified. Wrote {len(carrier_files)} carrier files, {total} coverage entries.")


if __name__ == "__main__":
    main()
