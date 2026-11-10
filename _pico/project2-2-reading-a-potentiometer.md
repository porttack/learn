---
layout: lesson
title: "Project 2.2: Reading a Potentiometer, and What a Voltage Divider Is"
pathway: pico
order: 109
chapter: "p2.2"
standards_carrier: picoprojects
project: 2
project_part: 2
label: "Project 2.2"
source: original
subtitle: "What a knob is actually telling the Pico"
organizer: /pico/project2-2-worksheet/
organizer_label: "Worksheet"
---

This project asks a question the last one skipped over: when you read a
potentiometer, what is the Pico actually measuring? Knowing the real answer
is what makes the next few projects (a NeoPixel bar, then a light sensor,
then a joystick) all work with almost no new ideas, just the same one
applied again.

### Wire the potentiometer

Wire it the same way Project 2.1 wired the servo's power, except this time
the middle pin (the wiper) goes to GP26, and the two outer pins go across
your power and ground rails so it reads across the full range.

<aside class="callout note" markdown="1">
**ONLY GP26, 27, AND 28 READ VOLTAGE**

Every other pin on the Pico is purely digital, on or off, nothing in
between. If you wire the wiper to a pin like GP9 expecting it to work the
same way, it won't. Keep the potentiometer, and later the joystick in a
future project, wired to one of these three pins.
</aside>

Never power the potentiometer from VBUS or VSYS. Those are 5V, and the
Pico's ADC can only read up to 3.3V, so a reading above that just clips at
the maximum and stops responding to the knob. It's an easy mistake to
repeat with the joystick later, which is wired the exact same way.

A 1k and a 10k potentiometer read identically here. The ADC measures a
ratio of voltages, not a specific resistance, so the exact value doesn't
matter as long as both outer legs are connected.

### Read the knob into a number

```python
from machine import Pin, ADC
import time

pot = ADC(Pin(26))   # only GP26, 27, 28 can read analog voltages

while True:
    # A list is an ordered collection of values. Start with an empty one,
    # then append 8 readings to it. A single reading jitters a little.
    samples = []
    for _ in range(8):
        samples.append(pot.read_u16())

    # Average the list: add up its elements, divide by how many there are.
    raw = sum(samples) // len(samples)

    # read_u16() gives 0 to 65535, where 65535 means the full 3.3V.
    volts = raw / 65535 * 3.3

    print("Volts:", round(volts, 2))
    time.sleep_ms(100)
```

Each reading you append goes into the next open spot in the list. Every
element has an index, its position in the list, counting from 0, so
`samples[0]` is the first reading and `samples[7]` is the last.
`len(samples)` is how many elements it holds, which is 8 here. Using
`len(samples)` instead of typing 8 again means the average stays correct if
you ever change how many readings you take.

### Look at your samples

Add one line right after the `for` loop, before `raw` is calculated:

```python
    print(samples)
```

Run it and hold the knob perfectly still. You'd expect eight identical
numbers. You'll get eight slightly different ones. Remove the line when
you're done looking, or the Plotter below will try to plot a whole list.

<aside class="callout note" markdown="1">
**WHY WE AVERAGE: MEASURE THE SPREAD**

The gap between your biggest and smallest reading is the spread. A knob
that isn't moving still has a spread above zero, because the ADC picks up
tiny bits of electrical noise from the wiring and the Pico itself. That
noise is the reason we average: one reading can be off by the spread, but
the average of eight is much closer to the truth.

Add this line after the `for` loop and print it next to your voltage:

```python
    spread = ...   # TODO: max(samples) minus min(samples)
```

Write down your spread with the knob at the bottom, the middle, and the top.
Is it the same at all three?
</aside>

Run it, then open Thonny's **View > Plotter**. Turn the knob and watch the
live plot respond. The text before the number in `print()` becomes that
line's label on the plot.

### Prove it with a multimeter

The code claims a specific voltage. Check it.

1. With everything still running, measure the actual voltage from the
   wiper (GP26's wire) to ground with a multimeter. Compare it to what
   Thonny is printing.
2. Unplug the Pico. Measure the resistance from the wiper to each outer
   leg of the potentiometer. Call the one going to ground `R_bottom` and
   the full end-to-end resistance `R_total`.
3. Calculate `3.3 * R_bottom / R_total` by hand and compare it to what you
   measured in step 1. This is the actual voltage-divider formula, the
   same ratio your code is approximating with `read_u16()`.

Your 3V3 rail might measure closer to 3.25V than exactly 3.3. That's real:
the code assumes 3.3 because that's the nominal, advertised voltage, not
because it's guaranteed to be exact. Worth noticing that your program has
been running on an assumption the whole time.

Once turning the knob reliably changes the voltage you're printing, and
you can explain why, move on to [Project 2.3](/pico/project2-3-adding-a-neopixel-bar/),
where that same number finally has somewhere fun to go.
