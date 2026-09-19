---
layout: minimal
title: "About Python in 3D"
permalink: /python3d/about/
---

<div class="lesson-crumbs">
  <a href="{{ '/python3d/' | relative_url }}">&larr; Python in 3D</a>
</div>

<div class="lesson" markdown="1">

# Where this idea comes from

## Write code, watch it happen

The lessons here use a two-pane setup: your code on one side, a live
picture of what it built on the other. Click Run, and the result appears
right away. That style is borrowed from CMU's CS Academy, a platform many
CS classes (including some at this school) use to teach 2D graphics
programming with Python. If you've used it before, the quizzes, the
"Check My Work" exercises, and the way each checkpoint unlocks the next one
will all feel familiar.

## From flat shapes to real objects

Once you can place a rectangle or a circle with coordinates, a natural next
question is: what if that shape had real height? That's the whole idea of
this course. The same coordinates you already know, plus one more
direction, turn a flat drawing into an object you can rotate, inspect from
every side, and send to a 3D printer.

## Code instead of a mouse

There's a real, existing piece of software called OpenSCAD that engineers
and hobbyists use to design 3D-printable parts entirely in code, not by
dragging shapes around with a mouse the way Tinkercad works (the tool this
site's Electronics101 course uses for circuits). You describe a shape with
numbers and function calls, and the program builds it exactly the same way
every time you run it. That's a genuinely useful skill: it's precise, it's
repeatable, and it's how a lot of real fabrication and engineering work
gets done.

This course borrows that idea, in Python instead of OpenSCAD's own
language. Writing it in Python means the coordinates, functions, and
positional thinking you build here carry straight over to this site's
other Python courses, and the other way around.

## Where to start

If you've never placed a shape with x/y coordinates before, start at
[Lesson 1: Flat Shapes]({{ '/python3d/shapes/' | relative_url }}). If
you've already done that somewhere else, like CMU's CS Academy, you can
skip straight to
[Lesson 2: Position and Size]({{ '/python3d/position-size/' | relative_url }}),
where shapes get real height for the first time.

</div>

<style>
  .lesson-crumbs {
    max-width: 720px;
    font-size: 0.85rem;
  }
  .lesson-crumbs a {
    color: #2a7ae2;
    text-decoration: none;
  }
  .lesson-crumbs a:hover { text-decoration: underline; }

  .lesson {
    max-width: 720px;
  }
  .lesson h1 { margin-top: 8px; }
  .lesson h2 {
    margin-top: 1.6em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #d0d7de;
  }
</style>
