---
title: "Card 3.3: Servos and Steppers (Choosing an Actuator)"
order: 25
source: original
unit: "3. Control and Actuation"
---

**Unit:** Control & Actuation
**Format:** Bench stations + short Socratic close
**Time:** 40 minutes
**Prerequisites:** Card 3.1 (PWM)

---

## Core Question

The claw needs to move to a position and hold it. A servo, a stepper, and a plain DC motor can all move things. They fail differently, cost differently, and are controlled differently. How do you pick, and how do you defend the pick?

## Resource (~10 minutes)

Two bench stations, 5 minutes each:

1. **Servo station:** hobby servo on a signal generator or Pi. Sweep the PWM pulse width from 1.0 to 2.0 ms and watch position follow. Grab the horn gently and feel it fight back. That fight is closed-loop feedback: the servo knows where it is.
2. **Stepper station:** stepper on a driver. Step it, count steps, then stall it by hand and step again. Notice it is now WRONG about where it is and has no idea. Open loop: it counts, it does not know.

## Concept Core

- **Servo:** position feedback built in, PWM pulse width commands an angle, limited rotation range, holds position under load. Cheap hobby servos are not waterproof and their gears strip.
- **Stepper:** precise repeatable steps, full continuous rotation, but loses position silently when stalled and draws holding current constantly.
- **DC motor + limit switches:** dumbest and often most reliable. Two states, two switches, done.
- The engineering question is never "which is best." It is "which failure can this mission tolerate."

## Socratic Close (10 minutes)

Last season's claws aimed for complexity and ran out of time. Given what you just felt at the two stations: what is the simplest actuator that meets a claw's real requirements? What requirement would have to exist before a stepper earns its complexity? Would you rather a claw that grips weakly or one that lies about its position?

## Clearing This Card

- **Oral check (90 seconds):** you are handed a mission task description from the manual. Pick an actuator for it and defend the pick, including the failure mode you are accepting. There is no single right answer; there are defensible and undefensible ones.
- **Teach-back alternative:** run both bench stations for a teammate who has not cleared the card, and field their questions.

## If You Miss This Class

The stations stay set up for two weeks. Run them solo during build time (10 minutes), then take the oral check. The feel of the servo fighting back and the stepper losing count is the lesson; a video is a weak substitute, so hands on the hardware is required for this card.

## Why This Matters for Competition

This card feeds directly into the claw DDR your team will write this season. "We chose a servo because it holds position under load and the mission never needs more than 180 degrees, and we accepted the waterproofing burden" is a judge-ready sentence. Actuator choice is also exactly the kind of decision where teams historically overreach; this card exists so simplicity is a choice you can defend, not a compromise you apologize for.
