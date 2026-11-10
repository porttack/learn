---
layout: lesson
title: "Project 2.4 Worksheet: Animating with Lists of Lists"
pathway: pico
order: 111.1
label: "Project 2.4 Companion"
source: original
companion: true
---

<style>
.ws22 { font-size: 1rem; }
.ws22 code, .ws22 .c { font-family: "Courier New", Courier, monospace; font-size: 0.95em; background: none; border: 0; padding: 0; }
.ws22 .ws-strip { background: #d9d9d9; padding: 0.25em 0.6em; margin: 0 0 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ws22 .ws-strip b { font-family: "Courier New", Courier, monospace; }
.ws22 h2 { border-bottom: 2px solid #222; padding-bottom: 0.1em; }
.ws22 .ws-row { display: flex; gap: 1.2em; align-items: flex-start; margin: 0.5em 0; break-inside: avoid; }
.ws22 .ws-q { flex: 0 0 46%; }
.ws22 .ws-a { flex: 1; }
.ws22 .ws-a .ln { border-bottom: 1px solid #222; height: 1.9em; }
.ws22 .ws-code { border: 1px solid #222; padding: 0.35em 0.6em; font-family: "Courier New", Courier, monospace; font-size: 0.9em; margin: 0.3em 0 0.5em; break-inside: avoid; }
.ws22 table.ws-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0.4em 0 0.6em; }
.ws22 .ws-table th, .ws22 .ws-table td { border: 1.5px solid #222; padding: 0.3em 0.6em; text-align: left; height: 2.2em; }
.ws22 .ws-table th { background: #d9d9d9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media (max-width: 40em) { .ws22 .ws-row { flex-direction: column; gap: 0; } .ws22 .ws-q { flex-basis: auto; } .ws22 .ws-a { width: 100%; } }
@media print {
  .lesson:has(.ws22) h1 { font-size: 16pt; margin: 0 0 0.06in; }
  .lesson:has(.ws22) .lesson-label { display: none; }
  .ws22 .checkoff-fields { margin: 0 0 0.06in; }
  .ws22 p { margin: 0 0 0.05in; }
  .ws22 .ws-strip { padding: 0.12em 0.6em; }
  .lesson:has(.ws22) .provenance { font-size: 6pt; margin-top: 0.05in; }
  .ws22 { font-size: 10.5pt; line-height: 1.3; }
  .ws22 .ws-row { margin: 0.35em 0; }
  .ws22 .ws-a .ln { height: 1.75em; }
  .ws22 .ws-table th, .ws22 .ws-table td { height: 0.34in; }
  .ws22 .ws-page2 { break-before: page; }
  .ws22 .ws-grid th, .ws22 .ws-grid td { height: 0.3in; padding: 0.1em 0.3em; text-align: center; }
  .ws22 .ws-grid td:first-child, .ws22 .ws-grid th:first-child { width: 14%; text-align: left; }
  .ws22 h2 { margin: 0.7em 0 0.3em; break-after: avoid; }
}
.ws22 .ws-grid th, .ws22 .ws-grid td { text-align: center; padding: 0.15em 0.2em; height: 2.2em; }
.ws22 .ws-grid td:first-child, .ws22 .ws-grid th:first-child { width: 14%; text-align: left; padding-left: 0.5em; }
.ws22 .ws-code { white-space: pre; line-height: 1.35; }
</style>

<div class="ws22">

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Date: <span class="fill-line short"></span>
  Period: <span class="fill-line short"></span>
</p>

<p><em>Use this with <a href="/pico/project2-4-animating-the-neopixel-bar/">Project 2.4: Animating the NeoPixel Bar</a>. Your answers can be short: you do not need full sentences.</em></p>

<div class="ws-strip"><b>nested list</b>: a list whose elements are lists; here, a list of frames</div>
<div class="ws-strip"><b>frame</b>: one moment of the animation: a list of 8 colors</div>
<div class="ws-strip"><b>index</b>: a position in a list, counting from 0; frames[2][5] uses two</div>
<div class="ws-strip"><b>iteration</b>: one pass through a loop; a loop inside a loop iterates once per frame, per pixel</div>

<h2>A. Plan your animation</h2>

<p>Rows are moments in time and columns are pixels. Plan each frame by writing a letter in each square (R, G, B, or your own letters), and OFF as a dash. Leave a row empty if you do not need it. Make a key for your letters below the grid.</p>

<table class="ws-table ws-grid"><thead><tr><th>Frame</th><th>Pixel 0</th><th>Pixel 1</th><th>Pixel 2</th><th>Pixel 3</th><th>Pixel 4</th><th>Pixel 5</th><th>Pixel 6</th><th>Pixel 7</th></tr></thead><tbody><tr><td>0</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>1</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>6</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>7</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>

<p>Key: <span class="fill-line" style="min-width:90%"></span></p>

<h2>B. Reading frames on paper</h2>

<p>Do these before you touch the code. Here is an animation of two pixels moving toward each other:</p>

<div class="ws-code">R = (20, 0, 0)
G = (0, 20, 0)
OFF = (0, 0, 0)

frames = [
    [R,   OFF, OFF, OFF, OFF, OFF, OFF, G  ],   # frame 0
    [OFF, R,   OFF, OFF, OFF, OFF, G,   OFF],   # frame 1
    [OFF, OFF, R,   OFF, OFF, G,   OFF, OFF],   # frame 2
    [OFF, OFF, OFF, R,   G,   OFF, OFF, OFF],   # frame 3
]</div>

<div class="ws-row"><div class="ws-q">How many frames are there? <code>len(frames)</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">How many colors in a frame? <code>len(frames[0])</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">What color is <code>frames[1][1]</code>?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">What color is <code>frames[2][5]</code>?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">In frame 3, which two pixels are lit, and what color is each?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Predict what this does, and why: <code>frames[4][0]</code></div><div class="ws-a"><div class="ln"></div><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Predict what this does, and why: <code>frames[0][8]</code></div><div class="ws-a"><div class="ln"></div><div class="ln"></div></div></div>

<h2>C. The loop inside a loop</h2>

<div class="ws-code">for f in range(len(frames)):
    for i in range(len(np)):
        np[i] = frames[f][i]
    np.write()</div>

<div class="ws-row"><div class="ws-q">How many times does the line <code>np[i] = frames[f][i]</code> run during one trip through all 4 frames?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">How many times does <code>np.write()</code> run?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Why is <code>np.write()</code> after the inner loop, not inside it?</div><div class="ws-a"><div class="ln"></div><div class="ln"></div><div class="ln"></div></div></div>

<h2>D. Scrubbing with the knob</h2>

<div class="ws-row"><div class="ws-q">The knob picks a frame number. For the 4 frames above, which frame numbers are legal?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">With the knob turned all the way up, a mapping gives 4. What happens, and how could you stop it?</div><div class="ws-a"><div class="ln"></div><div class="ln"></div><div class="ln"></div></div></div>

<h2>E. Your own animation</h2>

<div class="ws-row"><div class="ws-q">Pick any square from your grid in A. Write its position as <code>frames[ ][ ]</code> and its color.</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Why is an animation a list of lists? Use the words <b>frame</b> and <b>index</b> in your answer.</div><div class="ws-a"><div class="ln"></div><div class="ln"></div><div class="ln"></div><div class="ln"></div></div></div>

</div>
