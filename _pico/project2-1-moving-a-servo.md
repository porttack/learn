---
layout: lesson
title: "Project 2.1: Moving a Servo"
pathway: pico
order: 108
chapter: "p2.1"
project: 2
project_part: 1
project_name: "Servo and Potentiometer"
label: "Project 2.1"
source: original
subtitle: "PWM for position instead of brightness, and a reusable servo.py"
---

This is for after `leds.py` from Project 1 is working, signed off, and no longer needed for today. A servo is a new breadboard, a new component, and the first time PWM means something other than brightness.

<aside class="callout warning" markdown="1">
**SERVOS AND POWER**

A servo pulls a lot more current than an LED, especially the instant it starts moving. [Chapter 3](/pico/03-physical-computing/#your-picos-pins) already warned about *brownouts*: too much current draw sagging your whole circuit's voltage, sometimes enough to reset your Pico. Keep fingers clear of the servo horn while it's moving, and unplug before you rewire anything.
</aside>

### Wire the servo

A servo has three wires, not two: signal, power, and ground. Check yours against its documentation if the colors differ from what's below, servo wire colors aren't fully standardized.

1. Ground wire to your **spare ground rail** from Project 1.1, physical pin 18. You never needed it for the LED circuit; this is what it was wired and ready for.
2. Power wire to **VBUS**, physical pin 40, not 3V3. VBUS is the Pico's own 5V, the same 5V your USB cable supplies, and a servo wants more voltage and current than the 3V3 rail reliably provides.
3. Signal wire to GP16, physical pin 21.

<aside class="callout note" markdown="1">
**A NEW RED WIRE**

Red has meant 3V3 since Project 1.1. VBUS is a second, separate power rail, 5V instead of 3.3V. Keep using red for it anyway, the color still means "power," just from a different source this time. Worth saying out loud so nobody assumes this wire carries the same voltage as the others.
</aside>

### Set up PWM on the servo

```python
from machine import Pin, PWM

servo = PWM(Pin(16))
servo.freq(50)
```

Only 50 times a second, much slower than the LED's 1000. A servo doesn't care about flicker, it reads the *width* of each pulse, not how fast they repeat, and 50 Hz (a 20-millisecond period) is the standard RC servo rate.

### Duty cycle means angle now, not brightness

`duty_u16()` still sets a fraction of each cycle, the same function from Project 1.5, but a servo reads that timing completely differently: the width of the *on* pulse tells the motor what angle to turn to, not how bright to glow. Try these three in the REPL, one at a time, and watch the servo's position change instead of its brightness:

```python
servo.duty_u16(3277)
```

```python
servo.duty_u16(4915)
```

```python
servo.duty_u16(6554)
```

These are roughly 0°, 90°, and 180°, a 1, 1.5, and 2 millisecond pulse out of the 20-millisecond cycle. "Roughly" is doing real work in that sentence: exact endpoints vary by servo model, so don't worry if yours stalls or buzzes right at the extreme ends. Pull back toward center if it does.

### Turning any angle into a duty cycle

<aside class="callout challenge" markdown="1">
**CHALLENGE: setangle**

Save this as `servo.py`, with a function `setangle(servo, angle)` that moves a servo to any angle from 0 to 180, not just the three you just tried by hand.

```python
from machine import Pin, PWM

def setangle(servo, angle):
    # TODO: turn angle (0-180) into the right duty_u16 value, then set it
    pass
```

You already have three known points: 0° is 3277, 90° is 4915, 180° is 6554. The angle you're given will usually fall between them, not land exactly on one. Figure out how to scale it: the same kind of range-to-range thinking as converting a number into binary in Project 1.4, just with these three reference numbers instead of place values.

Test it by adding these lines below your function, then saving and running the whole file:

```python
myservo = PWM(Pin(16))
myservo.freq(50)
setangle(myservo, 45)
```

Try a few different angles between 0 and 180 once that one works.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: SWEEP**

Add a second function to the same `servo.py` file, `sweep(servo)`, moving the servo from 0 to 180 and back, over and over, forever, using `setangle` to actually move it. This is the same up-then-down loop shape as Project 1.5's `breathe1`, just driving an angle instead of a brightness.
</aside>

Once your servo sweeps back and forth on its own, move on to [Project 2.2](/pico/project2-2-reading-a-potentiometer/), where a potentiometer takes over from the automatic sweep.
