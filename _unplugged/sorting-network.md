---
title: "Beat the Clock: A Sorting Network"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/sorting-networks/"
original_print: "https://classic.csunplugged.org/documents/activities/sorting-network/unplugged-08-sorting_networks-2010.pdf"
k5: true
level: ms
kind: [single, supplementary]
topics: [Sorting, Algorithms]
time: 25
grouping: Solo
materials: "Pencil"
generator: /unplugged/sorting-network-generator/
generator_presets:
  - { label: "Numbers", query: "twist=numbers&level=ms" }
  - { label: "Words, A to Z", query: "twist=words" }
scripts: [/assets/js/unplugged/sortnet-page.js]
---

Computers put lists in order all the time: high scores, search results,
contacts by name. One way to sort faster is to compare several pairs of
numbers **at the same time** instead of one pair at a time. The diagram
below is a **sorting network**: a fixed set of comparisons wired together
so that six numbers always come out in order, no matter what order they
started in.

## How to trace it

1. Six starting numbers sit at the top of six lines, called wires.
2. Follow two wires down to the first short line connecting them. That is
   a **comparator**.
3. Compare the two numbers there. Write the **smaller** one in the left
   box, the **larger** one in the right box.
4. Follow each wire down to its next comparator and repeat.
5. At the bottom, read the six boxes top to bottom. They should be sorted.

**Worked example:** two wires carrying 9 and 4 meet at one comparator. 4
is smaller, so it goes in the left box. 9 is larger, so it goes in the
right box.

<figure class="sortnet-example">
<svg viewBox="0 0 160 90" width="160" height="90" role="img" aria-label="Two wires carrying 9 and 4 meet at a comparator. 4 comes out on the left, 9 on the right.">
  <line x1="30" y1="10" x2="30" y2="80" stroke="currentColor" stroke-width="1.3"></line>
  <line x1="110" y1="10" x2="110" y2="80" stroke="currentColor" stroke-width="1.3"></line>
  <line x1="30" y1="45" x2="110" y2="45" stroke="currentColor" stroke-width="1.3"></line>
  <circle cx="30" cy="45" r="5" fill="currentColor"></circle>
  <circle cx="110" cy="45" r="5" fill="currentColor"></circle>
  <text x="30" y="26" text-anchor="middle" font-size="13" font-weight="700">9</text>
  <text x="110" y="26" text-anchor="middle" font-size="13" font-weight="700">4</text>
  <text x="30" y="70" text-anchor="middle" font-size="13" font-weight="700">4</text>
  <text x="110" y="70" text-anchor="middle" font-size="13" font-weight="700">9</text>
</svg>
</figure>

This network compares six numbers 15 times in total, but never more than 3
comparisons wait on each other, so it only takes 6 rounds from top to
bottom.

<noscript><p class="callout warning">This puzzle draws its network with JavaScript. Turn JavaScript on to see it.</p></noscript>

<div class="sortnet-problems" id="q-sortnet"></div>

<script type="application/json" data-sortnet-set data-puzzle="#q-sortnet" data-key="#key-sortnet">{{ site.data.unplugged.sortnet_fixed.problems | jsonify }}</script>

**Check yourself:** the last row of boxes in Round 1 and Round 2 should
read in increasing order top to bottom, and Round 3's last row should read
in alphabetical order. If a row does not, retrace the comparator just
above the box that looks wrong.

## Why is this fast?

Look back at your diagram. Count every circle in the round that has the
most comparators.

How many comparisons happen at the exact same time in that round?
<span class="fill-line short"></span>

Now count every circle you passed through, top to bottom, tracing just one
of your number rounds. <span class="fill-line short"></span> A computer
comparing only one pair at a time would need that many separate steps.
This network gets the same six numbers sorted in just 6 rounds, because
several of those comparisons happen together instead of waiting in line.

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Cover the final row and start from the bottom instead: pretend the sorted
numbers are the input and trace upward. Does the network still sort them
correctly moving the other way?
</aside>

**Learn more:** this shape of network is called a
[sorting network](https://en.wikipedia.org/wiki/Sorting_network), and real
computer chips use the same idea to sort many numbers at once.

<section class="answer-key" markdown="1">

## Traced boxes

<div class="sortnet-key" id="key-sortnet"></div>

</section>
