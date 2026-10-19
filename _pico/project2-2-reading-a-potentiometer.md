---
layout: lesson
title: "Project 2.2: Potentiometer, Voltage Dividers, and a NeoPixel Bar"
pathway: pico
order: 109
chapter: "p2.2"
standards_carrier: picoprojects
project: 2
project_part: 2
label: "Project 2.2"
source: original
subtitle: "What a knob, and later a light sensor, is actually telling the Pico"
---

This project adds a new component, a strip of NeoPixels, individually
colored LEDs you control one at a time from code, and asks a question the
last project skipped over: when you read a potentiometer, what is the Pico
actually measuring? By the end, you'll swap the potentiometer for a light
sensor and the same code will keep working, once you know the answer.

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

### Wire the potentiometer

Wire it the same way Project 2.1 wired the servo's power, except this time
the middle pin (the wiper) goes to GP26, and the two outer pins go across
your power and ground rails so it reads across the full range.

<aside class="callout note" markdown="1">
**ONLY GP26, 27, AND 28 READ VOLTAGE**

Every other pin on the Pico is purely digital, on or off, nothing in
between. If you wire the wiper to a pin like GP9 expecting it to work the
same way, it won't. Keep the potentiometer, and later the joystick in the
next project, wired to one of these three pins.
</aside>

Never power the potentiometer from VBUS or VSYS. Those are 5V, and the
Pico's ADC can only read up to 3.3V, so a reading above that just clips at
the maximum and stops responding to the knob. It's an easy mistake to
repeat with the joystick in the next project, which is wired the exact
same way.

A 1k and a 10k potentiometer read identically here. The ADC measures a
ratio of voltages, not a specific resistance, so the exact value doesn't
matter as long as both outer legs are connected.

### Read the knob into a number

```python
from machine import Pin, ADC
from neopixel import NeoPixel
import time

np = NeoPixel(Pin(17), 8)   # 8 pixels, data on GP17
pot = ADC(Pin(26))          # only GP26, 27, 28 can read analog voltages

while True:
    # Read the pot 8 times and average them. A single reading jitters a
    # little, which makes the bar flicker between two pixel counts.
    raw = sum(pot.read_u16() for _ in range(8)) // 8

    # read_u16() gives 0 to 65535, where 65535 means the full 3.3V.
    volts = raw / 65535 * 3.3

    lit = round(volts / 3.3 * 8)   # how many of the 8 pixels to turn on

    for i in range(8):
        np[i] = (0, 20, 0) if i < lit else (0, 0, 0)   # (red, green, blue)
    np.write()   # nothing on the stick actually changes until this runs

    print("Volts:", round(volts, 2), "Pixels:", lit)
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

Run it, then open Thonny's **View > Plotter**. Turn the knob and watch
both the pixel bar and the live plot respond. The text before each number
in `print()` becomes that line's label on the plot, so keep plotted values
on similar scales, volts (0 to 3.3) and pixel count (0 to 8) share a plot
reasonably, but don't add the raw 0-to-65535 reading alongside them, it
would flatten the other two lines to nothing.

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

### Swap in a light sensor

Unplug the potentiometer. In its place, wire a light-dependent resistor
(LDR) from 3V3 to GP26, and a fixed resistor (10k works well) from GP26 to
ground, the same wiper position the potentiometer used.

Run the exact same program you already have, completely unchanged.

Why didn't the code need to change at all? Because the Pico never knew it
was reading a potentiometer in the first place. GP26 only ever reports a
voltage. A knob and a light sensor are just two different ways of turning
something (a hand, or light) into a changing resistance, and a changing
resistance in a voltage divider becomes a changing voltage. Anything that
does that will work with this exact code: a different sensor, not
different software.

### Calculate the LDR's resistance

With the LDR wired from 3V3 to GP26 and the fixed resistor from GP26 to
ground, the LDR's resistance is:

```
R_LDR = R_FIXED * (3.3 - V) / V
```

Work this out by hand first from a voltage Thonny prints, then check it in
code:

```python
R_FIXED = 10000   # change this to match your actual fixed resistor

    if volts > 0:   # avoid dividing by zero on a 0V reading
        r_ldr = R_FIXED * (3.3 - volts) / volts
        print("Volts:", round(volts, 2), "LDR ohms:", int(r_ldr))
```

Finally, verify it for real: cover the LDR with your hand, then uncover
it, and measure its resistance directly with a multimeter under the same
lighting your code just calculated for. They won't match exactly. Discuss
with a neighbor why not, measurement error, the multimeter's own
tolerance, and light that changed slightly between the two readings are
all real possibilities worth naming rather than ignoring.

### Where this could go

None of these are built yet, just ideas worth knowing about if you finish
everything above with time to spare: a reaction-time game where a random
pixel lights up red and you race to match it with the knob or the light
sensor, a passive buzzer whose pitch follows the knob instead of the
NeoPixel bar, a version that holds the highest reading briefly in a
different color before it fades, a button that switches between a few
different display modes, and a thermistor, which uses this exact same
divider code to measure temperature instead of light or position.

### Troubleshooting

If the strip does nothing: check that the data wire is in the DIN end, not
DOUT, that the NeoPixel's ground and the Pico's ground actually share a
connection, and that you're powering it from VSYS, not a 3V3 pin that's
also expected to drive a weak data signal. If one pixel near the start
never lights while the rest work, that pixel itself may be dead, try
starting your strip from the next one over. If GP17 seems unresponsive
after editing `boot.py` or `main.py` in an earlier project, a soft reset
(Ctrl+D in the Shell) clears anything those files claimed on startup.

That's the real trick behind every analog sensor you'll meet from here on.
The Pico only ever reads a voltage. Everything else is wiring.
