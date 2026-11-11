---
layout: default
title: Home
permalink: /
---

# Learning Pathways

Computer science and robotics pathways for middle and high school students.

<div class="banner-grid">
{% for pathway in site.data.pathways %}
  {% assign pic = pathway.banner %}
  {% if pic %}
  <a class="banner-tile" href="{{ pathway.url | relative_url }}" title="{{ pathway.title }}">
    <img src="{{ pic | relative_url }}" alt="{{ pathway.title }}" loading="lazy">
  </a>
  {% endif %}
{% endfor %}
</div>

<ul class="pathway-list">
{% for pathway in site.data.pathways %}
  <li>
    <h2><a href="{{ pathway.url | relative_url }}">{{ pathway.title }}</a></h2>
    <p>{{ pathway.blurb }}</p>
    {% if pathway.banner %}
    <a class="pathway-hero-image" href="{{ pathway.url | relative_url }}">
      <img src="{{ pathway.banner | relative_url }}" alt="{{ pathway.title }}">
    </a>
    {% endif %}
  </li>
{% endfor %}
</ul>

<hr>
<p><small><a href="{{ '/privacy/' | relative_url }}">Privacy Policy</a></small></p>
