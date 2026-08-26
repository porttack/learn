---
title: "Caesar"
order: 2
source: cs50-ap
source_url: "https://docs.cs50.net/2019/ap/problems/sentimental/caesar/caesar.html"
---

<figure id="fig-caesar-bust" class="pset-hero-compact">
  <img src="{{ '/assets/img/cs50psets/caesar-bust.jpg' | relative_url }}" alt="A 1st-century BC marble bust identified as Julius Caesar, on display at the Archaeological Museum of Sparti">
  <figcaption>Julius Caesar, the cipher's namesake, is said to have used a shift of 3 to protect his military messages. (Photo: George E. Koronaios, CC0)</figcaption>
</figure>

## Background

Implement a program that encrypts messages using Caesar's cipher.

```
$ python caesar.py 13
plaintext:  HELLO
ciphertext: URYYB
```

(`plaintext:` has an extra trailing space so it lines up under
`ciphertext:` below it.)

<div class="pset-demo">
  <label for="caesar-shift">Shift (k):</label>
  <input type="number" id="caesar-shift" value="3" min="0" step="1">
  <label for="caesar-text">Plaintext:</label>
  <input type="text" id="caesar-text" placeholder="e.g. HELLO" autocomplete="off">
  <p id="caesar-result"></p>
</div>

<script>
(function () {
  var shiftInput = document.getElementById('caesar-shift');
  var textInput = document.getElementById('caesar-text');
  var result = document.getElementById('caesar-result');
  if (!shiftInput || !textInput || !result) return;

  function update() {
    var k = parseInt(shiftInput.value, 10);
    var text = textInput.value;
    if (isNaN(k) || k < 0 || text.length === 0) {
      result.textContent = '';
      return;
    }
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        out += String.fromCharCode(((code - 65 + k) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        out += String.fromCharCode(((code - 97 + k) % 26) + 97);
      } else {
        out += text[i];
      }
    }
    result.textContent = out;
  }

  shiftInput.addEventListener('input', update);
  textInput.addEventListener('input', update);
})();
</script>

This only encrypts, since that's all the assignment asks for. Use it
to check your own program's output against, once you've started
writing `caesar.py`.

## Walkthrough

<aside class="callout note" markdown="1">
**NOTE**

The walkthrough below says `import cs50` and calls `get_string()`.
Those work fine in cs50.dev if you want to use them, but `input()`
really does the same thing.
</aside>

<div class="video-embed">
  <iframe src="https://www.youtube.com/embed/5I7QqTTolHE?rel=0" title="Caesar walkthrough" frameborder="0" allowfullscreen></iframe>
</div>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir caesar
cd caesar
code caesar.py
```

That creates a new folder called `caesar`, moves into it, and opens a
new, empty file called `caesar.py` for you to edit.

## Specification

Design and implement a program, `caesar.py`, that encrypts messages
using Caesar's cipher.

- Your program must accept a single command-line argument, a
  non-negative integer. Let's call it *k* for the sake of discussion.
- If your program is executed without any command-line arguments, or
  with more than one, print an error message of your choice and exit
  immediately with a status code of 1 (`exit(1)`). The message's exact
  wording doesn't matter and isn't checked; only the exit code is. The
  Usage examples below just show one message you could use.
- You can assume that, if a user does provide a command-line argument,
  it will be a non-negative integer. No need to check that it's
  numeric, but you do need to convert it to an `int` yourself.
- Do not assume that *k* will be less than or equal to 26. Your
  program should work for any non-negative *k*. Even if *k* is greater
  than 26, alphabetical characters in your input should remain
  alphabetical characters in your output. For instance, if *k* is 27,
  `A` should become `B`, not some non-alphabetical character, provided
  you wrap around from `Z` back to `A`.
- Your program must print `plaintext:` (with a trailing space, no
  newline) and then prompt the user for a string of plaintext with
  `input()`.
- Your program must print `ciphertext:` (with a trailing space, no
  newline) followed by the plaintext's corresponding ciphertext, with
  each alphabetical character in the plaintext rotated by *k*
  positions. Non-alphabetical characters should be printed unchanged.
- Your program must preserve case: capitalized letters, though
  rotated, must remain capitalized; lowercase letters, though rotated,
  must remain lowercase.
- After outputting the ciphertext, print a newline.

## Usage

Your program should behave per the examples below. As above,
`plaintext:` carries an extra trailing space so both labels line up.

```
$ python caesar.py 1
plaintext:  HELLO
ciphertext: IFMMP
```

```
$ python caesar.py 13
plaintext:  hello, world
ciphertext: uryyb, jbeyq
```

```
$ python caesar.py 13
plaintext:  be sure to drink your Ovaltine
ciphertext: or fher gb qevax lbhe Binygvar
```

```
$ python caesar.py
Usage: python caesar.py k
```

```
$ python caesar.py 1 2 3 4 5
Usage: python caesar.py k
```

## Hints

`argv` is a list of strings representing the command-line arguments;
`len(argv)` tells you how many there are. You'll need to import both
`argv` and `exit`:

```python
from sys import argv, exit
```

Once you've confirmed there's exactly one argument, you can access it
with `argv[1]`, and convert it to an integer with `int(argv[1])`.

You can iterate over the characters in a string, printing each one
without a trailing newline, with code like:

```python
for c in p:
    print(c, end="")
```

You may also find Python's `ord()` and `chr()` functions useful for
rotating letters. Letters are contiguous in ASCII: `ord("a")` through
`ord("z")` are 26 numbers in a row (and separately, so are `ord("A")`
through `ord("Z")`). Subtracting the first one turns a letter into a
position from 0 to 25, which you can rotate and wrap with `% 26`, then
turn back into a letter by adding the first one back and calling
`chr()`.

## Style and Submission

Run these one at a time, from inside your `caesar` folder.

Check your style:

{% include copy-command.html command="style50 caesar.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/caesar" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/caesar" %}

<hr>

## Glossary

- **algorithm** — A finite sequence of steps that solves a problem or
  completes a task. Can be written in English, pseudocode, or code.
- **loop** — A statement that runs one or more statements, often
  repeatedly. (AP calls this iteration.)
- **ASCII** — A table assigning a number from 0 to 127 to each of a
  small set of characters. `ord()` and `chr()` move between a
  character and its ASCII number.
- **encryption** — Encoding data so only holders of the key can read
  it. A Caesar cipher is a very weak form of this: the key is just a
  number from 0 to 25, so it can be broken by trying every one.
- **modulus operator** — The `%` operator, which works on integers and
  returns the remainder when one number is divided by another. It's
  what wraps the alphabet around from `Z` back to `A`. (AP calls this
  `MOD`.)

<hr>

## Standards Alignment

**AP CSP:** [3.4 Strings](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.4), [3.8 Iteration](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.8), [3.13 Developing Procedures](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.13) (Big Idea 3, 30–35% of the exam). Also [5.6 Safe Computing](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-5.6), headers only — the exam doesn't test encryption mechanics, but this is where the concept lives.
**California 9-12:** [9-12.DA.8](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.DA.8), [9-12.NI.6](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.NI.6)
**CSTA 2026:** [HS-ALG-PS-02](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-ALG-PS-02), [HS-SYS-SE-33](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-SYS-SE-33)
**CA CTE (ICT):** [C4.9](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.9), [C4.4](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.4) (Pathway C). Also [C2.2](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C2.2), headers only.

Rotating letters through `ord()`/`chr()` is 3.4 and 3.8 in miniature:
a string walked one character at a time. The shift doubling as a
command-line argument is 3.13's territory, and ICT's C4.9 in different
words; converting a letter to a number and back is DA.8. Caesar's own
cipher is a case study for 5.6 and NI.6: a tiny keyspace is what makes
it breakable, which is exactly the tradeoff those standards are about.
