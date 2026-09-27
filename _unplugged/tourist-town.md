---
title: "Tourist Town"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Graphs, Logic puzzles]
time: 20
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/tourist-town-page.js]
generator: /unplugged/tourist-town-generator/
generator_presets:
  - { label: "Small town", query: "size=small" }
  - { label: "Big town", query: "size=big" }
---

Tourist Town is hot, and every summer ice-cream vans park at street
corners to sell to visitors. A visitor will walk to the end of their
street, and one block further, but no farther. You'll place vans so every
corner can reach one, using as few vans as possible.

## The one rule

A corner is covered if it has a van, or if a street connects it straight
to a corner that does. Here's a tiny four-corner loop, already solved:

<svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Four street corners in a loop. Corners 1 and 3 have vans. Corners 2 and 4 each connect directly to corner 1.">
  <line x1="40" y1="40" x2="160" y2="40" stroke="#111" stroke-width="2.5"/>
  <line x1="160" y1="40" x2="160" y2="160" stroke="#111" stroke-width="2.5"/>
  <line x1="160" y1="160" x2="40" y2="160" stroke="#111" stroke-width="2.5"/>
  <line x1="40" y1="160" x2="40" y2="40" stroke="#111" stroke-width="2.5"/>
  <circle cx="40" cy="40" r="17" fill="#111" stroke="#111" stroke-width="2.5"/>
  <text x="40" y="45" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui, sans-serif">1</text>
  <circle cx="160" cy="40" r="17" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="160" y="45" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">2</text>
  <circle cx="160" cy="160" r="17" fill="#111" stroke="#111" stroke-width="2.5"/>
  <text x="160" y="165" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui, sans-serif">3</text>
  <circle cx="40" cy="160" r="17" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="40" y="165" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">4</text>
</svg>

Corners 1 and 3 (filled) have vans. Corner 2 connects straight to corner
1, and corner 4 connects straight to corner 1 as well, so both are
covered. Every corner is covered using just **2 vans**, and 1 van alone
could never cover all four, since corner 3 doesn't connect to corner 1
directly.

## What to do

1. Circle a corner to place a van there.
2. Check every other corner: covered if it has a van, or a street runs
   straight to one that does.
3. Keep adding vans until every corner is covered.
4. Try to use as few vans as possible.
5. Do the same for the second, bigger map.

<noscript><p class="callout warning">This worksheet draws its maps with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="graphs-questions" id="q-tourist-town"></div>

<aside class="callout note" markdown="1">
**STUCK?**

The corner with the most streets meeting it isn't always a good place for
a van; it might cover a lot of corners that already had another way to be
covered. Try starting from a corner near the edge of the map instead.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Once you have an answer, try to convince yourself it's really the
smallest. Could every corner still be covered with one fewer van?
</aside>

**Learn more:** placing the fewest vans is called finding a [minimum
dominating set](https://en.wikipedia.org/wiki/Dominating_set), and towns
use the same idea to place the fewest mailboxes or fire stations.

<section class="answer-key graphs-answer-key" id="key-tourist-town"></section>

<script type="application/json" data-tourist-town-set data-questions="#q-tourist-town" data-key="#key-tourist-town">{{ site.data.unplugged.tourist_town.maps | jsonify }}</script>
