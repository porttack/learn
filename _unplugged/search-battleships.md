---
title: "Battleships: Searching"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Algorithms, Searching]
time: 20
grouping: Pair
materials: "Pencil"
---

{% include unplugged/player-switch.html %}

You and a partner will hunt for a number two ways: checking ships one at a
time, then jumping to the middle of a sorted row. Count your shots to see
which way is faster.

<section class="search-player" data-player="A" markdown="1">
{% include unplugged/name-line.html %}
## Player A's sheet

Keep this sheet hidden from Player B.

1. The ships on this sheet are **yours**. When Player B calls a letter,
   read them the number under it.
2. Take turns. On your turn, call one of Player B's letters to hunt
   for your target number. Each letter you call is one shot.
3. Write down every letter you call, and stop when you find the target.

**Round 1: ships in random order.**

{% include unplugged/search-ships.html letters=site.data.unplugged.search_battleships.letters values=site.data.unplugged.search_battleships.players.A.round1_order %}

Your target: the ship worth **{{ site.data.unplugged.search_battleships.targets.a_finds_on_b.value }}** on Player B's sheet.
Letters you call: <span class="fill-line"></span>
Shots: <span class="fill-line short"></span>

**Round 2: the same ships, sorted smallest to largest.** Player B's
are sorted too, so don't start at A. Call the middle letter, **C**. If
that number is too small, your target is to the right; too big, to the left.
Keep jumping to the middle of what's left.

{% include unplugged/search-ships.html letters=site.data.unplugged.search_battleships.letters values=site.data.unplugged.search_battleships.players.A.sorted %}

Same target, **{{ site.data.unplugged.search_battleships.targets.a_finds_on_b.value }}**. Letters you call: <span class="fill-line"></span>
Shots: <span class="fill-line short"></span>

**After you play:** which round took fewer shots? Why did sorting help?
<span class="fill-line"></span>
</section>

<section class="search-player" data-player="B" markdown="1">
{% include unplugged/name-line.html %}
## Player B's sheet

Keep this sheet hidden from Player A.

1. The ships on this sheet are **yours**. When Player A calls a letter,
   read them the number under it.
2. Take turns. On your turn, call one of Player A's letters to hunt
   for your target number. Each letter you call is one shot.
3. Write down every letter you call, and stop when you find the target.

**Round 1: ships in random order.**

{% include unplugged/search-ships.html letters=site.data.unplugged.search_battleships.letters values=site.data.unplugged.search_battleships.players.B.round1_order %}

Your target: the ship worth **{{ site.data.unplugged.search_battleships.targets.b_finds_on_a.value }}** on Player A's sheet.
Letters you call: <span class="fill-line"></span>
Shots: <span class="fill-line short"></span>

**Round 2: the same ships, sorted smallest to largest.** Player A's
are sorted too, so don't start at A. Call the middle letter, **C**. If
that number is too small, your target is to the right; too big, to the left.
Keep jumping to the middle of what's left.

{% include unplugged/search-ships.html letters=site.data.unplugged.search_battleships.letters values=site.data.unplugged.search_battleships.players.B.sorted %}

Same target, **{{ site.data.unplugged.search_battleships.targets.b_finds_on_a.value }}**. Letters you call: <span class="fill-line"></span>
Shots: <span class="fill-line short"></span>

**After you play:** which round took fewer shots? Why did sorting help?
<span class="fill-line"></span>
</section>

<section class="answer-key" markdown="1">
## Answer key

{% assign letters = site.data.unplugged.search_battleships.letters %}
{% assign t_ab = site.data.unplugged.search_battleships.targets.a_finds_on_b %}
{% assign t_ba = site.data.unplugged.search_battleships.targets.b_finds_on_a %}

**Player A hunts on Player B's ships. Target: {{ t_ab.value }}.**

{% assign r1 = "" %}{% for v in site.data.unplugged.search_battleships.players.B.round1_order %}{% if v == t_ab.value %}{% assign r1 = letters[forloop.index0] %}{% endif %}{% endfor %}
{% assign r2 = "" %}{% for v in site.data.unplugged.search_battleships.players.B.sorted %}{% if v == t_ab.value %}{% assign r2 = letters[forloop.index0] %}{% endif %}{% endfor %}

- Round 1 (random order): the target is under letter **{{ r1 }}**. Calling every letter in order takes **{{ t_ab.linear_count }}** shots.
- Round 2 (sorted): the target is under letter **{{ r2 }}**. Jumping to the middle each time takes **{{ t_ab.binary_count }}** shots.

**Player B hunts on Player A's ships. Target: {{ t_ba.value }}.**

{% assign r3 = "" %}{% for v in site.data.unplugged.search_battleships.players.A.round1_order %}{% if v == t_ba.value %}{% assign r3 = letters[forloop.index0] %}{% endif %}{% endfor %}
{% assign r4 = "" %}{% for v in site.data.unplugged.search_battleships.players.A.sorted %}{% if v == t_ba.value %}{% assign r4 = letters[forloop.index0] %}{% endif %}{% endfor %}

- Round 1 (random order): the target is under letter **{{ r3 }}**. Calling every letter in order takes **{{ t_ba.linear_count }}** shots.
- Round 2 (sorted): the target is under letter **{{ r4 }}**. Jumping to the middle each time takes **{{ t_ba.binary_count }}** shots.
</section>

