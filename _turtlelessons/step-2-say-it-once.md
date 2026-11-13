---
layout: lesson
title: "Say it once"
pathway: turtlelessons
order: 2
unit: 1
source: original
---

A square takes eight blocks the long way: `forward` and `right`, four times over. (If you did Step 1, your frame around your initials took eight blocks too.)

Computers are very good at repeating things, so you only have to say it once. The block for that is `repeat` (Flow palette). It runs the blocks inside it again and again.

## Try a sample

The frame below is a real TurtleLab. Change a number, press **Run**, and look at the drawing. **Start over** puts the demo back the way it was. Nothing you do in a frame is saved, and **Open full size** opens it in a tab of its own. The square draws by itself.

{% include turtlelab-embed.html sample="square" title="A square: one forward and one right, repeated 4 times" %}

Look at the blocks. The ones **inside** the `repeat` are the ones that repeat. The number on the `repeat` says how many times. The whole square is just one `forward` and one `right`, said once and repeated 4 times.

## A triangle

A triangle has 3 sides, so change the 4 on the `repeat` to a 3 and press Run. Is it a triangle? Why not?

The turn is still 90, and that is too big. To come back to where it started, facing the same way, the turtle must turn one full circle, **360 degrees**, all together. A triangle has 3 turns. Before you try, work out: what number, three times, makes 360?

Type your number into the `right` block and press Run. Then check it against this triangle.

{% include turtlelab-embed.html sample="lesson-triangle" title="A triangle: a forward and a right of 120, repeated 3 times" %}

Now change the 120 in the frame to 100 and press Run. What happens, and why?

<details markdown="1">
<summary>Check your answers</summary>

The turn is 120, because 3 × 120 is 360. With 100 the triangle stays open: three turns of 100 make 300, not 360, so the turtle does not come back facing the way it started.
</details>

## A pentagon

A pentagon has 5 sides. Predict the turn first: what number, five times, makes 360? Write your prediction down, then change the `repeat` to 5 in the square frame, type your turn into the `right` block and press Run. Then check it here.

{% include turtlelab-embed.html sample="lesson-pentagon" title="A pentagon: a forward and a right of 72, repeated 5 times" %}

Change the 5 on the frame's `repeat` to 6, keeping the turn, and press Run. What does the sixth side do?

<details markdown="1">
<summary>Check your answers</summary>

The turn is 72, because 5 × 72 is 360. The sixth side draws over the first side again. Five sides with a turn of 72 already closed the shape, so a sixth side starts it over.
</details>

## The pattern

Look at the three shapes you have made:

| Shape | Sides | Turn |
|---|---|---|
| Triangle | 3 | 120 |
| Square | 4 | 90 |
| Pentagon | 5 | 72 |

The turn times the number of sides is always 360. So:

**turn = 360 ÷ number of sides**

Now use the pattern. Find the turn for a hexagon, an octagon and a shape with 12 sides. Change the `repeat` and the turn in the square frame, then run it. If your numbers are right, the shape closes up.

## You choose the sides

The turtle can do that sum for you. In this frame the program asks how many sides you want, and it works out the turn itself, 360 ÷ your number. Two of the blocks in it are new: `ask` waits for you to type a number, and the box called `box1` keeps it. You will learn both later. For now, just use it.

Press Run, type a number, and press Enter. Press Run again to be asked again.

{% include turtlelab-embed.html sample="lesson-sides-any" title="A program that asks how many sides, then draws a shape with that many" %}

1. Type 3, then 5, then 8. What shapes do you get?
2. Type 40, then 100. What does the shape look like, and why?
3. Type 2. What does the turtle draw, and why?

<details markdown="1">
<summary>Check your answers</summary>

1. A triangle, a pentagon and an octagon.
2. Nearly a circle. With 40 sides each turn is only 9 degrees, and with 100 sides it is 3.6, so the corners are too small to see. A circle is what you get when the number of sides keeps growing.
3. A single line, out and back. The turn is 180, so the turtle turns around and walks back the way it came.
</details>

## Two turns in one loop

So far the `repeat` held one `forward` and one `right`. It can hold more. Put in `forward 100`, `right 90`, `forward 50`, `right 90` and repeat it 2 times. What shape is it?

Each trip through the loop turns 90 + 90 = 180, so two trips turn 360, and the shape closes.

A rhombus has four sides of the same length, but its corners are not square, so its two turns are different. Pick two turns that add up to 180, put the same number in both `forward` blocks, and run it.

<details markdown="1">
<summary>Check your answers</summary>

The first program is a rectangle. For the rhombus, 60 and 120 work (120 and 60 work too). If the two `forward` numbers are different you get a parallelogram, not a rhombus.
</details>

## Make your picture

Now put it all in one drawing. Open a fresh TurtleLab with **Open full size** under any frame, and build:

- Three regular shapes, such as a hexagon, an octagon and a shape with 12 sides. Use a `repeat` for each one and work out its turn with 360 ÷ sides.
- A different color for each shape (`set color`, before the shape).
- One rhombus, from the section above.
- Every shape must close up.

Use only `repeat`, `forward`, `right` and `set color`. Add a sticky note with your name.

## Save your work

To keep a copy of your blocks and your drawing, press the **PDF** button on the toolbar. A frame does not have one, so build in a tab of your own.
