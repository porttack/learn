---
layout: default
title: "Pacing Electronics 101 alongside Pico"
permalink: /electronics101/pacing/
---

# Pacing Electronics 101 alongside Pico

For teachers, not students. The early [Pico]({{ '/pico/' | relative_url }})
lessons are reading before there's anything to build — board tour, headers,
flashing MicroPython. Electronics 101 doesn't depend on any of that, so
students who finish reading early (or need something hands-on while others
are still reading) can be rotated onto it instead of sitting idle.

## Suggested pairing

| While students read… | They build… | Why |
|---|---|---|
| Pico 00–02 (front matter, board tour, headers, flashing, first ViperIDE program) | [Electronics 101 §1 — Voltage and current]({{ '/electronics101/01-voltage-and-current/' | relative_url }}) | Nothing physical on the Pico is wired up yet. Meters give them hands-on time immediately, and the Pico's 3V3/VBUS/GND pins are literally the same kind of source they're measuring. |
| Pico 03 (physical computing concepts) | [§2 — Switches and potentiometers]({{ '/electronics101/02-switches-and-potentiometers/' | relative_url }}), [§3 — Breadboards and forward voltage]({{ '/electronics101/03-breadboards-and-forward-voltage/' | relative_url }}) | This chapter *tells* them about resistors, LEDs, and breadboards. §2/§3 make them build it instead of reading about it. |
| Pico 04 (physical computing with Pico — first real GPIO wiring) | [§4 — When the world closes the loop]({{ '/electronics101/04-when-the-world-closes-the-loop/' | relative_url }}) | A digital input on Pico is conceptually a button. A photoresistor is the analog version, and sets up why Pico eventually needs an ADC. |
| Pico 05 (traffic light controller) | [§5 — When code closes the loop]({{ '/electronics101/05-when-code-closes-the-loop/' | relative_url }}) | Same idea — code deciding when a pin goes high — on a different board, in a different language. |

## Concept parallels worth naming out loud

- **The 220 Ω series resistor is the same calculation in both pathways.**
  Whatever LED math a student does in Electronics 101 §3 transfers directly
  to wiring an LED on a Pico GPIO pin.
- **Pico's logic is 3.3 V and its pins source far less current than a bench
  supply.** The voltage/current intuition from §1 and §3 is what lets a
  student recognize when a Pico pin can't drive something directly and
  needs a transistor or driver instead.
- **A switch as "a break in the loop you control" (§2) is the prerequisite
  for understanding why a pull-up resistor exists on a Pico input pin.**
  CLAUDE.md's own framing is the reason this matters: a student who
  understands *why* the pull-up is there can debug it; a student who only
  copied the diagram can't.
- **A potentiometer and a photoresistor (§2, §4) are both voltage dividers**
  — which is exactly the circuit behind `machine.ADC` on the Pico side.
- **§5's brownout warning is the same reason ROV thrusters get their own
  power rail**, not power borrowed from the Pico. If a student has already
  hit this once with a micro:bit and a servo, the ROV wiring rule stops
  looking arbitrary.
