---
layout: lesson
title: "For teachers"
pathway: turtlelessons
order: 90
label: "For teachers"
source: original
companion: true
---

These five steps take students from "the turtle does what I say" to a piece of art that uses a loop, random, and if and else. Each step starts from a TurtleLab sample the students change, then asks them to take it further. Nothing needs to be taught at the front of the room.

Two of the steps end with a PDF made by TurtleLab's PDF button:

- **Step 1** is a small first project, a PDF of the student's initials. It shows you they can plan a drawing and make the turtle do exactly what they say.
- **Step 5** is the capstone, a piece of random art.

Steps 2 to 4 are practice with no deliverable. A student works through them between the two PDFs.

## The sequence

| Step | What students do |
|---|---|
| [1: Your initials]({{ '/turtle-lessons/step-1-your-initials/' | relative_url }}) | Plan on a grid, then draw their initials with exact moves. Predict where the turtle ends and which way it faces. |
| [2: Say it once]({{ '/turtle-lessons/step-2-say-it-once/' | relative_url }}) | Meet `repeat` by shrinking their own frame. Find turn = 360 ÷ sides. |
| [3: Let chance draw]({{ '/turtle-lessons/step-3-let-chance-draw/' | relative_url }}) | Use `random` in a loop. Confetti challenge. |
| [4: Choose a path]({{ '/turtle-lessons/step-4-choose-a-path/' | relative_url }}) | Meet `if` and `else` through a coin flip. Trace a run on paper. |
| [5: Capstone: random art]({{ '/turtle-lessons/step-5-random-art/' | relative_url }}) | Plan and build a piece with all three. |

Students who have not seen loops before Step 2 meet the need for one first (the frame that takes eight blocks) and only then get the block. `if` and `else` comes after `random` on purpose: a coin flip is the easiest decision to understand, and students who find conditionals confusing can see one path or the other run, never both.

## Assignment text to paste

Plain paragraphs and lists, so they paste cleanly into a course site's editor. Change the wording to suit your class.

### Assignment 1: Your initials

Draw your initials with TurtleLab, then make a PDF.

- Work through Step 1: [https://{{ site.print_host }}/turtle-lessons/step-1-your-initials/](https://{{ site.print_host }}/turtle-lessons/step-1-your-initials/)
- Draw your initials so each letter can be read, with no stray lines between the letters.
- Add a sticky note with your name.
- Press the PDF button in TurtleLab to make your PDF, and attach it to this assignment.

### Assignment 2: Capstone, random art

Make a piece of art in TurtleLab that uses a loop, random, and if and else, then make a PDF.

- Work through Steps 2, 3 and 4 first: [https://{{ site.print_host }}/turtle-lessons/](https://{{ site.print_host }}/turtle-lessons/)
- Then do Step 5: [https://{{ site.print_host }}/turtle-lessons/step-5-random-art/](https://{{ site.print_host }}/turtle-lessons/step-5-random-art/)
- Your capstone must include: a repeat that draws part of your picture, random used somewhere you can see in the picture, an if with an else that changes something you can see, at least two colors, and a sticky note with your name and what your loop, your random and your if and else each do.
- Press the PDF button in TurtleLab to make your PDF, and attach it to this assignment.

The lesson pages list what the capstone must include but give no points. The rubric is yours.

## What is in the PDF

The PDF button saves a one page PDF: the blocks and sticky notes on top, laid out the way they are on the student's screen, and the drawing underneath with the turtle drawn where it stopped (so you can see which way it was facing). A picture of the drawing with the blocks inside it is attached to the PDF. Open it in TurtleLab (press Open, or drag the PDF onto the page) and the student's blocks come back, so you can run their program.

Students keep real work in a normal TurtleLab tab, not a sample tab. A sample tab never saves anything, so a refresh puts the sample back. That is on purpose, so a sample can never wipe out someone's saved work. Each step says so.

## If students get stuck

- The Guide link at the top of TurtleLab explains every button. Pressing and holding a block shows a tip.
- Blocks disappeared? Press Undo (the curved arrow, or Ctrl+Z).
- Program will not stop? The Stop button always works.
- A red outline means that block has a problem. The message is under the drawing.
- Cannot find the saved PDF? It is in the Downloads folder.

<section class="answer-key">
<h2>Answer key</h2>

**Step 1.** The L starts at (-150, 60) facing down (heading 180). It ends at (-90, -60), facing right (heading 90).

**Step 2.** Turns that close each shape (repeat, turn): triangle 3, 120. Pentagon 5, 72. Hexagon 6, 60. Octagon 8, 45. 12 sides: 12, 30. The turns of a closed shape add up to 360 because the turtle has to make one full turn to face the way it started. Dotted circle: 36 × 10 = 360. With 72 repeats the turn is 5. A frame takes 8 blocks the long way (four `forward` and four `right`) and 3 with `repeat` (the `repeat`, one `forward`, one `right`), so it saves 5. A five-point star turns 144 each time (720 ÷ 5).

**Step 3.** The second picture does not match the first (the colors are random). Smallest 0, largest 255. 50 × 7.2 = 360, a full circle. With 100 rays the turn is 3.6. Two runs of the confetti do not match, because the places and colors are random.

**Step 4.** When the number is 1 the turtle turns right (90). In the `else` it turns left (90). It cannot do both and cannot do neither. Three runs differ, because `random` flips differently each time. Trace headings after each flip: 90, 180, 90, 180, 90, 0. The unfair coin: `random 1 4 = 1` (or `random 1 4 < 2`) in the pointed slot, with right in the top mouth.
</section>
