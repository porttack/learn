#!/usr/bin/env python3
"""ONE-TIME addition: build carrier files for the slice of CS50 AP's own
curriculum (https://cs50.harvard.edu/ap/2025/curriculum/) this teacher
actually uses, split into two sources:

- cs50ap: the taught subset -- data representation out of weeks 0 and 4,
  all of week 3 (Algorithms), and weeks 7-9 (SQL, HTML/CSS/JS, Flask).
- cs50ap_extended: the remainder of weeks 0-6 -- everything else in weeks
  0 and 4, plus weeks 1, 2, 5, 6 in full.

The weeks-0-and-4 split between "data representation" and everything else
in those weeks is this teacher's own editorial cut for AP CSP's Data big
idea, not a division CS50 itself draws.

Deliberately excluded, by direction: CS50T, the AP-specific modules (Data
Science, Impact of Computing), week 10 (Cybersecurity), the Final Project,
and the practice-problem bank.

Every coverage claim below traces to a topic literally named on that week's
own published page (verified live against
https://cs50.harvard.edu/ap/2025/curriculum/x/weeks/<n>/) -- this is a
topic-list mapping, not an audit of lecture or problem-set content, so it
carries codehs_corgi-level confidence, not cmu_cs1-level. See each file's
meta.caveat.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARRIERS_DIR = ROOT / "_standards" / "carriers"

BASE_URL = "https://cs50.harvard.edu/ap/2025/curriculum"
CAVEAT = (
    "Mapped from CS50 AP's own published per-week topic lists"
    " ({base_url}/x/weeks/<n>/), not from an audit of lecture or"
    " problem-set content -- comparable confidence to codehs_corgi, not"
    " cmu_cs1. The weeks-0-and-4 split between 'data representation' and"
    " everything else in those weeks is this teacher's own editorial cut,"
    " not a division CS50 itself draws; see {other} for the other half."
).format(base_url=BASE_URL, other="{other}")

CS50AP = {
    "meta": {
        "title": "CS50 AP -- taught subset (weeks 0, 3, 4, 7-9)",
        "base_url": BASE_URL,
        "locator_kind": "week",
        "locator_url_template": "{base_url}/x/weeks/{locator}/",
        "source": "cs50ap",
        "locator_titles": {
            "0": "Week 0: Scratch -- data representation only (unary, binary, decimal, ASCII, Unicode, RGB)",
            "3": "Week 3: Algorithms (searching, sorting, asymptotic notation, recursion)",
            "4": "Week 4: Memory -- data representation only (hexadecimal, images, file I/O)",
            "7": "Week 7: SQL",
            "8": "Week 8: HTML, CSS, JavaScript",
            "9": "Week 9: Flask",
        },
        "caveat": CAVEAT.format(other="cs50ap_extended"),
    },
    "coverage": {
        "apcsp": {
            "2.1": {
                "locators": [0, 4],
                "note": "Unary/binary/decimal/ASCII/Unicode/RGB (week 0) and hexadecimal (week 4) are both explicitly named -- this is DAT-1's own topic, encoding information as sequences of bits.",
            },
            "2.4": {
                "locators": [7],
                "note": "SQL is literally a program for pulling information out of a data set -- Tables, Statements, and Keywords/Functions are named week-7 topics.",
            },
            "3.9": {
                "locators": [3],
                "note": "Comparing Linear Search against Binary Search, and Bubble/Selection Sort against Merge Sort, is exactly 'compare two or more algorithms to see whether they produce the same outcome.'",
            },
            "3.11": {
                "locators": [3],
                "note": "Binary Search is a named subsection of week 3, alongside its own Shorts video.",
            },
            "3.17": {
                "locators": [3],
                "note": "Asymptotic Notation (O, Ω, Θ) is the week's own explicit framing for algorithmic efficiency.",
            },
            "4.1": {
                "locators": [8],
                "note": "Routers, TCP/IP, and DNS are named week-8 topics, with an 'Internet Primer' Short and demo ('Passing TCP/IP Packet').",
            },
            "5.6": {
                "locators": [7, 9],
                "note": "SQL Injection Attacks are a named week-7 topic (an attack method); Sessions and Cookies (week 9) are the mechanism by which a site collects and holds data about a visitor across requests.",
            },
        },
        "castandards": {
            "9-12.DA.8": {
                "locators": [0, 4],
                "note": "Same representation claim as apcsp 2.1: the same image or character can be encoded more than one way (unary/binary/decimal/ASCII/Unicode/RGB, hexadecimal).",
            },
            "9-12.DA.9": {
                "locators": [7],
                "note": "SQL's own named topics -- Tables, Types, Constraints, Indexes -- are exactly 'how data is organized and where it's stored.'",
            },
            "9-12.NI.5": {
                "locators": [8],
                "note": "DNS plus routing (named week-8 topics) is literally 'how the internet looks up addresses and routes traffic.'",
            },
            "9-12.NI.6": {
                "locators": [7],
                "note": "SQL Injection Attacks, a named topic, is a concrete security threat calling for a specific defense (parameterized queries).",
            },
            "9-12.AP.12": {
                "locators": [3],
                "note": "Same algorithms-comparison claim as apcsp 3.9.",
            },
            "9-12.IC.29": {
                "locators": [9],
                "note": "Sessions and Cookies, named week-9 topics, are the concrete mechanism for collecting a visitor's data automatically between requests.",
            },
        },
        "csta2026": {
            "HS-ALG-PS-03": {
                "locators": [3],
                "note": "Asymptotic Notation is comparing algorithms by more than whether they're correct.",
            },
            "HS-DAT-DC-22": {
                "locators": [7],
                "note": "SQL's Types and Constraints, applied per column, are a data dictionary made explicit and enforced by the database itself.",
            },
            "HS-SYS-NT-34": {
                "locators": [8],
                "note": "Routers, TCP/IP, and DNS are the named physical/logical pieces a network diagram would show.",
            },
            "HS-SYS-NT-35": {
                "locators": [8],
                "note": "The week frames the internet as networks cooperating (Routers, TCP/IP, DNS) rather than one single network.",
            },
            "HS-SYS-SE-33": {
                "locators": [7],
                "note": "SQL Injection Attacks, paired with its standard defense (parameterized queries), is 'given a weakness, propose a fix.'",
            },
        },
        "ca-ict-anchor": {
            "5.11": {
                "locators": [0, 4],
                "note": "Base conversion -- unary/binary/decimal (week 0), hexadecimal (week 4) -- is this anchor standard by name.",
            },
            "5.12": {
                "locators": [3],
                "note": "Binary Search depends on the Boolean comparison at each step (higher/lower/found).",
            },
            "10.6": {
                "locators": [0, 4],
                "note": "RGB (week 0) and Images/file I/O (week 4) are concrete cases of different media taking different amounts of data to represent.",
            },
            "C4.2": {
                "locators": [8, 9],
                "note": "JavaScript (client-side), Flask (server-side), and SQL (query language) interacting is this standard's own example, and is literally how weeks 7-9 fit together.",
            },
            "C7.1": {
                "locators": [8],
                "note": "The week-8 internet primer (routers, servers, DNS) is the hardware-and-software-together claim this standard makes.",
            },
            "C7.5": {
                "locators": [9],
                "note": "Flask, with Route and Sessions, is the point where a project becomes an actually-served application rather than a local script.",
            },
            "C8.1": {
                "locators": [7],
                "note": "SQL is a full week on its own -- databases get more instructional weight here than anywhere else in this teacher's courses.",
            },
            "C8.2": {
                "locators": [7],
                "note": "Tables (a named topic) are exactly this standard's 'fields, records, tables, and views.'",
            },
            "C8.5": {
                "locators": [7],
                "note": "SQL's own Statements and Keywords/Functions are how a database gets queried and manipulated.",
            },
        },
    },
}

CS50AP_EXTENDED = {
    "meta": {
        "title": "CS50 AP -- extended (weeks 0-6 remainder)",
        "base_url": BASE_URL,
        "locator_kind": "week",
        "locator_url_template": "{base_url}/x/weeks/{locator}/",
        "source": "cs50ap_extended",
        "locator_titles": {
            "0": "Week 0: Scratch -- everything but data representation (computational thinking, abstraction, algorithms, pseudocode, Scratch constructs)",
            "1": "Week 1: C",
            "2": "Week 2: Arrays",
            "4": "Week 4: Memory -- everything but data representation (pointers, segmentation faults, dynamic memory allocation, stack, heap, buffer overflow)",
            "5": "Week 5: Data Structures",
            "6": "Week 6: Python",
        },
        "caveat": CAVEAT.format(other="cs50ap"),
    },
    "coverage": {
        "apcsp": {
            "1.4": {
                "locators": [2],
                "note": "Debugging ('Step through', 'Step into'), a named week-2 topic with its own Shorts, is finding and fixing a mistake in a program.",
            },
            "3.1": {
                "locators": [1, 6],
                "note": "Variables is a named topic in both C (week 1) and Python (week 6).",
            },
            "3.2": {
                "locators": [2, 5],
                "note": "Strings and Arrays (week 2) and Abstract Data Types (week 5) are all ways of building a data abstraction on top of a single variable.",
            },
            "3.3": {
                "locators": [1],
                "note": "Operators is a named week-1 topic; Integer Overflow and Floating-Point Imprecision are what happens when a mathematical expression's result doesn't fit its type.",
            },
            "3.4": {
                "locators": [2],
                "note": "Strings is a named week-2 topic.",
            },
            "3.5": {
                "locators": [6],
                "note": "Python's own topic line names 'Boolean Expressions' directly.",
            },
            "3.6": {
                "locators": [1, 6],
                "note": "Conditionals (C) and Conditionals (Python) are both named topics.",
            },
            "3.8": {
                "locators": [1, 6],
                "note": "Loops is a named topic in both weeks.",
            },
            "3.10": {
                "locators": [2, 5],
                "note": "Arrays (week 2) and the list-like Abstract Data Types -- Queues, Stacks, Linked Lists (week 5) -- are both named.",
            },
            "3.12": {
                "locators": [2, 6],
                "note": "Functions is a named Shorts topic in week 2 and an explicit topic ('Functions, Arguments, Return Values') in week 6.",
            },
            "3.13": {
                "locators": [2, 6],
                "note": "Same functions claim as 3.12 -- writing them, not just calling them.",
            },
            "3.14": {
                "locators": [1, 6],
                "note": "Header Files, Libraries, and Manual Pages (week 1) and Modules, Packages (week 6) are both named topics.",
            },
        },
        "castandards": {
            "9-12.CS.2": {
                "locators": [1, 4],
                "note": "Source Code -> Compiler -> Machine Code (week 1) and pointers/stack/heap (week 4) are the software-and-hardware layers this standard names, made visible instead of hidden.",
            },
            "9-12.CS.3": {
                "locators": [2],
                "note": "Debugging, plus reliance on Manual Pages, is troubleshooting a problem through research and testing.",
            },
            "9-12.AP.13": {
                "locators": [2, 5],
                "note": "Arrays (week 2) and the named Abstract Data Types (week 5) are collections replacing separately named variables.",
            },
            "9-12.AP.14": {
                "locators": [1, 6],
                "note": "The same Conditionals/Loops task reads and runs differently in C versus Python -- a real, named-topic-grounded control-structure choice.",
            },
            "9-12.AP.16": {
                "locators": [2, 6],
                "note": "Functions (named in both weeks) are decomposition into a subproblem solved on its own.",
            },
            "9-12.AP.17": {
                "locators": [1, 6],
                "note": "Libraries (week 1) and Modules/Packages (week 6) are modular design built from code someone else wrote.",
            },
            "9-12.NI.7": {
                "locators": [2],
                "note": "Cryptography, a named week-2 topic (Caesar and Vigenère ciphers in the problem set), is a symmetric-key technique for protecting data.",
            },
        },
        "csta2026": {
            "HS-ALG-PS-01": {
                "locators": [5],
                "note": "Choosing the right data structure -- queue, stack, linked list, tree, hash table -- for a job is the whole week.",
            },
            "HS-PRO-PD-12": {
                "locators": [2, 6],
                "note": "Functions, named in both weeks, are splitting a program into well-organized pieces.",
            },
            "HS-PRO-PD-13": {
                "locators": [1],
                "note": "Manual Pages, a named week-1 topic, are exactly the reference documentation this standard describes leaning on.",
            },
            "HS-PRO-VD-16": {
                "locators": [2, 5],
                "note": "Arrays (week 2) and the named data structures (week 5) are choosing the right structure to hold a program's data.",
            },
        },
        "ca-ict-anchor": {
            "5.9": {
                "locators": [2, 6],
                "note": "Functions, named in both weeks, are breaking a large problem into smaller components.",
            },
            "5.10": {
                "locators": [0, 1, 5],
                "note": "Abstraction is a named week-0 topic; the Source Code/Compiler/Machine Code pipeline (week 1) and Abstract Data Types (week 5) are both layers that let you work with a system without tracking every detail underneath.",
            },
            "5.8": {
                "locators": [0],
                "note": "Algorithms and Pseudocode, named week-0 topics, introduce algorithms as a general problem-solving tool before any specific language.",
            },
            "10.8": {
                "locators": [2],
                "note": "Cryptography, a named week-2 topic, is this standard's own 'encryption' concept.",
            },
            "C4.1": {
                "locators": [1, 6],
                "note": "C (week 1) and Python (week 6) are named, back-to-back, as this teacher's own low-level-to-high-level range.",
            },
            "C4.4": {
                "locators": [1],
                "note": "Types is a named week-1 topic; Integer Overflow and Floating-Point Imprecision are what it means for a type to have a specific encoding with real limits.",
            },
            "C4.6": {
                "locators": [1],
                "note": "Syntax Highlighting, a named week-1 topic (in VS Code), foregrounds that C has its own syntax to use correctly.",
            },
            "C4.7": {
                "locators": [2, 5],
                "note": "Arrays (week 2) and the named data structures (week 5) are this standard's own list of ways to organize a program's data.",
            },
            "C4.9": {
                "locators": [1, 6],
                "note": "Conditionals, Loops, and Functions -- named in both weeks -- are the shared toolkit this standard describes.",
            },
            "C5.4": {
                "locators": [2],
                "note": "Debugging, a named week-2 topic with two dedicated Shorts, is testing applied as its own distinct step.",
            },
            "C5.6": {
                "locators": [2],
                "note": "Same claim as C5.4 -- debugging named directly, not folded into 'writing code.'",
            },
        },
    },
}


def main():
    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    for slug, data in [("cs50ap", CS50AP), ("cs50ap-extended", CS50AP_EXTENDED)]:
        path = CARRIERS_DIR / f"{slug}.json"
        if path.exists():
            raise SystemExit(f"{path} already exists -- refusing to overwrite.")
        path.write_text(json.dumps(data, indent=1) + "\n")
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
