---
title: "Pixel Pictures"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Data representation]
time: 30
grouping: Solo, or trade with a partner
materials: "Pencil"
scripts: [/assets/js/unplugged/pixel-pictures-page.js]
generator: /unplugged/pixel-pictures-generator/
generator_presets:
  - { label: "Small pictures", query: "size=small" }
  - { label: "Large pictures", query: "size=large" }
---

Every picture on a screen, every photo, every icon, every letter you're
reading right now, is made of tiny colored squares called pixels (short
for "picture elements"). Zoom in far enough on any image and that's all
you'll find: a grid of small, solid squares, nothing smoother underneath.

A computer can't draw a soft curve by magic. It can only store numbers. So
to store a picture, it needs a way to turn a grid of pixels into a list of
numbers, and back again. This activity walks you through one simple way to
do exactly that, for a picture that only uses black and white.

## The rule

Look at one row of a black and white picture at a time, left to right.
Instead of writing down the color of every single pixel, write down how
many pixels you see before the color changes. Each one of those counts is
called a run, and the list of counts for a row is its code.

The one rule that makes this work: **the first number in a row's code is
always a count of white pixels.** If a row actually starts with a black
pixel, you still write the white count first, and it's just 0.

For example, this five pixel row:

    ..###

has 2 white pixels, then 3 black. Its code is **2, 3**.

This row also has five pixels, but starts black:

    ##...

has 0 white pixels (none, before the black starts), then 2 black, then 3
white. Its code is **0, 2, 3**.

Add up the numbers in any row's code and you should always get back the
width of the picture (5, in both examples above). That's a quick way to
check your own work as you go: if a row's numbers don't add up to the
grid's width, you've made a mistake somewhere in that row.

## Decode these pictures

Below are four pictures, written as codes instead of pixels. Each line of
a picture's code is one row, in order from top to bottom. Shade in the
matching squares on the blank grid with your pencil, one row at a time.
Leave a square blank for white, and shade it in solid for black.

Work through them in order. They start easy and get trickier.

<noscript><p class="callout warning">This worksheet draws its blank grids
with JavaScript. Turn JavaScript on to see the codes and grids.</p></noscript>

<div class="pixel-questions" id="q-pixel-pictures"></div>

<script type="application/json" data-pixel-set data-questions="#q-pixel-pictures" data-key="#key-pixel-pictures">{{ site.data.unplugged.pixel_pictures | jsonify }}</script>

## Make your own, and trade

Now try it the other direction. Draw a small black and white picture of
your own on the **Your picture** grid below. Keep it simple, nothing
fancy, just solid black or white squares. Then write down its code, row by
row, on the lines underneath, the same way you just decoded the pictures
above.

Trade codes with a partner, or read yours out loud to someone nearby.
Decode their code onto the **Decode here** grid, then compare grids square
by square. Every square should match. If two of you disagree on a square,
check that row's numbers add up to 6 first; that's where most mistakes
hide.

<div class="pixel-blank-row">
{% include unplugged/pixel-pictures-blank-grid.html size=6 label="Your picture" %}
{% include unplugged/pixel-pictures-blank-grid.html size=6 label="Decode here" %}
</div>

Your code, one row at a time:

<ol class="pixel-code-blank">
{% for i in (1..6) %}<li><span class="fill-line"></span></li>
{% endfor %}
</ol>

## Thinking about compression

Writing a whole picture as a short list of numbers, instead of writing
down all one hundred pixels one at a time, is already a kind of
shortening trick. Computer scientists call this **compression**: storing
the same information with less writing.

1. Look back at the four pictures you decoded. Which ones took the fewest
   numbers to write? Which took the most? <span class="fill-line"></span>
2. A picture that's mostly one solid color compresses very well with this
   method: one big run needs only one number. Why does a picture that
   changes color on almost every pixel (like static on an old TV screen)
   compress badly, maybe even worse than just listing every pixel?
   <span class="fill-line"></span>
3. Suppose a computer could only write numbers up to 7 in a row's code, no
   higher. How would you write a run of 12 black pixels? Hint: split it
   into two black runs, with a run of 0 white pixels in between them.
   <span class="fill-line"></span>

Want the harder version of this, with real numbers to work out? See
[Pixel pictures: how much do you save?]({{ '/unplugged/pixel-pictures-compression/' | relative_url }}).


<section class="answer-key pixel-answer-key" markdown="1">
<div id="key-pixel-pictures"></div>

### Compression questions

1. Plus, Diamond, and Boat were all tied for shortest, 28 numbers each.
   Target took the most by far: 60 numbers, more than twice as many as the
   shortest pictures.
2. Every time the color changes, you need to start a new run, which means
   a new number. A picture that flips color on nearly every pixel needs
   almost as many runs as it has pixels, so its code ends up close to the
   same length as just listing every pixel, or even longer, since a run
   of length 1 still needs its own number.
3. **7, 0, 5**: a run of 7 black pixels, a run of 0 white pixels (because
   the next pixel is also black), then a run of 5 more black pixels.
</section>
