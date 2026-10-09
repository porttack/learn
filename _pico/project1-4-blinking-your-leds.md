---
layout: lesson
title: "Project 1.4: Blinking Your LEDs"
pathway: pico
order: 103
chapter: "p1.4"
project: 1
project_part: 4
label: "Project 1.4"
source: original
subtitle: "Write your first programs for the circuit you built, then make your three LEDs count, first in unary, then in binary"
organizer: /pico/project1-4-5-checklist/
organizer_label: "Checklist (covers 1.4 & 1.5)"
slides: /pico/project1-4-5-intro-slides/
slides_label: "Slides (covers 1.4 & 1.5)"
---

This is for after your three-LED circuit from [Project 1.1](/pico/project1-1-wiring-three-leds/) is signed off, [Project 1.2](/pico/project1-2-flashing-with-thonny/) has MicroPython running on your Pico, and [Project 1.3](/pico/project1-3-files-and-the-repl/) has you comfortable saving a file to your Pico and typing commands straight into the REPL. If you finish early and your teacher is ready for you to move on, this is what comes next.

<aside class="callout warning" markdown="1">
**ONLY AFTER SIGN-OFF**

Do not connect your Pico to USB until a teacher has checked your circuit against the exemplar. Plugging in before then is exactly the mistake Project 1.1 warned about.
</aside>

### Blink the onboard LED

In Project 1.3 you turned the onboard LED on and off by typing commands straight into the REPL, one at a time. Now you'll write those same commands into a script that does the on-off-on-off switching for you, automatically, forever.

Not sure where the onboard LED is? [Chapter 4's photo](/pico/04-physical-computing-with-pico/#fig-4-1) shows exactly where to look: it's the small component to the left of the micro USB port.

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

Check your Project 1.1 Notes page for the GPIO pin number you recorded for one of your LEDs, then edit your program so the `Pin` line uses that number instead of `"LED"`:

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

### Counting in unary

Three LEDs can do more than blink one at a time: together, they can count. The simplest way to show a number with lights is to light that many of them: one LED on means one, two on means two, three on means three. This is called *unary*, the same idea as tally marks or holding up fingers: the count is the number, nothing more compact about it.

<aside class="callout challenge" markdown="1">
**CHALLENGE: COUNT IN UNARY**

Save this as `leds.py` on your Pico. The filename and the function name both matter here: later projects will `import leds` and reuse it as-is, not just read it for ideas.

```python
import machine
import time

def unarycount(leds, delay=1):
    n = 0
    while True:
        # TODO: turn on the first n LEDs in leds, make sure the rest are off
        # TODO: wait `delay` seconds, then move to the next count, wrapping
        # back to 0 once it passes how many LEDs you have
        pass
```

`leds` is a list of your three `Pin` objects. Unary doesn't care which LED means what, only how many are lit, so any order is fine as long as you're consistent. `delay` is how long each count stays lit before the next one, in seconds.

Test it by adding these lines below your function, then saving and running the whole file:

```python
led1 = machine.Pin(13, machine.Pin.OUT)
led2 = machine.Pin(14, machine.Pin.OUT)
led3 = machine.Pin(15, machine.Pin.OUT)

unarycount([led1, led2, led3])
```
</aside>

### Counting in binary

Unary tops out fast: three LEDs can only ever show 0 through 3, one count per LED. Binary squeezes more out of the same three LEDs by giving each one a place value instead, the same idea as the place values in [Secret Messages in Binary](/unplugged/ascii-messages-binary/) if you've done that worksheet: 4, 2, and 1. Any number from 0 to 7 is just some combination of those three, each one either on or off.

<table>
  <thead>
    <tr><th>Number</th><th>4s place</th><th>2s place</th><th>1s place</th></tr>
  </thead>
  <tbody>
    <tr><td>0</td><td>off</td><td>off</td><td>off</td></tr>
    <tr><td>1</td><td>off</td><td>off</td><td>on</td></tr>
    <tr><td>2</td><td>off</td><td>on</td><td>off</td></tr>
    <tr><td>3</td><td>off</td><td>on</td><td>on</td></tr>
    <tr><td>4</td><td>on</td><td>off</td><td>off</td></tr>
    <tr><td>5</td><td>on</td><td>off</td><td>on</td></tr>
    <tr><td>6</td><td>on</td><td>on</td><td>off</td></tr>
    <tr><td>7</td><td>on</td><td>on</td><td>on</td></tr>
  </tbody>
</table>

It doesn't matter which of your three LEDs you pick for each place value, as long as you keep track of which pin is which. Check your Project 1.1 Notes page for your pin numbers.

<aside class="callout challenge" markdown="1">
**CHALLENGE: COUNT IN BINARY**

Add a second function to the same `leds.py` file: `binarycount(leds, delay=1)`.

```python
def binarycount(leds, delay=1):
    n = 0
    while True:
        # TODO: for each LED in leds, figure out whether it should be on or
        # off for the number n, using % and //
        # TODO: wait `delay` seconds, then move to the next number, wrapping
        # back to 0 after 7
        pass
```

Pass `leds` in place-value order this time: whichever of your three `Pin` objects you want as the 4s place first, then the 2s place, then the 1s place. `delay` works the same as it does for `unarycount`.

Fill in the two TODOs. You already know everything you need for the loop itself; the real problem is figuring out, for any given number, which of your three LEDs should be on. Do not write out all 8 patterns by hand. Two operators will do the actual work of converting the number for you:

- `%` (modulo) gives you the remainder after dividing by something.
- `//` (floor division) divides by something and throws away the remainder, keeping only the whole number part.

Used together, on the same number, over and over, they can peel off one binary digit at a time. Figure out how.

Test it using the same `led1`, `led2`, `led3` from testing `unarycount`, just call the new function instead:

```python
binarycount([led1, led2, led3])
```

Try a `delay` of `0.25` instead of the default once it's working: `binarycount([led1, led2, led3], delay=0.25)`.
</aside>

Once you're comfortable blinking and counting, move on to [Project 1.5](/pico/project1-5-fading-an-led-with-pwm/), where your LEDs stop being just on or off.
