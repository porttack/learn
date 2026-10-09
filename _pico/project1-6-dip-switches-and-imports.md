---
layout: lesson
title: "Project 1.6: Choosing a Program with DIP Switches (Day 5)"
pathway: pico
order: 105
chapter: "p1.6"
project: 1
project_part: 6
label: "Project 1.6"
source: original
subtitle: "Wire a switch bank, then let it pick which saved function runs"
---

This is for after [Project 1.5](/pico/project1-5-fading-an-led-with-pwm/) has you comfortable with `leds.py`, the file with `unarycount`, `binarycount`, `breathe1`, and `breatheall` saved on your Pico. Today you'll wire a way to pick one of those four without editing any code, then write the small program that does the picking.

### Wire the switches

A DIP switch is a strip of tiny on/off switches in one package, straddling the center gap just like a chip: each switch has one leg on the left side of the gap, one leg on the right, and flipping it toward the side marked **ON** connects those two legs together. You only need three of them.

<figure id="fig-dip-switches-exemplar">
  <img src="{{ '/assets/img/pico/dip-switches-exemplar.jpg' | relative_url }}" alt="A Pico 2 W breadboard circuit with three red LEDs wired to GP13, GP14, and GP15, and an 8-position DIP switch added above them straddling the center gap. Three of its switches have a green wire running to the main ground rail and a white wire running to the Pico's GP10, GP11, and GP12 pins.">
  <figcaption>Exemplar: three LEDs, plus three switches wired and ready</figcaption>
</figure>

For each of the three switches you're using:

1. Run a green wire from one leg to your main ground rail, the same rail from Project 1.1.
2. Run a white wire from the other leg to a GPIO pin: physical pins 14, 15, and 16, which are GP10, GP11, and GP12.

<aside class="callout note" markdown="1">
**WHITE FOR INPUT NOW TOO**

Project 1.1 just said "white for signal," because every signal wire so far was an output, something your Pico controls. A switch is different: it's an input, something your Pico reads. White still works fine for it; the color marks "GPIO signal," not a particular direction. Your existing LED wires don't need to change.
</aside>

<aside class="callout note" markdown="1">
**IF A SWITCH SEEMS TO DO NOTHING**

Some full-size breadboards split each power rail into two halves around the middle, with no connection between them. If your switches are wired near the gap and your Pico is wired further down, a short jumper bridging the two halves of the ground rail may be missing. Check for a break with a multimeter, or just run a wire from one half of the rail to the other.
</aside>

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

Once you can flip a switch and watch your Pico switch programs, you've got a working control panel: the start of being able to add more behavior later without ever touching `leds.py` again.
