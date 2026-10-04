---
layout: minimal
title: "MicroPython on Pi Pico and Projects"
permalink: /pico/
source: original
---

<div class="pathway-banner-row" markdown="0">
<img class="pathway-banner" src="{{ '/assets/img/pico/fig-1-1.jpg' | relative_url }}" alt="MicroPython on Pi Pico and Projects">
<a href="#projects" class="projects-cta">
  <svg class="projects-cta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 18 L5 11 L13 11 L13 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="13" cy="6" r="2.2" fill="currentColor"/>
  </svg>
  Go to Projects
</a>
</div>
<script src="{{ '/assets/js/pico-projects-jump.js' | relative_url }}" defer></script>

# MicroPython on Pi Pico and Projects

{% assign book = site.data.sources | where: "id", "rpi-pico-2e" | first %}
<p class="provenance">
  Adapted from <cite>{{ book.title }}</cite>, {{ book.year }}, by {{ book.author }} ({{ book.publisher }}).
  Licensed under <a href="{{ book.licence_url }}">{{ book.licence }}</a>.
</p>

Get acquainted with the Raspberry Pi Pico and MicroPython: wiring,
flashing firmware, and physical computing fundamentals. Foundational
material shared across courses, not specific to any one class.

<cite>{{ book.title }}</cite> is a genuinely great book, and because it's
Creative Commons licensed, it's also a fantastic resource if you want to
keep learning MicroPython well past this class, on your own. For some
chapters we've added our own slides or a Notes page to go with the reading.

Chapters 1 through 4 are the fundamentals: getting to know the board,
programming it, and physical computing basics. Chapters 5 through 12 are
the book's own hands-on projects, built on that foundation. Some of these
take more than one class or block period to finish, so plan accordingly.

<aside class="callout note" markdown="1">
**KEEP THIS HANDY**

[Appendix B]({{ '/pico/14-pinout-guide/' | relative_url }})'s Raspberry Pi Pico pinout diagram is one you'll want to check constantly while wiring, not just read once when you happen to reach it. Keep it open in another tab from day one.
</aside>

## Contents

<ol class="lesson-list">
{% assign lessons = site.pico | sort: "order" %}
{% for lesson in lessons %}
  {% unless lesson.companion or lesson.project %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.organizer %}<a class="lesson-companion-link" href="{{ lesson.organizer | relative_url }}">Notes page</a>{% endif %}
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
          {% if part.organizer %}<a class="lesson-companion-link" href="{{ part.organizer | relative_url }}">Notes page</a>{% endif %}
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
