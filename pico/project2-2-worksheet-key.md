---
layout: minimal
title: "Project 2.2 worksheet answer key"
permalink: /pico/project2-2-worksheet-key/
sitemap: false
---

# Project 2.2 worksheet answer key

For the [Project 2.2 worksheet](/pico/project2-2-worksheet/).

**A. Wiring.** Outer leg 1 to 3V3 (OUT), physical pin 36. Outer leg 2 to any GND pin; the course wiring uses pin 38 (the other GND pins are 3, 8, 13, 18, 23, 28 and 33). The wiper goes to GP26, physical pin 31.

**B. Measurements.** Answers vary. The Pico volts should track the multimeter within a few hundredths of a volt. A larger gap at the top of the knob points to a 3V3 rail that is below 3.3 (the code assumes exactly 3.3).

**C. The voltage divider on paper.** At the ground end R_bottom is 0, so V_wiper is **0 V**. In the middle, R_bottom is half of R_total, so V_wiper is half of 3.3, about **1.65 V** (accept 1.6 or 1.7). At the 3V3 end R_bottom equals R_total, so V_wiper is the full **3.3 V**. With a 1k pot instead of a 10k, the current through the pot gets **bigger** (ten times bigger, since I = 3.3 / R_total) but V_wiper **does not change**, because it depends only on the fraction R_bottom / R_total.

**D. Lists on paper.** The list has 8 elements, so `len(samples)` is **8**. `samples[0]` is **31200** and `samples[7]` is **31270**. The spread is 31650 - 30980 = **670**. The average is about **31300**: accept any answer from roughly 31000 to 31600, since all the numbers sit close together (the exact value is 31307, because the sum is 250460 and `//` drops the .5). `samples[8]` raises an **IndexError**: the valid indexes are 0 to 7, so there is no index 8.

**E. Their own data.** Answers vary: eight different numbers close together, and a spread above 0. The spread they write should equal the biggest number in their list minus the smallest.

**F. Reflection.** Every single reading is a little different because of electrical noise (the spread). The program puts 8 readings in a list and averages the elements, so the result is closer to the true voltage than any one reading. Look for the word *list* used correctly.
