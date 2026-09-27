---
title: "Nim: the take-away game"
source: original
level: both
kind: [single, supplementary]
topics: [Strategy games, Algorithms]
time: 30
grouping: Pair
materials: "Pencil (a coin or scrap of paper works too, if you'd rather cover a stone than cross it out)"
---

Nim is one of the oldest strategy games there is: just stones and turns, no
board, no dice, nothing hidden. Two people who both play their best will
not get the same result every time, one of them will always win, and which
one depends entirely on who is stuck moving first from a bad position.

That's the interesting part. Nim looks like luck, but it isn't. By the end
of this page you'll have played enough rounds to notice the pattern
yourself, and written it down as a set of steps, an algorithm, that always
wins from the right starting position.

## Part 1: one pile, race for the last stone

**The rules.** You and your partner take turns. On your turn, cross out 1,
2, or 3 stones from the pile, your choice. Whoever crosses out the last
stone on the board wins.

Play a few rounds on the boards below before you read any further. Swap who
goes first each time, that's the only way to notice whether going first is
actually good or bad.

<div class="nim-boards">
  <div class="nim-board">
    <p class="nim-board-label">Board 1: 13 stones</p>
    <div class="nim-pile">{% for i in (1..13) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 2: 15 stones</p>
    <div class="nim-pile">{% for i in (1..15) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 3: 16 stones</p>
    <div class="nim-pile">{% for i in (1..16) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 4: 21 stones</p>
    <div class="nim-pile">{% for i in (1..21) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
</div>

Keep track of a few games as you play:

| Game | Board # | Who went first | Who won |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
{: .checkoff .nim-record-table }

**Find the pattern.** The whole point is to find this yourself.

1. In a game you won, look back at the pile size right before each of your
   turns. Write down that list of numbers, in order.
   <span class="fill-line"></span>
2. Do those numbers share anything in common? Try the same thing for a
   different winning game and compare.
   <span class="fill-line"></span>
3. Write your rule as a short set of steps, an algorithm, that says exactly
   how many stones to take depending on how many are left. Be specific
   enough that a friend who has never played could follow it without
   asking you anything.
   <span class="fill-line-paragraph"></span>
   <span class="fill-line-paragraph"></span>

## Part 2: many piles at once

Real Nim uses more than one pile. The rule for a turn changes slightly:

**The rules.** Pick one pile (only one) and cross out any number of stones
from it, from just one stone to the whole pile. You still can't touch more
than one pile on the same turn. Whoever crosses out the last stone on the
whole board, across every pile, wins.

<div class="nim-boards">
  <div class="nim-board">
    <p class="nim-board-label">Board 5: piles of 3, 5, 7</p>
    <div class="nim-pile"><span class="nim-pile-label">Pile A</span>{% for i in (1..3) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile B</span>{% for i in (1..5) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile C</span>{% for i in (1..7) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 6: piles of 1, 3, 5</p>
    <div class="nim-pile"><span class="nim-pile-label">Pile A</span>{% for i in (1..1) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile B</span>{% for i in (1..3) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile C</span>{% for i in (1..5) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 7: piles of 2, 4, 6</p>
    <div class="nim-pile"><span class="nim-pile-label">Pile A</span>{% for i in (1..2) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile B</span>{% for i in (1..4) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile C</span>{% for i in (1..6) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
  <div class="nim-board">
    <p class="nim-board-label">Board 8: piles of 4, 5, 6</p>
    <div class="nim-pile"><span class="nim-pile-label">Pile A</span>{% for i in (1..4) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile B</span>{% for i in (1..5) %}<span class="nim-stone"></span>{% endfor %}</div>
    <div class="nim-pile"><span class="nim-pile-label">Pile C</span>{% for i in (1..6) %}<span class="nim-stone"></span>{% endfor %}</div>
  </div>
</div>

| Game | Board # | Who went first | Who won |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
{: .checkoff .nim-record-table }

**Find the pattern, part two.** There isn't one clean rule like "a multiple
of some number" this time, the pattern is still there, it just uses a
different kind of math. You don't need to solve it completely here.

4. After a game you won, write down the exact piles you left your opponent
   right after your best move (not the empty board at the end, the
   position right after that one good move).
   <span class="fill-line"></span>
5. Look across a few of those "handed to my opponent" positions. Do you
   notice anything about pairs of equal piles, or piles that seem to cancel
   each other out? Write down anything you notice, even a partial guess.
   <span class="draw-box"></span>

<aside class="callout note" markdown="1">
**WANT THE FULL TRICK?**

Multi-pile Nim's real strategy uses binary numbers, the same 0s and 1s a
computer uses to store everything. It's exact: it always finds the winning
move when one exists, and proves when it doesn't. Once you've written your
own guess above, see
[Nim: the binary secret]({{ '/unplugged/nim-binary-secret/' | relative_url }})
for the whole method, worked step by step.
</aside>

<section class="answer-key" markdown="1">
## Check your strategy

### Part 1: one pile

Every turn removes 1, 2, or 3 stones, never 4 or more. That means no single
move can jump over a gap of exactly 4. So if you ever hand your opponent a
pile that's a multiple of 4 (4, 8, 12, 16, ...), whatever they take next (1,
2, or 3), you can always take enough stones yourself to land back on a
multiple of 4 for their following turn: their move plus yours always adds
up to 4. Eventually you hand them 0 stones and there's nothing left for
them to take.

**The algorithm:** on your turn, take (pile size) modulo 4 stones. If the
pile is already an exact multiple of 4, you're the one in trouble, any
move you make now, your opponent can undo straight back to a multiple of
4.

Checking the boards, assuming both players always find the best move:

- **Board 1 (13 stones).** 13 is not a multiple of 4, so whoever goes
  first should win, by taking 1 stone.
- **Board 2 (15 stones).** Not a multiple of 4 either. First player wins
  by taking 3.
- **Board 3 (16 stones).** 16 **is** a multiple of 4. Whoever goes first
  is already stuck, the second player should win with correct play.
- **Board 4 (21 stones).** Not a multiple of 4. First player wins by
  taking 1.

If your record table doesn't match this for every game, look back at the
move where things went wrong, that's where someone (maybe your opponent!)
missed the best move.

### Part 2: many piles

The full method is on the binary secret page, but so you can check your
games so far, here's who should win from each board with perfect play:

- **Board 5 (3, 5, 7).** First player wins.
- **Board 6 (1, 3, 5).** First player wins.
- **Board 7 (2, 4, 6).** Second player wins, this is one of those
  positions where every pile looks different but they still cancel out.
- **Board 8 (4, 5, 6).** First player wins.
</section>
