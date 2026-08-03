---
title: "Card 4.1: The Terminal and SSH"
order: 30
source: original
unit: "4. Software"
---

**Format:** Hands-on scavenger hunt | **Time:** 40 min | **Prerequisites:** None; first rung of the software ladder

## Core Question
The robot's computer has no screen, no mouse, and lives inside a sealed tube underwater. The terminal is how we reach it. Can you get in, look around, and run something?

## Resource (~10 min)
Live demo of the eight commands that cover 90% of robot work: ssh, ls, cd, pwd, cat, cp, mkdir, python3. Plus the two lifesavers: tab completion and up-arrow history. Watch once; then it is your turn.

## Activity: Scavenger Hunt
SSH into the studio Pi (address and credentials on the board). A trail of clues is hidden in the filesystem: a README points to a directory, which contains a file whose contents name another path, ending at a script. Run the script; it prints a code phrase. Write the code phrase and the full path where you found it. Rules: no GUI, no file manager, terminal only.

## Clearing This Card
The code phrase plus a 90-second live check: the teacher names a file somewhere on the Pi; navigate to it and display its contents, narrating each command as you go. Fluency, not memorization; tab completion is encouraged, not cheating.

## If You Miss This Class
The hunt stays live on the Pi all season. Do it during studio time; same live check.

## Why This Matters
Every pool day involves someone SSHing into a vehicle to check, fix, or launch code. After this card, that someone can be you. This is also rung one of the Python ladder; nothing above it works without it.
