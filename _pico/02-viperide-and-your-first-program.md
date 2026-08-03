---
layout: lesson
title: "Writing and running code with ViperIDE"
pathway: pico
order: 2
source: original
---

*Connect your Pico to ViperIDE and write your first MicroPython programs —
no software to install, no admin rights needed.*

Your Pico is flashed with MicroPython and ready to go. Now you need a way
to actually write code and send it to the board. That's
[ViperIDE](https://viper-ide.org): it runs entirely in your browser, talks
to your Pico over USB using a feature called WebSerial, and needs nothing
installed on the computer. That matters in a lab full of Chromebooks and
locked-down Macs where you can't install anything anyway.

Go to [viper-ide.org](https://viper-ide.org) in Chrome or another
Chromium-based browser (WebSerial doesn't work in Safari or Firefox yet).
You don't need an account.

## Connecting your Pico

Plug your Pico into your computer with a micro USB cable. In ViperIDE,
look for the option to connect over USB/serial. Your browser will show a
list of devices — pick the one that matches your Pico (it may show up as
something like "USB Serial Device"). The first time, your browser will ask
permission to talk to the device; allow it.

Once connected, you should see your Pico's files in ViperIDE's file
manager, even if that list is empty right now.

<figure id="fig-viperide-interface">
  <img src="{{ '/assets/img/pico/viperide-interface.png' | relative_url }}" alt="The ViperIDE interface: a File Manager pane on the left, a code editor top-right, and a Terminal pane bottom-right showing MicroPython REPL output.">
  <figcaption>
    The ViperIDE interface: File Manager (left), editor (top right), and
    Terminal — this is the REPL — (bottom right). The blue &#9654; button
    next to the ViperIDE logo runs your file.
    <br>Screenshot: <a href="https://github.com/vshymanskyy/ViperIDE">ViperIDE</a> by Volodymyr Shymanskyy, MIT License.
  </figcaption>
</figure>

<aside class="callout warning" markdown="1">
**VIRTUAL DEVICE ISN'T YOUR PICO**

ViperIDE also offers a **Virtual Device** — a MicroPython simulator that
runs entirely inside the browser tab, no hardware required. It's genuinely
useful for practicing plain Python syntax when you don't have your Pico
with you. But it has no `machine` module and no GPIO pins: any code that
touches hardware — LEDs, buttons, sensors, motors — will fail or do
nothing on the Virtual Device. Once you reach physical computing, you must
be connected to your real, physical Pico to see it work.
</aside>

## Two ways to run code: the REPL and script files

ViperIDE gives you two different places to write code, and they behave
differently.

The **REPL** (read-eval-print loop) is a live prompt connected directly to
your Pico. Anything you type runs immediately, one line at a time, and
nothing you type there is saved. It's great for quick experiments and
checking what a line of code actually does.

The **editor** is where you write a real program: multiple lines, saved as
a file on your Pico (usually `main.py`, which runs automatically every
time your Pico powers on). This is where your actual projects will live.

<aside class="callout note" markdown="1">
**COMING FROM THONNY?**

If you've used Thonny before, ViperIDE's editor pane is roughly what
Thonny calls the script area, and its REPL is the same idea as Thonny's
Python shell — a live prompt, not a saved file. ViperIDE doesn't have
Thonny's separate "MicroPython vs. regular Python" interpreter switch,
because it only ever talks to MicroPython devices.
</aside>

## Your first program: Hello, World!

Click into the REPL and type:

```python
print("Hello, world!")
```

Press Enter. Your Pico should immediately print the message back. That
`print()` function is how your program talks to you — you'll use it
constantly, especially for figuring out what's going wrong when something
doesn't work.

Now try the editor instead. Create a new file, type the same line, and
save it to your Pico as `main.py`:

```python
print("Hello, world!")
```

Click the blue &#9654; (play) button near the ViperIDE logo, or press
`F5`. You should see the same output — but this time, the code stays on
your Pico. Unplug it, plug it back in, and it'll print the message again
on its own, because `main.py` runs automatically on startup.

<aside class="callout note" markdown="1">
**USEFUL SHORTCUTS**

`F5` runs the current file, `Ctrl-S` saves it, and `Ctrl-D` soft-resets
your Pico (restarts it without disconnecting) if it ever seems stuck.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: MAKE IT YOURS**

Change the message to something else — your name, a joke, anything. Run
it again. Then try printing two different messages on two separate lines.
Does the order they run in match the order you wrote them?
</aside>

## Loops and indentation

Typing the same `print()` line five times would work, but it's tedious —
and if you wanted to change the message, you'd have to change it in five
places. A loop does the repetition for you:

```python
for count in range(5):
    print("Message number", count)
```

Run that in the editor. You should see five lines of output, numbered 0
through 4 — not 1 through 5. MicroPython, like most programming languages,
starts counting from zero.

Notice the indentation: the `print()` line is indented under the `for`
line. That indentation isn't just for readability — it's how MicroPython
knows which lines belong *inside* the loop. Everything indented the same
amount right after the `for` line runs once per loop; anything back at the
left margin runs only once, after the loop finishes.

<aside class="callout warning" markdown="1">
**INDENTATION IS NOT OPTIONAL**

Get the indentation wrong — mixing tabs and spaces, or indenting by a
different amount than the line above — and MicroPython will refuse to run
your code with an indentation error. This isn't the computer being picky
for no reason: the indentation *is* the structure of your program.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: LOOP THE LOOP**

Change `range(5)` to `range(10)`. Then try adding a second `print()` line
indented the same amount as the first — what happens to the output?
</aside>

## Variables and conditionals

A variable stores a value so you can use it later, and change it:

```python
favorite_number = 7

if favorite_number > 5:
    print("That's a big number!")
else:
    print("That's a small number!")
```

Run it, then change `favorite_number` to something less than 5 and run it
again. The `if` line asks a question — is `favorite_number > 5`? — and
MicroPython runs whichever indented block matches the answer.

You can chain more conditions with `elif` ("else if"):

```python
favorite_number = 7

if favorite_number > 100:
    print("That's huge!")
elif favorite_number > 5:
    print("That's a big number!")
else:
    print("That's a small number!")
```

<aside class="callout challenge" markdown="1">
**CHALLENGE: ADD MORE CONDITIONS**

Add another `elif` for a specific number you care about — something like
`elif favorite_number == 7: print("Lucky number seven!")`. Test it with a
few different values to make sure each one lands in the branch you expect.
</aside>

You now have the basic building blocks — printing, loops, variables, and
conditionals — that every program in this pathway builds on. None of this
needed your Pico's hardware; you could have run all of it on ViperIDE's
Virtual Device. That changes starting next lesson, where these same
building blocks start controlling real components.

## Further reading

- [ViperIDE](https://viper-ide.org) — the tool itself
- [How to write code for your Raspberry Pi Pico in your web browser with
  ViperIDE](https://www.tomshardware.com/raspberry-pi/raspberry-pi-pico/how-to-write-code-for-your-raspberry-pi-pico-in-your-web-browser-with-viperide),
  Tom's Hardware — a walkthrough of the same setup from a different angle
