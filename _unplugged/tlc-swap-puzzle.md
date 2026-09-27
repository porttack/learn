---
title: "The Swap Puzzle"
source: teaching-london-computing
source_url: https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/the-swap-puzzle-activity/
level: ms
kind: [single]
topics: [Strategy games, Algorithms]
time: 20
grouping: Solo, or pair to compare solutions
materials: "Pencil (coins or scraps of paper help, but pencil marks work fine)"
scripts: [/assets/js/unplugged/tlc-swap-puzzle-page.js]
---

Trial and error can solve this puzzle, eventually, but a good solver does
better: they find the shortest way and write it down as an exact list of
steps, so anyone could follow it and get the same result. That list is an
**algorithm**. This page has you build one.

## How it works

1. Draw a strip of squares like the one below, or use the one printed
   here. Mark H in the H squares, T in the T squares, and leave the empty
   square blank.
2. A piece can slide into an empty square right next to it.
3. A piece can also jump over one piece next to it, landing in an empty
   square just beyond.
4. Swap every H with every T using as few moves as possible.
5. Write your moves as a numbered list, like "square 0 to square 1," so
   someone else could follow them without watching you play.

## Worked example: 3 squares in 3 moves

<div class="tlc-strip-wrap keep-together">
<table class="tlc-strip"><tbody>
<tr><td class="tlc-strip-index">0</td><td class="tlc-strip-index">1</td><td class="tlc-strip-index">2</td></tr>
<tr><td>H</td><td class="tlc-strip-empty"></td><td>T</td></tr>
</tbody></table>
</div>

Goal: end up with T, empty, H, the two pieces swapped.

<div class="tlc-boards keep-together">
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Start</p>
    <table class="tlc-strip tlc-strip-mini"><tbody><tr><td>H</td><td class="tlc-strip-empty"></td><td>T</td></tr></tbody></table>
  </div>
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Done, in 3 moves</p>
    <table class="tlc-strip tlc-strip-mini"><tbody><tr><td>T</td><td class="tlc-strip-empty"></td><td>H</td></tr></tbody></table>
  </div>
</div>

1. Slide the piece in square 0 to square 1.
2. Jump the piece in square 2 over square 1 to square 0.
3. Slide the piece in square 1 to square 2.

Three moves is the fewest possible for this strip. No shorter algorithm
exists.

## Your turn: 5 squares

<div class="tlc-strip-wrap keep-together">
<table class="tlc-strip"><tbody>
<tr><td class="tlc-strip-index">0</td><td class="tlc-strip-index">1</td><td class="tlc-strip-index">2</td><td class="tlc-strip-index">3</td><td class="tlc-strip-index">4</td></tr>
<tr><td>H</td><td>H</td><td class="tlc-strip-empty"></td><td>T</td><td>T</td></tr>
</tbody></table>
</div>

<p class="tlc-strip-target">Target: swap every H with every T in <strong>8 moves</strong>. Write one move per line.</p>

<table class="checkoff tlc-move-table"><tbody>
{% for i in (1..8) %}<tr><td class="checkbox-cell">{{ i }}</td><td></td></tr>
{% endfor %}</tbody></table>

**Check yourself.** Play your list back on the strip above, one move at a
time. If it really ends with T, T, empty, H, H in 8 moves or fewer, you
found the shortest algorithm. If it takes more than 8, it still works, but
a faster one exists. Look at your worked example above: the same pattern
of slides and jumps, just repeated, gets you there.

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Draw a strip of 7 squares (3 H's, an empty square, then 3 T's) and swap
them. The target is 15 moves. Can you see how the number of moves grows as
the strip grows?
</aside>

<noscript><p class="callout warning">The answer key below needs JavaScript to draw itself.</p></noscript>

<section class="answer-key"></section>
