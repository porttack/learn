---
title: "Card 4.3: Data Logging"
order: 33
source: original
unit: "4. Software"
status: Draft
solo: true
duration: "1 wk"
---

**Format:** Code workshop | **Time:** 40 min | **Prerequisites:** Ladder rungs 5 to 7

## Core Question
At competition, the float must come back from its dive carrying proof: timestamped depth data in a specified format. What makes a log trustworthy, and what makes it garbage?

## Resource (~10 min)
1. Read the float data requirements in the manual: what fields, what the packet must contain (team number, time, depth), and what the judges receive.
2. The three sins of logging, with real examples: no timestamps (data with no when), clock drift or wrong timezone, and buffering loss (the program died and took the last minute of data with it; this is why we flush or write line by line).

## Activity
Write a logger: a script that, every second, records a timestamp and a value (use the real pressure sensor if the rig is free, otherwise the provided simulator function) into a CSV. Run it for two minutes, kill the process mid-run on purpose, and check: did your file keep everything up to the kill? Fix it if not. Then format one line of your data as a competition packet per the manual's spec.

## Clearing This Card
Your CSV, your kill-test result, and the formatted packet line, plus a 90-second oral check: "The judges say your timestamps are 8 minutes off from official time. What happened and what is your pre-dive checklist item that prevents it?"

## If You Miss This Class
Simulator function and spec sheet on the class page; same artifact and check.

## Why This Matters
This is not practice shaped like the competition; it IS the competition deliverable, built early enough to be boring by May. Boring is the goal.
