---
title: "Creature Sorting"
source: original
level: both
kind: [single, supplementary]
topics: [Boolean logic]
time: 30
grouping: Solo
materials: "Pencil"
generator: /unplugged/creature-sorting-generator/
scripts: [/assets/js/unplugged/creature-page.js]
---

Every time a program makes a decision, it's asking a yes-or-no question.
`if the door is locked`, `if health is greater than zero`, `if the player
pressed jump`: underneath, every one of those questions is built from just
three words: **AND**, **OR**, and **NOT**. Get comfortable with those three
words on paper, and you'll read (and debug) real code faster, because you
won't have to guess what a condition means. You'll know.

## AND, OR, NOT, in plain words

- **AND** is true only when *both* sides are true. `round AND has_hat` means
  "this creature is round, and it also has a hat." Miss either one and the
  whole thing is false.
- **OR** is true when *at least one* side is true, including when both are.
  `round OR has_hat` is true for round creatures, hatted creatures, and
  creatures that are both. That last part trips people up: in everyday
  speech "or" sometimes means "one or the other, not both," but in code it
  never does, unless you write it that way yourself.
- **NOT** flips whatever comes right after it. `NOT round` is true for every
  creature that *isn't* round. It doesn't touch anything else in the
  expression, just the piece right next to it, unless parentheses say
  otherwise.

{% include unplugged/creature-trait-legend.html %}

## The creatures

Sixteen creatures, sixteen combinations of the four traits above. Every
creature has a number so you can write down your answers without redrawing
anything.

<noscript><p class="callout warning">This worksheet draws its creatures with JavaScript. Turn JavaScript on to see the questions.</p></noscript>

<div class="creature-questions" id="q-creature_sorting"></div>

Want more? [Make a new set of creature-sorting questions]({{ '/unplugged/creature-sorting-generator/' | relative_url }}).

<section class="answer-key creature-answer-key" id="key-creature_sorting"></section>

<script type="application/json" data-creature-set data-questions="#q-creature_sorting" data-key="#key-creature_sorting">{{ site.data.unplugged.creature_sorting | jsonify }}</script>
