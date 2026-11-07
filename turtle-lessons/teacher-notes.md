---
layout: lesson
title: "For teachers"
pathway: turtlelessons
permalink: /turtle-lessons/teacher-notes/
label: "TurtleLab Lessons"
source: original
---

The first five steps take students from "the turtle does what I say" to a piece of art that uses a loop, random, and if and else. Steps 6 to 12 add variables (drawn as boxes), blocks of their own (functions), loops inside loops, color as numbers, debugging, and a second capstone. Each step starts from a TurtleLab demo the students change; in most steps the demo is built into the page in a frame, so they never leave the lesson. The student pages never mention a teacher, a class, or grading, so a student can work through them alone. Everything about running them in a classroom is on this page.

Four of the steps end with a PDF made by TurtleLab's PDF button:

- **Step 1** is a small first project, a PDF of the student's initials. It shows you they can plan a drawing and make the turtle do exactly what they say.
- **Step 4** is a practice PDF. It shows you they can use a loop, random, and if and else together before the capstone.
- **Step 5** is the capstone, a piece of random art.
- **Step 12** is the second capstone, a picture that uses a box, a block of the student's own and a loop. The last page of the PDF lists what the program is made of, with a count for each kind of block (variables, loops, blocks they made), which makes it quick to see at a glance.
- **Step 15** is the third capstone, an interactive picture: the program asks a question and uses the answer, and every click on the paper draws something where it was clicked, using a block of the student's own and a loop. The last page of the PDF has a row for `ask / when paper clicked`, which makes the new part quick to check.

Steps 2, 3, 6 to 11, 13 and 14 are practice with no PDF to collect. Every step ends by telling the student to save a PDF to keep their own work.

## The sequence

| Step | What students do |
|---|---|
| [1: Your initials]({{ '/turtle-lessons/step-1-your-initials/' | relative_url }}) | Plan on a grid, then draw their initials with exact moves. Predict where the turtle ends and which way it faces. Draw a frame and count its blocks. |
| [2: Say it once]({{ '/turtle-lessons/step-2-say-it-once/' | relative_url }}) | Meet `repeat` with a square. Find turn = 360 ÷ sides. |
| [3: Let chance draw]({{ '/turtle-lessons/step-3-let-chance-draw/' | relative_url }}) | Use `random` in a loop. Build confetti. |
| [4: Choose a path]({{ '/turtle-lessons/step-4-choose-a-path/' | relative_url }}) | Meet `if` and `else` through a coin flip. Trace a run on paper. Save a practice PDF. |
| [5: Capstone: random art]({{ '/turtle-lessons/step-5-random-art/' | relative_url }}) | Plan and build a piece with all three. There is a one page [planning sheet]({{ '/turtle-lessons/planning-sheet/' | relative_url }}) to print. |
| [6: Variables: boxes that keep a number]({{ '/turtle-lessons/step-6-boxes/' | relative_url }}) | What a variable is, and why TurtleLab draws one as a box. Predict, then watch a slow program change a variable block by block (the real blocks, in a frame), and a house whose size comes from one variable. |
| [7: Boxes that count]({{ '/turtle-lessons/step-7-boxes-that-count/' | relative_url }}) | A variable that updates itself: the `+` block is worked out first, then stored. Watch a box count and print, trace a doubling box on paper, a countdown, a spiral of their own. |
| [8: Teach the turtle a word]({{ '/turtle-lessons/step-8-teach-the-turtle-a-word/' | relative_url }}) | Blocks of their own (functions) with an input. A flower from one petal block; change the word once and every use changes. |
| [9: A loop inside a loop]({{ '/turtle-lessons/step-9-a-loop-inside-a-loop/' | relative_url }}) | Nested `repeat`: the inside draws, the outside repeats and turns. Count the moves (12 × 4). The ring closes when laps × turn = 360. |
| [10: Color is three numbers]({{ '/turtle-lessons/step-10-color-is-three-numbers/' | relative_url }}) | Red, green and blue from 0 to 255. Why 255: eight bits. Binary and hex with the color picker. 256 × 256 × 256 colors. A color made from a box. |
| [11: Find the bug]({{ '/turtle-lessons/step-11-find-the-bug/' | relative_url }}) | Four broken programs to fix, each with a hint and an answer: a triangle that does not close, a box that is never used, an `if` that can never be yes, a pen left up. |
| [12: Capstone 2: boxes and blocks]({{ '/turtle-lessons/step-12-capstone-2/' | relative_url }}) | Plan with three sentences, then build a picture with a box that changes, a block of their own with an input, and a loop. Ends with a PDF. |
| [13: Ask for a number]({{ '/turtle-lessons/step-13-ask-for-a-number/' | relative_url }}) | The `ask` block: a question, a wait, and the answer in box1. Predict what a shape will do for 5, 3, 12 and 0. Why a second answer replaces the first, and how to keep one (store it in another box). Build a square from an answer. |
| [14: Click to draw]({{ '/turtle-lessons/step-14-click-to-draw/' | relative_url }}) | `when paper clicked` with the built in variables `mouseX` and `mouseY`. A program keeps listening after its last block until Stop. Predict where clicks land (the paper is -350 to 350 by -280 to 280), then build a dot painter. |
| [15: Capstone 3: ask and click]({{ '/turtle-lessons/step-15-capstone-3/' | relative_url }}) | Plan with three sentences, then build a picture that asks a question, draws where it is clicked with a block of their own, and uses a loop. Ends with a PDF. |

Students who have not seen loops meet the need for one first (a square that takes eight blocks) and only then get the block. `if` and `else` comes after `random` on purpose: a coin flip is the easiest decision to understand, and students who find conditionals confusing can see one path or the other run, never both.

## Assignment text to paste

Plain paragraphs and lists, so they paste cleanly into Schoology and Google Classroom. Change the wording to suit your class. The student pages never mention points, so the capstone rubric appears only here. Change it to suit your class.

### Assignment: Your initials

Draw your initials with TurtleLab, then save a PDF.

- Work through Step 1: [https://{{ site.print_host }}/turtle-lessons/step-1-your-initials/](https://{{ site.print_host }}/turtle-lessons/step-1-your-initials/)
- Draw your initials so each letter can be read, with no stray lines between the letters.
- Build each letter piece by piece. Do not use the write block.
- Add a sticky note with your name.

Turn in whatever you have 10 minutes before the end of class, even if you are not finished.

Press the PDF button in TurtleLab and attach the PDF to this assignment.

### Assignment: Practice PDF, Choose a path

Work through Steps 2, 3 and 4, then save a practice PDF.

- Start at Step 2: [https://{{ site.print_host }}/turtle-lessons/step-2-say-it-once/](https://{{ site.print_host }}/turtle-lessons/step-2-say-it-once/)
- Step 4 ends with the PDF: [https://{{ site.print_host }}/turtle-lessons/step-4-choose-a-path/](https://{{ site.print_host }}/turtle-lessons/step-4-choose-a-path/)
- Your practice PDF must have: a repeat, a random, an if and else that sets a color, and a sticky note with your name and one sentence saying what your if and else decides.

Turn in whatever you have 10 minutes before the end of class, even if you are not finished.

Press the PDF button in TurtleLab and attach the PDF to this assignment.

### Assignment: Capstone, random art

Make a piece of art in TurtleLab that uses a loop, random, and if and else, then save a PDF.

- Do Step 5: [https://{{ site.print_host }}/turtle-lessons/step-5-random-art/](https://{{ site.print_host }}/turtle-lessons/step-5-random-art/)
- Build in a fresh TurtleLab tab, not a sample tab. A sample tab does not save your work.

Rubric, 10 points:

- A repeat that draws part of the picture: 2
- Random that you can see in the picture: 2
- An if with an else that changes something you can see: 2
- At least two colors: 1
- A sticky note with your name and what your loop, your random, and your if and else each do: 2
- PDF attached: 1

Turn in whatever you have 10 minutes before the end of class, even if you are not finished.

Press the PDF button in TurtleLab and attach the PDF to this assignment.

### Assignment: Capstone 2, boxes and blocks

Make a picture in TurtleLab that uses a box, a block of your own and a loop, then save a PDF.

- Do Step 12: [https://{{ site.print_host }}/turtle-lessons/step-12-capstone-2/](https://{{ site.print_host }}/turtle-lessons/step-12-capstone-2/)
- Build in a fresh TurtleLab tab. The demos inside the lessons do not save your work.
- Your picture needs: a block of your own with an input that your program uses more than once, a box that changes while the program runs, a loop, at least two colors, and a sticky note with your name and what your box, your block and your loop each do.

(The student page lists these same five things for students to check. A rubric is yours to write. The last page of the PDF has a Count column for variables, loops and blocks they made, which you can use to check the first three quickly.)

Turn in whatever you have 10 minutes before the end of class, even if you are not finished.

Press the PDF button in TurtleLab and attach the PDF to this assignment.

### Assignment: Capstone 3, ask and click

Make a picture in TurtleLab that asks a question and draws where you click, then save a PDF.

- Do Step 15: [https://{{ site.print_host }}/turtle-lessons/step-15-capstone-3/](https://{{ site.print_host }}/turtle-lessons/step-15-capstone-3/)
- Build in a fresh TurtleLab tab. The demos inside the lessons do not save your work.
- Your picture needs: an ask block whose answer your program uses, a when paper clicked that draws where you click using mouseX and mouseY, a block of your own with an input that your program uses more than once, a loop, at least two colors, and a sticky note with your name and what your question, your click and your block each do.
- Before you press the PDF button: press Run, answer the question, and click the paper a few times, so the picture is on the paper.

(The student page lists these same six things for students to check. A rubric is yours to write; ask and I will draft one. The last page of the PDF has a row called ask / when paper clicked whose Count should be at least 2, one for the ask block and one for the click handler.)

Turn in whatever you have 10 minutes before the end of class, even if you are not finished.

Press the PDF button in TurtleLab and attach the PDF to this assignment.

## Substitute day

- **Skip Step 1.**
- Students work through Steps 2, 3 and 4, about 10 minutes each, then start Step 5.
- Students turn in a PDF of whatever they have 10 minutes before the end of class, finished or not. Students who are not finished can keep going next class if you let them. The capstone is due at the end of the next class.
- The substitute does not need to know how to code, and does not need to check anything. Each step tells students how to check their own work.
- Optionally, print the Step 5 [planning sheet]({{ '/turtle-lessons/planning-sheet/' | relative_url }}) for students who like to sketch on paper. It is one US Letter page.
- **Frames and sample tabs do not save.** Steps 2, 3 and 4 show their samples in frames inside the page, and a frame has no PDF button (students use **Open full size** under it, which opens the sample in a tab of its own, and press the PDF button there). If students build their own work in a frame or a sample tab, a refresh puts the sample back and loses it. Remind them to build the confetti and the capstone in a fresh tab at [https://{{ site.print_host }}/turtlelab/](https://{{ site.print_host }}/turtlelab/), or to press Ctrl+S now and then.

### If students get stuck

- The Guide link at the top of TurtleLab explains every button. Pressing and holding a block shows a tip.
- Blocks disappeared? Press Undo (the curved arrow, or Ctrl+Z).
- Program will not stop? The Stop button always works.
- A red outline means that block has a problem. The message is under the drawing.
- Cannot find the saved PDF? It is in the Downloads folder.
- Students can ask a neighbor for a hint, then keep their own work on their own screen.

## The write block

TurtleLab has a **write** block (Notes palette, next to the sticky note) that draws words in a single line, in one of seven fonts. It can draw letters for a student, so the student pages for Step 1 (initials) and Step 5 (capstone) tell students to skip it. It is not in the Pen or Turtle palettes on purpose. If you want it off the table for an assignment, add this line to the assignment text:

> Do not use the write block in this assignment. The letters and the picture have to come from your own blocks.

It is fine, and fun, for names on a finished picture and for the embroidery samples.

## The Logo box

TurtleLab has a **Logo** button (the letters fd) that shows the blocks as Logo, the language the turtle was made for. A student can type in that box and press Run Logo to draw what they wrote, with either `forward` or `fd`. Two things to know when you grade. What a student types there is not saved anywhere, and it is not in the PDF. The PDF has the blocks and the drawing that is on the paper, so a drawing made by typing Logo will not match the blocks beside it. If you want the blocks, tell students to build the assignment with blocks. The Logo box is good for exploring, and for students who already know a text language.

It also has an **Open in real Logo** button, which is mostly for you when you teach: it opens the program (the blocks, or the Logo a student typed) in [JSLogo]({{ '/logo/' | relative_url }}), a real Logo interpreter kept on this site, in a new tab, where it runs at once. Project that tab to show the same program as blocks, as TurtleLab's Logo, and as real Logo. The program is translated for JSLogo, because the two Logos differ a little (arcs, colors, and what happens on a clean), and anything JSLogo cannot do is left out with a note at the top. Nothing is sent to another website, and JSLogo keeps nothing between visits.

## What is in the PDF

The PDF button saves a PDF with the blocks and sticky notes, laid out the way they are on the student's screen, and the drawing with the turtle drawn where it stopped (so you can see which way it was facing) and a grid of x and y numbers on it (so you can check where each line is). A small program has the blocks above the drawing on one page. A thin, taller program has the blocks down the left of the page with the drawing beside them. A wide or very long program has the blocks on page 1 and the drawing, bigger, on page 2. All so the writing in the blocks stays readable. A picture of the drawing with the blocks inside it is attached to the PDF. Open it in TurtleLab (press Open, or drag the PDF onto the page) and the student's blocks come back, so you can run their program. A sticky note holds about 300 letters. The PDF button zooms the drawing to fit first, so a drawing that ran off the edge of the paper is all there.

Samples never read or write what a student saved. That is on purpose, so a sample can never wipe out someone's saved work.
