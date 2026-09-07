---
layout: minimal
title: "MicroPython on Pi Pico"
permalink: /pico/
source: original
---

# MicroPython on Pi Pico

{% assign book = site.data.sources | where: "id", "rpi-pico-2e" | first %}
<p class="provenance">
  Adapted from <cite>{{ book.title }}</cite>, {{ book.year }}, by {{ book.author }} ({{ book.publisher }}).
  Licensed under <a href="{{ book.licence_url }}">{{ book.licence }}</a>.
</p>

Get acquainted with the Raspberry Pi Pico and MicroPython: wiring,
flashing firmware, and physical computing fundamentals. Foundational
material shared across courses, not specific to any one class.

<div class="pathway-hero-image">
  <img src="{{ '/assets/img/pico/fig-1-1.jpg' | relative_url }}" alt="The top of a Raspberry Pi Pico 2 board">
</div>

## Contents

<ol class="lesson-list">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
  {% unless lesson.companion %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.organizer %}<a class="lesson-companion-link" href="{{ lesson.organizer | relative_url }}">Graphic organizer</a>{% endif %}
    {% if lesson.slides %}<a class="lesson-companion-link" href="{{ lesson.slides | relative_url }}">Chapter {{ lesson.chapter }} slides</a>{% endif %}
    {% if lesson.subtitle %}<p class="lesson-subtitle">{{ lesson.subtitle }}</p>{% endif %}
  </li>
  {% endunless %}
{% endfor %}
</ol>

[Print the whole pathway]({{ '/pico/print/' | relative_url }})

{% include provenance.html %}
