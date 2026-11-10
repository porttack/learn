---
layout: lesson
title: "Project 2.2 Worksheet: The Potentiometer and Lists"
pathway: pico
order: 109.1
label: "Project 2.2 Companion"
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
  .ws22 h2 { margin: 0.7em 0 0.3em; break-after: avoid; }
}
</style>

<div class="ws22">

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Date: <span class="fill-line short"></span>
  Period: <span class="fill-line short"></span>
</p>

<p><em>Use this with <a href="/pico/project2-2-reading-a-potentiometer/">Project 2.2: Reading a Potentiometer</a>. Your answers can be short: you do not need full sentences.</em></p>

<div class="ws-strip"><b>voltage divider</b>: two resistors in series that split a voltage; the wiper reads the split</div>
<div class="ws-strip"><b>list</b>: an ordered collection of values stored under one name</div>
<div class="ws-strip"><b>element</b>: one value inside a list</div>
<div class="ws-strip"><b>index</b>: an element's position in the list, counting from 0</div>
<div class="ws-strip"><b>iteration</b>: one pass through a loop; this loop iterates 8 times</div>

<h2>A. Wiring check</h2>

<div class="ws-row"><div class="ws-q">Three wires go from the potentiometer to the Pico. Write the physical pin number each one reaches. Count pins down the left side, then up the right.</div><div class="ws-a"></div></div>
<div class="ws-row"><div class="ws-q">Outer leg 1, to 3V3 (OUT)</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Outer leg 2, to GND</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Wiper (middle leg), to <code>GP26</code></div><div class="ws-a"><div class="ln"></div></div></div>

<h2>B. Measurement table</h2>

<p>Turn the knob to each position. Read the wiper-to-ground voltage with the multimeter, then read what your program prints. Difference = multimeter minus Pico.</p>

<table class="ws-table"><thead><tr><th>Knob position</th><th>Multimeter volts</th><th>Pico volts</th><th>Difference</th></tr></thead><tbody><tr><td>minimum</td><td></td><td></td><td></td></tr><tr><td>1/4 turn</td><td></td><td></td><td></td></tr><tr><td>1/2 turn</td><td></td><td></td><td></td></tr><tr><td>3/4 turn</td><td></td><td></td><td></td></tr><tr><td>maximum</td><td></td><td></td><td></td></tr></tbody></table>

<div class="ws-page2"></div>

<h2>C. The voltage divider on paper</h2>

<p>Ohm's law says <b>V = I × R</b>. The wiper voltage is <b>V_wiper = 3.3 × R_bottom / R_total</b>. Use the 10k pot from your kit.</p>

<div class="ws-row"><div class="ws-q">Knob turned all the way to the ground end. R_bottom is 0. What is V_wiper?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Knob exactly in the middle. R_bottom is half of R_total. About what is V_wiper?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Knob turned all the way to the 3V3 end. What is V_wiper?</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">With the 10k pot (10,000 ohms), what is the current through the whole strip? Use I = 3.3 / R_total. Give your answer in milliamps.</div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Swap the 10k pot for a 1k pot. Does the current through the pot get bigger, smaller, or stay the same? Does V_wiper change?</div><div class="ws-a"><div class="ln"></div><div class="ln"></div></div></div>

<h2>D. Lists on paper</h2>

<p>Do these before you touch the code. Here is a list:</p>

<div class="ws-code">samples = [31200, 31540, 30980, 31310, 31650, 31090, 31420, 31270]</div>

<div class="ws-row"><div class="ws-q">How many elements are in the list? <code>len(samples)</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">What is the first element? <code>samples[0]</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">What is the last element? <code>samples[7]</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">The spread: <code>max(samples) - min(samples)</code></div><div class="ws-a"><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Predict what this does, and why: <code>samples[8]</code></div><div class="ws-a"><div class="ln"></div><div class="ln"></div></div></div>

<h2>E. Your own data</h2>

<div class="ws-row"><div class="ws-q">Hold the knob still. Add <code>print(samples)</code> to your program and copy one printed list.</div><div class="ws-a"><div class="ln"></div><div class="ln"></div></div></div>
<div class="ws-row"><div class="ws-q">Its spread, <code>max(samples) - min(samples)</code>:</div><div class="ws-a"><div class="ln"></div></div></div>

<h2>F. Reflection</h2>

<div class="ws-row"><div class="ws-q">Why does the program average 8 readings instead of using just one? Use the word <b>list</b> in your answer.</div><div class="ws-a"><div class="ln"></div><div class="ln"></div><div class="ln"></div><div class="ln"></div></div></div>

</div>
