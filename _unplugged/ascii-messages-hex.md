---
title: "Secret Messages in Hex"
source: original
level: hs
kind: [single, supplementary]
topics: [Binary, Data representation]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/ascii-messages-generator/
---

Computers also write numbers in base 16, called hex. You will see it in web
colors and error codes. Hex uses 16 digits instead of 10, so after 9 it
keeps counting with letters: A, B, C, D, E, F.

## Hex digit helper

<table class="ascii-table">
<tbody>
<tr><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr>
<tr><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr>
<tr><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>13</th><th>14</th><th>15</th></tr>
<tr><td>8</td><td>9</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td></tr>
</tbody>
</table>

A two-digit hex code means (first digit &times; 16) + second digit. So
`48` is 4 &times; 16 + 8 = 72.

## Your chart

{% include unplugged/ascii-chart.html fill="hex" per_row=9 %}

## What to do

1. Turn each hex code into a decimal number: first digit times 16, plus the second digit.
2. Find that number in the chart and write the letter in the box under the code.
3. Write the hex code in the chart's empty box, so next time you can just look it up.
4. Read your finished answer to check it makes sense.

<aside class="callout note" markdown="1">
**TRY THIS FIRST**

`48` is 4 &times; 16 + 8 = 72, which is **H**. `49` is 73, which is **I**.
Together: **HI**.

<div class="code-row is-example">
  <div class="code-cell"><span class="code-num">48</span><span class="code-box">H</span></div>
  <div class="code-cell"><span class="code-num">49</span><span class="code-box">I</span></div>
</div>
</aside>

## Now decode these

{% assign msgs = site.data.unplugged.ascii_fixed.hex.messages %}
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

{% assign enc = site.data.unplugged.ascii_fixed.hex.encode | first %}
<div class="ascii-question">
<p class="ascii-prompt">{{ enc.prompt }}</p>
<div class="code-row">
{% assign chars = enc.text | split: "" %}
{% for ch in chars %}
<div class="code-cell">
  <span class="code-letter">{{ ch }}</span>
  <span class="value-box"></span>
</div>
{% endfor %}
</div>
</div>

Want the whole table, including lowercase letters and punctuation? See the
[full ASCII / Hex table]({{ '/ap-csp-reference/ascii-hex-table/' | relative_url }}).

<aside class="callout challenge" markdown="1">
**CHALLENGE**

In the digit helper, F means the digit 15. So which letter is the code
`4F`?
</aside>

<section class="answer-key">
<h2>Answer key</h2>
<ol class="ascii-key-list">
{% for m in msgs %}<li>{{ m.text }}</li>
{% endfor %}</ol>
<p class="ascii-key-encode"><strong>Now go the other way:</strong> {{ enc.text }} &rarr; {{ enc.codes | join: " " }}</p>
</section>
