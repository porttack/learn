---
title: "Card 0.2: Writing a Design Decision Record"
order: 6
source: original
unit: "0. Engineering Process"
---

## Before Class Reading: Where Decisions Go to Die

Here is a scene from every engineering team ever. March. Someone asks, "Why is the claw geared this way?" Silence. The student who made that choice graduated, or forgot, or is absent today. The team rebuilds the reasoning from scratch, or worse, changes the design without knowing what the original reasoning was protecting against. The decision was made; the reasons evaporated.

Software companies got tired of this and invented the Architecture Decision Record, or ADR: a short document, written at the moment of decision, by the person who made it. Not a report. Not documentation-as-punishment. Half a page: what was the situation, what options did we consider, what did we pick, why, and what follows from that. Thousands of engineering teams now write these constantly. Search "architecture decision record" and you will find whole repositories of them, because engineers discovered something surprising: the writing is not a record of the thinking. The writing IS the thinking. Forcing yourself to name two real options and defend the pick catches bad decisions before they are built.

We are adopting the same tool under a broader name, the Design Decision Record, because our decisions are mechanical and electrical, not just software. The rule is the one that fixes the March scene: whoever makes the decision writes the record. Same sprint. The documentation lead's job changes accordingly: they do not invent the team's reasoning; they assemble the technical documentation from records the whole team authored. The words and the ideas travel together, written by the same hands.

There is a competitive edge hiding in this. At the engineering presentation, judges deliberately question different team members, and a team where only one person can explain the claw bleeds points in front of everyone. A team that writes DDRs has rehearsed the answer all year, because at every sprint review, a randomly chosen member defends a randomly chosen record. That is not a classroom exercise wearing an engineering costume. It is the actual job, practiced early.

**Prep prompt (bring in writing):** Pick one real design decision from LAST season that you were close enough to see, from any subsystem. Write: the decision in one sentence, two options that were actually on the table (or should have been), and one piece of evidence, from our shop, our pool days, or our competition, that influenced or should have influenced the choice. You will turn this into a full DDR in class. Choose a decision you can speak about from firsthand memory, because the oral check will ask what YOU saw.

---

**Unit:** 0, Engineering Process
**Format:** Short instruction + individual writing, with a worked example
**Time:** 30 to 40 minutes
**Prerequisites:** Card 0.1 helps but is not required. Have the DDR template in hand.

---

## Core Question

Next spring, a judge will point at any part of our robot and ask any one of us: "Why is it built that way?" The team that can answer wins points. The team that says "Jake did that part" does not. Where does that answer live between now and then?

## Resource (~10 minutes)

1. Read the DDR template, top to bottom, including "When to write a DDR."
2. Read the worked example the teacher provides: a real DDR written about a decision from last season. Notice that the Why section is the longest and the whole thing fits on half a page.
3. Real engineering teams call these ADRs (architecture decision records) and write thousands of them. Skim the intro of the ADR repository on GitHub (search "architecture decision record") to see this is an industry practice, not a classroom invention.

## Activity: Write One (your artifact)

Write one complete DDR about a real decision from LAST season. You were there for some of them: claw design choices, thruster placement, camera selection, the tether, the float mechanism, software choices. Pick one you know something about. It does not matter that the decision is old; what matters is practicing the form on a decision with no pressure attached.

Requirements:
- All five sections filled in (Context, Options, Decision, Why, Consequences)
- At least two real options in Options Considered
- The Why section references at least one piece of evidence: a test result, a rule from the manual, a budget number, or something that happened at the pool

## Clearing This Card

Turn in your DDR, then pass a 90-second oral check: the teacher asks one question about your Options section ("what would have made you pick option 2 instead?"). If you can answer, you understood the decision rather than just describing it. Complete or Not Yet, redos always open.

## If You Miss This Class

Identical. Read the template and example, write the DDR, take the oral check during build time.

## Why This Matters for Competition

DDRs are the raw material of our technical documentation, which is a scored deliverable. This year the documentation lead assembles the tech doc FROM the team's DDRs instead of inventing it alone, so every DDR you write during the season is documentation work already done. And at sprint reviews, a randomly chosen team member defends a randomly chosen DDR, exactly like judging. This card is your first rep.
