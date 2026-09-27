---
title: "Little Man Computer: write your own"
source: original
level: hs
kind: [single, supplementary]
topics: [Computer architecture]
time: 25
grouping: Solo
materials: "Pencil"
scripts: [/assets/js/unplugged/lmc-page.js]
---

You've traced the little man's programs on the last two sheets. Now write one yourself. A blank listing form is below each task: one line per mailbox, starting at address 00, same as every program you've traced so far.

## How to fill in a line

1. Write the mnemonic (`INP`, `ADD`, `STA`, and so on) in the **Mnemonic** column.
2. If it needs one, write a label name or a mailbox number in the **Operand** column.
3. If a line has a label of its own (so another line can jump to it), write that label in the **Label** column.
4. Work out the **Machine code**: the mnemonic's 3-digit code, with the operand's mailbox number in the last two digits.
5. Any number your program needs to store, not an instruction, gets its own `DAT` line at the end.

## Task 1: Output the input times 2 (easy)

Take one number from the input tray and output double it. This is the same idea as "Double it" on the tracing sheet, just without the answer already filled in.

<table class="checkoff lmc-listing">
  <colgroup><col style="width: 12%"><col style="width: 18%"><col style="width: 22%"><col style="width: 22%"><col style="width: 26%"></colgroup>
  <thead><tr><th>Address</th><th>Label</th><th>Mnemonic</th><th>Operand</th><th>Machine code</th></tr></thead>
  <tbody>
    <tr><td>00</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>01</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>02</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>03</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>04</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>05</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>06</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

**Test input:** 6. Trace your own program with that input. If the output isn't 12, something's wrong.

## Task 2: Subtract two inputs (medium)

Take two numbers from the input tray, in order, and output the first one minus the second one.

<aside class="callout note" markdown="1">
**PICK A SAFE TEST INPUT**

If the second number is bigger than the first, the accumulator goes negative, exactly like on the branches sheet. Output it anyway and it wraps into a strange 3-digit number instead of a normal answer. To keep this task simple, always test with the first number bigger.
</aside>

<table class="checkoff lmc-listing">
  <colgroup><col style="width: 12%"><col style="width: 18%"><col style="width: 22%"><col style="width: 22%"><col style="width: 26%"></colgroup>
  <thead><tr><th>Address</th><th>Label</th><th>Mnemonic</th><th>Operand</th><th>Machine code</th></tr></thead>
  <tbody>
    <tr><td>00</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>01</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>02</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>03</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>04</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>05</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>06</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>07</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>08</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>09</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

**Test input:** 9, then 4. Trace your own program with those inputs. If the output isn't 5, something's wrong.

## Task 3: Output the numbers from 1 up to the input (harder)

Take one number from the input tray, call it *n*, and output every number from 1 up to *n*, one at a time: if the input is 4, output 1, then 2, then 3, then 4. This needs a loop, so it's the longest program on this sheet. Think back to the countdown loop from the branches sheet, but counting the other way, and stopping once you pass *n* instead of once you hit zero.

<table class="checkoff lmc-listing">
  <colgroup><col style="width: 12%"><col style="width: 18%"><col style="width: 22%"><col style="width: 22%"><col style="width: 26%"></colgroup>
  <thead><tr><th>Address</th><th>Label</th><th>Mnemonic</th><th>Operand</th><th>Machine code</th></tr></thead>
  <tbody>
    <tr><td>00</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>01</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>02</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>03</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>04</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>05</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>06</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>07</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>08</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>09</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>10</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>11</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>12</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>13</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>14</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

**Test input:** 4. Trace your own program with that input. If the outputs aren't 1, 2, 3, 4 in that order, something's wrong.

## Checking your work

Trace your own program by hand, the same way you traced the ones on the last two sheets, using the test input given for each task. If your traced output matches, your program works.

Want a faster check? Type your machine code into a free online LMC simulator, such as [Peter Higginson's LMC simulator](https://peterhigginson.co.uk/lmc/), and run it there instead. That's optional, never required: everything on this sheet works with nothing but the paper and your pencil.

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Rewrite Task 3 to count down from *n* to 1 instead of up. Which lines actually needed to change?
</aside>

<section class="answer-key" id="lmc-key-3"></section>
<script type="application/json" data-lmc-task-key data-root="#lmc-key-3">{{ site.data.unplugged.lmc_3.tasks | jsonify }}</script>
