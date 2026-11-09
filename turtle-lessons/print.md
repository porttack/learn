---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/print/
---

<div class="print-pathway">
{% assign lessons = site.turtlelessons | sort: "order" %}
{% for lesson in lessons %}{% unless lesson.companion %}
{% assign unit = site.data.turtle_units | where: "id", lesson.unit | first %}
<section class="print-lesson">
  <p class="print-unit-label">Unit {{ unit.id }}: {{ unit.title }}</p>
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endunless %}{% endfor %}
</div>
