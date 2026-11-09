---
layout: lesson
title: "Variables: boxes that keep a number"
pathway: turtlelessons
order: 6
unit: 2
source: original
---

So far you have typed every number right into a block: `forward 100`, `right 90`. That works, until you want a bigger picture. Then you hunt for every number that meant "the size" and change each one, and you miss one.

There is a better way. Keep the number in **one place**, and let every block ask for it. A place that keeps a value like this has a name in programming: a **variable**. It is called a variable because the value in it can **vary**: it can change while the program runs.

## Variables in TurtleLab are boxes

TurtleLab draws a variable as a **box**, because a box is a good way to think about one:

- A box has a **name** on its lid. A variable has a name too.
- A box holds **one** thing. A variable holds one value.
- You can **look inside** a box whenever you like, and looking does not empty it.
- If you **put something new in**, the old thing is gone.

TurtleLab has four variables, named `box1`, `box2`, `box3` and `box4`. They live in the yellow **Boxes** palette, and two kinds of block use them:

- `store in box1` is a command, like `forward`. It has a number slot on its right, and **the number in that slot is what goes into the box**.
- `box1` is a round yellow block. It stands for **whatever number is in the box right now**. You can plug it into any number slot, anywhere you could have typed a number.

## Watch a variable change

The frame below is a real TurtleLab, and its program is slow on purpose, so you can see every block run. The block that is running lights up. The yellow strip at the bottom right of the drawing shows what is in each box. The **Output** box at the top right shows what a `print` block says. (Press **Run** to watch it again, or **Start over**.) Nothing you do in the frame is saved, and **Open full size** opens it in a tab of its own.

{% include turtlelab-embed.html sample="lesson-box-steps" title="A slow program that stores numbers in box1 and prints it, one block at a time" %}

First look at the blocks, and **predict** before you watch:

1. The first `store in box1` has a 40 in its slot. What is in `box1` after it runs?
2. The next two `store in box1` blocks each have a `+` block in their slot: `box1` plus 10. What is in `box1` after both have run?
3. The two `print` blocks come next. What does each one print? Does printing change what is in the box?
4. The next `store in box1` has a 100 in its slot. What happens to the number that was in the box before?
5. The last block is `forward` with the `box1` block in its slot. How long is the line the turtle draws?

Now press Run and watch the strip and the Output box. Were you right?

<details markdown="1">
<summary>Check your answers</summary>

1. 40.
2. 60. The first `+` block works out 40 plus 10, which is 50, and stores it. The second works out 50 plus 10 and stores 60. Each time, the block works out the answer first, and only then puts it in the box.
3. Each prints 60. Printing only looks inside the box. It does not change it.
4. The 60 is gone. A variable holds one value, so storing a new one replaces the old one. The box now holds 100.
5. 100, because `box1` stands for the number in the box, and that is 100 now. (The Output box shows 60, 60 and 100, from the three `print` blocks.)
</details>

That is everything a variable does:

- It holds **one** value.
- **Storing** a value replaces whatever was there.
- **Looking** at it (using the `box1` block) does not change it.

## Try it: a house from one variable

In this frame, one variable sizes a whole house. Change a number, press **Run**, and look at the drawing.

{% include turtlelab-embed.html sample="lesson-box-house" title="A house drawn from one variable, box1" %}

Work through these, one at a time:

1. Find the `store in box1` block. What number is in its slot? The yellow strip shows what is in each box.
2. Count the `forward` blocks that have the yellow `box1` block in their slot. How many are there?
3. Change the 80 in `store in box1` to 120 and press Run. How long is every side of the house now?
4. Change it to 50 and press Run. How many numbers did you have to change?

<details markdown="1">
<summary>Check your answers</summary>

1. 80.
2. Three: the `forward` in the walls, the `forward` that climbs to the roof, and the `forward` in the roof.
3. 120. The walls and the roof are all 120 long, because they all ask the same variable.
4. One. Without a variable you would have had to find and change three numbers, and the house would look wrong if you missed one.
</details>

## A variable can do the math too

In Step 2 you found that **turn = 360 ÷ number of sides**. Here the program works that out by itself, because the number of sides is in a variable.

{% include turtlelab-embed.html sample="polygon" title="Any polygon, with its number of sides in the variable box1" %}

1. Change the 5 in `store in box1` to 3, then 6, then 12. Press Run each time.
2. Find the two blocks that use `box1`. What does each one do with it?
3. Why does one number in one variable make the shape close up every time?

<details markdown="1">
<summary>Check your answers</summary>

2. The `repeat` uses it as the number of sides. The turn uses it inside the `÷` block, as `360 ÷ box1`.
3. Both blocks use the same variable, so they can never disagree. If you typed the sides and the turn in separately, you could give them numbers that do not go together, and the shape would not close.
</details>

## Build one of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Make a program that draws a square whose size is kept in a variable. You need `store in box1` and `box1` (Boxes palette), and `repeat`, `forward` and `right` (Flow and Turtle palettes). Run it. Then change one number and run it again to get a bigger square.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Use **two** variables: `box1` for the size and `box2` for the number of sides. Make a shape that can be any size with any number of sides by changing only the two stored numbers. You will need a `÷` block (Math palette) for the turn.
