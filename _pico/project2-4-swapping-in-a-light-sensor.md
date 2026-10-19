---
layout: lesson
title: "Project 2.4: Swapping in a Light Sensor"
pathway: pico
order: 111
chapter: "p2.4"
standards_carrier: picoprojects
project: 2
project_part: 4
label: "Project 2.4"
source: original
subtitle: "The same code, a different kind of knob"
---

This part is optional. If you have a light-dependent resistor (LDR) and a
10k resistor handy, it's worth the ten minutes, no new code skills are
needed, just a new component wired into the same two pins.

### Swap the parts

Unplug the potentiometer. In its place, wire an LDR from 3V3 to GP26, and a
fixed resistor (10k works well) from GP26 to ground, the same wiper
position the potentiometer used.

Run the exact same program from Project 2.3, completely unchanged.

### Why didn't the code need to change?

Because the Pico never knew it was reading a potentiometer in the first
place. GP26 only ever reports a voltage. A knob and a light sensor are
just two different ways of turning something, a hand, or light, into a
changing resistance, and a changing resistance in a voltage divider
becomes a changing voltage. Anything that does that will work with this
exact code: a different sensor, not different software.

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
sensor, a passive buzzer whose pitch follows the sensor instead of the
NeoPixel bar, a version that holds the highest reading briefly in a
different color before it fades, a button that switches between a few
different display modes, and a thermistor, which uses this exact same
divider code to measure temperature instead of light or position.

That's the real trick behind every analog sensor you'll meet from here on.
The Pico only ever reads a voltage. Everything else is wiring.
