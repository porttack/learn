---
layout: default
title: Home
permalink: /
---

# Learning Pathways

Computer science and robotics pathways for middle and high school students.

<nav class="banner-grid" aria-label="Learning pathways">
{% for pathway in site.data.pathways %}
  {% assign pic = pathway.banner %}
  {% if pic %}
  <a class="banner-tile" href="{{ pathway.url | relative_url }}" title="{{ pathway.title }}">
    <img src="{{ pic | relative_url }}" alt="{{ pathway.banner_alt | default: pathway.title }}" loading="lazy">
  </a>
  {% endif %}
{% endfor %}
</nav>

<hr>

<ul class="pathway-list">
{% for pathway in site.data.pathways %}
  <li>
    {% if pathway.banner %}
    <a class="pathway-hero-image" href="{{ pathway.url | relative_url }}" tabindex="-1" aria-hidden="true">
      <img src="{{ pathway.banner | relative_url }}" alt="">
    </a>
    {% endif %}
    <h2 class="visually-hidden"><a href="{{ pathway.url | relative_url }}">{{ pathway.title }}</a></h2>
    <p>{{ pathway.blurb }}</p>
  </li>
{% endfor %}
</ul>

<hr>
<p><small><a href="{{ '/privacy/' | relative_url }}">Privacy Policy</a></small></p>
