---
title: "Creature Sorting: Real if Statements"
source: original
level: hs
kind: [supplementary]
topics: [Boolean logic]
time: 15
grouping: Solo
materials: "Pencil"
supports: /unplugged/creature-sorting/
supports_title: "Creature Sorting"
scripts: [/assets/js/unplugged/creature-page.js]
---

If you did [Creature Sorting]({{ '/unplugged/creature-sorting/' | relative_url }}),
you already know how AND, OR, and NOT work. Python uses the exact same
logic. The only thing that changes is the spelling: instead of the
AP-style `AND`, `OR`, `NOT`, Python writes `and`, `or`, `not`, in lowercase.
Everything else, including the inclusive OR and the way NOT only touches
what comes right after it, works identically.

A real `if` statement in Python looks like this:

```python
if has_hat and not striped:
    print("This one gets a ribbon.")
```

That line is only true (and only prints the ribbon message) for a creature
that has a hat *and* isn't striped. Same rules, real code.

{% include unplugged/creature-trait-legend.html %}

<noscript><p class="callout warning">This worksheet draws its creatures with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div class="creature-questions" id="q-creature_sorting_2"></div>

<section class="answer-key creature-answer-key" id="key-creature_sorting_2"></section>

<script type="application/json" data-creature-set data-questions="#q-creature_sorting_2" data-key="#key-creature_sorting_2">{{ site.data.unplugged.creature_sorting_2 | jsonify }}</script>
