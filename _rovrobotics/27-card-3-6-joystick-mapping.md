---
title: "Card 3.6: Joystick Mapping"
order: 27
source: original
unit: "3. Control and Actuation"
---

**Format:** Code + feel test | **Time:** 40 min | **Prerequisites:** Card 3.1; a Python ladder rung or partner helps

## Core Question
A joystick reports numbers; a thruster wants pulses. The function between them decides whether the robot feels surgical or drunk. What should that function be?

## Resource (~10 min)
1. Read raw axis values from our controller live on screen. Notice it never quite rests at zero: sensor noise and spring slop. This is why deadzones exist.
2. Three mapping ideas on the whiteboard: straight linear, deadzone plus linear, and an expo curve that softens the center and keeps full authority at the edges.

## Activity
Using the provided starter script, implement a deadzone and one nonlinear mapping. Test each mapping on the bench-spin station or LED rig and have a partner do a blind "feel test": which mapping makes it easiest to hold 10% output steadily? Record which mapping won and why.

## Clearing This Card
Your mapping code plus the feel-test result, and a 90-second oral check: "The pilot says fine positioning during the coral task is impossible. Which part of the mapping do you change, and what is the tradeoff at full speed?"

## If You Miss This Class
Starter script and controller in the bin; recruit any student for the blind feel test during studio time.

## Why This Matters
Mission points come from precise manipulation, and precision lives in this function. This card also produces a DDR candidate: the pilot's mapping is a real design decision the team should be able to defend.
