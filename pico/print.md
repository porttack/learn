---
layout: default
title: "MicroPython on Raspberry Pi Pico — Print Edition"
permalink: /pico/print/
---

<div class="print-pathway">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endfor %}
</div>
