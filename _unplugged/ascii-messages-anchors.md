---
title: "Secret Messages: Only Four Clues"
source: original
level: hs
kind: [single, supplementary]
topics: [Binary, Data representation]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/ascii-messages-generator/
generator_presets:
  - { label: "Hex, four clues", query: "format=hex&direction=decode&chart=anchors" }
  - { label: "Binary, four clues", query: "format=binary&direction=decode&chart=anchors" }
  - { label: "Decimal, four clues", query: "format=decimal&direction=decode&chart=anchors" }
---

No code chart this time. ASCII puts the letters and digits in order, so four
codes are all you need to work out the rest. These messages use lowercase
letters and digits too.

## Your four clues

<div class="ascii-anchors">
  <span>A = 65</span><span>a = 97</span><span>0 = 48</span><span>space = 32</span>
</div>

## What to do

1. Turn the hex code into decimal: first digit times 16, plus the second digit.
2. Pick the clue it belongs to: 48 to 57 is a digit, 65 to 90 a capital, 97 to 122 lowercase.
3. Subtract that clue's number, then count forward that many places.
4. Write the character in the box under the code.

<aside class="callout note" markdown="1">
**TRY THIS FIRST**

`48` is 4 &times; 16 + 8 = 72. That's a capital, and 72 &minus; 65 = 7: seven
letters after A is **H**. `69` is 105, lowercase, and 105 &minus; 97 = 8:
eight letters after a is **i**. `20` is 32, a space. `35` is 53, a digit,
and 53 &minus; 48 = **5**. Together: **Hi 5**.

<div class="code-row is-example">
  <div class="code-cell"><span class="code-num">48</span><span class="code-box">H</span></div>
  <div class="code-cell"><span class="code-num">69</span><span class="code-box">i</span></div>
  <div class="code-cell is-space"><span class="code-num">20</span><span class="code-box"></span></div>
  <div class="code-cell"><span class="code-num">35</span><span class="code-box">5</span></div>
</div>
</aside>

## Now decode these

{% assign msgs = site.data.unplugged.ascii_fixed.anchors.messages %}
{% for m in msgs %}
<div class="ascii-question">
<p class="ascii-prompt">{{ forloop.index }}. {{ m.prompt }}</p>
<div class="code-row">
{% for code in m.codes %}
<div class="code-cell{% if code == "20" %} is-space{% endif %}">
  <span class="code-num">{{ code }}</span>
  <span class="code-box"></span>
</div>
{% endfor %}
</div>
</div>
{% endfor %}

<aside class="callout challenge" markdown="1">
**CHALLENGE**

In hex, capital A is `41` and lowercase a is `61`. What do you add to any
capital letter's hex code to make it lowercase? Why is that a handy number
for a computer?
</aside>

<section class="answer-key">
<h2>Answer key</h2>
<ol class="ascii-key-list">
{% for m in msgs %}<li>{{ m.text }}</li>
{% endfor %}</ol>
</section>
