---
layout: lesson
title: "Project 1.4 & 1.5 Checklist"
pathway: pico
order: 104.1
label: "Project 1.4 & 1.5 Companion"
source: original
companion: true
---

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Period: <span class="fill-line short"></span>
  Date: <span class="fill-line short"></span>
</p>

Check off each box as you finish that step. The back is a quick reference for the syntax, not the challenges themselves, you still have to figure those out.

## Project 1.4: Blinking and Counting

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Step</th><th>&#10003;</th></tr>
  </thead>
  <tbody>
    <tr><td>Onboard LED blinks, from a saved script</td><td class="checkbox-cell"></td></tr>
    <tr><td>One of my own wired LEDs blinks (pin used: <span class="fill-line short"></span>)</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> leds.py saved with a working unarycount(leds, delay) function</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> binarycount(leds, delay) added to leds.py</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

## Project 1.5: Fading with PWM

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Step</th><th>&#10003;</th></tr>
  </thead>
  <tbody>
    <tr><td>Tried duty_u16() at 0, 32768, and 65535 in the REPL</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> breathe1(led) added to leds.py</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> breatheall(leds) added to leds.py</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

<div class="print-page-break"></div>

## Quick reference

Syntax only. The challenges above are still yours to work out: this page won't do the converting or the looping for you.

### Project 1.4

- Making an output pin: `machine.Pin(13, machine.Pin.OUT)`
- Unary: light as many LEDs as the count, no place value.
- Place values for 3 LEDs in binary: 4, 2, 1. Any number 0-7 is some combination of those three, on or off.
- `%` (modulo) gives the remainder after dividing by something.
- `//` (floor division) divides by something and throws away the remainder.
- Save both challenges in one file, `leds.py`: `unarycount(leds, delay=1)` and `binarycount(leds, delay=1)`. Exact names: later projects import this file.

### Project 1.5

- Making a PWM pin: `machine.PWM(machine.Pin(13))`
- Setting its frequency: `led.freq(1000)`
- Setting brightness: `led.duty_u16(value)`, from `0` (off) to `65535` (fully on)
- `range(start, stop, step)` can step by more than 1, and count backward with a negative step
- Add both challenges to the same `leds.py` from Project 1.4: `breathe1(led)` and `breatheall(leds)`. Exact names: later projects import this file.
