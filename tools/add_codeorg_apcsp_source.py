#!/usr/bin/env python3
"""ONE-TIME addition: build a carrier file for the Code.org-authored units of
the "Code.org + CMU CS Academy Computer Science Principles" blended
syllabus -- the units CMU's own programming units (see cmu-csp.json) do
NOT replace.

Source material: "Code.org + CMU CS Academy CSP Syllabus (1).pdf" (the
teacher-provided syllabus, which renumbers the blend into 10 units and
names which units are Code.org's vs CMU's) plus code.org's own published
per-unit standards pages, fetched live at
https://curriculum.code.org/csp-20/unit<N>/standards/ (CS Principles
2020-2021 edition -- the most recent standards-alignment pages that could
be reached; code.org's live studio.code.org/courses/csp-2024/standards
page is a client-rendered SPA with no accessible static standards data).
The AP CSP framework hasn't materially changed since the 2020-21 revision
(the same Big Idea codes -- CRD/DAT/AAP/CSN/IOC -- this repo's own
apcsp.json catalogs), so citing that edition's per-unit breakdown is a
reasonable stand-in for whatever the current studio.code.org edition
actually ships, but it is still a different year's edition, not a live
read of the current one -- flagged here, not hidden.

TWO DIFFERENT NUMBERING SCHEMES ARE IN PLAY -- do not conflate them:

1. The BLENDED syllabus's own numbering (the "Code.org + CMU CS Academy
   CSP Syllabus" PDF): 10 units, alternating Code.org and CMU authorship.
   Code.org's units land at 1, 2, 5, 8, 10 in this scheme (Digital
   Information, The Internet, Data, Cybersecurity and Global Impacts,
   Algorithms respectively) -- this is what the carrier's own meta.title
   below cites, since it's the number a teacher planning the blended
   course actually sees.
2. Code.org's OWN standalone numbering, from the CSP-20 edition used for
   standards lookup above: Digital Information is unit 1, The Internet is
   unit 2, Algorithms is unit 6, Data is unit 9, Cybersecurity and Global
   Impacts is unit 10. This is what this carrier's own LOCATORS are keyed
   by, and what every tooltip link below actually points to
   (https://curriculum.code.org/csp-20/unit<N>/) -- because that's the
   only numbering code.org's own site understands.

The two schemes only coincide by coincidence, for units 1 and 2 (both
schemes put Code.org's own first two units first). They diverge from
there: blended-5/8/10 vs standalone-9/10/6. A reader clicking a locator
link and checking the URL's unit number against the carrier's own title
will see different numbers for Data, Cybersecurity, and Algorithms --
expected, not a bug.

Code.org's own programming units (App Lab/JavaScript) are excluded
entirely -- in this blend they are never taught; CMU's Python units
replace them outright (see cmu-csp.json's own docstring).

Four kinds of evidence, kept distinct:

1. apcsp and csta2017 codes -- read directly off code.org's own published
   per-unit standards pages (csp-20/unit<N>/standards/). This is the
   platform's own claim about its own content, the same confidence tier
   cmu-cs0.json gives CMU's own CA alignment document.
2. castandards codes -- NOT independently researched. Derived mechanically
   from this carrier's own csta2017 codes via
   _standards/crosswalk-castandards-csta2017.json. Several of code.org's
   own cited CSTA codes are Level 3B (elective/specialty) and have no CA
   counterpart at all per that crosswalk (3B-DA-05, 3B-DA-06, 3B-AP-08,
   3B-AP-10, 3B-AP-11, 3B-NI-04, 3B-IC-28) -- carried here as csta2017-only
   entries, with no castandards claim, rather than silently dropped.
3. AAP-strand apcsp codes on the Algorithms unit (3.9 Developing
   Algorithms) additionally get an independent, this-carrier's-own
   castandards claim (9-12.AP.12) where the crosswalk gave no match --
   marked as such, distinct from the mechanically-derived entries above.
4. csta2026 and ca-ict-anchor codes -- this carrier's own topic-level
   inference, kept sparse (only a clean, specific match per unit, not
   forced onto all five).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARRIERS_DIR = ROOT / "_standards" / "carriers"

DERIVED_NOTE = "Mechanically derived from this carrier's own csta2017 entry for this unit via the castandards-csta2017 crosswalk (strength: {strength}) -- not independently checked against a code.org source document."

# code.org's own CSP-20 standalone unit numbers (NOT the blended syllabus's
# numbering -- see module docstring). Used as locators throughout, since
# these are what curriculum.code.org/csp-20/unit<N>/ actually resolves.
DIGITAL_INFORMATION = 1
THE_INTERNET = 2
ALGORITHMS = 6
DATA = 9
CYBERSECURITY_GLOBAL_IMPACTS = 10

CODEORG_APCSP = {
    "meta": {
        "title": "Code.org's AP CSP (Units 1,2,5,8,10)",
        "abbrev": "CO-CSP",
        "base_url": "https://curriculum.code.org/csp-20/",
        "locator_kind": "unit",
        "locator_url_template": "{base_url}unit{locator}/",
        "source": "codeorg_apcsp",
        "locator_titles": {
            "1": "Unit 1: Digital Information",
            "2": "Unit 2: The Internet",
            "6": "Unit 6: Algorithms",
            "9": "Unit 9: Data",
            "10": "Unit 10: Cybersecurity and Global Impacts",
        },
        "caveat": (
            "Title cites the BLENDED syllabus's own unit numbers (1, 2, 5,"
            " 8, 10 -- the co-branded 'Code.org + CMU CS Academy CSP"
            " Syllabus' PDF's own numbering). Locators and links use a"
            " DIFFERENT numbering instead: code.org's own CSP-20 standalone"
            " unit numbers (1, 2, 6, 9, 10), since that's the only scheme"
            " curriculum.code.org's URLs understand. The two schemes only"
            " agree by coincidence, for units 1-2; see this file's own"
            " module docstring for the full mapping. apcsp and csta2017"
            " entries are read directly off code.org's own published"
            " per-unit standards pages (the CS Principles 2020-2021"
            " edition, the most recent one with accessible static"
            " standards data -- the current studio.code.org edition may"
            " number or word things differently, though the underlying AP"
            " CSP framework hasn't changed). castandards entries are NOT"
            " independently sourced: they're mechanically derived from"
            " this carrier's own csta2017 codes via"
            " _standards/crosswalk-castandards-csta2017.json, so treat"
            " them as exactly as confident as the csta2017 claim they"
            " ride on -- except where marked as this carrier's own"
            " inference instead. Several of code.org's own cited CSTA"
            " codes are Level 3B (elective) standards with no CA"
            " counterpart at all; those are carried as csta2017-only,"
            " with no castandards line. csta2026 and ca-ict-anchor"
            " entries are this carrier's own topic-level inference, kept"
            " deliberately sparse."
        ),
    },
    "coverage": {
        "apcsp": {
            "2.1": {
                "locators": [DIGITAL_INFORMATION],
                "note": "code.org's own CSP-20 Unit 1 standards page cites DAT-1.A, DAT-1.B, and DAT-1.C for Digital Information -- binary representation of numbers, text, and images.",
            },
            "2.2": {
                "locators": [DIGITAL_INFORMATION],
                "note": "code.org's own CSP-20 Unit 1 standards page cites DAT-1.D for Digital Information -- lossy/lossless compression.",
            },
            "5.5": {
                "locators": [DIGITAL_INFORMATION, THE_INTERNET, CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "code.org's own standards pages cite IOC-1.F for all three units: Digital Information's debate over digitizing information, The Internet's legal/ethical concerns (IOC-1.F.10), and Cybersecurity and Global Impacts' own IOC-1.F line.",
            },
            "4.1": {
                "locators": [THE_INTERNET],
                "note": "code.org's own CSP-20 Unit 2 standards page cites CSN-1.A through CSN-1.D for The Internet -- how the internet's protocols and addressing work.",
            },
            "4.2": {
                "locators": [THE_INTERNET],
                "note": "code.org's own CSP-20 Unit 2 standards page cites CSN-1.E (fault tolerance) for The Internet.",
            },
            "5.2": {
                "locators": [THE_INTERNET],
                "note": "code.org's own CSP-20 Unit 2 standards page cites IOC-1.C (digital divide) for The Internet's discussion of who does and doesn't have access.",
            },
            "5.6": {
                "locators": [THE_INTERNET, CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "code.org's own standards pages cite IOC-2.B for The Internet (.6) and IOC-2.A/B/C for Cybersecurity and Global Impacts -- safe computing practices and the risks of computing innovations.",
            },
            "3.9": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.L (developing algorithms).",
            },
            "3.3": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.A and AAP-2.B.",
            },
            "3.6": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.G.",
            },
            "3.8": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.J.",
            },
            "3.10": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.O.",
            },
            "3.11": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-2.P (binary search), the unit's namesake topic.",
            },
            "3.17": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-4.A (algorithmic efficiency) -- the unplugged, whole-unit focus per the syllabus PDF's own description.",
            },
            "3.18": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites AAP-4.B (undecidable problems), matching the syllabus PDF's own mention of this topic 'later in the unit.'",
            },
            "4.3": {
                "locators": [ALGORITHMS],
                "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page cites CSN-2.A and CSN-2.B (parallel and distributed computing), matching the syllabus PDF's own mention of this topic.",
            },
            "2.3": {
                "locators": [DATA],
                "note": "code.org's own CSP-20 Unit 9 (Data) standards page cites DAT-2.A, DAT-2.B, and DAT-2.C.",
            },
            "2.4": {
                "locators": [DATA],
                "note": "code.org's own CSP-20 Unit 9 (Data) standards page cites DAT-2.D and DAT-2.E.",
            },
            "5.1": {
                "locators": [DATA, CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "code.org's own standards pages cite IOC-1.B for Data (data's own beneficial/harmful effects) and IOC-1.A/B for Cybersecurity and Global Impacts (the 'future school' innovation debate).",
            },
            "5.3": {
                "locators": [DATA],
                "note": "code.org's own CSP-20 Unit 9 (Data) standards page cites IOC-1.D (computing bias).",
            },
            "5.4": {
                "locators": [DATA],
                "note": "code.org's own CSP-20 Unit 9 (Data) standards page cites IOC-1.E, catalogued under this topic in this repo's apcsp.json.",
            },
            "1.1": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "code.org's own CSP-20 Unit 10 (Cybersecurity and Global Impacts) standards page cites CRD-1.A and CRD-1.C.",
            },
            "1.2": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "code.org's own CSP-20 Unit 10 (Cybersecurity and Global Impacts) standards page cites CRD-2.A.",
            },
        },
        "csta2017": {
            "3A-DA-09": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page."},
            "3A-DA-10": {"locators": [DIGITAL_INFORMATION, DATA], "note": "code.org's own CSP-20 Unit 1 and Unit 9 standards pages both cite this."},
            "2-DA-07": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page. A 6-8-band code cited for a 9-12 course -- carried as code.org's own claim, not this carrier's judgment."},
            "3A-CS-02": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page."},
            "3A-IC-28": {"locators": [DIGITAL_INFORMATION, THE_INTERNET], "note": "code.org's own CSP-20 Unit 1 and Unit 2 standards pages both cite this."},
            "2-IC-20": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page. A 6-8-band code cited for a 9-12 course, as with 2-DA-07 above."},
            "3A-IC-24": {"locators": [DIGITAL_INFORMATION, THE_INTERNET], "note": "code.org's own CSP-20 Unit 1 and Unit 2 standards pages both cite this."},
            "3B-IC-27": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page. Level 3B (elective) -- see castandards note below."},
            "3A-AP-21": {"locators": [DIGITAL_INFORMATION], "note": "code.org's own CSP-20 Unit 1 standards page -- the unit's device-design activity is an iterative testing/refining task even though the unit isn't primarily about programming."},
            "2-NI-04": {"locators": [THE_INTERNET], "note": "code.org's own CSP-20 Unit 2 standards page. A 6-8-band code cited for a 9-12 course, as above."},
            "3A-NI-04": {"locators": [THE_INTERNET], "note": "code.org's own CSP-20 Unit 2 standards page."},
            "3B-NI-03": {"locators": [THE_INTERNET], "note": "code.org's own CSP-20 Unit 2 standards page. Level 3B (elective) -- see castandards note below."},
            "3A-IC-30": {"locators": [THE_INTERNET, CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 2 and Unit 10 standards pages both cite this."},
            "3B-IC-26": {"locators": [THE_INTERNET], "note": "code.org's own CSP-20 Unit 2 standards page. Level 3B (elective) -- see castandards note below."},
            "3B-IC-28": {"locators": [THE_INTERNET], "note": "code.org's own CSP-20 Unit 2 standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "3B-AP-10": {"locators": [ALGORITHMS], "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "3B-AP-11": {"locators": [ALGORITHMS], "note": "code.org's own CSP-20 Unit 6 (Algorithms) standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "3A-DA-11": {"locators": [DATA], "note": "code.org's own CSP-20 Unit 9 (Data) standards page."},
            "3B-DA-05": {"locators": [DATA], "note": "code.org's own CSP-20 Unit 9 (Data) standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "3B-DA-06": {"locators": [DATA], "note": "code.org's own CSP-20 Unit 9 (Data) standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "3B-AP-08": {"locators": [DATA], "note": "code.org's own CSP-20 Unit 9 (Data) standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
            "2-IC-23": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page. A 6-8-band code cited for a 9-12 course, as above."},
            "3A-IC-27": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page."},
            "3A-IC-29": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page."},
            "3B-IC-25": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page. Level 3B (elective) -- see castandards note below."},
            "3A-NI-05": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page."},
            "3A-NI-06": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page."},
            "3A-NI-07": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page."},
            "3B-NI-04": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": "code.org's own CSP-20 Unit 10 standards page. Level 3B (elective), no CA counterpart at all per the crosswalk."},
        },
        "castandards": {
            "9-12.DA.8": {"locators": [DIGITAL_INFORMATION], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-DA-09)"},
            "9-12.DA.9": {"locators": [DIGITAL_INFORMATION, DATA], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-DA-10)"},
            "6-8.DA.7": {"locators": [DIGITAL_INFORMATION], "note": DERIVED_NOTE.format(strength="strong") + " (from 2-DA-07)"},
            "9-12.CS.2": {"locators": [DIGITAL_INFORMATION], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-CS-02)"},
            "9-12.IC.28": {"locators": [DIGITAL_INFORMATION, THE_INTERNET], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-IC-28)"},
            "6-8.IC.20": {"locators": [DIGITAL_INFORMATION], "note": DERIVED_NOTE.format(strength="strong") + " (from 2-IC-20)"},
            "9-12.IC.23": {"locators": [DIGITAL_INFORMATION, THE_INTERNET], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-IC-24)"},
            "9-12.IC.26": {"locators": [DIGITAL_INFORMATION, THE_INTERNET, CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="related") + " (from 3B-IC-27, 3B-IC-26, and 3B-IC-25 respectively -- a 'related,' not 'strong,' crosswalk in every case)"},
            "9-12.AP.20": {"locators": [DIGITAL_INFORMATION], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-AP-21)"},
            "6-8.NI.4": {"locators": [THE_INTERNET], "note": DERIVED_NOTE.format(strength="strong") + " (from 2-NI-04)"},
            "9-12.NI.5": {"locators": [THE_INTERNET], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-NI-04)"},
            "9-12.NI.4": {"locators": [THE_INTERNET], "note": DERIVED_NOTE.format(strength="strong") + " (from 3B-NI-03)"},
            "9-12.IC.30": {"locators": [THE_INTERNET, CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-IC-30)"},
            "9-12.DA.10": {"locators": [DATA], "note": DERIVED_NOTE.format(strength="partial") + " (from 3A-DA-11)"},
            "9-12.IC.24": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="strong") + " (from 2-IC-23; the crosswalk notes CA's own numbering shift here)"},
            "9-12.IC.27": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-IC-27)"},
            "9-12.IC.29": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="strong") + " (from 3A-IC-29)"},
            "9-12.NI.7": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="related") + " (from 3A-NI-05)"},
            "9-12.NI.6": {"locators": [CYBERSECURITY_GLOBAL_IMPACTS], "note": DERIVED_NOTE.format(strength="partial") + " (from 3A-NI-06 and 3A-NI-07, both compressed into this one CA standard)"},
            "9-12.AP.12": {
                "locators": [ALGORITHMS],
                "note": "This carrier's own inference, not mechanically derived: code.org's cited AAP-2.L/AAP-4.A on this unit (developing and comparing algorithms) is this standard's own 'combination of original and existing algorithms' language, but the unit's actual csta2017 codes (3B-AP-10/11) have no CA crosswalk match -- so this line is this carrier's own judgment, not the crosswalk's.",
            },
        },
        "csta2026": {
            "HS-SYS-NT-34": {
                "locators": [THE_INTERNET],
                "note": "This carrier's own inference, not code.org's claim: a network diagram showing physical and software layers is exactly what code.org's Internet Simulator activity has students build and reason about.",
            },
            "HS-SYS-NT-35": {
                "locators": [THE_INTERNET],
                "note": "This carrier's own inference: 'the internet is a network of networks, with its own history' is this unit's own framing, per the syllabus PDF's description.",
            },
            "HS-DAT-DI-25": {
                "locators": [DATA],
                "note": "This carrier's own inference: turning a dataset into a chart/visualization is the Data unit's central activity per the syllabus PDF.",
            },
            "HS-DAT-DI-26": {
                "locators": [DATA],
                "note": "This carrier's own inference: the unit's own hunt for misleading or hard-to-read patterns in a visualization.",
            },
            "HS-SYS-SE-31": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "This carrier's own inference: weighing a security measure's protection against its cost is the unit's own privacy/security risk-and-mitigation content per the syllabus PDF.",
            },
            "HS-SYS-SE-32": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "This carrier's own inference: the unit's stakeholder-persona framing (parent, admin, teacher, student, staff) puts different groups at different risk from the same computing innovation.",
            },
            "HS-SYS-IM-36": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "This carrier's own inference: the unit's Explore Curricular Requirement work (data privacy/security/storage concerns) is this standard's own territory.",
            },
            "HS-DAT-IM-28": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "This carrier's own inference: the 'future school' debate over privacy policy across stakeholder groups is this standard's own privacy-law/policy-debate framing.",
            },
            "HS-ALG-PS-01": {
                "locators": [ALGORITHMS],
                "note": "This carrier's own inference: choosing the right data structure/algorithm pairing is this unit's own content per the syllabus PDF's description of comparing algorithms.",
            },
            "HS-ALG-PS-03": {
                "locators": [ALGORITHMS],
                "note": "This carrier's own inference: 'why some algorithms are considered better than others' (the syllabus PDF's own phrase for this unit) is this standard's own 'more than just whether they work' framing.",
            },
        },
        "ca-ict-anchor": {
            "C4.10": {
                "locators": [ALGORITHMS],
                "note": "This carrier's own inference, quoting the standard's own language: 'different queueing, sorting, and searching algorithms trade off differently' is this unit's own efficiency-comparison content.",
            },
            "C8.8": {
                "locators": [DATA],
                "note": "This carrier's own inference: 'turning data into cross-tabulations, graphs, or charts' is this unit's own data-visualization activity, almost verbatim.",
            },
            "C2.2": {
                "locators": [CYBERSECURITY_GLOBAL_IMPACTS],
                "note": "This carrier's own inference: the unit's privacy/security risk discussion is this standard's own 'unintended consequences' framing, though the standard is written for a development-team context this unit doesn't have.",
            },
        },
    },
}


def main():
    CARRIERS_DIR.mkdir(parents=True, exist_ok=True)
    path = CARRIERS_DIR / "codeorg-apcsp.json"
    path.write_text(json.dumps(CODEORG_APCSP, indent=1) + "\n")
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
