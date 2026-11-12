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
      <th data-type="number">CS strength</th>
      <th data-type="number">SEL strength</th>
      <th data-type="number">Rotten Tomatoes</th>
    </tr>
  </thead>
  <tbody>
{% assign films = site.movies | sort: "title" %}
{% for film in films %}
    <tr>
      {%- assign sort_title = film.title -%}
      {%- assign first4 = film.title | slice: 0, 4 -%}
      {%- assign first2 = film.title | slice: 0, 2 -%}
      {%- if first4 == "The " -%}{%- assign sort_title = film.title | slice: 4, 200 -%}
      {%- elsif first2 == "A " -%}{%- assign sort_title = film.title | slice: 2, 200 -%}{%- endif -%}
      <td data-sort="{{ sort_title }}"><a href="{{ film.url | relative_url }}"><strong>{{ film.title }}</strong></a><br><a href="{{ '/movies/' | append: film.slug | append: '-worksheet/' | relative_url }}">Worksheet</a>{% if film.watch_page %} &middot; <a href="{{ '/movies/' | append: film.slug | append: '-watch/' | relative_url }}">Watch</a>{% endif %}</td>
      <td>{{ film.grades }}</td>
      <td data-sort="{% case film.rating %}{% when 'G' %}1{% when 'PG' %}2{% when 'PG-13' %}3{% else %}4{% endcase %}">{{ film.rating }}</td>
      <td>{{ film.year }}</td>
      <td>{{ film.runtime }}</td>
      <td>{% if film.no_csm %}Not applicable{% else %}<a href="{{ 'https://www.commonsensemedia.org/movie-reviews/' | append: film.slug }}">{% if film.csm_parents %}Parents {{ film.csm_parents }}+{% if film.csm_kids %}, kids {{ film.csm_kids }}+{% endif %}{% else %}Review{% endif %}</a>{% endif %}</td>
      <td data-sort="{{ film.cs }}"><span aria-hidden="true" class="cs-dots">{% for i in (1..5) %}{% if i <= film.cs %}&#9679;{% else %}&#9675;{% endif %}{% endfor %}</span> <span class="visually-hidden">{{ film.cs }} out of 5</span></td>
      <td data-sort="{{ film.sel }}"><span aria-hidden="true" class="cs-dots">{% for i in (1..5) %}{% if i <= film.sel %}&#9679;{% else %}&#9675;{% endif %}{% endfor %}</span> <span class="visually-hidden">{{ film.sel }} out of 5</span></td>
      <td data-sort="{{ film.rt_critics | default: 0 }}">{% if film.rt_critics %}{{ film.rt_critics }}% critics{% if film.rt_audience %}<br>{{ film.rt_audience }}% audience{% endif %}{% endif %}</td>
    </tr>
{% endfor %}
  </tbody>
</table>
</div>
<script src="{{ '/assets/js/movie-table.js' | relative_url }}" defer></script>

<p class="movie-meta">CS strength runs from one dot (about people and feelings) to five (about computers, robots or engineering). SEL strength runs from one dot (the film barely touches social-emotional skills) to five (the film and worksheet are mostly about them); both are the author's judgment. Click a column heading to sort by it. Common Sense Media ages are what parents and kids say is the right age to start watching. Rotten Tomatoes scores were checked in November 2026 and change over time; a blank means no score has been added.</p>

## For teachers

[Answer keys and notes]({{ '/movies/teacher-notes/' | relative_url }}): answers for Part 1 and a discussion list for Ron's Gone Wrong.
