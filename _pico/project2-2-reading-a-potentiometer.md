---
layout: lesson
title: "Project 2.2: Reading a Potentiometer"
pathway: pico
order: 109
chapter: "p2.2"
project: 2
project_part: 2
label: "Project 2.2"
source: original
subtitle: "An analog input, mapped straight onto your servo"
---

This is for after [Project 2.1](/pico/project2-1-moving-a-servo/) has `servo.py` saved and working, with `setangle` and `sweep` both in it.

### Wire the potentiometer

Wire your potentiometer exactly as [Chapter 8's voltage-divider section](/pico/08-temperature-gauge/#a-potentiometer-as-a-voltage-divider) describes: the middle pin to GP26, and both outer pins across your power and ground rails so it reads the full range. Your servo's spare ground rail from Project 1.1 already has a GND connection on it; the potentiometer's ground leg can share it.

### Read it

```python
from machine import ADC

pot = ADC(26)
```

Try `pot.read_u16()` in the Shell a few times, turning the knob between tries. [Chapter 8](/pico/08-temperature-gauge/#the-analogue-to-digital-converter) covers why the range is 0 to 65,535, the same as `duty_u16()`, but this number means something different: how far the knob is turned, not a pulse width.

### From one range into another

<aside class="callout challenge" markdown="1">
**CHALLENGE: FOLLOW THE KNOB**

Write a new file that reads the potentiometer forever, converts each reading into an angle from 0 to 180, and calls `setangle` to move the servo there. Turn the knob, the servo follows, continuously, with no typing after you click Run.

A few things to plan out before you start:

- `pot.read_u16()` gives you 0 to 65,535; `setangle` wants 0 to 180. You're mapping one range onto another, the same idea as Project 2.1's `setangle`, just backward: a huge range of possible readings has to become a small range of angles instead of the other way around.
- You'll need both `servo.py` and `machine` in this file. You've got three ways to reach a function in another file since Project 1.8; any of them works here.
- Build the servo's `PWM` object and set its frequency once, the same way Project 2.1 did, before the loop starts.
</aside>

Once turning the knob moves the servo smoothly across its whole range, you've built a real analog control: a continuous input driving a continuous output, nothing in between but your own code.
