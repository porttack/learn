---
layout: lesson
title: "Project 1.6: Wiring a Switch Bank (Day 5)"
pathway: pico
order: 105
chapter: "p1.6"
project: 1
project_part: 6
label: "Project 1.6"
source: original
subtitle: "Add three switches to the same breadboard, ready for code in Project 1.7"
---

This is for after [Project 1.5](/pico/project1-5-fading-an-led-with-pwm/) has `leds.py` saved and working on your Pico, with `unarycount`, `binarycount`, `breathe1`, and `breatheall` all in it. Today is wiring only, same as Project 1.1 was: no code until [Project 1.7](/pico/project1-7-choosing-a-program-with-imports/).

<aside class="callout warning" markdown="1">
**UNPLUG BEFORE YOU WIRE**

Disconnect your Pico from USB before adding anything new to the breadboard. A switch can't damage anything the way a reversed LED or a short to 3V3 could, but wiring with the power off is the habit worth keeping anyway.
</aside>

### Wire the switches

A DIP switch is a strip of tiny on/off switches in one package, straddling the center gap just like a chip: each switch has one leg on the left side of the gap, one leg on the right, and flipping it toward the side marked **ON** connects those two legs together. You only need three of them.

<figure id="fig-dip-switches-exemplar">
  <img src="{{ '/assets/img/pico/dip-switches-exemplar.jpg' | relative_url }}" alt="A Pico 2 W breadboard circuit with three red LEDs wired to GP13, GP14, and GP15, and an 8-position DIP switch added above them straddling the center gap. Three of its switches have a green wire running to the main ground rail and a white wire running to the Pico's GP10, GP11, and GP12 pins.">
  <figcaption>Exemplar: three LEDs, plus three switches wired and ready</figcaption>
</figure>

For each of the three switches you're using:

1. Run a green wire from one leg to your main ground rail, the same rail from Project 1.1.
2. Run a white wire from the other leg to a GPIO pin: physical pins 14, 15, and 16, which are GP10, GP11, and GP12.

<aside class="callout note" markdown="1">
**WHITE FOR INPUT NOW TOO**

Project 1.1 just said "white for signal," because every signal wire so far was an output, something your Pico controls. A switch is different: it's an input, something your Pico reads. White still works fine for it; the color marks "GPIO signal," not a particular direction. Your existing LED wires don't need to change.
</aside>

<aside class="callout note" markdown="1">
**IF A SWITCH SEEMS TO DO NOTHING**

Some full-size breadboards split each power rail into two halves around the middle, with no connection between them. If your switches are wired near the gap and your Pico is wired further down, a short jumper bridging the two halves of the ground rail may be missing. Check for a break with a multimeter, or just run a wire from one half of the rail to the other.
</aside>

### Get it signed off

Once your three switches are wired, compare your breadboard to the exemplar above. Ask a neighbor to check it first. Once they agree it matches, call a teacher over for the real sign-off before you plug back in.

Once you're signed off, move on to [Project 1.7](/pico/project1-7-choosing-a-program-with-imports/), where you'll write the code that actually reads these switches.
