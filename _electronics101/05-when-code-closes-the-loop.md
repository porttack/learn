---
layout: lesson
title: "Connect a Microbit"
pathway: electronics101
order: 5
source: original
---

Build circuits 8 and 9 with a micro:bit and [MakeCode](https://makecode.microbit.org)
before reading past the figures. Both use blocks, not typed code.

<figure id="diagram-8">
  <img src="{{ '/assets/img/electronics101/diagram-8.jpg' | relative_url }}" alt="Diagram 8: a micro:bit wired to a breadboard with two LEDs, alongside MakeCode blocks — on button A pressed, digital write pin P0 high, wait 2 seconds, then low; on button B pressed, the same on pin P8; on start, both pins set low.">
  <figcaption>Diagram 8: micro:bit and two LEDs</figcaption>
</figure>

<figure id="diagram-9">
  <img src="{{ '/assets/img/electronics101/diagram-9.jpg' | relative_url }}" alt="Diagram 9: a micro:bit wired to a breadboard with an LED and a servo, alongside MakeCode blocks — a forever loop that writes analog pin P1 to pitch rotation, writes analog pin P8 to roll rotation, and rotates a servo on pin P16 to the light level.">
  <figcaption>Diagram 9: micro:bit, LED, and servo</figcaption>
</figure>

## A program is a break in the loop it controls

Lesson 2 was a switch: a person closes the loop. Lesson 4 was a
photoresistor: the room closes the loop. Diagram 8 is the same loop again,
closed by a program instead — button A pressed calls for pin P0 high, waits
2 seconds, then sets it low again; button B does the same on pin P8. The
`on start` block sets both pins low before anything else runs, so the LEDs
begin off rather than in whatever state the pins happened to power up in.

The loop being closed by code rather than a finger doesn't change what's
happening electrically. It's still current flowing because a pin went
high, same as every LED circuit before this one — it's only the *decider*
that changed.

## Code can do more than open and shut

A switch or a button is binary: open or closed, on or off. Diagram 9 shows
code doing something neither a switch nor a photoresistor can — a `forever`
loop continuously reads the micro:bit's own tilt (pitch and roll) and
writes it as an analog value to an LED, while separately reading the light
sensor and using it to *aim* a servo, rather than just switching it on.
Code can turn one input into a different, continuously varying output — not
just open and shut a loop, but decide where a loop points.

<aside class="callout challenge" markdown="1">
**WHY THIS SERVO IS RISKIER THAN AN LED**

A servo pulls far more current than an LED, and it doesn't pull a steady
amount — it spikes when it starts moving. Estimate the numbers the way you
did in lesson 3: at 5 V, a small hobby servo can draw several hundred
milliamps on a stall or a fast move, versus the ~14 mA an LED asked for.

> P = V × I

Multiply that out and a servo can easily ask for a watt or more, versus an
LED's tens of milliwatts. A micro:bit's onboard regulator has a current
budget, same as the ¼ W resistor in lesson 3 had a power budget — and a
servo can ask for more current than that regulator can supply all at once.
</aside>

<aside class="callout warning" markdown="1">
**WARNING**

If a servo makes the micro:bit reset or the board browns out when the
servo moves, that is not a code bug, even though it looks exactly like one.
It's the current budget from the callout above being exceeded. A servo (or
any motor) should get its own power supply, not power borrowed from the
board it's plugged into — with the servo's ground and the micro:bit's
ground still tied together, so they agree on what "zero volts" means.
</aside>

That's the honest end of this sequence: a model — Ohm's law, power, all of
it — is trustworthy inside the assumptions it was built on, and silent
outside them. Eight circuits in, you've earned the right to be told that.

## Questions

1. Diagram 8's LEDs are switched fully on or fully off. Diagram 9's LED is
   driven by an analog write instead. What can an analog write do that a
   digital write on diagram 8 can't?
2. If a robot's motor and its controller board share a power supply, and
   the motor draws a current spike, what happens to the controller?
