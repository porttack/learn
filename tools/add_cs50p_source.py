#!/usr/bin/env python3
"""ONE-TIME addition: build a carrier file for CS50's Introduction to
Programming with Python (https://cs50.harvard.edu/python/), weeks 0-8.

Week 9 (Et Cetera + the "Congratulations!" wrap-up,
https://cs50.harvard.edu/python/notes/9/#congratulations) is deliberately
excluded by direction -- it's a grab-bag of miscellaneous syntax sugar
(sets, global variables, type hints, argparse, comprehensions, generators)
plus the course's own closing note, not sequenced instruction this teacher
uses.

Every coverage claim below traces to a heading literally present on that
week's own published lecture notes page
(https://cs50.harvard.edu/python/notes/<n>/, verified live) -- a
notes/heading mapping, not an audit of problem-set content, so it carries
the same confidence tier as cs50ap/cs50ap_extended, not cmu_cs1's
classroom-audited tier. See meta.caveat.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARRIERS_DIR = ROOT / "_standards" / "carriers"

BASE_URL = "https://cs50.harvard.edu/python/notes"

CS50P = {
    "meta": {
        "title": "CS50 Python -- weeks 0-8",
        "base_url": BASE_URL,
        "locator_kind": "week",
        "locator_url_template": "{base_url}/{locator}/",
        "source": "cs50p",
        "locator_titles": {
            "0": "Lecture 0: Functions, Variables, Strings, def",
            "1": "Lecture 1: Conditionals",
            "2": "Lecture 2: Loops, Lists, Dictionaries",
            "3": "Lecture 3: Exceptions",
            "4": "Lecture 4: Libraries",
            "5": "Lecture 5: Unit Tests",
            "6": "Lecture 6: File I/O",
            "7": "Lecture 7: Regular Expressions",
            "8": "Lecture 8: Object-Oriented Programming",
        },
        "caveat": (
            "Mapped from CS50 Python's own published lecture-notes headings"
            " (cs50.harvard.edu/python/notes/<n>/), not from an audit of"
            " problem-set content -- comparable confidence to cs50ap/"
            "cs50ap_extended, not cmu_cs1. Week 9 (Et Cetera plus the"
            " course's closing 'Congratulations!' note) is excluded by"
            " direction -- it's a miscellaneous-syntax grab-bag and a"
            " wrap-up, not sequenced instruction this teacher uses."
        ),
    },
    "coverage": {
        "apcsp": {
            "1.4": {
                "locators": [3, 5],
                "note": "Exceptions/runtime errors (week 3) is finding and fixing a mistake; assert/pytest (week 5) is picking inputs and matching expected outputs to verify a program works.",
            },
            "2.4": {
                "locators": [4],
                "note": "The Statistics heading, a named week-4 topic, is using a program (Python plus a library) to pull information out of a data set.",
            },
            "3.1": {
                "locators": [0],
                "note": "Variables is a named week-0 heading.",
            },
            "3.2": {
                "locators": [2],
                "note": "Dictionaries, a named week-2 heading, build a data abstraction out of key-value structure the way AP CSP's own list abstraction does.",
            },
            "3.3": {
                "locators": [0, 1],
                "note": "Integers, Floats (week 0) and Modulo (week 1) are named arithmetic-expression topics.",
            },
            "3.4": {
                "locators": [0],
                "note": "Strings and Parameters, Formatting Strings, and More on Strings are named week-0 headings.",
            },
            "3.5": {
                "locators": [1],
                "note": "or and and are named week-1 headings -- Boolean operators combining conditions.",
            },
            "3.6": {
                "locators": [1],
                "note": "Conditionals, if Statements, and match are named week-1 headings.",
            },
            "3.8": {
                "locators": [2],
                "note": "Loops, While Loops, and For Loops are named week-2 headings.",
            },
            "3.10": {
                "locators": [2],
                "note": "Lists, More About Lists, and Length are named week-2 headings.",
            },
            "3.12": {
                "locators": [0],
                "note": "Def and Returning Values, named week-0 headings, are calling and predicting the result of a procedure.",
            },
            "3.13": {
                "locators": [0],
                "note": "Same Def claim as 3.12 -- writing a function, not just calling one.",
            },
            "3.14": {
                "locators": [4],
                "note": "Libraries and Packages are the week's own named headings, matching this topic's title directly.",
            },
            "3.15": {
                "locators": [4],
                "note": "Random is a named week-4 heading.",
            },
        },
        "castandards": {
            "9-12.CS.1": {
                "locators": [8],
                "note": "A class's methods hiding its internal attributes behind a simpler interface -- encapsulation, the week's own Classes/Object-Oriented Programming headings -- is this standard's 'hide internal workings' claim made concrete.",
            },
            "9-12.CS.3": {
                "locators": [3, 5],
                "note": "Exceptions/runtime errors (week 3) and pytest (week 5) are both named troubleshooting-through-testing content.",
            },
            "9-12.DA.9": {
                "locators": [6],
                "note": "File I/O, CSV, and Binary Files and PIL, named week-6 headings, are literally how and where data gets organized and stored.",
            },
            "9-12.AP.13": {
                "locators": [2],
                "note": "Lists and Dictionaries, named week-2 headings, are the collection this standard describes.",
            },
            "9-12.AP.14": {
                "locators": [1],
                "note": "if/elif/else and match are two different, named control structures for the same branching task -- a real, explicit choice in the week's own material.",
            },
            "9-12.AP.16": {
                "locators": [0, 8],
                "note": "Functions (week 0) and Classes (week 8) are both named ways of decomposing a program into its own procedure or class.",
            },
            "9-12.AP.17": {
                "locators": [4],
                "note": "Libraries, Packages, and Making Your Own Libraries are named week-4 headings -- modular design built from code someone else wrote.",
            },
            "9-12.AP.20": {
                "locators": [5],
                "note": "Unit Tests and pytest, named week-5 headings, are repeated rounds of testing aimed at more than just running once.",
            },
        },
        "csta2026": {
            "HS-PRO-PD-12": {
                "locators": [0, 8],
                "note": "Functions (week 0) and Classes (week 8) are named, well-organized pieces a program gets split into.",
            },
            "HS-PRO-PD-13": {
                "locators": [4],
                "note": "Libraries, Packages, and APIs, named week-4 headings, are exactly the outside resources and reference docs this standard describes leaning on.",
            },
            "HS-PRO-VD-16": {
                "locators": [2],
                "note": "Lists and Dictionaries, named week-2 headings, are choosing the right structure to hold a program's data.",
            },
            "HS-PRO-TR-19": {
                "locators": [5],
                "note": "assert and pytest, named week-5 headings, are checking a program against its own plan.",
            },
            "HS-DAT-DC-23": {
                "locators": [7],
                "note": "Cleaning Up User Input, a named week-7 heading, is this standard's own messy-text-data problem, solved with regular expressions.",
            },
            "HS-DAT-DC-24": {
                "locators": [7],
                "note": "Extracting User Input, a named week-7 heading, is checking that a value has the shape a program expects before using it.",
            },
        },
        "ca-ict-anchor": {
            "5.9": {
                "locators": [0, 8],
                "note": "Functions (week 0) and Classes (week 8) are both named ways of breaking a large problem into smaller components.",
            },
            "5.10": {
                "locators": [4, 8],
                "note": "Using a Library (week 4) without tracking its internals, and a Class's own encapsulation (week 8), are both this standard's abstraction-layer claim.",
            },
            "C4.5": {
                "locators": [8],
                "note": "Object-Oriented Programming is this standard's own named paradigm example, in the week's own heading.",
            },
            "C4.7": {
                "locators": [2, 6],
                "note": "Lists and Dictionaries (week 2) and Files (week 6) are named ways of organizing a program's data.",
            },
            "C4.8": {
                "locators": [8],
                "note": "Classes, Inheritance, Class Methods, Static Methods, and Operator Overloading -- all named week-8 headings -- are this standard's own OOP vocabulary list.",
            },
            "C4.9": {
                "locators": [0, 1, 2],
                "note": "Functions (week 0), Conditionals (week 1), and Loops (week 2) are named instances of this standard's shared programming toolkit.",
            },
            "C5.4": {
                "locators": [5],
                "note": "Unit Tests and pytest, named week-5 headings, are testing as its own distinct step.",
            },
            "C5.6": {
                "locators": [3],
                "note": "Exceptions and runtime errors, named week-3 headings, are debugging folded into the program's own control flow.",
            },
        },
    },
}


def main():
    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    path = CARRIERS_DIR / "cs50p.json"
    if path.exists():
        raise SystemExit(f"{path} already exists -- refusing to overwrite.")
    path.write_text(json.dumps(CS50P, indent=1) + "\n")
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
