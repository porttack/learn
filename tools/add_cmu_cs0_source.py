#!/usr/bin/env python3
"""ONE-TIME addition: build a carrier file for CMU CS Academy's "Exploring
Programming" course -- which CMU's own materials call "CS0" internally
(its per-state alignment folder is literally named "CS0 State Standards",
and its California doc refers to itself as "our CS0 Course").

Source material: two PDFs the teacher dropped into tmp/ --
"Exploring Programming Course Description and Standards Alignment (1).pdf"
and "Exploring Programming S+S with Pacing Guide + Example Exercise (5).pdf"
-- plus the California-specific alignment the first PDF links out to
(academy.cs.cmu.edu's own per-state Google Doc, id
1rT47AQrjuNPlgpbjtKCtHU4hEzq_7a4ai1pa0_liX48, fetched live via Docs' own
/export?format=txt).

Two distinct kinds of evidence here, kept visibly separate in the coverage
below:

1. This carrier's OWN inference, at the 6-8 band: from the pacing guide's
   4 unit titles (Drawing with Shapes, Basic Animations, Giving Programs
   Options, Animating Lots of Shapes) -- no sub-lesson topic names are
   published for this course (unlike CS1's own teacher-audited breakdown),
   so this is coarser and lower-confidence than cmu_cs1.json, comparable to
   codehs_corgi's syllabus-title tier. Locators are the 4 unit numbers.

2. CMU's OWN OFFICIAL claim, at the 9-12 band: their CA-specific alignment
   document maps this exact course to six 9-12.AP codes. That document
   isn't lesson-localized (no unit/lesson references, just a concept-level
   table), so those entries use locators: [] per the carrier schema. Worth
   flagging plainly: CMU's own document targets the 9-12 band for a course
   it markets for middle school and short high school settings -- carried
   here as-is since it's the platform's own authoritative claim, not this
   carrier's inference. See meta.caveat.

3. The teacher's OWN firsthand knowledge of the platform, at the 6-8 band:
   AP.13 at the specific sub-lesson 4.1 (finer than this carrier's own
   unit-level locators, and not inferable from the unit title alone), and
   AP.18 via CS0's collaborative tasks -- flagged by the teacher himself as
   a stretch, and carried with that hedge intact in the entry's own note,
   the same way cmu_cs1.json carries AP.14 on the teacher's own classroom
   argument rather than CMU's official document.

Like cmu_cs1.json, this only maps against castandards -- no apcsp/csta2026/
ca-ict-anchor claims, matching that carrier's own precedent for CMU sources.

meta.base_url points at academy.cs.cmu.edu/course-info rather than the bare
site root -- that page is a client-rendered React SPA (no server-side HTML,
content loaded by a JS bundle) with no discoverable stable hash/anchor of
its own for deep-linking straight to the "Exploring Programming with
Python" box (searched both shipped JS bundles for "exploring" and for a
location.hash/scrollIntoView convention -- neither turned up anything
usable). The URL uses a browser-native Text Fragment
(#:~:text=EXPLORE%20THE%204%20UNITS) instead, which sidesteps that entirely
-- the browser scrolls to and highlights the matching text in the *rendered*
DOM after the SPA's own JS paints it, independent of whatever routing the
site itself does or doesn't support. Supported by Chromium-based browsers
and recent Safari; unsupported browsers just load the plain page, no error.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARRIERS_DIR = ROOT / "_standards" / "carriers"

CMU_CS0 = {
    "meta": {
        "title": "CMU Exploring Programming with Python",
        "abbrev": "CS0",
        "base_url": "https://academy.cs.cmu.edu/course-info#:~:text=EXPLORE%20THE%204%20UNITS",
        "locator_kind": "unit",
        "locator_url_template": None,
        "source": "cmu_cs0",
        "locator_titles": {
            "1": "Drawing with Shapes",
            "2": "Basic Animations",
            "3": "Giving Programs Options",
            "4": "Animating Lots of Shapes",
            "4.1": "Unit 4, Lesson 1 (within Animating Lots of Shapes)",
            "creative-task": "Creative Tasks (every unit, 1-4)",
            "collaborative": "Collaborative tasks",
        },
        "caveat": (
            "Two different confidence tiers, kept distinct in the coverage below."
            " The 6-8 codes are this carrier's own inference from the pacing"
            " guide's 4 unit titles alone -- no sub-lesson topic names are"
            " published for this course, so it's a coarser, lower-confidence"
            " read than cmu_cs1.json's teacher-audited unit breakdown, closer"
            " to codehs_corgi's syllabus-title tier (locators: [] entries"
            " below don't mean 'not tracked,' they mean 'no lesson-level"
            " reference exists to point to'). The 9-12 codes are CMU's own"
            " official claim, from academy.cs.cmu.edu's own CA-specific"
            " alignment document (a concept-level table, not lesson-"
            " localized, hence locators: [] there too) -- that document"
            " targets the 9-12 band for a course CMU itself markets for"
            " middle school and short high school settings. Carried as-is"
            " since it's the platform's own authoritative claim, not an"
            " inference by this carrier."
        ),
    },
    "coverage": {
        "castandards": {
            "6-8.AP.11": {
                "locators": [1],
                "note": "Drawing with Shapes, an introductory graphics unit, is where a first course names variables for shape properties (position, size, color) -- inferred from the unit title alone, not a confirmed lesson breakdown.",
            },
            "6-8.DA.7": {
                "locators": [1],
                "note": "A shape's position, size, and color are all numeric properties -- the same drawn shape can be built from different property values, the representation choice this standard names. Inferred from the unit title.",
            },
            "6-8.AP.12": {
                "locators": [2, 3, 4],
                "note": "Basic Animations (a repeating step mechanism), Giving Programs Options (the unit's own title names branching), and Animating Lots of Shapes (looping over many objects) are each control-structure content, built up across three units rather than introduced all at once. Inferred from unit titles.",
            },
            "6-8.AP.15": {
                "locators": ["creative-task"],
                "note": "CMU's Creative Task feature (shared across its courses, including CS1) asks for a design intent statement, but its rubric doesn't itself require a feedback step -- whether this standard is actually met depends on the teacher building one in, same caveat cmu_cs1.json carries for the 9-12 equivalent (AP.18).",
            },
            "6-8.AP.13": {
                "locators": ["4.1"],
                "note": "Per the teacher's own knowledge of this lesson (not documented in CMU's own published materials): Unit 4's first lesson has students break the many-shapes problem into smaller subproblems before assembling the full animation.",
            },
            "6-8.AP.18": {
                "locators": ["collaborative"],
                "note": "A stretch, by the teacher's own admission: CS0's collaborative tasks split work between partners, which is this standard's own team/role framing, though it's a lighter, shorter-form version of it than a full-length course's collaborative work would be.",
            },
            "9-12.AP.12": {
                "locators": [],
                "note": "CMU's own CA alignment doc, Subconcept Algorithms: 'Design algorithms to solve computational problems using a combination of original and existing algorithms.' Concept-level claim, not lesson-localized in that document.",
            },
            "9-12.AP.13": {
                "locators": [],
                "note": "CMU's own CA alignment doc, Subconcept Variables: 'Create more generalized computational solutions using collections instead of repeatedly using simple variables.'",
            },
            "9-12.AP.15": {
                "locators": [],
                "note": "CMU's own CA alignment doc, Subconcept Control: 'Iteratively design and develop computational artifacts... by using events to initiate instructions.'",
            },
            "9-12.AP.17": {
                "locators": [],
                "note": "CMU's own CA alignment doc, Subconcept Modularity: 'Create computational artifacts using modular design.'",
            },
            "9-12.AP.20": {
                "locators": [],
                "note": "CMU's own CA alignment doc, Subconcept Program Development: 'Iteratively evaluate and refine a computational artifact to enhance its performance, reliability, usability, and accessibility.'",
            },
            "9-12.AP.22": {
                "locators": [],
                "note": "CMU's own CA alignment doc: 'Document decisions made during the design process using text, graphics, presentations, and/or demonstrations in the development of complex programs.'",
            },
        }
    },
}


def main():
    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    path = CARRIERS_DIR / "cmu-cs0.json"
    if path.exists():
        raise SystemExit(f"{path} already exists -- refusing to overwrite.")
    path.write_text(json.dumps(CMU_CS0, indent=1) + "\n")
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
