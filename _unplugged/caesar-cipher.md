---
title: "Caesar Cipher: hiding a message in plain sight"
source: original
level: both
kind: [single, supplementary]
topics: [Codes and ciphers]
time: 30
grouping: "Solo, or pair up to trade coded messages"
materials: "Pencil (scissors and a brad or pencil point, only if you build the wheel)"
generator: /unplugged/caesar-cipher-generator/
generator_presets:
  - { label: "Key given", query: "mode=key" }
  - { label: "Crack it (no key)", query: "mode=crack" }
---

## Why hide a message?

More than two thousand years ago, Julius Caesar needed to send orders to
his generals without an enemy who intercepted the letter being able to
read it. His trick was simple: shift every letter in the message the same
number of places through the alphabet. Anyone who did not know the shift
just saw nonsense.

That is a **cipher**: a rule for turning a readable message into an
unreadable one and back again. The rule here is called a shift cipher, or
a Caesar cipher after the man who is said to have used it. It still shows
up today, just as one small piece of much bigger, much harder ciphers, and
as a classic first puzzle for learning how codebreaking works at all.

## How a shift works

Pick a number from 1 to 25. That number is the **key**. To encode a
message, slide every letter that many places later in the alphabet,
wrapping back around to A after Z.

Here is key 3, worked out one letter at a time:

<table class="shift-example">
  <tr><th>Plain</th><td>H</td><td>E</td><td>L</td><td>L</td><td>O</td></tr>
  <tr><th>+3</th><td>K</td><td>H</td><td>O</td><td>O</td><td>R</td></tr>
</table>

**HELLO** becomes **KHOOR**. H is the 8th letter, and 3 letters after H is
K. E is the 5th letter, 3 letters after is H, and so on. Spaces do not
shift; they just stay spaces.

To decode, run the same slide backward: shift every letter of KHOOR back
3 places and you land on HELLO again.

## Your shift table

You do not need anything special to use a key, just the alphabet written
out twice: once in order, and once shifted. Fill in the second row for
whatever key you are using right now by counting forward that many
letters for every blank, wrapping from Z back to A.

{% assign shift_letters = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z" | split: "," %}

<table class="shift-table">
  <tr>
    <th></th>
    {%- for l in shift_letters -%}
    <td>{{ l }}</td>
    {%- endfor -%}
  </tr>
  <tr>
    <th>Key __</th>
    {%- for l in shift_letters -%}
    <td class="fill-cell"></td>
    {%- endfor -%}
  </tr>
</table>

Once that row is filled in, encoding and decoding are the same move: find
a letter in one row and read off whatever is below or above it in the
other row. You will fill this row in again every time you use a new key,
so do it in pencil. (If you would rather turn a dial than rewrite the
alphabet, there is a cut-out wheel that does the same job near the end of
this page. It is entirely optional.)

## Decode these

Here are five messages, all encoded with the same key.

**Key: {{ site.data.unplugged.cipher_fixed.decode.key }}**

<ol class="cipher-messages">
{%- for m in site.data.unplugged.cipher_fixed.decode.messages -%}
<li><code class="cipher-text">{{ m.cipher }}</code><p class="fill-line"></p></li>
{%- endfor -%}
</ol>

## Encode one of your own

On a separate scrap of paper, pick your own key from 1 to 25 and write a
short message in capital letters, no punctuation. Use your shift table (or
the wheel) to encode it letter by letter, checking each one as you go.

Copy just the finished, encoded message onto the line below, then swap
papers with a partner.

Message to swap: <span class="fill-line"></span>

If you also tell your partner the key, they can decode it the same way you
encoded it, just backward. For an extra challenge, do not tell them the
key, and see the next part.

<aside class="callout note" markdown="1">
**HOW TO CHECK EACH OTHER**

There is no single right answer here, so there is nothing in the answer
key for this part. Trade keys and messages with your partner and decode
each other's line. You are both right if you each land back on a real
message.
</aside>

## Crack it: no key given

This time, nobody tells you the key. All you get is the message below.

<p class="cipher-crack-text"><code class="cipher-text">{{ site.data.unplugged.cipher_fixed.crack.cipher }}</code></p>

That sounds harder, but think about what a key actually is: just a whole
number from 1 to 25. There is no key 26, because shifting every letter by
26 places is the same as not shifting at all, and a key of 0 would not
hide anything. **That is only 25 possibilities in total.** You can simply
try every one of them until a real message falls out.

Use the grid below to keep track. For each key, shift the message back
that many places and jot down just enough of the result to tell whether it
is real words or nonsense. You can stop as soon as one works.

<table class="crack-grid">
{%- for row in (0..4) -%}
<tr>
{%- for col in (1..5) -%}
{%- assign k = row | times: 5 | plus: col -%}
<td><span class="crack-key">{{ k }}</span><span class="fill-line short"></span></td>
{%- endfor -%}
</tr>
{%- endfor -%}
</table>

<aside class="callout note" markdown="1">
**WHY THIS MATTERS**

You just checked every possible key by hand, and it probably only took a
few minutes. A computer can try all 25 in a fraction of a second, and it
does not even need to read the results: it can just check each attempt
against a list of real words and stop at the first match. A cipher with
only 25 possible keys has almost no protection against a machine, which is
exactly why real security today depends on keys with far more
possibilities than anyone, or anything, could ever try one by one.
</aside>

**[Learn more about the Caesar cipher](https://en.wikipedia.org/wiki/Caesar_cipher).**

**Next step:** try a [Vigenère cipher]({{ '/unplugged/vigenere-cipher/' | relative_url }}),
which uses a whole keyword instead of one shift.

<section class="cutout-page" markdown="1">
{% include unplugged/caesar-cipher-wheel.html %}
</section>

<section class="answer-key" markdown="1">
## Check your answers

**Decode these (key {{ site.data.unplugged.cipher_fixed.decode.key }}).**

<ol class="cipher-messages">
{%- for m in site.data.unplugged.cipher_fixed.decode.messages -%}
<li>{{ m.plain | capitalize }}</li>
{%- endfor -%}
</ol>

**Crack it.** The key is **{{ site.data.unplugged.cipher_fixed.crack.key }}**. Shifting the
message back that many places gives:

> {{ site.data.unplugged.cipher_fixed.crack.plain | capitalize }}

If you found it with a different key than {{ site.data.unplugged.cipher_fixed.crack.key }}, check your
alphabet count. Only one key turns that message into real words.
</section>
