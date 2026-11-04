---
layout: lesson
title: "Capstone: random art"
pathway: turtlelessons
order: 5
source: original
organizer: /turtle-lessons/planning-sheet/
organizer_label: "Print the planning sheet"
---

You now have three tools. A **loop** repeats. **Random** brings in chance. **If and else** makes a decision. In this capstone you use all three in one piece of art that is yours.

Nobody will make the same picture as you, because you choose what repeats, what is random, and what gets decided.

<aside class="callout note" markdown="1">
**Build in a fresh tab**

Open <a href="{{ '/turtlelab/' | relative_url }}" target="_blank" rel="noopener">TurtleLab</a> in a new tab and build there. Do not build in a sample tab. A sample tab does not save your work, so a refresh would put the sample back and lose your blocks.
</aside>

## What you will build

A picture drawn by a loop, with something random in it and something decided by an if and else. It has at least two colors. A sticky note on the page says what it all does, in your own words. The list at the end of this page shows what to check.

## Pick a theme

Choose one, or invent your own.

- **Night sky.** Stars at random places. A decision makes some stars big and bright and the others small and dim.
- **Confetti party.** Dots at random places. A decision picks between two team colors.
- **Wandering path.** A turtle that walks and turns by chance, and a decision that picks the turn and the color. Try `fill screen` (Pen palette) first to make a dark background.

## Plan it

Sketch on paper what you imagine the finished picture looks like. You can <a href="{{ '/turtle-lessons/planning-sheet/' | relative_url }}">print the planning sheet</a> and sketch on that.

Then finish these three sentences:

- My program repeats ______ times.
- Each time, random picks ______.
- The if and else decides ______.

If you can fill in all three sentences, you are ready to build. If you cannot, go back to your sketch.

## The shape of your program

Every capstone has this shape. Your job is to decide what goes in the gaps.

```
start
clean
repeat (how many times?)
    (something random: a place, a size, a color, a turn)
    if  (a yes or no question about a random number)
        (one thing happens)
    else
        (the other thing happens)
    (draw something)
```

## Build it

Build in small pieces and run after each one:

1. First, a `repeat` that draws one thing, with no random yet.
2. Then plug in `random` where you want chance.
3. Last, add the `if` and `else`, and put something visible in each mouth.

If your picture is slow to draw, add a `speed` block (Flow palette) near the top. Speed 4 is instant.

<aside class="callout note" markdown="1">
**When something is not working**

- A **red outline** means that block has a problem. Read the message under the drawing.
- Nothing happens? Check that your blocks are snapped under `start`.
- Not what you pictured? Change one number at a time and run it again. The Stop button always works, and Ctrl+Z undoes a mistake.
</aside>

## Check yourself

Before you save, check that:

- Your picture has a `repeat` that draws part of it.
- You can see `random` at work in the picture. Run it twice. Does it change?
- Your `if` and `else` changes something you can see, like a color, a size, or a turn.
- Your picture has at least two colors.
- Your sticky note has your name. It says, in your own words, what your loop, your random, and your if and else each do.

## Make your PDF

Add the sticky note: open the Notes palette, drag out a note, tap it and type. A sticky note holds about 300 letters, so keep it short.

Then press the **PDF** button. Your blocks, your note and your drawing are all on the page. Keep your PDF. If you share this computer, press New when you are done so the next person starts fresh.

## Done early?

**Something that grows.** Open the <a href="{{ '/turtlelab/?sample=spiral' | relative_url }}" target="_blank" rel="noopener">Square spiral sample</a>. It uses a **box** (a variable) that grows each time the loop runs. Read how `box1` works, then use a box in your picture so something gets bigger or smaller each time through.
