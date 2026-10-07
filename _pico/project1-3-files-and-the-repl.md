---
layout: lesson
title: "Project 1.3: Files on Your Pico, and Your First REPL Commands (Day 2)"
pathway: pico
order: 102
chapter: "p1.3"
project: 1
project_part: 3
label: "Project 1.3"
source: original
subtitle: "See where your code actually lives, save a script to your Pico, and control an LED straight from the REPL"
hide_copy_buttons: true
---

This is for after [Project 1.2](/pico/project1-2-flashing-with-thonny/) has MicroPython running on your Pico and Thonny connected to it.

<aside class="callout note" markdown="1">
**DON'T SEE TWO FILE PANELS?**

This lesson needs Thonny's **regular** mode, which is already the Mac default, so most of you won't need to change anything. If you only see a script area and a Shell, with no file lists on the left, open **Thonny > Preferences > General** and set **UI mode** to **regular**.

<figure id="fig-project1-3-regular-mode" class="figure-small">
  <img src="{{ '/assets/img/pico/thonny-options-regular-mode.png' | relative_url }}" alt="Thonny's General options tab with the UI mode dropdown open, showing simple, regular, and expert, with regular selected.">
  <figcaption>Thonny's General options, with UI mode set to regular</figcaption>
</figure>

Changing this needs a full restart of Thonny (quit and reopen) before it takes effect.
</aside>

### Reconnect to your Pico

If you just restarted Thonny, it won't be connected to your Pico yet. Click the interpreter indicator in the bottom-right corner and choose the MicroPython entry for your board.

<figure id="fig-project1-3-reconnect" class="figure-small">
  <img src="{{ '/assets/img/pico/micropython-connected-menu.png' | relative_url }}" alt="Thonny's interpreter menu listing MicroPython options for the connected board, with one highlighted.">
  <figcaption>Picking your Pico's MicroPython entry from the interpreter menu</figcaption>
</figure>

### Two places your files can live

Look at the panel on the left side of Thonny's window. It's split into two sections:

- **This computer**, showing folders and files on the Mac you're sitting at
- **Raspberry Pi Pico**, showing files stored on your Pico itself

These are two completely separate storage devices. A file sitting in **This computer** exists only on this one Mac; a file sitting in **Raspberry Pi Pico** exists on the board, and stays there even after you unplug it and walk away. Your three-LED circuit is wired to the Pico, not to this Mac, so any program that's going to control your LEDs has to end up living on the Pico.

### Save a script onto your Pico

Type this short program into a new script:

```python
print("Hello, World!")
```

Save it with **File > Save As**. Thonny will ask where to save it first:

<figure id="fig-project1-3-save-destination" class="figure-small">
  <img src="{{ '/assets/img/pico/save-destination-dialog.png' | relative_url }}" alt="Thonny's Where to save to? dialog, offering a choice between This computer and Raspberry Pi Pico.">
  <figcaption>Choose Raspberry Pi Pico here, not This computer</figcaption>
</figure>

Choose **Raspberry Pi Pico**, not **This computer**, then give it a name. Click the **Run** button. You should see `Hello, World!` appear in the Shell below, and your new file should now show up under **Raspberry Pi Pico** in the file panel, not under **This computer**.

<figure id="fig-project1-3-hello-world">
  <img src="{{ '/assets/img/pico/hello-world-saved-to-pico.png' | relative_url }}" alt="Thonny showing a file called Hello World.py open in the editor, listed under the Raspberry Pi Pico panel rather than This computer, with its output printed in the Shell below.">
  <figcaption>A script saved to the Pico itself, not to the computer. Your own "This computer" panel will list whatever's actually on your Mac, which won't match this screenshot.</figcaption>
</figure>

<aside class="callout warning" markdown="1">
**SAVING TO THE WRONG PLACE**

If you save to **This computer** by mistake, your Pico will never run that file, no matter how many times you click Run on the computer's copy. Check which panel your file lands in afterward. If it's in the wrong one, use **File > Save As** again and pick the other location this time.
</aside>

### Try commands directly in the REPL

So far, every program has meant writing a script, saving it, and clicking Run. There's a faster way to try things out: typing directly into the Shell, the panel where you saw `Hello, World!` appear a moment ago. This is also called the **REPL**, for *read-evaluate-print loop*: each line runs the instant you press Enter, with no Save and no Run button.

Click in the Shell, next to the `>>>` prompt. Type each line below one at a time, pressing Enter after each one and reading what happens before you type the next line. Don't paste a whole block in at once, you'd miss the point: the REPL's whole value is seeing each line react immediately, on its own.

### `import machine` is loading a library that's already there

```python
import machine
```

Nothing prints. That's normal: a successful import is silent. `machine` is a *built-in* library: it shipped as part of the MicroPython firmware you installed onto your Pico back in Project 1.2, so there's nothing to download or install here, just a name to load.

### Look inside a library before you use it

```python
dir(machine)
```

This prints every name `machine` defines, all on one crowded line. Skim it. You'll spot `'Pin'` in there, that's the one you're about to use, along with others you haven't met yet (`ADC`, `I2C`, `Timer`, and more). `dir()` works on any library and is a quick way to see what's actually available, instead of guessing.

### `machine.Pin.OUT` is just a number with a readable name

```python
print(machine.Pin.OUT)
```

```python
print(machine.Pin.IN)
```

<figure id="fig-project1-3-pin-out-in" class="figure-small">
  <img src="{{ '/assets/img/pico/repl-pin-out-in.png' | relative_url }}" alt="Thonny's Shell showing print(machine.Pin.OUT) returning 1, and print(machine.Pin.IN) returning 0.">
  <figcaption>What that looks like in your own Shell</figcaption>
</figure>

`machine.Pin.OUT` isn't a special keyword, it's a plain integer, 1, that `machine.Pin` has agreed to treat as "output mode." `machine.Pin.IN` is just 0, meaning "input mode." You could write `machine.Pin(13, 1)` and it would work exactly the same way as `machine.Pin(13, machine.Pin.OUT)`, just without a reader-friendly name for that 1. You'll use the bare number yourself in a moment.

### Create a Pin for the onboard LED

```python
led = machine.Pin("LED", machine.Pin.OUT)
```

That line alone doesn't light anything up yet, it just sets the pin up as an output. Before you test it, create a second `Pin` for one of your own wired LEDs.

### Create a Pin for one of your own LEDs

Check your Project 1.1 Notes page for the GPIO pin number you recorded for one of your wired LEDs. This time, call it `myled`, and use the bare number 1 instead of `machine.Pin.OUT`, just to prove to yourself they really do mean the same thing:

```python
myled = machine.Pin(13, 1)
```

Use whichever pin number you actually wired, 13, 14, or 15, not necessarily 13.

### Turn each LED on, then off

Now light up the onboard LED:

```python
led.value(1)
```

<figure id="fig-project1-3-led-myled" class="figure-small">
  <img src="{{ '/assets/img/pico/repl-led-myled-created.png' | relative_url }}" alt="Thonny's Shell showing led and myled created as Pin objects, and led.value(1) typed on the next line." >
  <figcaption>Your Shell should look something like this so far</figcaption>
</figure>

Your Pico's onboard LED should light up the moment you press Enter on that line.

```python
led.value(0)
```

And now your own LED:

```python
myled.value(1)
```

```python
myled.value(0)
```

### A shortcut: `.toggle()`

Typing `.value(1)` then `.value(0)` means you have to keep track of which state the LED is already in. `.toggle()` does that bookkeeping for you: on becomes off, and off becomes on, whichever it currently is.

```python
myled.toggle()
```

Run that line a few times in a row, pressing Enter after each one, and watch the LED flip every time.

### Pausing on its own: `import time`

Pressing Enter between each toggle works, but your Pico can pause by itself instead.

```python
import time
```

Another built-in library, this one for anything to do with time.

```python
time.sleep(5)
```

Your Shell will sit still, with no new `>>>` prompt, for five full seconds before it responds again. `sleep()` takes a number of seconds to wait, and does nothing else.

```python
myled.toggle()
```

<aside class="callout note" markdown="1">
**WHY THIS DISAPPEARS WHEN YOU UNPLUG**

Anything you type into the REPL only exists while Thonny stays connected to your Pico. Unplug your Pico, or close Thonny, and `myled` is gone: nothing was ever saved. That's exactly why a real program lives in a script instead.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: WRITE A PROGRAM THAT FLASHES AN LED**

You now have every piece you need: creating a `Pin`, flipping it with `.toggle()`, and pausing with `time.sleep()`. Try turning those same REPL commands into an actual script, saved to your Pico, that blinks an LED on its own, forever, without you typing anything after you click Run.

Start a **new** script (not the Shell) and type this much to get going:

```python
import machine
import time

# TODO: Define your led

# Blink something
while True:
    # TODO: Turn your LED on and off with a delay between states
```

Don't click Run yet, that `while True:` line needs something underneath it, and a comment doesn't count. Save it first, exactly as it is above, with **File > Save As**: choose **Raspberry Pi Pico** just like you did for `Hello World.py`, and name it `blink.py`.

<figure id="fig-project1-3-save-blink" class="figure-small">
  <img src="{{ '/assets/img/pico/save-blink-filename-dialog.png' | relative_url }}" alt="Thonny's Save to Raspberry Pi Pico dialog, listing the existing Hello World.py file, with blink.py typed into the File name field.">
  <figcaption>Saving blink.py to the Pico, alongside Hello World.py</figcaption>
</figure>

Once it's saved, your screen should look something like this, before you've filled in the TODOs:

<figure id="fig-project1-3-blink-skeleton">
  <img src="{{ '/assets/img/pico/blink-skeleton-saved.png' | relative_url }}" alt="Thonny showing blink.py open and saved to the Raspberry Pi Pico, with the import lines and while True loop typed in and two TODO comments still left to fill in." >
  <figcaption>blink.py saved to the Pico, TODOs still to fill in</figcaption>
</figure>

Fill in both TODOs, then click **Run**. If you get stuck, Project 1.4 walks through the exact same program from scratch.
</aside>

Once you've tried the challenge, or gotten stuck on it, move on to [Project 1.4](/pico/project1-4-blinking-your-leds/), where you'll build this same program step by step.
