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
    <tr><td><strong>Challenge:</strong> all three LEDs light one at a time, in a row</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> three LEDs count from 0 to 7 in binary, on their own, forever</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

## Project 1.5: Fading with PWM

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Step</th><th>&#10003;</th></tr>
  </thead>
  <tbody>
    <tr><td>Tried duty_u16() at 0, 32768, and 65535 in the REPL</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> an LED breathes, fading up and down on its own, forever</td><td class="checkbox-cell"></td></tr>
    <tr><td><strong>Challenge:</strong> two LEDs breathe out of sync with each other</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

<div class="print-page-break"></div>

## Quick reference

Syntax only. The challenges above are still yours to work out: this page won't do the converting or the looping for you.

### Project 1.4

- Making an output pin: `machine.Pin(13, machine.Pin.OUT)`
- Place values for 3 LEDs: 4, 2, 1. Any number 0-7 is some combination of those three, on or off.
- `%` (modulo) gives the remainder after dividing by something.
- `//` (floor division) divides by something and throws away the remainder.

### Project 1.5

- Making a PWM pin: `machine.PWM(machine.Pin(13))`
- Setting its frequency: `led.freq(1000)`
- Setting brightness: `led.duty_u16(value)`, from `0` (off) to `65535` (fully on)
- `range(start, stop, step)` can step by more than 1, and count backward with a negative step
