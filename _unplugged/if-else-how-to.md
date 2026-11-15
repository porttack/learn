---
title: "If and Else: how it works"
source: original
level: ms
companion: true
name_line: false
---

{% assign d = site.data.unplugged.if_else %}
A program that does the same thing every time is not very smart. An `if` statement lets it **decide**. Python checks a question that is either `True` or `False`. If it is `True`, the program runs the indented lines under the `if`. If it is `False`, it skips them and runs the lines under `else` instead.

## A worked example

```python
{{ d.example.code | strip }}
```

`55 < 60` is `True`, so Python runs the line under the `if` and prints **{{ d.example.answer[0] }}** Change the first line to `temperature = 75` and the answer flips, because the `else` runs instead. **Only one of the two ever runs.**

Three things to notice: the question ends with a **colon**, the lines inside are **indented**, and `else` has **no question** of its own.

| Question | Asks | Example that is `True` |
|---|---|---|
| `a == b` | equal? (two equals signs) | `3 == 3` |
| `a != b` | not equal? | `3 != 4` |
| `a < b` | less than? | `3 < 4` |
| `a > b` | greater than? | `4 > 3` |
| `a <= b` | less than or equal? | `3 <= 3` |
| `a >= b` | greater than or equal? | `3 >= 3` |
{: .checkoff}

<div class="print-page-break"></div>

## Python is picky about four things

1. **The colon.** The `if` line and the `else` line both end with `:`.
2. **The indent.** The lines that belong to an `if` or an `else` are indented four spaces. The indent is how Python knows where they stop.
3. **Two equals signs.** `=` stores a value (`age = 13`). `==` asks a question (`age == 13`). An `if` needs the question.
4. **`else` has no question.** It means "everything the `if` did not catch."

An `if` does not need an `else`. With no `else`, a `False` question just means the indented lines are skipped.
