---
title: "You Can Say That Again! Text Compression"
source: cs-unplugged-2015
level: ms
kind: [single, supplementary]
topics: [Data compression, Data representation]
time: 25
grouping: Solo
materials: "Pencil"
generator: /unplugged/text-compression-generator/
generator_presets:
  - { label: "One rhyme", query: "level=ms" }
  - { label: "Two rhymes", query: "level=hs" }
scripts: [/assets/js/unplugged/compression-page.js]
---

Computers can only hold so much data, so they squeeze repeated text down
before storing it. Instead of writing the same words twice, they write the
words once, then a short **box** that says "copy those same words again."

## How a box works

1. Read the poem from top to bottom, left to right, like normal.
2. The first time words appear, just read them.
3. A small circled number is a **box**. It means "these exact words already
   showed up earlier, next to the same number."
4. Find that number's first appearance, then write those same words on the
   blank line inside the box.
5. Keep going. The same number always means the same words.

**Worked example:**

<figure class="compress-example">
<svg viewBox="0 0 260 120" width="260" height="120" role="img" aria-label="Line one reads Pitter patter. Line two has a numbered box, with an arrow curving back up to Pitter patter, and a blank line after the box.">
  <text x="10" y="24" font-size="16">Pitter patter</text>
  <circle cx="20" cy="70" r="12" fill="none" stroke="currentColor" stroke-width="1.5"></circle>
  <text x="20" y="75" font-size="13" text-anchor="middle" font-weight="700">1</text>
  <line x1="40" y1="70" x2="90" y2="70" stroke="currentColor" stroke-width="1.5"></line>
  <path d="M 20 58 C 20 20, 60 10, 65 24" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#arrowhead)"></path>
  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"></path>
    </marker>
  </defs>
</svg>
<figcaption>Box <strong>1</strong> points back to "Pitter patter." You write "Pitter patter" on the blank line next to box 1.</figcaption>
</figure>

## Decode the poem

This old rhyme has three repeated parts, boxed as 1, 2, and 3. Box 1 is
short (two words). Box 3 is long (a whole line and a half). Long repeats
save the most space, which is exactly why computers look for them.

<noscript><p class="callout warning">This puzzle draws its boxes with JavaScript. Turn JavaScript on to see it.</p></noscript>

<div class="compress-puzzle" id="q-compression"></div>

<script type="application/json" data-compression-set data-puzzle="#q-compression" data-key="#key-compression">{{ site.data.unplugged.text_compression_fixed | jsonify }}</script>

## Now compress one yourself

Here is another rhyme, written out in full with nothing hidden.

<div class="compress-poem">
<p class="compress-line">Twinkle, twinkle, little star,</p>
<p class="compress-line">How I wonder what you are.</p>
<p class="compress-line">Up above the world so high,</p>
<p class="compress-line">Like a diamond in the sky.</p>
<p class="compress-line">Twinkle, twinkle, little star,</p>
<p class="compress-line">How I wonder what you are.</p>
</div>

On your own paper, or right over these lines, **cross out every group of 2
or more letters that is an exact repeat of something earlier in this same
poem.** A repeat can be a whole line, a few words, or just part of a word.
Anything crossed out could be replaced by a box, the same way the poem
above was.

| | |
|---|---|
| Letters in the whole poem | <span class="fill-line short"></span> |
| Letters you crossed out | <span class="fill-line short"></span> |
| Letters saved | <span class="fill-line short"></span> |
{: .checkoff}

**Check yourself:** read only the letters you did **not** cross out, in
order. If it still says the poem, your compression works.

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Computers do not draw boxes. They write two numbers instead: *(back,
copy)*. "BAN(2,3)" means: from here, go back 2 letters, then copy 3
letters, one at a time, so "BAN" plus (2,3) spells **BANANA**. Pick a
short word with a repeated ending, like "MOMMY," and figure out its own
(back, copy) pair.
</aside>

**Learn more:** this trick is called
[LZ77 compression](https://en.wikipedia.org/wiki/LZ77_and_LZ78), and it is
still used inside ZIP files and PNG images today.

<section class="answer-key" markdown="1">

## Decoded poem

<div class="compress-key" id="key-compression"></div>

</section>
