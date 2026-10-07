---
title: "Emojize"
order: 6
chapter: 6
source: cs50-python
source_url: "https://cs50.harvard.edu/python/psets/4/emojize/"
source_unit: "Week 4 Libraries"
source_unit_url: "https://cs50.harvard.edu/python/weeks/4/"
subtitle: "Write a program that turns emoji codes like :thumbs_up: into real emoji."
---

<figure id="fig-emojize-transform" class="pset-hero">
  <svg viewBox="0 0 400 170" role="img" aria-labelledby="emojize-transform-title">
    <title id="emojize-transform-title">The code :thumbs_up: inside a rounded box, with an arrow pointing right to a large thumbs-up emoji</title>
    <defs>
      <marker id="emojize-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#111"/>
      </marker>
    </defs>
    <rect x="20" y="55" width="160" height="60" rx="10" fill="#f2f2f2" stroke="#ccc"/>
    <text x="100" y="92" text-anchor="middle" font-family="SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace" font-size="20" fill="#111">:thumbs_up:</text>
    <line x1="190" y1="85" x2="240" y2="85" stroke="#111" stroke-width="2" marker-end="url(#emojize-arrow)"/>
    <text x="320" y="107" text-anchor="middle" font-size="64">&#128077;</text>
  </svg>
  <figcaption>emojize() turns a code like :thumbs_up: into the real emoji.</figcaption>
</figure>

## Background

Lots of apps let you type a short code like `:thumbs_up:` and have it turn
into an emoji (👍) on its own. Some codes even have shorter aliases, so
`:thumbsup:` (no underscore before "up") works too.

You'll write a program that does this conversion yourself, using a
function from a package called `emoji`.

<div class="pset-demo">
  <label for="emojize-try-input">Type a sentence with a code or two in it:</label>
  <input type="text" id="emojize-try-input" value="nice :thumbs_up: dude :smile_cat:" autocomplete="off">
  <p id="emojize-try-output"></p>
</div>

<script src="{{ '/assets/js/emojize-demo.js' | relative_url }}" defer></script>

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir emojize
cd emojize
code emojize.py
```

That creates a new folder called `emojize`, moves into it, and opens a
new, empty file called `emojize.py` for you to edit.

Next, create and activate a virtual environment. This is the first
problem in this pathway that needs a package from outside Python
itself, and a virtual environment keeps that package (and any others
you install later) scoped to this one project instead of your whole
account:

```
python -m venv myvenv
source myvenv/bin/activate
```

`python -m venv myvenv` creates a folder holding its own private
copies of `python` and `pip`. `source myvenv/bin/activate` doesn't
install anything, it just points your terminal at those private
copies instead of the ones shared across your whole account, for the
rest of this terminal session. You'll know it worked because your
prompt starts showing `(myvenv)`.

There's a matching `deactivate` command that switches your terminal
back to the shared copies, but you'll rarely use it. Once you're
working on a project, the normal thing is to just leave the virtual
environment active for as long as you're working in that terminal.
Closing the terminal has a similar effect, except then you'll need to
`cd` back into `emojize` and run `source myvenv/bin/activate` again
next time, not `deactivate`.

Now install the `emoji` package, which does the actual code-to-emoji
lookup for you:

{% include copy-command.html command="pip install emoji" %}

## Specification

Design and implement a program, `emojize.py`, that prompts the user for
a string of text and prints an "emojized" version of it.

- Your program must prompt the user for a string of text with
  `input()`.
- Use the `emoji` package's `emojize` function to convert the string,
  and print the result.
- Call `emojize` with `language="alias"` so it recognizes English codes
  and their aliases, not codes written in another language.

```python
from emoji import emojize

print(emojize("very funny :thumbs_up:", language="alias"))
```

That's the whole program: one `input()`, one call to `emojize`, one
`print()`. The hard part isn't the code, it's knowing what to type
inside the colons, which is what the next section is for.

## Browse Emoji Codes

CS50's own version of this problem set points you at a reference page
of every code and alias the `emoji` package understands. **That page is
blocked by the school firewall.** Here's the same list, generated
straight from the same package you just installed, hosted on its own
page so it doesn't turn this lesson into a 5,000-row scroll:

**[Search the emoji code list &rarr;]({{ '/cs50-psets/emoji-list/' | relative_url }})**

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="emojize-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python emojize.py
Input: :1st_place_medal:
🥇

$ python emojize.py
Input: :money_bag:
💰

$ python emojize.py
Input: :smile_cat:
😸

$ python emojize.py
Input: nice job on that pset :thumbs_up:, cs50 is :fire:
nice job on that pset 👍, cs50 is 🔥
</pre>

<script>
(function () {
  var el = document.getElementById('emojize-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python emojize.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Input: ', type: false },
    { text: ':1st_place_medal:\n', type: true, speed: 100 },
    { text: '🥇\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python emojize.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Input: ', type: false },
    { text: ':money_bag:\n', type: true, speed: 100 },
    { text: '💰\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python emojize.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Input: ', type: false },
    { text: ':smile_cat:\n', type: true, speed: 100 },
    { text: '😸\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python emojize.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Input: ', type: false },
    { text: 'nice job on that pset :thumbs_up:, cs50 is :fire:\n', type: true, speed: 60 },
    { text: 'nice job on that pset 👍, cs50 is 🔥\n', type: false }
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

A code `emojize` doesn't recognize is left exactly as it was typed,
colons and all, since there's no emoji to replace it with.

## Hints

`emojize` only changes the parts of the string written like
`:this:`. Anything else in the string, including the spaces between
words, comes through unchanged. That means you don't need to find or
replace anything yourself, your whole program is the one `input()`
call, the one `emojize()` call, and the one `print()`.

If a code prints as `:like_this:` instead of turning into an emoji,
double-check the exact spelling using the search box above. A single
missing underscore (`:thumbsup:` is a real alias, but `:thumbs up:`
with a space is not) is the most common reason it doesn't match.

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

If some codes convert and others don't, check the `language` argument
before anything else. `emojize()` defaults to `language="en"`, which
only matches each emoji's one canonical name, not its aliases.
`:thumbs_up:` is a canonical name, so it converts even if you forget
the argument entirely. But `:smile_cat:` and `:thumbsup:` are aliases,
not canonical names, so they silently print back unchanged unless you
pass `language="alias"`, same as the Specification section above
shows.

</details>

## Style and Submission

Run these one at a time, from inside your `emojize` folder. If you're
coming back to this in a new terminal, reactivate your virtual
environment first (`source myvenv/bin/activate`) or `check50` will
report a missing `emoji` module even though your code is correct.

Check your style:

{% include copy-command.html command="style50 emojize.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/emojize" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/emojize" %}

<hr>

## Glossary

- **package** — Code someone else wrote that you can import into your
  own program, instead of writing it yourself. `emoji` is a package;
  `pip install` is how you get a copy of it onto your computer.
- **function** — A named, reusable block of code. `emojize()` is a
  function: you hand it a string, it hands back a new one.
- **parameter** — A value a function accepts as input, named in its
  definition. `emojize`'s `language` parameter controls which set of
  codes it recognizes.
- **alias** — A second, usually shorter, name for the same thing. Many
  emoji have one; `:thumbsup:` is an alias for `:thumbs_up:`.
