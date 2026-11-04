---
layout: lesson
title: "Your initials"
pathway: turtlelessons
order: 1
source: original
---

A computer does exactly what you tell it, in the order you tell it, and nothing else. It will not guess what you meant. In this step you give a turtle exact steps to draw your initials. It is a small first project, and it ends with a PDF of your work.

The plan on paper is what makes this fast. People who plan first finish early. People who skip it spend the whole time fixing.

<aside class="callout note" markdown="1">
**Keep your work in a fresh tab**

Open TurtleLab with this link: <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a>. It opens in a new tab, so you can keep this page next to it. This tab remembers your blocks if you refresh. (The sample tabs you open later do not, so press Ctrl+S now and then in those.)
</aside>

## How the turtle thinks

The turtle's paper has an x and a y, like a graph. The middle of the paper is (0, 0). **One thing to watch: y goes up.** A bigger y is higher on the page, like on a graph.

The turtle also faces a direction, called its **heading**.

| Heading | The turtle faces |
|---|---|
| 0 | up |
| 90 | right |
| 180 | down |
| 270 | left |

`right 90` adds 90 to the heading. `left 90` subtracts 90. (360 is the same as 0, because it is a full turn.)

When the **pen is down**, moving draws a line. When the **pen is up**, the turtle moves without drawing.

## Build an L

The round buttons on the left open the palettes of blocks. Point at a button to see its name: Turtle, Pen, Math, Flow, Boxes, My Blocks and Notes.

Open a palette, drag a block out, and snap the next one under it. Build this stack, top to bottom. Tap a number on a block to change it.

| Block | Palette | Numbers |
|---|---|---|
| `start` | Flow | |
| `clean` | Turtle | |
| `pen up` | Pen | |
| `set xy` | Turtle | x: -150, y: 60 |
| `set heading` | Turtle | 180 |
| `pen down` | Pen | |
| `forward` | Turtle | 120 |
| `left` | Turtle | 90 |
| `forward` | Turtle | 60 |

**Before you press Run:** the turtle starts at (-150, 60) facing down. Where will it end up, and which way will it face? Write your prediction down, then press Run and check. Look at the turtle's nose.

<aside class="callout note" markdown="1">
**Why `clean` and `pen up` come first**

`clean` wipes the paper and puts the turtle back in the middle, so every run starts the same way. `pen up` lets the turtle walk to the start of the letter without drawing a line there.
</aside>

## Plan your initials

Sketch your initials on this grid with straight lines first. It is the same size as the turtle's paper, and the numbers are the x and y you type into `set xy`. A letter about 120 tall works well. Print this page, or copy the grid onto your own paper.

{% include turtle-grid.html %}

For each letter, write down where the turtle starts, which way it faces, and the moves, like `forward 120, left 90, forward 60`. Then you are ready to build.

## Build your initials

Build one letter at a time, and tap its stack to test it before you start the next one.

Between letters, the turtle has to travel without drawing. You already know the four blocks for that from the L: `pen up`, `set xy`, `set heading`, `pen down`.

When your initials are done, draw a square frame around them. Then count: how many blocks did the frame take? Remember that number. You will see it again in Step 2.

## Check yourself

- Every initial can be read by someone who has not seen your plan.
- There are no stray lines between your letters.
- You predicted where the L would end and which way it would face, and you checked.

## Make your PDF

Add a sticky note first: open the Notes palette, drag out a note, tap it and type your name.

Then press the **PDF** button on the toolbar. It saves a one page PDF with your blocks and note on top and your drawing underneath, with the turtle drawn where it stopped.

Keep your PDF. To get your blocks back later, press Open in TurtleLab and choose the PDF, or drag the PDF onto the page.

## Done early?

**Curves.** Letters like C, O, S, D, B and U have curves. Use the `arc` block (Turtle palette). It takes an angle and a radius. A positive angle curves right and a negative angle curves left. Find out what an `arc` of 180 with a radius of 50 looks like, then use arcs in your letters.

**Color.** Give each letter its own color. The `set color` block (Pen palette) takes red, green and blue, each from 0 to 255. Red is 255, 0, 0. Black is 0, 0, 0. White is 255, 255, 255. Mix your own.
