---
title: "Pixel Pictures: how it works"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/image-representation/"
level: ms
companion: true
name_line: false
---

*Part 1 of 3.* Read this sheet, then do
[Part 2: Decode & Encode]({{ '/unplugged/pixel-pictures/' | relative_url }})
and [Part 3: Make Your Own]({{ '/unplugged/pixel-pictures-make-your-own/' | relative_url }}).

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

Ready? Continue to
[Part 2: Decode & Encode]({{ '/unplugged/pixel-pictures/' | relative_url }}).
