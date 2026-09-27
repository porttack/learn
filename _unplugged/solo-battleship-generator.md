---
title: "Solo Battleship: make new puzzles"
source: original
companion: true
scripts: [/assets/js/unplugged/bimaru-generator.js]
---

Fresh Solo Battleship puzzles every time you click **New set**, at four
levels, including a version where the row and column counts are written in
binary instead of decimal. The set number prints on the sheet. To reprint
the same set later, type its number back into the **Set #** box.

<div class="puzzle-generator" markdown="1">
{% include unplugged/bimaru-rules.html %}

<p class="generator-seed"></p>
<div class="puzzle-questions"></div>

<section class="answer-key">
<p class="generator-seed"></p>
<div class="puzzle-key"></div>
</section>
</div>
