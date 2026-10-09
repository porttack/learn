---
layout: lesson
title: "Project 1.7: Choosing a Program with Imports (Day 6)"
pathway: pico
order: 106
chapter: "p1.7"
project: 1
project_part: 7
label: "Project 1.7"
source: original
subtitle: "Read your switches, then import leds.py to let them pick a program"
---

This is for after your switch wiring from [Project 1.6](/pico/project1-6-wiring-a-switch-bank/) is signed off.

### Read a switch

A switch wired this way works exactly like the push-button in [Chapter 4](/pico/04-physical-computing-with-pico/#inputs-reading-a-button): closed, it connects your GPIO pin straight to ground; open, it doesn't connect to anything, so you need a pull-up to give it a known value.

```python
import machine

sw1 = machine.Pin(10, machine.Pin.IN, machine.Pin.PULL_UP)
sw2 = machine.Pin(11, machine.Pin.IN, machine.Pin.PULL_UP)
sw3 = machine.Pin(12, machine.Pin.IN, machine.Pin.PULL_UP)
```

Try `sw1.value()` in the REPL, flipping that switch between tries. Off (away from the **ON** label), you'll get `1`: the pull-up is holding the pin high since nothing else is connected to it. On, the switch connects the pin straight to ground, and you'll get `0`.

<aside class="callout note" markdown="1">
**ON READS 0**

It feels backward the first time: flipping a switch to ON makes it read the lower number. That's the pull-up at work, same as the button in Chapter 4. Worth saying out loud once so it's not a surprise later.
</aside>

### Three ways to use `leds.py`

You've only ever used your own functions in the same file you wrote them in. Reaching into `leds.py` from a different file works like reaching into `machine` or `time`, except it's your own code this time. There are three ways to do it:

```python
import leds

leds.unarycount([led1, led2, led3])
```

`import leds` gives you the whole file as one name. Every function inside it is reached through `leds.`, the same way `machine.Pin(...)` reaches `Pin` through `machine`.

```python
from leds import binarycount

binarycount([led1, led2, led3])
```

`from leds import binarycount` pulls just that one name out, so you call it directly, no `leds.` in front. Handy when you only need one function and don't want to type the file name every time.

```python
from leds import *

breathe1(led)
```

`from leds import *` pulls in everything `leds.py` defines at once. It saves typing, but it's worth knowing why experienced programmers mostly avoid it: reading the code later, there's no way to tell at a glance which file `breathe1` actually came from, and two files with a function of the same name would silently collide.

### Make the switches choose

<aside class="callout challenge" markdown="1">
**CHALLENGE: PICK A PROGRAM**

Write a new file, separate from `leds.py`, that reads all three switches and runs a different function depending on which one is on:

- `sw1` on: `unarycount`
- `sw2` on: `binarycount`
- `sw3` on: `breathe1`
- none of them on: `breatheall`

A few things to plan out before you start:

- `unarycount` and `binarycount` need plain `Pin` objects for the three LEDs; `breathe1` and `breatheall` need `PWM` objects instead. You can't make both kinds from the same GPIO pin at the same time, so only build the objects you actually need, inside whichever branch is about to use them.
- You've already got three ways to reach a function in `leds.py`. Pick whichever one of the three makes the most sense to you here.
- Checking "none of them on" is the same idea as checking each switch, just with the condition flipped.

This one doesn't come back: whichever function runs will keep running forever, same as it does in `leds.py` on its own.
</aside>

### Run it without a computer attached

Right now your switch-picker only runs when you click Run in ViperIDE. [Chapter 9](/pico/09-data-logger/#running-headless) covers the fix: save your finished file as `main.py`, and your Pico runs it automatically every time it's powered on, no computer needed.

Saving it as `main.py` alone won't make it jump into action immediately: while ViperIDE is still connected, your Pico stays sitting in the REPL. Press CTRL+D in the Terminal to force a soft reset, the same trick Chapter 9 uses, or just unplug and plug your Pico back in.

Once it's running as `main.py`, this becomes a real stand-alone gadget: plug it into any USB power source, flip a switch, and it picks the program, no laptop required. You can always reconnect to ViperIDE later to edit it further; that just stops the automatic running until you save and reset again.

Once you can flip a switch and watch your Pico switch programs, even unplugged from your computer, you've got a working control panel: the start of being able to add more behavior later without ever touching `leds.py` again.
