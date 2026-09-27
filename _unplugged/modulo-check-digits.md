---
title: "Check Digits: catching typos with modulo"
source: original
level: hs
kind: [single, supplementary]
topics: [Modulo]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/modulo-generator/
generator_presets:
  - { label: "More check digits", query: "mode=checkdigit" }
---

<div class="modulo-sheet" markdown="1">

Barcodes, ID numbers, and account numbers often carry one extra digit at the end whose only job is to catch typos. It's called a **check digit**, and it's computed with modulo. Below is a simplified version of the rule real barcodes use.

**The rule:** starting from the left, multiply each digit by 3, then 1, then 3, then 1, and so on, alternating. Add up all the products. The check digit is whatever number, added to that sum, makes a multiple of 10.

**Worked example:** the code `41729`.

| Digit | 4 | 1 | 7 | 2 | 9 |
|---|---|---|---|---|---|
| Weight | &times;3 | &times;1 | &times;3 | &times;1 | &times;3 |
| Product | 12 | 1 | 21 | 2 | 27 |
{: .checkoff}

12 + 1 + 21 + 2 + 27 = 63. The next multiple of 10 is 70, and 70 &minus; 63 = 7. So the check digit is **7**, and the full code is printed as `417297`.

Here's why that catches mistakes: if you mistype any one digit, the sum almost never lands on a multiple of 10 anymore. A computer can check that in an instant, without knowing anything about what the code actually means.

## Part 1: Is this code real?

Each code below ends in its check digit. Work out whether that check digit is correct.

<table class="checkoff modulo-table">
  <colgroup><col style="width: 55%"><col style="width: 45%"></colgroup>
  <thead><tr><th>Code</th><th>Real or fake?</th></tr></thead>
  <tbody>
  {%- for v in site.data.unplugged.modulo_check_digits.validate -%}
    <tr><td><span class="modulo-code">{{ v.full }}</span></td><td><span class="fill-line short"></span></td></tr>
  {%- endfor -%}
  </tbody>
</table>

## Part 2: Find the missing digit

This time, the last digit is missing. Work out what it has to be.

<table class="checkoff modulo-table">
  <colgroup><col style="width: 55%"><col style="width: 45%"></colgroup>
  <thead><tr><th>Code</th><th>Missing digit</th></tr></thead>
  <tbody>
  {%- for f in site.data.unplugged.modulo_check_digits.find_missing -%}
    <tr><td><span class="modulo-code">{{ f.data | join: "" }}?</span></td><td><span class="fill-line short"></span></td></tr>
  {%- endfor -%}
  </tbody>
</table>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Swap two neighboring digits in a real code (don't touch the check digit
itself) and check it again. Does the swap always get caught? Try it on a
code where the two digits you swap are far apart in value, then one where
they're close.
</aside>

<section class="answer-key" markdown="1">

**Part 1.**
{%- for v in site.data.unplugged.modulo_check_digits.validate %} {{ v.full }}: {% if v.valid %}real{% else %}fake{% endif %}.{% endfor %}

**Part 2.**
{%- for f in site.data.unplugged.modulo_check_digits.find_missing %} {{ f.data | join: "" }}?: {{ f.check }}.{% endfor %}

**Challenge.** Swapping two neighboring digits changes the sum by 2 times
their difference (because one was weighted &times;3 and the other &times;1,
or vice versa). That only slips past the check digit undetected when the
two digits differ by exactly 5 (0 and 5, 1 and 6, and so on). Try it
both ways and you'll see the pattern. Real barcodes use this same rule, and
share this same rare blind spot.
</section>

</div>
