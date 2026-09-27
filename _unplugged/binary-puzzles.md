---
title: "Binary Puzzles"
source: original
level: both
kind: [single]
topics: [Binary, Logic puzzles]
time: 30
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/binairo-page.js]
generator: /unplugged/binary-puzzles-generator/
generator_presets:
  - { label: "6x6 easy", query: "level=6-easy" }
  - { label: "6x6 harder", query: "level=6-hard" }
  - { label: "8x8", query: "level=8" }
  - { label: "10x10", query: "level=10" }
---

A binary puzzle is a grid of empty squares. Your job is to fill every
square with a **0** or a **1**. It plays a lot like sudoku, except there
are only two digits instead of nine, and just three rules to remember.

Every puzzle here has exactly one correct answer. There's no guessing
involved. If you get stuck, it means one of the rules can tell you more
than you've noticed yet, not that you need to pick a digit and hope.

## The three rules

1. **No three in a row.** You can have two 0s or two 1s touching, side by
   side or stacked up and down, but never three of the same digit in a row.
2. **Balance.** Every row and every column ends up with the same number of
   0s as 1s. A 6 by 6 puzzle has three of each in every row and column. An
   8 by 8 puzzle has four of each.
3. **No two rows or columns match.** Once every square is filled in, no
   row is identical to another row, and no column is identical to another
   column.

That's the whole game. Every square you fill in should follow from these
three rules and the squares already on the page, not from a guess.

## How to solve it

Three tricks get you most of the way through any puzzle. None of them
involve guessing: each one takes squares you can already see and tells you
what a nearby empty square has to be.

**Trick 1: two of the same digit side by side.** Rule 1 says you can't have
three in a row. So if two touching squares already match, the squares
immediately on both ends of that pair can't be the same digit, because
that would make three.

<div class="binairo-example">
<table class="binairo-grid">
<tr><td class="given">0</td><td class="given">0</td><td class="target">?</td></tr>
</table>
<p class="binairo-example-caption">Two 0s side by side. A third 0 would break rule 1, so this square has to be a <strong>1</strong>.</p>
</div>

This works up and down a column too, not just along a row.

**Trick 2: two of the same digit with a gap.** The same idea works when
one empty square sits directly between two matching digits. The middle
square can't match them, or you'd have three in a row again, just with the
gap now filled in.

<div class="binairo-example">
<table class="binairo-grid">
<tr><td class="given">0</td><td class="target">?</td><td class="given">0</td></tr>
</table>
<p class="binairo-example-caption">0, gap, 0. The middle square can't be a 0 either, so it has to be a <strong>1</strong>.</p>
</div>

**Trick 3: a row or column that's already half full.** Rule 2 says every
row and column ends up with the same number of 0s as 1s. So the moment a
row already has half its squares filled with 1s, every other empty square
in that row has to be a 0, whether or not those squares touch each other.

<div class="binairo-example">
<table class="binairo-grid">
<tr><td class="given">1</td><td class="target">?</td><td class="given">1</td><td class="target">?</td></tr>
</table>
<p class="binairo-example-caption">A 4-wide row already has both of its 1s. Every other square in that row has to be a <strong>0</strong>.</p>
</div>

Work a puzzle by scanning for these three patterns over and over. Filling
in one square often reveals a new pair or a new half-full row somewhere
else, so a puzzle usually finishes in a cascade once you get a few squares
in.

The last rule, no matching rows or columns, mostly matters on bigger
puzzles once tricks 1 through 3 run out of new squares to give you. If two
rows end up looking almost identical with only a couple of empty squares
left between them, you can often figure out the last few squares by making
sure the finished row doesn't exactly copy one that's already done.

## Why computers care about 0s and 1s

Every value stored inside a computer, letters, colors, sound, all of it,
eventually comes down to a long string of 0s and 1s. A single 0 or 1 on
its own can't say much, but a computer never uses just one. It's the
*pattern* across many of them that carries meaning, the same way a single
square in one of these puzzles doesn't tell you much, but the whole filled
grid does.

## The puzzles

Fill in every empty square with a 0 or a 1. Work in pencil so you can fix a
mistake if the rules catch you out. Warm up on the small grids first, they
use the exact same three rules as the bigger ones.

<noscript><p class="callout warning">This worksheet draws its puzzle grids with JavaScript. Turn JavaScript on to see them.</p></noscript>

<div class="binairo-questions" id="q-binary_puzzles"></div>


<section class="answer-key binairo-answer-key" id="key-binary_puzzles"></section>

<script type="application/json" data-binairo-set data-questions="#q-binary_puzzles" data-key="#key-binary_puzzles">{{ site.data.unplugged.binary_puzzles.puzzles | jsonify }}</script>
