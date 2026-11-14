---
layout: lesson
title: "Let chance draw"
pathway: turtlelessons
order: 3
unit: 1
source: original
---

So far, every time you press Run you get the same picture. A loop repeats steps, but the steps are the same ones.

A program can also use **chance**. The `random` block (Math palette) picks a number each time it is used, so the picture can come out different on every run. Art, games and simulations all use it.

## Try a sample

The frame below is a real TurtleLab. Change a number, press **Run**, and look at the drawing. **Start over** puts the demo back the way it was. Nothing you do in a frame is saved, and **Open full size** opens it in a tab of its own.

{% include turtlelab-embed.html sample="color-burst" title="Color burst: 50 rays, each in a random color" %}

Before you run it a second time, make a guess: will the second picture match the first?

Then run it three times. Look at the `set color` block. Each of its three slots has a `random 0 255` block plugged into it. A color mixes red, green and blue, and each one is a number from 0 to 255. That is why the random numbers go from 0 to 255.

Work out:

1. What is the smallest number `random 0 255` can give? The largest?
2. The sample draws 50 rays and turns 7.2 each time. 50 × 7.2 is what? Why does that number make sense?
3. If you change it to 100 rays, what should the turn be?

Try your answer to question 3. Numbers on a block do not have to be whole numbers.

## Change it

Make two changes to the sample, one at a time, and run it after each:

1. The line length is 200. Drag a `random` block out of the Math palette and drop it onto the 200 so it plugs in. Choose its two numbers so the rays have different lengths.
2. Change the number of rays and the turn so the rays still go all the way around.

<aside class="callout note" markdown="1">
**How a block plugs in**

A round block like `random` plugs into a round number slot. When you drop it on a slot, the slot grows to hold it. Drag the block back out to take it off, and a plain number comes back.
</aside>

## Build confetti

This is the last practice before the capstone. Scatter 60 dots on the paper, each in a random place and a random color.

Here is a start. The pen is fat, so a very short line looks like a dot. The dots are already spread across the paper from left to right by a `random` block in the x slot of `set xy`. Press Run.

{% include turtlelab-embed.html sample="lesson-confetti-start" title="A start on confetti: sixty red dots in a thin band across the middle" %}

Two things are wrong, and you can fix both.

1. **The band.** The dots land in a thin band. Look at the numbers in the `random` block in the y slot. The paper runs from -280 to 280 up and down. Change the numbers so the dots cover the whole paper.
2. **The color.** Every dot is red, because `set color` has three plain numbers. Plug a `random` block into each of the three slots, the same way as the color burst, and choose the numbers a color can be.

<details markdown="1">
<summary>Check your answers</summary>

1. The y block needs `random -280 280`. The dots were picked between -20 and 20, which is a thin band.
2. Each slot of `set color` gets `random 0 255`, so every dot has its own mix of red, green and blue.
</details>

When your confetti works, run it twice. Do the two runs match? Why or why not?

## Make your picture

Now make your own. Open a fresh TurtleLab with **Open full size** under any frame, and build a confetti picture with:

- At least 80 dots, from a `repeat`, spread over the whole paper.
- A random color for every dot.
- A random size for every dot: plug a `random` block into `set pen size`. Choose numbers that give some small dots and some big ones.

Use only `repeat`, `random`, `pen up`, `pen down`, `set xy`, `set color`, `set pen size` and `forward`. Add a sticky note with your name.

## Save your work

To keep a copy of your blocks and your drawing, press the **PDF** button on the toolbar. A frame does not have one, so build in a tab of your own.
