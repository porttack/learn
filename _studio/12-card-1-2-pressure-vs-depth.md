---
title: "Card 1.2: Pressure vs. Depth"
order: 12
source: original
unit: "1. Water Physics"
---

## Before Class Reading: The Patient Squeeze

Hold your hand out. Right now, a column of air reaching to the edge of space is pressing on it with about one kilogram of force per square centimeter. You do not notice because you have never felt anything else, and because you are pressurized from the inside to match. That everywhere-pushing force is one atmosphere, about 101 kilopascals, and it is the baseline every diver, submarine, and ROV starts from before touching the water.

Water is roughly 800 times denser than air, so the pressure column grows 800 times faster as you descend. The working rule: every 10 meters of fresh water adds another full atmosphere. At 10 meters you carry double the surface pressure. At 2.5 meters, our float's target depth, the water alone adds about 25 kilopascals, a quarter of an atmosphere, on top of the air's 101. Note the bookkeeping trap hiding in that sentence: GAUGE pressure counts only the water; ABSOLUTE pressure includes the atmosphere too. Sensors report one or the other, and a program that confuses them believes the surface is 10 meters underwater. That exact bug has shipped on real vehicles.

What does the squeeze actually do? To rigid, sealed things, mostly nothing, until it finds a weakness: a flat panel that can bow, an O-ring seated wrong, a bubble in potting compound. Pressure is patient and probes everything equally from all directions. To compressible things, air pockets, foam, syringes, it does something more interesting: it shrinks them. A trapped air volume at 10 meters occupies half its surface size. This is why cheap foam gets crushed at depth, why a "sealed" bag behaves differently from a rigid box, and, as you will see in the next reading, why shrinking volume is the secret behind how floats fly.

The numbers stay friendly at our scale: a pool is 1.4 atmospheres absolute at the bottom, gentle. But the same arithmetic runs all the way down. The bottom of Monterey Canyon, in our regional's backyard, sits under more than 350 atmospheres, where every unprotected air space in a machine simply ceases to exist. The vehicles that work there are ours, scaled up, engineered against the identical rule you can verify this week with a syringe and a tape measure.

**Prep prompt (bring in writing):** Before class, seal a plastic syringe at exactly half its volume (or imagine doing so) and commit to two written predictions: where will the plunger sit at 2.5 meters, and at 10 meters? Show the arithmetic behind each prediction, not just the answer. You will test at whatever depth our column allows and defend or revise your numbers against your own measurement; the oral check starts from the gap between your prediction and what you observed.

---

**Format:** Demo + calculation | **Time:** 30 min | **Prerequisites:** Card 1.1

## Core Question
Every 10 meters of water adds another full atmosphere of squeeze. What does that do to our enclosures, our syringes, and our float at 2.5 meters?

## Resource (~10 min)
1. The rule: pressure increases about 1 atmosphere (101 kPa) per 10 m of fresh water, on top of the atmosphere already pressing down at the surface.
2. Demo: a water bottle with three holes at different heights. Watch which stream shoots farthest and explain why before anyone says it aloud.

## Activity
1. Seal a syringe at half volume. Predict, in writing, its plunger position at 2.5 m and at 10 m. Then test at whatever depth the tub or a dive weight line allows and compare.
2. Calculate absolute pressure at: the pool bottom (4 m), the float's target depth (2.5 m), and the deepest point of Monterey Canyon (about 3,600 m). Show work.

## Clearing This Card
Turn in predictions and calculations, plus a 90-second oral check: "Our enclosure is rated to 2 atmospheres absolute. How deep can it go, and what safety margin would you want before trusting it?"

## If You Miss This Class
Same activity solo during studio time; the tub and syringes stay out for two weeks. Same oral check.

## Why This Matters
Pressure ratings drive enclosure and penetrator design, and the pressure-to-depth conversion is the exact math the float's sensor code performs every cycle. You will meet this equation again in Card 3.7 as running code.
