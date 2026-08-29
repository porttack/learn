#!/usr/bin/env python3
"""ONE-TIME addition: extract California 6-8 CS standards (codes + strand only)
from the teacher-supplied CSV and append them to _standards/castandards.json
alongside the existing 9-12 entries, matching that file's exact schema.

Source CSV: working-in-python/scratch/standards-source/CA CS Standards 3-12 -
Sheet1.csv (gitignored scratch, grades 3-12, includes personal course-mapping
columns that are NOT extracted here -- only Standard Identifier and Framework
Alignment: Concept/Subconcept are read, to get the code and strand). The
"Standard" and "Descriptive Statement" columns are the CDE's own text and are
read only to inform the paraphrase below -- never copied in, per this repo's
non-negotiable #1 (codes and original paraphrases only, never verbatim
framework text).
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "_standards" / "castandards.json"
CSV_PATH = Path("/Users/ebrown/src/working-in-python/scratch/standards-source/CA CS Standards 3-12 - Sheet1.csv")

# Original paraphrases, written for this project from the CDE's "Standard" column
# (never copied verbatim) -- same one-sentence, plain-English style as the existing
# 9-12 entries.
PARAPHRASES = {
    "6-8.CS.1": "A computing device's design shapes how easily people can actually use it, and proposing a change to that design is itself a real engineering task.",
    "6-8.CS.2": "Building something that collects and shares data means choosing hardware and software components together, weighing tradeoffs like cost, speed, and size.",
    "6-8.CS.3": "Fixing a broken computing system means working through a structured troubleshooting process, not guessing -- and a problem in one connected device can come from another.",
    "6-8.NI.4": "Protocols are the agreed-upon rules that let messages actually get where they're going across a network, quickly and with errors handled.",
    "6-8.NI.5": "Every network faces real security threats, and different threats call for different countermeasures.",
    "6-8.NI.6": "Sending information securely usually takes more than one protective method working together, not a single fix.",
    "6-8.DA.7": "The same data can be represented in more than one way, and choosing a representation changes what's easy to see in it.",
    "6-8.DA.8": "Raw data collected with computational tools usually needs to be transformed before it's actually useful for answering a question.",
    "6-8.DA.9": "A computational model lets you change one variable at a time and observe the effect, which is how you test what's actually driving a result.",
    "6-8.AP.10": "Flowcharts and pseudocode let you design and check an algorithm before writing any real code.",
    "6-8.AP.11": "A variable's name should say what it holds, since that's what makes the operations performed on it make sense to someone reading the code.",
    "6-8.AP.12": "Real programs combine multiple control structures and compound conditions, and get built up iteratively rather than all at once.",
    "6-8.AP.13": "Breaking a problem into smaller subproblems makes it possible to design, build, and review a program piece by piece.",
    "6-8.AP.14": "A procedure that takes parameters can be reused for many different inputs instead of being rewritten each time.",
    "6-8.AP.15": "A solution actually meets user needs only if you go get feedback from teammates and users and use it to refine the design.",
    "6-8.AP.16": "Reusing someone else's code, media, or library in your own program is normal practice, as long as you credit where it came from.",
    "6-8.AP.17": "Testing a program well means trying a deliberate range of test cases, not just the one you expect to work.",
    "6-8.AP.18": "Building something as a team means splitting up tasks and keeping to a shared timeline, not just dividing the code.",
    "6-8.AP.19": "Documentation is what makes a program usable, readable, testable, and debuggable by someone other than the person who wrote it.",
    "6-8.IC.20": "Computing technologies that reshape daily life and careers always come with tradeoffs worth weighing, not just benefits.",
    "6-8.IC.21": "Existing technologies can carry real bias and accessibility problems baked into their design, worth examining directly.",
    "6-8.IC.22": "Building a computational artifact often means collaborating with many contributors, not working alone.",
    "6-8.IC.23": "A license is a tradeoff between protecting a creator's rights and letting other people use and modify their work.",
    "6-8.IC.24": "Making information public and keeping it private and secure are competing goods, and choosing between them is a real tradeoff.",
}


def main():
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if r["Grade"] == "6-8"]

    if len(rows) != len(PARAPHRASES):
        raise SystemExit(f"CSV has {len(rows)} six-eight rows but {len(PARAPHRASES)} paraphrases are written -- reconcile before proceeding.")

    catalog = json.loads(CATALOG.read_text())
    existing_codes = {s["code"] for s in catalog["standards"]}

    new_entries = []
    for row in rows:
        code = row["Standard Identifier"].strip()
        if code in existing_codes:
            raise SystemExit(f"{code} already exists in castandards.json -- refusing to duplicate.")
        if code not in PARAPHRASES:
            raise SystemExit(f"No paraphrase written for {code} -- add one before running.")
        strand = code.split(".")[1]
        new_entries.append({
            "code": code,
            "strand": strand,
            "strand_name": row["Framework Alignment: Concept"].strip(),
            "grade_band": "6-8",
            "core": True,
            "paraphrase": PARAPHRASES[code],
        })

    # Keep the array grade-band-grouped and code-sorted within each band, matching
    # the existing 9-12 ordering convention.
    new_entries.sort(key=lambda s: (s["strand"], int(s["code"].split(".")[-1])))
    catalog["standards"] = new_entries + catalog["standards"]

    catalog["meta"]["grade_band_covered"] = "6-8, 9-12"
    catalog["meta"]["shape_note"] += (
        " Extended 2026-08-28 with the 6-8 band (24 standards: CS.1-3, NI.4-6,"
        " DA.7-9, AP.10-19, IC.20-24), extracted from the teacher's own CA CS"
        " Standards 3-12 spreadsheet (working-in-python/scratch/standards-source/,"
        " gitignored). No 3-5 or 9-12 Specialty entries are indexed -- out of scope"
        " for this pass."
    )

    CATALOG.write_text(json.dumps(catalog, indent=1) + "\n")
    print(f"Added {len(new_entries)} 6-8 standards to {CATALOG}")


if __name__ == "__main__":
    main()
