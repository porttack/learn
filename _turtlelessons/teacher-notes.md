---
layout: lesson
title: "For teachers and substitutes"
pathway: turtlelessons
order: 91
label: "For teachers"
source: original
companion: true
---

These five steps take students from "the turtle does what I say" to a piece of art that uses a loop, random and if and else. Each step starts from a TurtleLab sample the students change, then asks them to take it further. Nothing needs to be taught at the front of the room, so a substitute can run it.

## The sequence

| Step | What students do | Time |
|---|---|---|
| [1: Your initials]({{ '/turtle-lessons/step-1-your-initials/' | relative_url }}) | Plan on a grid, then draw their initials with exact moves. Predict where the turtle ends and which way it faces. | 50 min |
| [2: Say it once]({{ '/turtle-lessons/step-2-say-it-once/' | relative_url }}) | Meet `repeat` by shrinking their own frame. Find turn = 360 ÷ sides. | 50 min |
| [3: Let chance draw]({{ '/turtle-lessons/step-3-let-chance-draw/' | relative_url }}) | Use `random` in a loop. Confetti challenge. | 40 min |
| [4: Choose a path]({{ '/turtle-lessons/step-4-choose-a-path/' | relative_url }}) | Meet `if` and `else` through a coin flip. Trace a run on paper. | 45 min |
| [5: Project: random art]({{ '/turtle-lessons/step-5-random-art/' | relative_url }}) | Plan, build and hand in a piece with all three. | 70 min |

Students have not seen loops before Step 2, so the sequence builds the need for a loop first (the frame that takes eight blocks) and only then gives them the block. `if` and `else` comes after `random` on purpose: a coin flip is the easiest decision to understand, and students who find conditionals confusing can see one path or the other run, never both.

## What to print

Print the [Activity sheet]({{ '/turtle-lessons/activity-sheet/' | relative_url }}) once per student, double sided. It covers all five steps, so students keep it. The lesson pages are read on screen.

## Substitute plan: two hours, Steps 1 and 2

Students work on their own on Chromebooks. The substitute does not need to know how to code.

| Time | What happens |
|---|---|
| First 10 minutes | Take attendance. Hand out the activity sheet. Put `learn.porttack.com/turtle-lessons` on the board. Students open Step 1. |
| Next 50 minutes | Step 1. Students open TurtleLab in a fresh tab, build the L, sketch their initials on the grid, and **get the plan initialed by the substitute before building.** Any honest plan counts. Then they build and save a PDF. |
| Next 50 minutes | Step 2. Samples, the shapes table, then the challenge of replacing their frame with `repeat`. |
| Last 10 minutes | Students upload their PDF to the Schoology assignment (write its name on the board). Collect every activity sheet, finished or not. |

Students who finish early do the challenges at the end of each step, or start Step 3. Anyone fully done can open any sample from the [Samples page]({{ '/turtlelab/samples.html' | relative_url }}) and change it.

### If students get stuck

- The Guide link at the top of TurtleLab explains every button. Pressing and holding a block shows a tip.
- Blocks disappeared? Press Undo (the curved arrow, or Ctrl+Z).
- Program will not stop? The Stop button always works.
- A refresh keeps blocks in a normal TurtleLab tab. It does **not** in a sample tab, which never saves anything. If students build their own work in a sample tab, tell them to press Ctrl+S now and then, or to open a fresh tab at `learn.porttack.com/turtlelab`.
- A red outline means that block has a problem. The message is under the drawing.
- Cannot find the saved PDF? It is in the Downloads folder. In the upload window, choose Downloads.
- Students can ask a neighbor for a hint, then keep their own work on their own screen.

## Why these choices

- **The PDF is the hand-in.** It shows the blocks and the drawing on one page, and the turtle is drawn where it stopped, so you can check which way it faces. The picture attached to it has the blocks inside, so you can open it in TurtleLab to run it.
- **Samples do not save.** A sample tab never reads or writes what a student saved (so a sample can never wipe someone's work). That is why each step says to keep real work in a fresh tab.
- **If and else is last, and tiny.** It is a coin flip with two outcomes. The `else` path only runs when the first does not.

<section class="answer-key">
<h2>Answer key</h2>

**Step 1.** The L starts at (-150, 60) facing down (heading 180). It ends at (-90, -60), facing right (heading 90).

**Step 2.** Shapes table (sides, repeat, right): triangle 3, 3, 120. Pentagon 5, 5, 72. Hexagon 6, 6, 60. Octagon 8, 8, 45. 12 sides: 12, 12, 30. The turns of a closed shape add up to 360 because the turtle has to make one full turn to face the way it started. Dotted circle: 36 × 10 = 360. With 72 repeats the turn is 5. A frame takes 8 blocks the long way (four `forward` and four `right`) and 3 with `repeat` (the `repeat`, one `forward`, one `right`), so it saves 5. A five-point star turns 144 each time (720 ÷ 5).

**Step 3.** The second picture does not match the first (the colors are random). Smallest 0, largest 255. 50 × 7.2 = 360, a full circle. With 100 rays the turn is 3.6. Two runs of the confetti do not match, because the places and colors are random.

**Step 4.** When the number is 1 the turtle turns right (90). In the `else` it turns left (90). It cannot do both and cannot do neither. Three runs differ, because `random` flips differently each time. Trace headings after each flip: 90, 180, 90, 180, 90, 0. The unfair coin: `random 1 4 = 1` (or `random 1 4 < 2`) in the pointed slot, with right in the top mouth.

**Project.** Ten points: plan initialed 1, a `repeat` 2, visible `random` 2, an `if` with `else` that changes something visible 2, two colors 1, sticky note 1, PDF 1.
</section>
