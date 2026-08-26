---
title: "Square"
order: 4
source: original
---

<figure id="fig-square-spiral" class="pset-hero-compact">
  <canvas id="square-spiral-canvas" width="260" height="260" role="img" aria-label="Nine nested squares, slowly rotating at different speeds, creating a hypnotic spiral illusion"></canvas>
</figure>

<script>
(function () {
  var canvas = document.getElementById('square-spiral-canvas');
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

In [Mario (less comfortable)](/cs50-psets/mario-less/), you built a
half-pyramid out of hash (`#`) characters. In this problem, you'll
build a square instead, but a hollow one: hashes around the edge,
spaces in the middle.

<div class="pset-demo">
  <label for="square-size">Size (2-8):</label>
  <input type="number" id="square-size" value="4" min="2" max="8" step="1">
  <label for="square-char">Character:</label>
  <input type="text" id="square-char" value="#" maxlength="1">
  <pre id="square-result"></pre>
</div>

<script>
(function () {
  var sizeInput = document.getElementById('square-size');
  var charInput = document.getElementById('square-char');
  var result = document.getElementById('square-result');
  if (!sizeInput || !charInput || !result) return;

  function update() {
    var n = parseInt(sizeInput.value, 10);
    var ch = (charInput.value || '#').charAt(0) || '#';
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
  charInput.addEventListener('input', update);
  update();
})();
</script>

This shows what your program's output should look like for any size
and character; it doesn't validate input the way your program needs
to.

## Learning Objectives

- Repetition with loops
- Input validation
- Boolean expressions and conditionals
- `print()` with and without a trailing newline
- A function beyond `main()`

## Specification

Implement a program, `square.py`, that builds a hollow square of hash
characters.

- Prompt the user to enter a square size.
- Validate that the size is an integer between 2 and 8, inclusive. If
  the user enters something that isn't an integer, or an integer
  outside that range, don't print an error message: just prompt again.
- Once you have a valid size, print a hollow square of that size using
  hash (`#`) characters: hashes along the top row, the bottom row, the
  first column, and the last column, with spaces everywhere else in
  between.

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

## To Get Full Credit

It's more important that you submit a working solution than that you
do everything below. Submit early, then keep improving and resubmit as
many times as you like.

- Structure your program with at least one function besides `main()`.
  You might write one to build the square, or one to prompt for and
  validate the size; that part's up to you.
- Put your name on the first line of the file, as a comment.
- After your name, add a comment with this question, and answer it in
  at least two complete sentences: *What challenges did you face while
  solving this problem? How did you overcome them? If you were to do
  this again, what would you change or improve in your solution?*

## Usage

Your program should behave per the examples below. The underlined text
is what a user has typed.

```
$ python square.py
Size: 0
Size: -1
Size: 9
Size: 2
##
##
```

```
$ python square.py
Size: 4
####
#  #
#  #
####
```

## Bonus

For extra credit: if you run your program with a single command-line
argument that's exactly one character, use that character instead of
`#` when printing the square.

```
$ python square.py x
Size: 3
xxx
x x
xxx
```

Your program should still work fine with zero arguments; check50 needs
that to still pass.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir square
cd square
code square.py
```

That creates a new folder called `square`, moves into it, and opens a
new, empty file called `square.py` for you to edit.

## Style and Submission

Run these one at a time, from inside your `square` folder.

Check your style:

{% include copy-command.html command="style50 square.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/square" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/square" %}
