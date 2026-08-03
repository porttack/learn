---
layout: default
title: "SEL Studio, Print Edition"
permalink: /studio/print/
---

<div class="print-pathway">
{% assign lessons = site.studio | sort: "order" %}
{% for lesson in lessons %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endfor %}
</div>
