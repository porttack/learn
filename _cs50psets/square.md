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
- At the end of the program, add a comment describing any challenges
  you ran into or what you'd improve if you did this again. A sentence
  or two is fine.

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="square-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python square.py
Size: 0
Size: -1
Size: 9
Size: 2
##
##

$ python square.py
Size: 4
####
#  #
#  #
####
</pre>

<script>
(function () {
  var el = document.getElementById('square-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python square.py', type: true, speed: 90 },
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
    { text: 'python square.py', type: true, speed: 90 },
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

**AP CSP:** [3.5 Boolean Expressions](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.5), [3.8 Iteration](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.8), [3.13 Developing Procedures](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.13) (Big Idea 3, 30–35% of the exam). Also [3.7 Nested Conditionals](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.7), headers only — the edge test reads like a nested condition even when it's written as one boolean expression.
**California 9-12:** [9-12.AP.14](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.AP.14), [9-12.AP.16](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.AP.16)
**CSTA 2026:** [HS-ALG-PS-02](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-ALG-PS-02), [HS-PRO-PD-12](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-PRO-PD-12)
**CA CTE (ICT):** [C4.9](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.9), [C5.4](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C5.4) (Pathway C).

Testing whether a cell is on the border is 3.5's Boolean expression
doing the work a nested conditional (3.7) would do more verbosely. The
required helper function is 3.13 and AP.16's "break it into
procedures" in practice, and ICT's C4.9. Running check50 against your
solution is C5.4's "testing is a distinct step."
