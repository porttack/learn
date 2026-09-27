---
title: "Trace it: lists and loops"
source: original
level: hs
kind: [supplementary]
topics: [Lists, Loops]
supports: /working-in-python/chap09.html
supports_title: "Working in Python, Chapter 9: Lists"
time: 35
grouping: Solo, then compare with a partner
materials: "Pencil"
---

Before you run code, you should be able to say what it will do. Professional
programmers do this all the time. It's how they spot a bug by *reading*,
instead of running the program over and over and hoping.

The tool for this is a **trace table**: one column for each variable, and a
new row every time a variable changes. You play the computer, one line at a
time.

## How to trace: a worked example

```python
scores = [3, 8, 5]
total = 0
for s in scores:
    total = total + s
print(total)
```

The loop runs once for each item in `scores`. Each time around, `s` is the
next item, and `total` gets `s` added to it.

| Step | `s` | `total` |
|---|---|---|
| before the loop | (none yet) | 0 |
| first time around | 3 | 3 |
| second time around | 8 | 11 |
| third time around | 5 | 16 |
{: .checkoff .trace-table}

The loop is out of items, so Python moves on to `print(total)`, which prints
**16**.

Notice that `total` is written once *before* the loop. If it were inside
the loop, it would reset to 0 every time around. That is one of the most
common list bugs there is.

## Your turn

Predict first, in pencil. Don't peek at the answers until you've written
something for every problem.

### 1. Indexes

```python
pets = ["cat", "dog", "fish", "newt"]
print(pets[1])
print(pets[-1])
print(len(pets))
```

What prints? Line 1: <span class="fill-line short"></span>
Line 2: <span class="fill-line short"></span>
Line 3: <span class="fill-line short"></span>

### 2. Building a list

```python
evens = []
for n in range(5):
    if n % 2 == 0:
        evens.append(n)
print(evens)
```

| `n` | `n % 2 == 0`? | `evens` after this step |
|---|---|---|
| | | |
| | | |
| | | |
| | | |
| | | |
{: .checkoff .trace-table}

What prints? <span class="fill-line"></span>

### 3. Finding the biggest

```python
temps = [61, 58, 72, 70]
biggest = temps[0]
for t in temps:
    if t > biggest:
        biggest = t
print(biggest)
```

| `t` | `t > biggest`? | `biggest` |
|---|---|---|
| (before the loop) | | |
| | | |
| | | |
| | | |
| | | |
{: .checkoff .trace-table}

What prints? <span class="fill-line short"></span>

Why does the code start `biggest` at `temps[0]` instead of at `0`? (Hint:
what if every temperature were below zero?)
<span class="fill-line"></span>

### 4. Two names, one list

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)
```

What prints? <span class="fill-line"></span>

Explain in one sentence why. <span class="fill-line"></span>

<div class="keep-together" markdown="1">

### 5. Put it in order

These lines count how many words have more than three letters, but they're
scrambled. Number them 1 to 6 in the order they should run. The indentation
is correct, so use it as a clue.

<table class="checkoff trace-table">
  <colgroup><col style="width: 15%"><col style="width: 85%"></colgroup>
  <thead><tr><th>Order</th><th>Line</th></tr></thead>
  <tbody>
    <tr><td></td><td><code>        count = count + 1</code></td></tr>
    <tr><td></td><td><code>print(count)</code></td></tr>
    <tr><td></td><td><code>words = ["the", "ocean", "is", "salty", "and", "deep"]</code></td></tr>
    <tr><td></td><td><code>    if len(w) &gt; 3:</code></td></tr>
    <tr><td></td><td><code>count = 0</code></td></tr>
    <tr><td></td><td><code>for w in words:</code></td></tr>
  </tbody>
</table>

When the lines are in order, what prints? <span class="fill-line short"></span>

</div>

<section class="answer-key" markdown="1">
## Check your answers

**1.** `dog`, then `newt`, then `4`. Indexes start at 0, so `pets[1]` is the
*second* item. `-1` counts from the end.

**2.** `range(5)` gives 0, 1, 2, 3, 4. Only 0, 2 and 4 pass the test, so
`evens` grows `[0]`, then `[0, 2]`, then `[0, 2, 4]`. It prints
**`[0, 2, 4]`**.

**3.** `biggest` starts at 61. 61 is not bigger than 61, 58 is not bigger,
72 is (so `biggest` becomes 72), 70 is not. It prints **72**. Starting at
`temps[0]` works for any list; starting at `0` would give the wrong answer
if every temperature were negative.

**4.** It prints **`[1, 2, 3, 4]`**. `b = a` doesn't copy the list. It gives
the *same* list a second name, so changing it through `b` changes what `a`
sees too. (Chapter 9 calls this *aliasing*.)

**5.** The order is:

```python
words = ["the", "ocean", "is", "salty", "and", "deep"]
count = 0
for w in words:
    if len(w) > 3:
        count = count + 1
print(count)
```

(Lines 1 and 2 can swap; either works.) It prints **3**: ocean, salty, deep.
</section>
