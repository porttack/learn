---
layout: default
title: "MicroPython on Raspberry Pi Pico"
permalink: /pico/
---

# MicroPython on Raspberry Pi Pico

Get acquainted with the Raspberry Pi Pico and MicroPython: wiring,
flashing firmware, and physical computing fundamentals. Foundational
material shared across courses, not specific to any one class.

We write and run code in [ViperIDE](https://viper-ide.org), a
browser-based MicroPython IDE — no software install, no admin rights
needed.

## Contents

<ol class="lesson-list">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ol>

[Print the whole pathway]({{ '/pico/print/' | relative_url }})
