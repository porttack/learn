---
title: "Clocks That Wrap Around: the modulo idea"
source: cs-unplugged-web
source_url: "https://www.csunplugged.org/en/topics/kidbots/modulo/"
level: ms
kind: [single, supplementary]
topics: [Modulo]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/modulo-generator/
generator_presets:
  - { label: "More clock problems", query: "mode=clock&level=ms" }
  - { label: "Clock challenge", query: "mode=clock&level=hs" }
---

<div class="modulo-sheet" markdown="1">

Some numbers wrap around instead of growing forever, like the hands on a clock. This wraparound trick is called **modulo**, and computers use it all the time. You'll count around a few clocks, then predict a computer's own version of it.

**Learn more:** clocks are one example of [modular arithmetic](https://en.wikipedia.org/wiki/Modular_arithmetic), a whole branch of math built on wraparound counting.

1. Look at the clock below. It has 10 spots, numbered 0 to 9.
2. Start at the number you're given.
3. Count forward that many steps around the circle, going past 9 back to 0.
4. Write down the spot where you land.
5. Check yourself: it's always the last digit of start + steps added normally.

<div class="modulo-clock-main">
{% include unplugged/modulo-clock-10.html %}
</div>

**For example:** start at 7, count forward 4 steps: 8, 9, 0, 1. You land on **1**. Quick check: 7 + 4 = 11, and 1 is the last digit of 11. That will always work on this clock, because it only has 10 spots.

## Count forward

<table class="checkoff modulo-table">
  <colgroup><col style="width: 34%"><col style="width: 34%"><col style="width: 32%"></colgroup>
  <thead><tr><th>Start at</th><th>Count forward</th><th>Land on</th></tr></thead>
  <tbody>
  {%- for p in site.data.unplugged.modulo_clocks.forward.problems -%}
    <tr><td>{{ p.start }}</td><td>{{ p.steps }} steps</td><td><span class="fill-line short"></span></td></tr>
  {%- endfor -%}
  </tbody>
</table>

## Counting backward

Counting backward works the same way, just going the other direction. Past 0, you wrap around to 9 instead.

**For example:** start at 2, count backward 5 steps: 1, 0, 9, 8, 7. You land on **7**.

<table class="checkoff modulo-table">
  <colgroup><col style="width: 34%"><col style="width: 34%"><col style="width: 32%"></colgroup>
  <thead><tr><th>Start at</th><th>Count backward</th><th>Land on</th></tr></thead>
  <tbody>
  {%- for p in site.data.unplugged.modulo_clocks.backward.problems -%}
    <tr><td>{{ p.start }}</td><td>{{ p.steps }} steps</td><td><span class="fill-line short"></span></td></tr>
  {%- endfor -%}
  </tbody>
</table>

## Other clocks

The same wraparound idea works for any size clock, not just 10. Here are five you already use in real life.

<table class="modulo-other-clocks">
  <tr>
    <td>{% include unplugged/modulo-clock-12.html %}</td>
    <td>{{ site.data.unplugged.modulo_clocks.other_clocks[0].question }} <span class="fill-line short"></span></td>
  </tr>
  <tr>
    <td>{% include unplugged/modulo-clock-7.html %}</td>
    <td>{{ site.data.unplugged.modulo_clocks.other_clocks[2].question }} <span class="fill-line short"></span></td>
  </tr>
  <tr>
    <td>{% include unplugged/modulo-clock-2.html %}</td>
    <td>{{ site.data.unplugged.modulo_clocks.other_clocks[4].question }} <span class="fill-line short"></span></td>
  </tr>
  <tr>
    <td class="modulo-no-fig">24-hour &amp; 360&deg;</td>
    <td>A 24-hour clock wraps from 23 back to 0; a full turn (360&deg;) works the same way. {{ site.data.unplugged.modulo_clocks.other_clocks[1].question }} <span class="fill-line short"></span> {{ site.data.unplugged.modulo_clocks.other_clocks[3].question }} <span class="fill-line short"></span></td>
  </tr>
</table>

## Predicting a computer's version

Python, a programming language, writes this exact same idea as `%`. `17 % 5` means "count forward 17 steps on a 5-spot clock (0, 1, 2, 3, 4), starting at 0. Where do you land?" Try it: 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1, 2. That's 17 steps, landing on **2**. So `17 % 5` is `2`.

<table class="checkoff modulo-table">
  <colgroup><col style="width: 50%"><col style="width: 50%"></colgroup>
  <thead><tr><th>Expression</th><th>Predict the value</th></tr></thead>
  <tbody>
  {%- for p in site.data.unplugged.modulo_clocks.predict.problems -%}
    <tr><td><code>{{ p.a }} % {{ p.n }}</code></td><td><span class="fill-line short"></span></td></tr>
  {%- endfor -%}
  </tbody>
</table>

<section class="answer-key" markdown="1">

**Count forward.**
{%- for p in site.data.unplugged.modulo_clocks.forward.problems %} {{ p.start }}+{{ p.steps }}→{{ p.answer }}.{% endfor %}

**Counting backward.**
{%- for p in site.data.unplugged.modulo_clocks.backward.problems %} {{ p.start }}−{{ p.steps }}→{{ p.answer }}.{% endfor %}

**Other clocks.**
{%- for c in site.data.unplugged.modulo_clocks.other_clocks %} {{ c.name | capitalize }}: {{ c.answer_text }}.{% endfor %}

**Predicting %.**
{%- for p in site.data.unplugged.modulo_clocks.predict.problems %} {{ p.a }} % {{ p.n }} = {{ p.answer }}.{% endfor %}
</section>

</div>
