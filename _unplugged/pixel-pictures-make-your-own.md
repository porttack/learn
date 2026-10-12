---
title: "Pixel Pictures: make your own"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/image-representation/"
level: ms
companion: true
---

*Part 3 of 3.* Finished
[Part 2: Decode & Encode]({{ '/unplugged/pixel-pictures/' | relative_url }})?
Good, you're ready for this.

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

{% for k in (1..2) %}
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
that its numbers add up to 8. No partner nearby? Re-decode your own codes
here instead.

<div class="pixel-blank-row pixel-partner-row">
{% include unplugged/pixel-pictures-blank-grid.html size=8 label="Partner's picture 1" %}
{% include unplugged/pixel-pictures-blank-grid.html size=8 label="Partner's picture 2" %}
</div>

## Thinking about compression

Writing a whole picture as a short list of numbers, instead of writing
down all one hundred pixels one at a time, is **compression**, just like
the fax machine: the same information, with less to write or send.

1. Look back at the three pictures you decoded in Part 2. Which ones took
   the fewest numbers to write? Which took the most? <span class="fill-line"></span>
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

<section class="answer-key" markdown="1">
## Check your answers

### Compression questions

1. Plus and Diamond were tied for shortest, 28 numbers each. Target took
   the most by far: 60 numbers, more than twice as many as the shortest
   pictures.
2. Every time the color changes, you need to start a new run, which means
   a new number. A picture that flips color on nearly every pixel needs
   almost as many runs as it has pixels, so its code ends up close to the
   same length as just listing every pixel, or even longer, since a run
   of length 1 still needs its own number.
3. **7, 0, 5**: a run of 7 black pixels, a run of 0 white pixels (because
   the next pixel is also black), then a run of 5 more black pixels.
</section>
