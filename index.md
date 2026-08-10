---
layout: default
title: Home
permalink: /
---

# Port Tack Learning

Learning pathways in computer science and robotics for middle and high
school students.

<ul class="pathway-list">
{% for pathway in site.data.pathways %}
  <li>
    <h2><a href="{{ pathway.url | relative_url }}">{{ pathway.title }}</a></h2>
    <p>{{ pathway.blurb }}</p>
    <p class="pathway-status"><em>Status: {{ pathway.status }}</em></p>
  </li>
{% endfor %}
</ul>

<hr>
<p><small><a href="{{ '/privacy/' | relative_url }}">Privacy Policy</a></small></p>
