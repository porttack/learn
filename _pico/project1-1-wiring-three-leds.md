---
layout: lesson
title: "Project 1.1: Wiring Three LEDs"
pathway: pico
order: 100
chapter: "p1.1"
project: 1
project_part: 1
project_name: "Three LEDs"
label: "Project 1.1"
source: original
subtitle: "Build a three-LED circuit on your breadboard, by hand"
organizer: /pico/project1-1-graphic-organizer/
slides: /pico/project1-1-intro-slides/
---

Today you're building real hardware: no simulator, no code yet, just a breadboard, some wire, and your own hands. Your Pico is already seated in your breadboard. Read through this whole page once before you touch anything, so you know where you're headed.

If you want to double check a physical pin number for yourself, [Appendix B, Pinout guide](/pico/14-pinout-guide/) has the full reference.

<aside class="callout warning" markdown="1">
**DO NOT CONNECT TO USB TODAY**

Leave your Pico unplugged for this entire lesson. A wiring mistake that's completely harmless while unpowered, like power and ground crossed, or a short between two strips, can damage your Pico or your circuit the moment it's connected. Your circuit gets connected to USB for the first time only after a teacher has checked it, not before.
</aside>

### Wire color and your breadboard

You'll cut and strip your own 22-gauge solid wire instead of using pre-made jumper wires. Jumper wires use Dupont connectors, which are famously fragile and pull loose easily, and a board full of them never looks as neat as one wired by hand. Neatness counts here for a real reason: a wiring harness that looks careful is also one that's easy to debug, and today's build doubles as a class neatness competition. More on judging from your teacher.

Use color on purpose:

- **Red** wire only for 3V3 power
- **Green** wire only for ground (GND): that's the ground color in this classroom, always
- **White** wire for every signal wire, connecting to a GPIO pin

This isn't just tidiness. When something doesn't work, the first thing you or a neighbor will check is whether a wire's color matches what it's actually carrying.

### Power your breadboard

Run three wires from your Pico before you build any circuit:

- Physical pin 36 (3V3 OUT) to a rail, with a red wire
- Physical pin 38 (GND) to a separate rail on that same side of the board, with a green wire
- Physical pin 18 (GND) to a rail on the other side, the same side as GP13, GP14, and GP15, with a green wire

Call the first one your **power rail** and the second one your **main ground rail**: together, they're what you'll use for the LED circuit. Call the third one your **spare ground rail**. You won't need it for this circuit, but it's wired and ready for later.

### Finding the cathode, even after you cut the legs

You'll trim each LED's legs short for neatness, which means you can't rely on "the longer leg is the anode" once they're cut to match. Find the cathode a different way instead, using the LED itself rather than its legs:

- The LED's plastic case has a flat edge on its rim. That flat edge marks the cathode side, no matter how short the legs are cut.
- Look closely through the dome of the LED. Inside, you'll see two small metal supports; the larger one connects to the cathode.

<figure id="fig-led-cathode">
  <img src="{{ '/assets/img/pico/led-cathode-identification.svg' | relative_url }}" alt="A red LED, front view, with the flat edge on its case marked as the cathode side, the shorter leg labeled cathode and the longer leg labeled anode, and an inset showing that the larger of the two internal metal flags, visible through the dome, is also the cathode">
  <figcaption>Finding the cathode: the flat edge on the case, or the bigger flag inside</figcaption>
</figure>

Before you cut, check that both of these line up with the longer leg, so you trust them once the legs are trimmed and match.

### Build the LED circuit

You'll need 3 LEDs and 3 resistors (330 Ω, or 220 Ω if your LEDs look too dim). If your resistors aren't labeled with a value you can read directly, [Chapter 3's guide to reading resistor colour codes](/pico/03-physical-computing/#reading-resistor-colour-codes) covers how to work it out from the colored bands. Each LED gets its own resistor and its own GPIO pin: physical pins 17, 19, and 20, which are GP13, GP14, and GP15. Trim both the LEDs' legs and the resistors' leads short, the same way, so everything sits flat and neat against the board.

For each of the three:

1. Place a resistor from your main ground rail to an open strip on the breadboard.
2. Place the LED so it bridges the center gap, with its cathode (flat edge on the case) on that same strip as the resistor.
3. Run a white wire from the LED's anode, on the other side of the gap, to GP13, GP14, or GP15.

Use red for all three LEDs in this circuit.

<aside class="callout note" markdown="1">
**LED COLOR AND VOLTAGE**

Not every LED works well at 3.3V. "True green," blue, and white LEDs typically need more forward voltage than red, yellow, or amber ones, and can end up dim or unreliable here. Stick to red for this build.
</aside>

If it would help to see why the resistor matters, [The Water Analogy](/pico/water-analogy/) is an interactive page that walks through voltage, current, and resistance as water pressure, flow, and a narrow pipe.

### Get it signed off

<figure id="fig-interlude-b-exemplar-1">
  <img src="{{ '/assets/img/pico/interlude-b-exemplar-1.jpg' | relative_url }}" alt="Exemplar 1: a Pico 2 W seated in a breadboard with power and ground wires run to a rail, and three red LEDs each paired with a resistor">
  <figcaption>Exemplar 1: the finished LED circuit</figcaption>
</figure>

Once your three LEDs are wired, compare your breadboard to the exemplar at the front of the room (and to the photo above). Ask a neighbor to check it against the exemplar first. Once they agree it matches, call a teacher over for the real sign-off. Keep your Pico unplugged until then, even if you're confident it's right.
