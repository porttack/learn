---
title: "Pathfinder"
order: 5
source: original
---

<figure id="fig-pathfinder-dial" class="pathfinder-hero">
  <div class="pathfinder-hero-row">
    <img src="{{ '/assets/img/cs50psets/pathfinder-lander.jpg' | relative_url }}" alt="A grainy 1997 photo taken by the Sojourner rover, looking back at the Pathfinder lander on the Martian surface, its camera mast standing up in the middle of the deflated airbags" class="pathfinder-photo">
    <canvas id="pathfinder-dial-canvas" width="270" height="410" role="img" aria-label="A dial of 16 signs, 0 through F, arranged in a circle, with a camera rotating in place at the center and shining a beam at the sign it is reading, while the hex digits and the letters they decode to accumulate in a sand tray below"></canvas>
  </div>
  <figcaption>NASA's real Pathfinder lander, photographed by the Sojourner rover on sol 33 (NASA/JPL-Caltech). Its camera, mounted on the mast in the middle of the picture, is what this problem is modeled on: it rotated in place, pausing at a sign to read a hex digit, then rotating to the next.</figcaption>
</figure>

<script>
(function () {
  var canvas = document.getElementById('pathfinder-dial-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var cssWidth = 270;
  var cssHeight = 410;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  ctx.scale(dpr, dpr);

  var digits = '0123456789ABCDEF';
  var dialX = 135, dialY = 105;
  var signRadius = 80, signSize = 11;
  var boardX = 5, boardY = 216, boardW = 260, boardH = 172;
  var dwellMs = 800;
  var travelMs = 650;
  var messagePauseMs = 5000;

  var messages = ['STATUS', 'SPACE PIRATE', 'NO DISCO', 'SCIENCE IT', 'PIRATE NINJA', 'BOTANY WINS', 'HI MOM', 'NOT DEAD', 'MORE POTATOES!'];
  var msgData = messages.map(function (m) {
    var bytes = [];
    for (var i = 0; i < m.length; i++) {
      var hex = m.charCodeAt(i).toString(16).toUpperCase();
      if (hex.length < 2) hex = '0' + hex;
      bytes.push({
        hex: hex,
        ch: m.charAt(i),
        d1: digits.indexOf(hex.charAt(0)),
        d2: digits.indexOf(hex.charAt(1))
      });
    }
    return bytes;
  });

  function angleForIndex(i) {
    return -Math.PI / 2 + i * (2 * Math.PI / 16);
  }

  function shortestAngleLerp(from, to, t) {
    var diff = to - from;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return from + diff * t;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function jitter() {
    return {
      jx: (Math.random() - 0.5) * 2.4,
      jy: (Math.random() - 0.5) * 3,
      jr: (Math.random() - 0.5) * 0.18
    };
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var msgIndex = 0, byteIndex = 0, digitPhase = 0;
  var columns = []; // one entry per byte: { h1, h2, letter, h1Jit, h2Jit, letterJit }
  var state = 'dwell';
  var stateStart = null;
  var fromAngle = angleForIndex(msgData[0][0].d1);
  var toAngle = fromAngle;

  function drawCamera(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#111111';
    ctx.fillRect(-9, -7, 18, 14);
    ctx.fillRect(-3, -11, 7, 5);
    ctx.beginPath();
    ctx.arc(9, 0, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#333333';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9, 0, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  }

  function drawDial(handAngle, highlightIndex) {
    for (var i = 0; i < 16; i++) {
      var angle = angleForIndex(i);
      var x = dialX + signRadius * Math.cos(angle);
      var y = dialY + signRadius * Math.sin(angle);
      var active = (i === highlightIndex);

      ctx.beginPath();
      ctx.arc(x, y, signSize, 0, 2 * Math.PI);
      ctx.fillStyle = active ? '#111111' : '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#dedede';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '12px SFMono-Regular, Consolas, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = active ? '#ffffff' : '#828282';
      ctx.fillText(digits.charAt(i), x, y + 1);
    }

    if (highlightIndex !== null) {
      var lensX = dialX + 9 * Math.cos(handAngle);
      var lensY = dialY + 9 * Math.sin(handAngle);
      var signX = dialX + signRadius * Math.cos(handAngle);
      var signY = dialY + signRadius * Math.sin(handAngle);
      var perpX = -Math.sin(handAngle);
      var perpY = Math.cos(handAngle);
      var halfWidth = signSize + 4;

      var grad = ctx.createLinearGradient(lensX, lensY, signX, signY);
      grad.addColorStop(0, 'rgba(230, 150, 40, 0.05)');
      grad.addColorStop(1, 'rgba(230, 150, 40, 0.55)');

      ctx.beginPath();
      ctx.moveTo(lensX, lensY);
      ctx.lineTo(signX + perpX * halfWidth, signY + perpY * halfWidth);
      ctx.lineTo(signX - perpX * halfWidth, signY - perpY * halfWidth);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // The real IMP camera sat fixed on a mast and rotated in place --
    // no arm reaching out toward what it was looking at.
    ctx.beginPath();
    ctx.arc(dialX, dialY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#cfcfcf';
    ctx.fill();

    drawCamera(dialX, dialY, handAngle);
  }

  function drawGlyph(ch, x, y, jit, font, color) {
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x + jit.jx, y + jit.jy);
    ctx.rotate(jit.jr);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  function drawBoard() {
    ctx.fillStyle = '#ddc9a0';
    ctx.strokeStyle = '#a98f5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boardX, boardY, boardW, boardH, 8);
    } else {
      ctx.rect(boardX, boardY, boardW, boardH);
    }
    ctx.fill();
    ctx.stroke();

    var startX = boardX + 18;
    var colWidth = 30;
    var maxColsPerRow = 7;
    var rowHeight = 68;
    var hexFont = '14px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
    var letterFont = 'bold 19px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
    var hexY = boardY + 34;
    var letterY = boardY + 72;

    for (var i = 0; i < columns.length; i++) {
      var col = columns[i];
      var row = Math.floor(i / maxColsPerRow);
      var c = i % maxColsPerRow;
      var x = startX + c * colWidth;
      var hy = hexY + row * rowHeight;
      var ly = letterY + row * rowHeight;
      drawGlyph(col.h1, x, hy, col.h1Jit, hexFont, '#7a5a35');
      if (col.h2) drawGlyph(col.h2, x + 9, hy, col.h2Jit, hexFont, '#7a5a35');
      if (col.letter) drawGlyph(col.letter, x + 4, ly, col.letterJit, letterFont, '#5c3a21');
    }
  }

  function render(handAngle, highlightIndex) {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    drawBoard();
    drawDial(handAngle, highlightIndex);
  }

  function revealDigit() {
    var bytes = msgData[msgIndex];
    var b = bytes[byteIndex];

    if (digitPhase === 0) {
      columns.push({ h1: b.hex.charAt(0), h2: null, letter: null, h1Jit: jitter(), h2Jit: null, letterJit: null });
      digitPhase = 1;
      fromAngle = toAngle;
      toAngle = angleForIndex(b.d2);
      state = 'travel';
    } else {
      var col = columns[columns.length - 1];
      col.h2 = b.hex.charAt(1);
      col.h2Jit = jitter();
      col.letter = b.ch;
      col.letterJit = jitter();

      if (byteIndex === bytes.length - 1) {
        // Last byte of the message: hold the finished word on screen
        // before erasing, instead of clearing it in this same tick.
        state = 'messagePause';
      } else {
        byteIndex += 1;
        digitPhase = 0;
        fromAngle = toAngle;
        toAngle = angleForIndex(bytes[byteIndex].d1);
        state = 'travel';
      }
    }
  }

  function startNextMessage() {
    msgIndex = (msgIndex + 1) % msgData.length;
    byteIndex = 0;
    digitPhase = 0;
    columns = [];
    fromAngle = toAngle;
    toAngle = angleForIndex(msgData[msgIndex][0].d1);
    state = 'travel';
  }

  function draw(t) {
    if (stateStart === null) stateStart = t;
    var elapsed = t - stateStart;

    if (state === 'dwell') {
      var bytes = msgData[msgIndex];
      var target = digitPhase === 0 ? bytes[byteIndex].d1 : bytes[byteIndex].d2;
      render(toAngle, target);
      if (elapsed > dwellMs) {
        revealDigit();
        stateStart = t;
      }
    } else if (state === 'messagePause') {
      render(toAngle, null);
      if (elapsed > messagePauseMs) {
        startNextMessage();
        stateStart = t;
      }
    } else {
      var progress = Math.min(elapsed / travelMs, 1);
      var eased = easeInOutQuad(progress);
      var current = shortestAngleLerp(fromAngle, toAngle, eased);
      render(current, null);
      if (progress >= 1) {
        state = 'dwell';
        stateStart = t;
      }
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  if (reduceMotion) {
    render(angleForIndex(msgData[0][0].d1), msgData[0][0].d1);
  } else {
    requestAnimationFrame(draw);
  }
})();
</script>

## Background

In *The Martian*, Mark Watney is stranded on Mars with no way to talk to
NASA directly. The only working camera nearby is on the old Pathfinder
rover, and all NASA can do with it is aim it: pan left or right, tilt up or
down, snap a picture. That's not nothing, though. NASA lays a grid of
hexadecimal digits, `0` through `F`, over the range the camera can point
to. Aim at one grid position, snap a picture, and Watney can read off one
hex digit. Two digits make one byte, and one byte, run through ASCII, is
one character. Point, shoot, point, shoot, and a sentence spells itself out
one letter at a time. (This isn't just movie invention: it's close to how
JPL engineers actually planned to talk back to the real Pathfinder rover if
its radio ever failed.)

There's no room on a rover's camera grid for a space bar. In this problem,
the message you're decoding is one unbroken string of hex digits, exactly
like it would arrive from Mars: no spaces, no punctuation, no separators
between one letter's two digits and the next letter's two digits.

<div class="pset-demo">
  <label for="pathfinder-input">Transmission (hex):</label>
  <input type="text" id="pathfinder-input" placeholder="e.g. 48656C6C6F" autocomplete="off">
  <p id="pathfinder-result"></p>
</div>

<script>
(function () {
  var input = document.getElementById('pathfinder-input');
  var result = document.getElementById('pathfinder-result');
  if (!input || !result) return;

  function update() {
    var cleaned = input.value.replace(/\s+/g, '').toUpperCase();
    if (cleaned.length === 0) {
      result.textContent = '';
      return;
    }
    if (!/^[0-9A-F]+$/.test(cleaned)) {
      result.textContent = 'Only hex digits (0-9, A-F) allowed.';
      return;
    }
    if (cleaned.length % 2 !== 0) {
      result.textContent = 'Need an even number of digits: two per byte.';
      return;
    }
    var out = '';
    for (var i = 0; i < cleaned.length; i += 2) {
      out += String.fromCharCode(parseInt(cleaned.substr(i, 2), 16));
    }
    result.textContent = out;
  }

  input.addEventListener('input', update);
})();
</script>

Try `48656C6C6F` above to see how it works, then see the specification
below for what your own program needs to do.

## Getting Started

Log into cs50.dev, click on your terminal window, and run:

```
cd
mkdir pathfinder
cd pathfinder
code pathfinder.py
```

That creates a new folder called `pathfinder`, moves into it, and opens a
new, empty file called `pathfinder.py` for you to edit.

## Specification

Implement a program, `pathfinder.py`, that decodes a hexadecimal
transmission from Mars back into the message it spells out.

- Print `Transmission: ` (with a trailing space, no newline) and prompt
  the user for a string of hex digits with `input()`.
- You can assume the transmission is well-formed: an even-length string
  of hexadecimal digits (`0`-`9`, `A`-`F`), with no spaces or other
  characters mixed in.
- Every two characters is one byte. Convert each byte to the character it
  represents in ASCII, and build up the decoded message one byte at a
  time.
- Print the decoded message, followed by a newline.

## Usage

Your program should behave like the demo below.

<div class="terminal-demo">
  <div class="terminal-demo-bar">
    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
  </div>
  <pre><code id="pathfinder-usage-terminal"></code><span class="terminal-cursor">&nbsp;</span></pre>
</div>

<pre class="terminal-demo-print">$ python pathfinder.py
Transmission: 535441545553
STATUS

$ python pathfinder.py
Transmission: 4849204D4F4D
HI MOM

$ python pathfinder.py
Transmission: 4E4F542044454144
NOT DEAD
</pre>

<script>
(function () {
  var el = document.getElementById('pathfinder-usage-terminal');
  if (!el) return;

  var script = [
    { text: '$ ', type: false },
    { text: 'python pathfinder.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Transmission: ', type: false },
    { text: '535441545553\n', type: true, speed: 150 },
    { text: 'STATUS\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python pathfinder.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Transmission: ', type: false },
    { text: '4849204D4F4D\n', type: true, speed: 150 },
    { text: 'HI MOM\n\n', type: false },
    { text: '$ ', type: false },
    { text: 'python pathfinder.py', type: true, speed: 90 },
    { text: '\n', type: false },
    { text: 'Transmission: ', type: false },
    { text: '4E4F542044454144\n', type: true, speed: 150 },
    { text: 'NOT DEAD\n', type: false }
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

## Hints

- You can walk a string two characters at a time with
  `range(0, len(s), 2)`, taking a two-character slice `s[i:i+2]` on each
  pass.
- `int(pair, 16)` converts a two-character hex string into the integer it
  represents, the same way `int("42")` converts a decimal string, just in
  base 16 instead of base 10.
- `chr()` converts that integer into the character it corresponds to in
  ASCII, the reverse of what `ord()` does.
- Build up the decoded message by concatenating characters onto a string
  in a loop, the same way you would in Caesar.

## To Get Full Credit

It's more important that you submit a working solution than that you do
everything below. Submit early, then keep improving and resubmit as many
times as you like.

- Structure your program with at least one function besides `main()`. You
  might write one to decode the transmission, or one to convert a single
  byte to a character; that part's up to you.
- At the end of the program, add a comment describing any challenges you
  ran into or what you'd improve if you did this again. A sentence or two
  is fine.

## Bonus

For extra credit: NASA isn't the only one who needs to send a message.
If your program is run with a single command-line argument, `-e`, have it
encode instead of decode: print `Message: ` (with a trailing space, no
newline), prompt for a line of plain text with `input()`, and print its
hex encoding instead, uppercase, two digits per character, with no spaces
between them.

```
$ python pathfinder.py -e
Message: Hello
48656C6C6F
```

Your program should still decode as before when run with no arguments;
check50 needs that to still pass.

## Style and Submission

Run these one at a time, from inside your `pathfinder` folder.

Check your style:

{% include copy-command.html command="style50 pathfinder.py" %}

Check your correctness:

{% include copy-command.html command="check50 porttack/cs50/problems/py/pathfinder" %}

Submit your work:

{% include copy-command.html command="submit50 porttack/cs50/problems/py/pathfinder" %}
