---
layout: default
title: "ROV Robotics, Print Edition"
permalink: /rovrobotics/print/
---

<div class="print-pathway">
{% assign all = site.rovrobotics | sort: "order" %}
{% assign reference = all | where_exp: "l", "l.unit == nil" %}
{% assign cards = all | where_exp: "l", "l.unit != nil" %}
{% assign units = cards | group_by: "unit" | sort: "name" %}

{% for lesson in reference %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endfor %}

{% for unit in units %}
<h1 class="print-unit-divider">{{ unit.name }}</h1>
{% for lesson in unit.items %}
<section class="print-lesson">
  <h1>{{ lesson.title }}</h1>
  {{ lesson.content }}
</section>
{% endfor %}
{% endfor %}
</div>
