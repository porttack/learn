---
title: "Pixel Pictures"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/image-representation/"
original_print: "https://classic.csunplugged.org/documents/activities/image-representation/unplugged-02-image_representation.pdf"
k5: true
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

<aside class="callout note" markdown="1">
**WHY THIS MATTERS: SENDING PICTURES OVER A PHONE LINE**

Before email, offices sent documents with **fax machines**, and many
hospitals and law offices still do. A fax scans a page into about 4 million
tiny black and white dots and sends them over an ordinary phone line, which
can carry only about 9,600 bits (0s and 1s) per second. Sending every dot
one by one would take about 7 minutes a page. But most of a page is white
paper, so the fax sends the *runs* instead ("200 white, 3 black, 150
white..."), the same trick you're about to learn, and the page goes
through in under a minute. Storing or sending the same information in
fewer bits is called **compression**.

<figure id="fig-fax">
  <img src="{{ '/assets/img/unplugged/pixel-pictures/fax-steps.png' | relative_url }}" alt="How a fax works: 1. the page goes into the fax machine; 2. it is scanned into digital data; 3. the data travels over the phone line; 4. the receiving fax decodes it; 5. the receiving fax prints the page.">
</figure>
</aside>

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

## Now encode one

Go the other way: here is a finished picture. Write the code for each row
on the line next to it. Remember, every code starts with a count of
**white** squares, so a row that starts with black begins with **0**.

{% assign enc = site.data.unplugged.pixel_pictures.encode %}
<div class="pixel-encode">
<table class="pixel-blank-grid pixel-encode-grid" role="img" aria-label="An 8 by 8 black and white picture of a house">
  <tbody>
  {%- assign rows = enc.art | strip | newline_to_br | split: "<br />" -%}
  {%- for row in rows -%}
    {%- assign cells = row | strip | split: "" %}
    <tr>{% for c in cells %}<td{% if c == "#" %} class="on"{% endif %}></td>{% endfor %}</tr>
  {%- endfor %}
  </tbody>
</table>
<ol class="pixel-encode-lines">
{% for row in rows %}<li><span class="fill-line"></span></li>
{% endfor %}</ol>
</div>

This trick has a name: **run-length encoding**, because it records how long
each run of one color is. Fax machines send pictures exactly this way, one
scan line at a time, and some image files (like TIFF and BMP) can be stored
this way too.

<section class="pixel-make-own" markdown="1">
## Make your own

Now you be the computer. Draw a simple black and white picture on each
grid below: a letter, an arrow, a face, anything with solid squares. Then
write its code on the lines to the right, one line per row, top to bottom.
Check each row: its numbers should add up to 8.

When you finish, fold the page so only your codes show, and trade with a
partner. Can they draw your picture from just the numbers? They draw it on
the **Partner's picture** grids on their own sheet, then unfold yours to
check, square by square.

{% for k in (1..3) %}
<div class="pixel-encode">
<table class="pixel-blank-grid pixel-encode-grid" role="presentation">
  <tbody>
  {%- for r in (1..8) %}
    <tr>{% for c in (1..8) %}<td></td>{% endfor %}</tr>
  {%- endfor %}
  </tbody>
</table>
<ol class="pixel-encode-lines">
{% for r in (1..8) %}<li><span class="fill-line"></span></li>
{% endfor %}</ol>
</div>
{% endfor %}
</section>

## Your partner's pictures

Draw your partner's pictures here, using only their codes. Then compare
with their original: every square should match. If a row is off, check
that its numbers add up to 8.

<div class="pixel-blank-row pixel-partner-row">
{% include unplugged/pixel-pictures-blank-grid.html size=8 label="Partner's picture 1" %}
{% include unplugged/pixel-pictures-blank-grid.html size=8 label="Partner's picture 2" %}
{% include unplugged/pixel-pictures-blank-grid.html size=8 label="Partner's picture 3" %}
</div>

## Thinking about compression

Writing a whole picture as a short list of numbers, instead of writing
down all one hundred pixels one at a time, is **compression**, just like
the fax machine: the same information, with less to write or send.

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

### Now encode one (the house)

{% assign enc = site.data.unplugged.pixel_pictures.encode %}
{% for c in enc.codes %}{{ forloop.index }}. {{ c | join: ", " }}
{% endfor %}

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
