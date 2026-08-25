---
title: "Caesar"
order: 2
source: cs50-ap
source_url: "https://docs.cs50.net/2019/ap/problems/sentimental/caesar/caesar.html"
---

## Background

Implement a program that encrypts messages using Caesar's cipher.

```
$ python caesar.py 13
plaintext:  HELLO
ciphertext: URYYB
```

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
  immediately with a status code of 1 (`sys.exit(1)`).
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

Your program should behave per the examples below. The underlined text
is what a user has typed.

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
`len(argv)` tells you how many there are. You'll need to import it:

```python
from sys import argv
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
rotating letters.

## Style and Submission

Run these one at a time, from inside your `caesar` folder.

Check your style:

{% include copy-command.html command="style50 caesar.py" %}

Check your correctness:

{% include copy-command.html command="check50 cs50/problems/2019/ap/sentimental/caesar" %}

Submit your work:

{% include copy-command.html command="submit50 cs50/problems/2019/ap/sentimental/caesar" %}
