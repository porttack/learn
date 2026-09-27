---
title: "Build a Tree"
source: cs-unplugged-web
source_url: "https://www.csunplugged.org/en/topics/data-structures-for-searching/binary-search-trees/"
level: both
kind: [single]
topics: [Searching, Algorithms]
time: 15
grouping: Solo
materials: "Pencil"
generator: /unplugged/bst-generator/
generator_presets:
  - { label: "New build set", query: "mode=build" }
scripts: [/assets/js/unplugged/bst-page.js]
---

A binary search tree isn't just found, it's built one number at a time.
The order you insert numbers in changes the tree's shape, even when the
numbers themselves are exactly the same. Here you'll build the same five
numbers two different ways and see why that matters.

## How to insert a number

1. Start at the root circle.
2. Compare your new number to the number already there.
3. Go left if it's smaller, right if it's larger.
4. Keep going until you reach an empty circle, then write your number in.

<noscript><p class="callout warning">This worksheet draws its tree templates with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div id="questions-bst-build"></div>

**What happened?** Look at your two trees. One is short and wide, the
other is tall and thin, almost a straight line. Which shape would let you
find a number in fewer comparisons? <span class="fill-line"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Can you think of an insertion order for these same five numbers that makes
a different tall, thin line, not the one above? What do all "thin line"
orders have in common?
</aside>

<section class="answer-key" markdown="1">
## Check your answers

<div id="key-bst-build"></div>
</section>

<script type="application/json" data-bst-build data-questions="#questions-bst-build" data-key="#key-bst-build">{{ site.data.unplugged.bst_build | jsonify }}</script>
