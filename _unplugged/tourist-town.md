---
title: "Tourist Town"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/dominating-sets/"
k5: true
level: ms
kind: [single, supplementary]
topics: [Graphs, Algorithms]
time: 30
grouping: Solo
materials: "Pencil"
generator: /unplugged/tourist-town-generator/
generator_presets:
  - { label: "Small town", query: "size=small" }
  - { label: "Big town", query: "size=big" }
---

The map below shows the streets of Tourist Town. The lines are streets
and the dots are street corners. Tourist Town is in a very hot country,
and in summer, ice-cream vans park at street corners and sell ice-cream
to visitors. You want to place vans so that everyone can reach one by
walking to the end of their street, and then at most one block further.
The question is: how many vans are needed, and which corners should they
go on?

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

Work out how to place ice-cream vans on the street intersections below
so that every other intersection is connected to one that has a van on
it. Circle a corner to mark a van. Use as few vans as possible.

<figure id="fig-tourist-town">
  <img src="{{ '/assets/img/unplugged/tourist-town/ice-cream-vans.png' | relative_url }}" alt="Ice Cream Vans: a round map of Tourist Town's street corners and the streets connecting them, ready to mark with van locations.">
  <figcaption>Ice Cream Vans</figcaption>
</figure>

Number of vans you used: <span class="fill-line short"></span>

<aside class="callout note" markdown="1">
**STUCK?**

The corner with the most streets meeting it isn't always a good place
for a van; it might cover corners that already had another way to be
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

## What's it all about?

Nobody knows a fast way to find the smallest set of van locations for a
map like this one, and nobody has proved that a fast way is impossible
either. The slow, sure way is to check every possible set of corners: with
the 26 corners in Tourist Town, there are 2<sup>26</sup>, or about 67
million, ways to place vans at all. Checking one setup a second, that's
around two years of checking, just for a town this size.

That's the same shape of problem as the [Poor
Cartographer]({{ '/unplugged/poor-cartographer/' | relative_url }})'s map
coloring, and [Muddy City]({{ '/unplugged/muddy-city/' | relative_url }})'s
harder cousin, the traveling salesperson: computer scientists call this
whole family **NP-complete**. Nobody has found a fast method for any of
them, and a fast method for one would give a fast method for all of them.

<section class="answer-key" markdown="1">
## Solution

The minimum number of vans for Tourist Town is six, but it's genuinely
hard to find them. This solution shows how the puzzle above was built:
start with the six small starred groups at the bottom, each of which
obviously needs only one van (its open circle), then those get linked up
with extra streets between the *other* corners to disguise where the
vans belong.

<figure>
  <img src="{{ '/assets/img/unplugged/tourist-town/ice-cream-vans-solution.png' | relative_url }}" alt="Ice Cream Vans Solution: the same map with the six van corners marked as open circles, plus the six starting groups the map was built from.">
</figure>
</section>
