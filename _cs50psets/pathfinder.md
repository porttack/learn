---
title: "Pathfinder"
order: 2
source: original
---

<figure id="fig-pathfinder-dial" class="pathfinder-hero">
  <div class="pathfinder-hero-row">
    <img src="{{ '/assets/img/cs50psets/pathfinder-lander.jpg' | relative_url }}" alt="A grainy 1997 photo taken by the Sojourner rover, looking back at the Pathfinder lander on the Martian surface, its camera mast standing up in the middle of the deflated airbags" class="pathfinder-photo">
    <div class="pathfinder-canvas-wrap">
      <canvas id="pathfinder-dial-canvas" width="270" height="450" role="img" aria-label="A dial of 16 signs, 0 through F, arranged in a circle, with a camera rotating in place at the center and shining a beam at the sign it is reading, while the hex digits accumulate in a sand tray below. Once a full word's hex digits are written, a button in the corner of the tray translates them into letters."></canvas>
      <button type="button" id="pathfinder-translate-btn" class="pathfinder-translate-btn" disabled>Translate to ASCII</button>
      <button type="button" class="hex-quickref-toggle" id="hex-quickref-toggle" aria-expanded="false">Hex ref</button>
    </div>
  </div>
  <div class="hex-quickref-panel" id="hex-quickref-panel">
    <p class="hex-quickref-hint">Click a letter to guess the next one.</p>
    <table>
      <tr>
        <td data-ch="A"><span class="qr-ch">A</span><span class="qr-hex">41</span></td>
        <td data-ch="B"><span class="qr-ch">B</span><span class="qr-hex">42</span></td>
        <td data-ch="C"><span class="qr-ch">C</span><span class="qr-hex">43</span></td>
        <td data-ch="D"><span class="qr-ch">D</span><span class="qr-hex">44</span></td>
        <td data-ch="E"><span class="qr-ch">E</span><span class="qr-hex">45</span></td>
        <td data-ch="F"><span class="qr-ch">F</span><span class="qr-hex">46</span></td>
      </tr>
      <tr>
        <td data-ch="G"><span class="qr-ch">G</span><span class="qr-hex">47</span></td>
        <td data-ch="H"><span class="qr-ch">H</span><span class="qr-hex">48</span></td>
        <td data-ch="I"><span class="qr-ch">I</span><span class="qr-hex">49</span></td>
        <td data-ch="J"><span class="qr-ch">J</span><span class="qr-hex">4A</span></td>
        <td data-ch="K"><span class="qr-ch">K</span><span class="qr-hex">4B</span></td>
        <td data-ch="L"><span class="qr-ch">L</span><span class="qr-hex">4C</span></td>
      </tr>
      <tr>
        <td data-ch="M"><span class="qr-ch">M</span><span class="qr-hex">4D</span></td>
        <td data-ch="N"><span class="qr-ch">N</span><span class="qr-hex">4E</span></td>
        <td data-ch="O"><span class="qr-ch">O</span><span class="qr-hex">4F</span></td>
        <td data-ch="P"><span class="qr-ch">P</span><span class="qr-hex">50</span></td>
        <td data-ch="Q"><span class="qr-ch">Q</span><span class="qr-hex">51</span></td>
        <td data-ch="R"><span class="qr-ch">R</span><span class="qr-hex">52</span></td>
      </tr>
      <tr>
        <td data-ch="S"><span class="qr-ch">S</span><span class="qr-hex">53</span></td>
        <td data-ch="T"><span class="qr-ch">T</span><span class="qr-hex">54</span></td>
        <td data-ch="U"><span class="qr-ch">U</span><span class="qr-hex">55</span></td>
        <td data-ch="V"><span class="qr-ch">V</span><span class="qr-hex">56</span></td>
        <td data-ch="W"><span class="qr-ch">W</span><span class="qr-hex">57</span></td>
        <td data-ch="X"><span class="qr-ch">X</span><span class="qr-hex">58</span></td>
      </tr>
      <tr>
        <td data-ch="Y"><span class="qr-ch">Y</span><span class="qr-hex">59</span></td>
        <td data-ch="Z"><span class="qr-ch">Z</span><span class="qr-hex">5A</span></td>
        <td data-ch=" "><span class="qr-ch">SP</span><span class="qr-hex">20</span></td>
        <td data-ch="!"><span class="qr-ch">!</span><span class="qr-hex">21</span></td>
        <td data-ch="?"><span class="qr-ch">?</span><span class="qr-hex">3F</span></td>
        <td></td>
      </tr>
    </table>
    <a class="hex-quickref-link" href="{{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}">Full ASCII / hex table &rarr;</a>
  </div>
  <figcaption>NASA's real Pathfinder lander, photographed by the Sojourner rover on sol 33 (NASA/JPL-Caltech). Its camera, mounted on the mast in the middle of the picture, is what this problem is modeled on: it rotated in place, pausing at a sign to read a hex digit, then rotating to the next. Try decoding the hex yourself before you click; the <a href="{{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}">ASCII / hex table</a> can help.</figcaption>
</figure>

<script>
(function () {
  var canvas = document.getElementById('pathfinder-dial-canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var cssWidth = 270;
  var cssHeight = 450;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  ctx.scale(dpr, dpr);

  var digits = '0123456789ABCDEF';
  var dialX = 135, dialY = 105;
  var signRadius = 80, signSize = 11;
  var boardX = 5, boardY = 216, boardW = 260, boardH = 212;
  var dwellMs = 800;
  var travelMs = 650;
  var interactionTimeoutMs = 20000;
  var translateBtn = document.getElementById('pathfinder-translate-btn');

  var messages = ['HOWALIVE?', 'STATUS', 'SPACE PIRATE', 'NO DISCO', 'SCIENCE IT', 'PIRATE NINJA', 'BOTANY WINS', 'HI MOM', 'NOT DEAD', 'MORE POTATOES!'];
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

  // When the next sign to read is the same one the camera is already
  // sitting on, the shortest path is zero degrees -- indistinguishable
  // from not moving at all. Spin all the way around instead, so a
  // repeated digit is still visibly a new reading.
  function fullLoopLerp(from, t) {
    return from + t * 2 * Math.PI;
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
  var lastTargetIndex = msgData[0][0].d1;
  var fromAngle = angleForIndex(lastTargetIndex);
  var toAngle = fromAngle;
  var travelFullLoop = false;

  function setTarget(nextIndex) {
    travelFullLoop = (nextIndex === lastTargetIndex);
    lastTargetIndex = nextIndex;
    fromAngle = toAngle;
    toAngle = angleForIndex(nextIndex);
    state = 'travel';
  }

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
      setTarget(b.d2);
    } else {
      var col = columns[columns.length - 1];
      col.h2 = b.hex.charAt(1);
      col.h2Jit = jitter();

      if (byteIndex === bytes.length - 1) {
        // Every byte's hex is written, but the letters stay hidden until
        // someone clicks the button. Nothing happens on its own from
        // here -- this only advances on a real click.
        state = 'awaitingGuess';
        if (translateBtn) translateBtn.disabled = false;
      } else {
        byteIndex += 1;
        digitPhase = 0;
        setTarget(bytes[byteIndex].d1);
      }
    }
  }

  function finishReveal() {
    state = 'revealed';
    stateStart = null;
    if (translateBtn) {
      translateBtn.textContent = 'Next Phrase';
      translateBtn.disabled = false;
    }
  }

  function revealLetters() {
    if (state !== 'awaitingGuess') return;
    var bytes = msgData[msgIndex];
    for (var i = 0; i < columns.length; i++) {
      columns[i].letter = bytes[i].ch;
      columns[i].letterJit = jitter();
    }
    finishReveal();
  }

  // The next column that's a legitimate guessing target: its hex is
  // fully written (both digits) but its letter isn't filled in yet.
  // Returns -1 if there isn't one -- either everything so far is
  // already guessed, or the camera hasn't finished that byte's second
  // digit yet.
  function nextGuessableIndex() {
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].letter === null) {
        return columns[i].h2 !== null ? i : -1;
      }
    }
    return -1;
  }

  // Called when someone clicks a letter in the quick-reference popup.
  // Works as soon as a byte's hex digits are both up in the sand, even
  // if the camera is still reading later bytes of the same word.
  // Returns true if it was the correct next letter (and fills it into
  // the sand), false otherwise.
  function guessLetter(ch) {
    if (state === 'revealed') return false;
    var idx = nextGuessableIndex();
    if (idx === -1) return false;
    var bytes = msgData[msgIndex];
    if (bytes[idx].ch !== ch) return false;
    columns[idx].letter = ch;
    columns[idx].letterJit = jitter();
    // Compare against the message's true length, not columns.length --
    // the camera may not have read the later bytes yet.
    if (idx === bytes.length - 1) finishReveal();
    return true;
  }

  function goToNextMessage() {
    if (state !== 'revealed') return;
    if (msgData.length > 1) {
      var nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * msgData.length);
      } while (nextIndex === msgIndex);
      msgIndex = nextIndex;
    }
    byteIndex = 0;
    digitPhase = 0;
    columns = [];
    setTarget(msgData[msgIndex][0].d1);
    stateStart = null;
    if (translateBtn) {
      translateBtn.textContent = 'Translate to ASCII';
      translateBtn.disabled = true;
    }
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
    } else if (state === 'awaitingGuess') {
      render(toAngle, null);
      if (elapsed > interactionTimeoutMs) {
        revealLetters();
      }
    } else if (state === 'revealed') {
      render(toAngle, null);
      if (elapsed > interactionTimeoutMs) {
        goToNextMessage();
      }
    } else {
      var progress = Math.min(elapsed / travelMs, 1);
      var eased = easeInOutQuad(progress);
      var current = travelFullLoop
        ? fullLoopLerp(fromAngle, eased)
        : shortestAngleLerp(fromAngle, toAngle, eased);
      render(current, null);
      if (progress >= 1) {
        state = 'dwell';
        stateStart = t;
      }
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  if (translateBtn) {
    translateBtn.addEventListener('click', function () {
      if (state === 'awaitingGuess') revealLetters();
      else if (state === 'revealed') goToNextMessage();
    });
  }

  var quickrefCells = document.querySelectorAll('#hex-quickref-panel td[data-ch]');
  for (var qi = 0; qi < quickrefCells.length; qi++) {
    (function (cell) {
      cell.addEventListener('click', function () {
        var correct = guessLetter(cell.getAttribute('data-ch'));
        if (!correct) {
          cell.classList.add('is-wrong');
          setTimeout(function () { cell.classList.remove('is-wrong'); }, 400);
        }
      });
    })(quickrefCells[qi]);
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
down. That's not nothing, though. Mark lays a grid of hexadecimal digits,
`0` through `F`, out where the camera can see it: 16 signs spaced 22.5
degrees apart in a full circle around the rover, one for each digit. NASA
rotates the camera to one grid position, and Mark reads off one hex digit.
Two digits make one byte, and one byte, run through ASCII, is one
character. Rotate, pause, rotate, pause, and a sentence spells itself out
one letter at a time.

[Watch the scene](https://www.youtube.com/watch?v=0xkP_FQUsuM&t=220s) (starts
around 3:40, runs to about 4:00).

<div class="pset-demo">
  <label for="pathfinder-input">Transmission (hex):</label>
  <input type="text" id="pathfinder-input" placeholder="e.g. 484921" autocomplete="off">
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

<script>
(function () {
  var toggle = document.getElementById('hex-quickref-toggle');
  var panel = document.getElementById('hex-quickref-panel');
  if (!toggle || !panel) return;

  function close() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function open() {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panel.classList.contains('is-open')) close(); else open();
  });

  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== toggle) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
</script>

Try `484921` above to see how it works, then see the specification below
for what your own program needs to do.

<figure class="hex-preview">
  <a class="hex-preview-link" href="{{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}">
    <table>
      <thead><tr><th>Dec</th><th>Bin</th><th>Hex</th><th>Chr</th></tr></thead>
      <tbody>
        <tr><td>72</td><td>1001000</td><td>48</td><td>H</td></tr>
        <tr><td>73</td><td>1001001</td><td>49</td><td>I</td></tr>
        <tr><td>33</td><td>0100001</td><td>21</td><td>!</td></tr>
      </tbody>
    </table>
  </a>
  <figcaption>
    Three rows from the full table, enough to decode <code>484921</code>
    into HI! See the
    <a href="{{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}">complete ASCII / hex table</a>
    for everything else.
  </figcaption>
</figure>

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

<details class="hint-toggle" markdown="1">
<summary>Need a hint?</summary>

- Converting two hex digits into the byte they represent is a change of
  base: `int("4D", 16)` gives you `77`, the same way `int("42")` gives
  you `42`, just reading the string in base 16 instead of base 10. Try
  it with a pair of digits from your own transmission in place of
  `"4D"`.
- `chr()` turns that integer into the character it corresponds to in
  ASCII, the reverse of what `ord()` does.
- You'll build the decoded message one character at a time. Starting
  with an empty string and adding to it inside a loop works:
  `message = message + chr(...)`, or the shorthand `message += chr(...)`.
- You still need a way to walk through the transmission two characters
  at a time instead of one, and there's more than one way to set that
  loop up. Think about what you want your loop variable to count, and
  how you'd turn each count into a two-character piece of the string.

</details>

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

<hr>

## Glossary

- **hexadecimal** — Base-16, using 0 through 9 and A through F. Four bits
  per digit, so one byte is exactly two hex digits.
- **byte** — Eight bits. Enough to hold one of 256 values.
- **ASCII** — A table assigning a number from 0 to 127 to each of a small
  set of characters. `int()` and `chr()` move between a hex byte and the
  character it represents.
- **string** — A type that represents sequences of characters.

<hr>

## Standards Alignment

**AP CSP:** [2.1 Binary Numbers](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-2.1) (Big Idea 2, 17 to 22% of the exam). Also [3.13 Developing Procedures](https://python.porttack.com/alignment/apcsp-standards-reference.html#T-3.13), headers only, covering the optional helper-function requirement in "To Get Full Credit" rather than the core spec.
**California 9-12:** [9-12.DA.8](https://python.porttack.com/alignment/ca-cs-standards-reference.html#S-9-12.DA.8)
**CSTA 2026:** [HS-ALG-PS-02](https://python.porttack.com/alignment/csta2026-standards-reference.html#T-HS-ALG-PS-02)
**CA CTE (ICT):** [C4.4](https://python.porttack.com/alignment/ca-ict-anchor-standards-reference.html#T-C4.4) (Pathway C).

Converting a two-digit hex byte into the character it represents, and
back, is 2.1's binary place-value idea one layer up: hex digits are a
compact stand-in for four bits at a time. It's DA.8 in different words
too, since the same character can be written as a letter or as a byte,
and moving between them is the whole point of this problem. C4.4 names
that same idea from the CTE side: data has types, and those types get
encoded in specific ways. The optional helper function in "To Get Full
Credit" is 3.13 and CSTA's HS-ALG-PS-02 territory: wrapping the
byte-to-character conversion in its own function instead of inlining it.
