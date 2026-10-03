---
layout: lesson
title: "Project 1.1 Wiring Three LEDs"
pathway: pico
order: 100.1
label: "Project 1.1 Companion"
source: original
companion: true
---

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Period: <span class="fill-line short"></span>
  Date: <span class="fill-line short"></span>
</p>

## Sign-off

Fill this in once your circuit is built. It's kept at the top so your teacher can find it quickly.

<table class="checkoff">
  <thead>
    <tr><th>Check</th><th>Neighbor</th><th>Teacher</th></tr>
  </thead>
  <tbody>
    <tr><td>LED circuit matches exemplar 1</td><td class="checkbox-cell"></td><td class="checkbox-cell"></td></tr>
  </tbody>
</table>

*Fill this out as you build [Project 1.1: Wiring Three LEDs](/pico/project1-1-wiring-three-leds/). Check off each stage as you finish it. You can write your answers in your own words: you do not need full sentences.*

<aside class="callout warning" markdown="1">
**DO NOT CONNECT TO USB TODAY**

Leave your Pico unplugged for this entire lesson. Your circuit gets connected to USB for the first time only after a teacher has checked it, not before.
</aside>

<figure id="fig-interlude-b-pico-reference">
  <img src="{{ '/assets/img/pico/interlude-b-pico-reference.jpg' | relative_url }}" alt="A Raspberry Pi Pico 2 W seated in a breadboard, USB end at the bottom">
  <figcaption>Your Pico 2 W, seated in the breadboard</figcaption>
</figure>

## Stage 1: Power and Wire Color

<ol class="checkoff-questions">
  <li>
    What color wire carries 3V3 power? What color carries ground? What color carries a GPIO signal?
    <p class="fill-line"></p>
  </li>
  <li>
    Which physical pin feeds your power rail? Which feeds your main ground rail?
    <p class="fill-line"></p>
  </li>
  <li>
    Which physical pin feeds your spare ground rail?
    <p class="fill-line short"></p>
  </li>
</ol>

## Stage 2: The LED Circuit

<figure id="fig-interlude-b-exemplar-1">
  <img src="{{ '/assets/img/pico/interlude-b-exemplar-1.jpg' | relative_url }}" alt="Exemplar 1: a Pico 2 W seated in a breadboard with power and ground wires run to a rail, and three red LEDs each paired with a resistor">
  <figcaption>Exemplar 1: the finished LED circuit</figcaption>
</figure>

Fill in the physical pin number and GPIO name you used for each LED.

<table class="checkoff vocab-table with-pins">
  <thead>
    <tr><th>LED</th><th>Pin #</th><th>GPIO name</th></tr>
  </thead>
  <tbody>
    <tr><td>LED 1</td><td></td><td></td></tr>
    <tr><td>LED 2</td><td></td><td></td></tr>
    <tr><td>LED 3</td><td></td><td></td></tr>
  </tbody>
</table>

<ol class="checkoff-questions">
  <li>
    You trimmed your LEDs' legs for neatness, so leg length no longer tells you which lead is which. Name the two things on the LED itself you can check instead.
    <p class="fill-line"></p>
    <p class="fill-line"></p>
  </li>
</ol>

## Wrap-up: Notice and Wonder

<ol class="checkoff-questions">
  <li>
    Notice: write 2 things you noticed while building today.
    <p class="fill-line"></p>
    <p class="fill-line"></p>
  </li>
  <li>
    Wonder: write 2 questions you have.
    <p class="fill-line"></p>
    <p class="fill-line"></p>
  </li>
</ol>

## Workmanship Rubric

This is the baseline every circuit is expected to meet, not a scale for who tried hardest. Going beyond this is its own reward, separate from this grade.

<table class="checkoff no-split-table">
  <thead>
    <tr><th>Criterion</th><th>Possible</th><th>Earned</th></tr>
  </thead>
  <tbody>
    <tr><td>Passed sign-off within the first or second check</td><td>1</td><td></td></tr>
    <tr><td>Power rail wired correctly (pin 36)</td><td>1</td><td></td></tr>
    <tr><td>Main ground rail wired correctly (pin 38)</td><td>1</td><td></td></tr>
    <tr><td>Spare ground rail wired correctly (pin 18)</td><td>1</td><td></td></tr>
    <tr><td>All 3 LEDs present and connected</td><td>1</td><td></td></tr>
    <tr><td>LEDs wired with correct polarity</td><td>1</td><td></td></tr>
    <tr><td>LEDs connected to the correct GPIO pins</td><td>1</td><td></td></tr>
    <tr><td>LED legs trimmed short and neat</td><td>1</td><td></td></tr>
    <tr><td>Resistor leads trimmed short and neat</td><td>1</td><td></td></tr>
    <tr><td>Wires lie flat: no more than 2mm above the breadboard</td><td>1</td><td></td></tr>
    <tr><td>Correct wire color used throughout (red, green, white)</td><td>1</td><td></td></tr>
    <tr><td>Pico fully and correctly seated in the breadboard</td><td>1</td><td></td></tr>
    <tr><td><strong>Total</strong></td><td><strong>12</strong></td><td></td></tr>
  </tbody>
</table>
