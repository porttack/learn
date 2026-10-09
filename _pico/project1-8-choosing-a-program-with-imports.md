---
layout: lesson
title: "Project 1.8: Choosing a Program with Imports"
pathway: pico
order: 107
chapter: "p1.8"
project: 1
project_part: 8
label: "Project 1.8"
source: original
subtitle: "Import leds.py from a new file, and let your switches pick a program"
---

This is for after [Project 1.7](/pico/project1-7-reading-your-switches/) has you reading `sw1`, `sw2`, and `sw3`.

### Three ways to use `leds.py`

You've only ever used your own functions in the same file you wrote them in. Reaching into `leds.py` from a different file works exactly like reaching into `machine` does, except it's your own code this time. In fact, Project 1.7 already had you use two of the three ways to do it, without it being named yet: `import machine` and `from machine import Pin` are the same two patterns, just with a built-in module instead of your own file.

As a reminder, `leds.py` is the file [Project 1.4](/pico/project1-4-blinking-your-leds/) had you start, with `unarycount` and `binarycount`, and [Project 1.5](/pico/project1-5-fading-an-led-with-pwm/) added `breathe1` and `breatheall` to.

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

Checking more than two possibilities needs `elif` ("else if"), chaining as many conditions as you want between one `if` and a final `else`. MicroPython checks each one in order and runs the first match; `else` only runs if nothing above it did:

```python
if count == 1:
    print("one")
elif count == 2:
    print("two")
else:
    print("neither")
```

[Chapter 2](/pico/02-viperide-and-your-first-program/#variables-and-conditionals) covers this in more depth if you want it.

A few things to plan out before you start:

- `unarycount` and `binarycount` need plain `Pin` objects for the three LEDs; `breathe1` and `breatheall` need `PWM` objects instead. You can't make both kinds from the same GPIO pin at the same time, so only build the objects you actually need, inside whichever branch is about to use them.
- You've already got three ways to reach a function in `leds.py`. Pick whichever one of the three makes the most sense to you here.
- "None of them on" is exactly what `else` is for.

This one doesn't come back: whichever function runs will keep running forever, same as it does in `leds.py` on its own.
</aside>

### Run it without a computer attached

Right now your switch-picker only runs when you click Run in Thonny. [Chapter 9](/pico/09-data-logger/#running-headless) covers the same fix with ViperIDE instead, but the idea is identical: save your finished file as `main.py`, with **File > Save As**, choosing **Raspberry Pi Pico** just like any other save, and your Pico runs it automatically every time it's powered on, no computer needed.

Saving it as `main.py` alone won't make it jump into action immediately: while Thonny is still connected, your Pico stays sitting in the REPL. Click into the Shell and press Ctrl+D to force a soft reset, or just unplug your Pico and plug it back in.

Once it's running as `main.py`, this becomes a real stand-alone gadget: plug it into any USB power source, flip a switch, and it picks the program, no laptop required. You can always reconnect to Thonny later to edit it further; that just stops the automatic running until you save and reset again.

Once you can flip a switch and watch your Pico switch programs, even unplugged from your computer, you've got a working control panel: the start of being able to add more behavior later without ever touching `leds.py` again.

That's the end of Project 1. [Project 2](/pico/project2-1-moving-a-servo/) moves from digital I/O, always either on or off, to analog I/O: a servo that holds any position, not just two, then a potentiometer to steer it.
