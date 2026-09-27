---
title: "Pixel Pictures: how much do you save?"
source: original
level: hs
kind: [supplementary]
topics: [Data representation, Data compression]
time: 20
grouping: Solo
materials: "Pencil, calculator optional"
supports: /unplugged/pixel-pictures/
supports_title: "Pixel Pictures"
---

You'll need your completed [Pixel Pictures]({{ '/unplugged/pixel-pictures/' | relative_url }})
worksheet for this one, so finish that first if you haven't already.

Writing a picture as a run-length code instead of listing every pixel is a
form of **compression**: storing the same information with less writing.
But "less writing" isn't automatic. It depends entirely on the picture.
This activity has you measure it instead of just guessing.

## Count what you actually used

Each of your four pictures is 10 pixels wide by 10 pixels tall, so each one
is 100 pixels. Go back through your completed worksheet. For each picture,
count how many numbers its whole code used, adding up every number in
every row (not the values of the numbers, just how many of them there
are). A row's code of "4, 2, 4" counts as 3 numbers, no matter what those
numbers are.

| Picture | Numbers in its code | Pixels in the picture |
|---|---|---|
| Plus | <span class="fill-line short"></span> | 100 |
| Diamond | <span class="fill-line short"></span> | 100 |
| Boat | <span class="fill-line short"></span> | 100 |
| Target | <span class="fill-line short"></span> | 100 |
{: .checkoff .trace-table}

1. Which picture used the fewest numbers? Which used the most?
   <span class="fill-line"></span>
2. For your shortest picture, roughly what fraction of "one number per
   pixel" did you actually need? (100 pixels, but how many numbers?)
   <span class="fill-line"></span>
3. Look at the shape of your longest picture's code: lots of short runs,
   or a few long ones? What does that tell you about how often the color
   changes in that picture? <span class="fill-line"></span>
4. A photo of a clear blue sky and a photo of static on an old TV screen
   are both the same size in pixels. Which one would compress better with
   this method, and why? <span class="fill-line"></span>

<aside class="callout challenge" markdown="1">
**CHALLENGE: invent a better code**

Run-length coding only helps when neighboring pixels in the *same row*
match. It has no way to notice that row 4 of a picture is identical to row
9, or that a whole picture is symmetric top to bottom, even though both of
those would be easy shortcuts for a person to spot.

Design your own coding rule that could take advantage of one of those
patterns. It doesn't have to be simple: just explain it clearly enough
that a friend could use your rule to decode a picture you made up, without
you being there to help.
</aside>

<section class="answer-key" markdown="1">
## Check your answers

| Picture | Numbers in its code | Pixels in the picture |
|---|---|---|
| Plus | 28 | 100 |
| Diamond | 28 | 100 |
| Boat | 28 | 100 |
| Target | 60 | 100 |
{: .checkoff .trace-table}

1. Plus, Diamond, and Boat are tied for fewest, 28 numbers each. Target
   used the most by far: 60 numbers, more than double the shortest
   pictures.
2. 28 numbers for 100 pixels is a little more than a quarter (28 percent):
   the code is well under a third the length of listing every pixel.
3. Target's rows are made of lots of short runs (1s and 2s, mostly),
   because the ring shape switches between black and white many times
   in a single row. Plus and Diamond's rows are a handful of long runs,
   because most of each row stays one color for a long stretch.
4. The blue sky compresses much better. Almost every pixel in it matches
   its neighbor, so each row is just one or two long runs. Static
   compresses badly (maybe not at all) because the color flips on nearly
   every pixel, so almost every run is length 1, and the code ends up
   about as long, or longer, than just listing every pixel.

The challenge has no single answer. A common real idea: notice when a
whole row repeats a previous row exactly, and write "same as row 4"
instead of the row's code again. Real image formats (like PNG) use
tricks along these lines, plus several others, all at once.
</section>
