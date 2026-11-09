---
layout: lesson
title: "Capstone 4: make a game"
pathway: turtlelessons
order: 18
unit: 4
source: original
---

You can now make a program listen three ways: a **click** (`when paper clicked`), a **key** (`when [key] pressed`) and a **timer** (`every`). And you can make it decide with **if**, **and**, **or** and **not**. Put them together and build a small game or toy that a person plays.

Nobody will make the same one. You choose what the person controls, what the program does by itself, and how it decides what happens.

<aside class="callout note" markdown="1">
**Build in a fresh tab**

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames in the other steps do not keep your work, so do not build in one of them.
</aside>

## Look at some first

Open each one, press Run if it is not already running, and play with it. Then look at the blocks to see how it works. They all start from what you already know.

- <a href="{{ '/turtlelab/?sample=keyboard-painter' | relative_url }}" target="_blank" rel="noopener">Keyboard painter</a> listens for **keys**: the arrows steer and r, g and b change the color.
- <a href="{{ '/turtlelab/?sample=bouncing-turtle' | relative_url }}" target="_blank" rel="noopener">The bouncing turtle</a> moves by itself on a **timer**, and an **or** says when it is near an edge.
- <a href="{{ '/turtlelab/?sample=click-flowers' | relative_url }}" target="_blank" rel="noopener">Click flowers</a> listens for **clicks**, and uses a block of its own and **random**.
- <a href="{{ '/turtlelab/?sample=catch-the-square' | relative_url }}" target="_blank" rel="noopener">Catch the square</a> is the game from Step 16, and <a href="{{ '/turtlelab/?sample=fat-snake' | relative_url }}" target="_blank" rel="noopener">The fat snake</a> is the game from Step 17.

## What you will build

A program with these in it:

- **Two kinds of listening**, at least: pick two of `when paper clicked`, `when [key] pressed` and `every`.
- A **box** that changes while the program runs: a score, a count, or where something is.
- An **if** that uses **and** or **or** (or both) to decide something.
- A **block of your own** that your program uses **more than once**.
- A **loop** that repeats.
- At least two colors.
- A sticky note on the page that says what your game is and how to play it, in your own words.

## Pick a theme

Choose one, or invent your own.

- **Click race.** A target sits at a random place. Every few seconds it jumps somewhere else by itself (`every`). Click inside it before it jumps to score. Is the click inside? That is Step 16.
- **Steer a painter.** A turtle walks by itself and leaves a trail (`every`). The arrow keys turn it, and letter keys change its color or its pen size.
- **Catch the falling dot.** A dot falls down the paper by itself (`every`). Two keys slide a bar along the bottom. Score when the bar is under the dot when it lands. To move something without leaving a trail, use `clean` and draw everything again at its new place on every tick.
- **Your own snake.** Start from what you built in Step 17 and make it yours: a different food, a different rule for growing, wrap around the edges, different keys. It must still do something new that Step 17 did not.

## Plan it

Sketch on paper what the game looks like when you play it, and mark where the score or the count shows.

Then finish these three sentences:

- The person plays by ______ (pressing which keys, or clicking where).
- By itself, my game ______ every ______ (what the timer does, and how often).
- My game keeps ______ in box ______, and uses an if with **and** or **or** to decide ______.

If you can fill in all three, you are ready to build. If you cannot, go back to your sketch.

## The shape of your program

```
to (the name of your block)  (maybe an input)
    (blocks that do one thing, like draw something)

start
speed 4
clean
(set up your boxes)

when (a key) pressed
    (what that key does)

every (a number of tenths)
    (what the game does by itself)
    if (a question joined with AND or OR)
        (what happens)
```

## Build it

Build in small pieces and run after each one:

1. First make your block work **on its own**. Use it once under `start`, press Run, and check the drawing.
2. Add the first thing the person does, a `when [key] pressed` or a `when paper clicked`. Press Run, try it, and check that it does what you meant.
3. Add the `every` block with one block under it. Press Run and watch it go by itself.
4. Add the box and the `if` with **and** or **or**. Use a `print` block to see what a box holds while you play.
5. Last, add the score, the colors and anything fun.

Put `speed 4` under `start` so the blocks under `every` run all at once. Press Run, click the paper once, and play.

<aside class="callout note" markdown="1">
**When something is not working**

- A key does nothing? Check that you pressed Run, that the message says the program is listening, and that you clicked the paper once so the page is listening to the keyboard.
- Nothing moves by itself? An `every` block starts after the last block under `start` has run. Check for a `forever` or a `wait` that never ends. And a number smaller than 0.5 on `every` is too fast, so it stops and says so.
- It runs slowly? Put `speed 4` under `start`.
- Clicking a `when` block or an `every` block only tells you what it is for. Press Run and the keys, clicks and timer do the rest.
- A **red outline** means that block has a problem. Read the message under the drawing.
- Watch the yellow strip at the bottom right of the drawing. Is the box what you thought?
- You only have four boxes, `box1` to `box4`. Plan which one holds what before you start.
- Not what you pictured? Use the four steps from Step 11: run it, say what you expected, find the difference, then change **one** thing.
</aside>

## Check yourself

Before you save, check that:

- Your program listens in at least two of the three ways (a click, a key, a timer), and it works when you play it.
- A box changes while it runs, and you can say what it holds.
- Your program has an `if` that uses `and` or `or`.
- You made a block of your own, and your program uses it more than once.
- Your program has a `repeat`.
- Your picture has at least two colors.
- Your sticky note has your name. It says what your game is and how to play it, in your own words.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

Then press Run, click the paper once, and play for a little while so there is something on the paper. Then press the **PDF** button. Your blocks, your note and your drawing are on the first page. The last page lists what your program is made of, with a count of each kind of block: variables, loops, blocks you made, the ways it listens, and more. Look at it. Does it match what you meant to build? Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**How fast?** Use `ask` at the start to ask the person how fast they want to play. The answer goes in box1, so use `box1` in the number on `every`. The timer reads it when it starts, so ask first, before the last block.

**Two players.** Give a second player their own keys, like **w**, **a**, **s** and **d**.

**Game over.** Make something happen at the end of a round: the screen clears, the color changes, or the turtle goes home.

**Show the score.** Use a `print` block so the score shows in the Output box every time it changes.
