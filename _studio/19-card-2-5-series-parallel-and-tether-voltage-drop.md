---
title: "Card 2.5: Series, Parallel, and Tether Voltage Drop"
order: 19
source: original
unit: "2. Electricity and Fabrication"
---

**Format:** Measurement + calculation | **Time:** 40 min | **Prerequisites:** Card 2.1

## Core Question
The power supply says 12 volts. The thrusters at the end of our tether disagree. Where did the missing volts go, and how much tether can we afford?

## Resource (~10 min)
1. Series resistances add; the tether's copper is a resistor in series with everything on the robot. Parallel loads share current; every load added raises total current, which raises the tether's toll.
2. Wire gauge chart: resistance per meter for the gauges in our tether.

## Activity
1. Measure the actual round-trip resistance of a spare tether length with the meter, and compare against the gauge chart's prediction.
2. Calculate voltage at the robot for our real tether length at 10 A, 20 A, and worst-case draw from your 2.2 work. Graph volts-at-robot versus current (three points, hand-drawn is fine).
3. One design question in writing: how does running higher voltage down the tether with conversion at the robot change this picture? (This is why real ROVs do it.)

## Clearing This Card
Measurements, the graph, and the design paragraph, plus a 90-second oral check: "The robot browns out when all thrusters fire. Give me two fixes that do not involve buying a new tether, and their costs."

## If You Miss This Class
Spare tether and meter in the shop; same artifact and check.

## Why This Matters
Voltage drop explains a whole family of mysterious pool failures: cameras rebooting, ESCs cutting out, sluggish thrust under load. After this card, those stop being mysteries.
