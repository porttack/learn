---
layout: lesson
title: "A loop inside a loop"
pathway: turtlelessons
order: 9
source: original
---

A `repeat` runs the blocks inside it again and again. So what if one of the blocks inside is **another** `repeat`?

A square is a `repeat` of 4 sides. Now put that whole square inside a second `repeat`. The inside loop draws one square. The outside loop says "do that again", and turns the turtle a little each time. Together they make a ring of squares from only a few blocks.

The rule to remember: **the inside loop runs all of its laps every time the outside loop goes round once.**

## Try it: twelve squares

Open the frame and press Run. Look at the two `repeat` blocks, one inside the other.

{% include turtlelab-embed.html sample="lesson-nested-count" title="Twelve squares: a repeat of 4 inside a repeat of 12" %}

Before you change anything, work out:

1. How many `forward` blocks run in all? (Think: how many sides does one square have, and how many squares are there?)
2. After each square the turtle turns 30. Why 30?
3. You change the outside `repeat` to 6. What turn closes the ring?

Then try it: 6 squares with a turn of 60, and 36 squares with a turn of 10. Last, predict what happens with **12** squares and a turn of **20**, and then run it.

<details markdown="1">
<summary>Check your answers</summary>

1. 48. The inside loop runs 4 sides, and the outside loop runs it 12 times, so 12 times 4 is 48.
2. 12 squares times 30 is 360, a full circle, so the ring closes. It is the same rule as before: laps times turn must make 360.
3. 60, because 6 times 60 is 360.

With 12 squares and a turn of 20, the turns add up to 240, only two thirds of a circle. The squares fan out and leave a gap instead of closing a ring.
</details>

## A flower of hexagons

The same idea makes a flower. This time the inside loop draws a hexagon: 6 sides, turning 60 each time.

{% include turtlelab-embed.html sample="hexagon-flower" title="A flower: a repeat of 6 inside a repeat of 6" %}

1. How many lines does the turtle draw in all?
2. Change the inside `repeat` from 6 to 5 and the turn inside it from 60 to 72. What shape does the inside loop draw now? To make a flower of five of them, what should the outside `repeat` and the outside turn be?
3. You change **both** `repeat` blocks to 20. How many lines is that? Work it out before you try it.

<details markdown="1">
<summary>Check your answers</summary>

1. 36. Six hexagons with 6 sides each.
2. Pentagons. For a flower of five, the outside `repeat` is 5 and the outside turn is 72, because 5 times 72 is 360.
3. 400. A loop inside a loop **multiplies**: 20 times 20. This is why a few small numbers can draw a very detailed picture.
</details>

## Which loop does what?

When you read a nested loop, ask two questions:

- What does the **inside** loop make? (One square. One hexagon.)
- What does the **outside** loop do with it? (Repeat it in a ring.)

Then check that the outside turn times the outside laps makes 360, if you want a ring that closes.

## Make your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Make a ring of triangles, or of any shape you like, using a loop inside a loop. Pick the inside shape first and get it right. Then put it inside the outside loop. Work out the outside turn **before** you type it.

Then make it colorful: put a `set color` block **inside the outside loop but outside the inside loop**. Why does it change color for each shape, and not for each side?

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Open the <a href="{{ '/turtlelab/?sample=nested-squares' | relative_url }}" target="_blank" rel="noopener">Nested squares sample</a>. It uses a loop inside a loop **and** a box. Find the box and work out what it does to each square. What does the Output box at the top right show?
