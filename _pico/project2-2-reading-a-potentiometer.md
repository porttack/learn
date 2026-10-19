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
    # Read the pot 8 times and average them. A single reading jitters a
    # little; averaging smooths that out.
    raw = sum(pot.read_u16() for _ in range(8)) // 8

    # read_u16() gives 0 to 65535, where 65535 means the full 3.3V.
    volts = raw / 65535 * 3.3

    print("Volts:", round(volts, 2))
    time.sleep_ms(100)
```

If `sum(pot.read_u16() for _ in range(8))` looks unfamiliar, here's the
same averaging written as an explicit loop instead:

```python
total = 0
for _ in range(8):
    total += pot.read_u16()
raw = total // 8
```

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
