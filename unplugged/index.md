---
layout: minimal
title: "CS Unplugged"
permalink: /unplugged/
---

<img class="unplugged-banner" src="{{ '/assets/img/unplugged/unplugged.png' | relative_url }}" alt="CS Unplugged">

# CS Unplugged

Computer science with no computer. Every activity here is a printable page
you can work through on your own or with a partner.

{% comment %}
The table is a view over front matter, not folders. Each activity sets:
  level:    ms | hs | both        (MS / HS columns)
  grouping: free text; "solo" / "pair" / "trade" in it mark the Solo / Pair columns
  topics:   [Binary, Lists, ...]  (the table groups by the first topic)
  time, materials                 (shown on the page)
  kind:     [single, supplementary] is kept in front matter but no longer
            drives the landing page
Sequences live in _data/unplugged_sequences.yml, so one activity can appear
in several sections at once without being copied.
{% endcomment %}

{% assign activities = site.unplugged | where_exp: "a", "a.companion != true" %}
{% assign groups = activities | group_by_exp: "a", "a.topics.first" | sort: "name" %}

## All activities

<div class="activity-filters" hidden>
  <span>Show only:</span>
  <button type="button" data-filter="ms">Middle school</button>
  <button type="button" data-filter="hs">High school</button>
  <button type="button" data-filter="solo">Solo</button>
  <button type="button" data-filter="pair">Pair</button>
  <button type="button" data-filter="" class="current">Everything</button>
</div>

<table class="activity-table">
  <colgroup>
    <col style="width: 46%"><col><col><col><col><col><col>
  </colgroup>
  <thead>
    <tr><th>Activity</th><th>MS</th><th>HS</th><th>Solo</th><th>Pair</th><th>Min</th><th></th></tr>
  </thead>
  <tbody>
  {%- for g in groups %}
    <tr class="topic-row"><th colspan="7">{{ g.name }}</th></tr>
    {%- assign items = g.items | sort: "title" %}
    {%- for a in items %}
    {%- assign ms = false %}{% assign hs = false %}
    {%- if a.level == "ms" or a.level == "both" %}{% assign ms = true %}{% endif %}
    {%- if a.level == "hs" or a.level == "both" %}{% assign hs = true %}{% endif %}
    {%- assign solo = false %}{% assign pair = false %}
    {%- if a.grouping contains "olo" %}{% assign solo = true %}{% endif %}
    {%- if a.grouping contains "air" or a.grouping contains "trade" %}{% assign pair = true %}{% endif %}
    <tr class="activity-row{% if ms %} is-ms{% endif %}{% if hs %} is-hs{% endif %}{% if solo %} is-solo{% endif %}{% if pair %} is-pair{% endif %}">
      <td><a href="{{ a.url | relative_url }}">{{ a.title }}</a></td>
      <td class="mark">{% if ms %}&#10003;{% endif %}</td>
      <td class="mark">{% if hs %}&#10003;{% endif %}</td>
      <td class="mark">{% if solo %}&#10003;{% endif %}</td>
      <td class="mark">{% if pair %}&#10003;{% endif %}</td>
      <td class="mark">{{ a.time }}</td>
      <td>{% if a.generator %}<a class="lesson-companion-link" href="{{ a.generator | relative_url }}" aria-label="New set: {{ a.title }}">New set</a>{% endif %}</td>
    </tr>
    {%- endfor %}
  {%- endfor %}
  </tbody>
</table>

<script>
(function () {
  var bar = document.querySelector(".activity-filters");
  var table = document.querySelector(".activity-table");
  bar.hidden = false;
  bar.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    bar.querySelectorAll("button").forEach(function (b) { b.classList.toggle("current", b === btn); });
    var f = btn.dataset.filter;
    table.querySelectorAll(".activity-row").forEach(function (row) {
      row.hidden = f && !row.classList.contains("is-" + f);
    });
    // Hide a topic heading when every row under it is hidden.
    table.querySelectorAll(".topic-row").forEach(function (head) {
      var row = head.nextElementSibling, any = false;
      while (row && !row.classList.contains("topic-row")) { if (!row.hidden) any = true; row = row.nextElementSibling; }
      head.hidden = !any;
    });
  });
})();
</script>

## Sequenced

Short tracks that build from one activity to the next. Do them in order.

{% assign levels = "ms:Middle school|hs:High school" | split: "|" %}

{% for l in levels %}
{% assign kv = l | split: ":" %}
### {{ kv[1] }}

{% assign seqs = site.data.unplugged_sequences | where: "level", kv[0] %}
{% for seq in seqs %}
**{{ seq.title }}.** {{ seq.blurb }}

<ol class="sequence-list">
{% for step in seq.steps %}
  {% assign doc = site.unplugged | where: "slug", step | first %}
  {% if doc %}<li><a href="{{ doc.url | relative_url }}">{{ doc.title }}</a> <span class="lesson-subtitle">{{ doc.time }} min</span></li>{% endif %}
{% endfor %}
</ol>
{% endfor %}
{% if seqs.size == 0 %}<p class="lesson-subtitle">Coming soon.</p>{% endif %}
{% endfor %}

## For teachers

Two collections this section draws on. Both have many more activities,
mostly teacher-led ones (whole-class games, magic tricks) that don't fit the
print-and-use format here.

- [CS Unplugged](https://www.csunplugged.org/) by Tim Bell, Ian H. Witten
  and Mike Fellows.
- [Teaching London Computing: unplugged activities](https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/)
  by Paul Curzon, Queen Mary University of London.

Every sheet with a **New set** page can make as many fresh versions as you
need. Answer keys are hidden; add `?key=1` to a page's address to see one.

