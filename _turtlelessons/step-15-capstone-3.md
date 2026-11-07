---
layout: lesson
title: "Capstone 3: ask and click"
pathway: turtlelessons
order: 15
source: original
---

In Capstone 2 you used a box, a block of your own and a loop. Now you add the two ways a program can listen to a person: **ask** and **when paper clicked**. Build one picture that the person using it helps to make.

Nobody will make the same one, because you choose what the program asks, what a click does, and what your block draws.

<aside class="callout note" markdown="1">
**Build in a fresh tab**

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames in the other steps do not keep your work, so do not build in one of them.
</aside>

## What you will build

A program with these in it:

- An **ask** block, and an answer that your program really **uses**.
- A **when paper clicked** that draws something where you click, using **mouseX** and **mouseY**.
- A **block of your own** with an **input**, that your program uses **more than once**.
- A **loop** that repeats.
- At least two colors.
- A sticky note on the page that says what it all does, in your own words.

## Pick a theme

Choose one, or invent your own.

- **Stamp shop.** Ask how big the stamp is. Every click stamps a flower (or a star, or a house) that size where you click.
- **Polygon painter.** Ask how many sides. Every click draws a polygon with that many sides, starting where you click.
- **Dot painter.** Ask how fat the dots are. Every click draws a dot of that size, and the color changes with where you click.

## Plan it

Sketch on paper what the picture looks like after a few clicks.

Then finish these three sentences:

- My program asks ______, and uses the answer to ______.
- My block is called ______. It draws ______, and its input is ______.
- Each click ______ at the spot that was clicked, using mouseX and mouseY.

If you can fill in all three, you are ready to build. If you cannot, go back to your sketch.

## The shape of your program

```
to (the name of your block)  (an input)
    (blocks that draw one thing, using the input)

start
clean
ask: (your question)
(blocks to set the color, or the pen size)

when paper clicked
    pen up
    set xy mouseX mouseY
    pen down
    (use your block, giving it box1 or a number)
```

## Build it

Build in small pieces and run after each one:

1. First make your block work **on its own**. Use it once with a plain number, and check the drawing.
2. Then put it under `when paper clicked`, with `pen up`, `set xy mouseX mouseY` and `pen down` before it. Press Run, click the paper, and check that it draws where you click.
3. Last, add the `ask` block under `start`, and put `box1` where the plain number was.

Press Run, **answer the question first**, and then click.

<aside class="callout note" markdown="1">
**When something is not working**

- Nothing happens when you click? Check that you pressed Run, that the message says the program is listening, and that you clicked the paper and not a block.
- The program asks nothing? Check that the `ask` block is snapped under `start`.
- A **red outline** means that block has a problem. Read the message under the drawing.
- Watch the yellow strip at the bottom right of the drawing. Is box1 what you typed?
- Not what you pictured? Use the four steps from Step 11: run it, say what you expected, find the difference, then change **one** thing.
</aside>

## Check yourself

Before you save, check that:

- Your program asks a question, and the answer changes the picture.
- A click draws something where you clicked, not somewhere else.
- Your picture has a block of your own with an input, and your program uses it more than once.
- Your picture has a `repeat`.
- Your picture has at least two colors.
- Your sticky note has your name. It says, in your own words, what your question, your click and your block each do.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

Then press Run, answer the question, and click the paper a few times to make your picture. Then press the **PDF** button. Your blocks, your note and your drawing are on the first page. The last page lists what your program is made of, with a count of each kind of block: variables, loops, blocks you made, ask and click, and more. Look at it. Does it match what you meant to build? Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**Two questions.** Ask for a size and a number of petals. Keep the first answer in `box2` before you ask again, as in Step 13.

**Click to change.** Make the color depend on where you click, by using mouseX and mouseY in the numbers of `set color`.
