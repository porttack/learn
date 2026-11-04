---
layout: lesson
title: "Say it once"
pathway: turtlelessons
order: 2
source: original
time: 50
grouping: "On your own"
materials: "Chromebook, pencil, activity sheet"
organizer: /turtle-lessons/activity-sheet/
organizer_label: "Activity sheet"
---

The frame around your initials took a lot of blocks: `forward` and `right`, four times over. Computers are very good at repeating things, so you only have to say it once.

The block for that is `repeat` (Flow palette). It runs the blocks inside it again and again.

## Try a sample

Open the <a href="{{ '/turtlelab/?sample=square' | relative_url }}" target="_blank" rel="noopener">Square sample</a>. It opens in a new tab and draws by itself.

<aside class="callout note" markdown="1">
**This tab will not remember changes**

A sample tab never saves anything, so a refresh puts the sample back. Press Ctrl+S to keep a copy of something you want to keep.
</aside>

Look at the blocks. The ones **inside** the `repeat` are the ones that repeat. The number on the `repeat` says how many times.

1. Change the 4 on the `repeat` to a 3 and press Run. What shape did you get? Is it a triangle? Why not?
2. The square's turn is 90. Fill in the shapes table on your activity sheet. Find the turn that makes each shape close up, then test it.

The pattern you are looking for: to come back to where it started, facing the same way, the turtle must turn one full circle, **360 degrees**, all together. So:

**turn = 360 ÷ number of sides**

Check it with the square: 360 ÷ 4 is 90.

## A ring of dashes

Open the <a href="{{ '/turtlelab/?sample=dotted-circle' | relative_url }}" target="_blank" rel="noopener">Dotted circle sample</a>.

The loop draws a short dash, lifts the pen, moves a little, and turns. Before you change anything, answer on your activity sheet: the loop runs 36 times and turns 10 each time. What is 36 × 10, and why does that number make sense?

Then change it: set the loop to 72 and the turn to a number that still makes a full ring. Predict the turn first, then try it.

## Take it further

<aside class="callout challenge" markdown="1">
**CHALLENGE: SAY IT ONCE**

Go back to your initials. Open the PDF you saved in Step 1 (press Open, or drag the PDF onto a fresh TurtleLab tab). Replace the blocks that draw your frame with one `repeat`. Count how many blocks you saved and write it on your activity sheet.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: A BORDER YOU COULD NOT DRAW BY HAND**

Use `repeat` to draw something around your initials that would be a pain to draw by hand: a ring of dots, a star, or a shape with 12 sides. The tools you need are `repeat`, `pen up`, `pen down` and `set color`.

If you want a star: it is five lines, and the turns add up to 720, which is two full circles. What does each turn have to be? Work it out, then test it.
</aside>

## See the Python

Press the `>>>` button in TurtleLab. It shows your blocks as Python. Find your `repeat`. You will see a line that starts with `for _ in range(`. That is a Python loop, and it does the same thing as your block.

## Hand it in

Press the **PDF** button and turn it in the way your teacher says. Your blocks and your drawing are both on the page.
