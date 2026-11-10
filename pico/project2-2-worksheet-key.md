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

**C. Lists on paper.** The list has 8 elements, so `len(samples)` is **8**. `samples[0]` is **31200** and `samples[7]` is **31270**. The spread is 31650 - 30980 = **670**. The sum is 250460, and 250460 // 8 is **31307** (the true average is 31307.5; `//` drops the .5). `samples[8]` raises an **IndexError**: the valid indexes are 0 to 7, so there is no index 8.

**D. Their own data.** Answers vary: eight different numbers close together, and a spread above 0. The spread they write should equal the biggest number in their list minus the smallest.

**E. Reflection.** Every single reading is a little different because of electrical noise (the spread). The program puts 8 readings in a list and averages the elements, so the result is closer to the true voltage than any one reading. Look for the word *list* used correctly.
