---
layout: default
title: Home
permalink: /
---

# Learning Pathways

Computer science and robotics pathways for middle and high school students.

<ul class="pathway-list">
{% for pathway in site.data.pathways %}
  <li>
    <h2><a href="{{ pathway.url | relative_url }}">{{ pathway.title }}</a></h2>
    <p>{{ pathway.blurb }}</p>
    {% if pathway.image %}
    <div class="pathway-hero-image">
      <img src="{{ pathway.image | relative_url }}" alt="">
    </div>
    {% endif %}
    {% if pathway.status %}<p class="pathway-status"><em>Status: {{ pathway.status }}</em></p>{% endif %}
  </li>
{% endfor %}
</ul>

<hr>
<p><small><a href="{{ '/privacy/' | relative_url }}">Privacy Policy</a></small></p>
