---
title: "Spit-Not-So: A Word Game With a Secret"
source: teaching-london-computing
source_url: https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/the-spit-not-so-activity/
level: ms
kind: [single]
topics: [Data representation]
time: 20
grouping: Pair
materials: "Pencil"
scripts: [/assets/js/unplugged/tlc-spit-not-so-page.js]
---

Spit-Not-So looks like a word game, but it hides a secret. The same nine
words can be arranged so the game becomes almost easy to win. Finding that
arrangement is what computer scientists call choosing a good **data
structure**: organizing information so a task is simple instead of hard.

## The words

<ul class="tlc-word-list">
<li>SPIT</li><li>NOT</li><li>SO</li><li>FAT</li><li>FOP</li><li>AS</li><li>IF</li><li>IN</li><li>PAN</li>
</ul>

## How to play

1. Play with a partner. Each of you picks a different mark, like a circle
   or a box, to claim a word.
2. Take turns marking one unclaimed word from the list above.
3. Once a word is marked, nobody else can take it.
4. You win by claiming three words that all share the same letter.
5. If every word is claimed and nobody has three words with a shared
   letter, it's a draw.

## A worked example

Here's a real game, one word claimed per turn:

SPIT, SO, FAT, NOT, FOP, IF, PAN.

Player 1 claimed SPIT, FAT, FOP, and PAN, in that order. Look closely:
SPIT, FOP, and PAN all contain the letter **P**. Three words, one shared
letter, Player 1 wins.

Play a full game with your partner now, using the plain list above. Notice
how much reading and rereading it takes to spot a shared letter.

## Now play the secret way

The exact same nine words, arranged in a grid instead of a list, turn this
into a game you already know:

<table class="tlc-board tlc-board-words keep-together"><tbody>
<tr><td>NOT</td><td>IN</td><td>PAN</td></tr>
<tr><td>SO</td><td>SPIT</td><td>AS</td></tr>
<tr><td>FOP</td><td>IF</td><td>FAT</td></tr>
</tbody></table>

Every row, every column, and both diagonals share exactly one letter. The
middle row shares "S", the bottom row shares "F", the right column shares
"A", and so on. Claiming three words in a straight line is exactly the
same as claiming three words that share a letter, because that's how this
grid was built.

Play again with your partner. This time, mark an X or O over each word
your side claims, instead of circling it, and look for lines instead of
reading letters.

**Check yourself.** Whoever wins should have three words in a straight
line on this grid (a row, a column, or a diagonal), and those three words
really do share a letter, you can check by reading them. Playing the list
version and the grid version back to back, the grid version should feel
much faster.

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Count the letters in each word, then count how many lines (rows, columns,
diagonals) pass through its square: corners sit on 3 lines, the sides sit
on 2, and the center sits on 4. Every word's letter count matches its
square's line count exactly. Why do you think that's not a coincidence?
</aside>

<noscript><p class="callout warning">The answer key below needs JavaScript to draw itself.</p></noscript>

<section class="answer-key"></section>
