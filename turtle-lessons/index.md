---
layout: minimal
title: "TurtleLab Lessons"
permalink: /turtle-lessons/
---

# TurtleLab Lessons

Sixteen steps with [TurtleLab]({{ '/turtlelab/' | relative_url }}), the block drawing tool where a turtle draws what you tell it. Each step starts from a sample you change.

The first five steps: you draw your initials, learn loops, use chance, and make the program decide. Then you put it all together in a capstone: a piece of art that uses a loop, random, and if and else.

The next seven (6 to 12): you keep numbers in variables (boxes), make variables that count, teach the turtle new words, put a loop inside a loop, see that color is three numbers, hunt down bugs, and finish with a second capstone that uses boxes, a block of your own and a loop. Many of these steps have a real TurtleLab built into the page, so you can change a demo and run it without leaving the lesson.

The next four (13 to 16): you ask the person using your program for a number, make your program listen for clicks on the paper, finish with a third capstone that does both, and then build a click game, where **and**, **or** and **not** decide whether a click hit the target.

You need a computer with Chrome and a pencil. There is nothing to install. Every step ends with a way to keep a PDF of your work.

## Steps

<ol class="lesson-list">
{% assign lessons = site.turtlelessons | sort: "order" %}
{% for lesson in lessons %}{% unless lesson.companion %}
  <li>
    <a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a>
  </li>
{% endunless %}{% endfor %}
</ol>

[Print all sixteen steps]({{ '/turtle-lessons/print/' | relative_url }}) ·
[Print the planning sheet for the first capstone]({{ '/turtle-lessons/planning-sheet/' | relative_url }}) ·
[More samples to try]({{ '/turtlelab/samples.html' | relative_url }})

## For teachers

[For teachers]({{ '/turtle-lessons/teacher-notes/' | relative_url }}): the sequence, assignment text to paste into your class site, and a substitute day plan.
