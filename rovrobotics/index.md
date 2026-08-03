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
{% assign primary = reference | where_exp: "l", "l.nav == 'primary'" %}
{% assign secondary = reference | where_exp: "l", "l.nav == 'secondary'" %}
{% assign cards = all | where_exp: "l", "l.unit != nil" %}
{% assign units = cards | group_by: "unit" | sort: "name" %}

### Start here

<ul class="lesson-list">
{% for lesson in primary %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ul>

---

### Also Useful

<ul class="lesson-list">
{% for lesson in secondary %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ul>

---

Please know that this is a work-in-progress. Quite a bit of it represents rough draft slop. In 2026-27, many of these will be rewritten. Some already are. If you want to make improvements, please ask your teacher; he'd appreciate it and the content is all in github.

{% for unit in units %}
### {{ unit.name }}

<table class="checkoff">
<thead>
<tr><th>Card</th><th>Status</th><th>Solo?</th><th>Est.</th></tr>
</thead>
<tbody>
{% for lesson in unit.items %}
<tr>
<td><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></td>
<td>{{ lesson.status | default: "n/a" }}</td>
<td>{% if lesson.solo %}Yes{% else %}No{% endif %}</td>
<td>{{ lesson.duration | default: "n/a" }}</td>
</tr>
{% endfor %}
</tbody>
</table>
{% endfor %}

[Print the whole pathway]({{ '/rovrobotics/print/' | relative_url }})

[What's still in progress]({{ '/rovrobotics/todo/' | relative_url }})
