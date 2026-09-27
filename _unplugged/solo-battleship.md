---
title: "Solo Battleship"
source: original
level: ms
kind: [single]
topics: [Logic puzzles]
time: 20
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/bimaru-page.js]
generator: /unplugged/solo-battleship-generator/
generator_presets:
  - { label: "5x5 easy", query: "level=5-easy" }
  - { label: "6x6", query: "level=6x6" }
  - { label: "8x8", query: "level=8x8" }
  - { label: "6x6, binary counts", query: "level=6-binary" }
---

A fleet of ships is hiding on the grid, but you can't see them. The numbers
next to each row and column tell you how many squares in that row or column
are ships, and that's all you need. No guessing: every square you shade
should follow from a number you can already see.

{% include unplugged/bimaru-rules.html %}

## Try a small one first

Here is a 4 by 4 grid with a fleet of one 2-ship and two 1-ships. One
square is already shaded for you.

<div class="bimaru-example">
<table class="bimaru-grid small">
<tbody>
<tr><td class="bimaru-corner"></td><td class="bimaru-count-col">2</td><td class="bimaru-count-col">1</td><td class="bimaru-count-col">0</td><td class="bimaru-count-col">1</td></tr>
<tr><td class="bimaru-count-row">1</td><td class="blank"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="given-ship"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="blank"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="blank"></td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>
</tbody>
</table>
<p class="bimaru-example-caption">Start: one given ship square, column 3's count is 0.</p>
</div>

1. **Column 3 has a count of 0.** That means every square in column 3 is
   water, right away, no thinking required.
2. **The shaded square is in row 2.** Ships never touch, not even at a
   corner, so the two squares diagonally touching it are water too.
3. **Row 2 already has its one ship square.** Its count is 1, and that
   square already found it, so the rest of row 2 is water as well.

Working the same way through every row and column finishes the grid:

<div class="bimaru-example">
<table class="bimaru-grid small solved">
<tbody>
<tr><td class="bimaru-corner"></td><td class="bimaru-count-col">2</td><td class="bimaru-count-col">1</td><td class="bimaru-count-col">0</td><td class="bimaru-count-col">1</td></tr>
<tr><td class="bimaru-count-row">1</td><td class="given-ship"></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="given-ship"></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-ship"></td></tr>
<tr><td class="bimaru-count-row">1</td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-ship"></td><td class="given-water"><span class="water-dot">&bull;</span></td><td class="given-water"><span class="water-dot">&bull;</span></td></tr>
</tbody>
</table>
<p class="bimaru-example-caption">Finished: a 2-ship in column 1, and two 1-ships.</p>
</div>

## The puzzles

The fleet list is printed next to each grid so you can cross off a ship the
moment you find it.

<noscript><p class="callout warning">This worksheet draws its puzzle grids with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="bimaru-questions" id="q-solo-battleship"></div>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Try solving a puzzle without ever guessing. If you get stuck, look for a
row or column where the count already matches what's shaded, or one where
every remaining blank square has to be a ship.
</aside>


<section class="answer-key" id="key-solo-battleship"></section>

<script type="application/json" data-bimaru-set data-questions="#q-solo-battleship" data-key="#key-solo-battleship">[
{% for p in site.data.unplugged.solo_battleship.puzzles %}{"n":{{ p.n }},"fleet":{{ p.fleet | jsonify }},"rowCounts":{{ p.rowCounts | jsonify }},"colCounts":{{ p.colCounts | jsonify }},"binary":{{ p.binary }},"label":{{ p.label | jsonify }},"given":{{ p.given | jsonify }},"solution":{{ p.solution | jsonify }}}{% unless forloop.last %},{% endunless %}
{% endfor %}]</script>
