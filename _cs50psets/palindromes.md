---
title: "Palindromes"
order: 3
source: original
---

<figure id="fig-palindrome-mirror" class="pset-hero">
  <svg viewBox="0 0 400 170" role="img" aria-labelledby="palindrome-mirror-title">
    <title id="palindrome-mirror-title">The word "racecar" with a faded, upside-down reflection of itself underneath, like a word reflected in still water</title>
    <defs>
      <linearGradient id="palindrome-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#828282" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#828282" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <text x="200" y="66" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#111">racecar</text>
    <line x1="30" y1="82" x2="370" y2="82" stroke="#dedede" stroke-width="1"/>
    <g transform="translate(0,166) scale(1,-1)">
      <text x="200" y="66" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="url(#palindrome-fade)">racecar</text>
    </g>
  </svg>
  <figcaption>Racecar reads the same forwards and backwards, like its own reflection.</figcaption>
</figure>

## Background

A palindrome is a word that reads the same forwards and backwards,
like "mom" or "racecar." In this problem, you'll write a program that
reads in a sentence and counts how many of its words are palindromes.

This problem was originally written for this class's C track by a
past student, and is adapted here for Python.

<div class="pset-demo">
  <label for="palindrome-input">Try a word:</label>
  <input type="text" id="palindrome-input" placeholder="e.g. racecar" autocomplete="off">
  <p id="palindrome-result"></p>
</div>

<script>
(function () {
  var input = document.getElementById('palindrome-input');
  var result = document.getElementById('palindrome-result');
  if (!input || !result) return;

  input.addEventListener('input', function () {
    var cleaned = input.value.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length === 0) {
      result.textContent = '';
      return;
    }
    var reversed = cleaned.split('').reverse().join('');
    if (cleaned.length < 2) {
      result.textContent = '"' + cleaned + '" is too short to count as a palindrome.';
    } else if (cleaned === reversed) {
      result.textContent = '"' + cleaned + '" is a palindrome!';
    } else {
      result.textContent = '"' + cleaned + '" reversed is "' + reversed + '", not a palindrome.';
    }
  });
})();
</script>

This is just a single-word checker to build your intuition. Your
program needs to handle a whole sentence at once, which is a bit more
work; see the specification below.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir palindromes
cd palindromes
code palindromes.py
```

That creates a new folder called `palindromes`, moves into it, and
opens a new, empty file called `palindromes.py` for you to edit.

## Specification

Implement a program, in `palindromes.py`, that reads a sentence from
the user and prints how many of its words are palindromes.

- Prompt the user for a sentence with `input()`.
- A word counts as a palindrome if it reads the same forwards and
  backwards, ignoring case. `Mom` and `mom` are the same word for this
  purpose.
- Ignore punctuation attached to a word. `civic.` and `kayak?` should
  be treated as `civic` and `kayak`.
- A single letter, like `a` or `I`, does not count as a palindrome,
  even though it trivially reads the same both ways. Only words of two
  or more letters count.
- Words are separated by whitespace.
- Print the total number of palindromic words in the sentence,
  followed by a newline.

## Usage

Your program should behave per the examples below. The underlined text
is what a user has typed.

```
$ python palindromes.py
Sentence: My mom has a cat!
1
```

```
$ python palindromes.py
Sentence: Do you want to kayak with my mom and me?
2
```

```
$ python palindromes.py
Sentence: no palindromes here
0
```

## Hints

- `.split()` breaks a sentence into a list of words, wherever there's
  whitespace.
- A word's punctuation isn't part of the word, so you'll need to strip
  it off before comparing. `str.isalpha()` can help you check which
  characters are letters and which aren't.
- Python can reverse a string with slicing: `word[::-1]`.
- Converting both a word and its reverse to the same case, with
  `.lower()`, takes care of "Mom" vs. "mom" for you.

## Style and Submission

Run these one at a time, from inside your `palindromes` folder.

Check your style:

{% include copy-command.html command="style50 palindromes.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/palindromes" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/palindromes" %}
