---
layout: lesson
title: "Project 1.5: Fading an LED with PWM (Day 4)"
pathway: pico
order: 104
chapter: "p1.5"
project: 1
project_part: 5
label: "Project 1.5"
source: original
subtitle: "Make an LED fade smoothly, not just switch on and off"
---

This is for after [Project 1.4](/pico/project1-4-blinking-your-leds/) has you comfortable writing a script with a `while True` loop. Your Pico should already be connected and showing MicroPython, same as the last few days.

### On, off, or something in between?

Every LED you've controlled so far has only ever been fully on or fully off, `.value(1)` or `.value(0)`. A GPIO pin genuinely can't do anything in between: it's digital, so it only ever outputs one of two voltages.

*Pulse-width modulation*, or **PWM**, fakes something in between anyway. Instead of holding a pin steady on or off, PWM switches it on and off very fast, hundreds or thousands of times a second, and varies how much of each cycle it spends on versus off. Switched fast enough, your eye can't follow the flicker: an LED that's on 75% of the time and off 25% of the time just looks dimmer than one left on the whole time, not like it's blinking.

If you've used [The Water Analogy](/pico/water-analogy/) page, this is the same valve, just snapping open and shut faster than you could ever flip it by hand: averaged over time, a valve that's open three-quarters of the time passes three-quarters as much water as one left fully open.

### Set up PWM on one of your LEDs

Check your Project 1.1 Notes page for one of your wired LEDs' pin numbers, then create a PWM object for it instead of a plain `Pin`:

```python
import machine
import time

led = machine.PWM(machine.Pin(13))
led.freq(1000)
```

Use whichever pin number you actually wired. `machine.PWM(...)` wraps the `Pin` so it can be switched on and off far faster than any loop you could write yourself. `freq(1000)` sets it to switch 1000 times a second, fast enough that you'll never see it flicker.

### Duty cycle: how much of each cycle is "on"

The fraction of each cycle spent on is the **duty cycle**. `duty_u16()` sets it, as a number from 0 (always off) to 65535 (always on), the largest number that fits in 16 bits:

```python
led.duty_u16(0)
```

```python
led.duty_u16(32768)
```

```python
led.duty_u16(65535)
```

Try each of these one at a time in the REPL and watch the LED's brightness change: off, about half brightness, then fully on.

### Make it breathe

You've just set the duty cycle by hand, three times, in the REPL. A real "breathing" effect means changing it automatically and continuously: brighter, brighter, brighter, then dimmer, dimmer, dimmer, forever, with no typing after you click Run.

<aside class="callout challenge" markdown="1">
**CHALLENGE: MAKE IT BREATHE**

Write a script that fades your LED continuously: ramping the duty cycle up to full brightness, then back down to off, over and over, forever. You already know every piece you need: a loop that never ends, `duty_u16()`, and `time.sleep()`.

A couple of things worth knowing before you start:

- `range()` can count by more than 1 at a time: `range(0, 10, 2)` counts 0, 2, 4, 6, 8. You don't need to visit all 65,536 possible duty cycle values one at a time; your eye can't tell most of them apart anyway.
- `range()` can also count downward, if you give it a negative step, instead of only ever counting up.

Figure out how to combine these into a loop that rises, then falls, then repeats.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: TWO LEDS, OUT OF SYNC**

Once your first LED is breathing, can you fade two of your LEDs at once, each with its own `PWM` object, so one is brightening while the other is dimming? [Chapter 8](/pico/08-temperature-gauge/#fading-an-led-with-pwm) covers PWM in more depth, including how to avoid two pins fighting over the same PWM hardware.
</aside>
