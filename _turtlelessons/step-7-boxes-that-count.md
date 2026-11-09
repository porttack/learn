---
layout: lesson
title: "Boxes that count"
pathway: turtlelessons
order: 7
unit: 2
source: original
---

In Step 6 you stored a number in a **variable** (a box) and used it. A variable can also **change itself**.

Take a `store in box1` block. In its number slot, plug a `+` block from the Math palette. In the first slot of the `+`, put the `box1` block, and in the second slot, type a 1. Now `store in box1` does this, in order:

1. The `+` block looks inside `box1` and adds 1.
2. `store in box1` puts that answer back in `box1`.

If `box1` held 5, it holds 6 afterwards. Put that `store in box1` block inside a `repeat` and the variable **counts**: one more every lap.

<aside class="callout note" markdown="1">
**Is that a mistake?**

In math, a number can never equal itself plus 1. A program is different. The `+` block is always worked out first, using the number that is in the box now, and only then does the new number go in.
</aside>

## Watch a box count

Open the frame and press Run. The **Output** box at the top right of the drawing shows what the `print` block says. Here it prints `box1` on every lap, and the same number is the length of the side the turtle draws.

{% include turtlelab-embed.html sample="lesson-box-trace" title="A box that grows by 10 on every lap and prints itself" %}

Before you change anything, work out:

1. The box starts at 0. What does the first lap print? What does the last lap print?
2. Change the `10` in `box1 + 10` to a `5` and press Run. What does the last lap print now?
3. Change it back to 10, then change the `8` on the `repeat` to a 12. What does the last lap print?

<details markdown="1">
<summary>Check your answers</summary>

1. The first lap prints 10, because the box goes from 0 to 10 before it is printed. The last lap prints 80.
2. 40. Eight laps of 5 is 40.
3. 120. Twelve laps of 10.
</details>

## Trace a box on paper

Programmers follow a box by hand to see what a program does. Try it with this one, which multiplies instead of adds. Pretend you are the computer and write down what is in `box1` after every lap.

```
store in box1: 2
repeat 3
    store in box1: box1 × 2
    print box1
```

1. What does it print, lap by lap?
2. What would the last number be if the `repeat` said 5 instead of 3?

<details markdown="1">
<summary>Check your answers</summary>

1. It prints 4, then 8, then 16. The box starts at 2, and each lap doubles it.
2. 64. The five laps print 4, 8, 16, 32 and 64.
</details>

## Counting down

A box can count down too. This sample counts with `box1 - 1`.

{% include turtlelab-embed.html sample="countdown" title="Countdown: a box that counts down from 3" %}

1. What is in the box when the circle starts to draw?
2. Why does the circle wait until the numbers have finished?
3. Change the 3 in `store in box1` to a 5, but leave the `repeat` at 3. What does it print? Then change the `repeat` to 5 as well.

<details markdown="1">
<summary>Check your answers</summary>

1. 0. It started at 3 and lost 1 on each of three laps.
2. The `repeat` has to finish all of its laps before the blocks below it run.
3. With only 3 laps it prints 5, 4 and 3, then stops early. With a `repeat` of 5 it prints 5, 4, 3, 2 and 1. The number in the box and the number of laps are two separate numbers, so you have to change both.
</details>

## Make a spiral of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Make a spiral where each side is longer than the last. A box holds the length of the side. On every lap the turtle draws a side as long as `box1`, turns, and then makes `box1` bigger.

- Start with a turn of 90 and make the box 8 bigger each lap.
- Predict, then try a turn of 120. Then 60. What shapes do you get?
- Put the `store in box1` that makes the box bigger **inside** the `repeat`. If it is outside, it only happens once.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Make the turn change too. Use a second box, `box2`, that starts at 10 and grows by 2 each lap, and use `box2` as the number in `right`. Describe what you see.
