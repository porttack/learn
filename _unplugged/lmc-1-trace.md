---
title: "Little Man Computer: tracing a program"
source: original
level: hs
kind: [single, supplementary]
topics: [Computer architecture]
time: 20
grouping: Solo
materials: "Pencil"
generator: /unplugged/lmc-generator/
scripts: [/assets/js/unplugged/lmc-page.js]
---

Every computer, from a phone to a supercomputer, runs the same basic loop: read one instruction, do exactly what it says, move to the next one. The Little Man Computer (LMC) is a paper model of that loop, invented by Stuart Madnick in 1965, small enough to trace with a pencil. If you can trace one of these programs by hand, you understand what a processor actually does.

## Meet the model

Picture a little man sitting in a room of 100 numbered mailboxes, each holding one three-digit number. He keeps one number in his hand at a time, the accumulator, along with a calculator that can only add and subtract. He works through a numbered list of instructions one at a time, reading a number from the input tray, doing arithmetic with a mailbox, or sending a number out to the output tray, until an instruction tells him to stop.

<figure class="lmc-diagram-fig">
  <svg class="lmc-diagram" viewBox="0 0 640 260" role="img" aria-label="Diagram of the Little Man Computer: an input tray and output tray connect to the accumulator, which connects to the 100 mailboxes; a program counter sits next to the mailboxes.">
    <defs>
      <marker id="lmc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#111"></path>
      </marker>
    </defs>

    <rect x="20" y="20" width="160" height="55" fill="#fff" stroke="#111" stroke-width="1.5"></rect>
    <text x="100" y="42" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">INPUT TRAY</text>
    <text x="100" y="60" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif">numbers waiting to go in</text>

    <rect x="460" y="20" width="160" height="55" fill="#fff" stroke="#111" stroke-width="1.5"></rect>
    <text x="540" y="42" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">OUTPUT TRAY</text>
    <text x="540" y="60" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif">numbers already sent out</text>

    <rect x="230" y="100" width="180" height="60" fill="#eee" stroke="#111" stroke-width="1.5"></rect>
    <text x="320" y="125" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">ACCUMULATOR</text>
    <text x="320" y="143" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif">the one number he's holding</text>

    <rect x="20" y="190" width="120" height="55" fill="#fff" stroke="#111" stroke-width="1.5"></rect>
    <text x="80" y="212" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui, sans-serif">PROGRAM</text>
    <text x="80" y="227" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui, sans-serif">COUNTER</text>
    <text x="80" y="241" text-anchor="middle" font-size="10.5" font-family="system-ui, sans-serif">points to the next mailbox</text>

    <rect x="150" y="190" width="470" height="55" fill="#fff" stroke="#111" stroke-width="1.5"></rect>
    <text x="385" y="212" text-anchor="middle" font-size="14" font-weight="700" font-family="system-ui, sans-serif">100 MAILBOXES (00-99)</text>
    <text x="385" y="230" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif">one 3-digit number in each box, code or data</text>

    <line x1="170" y1="75" x2="262" y2="99" stroke="#111" stroke-width="1.5" marker-end="url(#lmc-arrow)"></line>
    <text x="175" y="90" font-size="12" font-family="system-ui, sans-serif">INP</text>

    <line x1="378" y1="99" x2="475" y2="75" stroke="#111" stroke-width="1.5" marker-end="url(#lmc-arrow)"></line>
    <text x="430" y="82" font-size="12" font-family="system-ui, sans-serif">OUT</text>

    <line x1="320" y1="160" x2="320" y2="189" stroke="#111" stroke-width="1.5" marker-start="url(#lmc-arrow)" marker-end="url(#lmc-arrow)"></line>
    <text x="335" y="179" font-size="11" font-family="system-ui, sans-serif">LDA &middot; STA &middot; ADD &middot; SUB</text>
  </svg>
  <figcaption>How the pieces connect: numbers come in through the input tray, the accumulator does the arithmetic with the mailboxes, and results leave through the output tray.</figcaption>
</figure>

## The instructions

Every instruction is a 3-digit number: the first digit says what to do, the last two say which mailbox to do it to. `INP`, `OUT`, and `HLT` don't need a mailbox, so they use fixed codes instead.

<table class="checkoff lmc-instructions">
  <colgroup><col style="width: 18%"><col style="width: 18%"><col style="width: 64%"></colgroup>
  <thead><tr><th>Code</th><th>Mnemonic</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>1xx</td><td>ADD</td><td>Add the mailbox to the accumulator.</td></tr>
    <tr><td>2xx</td><td>SUB</td><td>Subtract the mailbox from the accumulator.</td></tr>
    <tr><td>3xx</td><td>STA</td><td>Store the accumulator into the mailbox.</td></tr>
    <tr><td>5xx</td><td>LDA</td><td>Load the mailbox into the accumulator.</td></tr>
    <tr><td>6xx</td><td>BRA</td><td>Branch (jump) to that instruction, always.</td></tr>
    <tr><td>7xx</td><td>BRZ</td><td>Branch there, but only if the accumulator is exactly zero.</td></tr>
    <tr><td>8xx</td><td>BRP</td><td>Branch there, but only if the accumulator is zero or positive.</td></tr>
    <tr><td>901</td><td>INP</td><td>Take the next number from the input tray.</td></tr>
    <tr><td>902</td><td>OUT</td><td>Send the accumulator to the output tray.</td></tr>
    <tr><td>000</td><td>HLT</td><td>Stop. The program is over.</td></tr>
    <tr><td>&mdash;</td><td>DAT</td><td>Not an instruction. Just a number sitting in its own mailbox.</td></tr>
  </tbody>
</table>

This sheet only uses straight-line programs: no `BRA`, `BRZ`, or `BRP` yet. The little man just works down the list, one line at a time, until `HLT`. Branches are their own idea, on the next sheet.

<noscript><p class="callout warning">This worksheet draws its listing and trace tables with JavaScript. Turn JavaScript on to see them.</p></noscript>

## Worked example

Here's a program that takes two numbers from the input tray, adds them, and outputs the total. The number in front of each line is its address, which mailbox it lives in, counting from 00. The trace table below it is filled in already: study it before you try one yourself.

<div id="lmc-worked-1"></div>
<script type="application/json" data-lmc-worked data-root="#lmc-worked-1">{{ site.data.unplugged.lmc_1.worked | jsonify }}</script>

## Now you trace it

For each program below: start at address 00, follow the program counter one instruction at a time, and fill in every row, in order, exactly the way the worked example did it. The table always has exactly as many rows as the program takes steps, so if you run out of rows, check your last few answers.

<div id="lmc-practice-1"></div>
<script type="application/json" data-lmc-practice data-root="#lmc-practice-1">{{ site.data.unplugged.lmc_1.practice | jsonify }}</script>

Want more practice? [Make a new set of LMC programs]({{ '/unplugged/lmc-generator/' | relative_url }}).

<section class="answer-key" id="lmc-key-1"></section>
<script type="application/json" data-lmc-practice-key data-root="#lmc-key-1">{{ site.data.unplugged.lmc_1.practice | jsonify }}</script>
