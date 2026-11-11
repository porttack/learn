---
layout: minimal
title: "Student Movies"
permalink: /movies/
---

# Student Movies

Movies we watch in class. Each has a summary, a trailer, and a worksheet you can print: questions to answer while you watch, then questions to think about afterward.

<div class="movie-table-wrap">
<table class="movie-table">
  <thead>
    <tr>
      <th>Movie</th>
      <th>Grades</th>
      <th>Rated</th>
      <th data-type="number">Year</th>
      <th data-type="number">Minutes</th>
      <th data-nosort>Common Sense Media</th>
      <th data-type="number">CS connection</th>
      <th data-type="number">Rotten Tomatoes</th>
    </tr>
  </thead>
  <tbody>
{% assign films = site.movies | sort: "title" %}
{% for film in films %}
    <tr>
      <td data-sort="{{ film.title }}"><a href="{{ film.url | relative_url }}"><strong>{{ film.title }}</strong></a><br><a href="{{ '/movies/' | append: film.slug | append: '-worksheet/' | relative_url }}">Worksheet</a></td>
      <td>{{ film.grades }}</td>
      <td data-sort="{% case film.rating %}{% when 'G' %}1{% when 'PG' %}2{% when 'PG-13' %}3{% else %}4{% endcase %}">{{ film.rating }}</td>
      <td>{{ film.year }}</td>
      <td>{{ film.runtime }}</td>
      <td><a href="{{ 'https://www.commonsensemedia.org/movie-reviews/' | append: film.slug }}">Parents {{ film.csm_parents }}+, kids {{ film.csm_kids }}+</a></td>
      <td data-sort="{{ film.cs }}"><span aria-hidden="true" class="cs-dots">{% for i in (1..5) %}{% if i <= film.cs %}&#9679;{% else %}&#9675;{% endif %}{% endfor %}</span> <span class="visually-hidden">{{ film.cs }} out of 5</span></td>
      <td data-sort="{{ film.rt_critics }}">{{ film.rt_critics }}% critics<br>{{ film.rt_audience }}% audience</td>
    </tr>
{% endfor %}
  </tbody>
</table>
</div>
<script src="{{ '/assets/js/movie-table.js' | relative_url }}" defer></script>

<p class="movie-meta">CS connection runs from one dot (about people and feelings) to five (about computers, robots or engineering). Click a column heading to sort by it. Common Sense Media ages are what parents and kids say is the right age to start watching. Rotten Tomatoes scores were checked on November 10, 2026 and change over time.</p>

## For teachers

[Answer keys and notes]({{ '/movies/teacher-notes/' | relative_url }}): answers for Part 1 and a discussion list for Ron's Gone Wrong.
