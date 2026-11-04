---
layout: lesson
title: "Choose a path"
pathway: turtlelessons
order: 4
source: original
time: 45
grouping: "On your own"
materials: "Chromebook, pencil, activity sheet"
organizer: /turtle-lessons/activity-sheet/
organizer_label: "Activity sheet"
---

So far your programs do the same steps every time, even when chance changes the numbers. Sometimes a program has to **decide**.

Think of a fork in the road. A question has a yes or no answer. If the answer is yes, you take one road. If it is no, you take the other.

The block for that is `if` with an `else` (Flow palette). It has a pointed slot for the question and two mouths:

- The **top mouth** runs when the answer is **yes**.
- The **bottom mouth**, marked `else`, runs when the answer is **no**.

**Exactly one of the two runs.** Never both, and never neither. That one idea is the whole block.

## Try a sample

Open the <a href="{{ '/turtlelab/?sample=wandering-turtle' | relative_url }}" target="_blank" rel="noopener">Wandering turtle sample</a>.

<aside class="callout note" markdown="1">
**This tab will not remember changes**

A sample tab never saves anything, so a refresh puts the sample back. Press Ctrl+S to keep a copy of something you want to keep.
</aside>

Find the question in the pointed slot. It reads `random 1 2 = 1`. Think of it as a coin flip: the random block gives 1 or 2. If it gives 1 (the answer is yes), the turtle takes the top mouth. If it gives 2 (the answer is no), it takes the `else` mouth.

Answer on your activity sheet:

1. When the random number is 1, which way does the turtle turn? Which way does it turn in the `else`?
2. Can the turtle ever do both in one pass? Can it do neither?
3. Run it three times. Are the drawings the same? Why?

### Trace it on paper

Pretend the coin gave these six flips in a row: 1, 1, 2, 1, 2, 2. The turtle starts facing up (heading 0). On a 1 it turns right 90. On a 2 it turns left 90. Fill in the trace table on your activity sheet: which path ran, and what the heading is after each flip.

The first row is done for you, so you can see the format.

<details markdown="1">
<summary>Check your answers</summary>

The headings after each flip are 90, 180, 90, 180, 90 and 0.
</details>

## Change it

Do these one at a time and run after each:

1. Change the turns so heads turns right 60 and tails turns left 120. What happens to the path?
2. Make the color tell you which road was taken. Put a `set color` inside the top mouth and a different `set color` inside the `else` mouth.

When you drop a block into a mouth, the mouth grows to hold it. This is what the stack should be shaped like:

```
repeat 120
    if  random 1 2 = 1
        set color (one color)
        right 90
    else
        set color (another color)
        left 90
    forward 15
```

<aside class="callout note" markdown="1">
**A red outline on the `if` block?**

The pointed slot needs a yes-or-no block, like `=`, `<` or `>` from the Math palette. A plain number will not fit there. Read the message under the drawing.
</aside>

## Take it further

<aside class="callout challenge" markdown="1">
**CHALLENGE: UNFAIR COIN**

Make the turtle turn right only about 1 time in 4, and left the other 3 times. The tools you need are a `random` block with different numbers, and a `<` or `=` block. Run it a few times and see if the path leans the way you expect.
</aside>

## Hand it in

Press the **PDF** button and turn it in the way your teacher says.
