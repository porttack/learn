---
layout: default
title: "ROV Robotics"
permalink: /rovrobotics/
---

# ROV Robotics

The curriculum, lesson cards, and working practices behind a MATE ROV team run
as an engineering company. Sprints, pool days, design decision records, and a
library of lesson cards covering water physics, electricity, control,
software, and ocean science.

## Contents

{% assign all = site.rovrobotics | sort: "order" %}
{% assign reference = all | where_exp: "l", "l.unit == nil" %}
{% assign cards = all | where_exp: "l", "l.unit != nil" %}
{% assign units = cards | group_by: "unit" | sort: "name" %}

### Start here

<ul class="lesson-list">
{% for lesson in reference %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ul>

{% for unit in units %}
### {{ unit.name }}

<ul class="lesson-list">
{% for lesson in unit.items %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ul>
{% endfor %}

[Print the whole pathway]({{ '/rovrobotics/print/' | relative_url }})
