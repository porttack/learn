---
title: "Card 0.3: Sprint Planning and Estimation"
order: 8
source: original
unit: "0. Engineering Process"
status: Draft
solo: true
duration: "1 wk"
---

## Before Class Reading: Why Everything Takes Twice as Long

In 1979, psychologists Daniel Kahneman and Amos Tversky named a bug in human thinking: the planning fallacy. People predicting how long their own work will take are reliably, sometimes spectacularly, optimistic, even when they know that similar work has always run late before. The Sydney Opera House was estimated at 4 years and took 14. Your homework was estimated at 30 minutes and took the evening. Same bug.

The bug has a structure. When you estimate, you imagine the task going well: the parts arrive, the code compiles, nobody is absent, the epoxy cures on schedule. You are estimating the best case and calling it the plan. Reality is not the best case; it is the best case plus every interruption you failed to imagine, and you cannot imagine them all, by definition.

Engineers cannot remove the bug, so they route around it. Three techniques:

First, the doubling rule. Take your honest estimate and multiply by two. This feels insulting and works remarkably well. (Programmers joke about Hofstadter's Law: it always takes longer than you expect, even when you take into account Hofstadter's Law.)

Second, use the outside view. Instead of imagining your task, ask what happened to similar tasks. Not "how long will OUR claw take," but "how long did claws take the last three times this team built one?" The past is a better forecaster than your imagination, precisely because it already includes the interruptions.

Third, shrink the unit. Big deliverables hide their lateness; "working claw" can be 20% done or 80% done and look identical for weeks. Small demonstrable deliverables cannot hide: "jaw prototype closes on a PVC pipe at the bench" is either shown at the sprint review or it is not. If a deliverable cannot fit in one 3-week sprint, it must be split until it can.

Our sprint system is built from these three techniques. Public commitments, doubled estimates, demonstrable units, and a pool day that does not negotiate. The water is the least sympathetic project manager you will ever have, which is exactly what the planning fallacy deserves.

**Prep prompt (bring in writing):** Pick one task YOU personally worked on last season (or in any project, if you are new). Write: what you originally thought it would take, what it actually took, and one specific interruption or complication you failed to imagine at the start. Then apply the outside view to this year: name one thing our team plans to build this season, and what the historical record of this team says about it. Your answer must contain details only someone who was there would know.

---

**Unit:** 0, Engineering Process
**Format:** Short instruction + team planning workshop
**Time:** 40 minutes
**Prerequisites:** None, but this card lands right before Sprint 1 planning.

---

## Core Question

Our sprints are 3 weeks: roughly 6 class sessions ending at a pool day. Teams that overcommit finish nothing; teams that undercommit hide. How do you promise an amount of work you will actually deliver?

## Resource (~10 minutes)

The teacher walks through the sprint system:

- A **sprint commitment** is a short public list of deliverables your team promises for this sprint.
- A **deliverable** is done when it can be demonstrated, ideally in the water at pool day. "Mostly done" is not a state. Bench-demo fallbacks count when the pool is not required or not available.
- **Estimation rule of thumb:** take your honest guess of how long a task takes and multiply by 2. You are not slow; everyone estimates this badly, including professionals. Last year's claws are the proof.
- Deliverables bigger than one sprint must be split. "Working claw" is not a Sprint 1 deliverable. "Claw jaw prototype closes on a PVC pipe at the bench" might be.

## Activity: Draft Your Team's Sprint 1 Commitment (team artifact)

As a team, draft 3 to 5 deliverables for Sprint 1. For each one write:

1. The deliverable, phrased as something demonstrable ("X does Y at pool day / at the bench")
2. Who owns it (one name; owners can have helpers, but one person answers for it)
3. Your doubled time estimate in class sessions
4. What parts it needs, if any (this feeds the BOM card, 0.5)

Sanity check before submitting: add up the session estimates per person. If anyone is over 6, you have overcommitted and must cut or split.

## Your Weekly Status Report

Starting this Thursday, you post a short status report every week: Progress, Near-term goals, Concerns, plus your hours. It is how the teacher and your team track a commitment like the one you just made without anyone chasing anyone down. See [Your Sprint Status Report]({{ '/rovrobotics/sprint-status-report/' | relative_url }}) for the format and where it goes. Your first report is due this Thursday, and every deliverable you just committed to should show up in a future Progress bullet.

## Clearing This Card

Your team's commitment is accepted at sprint planning after teacher review, AND you individually pass a 90-second oral check: pick one deliverable you own or help with, and explain what "done" looks like for it and what could make it slip. Complete or Not Yet.

## If You Miss This Class

Read the resource, then write a personal sprint commitment for your own work that meets the same four requirements, and take the same oral check. Your items get merged into your team's plan when you return.

## Why This Matters for Competition

MATE scores detailed project planning directly in the technical documentation, and the season has hard deadlines that do not move. But the deeper reason is the one you already know: every claw that failed, failed at estimation before it failed at engineering. This card is where we stop letting that happen by accident.
