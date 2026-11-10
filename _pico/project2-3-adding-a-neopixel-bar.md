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
3. Power wire to your **power rail**, the 3V3 rail from Project 1.1.

<aside class="callout note" markdown="1">
**3.3V IS ENOUGH**

NeoPixels are officially a 5V part, but this stick works fine on 3.3V, so there is no separate power source to wire. Keep brightness low, around 20 out of a possible 255, in every program you write for it. Eight pixels at full white pull a lot of current, and dim is also easier on your eyes than eight LEDs at full brightness six inches from your face.
</aside>

<figure id="fig-p2-3-neopixel-wired">
  <img src="{{ '/assets/img/pico/p2-3-neopixel-wired.jpg' | relative_url }}" alt="The breadboard with the potentiometer and an eight-pixel NeoPixel stick added above it, with black, white, red and green wires connecting the stick to the Pico and the rails">
  <figcaption>One way to wire the NeoPixel stick alongside the potentiometer. Check your own wires against the steps above, not just the photo.</figcaption>
</figure>

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
    samples = []
    for _ in range(8):
        samples.append(pot.read_u16())
    raw = sum(samples) // len(samples)
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

### The strip is a list, too

Look at the line `np[i] = ...` in your loop. That is the same square-bracket
index you used on `samples` in Project 2.2: `np` is a list-like collection of
8 elements, one color per pixel, and `i` is a position counting from 0. That
means `len(np)` works on it, and it gives 8. So instead of typing 8 a second
time, let the strip tell you how long it is:

```python
    for i in range(len(np)):
        np[i] = (0, 20, 0) if i < lit else (0, 0, 0)
```

Change `range(8)` to `range(len(np))` in your program and check that the bar
still works the same. Now if you ever swap in a longer strip, you change one
number, in the `NeoPixel(Pin(17), 8)` line, and everything else follows.

<aside class="callout note" markdown="1">
**PREDICT, THEN RUN**

Your strip has pixels `np[0]` through `np[7]`. What do you think happens if
your program tries to set `np[8]`? Write down your prediction first, then try
it by adding `np[8] = (0, 20, 0)` inside the loop. Compare what you saw to
the same mistake with `samples[8]` on your Project 2.2 worksheet.
</aside>

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

    for i in range(len(np)):
        np[i] = color if i < lit else (0, 0, 0)
```

Keep the brightness values small, the same reasoning as the warning above
still applies.
</aside>

### Going further

Once the challenge above works, here are ways to spread color across the
whole bar instead of switching it all at once.

**A palette**, a list of colors with one color for each pixel. First give
your colors short names, then build the list. Every brightness value stays at
20 or below:

```python
OFF = (0, 0, 0)
G = (0, 20, 0)
Y = (20, 12, 0)
R = (20, 0, 0)

palette = [G, G, G, Y, Y, R, R, R]
```

`palette[0]` is the color for the first pixel and `palette[7]` is the color
for the last. A list index here is a physical position on the strip, so
rearranging the list rearranges the colors you see. Your job is the line
inside the loop that puts each pixel's color on the strip:

```python
    for i in range(len(np)):
        if i < lit:
            np[i] = ...   # TODO: this pixel's color from palette
        else:
            np[i] = OFF
```

Once it works, design your own palette: your school colors, a rainbow, or a
flag. Keep every value at 20 or below, and keep it to 8 colors so there is
one for each pixel.

**Optional: a smooth fade**, where the entire bar shifts from green to red as
the voltage rises, instead of using a fixed list of colors:

```python
    f = volts / 3.3
    color = (int(20 * f), int(20 * (1 - f)), 0)
```

The palette and the fade both react to the same voltage, but ask yourself
what each color actually depends on. With the palette, a pixel's color comes
from its position, and only the *count* of lit pixels depends on voltage. With
the fade, the color changes because the voltage changed.

### Troubleshooting

If the strip does nothing: check that the data wire is in the DIN end, not
DOUT, that the NeoPixel's ground and the Pico's ground actually share a
connection, and that its power wire is in the 3V3 rail. If one pixel near the start
never lights while the rest work, that pixel itself may be dead, try
starting your strip from the next one over. If GP17 seems unresponsive
after editing `boot.py` or `main.py` in an earlier project, a soft reset
(Ctrl+D in the Shell) clears anything those files claimed on startup.

Once the bar reacts the way you expect, move on to
[Project 2.4](/pico/project2-4-animating-the-neopixel-bar/), where you
animate it with a list of frames. After that, [Project 2.5](/pico/project2-5-swapping-in-a-light-sensor/)
is an optional part where you'll trade the knob for a light sensor and this
exact code keeps working.
