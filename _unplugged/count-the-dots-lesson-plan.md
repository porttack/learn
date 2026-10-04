---
title: "Count the Dots: lesson plan"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/binary-numbers/"
original_print: "https://classic.csunplugged.org/documents/activities/binary-numbers/unplugged-01-binary_numbers.pdf"
level: both
companion: true
name_line: false
standards_locator: count-the-dots
standards_open: true
standards_note: binary
---

A teacher-led version of [Count the Dots]({{ '/unplugged/count-the-dots/' | relative_url }}),
following CS Unplugged's original classroom activity: a demonstration at the
front of the room, then every student cuts out and works with their own
set of five dot cards. About **50 minutes**. Leaving it for a sub? Use the
box below instead.

{% include unplugged/sub-box.html
   sheet="/unplugged/count-the-dots/"
   slides="/unplugged/count-the-dots-slides/"
   go="dots"
   slides_stop="On Your Sheet"
   generator="/unplugged/count-the-dots-generator/"
   keep_going="message-in-lights puzzle (a joke whose punchline is hidden in binary)"
   setup="No cards, scissors, or slides needed."
   say="Today you're learning how computers count using only 0 and 1. Read the sheet and work on your own. Stuck? Cover cards with a coin or your finger and count the dots you can still see." %}

## Students will be able to

- Explain why computers store everything with just two symbols, 0 and 1.
- Spot the pattern in the cards: each card has twice as many dots as the
  card to its right.
- Convert a number from 0 to 31 into five-digit binary, and back again.

## Materials

- **Demonstration cards:** pages 2 to 6 of the [dot cards]({{ '/unplugged/count-the-dots-cards/' | relative_url }}),
  printed once. A4 cards with smiley face sticker dots work well too.
- **One set of five cards per student:** page 1 of the [dot cards]({{ '/unplugged/count-the-dots-cards/' | relative_url }}),
  copied onto card stock. Scissors for every pair.
- **The [worksheet]({{ '/unplugged/count-the-dots/' | relative_url }})**,
  one per student, plus the answer key (click **Show answer key** at the
  bottom of the sheet, or add `?key=1` to its address).
- **The [slides]({{ '/unplugged/count-the-dots-slides/' | relative_url }})** (optional).
- **Keep-going sheets:** a class set from the [New set page]({{ '/unplugged/count-the-dots-generator/' | relative_url }}),
  two sets per student (front and back), so nobody runs out of work.

## Before class

1. Print the demonstration cards and the student card pages. Cutting out
   cards takes about 5 minutes of class time; if time is tight, cut them
   ahead of time and put each set in an envelope.
2. Print the worksheets.
3. Pick five students to hold the demonstration cards.

## 1. Hook (5 minutes)

Ask: *"How many symbols do we use to write any number?"* (Ten: 0 to 9.)
*"What if you only had two?"*

Show the first two slides. Everything you see or hear on a computer
(words, pictures, numbers, movies, and even sound) is stored using just two
symbols, 0 and 1. It's much easier to build a machine that tells apart two
things than ten: a wire has electricity or it doesn't.

## 2. Demonstration (10 minutes)

Before giving out the worksheet, it can be helpful to demonstrate the
principles to the whole group.

You will need a set of five cards with dots on one side and nothing on the
other. Choose five students to hold the demonstration cards at the front of
the class. The cards should be in this order: **16, 8, 4, 2, 1**.

**Discussion.** As you give out the cards (from right to left), see if the
students can guess how many dots are on the next card. What do you notice
about the number of dots on the cards? (Each card has twice as many as the
card to its right.) How many dots would the next card have if we carried on
to the left? (32) The next...? (64)

We can use these cards to make numbers by turning some of them face down
and adding up the dots that are showing. Ask the students to show 6 dots
(4-dot and 2-dot cards), then 15 (8-, 4-, 2- and 1-dot cards), then 21
(16, 4 and 1)... The only rule is that a card has to be completely visible,
or completely hidden.

What is the smallest number of dots possible? (They may answer one, but
it's zero.)

Now try counting from zero onwards. The rest of the class needs to look
closely at how the cards change to see if they can see a pattern in how the
cards flip (each card flips half as often as the one to its right). You may
like to try this with more than one group.

When a binary number card is not showing, it is represented by a zero. When
it is showing, it is represented by a one. This is the binary number
system.

Ask the students to make 01001. What number is this in decimal? (9) What
would 17 be in binary? (10001) Try a few more until they understand the
concept.

## 3. Cut out your own cards (5 minutes)

Hand out the card pages and scissors. Students cut along the dashed lines
and lay their five cards out in a row: 16, 8, 4, 2, 1, from left to right.

## 4. Partner practice (10 minutes)

In pairs, one partner calls out a number and the other shows it with the
cards, then writes it in binary. Swap roles. Some to try:

- 3, 10, 12, 25, 31
- What's the biggest number five cards can show? (31, all face up: 11111.)
  How could you count higher? (Add a 32 card.)
- 10101 and 11111 as decimal numbers (21 and 31).
- What day of the month were you born? Write it in binary. Find out what
  your partner's birthday is in binary.

Walk the room. A student who adds the cards correctly but writes the bits
in the wrong order (11000 for 3) is the most common mix-up: the 1 card is
always on the right.

## 5. Worksheet (15 minutes)

Hand out the [worksheet]({{ '/unplugged/count-the-dots/' | relative_url }}).
Students can keep their cards on the desk while they work. Show the "On
your sheet" slide so everyone knows where to start.

When a student finishes, hand them the next sheet: a [message in lights]({{ '/unplugged/count-the-dots-generator/' | relative_url }})
from a class set, so neighbors get different puzzles.

## 6. Wrap-up (5 minutes)

Exit ticket, on a scrap of paper:

1. Write 13 in binary. (01101)
2. What number is 10010? (18)
3. In one sentence: why do computers use only 0 and 1?

## Going further

- **Older or faster students:** what would a sixth card hold? (32.) How
  many numbers can six cards show? (64, from 0 to 63.) This is the same
  idea as a fixed number of bits limiting the biggest number a computer can
  store (AP CSP 2.1).
- **Next lesson:** [Secret Messages in ASCII]({{ '/unplugged/ascii-messages/' | relative_url }})
  uses the same binary numbers to send letters.
- **A different way in:** [Teaching Binary With Coins](https://porttack.com/2026/08/31/teaching-binary-with-coins.html)
  does the same activity with coins that are heads or tails.

{% include standards-alignment.html %}
