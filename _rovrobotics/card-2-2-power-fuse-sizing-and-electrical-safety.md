---
title: "Card 2.2: Power, Fuse Sizing, and Electrical Safety"
order: 17
source: original
unit: "2. Electricity and Fabrication"
---

**Format:** Calculation workshop | **Time:** 40 min | **Prerequisites:** Card 2.1

## Core Question
The fuse is the one component we install hoping it dies. How do you size a fuse so it ignores normal operation but sacrifices itself before the wiring does?

## Resource (~10 min)
1. Power: P = VI. A thruster pulling 15 A at 12 V is a 180 W machine; six of them is why our fuse math matters.
2. The MATE rule: read the fuse and overcurrent protection requirements in the manual, including where the fuse must sit and how its rating relates to measured full-load current.
3. The stall story: what a jammed thruster draws versus a free-spinning one, and why last season's fuse events happened.

## Activity
Size our actual main fuse: using thruster datasheet currents plus every other load on the SID, compute worst-case realistic draw, apply the manual's sizing rule, and pick a real fuse value. Then annotate a copy of the SID with your calculation. Compare your answer to what the robot actually ran last year and explain any difference.

## Clearing This Card
The annotated SID with shown work, plus a 90-second oral check: "The fuse blows during a mission run. Walk me through what you check, in order, before installing a new one."

## If You Miss This Class
Datasheets and SID copies are in the folder; same artifact and check during studio time.

## Why This Matters
The fuse calculation is literally inspected at competition safety review, and the annotated SID becomes real documentation. This card produces a competition artifact, not homework.
