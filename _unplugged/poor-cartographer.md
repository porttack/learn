---
title: "The Poor Cartographer"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Graphs, Logic puzzles]
time: 20
grouping: Solo
materials: "Pencil, and colored pencils if you have them"
scripts: [/assets/js/unplugged/poor-cartographer-page.js]
generator: /unplugged/poor-cartographer-generator/
generator_presets:
  - { label: "2 colors", query: "target=2" }
  - { label: "3 colors", query: "target=3" }
  - { label: "4 colors", query: "target=4" }
---

A cartographer draws maps for a living, but she is too poor to own many
crayons. She needs to color every country so that no two countries sharing
a border look the same, using as few colors as possible. You'll color her
maps for her.

## The one rule

Two countries that share a border must be different colors. Countries
that only touch at a single corner point are allowed to match. Here's a
tiny map, already colored:

<svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="Four countries, Northland, Westland, Eastland, and Southland, arranged so Northland and Southland share a pattern, and Westland and Eastland share a different pattern.">
  <defs>
    <pattern id="ex-a" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#fff"/>
      <circle cx="3" cy="3" r="1.6" fill="#111"/>
      <circle cx="8" cy="8" r="1.6" fill="#111"/>
    </pattern>
    <pattern id="ex-b" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="10" height="10" fill="#fff"/>
      <rect width="4" height="10" fill="#111"/>
    </pattern>
  </defs>
  <rect x="8" y="8" width="204" height="50" fill="url(#ex-a)" stroke="#111" stroke-width="2.5"/>
  <text x="110" y="38" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Northland</text>
  <rect x="8" y="58" width="92" height="104" fill="url(#ex-b)" stroke="#111" stroke-width="2.5"/>
  <text x="54" y="114" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Westland</text>
  <rect x="120" y="58" width="92" height="104" fill="url(#ex-b)" stroke="#111" stroke-width="2.5"/>
  <text x="166" y="114" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Eastland</text>
  <rect x="8" y="162" width="204" height="50" fill="url(#ex-a)" stroke="#111" stroke-width="2.5"/>
  <text x="110" y="192" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">Southland</text>
</svg>

Northland borders both Westland and Eastland, so it can't match either of
them. Westland and Eastland don't touch each other at all, so they're free
to match. Southland borders Westland and Eastland too, so it has to match
Northland instead. Only 2 patterns needed for 4 countries.

## What to do

1. Pick a color or pattern for one country.
2. Anything that touches it needs a different color or pattern.
3. Keep going until every country is filled in.
4. Try to use as few colors or patterns as possible.
5. Do the same for the next map, which has more countries.

<noscript><p class="callout warning">This worksheet draws its maps with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="graphs-questions" id="q-poor-cartographer"></div>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Draw a map you think needs 5 colors. It's been proven that every flat map
can be colored with only 4, so however hard you try, someone should be
able to find a 4-color solution to your map.
</aside>

**Learn more:** this is called [graph coloring](https://en.wikipedia.org/wiki/Graph_coloring),
and it also shows up in scheduling problems, like building a class
timetable with no student double-booked.

<section class="answer-key graphs-answer-key" id="key-poor-cartographer"></section>

<script type="application/json" data-poor-cartographer-set data-questions="#q-poor-cartographer" data-key="#key-poor-cartographer">{{ site.data.unplugged.poor_cartographer.maps | jsonify }}</script>
