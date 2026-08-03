---
title: "Card 3.7: Sensors and Unit Conversion"
order: 29
source: original
unit: "3. Control and Actuation"
status: Draft
solo: true
duration: "1 wk"
---

**Format:** Code + verification | **Time:** 30 min | **Prerequisites:** Cards 1.2, 3.1 helps

## Core Question
The pressure sensor speaks kilopascals. The judges, the mission, and the required data plot all speak meters. Somebody has to do the conversion, and that somebody must be provably right.

## Resource (~10 min)
1. Derive it together from Card 1.2's rule: depth in meters equals gauge pressure in kPa divided by 9.81 (fresh water). Note the trap: ABSOLUTE pressure includes the atmosphere; subtract surface pressure first or your robot thinks air is 10 meters deep.
2. Find the actual conversion line in the float's code and check whether it handles that trap.

## Activity
1. Write the conversion as a small function with two test cases you compute by hand first: surface, and 2.5 m.
2. Verify physically: sensor at a measured depth in the test column (even 0.5 m works), read the kPa, run your function, compare against the tape measure. Record the error.

## Clearing This Card
Function plus verification numbers, and a 90-second oral check: "Competition is in salt water. What changes in your function and roughly by how much?"

## If You Miss This Class
Test column and sensor rig stay available; same artifact and check.

## Why This Matters
This exact function decides whether the float holds 2.5 m or holds 2.5-ish. It also feeds the required depth-vs-time plot, so your test cases here are literally pre-competition quality control.
