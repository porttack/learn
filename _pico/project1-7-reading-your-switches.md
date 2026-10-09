---
layout: lesson
title: "Project 1.7: Reading Your Switches (Day 6)"
pathway: pico
order: 106
chapter: "p1.7"
project: 1
project_part: 7
label: "Project 1.7"
source: original
subtitle: "Read your switches, and only print when one of them changes"
---

This is for after your switch wiring from [Project 1.6](/pico/project1-6-wiring-a-switch-bank/) is signed off.

### Read a switch

A switch wired this way works exactly like the push-button in [Chapter 4](/pico/04-physical-computing-with-pico/#inputs-reading-a-button): closed, it connects your GPIO pin straight to ground; open, it doesn't connect to anything, so you need a pull-up to give it a known value.

<figure id="fig-switch-pullup-circuit">
  <img src="{{ '/assets/img/pico/switch-pullup-circuit.svg' | relative_url }}" alt="Schematic of one switch wired to a GPIO pin with its internal pull-up enabled. 3V3 connects through an internal pull-up resistor, drawn in a dashed box to show it is set in software rather than a part you wire, down to a node shared by the GPIO pin and one side of the switch. The switch's other side goes to GND. Open, the node stays pulled up to 3V3 and sw1.value() reads 1. Closed, shown in a row below, the switch shorts the node straight to GND and sw1.value() reads 0.">
  <figcaption>What your switch is actually connected to, electrically</figcaption>
</figure>

```python
from machine import Pin

sw1 = Pin(10, Pin.IN, Pin.PULL_UP)
sw2 = Pin(11, Pin.IN, Pin.PULL_UP)
sw3 = Pin(12, Pin.IN, Pin.PULL_UP)
```

This is `from machine import Pin` rather than the `import machine` you've used up to now, so it's `Pin(...)` instead of `machine.Pin(...)`. Same thing either way, just a shorter name for it; [Project 1.8](/pico/project1-8-choosing-a-program-with-imports/) covers why there's more than one way to do this.

Try `sw1.value()` in the Shell, flipping that switch between tries. Off (away from the **ON** label), you'll get `1`: the pull-up is holding the pin high since nothing else is connected to it. On, the switch connects the pin straight to ground, and you'll get `0`.

<aside class="callout note" markdown="1">
**ON READS 0**

It feels backward the first time: flipping a switch to ON makes it read the lower number. That's the pull-up at work, same as the button in Chapter 4. Worth saying out loud once so it's not a surprise later.
</aside>

### Print only when something changes

<aside class="callout challenge" markdown="1">
**CHALLENGE: WATCH YOUR SWITCHES**

Write a program that loops forever, checking all three switches, and prints a line reporting all three as `ON` or `OFF` whenever any of them changes. Flip a switch, see one new line. Don't touch anything, see nothing print, forever, no matter how long the loop keeps running.

A few things to plan out before you start:

- A loop that prints every single time around, with no condition, will flood the Shell with thousands of identical lines a second. You need to remember what you printed last, and only print again when something's actually different.
- That means storing each switch's last known reading in its own variable, started before the loop begins, and updating it every time you do print.
- `!=` tests "is not equal to." You'll want it once per switch, or some way to check all three at once.
- `sw1.value()` gives you `0` or `1`. Printing those numbers directly works, but translating them into the words `ON` and `OFF` first reads a lot better.
</aside>

Once your Shell stays quiet until you actually flip something, move on to [Project 1.8](/pico/project1-8-choosing-a-program-with-imports/), where you'll use these same three switches to choose which program runs.
