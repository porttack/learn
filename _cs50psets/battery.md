---
title: "Battery Gauge"
order: 7
chapter: 7
source: original
subtitle: "Read a battery's voltage and report whether it's low, good, or a plain percentage, validating input with try/except."
---

<figure id="fig-battery-tester" class="pset-hero-compact">
  <img src="{{ '/assets/img/cs50psets/battery-tester.jpg' | relative_url }}" alt="A Tronic analog battery tester with an AAA cell clipped in, its sliding bar sitting in the yellow zone between the 1.2 and 1.1 marks on the 1.5V column, just above a red EMPTY label">
  <figcaption>A cheap battery tester like this one does exactly what your program will do: take a voltage reading and turn it into something a person can act on at a glance. (Photo: Cjp24, CC BY-SA 4.0)</figcaption>
</figure>

## Background

A fresh AA alkaline battery is rated at 1.5V, but "rated" isn't the
same as "reads." Straight off the shelf, a fresh cell often measures
a little higher, sometimes 1.6V or more. As it discharges under use,
the voltage sags, and by around 1.2V most devices start acting
flaky: dimmer lights, sluggish motors, a wall clock running slow. Below
that, the cell still has some chemistry left in it, but not enough to
trust.

This problem asks you to write a program that takes a voltage reading
and a battery's nominal (rated) voltage, and reports back one of three
things: that the battery is low, that it's a plain percentage of
nominal, or that it's reading unusually strong. Structurally, this is
close to a classic problem about a fuel tank and a fraction: parse two
numbers, do some division, and turn the result into a human-readable
reading. If you've seen that problem before, or asked an AI to solve
it for you, the shape will look familiar, but read the specification
below closely anyway. A couple of the rules here work differently, on
purpose.

<div class="pset-demo">
  <label for="battery-measured">Measured (V):</label>
  <input type="number" id="battery-measured" value="1.3" step="0.01">
  <label for="battery-nominal">Nominal (V):</label>
  <input type="number" id="battery-nominal" value="1.5" step="0.01">
  <p id="battery-result"></p>
</div>

<script>
(function () {
  var measuredInput = document.getElementById('battery-measured');
  var nominalInput = document.getElementById('battery-nominal');
  var result = document.getElementById('battery-result');
  if (!measuredInput || !nominalInput || !result) return;

  function update() {
    var x = parseFloat(measuredInput.value);
    var y = parseFloat(nominalInput.value);
    if (isNaN(x) || isNaN(y) || y <= 0 || x < 0) {
      result.textContent = '';
      return;
    }
    var ratio = x / y;
    var percent = Math.round(ratio * 100);
    if (percent <= 80) {
      result.textContent = 'LOW (' + percent + '%)';
    } else if (percent >= 100) {
      result.textContent = 'GOOD (' + percent + '%)';
    } else {
      result.textContent = percent + '%';
    }
  }

  measuredInput.addEventListener('input', update);
  nominalInput.addEventListener('input', update);
  update();
})();
</script>

This shows what your program's output should look like for valid
input; it doesn't validate or reject anything the way your program
needs to. See the specification below for the actual rules.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir battery
cd battery
code battery.py
```

That creates a new folder called `battery`, moves into it, and opens a
new, empty file called `battery.py` for you to edit.

## Starter Code

Paste this into `battery.py` to start from. `gauge_reading` is stubbed
out with `pass` and two `>>>` examples, the same doctest format you've
already seen in Think Python; run `python3 -m doctest battery.py` from
inside your `battery` folder to check them. They'll fail until you
replace `pass` with real code, and you should add one more example of
your own, for the `LOW` case. If every example passes, the command
prints nothing at all; silence means you're good. A failure prints a
diff of what it expected versus what your code returned.

Notice the first example passes in `89.6`, not a whole number.
`gauge_reading` should round to the nearest integer itself rather than
trust its caller to have already done it; that way it gives a correct
reading no matter where in your program the rounding ends up
happening.

`main` is left as a comment on purpose. The retry loop is the actual
point of this problem, and a docstring can't check it the way it can
check `gauge_reading` (see the note further down about why), so
there's no starter shape to hand you there beyond the reminder of what
it needs to do.

```python
# Student Initials:
"""
Battery Gauge

Slug: porttack/cs50/problems/py/battery
Doctests: python3 -m doctest battery.py
"""


def main():
    # Prompt, then validate inside a try/except loop per the
    # specification below. Once you have a valid reading, print what
    # gauge_reading() returns.
    pass


def gauge_reading(percent):
    """
    Returns the gauge reading for percent, a percentage of nominal
    voltage. Rounds percent to the nearest integer itself, so it's
    fine to pass in a number that isn't rounded yet.

    >>> gauge_reading(89.6)
    '90%'
    >>> gauge_reading(105)
    'GOOD (105%)'
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, `battery.py`, that reads a battery's voltage and
reports its charge.

- Prompt the user for input with `input("Voltage: ")`. The user will
  enter two numbers separated by a slash, `X/Y`, where `X` is the
  measured voltage and `Y` is the battery's nominal (rated) voltage.
  Neither is guaranteed to be a whole number: `1.35/1.5` is valid
  input, not just `3/4`.
- Compute the reading as a percentage of nominal, `X / Y * 100`,
  rounded to the nearest integer.
- If the percentage is **80 or less**, print `LOW (N%)`, where `N` is
  the percentage. For example, `LOW (50%)`.
- If the percentage is **100 or more**, print `GOOD (N%)`. Unlike a
  fuel tank, a battery can genuinely read above its nominal voltage
  and still be a valid reading, so don't reject it. For example,
  `GOOD (104%)`.
- Otherwise (the percentage is between 81 and 99, inclusive), print
  just `N%`, with no label. For example, `73%`.
- `X` must not be negative. A negative voltage isn't a real reading;
  prompt again.
- `Y` must be a positive number. If it's zero or negative, prompt
  again.
- If the user's input isn't in the `X/Y` format, or `X` or `Y` isn't a
  number at all, prompt again.
- In every "prompt again" case above, don't print an error message,
  just silently ask again with the same `"Voltage: "` prompt.

<aside class="callout note" markdown="1">
**NOTE**

Every one of those "prompt again" rules needs to funnel through the
same retry loop, but not all of them happen the same way. Some of them
are things Python already raises an exception for on its own, when you
try to convert or divide something that doesn't work: catch those with
`try`/`except`. Others (the "must not be negative" and "must be
positive" rules) are things Python has no complaint about at all:
`float("-1")` and `5.0 / 1.5` both work fine as far as Python is
concerned, so a plain `if condition: continue` right in the loop is
all you need for those, no exception required.

If you'd rather have every rule go through the same `except` block,
you can `raise ValueError` yourself for those two instead of using
`continue` directly; either way works and check50 doesn't care which
you pick. A bare `except:` with no exception type named is also fine
for a program this size. Naming the specific exceptions you expect
(`except (ValueError, ZeroDivisionError):`) is better practice for
anything you intend to keep working on, since a bare `except:` will
also silently swallow a mistake elsewhere in your code, but that's a
refinement, not a requirement here.

Either way, `gauge_reading` should be able to assume it's always
handed a plausible reading; it only has three outputs to produce
(`LOW`, `GOOD`, or a plain percentage), never a rejection.
</aside>

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="battery-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python battery.py
Voltage: -1/1.5
Voltage: abc/1.5
Voltage: 1.35/1.5
90%

$ python battery.py
Voltage: 1.2/1.5
LOW (80%)

$ python battery.py
Voltage: 2.25/1.5
GOOD (150%)
</pre>

<script>
(function () {
  var el = document.getElementById('battery-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python battery.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Voltage: ', type: false },
    { text: '-1/1.5\n', type: true, speed: 100 },
    { text: 'Voltage: ', type: false },
    { text: 'abc/1.5\n', type: true, speed: 100 },
    { text: 'Voltage: ', type: false },
    { text: '1.35/1.5\n', type: true, speed: 100 },
    { text: '90%\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python battery.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Voltage: ', type: false },
    { text: '1.2/1.5\n', type: true, speed: 100 },
    { text: 'LOW (80%)\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python battery.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Voltage: ', type: false },
    { text: '2.25/1.5\n', type: true, speed: 100 },
    { text: 'GOOD (150%)\n', type: false }
  ];

  var pauseBetweenLoops = 3600;
  var pauseBetweenLines = 500;

  function typeText(text, speed, cb) {
    var i = 0;
    (function step() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(step, speed);
      } else {
        cb();
      }
    })();
  }

  function playStep(index) {
    if (index >= script.length) {
      setTimeout(function () {
        el.textContent = '';
        playStep(0);
      }, pauseBetweenLoops);
      return;
    }
    var item = script[index];
    if (item.type) {
      typeText(item.text, item.speed, function () { playStep(index + 1); });
    } else {
      el.textContent += item.text;
      setTimeout(function () { playStep(index + 1); }, pauseBetweenLines);
    }
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    var full = '';
    for (var i = 0; i < script.length; i++) full += script[i].text;
    el.textContent = full;
  } else {
    playStep(0);
  }
})();
</script>

## Hints

If exceptions still feel unfamiliar, CS50's own lecture on the topic
is a solid general reference: [CS50P - Lecture 3 -
Exceptions](https://www.youtube.com/watch?v=LW7g1169v7w). It's the
same lecture that introduces the fuel tank problem mentioned above, so
it covers try/except and raise from the ground up. The hints below are
specific to this problem, not a substitute for it, and they build on
each other in order: if you're not sure where to start, work through
them top to bottom rather than jumping to the last one.

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- Split the reprompt loop from the reading-to-label conversion. A
  `main()` that loops with `try`/`except` until it has a valid `x` and
  `y`, then hands them off to a second function that just does the
  math and returns a string, is much easier to get right than one
  giant function that does both at once.

  Here's the skeleton of that loop, with none of the battery-specific
  logic filled in yet, just the shape:

  ```python
  while True:
      try:
          # Read the input, split it, convert both pieces to float,
          # and check any rules that aren't exceptions on their own
          # (see the third and fourth hints below).
          break  # Only reached if nothing above raised or continued.
      except (ValueError, ZeroDivisionError):
          continue
  ```

  `break` immediately exits the `while` loop, so it belongs right
  after the last check that could still reject the input, once you're
  confident `x` and `y` are both good. `continue` jumps straight back
  to the top of the loop and re-prompts, skipping over anything else
  left in the `try` block, including that `break`.

- `"1.35/1.5".split("/")` gives you a list of two strings,
  `["1.35", "1.5"]`. Python lets you assign both pieces to two
  variables in one line, called unpacking:

  ```python
  >>> x, y = "1.35/1.5".split("/")
  >>> x
  '1.35'
  >>> y
  '1.5'
  ```

  If the split doesn't produce exactly two pieces (say, someone types
  `1.35` with no slash at all, or `1/2/3` with two slashes), that
  unpacking line itself raises `ValueError`, before you ever call
  `float()`. You don't need to count the pieces yourself; the
  `except` block above already catches it.
- `float()` works like `int()`, but accepts decimals: `float("1.35")`
  gives you `1.35`, and `float("abc")` raises `ValueError`, same as
  `int("abc")` would.
- Dividing by zero raises `ZeroDivisionError` on its own; you don't
  have to check for it. A negative number dividing another number,
  though, raises nothing at all, since there's nothing mathematically
  wrong with it. That's a rule Python doesn't know about, so you have
  to enforce it yourself, with a plain `if`, not an exception.
- If you'd rather have that rule go through the same `except` block
  instead of a separate `if`, you can trigger `ValueError` yourself
  from inside the `try` block: `raise ValueError` (with nothing after
  it, no message needed). Raising it there sends control straight to
  the matching `except` below, exactly as if Python had raised it for
  you. This is optional; a plain `if condition: continue` works just
  as well, and reads more clearly to a lot of people.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Fill in `gauge_reading` with real code, and add one more `>>>`
  example of your own to its docstring, for the `LOW` case. It's a
  pure function, no input, no exceptions, so it doctests cleanly.
  Don't try to do the same for the retry loop in `main`: a docstring
  can't express "type this, then that raises an exception," so it
  doesn't doctest well at all. We'll cover testing code that raises
  exceptions later on, with a different tool.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Style and Submission

Run these one at a time, from inside your `battery` folder.

Check your style:

{% include copy-command.html command="style50 battery.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/battery" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/battery" %}

<hr>

## Glossary

- **exception** — An error Python raises while a program is running,
  as opposed to one caught before the program starts (like a syntax
  error). `ValueError` and `ZeroDivisionError` are both exceptions.
- **try/except** — A block that attempts some code (`try`) and, if it
  raises an exception, runs different code instead of crashing
  (`except`), catching one or more listed exception types.
- **raise** — A statement that triggers an exception yourself, on
  purpose. Lets you route a rule Python doesn't enforce on its own
  (like "this number can't be negative") through the same `except`
  block that catches Python's built-in exceptions.
- **ZeroDivisionError** — The exception Python raises when code
  divides by zero.
- **ValueError** — The exception Python raises when a function gets an
  argument of the right type but an inappropriate value, such as
  `int("abc")` or `float("abc")`.

