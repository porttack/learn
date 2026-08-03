---
title: "Card 0.5: BOMs and Purchase Requests"
order: 10
source: original
unit: "0. Engineering Process"
---

## Before Class Reading: The Part Is Not Coming

Here is a chain that runs through every school in America. A student needs a part. The student tells a teammate, who tells the teacher, verbally, in a hallway, without a link. The teacher, who is also teaching five classes, later tries to reconstruct which servo, from which vendor, in which quantity. The order goes into a district purchasing system, is approved by someone who has never heard of a thruster, gets processed in a weekly batch, ships, and arrives. Elapsed time: two to five weeks. The student, meanwhile, has been "blocked" for a month and the sprint is dead.

Professional engineering ran into this problem a century ago and invented the Bill of Materials, the BOM: a structured list where every needed part is one row, and every row is complete. Complete means someone who knows nothing about your project could place the order without asking you a single question: exact part name, exact link or part number, quantity, unit cost, total cost, need-by date, and one sentence saying what it is for. A BOM row with "some servos" in it is not a request; it is a future delay wearing a request's clothing.

The second invention was lead time: the honest accounting of how long the chain takes. If school purchasing takes three weeks and your sprint is three weeks, then parts for a sprint must be requested BEFORE that sprint begins, which means during the previous sprint. This is not bureaucracy; it is causality. Our rule follows directly: requests for next sprint's parts are due by the middle of the current sprint. Miss the window and the part does not exist next sprint, and no amount of needing it changes the arithmetic.

This season the intake runs through a supply chain manager who logs every request into a tracker anyone can read. The teacher still presses the actual purchase button, but "I asked for that weeks ago" stops being a memory dispute and becomes a checkable row with a date on it. Vague requests get bounced back the same day, which is a kindness: a bounced request costs you one day, and a vague one that enters the system costs you a month.

**Prep prompt (bring in writing):** Recall one time last season (or in any project you have done) when missing material stalled the work. Trace its chain in writing: who knew the part was needed, when, who was told, what was actually communicated, and where the request died. Then write the complete BOM row that would have prevented it, all six fields. The trace must be a real event you witnessed, with the details memory actually holds, gaps included; the gaps are evidence too.

---

**Unit:** 0, Engineering Process
**Format:** Short instruction + hands-on request writing
**Time:** 30 minutes
**Prerequisites:** Card 0.3 helps, since sprint deliverables generate parts needs.

---

## Core Question

"We need servos" is not information anyone can act on. School purchasing is slow and unforgiving: a vague request means the part does not arrive, and the sprint dies waiting. What does a request look like that turns into a part on the bench?

## Resource (~10 minutes)

1. A BOM (bill of materials) is engineering's shopping list. One row per part. A complete row has six fields: **part name, exact link or part number, quantity, unit cost, total cost, need-by date**, plus one sentence of what it is for.
2. The procurement rule this season: **parts for the NEXT sprint must be requested by the middle of the CURRENT sprint.** School ordering takes that long. Miss the window and the part does not exist next sprint; plan accordingly.
3. Requests go to the supply chain manager, who logs them and tracks status. The teacher submits all actual purchases. You can always see where your request is in the tracker; "I asked for it weeks ago" is checkable.

## Activity: Write a Real Request (your artifact)

Take one deliverable from your team's Sprint 1 commitment that needs a part. Write the complete BOM row for it. If your deliverable truly needs nothing, write the row for a real consumable the shop will need (heat shrink, solder, PVC fittings, zip... no, not zip ties near water; pick something legal).

Common failure modes to avoid, all real examples from last year:
- A link to a product category page instead of the exact item
- No quantity ("some")
- No need-by date, which makes your request lowest priority automatically
- A part that violates a MATE rule (check voltage, materials, and size limits before requesting)

## Clearing This Card

Your BOM row is accepted into the tracker with zero corrections needed, and you pass a 90-second oral check: "Your part arrives and it is wrong. Walk me back through your request row and tell me where the error could have entered."

## If You Miss This Class

Identical. Read the resource, write the row for a real need, submit to the tracker, take the oral check.

## Why This Matters for Competition

Every stalled sprint last year had a missing part somewhere in its history. The BOM is also a scored artifact: MATE requires cost accounting in the technical documentation and the company spec sheet, and a tracker maintained all season makes that deliverable nearly free in May instead of a painful reconstruction.
