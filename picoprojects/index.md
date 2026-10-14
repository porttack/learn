---
layout: minimal
title: "Pico Projects"
permalink: /picoprojects/
source: original
---

# Pico Projects

High school classroom lessons strongly related to MicroPython on Pi Pico. Not part of the [MicroPython on Pi Pico and Projects]({{ '/pico/' | relative_url }}) book, and not tied to its chapter numbering. More will be added here over time.

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

