---
layout: lesson
title: "Project: random art"
pathway: turtlelessons
order: 5
source: original
time: 70
grouping: "On your own"
materials: "Chromebook, pencil, activity sheet"
organizer: /turtle-lessons/activity-sheet/
organizer_label: "Activity sheet"
---

You now have three tools. A **loop** repeats. **Random** brings in chance. **If and else** makes a decision. Today you use all three in one piece of art that is yours.

Nobody will make the same picture as you, because you choose what repeats, what is random, and what gets decided.

## Pick a theme

Choose one, or invent your own and check it with your teacher.

- **Night sky.** Stars at random places. A decision makes some stars big and bright and the others small and dim.
- **Confetti party.** Dots at random places. A decision picks between two team colors.
- **Wandering path.** A turtle that walks and turns by chance, and a decision that picks the turn and the color. Try `fill screen` first to make a dark background.

## Plan it

On your activity sheet, sketch what you imagine the finished picture looks like. Then finish these three sentences:

- My program repeats ______ times.
- Each time, random picks ______.
- The if and else decides ______.

**Show your plan to your teacher or the substitute and get it initialed before you build.** Any honest plan counts.

## The shape of your program

Every project has this shape. Your job is to decide what goes in the gaps.

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

## Your checklist

Your teacher will open your PDF and check each one. The same checklist is on your activity sheet.

<table class="checkoff">
  <thead>
    <tr><th></th><th>What</th><th>Points</th></tr>
  </thead>
  <tbody>
    <tr><td class="checkbox-cell">&#9744;</td><td>Plan and three sentences, initialed</td><td>1</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td>A <code>repeat</code> that draws part of your picture</td><td>2</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td><code>random</code> is used somewhere you can see in the picture</td><td>2</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td>An <code>if</code> with an <code>else</code> that changes something you can see</td><td>2</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td>At least two colors</td><td>1</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td>A sticky note with your name, and one or two sentences saying what your loop, your random and your if and else each do</td><td>1</td></tr>
    <tr><td class="checkbox-cell">&#9744;</td><td>Your PDF turned in</td><td>1</td></tr>
  </tbody>
</table>

The sticky note is in the Notes palette. Tap it to type. It shows up on your PDF.

## Hand it in

1. Make sure your sticky note has your name on it.
2. Press the **PDF** button. Your blocks, your note and your drawing are all on the page.
3. Turn it in the way your teacher says. If you save again later, the newest one counts.
4. If you share this computer, press New so the next person starts fresh.

## Going further

Done early? Pick any of these:

<aside class="callout challenge" markdown="1">
**CHALLENGE: SIGN YOUR WORK**

Draw your initials small in a bottom corner of your picture. Your plan from Step 1 lists the moves, so make the letters small by using smaller numbers.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: SOMETHING THAT GROWS**

Open the <a href="{{ '/turtlelab/?sample=spiral' | relative_url }}" target="_blank" rel="noopener">Square spiral sample</a>. It uses a **box** (a variable) that grows each time the loop runs. Read how `box1` works, then use a box in your picture so something gets bigger or smaller each time through.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE: PREDICT AND CHECK**

Explain your program to a neighbor without showing them the picture. Ask them to describe what it will draw. Then press Run together. Where was the picture different from what they said, and why?
</aside>
