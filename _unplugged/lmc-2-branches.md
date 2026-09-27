---
title: "Little Man Computer: branches and loops"
source: original
level: hs
kind: [single, supplementary]
topics: [Computer architecture]
time: 20
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/lmc-page.js]
generator: /unplugged/lmc-generator/
generator_presets:
  - { label: "Loops", query: "level=branch" }
  - { label: "Straight-line programs", query: "level=straight" }
---

On the [tracing sheet]({{ '/unplugged/lmc-1-trace/' | relative_url }}), the little man always worked straight down the list, one line after the next. Real programs loop and make decisions instead, and that only takes one new trick: an instruction that changes the program counter to something other than "the next line." That's a branch.

<table class="checkoff lmc-instructions">
  <colgroup><col style="width: 18%"><col style="width: 18%"><col style="width: 64%"></colgroup>
  <thead><tr><th>Code</th><th>Mnemonic</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>6xx</td><td>BRA</td><td>Jump there. Always.</td></tr>
    <tr><td>7xx</td><td>BRZ</td><td>Jump there, but only if the accumulator is exactly zero.</td></tr>
    <tr><td>8xx</td><td>BRP</td><td>Jump there, but only if the accumulator is zero or positive.</td></tr>
  </tbody>
</table>

A loop is just a `BRA` that jumps backward, to an instruction the little man already ran. `BRZ` and `BRP` are how he decides whether to keep looping or to fall through, by checking the accumulator first.

<aside class="callout note" markdown="1">
**WHEN THE ACCUMULATOR GOES NEGATIVE**

`SUB` can push the accumulator below zero, and that's exactly what `BRP` is for: it can tell whether the last result was negative. But a mailbox and the output tray only ever hold a plain 3-digit number, 000 to 999, the normal rule every LMC simulator uses. So the moment a negative accumulator is stored (`STA`) or sent out (`OUT`), it wraps back into that range, the same way a car's odometer rolls backward: -1 becomes 999. None of the programs on this sheet ever store or output a negative value, so you'll only ever see a minus sign in the accumulator column, never in a mailbox or the output tray.
</aside>

<noscript><p class="callout warning">This worksheet draws its listing and trace tables with JavaScript. Turn JavaScript on to see them.</p></noscript>

## Worked example

This program takes one number and counts down to 1, outputting each number along the way, then stops as soon as the accumulator hits zero. Watch how the program counter jumps back to address 01 instead of just moving to the next line.

<div id="lmc-worked-2"></div>
<script type="application/json" data-lmc-worked data-root="#lmc-worked-2">{{ site.data.unplugged.lmc_2.worked | jsonify }}</script>

## Now you trace it

Same routine as the tracing sheet: start at address 00, follow the program counter, and fill in every row in order. This time the program counter won't just count up by one every row, so read the **Instruction** column carefully each step, especially right after a branch.

<div id="lmc-practice-2"></div>
<script type="application/json" data-lmc-practice data-root="#lmc-practice-2">{{ site.data.unplugged.lmc_2.practice | jsonify }}</script>


<section class="answer-key" id="lmc-key-2"></section>
<script type="application/json" data-lmc-practice-key data-root="#lmc-key-2">{{ site.data.unplugged.lmc_2.practice | jsonify }}</script>
