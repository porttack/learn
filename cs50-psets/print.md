---
layout: default
title: "CS50 Problem Sets — Print Edition"
permalink: /cs50-psets/print/
---

<div class="print-pathway">
{% assign lessons = site.cs50psets | sort: "order" %}
{% for lesson in lessons %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endfor %}
</div>
