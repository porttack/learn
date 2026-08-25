---
layout: default
title: "CS50 Problem Sets"
permalink: /cs50-psets/
---

# CS50 Problem Sets

A mix of problem sets: some adapted from [Harvard's CS50
AP](https://cs50.harvard.edu/ap) curriculum, some from [CS50's
Introduction to Programming with
Python](https://cs50.harvard.edu/python), and some written from
scratch by teachers and past students of this class. Each lesson's
footer says where it came from.

For the CS50-adapted problems, the problems, the standards, and the
test cases are all the same as the originals. You'll still run
`style50`, `check50`, and `submit50` on your code, same as you're used
to.

The one thing worth knowing going in: those problems sometimes call
`get_int()`/`get_string()` after `import cs50`. Those work fine in
cs50.dev if you want to use them, but plain `input()` and `int()` do
the same job and are what we use in class.

## Contents

<ol class="lesson-list">
{% assign lessons = site.cs50psets | sort: "order" %}
{% for lesson in lessons %}
  <li><a href="{{ lesson.url | relative_url }}">{{ lesson.title }}</a></li>
{% endfor %}
</ol>

[Print the whole pathway]({{ '/cs50-psets/print/' | relative_url }})
