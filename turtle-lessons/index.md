---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/
---

# TurtleLab Lessons

Five steps with [TurtleLab]({{ '/turtlelab/' | relative_url }}), the block drawing tool where a turtle draws what you tell it. Each step starts from a sample you change. You draw your initials, learn loops, use chance, and make the program decide. Then you put it all together in a capstone: a piece of art that uses a loop, random, and if and else.

You need a computer with Chrome and a pencil. There is nothing to install. Steps 1, 4 and 5 end with a PDF of your work that you keep.

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
[Print the capstone planning sheet]({{ '/turtle-lessons/planning-sheet/' | relative_url }}) ·
[More samples to try]({{ '/turtlelab/samples.html' | relative_url }})
