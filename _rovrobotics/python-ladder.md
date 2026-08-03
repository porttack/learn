---
title: "The Python Ladder"
order: 5
source: original
---

How the ladder works (from Card 4.2): read the chapter, practice in the Colab notebook (never collected, never graded), then build the rung's transfer task, a small program in robot context. Clear the rung with a 90-second live demo: run it, then modify it on request. Live modification is the whole check.

Pace: about one rung per week. Ahead is fine. Behind just means climb. Rungs clear during studio time whenever you are ready.

---

## Rung 1: Numbers That Matter (Ch. 1, Programming as a Way of Thinking)

**Core question:** Python is a calculator that never makes arithmetic mistakes. Can you make it compute mission numbers?

**Transfer task:** In the Python interpreter or a script, compute and print, with labels:
- Pressure in kPa at 2.5 m and at 4 m (from Card 1.2: depth times 9.81, plus 101 for absolute)
- Power in watts of one thruster at 12 V drawing 15 A
- Total power of six of them

**Live demo modifications to expect:** "Change it to salt water, about 10.06 per meter." "What is the pressure at the bottom of Monterey Canyon, 3600 m?"

---

## Rung 2: The Mission Config (Ch. 2, Variables and Statements)

**Core question:** Numbers with names beat numbers alone. Can you build a script where changing one line changes everything downstream?

**Transfer task:** A script with variables at the top: team_number, tether_length_m, supply_voltage, target_depth_m. Below, compute and print at least two derived values (example: absolute pressure at target depth; total tether copper length, which is round trip, so times 2). Changing a top variable must correctly change the output.

**Live demo modifications:** "Set the tether to 25 m and tell me what changed." "Add a variable for water type and use it in a printed sentence."

---

## Rung 3: The Dive Report (Ch. 3, Functions)

**Core question:** A function is a machine you build once and run forever. Can you build one?

**Transfer task:** Define print_dive_report(pilot, depth_m, duration_s) that prints a formatted three-line report. Call it three times with different arguments in the same script.

**Live demo modifications:** "Add a fourth parameter for the date." "Make it print duration in minutes and seconds instead of raw seconds."

---

## Rung 4: Draw the Mission (Ch. 4, Functions and Interfaces)

**Core question:** The turtle module turns function calls into drawings. Can you design functions whose names and parameters make sense to someone else?

**Transfer task:** Using turtle, write a function square(size) and a function grid(rows, cols, size) that uses it, then draw the pool mission grid. Stretch: a function that draws a descending spiral, which is roughly what a survey pattern looks like from above.

**Live demo modifications:** "Make the grid 3 by 5." "Add a gap between squares using one new parameter."

---

## Rung 5: GO / NO-GO (Ch. 5, Conditionals and Recursion)

**Core question:** Programs that decide are more useful than programs that compute. Can you write launch logic?

**Transfer task:** A script that takes a battery voltage (input() or a variable) and prints a launch decision: below 11.1 V prints NO-GO, 11.1 to 11.8 prints GO WITH CAUTION, above prints GO. Then add a second check (example: tether_connected as True or False) that can veto everything.

**Live demo modifications:** "Add a third condition: NO-GO if voltage is above 13, that means a wrong battery." "Swap the order of your checks; does behavior change and why?"

---

## Rung 6: The Conversion Function (Ch. 6, Return Values)

**Core question:** Printing shows a human; returning hands a value to the next piece of code. Can you write functions the rest of the program can build on?

**Transfer task:** Write kpa_to_depth(kpa_absolute) that returns depth in meters (subtract surface pressure first, from Card 3.7), and fuse_margin(fuse_rating, measured_current) that returns the percentage of headroom left. Include two hand-computed test cases for each, as comments, and show the function passing them.

**Live demo modifications:** "Make kpa_to_depth take an optional salt water flag." "What does your function return at the surface, and is that right?"

---

## Rung 7: The Descent Loop (Ch. 7, Iteration and Search)

**Core question:** Loops let five lines of code do a thousand seconds of work. Can you simulate a dive?

**Transfer task:** A while loop simulating descent: depth starts at 0, increases by 0.1 m per step, prints time and depth each step, and stops when it reaches target_depth_m from your Rung 2 config. Then print the total steps taken. Stretch: make the descent rate slow down as it approaches the target, which is your first taste of Card 3.5's problem.

**Live demo modifications:** "Change the rate to 0.25 m per step; how many steps now?" "Make it stop early if depth ever exceeds 4 m and print a warning."

---

## Rung 8: Parse the Packet (Ch. 8, Strings and Regular Expressions)

**Core question:** The float transmits its data as text. Can you take a packet apart?

**Transfer task:** Given the string packet = "RN34 12:01:33 2.47" (team, time, depth), use string methods to split it and print each field with a label, converting depth to a float and proving it with arithmetic (print the depth doubled). Then handle a second packet with different values using the same code.

**Live demo modifications:** "The packet now has a fourth field, pressure. Adapt." "What does your code do with a malformed packet, and what should it do?"

---

## Rung 9: The Dive Log (Ch. 9, Lists)

**Core question:** A dive is not one depth; it is hundreds. Can you compute with all of them at once?

**Transfer task:** Given a list of depth readings (provided on the class page, or invent 20 values), compute and print: maximum depth, average depth, and hold quality, the count of readings within 0.2 m of the 2.5 m target. That last number is literally how we will judge the float's PID tuning.

**Live demo modifications:** "Tighten the tolerance to 0.1 and rerun." "Add the reading 9.9 to the list; which of your three numbers should make you suspicious and why?"

---

## Rung 10: The Parts Tracker (Ch. 10, Dictionaries)

**Core question:** Lists find things by position; dictionaries find things by name. Can you build the tiny database the supply chain runs on?

**Transfer task:** A dictionary mapping part names to a price, like {"thruster": 89.00, "esc": 24.50, "penetrator": 6.00}. Write code that: looks up one part's price, adds a new part, and computes total cost of an order given a second dictionary of quantities, like {"thruster": 2, "penetrator": 8}. Print an order summary with a line per part and a total.

**Live demo modifications:** "Order a part that is not in the price list; make your code survive it with a useful message." "Add a 10% shipping estimate to the total."

---

## After Rung 10

You can now read most of the float's codebase for real. The ladder continues into applied cards: 4.3 Data Logging (files come a few chapters later in the book, but the rungs carry you), 4.4 Plotting, and 4.5 State Machines, where your Rung 10 dictionaries come back as the machine's transition table. Software-track students continue into classes and the repository itself.
