---
layout: minimal
title: "Pico Projects"
permalink: /picoprojects/
source: original
---

# Pico Projects

A sequenced introduction to the Raspberry Pi Pico and physical computing, for students who aren't starting from zero: some computer science or Python background is assumed, so it moves faster than the [MicroPython on Pi Pico]({{ '/pico/' | relative_url }}) book and stays closer to computer science concepts early on. Built for AP Computer Science Principles and Programming with Robotics students. Each project is roughly sized for a class period or two, with its own slides and a worksheet or graphic organizer to go with it, and checkpoints along the way so a teacher can check in on student progress. Under active development, fall 2026.

<ol class="lesson-list project-list">
{% assign project_groups = site.pico | where_exp: "item", "item.project" | group_by: "project" %}
{% for group in project_groups %}
  {% assign parts = group.items | sort: "project_part" %}
  {% assign first_part = parts | first %}
  <li>
    <details open>
      <summary><a href="{{ first_part.url | relative_url }}">Project {{ group.name }}: {{ first_part.project_name }}</a></summary>
      <ol class="lesson-list project-parts">
      {% for part in parts %}
        <li>
          <a href="{{ part.url | relative_url }}">{{ part.title }}</a>
          {% if part.organizer %}<a class="lesson-companion-link" href="{{ part.organizer | relative_url }}">{{ part.organizer_label | default: "Notes page" }}</a>{% endif %}
          {% if part.slides %}<a class="lesson-companion-link" href="{{ part.slides | relative_url }}">{% if part.slides_label %}{{ part.slides_label }}{% else %}{{ part.label }} slides{% endif %}</a>{% endif %}
          {% if part.subtitle %}<p class="lesson-subtitle">{{ part.subtitle }}</p>{% endif %}
        </li>
      {% endfor %}
      </ol>
    </details>
  </li>
{% endfor %}
</ol>

## Standards alignment

Every project lesson lists the standards it supports under **Standards
alignment** at the bottom of its own page. Everything aligned so far, across
every project:

{% include standards-coverage-summary.html carrier="picoprojects" %}

