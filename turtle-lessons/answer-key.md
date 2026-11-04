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
