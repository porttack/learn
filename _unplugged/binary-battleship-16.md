---
title: "Binary Battleship: 16 by 16"
source: original
level: hs
kind: [single, supplementary]
topics: [Binary]
time: 35
grouping: Pair
materials: "Pencil"
generator: /unplugged/binary-battleship-generator/
scripts: [/assets/js/unplugged/battleship-page.js]
---

{% include unplugged/player-switch.html %}

The harder version of [Binary Battleship]({{ '/unplugged/binary-battleship/' | relative_url }}):
the same game, but the grid is twice as wide and twice as tall, so every
label needs a fourth binary digit. If you haven't played the 8 by 8
version yet, play that one first: it explains the rules this page
assumes you already know.

## How to read a 4-bit label

This grid has 16 rows and 16 columns, so each label needs four binary
digits instead of three. Now the places are worth 8, 4, 2, and 1:

<table class="place-value-demo">
  <tr><th>Place value</th><td>8</td><td>4</td><td>2</td><td>1</td></tr>
  <tr><th>Digit</th><td>1</td><td>0</td><td>1</td><td>0</td></tr>
</table>

Add up the place value under every **1** digit: 8 + 0 + 2 + 0 = **10**.
So the label `1010` means row (or column) 10. Four binary digits, each
0 or 1, give 2 x 2 x 2 x 2 = 16 different labels: exactly enough to
number every row and column from 0 to 15.


Each of you already has a fleet drawn on your own "My ships" grid
below, so there's no setup: just start calling shots.

<noscript><p class="callout warning">This worksheet draws its grids with JavaScript. Turn JavaScript on to see the boards.</p></noscript>

{% include unplugged/battleship-rules.html %}

<section class="battleship-player" data-player="A" markdown="1">
{% include unplugged/name-line.html %}
## Player A

Keep this page hidden from Player B.


<div class="battleship-boards" id="boards-a"></div>
</section>

<section class="battleship-player" data-player="B" markdown="1">
{% include unplugged/name-line.html %}
## Player B

Keep this page hidden from Player A.


<div class="battleship-boards" id="boards-b"></div>
</section>

<script type="application/json" data-battleship-set data-a="#boards-a" data-b="#boards-b">{{ site.data.unplugged["binary-battleship-16"] | jsonify }}</script>

<aside class="callout challenge" markdown="1">
**AFTER THE GAME**

1. What's the biggest row label on this grid, and what is it in
   decimal? <span class="fill-line short"></span>
2. Why do 4 bits give you 16 possible rows, no more and no fewer?
   <span class="fill-line"></span>
3. Going from 3-bit labels (the 8 by 8 grid) to 4-bit labels didn't just
   add one more row. How many more rows did it add, and why so many?
   <span class="fill-line"></span>
</aside>

Want a different kind of challenge? [Make a fresh set of fleets]({{ '/unplugged/binary-battleship-generator/' | relative_url }})
and pick the hex challenge level: it swaps every binary label for a
single hex digit, 0 through F, standing for the same 16 rows and
columns.

<section class="answer-key" markdown="1">
## Check your answers

**After the game.**

1. The biggest label is `1111`, which is 8 + 4 + 2 + 1 = **15**.
2. Four digits, each 0 or 1, give 2 x 2 x 2 x 2 = 16 different labels,
   so 16 rows: 0 through 15.
3. It added 8 rows, going from 8 rows to 16. Each extra bit doubles how
   many labels are possible, so the 8 by 8 grid's 8 rows became 16, not
   9.
</section>
