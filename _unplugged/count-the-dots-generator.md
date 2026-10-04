---
title: "Message in lights: make a new set"
source: original
level: both
companion: true
scripts: [/assets/js/unplugged/lights-generator.js]
---

A fresh message in lights every time you click **New set**, like Part 5 of
[Count the Dots]({{ '/unplugged/count-the-dots/' | relative_url }}). Decode a
joke's punchline, or turn a word into lights. Pick the symbols: lights,
stars, boxes, triangles, or mixed (every row its own pair).

<div class="puzzle-generator" markdown="1">
<p class="generator-seed"></p>
<div class="puzzle-questions"></div>

<section class="answer-key">
<p class="generator-seed"></p>
<div class="puzzle-key"></div>
</section>
</div>

<script type="application/json" id="lights-bank">{{ site.data.unplugged.ascii_bank | jsonify }}</script>
