---
layout: lesson
title: "Chapter 4 Notes Page"
pathway: pico
order: 4.1
label: "Chapter 4 Companion"
source: original
companion: true
---

*Fill this out as you read [Chapter 4, Physical computing with Raspberry Pi Pico](/pico/04-physical-computing-with-pico/). You can write your answers in your own words: you do not need full sentences.*

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Period: <span class="fill-line short"></span>
  Date: <span class="fill-line short"></span>
</p>

## Part 1: Hello, LED!

### Vocabulary

<table class="checkoff vocab-table">
  <thead>
    <tr><th>Word</th><th>What it means</th></tr>
  </thead>
  <tbody>
    <tr><td><code>machine</code> library</td><td></td></tr>
    <tr><td><code>Pin</code></td><td></td></tr>
    <tr><td><code>OUT</code></td><td></td></tr>
    <tr><td><code>.value()</code></td><td></td></tr>
    <tr><td><code>.toggle()</code></td><td></td></tr>
  </tbody>
</table>

### Careful reading

<ol class="checkoff-questions">
  <li>
    The on-board LED can't be wired to external hardware. What's the special name you use instead of a pin number to control it?
    <p class="fill-line"></p>
  </li>
  <li>
    You ran a program with <code>led_onboard.value(1)</code> and never saw the LED light up, even though it did turn on. Why couldn't you see it?
    <p class="fill-line"></p>
  </li>
  <li>
    What's the difference between writing <code>led_onboard.value(1)</code> then <code>led_onboard.value(0)</code>, versus just calling <code>led_onboard.toggle()</code> inside a loop?
    <p class="fill-line"></p>
  </li>
</ol>

## Part 2: Using a Breadboard

<ol class="checkoff-questions">
  <li>
    Holes in the same numbered column (like A1 and B1) are connected by a hidden metal strip called a <span class="fill-line short"></span>.
  </li>
  <li>
    What are the power rails along the top and bottom of a breadboard used for?
    <p class="fill-line"></p>
  </li>
  <li>
    Why does the chapter warn you to never cram two component leads into the same hole?
    <p class="fill-line"></p>
  </li>
</ol>

## Part 3: Wiring an External LED

### Vocabulary

<table class="checkoff vocab-table">
  <thead>
    <tr><th>Word</th><th>What it means</th></tr>
  </thead>
  <tbody>
    <tr><td>Anode</td><td></td></tr>
    <tr><td>Cathode</td><td></td></tr>
    <tr><td>Current-limiting resistor</td><td></td></tr>
  </tbody>
</table>

<ol class="checkoff-questions">
  <li>
    Which lead of the LED, the longer or the shorter one, is the anode?
    <p class="fill-line"></p>
  </li>
  <li>
    What could happen to the LED, or even to your Pico, if you connected the LED without a current-limiting resistor?
    <p class="fill-line"></p>
  </li>
</ol>

Draw the path current takes through this circuit, starting at the GPIO pin. Label each part: GPIO pin, resistor, anode, LED, cathode, ground.

<div class="draw-box" style="height: 10em;"></div>

## Part 4: Reading a Button

### Vocabulary

<table class="checkoff vocab-table">
  <thead>
    <tr><th>Word</th><th>What it means</th></tr>
  </thead>
  <tbody>
    <tr><td>Pull-up resistor</td><td></td></tr>
    <tr><td>Pull-down resistor</td><td></td></tr>
    <tr><td>Floating input</td><td></td></tr>
  </tbody>
</table>

<ol class="checkoff-questions">
  <li>
    This chapter's button circuit uses a pull-up resistor. When the button is <em>not</em> pressed, what value does <code>button.value()</code> return?
    <p class="fill-line"></p>
  </li>
  <li>
    You don't have to wire up a separate resistor for the button like you did for the LED. Where is the resistor actually coming from?
    <p class="fill-line"></p>
  </li>
  <li>
    The button-reading loop includes <code>time.sleep(2)</code> after printing a message. What goes wrong if you leave that line out?
    <p class="fill-line"></p>
  </li>
</ol>

## Wrap-up: 3-2-1

<ol class="checkoff-questions">
  <li>
    Write 3 things you learned in this chapter.
    <p class="fill-line"></p>
    <p class="fill-line"></p>
    <p class="fill-line"></p>
  </li>
  <li>
    Write 2 questions you still have.
    <p class="fill-line"></p>
    <p class="fill-line"></p>
  </li>
  <li>
    Write 1 way this chapter connects to something you already know or have seen before.
    <p class="fill-line"></p>
  </li>
</ol>
