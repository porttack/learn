---
layout: lesson
title: "Teach the turtle a word"
pathway: turtlelessons
order: 8
source: original
---

In Step 2 you learned to say it once: a `repeat` runs the same blocks again and again. Now you will say it once in a different way.

Picture a flower with eight petals. Each petal is two curves and two turns, so four blocks. Eight petals the long way is 32 blocks. But the petals are all the same, so you could teach the turtle a **new word**, `petal`. Once it knows the word, one block draws a whole petal.

A word you teach the turtle is a **block of your own**. Programmers call it a **function**.

## How it works

Open the **My Blocks** palette and drag out the `to` block. It is a hat, like `start`.

- Tap the first box and type the **name**, like `petal`.
- Put blocks under it. Those blocks are what the word means.
- A new block called `petal` now shows up in My Blocks. Drag it into your program wherever you want a petal.

Nothing under `to` runs by itself. It only runs when your program **uses** the block, and then it runs once for each use.

## Teach it a size

Now the word needs to work for big petals and small petals. Tap the dashed `input` box on the `to` block and type a name, like `size`. Two things happen:

- Your `petal` block gets a place to type a number.
- A `size` block appears in My Blocks. Plug it in wherever the number belongs, like the number in `arc`.

An input is a lot like a box. It holds one number, and the number is put in for you each time the block is used. Use `petal 60` and `size` is 60 inside. Use `petal 30` and it is 30.

## Try it: three squares

The frame has a block called `square` with one input, `size`. The main program uses it three times.

{% include turtlelab-embed.html sample="own-block" title="A block called square, used three times with three sizes" %}

1. Which blocks are under the `to` block? What do they draw?
2. What is `size` the first time `square` is used? The second time? The third time?
3. How many lines does the turtle draw in all?
4. Change one of the three sizes and press Run. What changes in the drawing, and what stays the same?

<details markdown="1">
<summary>Check your answers</summary>

1. A `repeat` of four `forward` and `right` blocks, which draws one square. The `forward` uses the `size` block for its length.
2. 40, then 80, then 120. They are the numbers typed into the three `square` blocks.
3. 12. Three squares, four sides each.
4. Only that one square changes. The other two use their own numbers.
</details>

## A flower from one petal

Here is the flower. The petal is a block of your own.

{% include turtlelab-embed.html sample="lesson-own-flower" title="A flower drawn by using a block called petal eight times" %}

1. How many times does the main program use `petal`?
2. Change the `60` in the main program to 30. What changes?
3. After each petal the turtle turns 45. Why 45?
4. If you change the `repeat` from 8 to 6, what turn closes the flower?
5. Now find the `to petal` block and change the `120` inside it to 90. Press Run. How many petals changed?

<details markdown="1">
<summary>Check your answers</summary>

1. Eight times, because the `repeat` around it says 8.
2. All eight petals get smaller, because they all use the same `size`.
3. 8 petals times 45 is 360, a full circle, so the flower closes up. This is the same rule as turn = 360 ÷ number of sides.
4. 60, because 6 times 60 is 360.
5. All of them. You changed the word once, and every use of it changed. That is the real power of a block of your own: you can fix or improve something in one place.
</details>

## Make a word of your own

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Teach the turtle a word that draws a shape, and give it a `size` input. Triangle, square, star, hexagon: you choose. Then use your word three times with three different sizes. You will need to turn or move the turtle between the uses, or the shapes will sit on top of each other.

## See the Python

Use **Open full size** under the flower, then press the `>>>` button there. Your block became a Python function: a line that starts with `def petal(size):`. The blocks under it are indented. The main program calls it with `petal(60)`.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

Give a block **two** inputs, for example `petal size` and one more number that decides how wide the petal is. Add the second input by tapping the dashed `input` box again. A block can have two.
