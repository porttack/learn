---
layout: lesson
title: "Find the bug"
pathway: turtlelessons
order: 11
unit: 2
source: original
---

A mistake in a program is called a **bug**. Every programmer writes them, all the time, and a big part of the job is finding them. The computer does exactly what you told it to do. A bug is only a place where what you told it is not what you meant.

Here is a way to hunt one down:

1. **Run it** and look at what you got.
2. **Say what you expected.** What should it have done?
3. **Find the difference**, and the block that could cause it.
4. **Change one thing**, then run it again.

Change only one thing at a time. If you change three, you will not know which one fixed it.

Below are four programs with one bug each. Each frame says what its program is **meant** to do. Run it, then find the bug and fix it in the frame. If you get stuck, open the hint. Open the answer last.

## Bug 1: the triangle

{% include turtlelab-embed.html sample="lesson-bug-triangle" title="A program that is meant to draw a triangle" %}

Run it. Does the shape close up? Where does the turtle end up compared with where it started?

<details markdown="1">
<summary>Hint</summary>

Think about Step 2. For a shape to close, the turns have to add up to something. What?
</details>

<details markdown="1">
<summary>Answer</summary>

The turn is 100, but a triangle needs 120, because 360 divided by 3 sides is 120. With 100 the turns only add up to 300, so the shape never gets back to its start. Change the `100` in `right` to `120`.
</details>

## Bug 2: the box

{% include turtlelab-embed.html sample="lesson-bug-box" title="A program that is meant to draw a square 100 long using box1" %}

Run it. Is the square 100 long? Look at the yellow strip at the bottom right of the drawing, which shows what is in each box.

<details markdown="1">
<summary>Hint</summary>

What does the strip say box1 holds? How long is each side that is drawn? Is anything actually **using** box1?
</details>

<details markdown="1">
<summary>Answer</summary>

Box1 holds 100, but no block asks for it. The `forward` has the plain number 50 typed into it, so the sides are 50 long. Storing a number in a box does nothing until another block looks inside. Drag a `box1` block from the Boxes palette into the `forward`, on top of the 50.
</details>

## Bug 3: the coin flip

{% include turtlelab-embed.html sample="lesson-bug-if" title="A program that is meant to wander left and right by a coin flip" %}

Run it a few times. Does it wander? What does the drawing look like each time?

<details markdown="1">
<summary>Hint</summary>

Look at the question in the pointed slot of the `if`. What numbers can `random 1 2` give? Can the answer to the question ever be yes?
</details>

<details markdown="1">
<summary>Answer</summary>

`random 1 2` gives 1 or 2. The question asks whether it equals 3, and that is never true, so the program always takes the `else` and turns left every time. It draws the same small square over and over. Change the 3 to a 1 (or a 2) and the coin decides.
</details>

## Bug 4: the house

{% include turtlelab-embed.html sample="lesson-bug-pen" title="A program that is meant to draw a house with a triangle roof" %}

Run it. What is missing? Did the turtle walk the roof, or not?

<details markdown="1">
<summary>Hint</summary>

Look at the Pen palette. Is the pen up or down while the roof is being drawn? Who put it there?
</details>

<details markdown="1">
<summary>Answer</summary>

The program lifts the pen with `pen up` to climb to the roof, and never puts it down again. The turtle walks the roof without drawing it. Put a `pen down` block after the `forward` that climbs and before the roof.
</details>

## Make a bug of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab. Build or open a program that works, like your spiral from Step 7 or your flower from Step 8. Then **break it in one small way**: a wrong number, a block in the wrong place, a pen left up. Ask someone to run it and find your bug using the four steps above.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Look at the red outline TurtleLab puts around a block that has a problem, and read the message under the drawing. Break a program on purpose in a way that makes a red outline appear, for example by leaving the pointed slot of an `if` empty, or by dividing by zero. What does the message say, and does it tell you how to fix it?
