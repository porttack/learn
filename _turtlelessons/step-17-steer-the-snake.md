---
layout: lesson
title: "Steer the snake"
pathway: turtlelessons
order: 17
unit: 4
source: original
---

In Step 14 a click drew something. Games listen to more than the mouse: they listen to the **keyboard**, and they keep moving **by themselves** while you think. Two more blocks in the Flow palette do that:

- **when [key] pressed** runs the blocks under it every time you press one key.
- **every [ ]** runs the blocks under it again and again, on a timer.

With them, and what you already know, you can make a snake.

## Try it: steer with the arrow keys

Click the paper once, so the frame knows the keys are for it. Then press the **up**, **left** and **right** arrow keys.

{% include turtlelab-embed.html sample="lesson-key-steer" title="Three key blocks: the up arrow walks the turtle and the left and right arrows turn it" %}

Before you press anything, work out:

1. You press the up arrow three times. How long is the line?
2. Then you press the left arrow once. Does the turtle move? What does it do?
3. Then you press the up arrow twice. Which way does the turtle walk, and how far?

Now try it and check.

<details markdown="1">
<summary>Check your answers</summary>

1. 60. Each press walks 20, and 3 × 20 is 60.
2. It does not move. It turns a quarter turn to the left, on the spot, because the left arrow only has a `left 90` block under it.
3. Left, which is the way the turtle was turned, and 40 far: two presses of 20.
</details>

## The two blocks

**when [key] pressed.** Tap the box on it and choose the key: the four arrows, space, enter, any letter or any digit. The blocks under it run every time you press that key. If you hold the key down it keeps running, like typing. You can have as many as you like, one for each key.

A program with one of these does not end after its last block. It waits for keys until you press **Stop**.

**every [ ].** The number is in tenths of a second, like `wait`: 10 is one second, 2 is a fifth of a second. The timer starts after the last block under **start** has run, and it keeps going until you press **Stop**.

## Try it: a program that moves by itself

Nothing to press here. Watch the spiral draw itself.

{% include turtlelab-embed.html sample="lesson-every-spiral" title="An every block that draws a growing spiral by itself" %}

Before you look closely, work out:

1. How many seconds are there between one tick and the next?
2. The first tick walks 8, and box1 grows by 8 each time. How far does the **third** tick walk, and what is in box1 after it?
3. What two changes would make the spiral grow faster?

<details markdown="1">
<summary>Check your answers</summary>

1. 0.3 of a second, because the number is 3 and it is in tenths.
2. The first tick walks 8 and makes box1 16. The second walks 16 and makes it 24. The third walks 24 and makes box1 32.
3. Make the number on **every** smaller, so the ticks come sooner. Or make the number added to box1 bigger, so each side is longer than the last by more.
</details>

The blocks under **every** take time to run, like any blocks. At the slow speeds each block waits before the next one. For a game, put a **speed** block set to 4 (instant) at the top of **start**, and the blocks under **every** run all at once.

## Catch the square, with a snake

Here is a whole game. The snake moves by itself. Steer it with the arrow keys. Eat the red square and the snake gets **fatter** and a new red square appears somewhere else. Go off the edge and it starts again.

Click the paper once so the frame hears your keys.

{% include turtlelab-embed.html sample="lesson-snake" title="A game: steer the snake with the arrow keys and eat the red squares" %}

The blocks are hidden in the frame to leave room for the game. Use **Open full size**, under the frame, to see them.

A real snake game remembers where every piece of its tail is. You only have four boxes, which is not enough for that, so this snake gets fatter instead of longer. For the same reason it cannot rub out a square it has eaten: it only remembers where the **newest** square is. The old ones stay on the paper.

## How does it work?

**The snake is the turtle.** The `every 2` block runs a `forward 20` five times a second. The four arrow keys each have a block that sets the heading: 0 is up, 90 is right, 180 is down and 270 is left.

**Remember where you were.** The red square is drawn by a block called `food`. To draw it the turtle has to walk to a new place, so it first puts where it is in two boxes (`x` into box3 and `y` into box4), and when the square is done it walks back with `set xy box3 box4`. box1 and box2 keep where the square is. That is all four boxes.

**Is the snake on the square?** It is the question from Step 16, asked every tick. The square's corner is at x = box1 and y = box2. The snake is on the square when it is **more than -30 and less than 60** away from the corner in x, **and** the same in y. The numbers are a little bigger than the square, because the snake moves 20 at a time and a thick line could otherwise jump right over it.

**Is the snake off the paper?** That is two `if` blocks, each with two questions joined with **or**: x is more than 330, or x is less than -330. Then, in the next `if`: y is more than 260, or y is less than -260. One yes in an `or` is enough.

Check it on paper. The square's corner is at x = 50 and y = -30.

1. The snake is at x = 70 and y = 10. Is it on the square?
2. The snake is at x = 70 and y = 50. Is it on the square? Which question says no?
3. The snake is at x = 10 and y = 10. Which question says no?
4. The snake is at x = 340 and y = 0. Which of the edge questions says yes?

<details markdown="1">
<summary>Check your answers</summary>

1. Yes. It is 20 right of the corner and 40 above it, and both are more than -30 and less than 60.
2. No. It is 20 right of the corner, which is fine, but 80 above it, which is not less than 60. The question about y says no.
3. The question about x. It is 40 left of the corner, so x minus box1 is -40, which is not more than -30.
4. `x > 330`. 340 is more than 330, so the `or` says yes and the snake starts again.
</details>

## Build it

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. The frames above do not keep your work.

Two blocks of your own do the heavy work. The first draws a red square somewhere new and comes back:

```
to food
    store in box3: x
    store in box4: y
    pen up
    set xy (random -300 240) (random -220 130)
    store in box1: x
    store in box2: y
    set color 255 0 0
    start fill
    repeat 4
        forward 40
        right 90
    end fill
    set color 0 150 0
    set xy box3 box4
    pen down
```

The second starts the game again from the middle:

```
to restart
    clean
    set pen size 8
    pen up
    set xy 0 0
    set heading 90
    pen down
    food
```

The rest is the shape of your program. The words in brackets are for you to build:

```
start
speed 4
clean
restart

when up arrow key pressed
    set heading 0
(the same for right arrow with 90, down arrow with 180, left arrow with 270)

every 2
    forward 20
    if (is x past an edge? x > 330 OR x < -330)
        restart
    if (is y past an edge? y > 260 OR y < -260)
        restart
    store in box3: (how far right of the square's corner is the snake?)
    store in box4: (how far above the square's corner is the snake?)
    if (is box3 more than -30 AND less than 60?)
        if (is box4 more than -30 AND less than 60?)
            set pen size (pen size + 4)
            food
```

Build in small pieces and run after each one:

1. Start with only `start`, `set heading 90` and an `every 2` with `forward 20` under it. Press Run. Does the turtle walk by itself?
2. Add the four `when key pressed` blocks. Press Run, click the paper once, and steer.
3. Make `food` work **on its own**: put it under `start`, press Run, and press Run again. Does the square move each time?
4. Add the two `if` blocks with the `or` for the edges, and make `restart`.
5. Add the two `store` blocks and the two `if` blocks that eat the square.

Press Run, click the paper, and play.

<aside class="callout note" markdown="1">
**When something is not working**

- Nothing happens when you press a key? Check that you pressed Run, that the message says the program is listening, and that you clicked the paper once so the page is listening to the keyboard.
- The snake does not move by itself? An `every` block does nothing until the last block under **start** has run. Check for a `forever` or a `wait` that never ends.
- The snake crawls? Put `speed 4` under **start**.
- A **red outline** means that block has a problem. An `every` with an empty box, or a number smaller than 0.5, stops the program and says so.
- Clicking a **when** block or an **every** block only tells you what it is for. Press Run and the keys do the rest.
- Not what you pictured? Use the four steps from Step 11: run it, say what you expected, find the difference, then change **one** thing.
</aside>

## Check yourself

Before you save, check that:

- The snake moves by itself, and the arrow keys turn it.
- Eating the red square makes the snake fatter and a new square appears.
- Going off the paper starts the game again.
- Your program uses a `when key pressed` block, an `every` block, an `and` and an `or`.
- You made two blocks of your own, and your program uses them.
- You added a sticky note with your name that says, in your own words, what `every` does in your game.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

Then press Run, click the paper, steer the snake and eat a few squares, and press the **PDF** button. Your blocks, your note and the paper are on the first page. The last page lists what your program is made of, with a count of each kind of block. Look at it. Does it match what you meant to build? Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**Different keys.** Choose **w**, **a**, **s** and **d** in the key boxes, so you steer with your left hand.

**Turn around.** Add a `when space key pressed` block with one block under it that turns the snake around, `right 180`.

**Rub out the old square.** Draw a white square, with `set color 255 255 255`, on top of the old one before you draw the new one. What happens to the snake's line? Why?

**Wrap around.** Instead of starting over at the edge, send the snake to the other side. Put `pen up` before the `set xy` and `pen down` after it, so it does not draw a line right across the paper.

**A bigger meal.** Make the snake fatter by more than 4, or make it change color each time it eats: `set color 0 (pen size × 3) 0`.

**Your own game.** Use `when key pressed` and `every` for something that is not a snake: a ball that bounces, a turtle that runs away from a square, a drawing you steer.
