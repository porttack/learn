---
title: "Trace a Search"
source: original
level: ms
kind: [single, supplementary]
topics: [Algorithms, Searching]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/search-trace-generator/
generator_presets:
  - { label: "15 numbers", query: "level=15&mode=sorted" }
  - { label: "31 numbers", query: "level=31&mode=sorted" }
  - { label: "Unsorted list", query: "level=15&mode=unsorted" }
---

<div class="search-intro" markdown="1">
Computers search through sorted lists all the time, like looking up a word
in a dictionary. There are two common ways to do it. In this activity you
will trace both by hand on the same list, and see which one wins.

### How to trace it

1. Look at the list of boxes below. It is sorted from smallest to largest.
2. For Target 1, mark each box your linear search checks, left to right.
3. Then mark each box your binary search checks. Start in the middle.
4. Write how many checks each search took.
5. For Targets 2 and 3, just write the counts. Don't mark boxes again.

**Finding the middle.** Count how many boxes are left, then divide by two
and round down. If 6 boxes are left, the middle is the 3rd one.

### How it works: a worked example

This small list is not part of the exercise, just an example, with target
**31**. **L1, L2, ...** marks a linear search, checking boxes left to
right. **B1, B2, ...** marks a binary search, starting in the middle:

{% include unplugged/search-list.html list=site.data.unplugged.search_trace.demo.list mode="dual" linear_checks=site.data.unplugged.search_trace.demo.linear_checks binary_checks=site.data.unplugged.search_trace.demo.binary_checks small=true %}

Linear took 5 checks. Binary took 3: it throws out half the boxes every
time, since it knows the target must be bigger or smaller than the one it
just checked.
</div>

## Your turn

<p class="search-list-label">The list:</p>

{% include unplugged/search-list.html list=site.data.unplugged.search_trace.main.list mode="display" %}

**Target 1: {{ site.data.unplugged.search_trace.main.targets[0].value }}.**

<p class="search-list-label">Linear search: mark each box you check, in order.</p>

{% include unplugged/search-list.html list=site.data.unplugged.search_trace.main.list mode="mark" %}

Checks: <span class="fill-line short"></span>

<p class="search-list-label">Binary search: start in the middle, then go left or right.</p>

{% include unplugged/search-list.html list=site.data.unplugged.search_trace.main.list mode="mark" %}

Checks: <span class="fill-line short"></span>

**Target 2: {{ site.data.unplugged.search_trace.main.targets[1].value }}.** Using the
same list above, how many checks would each search take?
Linear: <span class="fill-line short"></span>
Binary: <span class="fill-line short"></span>

**Target 3: {{ site.data.unplugged.search_trace.main.targets[2].value }}.** This number
is not in the list. How many checks does each search take before it can be
sure the number isn't there?
Linear: <span class="fill-line short"></span>
Binary: <span class="fill-line short"></span>

**Which was faster?** Look at Target 1. Which search took fewer checks?
Why do you think binary search can skip so many boxes?
<span class="fill-line"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

How many checks would binary search need for a list of 1,000 numbers?
</aside>

<section class="answer-key" markdown="1">
## Answer key

{% assign targets = site.data.unplugged.search_trace.main.targets %}
{% for t in targets %}
**Target {{ forloop.index }}: {{ t.value }}{% unless t.found %} (not in the list){% endunless %}.** L marks a linear search check, B a binary search check, in order.

{% include unplugged/search-list.html list=site.data.unplugged.search_trace.main.list mode="dual" linear_checks=t.linear_checks binary_checks=t.binary_checks small=true %}

Linear: **{{ t.linear_count }}** checks. Binary: **{{ t.binary_count }}** checks.
{% endfor %}
</section>
