---
layout: lesson
title: "Project 1.7: Reading Your Switches"
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

A loop that prints every single time around, with no condition, would flood your Shell with thousands of identical lines a second. Printing only when something's actually different means remembering what you printed last, which means a variable for each switch's last known reading, started before the loop begins and updated every time you do print.

Save this as `watchswitches.py` and run it:

```python
from machine import Pin
from time import sleep

sw1 = Pin(10, Pin.IN, Pin.PULL_UP)
sw2 = Pin(11, Pin.IN, Pin.PULL_UP)
sw3 = Pin(12, Pin.IN, Pin.PULL_UP)

last1 = None
last2 = None
last3 = None

while True:
    v1 = sw1.value()
    v2 = sw2.value()
    v3 = sw3.value()

    if v1 != last1 or v2 != last2 or v3 != last3:
        print(v1, v2, v3)

        if v1 == 0:
            word1 = "ON"
        else:
            word1 = "OFF"
        if v2 == 0:
            word2 = "ON"
        else:
            word2 = "OFF"
        if v3 == 0:
            word3 = "ON"
        else:
            word3 = "OFF"
        print(word1, word2, word3)

        last1 = v1
        last2 = v2
        last3 = v3

    sleep(0.05)
```

Flip switches one at a time and watch both lines print together, like `1 1 0` followed right below by `OFF OFF ON`. Line up the two rows and the inversion from the note above stops being something you take on faith: a `1` really does print as `OFF`, a `0` really does print as `ON`, every single time. Stop touching the switches and the Shell goes quiet, no matter how long the loop keeps running underneath.

Once your Shell stays quiet until you actually flip something, move on to [Project 1.8](/pico/project1-8-choosing-a-program-with-imports/), where you'll use these same three switches to choose which program runs.
