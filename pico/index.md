---
layout: minimal
title: "MicroPython on Pi Pico"
permalink: /pico/
---

# MicroPython on Pi Pico

Get acquainted with the Raspberry Pi Pico and MicroPython: wiring,
flashing firmware, and physical computing fundamentals. Foundational
material shared across courses, not specific to any one class.

We write and run code in [ViperIDE](https://viper-ide.org), a
browser-based MicroPython IDE: no software install, no admin rights
needed.

## Contents

**I'm in the process of porting this Creative Commons licensed book for my students and classroom. It is only partially ported right now.**

<ol class="lesson-list">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
  {% unless lesson.companion %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.organizer %}<a class="lesson-companion-link" href="{{ lesson.organizer | relative_url }}">Graphic organizer</a>{% endif %}
    {% if lesson.slides %}<a class="lesson-companion-link" href="{{ lesson.slides | relative_url }}">Intro slides</a>{% endif %}
    {% if lesson.subtitle %}<p class="lesson-subtitle">{{ lesson.subtitle }}</p>{% endif %}
  </li>
  {% endunless %}
{% endfor %}
</ol>

[Print the whole pathway]({{ '/pico/print/' | relative_url }})
