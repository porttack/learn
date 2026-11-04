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

Open the <a href="{{ '/turtlelab/?sample=color-burst' | relative_url }}" target="_blank" rel="noopener">Color burst sample</a>.

<aside class="callout note" markdown="1">
**This tab will not remember changes**

A sample tab never saves anything, so a refresh puts the sample back. Press Ctrl+S to keep a copy of something you want to keep.
</aside>

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

## Take it further

<aside class="callout challenge" markdown="1">
**CHALLENGE: CONFETTI**

Scatter 60 dots on the paper, each in a random place and a random color. Start from a fresh TurtleLab tab. The tools you need are `repeat`, `pen up`, `set xy` with a `random` block in each slot, `pen down`, `set color`, `set pen size`, and `forward`.

Two hints about the paper. It runs from -350 to 350 across and from -280 to 280 up and down. And a very short line drawn with a fat pen looks like a dot.
</aside>

When your confetti works, run it twice. Do the two runs match? Why or why not?

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.
