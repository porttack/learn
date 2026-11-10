---
title: "Pizza"
order: 12
chapter: 12
source: cs50-python
source_url: "https://cs50.harvard.edu/python/psets/6/pizza/"
source_unit: "Week 6 File I/O"
source_unit_url: "https://cs50.harvard.edu/python/weeks/6/"
subtitle: "Read a pizza menu from a CSV file and print it as a table, checking the command line first."
---

<div class="video-embed">
  <iframe src="https://www.youtube.com/embed/TkABR72j7jU?rel=0" title="Pinocchio's Pizza & Subs, Harvard Square" frameborder="0" allowfullscreen></iframe>
</div>

<figure id="fig-pizza-csv-table" class="pset-hero">
  <svg viewBox="0 0 400 170" role="img" aria-labelledby="pizza-csv-title">
    <title id="pizza-csv-title">A few lines of comma-separated text on the left, with an arrow pointing right to the same information drawn as a table with a header row</title>
    <defs>
      <marker id="pizza-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#111"/>
      </marker>
    </defs>
    <rect x="10" y="30" width="168" height="110" rx="10" fill="#f2f2f2" stroke="#ccc"/>
    <g font-family="SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace" font-size="10" fill="#111">
      <text x="20" y="56">Regular,Small,Large</text>
      <text x="20" y="78">Cheese,$13.50,$18.95</text>
      <text x="20" y="100">1 topping,$14.75,$20.95</text>
      <text x="20" y="122">Special,$18.50,$26.95</text>
    </g>
    <line x1="186" y1="85" x2="222" y2="85" stroke="#111" stroke-width="2" marker-end="url(#pizza-arrow)"/>
    <g stroke="#111" stroke-width="1.5" fill="#fff">
      <rect x="230" y="30" width="160" height="110"/>
      <rect x="230" y="30" width="160" height="27" fill="#e8e8e8"/>
      <line x1="230" y1="84" x2="390" y2="84"/>
      <line x1="230" y1="112" x2="390" y2="112"/>
      <line x1="290" y1="30" x2="290" y2="140"/>
      <line x1="342" y1="30" x2="342" y2="140"/>
    </g>
    <g font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#111">
      <text x="236" y="48" font-weight="bold">Regular</text>
      <text x="296" y="48" font-weight="bold">Small</text>
      <text x="348" y="48" font-weight="bold">Large</text>
      <text x="236" y="75">Cheese</text>
      <text x="296" y="75">$13.50</text>
      <text x="348" y="75">$18.95</text>
      <text x="236" y="103">1 topping</text>
      <text x="296" y="103">$14.75</text>
      <text x="348" y="103">$20.95</text>
      <text x="236" y="131">Special</text>
      <text x="296" y="131">$18.50</text>
      <text x="348" y="131">$26.95</text>
    </g>
  </svg>
  <figcaption>A CSV file is just text with commas. Your program turns it into a table people can read.</figcaption>
</figure>

## Background

Perhaps the most popular place for pizza in Harvard Square is
Pinocchio's Pizza & Subs, aka Noch's, known for its Sicilian pizza,
which is "a deep-dish or thick-crust pizza."

Students tend to buy pizza by the slice, but Pinocchio's also has
whole pizzas on its menu. Here is the menu for its Sicilian pizzas as a
CSV file, `sicilian.csv`:

```
Sicilian Pizza,Small,Large
Cheese,$25.50,$39.95
1 item,$27.50,$41.95
2 items,$29.50,$43.95
3 items,$31.50,$45.95
Special,$33.50,$47.95
```

There's a second file, `regular.csv`, for the regular pizzas. A CSV
file (short for "comma-separated values") has one row per line, with a
comma between each column. The first row holds the column names.

A CSV file isn't the most customer-friendly format to look at. A table
drawn in ASCII art would be nicer. You'll write a program that reads
one of these files and prints it that way, using a package called
`tabulate` to do the drawing.

Here's a quick look at the program you're about to write. Pick a
command and see what it prints.

<div class="pset-demo">
  <label for="pizza-try-select">Run this command:</label>
  <select id="pizza-try-select">
    <option value="regular.csv">python pizza.py regular.csv</option>
    <option value="sicilian.csv">python pizza.py sicilian.csv</option>
    <option value="">python pizza.py</option>
    <option value="regular.csv sicilian.csv">python pizza.py regular.csv sicilian.csv</option>
    <option value="sicilian.txt">python pizza.py sicilian.txt</option>
    <option value="invalid_file.csv">python pizza.py invalid_file.csv</option>
  </select>
  <pre><span id="pizza-try-command"></span>
<span id="pizza-try-output"></span></pre>
</div>

<script src="{{ '/assets/js/pizza-demo.js' | relative_url }}" defer></script>

The demo has both menus built in. Your program will read the file from
disk instead, which is where `open` and the `csv` module come in.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir pizza
cd pizza
code pizza.py
```

That creates a new folder called `pizza`, moves into it, and opens a
new, empty file called `pizza.py` for you to edit.

Next, create and activate a virtual environment, the same way you did
for Emojize, so the `tabulate` package stays scoped to this project:

```
python -m venv myvenv
source myvenv/bin/activate
```

You'll know it worked because your prompt starts showing `(myvenv)`. If
you come back in a new terminal, `cd` into `pizza` and run **`source
myvenv/bin/activate`** again before anything else.

Install `tabulate`, which does the table drawing for you:

{% include copy-command.html command="pip install tabulate" %}

Then download the two menus into your `pizza` folder:

```
wget https://learn.porttack.com/assets/data/cs50psets/pizza/regular.csv
wget https://learn.porttack.com/assets/data/cs50psets/pizza/sicilian.csv
```

Run `ls` to make sure both files are there. Use `cat regular.csv` to
look inside one.

## Starter Code

Paste this into `pizza.py` to start from. `check_args` and
`format_table` are stubbed out with `pass` and doctest examples; run
`python3 -m doctest pizza.py` from inside your `pizza` folder to check
them. They'll fail until you replace `pass` with real code. (The
doctests call `tabulate`, so your virtual environment needs to be
active.)

`main` and `read_rows` are left as comments on purpose. Reading a file
and exiting with a message are things a docstring can't check, so
`check50` does that part.

```python
# Student Initials:
"""
Pizza

Slug: porttack/cs50/problems/py/pizza
Doctests: python3 -m doctest pizza.py
"""

import csv
import sys

from tabulate import tabulate


def main():
    # Call check_args with sys.argv. If it returns a message, exit with
    # that message using sys.exit. Otherwise read the rows from the
    # file named in sys.argv[1] with read_rows. If the file doesn't
    # exist, exit with "File does not exist". Then print the result of
    # format_table.
    pass


def check_args(argv):
    """
    Takes the list of command-line arguments, program name included.
    Returns a message saying what is wrong with it, or None if it is
    fine.

    >>> check_args(["pizza.py"])
    'Too few command-line arguments'
    >>> check_args(["pizza.py", "regular.csv", "sicilian.csv"])
    'Too many command-line arguments'
    >>> check_args(["pizza.py", "menu.txt"])
    'Not a CSV file'
    >>> print(check_args(["pizza.py", "regular.csv"]))
    None
    """
    pass


def read_rows(filename):
    # Open the file and return its rows as a list of lists, header row
    # first. The csv module's reader will split each line for you.
    pass


def format_table(rows):
    """
    Takes a list of rows, header row first, and returns the table as a
    string, drawn in the "grid" format.

    >>> print(format_table([["Drink", "Price"], ["Soda", "$2.00"]]))
    +---------+---------+
    | Drink   | Price   |
    +=========+=========+
    | Soda    | $2.00   |
    +---------+---------+
    """
    pass


if __name__ == "__main__":
    main()
```

## Specification

Implement a program, in `pizza.py`, that expects exactly one
command-line argument, the name (or path) of a CSV file, and outputs
that file's contents as an ASCII art table.

- Use `tabulate` with its `grid` table format. The first row of the
  file is the header.
- Exit via `sys.exit` with the message `Too few command-line arguments`
  if the user does not specify exactly one command-line argument, or
  `Too many command-line arguments` if they specify more than one.
- Exit via `sys.exit` with `Not a CSV file` if the specified file's
  name does not end in `.csv`.
- Exit via `sys.exit` with `File does not exist` if the specified file
  does not exist.
- Your program should work with any CSV file in this shape, not just
  the two pizza menus.

## Usage

Your program should behave like the examples below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="pizza-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python pizza.py
Too few command-line arguments

$ python pizza.py regular.csv sicilian.csv
Too many command-line arguments

$ python pizza.py sicilian.txt
Not a CSV file

$ python pizza.py invalid_file.csv
File does not exist

$ python pizza.py regular.csv
+-----------------+---------+---------+
| Regular Pizza   | Small   | Large   |
+=================+=========+=========+
| Cheese          | $13.50  | $18.95  |
+-----------------+---------+---------+
| 1 topping       | $14.75  | $20.95  |
+-----------------+---------+---------+
| 2 toppings      | $15.95  | $22.95  |
+-----------------+---------+---------+
| 3 toppings      | $16.95  | $24.95  |
+-----------------+---------+---------+
| Special         | $18.50  | $26.95  |
+-----------------+---------+---------+
</pre>

<script>
(function () {
  var el = document.getElementById('pizza-usage-terminal');
  if (!el) return;

  var table = [
    '+-----------------+---------+---------+',
    '| Regular Pizza   | Small   | Large   |',
    '+=================+=========+=========+',
    '| Cheese          | $13.50  | $18.95  |',
    '+-----------------+---------+---------+',
    '| 1 topping       | $14.75  | $20.95  |',
    '+-----------------+---------+---------+',
    '| 2 toppings      | $15.95  | $22.95  |',
    '+-----------------+---------+---------+',
    '| 3 toppings      | $16.95  | $24.95  |',
    '+-----------------+---------+---------+',
    '| Special         | $18.50  | $26.95  |',
    '+-----------------+---------+---------+'
  ].join('\n') + '\n';

  var script = [
    { text: '$ ', type: false },
    { text: 'python pizza.py', type: true, speed: 90 },
    { text: '\nToo few command-line arguments\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python pizza.py sicilian.txt', type: true, speed: 70 },
    { text: '\nNot a CSV file\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python pizza.py invalid_file.csv', type: true, speed: 60 },
    { text: '\nFile does not exist\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python pizza.py regular.csv', type: true, speed: 80 },
    { text: '\n' + table, type: false }
  ];

  var pauseBetweenLoops = 4200;
  var pauseBetweenLines = 600;

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

- The `csv` module has a `reader` that turns each line of a file into
  a list of strings, so a whole file becomes a list of lists.
- `open` raises `FileNotFoundError` when the file isn't there. A
  `try` and `except` is how you catch it.
- `tabulate` has just one function, also called `tabulate`. Give it
  the body rows, then `headers=` for the first row, then
  `tablefmt="grid"`. Its documentation lists every format it knows.
- Check the arguments before you try to open anything. A file called
  `sicilian.txt` should get "Not a CSV file" even if it exists.
- `str.endswith()` is a handy way to look at the end of a filename.

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

The first row of the file is the header, and everything after it is the
body of the table. If you have all the rows in a list called `rows`,
then `rows[0]` is the header and `rows[1:]` is the body.

</details>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Fill in `check_args` and `format_table` with real code, and add one
  more `>>>` example of your own to each docstring covering a case not
  already shown (a file name with `.csv` in the middle, like
  `my.csv.txt`, for `check_args`, for instance). Don't try to doctest
  `main` or `read_rows`; they depend on files and on the command line.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Style and Submission

Run these one at a time, from inside your `pizza` folder. If you're
coming back in a new terminal, reactivate your virtual environment
first (`source myvenv/bin/activate`) or `check50` will report a
missing `tabulate` module even though your code is correct.

Check your style:

{% include copy-command.html command="style50 pizza.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/pizza" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/pizza" %}

<hr>

## Glossary

- **CSV** (comma-separated values): A plain text file where each line
  is a row and commas separate the columns.
- **command-line argument**: A word typed after the program's name,
  like `regular.csv` in `python pizza.py regular.csv`. Python collects
  them in the list `sys.argv`, with the program's own name first.
- **exception**: What Python raises when something goes wrong, such as
  `FileNotFoundError` when a file isn't there. A `try` and `except`
  catches it instead of crashing.
- **package**: Code someone else wrote that you can import, such as
  `tabulate`.
