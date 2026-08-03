---
title: "Card 4.5: State Machines"
order: 35
source: original
unit: "4. Software"
status: Draft
solo: true
duration: "1 wk"
---

**Format:** Design discussion + paper artifact | **Time:** 40 min | **Prerequisites:** Ladder rung 3; Card 3.5 pairs well

## Core Question
The float's mission is a sequence: wait, descend, hold, ascend, surface, transmit, repeat. Code that handles this as one long tangle of ifs becomes unfixable. What is the disciplined shape?

## Resource (~10 min)
1. A state machine in plain terms: the system is always in exactly one named state; events or conditions cause transitions; each state has its own simple job. Whiteboard example: a traffic light, then a microwave (door open beats everything, which introduces guard conditions).
2. Look at the float mission description in the manual and list every distinct phase you can find.

## Activity
1. Human state machine warm-up (5 min): three volunteers are states, the class calls out events, volunteers point to who becomes active. Fast, silly, and it works.
2. Real artifact: draw the complete state diagram for the float's mission on paper: named states in circles, labeled transitions with their triggering conditions ("depth within 0.2 m of target for 5 s" beats "when it gets there"), including at least one failure path (what state do you enter if the target depth is never reached?).

## Clearing This Card
The state diagram, plus a 90-second oral check: the teacher names a weird moment ("the float is ascending and the pressure sensor starts returning garbage") and you trace what your machine does and whether that is acceptable.

## If You Miss This Class
Mission description and a traffic-light example diagram are on the class page; same artifact and check.

## Why This Matters
The float code's structure is this diagram, and the diagram belongs in the technical documentation, where a clean state machine figure impresses judges far beyond its effort. Software team members will implement it; every team member should be able to read it.
