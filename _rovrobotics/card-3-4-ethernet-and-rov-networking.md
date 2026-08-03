---
title: "Card 3.4: Ethernet and ROV Networking"
order: 26
source: original
unit: "3. Control and Actuation"
status: Draft
solo: true
duration: "1 wk"
---

**Unit:** Control & Actuation
**Format:** Hands-on (crimping) + short concept discussion
**Time:** 40 minutes
**Prerequisites:** None, but Card 2.5 (Tether Voltage Drop) pairs well

---

## Core Question

When you push a joystick topside, that command travels down a tether as network traffic and a computer underwater obeys it. What is actually moving through that cable, and how do the two ends find each other?

## Resource (~10 minutes)

1. Look at a cut-open ethernet cable: 4 twisted pairs, 8 conductors. Why twisted? (Noise rejection. Untwist a pair and you have built an antenna.)
2. Read the network section of the team float repository README (github.com/slvusd/float): the float serves on port 5000, the controller on port 5001. Find the IP addresses in config.py.

## Concept Core (discussion, not lecture)

- An IP address is a street address; a port is an apartment number. One device, many services.
- Topside laptop and the Pi must be on the same subnet to talk. What happens when they are not? (This is the most common "it worked yesterday" failure at the pool.)
- Ping is your first diagnostic. If ping fails, nothing above it can work. Debug from the bottom of the stack up: link light, ping, then application.

## Hands-On

Crimp an RJ45 connector to T568B using the wiring chart at the bench. Test it with the cable tester: all 8 lights, in order.

## Clearing This Card

Two parts:

- **Artifact:** your tested cable, tagged with your name. All 8 conductors pass.
- **Oral check (90 seconds):** the ROV is unresponsive at the pool. The teacher plays the ROV and answers your diagnostic questions. Walk the stack: what do you check first, second, third, and what does each result tell you? Clearing requires reaching the fault in a sensible order, not guessing the fault itself.

Teach-back alternative: run a 5-minute "pool day network triage" walkthrough for your team using a real failure from a past pool day.

## If You Miss This Class

Same resource, same crimp, same oral check during build time. If you cannot attend a bench session, schedule 10 minutes at the start of any class.

## Why This Matters for Competition

Network failures are the classic pool-day time killer, and pool minutes are the scarcest resource we have. A team where every member can triage link light, ping, and application in order recovers in two minutes instead of twenty. Judges also routinely ask how topside talks to the vehicle; this card is that answer.
