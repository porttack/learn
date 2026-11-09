---
layout: lesson
title: "Capstone 2: boxes and blocks"
pathway: turtlelessons
order: 12
unit: 2
source: original
---

In the first capstone you put a loop, random and an if and else into one piece of art. Since then you have learned three more tools. A **variable** (a box) keeps a number and can change it. A **block of your own** is a word you teach the turtle. And a loop can go **inside** another loop.

In this capstone you use them together in one picture that is yours. Nobody will make the same one, because you choose what the box holds, what your block draws, and how it all repeats.

<aside class="callout note" markdown="1">
**Build in a fresh tab**

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames in the other steps do not keep your work, so do not build in one of them.
</aside>

## What you will build

A picture with these in it:

- A **block of your own** that has an **input**, and that your program uses **more than once**.
- A **variable** (a box) that **changes** while the program runs, so something grows, shrinks or fades.
- A **loop** that repeats.
- At least two colors.
- A sticky note on the page that says what it all does, in your own words.

The list at the end of this page shows what to check.

## Pick a theme

Choose one, or invent your own.

- **Growing garden.** A `flower` or `petal` block with a `size` input. A loop uses it again and again, and a box makes each one bigger than the last.
- **Rainbow spiral.** A block draws one side or one square. A box grows each lap to make the spiral wider, and the color is made from the box, as in Step 10.
- **Tower of shapes.** A block draws a shape with a `size` input. A loop stacks the shapes up, and a box makes each one smaller than the one below.

## Plan it

Sketch on paper what you imagine the finished picture looks like.

Then finish these three sentences:

- My box holds ______, and it changes by ______ each lap.
- My block is called ______. It draws ______, and its input is ______.
- My loop repeats ______ times and uses my block ______ time(s) each lap.

If you can fill in all three, you are ready to build. If you cannot, go back to your sketch.

## The shape of your program

Every capstone has this shape. Your job is to decide what goes in the gaps.

```
to (the name of your block)  (an input)
    (blocks that draw one part, using the input)

start
clean
store in box1: (a number to start with)
repeat (how many times?)
    (use your block, giving it box1)
    (change box1: add, subtract, multiply)
    (turn or move, and maybe set a color)
```

## Build it

Build in small pieces and run after each one:

1. First make your block work **on its own**. Use it once with a plain number, and check the drawing is what you meant.
2. Then put it inside a `repeat`, still with a plain number.
3. Last, put `box1` where the plain number was, and add the block that changes `box1` every lap. Remember it goes **inside** the `repeat`.

If your picture is slow to draw, add a `speed` block (Flow palette) near the top. Speed 4 is instant.

<aside class="callout note" markdown="1">
**When something is not working**

- A **red outline** means that block has a problem. Read the message under the drawing.
- Watch the yellow strip at the bottom right of the drawing. It shows what is in each box. Is the box changing the way you thought it would?
- Nothing happens? Check that your blocks are snapped under `start`, and that you used your block, not only made it.
- Part of your picture is off the edge of the paper? Press the **Fit** button on the toolbar (four corners round a square).
- Not what you pictured? Use the four steps from Step 11: run it, say what you expected, find the difference, then change **one** thing.
</aside>

## Check yourself

Before you save, check that:

- Your picture has a block of your own with an input, and your program uses it more than once.
- You can watch the box change: the yellow strip changes, and so does the picture.
- Your picture has a `repeat` that draws part of it.
- Your picture has at least two colors.
- Your sticky note has your name. It says, in your own words, what your box, your block and your loop each do.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

The Notes palette also has a **write** block. Leave it out of this one, so the picture comes from your box, your block and your loop.

Then press the **PDF** button. Your blocks, your note and your drawing are on the first page. The last page lists what your program is made of, with a count of each kind of block: variables, loops, blocks you made, and more. Look at it. Does it match what you meant to build? Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**A loop inside a loop.** Put your block inside an inside loop, and put that inside an outside loop, so the box makes a whole ring of shapes grow. Work out the outside turn first, so the ring closes.
