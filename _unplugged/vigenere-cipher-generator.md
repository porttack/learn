---
title: "Vigenère cipher: make a new set"
source: original
companion: true
scripts: [/assets/js/unplugged/vigenere-generator.js]
---

A fresh batch of Vigenère cipher messages every time you click **New set**,
either decoding a batch with the keyword given, or encoding a batch and
checking your ciphertext against the key. The set number prints on the
sheet. To reprint the same set later, type its number back into the
**Set #** box.


<div class="puzzle-generator" markdown="1">

{% include unplugged/vigenere-square.html %}

<p class="generator-seed"></p>
<div class="puzzle-questions"></div>

<section class="answer-key">
<p class="generator-seed"></p>
<div class="puzzle-key"></div>
</section>
</div>
