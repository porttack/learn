---
title: "Pixel Pictures"
lesson_plan: /unplugged/pixel-pictures-lesson-plan/
slides: /unplugged/pixel-pictures-slides/
source: cs-unplugged-2015
source_url: "https://classic.csunplugged.org/activities/image-representation/"
original_print: "https://classic.csunplugged.org/documents/activities/image-representation/unplugged-02-image_representation.pdf"
k5: true
reviewed: 2026-10-03
level: ms
kind: [single, supplementary]
topics: [Data representation]
time: 30
grouping: Solo, or trade with a partner
materials: "Pencil"
scripts: [/assets/js/unplugged/pixel-pictures-page.js]
generator: /unplugged/pixel-pictures-generator/
generator_presets:
  - { label: "Small pictures", query: "size=small" }
  - { label: "Large pictures", query: "size=large" }
---

<aside class="teacher-box" markdown="1">
## Just For Teachers:

<p class="teacher-box-hint">This box never prints and isn't in the Word copy. Students who open this page online can still see it.</p>

### Three sheets, not one

This activity is split across three pages, so a sub can hand out one clear
stack instead of managing a single multi-page packet.

1. [How it works]({{ '/unplugged/pixel-pictures-how-to/' | relative_url }}):
   reading only, pixels and the run-length rule. No Name/Date/Period line
   and nothing to turn in, since there's nothing to write on it.
2. **Decode & Encode** (this page): the core hands-on practice.
3. [Make your own]({{ '/unplugged/pixel-pictures-make-your-own/' | relative_url }}):
   draw, trade, and the compression questions.

Each is one sheet, printed double-sided. Print all three per student, but
only collect the second two: Decode & Encode and Make Your Own.

### Printing

Use **Print this lesson** (or Ctrl+P / &#8984;P) on each of the three pages
above. Parts 2 and 3 get a **Name, Date, and Period** line at the top (Part
1 doesn't, since nothing is written on it or turned in), and the site menu,
buttons, and this box are left off either way. For the answer key, click
**Show answer key** at the bottom of the page (or add `?key=1` to the
address), then print. Parts 2 and 3 each carry their own answer key for
their own content.

### Word or Google Docs

**Download as Word (.docx)** makes an editable copy you can change. For a
Google Doc, upload that file to Google Drive and open it with Google Docs.

### Make new sets

The [**New set** page]({{ page.generator | relative_url }}) makes fresh
mystery pictures to decode, so a student who finishes always has a next
sheet to start. Pick **Small pictures** or **Large pictures**, and how many
**copies**: a class set gives every student a different picture. **Sets per
student: 2** prints one set on the front and one on the back. In a hurry?
Jump straight to a [ready class set of 30]({{ page.generator | append: "?copies=30&per=2" | relative_url }}),
two per student, front and back.

### Slides

[Pixel Pictures slides]({{ page.slides | relative_url }}): project these to
introduce pixels and the run-length rule. They stop before giving away the
sheet's three mystery pictures. A down arrow on a couple of slides opens
optional deeper-dive content (the fax math, and an AP-level lossy-vs-lossless
question) that a 6th grade class can just skip past.

### Full lesson plan

Want to teach this live instead of as a sub-day sheet? The
[lesson plan]({{ page.lesson_plan | relative_url }}) walks through the
hook, the sheet, and a wrap-up, and includes grade-band notes for 6th grade,
9th grade, and AP CSP under **Going further**.

### Standards

This sheet's standards are listed under **Standards alignment** at the
bottom of the page.
</aside>

*Part 2 of 3* ([Part 1: How It Works]({{ '/unplugged/pixel-pictures-how-to/' | relative_url }}) has the rule).

## Decode these pictures

Each line of a picture's code is one row, top to bottom. Shade the
matching squares with your pencil: blank for white, solid for black. Work
through them in order, easiest first.

<noscript><p class="callout warning">This worksheet draws its blank grids
with JavaScript. Turn JavaScript on to see the codes and grids.</p></noscript>

<div class="pixel-questions" id="q-pixel-pictures"></div>

<script type="application/json" data-pixel-set data-questions="#q-pixel-pictures" data-key="#key-pixel-pictures">{{ site.data.unplugged.pixel_pictures | jsonify }}</script>

## Now encode one

Go the other way: here is a finished picture. Write the code for each row
on the line next to it. Remember, every code starts with a count of
**white** squares, so a row that starts with black begins with **0**.

{% assign enc = site.data.unplugged.pixel_pictures.encode %}
<div class="pixel-encode">
<table class="pixel-blank-grid pixel-encode-grid" role="img" aria-label="An 8 by 8 black and white picture of a house">
  <tbody>
  {%- assign rows = enc.art | strip | newline_to_br | split: "<br />" -%}
  {%- for row in rows -%}
    {%- assign cells = row | strip | split: "" %}
    <tr>{% for c in cells %}<td{% if c == "#" %} class="on"{% endif %}></td>{% endfor %}</tr>
  {%- endfor %}
  </tbody>
</table>
<ol class="pixel-encode-lines">
{% for row in rows %}<li><span class="fill-line"></span></li>
{% endfor %}</ol>
</div>

This trick has a name: **run-length encoding**, because it records how long
each run of one color is. Fax machines send pictures exactly this way, one
scan line at a time, and some image files (like TIFF and BMP) can be stored
this way too.

Continue to
[Part 3: Make Your Own]({{ '/unplugged/pixel-pictures-make-your-own/' | relative_url }}).

<section class="answer-key pixel-answer-key" markdown="1">
<div id="key-pixel-pictures"></div>

### Now encode one (the house)

{% assign enc = site.data.unplugged.pixel_pictures.encode %}
{% for c in enc.codes %}{{ forloop.index }}. {{ c | join: ", " }}
{% endfor %}
</section>
