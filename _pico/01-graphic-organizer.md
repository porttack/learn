---
layout: lesson
title: "Chapter 1 Graphic Organizer"
pathway: pico
order: 1.1
label: "Chapter 1 Companion"
source: original
companion: true
---

*Fill this out as you read [Chapter 1, Get to know your Raspberry Pi Pico](/pico/01-get-to-know-your-pico/). You can write your answers in your own words: you do not need full sentences.*

<p class="checkoff-fields">
  Name: <span class="fill-line"></span>
  Period: <span class="fill-line short"></span>
  Date: <span class="fill-line short"></span>
</p>

## Part 1: Meet Your Pico

Read the introduction and the guided tour section before answering these.

### Vocabulary

Explain each word in your own words. Use the chapter for help if you get stuck.

<table class="checkoff">
  <thead>
    <tr><th>Word</th><th>What it means</th></tr>
  </thead>
  <tbody>
    <tr><td>Microcontroller</td><td></td></tr>
    <tr><td>Single board computer</td><td></td></tr>
    <tr><td>GPIO pin</td><td></td></tr>
    <tr><td>Integrated circuit (IC)</td><td></td></tr>
  </tbody>
</table>

### Pico vs. Raspberry Pi

The chapter says a Pico is not the same kind of device as a Raspberry Pi.

<ol class="checkoff-questions">
  <li>
    Name one thing a Raspberry Pi can do that a Pico is not really built for.
    <p class="fill-line"></p>
  </li>
  <li>
    Name one job that a Pico is built to do.
    <p class="fill-line"></p>
  </li>
</ol>

### Identify the parts

Look closely at each photo below. Find that part in the chapter, then write what it is called and one thing it does.

<div class="organizer-photo-grid">
  <div class="organizer-photo">
    <img src="{{ '/assets/img/pico/fig-1-1.jpg' | relative_url }}" alt="A part of the Pico board">
    <span class="fill-line"></span>
  </div>
  <div class="organizer-photo">
    <img src="{{ '/assets/img/pico/fig-1-3.jpg' | relative_url }}" alt="A part of the Pico board">
    <span class="fill-line"></span>
  </div>
  <div class="organizer-photo">
    <img src="{{ '/assets/img/pico/fig-1-4.jpg' | relative_url }}" alt="A part of the Pico board">
    <span class="fill-line"></span>
  </div>
  <div class="organizer-photo">
    <img src="{{ '/assets/img/pico/fig-1-5.jpg' | relative_url }}" alt="A part of the Pico board">
    <span class="fill-line"></span>
  </div>
  <div class="organizer-photo">
    <img src="{{ '/assets/img/pico/fig-1-6.jpg' | relative_url }}" alt="A part of the Pico board">
    <span class="fill-line"></span>
  </div>
</div>

## Part 2: Soldering the Headers

This section has real safety warnings in it. Slow down and read them carefully.

### Safety check

<ol class="checkoff-questions">
  <li>
    Why should you never touch the metal part of a soldering iron, even right after you unplug it?
    <p class="fill-line"></p>
  </li>
  <li>
    Solder contains something called flux. Why does the chapter tell you to wash your hands after using it?
    <p class="fill-line"></p>
  </li>
  <li>
    Where should the soldering iron go any time you are not actively using it?
    <p class="fill-line"></p>
  </li>
</ol>

### Vocabulary

<table class="checkoff">
  <thead>
    <tr><th>Word</th><th>What it means</th></tr>
  </thead>
  <tbody>
    <tr><td>Solder</td><td></td></tr>
    <tr><td>Flux</td><td></td></tr>
    <tr><td>Tinning (the iron)</td><td></td></tr>
    <tr><td>Solder bridge</td><td></td></tr>
  </tbody>
</table>

### Put the steps in order

These steps are all mixed up. Read the soldering section, then write a number from 1 to 6 in the first column to show the order they really happen in.

<table class="checkoff">
  <thead>
    <tr><th>Order</th><th>Step</th></tr>
  </thead>
  <tbody>
    <tr><td class="checkbox-cell"></td><td>Melt a small blob of solder onto the tip of the iron (tinning it)</td></tr>
    <tr><td class="checkbox-cell"></td><td>Push the two header strips into the holes on the Pico</td></tr>
    <tr><td class="checkbox-cell"></td><td>Plug in the soldering iron and let the tip heat up</td></tr>
    <tr><td class="checkbox-cell"></td><td>Heat the pin and the pad together, then touch solder to the joint</td></tr>
    <tr><td class="checkbox-cell"></td><td>Check every pin for good joints and for bridges to nearby pins</td></tr>
    <tr><td class="checkbox-cell"></td><td>Wash your hands</td></tr>
  </tbody>
</table>

### Spot the problem

The chapter shows a figure with five labeled examples (A through E) of things that can go wrong when you solder a joint. Find that figure, then match each problem below to its letter and write down the fix.

<table class="checkoff">
  <thead>
    <tr><th>Letter</th><th>What went wrong</th><th>How do you fix it?</th></tr>
  </thead>
  <tbody>
    <tr><td class="checkbox-cell"></td><td>The joint got too hot and the flux burned</td><td></td></tr>
    <tr><td class="checkbox-cell"></td><td>There is way more solder than the joint needs</td><td></td></tr>
    <tr><td class="checkbox-cell"></td><td>Solder touches a nearby pin it should not be touching</td><td></td></tr>
    <tr><td class="checkbox-cell"></td><td>The solder stuck to the pin but not to the pad</td><td></td></tr>
    <tr><td class="checkbox-cell"></td><td>There is not enough solder to fill the joint</td><td></td></tr>
  </tbody>
</table>

### Draw it

Draw what a well soldered joint looks like from the side. Label the pin, the pad, and the solder.

<div class="draw-box"></div>

## Part 3: Installing MicroPython

### Fill in the blanks

<p class="fill-line-paragraph">
To put your Pico into firmware loading mode, you hold down the
<span class="fill-line short"></span> button while plugging in the micro USB
cable. Your Pico then shows up on your computer like a
<span class="fill-line short"></span>. To actually install MicroPython, you
drag a firmware file ending in <span class="fill-line short"></span> onto
that drive.
</p>

### Think about it

<ol class="checkoff-questions">
  <li>
    Why do you only need to install MicroPython once, instead of every time you use the Pico?
    <p class="fill-line"></p>
  </li>
  <li>
    Pico, Pico W, Pico 2, and Pico 2 W each need their own matching firmware file. What do you think would happen if you installed the wrong one?
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
    Write 1 way this chapter connects to something you already know or have used before.
    <p class="fill-line"></p>
  </li>
</ol>
