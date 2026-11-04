---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/
---

# TurtleLab Lessons

Five steps with [TurtleLab]({{ '/turtlelab/' | relative_url }}), the block drawing tool where a turtle draws what you tell it. Each step starts from a sample you change and then take further. Step 1 is a small first project, a PDF of your initials. Step 5 is a capstone: a piece of art that uses a loop, random, and if and else.

You need a computer with Chrome and a pencil. There is nothing to install.

## Steps

<ol class="lesson-list">
{% assign lessons = site.turtlelessons | sort: "order" %}
{% for lesson in lessons %}{% unless lesson.companion %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
  </li>
{% endunless %}{% endfor %}
</ol>

[Print all five steps]({{ '/turtle-lessons/print/' | relative_url }}) ·
[More samples to try]({{ '/turtlelab/samples.html' | relative_url }})

## For teachers

[For teachers]({{ '/turtle-lessons/teacher-notes/' | relative_url }}): the sequence, assignment text you can paste into your class site, and the answers.
