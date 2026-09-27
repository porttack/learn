---
title: "Binary Search Trees: Find the Number"
source: cs-unplugged-web
source_url: "https://www.csunplugged.org/en/topics/data-structures-for-searching/binary-search-trees/"
level: both
kind: [single]
topics: [Searching, Algorithms]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/bst-generator/
generator_presets:
  - { label: "New search tree", query: "mode=search" }
scripts: [/assets/js/unplugged/bst-page.js]
---

<div class="bst-page" markdown="1">
A binary search tree stores numbers so you can find any one of them fast,
without checking every number first. Each circle points down to two smaller
circles, and one simple rule tells you which way to go.

## The vocabulary

<div class="bst-vocab" id="vocab-bst-search"></div>

The top circle is the **root**. Every circle is a **node**, joined by
**branches**. A node with no branches below it is a **leaf**.

<aside class="callout note" markdown="1">
**THE ONE RULE:** everything down a node's **left** branch is **smaller**.
Everything down its **right** branch is **larger**.
</aside>

## How it works

Just an example, not one of your questions. Target: **6**.

<div class="bst-example" id="example-bst-search"></div>

## Your turn

1. Start at the root.
2. Compare your target to the number in the circle.
3. Go left if your target is smaller, right if it is larger.
4. Write down every number you check, in order.
5. If you run out of tree before you find your target, it isn't in there.

<noscript><p class="callout warning">This worksheet draws its trees with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div id="questions-bst-search"></div>

**One more check.** For any target above, how many checks would the sorted
list take, scanned left to right? Write that count in the linear-list
column too.

<aside class="callout challenge" markdown="1">
**CHALLENGE:** could a tree holding the same numbers ever find a target in
fewer comparisons than this one did? Try the
[build-a-tree activity]({{ '/unplugged/bst-build/' | relative_url }}) and
see what changes the count.
</aside>

Learn more: [binary search trees on Wikipedia](https://en.wikipedia.org/wiki/Binary_search_tree).
</div>

<section class="answer-key" markdown="1">
## Check your answers

<div id="key-bst-search"></div>
</section>

<script type="application/json" data-bst-search data-vocab="#vocab-bst-search" data-example="#example-bst-search" data-questions="#questions-bst-search" data-key="#key-bst-search">{{ site.data.unplugged.bst_search | jsonify }}</script>
