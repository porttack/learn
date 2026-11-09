---
layout: lesson
title: "Catch the square"
pathway: turtlelessons
order: 16
unit: 4
source: original
---

In Step 14 a click drew something. A game has to do more than that: it has to decide whether the click **hit** something. That is a yes or no question, and the `if` block is how a program asks one.

One question is often not enough. A click is inside a stripe only if it is **more than the left edge and less than the right edge**. That is two questions, joined together. Three blocks in the Math palette join them: **and**, **or** and **not**.

## Try it: inside the stripe

The frame has a red stripe, and numbers along the paper that say x. Click inside it, then click outside it. A ring opens where you click, so you can see where the program heard you. The Output box at the top right prints where you clicked (the x), and then **1** if the click is inside the stripe or **0** if it is not.

{% include turtlelab-embed.html sample="lesson-click-and" grid="numbers" title="A red stripe, and a program that prints 1 when a click is inside it and 0 when it is not" %}

Before you click, work out:

1. You click at x = 160. Is `mouseX > 100` yes or no? Is `mouseX < 220` yes or no? What does `and` say, and what gets printed?
2. You click at x = 300. Which of the two questions is no? What does `and` say?
3. You click at x = 50. Which question is no this time? What gets printed?

Now click in the middle of the stripe, to the left of it and to the right of it, and check.

<details markdown="1">
<summary>Check your answers</summary>

1. Both are yes, so `and` says yes, and the program prints 1.
2. `mouseX < 220` is no, because 300 is not less than 220. One no is enough to make `and` say no, so it prints 0.
3. `mouseX > 100` is no, because 50 is not more than 100. It prints 0.
</details>

## and, or and not

- **and** says yes only when **both** of its questions are yes.
- **or** says yes when **at least one** of its questions is yes (or both).
- **not** flips one answer: yes becomes no, and no becomes yes.

| first question | second question | and | or |
|---|---|---|---|
| yes | yes | yes | yes |
| yes | no | no | yes |
| no | yes | no | yes |
| no | no | no | no |

Their holes are pointed, like the one in `if`. A yes or no block fits (less than, greater than, equals, or another `and`, `or` or `not`) and a number block does not. So an `and` can hold another `and` when you need three or four questions.

## Try it: outside the stripe

This frame has the same stripe, but it asks the question the other way round, with **or**: a click is outside the stripe if it is **less than 100 or more than 220**. This time it prints **1** for a click outside the stripe, and **0** for a click inside.

{% include turtlelab-embed.html sample="lesson-click-or" grid="numbers" title="The same red stripe, with a program that prints 1 when a click is outside it" %}

Before you click, work out:

1. You click at x = 160. Is `mouseX < 100` yes or no? Is `mouseX > 220` yes or no? What does `or` say?
2. You click at x = 300. What does `or` say now, and why?
3. A `not` around the `and` from the first frame gives the opposite answer. For the click at x = 160, what does `and` say, and what does `not` of it say?

<details markdown="1">
<summary>Check your answers</summary>

1. Both are no, so `or` says no, and the program prints 0.
2. `mouseX > 220` is yes. One yes is enough to make `or` say yes, so it prints 1.
3. `and` says yes, so `not` of it says no.
</details>

## Catch the square

Here is a whole game. A red square sits at a random place. Click inside it to score a point, and it jumps somewhere else. Your score is in **box1**, and the yellow strip at the bottom right shows it.

{% include turtlelab-embed.html sample="lesson-click-game" title="A game: click inside the red square to score, and it jumps to a new place" %}

The blocks are hidden in the frame to leave room for the game. Use **Open full size**, under the frame, to see them.

## How does it know the click hit the square?

A square is two stripes that cross: one standing up (the columns it covers) and one lying down (the rows it covers). A click is inside the square only if it is inside **both** stripes.

Say the square's bottom left corner is at x = box2 and y = box3, and the square is 60 wide and 60 tall.

- `mouseX - box2` says how far **right** of the corner the click is. The click is in the square's columns when that is **more than 0 and less than 60**.
- `mouseY - box3` says how far **above** the corner the click is. The click is in the square's rows when that is **more than 0 and less than 60**.

Check it on paper. The corner is at x = 50 and y = -30.

1. You click at x = 80 and y = 10. Is the click in the square?
2. You click at x = 80 and y = 50. Is the click in the square? Which question says no?
3. You click at x = 40 and y = 10. Which question says no?

<details markdown="1">
<summary>Check your answers</summary>

1. Yes. The click is 30 right of the corner and 40 above it, and both are more than 0 and less than 60.
2. No. It is 30 right of the corner, which is fine, but 80 above it, which is not less than 60. The question about mouseY says no.
3. The question about mouseX. The click is 10 left of the corner, so `mouseX - box2` is -10, which is not more than 0.
</details>

## Build it

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

The square needs a block of its own, so it can be drawn again every time it jumps:

```
to target
    clean
    store in box2: random -300 240
    store in box3: random -220 130
    pen up
    set xy box2 box3
    pen down
    start fill
    repeat 4
        forward 60
        right 90
    end fill
```

`clean` wipes the old square off the paper. The two `random` blocks pick where the new one goes, and `box2` and `box3` remember it so the click can be checked against it.

The rest is the shape of your program. The words in brackets are for you to build:

```
start
clean
store in box1: 0
target

when paper clicked
    store in box4: (how far right of the corner is the click?)
    if (is that more than 0 AND less than 60?)
        store in box4: (how far above the corner is the click?)
        if (is that more than 0 AND less than 60?)
            (add 1 to the score in box1)
            (jump the square)
```

Build in small pieces and run after each one:

1. First make `target` work **on its own**. Put it under `start`, press Run, then press Run again. Does the square move each time?
2. Add `when paper clicked`, with the first `store in box4` and a `print box4` under it. Press Run and click. Does the Output box say how far right of the corner you clicked?
3. Add the outer `if` with `and`, and a `print 1` inside it. Click in the square's columns, above and below the square. Does it print 1?
4. Add the second `store` and the inner `if`. Then replace the `print` with the score and the jump.

Press Run, and click the square.

<aside class="callout note" markdown="1">
**When something is not working**

- Nothing happens when you click? Check that you pressed Run, that the message says the program is listening, and that you clicked the paper and not a block.
- A **red outline** means that block has a problem. If it is an `and` with an empty hole, plug a yes or no block into every hole.
- The square jumps but the score does not go up? Look at the yellow strip. Is the `store in box1` inside the inner `if`, and does it add 1 to box1?
- Clicks near the edge do not count, because the test says more than 0 and less than 60, not exactly 0 or 60. That is fine.
- Not what you pictured? Use the four steps from Step 11: run it, say what you expected, find the difference, then change **one** thing.
</aside>

## Check yourself

Before you save, check that:

- The square jumps to a new place after every hit, and not after a miss.
- Your score in box1 goes up by 1 for each hit.
- Your `if` uses `and` to ask two questions at once.
- You made a block of your own, and your program uses it twice.
- Your picture has a `repeat`.
- You added a sticky note with your name that says, in your own words, what `and` does in your game.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

Then press Run, catch the square a few times, and press the **PDF** button. Your blocks, your note and the paper are on the first page. The last page lists what your program is made of, with a count of each kind of block. Look at it. Does it match what you meant to build? Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**One question, not two.** Use one `if` with an `and` that holds two more `and` blocks, so all four questions are asked at once. Use `mouseX` and `mouseY` directly, like `mouseX > box2`. Then you do not need box4 at all.

**Lose a point for a miss.** With the one `if` above, change it to `if` with an `else`, and take 1 off box1 when the click misses.

**Change the size in one place.** Keep the size of the square in box4 and use it in the `forward` block and in every question. Now you can make the game harder by changing one number.

**The same question with not.** Start with an `if` that asks if the click hit the square. Then ask the opposite with a `not` around it, and draw a small dot wherever a click misses.
