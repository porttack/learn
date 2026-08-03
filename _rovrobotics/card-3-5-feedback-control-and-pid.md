---
title: "Card 3.5: Feedback Control and PID"
order: 27
source: original
unit: "3. Control and Actuation"
---

**Unit:** Control & Actuation
**Format:** Socratic seminar (or self-study path below)
**Time:** 30 to 40 minutes
**Prerequisites:** Card 3.1 (PWM), Card 3.7 helps but is not required

---

## Core Question

Our float needs to stop AT 2.5 meters, not blow past it and bounce. A human can do this by feel. How does a machine do it with only a pressure sensor and a piston?

## Resource (read/watch before seminar, ~10 minutes)

1. Read TUNING.md from the team float repository (github.com/slvusd/float). Focus on what kp, ki, and kd each do.
2. Watch: any short "PID explained" video of your choice (search "PID controller explained simply", pick one under 8 minutes). Note one thing that made sense and one thing that did not.

## Prep Notes (bring to seminar, this is your artifact)

Answer in writing, a few sentences each:

1. In your own words: what is "error" in a control system? What is the error if the float is at 1.9 m and the target is 2.5 m?
2. The P term pushes harder when error is bigger. Why is P alone not enough? What goes wrong?
3. Our float's actual starting gains are kp = 40.0, ki = 8.0, kd = 15.0. Pick ONE of these and predict: what would happen at the pool if we doubled it?
4. Write one honest question you still have. (Real questions score; fake questions are obvious.)

## Seminar Questions (teacher facilitates, students carry it)

- Why does the float overshoot at all? Where does the momentum come from?
- What does the D term "know" that the P term does not?
- Why does the code cap the integral term (imax = 0.5)? What disaster is that preventing?
- Is there a version of this problem in the ROV, not just the float? Where?
- Cars, thermostats, drones: where else is PID hiding in your life?

## Clearing This Card

Choose one:

- **Oral check (90 seconds, during build time):** Explain to the teacher what happens to the float if kd = 0, and why. Then: your team doubles kp and the float oscillates violently. What do you adjust and why?
- **Teach-back (5 minutes at sprint standup):** Teach your team the three terms using the float as the example. Your team asks one question; you field it.

## If You Miss This Class

Do the resource, write the prep notes, then clear via oral check or teach-back as above. Same standard, same artifact. Nothing extra, nothing less.

## Why This Matters for Competition

The float's depth hold is worth real points, and judges will ask WHY your control approach works, not just what it does. A student who owns this card can defend the PID choice at the engineering presentation. Pool tuning of these exact gains is a sprint task, so this lesson feeds directly into build work.
