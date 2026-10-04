---
title: "The Muddy City: lesson plan"
source: original
level: ms
companion: true
name_line: false
standards_locator: muddy-city
standards_open: true
---

A short teacher-led plan for [The Muddy City]({{ '/unplugged/muddy-city/' | relative_url }}):
connect every house in a muddy town using as few paving stones as possible.
About **50 minutes**. Leaving it for a sub? Use the box below.

{% include unplugged/sub-box.html
   sheet="/unplugged/muddy-city/"
   generator="/unplugged/muddy-city-generator/"
   keep_going="new muddy town to pave"
   note="**Slides are optional.** The sheet explains everything. The NP-complete box near the end is optional reading for curious students."
   say="The mayor wants to pave just enough roads so everyone can reach everyone's house, using as few paving stones as possible. Shade lightly first; you can change your mind." %}

## Students will be able to

- Find a cheapest set of roads that connects every house.
- Follow a step-by-step method (pave the cheapest road unless it makes a loop).
- Notice that a city with *n* houses always needs *n* &minus; 1 roads.

## Before class

- Print one [worksheet]({{ '/unplugged/muddy-city/' | relative_url }}) per student.
- Print keep-going sheets from the [New set page]({{ '/unplugged/muddy-city-generator/' | relative_url }}):
  Copies = class size, Sets per student = 2 (front and back).
- Optional: the [slides]({{ '/unplugged/muddy-city-slides/' | relative_url }}).

## The lesson

### 1. Hook (5 minutes)

Show the slides up to **A Tiny Town**: three houses, three possible roads.
Ask which two roads to pave. (The 2 and the 3: 5 stones.)

### 2. The city (15 minutes)

Students solve the big city on the sheet. Let them try their own way first;
don't give away the method. Ask a few students to share totals: different
totals mean someone can still improve.

### 3. The graph and the method (10 minutes)

Students do the graph version, then try the method on the sheet: pave the
cheapest road first, skip any road that joins two houses already connected.
Did it match their best total?

### 4. Keep going (as students finish)

The three towns at the end of the sheet, then keep-going sheets.

### 5. Wrap-up (5 minutes)

Ask: *"How many roads does a city with 10 houses need?"* (9.) *"Why not
10?"* (The tenth would make a loop you don't need.)

{% include standards-alignment.html %}
