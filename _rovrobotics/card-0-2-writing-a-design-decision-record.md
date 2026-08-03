---
title: "Card 0.2: Writing a Design Decision Record"
order: 7
source: original
unit: "0. Engineering Process"
---

## Before Class Reading: Where Decisions Go to Die

Here is a scene from every engineering team ever. March. Someone asks, "Why is the claw geared this way?" Silence. The student who made that choice graduated, or forgot, or is absent today. The team rebuilds the reasoning from scratch, or worse, changes the design without knowing what the original reasoning was protecting against. The decision was made; the reasons evaporated.

Software companies got tired of this and invented the Architecture Decision Record, or ADR: a short document, written at the moment of decision, by the person who made it. Not a report. Not documentation-as-punishment. Half a page, decision first: what did we pick, is it settled or still up for debate, what forced the choice, what else did we consider, why this one, and what follows from it. Thousands of engineering teams now write these constantly. The [ADR repository on GitHub](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/README.md) collects several real formats teams use, because engineers discovered something surprising: the writing is not a record of the thinking. The writing IS the thinking. Forcing yourself to name two real options and defend the pick catches bad decisions before they are built.

We are adopting the same tool under a broader name, the Design Decision Record, because our decisions are mechanical and electrical, not just software. The rule is the one that fixes the March scene: whoever makes the decision writes the record. Same sprint. The documentation lead's job changes accordingly: they do not invent the team's reasoning; they assemble the technical documentation from records the whole team authored. The words and the ideas travel together, written by the same hands.

There is a competitive edge hiding in this. At the engineering presentation, judges deliberately question different team members, and a team where only one person can explain the claw bleeds points in front of everyone. A team that writes DDRs has rehearsed the answer all year, because at every sprint review, a randomly chosen member defends a randomly chosen record. That is not a classroom exercise wearing an engineering costume. It is the actual job, practiced early.

**Prep prompt (bring in writing):** Pick one real design decision from LAST season that you were close enough to see, from any subsystem. Write: the decision in one sentence, two options that were actually on the table (or should have been), and one piece of evidence, from our shop, our pool days, or our competition, that influenced or should have influenced the choice. You will turn this into a full DDR in class. Choose a decision you can speak about from firsthand memory, because the oral check will ask what YOU saw.

---

**Unit:** 0, Engineering Process
**Format:** Short instruction + individual writing, with a worked example
**Time:** 40 minutes
**Prerequisites:** Card 0.1 helps but is not required. The template is on this page.

---

## Core Question

Next spring, a judge will point at any part of our robot and ask any one of us: "Why is it built that way?" The team that can answer wins points. The team that says "Jake did that part" does not. Where does that answer live between now and then?

## Resource (~10 minutes)

1. Read the DDR template below, top to bottom, including "When to Write a DDR."
2. Read the worked example the teacher provides: a real DDR written about a decision from last season. Notice that the Why section is the longest and the whole thing fits on half a page.
3. Skim the [ADR repository README](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/README.md) to confirm this is an industry practice and not a classroom invention.

## The DDR Template

**Rule: whoever makes the decision writes the record. Same sprint, while the reasoning is fresh.**

A DDR is not paperwork about your work. It IS engineering work. Judges will ask any team member to explain any decision. This record is how the whole team stays able to answer.

Most DDRs fit in half a page. Write it in ten minutes. Plain language beats fancy language.

---

**DDR-___ : (short title, e.g. "Switch claw to single servo")**
Team: (your team's name) Author: (you, the person who made or led this decision) Date:
Status: Proposed / Accepted / Superseded by DDR-___

### Decision
What we are doing. One or two sentences, specific enough that someone could go build it. Write this first, even though you decided it last.

### The Problem
What forced a decision, and what boxed you in: cost, weight, time, a rule in the manual, a result from a pool day. Two to four sentences.

### Options We Considered
At least two real options, one sentence each. "Do nothing" is a real option and it has consequences too.

1.
2.
3.

### Why
Why this option beat the others. Name at least one piece of evidence: a measurement, a number from the manual, a price, or something that happened at our pool. This is the longest section, and the one judges care about most.

### What This Costs Us
What gets easier, what gets harder or riskier, and what we now have to do because of this choice: parts to order, code to rewrite, something to test at the next pool day. If this section only lists good news, it is a sales pitch, not a record.

### Reflection (leave blank; fill in after this decision has been tested)
Date:
Did it work? What do we know now that we did not know when we decided? Would you make the same call again? If not, the next step is a new DDR that supersedes this one.

---

## When to Write a DDR

Write one when your team:
- Chooses between two or more real approaches (claw geometry, thruster layout, sensor placement, code structure)
- Abandons or reverses an earlier approach
- Accepts a tradeoff (heavier but stronger, slower but more reliable)
- Makes a call that costs money or pool time

Do NOT write one for routine tasks with no real alternatives (charging batteries, printing a part you already designed).

## When a Decision Changes

You never rewrite Decision, the Problem, Options, or Why. Those sections record what you knew at the time you decided, and that is the whole point: a record you edit later is not a record. Reflection is the one section you come back and add, and adding it closes the loop instead of editing history.

If the decision itself changes, that is not an edit. Write a new DDR, and set the old one's Status to "Superseded by DDR-___" with the new record's number.

## Big Decisions: ADRs

When the software team makes an architecture-level choice (framework, communication protocol, control system structure), use this exact same template and label it ADR instead of DDR. Same thinking, bigger blast radius. Industry runs on these; see the [ADR repository](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/README.md) linked above for real examples.

## How the Documentation Lead Uses These

The documentation lead does not invent content. They collect the team's DDRs, interview authors when something is unclear, and assemble the technical documentation from a record the whole team wrote. The ideas belong to everyone. The assembly belongs to the lead.

## Activity: Write One (your artifact)

Write one complete DDR about a real decision from LAST season. You were there for some of them: claw design choices, thruster placement, camera selection, the tether, the float mechanism, software choices. Pick one you know something about. It does not matter that the decision is old; what matters is practicing the form on a decision with no pressure attached.

Requirements:
- All six sections filled in (Decision, The Problem, Options, Why, What This Costs Us, Reflection)
- At least two real options in Options We Considered
- The Why section references at least one piece of evidence: a test result, a rule from the manual, a budget number, or something that happened at the pool
- Reflection filled in, not left blank. This is the one DDR all year where you can do that immediately, because the decision is already old enough to judge. Every DDR you write after today ships with Reflection blank until its own decision gets tested.

## Clearing This Card

Turn in your DDR, then pass a 90-second oral check: the teacher asks one question about your Options section ("what would have made you pick option 2 instead?") or your Reflection ("would you make the same call again, and why?"). If you can answer, you understood the decision rather than just describing it. Complete or Not Yet, redos always open.

## If You Miss This Class

Identical. Read the template and example, write the DDR, take the oral check during build time.

## Why This Matters for Competition

DDRs are the raw material of our technical documentation, which is a scored deliverable. This year the documentation lead assembles the tech doc FROM the team's DDRs instead of inventing it alone, so every DDR you write during the season is documentation work already done. And at sprint reviews, a randomly chosen team member defends a randomly chosen DDR, exactly like judging. This card is your first rep.
