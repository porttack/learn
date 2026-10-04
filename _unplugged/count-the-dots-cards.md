---
title: "Count the Dots: dot cards to cut out"
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/binary-numbers/"
original_print: "https://classic.csunplugged.org/documents/activities/binary-numbers/unplugged-01-binary_numbers.pdf"
level: both
companion: true
name_line: false
---

Cards for the [Count the Dots lesson plan]({{ '/unplugged/count-the-dots-lesson-plan/' | relative_url }}).
The [worksheet]({{ '/unplugged/count-the-dots/' | relative_url }}) works
without them.

- **Page 1** is one student set. Copy it onto card stock and cut along the
  dashed lines: one page per student.
- **Pages 2 to 6** are big demonstration cards, one per page, for five
  students to hold at the front of the room. Print these once.

<div class="dot-cards-page">
  <img src="{{ '/assets/img/unplugged/count-the-dots/cards-to-cut.svg' | relative_url }}" alt="Five dot cards to cut out, with 1, 2, 4, 8, and 16 dots. Cut along the dashed lines.">
</div>

{% assign demo = "16,8,4,2,1" | split: "," %}
{% for n in demo %}
<div class="dot-cards-demo">
  <img src="{{ '/assets/img/unplugged/count-the-dots/demo-card-' | append: n | append: '.svg' | relative_url }}" alt="Big demonstration card with {{ n }} dot{% if n != '1' %}s{% endif %}">
</div>
{% endfor %}
