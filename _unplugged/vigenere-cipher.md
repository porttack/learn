---
title: "Vigenère Cipher: one keyword, many shifts"
source: original
level: both
kind: [single, supplementary]
topics: [Codes and ciphers]
time: 30
grouping: "Solo, or pair up to trade coded messages"
materials: "Pencil"
generator: /unplugged/vigenere-cipher-generator/
generator_presets:
  - { label: "Decode", query: "mode=decode" }
  - { label: "Encode", query: "mode=encode" }
---

## Why one shift is not enough

If you have done the [Caesar cipher activity]({{ '/unplugged/caesar-cipher/' | relative_url }}),
you know its weakness: one shift for the whole message means the most
common letter in the ciphertext is always the same real letter, so counting
letters cracks it fast. The **Vigenère cipher** fixes this with a
**keyword**: each letter of the keyword picks its own shift, so the same
real letter can turn into a different cipher letter almost every time it
appears.

## How a keyword picks a shift

Turn each keyword letter into a shift the same way you number the
alphabet: A shifts 0, B shifts 1, C shifts 2, and so on up to Z, which
shifts 25. Repeat the keyword under your message for as long as the
message runs, and shift each letter by the keyword letter under it. Spaces
do not shift and do not use up a keyword letter.

Here is the keyword **KEY** used on **HELLO**:

<table class="vigenere-example">
  <tr><th>Plain</th><td>H</td><td>E</td><td>L</td><td>L</td><td>O</td></tr>
  <tr><th>Key</th><td>K</td><td>E</td><td>Y</td><td>K</td><td>E</td></tr>
  <tr><th>Shift</th><td>+10</td><td>+4</td><td>+24</td><td>+10</td><td>+4</td></tr>
  <tr><th>Cipher</th><td>R</td><td>I</td><td>J</td><td>V</td><td>S</td></tr>
</table>

**HELLO** becomes **RIJVS**. The two Ls turn into two different letters (J
and V), because each one lines up with a different keyword letter,
something one Caesar shift could never do.

## Decode these

Use the Vigenère square on the last page.

Every message below was encoded with the same keyword.

**Keyword: {{ site.data.unplugged.vigenere_fixed.decode.keyword }}**

<ol class="vigenere-messages">
{%- for m in site.data.unplugged.vigenere_fixed.decode.messages -%}
<li><code class="vigenere-text">{{ m.cipher }}</code><p class="fill-line"></p></li>
{%- endfor -%}
</ol>

## Encode one of your own

Pick a keyword (3 to 6 letters), write a short message in capital letters,
and use the square to encode it. Copy just the finished message below and
swap with a partner.

Keyword: <span class="fill-line short"></span> Message to swap: <span class="fill-line"></span>

**Check with a partner:** decode each other's message using the square. You
are both right if you each land back on real words.

**Why doesn't counting letters crack this?** A Caesar cipher always turns
the same real letter into the same cipher letter, which gives away the
shift. A Vigenère keyword breaks that: the shift changes letter by letter,
so counting letters here will not point at a single answer the way it does
for a [Caesar cipher]({{ '/unplugged/caesar-cipher-frequency/' | relative_url }}).
**[Learn more](https://en.wikipedia.org/wiki/Vigen%C3%A8re_cipher).**

<section class="vigenere-square-page" markdown="1">
## Your lookup tool: the Vigenère square

Find your **keyword letter down the left side**, run your finger along
that row to your **plain letter along the top**, and read off the cipher
letter (to decode, find your **cipher letter** in that row instead, and
read the plain letter off the top of its column).

{% include unplugged/vigenere-square.html %}
</section>

<section class="answer-key" markdown="1">
## Check your answers

**Decode these (keyword {{ site.data.unplugged.vigenere_fixed.decode.keyword }}).**

<ol class="vigenere-messages">
{%- for m in site.data.unplugged.vigenere_fixed.decode.messages -%}
<li>{{ m.plain | capitalize }}</li>
{%- endfor -%}
</ol>
</section>
