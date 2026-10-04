---
title: "The Muddy City"
lesson_plan: /unplugged/muddy-city-lesson-plan/
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/minimal-spanning-trees/"
original_print: "https://classic.csunplugged.org/documents/activities/minimal-spanning-trees/unplugged-09-minimal_spanning_trees.pdf"
k5: true
reviewed: 2026-10-03
slides: /unplugged/muddy-city-slides/
level: ms
kind: [single, supplementary]
topics: [Graphs, Algorithms]
time: 30
grouping: Solo
materials: "Pencil"
generator: /unplugged/muddy-city-generator/
generator_presets:
  - { label: "Small towns", query: "size=small" }
  - { label: "Big towns", query: "size=big" }
scripts: [/assets/js/unplugged/muddy-city-extra-page.js]
---

Once upon a time there was a city that had no roads. Getting around the city
was particularly difficult after rainstorms because the ground became very
muddy—cars got stuck in the mud and people got their boots dirty. The
mayor of the city decided that some of the streets must be paved, but didn't
want to spend more money than necessary because the city also wanted to
build a swimming pool. The mayor therefore specified two conditions:

1. Enough streets must be paved so that it is possible for everyone to
   travel from their house to anyone else's house only along paved roads,
   and
2. The paving should cost as little as possible.

Here is the layout of the city. The number of paving stones between each
house represents the cost of paving that route. Find the best route that
connects all the houses, but uses as few paving stones as possible. Shade
the stones you would pave with your pencil (lightly at first, so you can
change your mind).

<figure id="fig-muddy-city">
  <img src="{{ '/assets/img/unplugged/muddy-city/city.png' | relative_url }}" alt="The Muddy City: houses joined by muddy streets, each street drawn as a row of paving stones">
  <figcaption>The Muddy City</figcaption>
</figure>

Total paving stones I used: <span class="fill-line short"></span>

<section class="muddy-graph" markdown="1">
What strategies did you use to solve the problem?
<p class="fill-line"></p>
<p class="fill-line"></p>

## Variations and extensions

Here is another way of representing the cities and roads:

<figure id="fig-muddy-graph">
  <img src="{{ '/assets/img/unplugged/muddy-city/graph.png' | relative_url }}" alt="A graph: ten circles joined by lines, each line labeled with a number from 2 to 6">
  <figcaption>The same kind of problem drawn as a graph</figcaption>
</figure>

The houses are represented by circles, the muddy roads by lines, and the
length of a road is given by the number beside the line.

Computer scientists and mathematicians often use this sort of diagram to
represent these problems. They call it a *graph*. This may be confusing at
first because "graph" is sometimes used in statistics to mean a chart
displaying numerical data, such as a bar graph, but the graphs that computer
scientists use are not related to these. The lengths do not have to be drawn
to scale.

Find the cheapest set of roads for this graph too. Total: <span class="fill-line short"></span>

Now try this method on the graph: start with no roads paved. Pave the
cheapest road first, then the next cheapest, and so on, but **skip** any road
that joins two houses that can already reach each other on paved roads. Did
you get the same total as before? <span class="fill-line short"></span>

Is there more than one best answer for the graph? How do you know?
<p class="fill-line"></p>

Can you find out a rule to describe how many roads or connections are
needed for a best solution? Does it depend on how many houses there are in
the city?
<p class="fill-line"></p>

A mail carrier has to walk to every house exactly once and end up back where
they started. Could they always do that using only the roads you paved? Why
or why not?
<p class="fill-line"></p>
</section>

<section class="muddy-reading" markdown="1">
## What's it all about?

Suppose you are designing how a utility such as electricity, gas, or water
should be delivered to a new community. A network of wires or pipes is
needed to connect all the houses to the utility company. Every house needs
to be connected into the network at some point, but the route taken by the
utility to get to the house doesn't really matter, just so long as a route
exists. The task of designing a network with a minimal total length is called
the *minimal spanning tree* problem.

Minimal spanning trees aren't only useful in gas and power networks; they
also help us solve problems in computer networks, telephone networks, oil
pipelines, and airline routes.

There are efficient algorithms (methods) for solving minimal spanning tree
problems. A simple method that gives an optimal solution is to start with no
connections, and add them in increasing order of size, only adding
connections that join up part of the network that wasn't previously
connected. This is called Kruskal's algorithm after J.B. Kruskal, who
published it in 1956.

For many problems on graphs, including the "travelling salesperson problem",
computer scientists are yet to find fast enough methods that find the best
possible solution.

<aside class="callout note" markdown="1">
**MUDDY CITY VS. THE TRAVELING SALESPERSON**

The two problems look alike, but they are very different for a computer.

- **Muddy City:** connect every house as cheaply as possible. The method
  above always finds the best answer, and a computer can run it on a map
  with a million houses in the blink of an eye.
- **Traveling salesperson:** find the shortest single trip that visits every
  house once and comes back home. Nobody has ever found a fast method that
  always gives the best trip. Trying every possible trip works for a few
  houses, but the number of trips explodes: 10 houses have 181,440 different
  round trips, and 20 houses have about 60 quadrillion.

Computer scientists call the traveling salesperson problem **NP-complete**.
Curious what that actually means? Math fans, keep reading below.
</aside>

<aside class="callout challenge" markdown="1">
**NP-COMPLETE (for math fans and AP students)**

Some problems are **easy to check** but **hard to solve**. A filled-in
Sudoku is quick to check; a giant empty one can take forever to solve.

- **P** problems are easy to *solve*: as the problem grows, the work grows
  like *n*<sup>2</sup> or *n*<sup>3</sup> (that's "polynomial"). Muddy City
  is in P: pave the cheapest road unless it makes a loop.
- **NP** problems are easy to *check*: hand someone an answer and they can
  verify it fast. NP stands for "nondeterministic polynomial," **not** "not
  polynomial." Every P problem is in NP too.
- **NP-complete** problems are the hardest ones in NP, and they're all
  linked: a fast way to solve any one of them would solve all of them.

The traveling salesperson problem, asked as a yes or no question ("is there
a round trip shorter than 100 miles?"), is NP-complete. Checking a trip is
easy: add up the miles. Finding one seems to need trying trip after trip,
and the number of trips grows like *n*! instead of *n*<sup>2</sup>:

| Houses (*n*) | *n*<sup>2</sup> | *n*! |
|---|---|---|
| 5 | 25 | 120 |
| 10 | 100 | 3,628,800 |
| 20 | 400 | about 2.4 quintillion |

Nobody has found a fast way to solve any NP-complete problem, and nobody
has proven there isn't one. That question is called **P versus NP**, and
there's a million-dollar prize for the answer.
</aside>

Learn more: [minimum spanning trees](https://en.wikipedia.org/wiki/Minimum_spanning_tree),
[the traveling salesperson problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem),
and [P versus NP](https://en.wikipedia.org/wiki/P_versus_NP_problem).
</section>

<section class="muddy-extra" markdown="1">
## Keep going

Here are three more towns to pave. Same two rules as before:
pave enough roads to connect every house, and use as few paving stones as
possible.

<noscript><p class="callout warning">These extra towns draw with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="muddy-extra-towns" id="muddy-extra-towns"></div>

<script type="application/json" data-muddy-extra-set data-towns="#muddy-extra-towns" data-key="#muddy-extra-towns-key">{{ site.data.unplugged.muddy_city_extra.towns | jsonify }}</script>
</section>

<section class="answer-key" markdown="1">
## Answer key

**The Muddy City.** Two possible best solutions (paved stones shown black):

<div class="muddy-key">
  <img src="{{ '/assets/img/unplugged/muddy-city/solution-1.png' | relative_url }}" alt="One best solution, with the paved stones shaded black">
  <img src="{{ '/assets/img/unplugged/muddy-city/solution-2.png' | relative_url }}" alt="A second best solution, with the paved stones shaded black">
</div>

**The graph.** The fewest paving stones is
**{{ site.data.unplugged.muddy_city_book.fewest_stones }}**. One way: pave
every road of length 2, then add roads of length 3 and then 4 only when they
join houses that aren't already connected.

**The method.** Yes, it gives {{ site.data.unplugged.muddy_city_book.fewest_stones }}
again: this method (Kruskal's algorithm) always finds a best answer.

**More than one best answer?** Yes. In the graph, the two houses along the
bottom right can join the rest by either of two different roads of length 4,
and both choices give the same total. (The city picture also has more than one, as the two
solutions above show.)

**The rule.** A city with *n* houses always needs exactly *n* &minus; 1
roads in a best solution: fewer can't connect every house, and one more
would make a loop that isn't needed.

**The mail carrier.** No. A best paving never contains a loop, so there is no
way to get back home without walking some roads twice. The mail carrier's
question is a different problem: the traveling salesperson problem.

**Keep-going towns.** Minimum stones and one best set of roads for
each extra town:

<div class="muddy-extra-towns-key" id="muddy-extra-towns-key"></div>
</section>
