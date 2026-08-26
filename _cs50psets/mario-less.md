---
title: "Mario (less comfortable)"
order: 1
source: cs50-ap
source_url: "https://cs50.harvard.edu/ap/2025/curriculum/x/psets/6/mario/less/"
---

## Background

Recall Mario, the classic 1985 video game wherein the player, as Mario,
runs and jumps his way through a mushroom kingdom, collecting coins and
avoiding obstacles, all in an effort to save a princess.

<figure id="fig-mario-pyramid">
  <img src="https://cs50.harvard.edu/ap/2025/curriculum/x/psets/6/mario/less/pyramid.png" alt="screenshot of Mario jumping up a half-pyramid of blocks">
  <figcaption>Mario jumping up a half-pyramid of blocks.</figcaption>
</figure>

In this problem, you don't need to write any code for the game itself.
Instead, let's write some code to print a half-pyramid of blocks like
you might see in the game itself, using hashes (`#`) for blocks, per the
below, where the top-left of the game's screen is deemed to be at the
top-left of your terminal window.

```
#
##
###
####
#####
######
#######
########
```

This particular half-pyramid is eight rows tall and eight columns wide.

## Demo

<script async data-autoplay="1" data-cols="100" data-loop="1" data-rows="12" id="asciicast-sUSilCTveD7JTV2lOZ7eIqKbo" src="https://asciinema.org/a/sUSilCTveD7JTV2lOZ7eIqKbo.js"></script>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir mario
cd mario
code mario.py
```

That creates a new folder called `mario`, moves into it, and opens a
new, empty file called `mario.py` for you to edit.

## Specification

Implement a program, in `mario.py`, that recreates this half-pyramid
using hashes for blocks, wherein the half-pyramid's height should be a
non-negative integer between 1 and 8, inclusive.

- Prompt the user for the pyramid's height with `input()`.
- Convert what the user typed to an integer with `int()`, and validate
  it yourself: if it isn't a valid integer, or is outside the range 1
  through 8, print an error (or simply say nothing) and prompt again.
  Keep prompting until the user gives you a valid height. Converting a
  non-numeric string like `"foo"` with `int()` raises a `ValueError` if
  you don't guard against it, so think about how you'll catch or avoid
  that before it crashes your program.
- Once you have a valid height, generate (with the help of `print` and
  one or more loops) the half-pyramid itself.
- Take care to align the bottom-left corner of your half-pyramid with
  the left-hand edge of your terminal window, and make sure there's no
  trailing whitespace at the end of any row.

## How to Test

Confirm that your program behaves as follows.

- If the user's input is `-1`, your program should reject it and
  prompt the user again for a valid height.
- If the user's input is `0`, your program should likewise reject it.
- If the user's input is `1`, your program should output:

  ```
  #
  ```

- If the user's input is `2`, your program should output:

  ```
  #
  ##
  ```

- If the user's input is `8`, your program should output an
  eight-row pyramid like the one shown above.
- If the user's input is `9` (or anything greater than `8`), your
  program should reject it and prompt again; only after that should it
  accept a valid height like `8`.
- If the user's input is `foo` (not a number at all), your program
  should reject it without crashing, and prompt again.
- If the user presses Enter without typing anything, your program
  should treat that the same as any other invalid input: reject it and
  prompt again.

## Style and Submission

Run these one at a time, from inside your `mario` folder.

Check your style:

{% include copy-command.html command="style50 mario.py" %}

Check your correctness:

{% include copy-command.html command="check50 cs50/problems/2024/x/sentimental/mario/less" %}

Submit your work:

{% include copy-command.html command="submit50 cs50/problems/2024/x/sentimental/mario/less" %}

<hr>

## Glossary

- **algorithm** — A finite sequence of steps that solves a problem or
  completes a task. Can be written in English, pseudocode, or code.
- **loop** — A statement that runs one or more statements, often
  repeatedly. (AP calls this iteration.)
- **conditional statement** — A statement that controls the flow of
  execution depending on some condition. Informally, this is usually
  an if statement, which might include an elif and an else. (AP calls
  this selection.)
- **boolean expression** — An expression whose value is either True or
  False.

<hr>

## Standards Alignment

**AP CSP:** [3.6 Conditionals](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.6), [3.8 Iteration](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.8) (Big Idea 3, 30–35% of the exam). Also [3.9 Developing Algorithms](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.9), headers only — building the pyramid row by row is a small case of "start rough, refine in steps," but that's not really the point of this problem.
**California 9-12:** [9-12.AP.14](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.AP.14)
**CSTA 2026:** [HS-ALG-PS-02](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-ALG-PS-02), [HS-DAT-DC-24](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-DAT-DC-24)
**CA CTE (ICT):** [C4.9](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.9) (Pathway C).

The re-prompt loop until a valid height is entered is 3.6's
conditionals wrapped in 3.8's iteration, and DAT-DC-24's range-checking
in practice: is the value the right type, does it fall in a sensible
range. Building the pyramid one row, then one hash, at a time is
AP.14's control-structure choice made concrete, and ICT's C4.9 in
different words.
