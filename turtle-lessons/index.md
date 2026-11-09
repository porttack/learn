---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/
---

# TurtleLab Lessons

Eighteen steps with [TurtleLab]({{ '/turtlelab/' | relative_url }}), the block drawing tool where a turtle draws what you tell it. Each step starts from a sample you change, and most have a real TurtleLab built into the page, so you can change a demo and run it without leaving the lesson.

The steps come in four units. Each unit ends with a capstone: a project of your own that uses everything in the unit.

You need a computer with Chrome and a pencil. There is nothing to install. Every step ends with a way to keep a PDF of your work.

## Steps

{% assign lessons = site.turtlelessons | sort: "order" %}
{% for unit in site.data.turtle_units %}
<section class="tl-unit tl-unit-{{ unit.id }}">
  <h3 class="tl-unit-title"><span class="tl-unit-label">Unit {{ unit.id }}</span> {{ unit.title }}</h3>
  <p class="tl-unit-blurb">{{ unit.blurb }}</p>
  <ol class="tl-unit-steps">
{% for lesson in lessons %}{% unless lesson.companion %}{% if lesson.unit == unit.id %}
    <li{% if lesson.title contains "Capstone" %} class="tl-capstone"{% endif %}>
      <span class="tl-step-num" aria-hidden="true">{{ lesson.order }}</span>
      <a href="{{ lesson.url | relative_url }}"><span class="visually-hidden">Step {{ lesson.order }}: </span>{{ lesson.title }}</a>
    </li>
{% endif %}{% endunless %}{% endfor %}
  </ol>
</section>
{% endfor %}

[Print all eighteen steps]({{ '/turtle-lessons/print/' | relative_url }}) ·
[Print the planning sheet for the first capstone]({{ '/turtle-lessons/planning-sheet/' | relative_url }}) ·
[More samples to try]({{ '/turtlelab/samples.html' | relative_url }})

## For teachers

[For teachers]({{ '/turtle-lessons/teacher-notes/' | relative_url }}): the sequence, assignment text to paste into your class site, and a substitute day plan.
