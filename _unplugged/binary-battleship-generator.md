---
title: "Binary Battleship: make new fleets"
source: original
level: both
companion: true
scripts: [/assets/js/unplugged/battleship-generator.js]
---

{% include unplugged/player-switch.html %}

Fresh fleets for both players every time you click **New set**, at
three levels: the 8 by 8 easy grid, the 16 by 16 harder grid, or a hex
challenge that swaps every binary label for a single hex digit. The set
number prints on both players' pages, so you can hand out the exact
same fleets again later by typing it back into the **Set #** box.

<div class="puzzle-generator" markdown="1">

{% include unplugged/battleship-rules.html %}

<p class="generator-seed"></p>
<div class="puzzle-questions"></div>

<section class="answer-key">
<p class="generator-seed"></p>
<div class="puzzle-key"></div>
</section>
</div>
