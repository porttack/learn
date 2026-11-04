---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/print/
---

<div class="print-pathway">
{% assign lessons = site.turtlelessons | sort: "order" %}
{% for lesson in lessons %}{% unless lesson.companion %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endunless %}{% endfor %}
</div>
