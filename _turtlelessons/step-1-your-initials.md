---
layout: lesson
title: "Your initials"
pathway: turtlelessons
order: 1
unit: 1
source: original
---

A computer does exactly what you tell it, in the order you tell it, and nothing else. In this step you give a turtle exact steps to draw your initials, and you end with a PDF of your work.

Planning on paper first makes it fast. People who plan finish early. People who skip it spend the whole time fixing.

## How the turtle thinks

The turtle's paper is like a graph. The middle is (0, 0), and **y goes up**: a bigger y is higher on the page.

The turtle also faces a direction, its **heading**:

| Heading | The turtle faces |
|---|---|
| 0 | up |
| 90 | right |
| 180 | down |
| 270 | left |

`right` and `left` turn the turtle. With the **pen down** it draws as it moves. With the **pen up** it moves without drawing.

## Build an L

First watch one. Read the blocks in the frame from the top down. The grid shows where the turtle is: the numbers are x and y.

**Before you press Run:** the turtle starts at (-150, 60) facing down. Where will it end up, and which way will it face? Write your prediction down. Then press Run (it is slow on purpose) and check. Look at the turtle's nose.

{% include turtlelab-embed.html sample="lesson-l" grid="numbers" title="An L drawn slowly on a grid" %}

<details markdown="1">
<summary>Check your answer</summary>

It ends at (-90, -60), facing right. `left 90` turns the turtle from facing down to facing right.
</details>

Now build the same L yourself.

<aside class="callout note" markdown="1">
**Build in a fresh tab**

Open <a href="{{ '/turtlelab/?nowrite=1' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and keep this page next to it. That tab remembers your blocks if you refresh. Its Notes palette has no `write` block, on purpose: you draw the letters yourself.
</aside>

The round buttons on the left open the palettes of blocks (point at one to see its name). Drag a block out, and snap the next one under it. Tap a number on a block to change it.

| Palette | Blocks |
|---|---|
| Flow | `start` |
| Turtle | `clean`, `set xy`, `set heading`, `forward`, `left` |
| Pen | `pen up`, `pen down` |

Use the same blocks, in the same order, with the same numbers. Leave out the `speed` block: it only slowed the frame down. `clean` wipes the paper so every run starts the same way.

## Plan your initials

Sketch your initials on this grid with straight lines. It is the same size as the turtle's paper, and the numbers are the x and y you type into `set xy`. A letter about 120 tall works well. Print this page or copy the grid onto your own paper. (TurtleLab can show the same grid: press the grid button on the toolbar, the square with lines in it.)

{% include turtle-grid.html %}

For each letter, write down where the turtle starts, which way it faces, and the moves, like `forward 120, left 90, forward 60`.

## Between letters

Look at the first four blocks of the L: `pen up`, `set xy`, `set heading` and `pen down`. They take the turtle to where the letter starts without drawing anything on the way. You use the same four blocks again between every two letters.

Here is an L and an I. Press Run and watch the turtle between the letters.

{% include turtlelab-embed.html sample="lesson-travel" grid="numbers" title="An L and an I, with the four blocks that walk the turtle from one letter to the next" %}

Work out:

1. Which four blocks walk the turtle from the L to the I?
2. The turtle ends the L facing right. Why does the I still draw downward?
3. Change the 180 in the `set heading` just above the I to 90, and press Run. What happens to the I, and why? (**Start over** puts it back.)

<details markdown="1">
<summary>Check your answers</summary>

1. `pen up`, `set xy`, `set heading` and `pen down`. The pen goes up so nothing is drawn on the way. `set xy` picks the place. `set heading` makes the turtle face the way the letter starts. The pen goes down to draw.
2. `set heading 180` turns the turtle to face down before the pen goes down. Which way it faced at the end of the L does not matter any more.
3. The I lies on its side and runs to the right, because the turtle now faces right when it draws. A letter is drawn in whatever direction the turtle faces, so set the heading before every letter.
</details>

## Build your initials

Build one letter at a time, and tap its stack to test it before you start the next one.

**Draw every letter piece by piece**, one line or one curve at a time, with blocks like `forward`, `left`, `right`, `set xy` and `arc`. **Do not use the `write` block** from the Notes palette. It writes the letters for you, and building them yourself is the whole point of this step.

To travel between letters, use the four blocks from the L and I frame: `pen up`, `set xy`, `set heading` (180 is down, 0 is up) and `pen down`.

When your initials are done, draw a square frame around them and count how many blocks the frame took. Remember that number. You will see it again in Step 2.

## Check yourself

- Every initial can be read by someone who has not seen your plan.
- There are no stray lines between your letters.
- You predicted where the L would end and which way it would face, and you checked.
- You built every letter yourself, piece by piece, with no `write` block.

## Make your PDF

Add a sticky note first: open the Notes palette, drag out a note, tap it and type your name.

Then press the **PDF** button on the toolbar. It saves your blocks, your note and your drawing, with a grid of x and y numbers on the drawing so anyone can check where each line is.

Keep your PDF. To get your blocks back later, press Open in TurtleLab and choose the PDF, or drag the PDF onto the page.

## Done early?

**Curves.** Letters like C, O, S, D, B and U have curves. Use the `arc` block (Turtle palette). It takes an angle and a radius. A positive angle curves right and a negative angle curves left. Find out what an `arc` of 180 with a radius of 50 looks like, then use arcs in your letters.

**Color.** Give each letter its own color. The `set color` block (Pen palette) takes red, green and blue, each from 0 to 255. Red is 255, 0, 0. Black is 0, 0, 0. White is 255, 255, 255. Mix your own.
