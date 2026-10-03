---
layout: lesson
title: "Project 1.3: Blinking Your LEDs (Day 2)"
pathway: pico
order: 102
project: 1
project_part: 3
label: "Project 1.3"
source: original
subtitle: "Write your first programs for the circuit you built"
---

This is for after your three-LED circuit from [Project 1.1](/pico/project1-1-wiring-three-leds/) is signed off, and after [Project 1.2](/pico/project1-2-flashing-with-thonny/) has MicroPython running on your Pico and Thonny connected to it. If you finish early and your teacher is ready for you to move on, this is what comes next.

<aside class="callout warning" markdown="1">
**ONLY AFTER SIGN-OFF**

Do not connect your Pico to USB until a teacher has checked your circuit against the exemplar. Plugging in before then is exactly the mistake Project 1.1 warned about.
</aside>

### Blink the onboard LED

Not sure where that is? [Chapter 4's photo](/pico/04-physical-computing-with-pico/#fig-4-1) shows exactly where to look: it's the small component to the left of the micro USB port.

Click in Thonny's script area and type the following:

```python
import machine
import time

led_onboard = machine.Pin("LED", machine.Pin.OUT)

while True:
    led_onboard.toggle()
    time.sleep(1)
```

Save it to your Pico, then click Run. Your Pico's own onboard LED, the small one near the USB connector, should blink once every second.

<aside class="callout note" markdown="1">
**IF THE ONBOARD LED DOESN'T BLINK**

On a Pico 2 W, the onboard LED is wired through the wireless chip rather than a plain GPIO pin, and `machine.Pin("LED", ...)` is what MicroPython uses to reach it either way. If it doesn't light up, don't assume your code is wrong, ask your teacher: this has been a moving target across MicroPython firmware versions for this specific board, and may need a firmware update rather than a code fix. Either way, skip ahead to the next section and test on one of your wired LEDs instead; that part doesn't depend on this.
</aside>

If anything here looks unfamiliar, [Chapter 4](/pico/04-physical-computing-with-pico/) covers the same `machine.Pin` and `time.sleep` ideas in more detail, using ViperIDE instead of Thonny. The code itself works the same either way.

### Blink one of your own LEDs

Controlling an LED you wired yourself takes exactly one change: swap the pin.

Check your Project 1.1 graphic organizer for the GPIO pin number you recorded for one of your LEDs, then edit your program so the `Pin` line uses that number instead of `"LED"`:

```python
import machine
import time

led_one = machine.Pin(13, machine.Pin.OUT)

while True:
    led_one.toggle()
    time.sleep(1)
```

Use whichever pin number you actually wired, 13, 14, or 15, not necessarily 13. Save and run it. If it doesn't light up, double check that pin number against what you wrote down, and that the LED is wired the way Project 1.1 described.

Every time `.toggle()` runs, it's opening and closing a valve on that GPIO pin, exactly like the valve in [The Water Analogy](/pico/water-analogy/): open, and the 3.3V side connects through your LED and resistor to ground; closed, and nothing flows.

<aside class="callout challenge" markdown="1">
**CHALLENGE: ALL THREE, IN A ROW**

Can you light all three LEDs one at a time, in order, each one on for a second before the next one takes over? You'll need a `Pin` object for each LED. Think about what has to happen, in what order, inside your loop.
</aside>
