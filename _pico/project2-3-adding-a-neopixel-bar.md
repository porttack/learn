---
layout: lesson
title: "Project 2.3: Adding a NeoPixel Bar"
pathway: pico
order: 110
chapter: "p2.3"
standards_carrier: picoprojects
project: 2
project_part: 3
label: "Project 2.3"
source: original
subtitle: "The voltage you can already read gets something fun to control"
---

This is for after Project 2.2's potentiometer-reading loop is working and
you've checked it against a multimeter. A NeoPixel stick adds a new kind of
output: eight individually colored LEDs, each one addressable from code.

### Wire the NeoPixel stick

A NeoPixel stick has three wires: power, ground, and one data wire that
controls all eight pixels in sequence. The two ends aren't the same, an
arrow printed on the strip points from DIN (data in) to DOUT (data out),
and your wire has to go into the DIN end or nothing will light up.

1. Data wire to GP17, physical pin 22.
2. Ground wire to your **spare ground rail** from Project 1.1, or directly
   to physical pin 23, a ground pin right next to the data wire, whichever
   is easier to reach on your breadboard.
3. Power wire to **VSYS**, physical pin 39.

<aside class="callout warning" markdown="1">
**NOT FROM 3V3**

Eight pixels at full white can pull around 480 mA, more current than the
3V3 rail is built to supply reliably. Power the strip from VSYS instead,
and keep brightness low, around 20 out of a possible 255, in every program
you write for it. Dim is also easier on your eyes than eight LEDs at full
brightness six inches from your face.
</aside>

### Light a bar instead of just printing a number

Add the NeoPixel to the loop you already built in Project 2.2. The
potentiometer-reading part doesn't change at all, you're just giving its
result somewhere new to go.

```python
from machine import Pin, ADC
from neopixel import NeoPixel
import time

np = NeoPixel(Pin(17), 8)   # 8 pixels, data on GP17
pot = ADC(Pin(26))          # only GP26, 27, 28 can read analog voltages

while True:
    raw = sum(pot.read_u16() for _ in range(8)) // 8
    volts = raw / 65535 * 3.3

    lit = round(volts / 3.3 * 8)   # how many of the 8 pixels to turn on

    for i in range(8):
        np[i] = (0, 20, 0) if i < lit else (0, 0, 0)   # (red, green, blue)
    np.write()   # nothing on the stick actually changes until this runs

    print("Volts:", round(volts, 2), "Pixels:", lit)
    time.sleep_ms(100)
```

Turn the knob and watch the bar grow and shrink. If you still have
Thonny's plotter open, keep volts and pixel count on it together, they
share a similar scale (0 to 3.3 and 0 to 8), but leave the raw
0-to-65,535 reading out of the plot, it would flatten the other two lines
to nothing.

### CHALLENGE: color by voltage

<aside class="callout challenge" markdown="1">
**CHALLENGE: COLOR BY VOLTAGE**

Change the pixel loop so the lit pixels change color depending on the
voltage, not just their count: green below 1.1V, yellow from 1.1V up to
2.2V, red above 2.2V. Use the `volts` variable you already have, not
`raw`.

```python
    if volts < 1.1:
        color = ...   # TODO: a green tuple
    elif volts < 2.2:
        color = ...   # TODO: a yellow tuple
    else:
        color = ...   # TODO: a red tuple

    for i in range(8):
        np[i] = color if i < lit else (0, 0, 0)
```

Keep the brightness values small, the same reasoning as the warning above
still applies.
</aside>

### Going further

Once the challenge above works, here are two different ways to spread
color across the whole bar instead of switching it all at once. Try both
and compare.

**A smooth fade**, where the entire bar shifts from green to red as the
voltage rises, instead of jumping between three fixed colors:

```python
    f = volts / 3.3
    color = (int(20 * f), int(20 * (1 - f)), 0)
```

**A fixed gradient by position**, closer to how a real VU meter looks,
where each pixel's color depends on where it sits on the strip, not on the
voltage directly:

```python
    for i in range(8):
        if i < lit:
            f = i / 7
            np[i] = (int(20 * f), int(20 * (1 - f)), 0)
        else:
            np[i] = (0, 0, 0)
```

Both react to the same voltage, but ask yourself what each `color`
actually depends on. One changes because the voltage changed. The other
changes because a pixel's position changed, and only the *count* of lit
pixels depends on voltage at all.

### Troubleshooting

If the strip does nothing: check that the data wire is in the DIN end, not
DOUT, that the NeoPixel's ground and the Pico's ground actually share a
connection, and that you're powering it from VSYS, not a 3V3 pin that's
also expected to drive a weak data signal. If one pixel near the start
never lights while the rest work, that pixel itself may be dead, try
starting your strip from the next one over. If GP17 seems unresponsive
after editing `boot.py` or `main.py` in an earlier project, a soft reset
(Ctrl+D in the Shell) clears anything those files claimed on startup.

Once the bar reacts the way you expect, move on to
[Project 2.4](/pico/project2-4-swapping-in-a-light-sensor/), an optional
part where you'll trade the knob for a light sensor and this exact code
keeps working.
