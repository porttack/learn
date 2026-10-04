---
title: "Secret Messages: make a new set"
source: original
level: both
companion: true
scripts: [/assets/js/unplugged/ascii-messages-generator.js]
---

A fresh joke to decode, or a new word to encode, every time you click **New
set**. Pick a format and a direction first. The set number prints on the
sheet. To reprint the same set later, type its number back into the **Set
#** box.

<div class="puzzle-generator" markdown="1">

<p class="generator-seed"></p>
<div class="puzzle-reference"></div>
<div class="puzzle-questions"></div>

<section class="answer-key">
<p class="generator-seed"></p>
<div class="puzzle-key"></div>
</section>

</div>

<script type="application/json" id="ascii-bank">{{ site.data.unplugged.ascii_bank | jsonify }}</script>
