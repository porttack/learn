---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/
---

# TurtleLab Lessons

Five steps with [TurtleLab]({{ '/turtlelab/' | relative_url }}), the block drawing tool where a turtle draws what you tell it. Each step starts from a sample you change and then take further. You finish with a piece of art that uses a loop, random, and if and else.

You need a Chromebook (or any computer with Chrome), a pencil, and the printed [activity sheet]({{ '/turtle-lessons/activity-sheet/' | relative_url }}). There is nothing to install.

## Steps

<ol class="lesson-list">
{% assign lessons = site.turtlelessons | sort: "order" %}
{% for lesson in lessons %}{% unless lesson.companion %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
    {% if lesson.time %}<span class="checkoff-note">(about {{ lesson.time }} minutes)</span>{% endif %}
  </li>
{% endunless %}{% endfor %}
</ol>

[Print the activity sheet]({{ '/turtle-lessons/activity-sheet/' | relative_url }}) ·
[Print all five steps]({{ '/turtle-lessons/print/' | relative_url }}) ·
[More samples to try]({{ '/turtlelab/samples.html' | relative_url }})

## For teachers

[For teachers and substitutes]({{ '/turtle-lessons/teacher-notes/' | relative_url }}): the sequence, a two hour substitute plan for Steps 1 and 2, and the answers.
