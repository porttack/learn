---
title: "Treasure Island"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/finite-state-automata/"
original_print: "https://classic.csunplugged.org/documents/activities/finite-state-automata/unplugged-11-finite_state_automata.pdf"
k5: true
level: ms
kind: [single, supplementary]
topics: [Algorithms, Graphs]
time: 30
grouping: Solo
materials: "Pencil"
---

Your goal is to find Treasure Island. Pirate ships sail fixed routes between
islands, and every island has two ships leaving it, ship A and ship B. At
each island you choose one ship, and it carries you straight to the next
island on your route.

<figure id="fig-treasure-map">
  <img src="{{ '/assets/img/unplugged/treasure-island/map.png' | relative_url }}" alt="A map of seven islands. Pirates' Island connects by ship A to Shipwreck Bay and by ship B to Musket Hill. Shipwreck Bay connects by A to Musket Hill and by B to Dead Man's Island. Dead Man's Island connects by A to Musket Hill and by B to Shipwreck Bay. Musket Hill connects by A to Pirates' Island and by B to Mutineers' Island. Mutineers' Island connects by A to Smugglers' Cove and by B to Dead Man's Island. Smugglers' Cove connects by A to Pirates' Island and by B to Treasure Island. Treasure Island has no ships leaving it.">
  <figcaption>Figure: the treasure map. Every island's two ships, A and B.</figcaption>
</figure>

**Here's a route already worked out for you**, starting at Pirates' Island:
B, B, B, A, B, A, B.

<table class="route-trace">
  <thead><tr><th>Ship</th><th>You land on&hellip;</th></tr></thead>
  <tbody>
    <tr><td>Start</td><td>Pirates' Island</td></tr>
    <tr><td>B</td><td>Musket Hill</td></tr>
    <tr><td>B</td><td>Mutineers' Island</td></tr>
    <tr><td>B</td><td>Dead Man's Island</td></tr>
    <tr><td>A</td><td>Musket Hill</td></tr>
    <tr><td>B</td><td>Mutineers' Island</td></tr>
    <tr><td>A</td><td>Smugglers' Cove</td></tr>
    <tr><td>B</td><td><strong>Treasure Island!</strong></td></tr>
  </tbody>
</table>

Now you try it:

1. Always start at Pirates' Island.
2. Follow the letters below one at a time, moving to the next island each time.
3. Write down the name of the island where you land.
4. For the last two questions, trace routes with your finger before you write.

<div class="route-questions">
  <p><strong>Route A, A:</strong> where do you land? <span class="fill-line short"></span></p>
  <p><strong>Route B, B, A:</strong> where do you land? <span class="fill-line short"></span></p>
  <p><strong>Route A, A, A:</strong> where do you land? <span class="fill-line short"></span></p>
</div>

Find your own route from Pirates' Island to Treasure Island. Write the
letters you used: <span class="fill-line"></span>

Now find the **shortest** route you can. How many letters long is it?
<span class="fill-line short"></span>

Look at Musket Hill on the map. Once you land there, follow ship B, then
ship A, then ship B. Where do you end up? <span class="fill-line short"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Find a route from Pirates' Island to Treasure Island that visits Dead Man's
Island **twice**. Write the letters you used, in order.
</aside>

<section class="treasure-own-map" markdown="1">
## Make your own map

Can you hide your buried treasure well? How hard can you make it to find
the treasure? It's time to make your own map!

Draw your own basic plan like this, so you can clearly see the routes your
pirate ships will travel. Draw at least five islands, and give every island
(except your Treasure Island) two ships leaving it: A and B. What is the
most efficient sequence of routes to reach your Treasure Island?

<div class="draw-box" aria-label="Space to draw your own island map"></div>

Shortest route to my Treasure Island: <span class="fill-line"></span>

How well can a friend follow your map? Give them a sequence of As and Bs,
and see if they land on the correct island. You can make up a variety of
games and puzzles based on this idea of finite-state automata.
</section>

<section class="treasure-reading" markdown="1">
## What's it all about?

Finite-state automata are used in computer science to help a computer
process a sequence of characters or events.

A simple example is when you dial up a telephone number and you get a
message that says "Press 1 for this&hellip; Press 2 for that&hellip; Press 3
to talk to a human operator." Your key presses are inputs for a finite-state
automaton at the other end of the phone. The dialogue can be quite simple,
or very complex. Sometimes you are taken round in circles because there is a
peculiar loop in the finite-state automaton. If this occurs, it is an error
in the design of the system&mdash;and it can be extremely frustrating for the
caller!

Although computers are not really very good at understanding natural
language, they can readily process artificial languages. One important type
of artificial language is the programming language. Computers use
finite-state automata to read in programs and translate them into the form
of elementary computer instructions, which can then be "executed" directly
by the computer.

Learn more: [finite-state machines](https://en.wikipedia.org/wiki/Finite-state_machine).
</section>

<section class="answer-key" markdown="1">
## Answer key

{% assign map = site.data.unplugged.treasure_island %}
{% for r in map.practice_routes %}
{% assign endIsland = map.islands | where: "id", r.end | first %}
- Route {{ r.route | split: "" | join: ", " }} ends at **{{ endIsland.name }}**{% if r.note %} ({{ r.note }}){% endif %}.
{% endfor %}

**Shortest route.** {{ map.shortest_route.sequence | split: "" | join: ", " }}:
just **{{ map.shortest_route.length }}** letters. Any route to Treasure
Island has to pass through Musket Hill, then Mutineers' Island, then
Smugglers' Cove, so nothing shorter is possible.

**Musket Hill.** B, then A, then B from Musket Hill always finishes at
Treasure Island (Musket Hill &rarr; Mutineers' Island &rarr; Smugglers'
Cove &rarr; Treasure Island). That's the last three letters of the shortest
route above. The first letter just gets you from Pirates' Island to Musket
Hill.

**Challenge.** One route that visits Dead Man's Island twice: A, B, B, B, A,
B, A, B (Pirates' Island &rarr; Shipwreck Bay &rarr; Dead Man's Island &rarr;
Shipwreck Bay &rarr; Dead Man's Island &rarr; Musket Hill &rarr; Mutineers'
Island &rarr; Smugglers' Cove &rarr; Treasure Island). There are other
routes that work too.

**Your own map.** There's no single answer here. Trade maps with a partner
and check each other's shortest route by tracing it together.
</section>
