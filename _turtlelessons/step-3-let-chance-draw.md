---
layout: lesson
title: "Let chance draw"
pathway: turtlelessons
order: 3
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

Start from a fresh TurtleLab tab, because a frame or a sample tab does not save your work. The blocks you need are `repeat`, `pen up`, `set xy` with a `random` block in each slot, `pen down`, `set color`, `set pen size`, and `forward`.

Two hints about the paper. It runs from -350 to 350 across and from -280 to 280 up and down. And a very short line drawn with a fat pen looks like a dot.

When your confetti works, run it twice. Do the two runs match? Why or why not?

## Save your work

Press the **PDF** button in your confetti tab to keep a copy of your blocks and your drawing.
