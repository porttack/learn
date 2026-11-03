---
title: "Square Grid"
order: 4.5
chapter: 4.5
source: original
subtitle: "Build a hollow square as a 2D list, then print it."
---

<figure id="fig-square-grid-spiral" class="pset-hero-compact">
  <canvas id="square-grid-spiral-canvas" width="260" height="260" role="img" aria-label="Nine nested squares, slowly rotating at different speeds, creating a hypnotic spiral illusion"></canvas>
</figure>

<script>
(function () {
  var canvas = document.getElementById('square-grid-spiral-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var cssSize = 260;
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  ctx.scale(dpr, dpr);

  var rings = [];
  var count = 9;
  var size = 164;
  var factor = 0.82;
  for (var i = 0; i < count; i++) {
    rings.push({
      size: size,
      baseAngle: i * (Math.PI / 15),
      speed: (i % 2 === 0 ? 1 : -1) * (0.00005 + i * 0.000007),
      dark: i % 2 === 0
    });
    size *= factor;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(t) {
    ctx.clearRect(0, 0, cssSize, cssSize);
    ctx.save();
    ctx.translate(cssSize / 2, cssSize / 2);
    for (var i = 0; i < rings.length; i++) {
      var ring = rings[i];
      var angle = ring.baseAngle + (reduceMotion ? 0 : t * ring.speed);
      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = ring.dark ? '#111111' : '#828282';
      ctx.lineWidth = 2.5 - i * 0.08;
      ctx.strokeRect(-ring.size / 2, -ring.size / 2, ring.size, ring.size);
      ctx.restore();
    }
    ctx.restore();
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
</script>

## Background

This is the same picture you drew in [Square](/cs50-psets/square/): a
hollow square of hash (`#`) characters. This time, your program stores
the square in memory first, as a list of rows, and only then prints it
from that list.

Games, images, and spreadsheets all store data this way: rows of
columns. Once you can build a grid and read it back, you can do the
same with a game board or a tiny picture.

<div class="pset-demo">
  <label for="square-grid-size">Size (2-8):</label>
  <input type="number" id="square-grid-size" value="4" min="2" max="8" step="1">
  <pre id="square-grid-result"></pre>
</div>

<script>
(function () {
  var sizeInput = document.getElementById('square-grid-size');
  var result = document.getElementById('square-grid-result');
  if (!sizeInput || !result) return;

  function update() {
    var n = parseInt(sizeInput.value, 10);
    var ch = '#';
    if (isNaN(n) || n < 2 || n > 8) {
      result.textContent = '';
      return;
    }
    var rows = [];
    for (var r = 0; r < n; r++) {
      var row = '';
      for (var c = 0; c < n; c++) {
        var edge = (r === 0 || r === n - 1 || c === 0 || c === n - 1);
        row += edge ? ch : ' ';
      }
      rows.push(row);
    }
    result.textContent = rows.join('\n');
  }

  sizeInput.addEventListener('input', update);
  update();
})();
</script>

This shows what your program's output should look like for any size;
it doesn't validate input the way your program needs to.

## Learning Objectives

- 2D lists (lists of lists)
- Indexing with `grid[row][col]`
- Nested loops with `range()`
- Building lists with `append()`
- Docstrings and doctests
- A function that returns a value

## Specification

Implement a program, `square_grid.py`, that builds a hollow square of
hash characters as a 2D list, then prints it.

- Prompt the user to enter a square size.
- Validate that the size is an integer between 2 and 8, inclusive. If
  the user enters something that isn't an integer, or an integer
  outside that range, don't print an error message: just prompt again.
- Implement `build_grid(size)`, which returns a 2D list: a list of
  `size` rows, where each row is a list of `size` one-character
  strings. Hash (`#`) goes along the top row, the bottom row, the first
  column, and the last column, with a space everywhere else in
  between. Build each row by starting from an empty list and calling
  `append`, and build the grid the same way.
- Implement `print_grid(grid)`, which prints the grid one row per
  line. Printing a row list directly would show brackets and quotes,
  so you'll need to turn each row back into a string first.
- Have `main()` get a valid size (with `get_size()`, or an equivalent
  of your own), call `build_grid`, then call `print_grid`.

For example, a size of 3 should print:

```
###
# #
###
```

And a size of 4 should print:

```
####
#  #
#  #
####
```

Behind the scenes, `build_grid(3)` should return this list of three
rows, which `print_grid` then prints one row at a time:

```
[['#', '#', '#'], ['#', ' ', '#'], ['#', '#', '#']]
```

<aside class="callout note" markdown="1">
**NOTE**

There's a tempting shortcut for building a grid, and it's a trap. This
looks like a 3-by-3 grid of spaces:

```python
grid = [[" "] * 3] * 3
grid[0][0] = "#"
print(grid)
```

But it prints this:

```
[['#', ' ', ' '], ['#', ' ', ' '], ['#', ' ', ' ']]
```

All three rows changed, not just the top one. `[" "] * 3` makes one
row, and the outer `* 3` doesn't make three rows: it puts three
references to that one row into the list. `grid[0] is grid[1]` is
`True`, so changing a cell through one row changes it in every row.
This is the aliasing you saw in the list mutation lesson. To get rows
that don't affect each other, each row has to be its own list.
</aside>

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- `build_grid` and `print_grid` both exist, and each has a docstring.
- `build_grid`'s doctests pass. Check them by running
  `python -m doctest square_grid.py -v` from inside your `square_grid`
  folder; the doctests are already in the starter code below.
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="square-grid-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python square_grid.py
Size: 0
Size: -1
Size: 9
Size: 2
##
##

$ python square_grid.py
Size: 4
####
#  #
#  #
####
</pre>

<script>
(function () {
  var el = document.getElementById('square-grid-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python square_grid.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Size: ', type: false },
    { text: '0\n', type: true, speed: 150 },
    { text: 'Size: ', type: false },
    { text: '-1\n', type: true, speed: 150 },
    { text: 'Size: ', type: false },
    { text: '9\n', type: true, speed: 150 },
    { text: 'Size: ', type: false },
    { text: '2\n', type: true, speed: 150 },
    { text: '##\n##\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python square_grid.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Size: ', type: false },
    { text: '4\n', type: true, speed: 150 },
    { text: '####\n#  #\n#  #\n####\n', type: false }
  ];

  var pauseBetweenLoops = 3200;
  var pauseBetweenLines = 550;

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

## Bonus

For extra credit, implement `stretch(grid)`, which returns a taller
version of the square. Use the list method `insert()` to add a copy of
a middle row, such as `grid[1]`. Add a doctest of your own to
`stretch` that shows the number of rows went up. Inserting `grid[1]`
without copying it first puts the same row in the grid twice, which is
the aliasing bug from the note above.

Then, if you run your program with the single command-line argument
`stretch`, print the stretched grid instead of the original.

```
$ python square_grid.py stretch
Size: 3
###
# #
# #
###
```

Your program should still work fine with zero arguments; check50 needs
that to still pass.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir square_grid
cd square_grid
code square_grid.py
```

That creates a new folder called `square_grid`, moves into it, and
opens a new, empty file called `square_grid.py` for you to edit.

## Starter Code

Paste this into `square_grid.py` to start from. `get_size`,
`build_grid`, and `print_grid` are stubbed out with `pass`, and
`build_grid` comes with two `>>>` doctest examples; run
`python -m doctest square_grid.py -v` from inside your `square_grid`
folder to check them. They'll fail until you replace `pass` with real
code. With `-v`, doctest lists every example it ran and ends with a
summary of how many passed.

The last two lines make `main()` run when you run
`python square_grid.py`, but not when doctest loads your file to test
it. Leave them at the bottom.

```python
# Student Initials:
"""
Square Grid

Slug: porttack/cs50/problems/py/squaregrid
Doctests: python -m doctest square_grid.py -v
"""


def main():
    # Get a valid size, build the grid, then print it, in that order.
    pass


def get_size():
    """Prompt until the user enters an integer from 2 to 8, then return it."""
    pass


def build_grid(size):
    """
    Return a size-by-size 2D list for a hollow square: '#' along the
    border and ' ' everywhere else.

    >>> build_grid(2)
    [['#', '#'], ['#', '#']]
    >>> build_grid(3)[1]
    ['#', ' ', '#']
    """
    pass


def print_grid(grid):
    """Print grid, one row per line."""
    pass


if __name__ == "__main__":
    main()
```

## Style and Submission

Run these one at a time, from inside your `square_grid` folder.

Check your style:

{% include copy-command.html command="style50 square_grid.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/squaregrid" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/squaregrid" %}

<hr>

## Glossary

- **loop**: A statement that runs one or more statements, often
  repeatedly. (AP calls this iteration.)
- **conditional statement**: A statement that controls the flow of
  execution depending on some condition. Informally, this is usually
  an if statement, which might include an elif and an else. (AP calls
  this selection.)
- **boolean expression**: An expression whose value is either True or
  False.
- **2D list**: A list whose elements are lists; often thought of as
  rows and columns.
- **index**: The position of an element in a list, starting at 0 in
  Python.
- **alias**: Two names (or two list slots) that refer to the same
  object.

