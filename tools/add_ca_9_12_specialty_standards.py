#!/usr/bin/env python3
"""ONE-TIME addition: extract California's "9-12 Specialty" CS standards
(codes + strand only) from the teacher-supplied CSV and append them to
_standards/castandards.json alongside the existing 6-8/9-12 core entries,
matching that file's exact schema.

Source CSV: working-in-python/scratch/standards-source/CA CS Standards 3-12 -
Sheet1.csv (gitignored scratch, grades 3-12, includes personal course-mapping
columns that are NOT extracted here -- only Standard Identifier, Grade, and
Framework Alignment: Concept are read, to get the code, grade band, and
strand). The "Standard" and "Descriptive Statement" columns are the CDE's own
text and are read only to inform the paraphrase below -- never copied in, per
this repo's non-negotiable #1 (codes and original paraphrases only, never
verbatim framework text).

This is a different, non-core standard set from the 6-8/9-12 core bands (see
castandards.json's own shape_note) -- marked core: False here, same meaning
csta2017.json already gives that field for its own non-core (Level 3B)
entries.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "_standards" / "castandards.json"
CSV_PATH = Path("/Users/ebrown/src/working-in-python/scratch/standards-source/CA CS Standards 3-12 - Sheet1.csv")
GRADE_BAND = "9-12 Specialty"

# Original paraphrases, written for this project from the CDE's "Standard" and
# "Descriptive Statement" columns (never copied verbatim) -- same one-sentence,
# plain-English style as the existing 6-8/9-12 entries.
PARAPHRASES = {
    "9-12S.CS.1": "A processor's logic gates -- AND, OR, NOT -- combine into higher-level circuits like adders, and that's the literal hardware carrying out a program's instructions.",
    "9-12S.CS.2": "An operating system's separate jobs -- managing memory, storage, running processes, controlling access -- can each be named and told apart.",
    "9-12S.NI.3": "A network's addressing scheme and its mix of routers, switches, and servers together determine how well it scales and how reliably traffic actually arrives.",
    "9-12S.NI.4": "The internet scales and keeps growing because of design choices baked into it from the start -- redundancy, open standards, and pushing key functions out to the endpoints rather than the middle of the network.",
    "9-12S.NI.5": "Defending against a security threat means weighing real tradeoffs, like a password policy that's easier to use against the cost of it being easier to break.",
    "9-12S.NI.6": "Cryptography, plus the certificate authorities that vouch for who owns an encryption key, is what actually secures a connection across the open internet.",
    "9-12S.DA.7": "Which data-collection tool you pick, and how carefully you use it, determines whether the data you end up with can actually support a real conclusion.",
    "9-12S.DA.8": "Software tools for analyzing, summarizing, and visualizing a genuinely large dataset are what make patterns in complex, real-world systems visible at all.",
    "9-12S.DA.9": "A model or simulation is only useful for refining a hypothesis once you've judged how accurately it actually represents the system it's standing in for.",
    "9-12S.AP.10": "AI already sits inside plenty of everyday software and physical systems -- research one and explain how it's actually doing its job there.",
    "9-12S.AP.11": "Building a small AI-driven program that handles a simple task a living thing would normally do -- like navigating toward a goal -- is different from implementing AI theory from scratch.",
    "9-12S.AP.12": "Writing a real search or sort into a program to organize or retrieve data matters more here than choosing the fastest algorithm.",
    "9-12S.AP.13": "The same task written two different ways can run at very different speeds, and naming that difference with a time class -- linear, quadratic, log n -- makes the comparison concrete.",
    "9-12S.AP.14": "Different data structures trade off differently for the same basic operations -- inserting, deleting, modifying -- and picking one over another is a real design decision, not a formality.",
    "9-12S.AP.15": "Tracing how a recursive algorithm actually resolves means following the chain of calls down to a base case and back up again, not just trusting that it works.",
    "9-12S.AP.16": "A big, real-world problem usually decomposes into smaller pieces that already have a solution -- reusable code or a known procedure -- if you can spot the pattern.",
    "9-12S.AP.17": "A problem substantial enough to need decomposing is also substantial enough to justify building it from your own procedures, modules, or objects instead of one long script.",
    "9-12S.AP.18": "Pulling in a well-tested library or API instead of reimplementing its functionality is what code reuse actually looks like in practice.",
    "9-12S.AP.19": "Planning software for people beyond yourself means following an actual development-lifecycle process, not just writing until it works.",
    "9-12S.AP.20": "The same solution often needs to exist on more than one platform -- desktop, web, mobile -- and building it for more than one is the point here.",
    "9-12S.AP.21": "Reading someone else's code well enough to spot a security hole, show how a specific input would exploit it, and then close it is the actual skill.",
    "9-12S.AP.22": "A meaningful set of test cases covers ordinary behavior and the edge cases at the boundary, not just the input you expect to work.",
    "9-12S.AP.23": "Adding functionality to existing code means also tracking down what that change might break elsewhere, intended or not.",
    "9-12S.AP.24": "A code review means walking someone through your own code, and following along with real questions when someone else walks through theirs.",
    "9-12S.AP.25": "Building software as a group means actually using the tools that make group development work -- version control, a real IDE, documentation practices -- not just splitting up files.",
    "9-12S.AP.26": "Different programming languages fit different problems better, and being able to say why a specific language suits a specific task is the actual comparison.",
    "9-12S.IC.27": "Judging a computational artifact means naming both who it actually helps and who it actually harms, and proposing something concrete to fix the harm.",
    "9-12S.IC.28": "A technology that already reshaped some part of culture is still moving, and describing where it goes next -- and what that costs or brings -- is the forecast being asked for.",
    "9-12S.IC.29": "Access to computing resources isn't handed out evenly, and naming who actually benefits versus who's left out is the equity question here.",
    "9-12S.IC.30": "Real laws and regulations -- net neutrality is the classic case -- shape what software even gets built, and arguing both sides of that is the point.",
}


def main():
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if r["Grade"] == GRADE_BAND]

    if len(rows) != len(PARAPHRASES):
        raise SystemExit(f"CSV has {len(rows)} 9-12 Specialty rows but {len(PARAPHRASES)} paraphrases are written -- reconcile before proceeding.")

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
            "grade_band": GRADE_BAND,
            "core": False,
            "paraphrase": PARAPHRASES[code],
        })

    # Keep the array grade-band-grouped and code-sorted within each band,
    # appended after the existing 6-8/9-12 entries, matching how the 6-8 band
    # was prepended in front rather than interleaved.
    new_entries.sort(key=lambda s: (s["strand"], int(s["code"].split(".")[-1])))
    catalog["standards"] = catalog["standards"] + new_entries

    catalog["meta"]["grade_band_covered"] = "6-8, 9-12, 9-12 Specialty"
    catalog["meta"]["shape_note"] = (
        "Extraction matches the expected shape exactly: five strands, thirty core 9-12 standards "
        "(CS.1-3, NI.4-7, DA.8-11, AP.12-22, IC.23-30). Extended 2026-08-28 with the 6-8 band (24 "
        "standards: CS.1-3, NI.4-6, DA.7-9, AP.10-19, IC.20-24), extracted from the teacher's own CA "
        "CS Standards 3-12 spreadsheet (working-in-python/scratch/standards-source/, gitignored). "
        "Extended again 2026-08-29 with the '9-12 Specialty' set (30 standards: CS.1-2, NI.3-6, "
        "DA.7-9, AP.10-26, IC.27-30), marked core: False -- a separate, more advanced/specialized "
        "pathway defined in the same CDE document, not a deeper version of the core 9-12 standards. "
        "No 3-5 entries are indexed -- out of scope for this pass."
    )

    CATALOG.write_text(json.dumps(catalog, indent=1) + "\n")
    print(f"Added {len(new_entries)} 9-12 Specialty standards to {CATALOG}")


if __name__ == "__main__":
    main()
