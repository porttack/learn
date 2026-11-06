---
layout: lesson
title: "Say it once"
pathway: turtlelessons
order: 2
source: original
---

A square takes eight blocks the long way: `forward` and `right`, four times over. (If you did Step 1, your frame around your initials took eight blocks too.)

Computers are very good at repeating things, so you only have to say it once. The block for that is `repeat` (Flow palette). It runs the blocks inside it again and again.

## Try a sample

The frame below is a real TurtleLab. Change a number, press **Run**, and look at the drawing. **Start over** puts the demo back the way it was. Nothing you do in a frame is saved, and **Open full size** opens it in a tab of its own. The square draws by itself.

{% include turtlelab-embed.html sample="square" title="A square: one forward and one right, repeated 4 times" %}

Look at the blocks. The ones **inside** the `repeat` are the ones that repeat. The number on the `repeat` says how many times. The whole square is just one `forward` and one `right`, said once and repeated 4 times.

1. Change the 4 on the `repeat` to a 3 and press Run. What shape did you get? Is it a triangle? Why not?
2. The square's turn is 90. Find the turn that makes a triangle, a pentagon, a hexagon, an octagon and a shape with 12 sides. Change the `repeat` and the turn, then run it. If your numbers are right, the shape closes up.

The pattern you are looking for: to come back to where it started, facing the same way, the turtle must turn one full circle, **360 degrees**, all together. So:

**turn = 360 ÷ number of sides**

Check it with the square: 360 ÷ 4 is 90.

## A ring of dashes

{% include turtlelab-embed.html sample="dotted-circle" title="A dotted circle: a repeat of dashes, with the pen lifted between them" %}

The loop draws a short dash, lifts the pen, moves a little, and turns. Before you change anything, work out: the loop runs 36 times and turns 10 each time. What is 36 × 10, and why does that number make sense?

Then change it: set the loop to 72 and the turn to a number that still makes a full ring. Predict the turn first, then try it.

## See the Python

Use **Open full size** under one of the frames, then press the `>>>` button on its toolbar. It shows the blocks as Python. Find your `repeat`. You will see a line that starts with `for _ in range(`. That is a Python loop, and it does the same thing as your block.

## Save your work

To keep a copy of your blocks and your drawing, use the **PDF** button on the toolbar. A frame does not have one, so use **Open full size** under a frame, make your changes there, and press the **PDF** button.
