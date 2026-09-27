---
title: "Binary Battleship"
source: original
level: both
kind: [single, supplementary]
topics: [Binary]
time: 25
grouping: Pair
materials: "Pencil"
scripts: [/assets/js/unplugged/battleship-page.js]
generator: /unplugged/binary-battleship-generator/
generator_presets:
  - { label: "New 8x8 fleets", query: "level=easy" }
  - { label: "16x16", query: "level=harder" }
  - { label: "Hex", query: "level=hex" }
---

{% include unplugged/player-switch.html %}

Battleship, but every row and column is labeled in binary, the way a
computer counts. To call a shot you read a binary number, and your partner
reads one to answer. One game and you'll have done dozens of conversions.

## How to read a label

Binary works like decimal, except each place is worth double the place
to its right instead of ten times. In a 3-digit binary label, the
places are worth 4, 2, and 1:

<table class="place-value-demo">
  <tr><th>Place value</th><td>4</td><td>2</td><td>1</td></tr>
  <tr><th>Digit</th><td>1</td><td>0</td><td>1</td></tr>
</table>

Add up the place value under every **1** digit: 4 + 1 = **5**. So the
label `101` means row (or column) 5. A label of `000` means 0, and the
biggest label, `111`, means 4 + 2 + 1 = 7. Three digits, each either 0
or 1, give exactly eight different labels, so this grid has eight rows
and eight columns, numbered 0 through 7.


Each of you already has a fleet drawn on your own "My ships" grid
below, so there's no setup: just start calling shots.

<noscript><p class="callout warning">This worksheet draws its grids with JavaScript. Turn JavaScript on to see the boards.</p></noscript>

<section class="battleship-player" data-player="A" markdown="1">
{% include unplugged/name-line.html %}
## Player A

Keep this page hidden from Player B.

{% include unplugged/battleship-rules.html %}

<div class="battleship-boards" id="boards-a"></div>
</section>

<section class="battleship-player" data-player="B" markdown="1">
{% include unplugged/name-line.html %}
## Player B

Keep this page hidden from Player A.

{% include unplugged/battleship-rules.html %}

<div class="battleship-boards" id="boards-b"></div>
</section>

<script type="application/json" data-battleship-set data-a="#boards-a" data-b="#boards-b">{{ site.data.unplugged["binary-battleship"] | jsonify }}</script>

<aside class="callout challenge" markdown="1">
**AFTER THE GAME**

1. What's the biggest column label on this grid, and what is it in
   decimal? <span class="fill-line short"></span>
2. Why does a 3-digit binary label give you exactly 8 possible rows, no
   more and no fewer? <span class="fill-line"></span>
3. Your partner calls "row 110, column 011." Before you check your
   grid, what are those two labels in decimal?
   <span class="fill-line short"></span>
</aside>

Want a bigger battle? Try the [16 by 16 version]({{ '/unplugged/binary-battleship-16/' | relative_url }}), or [make a fresh set of fleets]({{ '/unplugged/binary-battleship-generator/' | relative_url }}) any time you want new ships to hunt.

<section class="answer-key" markdown="1">
## Check your answers

**After the game.**

1. The biggest label is `111`, which is 4 + 2 + 1 = **7**.
2. Three digits, each 0 or 1, give 2 x 2 x 2 = 8 different labels, so 8
   rows: 0 through 7. A fourth digit would double that to 16.
3. `110` = 4 + 2 + 0 = **6**. `011` = 0 + 2 + 1 = **3**.
</section>
