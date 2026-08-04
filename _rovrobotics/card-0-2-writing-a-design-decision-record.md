---
title: "Card 0.2: Writing a Design Decision Record"
order: 7
source: original
unit: "0. Engineering Process"
status: Ready
solo: true
duration: "1 wk"
---

**Format:** Short instruction + individual writing | **Time:** 40 min | **Prerequisites:** Card 0.1 helps but is not required

## Before Class Reading: Where Decisions Go to Die

Here is a scene from every engineering team ever. March. Someone asks, "Why is the claw geared this way?" Silence. The student who made that choice graduated, or forgot, or is absent today. The team rebuilds the reasoning from scratch, or worse, changes the design without knowing what the original reasoning was protecting against. The decision was made; the reasons evaporated.

Software companies got tired of this and invented the Architecture Decision Record, or ADR: a short document, written at the moment of decision, by the person who made it. Not a report. Not documentation-as-punishment. Half a page, decision first. Thousands of engineering teams now write these constantly, and the [ADR repository on GitHub](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/README.md) collects the real formats they use. Engineers discovered something surprising along the way: the writing is not a record of the thinking. The writing IS the thinking. Forcing yourself to name two real options and defend the pick catches bad decisions before they get built.

Mr. B used the equivalent of ADRs in making teaching decisions. He called them [TDRs](https://porttack.com/2023/06/06/teaching-decision-records.html). You can see how he used these the first year he was teaching [here](https://drive.google.com/drive/folders/1UwrqeQpqRQIM1Om-SsHXPH5IQ5L32jdJ?usp=sharing).

We are adopting the same tool under a broader name, the Design Decision Record, because our decisions are mechanical and electrical, not just software. The rule is the one that fixes the March scene: **whoever makes the decision writes the record, in the same sprint.** The documentation lead's job changes accordingly. They do not invent the team's reasoning; they assemble the technical documentation from records the whole team authored. The words and the ideas travel together, written by the same hands.

There is a competitive edge hiding in this. At the engineering presentation, judges deliberately question different team members, and a team where only one person can explain the claw bleeds points in front of everyone. A team that writes DDRs has rehearsed the answer all year, because at every sprint review a randomly chosen member defends a randomly chosen record. That is not a classroom exercise wearing an engineering costume. It is the actual job, practiced early.

Here is our [template](https://docs.google.com/document/d/1fRwo3A64tUP2ber1psuHv-kig57aBQbnELA310Nc9MQ/edit?usp=sharing).

**Here's what you'll do (details below):** Pick one real design decision from LAST season that you were close enough to see, from any subsystem. Ask others or your teacher if you're struggling to find a decision. Write the decision in one sentence, two options that were actually on the table (or should have been), and one piece of evidence, from our classroom, our pool days, or our competition, that influenced or should have influenced the choice. Then turn this into a full DDR. Choose a decision you can speak about from firsthand memory, because the oral check will ask what YOU saw.

## Resource (~10 min)

1. Watch [Architecture Decision Records: The Basics](https://www.youtube.com/watch?v=7Gqn2dbt_JY). This is industry talking to industry, not a school video. Listen for two things: that the record is written by the decider, and that it is short on purpose.
2. Open the [DDR template](https://docs.google.com/document/d/1fRwo3A64tUP2ber1psuHv-kig57aBQbnELA310Nc9MQ/edit?usp=sharing) and read it top to bottom, including the checklist at the end.
3. Read a few of [our DDRs](https://drive.google.com/drive/folders/1GkBIRlsAjwKcu1kjNgjnxiVKjO0er2Ld?usp=sharing). Notice that the Why section is the longest and that the whole thing fits on half a page.

## The Template

Do not retype it. Open the [DDR List](https://docs.google.com/spreadsheets/d/1wyLcU-enjCvWUPoO3E6QtHkRHMYRni7k7D_eBYQxgfU/edit?usp=sharing) and claim the next DDR number.
Then open the [DDR template](https://docs.google.com/document/d/1fRwo3A64tUP2ber1psuHv-kig57aBQbnELA310Nc9MQ/copy), which drops you straight into a copy, then rename the copy `DDR-## Short title` and put it in the [DDRs folder](https://drive.google.com/drive/folders/1GkBIRlsAjwKcu1kjNgjnxiVKjO0er2Ld?usp=drive_link).

The six sections, in order:

| Section | What goes in it |
| --- | --- |
| **Decision** | What we are doing. Specific enough to build from. Write this first even though you decided it last. |
| **The Problem** | What forced a decision and what boxed you in: cost, weight, time, a manual rule, a pool day result. |
| **Options We Considered** | Two or more real options, one sentence each. "Do nothing" counts. |
| **Why** | Why this beat the others, pointing at one specific piece of evidence. Longest section. Judges care most. |
| **What This Costs Us** | What gets harder, riskier, or newly required. If it is all good news, it is a sales pitch. |
| **Reflection** | Blank until the decision has been tested. Then come back and close the loop. |

Most DDRs take ten minutes to write. Plain language beats fancy language. (They can take longer to think about, research, and discuss.)

## When to Write a DDR

Write one when your team:

- Chooses between two or more real approaches (claw geometry, thruster layout, sensor placement, code structure)
- Abandons or reverses an earlier approach
- Accepts a tradeoff (heavier but stronger, slower but more reliable)
- Makes a call that costs money or pool time

Do NOT write one for routine tasks with no real alternatives, like charging batteries or printing a part you already designed.

## When a Decision Changes

You never rewrite Decision, The Problem, Options, or Why. Those sections record what you knew at the time you decided, and that is the whole point: a record you edit later is not a record. Reflection is the one section you come back and add, and adding it closes the loop instead of editing history.

If the decision itself changes, that is not an edit. Write a new DDR and set the old one's Status to "Superseded by DDR-##" with the new record's number.

## Big Decisions: ADRs

When the software team makes an architecture-level choice, such as a framework, a communication protocol, or the structure of the control system, use this exact same template and label it ADR instead of DDR. Same thinking, bigger blast radius. The GitHub repository linked in the reading has thousands of real ones.

## Activity: Write One (your artifact)

Write one complete DDR about a real decision from LAST season. You were there for some of them: claw design choices, thruster placement, camera selection, the tether, the float mechanism, software choices. Pick one you know something about. It does not matter that the decision is old. What matters is practicing the form on a decision with no pressure attached.

Requirements:

- All six sections filled in
- At least two real options
- The Why section references at least one piece of evidence: a test result, a rule from the manual, a budget number, or something that happened at the pool
- Reflection filled in, not left blank. This is the one DDR all year where you can do that immediately, because the decision is already old enough to judge. Every DDR you write after today ships with Reflection blank until its own decision gets tested.

## Clearing This Card

Discuss your DDR with some peers and then briefly with your teacher. Take feedback if given and edit or augment. If possible, ask your teacher to print it for your folder/binder.

## If You Miss This Class

Identical. Watch the video, read the template and examples, write the DDR, discuss with at least one peer and your teacher at your 1-on-1.

## Why This Matters for Competition

DDRs are the raw material of our technical documentation, which is a scored deliverable. This year the documentation lead assembles the tech doc FROM the team's DDRs instead of inventing it alone, so every DDR you write during the season is documentation work already done. And at sprint reviews, a randomly chosen team member defends a randomly chosen DDR, exactly like judging. This card is your first rep.