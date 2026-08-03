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

<ol class="lesson-list">
{% assign lessons = site.rovrobotics | sort: "order" %}
{% for lesson in lessons %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ol>

[Print the whole pathway]({{ '/rovrobotics/print/' | relative_url }})
