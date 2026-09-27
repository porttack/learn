---
title: "Modulo in Real Programs"
source: original
level: both
kind: [single, supplementary]
topics: [Modulo, Robot programs]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/modulo-generator/
generator_presets:
  - { label: "More % predictions", query: "mode=predict&level=ms" }
  - { label: "Predict, with negatives", query: "mode=predict&level=hs" }
---

<div class="modulo-sheet" markdown="1">

Python's `%` operator computes a remainder: `a % b` is what's left over after dividing `a` by `b` as many whole times as it goes. That one small idea shows up all over real programs, usually in disguise. Here are five places you've probably already run into it.

## Even or odd

Any whole number is even if `n % 2` is 0, and odd if it's 1. There's nothing else it can be.

```python
n = 17
print(n % 2)
```

Predict this: what prints? <span class="fill-line short"></span>

<aside class="callout note" markdown="1">
Trick question: is `-4` even or odd? Python's `%` always matches the sign
of the number on the right, so `-4 % 2` still comes out `0`. Negative
numbers can be even too.
</aside>

## Wrapping around a list

A carousel of colors, a rotation of players, a board game space you loop back onto: anything that cycles through a fixed-size list uses `% len(...)` to wrap the index back to the start instead of running off the end.

```python
colors = ["red", "green", "blue"]
i = 2
i = (i + 1) % len(colors)
print(colors[i])
```

Predict this: what prints? <span class="fill-line short"></span>

## Turning a robot

The [AP robot](/unplugged/robot-grid-1/) faces one of 4 directions: 0 up, 1 right, 2 down, 3 left. Turning right adds 1 each time, but 4 turns should land you facing the same way you started. `% 4` makes that happen automatically instead of you writing a special case for "wrapped past 3."

```python
facing = 3  # left
turns = 6
facing = (facing + turns) % 4
print(facing)
```

Predict this: what prints (0, 1, 2, or 3)? <span class="fill-line short"></span>

## Minutes into hours and minutes

`//` (floor division) and `%` are a matched pair: `//` gives the whole groups, `%` gives what's left over. A total number of minutes splits into hours and minutes the same way a total number of cents splits into dollars and cents.

```python
total = 135
hours = total // 60
minutes = total % 60
print(hours, minutes)
```

Predict this: what prints? <span class="fill-line short"></span>

## The Caesar cipher's wraparound

The [Caesar cipher](/unplugged/caesar-cipher/) shifts every letter the same number of places through the alphabet. Numbering A to Z as 0 to 25, shifting past Z has to wrap back to A, and `% 26` is exactly what does the wrapping.

```python
letter = 24  # Y
shift = 5
new_letter = (letter + shift) % 26
print(new_letter)
```

Predict this: what prints (a number from 0 to 25)? <span class="fill-line short"></span>

## Now you trace it

Two more, mixing several of these ideas. Trace each one by hand before you write down what it prints.

<ol class="modulo-trace-list" markdown="1">
<li markdown="1">

```python
colors = ["red", "green", "blue", "yellow"]
i = 3
i = (i + 1) % len(colors)
print(colors[i])
```
<span class="fill-line short"></span>
</li>
<li markdown="1">

```python
facing = 1  # right
turns = 9
facing = (facing + turns) % 4
print(facing)
```
<span class="fill-line short"></span>
</li>
</ol>

<section class="answer-key" markdown="1">

**Even or odd.** `17 % 2` is {{ site.data.unplugged.modulo_in_code.examples.even_odd.answer }}.

**Wrapping around a list.** `i` becomes {{ site.data.unplugged.modulo_in_code.examples.wrap.answer_index }}, so `colors[{{ site.data.unplugged.modulo_in_code.examples.wrap.answer_index }}]` prints `{{ site.data.unplugged.modulo_in_code.examples.wrap.answer_word }}`.

**Turning a robot.** `(3 + 6) % 4` is {{ site.data.unplugged.modulo_in_code.examples.robot.answer }}, which is facing {{ site.data.unplugged.modulo_in_code.examples.robot.answer_word }}.

**Minutes.** `135 // 60` is {{ site.data.unplugged.modulo_in_code.examples.minutes.hours }}, `135 % 60` is {{ site.data.unplugged.modulo_in_code.examples.minutes.minutes }}. Prints `{{ site.data.unplugged.modulo_in_code.examples.minutes.hours }} {{ site.data.unplugged.modulo_in_code.examples.minutes.minutes }}`.

**Caesar cipher.** `(24 + 5) % 26` is {{ site.data.unplugged.modulo_in_code.examples.cipher.answer }}.

**Now you trace it.**
{%- for it in site.data.unplugged.modulo_in_code.practice %}
{%- if it.kind == "even_odd" %} ({{ forloop.index }}) prints {{ it.answer }} ({{ it.answer_word }}).
{%- elsif it.kind == "wrap" %} ({{ forloop.index }}) prints `{{ it.answer_word }}`.
{%- elsif it.kind == "robot" %} ({{ forloop.index }}) prints {{ it.answer }} ({{ it.answer_word }}).
{%- elsif it.kind == "minutes" %} ({{ forloop.index }}) prints `{{ it.hours }} {{ it.minutes }}`.
{%- elsif it.kind == "cipher" %} ({{ forloop.index }}) prints {{ it.answer }}.
{%- endif -%}
{% endfor %}
</section>

</div>
