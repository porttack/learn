---
layout: lesson
title: "Ask for a number"
pathway: turtlelessons
order: 13
unit: 3
source: original
---

So far you typed every number into a block before the program ran. A program can also **ask** for a number while it runs, so whoever runs it decides.

The **ask** block (Boxes palette) shows a question, waits for a number, and puts the number in **box1**. It is a variable you did not have to store yourself.

## Try it: ask for the sides

The frame below asks its question as soon as it starts. Type a number and press Enter. (Press **Run** to be asked again.)

{% include turtlelab-embed.html sample="lesson-ask-sides" title="A program that asks how many sides, then draws a shape with that many" %}

Before you type, work out:

1. You type 5. How many sides will it draw, and how big is each turn?
2. What will be in box1 afterwards? Look at the yellow strip.
3. You type 0. What will it draw, and why?

Now try 5, 3, 12 and 0.

<details markdown="1">
<summary>Check your answers</summary>

1. Five sides. Each turn is 360 ÷ 5, which is 72.
2. 5. The answer goes in box1, and it stays there until something puts a new number in.
3. Nothing. The `repeat` runs 0 times.
</details>

If you press Enter on a word, or on nothing, the box says what to type and stays open. **Cancel** (or Escape, or Stop) ends the program.

## Always box1

The answer always goes in box1. If you ask twice, the second answer **replaces** the first, just like storing a new number. To keep the first answer, store it in another box before you ask again:

```
ask: How long is a side?
store in box2: box1
ask: How many sides?
repeat box1
    forward box2
    right 360 ÷ box1
```

Trace it on paper. You type 50, then 5.

1. What are box1 and box2 when the `repeat` starts?
2. What shape does it draw, and how long is each side?
3. Take out the `store in box2` block. What does the program draw now, and why?

<details markdown="1">
<summary>Check your answers</summary>

1. box1 is 5 (the second answer replaced the first) and box2 is 50 (stored before the second question).
2. A pentagon, with sides of 50.
3. Nothing. Without the store, box2 is still 0, so `forward box2` goes forward 0.
</details>

## Build one of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frame above does not keep your work.

Make a program that asks how long a side is, then draws a square that long. You need `ask` and `box1` (Boxes palette), and `repeat`, `forward` and `right`. Run it and type 80. Run it again and type 40.

## Save your work

Run your program and answer its question first. Then press the **PDF** button: the PDF keeps the drawing you just made.

If you press PDF before you have run your program, TurtleLab runs it for you. Nobody is there to answer, so it uses 0, and the drawing is empty.

## Done early?

**Ask twice.** Ask for the length of a side and for the number of sides, as in the trace above, and draw any polygon of any size. Then try a third question for the pen thickness (use `store in box3`).

**A flower.** Use your block from Step 8. Ask how many petals there are, and turn 360 ÷ the answer between petals.
