---
layout: lesson
title: "Teach the turtle a word"
pathway: turtlelessons
order: 8
unit: 2
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

Warm up first. Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Teach the turtle a word that draws a shape, and give it a `size` input. Triangle, square, star, hexagon: you choose. Then use your word three times with three different sizes. You will need to turn or move the turtle between the uses, or the shapes will sit on top of each other.

## Your name, again

In Step 1 you built letters one line at a time. Now every letter can be a word the turtle knows, and your name is just those words in order.

Here is a B drawn two ways, each a block of its own. The main program only says which letter, and where. Press Run and watch.

{% include turtlelab-embed.html sample="lesson-b-two-ways" grid="numbers" title="A B drawn with straight lines and a B drawn with arcs, each a block of its own" %}

1. How many blocks are inside each B? Which one took fewer?
2. Four blocks come before each B in the main program. Which four, and what do they do?
3. Change the 0 in the `set heading` just above the curved B to 90, and press Run. What happens to the B, and why? (**Start over** puts it back.)

<details markdown="1">
<summary>Check your answers</summary>

1. The straight B has 15 blocks and the curved B has 9. An `arc` draws a whole round bowl in one block.
2. `pen up`, `set xy`, `set heading` and `pen down`, the same four you used between letters in Step 1. The pen goes up so nothing is drawn on the way. `set xy` picks the place. `set heading` makes the turtle face up. The pen goes down to draw.
3. The whole B turns a quarter turn to the right, and its spine runs sideways. A letter block draws in whatever direction the turtle is facing. The turtle ends the first B facing left, so without a `set heading` the second one would come out turned too. Every letter starts facing up, which is heading 0.
</details>

Now spell your name. Use your first name, or the letters you like from it if it is long.

1. Make one block of your own for each **different** letter. A letter that comes twice, like the A in ANNA, only needs one block: ANNA is two blocks, A and N, used four times.
2. A letter block draws from **where the turtle is**. It starts at the same corner of the letter and faces the same way every time (the B above starts at its bottom left, facing up). Do not put `set xy` inside a letter block. A letter that always jumped to the same place would land on top of the last one.
3. In the main program, write the name: for each letter, the four blocks that travel, then the letter.
4. Give every letter a color of its own. Put a `set color` block (Pen palette) before a letter block to color that one use, or inside the letter block to make that letter always the same color. What changes if you move it?

You can start from your Step 1 PDF: press Open in TurtleLab, choose it, and move each letter's blocks under a `to` block. A letter 120 tall and 60 wide, with 20 between letters, takes 80 across, and the paper is 700 wide, so it holds eight letters if the first starts at x = -320.

## Check yourself

- Every different letter in your name is a block of your own, and a letter that comes twice uses the same block.
- No letter block has a `set xy` inside it.
- Every letter has a color of its own.
- You built every letter yourself, with no `write` block.
- Someone who has not seen your blocks can read your name.

## Save your work

Press the **PDF** button to keep a copy of your blocks and your drawing.

## Done early?

**Two inputs.** Give a block **two** inputs, for example `petal size` and one more number that decides how wide the petal is. Add the second input by tapping the dashed `input` box again. A block can have two.

**A size for every letter.** Give each letter block an input called `size` and use it in the numbers, with the Math blocks: `size` for the height, `size ÷ 2` for half of it. Then write your name at two sizes.

**Angled letters.** A B can have angled lines too. This E and B get from one letter to the next without `set xy`: the turtle walks. Press Run and watch it between them.

{% include turtlelab-embed.html sample="lesson-b-diagonal" title="An E and a B made of angled lines, with the turtle walking between them" %}

Which blocks take the turtle from the E to the B? How is that different from the four you used before?

<details markdown="1">
<summary>Check your answer</summary>

`pen up`, `forward 20`, `left 90` and `pen down`. The E ends facing right, so the turtle walks 20 along the paper, turns left to face up, and the B can start. `set xy` always lands in the same place. Walking only works when you know where the last letter ended and which way the turtle faces. Use whichever you like for your name.
</details>

**A whole alphabet to read.** Open <a href="{{ '/turtlelab/?sample=initials-lines' | relative_url }}" target="_blank" rel="noopener">A, B and C with straight lines</a> or <a href="{{ '/turtlelab/?sample=initials-curves' | relative_url }}" target="_blank" rel="noopener">A, B and C with curves</a>. Each letter is a block, and a block called `place` with two inputs, x and y, does the travelling. Look at the A if your name has slanted lines.
