---
layout: minimal
title: "MicroPython on Pi Pico and Projects"
permalink: /pico/
source: original
---

# MicroPython on Pi Pico and Projects

{% assign book = site.data.sources | where: "id", "rpi-pico-2e" | first %}
<p class="provenance">
  Adapted from <cite>{{ book.title }}</cite>, {{ book.year }}, by {{ book.author }} ({{ book.publisher }}).
  Licensed under <a href="{{ book.licence_url }}">{{ book.licence }}</a>.
</p>

Get acquainted with the Raspberry Pi Pico and MicroPython: wiring,
flashing firmware, and physical computing fundamentals. Foundational
material shared across courses, not specific to any one class.

<div class="pathway-hero-image">
  <img src="{{ '/assets/img/pico/fig-1-1.jpg' | relative_url }}" alt="The top of a Raspberry Pi Pico 2 board">
</div>

<aside class="callout note" markdown="1">
**LOOKING FOR THIS CLASS'S PROJECTS?**

The book's own chapters are listed below exactly as the book has them. The hands-on projects built specifically for this class are original material, not part of the book, and live in their own section further down the page: [jump to Projects](#projects).
</aside>

## Contents

<ol class="lesson-list">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
  {% unless lesson.companion or lesson.project %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.organizer %}<a class="lesson-companion-link" href="{{ lesson.organizer | relative_url }}">Graphic organizer</a>{% endif %}
    {% if lesson.slides %}<a class="lesson-companion-link" href="{{ lesson.slides | relative_url }}">{% if lesson.label %}{{ lesson.label }} slides{% else %}Chapter {{ lesson.chapter }} slides{% endif %}</a>{% endif %}
    {% if lesson.subtitle %}<p class="lesson-subtitle">{{ lesson.subtitle }}</p>{% endif %}
  </li>
  {% endunless %}
{% endfor %}
</ol>

[Print the whole book]({{ '/pico/print/' | relative_url }})

## Projects

High school classroom lessons strongly related to MicroPython on Pi Pico. Not part of the book above, and not tied to its chapter numbering. More will be added here over time.

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
          {% if part.organizer %}<a class="lesson-companion-link" href="{{ part.organizer | relative_url }}">Graphic organizer</a>{% endif %}
          {% if part.slides %}<a class="lesson-companion-link" href="{{ part.slides | relative_url }}">{{ part.label }} slides</a>{% endif %}
          {% if part.subtitle %}<p class="lesson-subtitle">{{ part.subtitle }}</p>{% endif %}
        </li>
      {% endfor %}
      </ol>
    </details>
  </li>
{% endfor %}
</ol>

{% include provenance.html %}
