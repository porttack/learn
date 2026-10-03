---
title: "Marching Orders"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/programming-languages/"
original_print: "https://classic.csunplugged.org/documents/activities/programming-languages/unplugged-12-programming_languages.pdf"
k5: true
level: ms
kind: [single, supplementary]
topics: [Algorithms]
time: 25
grouping: Pair
materials: "Pencil, paper, ruler"
---

Would it be good if people followed instructions exactly? If you pointed at
a closed door and said "go through that door," what would happen? Computers
work by following lists of instructions, and they do exactly what the
instructions say, even when the instructions don't make sense.

<section class="marching-demo" markdown="1">
## Try it first

See if you can draw this picture from these instructions, before you read
any further or look at the result below.

1. Draw a dot in the centre of your page.
2. Starting at the top left-hand corner of the page, rule a straight line
   through the dot, finishing at the bottom right hand corner.
3. Starting at the bottom left-hand corner of the page, rule a line through
   the dot, finishing at the top right hand corner.
4. Write your name in the triangle in the centre of the left-hand side of
   the page.

<figure id="fig-demo-result">
  <img src="{{ '/assets/img/unplugged/marching-orders/demo-result.png' | relative_url }}" alt="A rectangle with a dot in the center and two lines forming an X from corner to corner, with a name written in the left-hand triangle">
  <figcaption>The result should look something like this.</figcaption>
</figure>

Close, or way off? Either way, you've just seen why programmers have to say
exactly what they mean: the computer will do precisely what the
instructions say, not what you meant.
</section>

<section class="marching-howto" markdown="1">
## Now play it with a partner

1. Decide who goes first.
2. The first player looks only at their own Picture 1 and describes it out
   loud, without showing it or pointing at it.
3. The other player draws exactly what they hear, in their own blank box.
4. Compare the drawing to the real picture, then switch jobs for Picture 2.
</section>

{% include unplugged/player-switch.html %}

<section class="marching-player" data-player="A" markdown="1">
{% include unplugged/name-line.html %}
## Player A's sheet

Keep this sheet hidden from Player B.

### Your pictures: describe these out loud

<div class="marching-pictures">
  <figure class="marching-pic">
    <img src="{{ '/assets/img/unplugged/marching-orders/picture-a.png' | relative_url }}" alt="A person made from a circle head, a square body, and a triangle base">
    <figcaption>Picture 1 (Round 1)</figcaption>
  </figure>
  <figure class="marching-pic">
    <img src="{{ '/assets/img/unplugged/marching-orders/picture-c.png' | relative_url }}" alt="A square with several rings inside it, above a circle with several rings inside it">
    <figcaption>Picture 2 (Round 3)</figcaption>
  </figure>
</div>

### Draw here: what Player B describes

<p class="marching-round-label">Round 2 drawing</p>
<div class="draw-box" aria-label="Space to draw Player B's Picture 1"></div>

<p class="marching-round-label">Round 4 drawing</p>
<div class="draw-box" aria-label="Space to draw Player B's Picture 2"></div>

<aside class="callout challenge" markdown="1">
**CHALLENGE (Round 5): fast finishers only**

Describe this last picture to Player B without any help from a ruler, then
try it again *with* a ruler. Which description was easier to give?

<figure class="marching-pic">
  <img src="{{ '/assets/img/unplugged/marching-orders/picture-f.png' | relative_url }}" alt="A phone keypad with twelve square buttons in four rows, numbered 1 to 9, 0, star, and pound">
  <figcaption>Challenge picture (Round 5)</figcaption>
</figure>
</aside>
</section>

<section class="marching-player" data-player="B" markdown="1">
{% include unplugged/name-line.html %}
## Player B's sheet

Keep this sheet hidden from Player A.

### Your pictures: describe these out loud

<div class="marching-pictures">
  <figure class="marching-pic">
    <img src="{{ '/assets/img/unplugged/marching-orders/picture-b.png' | relative_url }}" alt="Three round faces in a row: happy, blank, and sad">
    <figcaption>Picture 1 (Round 2)</figcaption>
  </figure>
  <figure class="marching-pic">
    <img src="{{ '/assets/img/unplugged/marching-orders/picture-d.png' | relative_url }}" alt="A large square split into one big rectangle and several smaller pieces">
    <figcaption>Picture 2 (Round 4)</figcaption>
  </figure>
</div>

### Draw here: what Player A describes

<p class="marching-round-label">Round 1 drawing</p>
<div class="draw-box" aria-label="Space to draw Player A's Picture 1"></div>

<p class="marching-round-label">Round 3 drawing</p>
<div class="draw-box" aria-label="Space to draw Player A's Picture 2"></div>

<aside class="callout challenge" markdown="1">
**CHALLENGE (Round 5): fast finishers only**

Player A has one more picture for you. Draw what they describe, then
compare.

<p class="marching-round-label">Round 5 drawing</p>
<div class="draw-box" aria-label="Space to draw the challenge picture"></div>
</aside>
</section>

<section class="marching-check" markdown="1">
## Check your work

There's no single right answer here. When you're both done, look at every
drawing next to the real picture together. How close did you get? Talk
about which words made the description easier or harder to follow.
</section>

<section class="marching-reading" markdown="1">
## What's it all about?

Computers operate by following a list of instructions, called a program,
that has been written to carry out a particular task. Programs are written
in languages that have been specially designed, with a limited set of
instructions, to tell computers what to do. Some languages are more suitable
for some purposes than others.

Regardless of what language they use, programmers must become adept at
specifying exactly what they want the computer to do. Unlike human beings, a
computer will carry out instructions to the letter even if they are
patently ridiculous, and a small error can cause a lot of problems. Errors
are commonly called "bugs," in honour (so it is said) of a moth that was
once removed ("debugged") from an electrical relay in an early 1940s
electronic calculating machine.

Learn more: [programming languages](https://en.wikipedia.org/wiki/Programming_language).
</section>

<section class="answer-key" markdown="1">
## Answer key

There's no single correct drawing for this activity. The point is comparing
the drawing to the real picture and talking about why they matched or
didn't. A description tends to work better when it:

- Gives shapes an order (top to bottom, or outside to inside) instead of
  jumping around the page.
- Names sizes and positions ("a small circle centered on the square," not
  just "a circle").
- Says how many of something there are, every time it matters.
- Avoids words like "kind of" or "sort of" that leave room to guess.

Picture D (the split square) and Picture F (the keypad) are the hardest to
describe precisely: both have several same-shaped pieces that are only
told apart by their size or position. If a pair breezes through Pictures A
and B, that's expected; the harder pictures are where the activity
actually bites.
</section>
