---
title: "Card 1.4: Drag, Thrust, and Hull Shape"
order: 15
source: original
unit: "1. Water Physics"
---

## Before Class Reading: What the Water Charges You

Stick your flat hand out a car window at highway speed and tilt it. You just measured drag with your arm: the force a fluid charges for the crime of moving through it. Now do the thought experiment underwater, in a fluid 800 times denser, and you have the tax code our robot lives under.

Drag has a rate schedule, and its cruelest line is this: the force grows with the SQUARE of speed. Double your speed and the water charges quadruple the force, which requires quadruple the thrust, which, since power is force times speed, demands roughly EIGHT times the power. This single fact explains half of underwater vehicle design. It is why "just add bigger thrusters" is the most expensive sentence in robotics, why our robot cruises rather than races, and why a pilot who approaches a task slowly is not being timid; they are refusing an exponential bill.

What sets the base rate? Two things the designer controls. First, frontal area: how much silhouette the vehicle shows the water in its direction of travel. Every camera housing, every bracket, every accessory bolted to the front buys its capability with permanent drag. Second, shape. A flat plate and a smooth fairing with the same silhouette pay wildly different rates, because drag is partly about how violently the water has to get out of the way and how messily it closes up behind. Blunt shapes tear the water and leave a churning, low-pressure wake that literally sucks the vehicle backward. Streamlined shapes part the water and let it close politely. The difference is not subtle; it can be several-fold.

There is a tradeoff hiding here, and it is worth saying honestly: MATE robots are boxy frames, not torpedoes, and that is often correct. An open frame is easy to build, easy to modify, easy to service at a pool day, and mission tasks reward a stable working platform more than a fast one. Our vehicle mostly moves slowly and precisely, where drag matters less, then occasionally must hold position against its own tether's pull, where it matters a lot. The point of this card is not that you must streamline everything. It is that shape and area are DECISIONS with a price, and a team should know the bill before, not after, bolting one more thing to the bow.

**Prep prompt (bring in writing):** Before class, commit to a written ranking: a sphere, a flat disk, and a streamlined teardrop, all of equal mass, are dropped through a tall water column. Predict their finishing order and, for the shape you rank slowest, explain in two sentences WHERE the water is charging it most (front, behind, or both). You will time all three yourself; the oral check compares your predicted ranking and reasoning against your own stopwatch data, and asks what your result implies about one specific object currently bolted to Godzillah.

---

**Format:** Bench experiment + estimation | **Time:** 40 min | **Prerequisites:** Card 1.1

## Core Question
Two objects with the same weight and volume can need wildly different force to move through water. What does shape cost us, and how much thrust does our robot actually need?

## Resource (~10 min)
1. Drag grows with the square of speed: double your speed, quadruple the drag. This is why "just add bigger thrusters" is an expensive answer.
2. Frontal area and shape both matter. A flat plate and a fairing of the same frontal area have drastically different drag.

## Activity
1. Drop race: three objects of equal mass but different shapes (sphere, flat disk, streamlined form) fall through a tall water column. Time them over a marked distance, three trials each, record and rank.
2. Estimate: using thruster datasheet curves, how fast can the ROV realistically cruise, and what happens to station-keeping when a mission requires pushing against a current or dragging a payload?

## Clearing This Card
Turn in the timed data table and the estimate, plus a 90-second oral check: "The team wants to bolt one more camera housing on the front. What questions do you ask before saying yes?"

## If You Miss This Class
The drop column and shapes stay available; run the trials solo, same artifact and check.

## Why This Matters
Frame geometry decisions get made early and are painful to reverse. This card gives you the vocabulary to argue about them in DDRs with numbers instead of vibes.
