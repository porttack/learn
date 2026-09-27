---
title: "The Paper Othello Player"
source: original
level: both
kind: [single]
topics: [Algorithms, Strategy games]
time: 30
grouping: Pair
materials: "Pencil, and coins or counters if you have them"
---

<div class="othello-sheet" markdown="1">

In [The Paper That Never Loses]({{ '/unplugged/tlc-intelligent-paper/' | relative_url }}), the Paper always won or drew at tic-tac-toe, because a program can check every possible tic-tac-toe game there is. Othello has far too many possible games to check them all, so this time the Paper can only follow rules of thumb, called **heuristics**. Play against it and find out: can you make it lose?

## The rules of Othello

Play on a 6 by 6 board. Start with four discs in the middle, as shown on the boards below.

1. Black always moves first.
2. On your turn, place one disc so it traps a straight line (row, column, or diagonal) of the other color between your new disc and one of your own.
3. Flip every trapped disc to your color, right away.
4. No legal move (nothing to trap)? Say "pass." Your turn is skipped and the other player goes again.
5. The game ends when neither player has a legal move. Count the discs. Whoever has more discs wins.

**See it happen.** Before Black's first move, the board looks like this. Black plays at **c2**, trapping the White disc at c3 between the new disc and the Black disc already at c4, so c3 flips to Black.

<div class="othello-example keep-together">
  <div class="othello-board-wrap">
    <p class="othello-board-label">Before</p>
    <table class="othello-board othello-board-mini othello-board-bare"><tbody>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td>W</td><td>B</td><td></td><td></td></tr>
    <tr><td></td><td></td><td>B</td><td>W</td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <p class="othello-example-arrow">&rarr;</p>
  <div class="othello-board-wrap">
    <p class="othello-board-label">After: Black plays c2</p>
    <table class="othello-board othello-board-mini othello-board-bare"><tbody>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td>B</td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td class="flip">B</td><td>B</td><td></td><td></td></tr>
    <tr><td></td><td></td><td>B</td><td>W</td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
</div>

## The Paper's program

The Paper only follows these rules, checked in order, top to bottom. It never thinks, it never guesses; only legal moves ever count.

<ol class="othello-program">
<li>If a legal move takes a corner (a1, f1, a6, or f6), play it.</li>
<li>Cross off any legal move that touches an empty corner, even diagonally, unless that would cross off every legal move. (Those squares hand the corner to the other player next turn.)</li>
<li>If a legal move is left on an edge square (touching the border, not a corner), play it.</li>
<li>Otherwise, play the legal move that flips the most discs.</li>
</ol>

**Still tied after a rule?** Play the move closest to the top of the board; if still tied, play the one farthest to the left. Working through this program from the very first move gives c2, the same move shown above.

**How to play.**

1. Decide who runs the Paper and who plays the Human.
2. Whoever runs the Paper follows its program exactly. No thinking allowed. The Paper is Black and always goes first.
3. The Human is White. Play your best move each turn.
4. When the game ends, count the discs and write the score below.
5. Swap jobs and play again on the next board.

| Game | Paper's discs | Human's discs | Who won |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
{: .checkoff .trace-table}

<div class="othello-boards">
  <div class="othello-board-wrap keep-together">
    <p class="othello-board-label">Game 1</p>
    <table class="othello-board"><colgroup><col style="width: 1.5em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"></colgroup><thead><tr><th></th><th>a</th><th>b</th><th>c</th><th>d</th><th>e</th><th>f</th></tr></thead>
    <tbody>
    <tr><th>1</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>2</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>3</th><td></td><td></td><td>W</td><td>B</td><td></td><td></td></tr>
    <tr><th>4</th><td></td><td></td><td>B</td><td>W</td><td></td><td></td></tr>
    <tr><th>5</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>6</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
  <div class="othello-board-wrap keep-together">
    <p class="othello-board-label">Game 2 (swap roles)</p>
    <table class="othello-board"><colgroup><col style="width: 1.5em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"><col style="width: 2.1em"></colgroup><thead><tr><th></th><th>a</th><th>b</th><th>c</th><th>d</th><th>e</th><th>f</th></tr></thead>
    <tbody>
    <tr><th>1</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>2</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>3</th><td></td><td></td><td>W</td><td>B</td><td></td><td></td></tr>
    <tr><th>4</th><td></td><td></td><td>B</td><td>W</td><td></td><td></td></tr>
    <tr><th>5</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><th>6</th><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </tbody></table>
  </div>
</div>

<aside class="callout note" markdown="1">
**WHAT'S GOING ON**

A heuristic is a rule of thumb: a shortcut that usually works, but isn't guaranteed. Tic-tac-toe is small enough to check every possible game, so a program never has to guess. Othello has billions of possible games, far too many to check, so the Paper guesses with heuristics instead, and that's why it can lose.
</aside>

**Your turn.** Change **one** rule in the Paper's program. For example, swap rules 3 and 4, or add a brand new rule near the top. Play at least one more game with your changed program. <span class="othello-reuse-note">(Erase one of the boards above and reuse it, or ask for another sheet.)</span>

Which rule did you change, and how? <span class="fill-line"></span><br>
Did the Paper do better or worse? <span class="fill-line"></span>

</div>
