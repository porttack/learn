---
title: "Count the Dots: binary numbers"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/binary-numbers/"
original_print: "https://classic.csunplugged.org/documents/activities/binary-numbers/unplugged-01-binary_numbers.pdf"
k5: true
level: both
kind: [single, supplementary]
topics: [Binary]
time: 30
grouping: Solo or pair
materials: "Pencil, and a few coins or scraps of paper (optional)"
---

So you thought you knew how to count? Here is a new way to do it.
Everything you see or hear on a computer (words, pictures, numbers,
movies, and even sound) is stored using just two symbols: **0** and
**1**. In this activity you'll find out how, using five cards and some
dots.

## Why only two?

It is much easier to build a machine that tells apart two things than ten.
A wire has electricity or it doesn't. A spot on a disc reflects light or it
doesn't. Computers don't really have 0s and 1s inside them, just high and
low voltages, but "0" and "1" are quicker to write.

## Get ready

Here are your five dot cards. They always stay in exactly this order:

<div class="dot-row">
  {%- assign counts = "16,8,4,2,1" | split: "," -%}
  {%- for c in counts -%}
  {%- assign n = c | plus: 0 %}
  <div class="dot-card">
    <div class="dots">{% for i in (1..n) %}<span class="dot"></span>{% endfor %}</div>
    <span class="dot-count">{{ n }}</span>
  </div>
  {%- endfor %}
</div>

To "flip a card face down," cover it with a coin, a scrap of paper, or your
finger. The cards you can still see are face up. If you have nothing to
cover them with, just circle the ones you're using.

**The one rule:** a card is either completely face up (you can see its
dots) or completely face down (covered). No half-covered cards.

## Part 1: Spot the pattern

Look at the dots on each card, from right to left: 1, 2, 4, 8, 16.

1. What happens to the number of dots each time you move one card to the
   left? <span class="fill-line"></span>
2. If you made a sixth card to go on the left, how many dots would it have?
   <span class="fill-line short"></span> A seventh card?
   <span class="fill-line short"></span>

## Part 2: Make numbers

Cover cards until the dots still showing add up to the number.
Write down which cards are face up.

<table class="checkoff trace-table">
  <colgroup><col style="width: 28%"><col style="width: 72%"></colgroup>
  <thead><tr><th>Make this many dots</th><th>Cards face up</th></tr></thead>
  <tbody>
    <tr><td>5</td><td></td></tr>
    <tr><td>3</td><td></td></tr>
    <tr><td>12</td><td></td></tr>
    <tr><td>19</td><td></td></tr>
  </tbody>
</table>

3. Try to make 5 again, but with **different** cards than you used in the
   table. Can you? Does any number have two different ways to make it?
   <span class="fill-line"></span>
4. What is the **biggest** number you can make? <span class="fill-line short"></span>
   The **smallest**? <span class="fill-line short"></span>
5. Pick three numbers between 0 and 31 (for example 23, 30, and 14) and
   make each one with your cards. Did any number **not** work?
   My numbers: <span class="fill-line short"></span> <span class="fill-line short"></span> <span class="fill-line short"></span>
{: start="3"}

## Part 3: Write it in binary

Now write your cards down as digits. A face-down card is a **0**. A face-up
card is a **1**. Always write all five, starting with the 16 card.

For example, here are the cards showing **9**. The 8 card and the 1 card
are face up; the others are covered:

<div class="dot-row dot-example">
  {%- assign counts = "16,8,4,2,1" | split: "," -%}
  {%- assign bits = "0,1,0,0,1" | split: "," -%}
  {%- for c in counts -%}
  {%- assign n = c | plus: 0 %}
  {%- assign b = bits[forloop.index0] %}
  <div class="dot-card-wrap">
    <div class="dot-card{% if b == '0' %} covered{% endif %}">
      <div class="dots">{% if b == '1' %}{% for i in (1..n) %}<span class="dot"></span>{% endfor %}{% endif %}</div>
      <span class="dot-count">{{ n }}</span>
    </div>
    <span class="dot-bit">{{ b }}</span>
  </div>
  {%- endfor %}
</div>

Face up is 1 and covered is 0, so 9 is written **01001**. Check it:
8 + 1 = 9.

| Binary | Number |
|---|---|
| 10101 | |
| 11111 | |
| 00110 | |
| | 17 |
| | the day of the month you were born: <span class="fill-line short"></span> |
{: .checkoff .trace-table}

## Part 4: A message in lights

Tom is trapped on the top floor of a department store. It's just before
Christmas, and he wants to get home. He has tried calling, even yelling,
but there is no one around. Across the street, someone is still working
late at a computer. How can he get her attention?

Then he has an idea: he can use the Christmas tree lights to send her a
message! He plugs them in so he can turn them on and off, using the same
binary code you just learned.

Each row in the picture is one letter, read top to bottom in the order
**16 8 4 2 1**. A lit tree is a 1. A dark square is a 0. Use the code
**1 = a, 2 = b, 3 = c, …, 26 = z** to work out Tom's message.

<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.2em;">
<figure id="fig-secret-message" style="flex: none; margin: 0.5em 0;">
  <img src="{{ '/assets/img/unplugged/count-the-dots/secret-message-grid.png' | relative_url }}" alt="A grid of fifteen rows and five columns. Some cells are dark and empty; others show a small lit Christmas tree. Two rows are entirely dark, splitting the grid into three groups of letters." style="width: 170px; max-width: 170px;">
  <figcaption>Tom's message, from the CS Unplugged book.</figcaption>
</figure>

<table class="checkoff light-message" style="flex: 1 1 260px; margin-top: 0.5em;">
  <colgroup><col style="width: 20%"><col style="width: 40%"><col style="width: 40%"></colgroup>
  <thead><tr><th>Row</th><th>Number</th><th>Letter</th></tr></thead>
  <tbody>
    <tr><td>1</td><td></td><td></td></tr>
    <tr><td>2</td><td></td><td></td></tr>
    <tr><td>3</td><td></td><td></td></tr>
    <tr><td>4</td><td></td><td></td></tr>
    <tr><td colspan="3"><em>(row 5 is dark: space)</em></td></tr>
    <tr><td>6</td><td></td><td></td></tr>
    <tr><td>7</td><td></td><td></td></tr>
    <tr><td colspan="3"><em>(row 8 is dark: space)</em></td></tr>
    <tr><td>9</td><td></td><td></td></tr>
    <tr><td>10</td><td></td><td></td></tr>
    <tr><td>11</td><td></td><td></td></tr>
    <tr><td>12</td><td></td><td></td></tr>
    <tr><td>13</td><td></td><td></td></tr>
    <tr><td>14</td><td></td><td></td></tr>
    <tr><td>15</td><td></td><td></td></tr>
  </tbody>
</table>
</div>

Tom's message: <span class="fill-line"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

1. **Counting up by one.** Make 0, then 1, 2, 3, 4, 5 in order. Which
   card flips every single time?
2. **Adding them up.** Work out 1 + 2 + 4. Then 1 + 2 + 4 + 8. Look at the
   next card in the row each time. What do you notice?
3. **Counting on your fingers.** Each finger on one hand is one card:
   finger up is 1, finger down is 0. What is the biggest number you can show
   on one hand?
</aside>

## What's it all about?

Each 0 or 1 is called a **bit**, short for *binary digit*. Normal numbers
use ten digits (base ten); binary uses two (base two), so each card is worth
twice the one to its right instead of ten times.

One bit on its own can't say much, so computers group bits in eights. A
group of eight bits is a **byte**, and it can stand for any number from
0 to 255. Every file you have ever opened is just a long list of bytes.

<section class="answer-key" markdown="1">
## Check your answers

**Part 1.** Each card has double the dots of the card to its right. The
sixth card would have 32 dots, the seventh 64.

**Part 2.** 5 = 4 + 1. 3 = 2 + 1. 12 = 8 + 4. 19 = 16 + 2 + 1. There is
only ever one way to make each number, so 5 can't be made with different
cards. The biggest is 31 (all face up) and the smallest is 0 (all face
down), and every number in between works.

**Part 3.** 10101 = 21. 11111 = 31. 00110 = 6. 17 = 10001. For your
birthday, check it the other way: add up the cards you wrote as 1.

**Part 4.** 8 5 12 16, 9 13, 20 18 1 16 16 5 4: **HELP IM TRAPPED**.

**Challenge.**
1. The 1 card flips every time. (The 2 card flips every other time, the
   4 card every fourth time, and so on.)
2. Each total is one less than the next card: 1 + 2 + 4 = 7 (next card is
   8), and 1 + 2 + 4 + 8 = 15 (next card is 16).
3. 31, with all five fingers up (16 + 8 + 4 + 2 + 1).
</section>
