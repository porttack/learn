---
title: "Caesar Cipher: cracking it with letter frequency"
source: original
level: hs
kind: [single, supplementary]
topics: [Codes and ciphers, Data representation]
time: 30
grouping: "Solo or pair"
materials: "Pencil"
generator: /unplugged/caesar-cipher-generator/
generator_presets:
  - { label: "Long passage", query: "mode=frequency" }
---

If you have done the first [Caesar cipher activity]({{ '/unplugged/caesar-cipher/' | relative_url }}),
you already know you can crack a short message by trying all 25 possible
keys by hand. That gets slow once a message is long. This activity uses a
shortcut real codebreakers used for centuries before computers existed:
you never have to guess a single key. The message itself tells you.

## Why this works at all

English is not a random pile of letters. Some letters show up constantly
(you are looking at four Es already in this sentence) and some hardly ever
appear at all. That pattern holds true no matter what a piece of English
text is about, as long as it is long enough.

A Caesar cipher does not change how often each letter shows up. It just
renames every letter to a different one, consistently, everywhere in the
message. So whichever letter was most common in the original message is
still most common in the encoded one. It is just wearing a different
letter's name now. Find the most common letter in the ciphertext, assume
it is standing in for the most common letter in English, and you have
almost certainly found the key.

## What English letters usually look like

Here is roughly how often each letter shows up in ordinary English
writing (out of every 100 letters). Leave the last two columns of each
row blank for now. You will use them in a moment.

<div class="freq-tables">
<table class="freq-table">
  <colgroup><col style="width: 12%"><col style="width: 38%"><col style="width: 32%"><col style="width: 18%"></colgroup>
  <thead><tr><th>Letter</th><th>Typical</th><th>Your tally</th><th>Count</th></tr></thead>
  <tbody>
    <tr><td>A</td><td><span class="freq-bar" style="width: 62%"></span></td><td></td><td></td></tr>
    <tr><td>B</td><td><span class="freq-bar" style="width: 11%"></span></td><td></td><td></td></tr>
    <tr><td>C</td><td><span class="freq-bar" style="width: 21%"></span></td><td></td><td></td></tr>
    <tr><td>D</td><td><span class="freq-bar" style="width: 32%"></span></td><td></td><td></td></tr>
    <tr><td>E</td><td><span class="freq-bar" style="width: 95%"></span></td><td></td><td></td></tr>
    <tr><td>F</td><td><span class="freq-bar" style="width: 17%"></span></td><td></td><td></td></tr>
    <tr><td>G</td><td><span class="freq-bar" style="width: 15%"></span></td><td></td><td></td></tr>
    <tr><td>H</td><td><span class="freq-bar" style="width: 46%"></span></td><td></td><td></td></tr>
    <tr><td>I</td><td><span class="freq-bar" style="width: 53%"></span></td><td></td><td></td></tr>
    <tr><td>J</td><td><span class="freq-bar" style="width: 1%"></span></td><td></td><td></td></tr>
    <tr><td>K</td><td><span class="freq-bar" style="width: 6%"></span></td><td></td><td></td></tr>
    <tr><td>L</td><td><span class="freq-bar" style="width: 30%"></span></td><td></td><td></td></tr>
    <tr><td>M</td><td><span class="freq-bar" style="width: 18%"></span></td><td></td><td></td></tr>
  </tbody>
</table>

<table class="freq-table">
  <colgroup><col style="width: 12%"><col style="width: 38%"><col style="width: 32%"><col style="width: 18%"></colgroup>
  <thead><tr><th>Letter</th><th>Typical</th><th>Your tally</th><th>Count</th></tr></thead>
  <tbody>
    <tr><td>N</td><td><span class="freq-bar" style="width: 50%"></span></td><td></td><td></td></tr>
    <tr><td>O</td><td><span class="freq-bar" style="width: 56%"></span></td><td></td><td></td></tr>
    <tr><td>P</td><td><span class="freq-bar" style="width: 14%"></span></td><td></td><td></td></tr>
    <tr><td>Q</td><td><span class="freq-bar" style="width: 1%"></span></td><td></td><td></td></tr>
    <tr><td>R</td><td><span class="freq-bar" style="width: 45%"></span></td><td></td><td></td></tr>
    <tr><td>S</td><td><span class="freq-bar" style="width: 47%"></span></td><td></td><td></td></tr>
    <tr><td>T</td><td><span class="freq-bar" style="width: 68%"></span></td><td></td><td></td></tr>
    <tr><td>U</td><td><span class="freq-bar" style="width: 21%"></span></td><td></td><td></td></tr>
    <tr><td>V</td><td><span class="freq-bar" style="width: 8%"></span></td><td></td><td></td></tr>
    <tr><td>W</td><td><span class="freq-bar" style="width: 18%"></span></td><td></td><td></td></tr>
    <tr><td>X</td><td><span class="freq-bar" style="width: 1%"></span></td><td></td><td></td></tr>
    <tr><td>Y</td><td><span class="freq-bar" style="width: 15%"></span></td><td></td><td></td></tr>
    <tr><td>Z</td><td><span class="freq-bar" style="width: 1%"></span></td><td></td><td></td></tr>
  </tbody>
</table>
</div>

The bar length is how common each letter is. Notice how a handful of
letters (E, T, A, O, I, N) do most of the work, while letters like J, Q,
X, and Z barely show up.

## Tally the passage

Here is a message, encoded with a single key. Read across it letter by
letter, and for every letter, make a tally mark in that letter's "Your
tally" box above. Skip the spaces, they are not letters. When you are
done, count up the marks and write each total in the "Count" column.

<p class="cipher-passage"><code class="cipher-text">{{ site.data.unplugged.cipher_frequency.cipher }}</code></p>

## Find the shift

Look at your counts. One letter should stand out as far more common than
the rest, the same way E stood out in the reference chart.

1. Which letter showed up the most? <span class="fill-line short"></span>
2. Assume that letter is standing in for **E**. Count how many places
   forward from E you would have to shift to reach it. That count is your
   guess for the key. <span class="fill-line short"></span>
3. Use that key with your shift table or wheel from the first cipher
   activity to decode the first few words of the passage. Do they look
   like real English? <span class="fill-line"></span>

If the first few words look like nonsense, the second most common letter
is worth a try instead. E is usually the most common letter, but a short
passage can occasionally have T or A edge it out.

**[Learn more about the Caesar cipher](https://en.wikipedia.org/wiki/Caesar_cipher).**

## Decode the rest

Once your key checks out, decode the whole passage below.

<p class="fill-line"></p>
<p class="fill-line"></p>
<p class="fill-line"></p>
<p class="fill-line"></p>

<section class="answer-key" markdown="1">
## Check your answers

**Your tally should come out to:**

<div class="freq-tables">
<table class="freq-table freq-answer-table">
  <colgroup><col style="width: 20%"><col style="width: 80%"></colgroup>
  <tbody>
    <tr><td>A</td><td>{{ site.data.unplugged.cipher_frequency.counts.A }}</td></tr>
    <tr><td>B</td><td>{{ site.data.unplugged.cipher_frequency.counts.B }}</td></tr>
    <tr><td>C</td><td>{{ site.data.unplugged.cipher_frequency.counts.C }}</td></tr>
    <tr><td>D</td><td>{{ site.data.unplugged.cipher_frequency.counts.D }}</td></tr>
    <tr><td>E</td><td>{{ site.data.unplugged.cipher_frequency.counts.E }}</td></tr>
    <tr><td>F</td><td>{{ site.data.unplugged.cipher_frequency.counts.F }}</td></tr>
    <tr><td>G</td><td>{{ site.data.unplugged.cipher_frequency.counts.G }}</td></tr>
    <tr><td>H</td><td>{{ site.data.unplugged.cipher_frequency.counts.H }}</td></tr>
    <tr><td>I</td><td>{{ site.data.unplugged.cipher_frequency.counts.I }}</td></tr>
    <tr><td>J</td><td>{{ site.data.unplugged.cipher_frequency.counts.J }}</td></tr>
    <tr><td>K</td><td>{{ site.data.unplugged.cipher_frequency.counts.K }}</td></tr>
    <tr><td>L</td><td>{{ site.data.unplugged.cipher_frequency.counts.L }}</td></tr>
    <tr><td>M</td><td>{{ site.data.unplugged.cipher_frequency.counts.M }}</td></tr>
  </tbody>
</table>

<table class="freq-table freq-answer-table">
  <colgroup><col style="width: 20%"><col style="width: 80%"></colgroup>
  <tbody>
    <tr><td>N</td><td>{{ site.data.unplugged.cipher_frequency.counts.N }}</td></tr>
    <tr><td>O</td><td>{{ site.data.unplugged.cipher_frequency.counts.O }}</td></tr>
    <tr><td>P</td><td>{{ site.data.unplugged.cipher_frequency.counts.P }}</td></tr>
    <tr><td>Q</td><td>{{ site.data.unplugged.cipher_frequency.counts.Q }}</td></tr>
    <tr><td>R</td><td>{{ site.data.unplugged.cipher_frequency.counts.R }}</td></tr>
    <tr><td>S</td><td>{{ site.data.unplugged.cipher_frequency.counts.S }}</td></tr>
    <tr><td>T</td><td>{{ site.data.unplugged.cipher_frequency.counts.T }}</td></tr>
    <tr><td>U</td><td>{{ site.data.unplugged.cipher_frequency.counts.U }}</td></tr>
    <tr><td>V</td><td>{{ site.data.unplugged.cipher_frequency.counts.V }}</td></tr>
    <tr><td>W</td><td>{{ site.data.unplugged.cipher_frequency.counts.W }}</td></tr>
    <tr><td>X</td><td>{{ site.data.unplugged.cipher_frequency.counts.X }}</td></tr>
    <tr><td>Y</td><td>{{ site.data.unplugged.cipher_frequency.counts.Y }}</td></tr>
    <tr><td>Z</td><td>{{ site.data.unplugged.cipher_frequency.counts.Z }}</td></tr>
  </tbody>
</table>
</div>

**{{ site.data.unplugged.cipher_frequency.guess_letter }}** is the most common
letter in the ciphertext, standing in for **E**. That makes the key
**{{ site.data.unplugged.cipher_frequency.key }}**.

Decoded, the passage reads:

> {{ site.data.unplugged.cipher_frequency.plain | capitalize }}
</section>
