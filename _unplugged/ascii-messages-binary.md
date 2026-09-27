---
title: "Secret Messages in Binary"
source: original
level: both
kind: [single, supplementary]
topics: [Binary, Data representation]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/ascii-messages-generator/
generator_presets:
  - { label: "Binary, decode", query: "format=binary&direction=decode&chart=fill" }
  - { label: "Binary, encode", query: "format=binary&direction=encode&chart=fill" }
---

Every letter's ASCII code can be written in binary too: 8 boxes of 0s and
1s instead of one number. This sheet uses the same idea as
[Secret Messages in ASCII]({{ '/unplugged/ascii-messages/' | relative_url }}),
just with a different way of writing the codes.

## Your chart

Each binary code has 8 boxes. Left to right, the boxes are worth:

<p class="place-values"><strong>128 &nbsp; 64 &nbsp; 32 &nbsp; 16 &nbsp; 8 &nbsp; 4 &nbsp; 2 &nbsp; 1</strong></p>

{% include unplugged/ascii-chart.html fill="binary" per_row=7 prefill="M" %}

## What to do

1. Add up the place values wherever a code has a 1. That's its decimal number.
2. Find that number in the chart and write the letter in the box under the code.
3. Write the binary code in the chart's empty box, so next time you can just look it up.
4. Read your finished answer to check it makes sense.

<aside class="callout note" markdown="1">
**TRY THIS FIRST**

`01001000` has 1s under 64 and 8. 64 + 8 = 72, and 72 is **H**.
`01001001` is 64 + 8 + 1 = 73, which is **I**. Together: **HI**.

<div class="code-row is-example">
  <div class="code-cell"><span class="code-num">01001000</span><span class="code-box">H</span></div>
  <div class="code-cell"><span class="code-num">01001001</span><span class="code-box">I</span></div>
</div>

Shortcut: every capital letter starts `010`, so only the last five boxes change.
</aside>

## Now decode these

{% assign msgs = site.data.unplugged.ascii_fixed.binary.messages %}
{% for m in msgs %}
<div class="ascii-question">
<p class="ascii-prompt">{{ forloop.index }}. {{ m.prompt }}</p>
<div class="code-row">
{% for code in m.codes %}
<div class="code-cell">
  <span class="code-num">{{ code }}</span>
  <span class="code-box"></span>
</div>
{% endfor %}
</div>
</div>
{% endfor %}

## Now go the other way

{% assign enc = site.data.unplugged.ascii_fixed.binary.encode | first %}
<div class="ascii-question">
<p class="ascii-prompt">{{ enc.prompt }}</p>
<div class="code-row">
{% assign chars = enc.text | split: "" %}
{% for ch in chars %}
<div class="code-cell">
  <span class="code-letter">{{ ch }}</span>
  <div class="bit-row">
    {% for i in (1..8) %}<span class="bit-box"></span>{% endfor %}
  </div>
</div>
{% endfor %}
</div>
</div>

Want the whole table, including lowercase letters? See the
[full ASCII / Hex table]({{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}).

<section class="answer-key">
<h2>Answer key</h2>
<ol class="ascii-key-list">
{% for m in msgs %}<li>{{ m.text }}</li>
{% endfor %}</ol>
<p class="ascii-key-encode"><strong>Now go the other way:</strong> {{ enc.text }} &rarr; {{ enc.codes | join: " " }}</p>
</section>
