#!/usr/bin/env python3
"""ONE-TIME addition: build carrier files for two curricula reviewed (and taught)
by the author, from his own unit-by-unit standards mapping in porttack.com's
"CodeHS vs CMU" post, Appendix C:
https://github.com/porttack/porttack.com/blob/main/_posts/2026-06-10-codehs-vs-cmu.md

That appendix IS the author's own carrier analysis already, in prose/table
form -- this script just structures it into the same schema every other
source uses. Both are exploratory ("so I can take a look"), not yet decided
inclusions in any combined view.

Scope: only California 9-12 Algorithms & Programming (AP.12-22) is mapped --
that's all the source post covers. CMU CS1's own unit-by-unit table is used
as ground truth (not CMU's official standards doc, which the post itself
argues undersells the course by one standard, AP.14). CodeHS Corgi's mapping
is explicitly lower-confidence -- inferred from the public syllabus's topic
list, not audited against the platform -- and that caveat is carried into
the carrier file's meta, not hidden.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARRIERS_DIR = ROOT / "_standards" / "carriers"

CMU_UNIT_TITLES = {
    "1": "Creating Drawings",
    "2": "Functions, Mouse Events, Properties",
    "3": "Mouse Motion, Conditionals, Helper Functions",
    "4": "More Conditionals, Key Events, Methods",
    "5": "Complex Conditionals, More Key Events",
    "6": "Groups, Step Events, Motion",
    "7": "New Shapes, Local Variables, For Loops",
    "8": "Math Functions, Random, Nested Loops",
    "9": "Types, Strings, While Loops",
    "10": "Lists and Return Values",
    "11": "2D Lists and Board Games",
    "12": "Final Project",
    "creative-task": "Creative Task (every unit, 1-10)",
    "collaborative": "Collaborative task (every unit)",
}

CMU_CS1 = {
    "meta": {
        "title": "Carnegie Mellon's Introduction to Programming with Python (High School)",
        "abbrev": "CS1",
        # course-info, not the bare site root -- see cmu_cs0's carrier-building
        # script for why (client-rendered SPA, no discoverable deep-link anchor).
        "base_url": "https://academy.cs.cmu.edu/course-info",
        "locator_kind": "unit",
        "locator_url_template": None,
        "source": "cmu_cs1",
        "locator_titles": CMU_UNIT_TITLES,
        "caveat": "Mapped from the teacher's own unit-by-unit scope-and-sequence analysis"
        " (porttack.com, \"CodeHS vs CMU\", Appendix C), not from CMU's official"
        " standards document -- that document omits AP.14, which this mapping argues"
        " (with evidence from the Creative Task's own design step) is actually taught.",
    },
    "coverage": {
        "castandards": {
            "9-12.AP.12": {
                "locators": [8, 11],
                "note": "Math/random/nested loops (unit 8) and 2D lists/board-game logic (unit 11) both involve choosing and adapting existing algorithms.",
            },
            "9-12.AP.13": {
                "locators": [10, 11],
                "note": "Lists and 2D lists are core, assessed content (units 10-11), not an optional add-on.",
            },
            "9-12.AP.14": {
                "locators": [3, 4, 5, 7, 8, 9, "creative-task"],
                "note": "Woven through every conditionals/loop unit (3-5, 7-9) and made explicit in the Creative Task's own design step, which has students list the concepts they plan to use and justify why -- the standard's own language, 'justify the selection.' Not in CMU's own official standards document; the teacher's own classroom analysis argues it should be.",
            },
            "9-12.AP.15": {
                "locators": [2, 3, 4, 5, 6, 12],
                "note": "Iterative development through events (mouse, key, step) recurs across units 2-6 and the final project (unit 12).",
            },
            "9-12.AP.16": {
                "locators": [3],
                "note": "Helper functions, introduced in unit 3, are decomposition into subproblems.",
            },
            "9-12.AP.17": {
                "locators": [2, 4, 7, 10],
                "note": "Modular design via functions, methods, and library calls across units 2, 4, 7, and 10.",
            },
            "9-12.AP.18": {
                "locators": ["creative-task"],
                "note": "Design-for-audience is the Creative Task's rubric, but the rubric itself does not require a feedback step -- CMU claims the standard on the task's design intent; whether it's actually met depends on the teacher building a feedback step in. In this teacher's own classroom it is.",
            },
            "9-12.AP.19": {
                "locators": [],
                "checked": True,
                "note": "Not taught in CS1 -- software license limitations are deliberately deferred to AP CS Principles, where this teacher covers it directly with his own materials.",
            },
            "9-12.AP.20": {
                "locators": ["creative-task"],
                "note": "The Creative Task's build-reflect-revise cycle runs ten times a year.",
            },
            "9-12.AP.21": {
                "locators": ["collaborative"],
                "note": "Real-time shared-editor pair programming is built into every unit, not a capstone.",
            },
            "9-12.AP.22": {
                "locators": ["creative-task"],
                "note": "The Creative Task requires describing the program and reflecting on what changed and why -- documentation of design decisions, ten times a year.",
            },
        }
    },
}

CORGI_UNIT_TITLES = {
    "1": "Programming with Karel",
    "2": "Karel Challenges",
    "3": "JavaScript Basics",
    "4": "The Canvas and Graphics",
    "5": "Graphics Challenges",
    "6": "JavaScript Control Structures",
    "7": "Control Structures Challenges",
    "8": "Functions",
    "9": "Functions Challenges",
    "10": "Animation and Games",
    "11": "Animations Challenges",
    "12": "Project: Breakout",
    "13": "Final Project",
    "14": "Final Exam",
    "optional-extension": "Optional extension: Data Structures",
}

CODEHS_CORGI = {
    "meta": {
        "title": "CodeHS' Intro to JavaScript",
        "abbrev": "Corgi",
        "base_url": "https://codehs.com/",
        "locator_kind": "unit",
        "locator_url_template": None,
        "source": "codehs_corgi",
        "locator_titles": CORGI_UNIT_TITLES,
        "caveat": "Inferred from the public CodeHS Corgi syllabus's topic list"
        " (porttack.com, \"CodeHS vs CMU\", Appendix C), not audited against the"
        " platform directly -- the syllabus lists topics at a coarser grain than"
        " CMU's own scope and sequence, so this mapping carries materially lower"
        " confidence than the cmu_cs1 carrier file.",
    },
    "coverage": {
        "castandards": {
            "9-12.AP.12": {
                "locators": [2, 5, 7, 9, 11],
                "note": "Recurs across every 'challenges' unit (2, 5, 7, 9, 11) -- larger problems that call for choosing among algorithms already introduced.",
            },
            "9-12.AP.13": {
                "locators": ["optional-extension"],
                "note": "Arrays, lists, objects, sets, and grids live only in an optional extension sequenced after the final project -- the final exam's own listed coverage never touches them. Whether a student ever meets this standard depends on whether their teacher assigns material after the course is functionally over. Included because the extension exists, not because it's reliably taught.",
            },
            "9-12.AP.14": {
                "locators": [1, 6, 7],
                "note": "Control-structure choice appears in Karel (unit 1) and the JavaScript control-structures units (6-7), though this is inferred from the syllabus's topic list, not audited against the platform directly.",
            },
            "9-12.AP.15": {
                "locators": [10, 11, 12],
                "note": "Iterative development via animation/game events across units 10-12.",
            },
            "9-12.AP.16": {
                "locators": [1, 2],
                "note": "Karel's top-down design (units 1-2) is decomposition into subproblems.",
            },
            "9-12.AP.17": {
                "locators": [1, 3, 8, 9],
                "note": "Modular design via functions recurs in units 1, 3, 8, and 9.",
            },
            "9-12.AP.18": {
                "locators": [13],
                "note": "Design-for-audience lands only in the Unit 13 final project -- a capstone, not a recurring practice.",
            },
            "9-12.AP.20": {
                "locators": [13],
                "note": "Iterative refinement lands only in the Unit 13 final project.",
            },
            "9-12.AP.21": {
                "locators": [13],
                "note": "One collaboration lesson appears in unit 3 (driver/navigator), but the standard's own real practice is concentrated in the Unit 13 final project -- collaboration as capstone, not rhythm.",
            },
            "9-12.AP.22": {
                "locators": [13],
                "note": "Documentation lands only in the Unit 13 final project.",
            },
        }
    },
}


def main():
    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    for slug, data in [("cmu-cs1", CMU_CS1), ("codehs-corgi", CODEHS_CORGI)]:
        path = CARRIERS_DIR / f"{slug}.json"
        if path.exists():
            raise SystemExit(f"{path} already exists -- refusing to overwrite.")
        path.write_text(json.dumps(data, indent=1) + "\n")
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
