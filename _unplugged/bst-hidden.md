---
title: "The Hidden Number Tree"
source: cs-unplugged-web
source_url: "https://www.csunplugged.org/en/topics/data-structures-for-searching/binary-search-trees/"
level: both
kind: [single]
topics: [Searching, Algorithms]
time: 20
grouping: Pair
materials: "Pencil"
scripts: [/assets/js/unplugged/bst-page.js]
---

{% include unplugged/player-switch.html %}

You and a partner each hold a tree of hidden numbers. When it's your turn
to hunt, you try to reach your target in as few reveals as possible. Follow
Round 1 and Round 2 below in order, then swap sheets and compare.

<noscript><p class="callout warning">This worksheet draws its trees with JavaScript. Turn JavaScript on to see the boards.</p></noscript>

<section class="bst-player" data-player="A" markdown="1">
{% include unplugged/name-line.html %}
## Player A

Keep this page hidden from Player B.

<div class="bst-board" id="board-a"></div>
</section>

<section class="bst-player" data-player="B" markdown="1">
{% include unplugged/name-line.html %}
## Player B

Keep this page hidden from Player A.

<div class="bst-board" id="board-b"></div>
</section>

<section class="answer-key" markdown="1">
## Check your answers

<div id="key-bst-hidden"></div>
</section>

<script type="application/json" data-bst-hidden data-board-a="#board-a" data-board-b="#board-b" data-key="#key-bst-hidden">{{ site.data.unplugged.bst_hidden | jsonify }}</script>
