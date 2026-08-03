---
layout: default
title: "Electronics 101"
permalink: /electronics101/
---

# Electronics 101

Build nine circuits in Tinkercad, from a single AA cell to a micro:bit
aiming a servo, then rebuild the last five with real parts. You build each
one from a printed diagram first — we talk through what's happening in it
after it's already working, not before. Foundational material shared
across courses, not specific to any one class.

## Contents

<ol class="lesson-list">
{% assign lessons = site.electronics101 | sort: "order" %}
{% for lesson in lessons %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.order == 0 %}
    <ul class="lesson-sublist">
      <li><a href="https://porttack.com/2026/05/04/kilo-and-milli.html">Kilo &amp; milli: borrowing the meter stick</a> (read this first)</li>
    </ul>
    {% endif %}
  </li>
{% endfor %}
</ol>

[Print the whole pathway]({{ '/electronics101/print/' | relative_url }}) ·
[Checkoff sheet]({{ '/electronics101/checkoff/' | relative_url }})

## For teachers

[Pacing this alongside Pico]({{ '/electronics101/pacing/' | relative_url }})
— how this pathway lines up with the early, reading-heavy Pico lessons.
