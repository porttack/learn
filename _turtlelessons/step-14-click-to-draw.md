---
layout: lesson
title: "Click to draw"
pathway: turtlelessons
order: 14
unit: 3
source: original
---

Until now your program ran from its first block to its last, and then it stopped. A program can also keep **listening** for what a person does. In TurtleLab it can listen for clicks on the paper.

The **when paper clicked** block (Flow palette) looks like `start`, but Run never starts from it. Put blocks under it, and they run **every time you click the paper**.

Right under it in the palette are two round blocks, **mouseX** and **mouseY**. They say where you clicked, in the same x and y numbers that `set xy` uses. They are built in: you never store anything in them.

## Try it: stamp a square

Open the frame and click the paper a few times. Look at the Output box at the top right.

{% include turtlelab-embed.html sample="lesson-click-stamp" title="A program that stamps a square wherever you click the paper" %}

The program's own blocks (`start` and `clean`) ran once, at once. But the program did not end: it is **listening**. Press **Stop** to end it, and the Run button comes back. Press Run to listen again.

Before you click, work out:

1. You click the middle of the paper. What will mouseX and mouseY say?
2. You click near the top right corner. Will mouseX be positive or negative? And mouseY?
3. The square starts at your click. Which corner of the square is where you clicked, and why does the square go up and to the right?

Now click in the middle, then near each corner, and check.

<details markdown="1">
<summary>Check your answers</summary>

1. About 0 and 0.
2. Both are positive. Right of the middle is a positive x, and above the middle is a positive y. (The paper goes from -350 to 350 across, and from -280 to 280 up and down.)
3. The bottom left corner. The turtle goes to your click facing up, so the first side goes up, and the turns go to the right.
</details>

## What each part does

- The blocks under `start` run once, as always.
- A program that has a `when paper clicked` then **keeps listening**, until you press Stop.
- Each click runs the blocks under `when paper clicked`, from the top to the bottom, with mouseX and mouseY set to that click.
- Sliding the paper with the mouse is **not** a click. Neither is clicking on a block.

## Build one of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frame above does not keep your work.

Make a dot painter: every click draws a fat dot where you click. You need `when paper clicked` and `mouseX` and `mouseY` (Flow palette), and `pen up`, `set xy`, `pen down`, `set pen size` and `forward`. A very short line drawn with a fat pen looks like a dot, as in Step 3.

Press Run, then click. If nothing happens, check that the message says it is listening, and click the paper, not a block.

## Save your work

Press Run, click the paper to make your drawing, and then press the **PDF** button. The PDF keeps what is on the paper.

## Done early?

**A color for every click.** Put a `set color` before the dot, with a `random` block in each of its three slots, as in Step 3.

**A stamp of your own.** Make a block of your own that draws a flower (Step 8), and use it under `when paper clicked`, so every click plants a flower.
