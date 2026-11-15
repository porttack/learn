---
title: "If and Else: Your First Decisions"
source: original
level: ms
kind: [single]
topics: [Conditionals]
supports: /working-in-python/
supports_title: "Working in Python"
time: 25
grouping: Solo
materials: "Pencil"
---

{% assign d = site.data.unplugged.if_else %}

## Part A: What prints?

Write exactly what each program prints, or **nothing**. Stuck? Read [how it works]({{ '/unplugged/if-else-how-to/' | relative_url }}).

<div class="if-grid" markdown="1">
{% for q in d.partA %}
<div class="keep-together" markdown="1">

**A{{ forloop.index }}.**

```python
{{ q.code | strip }}
```

Prints: <span class="fill-line short"></span>
</div>
{% endfor %}
</div>

## Part B: Find the mistake

Python would refuse to run these. Circle the mistake, then write the fixed line.

<div class="if-grid" markdown="1">
{% for q in d.partC %}
<div class="keep-together" markdown="1">

**B{{ forloop.index }}.**

```python
{{ q.broken | strip }}
```

<p class="fill-line"></p>
</div>
{% endfor %}
</div>

<div class="print-page-break"></div>

## Part C: Write it

Copy the messages exactly. One is finished for you.

<div class="keep-together" markdown="1">

**Example.** {{ d.example_b.say }}

```python
{{ d.example_b.solution | strip }}
```

</div>

{% for q in d.partB %}
<div class="keep-together" markdown="1">

**C{{ forloop.index }}.** {{ q.say }}

{% for i in (1..q.lines) %}<p class="fill-line"></p>
{% endfor %}
</div>
{% endfor %}

<section class="answer-key" markdown="1">
## Check your answers

**Part A**

{% for q in d.partA %}
**A{{ forloop.index }}.** {% for line in q.answer %}`{{ line }}`{% unless forloop.last %}, then {% endunless %}{% endfor %}. {{ q.note }}

{% endfor %}
**Part B**

{% for q in d.partC %}
**B{{ forloop.index }}.**

```python
{{ q.fixed | strip }}
```

{{ q.why }}

{% endfor %}
**Part C** (any version that behaves the same is fine)

{% for q in d.partB %}
**C{{ forloop.index }}.**

```python
{{ q.solution | strip }}
```

{% endfor %}
</section>
