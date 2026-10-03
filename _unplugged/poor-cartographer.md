---
title: "The Poor Cartographer"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/graph-colouring/"
original_print: "https://classic.csunplugged.org/documents/activities/graph-colouring/unplugged-13-graph_colouring_0.pdf"
k5: true
level: ms
kind: [single, supplementary]
topics: [Graphs, Algorithms]
time: 30
grouping: Solo
materials: "Pencil, and colored pencils if you have them"
generator: /unplugged/poor-cartographer-generator/
generator_presets:
  - { label: "2 colors", query: "target=2" }
  - { label: "3 colors", query: "target=3" }
  - { label: "4 colors", query: "target=4" }
---

A cartographer draws maps for a living, but she is too poor to own many
crayons. It doesn't matter which color a country is, so long as it's
different to all the countries touching it. In this activity you'll color
her maps for her, using as few colors as possible.

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

If we color Northland red, then Westland and Eastland cannot be red,
since their border with Northland would be hard to see. We could color
Westland green, and it is also acceptable to color Eastland green,
because it does not share a border with Westland. Southland can be
colored red, and we end up needing only two colors for the whole map.

If you don't have colored pencils, use four different patterns instead:
dots, stripes, crosshatch, and plain. A pattern works exactly like a
color here.

## What to do

Color in the countries on each map below with as few colors (or
patterns) as possible, but make sure that no two bordering countries are
the same. Try coloring lightly at first, so you can change your mind.

<figure id="fig-cart-1">
  <img src="{{ '/assets/img/unplugged/poor-cartographer/worksheet-1.png' | relative_url }}" alt="Map 1: a hand-drawn wilderness map divided into countries by mountains and rivers, ready to color.">
  <figcaption>Map 1</figcaption>
</figure>

<figure id="fig-cart-2">
  <img src="{{ '/assets/img/unplugged/poor-cartographer/worksheet-2.png' | relative_url }}" alt="Map 2: two more hand-drawn wilderness maps stacked, ready to color.">
  <figcaption>Map 2 (two maps on this sheet)</figcaption>
</figure>

<figure id="fig-cart-3">
  <img src="{{ '/assets/img/unplugged/poor-cartographer/worksheet-3.png' | relative_url }}" alt="Map 3: a hand-drawn wilderness map divided into countries, ready to color.">
  <figcaption>Map 3</figcaption>
</figure>

<figure id="fig-cart-4">
  <img src="{{ '/assets/img/unplugged/poor-cartographer/worksheet-4.png' | relative_url }}" alt="Map 4: a map made of several overlapping rectangle outlines, ready to color.">
  <figcaption>Map 4</figcaption>
</figure>

Colors or patterns used on Map 1: <span class="fill-line short"></span>
Map 2 (top): <span class="fill-line short"></span>
Map 2 (bottom): <span class="fill-line short"></span>
Map 3: <span class="fill-line short"></span>
Map 4: <span class="fill-line short"></span>

Two of these four maps can be colored with just **two** colors. Which
ones? <span class="fill-line short"></span> Once one country on a map
like that is colored, what does that tell you about every country
touching it? <span class="fill-line"></span>

Look at whichever map needed **four** colors. Can you find four
countries where each one touches the other three? That's how you can
prove four colors are really needed, without trying every other
combination first. <span class="fill-line"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Draw a map you think needs five colors. It's been proven that every flat
map can be colored with only four, so however hard you try, someone
should be able to find a four-color solution to your map.
</aside>

**Learn more:** this is called [graph coloring](https://en.wikipedia.org/wiki/Graph_coloring),
and it also shows up in scheduling problems, like building a class
timetable with no student double-booked.

## What's it all about?

The problem you just solved is really about finding the smallest number
of colors needed for a map. The idea that any map can be colored with
only four colors was first guessed in 1852, but nobody managed to prove
it until 1976. That's over a hundred years of computer scientists and
mathematicians chipping away at one question.

Map coloring belongs to a bigger family of problems called *graph
coloring*. Draw a dot for each country and a line between any two
countries that share a border, and the coloring rule becomes: no two
dots joined by a line can share a color. The same idea can stand in for
all sorts of things other than countries, like school subjects that
can't share an exam period because some student takes both.

Small maps like the ones on this page are easy to color by hand. But as
a map (or a school timetable) gets bigger, checking every possible way to
color it takes longer and longer, the same way it did for the [Muddy
City]({{ '/unplugged/muddy-city/' | relative_url }}) problem's harder
cousin, the traveling salesperson. Finding the fewest colors for a huge
map is one of those problems computer scientists still don't have a fast
method for.

<section class="answer-key" markdown="1">
## Solutions and hints

**Map 1.** This is the only possible solution (of course, the choice of
colors is up to you, but only two different colors are required).

<figure>
  <img src="{{ '/assets/img/unplugged/poor-cartographer/solution-1.png' | relative_url }}" alt="Solution to Map 1, countries labeled red or green.">
</figure>

**Map 2.** The map at the top can be colored correctly using three
colors, while the one at the bottom requires four. Here are two possible
solutions.

<figure>
  <img src="{{ '/assets/img/unplugged/poor-cartographer/solution-2-top.png' | relative_url }}" alt="Solution to the top map on Map 2, countries labeled red, green, or blue.">
</figure>

<figure>
  <img src="{{ '/assets/img/unplugged/poor-cartographer/solution-2-bottom.png' | relative_url }}" alt="Solution to the bottom map on Map 2, countries labeled red, green, blue, or yellow.">
</figure>

**Map 3.** A simpler three-color map, with a possible solution shown
here.

<figure>
  <img src="{{ '/assets/img/unplugged/poor-cartographer/solution-3.png' | relative_url }}" alt="Solution to Map 3, countries labeled red, green, or yellow.">
</figure>

**Map 4.** A solution using just two colors (shaded and white).

<figure>
  <img src="{{ '/assets/img/unplugged/poor-cartographer/solution-4.png' | relative_url }}" alt="Solution to Map 4, rectangles shaded in an alternating pattern.">
</figure>
</section>
