---
title: "The Paper That Never Loses"
source: teaching-london-computing
source_url: https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/the-intelligent-piece-of-paper-activity/
level: ms
kind: [single]
topics: [Algorithms]
time: 30
grouping: Pair, or solo playing both sides
materials: "Pencil, and a partner if you have one"
---

A computer program is a list of steps followed exactly, with no thinking
involved. Below is one for tic-tac-toe, in plain English instead of code:
follow it in Part 1, then write your own in Part 2.

### Part 1: follow the program

1. Find a partner. No partner? Play both sides yourself, one hand for
   each player.
2. **Game 1: you are the Paper**, the computer. Follow only the program
   below, no judgment calls. Your partner is **the Human**: they play
   their best move.
3. The Paper always goes first and always plays X.
4. **Game 2: swap roles.** Now your partner is the Paper and you're the
   Human.

**What's a corner?** The four corner squares are corners, the middle one
is the center, the rest are sides. Opposite corners are diagonal, like
top-left and bottom-right.

### A quick look before you start

Here's what "following the program" looks like:

<div class="tlc-boards keep-together">
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Move 1, then Human plays a side</p>
    <table class="tlc-board tlc-board-mini"><tbody>
    <tr><td>X</td><td>O</td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Move 2</p>
    <table class="tlc-board tlc-board-mini"><tbody>
    <tr><td>X</td><td>O</td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td>X</td></tr>
    </tbody></table>
  </div>
</div>

### The Paper's program

<ul class="tlc-program">
<li><strong>Move 1.</strong> Play any corner.</li>
<li><strong>Move 2.</strong> If the Human didn't play the corner opposite
Move 1, play there now. Otherwise, play any other corner.</li>
<li><strong>Moves 3 and 4.</strong> Same rule both times: if two of your
X's share a line with the third square empty, play there and win. If not,
but two O's do, play there to block. Otherwise, take a corner.</li>
<li><strong>Move 5.</strong> Play the one square left.</li>
</ul>

<div class="tlc-boards">
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Game 1: you're the Paper</p>
    <table class="tlc-board"><tbody>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <div class="tlc-board-wrap">
    <p class="tlc-board-label">Game 2: swap, you're the Human</p>
    <table class="tlc-board"><tbody>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
</div>

**Check yourself.** The Paper should never lose, only win or draw. If it
loses, someone skipped a step: find where.

<aside class="callout note tlc-heuristic" markdown="1">
**WHAT'S A HEURISTIC?**

A heuristic is a rule of thumb: a quick way to decide that usually works
well, without checking every possibility. The AP Computer Science
Principles course framework defines it more exactly: "an approach to a
problem that produces a solution that is not guaranteed to be optimal but
may be used when techniques that are guaranteed to always find an optimal
solution are impractical."

Each rule (win if you can, block if you must, take a corner) is a
heuristic. Tic-tac-toe is small enough to check completely, so these
never lose. Othello is too big to check, so heuristics are all a player
has, and it can lose:
[try the Paper Othello Player](/unplugged/paper-othello/).
</aside>

### Part 2: be the programmer

Now the Paper goes second and plays O. You write the rules this time.

1. Fill in your rules below, Move 1 to 4. Hint: after a corner, take the
   center.
2. Test it: your partner plays X against your program below. If it
   loses, find and fix the rule that failed, then try again. That's
   debugging.

<table class="checkoff tlc-move-table tlc-move-table-tight"><tbody>
<tr><td class="checkbox-cell">1</td><td></td></tr>
<tr><td class="checkbox-cell">2</td><td></td></tr>
<tr><td class="checkbox-cell">3</td><td></td></tr>
<tr><td class="checkbox-cell">4</td><td></td></tr>
</tbody></table>

<div class="tlc-boards tlc-test-boards keep-together">
  <div class="tlc-board-wrap">
    <table class="tlc-board tlc-board-small"><tbody>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <div class="tlc-board-wrap">
    <table class="tlc-board tlc-board-small"><tbody>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <div class="tlc-board-wrap">
    <table class="tlc-board tlc-board-small"><tbody>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
</div>
