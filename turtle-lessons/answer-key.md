---
layout: minimal
title: "TurtleLab Lessons answer key"
permalink: /turtle-lessons/answer-key/
sitemap: false
---

# TurtleLab Lessons answer key

**Step 1.** The L starts at (-150, 60) facing down (heading 180). It ends at (-90, -60), facing right (heading 90). A square frame takes 8 blocks: four `forward` and four `right`.

**Step 2.** Turns that close each shape (repeat, turn): triangle 3, 120. Pentagon 5, 72. Hexagon 6, 60. Octagon 8, 45. 12 sides: 12, 30. The turns of a closed shape add up to 360 because the turtle has to make one full turn to face the way it started. A square takes 8 blocks the long way and 3 with `repeat` (the `repeat`, one `forward`, one `right`). Dotted circle: 36 × 10 = 360. With 72 repeats the turn is 5.

**Step 3.** The second picture does not match the first (the colors are random). Smallest 0, largest 255. 50 × 7.2 = 360, a full circle. With 100 rays the turn is 3.6. Two runs of the confetti do not match, because the places and colors are random.

A confetti that works:

```
start
clean
set pen size 30
repeat 60
    pen up
    set xy (random -350 350) (random -280 280)
    pen down
    set color (random 0 255) (random 0 255) (random 0 255)
    forward 1
```

**Step 4.** When the number is 1 the turtle turns right (90). In the `else` it turns left (90). It cannot do both and cannot do neither. Three runs differ, because `random` flips differently each time. Trace headings after each flip: 90, 180, 90, 180, 90, 0. The unfair coin: `random 1 4 = 1` (or `random 1 4 < 2`) in the pointed slot, with right in the top mouth.

**Step 5.** Nothing to check by number. The student page lists five things: a repeat that draws part of the picture, random that can be seen at work (two runs differ), an if and else that changes something visible, at least two colors, and a sticky note with their name and what the loop, the random and the if and else each do.

**Step 6.** The slow program (`lesson-box-steps`): after the first `store in box1` it holds 40; after the two `store in box1` blocks with a `+ 10` in the slot it holds 50, then 60; the two `print box1` blocks both print 60 and change nothing; `store in box1` with 100 replaces the 60 (it is gone); the last `print` prints 100; `forward box1` draws a line 100 long. The Output box shows 60, 60, 100. The three rules: a variable holds one value, storing replaces it, looking does not change it. The house program (`lesson-box-house`) stores 80 and uses `box1` in three `forward` blocks (the walls, the climb to the roof, the roof). Changing the 80 to 120 makes every side 120, and to 50 makes every side 50, changing one number. In the polygon sample `box1` is used twice: as the `repeat` count (the sides) and in the turn `360 ÷ box1`. Two variables for the Done early: `store in box1` the size, `store in box2` the sides, `repeat box2` with `forward box1` and `right (360 ÷ box2)`.

**Step 7.** Counting box (`lesson-box-trace`) prints 10, 20, 30, 40, 50, 60, 70, 80, so the first lap prints 10 and the last 80. With `box1 + 5` the last lap prints 40. With a `repeat` of 12 and `box1 + 10` the last prints 120. Doubling: starts at 2, three laps print 4, 8, 16, and five laps end at 64 (4, 8, 16, 32, 64). Countdown prints 3, 2, 1 and leaves 0 in the box. Starting at 5 with 3 laps prints 5, 4, 3 and leaves 2; with 5 laps it prints 5, 4, 3, 2, 1. The `store in box1` that makes the box bigger must be inside the `repeat`. A spiral with a turn of 120 makes a triangle spiral and 60 a hexagon spiral. The Done early swirl uses `box2` starting at 10, plus 2 each lap, in `right`.

**Step 8.** In `own-block` the sizes are 40, 80 and 120 and the turtle draws 12 lines (3 squares of 4). In the flower (`lesson-own-flower`) `petal` is used 8 times (the `repeat`), each petal is two arcs (16 arcs in all), and the turn is 45 because 8 × 45 = 360. With 6 petals the turn is 60 (6 × 60 = 360). Changing the 120 inside `to petal` to 90 changes all eight petals. A word of the student's own: any block under `to` with a `size` input, used three times with three sizes and a turn or move between them.

**Step 9.** Twelve squares (`lesson-nested-count`): 12 × 4 = 48 `forward` blocks, and the turn is 30 because 12 × 30 = 360. With 6 squares the turn is 60; with 36 squares it is 10. Twelve squares with a turn of 20 do not close: 12 × 20 = 240, two thirds of a circle. Hexagon flower: 6 × 6 = 36 lines. Pentagons: inside `repeat` 5 with a turn of 72, outside `repeat` 5 with a turn of 72 (25 lines). Both repeats at 20 is 20 × 20 = 400 lines. A `set color` inside the outside loop but outside the inside loop changes once per shape, not once per side. Nested squares prints 25, 50, 75, 100, 125, 150, 175, 200: the box grows by 25 each lap, so each square is 25 bigger than the one before.

**Step 10.** `0 255 0` green, `0 0 255` blue, `255 255 0` yellow, `255 255 255` white, `128 128 128` gray, `0 0 0` black on a black screen so the bar vanishes. Orange is about `255 128 0`. The switches are worth 128, 64, 32, 16, 8, 4, 2, 1, which add up to 255. 255 is `1111 1111` (FF), 128 is `1000 0000` (80), 64 is `0100 0000` (40) and 10 is `0000 1010` (0A). `#FFFF00` is yellow and `#00FF00` is green. 8 bits make 2⁸ = 256 numbers. Three lights make 256 × 256 × 256 = 16,777,216 colors (24 bits). In the spinning squares the first square is `7 60 248` (strongest blue) and the last `252 60 3` (strongest red), because red is `box1` and blue is `255 - box1`, and the two always add up to 255.

**Step 11.** Bug 1: the turn is 100 and must be 120 (360 ÷ 3), because 3 × 100 = 300 is not a full turn. Bug 2: box1 holds 100 but the `forward` has the number 50 typed in, so nothing uses the box; plug a `box1` block into the `forward`. Bug 3: `random 1 2 = 3` is never true, so the program always takes the `else` and always turns left, tracing the same small square; change the 3 to a 1 or a 2. Bug 4: `pen up` was used to climb to the roof and `pen down` was never used again, so the roof is walked but not drawn; add `pen down` after the climbing `forward`, before the roof. The four steps: run it, say what you expected, find the difference, change one thing.

**Step 12.** Nothing to check by number. The student page lists five things: a block of their own with an input that is used more than once, a box that changes while the program runs, a loop, at least two colors, and a sticky note with their name. The last page of the PDF shows a Count column that should have at least 1 for Variables, repeat / forever and Blocks you made.

