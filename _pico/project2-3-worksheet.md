---
layout: lesson
title: "Project 2.3 Stamp Sheet: The NeoPixel Bar"
pathway: pico
order: 110.1
label: "Project 2.3 Companion"
source: original
companion: true
---

<style>
.ws23 .st { display: flex; gap: 1em; align-items: stretch; border-top: 2px solid #222; padding: 0.5em 0; break-inside: avoid; }
.ws23 .st-main { flex: 1; }
.ws23 .st-main h3 { margin: 0 0 0.2em; font-size: 1.05em; }
.ws23 .st-main p { margin: 0 0 0.3em; }
.ws23 .ln { border-bottom: 1px solid #222; height: 1.8em; }
.ws23 .stamp { flex: 0 0 1.5in; border: 2px dashed #222; min-height: 1.1in; font-size: 0.75em; text-align: center; padding-top: 0.3em; }
.ws23 .c { font-family: "Courier New", Courier, monospace; font-size: 0.95em; }
.ws23 .ws-bar { display: flex; gap: 4px; margin: 0.3em 0; }
.ws23 .ws-bar span { flex: 1; border: 1.5px solid #222; height: 0.45in; box-sizing: border-box; }
@media (max-width: 40em) { .ws23 .st { flex-direction: column; } .ws23 .stamp { flex-basis: auto; } }
@media print {
  .lesson:has(.ws23) h1 { font-size: 16pt; margin: 0 0 0.06in; }
  .lesson:has(.ws23) .lesson-label { display: none; }
  .lesson:has(.ws23) .provenance { font-size: 6pt; margin-top: 0.05in; }
  .ws23 { font-size: 10.5pt; line-height: 1.3; }
  .ws23 .checkoff-fields { margin: 0 0 0.06in; }
  .ws23 .st { padding: 0.35em 0; }
}
</style>

<div class="ws23">

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Date: <span class="fill-line short"></span>
  Period: <span class="fill-line short"></span>
</p>

<p><em>Use this with <a href="/pico/project2-3-adding-a-neopixel-bar/">Project 2.3: Adding a NeoPixel Bar</a>. Do the step, show it working, get your stamp, then write your short answer.</em></p>

<div class="st"><div class="st-main">
<h3>1. Wire it</h3>
<p>One or more pixels light up from your code.</p>
<p>Which end of the stick does the data wire go in, and which Pico pin?</p>
<div class="ln"></div>
</div><div class="stamp">STAMP</div></div>

<div class="st"><div class="st-main">
<h3>2. The knob controls the bar</h3>
<p>Turn the knob and the bar grows and shrinks.</p>
<p>What does <span class="c">np.write()</span> do? What happens if you leave it out?</p>
<div class="ln"></div><div class="ln"></div>
</div><div class="stamp">STAMP</div></div>

<div class="st"><div class="st-main">
<h3>3. Let the strip count itself</h3>
<p>Your loop uses <span class="c">range(len(np))</span> and the bar still works.</p>
<p>Predict what <span class="c">np[8] = (0, 20, 0)</span> does. Then try it. What happened?</p>
<div class="ln"></div><div class="ln"></div>
</div><div class="stamp">STAMP</div></div>

<div class="st"><div class="st-main">
<h3>4. Challenge: change the color</h3>
<p>The lit pixels change color as you turn the knob.</p>
<p>Explain in your own words how you did it. What was your hardest bug?</p>
<div class="ln"></div><div class="ln"></div>
</div><div class="stamp">STAMP</div></div>

<div class="st"><div class="st-main">
<h3>5. Going further: your own palette</h3>
<p>Your own 8 color palette is working on the strip. Plan it here first: a letter in each square.</p>
<div class="ws-bar"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
<p>Key (letter = color): <span class="fill-line" style="min-width:60%"></span></p>
</div><div class="stamp">STAMP</div></div>

</div>
