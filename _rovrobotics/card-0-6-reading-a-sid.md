---
title: "Card 0.6: Reading a SID"
order: 11
source: original
unit: "0. Engineering Process"
---

## Before Class Reading: The Map of the Machine

Before a MATE safety inspector lets our robot near the water, they read a single page: the SID, the System Integration Diagram. One page showing every electrical and every connected part of the vehicle: where power enters, where the fuse sits, what voltage runs where, which signals go to which components. Then they look at the actual robot and check whether the machine matches the map. If it does not, we fix it on the pool deck while our competition clock runs.

A SID is a schematic's older, calmer sibling. A full schematic shows every resistor; a SID shows the SYSTEM: sources, protection, distribution, loads, and communication, at the level where you can reason about the whole vehicle at once. Reading one is a skill, and it has a grammar. Lines are wires or connections. Symbols mark fuses, converters, controllers, motors. Labels carry the numbers that matter: voltages, current ratings, wire gauges. The single most important convention: protection sits close to the source. A fuse guards everything downstream of it, so a fuse far from the battery leaves unprotected wire between them, which is exactly the wire that starts fires.

Why should every member of a team read the SID, not just the electrical crew? Three reasons. First, the inspector or a judge can ask anyone, and "that is not my subsystem" is an answer that costs points and respect. Second, the SID is where mismatches get caught: the student who traces the map in March finds the discrepancy that would have burned deck time in May. Third, and most practically, the SID is how you debug. When something dies at the pool, the question is always "what is upstream of the dead thing," and the SID is the only place that answer lives.

There is also a quieter lesson in the document itself. A SID is the team's electrical thinking made visible on one page, exactly like a DDR is one decision made visible. Machines whose reasoning is written down survive their builders. Machines whose reasoning lives in one student's head graduate with that student.

**Prep prompt (bring in writing):** From memory, without looking anything up, sketch the power path of last year's robot from the surface supply to one thruster: every component the electricity passes through, in order, with your best guess at the voltage at each stage and where the fuse sits. Wrong guesses are expected and useful. In class you will trace the real SID and grade your own sketch against it; the differences between your mental map and the actual machine are precisely what this card exists to fix.

---

---

**Unit:** 0, Engineering Process
**Format:** Guided trace + individual exercise
**Time:** 30 to 40 minutes
**Prerequisites:** None required; pairs well with Ohm's law and fuse cards later.

---

## Core Question

The SID (system integration diagram) is the one-page map of everything electrical and everything connected on the vehicle. Safety inspectors read it before they let us in the water, and judges expect any team member to navigate it. Can you follow the electrons from the surface to a spinning thruster without getting lost?

## Resource (~10 minutes)

1. Last season's actual SIDs for Godzillah and for the float, printed large.
2. The legend: how the diagram shows power lines, signal lines, fuses, connectors, and voltage levels. The teacher traces ONE path aloud as a model: surface supply, through the fuse, down the tether, into the enclosure, through the ESC, to a thruster. Notice the fuse is as close to the source as the diagram (and the rules) demand.

## Activity: Trace and Annotate (your artifact)

On your own printed copy:

1. Highlight the full power path from surface to one component the teacher assigns you (a thruster, a camera, the claw actuator, or a float component).
2. Label the voltage at three points along your path.
3. Mark where the protecting fuse for your path is, and write its rating.
4. Write one sentence: what physically happens on your path if that component shorts?
5. Circle one thing on the SID you cannot explain, and write the question. Unanswerable circles are the point; they become seminar and lesson material.

## Clearing This Card

Turn in your annotated SID, then a 90-second oral check: trace a DIFFERENT path than the one you annotated, live, with the teacher pointing at the destination. Fluency with the map, not memorization of one route.

## If You Miss This Class

Identical, done during build time. The printed SIDs live in the shop.

## Why This Matters for Competition

The SID is a required scored submission, and safety inspection at the venue works directly from it: if the vehicle does not match the SID, we fix it on the deck while the clock runs. A team where everyone reads the SID catches those mismatches in the shop in March instead of poolside in May. This card is also the foundation for the fuse sizing and voltage drop cards later, where you will do the math on the paths you traced today.
