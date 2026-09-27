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
---

Computers can only store and send a limited amount of data, so they
compress text before they save it. Instead of writing repeated words
again, a computer writes the words once, then a short box that points
back to where they first appeared.

## How a box works

Look for patterns in this poem. Can you find groups of two or more
letters that are repeated, or even whole words or phrases?

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
<figcaption>"Pitter patter" repeats, so the second time it is replaced by a
box. The box's number always matches the number by the words it stands
for.</figcaption>
</figure>

## Decode the poem

Many of the words and letters are missing in this poem. Can you fill in
the missing letters and words to complete it correctly? You will find
each one in the box that its arrow is pointing to.

<figure id="fig-compression-worksheet">
  <img src="{{ '/assets/img/unplugged/text-compression/pease-porridge-worksheet.png' | relative_url }}" alt="A hand drawn poem with several words missing letters. Small numbered boxes with arrows point back to the earlier place in the poem where the missing letters or words already appear, so the reader can copy them in.">
  <figcaption>From the CS Unplugged book. Follow each arrow back to find what belongs in its box.</figcaption>
</figure>

Write out the whole poem here once you have decoded it:

<p class="fill-line"></p>
<p class="fill-line"></p>
<p class="fill-line"></p>
<p class="fill-line"></p>

## Now compress one yourself

Pretend you are a computer trying to fit as much into your disk as
possible. Cross out all the groups of two or more letters that have
already occurred. These are no longer needed, since they could be
replaced by a pointer. Your goal is to get as many letters crossed out
as possible.

<div class="compress-poem">
<p class="compress-line">I know an old lady who swallowed a bird.</p>
<p class="compress-line">How absurd! She swallowed a bird!</p>
<p class="compress-line">She swallowed the bird to catch the spider</p>
<p class="compress-line">That wriggled and jiggled</p>
<p class="compress-line">and tickled inside her.</p>
<p class="compress-line">She swallowed the spider to catch the fly.</p>
<p class="compress-line">I don't know why she swallowed a fly.</p>
<p class="compress-line">Perhaps she'll die...</p>
</div>

| | |
|---|---|
| Letters in the whole poem | <span class="fill-line short"></span> |
| Letters you crossed out | <span class="fill-line short"></span> |
| Letters saved | <span class="fill-line short"></span> |
{: .checkoff}

**Check yourself:** read only the letters you did **not** cross out, in
order. If it still says the poem, your compression works.

<aside class="callout challenge" markdown="1">
**EXTRA FOR EXPERTS**

Computers do not draw boxes. They write two numbers instead: *(back,
copy)*. "BAN(2,3)" means: from here, go back 2 letters, then copy 3
letters, one at a time, so "BAN" plus (2,3) spells **BANANA**. Pick a
short word with a repeated ending, like "MOMMY," and figure out its own
(back, copy) pair.
</aside>

<figure class="compress-bonus">
  <img src="{{ '/assets/img/unplugged/text-compression/compressing-bananas.png' | relative_url }}" alt="A cartoon of two monkeys on a branch. One asks, 'What are you doing?' The other, holding a peeled banana, answers, 'I'm compressing my bananas!'">
</figure>

## What's it all about?

Computer storage keeps growing, but we always find more to fill it:
whole libraries, photos, songs, and video all need somewhere to live,
and big files are slow to send over the internet. Compressing data lets
a computer store more, and send files faster, without buying more
storage or a faster connection.

The method in this activity, pointing back to an earlier repeat, is
called **LZ compression**, after Lempel and Ziv, the two people who
invented it in the 1970s. It works for any language and can often cut a
file's size in half. You have already used it without knowing it: it is
part of what makes a ZIP file, or a PNG or GIF picture, smaller than the
raw data inside it.

**Learn more:** this trick is called
[LZ77 compression](https://en.wikipedia.org/wiki/LZ77_and_LZ78).

<section class="answer-key" markdown="1">
## Answer key

**Decode the poem.** The poem reads:

<p>{{ site.data.unplugged.text_compression_fixed.original | newline_to_br }}</p>

**Now compress one yourself.** A computer finds
**{{ site.data.unplugged.text_compression_fixed.short_and_sweet.letters_saved }}**
letters worth crossing out here, out of
**{{ site.data.unplugged.text_compression_fixed.short_and_sweet.letters_original }}**
in the whole poem. Getting close to that is a good compression; you do
not need to match it exactly, since more than one set of boxes can work.
</section>
