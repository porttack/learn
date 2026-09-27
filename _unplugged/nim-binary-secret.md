---
title: "Nim: the binary secret"
source: original
level: hs
kind: [single, supplementary]
topics: [Strategy games, Binary]
time: 25
grouping: Solo or pair
materials: "Pencil"
generator: /unplugged/nim-binary-secret-generator/
---

{% assign labels = "A,B,C,D,E,F" | split: "," %}
{% assign worked = site.data.unplugged.nim_binary_secret.worked_examples %}
{% assign practice = site.data.unplugged.nim_binary_secret.practice %}
{% assign example_1 = worked[0] %}
{% assign example_2 = worked[1] %}
{% assign example_3 = worked[2] %}

If you've played multi-pile Nim on [Nim: the take-away game]({{ '/unplugged/nim/' | relative_url }}),
you already know there's a pattern to which piles are safe to leave your
opponent and which ones lose no matter what you do. Here's the pattern,
worked out in full. It's exact: it will tell you whether any position is a
win or a loss, and if it's a win, exactly which move to make.

The trick uses binary, the same 0-and-1 way computers store every number.
If you've never worked with binary before, this page still works, just go
a little slower through Step 1.

## Step 1: write every pile in binary

Binary numbers use place values that double each time you move left: 1, 2,
4, 8, 16, and so on, instead of the 1, 10, 100 you're used to. Writing a
pile size in binary just means figuring out which of those place values add
up to it, the same way you did with dot cards if you've done that activity.

Take the piles **3, 5, 7**. In binary:

{% include unplugged/nim-binary-table.html q=example_1 %}

Each pile gets its own row, and every pile is written with the same number
of digits (padded with leading zeros) so the columns line up. That lining
up is the whole point, the next step only works if every number has digits
in the same place values.

## Step 2: add the columns without carrying

Now add straight down each column, but with one twist: **no carrying.** For
each column, count how many piles have a 1 there. Write 1 in that column of
the answer if that count is odd, and 0 if it's even. That's it, no tens to
carry, no borrowing.

That answer row is called the **nim-sum**. For piles 3, 5, 7:

- Rightmost column: three 1s (odd) &rarr; 1
- Middle column: one 1 &rarr; 1
- Leftmost column: one 1 &rarr; 1

Nim-sum: 001, which is 1 in ordinary decimal.

<aside class="callout note" markdown="1">
**WHY NO CARRYING?**

Normal addition tells you the total number of stones, which isn't useful
here since players remove stones from just one pile at a time. Adding
without carrying (mathematicians call this XOR) instead answers a
different question for each column: "is there an odd one out?" That turns
out to be exactly the question that matters for who wins, which the next
two steps put to use.
</aside>

## Step 3: the nim-sum tells you if you can win

**If the nim-sum is 0, you're in a losing position.** No matter what you
do, your opponent can always answer in a way that brings the nim-sum back
to 0, and eventually you'll run out of stones with nothing left to take.
This assumes your opponent knows the trick too. If they don't, you can
still win by luck, just not by strategy.

**If the nim-sum isn't 0, you have a winning move**, one that leaves your
opponent at nim-sum 0. Piles 3, 5, 7 have nim-sum 1, which isn't 0, so
there's a winning move to find.

## Step 4: find the winning move

Look at the leftmost column where the nim-sum has a 1. Find a pile that
also has a 1 in that same column, and check: does that pile, combined with
the nim-sum the same no-carry way, give a *smaller* number than the pile
started with? If so, that's your move: shrink that pile down to that
smaller number.

For 3, 5, 7 (nim-sum 1): pile A (3) combined with 1 the no-carry way gives
2, which is smaller than 3. So the move is: **take 1 stone from pile A,
leaving it at 2.** Check it: 2, 5, 7 now has nim-sum 0, exactly what you
want to hand your opponent.

{{ example_1.move }}

<aside class="callout challenge" markdown="1">
**WHY DOES THIS ALWAYS WORK?**

Combining a pile with the nim-sum the no-carry way always changes that
pile's column that matches the nim-sum's leftmost 1 from a 1 to a 0, which
can only make the number smaller, never bigger. And out of every pile that
has a 1 in that leftmost column, this move always exists for at least one
of them. Once you've made it, the new nim-sum is 0: your opponent is stuck
with a losing position, and whatever they do, some column becomes unequal
again, handing you a new winning move to repeat the whole process.
</aside>

## A second worked example, with four piles

The steps don't change with more piles, there's just one more row.

{% include unplugged/nim-binary-table.html q=example_2 %}

Nim-sum: {{ example_2.sum_binary }}, which is {{ example_2.sum }}. Not
zero, so there's a winning move. {{ example_2.move }} Check it yourself:
write out the new piles and add their binary columns without carrying, you
should get all zeros.

## Not every position has a winning move

Here's one that doesn't:

{% include unplugged/nim-binary-table.html q=example_3 %}

Nim-sum: {{ example_3.sum_binary }}, which is {{ example_3.sum }}. That's
zero, so this is a losing position: {{ example_3.move }} Try it yourself on
paper. Whatever pile you shrink and however much you take, at least one
column stops matching, and the nim-sum becomes nonzero, a winning position
for whoever moves next. That's your opponent.

## Practice: classify these positions

For each position, decide if the player about to move has a winning move.
If they do, use the steps above to find it. Write your answer in the
table.

<table class="checkoff nim-position-table">
  <colgroup><col style="width: 8%"><col style="width: 32%"><col style="width: 20%"><col style="width: 40%"></colgroup>
  <thead><tr><th>#</th><th>Piles</th><th>Win or lose?</th><th>Winning move (if any)</th></tr></thead>
  <tbody>
  {% for q in practice %}
    <tr>
      <td>{{ forloop.index }}</td>
      <td>{% for p in q.piles %}{{ labels[forloop.index0] }} {{ p }}{% unless forloop.last %}, {% endunless %}{% endfor %}</td>
      <td></td>
      <td></td>
    </tr>
  {% endfor %}
  </tbody>
</table>

Want unlimited fresh positions instead, with the binary work filled in for
each one? Try the
[Nim position generator]({{ '/unplugged/nim-binary-secret-generator/' | relative_url }}).

<section class="answer-key" markdown="1">
## Check your answers

"Win" means the player about to move has a winning move. Pile letters match
the order piles are listed above.

{% for q in practice %}
**{{ forloop.index }}.** Piles {% for p in q.piles %}{{ labels[forloop.index0] }} {{ p }}{% unless forloop.last %}, {% endunless %}{% endfor %}.
Nim-sum {{ q.sum_binary }} ({{ q.sum }}). **{% if q.answer == "win" %}Win.{% else %}Lose.{% endif %}** {{ q.move }}
{% endfor %}
</section>
