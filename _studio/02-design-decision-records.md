---
title: "Design Decision Records"
order: 2
source: original
---

**Rule: Whoever makes the decision writes the record. Same sprint, while the reasoning is fresh.**

A DDR is not paperwork about your work. It IS engineering work. Judges will ask any team member to explain any decision. This record is how the whole team stays able to answer.

Most DDRs fit in half a page. Write it in ten minutes. Plain language beats fancy language.

---

## DDR-___ : (short title, e.g. "Switch claw to single servo")

**Author:** (you, the person who made or led this decision)
**Date:**
**Status:** Proposed / Accepted / Superseded by DDR-___

### Context
What problem or question forced a decision? What constraints mattered (cost, time, weight, rules, pool test results)? 2 to 4 sentences.

### Options Considered
List at least two real options. One sentence each. "Do nothing" often counts as an option.

1.
2.
3.

### Decision
What did we choose? One or two sentences. Be specific.

### Why
The reasoning. Why this option over the others? What evidence did you use (test data, math, manual rule, budget)? This is the section judges care about most.

### Consequences
What becomes easier? What becomes harder or riskier? What will we have to do because of this choice (new parts to order, code to rewrite, things to test at the next pool day)?

---

## When to write a DDR

Write one when your team:
- Chooses between two or more real approaches (claw geometry, thruster layout, sensor placement, code structure)
- Abandons or reverses an earlier approach
- Accepts a tradeoff (heavier but stronger, slower but more reliable)
- Makes a call that costs money or pool time

Do NOT write one for routine tasks with no real alternatives (charging batteries, printing a part you already designed).

## Big decisions: ADRs

When the software team makes an architecture-level choice (framework, communication protocol, control system structure), use this exact same template and label it ADR instead of DDR. Same thinking, bigger blast radius. Industry uses these constantly; search "architecture decision record" to see thousands of real examples.

## How DDRs get checked

At sprint review, the teacher picks a DDR from your team and picks a team member at random to explain it. If that person can defend the decision, the card clears. If not, the status is Not Yet and the team teaches each other before re-checking. This is exactly what MATE judges do at the engineering presentation, so treat it as practice.

## How the documentation lead uses these

The documentation lead does not invent content. They collect the team's DDRs, interview authors when something is unclear, and assemble the technical documentation from a record the whole team wrote. The ideas belong to everyone. The assembly belongs to the lead.
