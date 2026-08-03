---
layout: default
title: "MATE ROV: Physical Computing"
permalink: /rov/
---

# MATE ROV: Physical Computing

Build the electronics and control code for an underwater ROV, from
soldering headers through thruster control and sensor payloads. Raspberry
Pi Pico and MicroPython, programmed in the browser.

## Contents

<ol class="lesson-list">
{% assign lessons = site.rov | sort: "order" %}
{% for lesson in lessons %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ol>

[Print the whole pathway]({{ '/rov/print/' | relative_url }})
