---
title: "Muddy City"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Graphs, Algorithms]
time: 20
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/muddy-city-page.js]
generator: /unplugged/muddy-city-generator/
generator_presets:
  - { label: "Small towns", query: "size=small" }
  - { label: "Big towns", query: "size=big" }
---

A city with no paved roads is a muddy mess after every rainstorm. The
mayor wants every house connected to every other house by paved streets,
but paving is expensive, so you'll find a way to connect the whole city
using as few paving stones as possible. Power, phone, and internet
companies solve this same problem when they decide which wires to run.

## How to read the map

Each dot is a house. Each line is a muddy street, and the number on it is
how many paving stones that street would take to pave. Here's a tiny
three-house example, already solved:

<svg class="graphs-street" viewBox="0 0 200 140" width="200" height="140" role="img" aria-label="Three houses, A, B, and C. Street A-B costs 2 stones and is paved. Street B-C costs 3 stones and is paved. Street A-C costs 5 stones and is not paved.">
  <line x1="40" y1="110" x2="160" y2="110" stroke="#999" stroke-width="2.5"/>
  <rect x="90" y="99" width="20" height="18" fill="#fff" stroke="#bbb"/>
  <text x="100" y="113" text-anchor="middle" font-size="13" font-family="system-ui, sans-serif">5</text>
  <line x1="40" y1="110" x2="100" y2="20" stroke="#111" stroke-width="5"/>
  <rect x="55" y="56" width="20" height="18" fill="#fff" stroke="#111"/>
  <text x="65" y="70" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui, sans-serif">2</text>
  <line x1="100" y1="20" x2="160" y2="110" stroke="#111" stroke-width="5"/>
  <rect x="125" y="56" width="20" height="18" fill="#fff" stroke="#111"/>
  <text x="135" y="70" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui, sans-serif">3</text>
  <circle cx="40" cy="110" r="17" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="40" y="115" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">A</text>
  <circle cx="100" cy="20" r="17" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="100" y="25" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">B</text>
  <circle cx="160" cy="110" r="17" fill="#fff" stroke="#111" stroke-width="2.5"/>
  <text x="160" y="115" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">C</text>
</svg>

Streets A-B and B-C are paved (thick line), for 2 + 3 = **5 stones**.
Every house can now reach every other house. Paving A-C too would work,
but it would cost 5 more stones for nothing: A and C can already reach
each other through B.

## What to do

1. Pick a street and trace over it if you're paving it.
2. Keep going until every house can reach every other house using only
   paved streets.
3. Add up the stones on the streets you traced. Write the total.
4. Try again on scratch paper. Can you connect everyone for fewer stones?
5. Do the same for the second, bigger map.

<noscript><p class="callout warning">This worksheet draws its maps with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="graphs-questions" id="q-muddy-city"></div>

<aside class="callout note" markdown="1">
**STUCK?**

Try paving the cheapest street on the whole map first. Then pave the next
cheapest one, unless it just connects two houses that can already reach
each other, in which case skip it. Keep going until every house connects.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Draw your own muddy city: a few houses, some streets, a stone count on
each. Trade maps with a friend and race to find the cheapest way to
connect every house.
</aside>

**Learn more:** this is called a [minimum spanning tree](https://en.wikipedia.org/wiki/Minimum_spanning_tree),
one of the first problems computer scientists learned to solve quickly on
any size of map.

<section class="answer-key graphs-answer-key" id="key-muddy-city"></section>

<script type="application/json" data-muddy-city-set data-questions="#q-muddy-city" data-key="#key-muddy-city">{{ site.data.unplugged.muddy_city.maps | jsonify }}</script>
