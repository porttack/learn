---
layout: minimal
title: "CS Unplugged"
permalink: /unplugged/
---

<img class="unplugged-banner" src="{{ '/assets/img/unplugged/unplugged.png' | relative_url }}" alt="CS Unplugged">

# CS Unplugged

Computer science with no computer. Every activity here is a printable
worksheet or pair game you can do on your own or with a partner: for a brain
break, a day the computers are down, or extra practice on one idea.

Many of these are classic unplugged activities, shared under Creative
Commons licenses or in the public domain, rewritten as ready-to-print
worksheets so a teacher can hand them out and a student can work through
them alone. Inspired by, and partly adapted from,
[CS Unplugged](https://www.csunplugged.org/en/) (not affiliated); each
adapted sheet credits its source at the bottom.

*Warning: 9/27/2026: This is a work in progress. I have only reviewed a few of these worksheets. I expect to make many changes, fixes, and improvements in the next 2 to 12 months. Locations where you can find other free unplugged material are listed at the bottom of this page.*

{% comment %}
The table is a view over front matter, not folders. Each activity sets:
  level:    ms | hs | both        (MS / HS columns)
  k5:       true                  (K-5 column: only when the source says ages 10 or under)
  grouping: free text; "solo" / "pair" / "trade" in it mark the Solo / Pair columns
  topics:   [Binary, Lists, ...]  (the table groups by the first topic)
  time, materials                 (shown on the page)
  reviewed: 2026-10-03            (Reviewed column: set ONLY by the teacher after checking the sheet)
  slides: /unplugged/<slug>-slides/  (optional intro deck; "Slides" link here and on the sheet)
  table_order: 1                  (optional: order within a topic; unset sheets follow, by title)
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
  <button type="button" data-filter="k5">K-5</button>
  <button type="button" data-filter="ms">Middle school</button>
  <button type="button" data-filter="hs">High school</button>
  <button type="button" data-filter="solo">Solo</button>
  <button type="button" data-filter="pair">Pair</button>
  <button type="button" data-filter="reviewed">Reviewed</button>
  <button type="button" data-filter="" class="current">Everything</button>
</div>

<table class="activity-table">
  <colgroup>
    <col style="width: 38%"><col><col><col><col><col><col><col><col>
  </colgroup>
  <thead>
    <tr><th>Activity</th><th>K-5</th><th>MS</th><th>HS</th><th>Solo</th><th>Pair</th><th>Min</th><th title="Checked by the teacher">Reviewed</th><th></th></tr>
  </thead>
  <tbody>
  {%- for g in groups %}
    <tr class="topic-row"><th colspan="9">{{ g.name }}</th></tr>
    {%- comment -%}Sheets with table_order come first in that order (e.g.
    hiding a Caesar message before cracking one); the rest by title.{%- endcomment -%}
    {%- assign ordered = g.items | where_exp: "a", "a.table_order" | sort: "table_order" %}
    {%- assign unordered = g.items | where_exp: "a", "a.table_order == nil" | sort: "title" %}
    {%- assign items = ordered | concat: unordered %}
    {%- for a in items %}
    {%- assign ms = false %}{% assign hs = false %}
    {%- if a.level == "ms" or a.level == "both" %}{% assign ms = true %}{% endif %}
    {%- if a.level == "hs" or a.level == "both" %}{% assign hs = true %}{% endif %}
    {%- assign solo = false %}{% assign pair = false %}
    {%- if a.grouping contains "olo" %}{% assign solo = true %}{% endif %}
    {%- if a.grouping contains "air" or a.grouping contains "trade" %}{% assign pair = true %}{% endif %}
    <tr class="activity-row{% if a.k5 %} is-k5{% endif %}{% if ms %} is-ms{% endif %}{% if hs %} is-hs{% endif %}{% if solo %} is-solo{% endif %}{% if pair %} is-pair{% endif %}{% if a.reviewed %} is-reviewed{% endif %}">
      <td><a href="{{ a.url | relative_url }}">{{ a.title }}</a></td>
      <td class="mark">{% if a.k5 %}&#10003;{% endif %}</td>
      <td class="mark">{% if ms %}&#10003;{% endif %}</td>
      <td class="mark">{% if hs %}&#10003;{% endif %}</td>
      <td class="mark">{% if solo %}&#10003;{% endif %}</td>
      <td class="mark">{% if pair %}&#10003;{% endif %}</td>
      <td class="mark">{{ a.time }}</td>
      <td class="mark">{% if a.reviewed %}<span title="Reviewed {{ a.reviewed | date: '%B %-d, %Y' }}">&#9733;</span>{% endif %}</td>
      <td>{% if a.generator %}<a class="lesson-companion-link" href="{{ a.generator | relative_url }}" aria-label="New set: {{ a.title }}">New set</a>{% endif %}{% if a.slides %} <a class="lesson-companion-link" href="{{ a.slides | relative_url }}" aria-label="Slides: {{ a.title }}">Slides</a>{% endif %}</td>
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

Every sheet with a **New set** button can make as many fresh versions as you
need; the set number prints on the sheet so you can reprint the same one.
Answer keys are hidden from students: use the **Show answer key** link at
the bottom of a sheet (or add `?key=1` to its address), then print.

**Standards.** Each reviewed sheet lists the standards it supports under
**Standards alignment** at the bottom of the page, with a link to that
sheet's own report. See [everything the aligned Unplugged sheets cover]({{ '/standards/?report=unplugged&view=open-all' | relative_url }})
(AP CSP, California CS, and CSTA 2026), or [compare them with the program's
other sources on the standards map]({{ '/standards/?only=unplugged&view=open-all' | relative_url }}).

## Other unplugged resources

Sources this section draws on, and more places doing unplugged computer
science. Many of their activities are teacher-led (whole-class games, magic
tricks) rather than print-and-use.

- [CS Unplugged](https://www.csunplugged.org/en/) by Tim Bell, Ian H. Witten
  and Mike Fellows, University of Canterbury, and its
  [printable resources](https://www.csunplugged.org/en/resources/).
- [Teaching London Computing: unplugged activities](https://teachinglondoncomputing.org/resources/inspiring-unplugged-classroom-activities/)
  by Paul Curzon, Queen Mary University of London.
- [Code.org unplugged lessons](https://code.org/curriculum/unplugged). (Free / not public domain or share alike)
- [Bootstrap](https://www.bootstrapworld.org/): algebra and programming,
  with a paper-and-pencil workbook before the computer.
- [Hello World: The Big Book of Computing Pedagogy](https://helloworld.raspberrypi.org/books/big_book_of_pedagogy)
  from the Raspberry Pi Foundation.
- [Math for Love](https://www.mathforlove.com/): math games that play well
  alongside these. (Many free resources / not public domain or share alike)

<footer class="unplugged-footer">
  <a href="{{ '/' | relative_url }}">{{ site.title }}</a> &middot;
  <a href="{{ site.author_url }}">Managed by {{ site.author }}</a> &middot;
  <a href="{{ '/privacy/' | relative_url }}">Privacy Policy</a> &middot;
  <a href="{{ '/license/' | relative_url }}">Licensing (Creative Commons)</a>
</footer>
