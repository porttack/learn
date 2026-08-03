---
title: "Card 3.1: PWM"
order: 23
source: original
unit: "3. Control and Actuation"
---

**Format:** Bench + code | **Time:** 40 min | **Prerequisites:** None; feeds 3.2, 3.3, 3.5

## Core Question
Our controllers cannot output "62% power." They can only switch fully on and fully off, very fast. How does flickering become throttle?

## Resource (~10 min)
1. Duty cycle demo: an LED driven by PWM from a Pi or Arduino, swept from 5% to 95%. If a scope or logic analyzer is available, watch the square wave change while the brightness follows.
2. The two numbers that define a PWM signal: frequency (how fast it repeats) and duty cycle (what fraction is on). Servos and ESCs care about pulse WIDTH in microseconds; motors and LEDs care about duty percentage. Same idea, different dialects.

## Activity
1. Wire the LED and write (or modify the provided) code to set duty cycle from keyboard input. Find the duty cycle where the LED first looks "half bright" and compare with a neighbor; discuss why eyes disagree with the math.
2. On paper, sketch the waveform for 25%, 50%, and 75% duty at the same frequency, labeled with on-time and period.

## Clearing This Card
Working demo plus labeled sketches, and a 90-second oral check: "A servo expects pulses between 1000 and 2000 microseconds. What is the pulse width for center, and what happens if we send it a motor-style 50% duty at 1 kHz instead?"

## If You Miss This Class
Bench kit and starter code stay available; same demo, sketches, and check during studio time.

## Why This Matters
PWM is the shared language beneath thrusters, servos, and the claw. Cards 3.2, 3.3, and 3.5 all assume you speak it.
