---
layout: lesson
title: "Project 1.2 & 1.3 Checklist"
pathway: pico
order: 102.1
label: "Project 1.2 & 1.3 Companion"
source: original
companion: true
---

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Period: <span class="fill-line short"></span>
  Date: <span class="fill-line short"></span>
</p>

Check off each box as you finish that step. The back is a quick reference for the commands, in case you don't want to reopen the lesson pages.

## Project 1.2: Flashing MicroPython

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Step</th><th>&#10003;</th></tr>
  </thead>
  <tbody>
    <tr><td>Put my Pico into BOOTSEL mode and clicked Allow on the connect prompt</td><td class="checkbox-cell"></td></tr>
    <tr><td>Picked Install MicroPython from the interpreter menu</td><td class="checkbox-cell"></td></tr>
    <tr><td>Chose the right variant: Raspberry Pi Pico 2 W</td><td class="checkbox-cell"></td></tr>
    <tr><td>Bottom-right now shows MicroPython (Raspberry Pi Pico) connected</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

## Project 1.3: Files and the REPL

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Step</th><th>&#10003;</th></tr>
  </thead>
  <tbody>
    <tr><td>Found both file panels: This computer and Raspberry Pi Pico</td><td class="checkbox-cell"></td></tr>
    <tr><td>Saved Hello World.py to Raspberry Pi Pico (not This computer) and ran it</td><td class="checkbox-cell"></td></tr>
    <tr><td>Typed <code>import machine</code> and <code>dir(machine)</code> in the Shell</td><td class="checkbox-cell"></td></tr>
    <tr><td>Printed <code>machine.Pin.OUT</code> and <code>machine.Pin.IN</code></td><td class="checkbox-cell"></td></tr>
    <tr><td>Created <code>led</code> for the onboard LED and turned it on, then off</td><td class="checkbox-cell"></td></tr>
    <tr><td>Created <code>myled</code> for a wired LED (pin used: <span class="fill-line short"></span>) and turned it on, then off</td><td class="checkbox-cell"></td></tr>
    <tr><td>Used <code>.toggle()</code> on <code>myled</code></td><td class="checkbox-cell"></td></tr>
    <tr><td>Used <code>import time</code> and <code>time.sleep(5)</code></td><td class="checkbox-cell"></td></tr>
    <tr><td>Wrote blink.py, saved it to Raspberry Pi Pico, and got an LED blinking on its own</td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

<div class="print-page-break"></div>

## Quick reference

### Project 1.2: Flashing

- Hold **BOOTSEL**, plug in USB, count to three, let go.
- Interpreter menu (bottom-right) &rarr; Install MicroPython &rarr; **Raspberry Pi Pico 2 W**.
- Connected means the bottom-right shows **MicroPython (Raspberry Pi Pico)**.

### Project 1.3: Files and the REPL

- **This computer** is your Mac, **Raspberry Pi Pico** is the board. A file your LEDs depend on has to be on the Pico: **File &gt; Save As** &rarr; **Raspberry Pi Pico**, not **This computer**.

REPL commands, in order:

```python
import machine
dir(machine)
print(machine.Pin.OUT)
print(machine.Pin.IN)
led = machine.Pin("LED", machine.Pin.OUT)
myled = machine.Pin(13, 1)
led.value(1)
led.value(0)
myled.value(1)
myled.value(0)
myled.toggle()
import time
time.sleep(5)
```

`blink.py` skeleton, saved to **Raspberry Pi Pico**:

```python
import machine
import time
# TODO: Define your led
# Blink something
while True:
    # TODO: Turn your LED on and off with a delay between states
```
